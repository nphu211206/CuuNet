"""Exercise the revision's trained attention model through the official converter.

Run on Linux with the Kaggle Python dependency lock and TF.js 4.22. These
synthetic checks establish serialization/export fidelity, not forecast skill.
"""
from __future__ import annotations

import argparse
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import revision_experiments as revision


def check_export(output_dir: Path, features: int, lstm_units: int, attention_units: int) -> dict:
    revision.keras.backend.clear_session()
    revision.set_seed(42)
    rng = np.random.default_rng(42)
    inputs = rng.uniform(0.0, 1.0, (24, 12, features)).astype(np.float32)
    targets = inputs[:, -1, 0].astype(np.float32)
    model = revision.build_neural_model(12, features, lstm_units, attention_units, 0.2, True)
    model.compile(optimizer=revision.keras.optimizers.Adam(0.001), loss="mse")
    for _ in range(2):
        model.train_on_batch(inputs[:16], targets[:16])
    held_out = inputs[16:]
    expected = model.predict(held_out, verbose=0).reshape(-1)
    zone = f"attention_{lstm_units}_features_{features}"
    model_path = output_dir / "models" / zone / "ta_lstm_seed_42.keras"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(model_path)
    restored = revision.keras.models.load_model(model_path, compile=False)
    actual = restored.predict(held_out, verbose=0).reshape(-1)
    np.testing.assert_allclose(actual, expected, atol=1e-7, rtol=1e-6)
    scaler = revision.MinMaxScaler().fit(np.array([[0.390851], [0.660617]]))
    case = {
        "zone": zone, "model": "ta_lstm", "selected_seed": 42,
        "provenance_class": "synthetic_smoke_test", "input_shape": list(held_out.shape),
        "inputs": held_out.astype(float).tolist(),
        "actual_physical": revision.inverse_target(targets[16:], scaler).tolist(),
        "keras_float_scaled_predictions": actual.astype(float).tolist(),
        "keras_float_physical_predictions": revision.inverse_target(actual, scaler).tolist(),
        "target_scaler": {"scale": float(scaler.scale_[0]), "min": float(scaler.min_[0])}, "prediction_bounds": {},
        "float_equivalence_tolerances": {"absolute": 1e-5, "relative": 1e-4},
    }
    case_path = output_dir / "tfjs_equivalence_cases" / f"{zone}.json"
    case_path.parent.mkdir(parents=True, exist_ok=True)
    case_path.write_text(json.dumps(case, indent=2), encoding="utf-8")
    selection = [{"zone": zone, "model": "ta_lstm", "selected_seed": 42,
                  "model_path": str(model_path)}]
    records, rows = revision.convert_best_models_to_tfjs(
        output_dir, Path(__file__).resolve().parents[1], selection
    )
    revision.write_json(output_dir / f"{zone}_conversion.json", records)
    revision.write_json(output_dir / f"{zone}_equivalence.json", rows)
    assert len(rows) == 1 and rows[0]["status"] == "completed", json.dumps(
        {"conversion": records, "equivalence": rows}, indent=2
    )
    return {"zone": zone, "serialization_max_abs_difference": float(np.max(np.abs(actual - expected))),
            "export": rows[0]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--pipeline-preflight", action="store_true")
    parser.add_argument("--pipeline-only", action="store_true")
    args = parser.parse_args()
    versions = {name: importlib.metadata.version(name) for name in
                ("tensorflow", "keras", "tensorflowjs", "tensorflow-decision-forests", "ydf", "protobuf")}
    assert versions["tensorflow"] == "2.19.0", versions
    assert versions["keras"] == "3.9.2", versions
    print(json.dumps({"versions": versions}), flush=True)
    if args.pipeline_only:
        previous = json.loads((args.output_dir / "neural_export_test.json").read_text())
        assert previous["passed"] is True and previous["versions"] == versions
        rows = previous["tests"]
    else:
        rows = [check_export(args.output_dir, 6, 8, 4), check_export(args.output_dir, 3, 64, 32)]
    if args.pipeline_preflight or args.pipeline_only:
        root = Path(__file__).resolve().parents[1]
        smoke = json.loads((root / "data/experiment_manifest.synthetic.json").read_text())
        smoke["zones"] = smoke["zones"][:1]
        smoke["training"].update({"seeds": [42], "epochs": 2, "early_stopping_patience": 2,
                                  "lstm_units": 8, "attention_units": 4, "unroll_lstm": True})
        smoke["bootstrap_block_length"] = 12
        smoke_path = root / "data/experiment_manifest.neural_smoke.json"
        smoke_path.write_text(json.dumps(smoke, indent=2), encoding="utf-8")
        pipeline_output = args.output_dir / "pipeline_preflight"
        subprocess.run([sys.executable, str(root / "notebooks/revision_experiments.py"),
                        "--manifest", str(smoke_path), "--output-dir", str(pipeline_output),
                        "--allow-synthetic", "--bootstrap-repetitions", "40"], check=True)
        result = json.loads((pipeline_output / "manuscript_results.json").read_text())
        assert result["publication_eligible"] is False
        equivalence = result["quantisation_equivalence"]
        assert equivalence and all(row["status"] == "completed" for row in equivalence), json.dumps(equivalence)
    revision.write_json(args.output_dir / "neural_export_test.json", {
        "passed": True, "versions": versions, "tests": rows,
        "pipeline_preflight": args.pipeline_preflight or args.pipeline_only,
        "interpretation": "Synthetic Linux CPU export checks; no Kaggle T4 or GloFAS result claimed.",
    })
    print(json.dumps({"passed": True, "trained_attention_exports": len(rows)}), flush=True)


if __name__ == "__main__":
    main()
