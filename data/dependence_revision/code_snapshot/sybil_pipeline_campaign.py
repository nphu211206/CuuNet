"""Synthetic spatial and multi-round campaigns for the proposed DBSCAN-DST pipeline.

The independent-reference update uses simulated oracle labels and is explicitly
an optimistic countermeasure. Self-consensus feedback is evaluated separately
because it can reward coordinated attackers. No field-report dataset is used.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import asdict, dataclass, replace
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

from sybil_revision_experiments import vectorised_dst_mass, wilson_interval


@dataclass(frozen=True)
class Configuration:
    honest_count: int = 5
    bot_count: int = 20
    honest_initial_reputation: float = .95
    bot_initial_reputation: float = .50
    pattern: str = "mimic"
    epsilon_distance_km: float = 1.0
    min_samples: int = 3
    maximum_report_age_hours: float = 6.0
    alpha_retention: float = .90
    beta_reward: float = .10
    eta_penalty: float = .30
    terrain_discount: bool = True
    rounds: int = 10
    benign_rounds: int = 3
    threshold: float = .75


def scenario_id(config: Configuration) -> str:
    return hashlib.sha256(json.dumps(asdict(config), sort_keys=True).encode()).hexdigest()[:16]


def prepare_geometry(config: Configuration, trials: int, seed: int) -> dict:
    generator = np.random.default_rng(seed)
    honest = generator.normal(0, .10, size=(trials, config.honest_count, 2))
    if config.pattern in {"mimic", "stale"}:
        bots = generator.normal(0, .05, size=(trials, config.bot_count, 2))
    elif config.pattern == "remote_cluster":
        bots = generator.normal([3.0, 1.0], .05, size=(trials, config.bot_count, 2))
    elif config.pattern == "dispersed":
        bots = generator.uniform(-4, 4, size=(trials, config.bot_count, 2))
    else:
        raise ValueError(f"Unknown spatial pattern: {config.pattern}")
    points = np.concatenate([honest, bots], axis=1)
    ages = generator.uniform(0, 1, size=points.shape[:2])
    if config.pattern == "stale":
        ages[:, config.honest_count:] = 48.0
    selected = np.zeros(points.shape[:2], dtype=bool)
    factors = np.zeros(points.shape[:2], dtype=float)
    for trial in range(trials):
        eligible = np.flatnonzero(ages[trial] <= config.maximum_report_age_hours)
        if len(eligible) < config.min_samples:
            continue
        labels = DBSCAN(eps=config.epsilon_distance_km, min_samples=config.min_samples).fit_predict(points[trial, eligible])
        clusters = [label for label in np.unique(labels) if label >= 0]
        if not clusters:
            continue
        # No ground-truth centre or trusted identity is supplied to the selector.
        chosen_label = max(clusters, key=lambda label: int(np.sum(labels == label)))
        chosen = eligible[labels == chosen_label]
        selected[trial, chosen] = True
        centroid = points[trial, chosen].mean(axis=0)
        distances = np.linalg.norm(points[trial, chosen] - centroid, axis=1)
        spatial = np.exp(-np.square(distances / config.epsilon_distance_km))
        temporal = np.exp(-ages[trial, chosen] / config.maximum_report_age_hours)
        terrain = 1 - .35 * np.clip(np.abs(points[trial, chosen, 1]) / .75, 0, 1) if config.terrain_discount else np.ones(len(chosen))
        factors[trial, chosen] = spatial * temporal * terrain
    return {"positions_km": points, "ages_hours": ages, "selected": selected, "discount_factors": factors}


def campaign(config: Configuration, geometry: dict, event_active: bool, feedback_mode: str) -> tuple[list[dict], dict]:
    selected = geometry["selected"]
    factors = geometry["discount_factors"]
    trials = len(selected)
    count = config.honest_count + config.bot_count
    reputation = np.repeat(np.array([config.honest_initial_reputation] * config.honest_count +
                                    [config.bot_initial_reputation] * config.bot_count)[None, :], trials, axis=0)
    summary = []
    traces = {name: [] for name in ("dst_belief_disaster", "dst_belief_no_disaster", "dst_uncertainty", "dst_alert", "dst_abstained",
                                  "majority_alert", "beta_map_alert", "weighted_vote_alert", "threshold_vote_alert")}
    selected_count = selected.sum(axis=1)
    for round_index in range(config.rounds):
        malicious = round_index >= config.benign_rounds
        claims = np.repeat(np.array([event_active] * config.honest_count +
                                   [not event_active if malicious else event_active] * config.bot_count)[None, :], trials, axis=0)
        masses = reputation * factors
        positive = np.where(claims, masses, 0.0)
        negative = np.where(~claims, masses, 0.0)
        disaster, no_disaster, uncertainty, fallback = vectorised_dst_mass(positive, negative)
        dst_alert = disaster >= config.threshold
        dst_abstained = (disaster < config.threshold) & (no_disaster < config.threshold)
        positive_count = (claims & selected).sum(axis=1)
        negative_count = ((~claims) & selected).sum(axis=1)
        majority_alert = positive_count > negative_count
        beta_map_score = (positive_count + .5) / (selected_count + 1)
        beta_map_alert = beta_map_score > .5
        positive_weight = positive.sum(axis=1)
        total_weight = masses.sum(axis=1)
        weighted_score = np.divide(positive_weight, total_weight, out=np.zeros(trials), where=total_weight > 0)
        weighted_alert = weighted_score >= config.threshold
        vote_score = np.divide(positive_count, selected_count, out=np.zeros(trials), where=selected_count > 0)
        threshold_vote_alert = vote_score >= config.threshold
        alerts = {"dst": dst_alert, "majority": majority_alert, "beta_map": beta_map_alert,
                  "weighted_vote_at_dst_threshold": weighted_alert, "vote_fraction_at_dst_threshold": threshold_vote_alert}
        for name, decisions in alerts.items():
            errors = decisions != event_active
            low, high = wilson_interval(int(errors.sum()), trials)
            summary.append({**asdict(config), "scenario_id": scenario_id(config), "feedback_mode": feedback_mode,
                "ground_truth_event": int(event_active), "round": round_index + 1,
                "phase": "adversarial" if malicious else "benign_reputation_building", "algorithm": name,
                "trials": trials, "error_type": "missed_alert" if event_active else "false_alert", "error_rate": float(errors.mean()),
                "error_rate_ci_low": low, "error_rate_ci_high": high,
                "abstention_rate": float(dst_abstained.mean()) if name == "dst" else float((selected_count == 0).mean()),
                "total_conflict_fallback_rate": float(fallback.mean()) if name == "dst" else 0.0,
                "mean_disaster_belief": float(disaster.mean()) if name == "dst" else None,
                "honest_reputation_mean_before_update": float(reputation[:, :config.honest_count].mean()),
                "bot_reputation_mean_before_update": float(reputation[:, config.honest_count:].mean()) if config.bot_count else None,
                "selected_honest_mean": float(selected[:, :config.honest_count].sum(axis=1).mean()),
                "selected_bots_mean": float(selected[:, config.honest_count:].sum(axis=1).mean()),
            })
        traces["dst_belief_disaster"].append(disaster)
        traces["dst_belief_no_disaster"].append(no_disaster)
        traces["dst_uncertainty"].append(uncertainty)
        traces["dst_alert"].append(dst_alert)
        traces["dst_abstained"].append(dst_abstained)
        traces["majority_alert"].append(majority_alert)
        traces["beta_map_alert"].append(beta_map_alert)
        traces["weighted_vote_alert"].append(weighted_alert)
        traces["threshold_vote_alert"].append(threshold_vote_alert)
        if feedback_mode == "independent_reference":
            judged = selected
            correct = claims == event_active
        elif feedback_mode == "self_consensus":
            judged = selected & ~dst_abstained[:, None]
            correct = claims == dst_alert[:, None]
        else:
            raise ValueError(f"Unknown feedback mode: {feedback_mode}")
        upvotes = np.where(claims, positive_count[:, None] - 1, negative_count[:, None] - 1)
        reward = np.tanh(config.beta_reward * np.maximum(upvotes, 0))
        delta = np.where(correct, reward, -config.eta_penalty)
        updated = np.clip(config.alpha_retention * reputation + delta, 0, 1)
        reputation = np.where(judged, updated, reputation)
    raw = {name: np.asarray(values) for name, values in traces.items()}
    raw["final_reputation"] = reputation
    return summary, raw


def configurations() -> list[tuple[str, Configuration]]:
    rows = []
    base = Configuration()
    for bots in (0, 1, 3, 5, 10, 20, 50, 100):
        for reputation in (.15, .50, .80):
            for pattern in ("mimic", "remote_cluster", "dispersed", "stale"):
                if bots == 0 and (reputation != .50 or pattern != "mimic"):
                    continue
                rows.append(("primary", replace(base, bot_count=bots, bot_initial_reputation=reputation, pattern=pattern)))
    for parameter, values in {
        "alpha_retention": (.70, .85, .90, .95), "beta_reward": (.05, .10, .20),
        "eta_penalty": (.10, .30, .50), "epsilon_distance_km": (.25, 1.0, 5.0, 25.0),
        "terrain_discount": (False, True),
    }.items():
        for value in values:
            rows.append((f"sensitivity_{parameter}", replace(base, **{parameter: value})))
    for honest in (1, 3, 10):
        for reputation in (.50, .95):
            for bots in (0, 10):
                rows.append(("sparse_reporting_and_honest_cold_start", replace(base, honest_count=honest,
                    honest_initial_reputation=reputation, bot_count=bots)))
    # A primary case may also serve several sensitivity roles.
    unique = {}
    for purpose, config in rows:
        key = scenario_id(config)
        if key in unique:
            unique[key][0].append(purpose)
        else:
            unique[key] = ([purpose], config)
    return [(";".join(dict.fromkeys(purposes)), config) for purposes, config in unique.values()]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("data/sybil_pipeline_campaign"))
    parser.add_argument("--trials", type=int, default=500)
    parser.add_argument("--seed", type=int, default=4242)
    parser.add_argument("--skip-raw-trials", action="store_true")
    args = parser.parse_args()
    if args.trials < 1:
        raise ValueError("trials must be positive")
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    raw_dir = output / "campaign_trials"
    if not args.skip_raw_trials:
        raw_dir.mkdir(exist_ok=True)
    summary_rows, records = [], []
    for index, (purpose, config) in enumerate(configurations()):
        key = scenario_id(config)
        geometry_key = json.dumps({"honest_count": config.honest_count, "bot_count": config.bot_count, "pattern": config.pattern}, sort_keys=True)
        scenario_seed = int.from_bytes(hashlib.sha256((str(args.seed) + geometry_key).encode()).digest()[:8], "big")
        geometry = prepare_geometry(config, args.trials, scenario_seed)
        raw = dict(geometry)
        for event in (False, True):
            for mode in ("independent_reference", "self_consensus"):
                summary, trial_data = campaign(config, geometry, event, mode)
                for row in summary:
                    row["purpose"] = purpose
                    row["scenario_seed"] = scenario_seed
                summary_rows.extend(summary)
                raw.update({f"{mode}_{'active' if event else 'absent'}_{name}": values for name, values in trial_data.items()})
        record = {"scenario_id": key, "purpose": purpose, "scenario_seed": scenario_seed, "configuration": asdict(config)}
        if not args.skip_raw_trials:
            raw_path = raw_dir / f"{key}.npz"
            np.savez_compressed(raw_path, **raw)
            record.update({"raw_file": raw_path.relative_to(output).as_posix(), "raw_sha256": hashlib.sha256(raw_path.read_bytes()).hexdigest()})
        records.append(record)
        if index % 20 == 0:
            print(f"Spatial campaign {index + 1}/{len(configurations())}", flush=True)
    pd.DataFrame(summary_rows).to_csv(output / "sybil_pipeline_campaign.csv", index=False)
    metadata = {
        "schema_version": 1, "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "provenance_class": "synthetic_adversarial_simulation", "trials_per_scenario": args.trials, "seed": args.seed,
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "scenarios": records,
        "coordinates": "synthetic planar kilometres; no real VGI or DEM records used",
        "cluster_selection": "largest eligible DBSCAN cluster, with no trusted geographic or identity anchor",
        "terrain_factor": "synthetic plausibility discount in [0.65, 1]; ablated with identical scenario geometry",
        "reputation_rule": "clip(alpha * R + tanh(beta * upvotes), 0, 1) for agreement; clip(alpha * R - eta, 0, 1) for contradiction; no update without a judged report",
        "feedback_modes": {"independent_reference": "simulated oracle truth; an optimistic countermeasure, not an available deployed sensor",
                           "self_consensus": "uses two-sided confident DST decisions; can reinforce attacker-controlled consensus"},
        "independence_limitation": "DST multiplication assumes independent evidence; coordinated identities violate that assumption and spatial clustering alone does not establish identity uniqueness",
        "parameter_selection": "pre-specified settings and one-factor sensitivity; no threshold or retention factor is called optimal",
        "paired_geometry": "all reputation, retention, reward, penalty, distance and terrain settings with the same counts and pattern use common random positions and ages",
        "intervals": "Wilson intervals across independent geometry trials; rounds are dependent and are not pooled as independent repeats",
    }
    (output / "sybil_pipeline_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({"scenarios": len(records), "summary_rows": len(summary_rows), "trials": args.trials, "output_dir": str(output)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
