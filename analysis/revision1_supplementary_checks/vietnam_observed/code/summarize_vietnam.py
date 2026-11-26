"""Audit held-out forecasts and compute comparable metrics and paired intervals."""
import argparse
from hashlib import sha256
import json
from pathlib import Path

import numpy as np
import pandas as pd

import revision_experiments as forecast


def metrics(test, threshold):
    a=test.observed.to_numpy()
    p=test.predicted.to_numpy()
    assert len(a)==len(p) and np.isfinite(a).all() and np.isfinite(p).all()
    absolute=np.abs(p-a)
    sq=(p-a)**2
    corr=np.corrcoef(a,p)[0,1] if p.std()>0 and a.std()>0 else np.nan
    alpha=p.std()/a.std()
    beta=p.mean()/a.mean()
    peak_mask=a>=threshold
    return {"observations":len(a), "mae":float(absolute.mean()), "rmse":float(np.sqrt(sq.mean())),
            "bias":float((p-a).mean()),"nse":float(1-sq.sum()/((a-a.mean())**2).sum()),
            "kge":float(1-np.sqrt((corr-1)**2+(alpha-1)**2+(beta-1)**2)),
            "peak_days":int(peak_mask.sum()),"peak_mae":float(absolute[peak_mask].mean()) if peak_mask.any() else np.nan}


def with_metrics(df, groups, threshold):
    for keys,unit in df.groupby(groups,dropna=False):
        yield dict(zip(groups,keys)),metrics(unit,threshold)


def paired_mae(candidate, comparator, date_key, block):
    def daily_loss(rows):
        error=(rows.observed-rows.predicted).abs()
        return rows.assign(loss=error).groupby(date_key).loss.mean()
    c=daily_loss(candidate)
    b=daily_loss(comparator)
    assert c.index.equals(b.index)
    delta=(c-b).to_numpy()
    rng=np.random.default_rng(42)
    samples=np.array([delta[forecast.circular_block_indices(len(delta),block,rng)].mean() for _ in range(2000)])
    return {"delta_mae_m3s":float(delta.mean()),"ci_95":[float(x) for x in np.quantile(samples,[.025,.975])],
            "n":len(delta),"block_length":block,"repetitions":len(samples),"conditional_on_fits":True}


def summary(rows, groups):
    results=[]
    for keys,frame in rows.groupby(groups,dropna=False):
        keys = keys if isinstance(keys,tuple) else (keys,)
        result=dict(zip(groups,keys))
        result.update(fits=int(frame.seed.notna().sum()),
                      observations=int(frame.observations.iloc[0]),peak_days=int(frame.peak_days.iloc[0]))
        for m in ("mae","rmse","bias","nse","kge","peak_mae"):
            result[m]=float(frame[m].mean())
            if len(frame)>1:
                result[m+"_seed_sd"]=float(frame[m].std())
        results.append(result)
    return pd.DataFrame(results)


def add_stat_prediction_rows(frame, keys):
    base=frame.melt(id_vars=keys,var_name="model",value_name="predicted")
    base["seed"]=np.nan
    return base


