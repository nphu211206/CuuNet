"""Regression tests for leakage, provenance, hydrological units and adversarial arithmetic."""
from __future__ import annotations

import json
import copy
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch
import zipfile
import uuid

import numpy as np
import pandas as pd
import requests
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "notebooks"))
sys.path.insert(0, str(ROOT / "src" / "simulation"))
import revision_experiments as experiment
import prepare_glofas_revision_data as preparation
import sybil_revision_experiments as sybil
import sybil_pipeline_campaign as spatial_campaign
from dataclasses import replace
from audit_revision_outputs import audit_outputs


class WorkspaceTest(unittest.TestCase):
    def setUp(self):
        parent = ROOT / "analysis" / "revision_smoke" / "test_tmp"
        parent.mkdir(parents=True, exist_ok=True)
        self.temporary = tempfile.TemporaryDirectory(dir=parent)
        self.directory = Path(self.temporary.name).resolve()
        if not self.directory.is_relative_to(ROOT):
            raise RuntimeError("Test cleanup target is outside the workspace")
        self.addCleanup(self.temporary.cleanup)


class ForecastTests(WorkspaceTest):
    def test_future_changes_cannot_change_earlier_forecasts(self):
        index = pd.date_range("2000-01-01", periods=60, freq="MS")
        original = pd.Series(100 + np.arange(60) + 20 * np.sin(np.arange(60) * np.pi / 6), index=index)
        changed = original.copy()
        changed.iloc[48:] += 10000
        first = experiment.walk_forward_baselines(original, index[36:], 12, 3)
        second = experiment.walk_forward_baselines(changed, index[36:], 12, 3)
        np.testing.assert_allclose(first.loc[:index[48]], second.loc[:index[48]], rtol=0, atol=0)
        self.assertNotEqual(first.loc[index[49], "persistence"], second.loc[index[49], "persistence"])

    def test_moving_average_window_is_respected(self):
        dates = pd.date_range("2000-01-01", periods=36, freq="MS")
        series = pd.Series(np.arange(36, dtype=float) ** 2, index=dates)
        first = experiment.walk_forward_baselines(series, dates[-1:], 12, 1)
        second = experiment.walk_forward_baselines(series, dates[-1:], 12, 6)
        self.assertEqual(float(first.iloc[0]["moving_average"]), float(series.iloc[-2]))
        self.assertAlmostEqual(float(second.iloc[0]["moving_average"]), float(series.iloc[-7:-1].mean()))

    def test_scalers_never_fit_validation_or_test_extremes(self):
        dates = pd.date_range("2000-01-01", periods=60, freq="MS")
        frame = pd.DataFrame({"q": np.arange(60, dtype=float), "x": np.arange(60, dtype=float) * 2}, index=dates)
        split = {"train_end": "2002-12-31", "validation_end": "2003-12-31"}
        first = experiment.prepare_neural_arrays(frame, ["q", "x"], "q", split, 12)
        changed = frame.copy()
        changed.loc["2003-01-01":] += 1e8
        second = experiment.prepare_neural_arrays(changed, ["q", "x"], "q", split, 12)
        np.testing.assert_array_equal(first["x_train"], second["x_train"])
        np.testing.assert_array_equal(first["y_train"], second["y_train"])
        np.testing.assert_array_equal(first["feature_scaler"].scale_, second["feature_scaler"].scale_)
        self.assertGreater(float(second["x_test"].max()), 1.0)

    def test_bias_is_included_in_expected_mse(self):
        errors = np.column_stack([np.full(36, 10.0), np.zeros(36)])
        weights, bias, covariance = experiment.expected_mse_weights(errors, 0.1)
        np.testing.assert_allclose(weights, [0, 1], atol=1e-7)
        np.testing.assert_allclose(bias, [10, 0])
        np.testing.assert_allclose(covariance, np.zeros((2, 2)))

    def test_float32_forecasts_roundtrip_physical_units_for_javascript(self):
        scaler = experiment.MinMaxScaler().fit(np.array([[0.390851], [0.660617]]))
        scaled = np.linspace(-0.1, 1.1, 48, dtype=np.float32)
        exported = experiment.inverse_target(scaled, scaler)
        javascript = (scaled.astype(float) - scaler.min_[0]) / scaler.scale_[0]
        np.testing.assert_allclose(exported, javascript, atol=1e-12, rtol=0)

    def test_weight_optimisation_is_invariant_to_physical_unit_scaling(self):
        generator = np.random.default_rng(12)
        errors = generator.normal(size=(36, 3)) + [0, 2, 5]
        first, _, _ = experiment.expected_mse_weights(errors, .2)
        second, _, _ = experiment.expected_mse_weights(errors * 1e6, .2)
        np.testing.assert_allclose(first, second, atol=1e-8)
        self.assertAlmostEqual(float(first.sum()), 1)
        self.assertTrue((first >= 0).all())

    def test_physical_bounds_clip_and_count_only_changed_forecasts(self):
        values, count = experiment.constrain_prediction_array(np.array([-4, 0, 7]), {"lower": 0, "upper": None})
        np.testing.assert_array_equal(values, [0, 0, 7])
        self.assertEqual(count, 1)

    def test_circular_bootstrap_preserves_declared_block_length(self):
        indices = experiment.circular_block_indices(48, 12, np.random.default_rng(42))
        self.assertEqual(len(indices), 48)
        for block in indices.reshape(4, 12):
            np.testing.assert_array_equal(np.diff(block) % 48, np.ones(11))

    def test_duplicate_months_are_rejected(self):
        dates = list(pd.date_range("2000-01-01", periods=48, freq="MS"))
        dates[2] = dates[1]
        path = self.directory / "duplicates.csv"
        pd.DataFrame({"date": dates, "q": np.arange(48)}).to_csv(path, index=False)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            experiment.load_zone(self.directory, {"id": "test", "file": path.name, "date_column": "date", "target_column": "q", "feature_columns": []},
                                 {"train_end": "2001-12-31", "validation_end": "2002-12-31", "test_end": "2003-12-31"})

    def test_missing_months_are_not_silently_interpolated(self):
        dates = pd.date_range("2000-01-01", periods=48, freq="MS").delete(7)
        path = self.directory / "gap.csv"
        pd.DataFrame({"date": dates, "q": np.arange(47)}).to_csv(path, index=False)
        with self.assertRaisesRegex(ValueError, "complete calendar"):
            experiment.load_zone(self.directory, {"id": "test", "file": path.name, "date_column": "date", "target_column": "q", "feature_columns": []},
                                 {"train_end": "2001-12-31", "validation_end": "2002-12-31", "test_end": "2003-12-31"})

    def test_synthetic_manifest_cannot_claim_publication_eligibility(self):
        manifest = json.loads((ROOT / "data" / "experiment_manifest.synthetic.json").read_text(encoding="utf-8"))
        manifest["publication_eligible"] = True
        path = self.directory / "manifest.json"
        path.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "synthetic"):
            experiment.load_manifest(path)


