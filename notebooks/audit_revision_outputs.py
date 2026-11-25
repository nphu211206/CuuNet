"""Independently recalculate reported errors and verify the revision output bundle.

This audit uses the standard library so it can also be run after a Kaggle ZIP
is downloaded. Publication eligibility applies only to the explicitly listed
forecasting claims, never to field deployment or the original risk index.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def number(value):
    if value in (None, "", "nan", "NaN"):
        return None
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("Nonfinite numeric evidence")
    return result


def close(first, second) -> bool:
    first, second = number(first), number(second)
    return first is None and second is None or first is not None and second is not None and math.isclose(first, second, rel_tol=2e-7, abs_tol=1e-7)


def within(root: Path, value: str) -> Path:
    candidate = (root / value).resolve()
    if not candidate.is_relative_to(root.resolve()):
        raise ValueError(f"Artifact leaves bundle directory: {value}")
    return candidate


def audit_outputs(output_dir: Path) -> dict:
    output_dir = output_dir.resolve()
    results_path = output_dir / "manuscript_results.json"
    results = json.loads(results_path.read_text(encoding="utf-8"), parse_constant=lambda value: (_ for _ in ()).throw(ValueError(f"Invalid JSON {value}")))
    run = json.loads((output_dir / "run_manifest.json").read_text(encoding="utf-8"))
    data_audit = {row["zone"]: row for row in json.loads((output_dir / "data_audit.json").read_text(encoding="utf-8"))}
    manifest = run["manifest"]
    failures = []
    checks = []

    def check(condition, description):
        checks.append({"check": description, "passed": bool(condition)})
        if not condition:
            failures.append(description)

    check(run["status"] == "completed", "forecasting process completed")
    check(results["run_id"] == run["run_id"], "result and runtime identifiers agree")
    check(run.get("code_sha256"), "executed script hashes recorded")
    for name, expected_hash in run.get("code_sha256", {}).items():
        source = within(output_dir, "code/" + name)
        check(source.is_file() and sha256(source) == expected_hash, f"executed source snapshot {name}")
    for name, record in results.get("artifacts", {}).items():
        if name in {"output_audit.json", "manuscript_results.json"}:
            continue
        artifact = within(output_dir, name)
        check(artifact.is_file() and sha256(artifact) == record["sha256"], f"artifact hash {name}")

    predictions = read_csv(output_dir / "baseline_predictions.csv")
    metrics = read_csv(output_dir / "forecasting_metrics.csv")
    neural_predictions = read_csv(output_dir / "per_seed_predictions.csv")
    neural_metrics = read_csv(output_dir / "neural_metrics.csv")
    groups = defaultdict(list)
    raw_target_maps = {}
    for zone in manifest["zones"]:
        source = within(output_dir, "inputs/" + zone["file"])
        check(source.is_file(), f"source target snapshot exists {zone['id']}")
        if source.is_file():
            raw_target_maps[zone["id"]] = {row[zone["date_column"]][:10]: number(row[zone["target_column"]]) for row in read_csv(source)}
    for record in predictions + neural_predictions:
        seed = record.get("seed") or ""
        groups[(record["zone"], record["model"], record["split"], seed)].append(record)
        check(record.get("run_id") == run["run_id"], "prediction belongs to recorded run")
        check(record.get("provenance_class") == run["provenance_class"], "prediction provenance agrees with run")
        reference = raw_target_maps.get(record["zone"], {}).get(record["date"][:10])
        check(reference is not None and close(record["actual"], reference), "prediction target is an available source reference, not an imputed label")
    expected_models = {"persistence", "seasonal_persistence", "moving_average", "linear_trend",
                       "seasonal_decomposition", "equal_weight_ensemble", "expected_mse_ensemble"}
    for zone in manifest["zones"]:
        for split in ("validation", "test"):
            names = {key[1] for key in groups if key[0] == zone["id"] and key[2] == split and not key[3]}
            check(names == expected_models, f"complete statistical model set {zone['id']} {split}")

    def verify_metrics(records):
        for row in records:
            key = (row["zone"], row["model"], row["split"], row.get("seed") or "")
            values = sorted(groups.get(key, []), key=lambda record: record["date"])
            check(bool(values), f"raw predictions exist for {key}")
            if not values:
                continue
            count = len(values)
            dates = [record["date"][:10] for record in values]
            zone_audit = data_audit[row["zone"]]
            expected_count = zone_audit.get("split_observed_target_rows", zone_audit["split_rows"])[row["split"]]
            check(count == expected_count == int(row["observations"]), f"complete comparison window {key}")
            check(len(set(dates)) == count, f"unique prediction dates {key}")
            expected_dates = zone_audit.get("split_target_observation_dates", {}).get(row["split"])
            if expected_dates is not None:
                check(set(dates) == set(expected_dates), f"exact observed-reference comparison dates {key}")
            actual = [number(record["actual"]) for record in values]
            forecast = [number(record["predicted"]) for record in values]
            check(all(value is not None for value in actual + forecast), f"finite predictions and targets {key}")
            if any(value is None for value in actual + forecast):
                continue
            errors = [predicted - observed for observed, predicted in zip(actual, forecast)]
            mae = sum(abs(value) for value in errors) / count
            rmse = math.sqrt(sum(value * value for value in errors) / count)
            bias = sum(errors) / count
            threshold = data_audit[row["zone"]]["peak_threshold_from_training"]
            peak_errors = [abs(error) for error, observed in zip(errors, actual) if observed >= threshold]
            peak_mae = sum(peak_errors) / len(peak_errors) if peak_errors else None
            for name, value in (("mae", mae), ("rmse", rmse), ("mean_bias", bias), ("peak_mae", peak_mae)):
                check(close(row[name], value), f"recomputed {name} {key}")
            check(int(row["peak_count"]) == len(peak_errors), f"recomputed high-flow count {key}")
            for prefix in ("mae", "rmse", "peak_mae"):
                low, high = number(row[prefix + "_ci_low"]), number(row[prefix + "_ci_high"])
                check((low is None and high is None and prefix == "peak_mae" and not peak_errors) or
                      low is not None and high is not None and 0 <= low <= high, f"valid {prefix} bootstrap interval {key}")
            for value in forecast:
                bounds = run["prediction_bounds"]
                check((bounds["lower"] is None or value >= bounds["lower"] - 1e-8) and
                      (bounds["upper"] is None or value <= bounds["upper"] + 1e-8), f"forecast physical bounds {key}")

    verify_metrics(metrics)
    verify_metrics(neural_metrics)
    weights = read_csv(output_dir / "forecast_combination_weights.csv")
    for zone in manifest["zones"]:
        rows = [record for record in weights if record["zone"] == zone["id"]]
        check(len(rows) == 3 and math.isclose(sum(float(row["weight"]) for row in rows), 1, abs_tol=1e-8) and
              all(0 <= float(row["weight"]) <= 1 for row in rows), f"nonnegative simplex weights {zone['id']}")
        check(all(close(row["diagonal_shrinkage"], manifest.get("covariance_shrinkage", .10)) for row in rows),
              f"configured covariance shrinkage used {zone['id']}")
        by_model = {row["model"]: float(row["weight"]) for row in rows}
        for split in ("validation", "test"):
            components = {name: {row["date"]: float(row["predicted"]) for row in groups[(zone["id"], name, split, "")]}
                          for name in by_model}
            for record in groups[(zone["id"], "expected_mse_ensemble", split, "")]:
                check(close(record["predicted"], sum(weight * components[name][record["date"]] for name, weight in by_model.items())),
                      f"recomputed forecast combination {zone['id']} {split}")
    check(len(metrics) == len(manifest["zones"]) * 2 * 7, "statistical metric table has all expected rows")
    # The JSON used for document writing must contain the same metrics as the CSV.
    embedded = {(row["zone"], row["model"], row["split"]): row for row in results["baseline_metrics"]}
    for row in metrics:
        source = embedded.get((row["zone"], row["model"], row["split"]), {})
        check(all(close(row[name], source.get(name)) for name in ("mae", "rmse", "mean_bias", "peak_mae")),
              "embedded manuscript metrics agree with the recalculated CSV")

    neural_complete = bool(run.get("neural_requested"))
    selection = read_csv(output_dir / "model_selection.csv")
    if neural_complete:
        expected_seeds = {str(seed) for seed in manifest["training"]["seeds"]}
        architecture_names = ("ta_lstm", "lstm_no_attention") + (("ta_lstm_outage",) if manifest["training"].get("include_outage_variant") else ())
        for zone in manifest["zones"]:
            for architecture in architecture_names:
                for split in ("validation", "test"):
                    rows = [row for row in neural_metrics if row["zone"] == zone["id"] and row["model"] == architecture and row["split"] == split]
                    check({row["seed"] for row in rows} == expected_seeds and len(rows) == len(expected_seeds),
                          f"complete repeated seeds {zone['id']} {architecture} {split}")
                validation = [row for row in neural_metrics if row["zone"] == zone["id"] and row["model"] == architecture and row["split"] == "validation"]
                chosen = [row for row in selection if row["zone"] == zone["id"] and row["model"] == architecture]
                if validation:
                    best = min(validation, key=lambda row: (float(row["mae"]), int(row["seed"])))
                    check(len(chosen) == 1 and chosen[0]["selected_seed"] == best["seed"] and chosen[0]["selection_split"] == "validation",
                          f"model selected only from validation {zone['id']} {architecture}")
        check(len(expected_seeds) >= 5 or run["provenance_class"] == "synthetic", "publication neural evaluation uses at least five seeds")

    source_eligible = run["provenance_class"] != "synthetic" and manifest.get("publication_eligible") is True
    if source_eligible:
        check(manifest["validation_mode"] == "physical_target_replacement", "physical benchmark validation mode")
        evidence_files = run["evidence_contract"].get("bundled_inputs", [])
        check(bool(evidence_files), "portable raw and derived input evidence preserved")
        for record in evidence_files:
            candidate = within(output_dir, record["bundle_path"])
            check(candidate.is_file() and sha256(candidate) == record["sha256"], f"input provenance hash {record['bundle_path']}")
    equivalence = read_csv(output_dir / "quantisation_equivalence.csv")
    valid_equivalence = {row["zone"] for row in equivalence if row.get("status") == "completed"}
    quantisation_complete = neural_complete and valid_equivalence == {zone["id"] for zone in manifest["zones"]}
    if quantisation_complete:
        for zone in manifest["zones"]:
            raw_path = output_dir / "tfjs_equivalence_results" / f"{zone['id']}.json"
            raw = json.loads(raw_path.read_text(encoding="utf-8"))
            check(raw.get("float_equivalence_passed") is True, f"FP32 export equivalence passed {zone['id']}")
            check(raw["float_model"]["format"] == raw["uint8_model"]["format"] == "graph-model", f"official graph exports {zone['id']}")
            case_path = output_dir / "tfjs_equivalence_cases" / f"{zone['id']}.json"
            check(raw["case_sha256"] == sha256(case_path), f"fixed test case hash {zone['id']}")

    # Collapse repetitive per-row checks while retaining every failure.
    totals = defaultdict(lambda: {"checks": 0, "failed": 0})
    for record in checks:
        key = record["check"]
        totals[key]["checks"] += 1
        totals[key]["failed"] += not record["passed"]
    report = {
        "schema_version": 1, "run_id": run["run_id"], "audited_at_utc": datetime.now(timezone.utc).isoformat(),
        "passed": not failures, "total_checks": len(checks), "failed_checks": sorted(set(failures)),
        "checks": [{"check": name, **counts} for name, counts in totals.items()],
        "prediction_rows": len(predictions), "neural_prediction_rows": len(neural_predictions),
        "publication_data_eligible": source_eligible,
        "interpretation": "errors recalculated from per-date predictions and input/artifact hashes checked; this does not prove field deployment or index external validation",
    }
    (output_dir / "output_audit.json").write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")
    results.update({
        "audited": not failures, "publication_eligible": bool(source_eligible and not failures),
        "status": "audited_physical_benchmark" if source_eligible and not failures else "audited_synthetic_smoke_test" if not failures else "audit_failed",
        "submission_ready": False, "output_audit_file": "output_audit.json",
        "claims_eligible": {
            "statistical_physical_forecasting": bool(source_eligible and not failures),
            "multi_seed_neural_physical_forecasting": bool(source_eligible and neural_complete and not failures),
            "tfjs_numerical_equivalence": bool(source_eligible and quantisation_complete and not failures),
            "mobile_browser_latency": False, "fully_offline_application": False,
            "original_index_external_validation": False, "field_deployment": False, "measured_battery_energy": False,
        },
    })
    results_path.write_text(json.dumps(results, indent=2, allow_nan=False), encoding="utf-8")
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    report = audit_outputs(args.output_dir)
    print(json.dumps({key: report[key] for key in ("passed", "total_checks", "failed_checks", "publication_data_eligible")}))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
