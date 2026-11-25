"""Attach audited synthetic attack experiments to the physical forecasting result bundle."""
from __future__ import annotations

import argparse
import csv
import gzip
import json
import math
import shutil
from collections import defaultdict
from pathlib import Path

import numpy as np

from audit_revision_outputs import audit_outputs, close, read_csv, sha256


def audit_static(directory: Path) -> dict:
    metadata = json.loads((directory / "sybil_experiment_metadata.json").read_text(encoding="utf-8"))
    raw_path = directory / metadata["raw_trials_file"]
    summaries = read_csv(directory / "sybil_monte_carlo_summary.csv")
    thresholds = metadata["thresholds"]
    counts = defaultdict(lambda: {"trials": 0, "false": [0] * len(thresholds), "missed": [0] * len(thresholds)})
    failures = []
    with gzip.open(raw_path, "rt", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            key = (row["reputation_tier"], int(row["honest_count"]), int(row["bot_count"]))
            honest = json.loads(row["honest_effective_masses"])
            bots = json.loads(row["bot_effective_masses"])
            a, b = math.prod(1 - value for value in honest), math.prod(1 - value for value in bots)
            denominator = a + (1 - a) * b
            active = (1 - a) * b / denominator if denominator else 0.0
            absent = (1 - b) * a / denominator if denominator else 0.0
            if not (close(active, row["active_belief"]) and close(absent, row["absent_belief"])):
                failures.append(f"Raw Dempster combination mismatch {key}")
            group = counts[key]
            group["trials"] += 1
            for index, threshold in enumerate(thresholds):
                group["false"][index] += absent >= threshold
                group["missed"][index] += active < threshold
    for row in summaries:
        group = counts[(row["reputation_tier"], int(row["honest_count"]), int(row["bot_count"]))]
        threshold_index = thresholds.index(float(row["threshold"]))
        if group["trials"] != int(row["trials"]) or not group["trials"]:
            failures.append("Raw static trial count disagrees with summary")
            continue
        if not close(row["false_alert_rate"], group["false"][threshold_index] / group["trials"]):
            failures.append("Static false-alert rate disagrees with raw trials")
        if not close(row["missed_alert_rate"], group["missed"][threshold_index] / group["trials"]):
            failures.append("Static missed-alert rate disagrees with raw trials")
    return {"passed": not failures, "failures": sorted(set(failures)), "raw_trial_rows": sum(row["trials"] for row in counts.values()),
            "summary_rows": len(summaries), "trials_per_scenario": metadata["trials"], "primary_threshold": metadata["primary_threshold"]}


def audit_campaign(directory: Path) -> dict:
    metadata = json.loads((directory / "sybil_pipeline_metadata.json").read_text(encoding="utf-8"))
    groups = defaultdict(list)
    for row in read_csv(directory / "sybil_pipeline_campaign.csv"):
        groups[row["scenario_id"]].append(row)
    failures = []
    algorithms = {"dst": "dst_alert", "majority": "majority_alert", "beta_map": "beta_map_alert",
                  "weighted_vote_at_dst_threshold": "weighted_vote_alert", "vote_fraction_at_dst_threshold": "threshold_vote_alert"}
    for scenario in metadata["scenarios"]:
        raw = directory / scenario["raw_file"]
        if sha256(raw) != scenario["raw_sha256"]:
            failures.append(f"Campaign raw hash mismatch {scenario['scenario_id']}")
            continue
        with np.load(raw) as arrays:
            for row in groups[scenario["scenario_id"]]:
                active = row["ground_truth_event"] == "1"
                prefix = f"{row['feedback_mode']}_{'active' if active else 'absent'}_"
                decisions = arrays[prefix + algorithms[row["algorithm"]]][int(row["round"]) - 1]
                rate = float(np.mean(decisions != active))
                if not close(rate, row["error_rate"]):
                    failures.append(f"Campaign error count disagrees with trial trace {scenario['scenario_id']}")
                if len(decisions) != int(row["trials"]):
                    failures.append("Campaign trial count disagrees with summary")
    return {"passed": not failures, "failures": sorted(set(failures)), "scenarios": len(metadata["scenarios"]),
            "summary_rows": sum(len(rows) for rows in groups.values()), "trials_per_scenario": metadata["trials_per_scenario"]}


def finalize(output: Path, static_dir: Path, campaign_dir: Path) -> dict:
    output = output.resolve()
    if static_dir.resolve() != output / "sybil_static":
        shutil.copytree(static_dir, output / "sybil_static", dirs_exist_ok=True)
    if campaign_dir.resolve() != output / "sybil_campaign":
        shutil.copytree(campaign_dir, output / "sybil_campaign", dirs_exist_ok=True)
    static_dir, campaign_dir = output / "sybil_static", output / "sybil_campaign"
    static_audit, campaign_audit = audit_static(static_dir), audit_campaign(campaign_dir)
    results_path = output / "manuscript_results.json"
    results = json.loads(results_path.read_text(encoding="utf-8"))
    primary_static = [row for row in read_csv(static_dir / "sybil_monte_carlo_summary.csv")
                      if float(row["threshold"]) == .75 and int(row["honest_count"]) == 5 and int(row["bot_count"]) in {0, 10, 20, 50, 100}]
    primary_campaign = [row for row in read_csv(campaign_dir / "sybil_pipeline_campaign.csv")
                        if row["algorithm"] == "dst" and row["phase"] == "adversarial" and int(row["round"]) in {4, 10}
                        and int(row["honest_count"]) == 5 and int(row["bot_count"]) in {10, 20, 100}
                        and row["pattern"] in {"mimic", "remote_cluster"} and "primary" in row["purpose"]]
    results["sybil_simulation"] = {
        "provenance_class": "synthetic_adversarial_simulation", "static_audit": static_audit, "campaign_audit": campaign_audit,
        "primary_static_results": primary_static, "selected_campaign_results": primary_campaign,
        "static_summary_file": "sybil_static/sybil_monte_carlo_summary.csv",
        "campaign_summary_file": "sybil_campaign/sybil_pipeline_campaign.csv",
        "limitations": ["No real VGI or field labels are used", "Independent-reference feedback uses a simulated oracle and is an optimistic countermeasure",
                        "Self-consensus feedback can reward attacker-controlled decisions", "DBSCAN clusters do not establish independent identities",
                        "Sparse reporting, neutral identities and coordinated spatial mimicry are explicit failure regimes"],
    }
    root = Path(__file__).resolve().parents[1]
    run_path = output / "run_manifest.json"
    run = json.loads(run_path.read_text(encoding="utf-8"))
    for relative in ("notebooks/finalize_revision_bundle.py", "src/simulation/sybil_revision_experiments.py", "src/simulation/sybil_pipeline_campaign.py"):
        source = root / relative
        target = output / "code" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        run["code_sha256"][relative] = sha256(source)
    run["sybil_static_audit"] = static_audit
    run["sybil_campaign_audit"] = campaign_audit
    run_path.write_text(json.dumps(run, indent=2), encoding="utf-8")
    results["artifacts"] = {path.relative_to(output).as_posix(): {"sha256": sha256(path), "bytes": path.stat().st_size}
                            for path in sorted(output.rglob("*")) if path.is_file() and path.name not in {"manuscript_results.json", "output_audit.json"}}
    results_path.write_text(json.dumps(results, indent=2, allow_nan=False), encoding="utf-8")
    report = audit_outputs(output)
    results = json.loads(results_path.read_text(encoding="utf-8"))
    results["claims_eligible"]["synthetic_sybil_stress_test"] = bool(static_audit["passed"] and campaign_audit["passed"] and report["passed"])
    results_path.write_text(json.dumps(results, indent=2, allow_nan=False), encoding="utf-8")
    summary = {"forecast_audit_passed": report["passed"], "static_sybil_audit_passed": static_audit["passed"],
               "campaign_audit_passed": campaign_audit["passed"], "publication_eligible": results["publication_eligible"],
               "claims_eligible": results["claims_eligible"]}
    (output / "bundle_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--static-sybil-dir", type=Path, required=True)
    parser.add_argument("--campaign-dir", type=Path, required=True)
    args = parser.parse_args()
    summary = finalize(args.output_dir, args.static_sybil_dir, args.campaign_dir)
    print(json.dumps(summary, indent=2))
    return 0 if all(summary[key] for key in ("forecast_audit_passed", "static_sybil_audit_passed", "campaign_audit_passed")) else 1


if __name__ == "__main__":
    raise SystemExit(main())
