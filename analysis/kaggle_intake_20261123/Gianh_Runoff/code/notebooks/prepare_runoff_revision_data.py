"""Validate provider exports and prepare physical runoff benchmarks, never synthetic claims."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
COLLECTIONS = {"daily": "ECMWF/ERA5_LAND/DAILY_AGGR", "monthly": "ECMWF/ERA5_LAND/MONTHLY_AGGR"}
PRIMARY_BASIN_LEVEL = 7
GEOMETRY_RULES = {level: f"enclosing_HydroBASINS_level{level}_stable_HYBAS_ID_order" for level in (5,7)}
SITES = {"Bao_Ha_Runoff": (104.47, 22.26), "Gianh_Runoff": (106.43, 17.70), "Can_Tho_Runoff": (105.78, 10.03)}
SOURCE_URL = "https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_"
FIELDS = ["date", "zone", "HYBAS_ID", "runoff_m", "precipitation_m", "temperature_K", "soil_m3m3",
          "valid_area_m2", "centre_lon", "centre_lat", "source_image", "source_id", "frequency",
          "accumulation", "aggregation", "geometry_rule"]

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")

def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()

def _ring_contains(point, ring) -> bool:
    x, y = point
    inside = False
    for first, second in zip(ring[:-1], ring[1:]):
        ax, ay = first[:2]; bx, by = second[:2]
        cross = (x-ax)*(by-ay)-(y-ay)*(bx-ax)
        if abs(cross) <= 1e-9 and min(ax,bx)-1e-9 <= x <= max(ax,bx)+1e-9 and min(ay,by)-1e-9 <= y <= max(ay,by)+1e-9:
            return True
        if (ay > y) != (by > y) and x < ax + (y-ay)*(bx-ax)/(by-ay):
            inside = not inside
    return inside

def validate_basin_geometry(summaries: list[dict], basin_geojson: Path) -> dict:
    """Verify actual polygons, unique zones and anchor inclusion, not labels alone."""
    geo = json.loads(basin_geojson.read_text(encoding="utf-8"))
    features = geo.get("features", [])
    if geo.get("type") != "FeatureCollection" or len(features) != len(SITES):
        raise ValueError("Basin GeoJSON must be a FeatureCollection with exactly three unique zones")
    selected = {}
    for feature in features:
        properties = feature.get("properties", {})
        zone = properties.get("zone")
        if zone not in SITES or zone in selected:
            raise ValueError("Basin GeoJSON has an unknown or duplicate zone")
        selected[zone] = feature
    diagnostics=[]
    for row in summaries:
        zone=row["zone"]; feature=selected[zone]; props=feature["properties"]; geometry=feature.get("geometry", {})
        if str(props.get("HYBAS_ID")) != row["basin_id"]:
            raise ValueError("Basin GeoJSON and time-series basin IDs disagree")
        if geometry.get("type") not in {"Polygon", "MultiPolygon"}:
            raise ValueError("Basin geometry must contain actual polygons")
        polygons = [geometry.get("coordinates")] if geometry["type"] == "Polygon" else geometry.get("coordinates")
        if not polygons or any(not polygon for polygon in polygons):
            raise ValueError("Empty basin geometry")
        coordinates=[]
        for polygon in polygons:
            for ring in polygon:
                points=np.asarray(ring,dtype=float)
                if points.ndim != 2 or points.shape[0] < 4 or points.shape[1] < 2 or not np.isfinite(points).all() or not np.array_equal(points[0],points[-1]):
                    raise ValueError("Invalid or unclosed basin ring")
                if (np.abs(points[:,0]) > 180).any() or (np.abs(points[:,1]) > 90).any():
                    raise ValueError("Basin coordinates are not longitude and latitude")
                coordinates.extend(points[:,:2].tolist())
        anchor=SITES[zone]
        contains=any(_ring_contains(anchor,p[0]) and not any(_ring_contains(anchor,hole) for hole in p[1:]) for p in polygons)
        if not contains:
            raise ValueError(f"{zone} anchor is not inside the exported basin")
        xy=np.asarray(coordinates); area=props.get("SUB_AREA")
        diagnostics.append({"zone":zone,"basin_id":row["basin_id"],"anchor_inside_polygon":True,
            "geometry_type":geometry["type"],"polygon_parts":len(polygons),
            "bounds_lon_lat":[float(xy[:,0].min()),float(xy[:,1].min()),float(xy[:,0].max()),float(xy[:,1].max())],
            "hydrobasins_sub_area_km2":area,"valid_land_support_km2":row["valid_area_m2_min"]/1e6,
            "land_support_over_catalogue_area":row["valid_area_m2_min"]/1e6/float(area) if area else None,
            "interpretation":f"enclosing level-{row.get('basin_level',5)} regional drainage unit, not an asserted river-gauge catchment"})
    return {"basin_geojson_sha256":digest(basin_geojson),"zones":diagnostics}

def acquisition_check(inputs, basin_geojson, frequency, start, end, output):
    raw=pd.concat([pd.read_csv(path) for path in inputs],ignore_index=True)
    _, summaries=validate_rows(raw,frequency,start,end)
    geometry=validate_basin_geometry(summaries,basin_geojson)
    result={"acquisition_check_passed":True,"publication_run_created":False,"rows":len(raw),
            "start":start,"end":end,"zones":summaries,"geometry":geometry,
            "input_sha256":{path.name:digest(path) for path in inputs},
            "interpretation":"partial acquisition check only; complete chronological training data are still required"}
    output=output.resolve()
    if not output.is_relative_to(ROOT):
        raise ValueError("Acquisition audit output must stay inside the repository")
    write_json(output/"acquisition_check.json",result)
    return result

def validate_rows(frame: pd.DataFrame, frequency: str, start: str, end: str,
                  required_zones=None) -> tuple[pd.DataFrame, list[dict]]:
    """Reject missing days, duplicates, wrong units/provenance and materially negative targets."""
    if frequency not in COLLECTIONS:
        raise ValueError("frequency must be daily or monthly")
    missing = sorted(set(FIELDS) - set(frame))
    if missing:
        raise ValueError(f"Missing provider-export fields: {missing}")
    data = frame.copy()
    data["date"] = pd.to_datetime(data["date"], errors="raise")
    if data[FIELDS].isna().any().any():
        raise ValueError("Missing provider values; do not silently interpolate physical outcomes")
    expected_source = COLLECTIONS[frequency]
    constraints = {"source_id": expected_source, "frequency": frequency,
                   "accumulation": "daily_sum" if frequency == "daily" else "calendar_month_sum",
                   "aggregation": "valid_land_pixel_area_weighted_mean"}
    for column, expected in constraints.items():
        if not data[column].eq(expected).all():
            raise ValueError(f"{column} does not match the documented Earth Engine export")
    if data["geometry_rule"].nunique() != 1 or data["geometry_rule"].iloc[0] not in GEOMETRY_RULES.values():
        raise ValueError("Geometry must use one documented HydroBASINS level, never mixed supports")
    basin_level = next(k for k,v in GEOMETRY_RULES.items() if v == data["geometry_rule"].iloc[0])
    zones = list(SITES) if required_zones is None else list(required_zones)
    if set(data["zone"]) != set(zones):
        raise ValueError(f"Expected exactly these zones: {zones}")
    expected_dates = pd.date_range(start, end, freq="D" if frequency == "daily" else "MS")
    summaries = []
    for zone, group in data.groupby("zone", sort=True):
        group = group.sort_values("date")
        if group["date"].duplicated().any():
            raise ValueError(f"Duplicate dates in {zone}; annual files must not overlap")
        if not pd.DatetimeIndex(group["date"]).equals(expected_dates):
            raise ValueError(f"{zone} does not cover every requested {frequency} date from {start} to {end}")
        if group["HYBAS_ID"].nunique() != 1:
            raise ValueError(f"{zone} changed basin boundaries within the series")
        lon, lat = SITES[zone]
        if not np.allclose(group["centre_lon"].astype(float), lon, atol=1e-8) or not np.allclose(group["centre_lat"].astype(float), lat, atol=1e-8):
            raise ValueError(f"{zone} coordinate differs from the fixed protocol")
        values = group[["runoff_m", "precipitation_m", "temperature_K", "soil_m3m3", "valid_area_m2"]].astype(float)
        if not np.isfinite(values.to_numpy()).all() or (values["valid_area_m2"] <= 0).any():
            raise ValueError(f"{zone} has invalid physical values or empty spatial support")
        # GRIB packing can create tiny negative accumulated values. Preserve the
        # raw data; rectify only <=0.01 mm and record every affected value.
        if (values[["runoff_m", "precipitation_m"]] < -1e-5).any().any():
            raise ValueError(f"{zone} has materially negative accumulation; investigate provider quality before proceeding")
        if (values["soil_m3m3"] < 0).any() or (values["soil_m3m3"] > 1).any():
            raise ValueError(f"{zone} has soil water outside [0,1]")
        if not values["temperature_K"].between(200, 340).all():
            raise ValueError(f"{zone} temperature is outside the declared physical sanity range")
        summaries.append({"zone": zone, "rows": len(group), "basin_id": str(group["HYBAS_ID"].iloc[0]),
            "basin_level":basin_level,
            "date_start": start, "date_end": end, "negative_runoff_values_rectified": int((values["runoff_m"] < 0).sum()),
            "negative_precipitation_values_rectified": int((values["precipitation_m"] < 0).sum()),
            "valid_area_m2_min": float(values["valid_area_m2"].min()),
            "valid_area_m2_max": float(values["valid_area_m2"].max()),
            "source_image_count": int(group["source_image"].nunique())})
    data["runoff_mm"] = data["runoff_m"].astype(float).clip(lower=0) * 1000
    data["precipitation_mm"] = data["precipitation_m"].astype(float).clip(lower=0) * 1000
    data["temperature_C"] = data["temperature_K"].astype(float) - 273.15
    data["soil_water"] = data["soil_m3m3"].astype(float)
    data["input_available"] = 1.
    data["input_age_01"] = 0.
    return data.sort_values(["zone", "date"]), summaries

def prepare(inputs: list[Path], output: Path, frequency: str, start: str, end: str,
            bibliography: Path, basin_geojson: Path | None = None) -> dict:
    if start != "2000-01-01" or end != "2024-12-31":
        raise ValueError("The publication protocol is locked to 2000–2024; use --check-only for the 2024 acquisition check")
    output = output.resolve()
    if not output.is_relative_to(ROOT):
        raise ValueError("Output must stay inside the repository")
    if not bibliography.is_file():
        raise FileNotFoundError("Verified bibliography is required")
    export_script = ROOT / "notebooks/export_era5_land_level7.js"
    output.mkdir(parents=True, exist_ok=True)
    raw_dir = output / "raw"
    raw_dir.mkdir(exist_ok=True)
    frames, downloads = [], []
    request = {"source": COLLECTIONS[frequency], "frequency": frequency, "start": start, "end": end,
               "source_bands": ["runoff_sum", "total_precipitation_sum", "temperature_2m", "volumetric_soil_water_layer_1"],
               "aggregation": "valid_land_pixel_area_weighted_mean", "basin_collection": "WWF/HydroSHEDS/v1/Basins/hybas_7",
               "export_script_sha256": digest(export_script)}
    for incoming in inputs:
        target = raw_dir / incoming.name
        if target.exists() and digest(target) != digest(incoming):
            raise ValueError(f"Different raw file already exists: {target}")
        if incoming.resolve() != target.resolve():
            shutil.copy2(incoming, target)
        frames.append(pd.read_csv(target))
        receipt = target.with_suffix(".receipt.json")
        write_json(receipt, {"request": request, "download_sha256": digest(target),
                            "recorded_at_utc": datetime.now(timezone.utc).isoformat(),
                            "acquisition": "author-supplied authenticated Earth Engine provider export; not a signed provider receipt"})
        downloads.append({"path": relative(target), "sha256": digest(target), "request": request,
                          "request_receipt": relative(receipt), "request_receipt_sha256": digest(receipt)})
    combined, summaries = validate_rows(pd.concat(frames, ignore_index=True), frequency, start, end)
    if any(row["basin_level"] != PRIMARY_BASIN_LEVEL for row in summaries):
        raise ValueError("The primary protocol requires level 7; level-5 coastal regions are retained as acquisition checks only")
    if basin_geojson is None:
        raise ValueError("The exported basin GeoJSON is required to make geographic support reproducible")
    geometry_audit=validate_basin_geometry(summaries,basin_geojson)
    basin_target = raw_dir / "selected_basins.geojson"
    if basin_target.resolve() != basin_geojson.resolve():
        shutil.copy2(basin_geojson, basin_target)
    source_url = SOURCE_URL + ("DAILY_AGGR" if frequency == "daily" else "MONTHLY_AGGR")
    source_manifest = output / "source_manifest.json"
    write_json(source_manifest, {"sources": [{"id": COLLECTIONS[frequency], "url": source_url,
        "doi": "10.5194/essd-13-4349-2021", "data_class": "reanalysis",
        "licence": "Copernicus Climate Change Service information licence; attribution required",
        "aggregation": request["aggregation"], "basin_geojson": relative(basin_target),
        "basin_geojson_sha256": digest(basin_target), "export_request": request}],
        "scope": "retrospective runoff-generation benchmark, not routed discharge, gauge observations, flood extent or live telemetry"})
    zone_records = []
    for row in summaries:
        zone = row["zone"]
        group = combined.loc[combined["zone"] == zone].copy()
        source_id = COLLECTIONS[frequency] + ":basin=" + row["basin_id"]
        group["target_type"] = "area_weighted_runoff_depth"
        group["observed_or_derived"] = "reanalysis_derived"
        group["target_source_id"] = source_id
        path = output / (zone + ".csv")
        group.to_csv(path, index=False, date_format="%Y-%m-%d")
        row.update(derived_csv_sha256=digest(path), selection_uses_test_data=False,
                   selection_period_end="2017-12-31", selection_rule="fixed geographical basin independent of outcomes",
                   download_files=downloads)
        target_meta = {"data_class": "reanalysis", "variable": "area-weighted total runoff generation",
            "units": "mm day-1" if frequency == "daily" else "mm month-1", "source_id": source_id,
            "source_url": source_url, "licence": "Copernicus C3S information licence; attribution required",
            "geographic_support": "valid land pixels in HydroBASINS level-5 basin " + row["basin_id"],
            "temporal_resolution": frequency + " accumulated depth", "routed_streamflow": False}
        feature_meta = {feature: {"data_class": "reanalysis", "units": units, "source_id": source_id,
                        "source_url": source_url, "licence": target_meta["licence"],
                        "available_at_forecast_origin": False, "availability_mode": "retrospective_hindcast",
                        "availability_note": "Only preceding dates are used; the ERA5-Land product itself is delayed and is not a real-time input feed"}
                        for feature, units in [("precipitation_mm", target_meta["units"]), ("temperature_C", "degC"), ("soil_water", "m3 m-3"),
                                               ("input_available", "binary, retrospective input presence"), ("input_age_01", "normalized cached-input age")]}
        zone_records.append({"id": zone, "label": zone.replace("_", " "), "file": relative(path),
            "date_column": "date", "target_column": "runoff_mm", "sampling_frequency": "D" if frequency == "daily" else "MS",
            "feature_columns": list(feature_meta), "feature_metadata": feature_meta,
            "include_lagged_target": True, "target_metadata": target_meta,
            "availability_feature_columns": ["input_available"], "age_feature_column": "input_age_01",
            "fixed_range_features": ["input_available", "input_age_01"],
            "source_note": "Provider-modelled runoff generation with documented grid/temporal support; all predictors are historical and the evaluation is retrospective"})
    preparation_audit = output / "preparation_audit.json"
    write_json(preparation_audit, {"zones": summaries, "request": request,
        "basin_geojson_sha256": digest(basin_target), "geometry":geometry_audit, "rectification_tolerance_mm": 0.01,
        "monthly_conversion": "GEE accumulated monthly sums are multiplied by 1000 only; no multiplication by days in month"})
    manifest = {"study_id": "HYDRO-D-26-00188-era5-land-runoff-" + frequency,
        "provenance_class": "reanalysis", "validation_mode": "physical_target_replacement",
        "target_kind": "regional_total_runoff_depth", "publication_eligible": True,
        "sampling_frequency": "D" if frequency == "daily" else "MS", "lookback": 30 if frequency == "daily" else 12,
        "seasonal_period": 365 if frequency == "daily" else 12, "moving_average_window": 7 if frequency == "daily" else 3,
        "baseline_history_window": 1095 if frequency == "daily" else None,
        "peak_quantile_from_training": .90, "prediction_bounds": {"lower": 0., "upper": None},
        "covariance_shrinkage": .10, "covariance_shrinkage_sensitivity": [0., .05, .10, .20],
        "bootstrap_block_length": 30 if frequency == "daily" else 12,
        "outage_horizons": [1, 3, 7] if frequency == "daily" else [1, 2, 3], "outage_origin_stride": 7 if frequency == "daily" else 1,
        "outage_max_gap": 7 if frequency == "daily" else 3, "outage_input_policy": "frozen",
        "source_manifest_file": relative(source_manifest), "data_preparation_audit_file": relative(preparation_audit),
        "verified_bibliography_file": relative(bibliography),
        "splits": {"train_start": "2000-01-01", "train_end": "2017-12-31", "validation_end": "2020-12-31", "test_end": "2024-12-31"},
        "training": {"seeds": [42, 123, 456, 789, 2024], "epochs": 100, "batch_size": 64 if frequency == "daily" else 16,
            "early_stopping_patience": 15, "learning_rate": .001, "lstm_units": 64, "attention_units": 32,
            "dropout": .2, "unroll_lstm": True, "precision": "float32", "include_outage_variant": True, "input_censoring_probability": .5},
        "zones": zone_records,
        "interpretation": "Retrospective reanalysis forecast and input-interruption benchmark. New observations and operational feeds are not demonstrated."}
    manifest_path = output / "experiment_manifest.json"
    write_json(manifest_path, manifest)
    return {"manifest": relative(manifest_path), "zones": summaries, "source_manifest": relative(source_manifest)}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, nargs="+", required=True)
    parser.add_argument("--basin-geojson", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data/runoff_revision")
    parser.add_argument("--frequency", choices=list(COLLECTIONS), default="daily")
    parser.add_argument("--start", default="2000-01-01")
    parser.add_argument("--end", default="2024-12-31")
    parser.add_argument("--bibliography", type=Path, default=ROOT / "analysis/verified_bibliography.runoff.csv")
    parser.add_argument("--check-only", action="store_true", help="Inspect a partial acquisition without creating a publication manifest")
    parser.add_argument("--audit-output-dir", type=Path, default=ROOT / "data/runoff_revision/acquisition_check_2024")
    args = parser.parse_args()
    if args.check_only:
        print(json.dumps(acquisition_check(args.input,args.basin_geojson,args.frequency,args.start,args.end,args.audit_output_dir),indent=2))
        return
    print(json.dumps(prepare(args.input, args.output_dir, args.frequency, args.start, args.end, args.bibliography, args.basin_geojson), indent=2))

if __name__ == "__main__":
    main()
