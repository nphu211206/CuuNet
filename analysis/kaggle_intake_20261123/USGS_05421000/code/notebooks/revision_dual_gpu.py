"""Run independent canonical fits on separate GPUs, then use the unchanged v7 scorer.

No distributed-gradient training is used. Workers never write the shared result
directory. Only the coordinator commits checksum-verified model/history pairs.
"""
from __future__ import annotations
import argparse,hashlib,json,os,shutil,signal,subprocess,sys,time
from pathlib import Path
import numpy as np
import pandas as pd
import revision_experiments as exp

ROOT=Path(__file__).resolve().parents[1]
VARIANTS={'ta_lstm':(True,False),'lstm_no_attention':(False,False),'ta_lstm_outage':(True,True)}


def atomic_json(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value,indent=2,allow_nan=False),encoding='utf-8')
    temporary.replace(path)


def tasks_for(manifest):
    if len(manifest['zones'])!=1:
        raise ValueError('The dual-GPU handoff requires exactly one selected zone')
    names=['ta_lstm','lstm_no_attention']
    if manifest['training'].get('include_outage_variant'): names.append('ta_lstm_outage')
    tasks=[{'model':name,'seed':int(seed)} for name in names for seed in manifest['training']['seeds']]
    if len({(row['model'],row['seed']) for row in tasks})!=len(tasks):
        raise ValueError('Duplicate architecture/seed tasks')
    return tasks


def partition_tasks(manifest,gpu_ids):
    if len(gpu_ids)!=2 or len(set(gpu_ids))!=2 or any(gpu<0 for gpu in gpu_ids):
        raise ValueError('Select two distinct nonnegative GPU IDs')
    tasks=tasks_for(manifest)
    return {gpu:tasks[index::len(gpu_ids)] for index,gpu in enumerate(gpu_ids)}


def worker_environment(gpu):
    env=os.environ.copy()
    env.update(CUDA_VISIBLE_DEVICES=str(gpu),PYTHONHASHSEED='0',OMP_NUM_THREADS='1',
               TF_NUM_INTRAOP_THREADS='1',TF_NUM_INTEROP_THREADS='1',PYTHONUNBUFFERED='1')
    return env


def configure_gpu(gpu):
    if exp.tf is None: raise RuntimeError('Use the locked TensorFlow runtime')
    if os.environ.get('CUDA_VISIBLE_DEVICES')!=str(gpu):
        raise RuntimeError('Worker GPU mask does not match its assignment')
    devices=exp.tf.config.list_physical_devices('GPU')
    if len(devices)!=1:
        raise RuntimeError(f'GPU {gpu}: expected one visible GPU, found {len(devices)}')
    exp.tf.config.experimental.set_memory_growth(devices[0],True)
    exp.tf.config.threading.set_intra_op_parallelism_threads(1)
    exp.tf.config.threading.set_inter_op_parallelism_threads(1)
    exp.keras.mixed_precision.set_global_policy('float32')
    exp.tf.config.experimental.enable_op_determinism()
    return {'assigned_gpu':gpu,'cuda_visible_devices':os.environ['CUDA_VISIBLE_DEVICES'],
            'device_details':exp.tf.config.experimental.get_device_details(devices[0])}


def signature_for(zone,frame,features,manifest,bounds,model_name,seed,censoring):
    # Intentionally matches the unchanged canonical v7 checkpoint identity.
    context={'zone':zone,'architecture':model_name,'seed':int(seed),'input_censoring':censoring,
        'training':manifest['training'],'splits':manifest['splits'],'lookback':int(manifest['lookback']),
        'feature_columns':features,'prediction_bounds':bounds,
        'source_sha256':exp.file_sha256(Path(exp.__file__)),
        'frame_sha256':hashlib.sha256(pd.util.hash_pandas_object(frame,index=True).values.tobytes()).hexdigest(),
        'tensorflow':exp.tf.__version__,'keras':getattr(exp.keras,'__version__','unknown')}
    return hashlib.sha256(json.dumps(context,sort_keys=True).encode()).hexdigest()