def binh_lieu(scratch,out):
    simple=scratch/"binh_lieu_stats_interpolated"
    suite=scratch/"binh_lieu_replay"
    raw=pd.read_csv(scratch/"binh_lieu_daily_2000_2024.csv",parse_dates=["date"]).set_index("date")
    q=raw.discharge_m3s
    threshold=float(q.loc[:"2017-12-31"].quantile(.9))
    nonneural=pd.read_csv(simple/"ordinary_baselines.csv",parse_dates=["origin","target_date"])
    regular=add_stat_prediction_rows(nonneural,["origin","target_date","observed","horizon","split"])
    neural=pd.read_csv(suite/"neural_ordinary.csv",parse_dates=["date"]).rename(columns={"date":"target_date","actual":"observed"})
    neural=neural.drop(columns=["zone"])
    neural["origin"]=neural.target_date-pd.Timedelta(days=1)
    neural["horizon"]=1
    ordinary=pd.concat([regular,neural],ignore_index=True)
    assert len(ordinary)==(1461+1096)*(7+3*5)
    np.testing.assert_allclose(ordinary.observed.to_numpy(),q.reindex(ordinary.target_date).to_numpy(),atol=1e-10)
    for key,val in {"persistence":q.shift(),"moving_average":q.shift().rolling(7).mean(),
                    "seasonal_persistence":q.shift(365)}.items():
        np.testing.assert_allclose(nonneural[key],val.reindex(nonneural.target_date),atol=1e-9)

    outage_file=pd.read_csv(simple/"outage_baselines.csv",parse_dates=["origin","target_date"])
    stats_o=add_stat_prediction_rows(outage_file,["origin","target_date","observed","horizon","split"]).drop(columns=["split"])
    neural_o=pd.read_csv(suite/"neural_outage.csv",parse_dates=["origin","target_date"])
    interruption=pd.concat([stats_o,neural_o],ignore_index=True)
    assert len(interruption)==(7+3*5)*3*208
    np.testing.assert_allclose(interruption.observed.to_numpy(),q.reindex(interruption.target_date).to_numpy(),atol=1e-10)
    h1=interruption[interruption.horizon==1].copy()
    checked=h1.merge(ordinary.drop(columns=["split","origin","horizon","observed"]),
                      on=["model","seed","target_date"],suffixes=("_frozen","_ordinary"),validate="one_to_one")
    assert len(checked)==(7+3*5)*208
    np.testing.assert_allclose(checked.predicted_frozen,checked.predicted_ordinary,atol=2e-4,rtol=2e-5)

    eval_rows=ordinary.loc[ordinary.split=="test"]
    ord_table=pd.DataFrame([dict(keys,**s) for keys,s in with_metrics(eval_rows,["model","seed"],threshold)])
    out_table=pd.DataFrame([dict(keys,**s) for keys,s in with_metrics(interruption,["horizon","model","seed"],threshold)])
    b_ord=summary(ord_table,["model"]).sort_values("mae")
    b_out=summary(out_table,["horizon","model"]).sort_values(["horizon","mae"])
    ensemble=json.loads((simple/"combination.json").read_text(encoding="utf-8"))
    selected=ensemble["selected_baseline"]
    contrasts={}
    for h,case in interruption.groupby("horizon"):
        censored=case[case.model=="ta_lstm_outage"]
        ordinary_lstm=case[case.model=="ta_lstm"]
        contrasts[str(h)]={
           "censored_minus_ta_lstm":paired_mae(censored,ordinary_lstm,"origin",5),
           "censored_minus_validation_selected_baseline":paired_mae(censored,case[case.model==selected],"origin",5),
        }
    ord_pair=paired_mae(eval_rows[eval_rows.model=="ta_lstm"],eval_rows[eval_rows.model=="lstm_no_attention"],"target_date",30)
    p_pair=paired_mae(eval_rows[eval_rows.model=="lstm_no_attention"],eval_rows[eval_rows.model=="persistence"],"target_date",30)
    b_ord.to_csv(out/"binh_lieu_ordinary_metrics.csv",index=False,lineterminator="\n")
    b_out.to_csv(out/"binh_lieu_outage_metrics.csv",index=False,lineterminator="\n")
    predictions=pd.concat([ordinary.assign(protocol="ordinary"),interruption.assign(protocol="frozen")], ignore_index=True)
    predictions.to_csv(out/"binh_lieu_predictions.csv.gz",index=False,lineterminator="\n",compression={"method":"gzip","mtime":0})
    source=json.loads((scratch/"binh_lieu_source_manifest.json").read_text(encoding="utf-8"))
    fits=[json.loads(path.read_text(encoding="utf-8")) for path in sorted((scratch/"binh_lieu_full").glob("*/run.json"))]
    results={
        "input":source,"test_dates":1461,"outage_origins":208,"training_90th_percentile_m3s":threshold,
        "validation_ensemble_and_baseline":ensemble,"recurrent_fits":fits,
        "ordinary_paired_ta_minus_lstm":ord_pair,"ordinary_paired_lstm_minus_persistence":p_pair,
        "outage_paired_contrasts":contrasts,
        "prediction_archive_sha256":sha256((out/"binh_lieu_predictions.csv.gz").read_bytes()).hexdigest(),
    }
    print("ORDINARY ONE-DAY\n"+b_ord[["model","mae","rmse","nse","kge","peak_mae"]].to_string(index=False))
    print("OUTAGE RESULTS\n"+b_out[["horizon","model","mae","rmse","peak_mae"]].to_string(index=False))
    print("CONTRASTS",contrasts,"TA-LSTM - LSTM",ord_pair)
    forecast.write_json(out/"binh_lieu_experiment.json",results)


