"""Postprocess the six completed runs without retraining or altering their results.

Seed SD describes training variation. Bootstrap intervals are conditional on the
fitted seeds and resample the same ordered available references for all models.
"""
from __future__ import annotations
import argparse,hashlib,json,math
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
ZONES=('Bao_Ha_Runoff','Gianh_Runoff','Can_Tho_Runoff','USGS_06903900','USGS_05421000','USGS_05453520')
NEURAL=('ta_lstm','lstm_no_attention','ta_lstm_outage')
BASE=('persistence','seasonal_persistence','moving_average','linear_trend','seasonal_decomposition','equal_weight_ensemble','expected_mse_ensemble')
METRICS=('mae','rmse','mean_bias','peak_mae','nse','kge')


def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def equal(a,b):return (pd.isna(a) and pd.isna(b)) or (not pd.isna(a) and not pd.isna(b) and math.isclose(float(a),float(b),rel_tol=2e-7,abs_tol=1e-7))
def calculate(actual,predicted,threshold):
    observed=np.isfinite(actual);y=np.asarray(actual)[observed];p=np.asarray(predicted)[observed]
    if not len(y) or not np.isfinite(p).all():raise ValueError('Invalid comparison window')
    e=p-y;peak=y>=threshold;denom=np.sum((y-y.mean())**2)
    nse=1-np.sum(e**2)/denom if denom else np.nan
    if len(y)>1 and np.std(y,ddof=1)>0 and np.std(p,ddof=1)>0 and y.mean()!=0:
        kge=1-np.sqrt((np.corrcoef(y,p)[0,1]-1)**2+(np.std(p,ddof=1)/np.std(y,ddof=1)-1)**2+(p.mean()/y.mean()-1)**2)
    else:kge=np.nan
    return {'observations':len(y),'mae':float(abs(e).mean()),'rmse':float(np.sqrt(np.mean(e**2))),
        'mean_bias':float(e.mean()),'nse':float(nse),'kge':float(kge),'peak_count':int(peak.sum()),
        'peak_mae':float(abs(e[peak]).mean()) if peak.any() else np.nan}


def audit_outage(path):
    run=json.loads((path/'run_manifest.json').read_text());manifest=run['manifest'];zone=manifest['zones'][0]
    meta=json.loads((path/'input_outage/outage_manifest.json').read_text())
    checks=[]
    def check(value,name):
        checks.append({'check':name,'passed':bool(value)})
        if not value:raise ValueError(f'{zone["id"]}: {name}')
    check(meta['primary_run_id']==run['run_id'] and run['status']=='completed','matching completed primary')
    check(meta['neural_complete'] and not meta['pending'],'all neural outage variants completed')
    check(meta['input_rollout_policy']==manifest['outage_input_policy']=='frozen','frozen physical inputs')
    for name,key in [('outage_predictions.csv','raw_predictions_sha256'),('outage_metrics.csv','metrics_sha256')]:
        check(digest(path/'input_outage'/name)==meta[key],f'hash {name}')
    check(digest(path/'code/notebooks/outage_revision_experiments.py')==meta['code_sha256'],'outage source hash')
    source=path/'inputs'/zone['file'];check(digest(source)==meta['evidence']['data_files'][0]['sha256'],'target source hash')
    target=pd.read_csv(source,parse_dates=[zone['date_column']]).set_index(zone['date_column'])[zone['target_column']]
    raw=pd.read_csv(path/'input_outage/outage_predictions.csv');metrics=pd.read_csv(path/'input_outage/outage_metrics.csv')
    raw['seed']=raw.seed.fillna(0).astype(int);metrics['seed']=metrics.seed.fillna(0).astype(int)
    origins=pd.to_datetime(raw.origin);dates=pd.to_datetime(raw.target_date)
    check(((dates-origins).dt.days==raw.horizon).all(),'target date equals origin plus horizon')
    check(raw.physical_input_cutoff.eq(raw.origin).all(),'declared cutoff equals origin')
    reference=target.reindex(dates).to_numpy()
    check(np.allclose(raw.actual,reference,equal_nan=True),'references equal original source including missing labels')
    check(np.array_equal(raw.target_observed.astype(str).str.lower().eq('true'),np.isfinite(reference)),'observation flags identify missing labels exactly')
    check(np.isfinite(raw.predicted).all() and raw.predicted.ge(0).all(),'finite nonnegative predictions')
    check(not raw.duplicated(['model','seed','horizon','origin']).any(),'no duplicate forecasts')
    test=target.loc[(target.index>manifest['splits']['validation_end'])&(target.index<=manifest['splits']['test_end'])].index
    expected_origins=test[::manifest['outage_origin_stride']]-pd.Timedelta(days=1)
    expected_origins=expected_origins[expected_origins+pd.Timedelta(days=max(manifest['outage_horizons']))<=target.index[-1]]
    expected=[(name,0,h) for name in BASE for h in manifest['outage_horizons']]
    expected += [(name,int(seed),h) for name in NEURAL for seed in manifest['training']['seeds'] for h in manifest['outage_horizons']]
    check(set(zip(metrics.model,metrics.seed,metrics.horizon))==set(expected) and len(metrics)==len(expected),'exact model/seed/horizon set')
    check(len(raw)==len(expected)*len(expected_origins),'complete raw origin grid')
    threshold=target.loc[:manifest['splits']['train_end']].quantile(manifest['peak_quantile_from_training'])
    for row in metrics.to_dict('records'):
        values=raw[(raw.model==row['model'])&(raw.seed==row['seed'])&(raw.horizon==row['horizon'])].sort_values('origin')
        check(pd.DatetimeIndex(values.origin).equals(expected_origins),'same chronological origins for every model')
        calculated=calculate(values.actual.to_numpy(),values.predicted.to_numpy(),threshold)
        for name,value in calculated.items():check(equal(row[name],value),f'recomputed {name} {row["model"]} {row["seed"]} h{row["horizon"]}')
        if row['model']=='persistence':check(np.allclose(values.predicted,target.loc[:].ffill().reindex(pd.to_datetime(values.origin))),'persistence reads historical input only')
    for name in NEURAL:
        for seed in manifest['training']['seeds']:
            model=path/'models'/zone['id']/f'{name}_seed_{seed}.keras';history=json.loads(model.with_suffix('.history.json').read_text())
            check(digest(model)==history['model_sha256'],f'model hash {name} {seed}')
    return {'zone':zone['id'],'passed':True,'checks':len(checks),'raw_rows':len(raw),'metric_rows':len(metrics),
        'scheduled_origins':len(expected_origins),'observed_origins_by_horizon':{str(h):int(np.isfinite(target.reindex(expected_origins+pd.Timedelta(days=h))).sum()) for h in manifest['outage_horizons']},
        'scope':'hashes, model histories, target/coverage/cutoff metadata and independent error recomputation; no model execution or field validation'}


