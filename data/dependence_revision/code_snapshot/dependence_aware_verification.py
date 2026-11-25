"""Geo-time max-support pooling before evidential fusion.

This is an engineering dependence-control policy, not identity authentication or
a proof against unrestricted Sybils. Exact repetitions inside a fixed group do
not increase its evidence. Attackers who occupy additional groups can still win.
"""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np
from sybil_revision_experiments import vectorised_dst_mass

@dataclass(frozen=True)
class PoolingPolicy:
    cell_width_km: float = .25
    time_bin_hours: float = .5
    mass_cap: float = .95
    threshold: float = .75

def group_ids(positions_km: np.ndarray, ages_hours: np.ndarray, selected: np.ndarray,
              policy: PoolingPolicy) -> tuple[np.ndarray, np.ndarray]:
    positions = np.asarray(positions_km, dtype=float)
    ages = np.asarray(ages_hours, dtype=float)
    selected = np.asarray(selected, dtype=bool)
    if positions.shape != (*selected.shape, 2) or ages.shape != selected.shape:
        raise ValueError("Report geometry, timestamps and selection must have matching dimensions")
    if policy.cell_width_km <= 0 or policy.time_bin_hours <= 0 or not 0 < policy.mass_cap < 1 or not .5 < policy.threshold < 1:
        raise ValueError("Invalid pre-specified pooling policy")
    if not np.isfinite(positions).all() or not np.isfinite(ages).all():
        raise ValueError("Nonfinite report geometry")
    buckets = np.concatenate([np.floor(positions / policy.cell_width_km).astype(np.int64),
                              np.floor(ages / policy.time_bin_hours).astype(np.int64)[..., None]], axis=2)
    groups = np.full(selected.shape, -1, dtype=int)
    counts = np.zeros(len(selected), dtype=int)
    for trial in range(len(selected)):
        indices = np.flatnonzero(selected[trial])
        if not len(indices):
            continue
        _, inverse = np.unique(buckets[trial, indices], axis=0, return_inverse=True)
        groups[trial, indices] = inverse
        counts[trial] = int(inverse.max() + 1)
    return groups, counts

def pooled_mass(claims: np.ndarray, effective_masses: np.ndarray, groups: np.ndarray,
                group_counts: np.ndarray, policy: PoolingPolicy) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    claims = np.asarray(claims, dtype=bool)
    masses = np.asarray(effective_masses, dtype=float)
    groups = np.asarray(groups, dtype=int)
    if claims.shape != masses.shape or groups.shape != masses.shape or len(group_counts) != len(masses):
        raise ValueError("Mass and group arrays disagree")
    if not np.isfinite(masses).all() or ((masses < 0) | (masses > 1)).any():
        raise ValueError("Effective masses must be finite and lie in [0,1]")
    width = max(1, int(np.max(group_counts, initial=0)))
    positive = np.zeros((len(masses), width), dtype=float)
    negative = np.zeros_like(positive)
    trial, report = np.where(groups >= 0)
    identifiers = groups[trial, report]
    bounded = np.minimum(masses[trial, report], policy.mass_cap)
    # The maximum is idempotent for repetitions with the same claim, bucket and
    # effective mass. Neither a larger account count nor copied evidence raises it.
    np.maximum.at(positive, (trial, identifiers), np.where(claims[trial, report], bounded, 0))
    np.maximum.at(negative, (trial, identifiers), np.where(~claims[trial, report], bounded, 0))
    return vectorised_dst_mass(positive, negative)

def decision(disaster: np.ndarray, no_disaster: np.ndarray, threshold: float) -> np.ndarray:
    """-1 is unresolved, 0 is reject, 1 is alert. Unresolved alerts count as missed."""
    if not .5 < threshold < 1:
        raise ValueError("Two-sided decisions require a threshold above 0.5")
    result = np.full(np.asarray(disaster).shape, -1, dtype=np.int8)
    result[np.asarray(no_disaster) >= threshold] = 0
    result[np.asarray(disaster) >= threshold] = 1
    return result

def scores(actions: np.ndarray, event_active: bool) -> dict:
    actions = np.asarray(actions)
    covered = actions >= 0
    wrong = covered & (actions != int(event_active))
    return {"alert_rate": float(np.mean(actions == 1)), "false_alert_rate": float(np.mean(actions == 1)) if not event_active else None,
            "missed_alert_rate": float(np.mean(actions != 1)) if event_active else None,
            "false_rejection_rate": float(np.mean(actions == 0)) if event_active else None,
            "abstention_rate": float(np.mean(actions < 0)), "decisive_coverage": float(covered.mean()),
            "conditional_error_rate": float(wrong.sum() / covered.sum()) if covered.any() else None}
