"""Fit all three recurrent variants at Binh Lieu using one manuscript seed."""
from copy import deepcopy
from hashlib import sha256
import argparse
import json
import os
from pathlib import Path

import pandas as pd
import revision_experiments as forecast


def config_and_frame(daily):
    root = Path(__file__).resolve().parent
    candidates = (Path.cwd() / "data/runoff_revision/experiment_manifest.json",
                  root / "../../data/runoff_revision/experiment_manifest.json")
    template = next(path for path in candidates if path.is_file())
    manifest = json.loads(template.read_text(encoding="utf-8"))
    zone = {
        "id": "Binh_Lieu", "file": str(daily.resolve()),
        "date_column": "date", "target_column": "discharge_m3s",
        "target_input_column": "discharge_m3s", "sampling_frequency": "D",
        "availability_feature_columns": ["flow_available"], "age_feature_column": "age_01",
        "fixed_range_features": ["flow_available", "age_01"],
        "feature_columns": ["discharge_m3s", "rainfall_mm", "flow_available", "age_01"],
        "target_metadata": {"data_class":"observed","source_id":"Zenodo Binh Lieu Q","units":"m3/s"},
    }
    # The original frame loader checks row-level provenance if target_metadata
    # is supplied. Provenance for this CSV is audited during preparation.
    metadata = zone.pop("target_metadata")
    frame, audit = forecast.load_zone(Path.cwd(), zone, manifest["splits"])
    zone["target_metadata"] = metadata
    assert audit["split_observed_target_rows"] == {"train":6575,"validation":1096,"test":1461}
    return manifest, zone, frame, audit["feature_columns_used"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--daily", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--seed", type=int, required=True)
    args = parser.parse_args()
    manifest, zone, frame, features = config_and_frame(args.daily)
    assert args.seed in manifest["training"]["seeds"]
    fit_manifest = deepcopy(manifest)
    fit_manifest["training"]["seeds"] = [args.seed]
    tf = forecast.tf
    if tf is None:
        raise RuntimeError("TensorFlow is required")
    tf.config.set_visible_devices([], "GPU")
    tf.config.threading.set_intra_op_parallelism_threads(2)
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.experimental.enable_op_determinism()
    out = args.out / str(args.seed)
    bounds = forecast.resolve_prediction_bounds(fit_manifest)
    # Final intervals are recomputed from the saved predictions across all
    # seeds. These worker-local interval columns are intentionally discarded.
    predictions, metrics, ablations, selection, constraints = forecast.train_neural_models(
        zone, frame, features, fit_manifest, out, 2, bounds,
    )
    pd.DataFrame(predictions).to_csv(out/"neural_predictions.csv", index=False, lineterminator="\n")
    forecast.write_json(out/"run.json", {
        "seed":args.seed,"features":features,"splits":manifest["splits"],"training":fit_manifest["training"],
        "tensorflow":tf.__version__,"keras":forecast.keras.__version__,
        "input_sha256":sha256(args.daily.read_bytes()).hexdigest(),
        "tf_enable_onednn_opts":os.getenv("TF_ENABLE_ONEDNN_OPTS"),
        "models":[{k:row[k] for k in ("model","split","mae","rmse","observations")} for row in metrics],
    })
    print("Complete", args.seed, flush=True)


if __name__ == "__main__":
    main()