def fit_model(arrays,features,zone,manifest,name,seed,gpu):
    training=manifest['training']; attention,censored=VARIANTS[name]
    exp.keras.backend.clear_session(); exp.set_seed(int(seed))
    model=exp.build_neural_model(lookback=int(manifest['lookback']),feature_count=arrays['x_train'].shape[-1],
        lstm_units=int(training['lstm_units']),attention_units=int(training['attention_units']),
        dropout=float(training['dropout']),use_attention=attention,unroll_lstm=bool(training.get('unroll_lstm',True)))
    model.compile(optimizer=exp.keras.optimizers.Adam(learning_rate=float(training['learning_rate']),clipnorm=1.0),
                  loss='mse',metrics=['mae'])
    inputs=arrays['x_train']; censoring=None
    if censored:
        inputs,censoring=exp.censor_training_inputs(inputs,features,zone,int(seed)+7919,
            int(manifest.get('outage_max_gap',7)),float(training.get('input_censoring_probability',.5)))
    class Progress(exp.keras.callbacks.Callback):
        def on_epoch_end(self,epoch,logs=None):
            if epoch==0 or (epoch+1)%5==0:
                value=(logs or {}).get('val_mae')
                print(f'[GPU {gpu}] {name} seed {seed}: epoch {epoch+1}, scaled val_mae={value}',flush=True)
    callbacks=[exp.keras.callbacks.EarlyStopping(monitor='val_mae',
        patience=int(training['early_stopping_patience']),restore_best_weights=True),Progress()]
    print(f'[GPU {gpu}] Training {zone["id"]} {name} seed {seed}',flush=True)
    history=model.fit(inputs,arrays['y_train'],validation_data=(arrays['x_validation'],arrays['y_validation']),
        epochs=int(training['epochs']),batch_size=int(training['batch_size']),callbacks=callbacks,verbose=0,shuffle=False)
    return model,history.history,censoring


def training_worker(manifest_path,canonical,stage,assignment,gpu):
    device=configure_gpu(gpu)
    manifest=exp.load_manifest(manifest_path)
    exp.validate_evidence_contract(ROOT,manifest)
    expected=tasks_for(manifest)
    tasks=json.loads(assignment.read_text())
    if not tasks or any(row not in expected for row in tasks) or len({(r['model'],r['seed']) for r in tasks})!=len(tasks):
        raise ValueError('Invalid worker task assignment')
    zone=manifest['zones'][0];frame,audit=exp.load_zone(ROOT,zone,manifest['splits'])
    features=list(audit['feature_columns_used']);bounds=exp.resolve_prediction_bounds(manifest)
    arrays=exp.prepare_neural_arrays(frame,features,zone['target_column'],manifest['splits'],
        int(manifest['lookback']),zone.get('fixed_range_features'))
    atomic_json(stage/'worker_status.json',{**device,'status':'running','tasks':tasks})
    for task in tasks:
        name,seed=task['model'],int(task['seed']); censoring=None
        if VARIANTS[name][1]:
            _,censoring=exp.censor_training_inputs(arrays['x_train'],features,zone,seed+7919,
                int(manifest.get('outage_max_gap',7)),float(manifest['training'].get('input_censoring_probability',.5)))
        signature=signature_for(zone,frame,features,manifest,bounds,name,seed,censoring)
        cached_path=canonical/'models'/zone['id']/f'{name}_seed_{seed}.keras'
        cached=exp.checked_model_checkpoint(cached_path,signature)
        model_path=stage/f'{name}_seed_{seed}.keras';history_path=model_path.with_suffix('.history.json')
        if cached:
            shutil.copy2(cached_path,model_path);shutil.copy2(cached_path.with_suffix('.history.json'),history_path)
            print(f'[GPU {gpu}] Reused checked checkpoint {name} seed {seed}',flush=True)
        else:
            model,history,censoring=fit_model(arrays,features,zone,manifest,name,seed,gpu)
            actual_signature=signature_for(zone,frame,features,manifest,bounds,name,seed,censoring)
            if actual_signature!=signature:raise RuntimeError('Training censoring metadata changed')
            temporary=model_path.with_name(model_path.stem+'.tmp.keras')
            model.save(temporary);temporary.replace(model_path)
            atomic_json(history_path,{'zone':zone['id'],'model':name,'seed':seed,'history':history,
                'training_configuration':manifest['training'],'parameters':int(model.count_params()),
                'model_sha256':exp.file_sha256(model_path),'training_signature':signature,'input_censoring':censoring,
                'checkpoint_rule':'minimum scaled validation MAE with early stopping; no test-based selection'})
        atomic_json(stage/f'{name}_seed_{seed}.ready.json',{
            'zone':zone['id'],'model':name,'seed':seed,'training_signature':signature,
            'model_file':model_path.name,'history_file':history_path.name,
            'model_sha256':exp.file_sha256(model_path),'history_sha256':exp.file_sha256(history_path),
            'reused':bool(cached)})
        print(f'[GPU {gpu}] Saved {name} seed {seed}',flush=True)
    atomic_json(stage/'worker_status.json',{**device,'status':'completed','tasks':tasks})


