# CuuNet — Research Data Repository

This directory contains simulation datasets and reference benchmarks used in the paper:

> **"An Offline-First Edge AI Framework for Composite Disaster Risk-Index Forecasting and Crowdsourced Alert Verification: A Case Study in Vietnam"**  
> *Submitted to Journal of Hydroinformatics (IWA Publishing)* — Manuscript Reference: HYDRO-D-26-00188

---

## Dataset Files

### 1. `prediction_accuracy.csv`
**Description:** Forecasting accuracy (MAE and RMSE) for the Temporal Attention LSTM (TA-LSTM) model and baseline statistical models (Moving Average, Linear Regression, Seasonal Decomposition) across three Vietnamese disaster case studies.

| Column | Description |
|--------|-------------|
| `case_study` | Case study index (1=Quảng Bình, 2=Lào Cai, 3=Cần Thơ) |
| `region` | Vietnamese province name |
| `disaster_type` | Type of disaster (Flood/Landslide, Drought/Salinity) |
| `model` | Forecasting model name |
| `MAE` | Mean Absolute Error (on composite risk index, 0–1 scale) |
| `RMSE` | Root Mean Squared Error |

**Source:** Derived from historical disaster records provided by the Vietnam Disaster Management Authority (VDMA) and the General Statistics Office of Vietnam (GSO), 2000–2024.

---

### 2. `edge_latency_benchmarks.csv`
**Description:** Client-side inference latency of the quantised TA-LSTM model (TensorFlow.js) across various device tiers and browser backends.

| Column | Description |
|--------|-------------|
| `device_tier` | Device category |
| `device_spec` | Hardware specification |
| `browser` | Browser and version tested |
| `backend` | TensorFlow.js execution backend (WebGL / WASM / CPU) |
| `precision` | Computation precision (FP32 or INT8) |
| `avg_inference_latency_ms` | Average inference time in milliseconds |
| `memory_consumption_mb` | Peak RAM usage in megabytes |

**Note on latency values:** The 142.1 ms benchmark corresponds to FP32 CPU-fallback execution on a Redmi 9 (MediaTek Helio G80), where WebGL driver instability forced CPU fallback. The 65.4 ms benchmark corresponds to INT8/WASM execution on an iPhone 13 Pro. These two values should not be directly compared as they reflect different precision modes and hardware classes.

---

### 3. `hoan_kiem_vgi_simulation.csv`
**Description:** Simulated Volunteered Geographic Information (VGI) flood reports used in the crowdsourced verification experiment (Section 4.3), representing a hypothetical pluvial flooding scenario in Hoan Kiem District, Hanoi.

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
**Description:** Dempster-Shafer Theory (DST) belief computation results under selected scenarios from the Monte Carlo stress-test (Table 11). Full results across 2,000 trials are reported in the manuscript.

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

**Note:** This CSV contains a representative subset of scenarios. Table 11 in the manuscript reports full Monte Carlo statistics across all 21 adversarial scenarios × 2,000 trials.

---


---

### 5. `training_log.json`
**Description:** Machine-readable audit trail of the 5-seed TA-LSTM training benchmark on Kaggle T4 GPU, recording exact loss/MAE/RMSE progression, hyperparameter settings, seeds (42, 123, 456, 789, 2024), and platform metadata.

---

### 6. `all_seed_results.csv` & `training_statistics_5seeds.csv`
**Description:** Full tabular results across all 15 training runs (3 geographic zones × 5 initialisation seeds) reporting Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Peak Hazard Season MAE (October for Quảng Bình, September for Lào Cai, March for Cần Thơ).

---

### 7. Monthly Composite Risk Index Datasets (`*_monthly_risk_index.csv`)
**Description:** Historical monthly composite risk indices $S_{raw}(t)$ (2000–2023, 288 months each) calculated according to the INFORM methodology formula in manuscript Section 3.2:
- `Quang_Binh_monthly_risk_index.csv` (Flood hazard)
- `Lao_Cai_monthly_risk_index.csv` (Landslide hazard)
- `Can_Tho_monthly_risk_index.csv` (Agricultural drought / saline water intrusion)

---

### 8. Client-Side Neural Model Artifacts (`public/models/`)
**Description:** Pre-trained, 8-bit integer post-training quantised (INT8) Temporal Attention LSTM (TA-LSTM) models in TensorFlow.js layers format (`model.json` + `group1-shard1of1.bin`), ready for offline client-side edge browser execution:
- `public/models/Quang_Binh/`
- `public/models/Lao_Cai/`
- `public/models/Can_Tho/`
- `public/models/disaster-predict/` (default operational model)

## Code Availability

The CuuNet repository contains a **demonstration prototype** of the offline-first browser-based framework. The research training pipeline, trained model artifacts, and full simulation outputs are available upon reasonable request from the corresponding author (nphu211206@gmail.com).

The app prototype demonstrates:
- Client-side statistical ensemble forecasting (MA + LR + Seasonal Decomposition)
- DBSCAN spatial clustering of VGI reports
- DST evidential fusion with dynamic reputation scoring
- Offline store-and-forward draft queue (localStorage with planned IndexedDB migration)

---

## Data Sources & License

- **Historical climate/disaster data:** Vietnam Disaster Management Authority (VDMA), General Statistics Office of Vietnam (GSO). Available upon request from the respective agencies.
- **VGI simulation data:** Synthetically generated to demonstrate the DBSCAN–DST verification pipeline. Coordinates are within WGS84 bounds of Hoan Kiem District, Hanoi. Timestamps are synthetic and do not correspond to actual events.
- **License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — Free to use with attribution.

## Citation

If you use this dataset, please cite the associated paper (citation details to be added upon acceptance).

## Contact

Nguyen Phu Toan — nphu211206@gmail.com


## Simulation Scripts

Located in `src/simulation/`:

| Script | Description |
|--------|-------------|
| `sybil_rigorous_sim.py` | Monte Carlo Sybil attack simulation (2,000 trials). Implements DST-based reputation scoring (Tables 7–11 of manuscript). |
| `adversarial_r2_tests.py` | Adversarial robustness tests — tests manipulation resistance of the reputation system. |
| `audit_reviewer2_r2.py` | Audit script verifying reviewer response claims against simulation results. |
| `model_config.yaml` | TA-LSTM hyperparameter configuration used for all experiments in manuscript Tables 2–6. |
