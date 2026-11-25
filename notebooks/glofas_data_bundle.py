"""Portable raw-data and request-journal archives for CPU-to-GPU handoff.

No credentials, runtime directories, extracted duplicate NetCDF files or signed
download URLs are included. Imports verify every member before writing files.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FORMAT = "cuunet-glofas-data-v1"
DATA_PREFIX = "data/glofas_revision/"
MANIFEST = "data/experiment_manifest.glofas.json"


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def permitted(name: str) -> bool:
    path = PurePosixPath(name)
    return ("\\" not in name and not path.is_absolute() and ".." not in path.parts
            and (name.startswith(DATA_PREFIX) or name == MANIFEST)
            and not name.endswith((".tmp", ".partial"))
            and "/extracted/" not in name)


def export_bundle(root: Path, output: Path, *, metadata_only: bool = False,
                  raw_dir: Path | None = None) -> dict:
    root = root.resolve()
    output = output.resolve()
    if not output.is_relative_to(root):
        # Kaggle output ZIPs belong to /kaggle/working beside the restored repo.
        if output.parent != root.parent:
            raise ValueError("Bundle output must stay in the project or its parent output folder")
    sources: dict[str, Path] = {}
    raw = raw_dir or root / "data/glofas_revision/raw"
    if raw.exists():
        for path in sorted(raw.iterdir()):
            if not path.is_file():
                continue
            if metadata_only and not path.name.endswith((".job.json", ".split.json", ".request.json")):
                continue
            name = DATA_PREFIX + "raw/" + path.name
            if permitted(name) and path.suffix in {".zip", ".nc", ".nc4", ".json"}:
                sources[name] = path
    if not metadata_only:
        derived = root / "data/glofas_revision"
        if derived.exists():
            for path in sorted(derived.iterdir()):
                if path.is_file() and path.suffix in {".csv", ".json"}:
                    sources[DATA_PREFIX + path.name] = path
        if (root / MANIFEST).is_file():
            sources[MANIFEST] = root / MANIFEST
    source_manifest = root / "data/source_manifest.glofas.verified.json"
    context = {"format": FORMAT, "metadata_only": metadata_only,
               "source_manifest_sha256": file_hash(source_manifest) if source_manifest.is_file() else None,
               "files": {name: {"sha256": file_hash(path), "bytes": path.stat().st_size}
                         for name, path in sources.items()}}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(output.name + ".tmp")
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=4) as archive:
        archive.writestr("glofas_bundle_manifest.json", json.dumps(context, indent=2))
        for name, path in sources.items():
            archive.write(path, name)
    temporary.replace(output)
    return context


def import_bundle(root: Path, source: Path) -> dict:
    root = root.resolve()
    source = source.resolve()
    with zipfile.ZipFile(source) as archive:
        members = archive.infolist()
        names = [item.filename for item in members]
        if len(names) != len(set(names)):
            raise ValueError("Duplicate archive paths are not allowed")
        context = json.loads(archive.read("glofas_bundle_manifest.json"))
        if context.get("format") != FORMAT:
            raise ValueError("This is not a verified CuuNet GloFAS bundle")
        declared = context.get("files", {})
        if set(names) != set(declared) | {"glofas_bundle_manifest.json"}:
            raise ValueError("Bundle members do not match the declared file inventory")
        expected_source = context.get("source_manifest_sha256")
        source_manifest = root / "data/source_manifest.glofas.verified.json"
        if expected_source and (not source_manifest.is_file() or file_hash(source_manifest) != expected_source):
            raise ValueError("The dataset source manifest differs from the one used for acquisition")
        # Validate everything in a task-local staging directory, then commit.
        staging_parent = root / "analysis/glofas_import_tmp"
        staging_parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=staging_parent) as temporary:
            staged = []
            for member in members:
                name = member.filename
                if name == "glofas_bundle_manifest.json":
                    continue
                if not permitted(name) or member.is_dir() or (member.external_attr >> 16) & 0o170000 == 0o120000:
                    raise ValueError(f"Disallowed bundle member: {name}")
                target = (root / name).resolve()
                if not target.is_relative_to(root):
                    raise ValueError("Bundle path leaves the project")
                path = Path(temporary) / name
                path.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(member) as incoming, path.open("wb") as outgoing:
                    digest = hashlib.sha256()
                    count = 0
                    for chunk in iter(lambda: incoming.read(1024 * 1024), b""):
                        count += len(chunk)
                        if count > declared[name]["bytes"]:
                            raise ValueError(f"Archive size exceeds the declaration: {name}")
                        digest.update(chunk)
                        outgoing.write(chunk)
                if count != declared[name]["bytes"] or digest.hexdigest() != declared[name]["sha256"]:
                    raise ValueError(f"Bundle hash or byte count mismatch: {name}")
                if target.exists() and file_hash(target) != declared[name]["sha256"]:
                    compatible = False
                    if name.endswith((".job.json", ".request.json", ".split.json")):
                        existing = json.loads(target.read_text(encoding="utf-8"))
                        incoming = json.loads(path.read_text(encoding="utf-8"))
                        identity = ["dataset_id", "request"]
                        if name.endswith(".split.json"):
                            identity += ["children"]
                        else:
                            identity += ["request_id"]
                        if name.endswith(".request.json"):
                            identity += ["download_sha256", "download_bytes"]
                        compatible = all(existing.get(key) == incoming.get(key) for key in identity)
                    if not compatible:
                        raise ValueError(f"A different local file exists: {name}; preserve it before choosing an archive")
                staged.append((path, target))
            for path, target in staged:
                if not target.exists():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    os.replace(path, target)
    return context


def main() -> None:
    parser = argparse.ArgumentParser()
    command = parser.add_mutually_exclusive_group(required=True)
    command.add_argument("--export", type=Path)
    command.add_argument("--import", dest="import_path", type=Path)
    parser.add_argument("--metadata-only", action="store_true")
    args = parser.parse_args()
    result = (export_bundle(ROOT, args.export, metadata_only=args.metadata_only)
              if args.export else import_bundle(ROOT, args.import_path))
    print(json.dumps({"format": result["format"], "files": len(result["files"]),
                      "metadata_only": result["metadata_only"]}))


if __name__ == "__main__":
    main()