def commit_ready(stage,record,output,manifest):
    if record['zone']!=manifest['zones'][0]['id'] or {'model':record['model'],'seed':int(record['seed'])} not in tasks_for(manifest):
        raise ValueError('Unexpected completed model')
    name=f'{record["model"]}_seed_{record["seed"]}'
    if record['model_file']!=name+'.keras' or record['history_file']!=name+'.history.json':
        raise ValueError('Unexpected staged checkpoint path')
    model=stage/record['model_file']; history=stage/record['history_file']
    if exp.file_sha256(model)!=record['model_sha256'] or exp.file_sha256(history)!=record['history_sha256']:
        raise ValueError('Staged checkpoint checksum mismatch')
    saved=exp.checked_model_checkpoint(model,record['training_signature'])
    if saved['zone']!=record['zone'] or saved['model']!=record['model'] or int(saved['seed'])!=int(record['seed']) or saved['training_configuration']!=manifest['training']:
        raise ValueError('Staged checkpoint identity/configuration mismatch')
    destination=output/'models'/record['zone']/model.name
    existing=exp.checked_model_checkpoint(destination,record['training_signature'])
    if existing and existing['model_sha256']!=record['model_sha256']:
        raise ValueError('Refusing to overwrite a different completed checkpoint')
    destination.parent.mkdir(parents=True,exist_ok=True)
    for src,dest in ((model,destination),(history,destination.with_suffix('.history.json'))):
        temporary=dest.with_name(dest.name+'.commit.tmp');shutil.copy2(src,temporary);temporary.replace(dest)
    exp.checked_model_checkpoint(destination,record['training_signature'])
    return record


class TrainingPool:
    def __init__(self,manifest_path,output,gpu_ids):
        self.manifest_path=manifest_path.resolve();self.output=output.resolve()
        self.manifest=exp.load_manifest(self.manifest_path);self.parts=partition_tasks(self.manifest,gpu_ids)
        self.stage=self.output.parent/('_dual_gpu_'+self.output.name)
        self.processes={};self.completed={};self.start_time=time.monotonic();self.last_log=0.
    def start(self):
        for gpu,tasks in self.parts.items():
            stage=self.stage/f'gpu_{gpu}';stage.mkdir(parents=True,exist_ok=True)
            assignment=stage/'assignment.json';atomic_json(assignment,tasks)
            command=[sys.executable,str(Path(__file__).resolve()),'--worker','--manifest',str(self.manifest_path),
                '--output-dir',str(self.output),'--stage',str(stage),'--assignment',str(assignment),'--gpu',str(gpu)]
            # Inherit the notebook child's process group so its timeout reaches every worker.
            self.processes[gpu]=subprocess.Popen(command,cwd=ROOT,env=worker_environment(gpu))
        self.write_status('running')
    def write_status(self,status):
        atomic_json(self.output/'dual_gpu_execution.json',{'strategy':'independent models in isolated GPU processes',
            'status':status,'gpu_ids':list(self.parts),'per_model_gpu_count':1,'expected_models':len(tasks_for(self.manifest)),
            'completed_models':len(self.completed),'completed_tasks':list(self.completed.values()),
            'worker_gpu_assignments':{str(gpu):tasks for gpu,tasks in self.parts.items()},
            'elapsed_seconds':time.monotonic()-self.start_time,'checkpoint_scientific_source_unchanged':True})
    def collect(self,check_processes=True):
        changed=False
        for gpu,tasks in self.parts.items():
            stage=self.stage/f'gpu_{gpu}'
            for task in tasks:
                key=(task['model'],task['seed'])
                marker=stage/f'{task["model"]}_seed_{task["seed"]}.ready.json'
                if key not in self.completed and marker.is_file():
                    record=json.loads(marker.read_text())
                    if (record['model'],int(record['seed']))!=key:
                        raise ValueError('Ready marker does not match its assigned model/seed')
                    commit_ready(stage,record,self.output,self.manifest)
                    self.completed[key]=record;changed=True
        if changed:
            self.write_status('running')
            print(f'[Coordinator] Committed {len(self.completed)}/{len(tasks_for(self.manifest))} models',flush=True)
            exp.save_training_checkpoint(self.output)
        if check_processes:
            for gpu,process in self.processes.items():
                code=process.poll()
                if code is not None and code!=0:raise RuntimeError(f'GPU {gpu} worker failed with exit code {code}; keep the partial checkpoint')
        if time.monotonic()-self.last_log>=30:
            print(f'[Coordinator] GPU pool: {len(self.completed)}/{len(tasks_for(self.manifest))} models committed',flush=True)
            self.last_log=time.monotonic()
    def wait(self):
        while any(process.poll() is None for process in self.processes.values()):
            self.collect();time.sleep(.5)
        self.collect()
        if set(self.completed)!={(row['model'],row['seed']) for row in tasks_for(self.manifest)}:
            raise RuntimeError('Incomplete/duplicate model pool; canonical scoring is blocked')
        self.write_status('completed')
    def stop(self):
        for process in self.processes.values():
            if process.poll() is None:process.terminate()
        for process in self.processes.values():
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait()