def index_draws(n,block,repetitions=2000):
    generator=np.random.default_rng(42)
    starts=generator.integers(0,n,size=(repetitions,math.ceil(n/block)))
    return ((starts[:,:,None]+np.arange(block))%n).reshape(repetitions,-1)[:,:n]


def boot_model(errors,draws,actual,threshold):
    errors=np.asarray(errors,float);peak=actual>=threshold
    results={name:np.zeros(len(draws)) for name in ('mae','rmse','mse')}
    peak_count=peak[draws].sum(axis=1);peak_samples=[]
    for seed in range(errors.shape[1]):
        sample=errors[:,seed][draws]
        results['mae']+=abs(sample).mean(axis=1)/errors.shape[1]
        mse=np.mean(sample**2,axis=1)
        results['rmse']+=np.sqrt(mse)/errors.shape[1];results['mse']+=mse/errors.shape[1]
        sums=(abs(sample)*peak[draws]).sum(axis=1)
        peak_samples.append(np.divide(sums,peak_count,out=np.full(len(draws),np.nan),where=peak_count>0))
    results['peak_mae']=np.asarray(peak_samples).mean(axis=0)
    return results


def summaries(metric_rows,zone,split,units,provenance):
    rows=[]
    for model,group in metric_rows.groupby('model',sort=False):
        record={'zone':zone,'split':split,'model':model,'units':units,'provenance':provenance,
            'seeds':len(group) if model in NEURAL else 0,'observations':int(group.observations.iloc[0]),
            'peak_count':int(group.peak_count.iloc[0]),'validation_used_for_calibration':split=='validation'}
        for metric in METRICS:
            record[metric+'_mean']=float(group[metric].mean());record[metric+'_seed_sd']=float(group[metric].std(ddof=1)) if model in NEURAL else 0.
        record['mse_mean']=float(np.mean(group.rmse**2))
        rows.append(record)
    return rows


