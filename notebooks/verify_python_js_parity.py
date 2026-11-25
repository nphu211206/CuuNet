"""Generate numerical fixtures using the actual Python campaign/pooling functions.

The fixtures verify implementation agreement, not field realism or general Sybil
security. Prescribed edge geometries replace only the campaign RNG draws.
"""
from __future__ import annotations
import argparse,hashlib,json,sys
from pathlib import Path
from unittest.mock import patch
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src/simulation'))
import sybil_pipeline_campaign as campaign
import dependence_aware_verification as pooling

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def report(i,x=0.,y=0.,reputation=.9,claim=True,age=0.):
    return {'id':f'r{i}','x':float(x),'y':float(y),'reputation':float(reputation),'claim':bool(claim),'age':float(age)}


class ReplayGeometry:
    def __init__(self,reports):
        self.points=np.array([[r['x'],r['y']] for r in reports],dtype=float).reshape(1,len(reports),2)
        self.ages=np.array([[r['age'] for r in reports]],dtype=float)
    def normal(self,loc,scale,size):
        if tuple(size)==self.points.shape:return self.points.copy()
        if tuple(size)==(1,0,2):return np.empty(size)
        raise ValueError(f'Unexpected campaign geometry draw: {size}')
    def uniform(self,low,high,size):
        if tuple(size)==self.ages.shape:return self.ages.copy()
        raise ValueError(f'Unexpected campaign age draw: {size}')


def reference(reports,options):
    config=campaign.Configuration(honest_count=len(reports),bot_count=0,
        epsilon_distance_km=options.get('epsilon',1.),min_samples=options.get('minSamples',3),
        maximum_report_age_hours=options.get('maxAge',6.),terrain_discount=options.get('terrain',False))
    with patch.object(campaign.np.random,'default_rng',return_value=ReplayGeometry(reports)):
        geometry=campaign.prepare_geometry(config,1,0)
    positions=geometry['positions_km'];ages=geometry['ages_hours'];selected=geometry['selected']
    np.testing.assert_array_equal(positions,np.array([[r['x'],r['y']] for r in reports]).reshape(1,len(reports),2))
    policy=pooling.PoolingPolicy(cell_width_km=options.get('cell',.25),time_bin_hours=options.get('timeBin',.5),
        mass_cap=options.get('cap',.95),threshold=options.get('threshold',.75))
    groups,counts=pooling.group_ids(positions,ages,selected,policy)
    claims=np.array([[r['claim'] for r in reports]],dtype=bool)
    masses=np.array([[r['reputation'] for r in reports]],dtype=float)*geometry['discount_factors']
    disaster,no_disaster,uncertainty,_=pooling.pooled_mass(claims,masses,groups,counts,policy)
    return {'disaster':float(disaster[0]),'noDisaster':float(no_disaster[0]),'uncertainty':float(uncertainty[0]),
        'action':int(pooling.decision(disaster,no_disaster,policy.threshold)[0]),'selected':int(selected.sum()),
        'groups':int(counts[0]),'feedback':'frozen'}


