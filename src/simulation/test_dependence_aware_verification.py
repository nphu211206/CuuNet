"""Verify exact repetition invariance, decision accounting and attack boundaries."""
import unittest
import numpy as np
from dependence_aware_verification import PoolingPolicy, group_ids, pooled_mass, decision, scores
from sybil_revision_experiments import vectorised_dst_mass

class PoolingTests(unittest.TestCase):
    def test_same_group_repeated_claim_does_not_gain_confidence(self):
        policy = PoolingPolicy()
        def evaluate(count):
            positions = np.zeros((1, count, 2))
            selected = np.ones((1, count), dtype=bool)
            groups, counts = group_ids(positions, np.zeros((1, count)), selected, policy)
            return pooled_mass(selected, np.full((1, count), .5), groups, counts, policy)
        for actual, repeated in zip(evaluate(1), evaluate(100)):
            np.testing.assert_array_equal(actual, repeated)
        self.assertEqual(float(evaluate(100)[0][0]), .5)

    def test_simple_dempster_repetition_can_inflate_confidence(self):
        one = vectorised_dst_mass(np.array([[.5]]), np.array([[0.]]))[0][0]
        repeated = vectorised_dst_mass(np.full((1, 10), .5), np.zeros((1, 10)))[0][0]
        self.assertEqual(float(one), .5)
        self.assertGreater(float(repeated), .99)

    def test_mixed_claim_repetition_is_also_invariant(self):
        policy = PoolingPolicy()
        claims = np.array([[True, False]])
        masses = np.array([[.9, .5]])
        groups = np.zeros((1, 2), dtype=int)
        first = pooled_mass(claims, masses, groups, np.array([1]), policy)
        for value, repeated in zip(first, pooled_mass(np.tile(claims, (1, 50)), np.tile(masses, (1, 50)),
                                                   np.zeros((1, 100), dtype=int), np.array([1]), policy)):
            np.testing.assert_array_equal(value, repeated)
        self.assertAlmostEqual(float(sum(item[0] for item in first[:3])), 1.)

    def test_additional_groups_are_an_explicit_failure_mode(self):
        policy = PoolingPolicy()
        claims = np.array([[True] + [False] * 20])
        masses = np.array([[.95] + [.5] * 20])
        same = pooled_mass(claims, masses, np.zeros((1, 21), dtype=int), np.array([1]), policy)
        spread = pooled_mass(claims, masses, np.arange(21)[None, :], np.array([21]), policy)
        self.assertGreater(float(same[0][0]), .75)
        self.assertLess(float(spread[0][0]), .01)

    def test_unresolved_is_counted_in_missed_alert_rate(self):
        actions = decision(np.array([.8, .3, .1]), np.array([.1, .3, .8]), .75)
        np.testing.assert_array_equal(actions, [1, -1, 0])
        values = scores(actions, True)
        self.assertAlmostEqual(values["missed_alert_rate"], 2 / 3)
        self.assertAlmostEqual(values["abstention_rate"], 1 / 3)
        self.assertAlmostEqual(values["conditional_error_rate"], .5)

    def test_no_reports_produce_uncertainty_and_no_decisive_coverage(self):
        policy = PoolingPolicy()
        groups, counts = group_ids(np.zeros((1, 2, 2)), np.zeros((1, 2)), np.zeros((1, 2), dtype=bool), policy)
        d, n, u, _ = pooled_mass(np.ones((1, 2), dtype=bool), np.zeros((1, 2)), groups, counts, policy)
        self.assertEqual(float(u[0]), 1.)
        values = scores(decision(d, n, .75), True)
        self.assertEqual(values["missed_alert_rate"], 1.)
        self.assertEqual(values["decisive_coverage"], 0.)
        self.assertIsNone(values["conditional_error_rate"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
