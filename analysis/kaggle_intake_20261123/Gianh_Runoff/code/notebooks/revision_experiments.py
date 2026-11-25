"""Reproducible forecasting experiments for HYDRO-D-26-00188 revision.

The script refuses synthetic publication runs unless --allow-synthetic is set.
All reported outputs are written to machine-readable files for manuscript use.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import os
import platform
import random
import re
import shutil
import subprocess
import sys
import zipfile
from types import SimpleNamespace
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import MinMaxScaler
from statsmodels.tsa.seasonal import STL

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
except ModuleNotFoundError as error:
    if error.name != "tensorflow":
        raise
    tf = keras = layers = None


@dataclass
class MetricRow:
    zone: str
    model: str
    split: str
    observations: int
    mae: float
    rmse: float
    peak_mae: float
    peak_count: int
    peak_mae_ci_low: float
    peak_mae_ci_high: float
    mae_ci_low: float
    mae_ci_high: float
    rmse_ci_low: float
    rmse_ci_high: float
    mean_bias: float
    nse: float
    kge: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--allow-synthetic", action="store_true")
    parser.add_argument("--skip-neural", action="store_true")
    parser.add_argument("--bootstrap-repetitions", type=int, default=2000)
    parser.add_argument("--skip-conversion", action="store_true")
    return parser.parse_args()


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    if tf is None:
        raise RuntimeError("TensorFlow is required for neural training; use --skip-neural for statistical tests")
    keras.utils.set_random_seed(seed)


def json_safe(value):
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    if isinstance(value, (np.integer, np.bool_)):
        return value.item()
    if isinstance(value, (float, np.floating)):
        return float(value) if np.isfinite(value) else None
    if isinstance(value, Path):
        return str(value)
    return value


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".partial")
    temporary.write_text(json.dumps(json_safe(value), indent=2, allow_nan=False), encoding="utf-8")
    temporary.replace(path)


def evidence_path(root: Path, value: str) -> Path:
    path = (root / value).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"Evidence path leaves repository: {value}")
    return path


def git_commit(root: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except Exception:
        return None


def load_manifest(path: Path) -> dict:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    required = [
        "study_id",
        "provenance_class",
        "validation_mode",
        "target_kind",
        "splits",
        "training",
        "zones",
    ]
    missing = [key for key in required if key not in manifest]
    if missing:
        raise ValueError(f"Manifest missing keys: {missing}")
    dates = [pd.Timestamp(manifest["splits"][key]) for key in ("train_end", "validation_end", "test_end")]
    if not dates[0] < dates[1] < dates[2]:
        raise ValueError("Split boundaries must be strictly chronological")
    if int(manifest.get("lookback", 0)) < 1 or int(manifest.get("seasonal_period", 0)) < 2:
        raise ValueError("Positive lookback and seasonal_period >= 2 are required")
    if not 0 < float(manifest.get("peak_quantile_from_training", 0)) < 1:
        raise ValueError("peak_quantile_from_training must lie in (0, 1)")
    if not manifest["zones"] or len({zone["id"] for zone in manifest["zones"]}) != len(manifest["zones"]):
        raise ValueError("Zones must be nonempty and have unique identifiers")
    if any(not re.fullmatch(r"[A-Za-z0-9_-]+", zone["id"]) for zone in manifest["zones"]):
        raise ValueError("Zone identifiers must use only letters, numbers, underscores and hyphens")
    if str(manifest["provenance_class"]).lower() == "synthetic" and manifest.get("publication_eligible"):
        raise ValueError("A synthetic smoke-test manifest cannot be publication-eligible")
    return manifest


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_evidence_contract(repository_root: Path, manifest: dict) -> dict:
    provenance_class = str(manifest["provenance_class"]).strip().lower()
    validation_mode = str(manifest["validation_mode"]).strip().lower()
    allowed_provenance = {
        "synthetic",
        "observed",
        "remote_sensing",
        "reanalysis",
        "mixed_observed_reanalysis",
    }
    allowed_validation_modes = {
        "synthetic_smoke_test",
        "physical_target_replacement",
    }
    if provenance_class not in allowed_provenance:
        raise ValueError(f"Unsupported provenance_class: {provenance_class}")
    if validation_mode not in allowed_validation_modes:
        raise ValueError(f"Unsupported validation_mode: {validation_mode}")
    if provenance_class == "synthetic" and validation_mode != "synthetic_smoke_test":
        raise ValueError("Synthetic inputs must use validation_mode=synthetic_smoke_test")

    evidence = {
        "provenance_class": provenance_class,
        "validation_mode": validation_mode,
        "source_manifest": None,
        "source_manifest_sha256": None,
        "data_files": [],
    }
    if provenance_class != "synthetic":
        source_manifest_value = manifest.get("source_manifest_file")
        if not source_manifest_value:
            raise ValueError("Non-synthetic runs require source_manifest_file")
        source_manifest_path = evidence_path(repository_root, source_manifest_value)
        if not source_manifest_path.exists():
            raise FileNotFoundError(f"Source manifest not found: {source_manifest_path}")
        source_manifest = json.loads(source_manifest_path.read_text(encoding="utf-8"))
        if not source_manifest.get("sources"):
            raise ValueError("source_manifest.json must contain a non-empty sources list")
        evidence["source_manifest"] = str(source_manifest_path)
        evidence["source_manifest_sha256"] = file_sha256(source_manifest_path)
        for field in ("verified_bibliography_file", "data_preparation_audit_file"):
            if not manifest.get(field):
                raise ValueError(f"Non-synthetic runs require {field}")
            reference = evidence_path(repository_root, manifest[field])
            if not reference.is_file():
                raise FileNotFoundError(f"Required evidence file not found: {reference}")
            evidence[field] = {"path": str(reference), "sha256": file_sha256(reference)}
        bibliography = pd.read_csv(evidence["verified_bibliography_file"]["path"])
        if bibliography.empty or "verification_status" not in bibliography or not bibliography["verification_status"].eq("verified").all():
            raise ValueError("The accepted bibliography must contain verified records only")
        preparation_audit = json.loads(Path(evidence["data_preparation_audit_file"]["path"]).read_text(encoding="utf-8"))
        prepared_zones = {record["zone"]: record for record in preparation_audit.get("zones", [])}

    for zone in manifest["zones"]:
        data_path = evidence_path(repository_root, zone["file"])
        if not data_path.exists():
            raise FileNotFoundError(f"Zone data file not found: {data_path}")
        evidence["data_files"].append(
            {"zone": zone["id"], "path": str(data_path), "sha256": file_sha256(data_path)}
        )
        if provenance_class == "synthetic":
            continue
        prepared = prepared_zones.get(zone["id"])
        if not prepared or prepared.get("derived_csv_sha256") != file_sha256(data_path):
            raise ValueError(f"{zone['id']} derived data hash does not match the preparation audit")
        if prepared.get("selection_uses_test_data") is not False:
            raise ValueError(f"{zone['id']} channel selection must explicitly exclude test data")
        if pd.Timestamp(prepared["selection_period_end"]) > pd.Timestamp(manifest["splits"]["train_end"]):
            raise ValueError(f"{zone['id']} channel selection extends beyond training")
        if not prepared.get("download_files"):
            raise ValueError(f"{zone['id']} raw download records are required")
        for record in prepared["download_files"]:
            raw_path = evidence_path(repository_root, record["path"])
            if not raw_path.is_file() or file_sha256(raw_path) != record["sha256"]:
                raise ValueError(f"{zone['id']} raw source hash mismatch: {record['path']}")
            receipt_path = evidence_path(repository_root, record["request_receipt"])
            if not receipt_path.is_file() or file_sha256(receipt_path) != record["request_receipt_sha256"]:
                raise ValueError(f"{zone['id']} request receipt hash mismatch")
            receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
            if receipt.get("download_sha256") != record["sha256"] or receipt.get("request") != record["request"]:
                raise ValueError(f"{zone['id']} raw file does not match its retrieval receipt")
        target_metadata = zone.get("target_metadata")
        feature_metadata = zone.get("feature_metadata")
        if zone.get("allow_missing_targets") and prepared.get("evaluation_target_imputation") != "none":
            raise ValueError(f"{zone['id']} missing reference outcomes must explicitly remain unimputed")
        if not isinstance(target_metadata, dict):
            raise ValueError(f"{zone['id']} requires target_metadata")
        if not isinstance(feature_metadata, dict):
            raise ValueError(f"{zone['id']} requires feature_metadata")
        required_target_metadata = {
            "data_class",
            "variable",
            "units",
            "source_id",
            "source_url",
            "licence",
            "geographic_support",
            "temporal_resolution",
        }
        missing_target = sorted(required_target_metadata - set(target_metadata))
        if missing_target:
            raise ValueError(f"{zone['id']} target_metadata missing: {missing_target}")
        if any(not str(target_metadata[key]).strip() for key in required_target_metadata):
            raise ValueError(f"{zone['id']} target metadata cannot contain empty values")
        for feature in zone["feature_columns"]:
            metadata = feature_metadata.get(feature)
            if not isinstance(metadata, dict):
                raise ValueError(f"{zone['id']} missing feature metadata for {feature}")
            missing_feature = sorted(
                {"data_class", "units", "source_id", "source_url", "licence"} - set(metadata)
            )
            if missing_feature:
                raise ValueError(
                    f"{zone['id']} feature metadata for {feature} missing: {missing_feature}"
                )
        if validation_mode == "physical_target_replacement":
            target_class = str(target_metadata["data_class"]).strip().lower()
            if target_class not in {"observed", "gauge_derived", "remote_sensing", "reanalysis"}:
                raise ValueError(
                    f"{zone['id']} physical target has ineligible data_class={target_class}"
                )
    return evidence


def load_zone(root: Path, zone: dict, splits: dict) -> tuple[pd.DataFrame, dict]:
    data_path = root / zone["file"]
    frame = pd.read_csv(data_path)
    date_column = zone["date_column"]
    target_column = zone["target_column"]
    feature_columns = list(zone["feature_columns"])
    required_columns = [date_column, target_column, *feature_columns]
    missing = [column for column in required_columns if column not in frame.columns]
    if missing:
        raise ValueError(f"{zone['id']} missing columns: {missing}")
    if zone.get("target_metadata"):
        provenance_columns = ["target_type", "observed_or_derived", "target_source_id"]
        if any(column not in frame for column in provenance_columns):
            raise ValueError(f"{zone['id']} requires row-level target provenance columns")
        if frame[provenance_columns].isna().any().any():
            raise ValueError(f"{zone['id']} contains missing target provenance")
        if not frame["target_source_id"].eq(zone["target_metadata"]["source_id"]).all():
            raise ValueError(f"{zone['id']} row-level source identifiers do not match the manifest")
        if zone["target_metadata"]["data_class"] == "reanalysis" and not frame["observed_or_derived"].eq("reanalysis_derived").all():
            raise ValueError(f"{zone['id']} must explicitly identify reanalysis-derived targets")
    if frame.empty:
        raise ValueError(f"{zone['id']} dataset is empty")
    frame[date_column] = pd.to_datetime(frame[date_column], errors="raise")
    duplicate_dates = int(frame[date_column].duplicated().sum())
    if duplicate_dates:
        raise ValueError(f"{zone['id']} has {duplicate_dates} duplicate dates; no silent cleanup is permitted")
    frame = frame.sort_values(date_column).set_index(date_column)
    frequency = zone.get("sampling_frequency", "MS")
    if frequency not in {"MS", "D"}:
        raise ValueError("sampling_frequency must be MS or D")
    if not frame.index.equals(pd.date_range(frame.index.min(), frame.index.max(), freq=frequency)):
        resolution = "calendar-month" if frequency == "MS" else "calendar-day"
        raise ValueError(f"{zone['id']} requires a complete {resolution} series; missing dates are not imputed")
    for column in (target_column, *feature_columns):
        frame[column] = pd.to_numeric(frame[column], errors="raise")
        values = frame[column].to_numpy(dtype=float)
        if column == target_column and zone.get("allow_missing_targets", False):
            if np.isinf(values).any() or not np.isfinite(values).any():
                raise ValueError(f"{zone['id']} has invalid or entirely missing observed targets")
        elif not np.isfinite(values).all():
            raise ValueError(f"{zone['id']} {column} contains missing or infinite values")
    if frequency == "MS":
        phase = frame.index.month / 12
        calendar_columns = ["month_sin", "month_cos"]
    else:
        phase = (frame.index.dayofyear - 1) / np.where(frame.index.is_leap_year, 366, 365)
        calendar_columns = ["annual_sin", "annual_cos"]
    frame[calendar_columns[0]] = np.sin(2 * np.pi * phase)
    frame[calendar_columns[1]] = np.cos(2 * np.pi * phase)
    feature_columns.extend(calendar_columns)
    if zone.get("include_lagged_target", False):
        feature_columns.insert(0, target_column)
    train_end = pd.Timestamp(splits["train_end"])
    validation_end = pd.Timestamp(splits["validation_end"])
    test_end = pd.Timestamp(splits["test_end"])
    train_start = pd.Timestamp(splits.get("train_start", frame.index.min()))
    frame = frame.loc[(frame.index >= train_start) & (frame.index <= test_end)].copy()
    if frame.empty or (frame.index.min() != train_start if frequency == "D" else frame.index.min().to_period("M") != train_start.to_period("M")):
        raise ValueError(f"{zone['id']} does not cover the declared training start")
    train_mask = frame.index <= train_end
    validation_mask = (frame.index > train_end) & (frame.index <= validation_end)
    test_mask = (frame.index > validation_end) & (frame.index <= test_end)
    if not (train_mask.any() and validation_mask.any() and test_mask.any()):
        raise ValueError(f"{zone['id']} must have observations in all three splits")
    covers_test_end = frame.index[-1] == test_end if frequency == "D" else frame.index[-1].to_period("M") == test_end.to_period("M")
    if not covers_test_end:
        raise ValueError(f"{zone['id']} does not cover the complete declared test window")
    for name, metadata in zone.get("feature_metadata", {}).items():
        if name in zone["feature_columns"] and metadata.get("available_at_forecast_origin") is False and metadata.get("availability_mode") != "retrospective_hindcast":
            raise ValueError(f"{zone['id']} predictor {name} is unavailable at the forecast origin")
    audit = {
        "zone": zone["id"],
        "file": str(data_path),
        "source_note": zone.get("source_note"),
        "rows": int(len(frame)),
        "date_start": str(frame.index.min().date()),
        "date_end": str(frame.index.max().date()),
        "missing_by_column": {date_column: int(frame.index.isna().sum()),
                              **{column: int(frame[column].isna().sum()) for column in required_columns if column != date_column}},
        "duplicate_dates_in_input": duplicate_dates,
        "constant_features": [column for column in feature_columns if frame[column].nunique(dropna=True) <= 1],
        "split_rows": {
            "train": int(train_mask.sum()),
            "validation": int(validation_mask.sum()),
            "test": int(test_mask.sum()),
        },
        "split_observed_target_rows": {name: int(frame.loc[mask, target_column].notna().sum()) for name, mask in
                                       (("train", train_mask), ("validation", validation_mask), ("test", test_mask))},
        "split_target_observation_dates": {name: [date.date().isoformat() for date in frame.index[mask & frame[target_column].notna()]] for name, mask in
                                           (("train", train_mask), ("validation", validation_mask), ("test", test_mask))},
        "evaluation_target_imputation": "none",
        "split_dates": {
            name: {"start": frame.index[mask][0].date().isoformat(), "end": frame.index[mask][-1].date().isoformat()}
            for name, mask in (("train", train_mask), ("validation", validation_mask), ("test", test_mask))
        },
        "sampling_frequency": frequency,
        "information_set": "All input values have timestamps strictly before the target; reanalysis availability is retrospective and does not establish real-time telemetry",
        "forecast_horizon": "one day ahead" if frequency == "D" else "one calendar month ahead with observed-history updates",
        "input_availability_modes": {name: metadata.get("availability_mode", "declared_available") for name, metadata in zone.get("feature_metadata", {}).items()},
    }
    reconstruction_features = [column for column in zone["feature_columns"]
                               if column != zone.get("target_input_column") and frame[column].nunique(dropna=True) > 1]
    if reconstruction_features:
        training_frame = frame.loc[train_mask & frame[target_column].notna()]
        reconstruction = LinearRegression().fit(training_frame[reconstruction_features], training_frame[target_column])
        reconstructed = reconstruction.predict(training_frame[reconstruction_features])
        audit["contemporaneous_target_reconstruction_r2"] = float(r2_score(training_frame[target_column], reconstructed))
        audit["reconstruction_check_split"] = "training only; diagnostic, not a forecasting result"
        audit["contemporaneous_target_reconstruction_features"] = reconstruction_features
    else:
        audit["contemporaneous_target_reconstruction_r2"] = None
        audit["contemporaneous_target_reconstruction_features"] = []
    audit["feature_columns_used"] = feature_columns
    return frame, audit


def rolling_persistence(series: pd.Series) -> pd.Series:
    return series.shift(1)


def rolling_seasonal_persistence(series: pd.Series, period: int) -> pd.Series:
    return series.shift(period)


def rolling_average(series: pd.Series, window: int) -> pd.Series:
    return series.shift(1).rolling(window=window, min_periods=1).mean()


def trend_forecast(history: pd.Series, forecast_index: pd.DatetimeIndex) -> pd.Series:
    positions = np.arange(len(history), dtype=float).reshape(-1, 1)
    model = LinearRegression().fit(positions, history.to_numpy(dtype=float))
    future_positions = np.arange(len(history), len(history) + len(forecast_index), dtype=float).reshape(-1, 1)
    return pd.Series(model.predict(future_positions), index=forecast_index)


def stl_forecast(history: pd.Series, forecast_index: pd.DatetimeIndex, period: int) -> pd.Series:
    fitted = STL(history.to_numpy(dtype=float), period=period, robust=True).fit()
    trend_values = fitted.trend
    trend_window = min(max(period, 6), len(trend_values))
    trend_positions = np.arange(trend_window, dtype=float).reshape(-1, 1)
    trend_model = LinearRegression().fit(trend_positions, trend_values[-trend_window:])
    future_positions = np.arange(trend_window, trend_window + len(forecast_index), dtype=float).reshape(-1, 1)
    future_trend = trend_model.predict(future_positions)
    seasonal_cycle = np.asarray(fitted.seasonal[-period:], dtype=float)
    future_seasonal = np.resize(seasonal_cycle, len(forecast_index))
    return pd.Series(future_trend + future_seasonal, index=forecast_index)


def walk_forward_baselines(
    target: pd.Series,
    forecast_index: pd.DatetimeIndex,
    period: int,
    moving_average_window: int = 3,
    history_window: int | None = None,
) -> pd.DataFrame:
    """Generate comparable one-step-ahead forecasts using the same information set.

    Every forecast at time t uses observations strictly earlier than t. Models are
    updated as new observations become available, matching the manuscript's claimed
    sequential one-step forecasting protocol.
    """

    rows: list[dict] = []
    for forecast_date in forecast_index:
        # Missing reference labels remain missing. Only the historical input
        # history is carried forward, using values strictly before the origin.
        history = target.loc[target.index < forecast_date].ffill().dropna().astype(float)
        if history_window is not None:
            if history_window < 2 * period:
                raise ValueError("Baseline history window must retain at least two seasonal cycles")
            history = history.iloc[-history_window:]
        if history.empty:
            continue
        row = {
            "date": forecast_date,
            "persistence": float(history.iloc[-1]),
            "seasonal_persistence": float(history.iloc[-period]) if len(history) >= period else np.nan,
            "moving_average": float(history.iloc[-moving_average_window:].mean()),
            "linear_trend": np.nan,
            "seasonal_decomposition": np.nan,
        }
        if len(history) >= 2:
            row["linear_trend"] = float(
                trend_forecast(history, pd.DatetimeIndex([forecast_date])).iloc[0]
            )
        if len(history) >= 2 * period:
            row["seasonal_decomposition"] = float(
                stl_forecast(history, pd.DatetimeIndex([forecast_date]), period).iloc[0]
            )
        rows.append(row)
    if not rows:
        return pd.DataFrame(index=forecast_index)
    return pd.DataFrame(rows).set_index("date").reindex(forecast_index)


def baseline_split_predictions(
    target: pd.Series,
    train_end: pd.Timestamp,
    validation_end: pd.Timestamp,
    period: int,
    moving_average_window: int = 3,
    history_window: int | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    validation_index = target.loc[(target.index > train_end) & (target.index <= validation_end) & target.notna()].index
    test_index = target.loc[(target.index > validation_end) & target.notna()].index
    validation_predictions = walk_forward_baselines(target, validation_index, period, moving_average_window, history_window)
    test_predictions = walk_forward_baselines(target, test_index, period, moving_average_window, history_window)
    return validation_predictions, test_predictions


def expected_mse_weights(errors: np.ndarray, shrinkage: float = 0.1) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    errors = np.asarray(errors, dtype=float)
    if errors.ndim != 2 or errors.shape[0] < 2 or errors.shape[1] < 1 or not np.isfinite(errors).all():
        raise ValueError("Expected-MSE weights require a finite (observations, models) matrix with >= 2 observations")
    if not 0 <= shrinkage <= 1:
        raise ValueError("Covariance shrinkage must lie in [0, 1]")
    bias = errors.mean(axis=0)
    covariance = np.cov(errors, rowvar=False, ddof=1)
    if covariance.ndim == 0:
        covariance = np.asarray([[float(covariance)]])
    diagonal = np.diag(np.diag(covariance))
    shrunk_covariance = (1.0 - shrinkage) * covariance + shrinkage * diagonal
    objective_matrix = shrunk_covariance + np.outer(bias, bias)
    model_count = errors.shape[1]
    initial = np.repeat(1.0 / model_count, model_count)
    objective_scale = max(float(np.max(np.abs(objective_matrix))), np.finfo(float).tiny)
    scaled_objective = objective_matrix / objective_scale

    def objective(weights: np.ndarray) -> float:
        return float(weights @ scaled_objective @ weights)

    result = minimize(
        objective,
        initial,
        method="SLSQP",
        jac=lambda weights: 2.0 * scaled_objective @ weights,
        bounds=[(0.0, 1.0)] * model_count,
        constraints={"type": "eq", "fun": lambda weights: float(weights.sum() - 1.0)},
        options={"maxiter": 2000, "ftol": 1e-12},
    )
    if not result.success:
        raise RuntimeError(f"Expected-MSE optimisation failed: {result.message}")
    weights = np.clip(result.x, 0.0, 1.0)
    weights /= weights.sum()
    return weights, bias, shrunk_covariance


def resolve_prediction_bounds(manifest: dict) -> dict[str, float | None]:
    configured = manifest.get("prediction_bounds", {})
    if configured is None:
        configured = {}
    if not isinstance(configured, dict):
        raise ValueError("prediction_bounds must be an object when provided")
    lower = configured.get("lower")
    upper = configured.get("upper")
    lower_value = float(lower) if lower is not None else None
    upper_value = float(upper) if upper is not None else None
    if any(value is not None and not np.isfinite(value) for value in (lower_value, upper_value)):
        raise ValueError("Prediction bounds must be finite when provided")
    if lower_value is not None and upper_value is not None and lower_value > upper_value:
        raise ValueError("prediction_bounds.lower must not exceed prediction_bounds.upper")
    return {"lower": lower_value, "upper": upper_value}


def constrain_prediction_array(
    values: np.ndarray,
    bounds: dict[str, float | None],
) -> tuple[np.ndarray, int]:
    constrained = np.asarray(values, dtype=float).copy()
    finite = np.isfinite(constrained)
    changed = np.zeros(constrained.shape, dtype=bool)
    lower = bounds.get("lower")
    upper = bounds.get("upper")
    if lower is not None:
        changed |= finite & (constrained < lower)
        constrained = np.where(finite, np.maximum(constrained, lower), constrained)
    if upper is not None:
        changed |= finite & (constrained > upper)
        constrained = np.where(finite, np.minimum(constrained, upper), constrained)
    return constrained, int(changed.sum())


def constrain_prediction_frame(
    frame: pd.DataFrame,
    bounds: dict[str, float | None],
    zone: str,
    split: str,
    family: str,
) -> tuple[pd.DataFrame, list[dict]]:
    constrained = frame.copy()
    audit_rows: list[dict] = []
    for column in constrained.columns:
        values, changed_count = constrain_prediction_array(constrained[column].to_numpy(), bounds)
        constrained[column] = values
        finite_count = int(np.isfinite(values).sum())
        audit_rows.append(
            {
                "zone": zone,
                "split": split,
                "model": column,
                "family": family,
                "lower_bound": bounds.get("lower"),
                "upper_bound": bounds.get("upper"),
                "predictions_checked": finite_count,
                "predictions_constrained": changed_count,
                "constrained_fraction": (
                    float(changed_count / finite_count) if finite_count else float("nan")
                ),
            }
        )
    return constrained, audit_rows


def circular_block_indices(count: int, block_length: int, generator: np.random.Generator) -> np.ndarray:
    if count < 1 or block_length < 1:
        raise ValueError("Bootstrap sample count and block length must be positive")
    effective_length = min(count, block_length)
    starts = generator.integers(0, count, size=int(np.ceil(count / effective_length)))
    return ((starts[:, None] + np.arange(effective_length)) % count).reshape(-1)[:count]


def block_bootstrap_interval(
    actual: np.ndarray,
    predicted: np.ndarray,
    metric: Callable[[np.ndarray, np.ndarray], float],
    repetitions: int,
    seed: int,
    block_length: int = 12,
) -> tuple[float, float]:
    if repetitions < 1:
        raise ValueError("Bootstrap repetitions must be positive")
    generator = np.random.default_rng(seed)
    count = len(actual)
    values = np.empty(repetitions, dtype=float)
    for repetition in range(repetitions):
        sampled = circular_block_indices(count, block_length, generator)
        values[repetition] = metric(actual[sampled], predicted[sampled])
    values = values[np.isfinite(values)]
    if not len(values):
        return float("nan"), float("nan")
    return float(np.quantile(values, 0.025)), float(np.quantile(values, 0.975))


def paired_block_bootstrap_loss_difference(
    actual: pd.Series,
    candidate: pd.Series,
    comparator: pd.Series,
    repetitions: int,
    seed: int,
    block_length: int = 12,
) -> dict:
    aligned = pd.concat(
        [actual.rename("actual"), candidate.rename("candidate"), comparator.rename("comparator")],
        axis=1,
    ).dropna()
    candidate_loss = np.abs(aligned["actual"].to_numpy() - aligned["candidate"].to_numpy())
    comparator_loss = np.abs(aligned["actual"].to_numpy() - aligned["comparator"].to_numpy())
    difference = candidate_loss - comparator_loss
    count = len(difference)
    if count == 0:
        return {
            "observations": 0,
            "mean_mae_difference": np.nan,
            "ci_low": np.nan,
            "ci_high": np.nan,
            "candidate_win_rate": np.nan,
        }
    generator = np.random.default_rng(seed)
    samples = np.empty(repetitions, dtype=float)
    for repetition in range(repetitions):
        sampled = circular_block_indices(count, block_length, generator)
        samples[repetition] = float(np.mean(difference[sampled]))
    return {
        "observations": int(count),
        "mean_mae_difference": float(np.mean(difference)),
        "ci_low": float(np.quantile(samples, 0.025)),
        "ci_high": float(np.quantile(samples, 0.975)),
        "candidate_win_rate": float(np.mean(candidate_loss < comparator_loss)),
        "bootstrap_block_length": block_length,
        "bootstrap_repetitions": repetitions,
        "bootstrap_method": "paired circular moving blocks over the complete chronological test series",
    }


def compute_metrics(
    zone: str,
    model: str,
    split: str,
    actual: pd.Series,
    predicted: pd.Series,
    peak_threshold: float,
    bootstrap_repetitions: int,
    seed: int,
    block_length: int = 12,
) -> MetricRow:
    aligned = pd.concat([actual.rename("actual"), predicted.rename("predicted")], axis=1).dropna()
    actual_values = aligned["actual"].to_numpy(dtype=float)
    predicted_values = aligned["predicted"].to_numpy(dtype=float)
    if not len(actual_values) or not np.isfinite(actual_values).all() or not np.isfinite(predicted_values).all():
        raise ValueError(f"{zone} {model} {split} has no finite comparable observations")
    peak_mask = actual_values >= peak_threshold
    mae = float(mean_absolute_error(actual_values, predicted_values))
    rmse = float(np.sqrt(mean_squared_error(actual_values, predicted_values)))
    mean_bias = float(np.mean(predicted_values - actual_values))
    variance_denominator = float(np.sum((actual_values - np.mean(actual_values)) ** 2))
    nse = (
        float(1.0 - np.sum((predicted_values - actual_values) ** 2) / variance_denominator)
        if variance_denominator > 0
        else float("nan")
    )
    observed_mean = float(np.mean(actual_values))
    observed_std = float(np.std(actual_values, ddof=1)) if len(actual_values) > 1 else float("nan")
    predicted_std = float(np.std(predicted_values, ddof=1)) if len(predicted_values) > 1 else float("nan")
    if len(actual_values) > 1 and observed_std > 0 and predicted_std > 0 and observed_mean != 0:
        correlation = float(np.corrcoef(actual_values, predicted_values)[0, 1])
        alpha = predicted_std / observed_std
        beta = float(np.mean(predicted_values)) / observed_mean
        kge = float(1.0 - np.sqrt((correlation - 1.0) ** 2 + (alpha - 1.0) ** 2 + (beta - 1.0) ** 2))
    else:
        kge = float("nan")
    peak_mae = float(mean_absolute_error(actual_values[peak_mask], predicted_values[peak_mask])) if peak_mask.any() else float("nan")
    mae_interval = block_bootstrap_interval(
        actual_values,
        predicted_values,
        lambda observed, forecast: float(mean_absolute_error(observed, forecast)),
        bootstrap_repetitions,
        seed,
        block_length,
    )
    rmse_interval = block_bootstrap_interval(
        actual_values,
        predicted_values,
        lambda observed, forecast: float(np.sqrt(mean_squared_error(observed, forecast))),
        bootstrap_repetitions,
        seed + 1,
        block_length,
    )
    def peak_loss(observed, forecast):
        selected = observed >= peak_threshold
        return float(np.mean(np.abs(observed[selected] - forecast[selected]))) if selected.any() else float("nan")

    peak_interval = block_bootstrap_interval(
        actual_values, predicted_values, peak_loss, bootstrap_repetitions, seed + 2, block_length
    )
    return MetricRow(
        zone=zone,
        model=model,
        split=split,
        observations=len(actual_values),
        mae=mae,
        rmse=rmse,
        peak_mae=peak_mae,
        peak_count=int(peak_mask.sum()),
        peak_mae_ci_low=peak_interval[0],
        peak_mae_ci_high=peak_interval[1],
        mae_ci_low=mae_interval[0],
        mae_ci_high=mae_interval[1],
        rmse_ci_low=rmse_interval[0],
        rmse_ci_high=rmse_interval[1],
        mean_bias=mean_bias,
        nse=nse,
        kge=kge,
    )


if keras is not None:
    @keras.utils.register_keras_serializable(package="CuuNetRevision")
    class BahdanauTemporalAttention(layers.Layer):
        def __init__(self, units: int, **kwargs):
            super().__init__(**kwargs)
            self.units = units
            self.query_projection = layers.Dense(units, use_bias=False)
            self.value_projection = layers.Dense(units, use_bias=False)
            self.score_projection = layers.Dense(1, use_bias=False)

        def build(self, query_shape, values_shape):
            query_shape, values_shape = tuple(query_shape), tuple(values_shape)
            self.query_projection.build((query_shape[0], 1, query_shape[-1]))
            self.value_projection.build(values_shape)
            self.score_projection.build((*values_shape[:-1], self.units))
            super().build(query_shape)

        def call(self, query: tf.Tensor, values: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
            expanded_query = tf.expand_dims(query, axis=1)
            score = self.score_projection(
                tf.nn.tanh(self.query_projection(expanded_query) + self.value_projection(values))
            )
            weights = tf.nn.softmax(score, axis=1)
            context = tf.reduce_sum(weights * values, axis=1)
            return context, weights

        def get_config(self) -> dict:
            config = super().get_config()
            config.update({"units": self.units})
            return config


def build_neural_model(
    lookback: int,
    feature_count: int,
    lstm_units: int,
    attention_units: int,
    dropout: float,
    use_attention: bool,
    unroll_lstm: bool = True,
) -> keras.Model:
    if keras is None:
        raise RuntimeError("TensorFlow is required for neural model construction")
    model_input = keras.Input(shape=(lookback, feature_count), name="input_sequence")
    sequence_output, final_hidden, _ = layers.LSTM(
        lstm_units,
        return_sequences=True,
        return_state=True,
        dropout=dropout,
        recurrent_dropout=0.0,
        unroll=unroll_lstm,
        name="lstm",
    )(model_input)
    if use_attention:
        context, _ = BahdanauTemporalAttention(attention_units, name="temporal_attention")(
            final_hidden, sequence_output
        )
        representation = layers.Concatenate(name="context_hidden")([context, final_hidden])
    else:
        representation = final_hidden
    output = layers.Dense(1, name="forecast", dtype="float32")(representation)
    return keras.Model(model_input, output, name="ta_lstm" if use_attention else "lstm_ablation")


def make_sequences(
    feature_values: np.ndarray,
    target_values: np.ndarray,
    dates: pd.DatetimeIndex,
    lookback: int,
) -> tuple[np.ndarray, np.ndarray, pd.DatetimeIndex]:
    sequences: list[np.ndarray] = []
    targets: list[float] = []
    target_dates: list[pd.Timestamp] = []
    for index in range(lookback, len(dates)):
        sequences.append(feature_values[index - lookback : index])
        targets.append(float(target_values[index]))
        target_dates.append(dates[index])
    return np.asarray(sequences, dtype=np.float32), np.asarray(targets, dtype=np.float32), pd.DatetimeIndex(target_dates)


def prepare_neural_arrays(
    frame: pd.DataFrame,
    feature_columns: list[str],
    target_column: str,
    splits: dict,
    lookback: int,
    fixed_range_features: list[str] | None = None,
) -> dict:
    train_end = pd.Timestamp(splits["train_end"])
    validation_end = pd.Timestamp(splits["validation_end"])
    feature_scaler = MinMaxScaler().fit(frame.loc[frame.index <= train_end, feature_columns])
    for name in fixed_range_features or []:
        if name not in feature_columns or not frame[name].between(0, 1).all():
            raise ValueError("Fixed-range indicator features must be present and lie in [0,1]")
        index = feature_columns.index(name)
        feature_scaler.scale_[index] = 1.
        feature_scaler.min_[index] = 0.
        feature_scaler.data_min_[index] = 0.
        feature_scaler.data_max_[index] = 1.
        feature_scaler.data_range_[index] = 1.
    target_scaler = MinMaxScaler().fit(frame.loc[frame.index <= train_end, [target_column]].dropna())
    feature_values = feature_scaler.transform(frame[feature_columns])
    target_values = target_scaler.transform(frame[[target_column]]).reshape(-1)
    sequences, targets, target_dates = make_sequences(feature_values, target_values, frame.index, lookback)
    target_observed = np.isfinite(targets)
    train_mask = (target_dates <= train_end) & target_observed
    validation_mask = (target_dates > train_end) & (target_dates <= validation_end) & target_observed
    test_mask = (target_dates > validation_end) & target_observed
    return {
        "x_train": sequences[train_mask],
        "y_train": targets[train_mask],
        "x_validation": sequences[validation_mask],
        "y_validation": targets[validation_mask],
        "validation_dates": target_dates[validation_mask],
        "x_test": sequences[test_mask],
        "y_test": targets[test_mask],
        "test_dates": target_dates[test_mask],
        "target_scaler": target_scaler,
        "feature_scaler": feature_scaler,
        "feature_columns": feature_columns,
    }


def inverse_target(values: np.ndarray, scaler: MinMaxScaler) -> np.ndarray:
    # Preserve the float model outputs, but invert the physical-unit scaler in
    # double precision, as JavaScript does when checking the exported reference.
    return scaler.inverse_transform(np.asarray(values, dtype=np.float64).reshape(-1, 1)).reshape(-1)


def censor_training_inputs(sequences: np.ndarray, feature_columns: list[str], zone: dict,
                           seed: int, maximum_gap: int, probability: float) -> tuple[np.ndarray, dict]:
    """Censor past input suffixes only; labels and calendar features are untouched."""
    if not 0 <= probability <= 1 or not 1 <= maximum_gap < sequences.shape[1]:
        raise ValueError("Invalid input-censoring protocol")
    available = zone.get("availability_feature_columns", [])
    age_name = zone.get("age_feature_column")
    if not available or age_name not in feature_columns:
        raise ValueError("Outage training requires availability and normalized age indicators")
    generator = np.random.default_rng(seed)
    result = sequences.copy()
    chosen = generator.random(len(result)) < probability
    gaps = generator.integers(1, maximum_gap + 1, size=len(result))
    known = {"annual_sin", "annual_cos", "month_sin", "month_cos", age_name, *available}
    physical = [i for i, name in enumerate(feature_columns) if name not in known]
    age_position = feature_columns.index(age_name)
    for row in np.flatnonzero(chosen):
        gap = int(gaps[row])
        last_known = result[row, -gap - 1].copy()
        result[row, -gap:][:, physical] = last_known[physical][None, :]
        for name in available:
            result[row, -gap:, feature_columns.index(name)] = 0.
        result[row, -gap:, age_position] = np.minimum(1., last_known[age_position] + np.arange(1, gap + 1) / maximum_gap)
    return result, {"censored_sequences": int(chosen.sum()), "total_sequences": len(result),
                    "probability": probability, "maximum_gap": maximum_gap, "seed": seed,
                    "label_changes": 0, "calendar_changes": 0, "physical_fill": "last available input within each training sequence"}

def checked_model_checkpoint(model_path: Path, signature: str) -> dict | None:
    history_path=model_path.with_suffix(".history.json")
    if not model_path.is_file() or not history_path.is_file():
        return None
    saved=json.loads(history_path.read_text(encoding="utf-8"))
    if saved.get("training_signature") != signature:
        raise ValueError("Checkpoint does not match the source, data and training protocol; use a separate output folder")
    if saved.get("model_sha256") != file_sha256(model_path):
        raise ValueError("Checkpoint model hash mismatch")
    if not saved.get("history",{}).get("val_mae"):
        raise ValueError("Checkpoint has no validation history")
    return saved

def save_training_checkpoint(output_dir: Path) -> Path:
    """An interrupted training ZIP is resumable evidence, never a completed result."""
    records={p.relative_to(output_dir).as_posix():file_sha256(p) for p in output_dir.rglob("*")
             if p.is_file() and p.name != "checkpoint_manifest.json"}
    write_json(output_dir/"checkpoint_manifest.json",{"format":"cuunet-training-checkpoint-v1",
        "publication_eligible":False,"state":"partial_training","files":records})
    target=output_dir.parent/("CuuNet_checkpoint_"+output_dir.name+".zip")
    temporary=target.with_suffix(".tmp")
    with zipfile.ZipFile(temporary,"w",zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(output_dir.rglob("*")):
            if path.is_file(): archive.write(path,path.relative_to(output_dir).as_posix())
    temporary.replace(target)
    return target


def train_neural_models(
    zone: dict,
    frame: pd.DataFrame,
    feature_columns: list[str],
    manifest: dict,
    output_dir: Path,
    bootstrap_repetitions: int,
    prediction_bounds: dict[str, float | None],
) -> tuple[list[dict], list[dict], list[dict], list[dict], list[dict]]:
    training = manifest["training"]
    lookback = int(manifest["lookback"])
    target_column = zone["target_column"]
    arrays = prepare_neural_arrays(frame, feature_columns, target_column, manifest["splits"], lookback, zone.get("fixed_range_features"))
    output_predictions: list[dict] = []
    metric_rows: list[dict] = []
    ablation_rows: list[dict] = []
    model_selection_rows: list[dict] = []
    constraint_rows: list[dict] = []
    train_target = frame.loc[frame.index <= pd.Timestamp(manifest["splits"]["train_end"]), target_column]
    peak_threshold = float(train_target.quantile(float(manifest["peak_quantile_from_training"])))
    zone_model_dir = output_dir / "models" / zone["id"]
    zone_model_dir.mkdir(parents=True, exist_ok=True)
    write_json(zone_model_dir / "preprocessing.json", {
        "zone": zone["id"], "lookback": lookback, "feature_columns": feature_columns,
        "feature_scaler": {"scale": arrays["feature_scaler"].scale_.tolist(), "min": arrays["feature_scaler"].min_.tolist()},
        "target_scaler": {"scale": float(arrays["target_scaler"].scale_[0]), "min": float(arrays["target_scaler"].min_[0])},
        "fit_period_end": manifest["splits"]["train_end"], "prediction_bounds": prediction_bounds,
        "forecast_horizon": "one day" if zone.get("sampling_frequency") == "D" else "one month",
        "input_information": f"the preceding {lookback} time steps only",
        "sampling_frequency": zone.get("sampling_frequency", "MS"),
        "target_metadata": zone.get("target_metadata"),
        "target_input_column": zone.get("target_input_column", target_column),
        "availability_feature_columns": zone.get("availability_feature_columns", []),
        "age_feature_column": zone.get("age_feature_column"),
        "age_normalisation_steps": manifest.get("outage_max_gap", 7),
        "outage_input_policy": manifest.get("outage_input_policy", "recursive"),
    })

    variants = [("ta_lstm", True, False), ("lstm_no_attention", False, False)]
    if training.get("include_outage_variant", False):
        variants.append(("ta_lstm_outage", True, True))
    for architecture_name, use_attention, censor_inputs in variants:
        for seed in training["seeds"]:
            keras.backend.clear_session()
            set_seed(int(seed))
            model = build_neural_model(
                lookback=lookback,
                feature_count=arrays["x_train"].shape[-1],
                lstm_units=int(training["lstm_units"]),
                attention_units=int(training["attention_units"]),
                dropout=float(training["dropout"]),
                use_attention=use_attention,
                unroll_lstm=bool(training.get("unroll_lstm", True)),
            )
            model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=float(training["learning_rate"]), clipnorm=1.0),
                loss="mse",
                metrics=["mae"],
            )
            callbacks = [
                keras.callbacks.EarlyStopping(
                    monitor="val_mae",
                    patience=int(training["early_stopping_patience"]),
                    restore_best_weights=True,
                )
            ]
            training_inputs, censoring = arrays["x_train"], None
            if censor_inputs:
                training_inputs, censoring = censor_training_inputs(training_inputs, feature_columns, zone,
                    int(seed) + 7919, int(manifest.get("outage_max_gap", 7)), float(training.get("input_censoring_probability", .5)))
            model_path = zone_model_dir / f"{architecture_name}_seed_{seed}.keras"
            context={"zone":zone,"architecture":architecture_name,"seed":int(seed),"input_censoring":censoring,
                "training":training,"splits":manifest["splits"],"lookback":lookback,
                "feature_columns":feature_columns,"prediction_bounds":prediction_bounds,
                "source_sha256":file_sha256(Path(__file__)),
                "frame_sha256":hashlib.sha256(pd.util.hash_pandas_object(frame,index=True).values.tobytes()).hexdigest(),
                "tensorflow":tf.__version__,"keras":getattr(keras,"__version__","unknown")}
            signature=hashlib.sha256(json.dumps(context,sort_keys=True).encode()).hexdigest()
            cached=checked_model_checkpoint(model_path,signature)
            if cached:
                print(f"Resuming checked model {zone['id']} {architecture_name} seed {seed}",flush=True)
                model=keras.models.load_model(model_path,compile=False)
                history=SimpleNamespace(history=cached["history"])
            else:
                print(f"Training {zone['id']} {architecture_name} seed {seed}", flush=True)
                history = model.fit(training_inputs,arrays["y_train"],
                    validation_data=(arrays["x_validation"],arrays["y_validation"]),
                    epochs=int(training["epochs"]),batch_size=int(training["batch_size"]),
                    callbacks=callbacks,verbose=0,shuffle=False)
                model.save(model_path)
            write_json(model_path.with_suffix(".history.json"), {
                "zone": zone["id"], "model": architecture_name, "seed": int(seed),
                "history": history.history, "training_configuration": training,
                "parameters": int(model.count_params()), "model_sha256": file_sha256(model_path),
                "checkpoint_rule": "minimum scaled validation MAE with early stopping; no test-based selection",
                "input_censoring": censoring,
                "training_signature":signature,
            })
            if training.get("write_progress_archives",False):
                print("Saved recoverable partial training ZIP:",save_training_checkpoint(output_dir),flush=True)
            for split_name, x_values, y_values, dates in (
                (
                    "validation",
                    arrays["x_validation"],
                    arrays["y_validation"],
                    arrays["validation_dates"],
                ),
                ("test", arrays["x_test"], arrays["y_test"], arrays["test_dates"]),
            ):
                scaled_predictions = model.predict(x_values, verbose=0).reshape(-1)
                unconstrained_predictions = inverse_target(
                    scaled_predictions, arrays["target_scaler"]
                )
                predictions, changed_count = constrain_prediction_array(
                    unconstrained_predictions, prediction_bounds
                )
                actual = frame.loc[dates, target_column].to_numpy(dtype=float)
                prediction_series = pd.Series(predictions, index=dates)
                actual_series = pd.Series(actual, index=dates)
                metric = compute_metrics(
                    zone=zone["id"],
                    model=architecture_name,
                    split=split_name,
                    actual=actual_series,
                    predicted=prediction_series,
                    peak_threshold=peak_threshold,
                    bootstrap_repetitions=bootstrap_repetitions,
                    seed=int(seed),
                    block_length=int(manifest.get("bootstrap_block_length", 12)),
                )
                metric_dict = asdict(metric)
                metric_dict.update(
                    {
                        "seed": int(seed),
                        "epochs_trained": int(len(history.history["loss"])),
                        "best_scaled_validation_mae": float(min(history.history["val_mae"])),
                        "parameters": int(model.count_params()),
                    }
                )
                metric_rows.append(metric_dict)
                constraint_rows.append(
                    {
                        "zone": zone["id"],
                        "split": split_name,
                        "model": architecture_name,
                        "seed": int(seed),
                        "family": "neural",
                        "lower_bound": prediction_bounds.get("lower"),
                        "upper_bound": prediction_bounds.get("upper"),
                        "predictions_checked": int(len(predictions)),
                        "predictions_constrained": changed_count,
                        "constrained_fraction": (
                            float(changed_count / len(predictions)) if len(predictions) else float("nan")
                        ),
                    }
                )
                for date, actual_value, prediction_value in zip(dates, actual, predictions):
                    output_predictions.append(
                        {
                            "zone": zone["id"],
                            "model": architecture_name,
                            "seed": int(seed),
                            "split": split_name,
                            "date": date.isoformat(),
                            "actual": float(actual_value),
                            "predicted": float(prediction_value),
                        }
                    )

    metrics_frame = pd.DataFrame(metric_rows)
    for seed in training["seeds"]:
        attention_row = metrics_frame[
            (metrics_frame["model"] == "ta_lstm")
            & (metrics_frame["seed"] == seed)
            & (metrics_frame["split"] == "test")
        ].iloc[0]
        ablation_row = metrics_frame[
            (metrics_frame["model"] == "lstm_no_attention")
            & (metrics_frame["seed"] == seed)
            & (metrics_frame["split"] == "test")
        ].iloc[0]
        ablation_rows.append(
            {
                "zone": zone["id"],
                "seed": int(seed),
                "attention_mae": float(attention_row["mae"]),
                "no_attention_mae": float(ablation_row["mae"]),
                "mae_change_percent_when_attention_removed": float(
                    100.0 * (ablation_row["mae"] - attention_row["mae"]) / attention_row["mae"]
                    if attention_row["mae"] > 0 else float("nan")
                ),
                "attention_peak_mae": float(attention_row["peak_mae"]),
                "no_attention_peak_mae": float(ablation_row["peak_mae"]),
                "peak_mae_change_percent_when_attention_removed": float(
                    100.0 * (ablation_row["peak_mae"] - attention_row["peak_mae"]) / attention_row["peak_mae"]
                    if attention_row["peak_mae"] > 0 else float("nan")
                ),
                "attention_parameters": int(attention_row["parameters"]),
                "no_attention_parameters": int(ablation_row["parameters"]),
                "interpretation_limit": "same LSTM width and training protocol; attention adds parameters, so this is not a parameter-matched causal ablation",
            }
        )

    for architecture_name, _, _ in variants:
        validation_rows = metrics_frame[
            (metrics_frame["model"] == architecture_name)
            & (metrics_frame["split"] == "validation")
        ].sort_values(["mae", "seed"], kind="stable")
        selected = validation_rows.iloc[0]
        selected_seed = int(selected["seed"])
        model_selection_rows.append(
            {
                "zone": zone["id"],
                "model": architecture_name,
                "selected_seed": selected_seed,
                "selection_split": "validation",
                "selection_metric": "mae",
                "validation_mae": float(selected["mae"]),
                "model_path": str(
                    zone_model_dir / f"{architecture_name}_seed_{selected_seed}.keras"
                ),
            }
        )

    deployed_name = "ta_lstm_outage" if training.get("include_outage_variant", False) else "ta_lstm"
    selected_attention = next(row for row in model_selection_rows if row["model"] == deployed_name)
    selected_model = keras.models.load_model(
        selected_attention["model_path"], compile=False
    )
    float_scaled_predictions = selected_model.predict(arrays["x_test"], verbose=0).reshape(-1)
    float_physical_predictions = inverse_target(
        float_scaled_predictions, arrays["target_scaler"]
    )
    float_physical_predictions, _ = constrain_prediction_array(
        float_physical_predictions, prediction_bounds
    )
    actual_physical = frame.loc[arrays["test_dates"], target_column].to_numpy(dtype=float)
    equivalence_case_dir = output_dir / "tfjs_equivalence_cases"
    equivalence_case_dir.mkdir(parents=True, exist_ok=True)
    equivalence_case = {
        "zone": zone["id"],
        "model": deployed_name,
        "selected_seed": int(selected_attention["selected_seed"]),
        "selection_rule": "lowest physical-unit validation MAE; seed breaks exact ties",
        "dates": [date.date().isoformat() for date in arrays["test_dates"]],
        "feature_columns": feature_columns,
        "input_shape": [int(value) for value in arrays["x_test"].shape],
        "inputs": arrays["x_test"].astype(float).tolist(),
        "keras_float_scaled_predictions": float_scaled_predictions.astype(float).tolist(),
        "keras_float_physical_predictions": float_physical_predictions.astype(float).tolist(),
        "actual_physical": actual_physical.astype(float).tolist(),
        "target_scaler": {
            "scale": float(arrays["target_scaler"].scale_[0]),
            "min": float(arrays["target_scaler"].min_[0]),
        },
        "prediction_bounds": prediction_bounds,
        "float_equivalence_tolerances": {"absolute": 1e-5, "relative": 1e-4},
        "provenance_class": manifest["provenance_class"],
        "interpretation": (
            "The quantized TF.js model uses uint8 weight storage and float arithmetic after "
            "dequantization; this is not integer-only INT8 inference."
        ),
    }
    write_json(equivalence_case_dir / f"{zone['id']}.json", equivalence_case)
    return (
        output_predictions,
        metric_rows,
        ablation_rows,
        model_selection_rows,
        constraint_rows,
    )


def clear_export_directory(path: Path, output_dir: Path) -> None:
    resolved = path.resolve()
    base = output_dir.resolve()
    if resolved == base or not resolved.is_relative_to(base):
        raise ValueError(f"Refusing to remove a model directory outside the output area: {resolved}")
    shutil.rmtree(path)


def inference_export_model(model: keras.Model) -> keras.Model:
    """Copy learned weights into a deterministic inference-only architecture.

    Keras 3's unrolled RNN can update its dropout seed even for inference.
    TF.js cannot freeze that AssignVariableOp after replacing its resource
    with a constant. Dropout is inactive during prediction, so disabling it
    in this separate export model preserves the trained model's inference.
    """
    def clone_layer(layer):
        config = layer.get_config()
        if isinstance(layer, layers.LSTM):
            config.update({"dropout": 0.0, "recurrent_dropout": 0.0})
        return layer.__class__.from_config(config)

    exported = keras.models.clone_model(model, clone_function=clone_layer)
    weights = model.get_weights()
    exported.set_weights(weights)
    copied = exported.get_weights()
    if len(copied) != len(weights) or not all(np.array_equal(first, second) for first, second in zip(weights, copied)):
        raise RuntimeError("The inference export did not preserve all learned weights")
    return exported


def convert_best_models_to_tfjs(
    output_dir: Path,
    repository_root: Path,
    model_selection_rows: list[dict],
) -> tuple[list[dict], list[dict]]:
    converter = shutil.which("tensorflowjs_converter")
    if converter is None:
        reason = "tensorflowjs_converter not found"
        return ([{"status": "skipped", "reason": reason}], [{"status": "skipped", "reason": reason}])
    records: list[dict] = []
    equivalence_rows: list[dict] = []
    attention_selections = []
    for row in model_selection_rows:
        case_path = output_dir / "tfjs_equivalence_cases" / f"{row['zone']}.json"
        if case_path.is_file() and json.loads(case_path.read_text(encoding="utf-8"))["model"] == row["model"]:
            attention_selections.append(row)
    for selection in attention_selections:
        zone = selection["zone"]
        source_model = Path(selection["model_path"])
        if not source_model.exists():
            records.append(
                {"zone": zone, "status": "failed", "reason": f"Missing selected model: {source_model}"}
            )
            continue
        loaded = keras.models.load_model(source_model, compile=False)
        exported = inference_export_model(loaded)
        case_path = output_dir / "tfjs_equivalence_cases" / f"{zone}.json"
        case = json.loads(case_path.read_text(encoding="utf-8"))
        inputs = np.asarray(case["inputs"], dtype=np.float32)
        reference = np.asarray(case["keras_float_scaled_predictions"], dtype=np.float64)
        predictions = np.asarray(exported(inputs, training=False)).reshape(-1)
        tolerance = case.get("float_equivalence_tolerances", {"absolute": 1e-5, "relative": 1e-4})
        if not np.allclose(predictions, reference, atol=tolerance["absolute"], rtol=tolerance["relative"]):
            raise RuntimeError("The inference-only Keras export disagrees with the selected trained model")

        @tf.function(input_signature=[tf.TensorSpec(tuple(loaded.input_shape), tf.float32, name="input_sequence")])
        def serve(input_sequence):
            return exported(input_sequence, training=False)

        concrete = serve.get_concrete_function()
        graph = concrete.graph.as_graph_def()
        graph_nodes = [*graph.node, *(node for function in graph.library.function for node in function.node_def)]
        writes = [node.name for node in graph_nodes if node.op in {"AssignVariableOp", "AssignAddVariableOp", "AssignSubVariableOp"}]
        if writes:
            raise RuntimeError(f"The inference graph still updates variable state: {writes}")
        saved_model_dir = output_dir / "saved_models" / zone
        if saved_model_dir.exists():
            clear_export_directory(saved_model_dir, output_dir)
        saved_model_dir.parent.mkdir(parents=True, exist_ok=True)
        archive = keras.export.ExportArchive()
        archive.track(exported)
        archive.add_endpoint(name="serve", fn=serve)
        archive.write_out(saved_model_dir)

        float_destination = output_dir / "tfjs_models_float" / zone
        quantized_destination = output_dir / "tfjs_models" / zone
        for destination in (float_destination, quantized_destination):
            if destination.exists():
                clear_export_directory(destination, output_dir)
            destination.mkdir(parents=True, exist_ok=True)

        base_command = [
            converter,
            "--input_format=tf_saved_model",
            "--output_format=tfjs_graph_model",
            str(saved_model_dir),
        ]
        float_result = subprocess.run(
            [*base_command, str(float_destination)], capture_output=True, text=True
        )
        quantized_result = subprocess.run(
            [*base_command[:-1], "--quantize_uint8=*", base_command[-1], str(quantized_destination)],
            capture_output=True,
            text=True,
        )
        records.append(
            {
                "zone": zone,
                "selected_seed": int(selection["selected_seed"]),
                "source_model": str(source_model),
                "inference_export": {
                    "mode": "training=False; dropout disabled only in a separate export model",
                    "copied_weight_arrays": len(loaded.get_weights()),
                    "trained_model_max_abs_scaled_difference": float(np.max(np.abs(predictions - reference))),
                    "variable_write_operations": writes,
                },
                "float_destination": str(float_destination),
                "quantized_destination": str(quantized_destination),
                "float_return_code": int(float_result.returncode),
                "quantized_return_code": int(quantized_result.returncode),
                "float_command": [*base_command, str(float_destination)],
                "float_stdout": float_result.stdout,
                "float_stderr": float_result.stderr,
                "quantized_stdout": quantized_result.stdout,
                "quantized_stderr": quantized_result.stderr,
                "quantization_scope": "uint8 weight storage; float arithmetic after dequantization",
                "integer_only_inference": False,
            }
        )

        if float_result.returncode != 0 or quantized_result.returncode != 0:
            print(f"TF.js conversion failed for {zone}", file=sys.stderr, flush=True)
            for label, completed in (("FP32", float_result), ("uint8", quantized_result)):
                if completed.returncode:
                    print(f"{label} converter stderr:\n{completed.stderr}", file=sys.stderr, flush=True)
            equivalence_rows.append(
                {
                    "zone": zone,
                    "status": "skipped",
                    "reason": "TF.js conversion failed; see tfjs_conversion.json",
                }
            )
            continue
        node = shutil.which("node")
        verifier = repository_root / "notebooks" / "verify_tfjs_equivalence.mjs"
        case_path = output_dir / "tfjs_equivalence_cases" / f"{zone}.json"
        result_path = output_dir / "tfjs_equivalence_results" / f"{zone}.json"
        result_path.parent.mkdir(parents=True, exist_ok=True)
        if node is None or not verifier.exists() or not case_path.exists():
            equivalence_rows.append(
                {
                    "zone": zone,
                    "status": "skipped",
                    "reason": "Node verifier or equivalence case not available",
                }
            )
            continue
        verification = subprocess.run(
            [
                node,
                str(verifier),
                "--float-model",
                str(float_destination / "model.json"),
                "--quantized-model",
                str(quantized_destination / "model.json"),
                "--case",
                str(case_path),
                "--output",
                str(result_path),
            ],
            cwd=repository_root,
            capture_output=True,
            text=True,
        )
        if verification.returncode != 0 or not result_path.exists():
            print(f"TF.js verification failed for {zone}:\n{verification.stdout}\n{verification.stderr}", file=sys.stderr, flush=True)
            equivalence_rows.append(
                {
                    "zone": zone,
                    "status": "failed",
                    "reason": "TF.js numerical verification failed",
                    "stderr": verification.stderr[-2000:],
                }
            )
            continue
        result = json.loads(result_path.read_text(encoding="utf-8"))
        if result.get("float_equivalence_passed") is not True:
            equivalence_rows.append({"zone": zone, "status": "failed", "reason": "FP32 export disagrees with Keras"})
            continue
        equivalence_rows.append(
            {
                "zone": zone,
                "status": "completed",
                "selected_seed": int(selection["selected_seed"]),
                "observations": int(result["observations"]),
                "keras_vs_tfjs_float_max_abs_scaled_difference": float(
                    result["keras_vs_tfjs_float"]["max_abs_scaled_difference"]
                ),
                "tfjs_float_vs_uint8_max_abs_scaled_difference": float(
                    result["tfjs_float_vs_uint8"]["max_abs_scaled_difference"]
                ),
                "tfjs_float_vs_uint8_mean_abs_physical_difference": float(
                    result["tfjs_float_vs_uint8"]["mean_abs_physical_difference"]
                ),
                "tfjs_float_vs_uint8_max_abs_physical_difference": float(
                    result["tfjs_float_vs_uint8"]["max_abs_physical_difference"]
                ),
                "tfjs_float_mae": float(result["test_metrics"]["tfjs_float_mae"]),
                "tfjs_uint8_weight_storage_mae": float(
                    result["test_metrics"]["tfjs_uint8_weight_storage_mae"]
                ),
                "mae_degradation_percent": result["test_metrics"]["mae_degradation_percent"],
                "float_model_bytes": int(result["float_model"]["total_bytes"]),
                "uint8_model_bytes": int(result["uint8_model"]["total_bytes"]),
                "size_reduction_percent": float(result["test_metrics"]["size_reduction_percent"]),
                "quantization_scope": "uint8 weight storage; float arithmetic after dequantization",
                "integer_only_inference": False,
                "raw_result_file": str(result_path),
            }
        )
    return records, equivalence_rows


def main() -> int:
    args = parse_args()
    if args.bootstrap_repetitions < 1:
        raise ValueError("bootstrap-repetitions must be positive")
    repository_root = Path(__file__).resolve().parents[1]
    manifest_path = args.manifest if args.manifest.is_absolute() else repository_root / args.manifest
    manifest = load_manifest(manifest_path)
    if manifest["provenance_class"] == "synthetic" and not args.allow_synthetic:
        raise SystemExit("Synthetic manifest refused. Use --allow-synthetic only for pipeline testing.")
    if not args.skip_neural and tf is None:
        raise RuntimeError("Install the locked Kaggle requirements before neural training; --skip-neural tests the statistical path")
    evidence_contract = validate_evidence_contract(repository_root, manifest)
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    prediction_bounds = resolve_prediction_bounds(manifest)
    block_length = int(manifest.get("bootstrap_block_length", 12))
    if block_length < 1:
        raise ValueError("bootstrap_block_length must be positive")
    started_at = datetime.now(timezone.utc).isoformat()
    code_files = [Path(__file__), repository_root / "notebooks" / "verify_tfjs_equivalence.mjs",
                  repository_root / "notebooks" / "prepare_glofas_revision_data.py",
                  repository_root / "notebooks" / "audit_revision_outputs.py",
                  repository_root / "notebooks" / "export_browser_benchmark.py"]
    code_files.extend(repository_root / "notebooks" / name for name in
        ("prepare_runoff_revision_data.py", "prepare_waterbench_reference.py", "outage_revision_experiments.py", "acquire_waterbench_reference.py"))
    code_hashes = {path.relative_to(repository_root).as_posix(): file_sha256(path) for path in code_files if path.is_file()}
    # Freeze the source bytes before fitting; later edits must never silently
    # replace the actual source that produced a scientific result.
    for source in code_files:
        if source.is_file():
            destination = output_dir / "code" / source.relative_to(repository_root)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    run_id = hashlib.sha256((started_at + file_sha256(manifest_path) + json.dumps(code_hashes, sort_keys=True)).encode()).hexdigest()[:20]
    software = {"python": sys.version, "platform": platform.platform()}
    for package in ("numpy", "pandas", "scipy", "scikit-learn", "statsmodels", "tensorflow", "keras", "tensorflowjs", "tensorflow-decision-forests", "ydf", "protobuf", "ml-dtypes", "jax", "xarray", "netCDF4", "cdsapi"):
        try:
            software[package] = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            software[package] = None
    gpu_details = []
    if tf is not None and not args.skip_neural:
        gpus = tf.config.list_physical_devices("GPU")
        if gpus:
            tf.config.set_visible_devices(gpus[0], "GPU")
            tf.config.experimental.set_memory_growth(gpus[0], True)
            gpu_details = [tf.config.experimental.get_device_details(gpus[0])]
        keras.mixed_precision.set_global_policy("float32")
        tf.config.experimental.enable_op_determinism()
    bundle_context_path = repository_root / "revision_bundle_context.json"
    bundle_context = json.loads(bundle_context_path.read_text(encoding="utf-8")) if bundle_context_path.is_file() else None
    run_manifest = {
        "schema_version": 2, "run_id": run_id, "status": "running", "started_at_utc": started_at,
        "study_id": manifest["study_id"], "provenance_class": manifest["provenance_class"],
        "validation_mode": manifest["validation_mode"], "target_kind": manifest["target_kind"],
        "input_manifest_sha256": file_sha256(manifest_path), "git_commit": git_commit(repository_root),
        "packaged_source_context": bundle_context, "code_sha256": code_hashes, "software": software,
        "gpu_devices": gpu_details, "single_gpu_training": len(gpu_details) == 1, "float_precision": "float32",
        "deterministic_tensorflow_ops": bool(tf is not None and not args.skip_neural),
        "python_hash_seed_at_process_start": os.getenv("PYTHONHASHSEED"),
        "evidence_contract": evidence_contract, "manifest": manifest,
        "neural_requested": not args.skip_neural, "conversion_requested": not (args.skip_neural or args.skip_conversion),
        "bootstrap": {"method": "circular moving blocks", "block_length": block_length, "repetitions": args.bootstrap_repetitions, "seed": 42},
        "prediction_bounds": prediction_bounds,
        "forecast_protocol": "retrospective one-step predictions using earlier timestamps only; the separate outage experiment freezes all physical inputs at explicit origins",
    }
    write_json(output_dir / "run_manifest.json", run_manifest)

    audit_rows, baseline_prediction_rows, baseline_metric_rows, pairwise_comparison_rows = [], [], [], []
    weight_rows, weight_estimation_records, shrinkage_rows, diagnostic_rows = [], [], [], []
    neural_prediction_rows, neural_metric_rows, ablation_rows, model_selection_rows, constraint_rows = [], [], [], [], []
    component_names = ["moving_average", "linear_trend", "seasonal_decomposition"]
    baseline_names = ["persistence", "seasonal_persistence", *component_names]

    for zone in manifest["zones"]:
        print(f"Running zone {zone['id']}", flush=True)
        frame, audit = load_zone(repository_root, zone, manifest["splits"])
        audit_rows.append(audit)
        write_json(output_dir / "data_audit.json", audit_rows)
        reconstruction_r2 = audit.get("contemporaneous_target_reconstruction_r2")
        if reconstruction_r2 is not None and reconstruction_r2 > 0.999 and manifest["provenance_class"] != "synthetic":
            raise RuntimeError(f"{zone['id']} target is almost exactly reconstructable from contemporaneous predictors")
        target = frame[zone["target_column"]].astype(float)
        train_end = pd.Timestamp(manifest["splits"]["train_end"])
        validation_end = pd.Timestamp(manifest["splits"]["validation_end"])
        if len(target.loc[target.index <= train_end]) < 2 * int(manifest["seasonal_period"]):
            raise ValueError("Training requires at least two complete seasonal cycles")
        validation_predictions, test_predictions = baseline_split_predictions(
            target, train_end, validation_end, int(manifest["seasonal_period"]),
            int(manifest.get("moving_average_window", 3)),
            manifest.get("baseline_history_window"),
        )
        validation_predictions, rows = constrain_prediction_frame(validation_predictions, prediction_bounds, zone["id"], "validation", "statistical")
        constraint_rows.extend(rows)
        test_predictions, rows = constrain_prediction_frame(test_predictions, prediction_bounds, zone["id"], "test", "statistical")
        constraint_rows.extend(rows)
        validation_actual, test_actual = target.loc[validation_predictions.index], target.loc[test_predictions.index]
        errors = validation_predictions[component_names].to_numpy() - validation_actual.to_numpy()[:, None]
        shrinkage = float(manifest.get("covariance_shrinkage", 0.10))
        weights, bias, covariance = expected_mse_weights(errors, shrinkage)
        raw_covariance = np.atleast_2d(np.cov(errors, rowvar=False, ddof=1))
        objective_matrix = covariance + np.outer(bias, bias)
        for predictions in (test_predictions, validation_predictions):
            predictions["equal_weight_ensemble"] = predictions[component_names].mean(axis=1)
            predictions["expected_mse_ensemble"] = predictions[component_names].to_numpy() @ weights
        validation_mae = {name: float(mean_absolute_error(validation_actual, validation_predictions[name])) for name in baseline_names}
        selected_baseline = min(validation_mae, key=validation_mae.get)
        comparators = list(dict.fromkeys([selected_baseline, "seasonal_persistence", "seasonal_decomposition"]))
        audit["selected_validation_baseline"] = selected_baseline
        audit["validation_baseline_mae"] = validation_mae
        peak_threshold = float(target.loc[target.index <= train_end].quantile(float(manifest["peak_quantile_from_training"])))
        audit["peak_threshold_from_training"] = peak_threshold
        audit["peak_definition"] = "test target values meeting the pre-specified training-period quantile; high-runoff/discharge diagnostic, not observed flood-event truth"
        for index, name in enumerate(component_names):
            weight_rows.append({"zone": zone["id"], "model": name, "weight": float(weights[index]),
                               "validation_bias": float(bias[index]), "covariance_row": json.dumps(covariance[index].tolist()),
                               "objective_matrix_row": json.dumps(objective_matrix[index].tolist()),
                               "validation_start": validation_actual.index[0].date().isoformat(),
                               "validation_end": validation_actual.index[-1].date().isoformat(),
                               "estimation_observations": len(errors), "covariance_ddof": 1, "diagonal_shrinkage": shrinkage})
        weight_estimation_records.append({
            "zone": zone["id"], "component_order": component_names, "weights": weights.tolist(), "bias": bias.tolist(),
            "sample_covariance_ddof_1": raw_covariance.tolist(), "shrunk_covariance": covariance.tolist(),
            "expected_mse_matrix": objective_matrix.tolist(), "diagonal_shrinkage": shrinkage,
            "estimation_dates": [date.date().isoformat() for date in validation_actual.index],
            "estimator": "validation error mean plus unbiased sample covariance shrunk toward its diagonal; Q = Sigma_shrunk + b b^T",
            "solver": "SLSQP on a scaled quadratic objective with nonnegative simplex constraints",
            "validation_metrics_note": "combination weights are fitted on validation; those ensemble validation metrics are calibration values",
        })
        for alternative in manifest.get("covariance_shrinkage_sensitivity", [0.0, 0.05, 0.10, 0.20]):
            alternative_weights, _, _ = expected_mse_weights(errors, float(alternative))
            forecast = test_predictions[component_names].to_numpy() @ alternative_weights
            shrinkage_rows.append({"zone": zone["id"], "shrinkage": float(alternative), "weights": json.dumps(alternative_weights.tolist()),
                                  "test_mae": float(mean_absolute_error(test_actual, forecast)),
                                  "test_rmse": float(np.sqrt(mean_squared_error(test_actual, forecast))),
                                  "primary_setting": float(alternative) == shrinkage,
                                  "interpretation": "pre-specified test sensitivity; never used to select the primary setting"})
        for candidate in test_predictions:
            for comparator in comparators:
                if candidate != comparator:
                    pairwise_comparison_rows.append({"zone": zone["id"], "split": "test", "candidate": candidate,
                        "seed": None, "comparator": comparator,
                        "comparator_selection": "pre-specified seasonal comparator or minimum validation MAE among five baselines",
                        **paired_block_bootstrap_loss_difference(test_actual, test_predictions[candidate], test_predictions[comparator], args.bootstrap_repetitions, 42, block_length)})
        for split, actual, predictions in (("validation", validation_actual, validation_predictions), ("test", test_actual, test_predictions)):
            for name in predictions:
                baseline_metric_rows.append(asdict(compute_metrics(zone["id"], name, split, actual, predictions[name], peak_threshold, args.bootstrap_repetitions, 42, block_length)))
                for date in predictions.index:
                    baseline_prediction_rows.append({"zone": zone["id"], "split": split, "date": date.date().isoformat(), "model": name,
                                                     "actual": float(actual.loc[date]), "predicted": float(predictions.loc[date, name])})
        if not args.skip_neural:
            zone_predictions, zone_metrics, zone_ablations, zone_selection, zone_constraints = train_neural_models(
                zone, frame, list(audit["feature_columns_used"]), manifest, output_dir, args.bootstrap_repetitions, prediction_bounds)
            neural_prediction_rows.extend(zone_predictions)
            neural_metric_rows.extend(zone_metrics)
            ablation_rows.extend(zone_ablations)
            model_selection_rows.extend(zone_selection)
            constraint_rows.extend(zone_constraints)
            predictions_frame = pd.DataFrame(zone_predictions)
            for (name, seed), records in predictions_frame.loc[predictions_frame["split"] == "test"].groupby(["model", "seed"]):
                candidate = records.assign(date=pd.to_datetime(records["date"])).set_index("date")["predicted"]
                for comparator in comparators:
                    pairwise_comparison_rows.append({"zone": zone["id"], "split": "test", "candidate": name,
                        "seed": int(seed), "comparator": comparator,
                        "comparator_selection": "pre-specified seasonal comparator or minimum validation MAE among five baselines",
                        **paired_block_bootstrap_loss_difference(test_actual, candidate, test_predictions[comparator], args.bootstrap_repetitions, 42, block_length)})
        for month in manifest.get("diagnostic_months", []):
            date = pd.Timestamp(month)
            if date in test_predictions.index:
                for name in test_predictions:
                    diagnostic_rows.append({"zone": zone["id"], "model": name, "seed": None, "date": date.date().isoformat(),
                        "actual": float(target.loc[date]), "predicted": float(test_predictions.loc[date, name]),
                        "absolute_error": abs(float(target.loc[date] - test_predictions.loc[date, name])),
                        "is_training_defined_high_flow_month": bool(target.loc[date] >= peak_threshold),
                        "interpretation": "held-out reanalysis month; only the northern reach overlaps Yagi geographically; no gauge, VGI or impact validation"})
                for record in neural_prediction_rows:
                    if record["zone"] == zone["id"] and record["split"] == "test" and pd.Timestamp(record["date"]) == date:
                        diagnostic_rows.append({"zone": zone["id"], "model": record["model"], "seed": record["seed"], "date": date.date().isoformat(),
                            "actual": record["actual"], "predicted": record["predicted"], "absolute_error": abs(record["actual"] - record["predicted"]),
                            "is_training_defined_high_flow_month": bool(record["actual"] >= peak_threshold),
                            "interpretation": "held-out reanalysis month; no observed flood-event validation"})

    neural_summary = []
    if neural_metric_rows:
        for (zone, model, split), group in pd.DataFrame(neural_metric_rows).groupby(["zone", "model", "split"]):
            row = {"zone": zone, "model": model, "split": split, "seeds": len(group)}
            for metric in ("mae", "rmse", "peak_mae", "mean_bias", "nse", "kge"):
                row.update({f"{metric}_mean": float(group[metric].mean()), f"{metric}_std": float(group[metric].std(ddof=1)),
                            f"{metric}_median": float(group[metric].median()), f"{metric}_q25": float(group[metric].quantile(.25)),
                            f"{metric}_q75": float(group[metric].quantile(.75))})
            neural_summary.append(row)
    conversion_records, equivalence_rows = ([], [])
    if not (args.skip_neural or args.skip_conversion):
        try:
            conversion_records, equivalence_rows = convert_best_models_to_tfjs(output_dir, repository_root, model_selection_rows)
        except Exception as error:
            conversion_records = [{"status": "failed", "error_type": type(error).__name__, "reason": str(error)}]
            equivalence_rows = [{"zone": zone["id"], "status": "failed", "reason": "conversion stage raised an exception; see tfjs_conversion.json"} for zone in manifest["zones"]]
    write_json(output_dir / "data_audit.json", audit_rows)
    write_json(output_dir / "forecast_combination_estimation.json", weight_estimation_records)
    write_json(output_dir / "tfjs_conversion.json", conversion_records)
    tables = {
        "baseline_predictions.csv": (baseline_prediction_rows, ["zone", "split", "date", "model", "actual", "predicted"]),
        "forecasting_metrics.csv": (baseline_metric_rows, ["zone", "model", "split", "mae", "rmse"]),
        "forecast_pairwise_comparisons.csv": (pairwise_comparison_rows, ["zone", "candidate", "comparator", "seed", "mean_mae_difference"]),
        "forecast_combination_weights.csv": (weight_rows, ["zone", "model", "weight"]),
        "covariance_shrinkage_sensitivity.csv": (shrinkage_rows, ["zone", "shrinkage", "test_mae", "test_rmse"]),
        "per_seed_predictions.csv": (neural_prediction_rows, ["zone", "model", "seed", "split", "date", "actual", "predicted"]),
        "neural_metrics.csv": (neural_metric_rows, ["zone", "model", "seed", "split", "mae", "rmse"]),
        "neural_summary.csv": (neural_summary, ["zone", "model", "split", "seeds", "mae_mean", "mae_std"]),
        "ablation_metrics.csv": (ablation_rows, ["zone", "seed", "attention_mae", "no_attention_mae"]),
        "model_selection.csv": (model_selection_rows, ["zone", "model", "selected_seed", "selection_split", "selection_metric", "validation_mae", "model_path"]),
        "prediction_constraint_audit.csv": (constraint_rows, ["zone", "model", "split", "family", "predictions_checked", "predictions_constrained"]),
        "quantisation_equivalence.csv": (equivalence_rows, ["zone", "status", "selected_seed", "observations"]),
        "held_out_month_diagnostics.csv": (diagnostic_rows, ["zone", "model", "seed", "date", "actual", "predicted", "absolute_error"]),
    }
    for name, (records, empty_columns) in tables.items():
        table = pd.DataFrame(records) if records else pd.DataFrame(columns=empty_columns)
        table["run_id"] = run_id
        table["provenance_class"] = manifest["provenance_class"]
        table.to_csv(output_dir / name, index=False)
    browser_exporter = repository_root / "notebooks" / "export_browser_benchmark.py"
    if equivalence_rows and any(row.get("status") == "completed" for row in equivalence_rows) and browser_exporter.is_file():
        subprocess.run([sys.executable, str(browser_exporter), "--output-dir", str(output_dir)], check=True)
    portable_inputs = {manifest_path.resolve()}
    portable_inputs.update((repository_root / zone["file"]).resolve() for zone in manifest["zones"])
    for field in ("source_manifest_file", "verified_bibliography_file", "data_preparation_audit_file"):
        if manifest.get(field):
            portable_inputs.add(evidence_path(repository_root, manifest[field]))
    if manifest.get("data_preparation_audit_file"):
        preparation = json.loads(evidence_path(repository_root, manifest["data_preparation_audit_file"]).read_text(encoding="utf-8"))
        for zone_record in preparation["zones"]:
            for record in zone_record["download_files"]:
                portable_inputs.add(evidence_path(repository_root, record["path"]))
                portable_inputs.add(evidence_path(repository_root, record["request_receipt"]))
    bundled_inputs = []
    for source in sorted(portable_inputs):
        relative = source.relative_to(repository_root) if source.is_relative_to(repository_root) else Path("external_manifest") / source.name
        destination = output_dir / "inputs" / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        bundled_inputs.append({"bundle_path": destination.relative_to(output_dir).as_posix(), "sha256": file_sha256(destination), "bytes": destination.stat().st_size})
    run_manifest["evidence_contract"]["bundled_inputs"] = bundled_inputs
    run_manifest["input_manifest_bundle_path"] = next(record["bundle_path"] for record in bundled_inputs if record["sha256"] == file_sha256(manifest_path))
    for source in code_files:
        if source.is_file():
            if file_sha256(source) != code_hashes[source.relative_to(repository_root).as_posix()]:
                raise RuntimeError("Source changed during the run. Results are incomplete; repeat from an immutable bundle.")
    run_manifest["status"] = "completed"
    run_manifest["completed_at_utc"] = datetime.now(timezone.utc).isoformat()
    write_json(output_dir / "run_manifest.json", run_manifest)
    manuscript_results = {
        "schema_version": 2, "run_id": run_id, "publication_eligible": False, "audited": False,
        "status": "pending_independent_output_audit", "submission_ready": False,
        "provenance_class": manifest["provenance_class"], "validation_mode": manifest["validation_mode"],
        "target_kind": manifest["target_kind"], "zone_targets": {zone["id"]: zone.get("target_metadata") for zone in manifest["zones"]},
        "splits": manifest["splits"], "baseline_metrics": baseline_metric_rows, "neural_summary": neural_summary,
        "neural_per_seed_metrics": neural_metric_rows, "ablation_metrics": ablation_rows,
        "combination_weights": weight_rows, "quantisation_equivalence": equivalence_rows,
        "held_out_month_diagnostics": diagnostic_rows,
        "claim_limitations": [
            "Each target retains its source-specific observed or reanalysis provenance, units and geographic support; no disaster-impact validation is implied",
            "The physical benchmark does not validate the original constructed composite risk index",
            "One-step forecasting alone does not establish operation through an input outage; the separate interruption experiment must be reported",
            "TF.js uint8 weight storage is dequantised for float arithmetic; Node CPU equivalence is not a mobile browser latency measurement",
            "Separate synthetic Sybil experiments do not establish browser-integrated verification, identity security or offline consensus",
            "The no-attention ablation has fewer parameters; measured energy, battery life and field deployment remain untested",
        ],
        "baseline_metrics_file": "forecasting_metrics.csv", "pairwise_comparisons_file": "forecast_pairwise_comparisons.csv",
        "neural_metrics_file": "neural_metrics.csv", "ablation_metrics_file": "ablation_metrics.csv",
        "artifacts": {path.relative_to(output_dir).as_posix(): {"sha256": file_sha256(path), "bytes": path.stat().st_size}
                      for path in sorted(output_dir.rglob("*")) if path.is_file() and path.name not in {"manuscript_results.json", "output_audit.json"}},
    }
    write_json(output_dir / "manuscript_results.json", manuscript_results)
    auditor = repository_root / "notebooks" / "audit_revision_outputs.py"
    if auditor.is_file():
        subprocess.run([sys.executable, str(auditor), "--output-dir", str(output_dir)], check=True)
    print(json.dumps({"run_id": run_id, "output_dir": str(output_dir), "neural_trained": not args.skip_neural}), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
