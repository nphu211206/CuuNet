"""Create a small browser import ZIP after the canonical physical forecast audit."""
import argparse,hashlib,json,zipfile
from pathlib import Path

def export(folder,output):
 result=json.loads((folder/'manuscript_results.json').read_text())
 if not result.get('audited') or not result.get('publication_eligible') or result['provenance_class'] not in ('observed','reanalysis'):
  raise ValueError('Require audited physical-target results, not compatibility models')
 files={}; models=[]
 for zone in result['zone_targets']:
  pp=folder/'models'/zone/'preprocessing.json'; case=folder/'tfjs_equivalence_cases'/(zone+'.json')
  c=json.loads(case.read_text()); count=min(64,len(c['inputs']))
  for key in ('dates','inputs','actual_physical','keras_float_scaled_predictions','keras_float_physical_predictions'): c[key]=c[key][:count]
  c['input_shape'][0]=count;c['runtime_subset_rule']='first 64 held-out cases for execution testing, not complete accuracy evaluation'
  case_name='cases/'+zone+'.json';pre_name='preprocessing/'+zone+'.json'
  files[case_name]=json.dumps(c).encode();files[pre_name]=pp.read_bytes()
  for kind,parent in [('FP32','tfjs_models_float'),('uint8 storage','tfjs_models')]:
   directory=folder/parent/zone
   for path in directory.glob('*'):
    if path.is_file(): files[(Path(parent)/zone/path.name).as_posix()]=path.read_bytes()
   models.append({'id':zone+' / '+kind,'model_json':(Path(parent)/zone/'model.json').as_posix(),'case_json':case_name,'preprocessing':pre_name})
 manifest={'format':'cuunet-browser-model-v1','forecast_audit_passed':True,'provenance_class':result['provenance_class'],
           'models':models,'source_run_id':result['run_id'],'files':{name:hashlib.sha256(data).hexdigest() for name,data in files.items()},
           'scope':'retrospective runtime subset; no live feed, device results or field warning validation'}
 output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
  for name,data in files.items(): z.writestr(name,data)
  z.writestr('deployment_bundle_manifest.json',json.dumps(manifest,indent=2))
 return {'output':str(output),'bytes':output.stat().st_size,'models':len(models)}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--forecast-dir',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 print(json.dumps(export(a.forecast_dir,a.output),indent=2))