class GlofasTests(WorkspaceTest):
    def dataset(self, units="m3 s-1"):
        dates = pd.date_range("2000-01-01", "2024-12-31", freq="D")
        values = np.ones((len(dates), 2, 2), dtype=float)
        values[:, 0, 0] = 100
        values[dates > "2017-12-31", 1, 1] = 1e6
        dataset = xr.Dataset({"dis24": (("time", "latitude", "longitude"), values)},
            coords={"time": dates, "latitude": [22.0, 22.05], "longitude": [104.0, 104.05]})
        dataset["dis24"].attrs["units"] = units
        path = self.directory / "synthetic_channel_fixture.nc"
        dataset.to_netcdf(path)
        return path

    def test_channel_selection_does_not_use_future_high_flow(self):
        path = self.dataset()
        daily, selection = preparation.select_channel_series([path], {"id": "test", "label": "synthetic fixture",
            "centre_lat": 22.025, "centre_lon": 104.025}, .1, 2000, 2024)
        self.assertEqual(selection["selected_grid_latitude"], 22.0)
        self.assertEqual(selection["selected_grid_longitude"], 104.0)
        self.assertFalse(selection["selection_uses_test_data"])
        self.assertEqual(float(daily.max()), 100.0)

    def test_hydrological_units_must_be_confirmed(self):
        path = self.dataset(units="mm day-1")
        with self.assertRaisesRegex(ValueError, "units"):
            preparation.select_channel_series([path], {"id": "test", "label": "fixture", "centre_lat": 22.025, "centre_lon": 104.025}, .1, 2000, 2024)

    def test_monthly_aggregation_handles_leap_days(self):
        dates = pd.date_range("2000-01-01", "2000-02-29", freq="D")
        frame = preparation.aggregate_monthly(pd.Series(3.0, index=dates, name="discharge_m3s"))
        self.assertEqual(frame["expected_daily_count"].tolist(), [31, 29])
        self.assertEqual(frame["available_reanalysis_daily_count"].tolist(), [31, 29])
        self.assertEqual(frame["discharge_m3s"].tolist(), [3.0, 3.0])

    def test_incomplete_month_is_rejected(self):
        dates = pd.date_range("2000-01-01", "2000-01-31", freq="D")
        values = pd.Series(3.0, index=dates, name="discharge_m3s")
        values.iloc[:5] = np.nan
        with self.assertRaisesRegex(RuntimeError, "coverage below"):
            preparation.aggregate_monthly(values)

    def test_official_request_contract_is_locked(self):
        with patch.object(sys, "argv", ["prepare_glofas_revision_data.py"]):
            arguments = preparation.parse_args()
        chunks = preparation.year_chunks(2000, 2024, arguments.chunk_years)
        self.assertEqual(len(chunks) * len(preparation.ZONES), 50)
        request = preparation.build_request(chunks[0], preparation.ZONES[0]["area"])
        self.assertEqual(request["year"], ["2000"])
        self.assertEqual(request["system_version"], ["version_4_0"])
        self.assertEqual(request["product_type"], "consolidated")
        self.assertEqual(request["data_format"], "netcdf")