def fixtures():
    cases=[]
    def add(name,reports,options=None):
        options=options or {}
        cases.append({'id':name,'reports':reports,'options':options,'expected':reference(reports,options)})
    targets=[
        ('empty',[],{}),('single',[report(0)],{}),('sparse_two',[report(0),report(1,.1)],{}),
        ('positive',[report(i,.1*i,age=.2) for i in range(3)],{}),
        ('negative',[report(i,.1*i,claim=False,age=.2) for i in range(3)],{}),
        ('same_group_conflict',[report(i,claim=i<3) for i in range(6)],{}),
        ('neutral_cold_start',[report(i,.01*i,reputation=.5,age=.25) for i in range(3)],{}),
        ('stale',[report(i,.01*i,age=7) for i in range(5)],{}),
        ('age_boundary',[report(i,.01*i,age=a) for i,a in enumerate([6.,5.999999,6.,6.000001])],{}),
        ('epsilon_boundary',[report(i,.5*i) for i in range(3)],{'epsilon':.5,'minSamples':2}),
        ('epsilon_outside',[report(i,x) for i,x in enumerate([0.,.5,1.000001])],{'epsilon':.5,'minSamples':2}),
        ('cell_time_boundaries',[report(i,x,age=a,claim=i%2==0) for i,(x,a) in enumerate([
            (-.250001,.499999),(-.25,.5),(-.249999,.500001),(0.,.5),(.25,.5),(.250001,.500001)])],{}),
        ('cluster_tie',[report(i,.02*i) for i in range(3)]+[report(i+3,3+.02*i,reputation=.5,claim=False) for i in range(3)],{}),
        ('zero_reputation',[report(i,reputation=0) for i in range(3)],{}),
        ('mass_cap',[report(i,reputation=1) for i in range(3)],{}),
        ('exact_alert_threshold',[report(i,reputation=.75) for i in range(3)],{}),
        ('exact_reject_threshold',[report(i,reputation=.75,claim=False) for i in range(3)],{}),
        ('500_repeated_reports',[report(i,reputation=.99) for i in range(500)],{}),
    ]
    for name,reports,options in targets:
        for terrain in (False,True):add(name+f'_terrain_{int(terrain)}',reports,{**options,'terrain':terrain})
    for bots in (0,1,5,20,50,100):
        for pattern in ('mimic','dispersed','remote_cluster','stale'):
            config=campaign.Configuration(bot_count=bots,pattern=pattern)
            seed=20261123+bots*13+list(('mimic','dispersed','remote_cluster','stale')).index(pattern)
            geometry=campaign.prepare_geometry(config,1,seed)
            for reputation in (.15,.5,.8):
                for active in (False,True):
                    reports=[]
                    for i,(position,age) in enumerate(zip(geometry['positions_km'][0],geometry['ages_hours'][0])):
                        honest=i<5
                        reports.append(report(i,*position,reputation=.95 if honest else reputation,
                            claim=active if honest else not active,age=age))
                    for terrain in (False,True):
                        add(f'{pattern}_bots_{bots}_R_{reputation}_event_{int(active)}_terrain_{int(terrain)}',reports,{'terrain':terrain})
    generator=np.random.default_rng(7001)
    sample=[report(i,*point,reputation=.6 if i%3 else .95,claim=i%3==0,age=float(generator.uniform(0,1)))
            for i,point in enumerate(generator.normal(0,.1,(25,2)))]
    for name,values in {'epsilon':(.5,1.5),'minSamples':(1,4),'maxAge':(.25,12.),'cell':(.1,.5),
                        'timeBin':(.1,1.),'cap':(.8,.99),'threshold':(.55,.9)}.items():
        for value in values:
            for terrain in (False,True):add(f'sensitivity_{name}_{value}_terrain_{int(terrain)}',sample,{name:value,'terrain':terrain})
    stress=[report(i,*point,reputation=.99,claim=i%2==0,age=float(generator.uniform(0,1)))
            for i,point in enumerate(generator.normal(0,.1,(500,2)))]
    add('many_groups_numerical_stress',stress,{'cell':.01,'timeBin':.01,'terrain':True})
    return cases


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output-dir',type=Path,default=ROOT/'analysis/final_revision_20261123/task3')
    args=parser.parse_args();args.output_dir.mkdir(parents=True,exist_ok=True)
    sources=[Path(campaign.__file__),Path(pooling.__file__),ROOT/'src/simulation/sybil_revision_experiments.py']
    source_hashes={path.name:digest(path) for path in sources}
    cases=fixtures()
    if any(digest(path)!=source_hashes[path.name] for path in sources):raise RuntimeError('Python simulation sources changed during fixture generation')
    record={'format':'cuunet-python-js-numerical-fixtures-v1','publication_eligible':False,'absolute_tolerance':1e-9,'relative_tolerance':1e-9,
        'cases':cases,'python_source_sha256':source_hashes,'fixture_generator_sha256':digest(Path(__file__)),
        'scope':'static local-batch numerical parity; frozen feedback; synthetic geometry and terrain; not a new Sybil robustness experiment'}
    path=args.output_dir/'verification_golden_cases.json'
    path.write_text(json.dumps(record,indent=2,allow_nan=False),encoding='utf-8')
    print(json.dumps({'fixtures':len(cases),'output':str(path),'sha256':digest(path)},indent=2))


if __name__=='__main__':main()
