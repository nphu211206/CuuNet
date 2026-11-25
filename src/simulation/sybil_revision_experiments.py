"""Reproducible Sybil stress tests for HYDRO-D-26-00188 revision."""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np


BOT_COUNTS = [0, 1, 2, 3, 5, 6, 7, 9, 10, 20, 30, 50, 100]
HONEST_COUNTS = [3, 5, 10, 50]
REPUTATION_TIERS = {"decayed": 0.15, "neutral": 0.50, "compromised": 0.80}
THRESHOLDS = [0.50, 0.60, 0.70, 0.75, 0.80, 0.85, 0.90]


@dataclass
class Mass:
    disaster: float
    no_disaster: float
    uncertainty: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("data/sybil_revision"))
    parser.add_argument("--trials", type=int, default=2000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--threshold", type=float, default=0.75)
    parser.add_argument("--skip-raw-trials", action="store_true")
    return parser.parse_args()


def combine_dempster(first: Mass, second: Mass) -> tuple[Mass, float]:
    conflict = first.disaster * second.no_disaster + first.no_disaster * second.disaster
    disaster = (
        first.disaster * second.disaster
        + first.disaster * second.uncertainty
        + first.uncertainty * second.disaster
    )
    no_disaster = (
        first.no_disaster * second.no_disaster
        + first.no_disaster * second.uncertainty
        + first.uncertainty * second.no_disaster
    )
    uncertainty = first.uncertainty * second.uncertainty
    # Sum the nonconflicting terms directly to avoid cancellation in 1-K.
    normaliser = disaster + no_disaster + uncertainty
    if normaliser == 0.0:
        return Mass(0.0, 0.0, 1.0), 1.0
    return Mass(disaster / normaliser, no_disaster / normaliser, uncertainty / normaliser), conflict


def report_mass(claim_disaster: bool, reputation: float, spatial_factor: float = 1.0) -> Mass:
    effective = float(np.clip(reputation * spatial_factor, 0.0, 1.0))
    if claim_disaster:
        return Mass(effective, 0.0, 1.0 - effective)
    return Mass(0.0, effective, 1.0 - effective)


def fuse_reports(reports: list[Mass]) -> tuple[Mass, float, float]:
    fused = Mass(0.0, 0.0, 1.0)
    conflicts: list[float] = []
    for report in reports:
        fused, conflict = combine_dempster(fused, report)
        conflicts.append(conflict)
    return fused, float(np.mean(conflicts)) if conflicts else 0.0, float(max(conflicts, default=0.0))


def deterministic_scenario(
    event_active: bool,
    honest_count: int,
    bot_count: int,
    honest_reputation: float,
    bot_reputation: float,
) -> tuple[Mass, float, float]:
    reports = [report_mass(event_active, honest_reputation) for _ in range(honest_count)]
    reports.extend(report_mass(not event_active, bot_reputation) for _ in range(bot_count))
    return fuse_reports(reports)


def majority_decision(event_active: bool, honest_count: int, bot_count: int) -> bool:
    disaster_votes = honest_count if event_active else bot_count
    no_disaster_votes = bot_count if event_active else honest_count
    return disaster_votes > no_disaster_votes


def beta_map_decision(event_active: bool, honest_count: int, bot_count: int, alpha: float = 1.5) -> bool:
    positive_count = honest_count if event_active else bot_count
    total_count = honest_count + bot_count
    map_estimate = (positive_count + alpha - 1.0) / (total_count + 2.0 * alpha - 2.0)
    return map_estimate > 0.5


def weighted_majority_decision(
    event_active: bool,
    honest_count: int,
    bot_count: int,
    honest_reputation: float,
    bot_reputation: float,
) -> bool:
    disaster_weight = honest_count * honest_reputation if event_active else bot_count * bot_reputation
    no_disaster_weight = bot_count * bot_reputation if event_active else honest_count * honest_reputation
    return disaster_weight > no_disaster_weight


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        raise ValueError(f"No rows for {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def deterministic_sweep(threshold: float) -> list[dict]:
    rows: list[dict] = []
    for event_active in (True, False):
        attack_type = "alert_suppression" if event_active else "false_alert_spoofing"
        for tier_name, bot_reputation in REPUTATION_TIERS.items():
            for bot_count in BOT_COUNTS:
                fused, mean_conflict, max_conflict = deterministic_scenario(
                    event_active=event_active,
                    honest_count=5,
                    bot_count=bot_count,
                    honest_reputation=0.95,
                    bot_reputation=bot_reputation,
                )
                dst_alert = fused.disaster >= threshold
                majority_alert = majority_decision(event_active, 5, bot_count)
                beta_alert = beta_map_decision(event_active, 5, bot_count)
                weighted_alert = weighted_majority_decision(event_active, 5, bot_count, 0.95, bot_reputation)
                rows.append(
                    {
                        "ground_truth_event": int(event_active),
                        "attack_type": attack_type,
                        "reputation_tier": tier_name,
                        "honest_count": 5,
                        "bot_count": bot_count,
                        "honest_reputation": 0.95,
                        "bot_reputation": bot_reputation,
                        "threshold": threshold,
                        "dst_belief_disaster": fused.disaster,
                        "dst_belief_no_disaster": fused.no_disaster,
                        "dst_uncertainty": fused.uncertainty,
                        "mean_pairwise_conflict": mean_conflict,
                        "max_pairwise_conflict": max_conflict,
                        "dst_alert": int(dst_alert),
                        "majority_alert": int(majority_alert),
                        "beta_map_alert": int(beta_alert),
                        "weighted_majority_alert": int(weighted_alert),
                        "dst_correct": int(dst_alert == event_active),
                        "majority_correct": int(majority_alert == event_active),
                        "beta_map_correct": int(beta_alert == event_active),
                        "weighted_majority_correct": int(weighted_alert == event_active),
                    }
                )
    return rows


def threshold_sensitivity() -> list[dict]:
    scenarios = [
        ("neutral_suppression_margin", True, 5, 20, 0.50),
        ("compromised_suppression_breach", True, 5, 10, 0.80),
        ("compromised_spoofing_subthreshold", False, 5, 9, 0.80),
        ("compromised_spoofing_boundary", False, 5, 10, 0.80),
        ("rural_neutral_suppression", True, 3, 10, 0.50),
    ]
    rows: list[dict] = []
    for scenario_name, event_active, honest_count, bot_count, bot_reputation in scenarios:
        fused, mean_conflict, max_conflict = deterministic_scenario(
            event_active,
            honest_count,
            bot_count,
            0.95,
            bot_reputation,
        )
        for threshold in THRESHOLDS:
            alert = fused.disaster >= threshold
            rows.append(
                {
                    "scenario": scenario_name,
                    "ground_truth_event": int(event_active),
                    "honest_count": honest_count,
                    "bot_count": bot_count,
                    "bot_reputation": bot_reputation,
                    "threshold": threshold,
                    "belief_disaster": fused.disaster,
                    "belief_no_disaster": fused.no_disaster,
                    "uncertainty": fused.uncertainty,
                    "mean_pairwise_conflict": mean_conflict,
                    "max_pairwise_conflict": max_conflict,
                    "alert": int(alert),
                    "correct": int(alert == event_active),
                }
            )
    return rows


def truncated_normal(
    generator: np.random.Generator,
    mean: float,
    standard_deviation: float,
    size: tuple[int, int],
) -> np.ndarray:
    values = generator.normal(mean, standard_deviation, size=size)
    return np.clip(values, 0.0, 1.0)


def vectorised_dst_mass(positive_masses: np.ndarray, negative_masses: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    positive_masses = np.asarray(positive_masses, dtype=float)
    negative_masses = np.asarray(negative_masses, dtype=float)
    if positive_masses.ndim != 2 or negative_masses.ndim != 2 or positive_masses.shape[0] != negative_masses.shape[0]:
        raise ValueError("Mass arrays must have the same trial dimension")
    if not all(np.isfinite(values).all() and ((values >= 0) & (values <= 1)).all() for values in (positive_masses, negative_masses)):
        raise ValueError("Evidence masses must be finite and lie in [0, 1]")
    with np.errstate(divide="ignore", invalid="ignore"):
        positive_log_u = np.log1p(-positive_masses).sum(axis=1)
        negative_log_u = np.log1p(-negative_masses).sum(axis=1)
        # A + B - AB = A + (1-A)B, computed in log space.
        positive_log_c = np.log(-np.expm1(positive_log_u))
        negative_log_c = np.log(-np.expm1(negative_log_u))
        log_normaliser = np.logaddexp(positive_log_u, positive_log_c + negative_log_u)
        total_conflict = np.isneginf(positive_log_u) & np.isneginf(negative_log_u)
        safe_normaliser = np.where(total_conflict, 0.0, log_normaliser)
        disaster = np.exp(positive_log_c + negative_log_u - safe_normaliser)
        no_disaster = np.exp(negative_log_c + positive_log_u - safe_normaliser)
        uncertainty = np.exp(positive_log_u + negative_log_u - safe_normaliser)
    return (np.where(total_conflict, 0.0, disaster), np.where(total_conflict, 0.0, no_disaster),
            np.where(total_conflict, 1.0, uncertainty), total_conflict)


def vectorised_dst_belief(positive_masses: np.ndarray, negative_masses: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    disaster, _, uncertainty, _ = vectorised_dst_mass(positive_masses, negative_masses)
    return disaster, uncertainty


def wilson_interval(successes: int, trials: int) -> tuple[float, float]:
    z = 1.959963984540054
    proportion = successes / trials
    denominator = 1 + z * z / trials
    centre = (proportion + z * z / (2 * trials)) / denominator
    margin = z * math.sqrt(proportion * (1 - proportion) / trials + z * z / (4 * trials * trials)) / denominator
    return 0.0 if successes == 0 else max(0.0, centre - margin), 1.0 if successes == trials else min(1.0, centre + margin)


def monte_carlo_summary(trials: int, seed: int, raw_writer=None) -> list[dict]:
    generator = np.random.default_rng(seed)
    rows: list[dict] = []
    for honest_count in HONEST_COUNTS:
        for tier_name, bot_reputation_mean in REPUTATION_TIERS.items():
            bot_standard_deviation = {"decayed": 0.05, "neutral": 0.08, "compromised": 0.06}[tier_name]
            for bot_count in BOT_COUNTS:
                honest_reputation = truncated_normal(generator, 0.95, 0.03, (trials, honest_count))
                honest_spatial = generator.uniform(0.95, 1.0, size=(trials, honest_count))
                bot_reputation = truncated_normal(
                    generator, bot_reputation_mean, bot_standard_deviation, (trials, bot_count)
                )
                bot_spatial = generator.uniform(0.85, 1.0, size=(trials, bot_count))
                honest_masses = honest_reputation * honest_spatial
                bot_masses = bot_reputation * bot_spatial

                active_belief, _, active_uncertainty, active_total_conflict = vectorised_dst_mass(honest_masses, bot_masses)
                absent_belief, _, absent_uncertainty, absent_total_conflict = vectorised_dst_mass(bot_masses, honest_masses)
                honest_weight = honest_masses.sum(axis=1)
                bot_weight = bot_masses.sum(axis=1)
                total_weight = honest_weight + bot_weight
                weighted_active_score = np.divide(honest_weight, total_weight, out=np.zeros_like(total_weight), where=total_weight > 0)
                weighted_absent_score = np.divide(bot_weight, total_weight, out=np.zeros_like(total_weight), where=total_weight > 0)
                if raw_writer is not None:
                    for trial in range(trials):
                        raw_writer.writerow({"seed": seed, "trial": trial, "honest_count": honest_count, "bot_count": bot_count,
                            "reputation_tier": tier_name, "active_belief": float(active_belief[trial]), "absent_belief": float(absent_belief[trial]),
                            "active_uncertainty": float(active_uncertainty[trial]), "absent_uncertainty": float(absent_uncertainty[trial]),
                            "honest_effective_masses": json.dumps(honest_masses[trial].tolist()),
                            "bot_effective_masses": json.dumps(bot_masses[trial].tolist()),
                            "weighted_active_score": float(weighted_active_score[trial]), "weighted_absent_score": float(weighted_absent_score[trial])})
                for threshold in THRESHOLDS:
                    missed_alert_rate = float(np.mean(active_belief < threshold))
                    false_alert_rate = float(np.mean(absent_belief >= threshold))
                    false_interval = wilson_interval(int(np.sum(absent_belief >= threshold)), trials)
                    missed_interval = wilson_interval(int(np.sum(active_belief < threshold)), trials)
                    rows.append(
                        {
                            "reputation_tier": tier_name,
                            "bot_count": bot_count,
                            "honest_count": honest_count,
                            "trials": trials,
                            "threshold": threshold,
                            "false_alert_rate": false_alert_rate,
                            "missed_alert_rate": missed_alert_rate,
                            "false_alert_rate_ci_low": false_interval[0], "false_alert_rate_ci_high": false_interval[1],
                            "missed_alert_rate_ci_low": missed_interval[0], "missed_alert_rate_ci_high": missed_interval[1],
                            "active_total_conflict_fallback_rate": float(active_total_conflict.mean()),
                            "absent_total_conflict_fallback_rate": float(absent_total_conflict.mean()),
                            "active_belief_mean": float(np.mean(active_belief)),
                            "active_belief_median": float(np.median(active_belief)),
                            "active_belief_quantile_025": float(np.quantile(active_belief, 0.025)),
                            "active_belief_quantile_975": float(np.quantile(active_belief, 0.975)),
                            "active_uncertainty_mean": float(np.mean(active_uncertainty)),
                            "absent_belief_mean": float(np.mean(absent_belief)),
                            "absent_belief_median": float(np.median(absent_belief)),
                            "absent_belief_quantile_025": float(np.quantile(absent_belief, 0.025)),
                            "absent_belief_quantile_975": float(np.quantile(absent_belief, 0.975)),
                            "absent_uncertainty_mean": float(np.mean(absent_uncertainty)),
                            "majority_false_alert_rate": float(bot_count > honest_count),
                            "majority_missed_alert_rate": float(bot_count >= honest_count),
                            "beta_map_false_alert_rate": float(bot_count > honest_count),
                            "beta_map_missed_alert_rate": float(bot_count >= honest_count),
                            "weighted_majority_false_alert_rate": float(
                                np.mean(bot_weight > honest_weight)
                            ),
                            "weighted_majority_missed_alert_rate": float(
                                np.mean(honest_weight <= bot_weight)
                            ),
                            "vote_fraction_false_alert_rate_at_dst_threshold": float(bot_count / (honest_count + bot_count) >= threshold),
                            "vote_fraction_missed_alert_rate_at_dst_threshold": float(honest_count / (honest_count + bot_count) < threshold),
                            "weighted_vote_false_alert_rate_at_dst_threshold": float(np.mean(weighted_absent_score >= threshold)),
                            "weighted_vote_missed_alert_rate_at_dst_threshold": float(np.mean(weighted_active_score < threshold)),
                        }
                    )
    return rows


def main() -> int:
    args = parse_args()
    if args.trials < 1 or not 0 < args.threshold < 1:
        raise ValueError("Positive trials and a threshold in (0, 1) are required")
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    deterministic_rows = deterministic_sweep(args.threshold)
    threshold_rows = threshold_sensitivity()
    raw_path = output_dir / "sybil_monte_carlo_trials.csv.gz"
    if args.skip_raw_trials:
        monte_carlo_rows = monte_carlo_summary(args.trials, args.seed)
    else:
        with gzip.open(raw_path, "wt", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["seed", "trial", "honest_count", "bot_count", "reputation_tier",
                "active_belief", "absent_belief", "active_uncertainty", "absent_uncertainty", "honest_effective_masses",
                "bot_effective_masses", "weighted_active_score", "weighted_absent_score"])
            writer.writeheader()
            monte_carlo_rows = monte_carlo_summary(args.trials, args.seed, writer)
    write_csv(output_dir / "sybil_deterministic_sweep.csv", deterministic_rows)
    write_csv(output_dir / "sybil_threshold_sensitivity.csv", threshold_rows)
    write_csv(output_dir / "sybil_monte_carlo_summary.csv", monte_carlo_rows)
    metadata = {
        "trials": args.trials,
        "seed": args.seed,
        "primary_threshold": args.threshold,
        "bot_counts": BOT_COUNTS,
        "honest_counts": HONEST_COUNTS,
        "reputation_tiers": REPUTATION_TIERS,
        "thresholds": THRESHOLDS,
        "schema_version": 2, "provenance_class": "synthetic_adversarial_simulation",
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "dempster_rule": "Normalised Dempster combination evaluated in log space. Only exact total conflict invokes the uncertainty fallback; small denominators alone do not.",
        "baseline_note": "Symmetric Beta MAP with a 0.5 decision threshold is equivalent to unweighted majority voting for binary reports.",
        "weighted_baseline_note": "Weighted decisions use the same sampled effective masses as DST; conventional 0.5 decisions and threshold-matched score decisions are reported separately.",
        "interval_note": "FAR/MAR intervals are Wilson binomial confidence intervals; belief quantiles describe the simulated distribution, not confidence intervals of its mean.",
        "raw_trials_file": raw_path.name if not args.skip_raw_trials else None,
        "interpretation_limit": "Static mass-assignment experiments, not a browser implementation or proof against arbitrary dependent identities; the separate pipeline campaign tests spatial and reputation assumptions.",
    }
    (output_dir / "sybil_experiment_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print(json.dumps({"output_dir": str(output_dir), "files": sorted(path.name for path in output_dir.iterdir())}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