def selected_request_dates(request):
    dates = set()
    for year in request["year"]:
        for month in request["month"]:
            for day in request["day"]:
                try:
                    dates.add(date(int(year), int(month), int(day)))
                except ValueError:
                    continue
    return dates


def provider_http_error(status, message):
    response = requests.Response()
    response.status_code = status
    return requests.HTTPError(message, response=response)


class FakeGlofasProvider:
    jobs = {}
    """Simulate provider limits and downloaded archives, without live credentials."""
    def __init__(self, limit=500, rejection_limit=None, failure=None, costing_raises=False):
        self.limit = limit
        self.rejection_limit = rejection_limit
        self.failure = failure
        self.costing_raises = costing_raises
        self.estimates = []
        self.attempts = []
        self.completed = []
        self.client = self
        self.submissions = []
        self.reconnections = []

    def submit(self, dataset, request):
        request_id = str(uuid.uuid4())
        self.submissions.append(copy.deepcopy(request))
        self.jobs[request_id] = copy.deepcopy(request)
        return FakeGlofasRemote(self, request_id)

    def get_remote(self, request_id):
        self.reconnections.append(request_id)
        return FakeGlofasRemote(self, request_id)

    def estimate_costs(self, dataset, request):
        assert dataset == preparation.DATASET_ID
        self.estimates.append(copy.deepcopy(request))
        cost = len(selected_request_dates(request))
        if self.costing_raises and cost > self.limit:
            raise provider_http_error(403, "cost limits exceeded")
        return {"id": "size", "cost": cost, "limit": self.limit}

    def retrieve(self, dataset, request, target):
        assert dataset == preparation.DATASET_ID
        self.attempts.append(copy.deepcopy(request))
        if self.failure:
            Path(target).write_bytes(b"incomplete download")
            raise self.failure
        if self.rejection_limit is not None and len(selected_request_dates(request)) > self.rejection_limit:
            Path(target).write_bytes(b"incomplete download")
            raise provider_http_error(403, "cost limits exceeded: Your request is too large")
        with zipfile.ZipFile(target, "w") as archive:
            archive.writestr("data.nc", b"CDF\x01download test fixture")
            archive.writestr("fixture_request.json", json.dumps(request))
        self.completed.append(copy.deepcopy(request))


class FakeGlofasRemote:
    def __init__(self, provider, request_id):
        self.provider = provider
        self.request_id = request_id
        self.cleanup = True

    @property
    def json(self):
        return {"processID": preparation.DATASET_ID, "status": "accepted",
                "metadata": {"request": {"ids": self.provider.jobs[self.request_id]}}}

    def download(self, target):
        assert self.cleanup is False
        journal = Path(target).with_suffix(".job.json")
        assert json.loads(journal.read_text())["request_id"] == self.request_id
        return self.provider.retrieve(preparation.DATASET_ID, self.provider.jobs[self.request_id], target)


