"""Compare a plain one-day LSTM with and without antecedent rain at USGS 06903900.

Obtain the pinned source archive with acquire_waterbench_reference.py.
Run with the TensorFlow and scientific Python packages listed in the saved
report. Set TF_ENABLE_ONEDNN_OPTS=0 and PYTHONHASHSEED=42 before launching
to match the reported CPU run.
"""
from __future__ import annotations

import argparse
from hashlib import sha256
from importlib.metadata import version
import json
import os
from pathlib import Path
import platform
from zipfile import ZipFile

import numpy as np
import pandas as pd

import revision_experiments as forecast

ROOT = Path(__file__).resolve().parents[1]
ZONE_ID = "USGS_06903900"
RAIN_FEATURES = ["daily_precipitation_mm", "precipitation_available"]


def daily_precipitation(archive: Path, ifc_id: str, dates: pd.DatetimeIndex) -> pd.Series:
    member = f"data_time_series/{ifc_id}_data.csv"
    with ZipFile(archive) as raw, raw.open(member) as stream:
        hourly = pd.read_csv(stream, usecols=["datetime", "precipitation"], parse_dates=["datetime"])
    hourly = hourly.set_index("datetime").sort_index()["precipitation"]
    expected = pd.date_range(dates[0], dates[-1] + pd.Timedelta(hours=23), freq="h")
    if not hourly.index.equals(expected):
        raise ValueError("WaterBench hours differ from the complete source-day grid")
    valid_hourly = hourly.where(np.isfinite(hourly) & (hourly >= 0))
    return valid_hourly.resample("D").sum(min_count=24)


