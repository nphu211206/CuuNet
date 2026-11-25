"""Scientific-contract tests for accumulated runoff and genuinely unavailable future inputs."""
from __future__ import annotations
import copy
from pathlib import Path
import sys
import tempfile
import unittest
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prepare_runoff_revision_data as data
import revision_experiments as exp
import outage_revision_experiments as outage
import prepare_waterbench_reference as observed

def exported_rows(frequency="daily", start="2024-02-27", end="2024-03-01"):
    dates = pd.date_range(start, end, freq="D" if frequency == "daily" else "MS")
    rows = []
    for zone, (lon, lat) in data.SITES.items():
        for date in dates:
            rows.append({"date": date.date().isoformat(), "zone": zone, "HYBAS_ID": 100,
                "runoff_m": .03, "precipitation_m": .05, "temperature_K": 300., "soil_m3m3": .2,
                "valid_area_m2": 1e8, "centre_lon": lon, "centre_lat": lat,
                "source_image": date.strftime("%Y%m%d"), "source_id": data.COLLECTIONS[frequency],
                "frequency": frequency, "accumulation": "daily_sum" if frequency == "daily" else "calendar_month_sum",
                "aggregation": "valid_land_pixel_area_weighted_mean",
                "geometry_rule": "enclosing_HydroBASINS_level5_stable_HYBAS_ID_order"})
    return pd.DataFrame(rows)

class DataTests(unittest.TestCase):
    def test_monthly_accumulation_is_not_multiplied_by_month_length(self):
        frame = exported_rows("monthly", "2024-01-01", "2024-03-31")
        prepared, _ = data.validate_rows(frame, "monthly", "2024-01-01", "2024-03-31")
        np.testing.assert_allclose(prepared["runoff_mm"], 30.)
        np.testing.assert_allclose(prepared["temperature_C"], 26.85)

    def test_missing_leap_day_is_rejected(self):
        frame = exported_rows()
        frame = frame.loc[frame["date"] != "2024-02-29"]
        with self.assertRaisesRegex(ValueError, "every requested"):
            data.validate_rows(frame, "daily", "2024-02-27", "2024-03-01")

    def test_overlapping_annual_exports_are_rejected(self):
        frame = exported_rows()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            data.validate_rows(pd.concat([frame, frame.iloc[:1]]), "daily", "2024-02-27", "2024-03-01")

    def test_wrong_provider_or_aggregation_cannot_be_relabelled(self):
        for field, value in [("source_id", "synthetic"), ("accumulation", "daily_mean"), ("aggregation", "unweighted_point")]:
            frame = exported_rows()
            frame.loc[0, field] = value
            with self.assertRaises(ValueError):
                data.validate_rows(frame, "daily", "2024-02-27", "2024-03-01")

    def test_only_tiny_negative_packing_errors_are_rectified(self):
        frame = exported_rows()
        frame.loc[0, "runoff_m"] = -1e-6
        prepared, summaries = data.validate_rows(frame, "daily", "2024-02-27", "2024-03-01")
        self.assertEqual(int((prepared["runoff_mm"] == 0).sum()), 1)
        self.assertEqual(sum(r["negative_runoff_values_rectified"] for r in summaries), 1)
        frame.loc[0, "runoff_m"] = -.001
        with self.assertRaisesRegex(ValueError, "materially negative"):
            data.validate_rows(frame, "daily", "2024-02-27", "2024-03-01")

    def test_partial_acquisition_cannot_create_publication_manifest(self):
        with self.assertRaisesRegex(ValueError, "locked"):
            data.prepare([], Path("unused"), "daily", "2024-01-01", "2024-12-31", Path("unused"))

