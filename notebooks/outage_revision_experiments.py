"""Evaluate forecasts with inputs frozen at explicit origins; no future covariates are supplied."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

import revision_experiments as exp

def future_date(origin: pd.Timestamp, lead: int, frequency: str) -> pd.Timestamp:
    return origin + (pd.Timedelta(days=lead) if frequency == "D" else pd.DateOffset(months=lead))

def calendar_values(date: pd.Timestamp, frequency: str) -> dict:
    if frequency == "D":
        phase = (date.dayofyear - 1) / (366 if date.is_leap_year else 365)
        names = ("annual_sin", "annual_cos")
    else:
        phase = date.month / 12
        names = ("month_sin", "month_cos")
    return {names[0]: np.sin(2 * np.pi * phase), names[1]: np.cos(2 * np.pi * phase)}

def frozen_baselines(target: pd.Series, origins: pd.DatetimeIndex, horizons: list[int],
                     period: int, average_window: int, history_window: int | None,
                     frequency: str) -> dict:
    results = {lead: {name: [] for name in ("persistence", "seasonal_persistence", "moving_average",
               "linear_trend", "seasonal_decomposition")} for lead in horizons}
    for origin in origins:
        history = target.loc[:origin].ffill().dropna().astype(float)
        if history_window is not None:
            history = history.iloc[-history_window:]
        dates = pd.DatetimeIndex([future_date(origin, lead, frequency) for lead in range(1, max(horizons) + 1)])
        if len(history) < 2 * period:
            raise ValueError("Each outage origin needs two seasonal cycles of past data")
        trend = exp.trend_forecast(history, dates)
        seasonal = exp.stl_forecast(history, dates, period)
        for lead in horizons:
            season_date = future_date(dates[lead - 1], -period, frequency)
            if season_date > origin or season_date not in target.index:
                raise ValueError("Seasonal persistence would require unavailable data")
            seasonal_reference = target.loc[:season_date].ffill().dropna()
            values = {"persistence": history.iloc[-1], "seasonal_persistence": seasonal_reference.iloc[-1],
                      "moving_average": history.iloc[-average_window:].mean(),
                      "linear_trend": trend.iloc[lead - 1], "seasonal_decomposition": seasonal.iloc[lead - 1]}
            for model, value in values.items():
                results[lead][model].append(float(value))
    return {lead: {model: np.asarray(values) for model, values in models.items()} for lead, models in results.items()}

def frozen_neural(frame: pd.DataFrame, feature_columns: list[str], target_column: str,
                  origins: pd.DatetimeIndex, horizons: list[int], lookback: int,
                  feature_scaler, target_scaler, predictor, frequency: str,
                  bounds: dict, target_input_column: str | None = None,
                  availability_columns: list[str] | None = None, age_column: str | None = None,
                  maximum_age_steps: int = 7, rollout_policy: str = "recursive") -> dict[int, np.ndarray]:
    """Batch recursive predictions; future physical values are never read from frame."""
    input_column = target_input_column or target_column
    if input_column not in feature_columns:
        raise ValueError("Recursive outage evaluation requires the lagged target channel")
    histories, last_rows = [], []
    for origin in origins:
        history = frame.loc[:origin, feature_columns].iloc[-lookback:]
        if len(history) != lookback or history.index[-1] != origin:
            raise ValueError("The declared forecast origin must exist with a full lookback")
        histories.append(feature_scaler.transform(history))
        last_rows.append(history.iloc[-1].to_numpy(dtype=float))
    sequences = np.asarray(histories, dtype=np.float32)
    held_physical_rows = np.asarray(last_rows, dtype=float)
    target_position = feature_columns.index(input_column)
    output = {}
    for lead in range(1, max(horizons) + 1):
        scaled = np.asarray(predictor(sequences), dtype=float).reshape(-1)
        if len(scaled) != len(origins) or not np.isfinite(scaled).all():
            raise ValueError("Invalid batch prediction from outage model")
        physical, _ = exp.constrain_prediction_array(exp.inverse_target(scaled, target_scaler), bounds)
        if lead in horizons:
            output[lead] = physical.copy()
        next_rows = held_physical_rows.copy()
        if rollout_policy == "recursive":
            next_rows[:, target_position] = physical
        elif rollout_policy != "frozen":
            raise ValueError("Unknown physical input rollout policy")
        for name in availability_columns or []:
            next_rows[:, feature_columns.index(name)] = 0.
        if age_column:
            position = feature_columns.index(age_column)
            next_rows[:, position] = np.minimum(1., held_physical_rows[:, position] + lead / maximum_age_steps)
        for i, origin in enumerate(origins):
            for name, value in calendar_values(future_date(origin, lead, frequency), frequency).items():
                next_rows[i, feature_columns.index(name)] = value
        # Exogenous precipitation, soil water and temperature are held at their
        # last known values. Calendar phase is known; target is recursively predicted.
        next_frame = pd.DataFrame(next_rows, columns=feature_columns)
        scaled_rows = feature_scaler.transform(next_frame).astype(np.float32)
        sequences = np.concatenate([sequences[:, 1:, :], scaled_rows[:, None, :]], axis=1)
    return output

def run(manifest_path: Path, forecast_dir: Path, output: Path, skip_neural: bool,
        repetitions: int) -> dict:
    root = Path(__file__).resolve().parents[1]
    manifest = exp.load_manifest(manifest_path)
    if manifest["provenance_class"] == "synthetic":
        raise ValueError("The manuscript outage run requires a physical observed or reanalysis dataset")
    evidence = exp.validate_evidence_contract(root, manifest)
    forecast_run = json.loads((forecast_dir / "run_manifest.json").read_text(encoding="utf-8"))
    if forecast_run["status"] != "completed" or forecast_run["manifest"] != manifest:
        raise ValueError("Outage evaluation requires the completed matching primary forecasting run")
    weights_frame = pd.read_csv(forecast_dir / "forecast_combination_weights.csv")
    output.mkdir(parents=True, exist_ok=True)
    horizons = [int(value) for value in manifest["outage_horizons"]]
    if not horizons or min(horizons) < 1:
        raise ValueError("Positive, pre-specified outage horizons are required")
    raw_rows, metric_rows, pending = [], [], []
    for zone in manifest["zones"]:
        frame, audit = exp.load_zone(root, zone, manifest["splits"])
        frequency = zone.get("sampling_frequency", "MS")
        test = frame.loc[frame.index > pd.Timestamp(manifest["splits"]["validation_end"])].index
        origins = pd.DatetimeIndex([future_date(date, -1, frequency) for date in test[::int(manifest["outage_origin_stride"])]])
        origins = pd.DatetimeIndex([origin for origin in origins if future_date(origin, max(horizons), frequency) <= frame.index[-1]])
        baselines = frozen_baselines(frame[zone["target_column"]], origins, horizons,
            int(manifest["seasonal_period"]), int(manifest["moving_average_window"]),
            manifest.get("baseline_history_window"), frequency)
        components = ["moving_average", "linear_trend", "seasonal_decomposition"]
        weights = weights_frame.loc[weights_frame["zone"] == zone["id"]].set_index("model")["weight"].reindex(components).to_numpy()
        if not np.isfinite(weights).all() or not np.isclose(weights.sum(), 1):
            raise ValueError("Invalid frozen validation weights")
        predictions = {}
        bounds = exp.resolve_prediction_bounds(manifest)
        for lead, values in baselines.items():
            values = {name: exp.constrain_prediction_array(array, bounds)[0] for name, array in values.items()}
            matrix = np.column_stack([values[name] for name in components])
            values["equal_weight_ensemble"] = matrix.mean(axis=1)
            values["expected_mse_ensemble"] = matrix @ weights
            for model, array in values.items():
                predictions[(model, None, lead)] = array
        if skip_neural:
            pending.append({"zone": zone["id"], "reason": "neural outage evaluation was explicitly skipped"})
        else:
            if exp.tf is None:
                raise RuntimeError("The locked TensorFlow environment is required")
            arrays = exp.prepare_neural_arrays(frame, audit["feature_columns_used"], zone["target_column"], manifest["splits"], int(manifest["lookback"]), zone.get("fixed_range_features"))
            model_names = ["ta_lstm", "lstm_no_attention"] + (["ta_lstm_outage"] if manifest["training"].get("include_outage_variant") else [])
            for model_name in model_names:
                for seed in manifest["training"]["seeds"]:
                    path = forecast_dir / "models" / zone["id"] / f"{model_name}_seed_{seed}.keras"
                    model = exp.keras.models.load_model(path, compile=False)
                    def predict(batch):
                        return np.concatenate([model(batch[i:i + 256], training=False).numpy().reshape(-1)
                                               for i in range(0, len(batch), 256)])
                    values = frozen_neural(frame, audit["feature_columns_used"], zone["target_column"], origins, horizons,
                        int(manifest["lookback"]), arrays["feature_scaler"], arrays["target_scaler"], predict, frequency, bounds,
                        zone.get("target_input_column"), zone.get("availability_feature_columns"), zone.get("age_feature_column"),
                        int(manifest.get("outage_max_gap", 7)), manifest.get("outage_input_policy", "recursive"))
                    for lead, array in values.items():
                        predictions[(model_name, int(seed), lead)] = array
                    exp.keras.backend.clear_session()
        threshold = frame.loc[:manifest["splits"]["train_end"], zone["target_column"]].quantile(manifest["peak_quantile_from_training"])
        for (model, seed, lead), array in predictions.items():
            dates = pd.DatetimeIndex([future_date(origin, lead, frequency) for origin in origins])
            actual = frame.loc[dates, zone["target_column"]]
            forecast = pd.Series(array, index=dates)
            observed_mask = actual.notna()
            block_length = max(1, math.ceil(int(manifest["bootstrap_block_length"]) / int(manifest["outage_origin_stride"])))
            metric = exp.asdict(exp.compute_metrics(zone["id"], model, "input_outage", actual.loc[observed_mask], forecast.loc[observed_mask], float(threshold), repetitions, 4242, block_length))
            metric.update(seed=seed, horizon=lead, frequency=frequency, origin_stride=manifest["outage_origin_stride"],
                          uncertainty_unit="ordered outage origins; circular blocks", bootstrap_block_origins=block_length)
            metric_rows.append(metric)
            for origin, date, observed, predicted in zip(origins, dates, actual.to_numpy(), array):
                raw_rows.append({"zone": zone["id"], "model": model, "seed": seed, "horizon": lead,
                    "origin": origin.date().isoformat(), "target_date": date.date().isoformat(),
                    "actual": float(observed) if np.isfinite(observed) else None, "target_observed": bool(np.isfinite(observed)),
                    "predicted": float(predicted), "physical_input_cutoff": origin.date().isoformat(),
                    "units": zone["target_metadata"]["units"]})
    pd.DataFrame(raw_rows).to_csv(output / "outage_predictions.csv", index=False)
    pd.DataFrame(metric_rows).to_csv(output / "outage_metrics.csv", index=False)
    result = {"completed_at_utc": datetime.now(timezone.utc).isoformat(), "primary_run_id": forecast_run["run_id"],
        "manifest_sha256": exp.file_sha256(manifest_path), "code_sha256": exp.file_sha256(Path(__file__)),
        "evidence": evidence, "pending": pending, "neural_complete": not bool(pending),
        "protocol": "Physical inputs stop at each origin; future calendar and input age are known. All physical input values remain frozen under the primary policy. Ensemble weights remain those fitted on validation.",
        "input_rollout_policy": manifest.get("outage_input_policy", "recursive"),
        "interpretation": "Simulated input interruption over retrospective reanalysis, not field outage, live telemetry or a forecasting guarantee.",
        "raw_predictions_sha256": exp.file_sha256(output / "outage_predictions.csv"),
        "metrics_sha256": exp.file_sha256(output / "outage_metrics.csv")}
    exp.write_json(output / "outage_manifest.json", result)
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--forecast-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--skip-neural", action="store_true")
    parser.add_argument("--bootstrap-repetitions", type=int, default=2000)
    args = parser.parse_args()
    print(json.dumps(run(args.manifest, args.forecast_dir, args.output_dir, args.skip_neural, args.bootstrap_repetitions), indent=2))

if __name__ == "__main__":
    main()
