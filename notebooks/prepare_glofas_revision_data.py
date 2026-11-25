"""Download and prepare the GloFAS physical-target revision dataset.

This script is intended for a Kaggle notebook with Internet access and an
accepted CEMS-FLOODS licence. It downloads consolidated GloFAS v4.0 daily
discharge for two small bounding boxes, selects a representative river-channel
grid cell by a documented rule, aggregates the data to monthly values, and
writes the publication experiment manifest consumed by revision_experiments.py.

The output is reanalysis, not gauge observation. The generated metadata keeps
that distinction explicit.
"""

from __future__ import annotations

import argparse
import calendar
import hashlib
import json
import math
import os
import shutil
import sys
import zipfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DATASET_ID = "cems-glofas-historical"
VARIABLE = "average_river_discharge_in_the_last_24_hours"
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
CHANNEL_SELECTION_END = "2017-12-31"

# These are approximate river-reach centres, not asserted gauge coordinates.
# The final grid cell is selected reproducibly from the downloaded GloFAS box.
ZONES = [
    {
        "id": "Bao_Ha_Reach",
        "label": "Bao Ha reach, Thao and Red River system",
        "centre_lat": 22.26,
        "centre_lon": 104.47,
        "area": [22.65, 104.05, 21.90, 104.90],
        "context": "Approximate Bao Ha reach centre in Bao Yen District, Lao Cai; not an exact gauge coordinate.",
    },
    {
        "id": "Can_Tho_Reach",
        "label": "Can Tho reach, Hau and Mekong River system",
        "centre_lat": 10.03,
        "centre_lon": 105.78,
        "area": [10.35, 105.45, 9.70, 106.10],
        "context": "Approximate Can Tho urban river reach centre; not an exact gauge coordinate.",
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/glofas_revision"),
        help="Repository-relative directory for raw and derived data.",
    )
    parser.add_argument(
        "--manifest-out",
        type=Path,
        default=Path("data/experiment_manifest.glofas.json"),
    )
    parser.add_argument(
        "--source-manifest",
        type=Path,
        default=Path("data/source_manifest.glofas.verified.json"),
    )
    parser.add_argument("--start-year", type=int, default=2000)
    parser.add_argument("--end-year", type=int, default=2024)
    parser.add_argument("--chunk-years", type=int, default=1,
                        help="Initial years per request; oversized requests are split before submission.")
    parser.add_argument("--channel-search-radius", type=float, default=0.20)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--download-only", action="store_true",
                        help="Acquire raw data on CPU without fitting models or preparing monthly series.")
    parser.add_argument("--prepare-only", action="store_true",
                        help="Prepare existing verified raw files; never contact Copernicus or submit jobs.")
    parser.add_argument("--register-only", action="store_true",
                        help="Save supplied existing request IDs locally without contacting Copernicus.")
    parser.add_argument("--adopt-request", action="append", default=[], metavar="ZONE:YEAR:UUID",
                        help="Reconnect to an already submitted annual EWDS job after checking its full request.")
    parser.add_argument("--checkpoint-out", type=Path,
                        help="Refresh a portable request-journal ZIP immediately after each submission.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the official CDS requests without downloading data.",
    )
    return parser.parse_args()