def north(scratch,out):
    frame=pd.read_csv(scratch/"red_river_daily.csv",parse_dates=["date"]).set_index("date")
    fits=[pd.read_csv(path,parse_dates=["date"]) for path in sorted((scratch/"red_river_fits").glob("red_seed_*.csv"))]
    ml=pd.concat(fits).rename(columns={"actual":"observed","date":"target_date"}).assign(model="lstm_no_attention")
    assert ml.groupby(["station","seed"]).size().eq(366).all() and len(ml)==366*3*5
    all_rows=[]
    summary_rows=[]
    evidence=json.loads((scratch/"red_river_source_manifest.json").read_text(encoding="utf-8"))
    evidence["recurrent_runs"] = [
        json.loads(path.read_text(encoding="utf-8")) for path in sorted((scratch/"red_river_fits").glob("red_seed_*.json"))
    ]
    evidence["forecast_comparison"]={}
    for station,q in frame.items():
        data=ml.loc[ml.station==station].copy()
        test=q.loc["2016"]
        threshold=float(q.loc[:"2008-12-31"].quantile(.9))
        kinds={"persistence":q.shift(),"moving_average":q.shift().rolling(7).mean(),"seasonal_persistence":q.shift(365)}
        stats=pd.DataFrame({name:series.loc[test.index] for name,series in kinds.items()})
        stats["observed"]=test
        stats["target_date"]=test.index
        stats["station"]=station
        mixed=pd.concat([add_stat_prediction_rows(stats,["target_date","observed","station"]),data])
        assert np.isfinite(mixed.predicted).all()
        np.testing.assert_allclose(mixed.observed,test.reindex(mixed.target_date))
        table=pd.DataFrame([dict(keys,**m) for keys,m in with_metrics(mixed,["station","model","seed"],threshold)])
        summary_rows.append(summary(table,["station","model"]))
        compare=mixed[mixed.model=="persistence"]
        evidence["forecast_comparison"][station]={
            "lag_one_pearson_r":float(test.corr(q.shift().loc["2016"])),
            "training_90th_percentile_m3s":threshold,
            "lstm_minus_persistence":paired_mae(data,compare,"target_date",30),
        }
        all_rows.append(mixed)
    ranks=pd.concat(summary_rows)
    ranks.to_csv(out/"red_river_metrics.csv",index=False,lineterminator="\n")
    pd.concat(all_rows).to_csv(out/"red_river_predictions.csv.gz",index=False,lineterminator="\n",
                             compression={"method":"gzip","mtime":0})
    evidence["prediction_archive_sha256"]=sha256((out/"red_river_predictions.csv.gz").read_bytes()).hexdigest()
    forecast.write_json(out/"red_river_experiment.json",evidence)
    print("RED RIVER\n"+ranks[["station","model","mae","rmse","nse","kge"]].to_string(index=False))
    print("LAG 1 AND PAIRED MAE",evidence["forecast_comparison"])


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--case",choices=["binh","red"],required=True)
    args=parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    {"binh":binh_lieu,"red":north}[args.case](args.work,args.out)
