"""Matched adversarial campaigns with separate reputation trajectories per method."""
from __future__ import annotations
import argparse
from dataclasses import asdict, replace
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.special import betainc

from dependence_aware_verification import PoolingPolicy, group_ids, pooled_mass, decision, scores
from sybil_pipeline_campaign import Configuration, prepare_geometry
from sybil_revision_experiments import vectorised_dst_mass, wilson_interval

METHODS = ("classical_dst", "group_max_dst", "bayesian_weighted_beta", "weighted_vote_075", "weighted_vote_050", "majority")
FEEDBACK_MODES = ("independent_reference", "self_consensus", "no_verified_feedback")

def cases():
    base, policy = Configuration(), PoolingPolicy()
    candidates = []
    for bots in (0, 5, 20, 50, 100):
        for rep in (.15, .50, .80):
            for pattern in ("mimic", "dispersed", "remote_cluster", "stale"):
                if bots == 0 and (rep != .50 or pattern != "mimic"):
                    continue
                candidates.append(("primary", replace(base, bot_count=bots, bot_initial_reputation=rep, pattern=pattern), policy))
    for honest in (1, 3, 5):
        for bots in (0, 20):
            candidates.append(("honest_cold_start", replace(base, honest_count=honest, bot_count=bots, honest_initial_reputation=.50), policy))
    for cell in (.125, .25, .50):
        candidates.append(("cell_sensitivity", base, replace(policy, cell_width_km=cell)))
    for time in (.25, .5, 1.):
        candidates.append(("time_sensitivity", base, replace(policy, time_bin_hours=time)))
    for threshold in (.60, .75, .90):
        candidates.append(("threshold_sensitivity", base, replace(policy, threshold=threshold)))
    for alpha in (.70, .85, .90, .95):
        candidates.append(("retention_sensitivity", replace(base, alpha_retention=alpha), policy))
    for beta in (.05, .10, .20):
        candidates.append(("reward_sensitivity", replace(base, beta_reward=beta), policy))
    for eta in (.10, .30, .50):
        candidates.append(("penalty_sensitivity", replace(base, eta_penalty=eta), policy))
    for epsilon in (.25, 1., 5.):
        candidates.append(("dbscan_sensitivity", replace(base, epsilon_distance_km=epsilon), policy))
    candidates.append(("terrain_ablation", replace(base, terrain_discount=False), policy))
    unique = {}
    for purpose, config, pooling in candidates:
        key = hashlib.sha256(json.dumps([asdict(config), asdict(pooling)], sort_keys=True).encode()).hexdigest()[:16]
        if key not in unique:
            unique[key] = {"case_id": key, "purposes": [], "config": config, "policy": pooling}
        unique[key]["purposes"].append(purpose)
    return list(unique.values())

