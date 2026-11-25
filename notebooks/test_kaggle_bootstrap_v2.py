"""Regression and live checks for kernels with pip but unusable ensurepip."""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from build_revision_kaggle_bundle import BOOTSTRAP_REVISION, UV_BOOTSTRAP_CODE, make_notebook

ROOT = Path(__file__).resolve().parents[1]


class NotebookBootstrapTests(unittest.TestCase):
    def test_notebook_uses_current_kernel_pip_without_envbuilder(self):
        notebook = make_notebook({})
        setup = "".join(notebook["cells"][4]["source"])
        self.assertEqual(notebook["metadata"]["cuunet_bootstrap_revision"], 2)
        self.assertIn("sys.executable, '-m', 'pip'", setup)
        self.assertNotIn("EnvBuilder", setup)
        self.assertNotIn("BOOT_PYTHON", setup)
        compile(setup, "generated_kaggle_bootstrap", "exec")

    def test_caches_only_the_pinned_uv_version(self):
        self.assertIn("uv 0.9.6", UV_BOOTSTRAP_CODE)
        self.assertIn("--target", UV_BOOTSTRAP_CODE)
        self.assertEqual(BOOTSTRAP_REVISION, 2)


def live_check() -> dict:
    workspace = (ROOT / "analysis" / "revision_smoke" / "bootstrap_live_v2").resolve()
    if not workspace.is_relative_to(ROOT.resolve()):
        raise ValueError("Live test target leaves the workspace")
    workspace.mkdir(parents=True, exist_ok=True)
    environment = os.environ.copy()
    environment["UV_CACHE_DIR"] = str(workspace / ".uv_cache")

    def run(command, **kwargs):
        return subprocess.run([str(value) for value in command], cwd=workspace, env=environment, check=True, **kwargs)

    namespace = {"ROOT": workspace, "run": run, "sys": sys, "os": os}
    # The previous notebook failed through this feature. The new path must work
    # even when it is deliberately unavailable, while pip and uv execute live.
    with patch("venv.EnvBuilder.create", side_effect=RuntimeError("ensurepip unavailable as on the reported kernel")):
        exec(compile(UV_BOOTSTRAP_CODE, "live_kaggle_bootstrap_v2", "exec"), namespace)
    uv = namespace["UV"]
    runtime = workspace / "uv_seeded_runtime"
    if not (runtime / "pyvenv.cfg").exists():
        run([uv, "venv", "--python", sys.executable, runtime])
    executable = runtime / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    run([uv, "pip", "install", "--python", executable, "pip==25.2"])
    pip = run([executable, "-m", "pip", "--version"], capture_output=True, text=True).stdout.strip()
    result = {"bootstrap_revision": 2, "kernel_python": sys.version, "uv_path": str(uv),
              "kernel_venv_envbuilder_disabled": True, "uv_seeded_runtime_pip": pip,
              "passed": True, "scope": "live kernel-pip/uv bootstrap and seeded runtime; not a full Kaggle GPU run"}
    (workspace / "bootstrap_test_result.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    args = parser.parse_args()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(NotebookBootstrapTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        raise SystemExit(1)
    if args.live:
        live_check()
