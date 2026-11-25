"""Audit downloaded outage traces and prepare physical-unit publication summaries.

This performs no training, conversion, browser measurement or field validation.
"""
from pathlib import Path
from datetime import datetime
import hashlib,json,sys
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'notebooks'))
from audit_revision_outputs import close,sha256

ZONES=('Bao_Ha_Runoff','Gianh_Runoff','Can_Tho_Runoff')
NEURAL=('ta_lstm','lstm_no_attention','ta_lstm_outage')
BASE=('persistence','seasonal_persistence','moving_average','linear_trend',
      'seasonal_decomposition','equal_weight_ensemble','expected_mse_ensemble')


def paired_interval(difference,block):
    difference=np.asarray(difference,dtype=float)
    assert np.isfinite(difference).all()
    n=len(difference)
    rng=np.random.default_rng(42)
    starts=rng.integers(0,n,size=(2000,(n+block-1)//block))
    indices=((starts[:,:,None]+np.arange(block))%n).reshape(2000,-1)[:,:n]
    means=difference[indices].mean(axis=1)
    return {'mean_mae_difference':float(difference.mean()),
            'ci_low':float(np.quantile(means,.025)),'ci_high':float(np.quantile(means,.975)),
            'observations':n,'bootstrap_repetitions':2000,'block_length':block,
            'interpretation':'candidate minus comparator; conditional on the five trained seeds; time blocks are resampled jointly, not independent seed replicates'}


def audit_outage(path):
    run=json.loads((path/'run_manifest.json').read_text())
    manifest=run['manifest']; zone=manifest['zones'][0]
    out=path/'input_outage'
    meta=json.loads((out/'outage_manifest.json').read_text())
    failures=[]; count=0
    def check(value,name):
        nonlocal count
        count+=1
        if not value: failures.append(name)
    check(meta['primary_run_id']==run['run_id'],'matching primary run')
    check(meta['neural_complete'] and not meta['pending'],'complete neural outage evaluation')
    check(meta['input_rollout_policy']==manifest['outage_input_policy']=='frozen','frozen input policy')
    check(sha256(out/'outage_predictions.csv')==meta['raw_predictions_sha256'],'raw outage hash')
    check(sha256(out/'outage_metrics.csv')==meta['metrics_sha256'],'outage metric hash')
    check(sha256(path/'code/notebooks/outage_revision_experiments.py')==meta['code_sha256'],'executed outage code hash')
    input_path=path/'inputs'/zone['file']
    source=pd.read_csv(input_path,parse_dates=[zone['date_column']]).set_index(zone['date_column'])
    target=source[zone['target_column']]
    check(sha256(input_path)==meta['evidence']['data_files'][0]['sha256'],'matching target evidence')
    raw=pd.read_csv(out/'outage_predictions.csv',keep_default_na=False)
    metrics=pd.read_csv(out/'outage_metrics.csv',keep_default_na=False)
    dates=pd.to_datetime(raw.target_date); origins=pd.to_datetime(raw.origin)
    check(((dates-origins).dt.days==raw.horizon.astype(int)).all(),'lead equals target minus origin')
    check((raw.physical_input_cutoff==raw.origin).all(),'declared physical cutoff equals origin')
    check(np.allclose(raw.actual.astype(float),target.reindex(dates).to_numpy()),'all targets match source')
    check(raw.target_observed.astype(str).str.lower().eq('true').all(),'all runoff labels observed in reanalysis')
    check(np.isfinite(raw.predicted.astype(float)).all() and raw.predicted.astype(float).ge(0).all(),'finite nonnegative outputs')
    check(not raw.duplicated(['model','seed','horizon','origin']).any(),'unique predictions')
    check(len(metrics)==66 and len(raw)==13728,'all 22 model/seed variants by three horizons and 208 origins')
    test_dates=target.loc[target.index>manifest['splits']['validation_end']].index
    expected_origins=test_dates[::manifest['outage_origin_stride']]-pd.Timedelta(days=1)
    expected_origins=expected_origins[expected_origins+pd.Timedelta(days=7)<=target.index[-1]]
    threshold=target.loc[:manifest['splits']['train_end']].quantile(manifest['peak_quantile_from_training'])
    for model in NEURAL:
        for seed in manifest['training']['seeds']:
            weight=path/'models'/zone['id']/f'{model}_seed_{seed}.keras'
            history=json.loads(weight.with_suffix('.history.json').read_text())
            check(sha256(weight)==history['model_sha256'],f'model checksum {model} {seed}')
    for row in metrics.to_dict('records'):
        values=raw[(raw.model==row['model']) & (raw.seed.astype(str)==str(row['seed'])) & (raw.horizon==int(row['horizon']))].sort_values('origin')
        check(len(values)==int(row['observations'])==208,f"complete observations {row['model']} {row['seed']} {row['horizon']}")
        check(pd.DatetimeIndex(values.origin).equals(expected_origins),f"same origins {row['model']} {row['seed']} {row['horizon']}")
        err=values.predicted.astype(float).to_numpy()-values.actual.astype(float).to_numpy()
        peak=values.actual.astype(float).to_numpy()>=threshold
        for name,value in [('mae',abs(err).mean()),('rmse',np.sqrt(np.mean(err**2))),('mean_bias',err.mean()),('peak_mae',abs(err[peak]).mean())]:
            check(close(row[name],value),f"recomputed {name} {row['model']} {row['seed']} {row['horizon']}")
        check(int(row['peak_count'])==int(peak.sum()),'training-defined peak count')
        if row['model']=='persistence':
            check(np.allclose(values.predicted.astype(float),target.reindex(pd.to_datetime(values.origin))),'frozen persistence uses origin value')
    report={'zone':zone['id'],'passed':not failures,'checks':count,'failures':failures,'raw_rows':len(raw),'metric_rows':len(metrics),
            'scope':'hashes, target identities, model checksums, origin/cutoff metadata and metrics; does not rerun TensorFlow or prove field outages'}
    (out/'independent_outage_audit.json').write_text(json.dumps(report,indent=2))
    assert report['passed'],report
    return report


def main():
    tables=[]; outages=[]; comparisons=[]; export=[]; weights=[]; runtime=[]; audits=[]
    for zone in ZONES:
        path=WORK/zone
        audits.append(audit_outage(path))
        run=json.loads((path/'run_manifest.json').read_text())
        seconds=(datetime.fromisoformat(run['completed_at_utc'])-datetime.fromisoformat(run['started_at_utc'])).total_seconds()
        outage_meta=json.loads((path/'input_outage/outage_manifest.json').read_text())
        outage_seconds=(datetime.fromisoformat(outage_meta['completed_at_utc'])-datetime.fromisoformat(run['completed_at_utc'])).total_seconds()
        runtime.append({'zone':zone,'primary_minutes':seconds/60,'outage_minutes_after_primary':outage_seconds/60})
        baseline=pd.read_csv(path/'forecasting_metrics.csv'); neural=pd.read_csv(path/'neural_metrics.csv')
        for split in ('validation','test'):
            for model in BASE+NEURAL:
                rows=(neural if model in NEURAL else baseline)
                rows=rows[(rows.model==model)&(rows['split']==split)]
                record={'zone':zone,'split':split,'model':model,'seeds':len(rows) if model in NEURAL else 0,'units':'mm/day'}
                for metric in ('mae','rmse','peak_mae','nse','kge'):
                    record[metric+'_mean']=rows[metric].mean(); record[metric+'_seed_sd']=rows[metric].std(ddof=1) if model in NEURAL else 0.
                record['observations']=int(rows.observations.iloc[0]);record['peak_count']=int(rows.peak_count.iloc[0])
                tables.append(record)
        outmetrics=pd.read_csv(path/'input_outage/outage_metrics.csv')
        for (model,horizon),rows in outmetrics.groupby(['model','horizon']):
            record={'zone':zone,'model':model,'horizon':int(horizon),'observations':int(rows.observations.iloc[0]),'units':'mm/day'}
            for metric in ('mae','rmse','peak_mae'):
                record[metric+'_mean']=rows[metric].mean();record[metric+'_seed_sd']=rows[metric].std(ddof=1) if model in NEURAL else 0.
            outages.append(record)
        bp=pd.read_csv(path/'baseline_predictions.csv'); npred=pd.read_csv(path/'per_seed_predictions.csv')
        rawout=pd.read_csv(path/'input_outage/outage_predictions.csv')
        def losses(frame,date):
            frame=frame.copy();frame[date]=pd.to_datetime(frame[date].astype(str).str[:10])
            frame['loss']=abs(frame.predicted-frame.actual)
            return {model:rows.groupby(date).loss.mean().sort_index() for model,rows in frame.groupby('model')}
        combined=pd.concat([bp[bp['split']=='test'],npred[npred['split']=='test']])
        loss=losses(combined,'date')
        for candidate,comparator in [('ta_lstm','persistence'),('lstm_no_attention','persistence'),('ta_lstm_outage','persistence'),('expected_mse_ensemble','seasonal_decomposition'),('ta_lstm','lstm_no_attention')]:
            difference=loss[candidate]-loss[comparator]
            comparisons.append({'zone':zone,'evaluation':'one_step_test','horizon':1,'candidate':candidate,'comparator':comparator,**paired_interval(difference,30)})
        for horizon in (1,3,7):
            loss=losses(rawout[rawout.horizon==horizon],'origin')
            for comparator in ('ta_lstm','lstm_no_attention','persistence'):
                comparisons.append({'zone':zone,'evaluation':'frozen_input_outage','horizon':horizon,'candidate':'ta_lstm_outage','comparator':comparator,**paired_interval(loss['ta_lstm_outage']-loss[comparator],5)})
        export.extend(pd.read_csv(path/'quantisation_equivalence.csv').to_dict('records'))
        weights.extend(pd.read_csv(path/'forecast_combination_weights.csv').to_dict('records'))
    outputs={'forecast_summary.csv':tables,'outage_summary.csv':outages,'paired_mean_loss_comparisons.csv':comparisons,
             'quantisation_summary.csv':export,'combination_weights.csv':weights,'runtime_summary.csv':runtime}
    for name,rows in outputs.items():pd.DataFrame(rows).to_csv(WORK/name,index=False)
    report={'zones':list(ZONES),'trained_models':45,'one_step_test_days_per_zone':1461,'outage_origins_per_zone':208,
            'outage_audits':audits,'units':'mm/day','provenance':'ERA5-Land regional runoff generation reanalysis',
            'not_established':['observed Vietnam discharge','field flood warnings','Iowa model outcomes','browser/mobile latency','battery measurements'],
            'derived_files':{name:sha256(WORK/name) for name in outputs}}
    (WORK/'analysis_audit.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'trained_models':45,'outage_audits':audits,'outputs':list(outputs)},indent=2))


if __name__=='__main__':main()
