"""Score the manuscript's seven statistical baselines at Binh Lieu."""
import argparse
from concurrent.futures import ProcessPoolExecutor
from functools import partial
import json
from pathlib import Path

import numpy as np
import pandas as pd

import revision_experiments as forecast
from outage_revision_experiments import frozen_baselines

COMPONENTS = ["moving_average", "linear_trend", "seasonal_decomposition"]



def interpolated_stl(history, dates, period):
    # Retain the original robust STL spans and estimate trend/low pass at
    # weekly knots, with the Statsmodels interpolation between knots.
    fitted=forecast.STL(history.to_numpy(float),period=period,robust=True,
                       trend_jump=7, low_pass_jump=7).fit()
    trend=forecast.trend_forecast(pd.Series(fitted.trend[-period:]),dates)
    return trend+np.resize(fitted.seasonal[-period:],len(dates))


def check_stl(q, origin):
    period=365
    past=q.loc[:origin].iloc[-1095:]
    dates=pd.date_range(origin+pd.Timedelta(days=1),periods=7)
    exact=forecast.stl_forecast(past,dates,period)
    approx=interpolated_stl(past,dates,period)
    return [(str(origin.date()),h,float(exact.iloc[h-1]),float(approx.iloc[h-1]))
            for h in (1,3,7)]


def evaluate(q, settings, origins):
    forecast.stl_forecast = interpolated_stl
    values = frozen_baselines(
        q, origins, settings["outage_horizons"], settings["seasonal_period"],
        settings["moving_average_window"], settings["baseline_history_window"], "D",
    )
    bounds = forecast.resolve_prediction_bounds(settings)
    return pd.concat([
        pd.DataFrame({name: forecast.constrain_prediction_array(arr, bounds)[0] for name, arr in columns.items()},
                     index=origins).assign(horizon=lead)
        for lead, columns in values.items()
    ])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--daily", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()
    settings = json.loads(Path("data/runoff_revision/experiment_manifest.json").read_text(encoding="utf-8"))
    q = pd.read_csv(args.daily, parse_dates=["date"]).set_index("date")["discharge_m3s"]
    validation_start = pd.Timestamp(settings["splits"]["train_end"]) + pd.Timedelta(days=1)
    test_start = pd.Timestamp(settings["splits"]["validation_end"]) + pd.Timedelta(days=1)
    origins = q.loc[validation_start-pd.Timedelta(days=1):q.index[-1]-pd.Timedelta(days=1)].index
    batches = [origins[i:i+24] for i in range(0, len(origins), 24)]
    results = []
    args.out.mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for i, batch in enumerate(pool.map(partial(evaluate, q, settings), batches)):
            results.append(batch)
            if (i+1)%10==0 or i==0:
                print(f"Completed {min((i+1)*24,len(origins))}/{len(origins)} statistical forecast origins.",flush=True)

    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        anchors=pd.DatetimeIndex([d for d in origins if d.day==1])
        samples=list(pool.map(partial(check_stl,q),anchors))
    diagnostic=pd.DataFrame([item for group in samples for item in group],columns=["origin","horizon","exact","interpolated"])
    diagnostic["absolute_difference"]=(diagnostic.exact-diagnostic.interpolated).abs()
    diagnostic.to_csv(args.out/"stl_interpolation_check.csv",index=False,lineterminator="\n")
    print("STL interpolation check",diagnostic.groupby("horizon").absolute_difference.agg(["mean","max"]).to_dict(),flush=True)
    fitted = pd.concat(results)
    fitted.index.name = "origin"
    fitted = fitted.reset_index()
    fitted["target_date"] = fitted.origin + pd.to_timedelta(fitted.horizon, unit="D")
    fitted["observed"] = q.reindex(fitted.target_date).to_numpy()
    val = fitted.loc[(fitted.horizon == 1) & (fitted.target_date < test_start)]
    val_errors = val[COMPONENTS].to_numpy() - val.observed.to_numpy()[:, None]
    weights, bias, cov = forecast.expected_mse_weights(val_errors, settings["covariance_shrinkage"])
    fitted["equal_weight_ensemble"] = fitted[COMPONENTS].mean(axis=1)
    fitted["expected_mse_ensemble"] = fitted[COMPONENTS].to_numpy() @ weights
    fitted["split"] = np.where(fitted.target_date < test_start, "validation", "test")
    ordinary = fitted.loc[fitted.horizon == 1].copy()
    assert ordinary.groupby("split").size().to_dict() == {"test":1461,"validation":1096}
    ordinary.to_csv(args.out/"ordinary_baselines.csv", index=False,lineterminator="\n")
    val = ordinary.loc[ordinary.split == "validation"]
    methods = [col for col in val.columns if col not in ("origin","target_date","observed","horizon","split")]
    valid_mae = {name:float((val[name]-val.observed).abs().mean()) for name in methods}
    selected = min(methods, key=valid_mae.get)
    gap_ends = q.loc[test_start:].index[::settings["outage_origin_stride"]] - pd.Timedelta(days=1)
    gap_ends = gap_ends[gap_ends + pd.Timedelta(days=max(settings["outage_horizons"])) <= q.index[-1]]
    gap = fitted.loc[fitted.origin.isin(gap_ends)].sort_values(["horizon","origin"])
    assert gap.groupby("horizon").size().to_dict() == {1:208,3:208,7:208}
    gap.to_csv(args.out/"outage_baselines.csv",index=False,lineterminator="\n")
    forecast.write_json(args.out/"combination.json",{
        "components":COMPONENTS,"weights":weights.tolist(),"bias":bias.tolist(),
        "covariance":cov.tolist(),"shrinkage":settings["covariance_shrinkage"],
        "val_mae":valid_mae,"selected_baseline":selected,
        "outage_origins":len(gap_ends),
        "stl_interpolation":{"seasonal_jump":1,"trend_jump":7,"low_pass_jump":7,"validation_check_origins":len(anchors),
                             "mean_and_max_absolute_difference_m3s_by_horizon":diagnostic.groupby("horizon").absolute_difference.agg(["mean","max"]).to_dict()},
    })
    print("Finished the seven baselines and validation weights.",flush=True)


if __name__ == "__main__":
    main()
