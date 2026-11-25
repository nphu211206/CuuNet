"""Independently recompute every campaign error/coverage rate from saved action traces."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import numpy as np
import pandas as pd

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    root = args.directory.resolve()
    manifest = json.loads((root / "dependence_campaign_manifest.json").read_text(encoding="utf-8"))
    csv = root / "dependence_campaign.csv"
    if hashlib.sha256(csv.read_bytes()).hexdigest() != manifest["campaign_sha256"]:
        raise ValueError("Campaign summary hash differs from the recorded run")
    rows = pd.read_csv(csv)
    failures, checked = [], 0
    def equal(actual, expected):
        if expected is None:
            return pd.isna(actual)
        return pd.notna(actual) and math.isclose(float(actual), float(expected), rel_tol=0, abs_tol=1e-12)
    for case in manifest["cases"]:
        path = root / case["raw_file"]
        if hashlib.sha256(path.read_bytes()).hexdigest() != case["raw_sha256"]:
            raise ValueError("Raw campaign trace hash mismatch")
        with np.load(path, allow_pickle=False) as arrays:
            for row in rows.loc[rows["case_id"] == case["case_id"]].to_dict("records"):
                active = bool(row["event_active"])
                key = f"event_{int(active)}_{row['feedback_mode']}_{row['method']}"
                actions = arrays[key + "_action"][int(row["round"]) - 1]
                if len(actions) != manifest["trials"] or not np.isin(actions, [-1, 0, 1]).all():
                    raise ValueError("Invalid trial count or action code")
                covered = actions >= 0
                wrong = covered & (actions != int(active))
                expected = {"alert_rate": (actions == 1).mean(),
                    "false_alert_rate": (actions == 1).mean() if not active else None,
                    "missed_alert_rate": (actions != 1).mean() if active else None,
                    "false_rejection_rate": (actions == 0).mean() if active else None,
                    "abstention_rate": (actions < 0).mean(), "decisive_coverage": covered.mean(),
                    "conditional_error_rate": wrong.sum() / covered.sum() if covered.any() else None,
                    "mean_disaster_belief": arrays[key + "_belief"][int(row["round"]) - 1].mean(),
                    "mean_uncertainty": arrays[key + "_uncertainty"][int(row["round"]) - 1].mean()}
                count = int((actions != 1).sum()) if active else int((actions == 1).sum())
                trials, z = len(actions), 1.959963984540054
                fraction = count / trials
                denominator = 1 + z * z / trials
                centre = (fraction + z * z / (2 * trials)) / denominator
                radius = z * math.sqrt(fraction * (1 - fraction) / trials + z * z / (4 * trials * trials)) / denominator
                expected.update(primary_error_ci_low=max(0., centre - radius), primary_error_ci_high=min(1., centre + radius))
                for field, value in expected.items():
                    checked += 1
                    if not equal(row[field], value):
                        failures.append({"case_id": case["case_id"], "method": row["method"], "round": row["round"], "field": field})
    expected_rows = len(manifest["cases"]) * 2 * len(manifest["feedback_modes"]) * len(manifest["methods"]) * 10
    if len(rows) != expected_rows:
        failures.append({"field": "complete expected summary row count"})
    result = {"passed": not failures, "checks": checked, "summary_rows": len(rows),
        "cases": len(manifest["cases"]), "trials_per_setting": manifest["trials"],
        "complete_primary_case_set": manifest["complete_primary_case_set"], "failures": failures,
        "scope": "All saved error, unresolved, coverage and belief summaries plus Wilson intervals recomputed from raw traces; not validation against field data"}
    (root / "independent_audit.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    if failures:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
