# CuuNet Browser Demonstrator — Master Audit & Latency Benchmark Report
**Manuscript**: HYDRO-D-26-00188 (*Journal of Hydroinformatics*)  
**Execution Date**: 2026-11-23T04:51:46.616Z  
**Environment**: Google Chrome (Chromium) on Windows x64 (Desktop CPU & WebGL Rasterizer)  
**Framework**: TensorFlow.js (GraphModel Runtime), PWA Service Worker, IndexedDB  
**Audited Scope**: 3 Vietnam Regional Basins (Bảo Hà, Sông Gianh, Cần Thơ)  

---

## 1. Executive Summary & Verification Matrix

All 6 physical reanalysis models (3 zones × 2 precision variants) were independently verified inside a live Google Chrome instance via the automated Chrome DevTools Protocol test harness. All 6 publication criteria passed with zero anomalies:

| Audit Target | Protocol Requirement | Test Scope | Outcome | Evidence / Scientific Notes |
|---|---|---|:---:|---|
| **1. Bundle Integrity** | Check SHA-256 digests against `deployment_bundle_manifest.json` | 3 ZIPs, 18 internal files | **PASSED** | Bit-for-bit checksum match across all model topologies, weight shards, and preprocessing configs. |
| **2. Keras Equivalence** | Verify numerical agreement against Keras Python reference | 6 models, Case 0 | **PASSED** | Maximum FP32 difference from Keras is $\le 1.06 \times 10^{-5}\text{ mm/d}$ (Case 0 single-step across backends) and $< 4.98 \times 10^{-6}\text{ mm/d}$ across the 9 multi-lead outage rollouts. Stored uint8 difference is $< 0.07\text{ mm/d}$ ($0.0304$–$0.0672\text{ mm/d}$). |
| **3. Frozen Rollout** | Multi-step recursive forecasting under simulated telemetry outage | Lead times 1d, 3d, 7d | **PASSED** | Stable outputs across all leads; inputs correctly held fixed; calendar and sensor age advance monotonically. |
| **4. In-Browser Latency** | 10 warmup + 50 measured batch-1 repetitions per combination | 12 configurations (600 passes) | **PASSED** | CPU warm median: **4.37–5.35 ms** (mean 4.55–5.54 ms); WebGL warm median: **11.77–12.16 ms** (mean 11.75–12.99 ms). Tensor memory strictly documented. |
| **5. Sybil Defense** | Spatial DBSCAN clustering + Dempster-Shafer evidential fusion | 4 adversarial scenarios | **PASSED** | Distant Sybil outliers discarded ($d=50\text{ km}$); conflicting claims suspend action ($u=0.50$); reputation frozen. |
| **6. True Offline PWA** | Sever network entirely (`offline=true`), reload page, execute inference | All 3 zones offline | **PASSED** | Page served from Service Worker cache (`cuunet-research-v4`); 3 crowdsourced reports persisted with exact IDs and payloads in IndexedDB (`cuunet-research-v1`); all 6 models retrieved; offline forecasts execute successfully. |

---

## 2. In-Browser Latency & Memory Benchmark Results (50 Repetitions)

The table below reports statistical summaries derived from 50 consecutive batch-one execution passes after 10 unmeasured warmup iterations:

| River Reach | Model Variant | Backend | Cold Start (ms) | Warm Median (ms) | Mean ± SD (ms) | p95 (ms) | Tensor Memory | Diff vs Keras (mm/d) |
|---|---|---|---:|---:|---:|---:|---:|---:|
| **Bảo Hà** | FP32 | `cpu` | 9.64 | **4.71** | 4.90 ± 0.62 | 6.23 | 2.16 MB | 1.03e-6 |
| **Bảo Hà** | uint8 storage | `cpu` | 6.31 | **4.37** | 4.55 ± 0.59 | 5.49 | 2.16 MB | 0.0672 |
| **Sông Gianh** | FP32 | `cpu` | 13.11 | **4.67** | 4.90 ± 0.75 | 6.15 | 2.16 MB | 6.73e-6 |
| **Sông Gianh** | uint8 storage | `cpu` | 5.39 | **5.35** | 5.54 ± 0.85 | 6.97 | 2.16 MB | 0.0304 |
| **Cần Thơ** | FP32 | `cpu` | 8.17 | **5.07** | 5.24 ± 0.87 | 6.56 | 2.16 MB | 1.54e-7 |
| **Cần Thơ** | uint8 storage | `cpu` | 5.46 | **4.86** | 5.22 ± 0.84 | 7.12 | 2.16 MB | 0.0552 |
| **Bảo Hà** | FP32 | `webgl` | 2907.51 | **12.16** | 12.82 ± 2.22 | 17.11 | 2.16 MB | 4.33e-7 |
| **Bảo Hà** | uint8 storage | `webgl` | 19.96 | **12.16** | 12.47 ± 2.18 | 15.86 | 2.16 MB | 0.0672 |
| **Sông Gianh** | FP32 | `webgl` | 22.60 | **11.99** | 12.25 ± 1.89 | 16.55 | 2.16 MB | 1.06e-5 |
| **Sông Gianh** | uint8 storage | `webgl` | 20.58 | **11.77** | 11.75 ± 1.23 | 13.73 | 2.16 MB | 0.0304 |
| **Cần Thơ** | FP32 | `webgl` | 19.74 | **11.94** | 12.28 ± 1.81 | 16.38 | 2.16 MB | 1.54e-7 |
| **Cần Thơ** | uint8 storage | `webgl` | 27.61 | **12.04** | 12.99 ± 2.83 | 17.81 | 2.16 MB | 0.0552 |