def evaluate(config, policy, geometry, active, feedback_mode):
    selected, factors = geometry["selected"], geometry["discount_factors"]
    groups, group_counts = group_ids(geometry["positions_km"], geometry["ages_hours"], selected, policy)
    trials, reporters = selected.shape
    initial = np.array([config.honest_initial_reputation] * config.honest_count + [config.bot_initial_reputation] * config.bot_count)
    reputations = {method: np.repeat(initial[None, :], trials, axis=0) for method in METHODS}
    traces = {method + "_" + name: [] for method in METHODS for name in ("action", "belief", "uncertainty", "honest_reputation", "bot_reputation")}
    summaries = []
    selected_count = selected.sum(axis=1)
    for round_index in range(config.rounds):
        malicious = round_index >= config.benign_rounds
        claims = np.repeat(np.array([active] * config.honest_count +
            [not active if malicious else active] * config.bot_count)[None, :], trials, axis=0)
        positive_count = (claims & selected).sum(axis=1)
        negative_count = ((~claims) & selected).sum(axis=1)
        for method in METHODS:
            reputation = reputations[method]
            mass = np.minimum(reputation * factors, policy.mass_cap)
            positive, negative = np.where(claims, mass, 0.), np.where(~claims, mass, 0.)
            if method == "group_max_dst":
                d, n, u, _ = pooled_mass(claims, mass, groups, group_counts, policy)
                actions = decision(d, n, policy.threshold)
            elif method == "classical_dst":
                d, n, u, _ = vectorised_dst_mass(positive, negative)
                actions = decision(d, n, policy.threshold)
            else:
                total = mass.sum(axis=1)
                d = np.divide(positive.sum(axis=1), total, out=np.full(trials, .5), where=total > 0)
                n, u = 1 - d, np.zeros(trials)
                if method == "bayesian_weighted_beta":
                    # Beta(1,1) prior and a power likelihood with the same
                    # reputation-discounted report weights as the other methods.
                    # Score is posterior P(theta > 0.5), not the Beta MAP vote.
                    d = 1 - betainc(1 + positive.sum(axis=1), 1 + negative.sum(axis=1), .5)
                    n = 1 - d
                    actions = decision(d, n, policy.threshold)
                elif method == "weighted_vote_075":
                    actions = decision(d, n, policy.threshold)
                elif method == "weighted_vote_050":
                    actions = np.where(d > .5, 1, np.where(d < .5, 0, -1)).astype(np.int8)
                else:
                    actions = np.where(positive_count > negative_count, 1, np.where(positive_count < negative_count, 0, -1)).astype(np.int8)
            actions = np.where(selected_count > 0, actions, -1)
            d = np.where(selected_count > 0, d, 0.)
            u = np.where(selected_count > 0, u, 1.)
            measures = scores(actions, active)
            interval_count = int(np.sum(actions != 1)) if active else int(np.sum(actions == 1))
            low, high = wilson_interval(interval_count, trials)
            summaries.append({"method": method, "round": round_index + 1, "malicious_round": malicious,
                "event_active": active, "feedback_mode": feedback_mode, "trials": trials,
                **measures, "primary_error_ci_low": low, "primary_error_ci_high": high,
                "mean_disaster_belief": float(d.mean()), "mean_uncertainty": float(u.mean()),
                "mean_evidence_groups": float(group_counts.mean()),
                "honest_reputation_mean": float(reputation[:, :config.honest_count].mean()),
                "bot_reputation_mean": float(reputation[:, config.honest_count:].mean()) if config.bot_count else None})
            for name, values in {"action": actions, "belief": d, "uncertainty": u,
                "honest_reputation": reputation[:, :config.honest_count].mean(axis=1),
                "bot_reputation": reputation[:, config.honest_count:].mean(axis=1) if config.bot_count else np.full(trials, np.nan)}.items():
                traces[method + "_" + name].append(values.copy())
            if feedback_mode == "independent_reference":
                judged = selected
                correct = claims == active
            elif feedback_mode == "self_consensus":
                judged = selected & (actions >= 0)[:, None]
                correct = claims == (actions == 1)[:, None]
            elif feedback_mode == "no_verified_feedback":
                # The offline default: absence of a verified label is not evidence
                # of honesty or malice, so reputation is retained without rewards.
                continue
            else:
                raise ValueError("Unknown feedback mode")
            upvotes = np.where(claims, positive_count[:, None] - 1, negative_count[:, None] - 1)
            delta = np.where(correct, np.tanh(config.beta_reward * np.maximum(upvotes, 0)), -config.eta_penalty)
            updated = np.clip(config.alpha_retention * reputation + delta, 0., 1.)
            reputations[method] = np.where(judged, updated, reputation)
    return summaries, {name: np.asarray(values) for name, values in traces.items()}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("data/dependence_revision"))
    parser.add_argument("--trials", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=211206)
    parser.add_argument("--case-limit", type=int, help="Smoke-test only; limited runs are not the primary campaign")
    args = parser.parse_args()
    if args.trials < 1:
        raise ValueError("Positive trials required")
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    raw_dir = output / "raw_trials"
    raw_dir.mkdir(exist_ok=True)
    records, summaries = [], []
    all_cases = cases()
    selected_cases = all_cases if args.case_limit is None else all_cases[:args.case_limit]
    for index, case in enumerate(selected_cases):
        config, policy, key = case["config"], case["policy"], case["case_id"]
        geometry_id = json.dumps({"seed": args.seed, "honest": config.honest_count, "bots": config.bot_count,
                                  "pattern": config.pattern}, sort_keys=True)
        seed = int.from_bytes(hashlib.sha256(geometry_id.encode()).digest()[:8], "big")
        geometry = prepare_geometry(config, args.trials, seed)
        raw = dict(geometry)
        for active in (False, True):
            for mode in FEEDBACK_MODES:
                rows, traces = evaluate(config, policy, geometry, active, mode)
                for row in rows:
                    row.update(case_id=key, purposes=";".join(case["purposes"]), pattern=config.pattern,
                               honest_count=config.honest_count, bot_count=config.bot_count,
                               honest_initial_reputation=config.honest_initial_reputation,
                               bot_initial_reputation=config.bot_initial_reputation,
                               decision_threshold=policy.threshold,
                               method_decision_threshold=.5 if row["method"] in {"majority", "weighted_vote_050"} else policy.threshold)
                summaries.extend(rows)
                raw.update({f"event_{int(active)}_{mode}_{name}": values for name, values in traces.items()})
        raw_file = raw_dir / (key + ".npz")
        np.savez_compressed(raw_file, **raw)
        records.append({"case_id": key, "purposes": case["purposes"], "configuration": asdict(config),
            "pooling_policy": asdict(policy), "geometry_seed": seed,
            "raw_file": raw_file.relative_to(output).as_posix(), "raw_sha256": hashlib.sha256(raw_file.read_bytes()).hexdigest()})
        print(f"Completed {index + 1}/{len(selected_cases)} matched cases", flush=True)
    csv_path = output / "dependence_campaign.csv"
    pd.DataFrame(summaries).to_csv(csv_path, index=False)
    metadata = {"created_at_utc": datetime.now(timezone.utc).isoformat(), "trials": args.trials, "seed": args.seed,
        "complete_primary_case_set": args.case_limit is None, "expected_unique_cases": len(all_cases),
        "provenance_class": "synthetic_adversarial_simulation", "methods": METHODS, "feedback_modes": FEEDBACK_MODES,
        "cases": records, "campaign_sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
        "code_sha256": {name: hashlib.sha256((Path(__file__).parent / name).read_bytes()).hexdigest() for name in
            [Path(__file__).name, "dependence_aware_verification.py", "sybil_pipeline_campaign.py", "sybil_revision_experiments.py"]},
        "interpretation": "Matched geometry and initial reputation; each method has its own feedback trajectory. Oracle labels are simulated. Terrain is synthetic. Unresolved true events are counted as missed alerts.",
        "bayesian_baseline": "Beta(1,1) prior with fractional reputation-discounted report counts; posterior P(theta>0.5) thresholded symmetrically. This differs from the symmetric Beta MAP baseline that duplicates majority voting.",
        "limitations": "Grid and time buckets approximate dependence; accounts spanning more groups or compromised high reputation can defeat the policy. No identity-authentication or general Sybil-security proof."}
    (output / "dependence_campaign_manifest.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
