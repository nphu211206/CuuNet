"""Prepare observed discharge with missing labels retained and inputs filled only causally."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import zipfile
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CFS_TO_M3S = 0.028316846592
SPLITS = {"train_start": "2011-10-01", "train_end": "2015-09-30", "validation_end": "2016-09-30", "test_end": "2018-09-30"}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def relative(path):
    return path.resolve().relative_to(ROOT).as_posix()

def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")

def aggregate(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.copy()
    frame["datetime"] = pd.to_datetime(frame["datetime"], errors="raise")
    if frame["datetime"].duplicated().any():
        raise ValueError("Duplicate provider hour labels")
    frame = frame.sort_values("datetime").set_index("datetime")
    expected = pd.date_range("2011-10-01", "2018-09-30 23:00", freq="h")
    if not frame.index.equals(expected):
        raise ValueError("WaterBench source hours must match the complete published 2011–2018 period")
    discharge = pd.to_numeric(frame["discharge"], errors="raise")
    valid = discharge.where(np.isfinite(discharge) & (discharge >= 0))
    count = valid.resample("D").count()
    daily = pd.DataFrame({"discharge_m3s": valid.resample("D").mean().where(count >= 22) * CFS_TO_M3S,
                          "valid_discharge_hours": count})
    daily["discharge_available"] = daily["discharge_m3s"].notna().astype(int)
    # Zero only seeds the masked input before a first observation; it never
    # replaces a missing reference target or enters metric labels.
    daily["discharge_input_m3s"] = daily["discharge_m3s"].ffill().fillna(0.)
    positions = np.arange(len(daily))
    last_seen = np.maximum.accumulate(np.where(daily["discharge_available"].to_numpy() == 1, positions, -1))
    daily["input_age_steps"] = np.where(last_seen >= 0, positions - last_seen, positions + 1)
    daily["input_age_01"] = np.minimum(daily["input_age_steps"], 7) / 7
    daily.index.name = "date"
    return daily.reset_index()

def prepare(raw_dir: Path, output: Path, selection_path: Path, bibliography: Path):
    output.mkdir(parents=True, exist_ok=True)
    archive_path = raw_dir / "data_time_series.zip"
    receipt_path = raw_dir / "acquisition_receipt.json"
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    if digest(archive_path) != receipt["download_sha256"]:
        raise ValueError("Observed raw archive differs from the verified acquisition")
    if not bibliography.is_file():
        raise FileNotFoundError("Verified bibliography is required")
    selection = json.loads(selection_path.read_text(encoding="utf-8"))
    source_manifest = output / "source_manifest.json"
    write(source_manifest, {"sources": [{"id": "WaterBench-Iowa", "doi": "10.5194/essd-14-5605-2022",
        "url": "https://doi.org/10.5281/zenodo.7087806", "repository_url": "https://github.com/uihilab/WaterBench",
        "repository_commit": receipt["commit"], "licence": "MIT repository licence; published data archive attribution retained",
        "provenance": "USGS measured/reported hourly streamflow compiled by WaterBench; source units cubic feet per second (paper Section 2.2.5)",
        "unit_conversion": {"from": "ft3 s-1", "to": "m3 s-1", "factor": CFS_TO_M3S},
        "clock_note": "Calendar days use the published source timestamps; no undocumented timezone conversion",
        "daily_coverage": "at least 22 valid hourly streamflow values; missing reference days remain missing"}]})
    download_record = {"path": relative(archive_path), "sha256": digest(archive_path), "request": receipt["request"],
        "request_receipt": relative(receipt_path), "request_receipt_sha256": digest(receipt_path)}
    zones, audit = [], []
    with zipfile.ZipFile(archive_path) as archive:
        for station in selection["selected"]:
            frame = pd.read_csv(archive.open(f"data_time_series/{station['ifc_id']}_data.csv"), usecols=["datetime", "discharge"])
            daily = aggregate(frame)
            identifier = "USGS_" + station["usgs_id"]
            source_id = "WaterBench-Iowa:USGS:" + station["usgs_id"]
            daily["target_type"] = "daily_mean_gauge_discharge"
            daily["observed_or_derived"] = "observed_aggregated"
            daily["target_source_id"] = source_id
            target = output / (identifier + ".csv")
            daily.to_csv(target, index=False, date_format="%Y-%m-%d")
            target_meta = {"data_class": "observed", "variable": "daily mean of reported USGS discharge aggregated from WaterBench hours",
                "units": "m3 s-1", "source_id": source_id, "source_url": "https://doi.org/10.5194/essd-14-5605-2022",
                "licence": "MIT repository licence; attribution to WaterBench and USGS retained",
                "geographic_support": "USGS gauge " + station["usgs_id"] + f"; catchment area {station['area_km2']:.0f} km2",
                "temporal_resolution": "source hourly observations aggregated to daily mean if at least 22 of 24 hours valid"}
            metadata = {name: {"data_class": "observed_derived", "units": units, "source_id": source_id,
                "source_url": target_meta["source_url"], "licence": target_meta["licence"], "available_at_forecast_origin": True,
                "availability_mode": "retrospective_hindcast", "transformation": "causal forward fill with explicit availability mask; no future values"}
                for name, units in [("discharge_input_m3s", "m3 s-1"), ("discharge_available", "binary"), ("input_age_01", "normalized observation age, capped at seven days") ]}
            zones.append({"id": identifier, "label": "USGS gauge " + station["usgs_id"], "file": relative(target),
                "date_column": "date", "target_column": "discharge_m3s", "target_input_column": "discharge_input_m3s",
                "availability_feature_columns": ["discharge_available"], "allow_missing_targets": True,
                "age_feature_column": "input_age_01", "fixed_range_features": ["discharge_available", "input_age_01"],
                "feature_columns": list(metadata), "include_lagged_target": False, "feature_metadata": metadata,
                "target_metadata": target_meta, "sampling_frequency": "D", "source_note": "Independent observed reference outside Vietnam; no claim of Vietnam gauge or disaster-impact validation"})
            audit.append({"zone": identifier, "derived_csv_sha256": digest(target), "selection_uses_test_data": False,
                "selection_period_end": selection["selection_period_end"], "selection_rule": selection["selection_rule"],
                "download_files": [download_record], "missing_target_days": int(daily["discharge_m3s"].isna().sum()),
                "evaluation_target_imputation": "none", "input_imputation": "causal forward fill plus availability mask; masked zero only before first observation",
                "source_station": station, "cfs_to_m3s_factor": CFS_TO_M3S})
    audit_path = output / "preparation_audit.json"
    write(audit_path, {"zones": audit, "selection_artifact": relative(selection_path), "selection_sha256": digest(selection_path),
                      "daily_discharge_minimum_valid_hours": 22, "evaluation_target_imputation": "none"})
    manifest = {"study_id": "HYDRO-D-26-00188-observed-discharge-reference", "provenance_class": "observed",
        "validation_mode": "physical_target_replacement", "target_kind": "observed_daily_mean_discharge_m3s", "publication_eligible": True,
        "lookback": 30, "seasonal_period": 365, "sampling_frequency": "D", "moving_average_window": 7,
        "baseline_history_window": 1095, "peak_quantile_from_training": .9, "prediction_bounds": {"lower": 0., "upper": None},
        "covariance_shrinkage": .10, "covariance_shrinkage_sensitivity": [0., .05, .10, .20],
        "bootstrap_block_length": 30, "outage_horizons": [1, 3, 7], "outage_origin_stride": 7,
        "outage_max_gap": 7, "outage_input_policy": "frozen",
        "source_manifest_file": relative(source_manifest), "verified_bibliography_file": relative(bibliography),
        "data_preparation_audit_file": relative(audit_path), "splits": SPLITS,
        "training": {"seeds": [42, 123, 456, 789, 2024], "epochs": 100, "batch_size": 64, "early_stopping_patience": 15,
            "learning_rate": .001, "lstm_units": 64, "attention_units": 32, "dropout": .2, "unroll_lstm": True, "precision": "float32",
            "include_outage_variant": True, "input_censoring_probability": .5},
        "zones": zones, "interpretation": "Observed supplementary benchmark outside Vietnam; reference labels are never filled and all comparisons use the same observed days"}
    path = output / "experiment_manifest.json"
    write(path, manifest)
    print(json.dumps({"manifest": relative(path), "zones": audit}, indent=2))
    return manifest

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "data/waterbench_observed/raw")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data/waterbench_observed/prepared")
    parser.add_argument("--selection", type=Path, default=ROOT / "analysis/master_revision_20261121/waterbench_selection.json")
    parser.add_argument("--bibliography", type=Path, default=ROOT / "analysis/verified_bibliography.runoff.csv")
    args = parser.parse_args()
    prepare(args.raw_dir, args.output_dir, args.selection, args.bibliography)

if __name__ == "__main__":
    main()
