# CuuNet — Research Data Repository

This directory contains simulation datasets and reference benchmarks used in the paper:

> **"A Spatio-Temporal Edge AI Framework with Sybil Defence for Crowdsourced Disaster Forecasting: A Case Study in Vietnam"**  
> *Submitted to Journal of Hydroinformatics (IWA Publishing)* — Manuscript Reference: HYDRO-D-26-00188  
> **Revision 1** (submitted December 2026)

---

## Dataset Files

### 1. `prediction_accuracy.csv`
**Description:** Forecasting accuracy (MAE and RMSE) for the Temporal Attention LSTM (TA-LSTM) model and baseline statistical models (Moving Average, Linear Regression, Seasonal Decomposition) across three regional ERA5-Land runoff series and two Iowa USGS discharge gauges.

| Column | Description |
|--------|-------------|
| `case_study` | Case study index (1=Bảo Hà Runoff, 2=Sông Gianh Runoff, 3=Cần Thơ Runoff) |
| `region` | Region name |
| `target_variable` | Physical target (ERA5-Land daily runoff depth mm/day, or USGS discharge m³/s) |
| `model` | Forecasting model name |
| `MAE` | Mean Absolute Error (in physical units of the target variable) |
| `RMSE` | Root Mean Squared Error |
| `split` | Data split: train / val / test |

**Source:** ERA5-Land daily aggregated reanalysis (Google Earth Engine collection `ECMWF/ERA5_LAND/DAILY_AGGR`), 2000–2024; USGS National Water Information System discharge gauges (Iowa, USA, used as supplementary out-of-region benchmark). Full provenance in `analysis/final_revision_20261125/`.

---

### 2. `edge_latency_benchmarks.csv`
**Description:** Client-side inference latency of the quantised TA-LSTM model (TensorFlow.js 4.22.0) measured in a controlled Headless Chrome 157 desktop environment. Each row summarises 50 measured batch-one passes (after 10 unmeasured warmup passes) for one combination of region × weight precision × execution backend, yielding **600 measured passes total** across 12 configurations.

| Column | Description |
|--------|-------------|
| `zone` | ERA5-Land region (Bao_Ha_Runoff / Gianh_Runoff / Can_Tho_Runoff) |
| `backend` | TensorFlow.js execution backend: `cpu` (CPU kernel) or `webgl` (WebGL GPU) |
| `model_variant` | Weight precision: `fp32` (32-bit float) or `uint8` (post-training INT8 quantisation) |
| `n_measured_passes` | Number of measured batch-one inference passes (50 per configuration) |
| `median_latency_ms` | Median measured inference latency in milliseconds |
| `p5_latency_ms` | 5th-percentile latency (ms) |
| `p95_latency_ms` | 95th-percentile latency (ms) |
| `environment` | Test environment description |

**Important scope note:** All measurements were conducted on a desktop workstation running Windows 10, Intel i5-12400F, Headless Chrome 157, TensorFlow.js 4.22.0. These results apply to desktop browser execution only. Mobile device inference latency, energy consumption, and battery performance were **not measured** in this study and remain a direction for future work. Prior unverified device-tier estimates (142.1 ms Redmi 9, 65.4 ms iPhone 13 Pro) appearing in pre-revision drafts have been removed; they lacked original experimental provenance.

**Full 600-row measurement log:** `paper_submission/browser_benchmarks/master_browser_benchmarks.csv`

---

### 3. `hoan_kiem_vgi_simulation.csv`
**Description:** Simulated Volunteered Geographic Information (VGI) flood reports used in the crowdsourced verification experiment (Section 4.5), representing a hypothetical pluvial flooding scenario in Hoan Kiem District, Hanoi.

> **Important:** The timestamps in this file (2025-09-07) are **synthetic demonstration timestamps** assigned during dataset generation and do **not** represent actual field observations. This simulation dataset is a methodological demonstration of the DBSCAN–DST pipeline. It is independent of the Super Typhoon Yagi (September 2024) historical event, which is used only as motivating meteorological context in the manuscript.

| Column | Description |
|--------|-------------|
| `report_id` | Unique report identifier |
| `reporter_type` | Honest Volunteer or Sybil Bot |
| `latitude` / `longitude` | WGS84 coordinates of the report |
| `timestamp_utc` | ISO 8601 submission timestamp (synthetic) |
| `severity_level` | Reporter-declared severity (NONE/MEDIUM/HIGH/CRITICAL) |
| `reported_flood_depth_cm` | Self-reported flood depth in centimetres |
| `description` | Free-text report content |
| `reputation_score_Ri` | Reputation weight assigned by the framework |
| `plausibility_tau_i` | Plausibility score after geospatial filtering |
| `is_sybil_bot` | Boolean flag for ground-truth bot status |
| `dbscan_label` | DBSCAN cluster label (CORE or NOISE) |

---

### 4. `dst_sybil_defense_results.csv`
**Description:** Dempster-Shafer Theory (DST) belief computation results under selected scenarios from the Monte Carlo stress-test (Section 4.5). The completed campaign covers **71 unique configurations × 1,000 matched geometry trials**, with six detection methods and three feedback regimes (frozen, linear decay, exponential decay). Full results at `data/dependence_revision/dependence_campaign_manifest.json`.

