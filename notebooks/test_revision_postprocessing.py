"""Small analytical checks for missing labels, bias and seed-aware RMSE summaries."""
import unittest
import numpy as np
from summarize_revision_results import calculate,index_draws,boot_model
from verify_python_js_parity import reference,report


class PostprocessingTests(unittest.TestCase):
    def test_missing_reference_is_not_imputed_or_scored(self):
        row=calculate(np.array([1.,np.nan,3.]),np.array([2.,999.,1.]),2.5)
        self.assertEqual(row['observations'],2);self.assertEqual(row['mae'],1.5)
        self.assertAlmostEqual(row['rmse'],np.sqrt(2.5));self.assertEqual(row['mean_bias'],-.5)
        self.assertEqual(row['nse'],-1.5);self.assertEqual(row['peak_count'],1);self.assertEqual(row['peak_mae'],2.)
    def test_expected_mse_retains_constant_bias_and_rmse_is_mean_across_seeds(self):
        errors=np.tile([1.,3.],(8,1));draws=index_draws(8,3,20)
        samples=boot_model(errors,draws,np.ones(8),.5)
        np.testing.assert_allclose(samples['mae'],2.)
        np.testing.assert_allclose(samples['rmse'],2.)
        np.testing.assert_allclose(samples['mse'],5.)
        np.testing.assert_allclose(samples['peak_mae'],2.)
    def test_circular_draws_are_reproducible_and_within_the_common_window(self):
        first=index_draws(7,3,20);second=index_draws(7,3,20)
        np.testing.assert_array_equal(first,second);self.assertEqual(first.shape,(20,7))
        self.assertTrue((first>=0).all() and (first<7).all())
    def test_python_fixture_uses_three_way_abstention_and_age_selection(self):
        cold=reference([report(i,reputation=.5) for i in range(3)],{})
        self.assertEqual(cold['action'],-1);self.assertEqual(cold['groups'],1)
        stale=reference([report(i,age=7) for i in range(3)],{})
        self.assertEqual(stale['selected'],0);self.assertEqual(stale['uncertainty'],1.)
    def test_python_fixture_reputation_is_discounted_and_capped(self):
        capped=reference([report(i,reputation=1.) for i in range(3)],{})
        self.assertAlmostEqual(capped['disaster'],.95);self.assertEqual(capped['action'],1)


if __name__=='__main__':unittest.main()