class OutageTests(unittest.TestCase):
    def test_training_censoring_changes_no_calendar_or_labels_and_has_fixed_count(self):
        columns = ["q", "available", "input_age_01", "annual_sin", "annual_cos"]
        sequence = np.zeros((12, 30, 5), dtype=np.float32)
        sequence[:, :, 0] = np.arange(30)[None, :]
        sequence[:, :, 1] = 1.
        sequence[:, :, 3:] = .4
        changed, audit = exp.censor_training_inputs(sequence, columns,
            {"availability_feature_columns": ["available"], "age_feature_column": "input_age_01"}, 42, 7, 1.)
        self.assertEqual(changed.shape, sequence.shape)
        np.testing.assert_array_equal(changed[:, :, 3:], sequence[:, :, 3:])
        self.assertEqual(audit["label_changes"], 0)
        self.assertEqual(audit["censored_sequences"], 12)
        for row in changed:
            gap = int((row[:, 1] == 0).sum())
            self.assertTrue(1 <= gap <= 7)
            np.testing.assert_array_equal(row[-gap:, 0], np.full(gap, row[-gap - 1, 0]))
            self.assertTrue((row[-gap:, 2] > 0).all())

    def test_constant_indicators_use_known_ranges_without_future_fitting(self):
        dates = pd.date_range("2000-01-01", periods=60, freq="MS")
        frame = pd.DataFrame({"q": np.arange(60.), "available": np.ones(60), "age": np.zeros(60)}, index=dates)
        arrays = exp.prepare_neural_arrays(frame, list(frame), "q", {"train_end": "2002-12-31", "validation_end": "2003-12-31"}, 12,
                                          ["available", "age"])
        self.assertEqual(float(arrays["feature_scaler"].scale_[1]), 1.)
        self.assertEqual(float(arrays["feature_scaler"].min_[1]), 0.)
        self.assertTrue((arrays["x_train"][:, :, 1] == 1.).all())

    def test_missing_reference_labels_are_excluded_without_filling_targets(self):
        index = pd.date_range("2020-01-01", periods=100, freq="D")
        target = pd.Series(np.arange(100.), index=index)
        target.iloc[35:40] = np.nan
        target.iloc[75] = np.nan
        frame = pd.DataFrame({"target": target, "input": target.ffill(), "available": target.notna().astype(float)}, index=index)
        arrays = exp.prepare_neural_arrays(frame, ["input", "available"], "target",
            {"train_end": index[60].date().isoformat(), "validation_end": index[80].date().isoformat()}, 10)
        self.assertTrue(np.isfinite(arrays["y_train"]).all())
        self.assertTrue(np.isfinite(arrays["y_validation"]).all())
        self.assertNotIn(index[75], arrays["validation_dates"])
        self.assertEqual(len(arrays["y_train"]), 46)
        self.assertEqual(int(frame["target"].isna().sum()), 6)
        self.assertTrue((arrays["x_train"][:, :, 1] == 0).any())

    def test_future_physical_changes_cannot_enter_recursive_inputs(self):
        index = pd.date_range("2020-01-01", periods=100, freq="D")
        frame = pd.DataFrame({"q": np.arange(100.), "rain": np.arange(100.) / 10}, index=index)
        frame["annual_sin"] = [outage.calendar_values(date, "D")["annual_sin"] for date in index]
        frame["annual_cos"] = [outage.calendar_values(date, "D")["annual_cos"] for date in index]
        columns = list(frame)
        feature_scaler = exp.MinMaxScaler().fit(frame.iloc[:50])
        target_scaler = exp.MinMaxScaler().fit(frame.iloc[:50][["q"]])
        origins = pd.DatetimeIndex([index[60]])
        def predictor(batch):
            # Depend on the held precipitation and previous predicted target.
            return batch[:, -1, 0] + .1 * batch[:, -1, 1]
        first = outage.frozen_neural(frame, columns, "q", origins, [1, 3, 7], 30,
            feature_scaler, target_scaler, predictor, "D", {"lower": 0, "upper": None})
        changed = frame.copy()
        changed.loc[index[61]:, ["q", "rain"]] = 1e9
        second = outage.frozen_neural(changed, columns, "q", origins, [1, 3, 7], 30,
            feature_scaler, target_scaler, predictor, "D", {"lower": 0, "upper": None})
        for lead in first:
            np.testing.assert_array_equal(first[lead], second[lead])
        self.assertNotEqual(float(first[1][0]), float(first[7][0]))

    def test_baselines_freeze_at_origin_even_when_future_truth_changes(self):
        index = pd.date_range("2000-01-01", periods=80, freq="MS")
        series = pd.Series(np.arange(80.) + 5 * np.sin(np.arange(80.) * np.pi / 6), index=index)
        origin = pd.DatetimeIndex([index[60]])
        first = outage.frozen_baselines(series, origin, [1, 2, 3], 12, 3, None, "MS")
        changed = series.copy()
        changed.loc[index[61]:] += 1e8
        second = outage.frozen_baselines(changed, origin, [1, 2, 3], 12, 3, None, "MS")
        for lead in first:
            for model in first[lead]:
                np.testing.assert_array_equal(first[lead][model], second[lead][model])

    def test_calendar_step_preserves_leap_day(self):
        self.assertEqual(outage.future_date(pd.Timestamp("2024-02-28"), 1, "D"), pd.Timestamp("2024-02-29"))
        self.assertEqual(outage.future_date(pd.Timestamp("2024-02-28"), 2, "D"), pd.Timestamp("2024-03-01"))

class ObservedReferenceTests(unittest.TestCase):
    def test_hour_coverage_unit_conversion_and_input_fill_are_separate_from_labels(self):
        dates = pd.date_range("2011-10-01", "2018-09-30 23:00", freq="h")
        frame = pd.DataFrame({"datetime": dates, "discharge": np.full(len(dates), 100.)})
        frame.loc[0:1, "discharge"] = -9999
        frame.loc[24:26, "discharge"] = -9999
        daily = observed.aggregate(frame)
        self.assertAlmostEqual(float(daily.iloc[0]["discharge_m3s"]), 2.8316846592)
        self.assertEqual(int(daily.iloc[0]["valid_discharge_hours"]), 22)
        self.assertTrue(pd.isna(daily.iloc[1]["discharge_m3s"]))
        self.assertEqual(int(daily.iloc[1]["discharge_available"]), 0)
        self.assertAlmostEqual(float(daily.iloc[1]["discharge_input_m3s"]), 2.8316846592)

if __name__ == "__main__":
    unittest.main(verbosity=2)