def progressing_baselines(original,target,index,period,moving_average_window=3,history_window=None,*,tick=lambda:None,chunk=10):
    frames=[]
    for first in range(0,len(index),chunk):
        tick();part=index[first:first+chunk]
        frames.append(original(target,part,period,moving_average_window,history_window));tick()
        print(f'[CPU baselines] {min(first+chunk,len(index))}/{len(index)} dates completed',flush=True)
    return pd.concat(frames).reindex(index) if frames else pd.DataFrame(index=index)


def coordinate(manifest_path,output,gpu_ids,repetitions):
    pool=TrainingPool(manifest_path,output,gpu_ids)
    source_hash=exp.file_sha256(Path(__file__))
    output.mkdir(parents=True,exist_ok=True)
    snapshot=output/'code/notebooks/revision_dual_gpu.py';snapshot.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(Path(__file__),snapshot)
    old_train,old_walk,old_write=exp.train_neural_models,exp.walk_forward_baselines,exp.write_json
    old_argv=sys.argv[:]
    previous_signal=signal.getsignal(signal.SIGTERM)
    def interrupted(signum,frame):raise InterruptedError('Notebook stopped the dual-GPU job')
    def ready_train(*args,**kwargs):
        pool.wait()
        # Prevent even a silent canonical refit if any pair was not committed.
        for record in pool.completed.values():
            path=output/'models'/record['zone']/record['model_file']
            if exp.checked_model_checkpoint(path,record['training_signature']) is None:
                raise RuntimeError('Missing completed model before canonical scoring')
        return old_train(*args,**kwargs)
    def recorded_write(path,value):
        if Path(path).name=='run_manifest.json':
            if exp.file_sha256(Path(__file__))!=source_hash:raise RuntimeError('Dual-GPU executor source changed during the run')
            value['code_sha256']['notebooks/revision_dual_gpu.py']=source_hash
            value['training_execution']={'strategy':'two independent GPU worker processes; canonical serial scoring',
                'worker_gpu_ids':gpu_ids,'one_gpu_per_model':True,'execution_report':'dual_gpu_execution.json'}
            value['aggregation_gpu_devices']=value.get('gpu_devices',[])
            value['single_gpu_training']=False
            if value.get('status')=='completed':
                value['gpu_devices']=[json.loads((pool.stage/f'gpu_{gpu}/worker_status.json').read_text())['device_details'] for gpu in gpu_ids]
        old_write(path,value)
    try:
        signal.signal(signal.SIGTERM,interrupted)
        pool.start()
        exp.train_neural_models=ready_train
        exp.walk_forward_baselines=lambda *args,**kwargs:progressing_baselines(old_walk,*args,**kwargs,tick=pool.collect)
        exp.write_json=recorded_write
        sys.argv=[str(Path(exp.__file__)), '--manifest',str(manifest_path),'--output-dir',str(output),
                  '--bootstrap-repetitions',str(repetitions)]
        return exp.main()
    except BaseException:
        pool.stop()
        pool.collect(check_processes=False)
        pool.write_status('partial')
        exp.save_training_checkpoint(output)
        raise
    finally:
        pool.stop();exp.train_neural_models,exp.walk_forward_baselines,exp.write_json=old_train,old_walk,old_write
        sys.argv=old_argv;signal.signal(signal.SIGTERM,previous_signal)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--manifest',type=Path,required=True);parser.add_argument('--output-dir',type=Path,required=True)
    parser.add_argument('--gpu-ids',default='0,1');parser.add_argument('--bootstrap-repetitions',type=int,default=2000)
    parser.add_argument('--worker',action='store_true');parser.add_argument('--gpu',type=int)
    parser.add_argument('--stage',type=Path);parser.add_argument('--assignment',type=Path)
    args=parser.parse_args()
    if args.worker:
        if args.gpu is None or args.stage is None or args.assignment is None:parser.error('Worker arguments are incomplete')
        training_worker(args.manifest,args.output_dir,args.stage,args.assignment,args.gpu);return 0
    return coordinate(args.manifest,args.output_dir,[int(value) for value in args.gpu_ids.split(',')],args.bootstrap_repetitions)


if __name__=='__main__':sys.exit(main())