| Column | Description |
|--------|-------------|
| `scenario` | Scenario description |
| `num_honest_reporters` | Count of honest VGI reporters |
| `num_sybil_bots` | Count of coordinated bot accounts |
| `belief_disaster_mD` | DST belief mass for "Disaster Active" |
| `belief_no_disaster_m_negD` | DST belief mass for "No Disaster" |
| `uncertainty_mTheta` | DST uncertainty mass |
| `conflict_coefficient_K` | Dempster conflict coefficient |
| `validation_decision` | Final framework decision |

**Note:** This CSV contains a representative subset. Table 11 in the manuscript reports full Monte Carlo statistics. Under frozen-reputation (self-consensus) mode, missed-alert rates reach 98.1–100% at 50 attackers — this failure mode is explicitly reported as a limitation.

---

### 5. `training_log.json`
**Description:** Machine-readable audit trail of the 5-seed TA-LSTM training benchmark on Kaggle T4 GPU, recording exact loss/MAE/RMSE progression, hyperparameter settings, seeds (42, 123, 456, 789, 2024), and platform metadata.

---

### 6. `all_seed_results.csv` & `training_statistics_5seeds.csv`
**Description:** Full tabular results across all 15 training runs (3 geographic zones × 5 initialisation seeds) reporting Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and peak hazard season MAE.

---

### 7. `dependence_revision/`
**Description:** Full Sybil simulation campaign output. Contains:
- `dependence_campaign_manifest.json` — 71 configurations × 1,000 trials × 10 rounds × 6 methods, 3 feedback modes
- Per-configuration CSV result files

---

### 8. Client-Side Neural Model Artifacts (`public/models/`)
**Description:** Pre-trained TA-LSTM models in TensorFlow.js layers format, deployed for offline client-side edge browser execution. Models trained on ERA5-Land runoff series for three Vietnamese regions:
- `public/models/Bao_Ha/` — Bảo Hà (Red River tributary, northern Vietnam)
- `public/models/Gianh/` — Sông Gianh (central Vietnam)
- `public/models/Can_Tho/` — Cần Thơ (Mekong Delta, southern Vietnam)
- `public/models/disaster-predict/` — Default operational model

---

## Code Availability

The CuuNet repository contains the research training pipeline (`notebooks/revision_experiments.py`), trained model artifacts (90 saved fits, 5 seeds × 3 zones × 6 models), full simulation outputs, and the offline-first browser prototype.

Repository: https://github.com/nphu211206/CuuNet

The app prototype demonstrates:
- Client-side TA-LSTM forecasting via TensorFlow.js (Headless Chrome 157, desktop)
- DBSCAN spatial clustering of VGI reports
- Dempster-Shafer evidential fusion with dynamic reputation scoring
- Offline store-and-forward draft queue (IndexedDB)

---

## Data Sources & License

- **ERA5-Land reanalysis:** Copernicus Climate Change Service / ECMWF, accessed via Google Earth Engine (`ECMWF/ERA5_LAND/DAILY_AGGR`). [Muñoz-Sabater et al. 2021, DOI:10.5194/essd-13-4349-2021]. ERA5-Land has an operational latency of approximately 3 months; it cannot be used for live nowcasting.
- **USGS discharge data:** U.S. Geological Survey National Water Information System, Iowa gauges 05464500 and 05470500, used as supplementary out-of-region benchmark only.
- **VGI simulation data:** Synthetically generated to demonstrate the DBSCAN–DST verification pipeline. Timestamps are synthetic and do not correspond to actual events.
- **HydroBASINS:** Lehner & Grill 2013, [DOI:10.1002/hyp.9740](https://doi.org/10.1002/hyp.9740).
- **License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — Free to use with attribution.

---

## Citation

If you use this dataset, please cite the associated paper (citation details to be added upon acceptance).

## Contact

Nguyen Phu Toan — nphu211206@gmail.com  
ORCID: 0009-0005-0529-2131

---

## Simulation Scripts

Located in `src/simulation/` and `notebooks/`:

| Script | Description |
|--------|-------------|
| `notebooks/revision_experiments.py` | Full walk-forward STL baseline + TA-LSTM + Censored TA-LSTM + expected-MSE ensemble pipeline on ERA5-Land and USGS data |
| `src/simulation/sybil_rigorous_sim.py` | Monte Carlo Sybil attack simulation (71 configs × 1,000 trials). Implements DST-based reputation scoring |
| `src/simulation/adversarial_r2_tests.py` | Adversarial robustness tests — manipulation resistance of the reputation system |
| `src/simulation/audit_reviewer2_r2.py` | Audit script verifying reviewer response claims against simulation results |
| `src/simulation/model_config.yaml` | TA-LSTM hyperparameter configuration used for all experiments |
| `notebooks/run_master_browser_benchmarks.mjs` | Node.js Puppeteer script that generated the 600-pass desktop latency measurements |
