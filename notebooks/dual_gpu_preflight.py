"""Train tiny deployment-shape fixtures on both GPUs and compare a serial reference.

All tensors, targets and outcomes are synthetic and excluded from paper accuracy.
"""
from __future__ import annotations
import argparse,json,subprocess,sys,time
from pathlib import Path
import numpy as np
import revision_dual_gpu as dual


def worker(output,gpu):
    exp=dual.exp;device=dual.configure_gpu(gpu)
    output.mkdir(parents=True,exist_ok=True);records=[]
    for count in (5,8):
        features=(['q','input_available','input_age_01','annual_sin','annual_cos'] if count==5 else
            ['q','precipitation','temperature','soil_water','input_available','input_age_01','annual_sin','annual_cos'])
        zone={'id':f'shape_30_{count}','availability_feature_columns':['input_available'],'age_feature_column':'input_age_01'}
        rng=np.random.default_rng(500+count)
        x=rng.random((24,30,count),dtype=np.float32)
        arrays={'x_train':x[:16],'y_train':x[:16,-1,0],'x_validation':x[16:],'y_validation':x[16:,-1,0]}
        manifest={'lookback':30,'outage_max_gap':7,'training':{'lstm_units':64,'attention_units':32,'dropout':.2,
            'unroll_lstm':True,'learning_rate':.001,'epochs':2,'batch_size':8,'early_stopping_patience':2,
            'input_censoring_probability':.5}}
        for name in dual.VARIANTS:
            seed=42+count
            model,history,censoring=dual.fit_model(arrays,features,zone,manifest,name,seed,gpu)
            predictions=model(x[16:],training=False)
            if 'GPU' not in predictions.device.upper():raise RuntimeError('Preflight prediction did not execute on GPU')
            case=f'{name}_30_{count}';path=output/(case+'.keras');model.save(path)
            restored=exp.keras.models.load_model(path,compile=False)
            roundtrip=restored(x[16:],training=False).numpy()
            expected=predictions.numpy()
            np.testing.assert_allclose(roundtrip,expected,atol=1e-7,rtol=1e-6)
            weights=model.get_weights();copied=restored.get_weights()
            if len(weights)!=len(copied) or not all(np.array_equal(a,b) for a,b in zip(weights,copied)):
                raise RuntimeError('Serialization changed trained weights')
            np.savez_compressed(output/(case+'.npz'),predictions=expected,
                **{f'weight_{index}':value for index,value in enumerate(weights)})
            records.append({'case':case,'epochs':len(history['loss']),'gpu_tensor_device':predictions.device,
                'serialization_passed':True,'input_censoring':censoring})
    dual.atomic_json(output/'gpu_preflight.json',{**device,'status':'completed','publication_eligible':False,'cases':records})


def compare_results(paths):
    reports=[json.loads((path/'gpu_preflight.json').read_text()) for path in paths]
    if [report['assigned_gpu'] for report in reports]!=[0,1,0]:raise RuntimeError('Unexpected GPU preflight assignments')
    for report in reports:
        if report['status']!='completed' or report['publication_eligible'] is not False or len(report['cases'])!=6:
            raise RuntimeError('Incomplete preflight cases')
    cases=[row['case'] for row in reports[0]['cases']]
    if any([row['case'] for row in report['cases']]!=cases for report in reports):raise RuntimeError('Mismatched preflight cases')
    comparisons=[]
    for case in cases:
        with np.load(paths[2]/(case+'.npz')) as reference:
            for parallel in paths[:2]:
                with np.load(parallel/(case+'.npz')) as result:
                    if result.files!=reference.files:raise RuntimeError('Mismatched preflight weights')
                    for key in reference.files:
                        np.testing.assert_allclose(result[key],reference[key],atol=1e-5,rtol=1e-4)
                    comparisons.append({'case':case,'parallel_worker':parallel.name,
                        'max_abs_prediction_difference':float(np.max(abs(result['predictions']-reference['predictions']))),
                        'all_weight_arrays_within_tolerance':True})
    return {'passed':True,'publication_eligible':False,'parallel_gpu_ids':[0,1],
        'serial_reference_gpu':0,'cases_per_worker':6,'comparisons':comparisons,
        'scope':'tiny synthetic two-epoch fits at 30x5 and 30x8; no full experiment, browser latency or general speedup claim'}


def run(output):
    output.mkdir(parents=True,exist_ok=True)
    processes=[];paths=[output/'parallel_gpu_0',output/'parallel_gpu_1',output/'serial_gpu_0']
    started=time.monotonic()
    def launch(path,gpu):
        command=[sys.executable,str(Path(__file__).resolve()),'--worker','--output-dir',str(path),'--gpu',str(gpu)]
        process=subprocess.Popen(command,cwd=dual.ROOT,env=dual.worker_environment(gpu));processes.append(process)
        return process
    try:
        pair=[launch(paths[gpu],gpu) for gpu in (0,1)]
        deadline=time.monotonic()+480
        while any(process.poll() is None for process in pair):
            for process in pair:
                if process.poll() not in (None,0):raise RuntimeError('A GPU preflight worker failed; do not start the main experiment')
            if time.monotonic()>deadline:raise RuntimeError('Dual-GPU preflight timeout')
            time.sleep(.5)
        if any(process.returncode!=0 for process in pair):raise RuntimeError('Dual-GPU preflight failed')
        reference=launch(paths[2],0)
        if reference.wait(timeout=480)!=0:raise RuntimeError('Serial reference preflight failed')
        report=compare_results(paths);report['elapsed_seconds']=time.monotonic()-started
        report['code_sha256']={path.name:dual.exp.file_sha256(path) for path in (Path(__file__),Path(dual.__file__),Path(dual.exp.__file__))}
        report['software']={'tensorflow':dual.exp.tf.__version__,'keras':getattr(dual.exp.keras,'__version__','unknown')}
        dual.atomic_json(output/'dual_gpu_preflight_result.json',report)
        print(json.dumps(report,indent=2),flush=True)
        return report
    except BaseException:
        dual.atomic_json(output/'dual_gpu_preflight_result.json',{'passed':False,'publication_eligible':False})
        raise
    finally:
        for process in processes:
            if process.poll() is None:process.terminate()
        for process in processes:
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait()


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output-dir',type=Path,required=True)
    parser.add_argument('--worker',action='store_true');parser.add_argument('--gpu',type=int)
    args=parser.parse_args()
    if args.worker:
        if args.gpu is None:parser.error('Worker GPU is required')
        worker(args.output_dir,args.gpu)
    else:run(args.output_dir)