class GlofasDownloadTests(WorkspaceTest):
    def setUp(self):
        super().setUp()
        self.raw = self.directory / "raw"
        self.raw.mkdir()
        self.zone = preparation.ZONES[0]

    def download(self, provider, chunks, cached_only=False):
        fake_module = SimpleNamespace(Client=lambda **kwargs: provider)
        credentials = patch.object(preparation, "resolve_cds_credentials", return_value=("https://example.test/api", "fixture-key"))
        if cached_only:
            credentials = patch.object(preparation, "resolve_cds_credentials", side_effect=AssertionError("Cached data must not require credentials"))
        with patch.dict(sys.modules, {"cdsapi": fake_module}), credentials:
            return preparation.retrieve_chunks(self.zone, self.raw, chunks, False)

    def assert_date_coverage(self, completed, first, last):
        groups = [selected_request_dates(request) for request in completed]
        union = set().union(*groups)
        expected = {stamp.date() for stamp in pd.date_range(first, last, freq="D")}
        self.assertEqual(union, expected)
        self.assertEqual(sum(map(len, groups)), len(expected))
        for request in completed:
            self.assertEqual(request["area"], self.zone["area"])
            self.assertEqual(request["variable"], preparation.VARIABLE)
            self.assertEqual(request["system_version"], ["version_4_0"])

    def test_oversized_five_year_request_is_split_before_submission(self):
        provider = FakeGlofasProvider(limit=500)
        paths = self.download(provider, preparation.year_chunks(2000, 2004, 5))
        self.assertEqual(len(paths), 5)
        self.assertEqual(len(selected_request_dates(provider.estimates[0])), 1827)
        self.assertTrue(all(len(selected_request_dates(request)) <= 500 for request in provider.attempts))
        self.assert_date_coverage(provider.completed, "2000-01-01", "2004-12-31")
        for path in paths:
            receipt = json.loads(path.with_suffix(".request.json").read_text())
            self.assertEqual(receipt["download_sha256"], preparation.sha256(path))
            self.assertLessEqual(receipt["cost_estimate"]["cost"], receipt["cost_estimate"]["limit"])

    def test_smaller_budget_preserves_every_day_including_february_29(self):
        provider = FakeGlofasProvider(limit=20)
        paths = self.download(provider, [["2000"]])
        self.assertGreater(len(paths), 12)
        self.assertEqual(len(paths), len(set(paths)))
        self.assertTrue(all(len(selected_request_dates(request)) <= 20 for request in provider.attempts))
        self.assert_date_coverage(provider.completed, "2000-01-01", "2000-12-31")
        self.assertEqual(list(self.raw.glob("*.partial")), [])

    def test_execution_cost_rejection_is_split_and_partial_file_is_removed(self):
        provider = FakeGlofasProvider(limit=500, rejection_limit=30)
        self.download(provider, [["2000"]])
        self.assertGreater(len(provider.attempts), len(provider.completed))
        self.assertTrue(all(len(selected_request_dates(request)) <= 30 for request in provider.completed))
        self.assert_date_coverage(provider.completed, "2000-01-01", "2000-12-31")
        self.assertEqual(list(self.raw.glob("*.partial")), [])

    def test_costing_error_can_also_reduce_the_selection(self):
        provider = FakeGlofasProvider(limit=60, costing_raises=True)
        self.download(provider, [["2000"]])
        self.assertTrue(all(len(selected_request_dates(request)) <= 60 for request in provider.attempts))
        self.assert_date_coverage(provider.completed, "2000-01-01", "2000-12-31")

    def test_valid_cache_requires_neither_credentials_nor_new_requests(self):
        chunks = [["2000"], ["2001"]]
        first = FakeGlofasProvider()
        paths = self.download(first, chunks)
        second = FakeGlofasProvider()
        self.assertEqual(self.download(second, chunks, cached_only=True), paths)
        self.assertEqual(second.estimates, [])
        self.assertEqual(second.attempts, [])

    def test_interrupted_download_resumes_only_unfinished_years(self):
        self.download(FakeGlofasProvider(), [["2000"]])
        provider = FakeGlofasProvider(failure=requests.ConnectionError("fixture interruption"))
        with self.assertRaises(requests.ConnectionError):
            self.download(provider, [["2000"], ["2001"]])
        self.assertEqual([request["year"] for request in provider.attempts], [["2001"]])
        resumed = FakeGlofasProvider()
        self.assertEqual(len(self.download(resumed, [["2000"], ["2001"]])), 2)
        self.assertEqual([request["year"] for request in resumed.completed], [["2001"]])
        self.assertEqual(list(self.raw.glob("*.partial")), [])
        self.assertEqual(resumed.submissions, [])
        self.assertEqual(len(resumed.reconnections), 1)

    def test_adopted_job_is_checked_and_reconnected_without_costing_or_submission(self):
        provider = FakeGlofasProvider()
        request_id = str(uuid.uuid4())
        provider.jobs[request_id] = preparation.build_request(["2000"], self.zone["area"])
        preparation.register_adoptions(self.raw, [f"{self.zone['id']}:2000:{request_id}"])
        paths = self.download(provider, [["2000"]])
        self.assertEqual(len(paths), 1)
        self.assertEqual(provider.submissions, [])
        self.assertEqual(provider.estimates, [])
        self.assertEqual(provider.reconnections, [request_id])

    def test_adopted_uuid_for_a_different_reach_is_rejected_before_download(self):
        provider = FakeGlofasProvider()
        request_id = str(uuid.uuid4())
        provider.jobs[request_id] = preparation.build_request(["2000"], preparation.ZONES[1]["area"])
        preparation.register_adoptions(self.raw, [f"{self.zone['id']}:2000:{request_id}"])
        with self.assertRaisesRegex(RuntimeError, "different collection or request"):
            self.download(provider, [["2000"]])
        self.assertEqual(provider.attempts, [])
        self.assertEqual(provider.submissions, [])

    def test_saved_split_plan_is_reused_when_the_budget_increases(self):
        first = FakeGlofasProvider(limit=200, failure=requests.ConnectionError("fixture interruption"))
        with self.assertRaises(requests.ConnectionError):
            self.download(first, [["2000"]])
        second = FakeGlofasProvider(limit=500)
        paths = self.download(second, [["2000"]])
        self.assertGreater(len(paths), 1)
        self.assertEqual(len(second.reconnections), 1)
        self.assertTrue(all(len(selected_request_dates(request)) <= 200 for request in second.completed))
        self.assert_date_coverage(second.completed, "2000-01-01", "2000-12-31")

    def test_prepare_only_cannot_submit_or_require_credentials(self):
        with patch.object(preparation, "resolve_cds_credentials", side_effect=AssertionError("no credentials")):
            with self.assertRaisesRegex(FileNotFoundError, "CPU acquisition"):
                preparation.retrieve_chunks(self.zone, self.raw, [["2000"]], False, prepare_only=True)

    def test_licence_and_rate_errors_are_not_treated_as_oversized_requests(self):
        for status, message in ((403, "required licences have not been accepted"), (429, "too many requests")):
            with self.subTest(status=status):
                provider = FakeGlofasProvider(failure=provider_http_error(status, message))
                with self.assertRaises(requests.HTTPError):
                    self.download(provider, [["2000"]])
                self.assertEqual(len(provider.attempts), 1)
                self.assertEqual(provider.completed, [])

    def test_one_day_over_budget_stops_without_submitting(self):
        provider = FakeGlofasProvider(limit=0)
        with self.assertRaisesRegex(RuntimeError, "one-day"):
            self.download(provider, [["2000"]])
        self.assertEqual(provider.attempts, [])

    def test_tampered_cache_cannot_be_silently_reused(self):
        path = self.download(FakeGlofasProvider(), [["2000"]])[0]
        with path.open("ab") as handle:
            handle.write(b"tampered")
        with self.assertRaisesRegex(RuntimeError, "hash mismatch"):
            self.download(FakeGlofasProvider(), [["2000"]], cached_only=True)