def fit_and_predict(arrays, manifest, seed):
    keras = forecast.keras
    keras.backend.clear_session()
    forecast.set_seed(seed)
    training = manifest["training"]
    model = forecast.build_neural_model(
        lookback=manifest["lookback"],
        feature_count=len(arrays["feature_columns"]),
        lstm_units=training["lstm_units"],
        attention_units=training["attention_units"],
        dropout=training["dropout"],
        use_attention=False,
        unroll_lstm=training["unroll_lstm"],
    )
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=training["learning_rate"], clipnorm=1.0),
        loss="mse",
        metrics=["mae"],
    )
    early_stop = keras.callbacks.EarlyStopping(
        monitor="val_mae",
        patience=training["early_stopping_patience"],
        restore_best_weights=True,
    )
    history = model.fit(
        arrays["x_train"],
        arrays["y_train"],
        validation_data=(arrays["x_validation"], arrays["y_validation"]),
        epochs=training["epochs"],
        batch_size=training["batch_size"],
        callbacks=[early_stop],
        verbose=0,
        shuffle=False,
    ).history
    scaled = model.predict(arrays["x_test"], batch_size=training["batch_size"], verbose=0)
    unbounded = forecast.inverse_target(scaled, arrays["target_scaler"])
    predicted, _ = forecast.constrain_prediction_array(unbounded, manifest["prediction_bounds"])
    return predicted, len(history["val_mae"]), int(np.argmin(history["val_mae"])) + 1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=ROOT)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    repo = args.repo.resolve()
    data_root = repo / "data" / "waterbench_observed"
    manifest_path = data_root / "prepared" / "experiment_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    receipt = json.loads((data_root / "raw" / "acquisition_receipt.json").read_text(encoding="utf-8"))
    archive = data_root / "raw" / "data_time_series.zip"
    archive_hash = forecast.file_sha256(archive)
    if archive_hash != receipt["download_sha256"]:
        raise ValueError("WaterBench archive differs from the pinned source")
    zone = next(item for item in manifest["zones"] if item["id"] == ZONE_ID)
    audit = json.loads((data_root / "prepared" / "preparation_audit.json").read_text(encoding="utf-8"))
    station = next(item["source_station"] for item in audit["zones"] if item["zone"] == ZONE_ID)
    frame, zone_audit = forecast.load_zone(repo, zone, manifest["splits"])
    daily_rain = daily_precipitation(archive, station["ifc_id"], frame.index)
    frame[RAIN_FEATURES[0]] = daily_rain.fillna(0.0)
    frame[RAIN_FEATURES[1]] = daily_rain.notna().astype(int)
    # The mask distinguishes missing daily totals from recorded dry days.
    control_features = zone_audit["feature_columns_used"]
    variants = {
        "no_precipitation": (control_features, zone["fixed_range_features"]),
        "with_precipitation": (control_features + RAIN_FEATURES, zone["fixed_range_features"] + [RAIN_FEATURES[1]]),
    }
    prepared = {
        name: forecast.prepare_neural_arrays(
            frame, names, zone["target_column"], manifest["splits"], manifest["lookback"], fixed_ranges,
        )
        for name, (names, fixed_ranges) in variants.items()
    }
    dates = prepared["no_precipitation"]["test_dates"]
    if any(not dates.equals(arrays["test_dates"]) for arrays in prepared.values()):
        raise ValueError("The two variants must use the same observed target days")
    discharge = frame[zone["target_column"]]
    observed = discharge.loc[dates]
    previous = discharge.shift(1).loc[dates]
    pairs = pd.concat([observed, previous], axis=1).dropna()
    persistence = frame[zone["target_input_column"]].shift(1).loc[dates]
    peak_threshold = float(discharge.loc[:manifest["splits"]["train_end"]].quantile(manifest["peak_quantile_from_training"]))

    tf = forecast.tf
    if tf is None:
        raise RuntimeError("TensorFlow is required for the precipitation comparison")
    tf.config.set_visible_devices([], "GPU")
    tf.config.threading.set_intra_op_parallelism_threads(2)
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.experimental.enable_op_determinism()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    seeds = manifest["training"]["seeds"]
    bootstrap_repetitions = 2000
    bootstrap_block_length = manifest["bootstrap_block_length"]
    predictions = pd.DataFrame({"observed_m3s": observed, "persistence_m3s": persistence}, index=dates)
    metrics = {}
    mean_daily_loss = {}
    for name, arrays in prepared.items():
        seed_rows = []
        daily_losses = []
        for seed in seeds:
            print(f"Training {ZONE_ID} {name}, seed {seed}", flush=True)
            values, epochs, best_epoch = fit_and_predict(arrays, manifest, seed)
            per_day = pd.Series(values, index=dates)
            losses = (per_day - observed).abs()
            daily_losses.append(losses.to_numpy())
            row = forecast.compute_metrics(
                ZONE_ID, name, "test", observed, per_day, peak_threshold,
                bootstrap_repetitions, seed, bootstrap_block_length,
            )
            seed_rows.append({
                "seed": seed, "epochs": epochs, "best_epoch": best_epoch,
                **{k: getattr(row, k) for k in ("mae", "rmse", "mean_bias", "nse", "kge", "peak_mae")},
            })
            predictions[f"{name}_seed_{seed}_m3s"] = per_day
            print(f"Finished {name}, seed {seed}, {epochs} epochs, MAE {row.mae:.4f}", flush=True)
        mean_daily_loss[name] = np.mean(daily_losses, axis=0)
        frame_metrics = pd.DataFrame(seed_rows)
        metrics[name] = {
            "per_seed": seed_rows,
            "mean": frame_metrics.drop(columns=["seed", "epochs", "best_epoch"]).mean().to_dict(),
            "sample_sd": frame_metrics.drop(columns=["seed", "epochs", "best_epoch"]).std().to_dict(),
        }

    delta = mean_daily_loss["with_precipitation"] - mean_daily_loss["no_precipitation"]
    interval = forecast.block_bootstrap_interval(
        np.zeros(len(delta)), delta, lambda _, differences: float(differences.mean()),
        bootstrap_repetitions, 42, bootstrap_block_length,
    )
    predictions.to_csv(args.output_dir / "test_predictions.csv", index_label="date", lineterminator="\n")
    source_hashes = {
        path.relative_to(repo).as_posix(): sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
        for path in [manifest_path, repo / zone["file"], Path(forecast.__file__).resolve()]
    }
    report = {
        "station": ZONE_ID,
        "design": "Paired exploratory one-day hindcast, plain LSTM, standard Iowa splits and hyperparameters, identical reference dates.",
        "forecast_inputs": {name: names for name, (names, _) in variants.items()},
        "precipitation_processing": "Sum of 24 finite nonnegative hourly catchment averages, with zero plus availability mask on incomplete source days. The 30-day sequence ends the day before the target.",
        "precipitation_incomplete_days": int(daily_rain.isna().sum()),
        "precipitation_incomplete_dates": [str(date.date()) for date in daily_rain.index[daily_rain.isna()]],
        "source_archive_sha256": archive_hash,
        "source_hashes_lf_normalized": source_hashes,
        "script_sha256_lf_normalized": sha256(Path(__file__).read_bytes().replace(b"\r\n", b"\n")).hexdigest(),
        "forecast_settings": {key: manifest[key] for key in ("splits", "lookback", "training", "prediction_bounds")},
        "software": {"python": platform.python_version(), **{
            name: version(name) for name in ("tensorflow", "keras", "numpy", "pandas", "scipy", "scikit-learn", "statsmodels")
        }},
        "device": "CPU, TensorFlow deterministic ops, two intra-op threads and one inter-op thread",
        "tf_enable_onednn_opts": os.environ.get("TF_ENABLE_ONEDNN_OPTS"),
        "observed_test_days": len(dates),
        "peak_threshold_m3s": peak_threshold,
        "peak_test_days": int((observed >= peak_threshold).sum()),
        "adjacent_observed_pairs": len(pairs),
        "lag1_pearson_r": float(pairs.iloc[:, 0].corr(pairs.iloc[:, 1])),
        "median_daily_absolute_change_m3s": float((pairs.iloc[:, 0] - pairs.iloc[:, 1]).abs().median()),
        "persistence_mae_m3s": float((observed - persistence).abs().mean()),
        "variants": metrics,
        "with_minus_without_precipitation_mae_m3s": {
            "point": float(delta.mean()), "interval_95": interval,
            "interval_method": "Paired circular block bootstrap of daily absolute-loss differences averaged across the fixed paired fits.",
            "block_length_observed_dates": bootstrap_block_length,
            "repetitions": bootstrap_repetitions, "seed": 42,
        },
        "test_predictions_sha256_lf_normalized": forecast.file_sha256(args.output_dir / "test_predictions.csv"),
    }
    forecast.write_json(args.output_dir / "iowa_precipitation_check.json", report)
    print(json.dumps({"variants": {name: stat["mean"] for name, stat in metrics.items()},
                      "difference": report["with_minus_without_precipitation_mae_m3s"]}, indent=2), flush=True)


if __name__ == "__main__":
    main()
