# CuuNet — Research Data Repository

This directory contains all datasets used in the paper:

> **"A Spatio-Temporal Edge AI Framework with Sybil Defence for Crowdsourced Disaster Forecasting: A Case Study in Vietnam"**  
> *Submitted to Spatial Information Research (Springer)*

---

## Dataset Files

### 1. `prediction_accuracy.csv`
**Description:** Forecasting accuracy (MAE and RMSE) for the ST-AtLSTM model and baseline models across three Vietnamese disaster case studies.

| Column | Description |
|--------|-------------|
| `case_study` | Case study index (1=Quảng Bình, 2=Lào Cai, 3=Cần Thơ) |
| `region` | Vietnamese province name |
| `disaster_type` | Type of disaster (Flood, Landslide, Drought) |
| `model` | Forecasting model name |
| `MAE` | Mean Absolute Error |
| `RMSE` | Root Mean Squared Error |

**Source:** Derived from historical disaster records provided by the Vietnam Meteorological and Hydrological Administration (VNMHA) and the General Statistics Office of Vietnam (GSO), 2000–2024.

---

### 2. `edge_latency_benchmarks.csv`
**Description:** Client-side inference latency of the quantised ST-AtLSTM model (TensorFlow.js) across various device tiers and browser backends.

| Column | Description |
|--------|-------------|
| `device_tier` | Device category |
| `device_spec` | Hardware specification |
| `browser` | Browser and version tested |
| `backend` | TensorFlow.js execution backend (WebGL / WASM / CPU) |
| `avg_inference_latency_ms` | Average inference time in milliseconds |
| `memory_consumption_mb` | Peak RAM usage in megabytes |

---

### 3. `hoan_kiem_vgi_simulation.csv`
**Description:** Simulated Volunteered Geographic Information (VGI) flood reports used in the consensus verification experiment (Section 4.3), representing a pluvial flooding scenario in Hoan Kiem District, Hanoi during Super Typhoon Yagi (September 2025).

| Column | Description |
|--------|-------------|
| `report_id` | Unique report identifier |
| `reporter_type` | Honest Volunteer or Sybil Bot |
| `latitude` / `longitude` | WGS84 coordinates of the report |
| `timestamp_utc` | ISO 8601 submission timestamp |
| `severity_level` | Reporter-declared severity (NONE/MEDIUM/HIGH/CRITICAL) |
| `reported_flood_depth_cm` | Self-reported flood depth in centimetres |
| `description` | Free-text report content |
| `reputation_score_Ri` | Reputation weight assigned by the framework |
| `plausibility_tau_i` | Plausibility score after geospatial filtering |
| `is_sybil_bot` | Boolean flag for ground-truth bot status |
| `dbscan_label` | DBSCAN cluster label (CORE or NOISE) |

---

### 4. `dst_sybil_defense_results.csv`
**Description:** Dempster-Shafer Theory (DST) belief computation results under two scenarios — honest sources only, and a coordinated Sybil attack.

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

---

## Data Sources & License

- **Historical climate data:** Vietnam Meteorological and Hydrological Administration (VNMHA), General Statistics Office of Vietnam (GSO). Available upon request from the respective agencies.
- **VGI simulation data:** Synthetically generated to represent a realistic Super Typhoon Yagi scenario in Hoan Kiem District, Hanoi (September 2025). Coordinates are within WGS84 bounds of the district.
- **License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — Free to use with attribution.

## Citation

If you use this dataset, please cite the associated paper (citation details to be added upon acceptance).

## Contact

Nguyen Phu Toan — nphu211206@gmail.com