class SybilTests(unittest.TestCase):
    def test_log_space_fusion_retains_evidence_under_strong_conflict(self):
        positive = np.full((1, 50), .95)
        negative = np.full((1, 100), .8)
        disaster, no_disaster, uncertainty, fallback = sybil.vectorised_dst_mass(positive, negative)
        self.assertFalse(bool(fallback[0]))
        self.assertLess(float(uncertainty[0]), 1e-20)
        self.assertAlmostEqual(float(disaster[0] + no_disaster[0] + uncertainty[0]), 1, places=12)
        expected_ratio = 1 / (1 + np.exp(50 * np.log(.05) - 100 * np.log(.2)))
        self.assertAlmostEqual(float(disaster[0]), float(expected_ratio), places=10)

    def test_exact_total_conflict_is_explicitly_separate(self):
        disaster, no_disaster, uncertainty, fallback = sybil.vectorised_dst_mass(np.ones((1, 1)), np.ones((1, 1)))
        self.assertTrue(bool(fallback[0]))
        np.testing.assert_array_equal([disaster[0], no_disaster[0], uncertainty[0]], [0, 0, 1])

    def test_pairwise_and_batch_mass_combination_agree(self):
        positive, negative = np.array([[.8, .7, .5]]), np.array([[.4, .2]])
        batch, _, _, _ = sybil.vectorised_dst_mass(positive, negative)
        reports = [sybil.report_mass(True, value) for value in positive[0]] + [sybil.report_mass(False, value) for value in negative[0]]
        fused, _, _ = sybil.fuse_reports(reports)
        self.assertAlmostEqual(fused.disaster, float(batch[0]), places=13)

    def test_wilson_interval_does_not_claim_certainty_from_zero_failures(self):
        low, high = sybil.wilson_interval(0, 2000)
        self.assertEqual(low, 0)
        self.assertGreater(high, 0)