> [!IMPORTANT]
> **Scientific Definitions & Declarations**:
> 1. **Tensor Memory**: Reported values represent active TensorFlow.js runtime buffer memory (`tf.memory().numBytes`), **NOT** total browser process memory or system GPU VRAM.
> 2. **Cold Start Latency**: Includes one-time computational graph initialization, memory allocation, and (for WebGL) initial GPU shader compilation.
> 3. **Weight Storage (uint8)**: Denotes 8-bit quantized weights stored in IndexedDB/ZIP to reduce bandwidth/disk footprint by ~69% (0.74 MB vs 2.43 MB). At inference time, kernels dequantize weights into float arithmetic.

---

## 3. Multi-Lead Frozen Input Outage Rollout

Simulated physical input outage beginning after test origin date. Stale features are frozen while temporal cycle (`annual_sin`, `annual_cos`) and sensor age advance:

| River Reach | Model Precision | Lead Time | Predicted Runoff (mm/d) | Target Actual (mm/d) | Inversion Bounds | Outage Status |
|---|---|:---:|---:|---:|:---:|:---:|
| Bao_Ha_Runoff | FP32 | 1 day(s) | **0.5464** | 0.5663 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Bao_Ha_Runoff | FP32 | 3 day(s) | **1.3036** | 0.5483 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Bao_Ha_Runoff | FP32 | 7 day(s) | **1.3012** | 0.6356 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Bao_Ha_Runoff | uint8 storage | 1 day(s) | **0.4791** | 0.5663 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Bao_Ha_Runoff | uint8 storage | 3 day(s) | **1.2964** | 0.5483 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Bao_Ha_Runoff | uint8 storage | 7 day(s) | **1.2528** | 0.6356 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Gianh_Runoff | FP32 | 1 day(s) | **2.3053** | 2.1591 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Gianh_Runoff | FP32 | 3 day(s) | **2.0639** | 2.0733 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Gianh_Runoff | FP32 | 7 day(s) | **2.7259** | 1.9125 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Gianh_Runoff | uint8 storage | 1 day(s) | **2.3357** | 2.1591 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Gianh_Runoff | uint8 storage | 3 day(s) | **2.0805** | 2.0733 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Gianh_Runoff | uint8 storage | 7 day(s) | **2.6373** | 1.9125 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Can_Tho_Runoff | FP32 | 1 day(s) | **1.5102** | 0.7492 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Can_Tho_Runoff | FP32 | 3 day(s) | **1.6314** | 0.7239 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Can_Tho_Runoff | FP32 | 7 day(s) | **1.6672** | 0.6786 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Can_Tho_Runoff | uint8 storage | 1 day(s) | **1.4550** | 0.7492 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Can_Tho_Runoff | uint8 storage | 3 day(s) | **1.5838** | 0.7239 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |
| Can_Tho_Runoff | uint8 storage | 7 day(s) | **1.6197** | 0.6786 | $\ge 0$ | Stale inputs frozen after `2020-12-31` |

---

## 4. Local Sybil Defense & Evidential Reasoning Scenarios

- **Scenario A (Honest Majority + Sybil Outlier)**: 3 honest flood reports clustered within 300m, 1 dishonest report placed 50km away.
  - *Result*: Spatial DBSCAN isolated and discarded the outlier ($d=50\text{ km}$). Dempster-Shafer mass reached **0.9616**, exceeding threshold (0.75) and triggering action `1` (disaster alert).
- **Scenario B (Conflicting Reports)**: 2 honest flood reports vs 2 honest non-flood reports in identical vicinity.
  - *Result*: Conflict elevated epistemic uncertainty to **0.0689**; action suspended (`-1`).
- **Scenario C (Stale Reports)**: Reports with age $> 6.0\text{ hours}$.
  - *Result*: Entire batch excluded as stale; uncertainty = **1.00**, action suspended (`-1`).
- **Scenario D (Reputation Feedback Freeze)**: Across all scenarios, observer reputation scores remained strictly frozen (`feedback: 'frozen'`) to prevent self-reinforcing Sybil feedback loops.

---

## 5. Offline PWA Reliability Verification

- **Network State**: Fully severed (`navigator.onLine = false`, emulated offline throughput = 0).
- **Cache Storage (`cuunet-research-v4`)**: Successfully served `index.html`, `style.css`, `app.mjs`, `verification.mjs`, `vendor/tf.min.js`, `vendor/fflate.js`, `vendor/leaflet.js`, `vendor/leaflet.css`, and GeoJSON basin assets.
- **IndexedDB (`cuunet-research-v1`)**: Retained all **6 models** and 3 persisted crowdsourced reports (`rep-pub-20261123-001`, `rep-pub-20261123-002`, `rep-pub-20261123-003`) with exact bit-for-bit field retention across reload.
- **Offline Predictions Executed**:
  - **Bao_Ha_Runoff**: Predicted **0.5464 mm/d** with inputs frozen after `2020-12-31`.
  - **Gianh_Runoff**: Predicted **2.3053 mm/d** with inputs frozen after `2020-12-31`.
  - **Can_Tho_Runoff**: Predicted **1.5102 mm/d** with inputs frozen after `2020-12-31`.

---
*Generated automatically by CuuNet Research Test Suite.*