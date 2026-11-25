"""Acquire the pinned public WaterBench archive, with a Git-blob integrity check."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = "uihilab/WaterBench"
COMMIT = "46689cf41e4d3c6a09180c2ed17a162c26b87957"
REMOTE_PATH = "data/rawData/data_time_series.zip"
URL = f"https://raw.githubusercontent.com/{REPO}/{COMMIT}/{REMOTE_PATH}"

def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "CuuNet observed hydrology benchmark acquisition"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

def acquire(output: Path) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    tree = json.loads(fetch(f"https://api.github.com/repos/{REPO}/git/trees/{COMMIT}?recursive=1"))
    entry = next(item for item in tree["tree"] if item["path"] == REMOTE_PATH)
    target = output / "data_time_series.zip"
    started = time.monotonic()
    if not target.exists():
        request = urllib.request.Request(URL, headers={"User-Agent": "CuuNet observed hydrology benchmark acquisition"})
        partial = target.with_suffix(".partial")
        with urllib.request.urlopen(request, timeout=45) as response, partial.open("wb") as handle:
            size = 0
            while chunk := response.read(1024 * 1024):
                size += len(chunk)
                if size > int(entry["size"]):
                    raise ValueError("Archive exceeds the pinned Git tree size")
                handle.write(chunk)
        partial.replace(target)
    raw = target.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    if len(raw) != entry["size"] or blob != entry["sha"]:
        raise ValueError("Downloaded archive does not match the pinned public Git blob")
    with zipfile.ZipFile(target) as archive:
        bad = archive.testzip()
        if bad:
            raise ValueError(f"Corrupt ZIP member: {bad}")
        names = archive.namelist()
        metadata_names = [name for name in names if not name.endswith("/") and any(term in name.lower() for term in ("meta", "readme", "license"))]
        metadata = {}
        for name in metadata_names:
            if archive.getinfo(name).file_size <= 1024 * 1024:
                metadata[name] = archive.read(name).decode("utf-8", errors="replace")
    result = {"dataset": "WaterBench-Iowa", "paper_doi": "10.5194/essd-14-5605-2022",
        "dataset_doi": "10.5281/zenodo.7087806", "repository": REPO, "commit": COMMIT,
        "request": {"url": URL, "repository": REPO, "commit": COMMIT, "path": REMOTE_PATH},
        "download_sha256": hashlib.sha256(raw).hexdigest(), "git_blob_sha1": blob,
        "bytes": len(raw), "verified_at_utc": datetime.now(timezone.utc).isoformat(),
        "elapsed_seconds_in_this_call": time.monotonic() - started, "archive_members": names,
        "embedded_metadata": metadata,
        "provenance_limit": "Data are a published compiled benchmark; streamflow units, missingness and observation provenance must be checked before preparing a manuscript experiment"}
    (output / "acquisition_receipt.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if key not in {"archive_members", "embedded_metadata"}}, indent=2))
    print(json.dumps({"members": names[:15], "metadata": metadata}, ensure_ascii=True)[:14000])
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data/waterbench_observed/raw")
    args = parser.parse_args()
    acquire(args.output_dir)

if __name__ == "__main__":
    main()
