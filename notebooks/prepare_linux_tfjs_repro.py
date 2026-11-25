"""Prepare an isolated Ubuntu userspace under the workspace and test TF.js.

This Windows helper uses an existing WSL distro. It neither registers a new
distro nor changes its installed packages. Temporary bind mounts are cleaned
up on exit; downloads and the Linux runtime remain in .linux_tfjs_repro.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / ".linux_tfjs_repro"
UBUNTU_BASE = "https://cdimage.ubuntu.com/ubuntu-base/releases/24.04/release/"
UBUNTU_FILE = "ubuntu-base-24.04.3-base-amd64.tar.gz"


def read_url(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read()


def download(url: str, target: Path, expected: str) -> None:
    if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == expected:
        return
    print(f"Downloading {target.name}", flush=True)
    data = read_url(url)
    if hashlib.sha256(data).hexdigest() != expected:
        raise RuntimeError(f"Checksum mismatch: {target.name}")
    target.write_bytes(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pipeline-only", action="store_true")
    parser.add_argument("--glofas-only", action="store_true")
    args = parser.parse_args()
    WORK.mkdir(parents=True, exist_ok=True)
    if WORK.resolve().parent != ROOT.resolve():
        raise RuntimeError("Linux workspace leaves the project")
    downloads = WORK / "downloads"
    downloads.mkdir(exist_ok=True)
    checksum_lines = read_url(UBUNTU_BASE + "SHA256SUMS").decode().splitlines()
    checksum = next(line.split()[0] for line in checksum_lines if line.split()[-1].lstrip("*") == UBUNTU_FILE)
    archive = downloads / UBUNTU_FILE
    download(UBUNTU_BASE + UBUNTU_FILE, archive, checksum)
    uv_release = json.loads(read_url("https://pypi.org/pypi/uv/0.9.6/json"))
    wheel = next(item for item in uv_release["urls"] if
                 item["filename"] == "uv-0.9.6-py3-none-manylinux_2_17_x86_64.manylinux2014_x86_64.whl")
    wheel_path = downloads / wheel["filename"]
    download(wheel["url"], wheel_path, wheel["digests"]["sha256"])
    with zipfile.ZipFile(wheel_path) as package:
        binary_name = next(name for name in package.namelist() if name.endswith("/uv") and not name.endswith("/"))
        (WORK / "uv").write_bytes(package.read(binary_name))

    spec = importlib.util.spec_from_file_location("revision_bundle_generator", ROOT / "notebooks/build_revision_kaggle_bundle.py")
    generator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(generator)
    project = WORK / "project"
    for relative in [*generator.INPUT_FILES, "notebooks/test_tfjs_neural_export.py"]:
        destination = project / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / relative, destination)
    lock = (ROOT / "notebooks/requirements_revision_kaggle.lock.txt").read_text(encoding="utf-8")
    starts = list(re.finditer(r"(?m)^[a-zA-Z0-9][a-zA-Z0-9_.\[\]-]*==[^\r\n]+", lock))
    cpu_lock = "# Exact Kaggle versions/hashes, with optional NVIDIA packages omitted for CPU testing.\n"
    for index, match in enumerate(starts):
        end = starts[index + 1].start() if index + 1 < len(starts) else len(lock)
        block = lock[match.start():end]
        if block.startswith("nvidia-"):
            continue
        cpu_lock += block.replace("tensorflow[and-cuda]==", "tensorflow==")
    (project / "requirements_cpu.lock.txt").write_text(cpu_lock, encoding="utf-8")
    (project / "package.json").write_text(json.dumps({"private": True, "type": "module",
        "dependencies": {"@tensorflow/tfjs": "4.22.0"}}, indent=2), encoding="utf-8")

    install = r'''#!/bin/bash
set -eu
export DEBIAN_FRONTEND=noninteractive
export UV_CACHE_DIR=/opt/uv-cache UV_PYTHON_INSTALL_DIR=/opt/managed-python
export CUDA_VISIBLE_DEVICES=-1 OMP_NUM_THREADS=2 TF_NUM_INTRAOP_THREADS=2 TF_NUM_INTEROP_THREADS=2
export PYTHONHASHSEED=0 NPM_CONFIG_CACHE=/opt/npm-cache
mkdir -p /opt/logs
run_logged() {
    local name=$1
    shift
    printf '%s\n' "$name"
    if "$@" >"/opt/logs/$name.log" 2>&1; then return; fi
    tail -n 70 "/opt/logs/$name.log"
    exit 1
}
if [ ! -f /opt/system-libraries-ready ]; then
    run_logged ubuntu-package-index apt-get update -qq
    run_logged ubuntu-runtime-libraries apt-get install -y --no-install-recommends ca-certificates libstdc++6 libgomp1
    touch /opt/system-libraries-ready
fi
run_logged managed-python uv python install 3.12.12
if [ ! -f /opt/runtime/bin/python ]; then
    run_logged python-environment uv venv --python 3.12.12 --managed-python /opt/runtime
fi
run_logged locked-python-dependencies uv pip install --python /opt/runtime/bin/python --require-hashes -r /project/requirements_cpu.lock.txt
if [ ! -f /opt/node/bin/node ]; then
    run_logged node-runtime /opt/runtime/bin/python -m nodeenv --prebuilt --node=22.14.0 /opt/node
fi
export PATH=/opt/runtime/bin:/opt/node/bin:$PATH
cd /project
run_logged locked-tfjs-dependencies npm install --ignore-scripts --no-audit --no-fund
printf '%s\n' 'Testing trained attention models and official TF.js exports'
python notebooks/test_tfjs_neural_export.py --output-dir /project/output --pipeline-preflight 2>&1 | tee /opt/logs/neural-export.log
test -f /project/output/neural_export_test.json
'''
    # Bash pipefail is needed to preserve the Python failure while teeing diagnostics.
    install = install.replace("set -eu\n", "set -euo pipefail\n", 1)
    if args.pipeline_only:
        install = install.replace("--pipeline-preflight 2>&1", "--pipeline-preflight --pipeline-only 2>&1")
    if args.glofas_only:
        install = install[:install.index("if [ ! -f /opt/node/bin/node ]; then")] + r'''
export PATH=/opt/runtime/bin:$PATH
cd /project
printf '%s\n' 'Testing GloFAS request splitting, calendar coverage and cache recovery'
python notebooks/test_revision_pipeline.py GlofasTests GlofasDownloadTests 2>&1 | tee /opt/logs/glofas-retrieval.log
'''
    (WORK / "install.sh").write_text(install, encoding="utf-8", newline="\n")
    linux_work = "/mnt/host/" + ROOT.drive[0].lower() + str(WORK)[2:].replace("\\", "/")
    setup = '''#!/bin/sh
set -eu
work="LINUX_WORK"
rootfs="$work/rootfs"
test "$(readlink -f "$work")" = "$work"
test ! -L "$rootfs"
mkdir -p "$rootfs"
if [ ! -f "$rootfs/.ubuntu-base-verified" ]; then
    printf '%s\\n' 'Extracting verified Ubuntu userspace inside the project'
    tar -xzf "$work/downloads/UBUNTU_FILE" -C "$rootfs"
    touch "$rootfs/.ubuntu-base-verified"
fi
mkdir -p "$rootfs/project" "$rootfs/opt" "$rootfs/usr/local/bin"
cp "$work/uv" "$rootfs/usr/local/bin/uv"
chmod 755 "$rootfs/usr/local/bin/uv"
cp "$work/install.sh" "$rootfs/opt/install.sh"
dev_mounted=0
proc_mounted=0
project_mounted=0
cleanup() {
    if [ "$project_mounted" = 1 ]; then umount "$rootfs/project"; fi
    if [ "$proc_mounted" = 1 ]; then umount "$rootfs/proc"; fi
    if [ "$dev_mounted" = 1 ]; then umount "$rootfs/dev"; fi
}
trap cleanup EXIT HUP INT TERM
mount --bind /dev "$rootfs/dev"
dev_mounted=1
mount --bind /proc "$rootfs/proc"
proc_mounted=1
mount --bind "$work/project" "$rootfs/project"
project_mounted=1
cat /etc/resolv.conf | chroot "$rootfs" /bin/bash -c 'cat > /etc/resolv.conf'
chroot "$rootfs" /bin/bash /opt/install.sh
'''.replace("LINUX_WORK", linux_work).replace("UBUNTU_FILE", UBUNTU_FILE)
    (WORK / "setup.sh").write_text(setup, encoding="utf-8", newline="\n")
    print("Running isolated Linux export checks; all generated files stay under " + str(WORK), flush=True)
    result = subprocess.run(["wsl", "--distribution", "docker-desktop", "--exec", "sh", linux_work + "/setup.sh"])
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
