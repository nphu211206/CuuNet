"""CPU-only orchestration regressions; actual GPU fits are checked on Kaggle."""
import ast,copy,hashlib,json,os,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import numpy as np
import pandas as pd
import revision_dual_gpu as dual
import dual_gpu_preflight as preflight

ROOT=Path(__file__).resolve().parents[1]


class Process:
    def __init__(self,code=None):self.code=code;self.terminated=False;self.killed=False
    def poll(self):return self.code
    def terminate(self):self.terminated=True;self.code=-15
    def kill(self):self.killed=True;self.code=-9
    def wait(self,timeout=None):return self.code


def ready_fixture(stage,task,manifest):
    stage.mkdir(parents=True,exist_ok=True)
    name=f'{task["model"]}_seed_{task["seed"]}'; model=stage/(name+'.keras')
    model.write_bytes(('mock model '+name).encode())
    history=model.with_suffix('.history.json')
    dual.atomic_json(history,{'zone':manifest['zones'][0]['id'],'model':task['model'],'seed':task['seed'],
        'training_signature':'canonical-test','model_sha256':dual.exp.file_sha256(model),
        'training_configuration':manifest['training'],'history':{'loss':[.1],'val_mae':[.2]}})
    record={'zone':manifest['zones'][0]['id'],'model':task['model'],'seed':task['seed'],
        'training_signature':'canonical-test','model_file':model.name,'history_file':history.name,
        'model_sha256':dual.exp.file_sha256(model),'history_sha256':dual.exp.file_sha256(history),'reused':False}
    dual.atomic_json(stage/(name+'.ready.json'),record)
    return record


class DualTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.folder=Path(self.temp.name)
        self.manifest=json.loads((ROOT/'data/waterbench_observed/prepared/experiment_manifest.json').read_text())
        self.manifest['zones']=self.manifest['zones'][:1]
        self.manifest['training']['write_progress_archives']=True
        self.manifest_path=self.folder/'manifest.json';dual.atomic_json(self.manifest_path,self.manifest)
        self.output=self.folder/'result';self.output.mkdir()
    def test_all_fifteen_fits_partitioned_without_overlap_or_protocol_edits(self):
        before=copy.deepcopy(self.manifest)
        parts=dual.partition_tasks(self.manifest,[0,1])
        self.assertEqual([len(parts[gpu]) for gpu in (0,1)],[8,7])
        pairs=[(row['model'],row['seed']) for part in parts.values() for row in part]
        self.assertEqual(len(pairs),len(set(pairs)))
        self.assertEqual(set(pairs),{(row['model'],row['seed']) for row in dual.tasks_for(self.manifest)})
        self.assertEqual(self.manifest,before)
    def test_bad_gpu_ids_duplicate_seeds_and_multiple_zones_rejected(self):
        for ids in ([0],[0,0],[-1,0]):
            with self.assertRaises(ValueError):dual.partition_tasks(self.manifest,ids)
        self.manifest['training']['seeds'].append(42)
        with self.assertRaisesRegex(ValueError,'Duplicate'):dual.tasks_for(self.manifest)
        self.manifest['training']['seeds'].pop();self.manifest['zones']*=2
        with self.assertRaisesRegex(ValueError,'exactly one'):dual.tasks_for(self.manifest)
    def test_gpu_masks_and_seed_environment_are_isolated(self):
        before=os.environ.copy()
        first,second=dual.worker_environment(0),dual.worker_environment(1)
        self.assertEqual(first['CUDA_VISIBLE_DEVICES'],'0');self.assertEqual(second['CUDA_VISIBLE_DEVICES'],'1')
        self.assertEqual(first['PYTHONHASHSEED'],'0');self.assertEqual(first['TF_NUM_INTRAOP_THREADS'],'1')
        self.assertEqual(dict(os.environ),dict(before))
    def test_two_processes_have_separate_staging_and_inherit_timeout_group(self):
        pool=dual.TrainingPool(self.manifest_path,self.output,[0,1])
        with patch.object(dual.subprocess,'Popen',side_effect=[Process(),Process()]) as spawn:
            pool.start()
        calls=spawn.call_args_list
        self.assertEqual([call.kwargs['env']['CUDA_VISIBLE_DEVICES'] for call in calls],['0','1'])
        self.assertNotEqual(calls[0].args[0],calls[1].args[0])
        self.assertTrue(all('start_new_session' not in call.kwargs for call in calls))
        self.assertFalse(pool.stage.is_relative_to(self.output))
        pool.stop();self.assertTrue(all(process.terminated for process in pool.processes.values()))
    def test_partial_checkpoint_saved_and_second_collection_is_idempotent(self):
        pool=dual.TrainingPool(self.manifest_path,self.output,[0,1])
        task=pool.parts[0][0];record=ready_fixture(pool.stage/'gpu_0',task,self.manifest)
        pool.processes={0:Process(0),1:Process(0)}
        pool.collect();pool.collect()
        self.assertEqual(len(pool.completed),1)
        target=self.output/'models'/record['zone']/record['model_file']
        self.assertIsNotNone(dual.exp.checked_model_checkpoint(target,'canonical-test'))
        self.assertTrue((self.output.parent/('CuuNet_checkpoint_'+self.output.name+'.zip')).is_file())
        with self.assertRaisesRegex(RuntimeError,'Incomplete'):pool.wait()
    def test_corrupted_staged_model_and_path_injection_rejected(self):
        stage=self.folder/'stage';record=ready_fixture(stage,dual.tasks_for(self.manifest)[0],self.manifest)
        forged={**record,'model_file':'../escape.keras'}
        with self.assertRaisesRegex(ValueError,'path'):dual.commit_ready(stage,forged,self.output,self.manifest)
        (stage/record['model_file']).write_bytes(b'corrupt')
        with self.assertRaisesRegex(ValueError,'checksum'):dual.commit_ready(stage,record,self.output,self.manifest)
        self.assertFalse((self.output/'models').exists())
    def test_worker_failure_is_not_treated_as_a_completed_experiment(self):
        pool=dual.TrainingPool(self.manifest_path,self.output,[0,1])
        pool.processes={0:Process(),1:Process(2)}
        with self.assertRaisesRegex(RuntimeError,'GPU 1 worker failed'):pool.collect()
        pool.stop();self.assertTrue(pool.processes[0].terminated)
    def test_cross_assigned_ready_marker_is_rejected(self):
        pool=dual.TrainingPool(self.manifest_path,self.output,[0,1])
        first,second=pool.parts[0][:2]
        stage=pool.stage/'gpu_0';record=ready_fixture(stage,second,self.manifest)
        dual.atomic_json(stage/f'{first["model"]}_seed_{first["seed"]}.ready.json',record)
        with self.assertRaisesRegex(ValueError,'assigned model'):pool.collect()
        self.assertFalse(pool.completed)
    def test_missing_gpu_and_wrong_mask_are_rejected_before_fitting(self):
        with patch.dict(os.environ,{'CUDA_VISIBLE_DEVICES':'1'}),patch.object(dual.exp,'tf',object()):
            with self.assertRaisesRegex(RuntimeError,'mask'):dual.configure_gpu(0)
        fake=SimpleNamespace(config=SimpleNamespace(list_physical_devices=lambda kind:[]))
        with patch.dict(os.environ,{'CUDA_VISIBLE_DEVICES':'0'}),patch.object(dual.exp,'tf',fake):
            with self.assertRaisesRegex(RuntimeError,'found 0'):dual.configure_gpu(0)
    def test_coordinator_commits_every_model_before_original_scorer_and_restores_hooks(self):
        pools=[];original_walk=dual.exp.walk_forward_baselines;original_write=dual.exp.write_json
        def start(pool):
            pools.append(pool);pool.processes={0:Process(0),1:Process(0)}
            for gpu,tasks in pool.parts.items():
                stage=pool.stage/f'gpu_{gpu}'
                for task in tasks:ready_fixture(stage,task,pool.manifest)
                dual.atomic_json(stage/'worker_status.json',{'status':'completed','device_details':{'assigned_gpu':gpu}})
        def canonical():
            manifest={'status':'running','code_sha256':{},'gpu_devices':[{'scoring_gpu':0}]}
            dual.exp.write_json(self.output/'run_manifest.json',manifest)
            dual.exp.train_neural_models('unchanged-call')
            manifest['status']='completed';dual.exp.write_json(self.output/'run_manifest.json',manifest)
            return 0
        before_argv=dual.sys.argv[:]
        with patch.object(dual.TrainingPool,'start',start), \
             patch.object(dual.exp,'train_neural_models',return_value=()) as scorer, \
             patch.object(dual.exp,'main',side_effect=canonical):
            self.assertEqual(dual.coordinate(self.manifest_path,self.output,[0,1],2000),0)
            scorer.assert_called_once_with('unchanged-call')
        self.assertEqual(len(pools[0].completed),15)
        report=json.loads((self.output/'dual_gpu_execution.json').read_text())
        self.assertEqual(report['status'],'completed');self.assertEqual(report['completed_models'],15)
        runtime=json.loads((self.output/'run_manifest.json').read_text())
        self.assertEqual(len(runtime['gpu_devices']),2);self.assertFalse(runtime['single_gpu_training'])
        self.assertIs(dual.exp.walk_forward_baselines,original_walk)
        self.assertIs(dual.exp.write_json,original_write);self.assertEqual(dual.sys.argv,before_argv)
    def test_coordinator_stops_surviving_worker_and_preserves_partial_on_error(self):
        pools=[]
        def start(pool):
            pools.append(pool);pool.processes={0:Process(),1:Process(3)}
        def canonical():
            dates=pd.date_range('2020-01-01',periods=12);target=pd.Series(np.arange(12),index=dates)
            dual.exp.walk_forward_baselines(target,dates[-1:],4)
        with patch.object(dual.TrainingPool,'start',start),patch.object(dual.exp,'main',side_effect=canonical):
            with self.assertRaisesRegex(RuntimeError,'GPU 1 worker failed'):
                dual.coordinate(self.manifest_path,self.output,[0,1],2000)
        self.assertTrue(pools[0].processes[0].terminated)
        self.assertEqual(json.loads((self.output/'dual_gpu_execution.json').read_text())['status'],'partial')
        self.assertTrue((self.output.parent/('CuuNet_checkpoint_'+self.output.name+'.zip')).is_file())
    def test_cpu_chunking_matches_original_forecasts_exactly(self):
        dates=pd.date_range('2020-01-01',periods=48)
        target=pd.Series(np.arange(48)+np.sin(np.arange(48)),index=dates)
        target.iloc[30]=np.nan;index=dates[24:]
        expected=dual.exp.walk_forward_baselines(target,index,4,3,20)
        actual=dual.progressing_baselines(dual.exp.walk_forward_baselines,target,index,4,3,20,chunk=7)
        pd.testing.assert_frame_equal(actual,expected,check_exact=True)
    def test_preflight_requires_all_cases_and_rejects_numerical_disagreement(self):
        paths=[self.folder/name for name in ('parallel_gpu_0','parallel_gpu_1','serial_gpu_0')]
        cases=[f'{name}_30_{count}' for count in (5,8) for name in dual.VARIANTS]
        for index,path in enumerate(paths):
            path.mkdir()
            dual.atomic_json(path/'gpu_preflight.json',{'assigned_gpu':(0,1,0)[index],'status':'completed',
                'publication_eligible':False,'cases':[{'case':case} for case in cases]})
            for case in cases:np.savez(path/(case+'.npz'),predictions=np.ones((8,1)),weight_0=np.ones((2,2)))
        self.assertTrue(preflight.compare_results(paths)['passed'])
        np.savez(paths[1]/(cases[0]+'.npz'),predictions=np.zeros((8,1)),weight_0=np.ones((2,2)))
        with self.assertRaises(AssertionError):preflight.compare_results(paths)
    def test_checkpoint_signature_matches_the_unchanged_v7_algorithm(self):
        # Evaluate the actual canonical context expression with the same inputs.
        # This avoids assuming Windows and Linux calendars hash bit-identically.
        tree=ast.parse(Path(dual.exp.__file__).read_text(encoding='utf-8'))
        function=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='train_neural_models')
        assignment=next(node for node in ast.walk(function) if isinstance(node,ast.Assign)
            and any(isinstance(target,ast.Name) and target.id=='context' for target in node.targets))
        expression=compile(ast.Expression(assignment.value),'canonical_context','eval')
        manifest=self.manifest;zone=manifest['zones'][0];features=['q','annual_sin']
        frame=pd.DataFrame({'q':[1.,2.,3.],'annual_sin':[0.,.5,1.]})
        bounds=dual.exp.resolve_prediction_bounds(manifest)
        with patch.object(dual.exp,'tf',SimpleNamespace(__version__='2.19.0')), \
             patch.object(dual.exp,'keras',SimpleNamespace(__version__='3.9.2')):
            for name in dual.VARIANTS:
                censoring={'seed':7961,'censored_sequences':1} if name=='ta_lstm_outage' else None
                variables={'zone':zone,'architecture_name':name,'seed':42,'censoring':censoring,
                    'training':manifest['training'],'manifest':manifest,'lookback':int(manifest['lookback']),
                    'feature_columns':features,'prediction_bounds':bounds,'frame':frame}
                context=eval(expression,dual.exp.__dict__,variables)
                expected=hashlib.sha256(json.dumps(context,sort_keys=True).encode()).hexdigest()
                actual=dual.signature_for(zone,frame,features,manifest,bounds,name,42,censoring)
                self.assertEqual(actual,expected,name)


if __name__=='__main__':unittest.main()