def evaluate(predictions,metric_rows,zone,split,units,provenance,threshold,key,block,pairs,horizon):
    predictions=predictions.copy();predictions['date_key']=pd.to_datetime(predictions[key].astype(str).str[:10])
    predictions['seed']=predictions.seed.fillna(0).astype(int) if 'seed' in predictions else 0
    actual=predictions.groupby('date_key').actual.first().sort_index()
    valid=actual.notna();actual=actual[valid]
    matrices={};boots={};draws=index_draws(len(actual),block)
    for name,rows in predictions.groupby('model'):
        values=rows.pivot(index='date_key',columns='seed',values='predicted').sort_index().reindex(actual.index)
        if values.isna().any().any():raise ValueError('Missing model output on an available reference date')
        expected_seeds=5 if name in NEURAL else 1
        if values.shape[1]!=expected_seeds:raise ValueError('Incomplete seed grid')
        matrices[name]=values.to_numpy()-actual.to_numpy()[:,None]
        boots[name]=boot_model(matrices[name],draws,actual.to_numpy(),threshold)
    records=summaries(metric_rows,zone,split,units,provenance)
    for row in records:
        for metric in ('mae','rmse','peak_mae'):
            finite=boots[row['model']][metric];finite=finite[np.isfinite(finite)]
            row[metric+'_time_ci_low']=float(np.quantile(finite,.025)) if len(finite) else np.nan
            row[metric+'_time_ci_high']=float(np.quantile(finite,.975)) if len(finite) else np.nan
        row.update(horizon=horizon,bootstrap_block_positions=block,bootstrap_repetitions=2000,
            bootstrap_unit='ordered available reference dates' if key=='date' else 'ordered available outage origins',
            time_interval_conditioning='fixed trained seeds; same sampled positions for all compared models')
    comparisons=[]
    for candidate,comparator in pairs:
        if candidate==comparator:continue
        row={'zone':zone,'evaluation':split,'horizon':horizon,'candidate':candidate,'comparator':comparator,
            'units':units,'observations':len(actual),'bootstrap_block_positions':block,'bootstrap_repetitions':2000,
            'conditioning':'time resampling conditional on the five fitted seeds; no independent-seed significance claim'}
        for metric in ('mae','rmse','mse'):
            differences=boots[candidate][metric]-boots[comparator][metric]
            if metric=='mae':point=abs(matrices[candidate]).mean()-abs(matrices[comparator]).mean()
            elif metric=='mse':point=(matrices[candidate]**2).mean()-(matrices[comparator]**2).mean()
            else:point=np.sqrt(np.mean(matrices[candidate]**2,axis=0)).mean()-np.sqrt(np.mean(matrices[comparator]**2,axis=0)).mean()
            row[metric+'_difference']=float(point);row[metric+'_ci_low']=float(np.quantile(differences,.025));row[metric+'_ci_high']=float(np.quantile(differences,.975))
        comparisons.append(row)
    return records,comparisons


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--input-dir',type=Path,default=ROOT/'analysis/kaggle_intake_20261123')
    parser.add_argument('--output-dir',type=Path,default=ROOT/'analysis/final_revision_20261123/task2');args=parser.parse_args()
    out=args.output_dir;out.mkdir(parents=True,exist_ok=True)
    forecast=[];outage=[];pairs=[];coverage=[];weights=[];sensitivity=[];quantisation=[];runtimes=[];audit=[];input_hashes={}
    for zone in ZONES:
        path=args.input_dir/zone;run=json.loads((path/'run_manifest.json').read_text());m=run['manifest']
        result=json.loads((path/'manuscript_results.json').read_text());data=json.loads((path/'data_audit.json').read_text())[0]
        if not result['audited'] or not result['publication_eligible']:raise ValueError('Require audited completed physical results')
        for name in ('forecasting_metrics.csv','neural_metrics.csv','baseline_predictions.csv','per_seed_predictions.csv','forecast_combination_weights.csv','covariance_shrinkage_sensitivity.csv','quantisation_equivalence.csv'):
            actual_hash=digest(path/name)
            if actual_hash!=result['artifacts'][name]['sha256']:raise ValueError(f'Input artefact changed: {zone} {name}')
            input_hashes[f'{zone}/{name}']=actual_hash
        outage_audit=audit_outage(path);audit.append(outage_audit)
        target=m['zones'][0]['target_metadata'];units=target['units'];provenance=m['provenance_class']
        coverage.append({'zone':zone,'units':units,'provenance':provenance,'validation_selected_baseline':data['selected_validation_baseline'],
            'train_rows':data['split_rows']['train'],'validation_rows':data['split_rows']['validation'],'test_rows':data['split_rows']['test'],
            'train_observed':data['split_observed_target_rows']['train'],'validation_observed':data['split_observed_target_rows']['validation'],
            'test_observed':data['split_observed_target_rows']['test'],'scheduled_outage_origins':outage_audit['scheduled_origins'],
            'outage_observed_by_horizon':json.dumps(outage_audit['observed_origins_by_horizon']),
            'peak_threshold_from_training':data['peak_threshold_from_training']})
        metric=pd.concat([pd.read_csv(path/'forecasting_metrics.csv'),pd.read_csv(path/'neural_metrics.csv')])
        pred=pd.concat([pd.read_csv(path/'baseline_predictions.csv'),pd.read_csv(path/'per_seed_predictions.csv')])
        comparators=list(dict.fromkeys([data['selected_validation_baseline'],'persistence','moving_average','seasonal_persistence','seasonal_decomposition']))
        candidates=(*NEURAL,'expected_mse_ensemble','equal_weight_ensemble')
        primary_pairs=[(candidate,comparator) for candidate in candidates for comparator in comparators if candidate!=comparator]
        primary_pairs += [('ta_lstm','lstm_no_attention'),('ta_lstm_outage','ta_lstm'),('ta_lstm_outage','lstm_no_attention')]
        for split in ('validation','test'):
            selected=metric[metric['split']==split];raw=pred[pred['split']==split]
            raw=raw.assign(date_key=raw.date.astype(str).str[:10],seed=raw.seed.fillna(0).astype(int))
            for row in selected.fillna({'seed':0}).to_dict('records'):
                values=raw[(raw.model==row['model'])&(raw.seed==int(row['seed']))]
                calc=calculate(values.actual.to_numpy(),values.predicted.to_numpy(),data['peak_threshold_from_training'])
                if any(not equal(row[name],value) for name,value in calc.items()):raise ValueError('Primary metric mismatch')
            summaries_,comparison_=evaluate(raw,selected,zone,split,units,provenance,data['peak_threshold_from_training'],'date',30,primary_pairs if split=='test' else [],1)
            forecast.extend(summaries_);pairs.extend(comparison_)
        om=pd.read_csv(path/'input_outage/outage_metrics.csv');op=pd.read_csv(path/'input_outage/outage_predictions.csv')
        for h in m['outage_horizons']:
            outage_pairs=[('ta_lstm_outage',name) for name in dict.fromkeys(['ta_lstm','lstm_no_attention',*comparators])]
            summaries_,comparison_=evaluate(op[op.horizon==h],om[om.horizon==h],zone,'input_outage',units,provenance,
                data['peak_threshold_from_training'],'origin',math.ceil(m['bootstrap_block_length']/m['outage_origin_stride']),outage_pairs,h)
            outage.extend(summaries_);pairs.extend(comparison_)
        for name,collector in [('forecast_combination_weights.csv',weights),('covariance_shrinkage_sensitivity.csv',sensitivity),('quantisation_equivalence.csv',quantisation)]:
            records=pd.read_csv(path/name).to_dict('records')
            for record in records:record.update(units=units,provenance=provenance)
            collector.extend(records)
        outmeta=json.loads((path/'input_outage/outage_manifest.json').read_text())
        runtimes.append({'zone':zone,'primary_minutes':(datetime.fromisoformat(run['completed_at_utc'])-datetime.fromisoformat(run['started_at_utc'])).total_seconds()/60,
            'outage_minutes_after_primary':(datetime.fromisoformat(outmeta['completed_at_utc'])-datetime.fromisoformat(run['completed_at_utc'])).total_seconds()/60,
            'training_execution':json.dumps(run.get('training_execution',{'strategy':'single GPU canonical'}))})
        print(f'Completed statistical audit and summaries: {zone}',flush=True)
    tables={'forecast_summary.csv':forecast,'outage_summary.csv':outage,'paired_comparisons.csv':pairs,'coverage.csv':coverage,
        'combination_weights.csv':weights,'shrinkage_sensitivity.csv':sensitivity,'quantisation_summary.csv':quantisation,'runtime_summary.csv':runtimes}
    for name,records in tables.items():pd.DataFrame(records).to_csv(out/name,index=False)
    report={'passed':True,'regions_or_gauges':6,'trained_models':90,'forecast_summary_rows':len(forecast),'outage_summary_rows':len(outage),
        'paired_comparisons':len(pairs),'independent_outage_audits':audit,'input_hashes':input_hashes,
        'outputs':{name:digest(out/name) for name in tables},'analysis_source_sha256':digest(Path(__file__)),
        'no_retraining':True,'units_never_pooled':True,
        'interval_definition':'2,000 paired circular-block resamples of ordered available references: 30 daily positions or 5 outage-origin positions; seed SD is separate; missing labels are not filled'}
    (out/'statistical_audit.json').write_text(json.dumps(report,indent=2,allow_nan=False),encoding='utf-8')
    print(json.dumps({key:report[key] for key in ('passed','trained_models','forecast_summary_rows','outage_summary_rows','paired_comparisons')},indent=2))


if __name__=='__main__':main()