class OutputAuditTests(WorkspaceTest):
    def test_tampered_predictions_cannot_pass_publication_gate(self):
        source = ROOT / "analysis" / "revision_smoke" / "statistical"
        if not (source / "manuscript_results.json").is_file():
            self.skipTest("Run the statistical smoke test before auditing its tampering guard")
        copied = self.directory / "tampered_output"
        shutil.copytree(source, copied)
        predictions = pd.read_csv(copied / "baseline_predictions.csv")
        predictions.loc[0, "predicted"] += 1000
        predictions.to_csv(copied / "baseline_predictions.csv", index=False)
        report = audit_outputs(copied)
        self.assertFalse(report["passed"])
        results = json.loads((copied / "manuscript_results.json").read_text(encoding="utf-8"))
        self.assertFalse(results["publication_eligible"])


class SpatialCampaignTests(unittest.TestCase):
    def test_terrain_ablation_uses_identical_positions_and_ages(self):
        config = spatial_campaign.Configuration(bot_count=10)
        first = spatial_campaign.prepare_geometry(config, 20, 42)
        second = spatial_campaign.prepare_geometry(replace(config, terrain_discount=False), 20, 42)
        np.testing.assert_array_equal(first["positions_km"], second["positions_km"])
        np.testing.assert_array_equal(first["ages_hours"], second["ages_hours"])
        np.testing.assert_array_equal(first["selected"], second["selected"])
        self.assertTrue((first["discount_factors"] <= second["discount_factors"]).all())

    def test_sparse_reports_abstain_without_fabricating_consensus(self):
        config = spatial_campaign.Configuration(honest_count=1, bot_count=0)
        geometry = spatial_campaign.prepare_geometry(config, 10, 42)
        _, trace = spatial_campaign.campaign(config, geometry, True, "self_consensus")
        self.assertTrue(trace["dst_abstained"].all())
        self.assertFalse(trace["dst_alert"].any())

    def test_self_consensus_can_reward_attackers_while_oracle_feedback_is_explicitly_distinct(self):
        config = spatial_campaign.Configuration(bot_count=10, pattern="remote_cluster")
        geometry = spatial_campaign.prepare_geometry(config, 20, 42)
        _, oracle = spatial_campaign.campaign(config, geometry, False, "independent_reference")
        _, self_reinforcing = spatial_campaign.campaign(config, geometry, False, "self_consensus")
        self.assertGreater(float(self_reinforcing["final_reputation"][:, config.honest_count:].mean()), .9)
        self.assertLess(float(oracle["final_reputation"][:, config.honest_count:].mean()), .1)


if __name__ == "__main__":
    unittest.main(verbosity=2, buffer=True)