def atomic_json(path: Path, value: Any) -> None:
    """Commit a request ID before any wait, using a flushed, atomic file replacement."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.flush()
        os.fsync(handle.fileno())
    temporary.replace(path)


def normalise_request(request: dict[str, Any]) -> dict[str, Any]:
    """Compare SDK scalar/list representations without weakening date/area checks."""
    normalised = {}
    for name, value in request.items():
        if name == "area":
            normalised[name] = [float(part) for part in value]
            if len(normalised[name]) != 4 or not all(math.isfinite(part) for part in normalised[name]):
                raise ValueError("The recorded request has an invalid bounding box")
        else:
            values = value if isinstance(value, list) else [value]
            parts = [str(part) for part in values]
            if name in {"month", "day"}:
                parts = [f"{int(part):02d}" for part in parts]
            normalised[name] = sorted(parts)
    return normalised


def refresh_checkpoint(raw_dir: Path, checkpoint_out: Path | None) -> None:
    if checkpoint_out is None:
        return
    # Journals contain parameters and UUIDs, never access tokens or signed URLs.
    from glofas_data_bundle import export_bundle
    export_bundle(REPOSITORY_ROOT, checkpoint_out, metadata_only=True,
                  raw_dir=raw_dir)


def register_adoptions(raw_dir: Path, entries: list[str], checkpoint_out: Path | None = None) -> None:
    zones = {zone["id"]: zone for zone in ZONES}
    for entry in entries:
        try:
            zone_id, year, request_id = entry.split(":")
            uuid.UUID(request_id)
            year_number = int(year)
            zone = zones[zone_id]
        except (ValueError, KeyError) as error:
            raise ValueError("Use --adopt-request ZONE:YEAR:UUID with Bao_Ha_Reach or Can_Tho_Reach") from error
        if not 2000 <= year_number <= 2024:
            raise ValueError("Existing jobs must belong to the locked 2000-2024 protocol")
        request = build_request([str(year_number)], zone["area"])
        journal = (raw_dir / request_file_name(zone_id, request)).with_suffix(".job.json")
        if journal.exists():
            recorded = json.loads(journal.read_text(encoding="utf-8"))
            if recorded.get("request_id") != request_id or normalise_request(recorded["request"]) != normalise_request(request):
                raise RuntimeError(f"A different job is already recorded for {zone_id} {year}; keep both IDs for diagnosis")
        else:
            atomic_json(journal, {"dataset_id": DATASET_ID, "request": request,
                "request_id": request_id, "state": "adopted_unverified", "cleanup": False,
                "recorded_at_utc": datetime.now(timezone.utc).isoformat(),
                "origin": "existing provider job supplied by the user"})
        print(f"Saved existing job {request_id} for {zone_id} {year}; parameters will be verified on reconnect", flush=True)
    refresh_checkpoint(raw_dir, checkpoint_out)


def repository_path(path: Path) -> Path:
    resolved = (path if path.is_absolute() else REPOSITORY_ROOT / path).resolve()
    if not resolved.is_relative_to(REPOSITORY_ROOT.resolve()):
        raise ValueError(f"Data preparation paths must stay inside the repository: {resolved}")
    return resolved


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def year_chunks(start: int, end: int, width: int) -> list[list[str]]:
    if start > end:
        raise ValueError("start-year must not exceed end-year")
    if width < 1:
        raise ValueError("chunk-years must be positive")
    chunks = []
    current = start
    while current <= end:
        chunk_end = min(end, current + width - 1)
        chunks.append([str(year) for year in range(current, chunk_end + 1)])
        current = chunk_end + 1
    return chunks


def build_request(years: list[str], area: list[float]) -> dict[str, Any]:
    return {
        "system_version": ["version_4_0"],
        "hydrological_model": "lisflood",
        "product_type": "consolidated",
        "timespan": "time_mean",
        "variable": VARIABLE,
        "year": years,
        "month": [f"{month:02d}" for month in range(1, 13)],
        "day": [f"{day:02d}" for day in range(1, 32)],
        "area": area,
        "data_format": "netcdf",
        "download_format": "zip",
    }


def resolve_cds_credentials() -> tuple[str, str]:
    url = os.getenv("CDSAPI_URL", "https://ewds.climate.copernicus.eu/api")
    key = os.getenv("CDSAPI_KEY")
    if not key:
        try:
            from kaggle_secrets import UserSecretsClient

            key = UserSecretsClient().get_secret("CDSAPI_KEY")
        except Exception:
            key = None
    if not key:
        raise RuntimeError(
            "Missing CDSAPI_KEY. Add it as a private Kaggle Secret after accepting "
            "the CEMS-FLOODS licence on the GloFAS dataset page."
        )
    return url, key


def split_temporal_request(request: dict[str, Any]) -> list[dict[str, Any]]:
    """Partition requested dates without changing the physical data selection."""
    for dimension in ("year", "month", "day"):
        values = request[dimension]
        if len(values) <= 1:
            continue
        midpoint = len(values) // 2
        children = []
        for selected in (values[:midpoint], values[midpoint:]):
            child = {**request, dimension: list(selected)}
            if len(child["year"]) == len(child["month"]) == 1:
                last_day = calendar.monthrange(int(child["year"][0]), int(child["month"][0]))[1]
                child["day"] = [day for day in child["day"] if int(day) <= last_day]
            if child["day"]:
                children.append(child)
        return children
    return []


def exceeds_cost_limit(costs: Any) -> bool:
    if costs is None:
        return False
    entries = costs if isinstance(costs, list) else costs.get("costs", [costs])
    for entry in entries:
        if "cost" not in entry or "limit" not in entry:
            continue
        cost, limit = float(entry["cost"]), float(entry["limit"])
        if not math.isfinite(cost) or not math.isfinite(limit) or cost < 0 or limit < 0:
            raise RuntimeError("GloFAS costing API returned invalid cost or limit")
        if cost > limit:
            return True
    return False


def is_cost_limit_error(error: Exception) -> bool:
    status = getattr(getattr(error, "response", None), "status_code", None)
    message = str(error).lower()
    return status in (403, 413) and any(phrase in message for phrase in
                                      ("cost limits exceeded", "cost limit exceeded", "request is too large"))


def request_file_name(zone_id: str, request: dict[str, Any]) -> str:
    years = request["year"]
    stem = f"{zone_id}_{years[0]}_{years[-1]}"
    if request["month"] != [f"{month:02d}" for month in range(1, 13)] or request["day"] != [f"{day:02d}" for day in range(1, 32)]:
        digest = hashlib.sha256(json.dumps(request, sort_keys=True).encode()).hexdigest()[:12]
        stem += f"_m{request['month'][0]}_{request['month'][-1]}_{digest}"
    return stem + ".zip"


def retrieve_chunks(
    zone: dict[str, Any],
    raw_dir: Path,
    chunks: list[list[str]],
    force: bool,
    *,
    prepare_only: bool = False,
    checkpoint_out: Path | None = None,
) -> list[Path]:
    client = None
    def api_client():
        nonlocal client
        if client is None:
            try:
                import cdsapi
            except ImportError as error:
                raise RuntimeError("Install cdsapi before downloading GloFAS data") from error
            url, key = resolve_cds_credentials()
            legacy = cdsapi.Client(url=url, key=key, quiet=False, delete=False,
                                   wait_until_complete=False)
            client = getattr(legacy, "client", None)
            if client is None or not callable(getattr(client, "submit", None)) or not callable(getattr(client, "get_remote", None)):
                raise RuntimeError("The resumable downloader requires cdsapi 0.7.7 and ecmwf-datastores-client 0.6.0")
        return client

    def retrieve_request(request: dict[str, Any]) -> list[Path]:
        target = raw_dir / request_file_name(zone["id"], request)
        receipt = target.with_suffix(".request.json")
        journal = target.with_suffix(".job.json")
        split_plan = target.with_suffix(".split.json")
        if split_plan.exists():
            plan = json.loads(split_plan.read_text(encoding="utf-8"))
            if plan.get("dataset_id") != DATASET_ID or normalise_request(plan["request"]) != normalise_request(request):
                raise RuntimeError(f"Cached split plan does not match {target.name}")
            expected_children = split_temporal_request(request)
            if plan.get("children") != expected_children:
                raise RuntimeError(f"Cached split plan does not preserve the requested dates for {target.name}")
            return [path for child in plan["children"] for path in retrieve_request(child)]
        if force or not target.exists() or not receipt.exists():
            if prepare_only:
                raise FileNotFoundError(f"Verified raw data missing: {target}. CPU acquisition must finish before GPU training.")
            provider = api_client()
            if journal.exists():
                job = json.loads(journal.read_text(encoding="utf-8"))
                if job.get("dataset_id") != DATASET_ID or normalise_request(job["request"]) != normalise_request(request):
                    raise RuntimeError(f"Recorded provider job does not match {target.name}")
                remote = provider.get_remote(job["request_id"])
                remote.cleanup = False
                costs = job.get("cost_estimate")
                print(f"Reconnecting to existing EWDS job {job['request_id']} for {target.name}; no new submission", flush=True)
            else:
                estimator = getattr(provider, "estimate_costs", None)
                try:
                    costs = estimator(DATASET_ID, request) if callable(estimator) else None
                except Exception as error:
                    if is_cost_limit_error(error):
                        return retrieve_smaller(request, str(error))
                    raise
                if exceeds_cost_limit(costs):
                    return retrieve_smaller(request, f"costing API: {json.dumps(costs)}")
                try:
                    remote = provider.submit(DATASET_ID, request)
                except Exception as error:
                    if is_cost_limit_error(error):
                        return retrieve_smaller(request, str(error))
                    raise
                remote.cleanup = False
                # request_id comes from the remote URL and does not poll the job.
                job = {"dataset_id": DATASET_ID, "request": request,
                    "request_id": remote.request_id, "state": "submitted", "cleanup": False,
                    "recorded_at_utc": datetime.now(timezone.utc).isoformat(), "cost_estimate": costs}
                atomic_json(journal, job)
                refresh_checkpoint(raw_dir, checkpoint_out)
                print(f"Saved EWDS job {job['request_id']} before waiting; journal: {journal}", flush=True)
            # Use the public metadata representation. This read also verifies an
            # adopted UUID belongs to this collection, reach, dates and format.
            metadata = remote.json
            remote_request = metadata.get("metadata", {}).get("request", {}).get("ids")
            if metadata.get("processID") != DATASET_ID or not isinstance(remote_request, dict) or normalise_request(remote_request) != normalise_request(request):
                raise RuntimeError(f"EWDS job {job['request_id']} has different collection or request parameters; nothing was downloaded or resubmitted")
            if remote.request_id != job["request_id"]:
                raise RuntimeError("Provider returned a different request ID")
            job["state"] = metadata.get("status", "verified")
            job["verified_at_utc"] = datetime.now(timezone.utc).isoformat()
            atomic_json(journal, job)
            refresh_checkpoint(raw_dir, checkpoint_out)
            if job["state"] in {"failed", "rejected", "dismissed", "deleted"}:
                raise RuntimeError(f"Existing EWDS job {job['request_id']} is {job['state']}; inspect it in Your requests before requesting a replacement")
            partial = target.with_suffix(".partial")
            partial.unlink(missing_ok=True)
            try:
                remote.download(str(partial))
            except Exception as error:
                partial.unlink(missing_ok=True)
                if is_cost_limit_error(error):
                    return retrieve_smaller(request, str(error))
                raise
            if not partial.exists() or partial.stat().st_size == 0:
                raise RuntimeError(f"Empty GloFAS download: {partial}")
            if zipfile.is_zipfile(partial):
                with zipfile.ZipFile(partial) as archive:
                    if archive.testzip() is not None:
                        raise RuntimeError(f"Corrupt GloFAS ZIP: {partial}")
            else:
                with partial.open("rb") as handle:
                    header = handle.read(8)
                if not (header.startswith(b"CDF") or header == b"\x89HDF\r\n\x1a\n"):
                    raise RuntimeError(f"The download is neither ZIP nor NetCDF: {partial}")
            partial.replace(target)
            atomic_json(receipt, {
                "dataset_id": DATASET_ID, "request": request,
                "request_id": job["request_id"],
                "downloaded_at_utc": datetime.now(timezone.utc).isoformat(),
                "download_sha256": sha256(target), "download_bytes": target.stat().st_size,
                "provider_api": "https://ewds.climate.copernicus.eu/api",
                "catalogue_doi": "10.24381/cds.a4fdd6b9",
                "cost_estimate": costs,
            })
            job["state"] = "downloaded"
            job["download_sha256"] = sha256(target)
            atomic_json(journal, job)
            refresh_checkpoint(raw_dir, checkpoint_out)
        else:
            recorded = json.loads(receipt.read_text(encoding="utf-8"))
            if recorded.get("dataset_id") != DATASET_ID or normalise_request(recorded["request"]) != normalise_request(request) or recorded.get("download_sha256") != sha256(target):
                raise RuntimeError(f"Cached GloFAS request or hash mismatch for {target}; use --force to retrieve it again")
        if zipfile.is_zipfile(target):
            with zipfile.ZipFile(target) as archive:
                if archive.testzip() is not None:
                    raise RuntimeError(f"Corrupt cached GloFAS ZIP: {target}")
        return [target]

    def retrieve_smaller(request: dict[str, Any], reason: str) -> list[Path]:
        children = split_temporal_request(request)
        if not children:
            raise RuntimeError(f"GloFAS rejected even a one-day request for {zone['id']}: {reason}")
        print(f"Splitting GloFAS request for {zone['id']} before continuing: {reason}", flush=True)
        target = raw_dir / request_file_name(zone["id"], request)
        atomic_json(target.with_suffix(".split.json"), {"dataset_id": DATASET_ID,
            "request": request, "children": children, "reason": reason})
        refresh_checkpoint(raw_dir, checkpoint_out)
        paths = []
        for child in children:
            paths.extend(retrieve_request(child))
        return paths

    downloads = []
    for years in chunks:
        downloads.extend(retrieve_request(build_request(years, zone["area"])))
    return downloads


def extract_data_files(downloads: list[Path], extract_dir: Path, force: bool) -> list[Path]:
    if force and extract_dir.exists():
        raw_root = downloads[0].parent.resolve()
        resolved_target = extract_dir.resolve()
        if resolved_target == raw_root or not resolved_target.is_relative_to(raw_root):
            raise ValueError(f"Refusing to remove a directory outside the raw extraction area: {resolved_target}")
        shutil.rmtree(extract_dir)
    extract_dir.mkdir(parents=True, exist_ok=True)
    data_files: list[Path] = []
    for archive in downloads:
        if zipfile.is_zipfile(archive):
            destination = extract_dir / archive.stem
            destination.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(archive) as zipped:
                for member in zipped.infolist():
                    extracted_path = (destination / member.filename).resolve()
                    if not extracted_path.is_relative_to(destination.resolve()):
                        raise ValueError(f"Archive member leaves extraction directory: {member.filename}")
                zipped.extractall(destination)
            data_files.extend(sorted(destination.rglob("*.nc")))
            data_files.extend(sorted(destination.rglob("*.nc4")))
        else:
            data_files.append(archive)
    unique = sorted({path.resolve() for path in data_files})
    if not unique:
        raise RuntimeError(f"No NetCDF files found in {extract_dir}")
    return unique


def coordinate_name(dataset: Any, candidates: tuple[str, ...]) -> str:
    for name in candidates:
        if name in dataset.coords or name in dataset.dims:
            return name
    raise ValueError(f"None of the coordinate names {candidates} were found")


def data_variable_name(dataset: Any) -> str:
    names = list(dataset.data_vars)
    preferred = [
        name
        for name in names
        if "discharge" in name.lower() or name.lower() in {"dis24", "q", "river_discharge"}
    ]
    if len(preferred) == 1:
        return preferred[0]
    if len(names) == 1:
        return names[0]
    raise ValueError(f"Could not identify discharge variable. Data variables: {names}")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    value = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


def select_channel_series(
    files: list[Path],
    zone: dict[str, Any],
    radius_degrees: float,
    start_year: int,
    end_year: int,
    selection_end: str = CHANNEL_SELECTION_END,
) -> tuple[Any, dict[str, Any]]:
    try:
        import numpy as np
        import pandas as pd
        import xarray as xr
    except ImportError as error:
        raise RuntimeError("Install numpy, pandas, xarray and netCDF4 before processing") from error

    loaded = []
    try:
        for path in files:
            loaded.append(xr.open_dataset(path).load())
        first = loaded[0]
        time_name = coordinate_name(first, ("time", "valid_time", "date"))
        latitude_name = coordinate_name(first, ("latitude", "lat", "y"))
        longitude_name = coordinate_name(first, ("longitude", "lon", "x"))
        for dataset in loaded[1:]:
            for name in (latitude_name, longitude_name):
                if name not in dataset.coords or not np.array_equal(dataset[name].values, first[name].values):
                    raise ValueError(f"Inconsistent spatial coordinates across raw chunks: {name}")
        combined = xr.concat(
            loaded,
            dim=time_name,
            data_vars="minimal",
            coords="minimal",
            compat="override",
            combine_attrs="override",
        ).sortby(time_name)
        variable_name = data_variable_name(combined)
        discharge = combined[variable_name]

        unexpected_dims = {
            name: int(size)
            for name, size in discharge.sizes.items()
            if name not in {time_name, latitude_name, longitude_name} and int(size) > 1
        }
        if unexpected_dims:
            raise ValueError(f"Unexpected non-singleton dimensions: {unexpected_dims}")
        extra_dims = [name for name in discharge.dims if name not in {time_name, latitude_name, longitude_name}]
        if extra_dims:
            discharge = discharge.squeeze(dim=extra_dims, drop=True)
        discharge = discharge.transpose(time_name, latitude_name, longitude_name)
        units = str(discharge.attrs.get("units", "")).lower().replace(" ", "").replace("**", "").replace("^", "")
        if units not in {"m3s-1", "m3/s", "m3sec-1"}:
            raise ValueError(f"Discharge units must be confirmed as m3 s-1, found {discharge.attrs.get('units')!r}")

        latitudes = np.asarray(discharge[latitude_name].values, dtype=float)
        longitudes = np.asarray(discharge[longitude_name].values, dtype=float)
        if latitudes.ndim != 1 or longitudes.ndim != 1:
            raise ValueError("Expected one-dimensional latitude and longitude coordinates")

        target_lon = float(zone["centre_lon"])
        if np.nanmax(longitudes) > 180 and target_lon < 0:
            target_lon %= 360
        lon_distance = np.abs(((longitudes - target_lon + 180) % 360) - 180)
        lat_mask = np.abs(latitudes - float(zone["centre_lat"])) <= radius_degrees
        lon_mask = lon_distance <= radius_degrees
        if not lat_mask.any() or not lon_mask.any():
            raise RuntimeError(f"No grid coordinates within search radius for {zone['id']}")

        subset = discharge.isel(
            {
                latitude_name: np.where(lat_mask)[0],
                longitude_name: np.where(lon_mask)[0],
            }
        )
        selection_data = subset.sel({time_name: slice(f"{start_year}-01-01", selection_end)})
        if selection_data.sizes[time_name] < 365:
            raise ValueError("Channel selection requires at least one year of training-period data")
        mean_field = selection_data.mean(dim=time_name, skipna=True).values
        finite_positive = np.isfinite(mean_field) & (mean_field > 0)
        if not finite_positive.any():
            raise RuntimeError(f"No positive-discharge channel cells found for {zone['id']}")
        score = np.where(finite_positive, mean_field, -np.inf)
        lat_index, lon_index = np.unravel_index(int(np.nanargmax(score)), score.shape)
        selected_lat = float(subset[latitude_name].values[lat_index])
        selected_lon_raw = float(subset[longitude_name].values[lon_index])
        selected_lon = selected_lon_raw - 360 if selected_lon_raw > 180 else selected_lon_raw
        series = subset.isel({latitude_name: lat_index, longitude_name: lon_index})

        dates = pd.to_datetime(series[time_name].values).normalize()
        values = np.asarray(series.values, dtype=float).reshape(-1)
        daily = pd.Series(values, index=dates, name="discharge_m3s")
        duplicate_rows = int(daily.index.duplicated().sum())
        if duplicate_rows and (daily.groupby(level=0).nunique(dropna=False) > 1).any():
            raise ValueError(f"Conflicting duplicate daily values in {zone['id']}")
        daily = daily.loc[~daily.index.duplicated(keep="first")].sort_index()
        daily = daily.loc[f"{start_year}-01-01":f"{end_year}-12-31"]
        full_index = pd.date_range(f"{start_year}-01-01", f"{end_year}-12-31", freq="D")
        daily = daily.reindex(full_index)
        if np.isinf(daily.to_numpy()).any() or (daily.dropna() < 0).any():
            raise ValueError(f"Invalid negative or infinite river discharge in {zone['id']}")
        missing_fraction = float(daily.isna().mean())
        if missing_fraction > 0.01:
            raise RuntimeError(
                f"{zone['id']} has {missing_fraction:.2%} missing daily values; no interpolation was applied"
            )

        selection = {
            "zone": zone["id"],
            "reach_label": zone["label"],
            "reach_centre_latitude": float(zone["centre_lat"]),
            "reach_centre_longitude": float(zone["centre_lon"]),
            "selected_grid_latitude": selected_lat,
            "selected_grid_longitude": selected_lon,
            "distance_from_reach_centre_km": haversine_km(
                float(zone["centre_lat"]),
                float(zone["centre_lon"]),
                selected_lat,
                selected_lon,
            ),
            "selection_rule": (
                "Maximum training-period mean positive GloFAS discharge within "
                f"{radius_degrees:.2f} degrees of the documented approximate reach centre"
            ),
            "selection_period_start": f"{start_year}-01-01",
            "selection_period_end": selection_end,
            "selection_uses_test_data": False,
            "duplicate_daily_rows_removed": duplicate_rows,
            "units_in_download": str(discharge.attrs.get("units")),
            "variable_in_download": variable_name,
            "daily_start": str(daily.index.min().date()),
            "daily_end": str(daily.index.max().date()),
            "daily_rows": int(len(daily)),
            "missing_daily_fraction": missing_fraction,
            "mean_discharge_m3s": float(daily.mean()),
            "maximum_discharge_m3s": float(daily.max()),
            "source_class": "GloFAS modelled hydrological reanalysis, not gauge observation",
        }
        return daily, selection
    finally:
        for dataset in loaded:
            dataset.close()


def aggregate_monthly(daily: Any) -> Any:
    import pandas as pd

    frame = daily.to_frame()
    monthly = pd.DataFrame(
        {
            "discharge_m3s": frame["discharge_m3s"].resample("MS").mean(),
            "monthly_peak_discharge_m3s": frame["discharge_m3s"].resample("MS").max(),
            "available_reanalysis_daily_count": frame["discharge_m3s"].resample("MS").count(),
        }
    )
    monthly["expected_daily_count"] = [calendar.monthrange(index.year, index.month)[1] for index in monthly.index]
    monthly["daily_coverage_fraction"] = (
        monthly["available_reanalysis_daily_count"] / monthly["expected_daily_count"]
    )
    if (monthly["daily_coverage_fraction"] < 0.90).any():
        failed = monthly.index[monthly["daily_coverage_fraction"] < 0.90].strftime("%Y-%m").tolist()
        raise RuntimeError(f"Monthly coverage below 90% for: {failed}")
    monthly.index.name = "date"
    return monthly.reset_index()


def write_manifest(
    output_path: Path,
    source_manifest_path: Path,
    zone_records: list[dict[str, Any]],
) -> None:
    relative_source_manifest = source_manifest_path.relative_to(REPOSITORY_ROOT).as_posix()
    zones = []
    for record in zone_records:
        selection = record["selection"]
        zones.append(
            {
                "id": record["zone"]["id"],
                "label": record["zone"]["label"],
                "file": record["csv_path"].relative_to(REPOSITORY_ROOT).as_posix(),
                "date_column": "date",
                "target_column": "discharge_m3s",
                "target_metadata": {
                    "data_class": "reanalysis",
                    "variable": "monthly mean of average river discharge in the last 24 hours",
                    "units": "m3 s-1",
                    "source_id": (
                        f"{DATASET_ID}:version_4_0:{VARIABLE}:"
                        f"{selection['selected_grid_latitude']:.4f},"
                        f"{selection['selected_grid_longitude']:.4f}"
                    ),
                    "source_url": "https://doi.org/10.24381/cds.a4fdd6b9",
                    "licence": "CEMS-FLOODS datasets licence",
                    "geographic_support": (
                        f"GloFAS 0.05 degree channel cell at "
                        f"{selection['selected_grid_latitude']:.4f}, "
                        f"{selection['selected_grid_longitude']:.4f}; "
                        f"{selection['distance_from_reach_centre_km']:.2f} km from approximate reach centre"
                    ),
                    "temporal_resolution": "daily source aggregated to calendar-month mean",
                },
                "feature_columns": [],
                "feature_metadata": {},
                "include_lagged_target": True,
                "source_note": (
                    "Physical-target benchmark using GloFAS v4.0 consolidated LISFLOOD reanalysis. "
                    "The selected grid cell is not represented as an in-situ gauge."
                ),
            }
        )

    manifest = {
        "study_id": "HYDRO-D-26-00188-glofas-physical-benchmark",
        "provenance_class": "reanalysis",
        "validation_mode": "physical_target_replacement",
        "target_kind": "monthly_mean_river_discharge_m3s",
        "publication_eligible": True,
        "lookback": 12,
        "seasonal_period": 12,
        "peak_quantile_from_training": 0.90,
        "prediction_bounds": {"lower": 0.0, "upper": None},
        "moving_average_window": 3,
        "covariance_shrinkage": 0.10,
        "covariance_shrinkage_sensitivity": [0.0, 0.05, 0.10, 0.20],
        "bootstrap_block_length": 12,
        "diagnostic_months": ["2024-09-01"],
        "verified_bibliography_file": "analysis/verified_bibliography.glofas.csv",
        "data_preparation_audit_file": zone_records[0]["csv_path"].parent.relative_to(REPOSITORY_ROOT).as_posix() + "/glofas_selection_audit.json",
        "splits": {
            "train_start": "2000-01-01",
            "train_end": "2017-12-31",
            "validation_end": "2020-12-31",
            "test_end": "2024-12-31",
        },
        "training": {
            "seeds": [42, 123, 456, 789, 2024],
            "epochs": 100,
            "batch_size": 16,
            "early_stopping_patience": 15,
            "learning_rate": 0.001,
            "lstm_units": 64,
            "attention_units": 32,
            "dropout": 0.2,
            "unroll_lstm": True,
            "precision": "float32",
        },
        "source_manifest_file": relative_source_manifest,
        "zones": zones,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    if sum((args.download_only, args.prepare_only, args.register_only)) > 1:
        raise ValueError("Choose only one of --download-only, --prepare-only or --register-only")
    output_dir = repository_path(args.output_dir)
    manifest_out = repository_path(args.manifest_out)
    source_manifest = repository_path(args.source_manifest)
    if not source_manifest.exists():
        raise FileNotFoundError(f"Verified source manifest not found: {source_manifest}")

    chunks = year_chunks(args.start_year, args.end_year, args.chunk_years)
    if args.dry_run:
        for zone in ZONES:
            for years in chunks:
                print(json.dumps({"zone": zone["id"], "request": build_request(years, zone["area"])}, indent=2))
        return 0

    if args.start_year != 2000 or args.end_year != 2024:
        raise ValueError("The locked publication protocol requires exactly 2000-2024 coverage")
    if not 0 < args.channel_search_radius <= 0.30:
        raise ValueError("channel-search-radius must be within (0, 0.30] degrees")

    raw_dir = output_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_out = args.checkpoint_out.resolve() if args.checkpoint_out else None
    if args.adopt_request:
        register_adoptions(raw_dir, args.adopt_request, checkpoint_out)
    if args.register_only:
        print("Existing request IDs saved locally; no provider requests were submitted")
        return 0
    zone_records = []

    for zone in ZONES:
        downloads = retrieve_chunks(zone, raw_dir, chunks, args.force,
                                    prepare_only=args.prepare_only,
                                    checkpoint_out=checkpoint_out)
        if args.download_only:
            print(f"Verified all raw downloads for {zone['id']}", flush=True)
            continue
        extracted = extract_data_files(downloads, raw_dir / "extracted" / zone["id"], args.force)
        daily, selection = select_channel_series(
            extracted,
            zone,
            args.channel_search_radius,
            args.start_year,
            args.end_year,
        )
        monthly = aggregate_monthly(daily)
        monthly["target_type"] = "river_discharge"
        monthly["observed_or_derived"] = "reanalysis_derived"
        monthly["target_source_id"] = (
            f"{DATASET_ID}:version_4_0:{VARIABLE}:"
            f"{selection['selected_grid_latitude']:.4f},{selection['selected_grid_longitude']:.4f}"
        )
        csv_path = output_dir / f"{zone['id']}_GloFAS_monthly.csv"
        monthly.to_csv(csv_path, index=False, date_format="%Y-%m-%d")
        selection["derived_csv"] = csv_path.relative_to(REPOSITORY_ROOT).as_posix()
        selection["derived_csv_sha256"] = sha256(csv_path)
        selection["download_files"] = [
            {
                "path": path.relative_to(REPOSITORY_ROOT).as_posix(),
                "sha256": sha256(path),
                "bytes": path.stat().st_size,
                "request_receipt": path.with_suffix(".request.json").relative_to(REPOSITORY_ROOT).as_posix(),
                "request_receipt_sha256": sha256(path.with_suffix(".request.json")),
                "request": json.loads(path.with_suffix(".request.json").read_text(encoding="utf-8"))["request"],
            }
            for path in downloads
        ]
        zone_records.append(
            {"zone": zone, "csv_path": csv_path, "selection": selection}
        )

    if args.download_only:
        print("CPU acquisition complete. Run --prepare-only before the GPU forecasting experiments.")
        return 0

    selection_audit = {
        "prepared_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_id": DATASET_ID,
        "system_version": "version_4_0",
        "product_type": "consolidated",
        "timespan": "time_mean",
        "variable": VARIABLE,
        "period": f"{args.start_year}-01-01/{args.end_year}-12-31",
        "zones": [record["selection"] for record in zone_records],
    }
    (output_dir / "glofas_selection_audit.json").write_text(
        json.dumps(selection_audit, indent=2), encoding="utf-8"
    )

    event_rows = []
    for record in zone_records:
        import pandas as pd

        frame = pd.read_csv(record["csv_path"], parse_dates=["date"])
        event = frame.loc[frame["date"] == pd.Timestamp("2024-09-01")]
        if event.empty:
            continue
        training = frame.loc[frame["date"] <= pd.Timestamp("2017-12-31"), "discharge_m3s"]
        event_rows.append(
            {
                "zone": record["zone"]["id"],
                "month": "2024-09",
                "monthly_mean_discharge_m3s": float(event.iloc[0]["discharge_m3s"]),
                "monthly_peak_discharge_m3s": float(event.iloc[0]["monthly_peak_discharge_m3s"]),
                "training_p90_monthly_mean_discharge_m3s": float(training.quantile(0.90)),
                "is_above_training_p90": bool(event.iloc[0]["discharge_m3s"] >= training.quantile(0.90)),
                "interpretation_limit": "Monthly GloFAS reanalysis diagnostic, not a gauge peak; only the northern reach overlaps Yagi geographically.",
            }
        )
    (output_dir / "yagi_2024_event_summary.json").write_text(
        json.dumps(event_rows, indent=2), encoding="utf-8"
    )

    write_manifest(manifest_out, source_manifest, zone_records)
    print(f"Prepared {len(zone_records)} zones")
    print(f"Experiment manifest: {manifest_out}")
    print(f"Selection audit: {output_dir / 'glofas_selection_audit.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
