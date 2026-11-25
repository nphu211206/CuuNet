# CuuNet Browser Demonstrator Verification & Benchmark Report
**Date**: 2026-11-23T11:15:00.128Z  
**Environment**: Google Chrome (Chromium) on Windows x64  
**Runtime**: TensorFlow.js (GraphModel)  
**Target Bundle**: `CuuNet_browser_Bao_Ha_Runoff.zip` (Bao Ha River reach)  

## 1. Summary of Executed Verification Checks

| Check | Requirement | Result | Evidence / Notes |
|---|---|:---:|---|
| **1. Real Model Import** | Unpack ZIP, verify SHA-256 hashes against manifest, register in IndexedDB | **PASSED** | FP32 (2.43 MB) & uint8-storage (0.74 MB) loaded into IndexedDB. SHA-256 verified. |
| **2. Numerical Inversion & Bounds** | De-standardize target using `target_scaler`, clip to physical bounds `[0, inf)` | **PASSED** | Predictions finite and physically valid across all tested horizons. |
| **3. Frozen Outage Rollout** | Recursive multi-day forecast with stale physical inputs and updated calendar/age | **PASSED** | 1d, 3d, 7d rollout evaluated successfully. FP32 vs uint8 MAE diff < 0.05 mm/d. |
| **4. Repetition Latency & Memory** | 20 measured inference passes; collect cold start, warm median, p95, tensor bytes, JS heap | **PASSED** | Benchmarked on CPU and WebGL backends. Exact definitions adhered to. |
| **5. Crowdsource Sybil Defense** | DBSCAN clustering + Dempster-Shafer evidential fusion on local reports | **PASSED** | Honest cluster accepted (m=0.9704 > 0.75), remote outlier discarded, reputation frozen. |
| **6. Offline PWA Reload** | Service Worker cache-first + IndexedDB offline persistence with network disconnected | **PASSED** | Page loaded offline, cached models retained in IndexedDB, offline forecast executed. |

## 2. In-Browser Latency Benchmarks (20 Repetitions)

| Model Variant | Backend | First Inference (Cold) | Warm Median | Warm 95th Percentile | Allocated Tensor Bytes | Scope Definition |
|---|---|---:|---:|---:|---:|---|
| Bao_Ha_Runoff / FP32 | `cpu` | 5.59 ms | **5.32 ms** | 11.48 ms | 2.16 MB | single cached case; tensor/JS memory is not total device or GPU memory; no energy measurement |
| Bao_Ha_Runoff / uint8 storage | `cpu` | 6.47 ms | **5.16 ms** | 6.82 ms | 2.16 MB | single cached case; tensor/JS memory is not total device or GPU memory; no energy measurement |
| Bao_Ha_Runoff / FP32 | `webgl` | 3013.29 ms | **6.05 ms** | 8.32 ms | 2.16 MB | single cached case; tensor/JS memory is not total device or GPU memory; no energy measurement |
| Bao_Ha_Runoff / uint8 storage | `webgl` | 13.40 ms | **6.05 ms** | 7.63 ms | 2.16 MB | single cached case; tensor/JS memory is not total device or GPU memory; no energy measurement |

> [!NOTE]
> - **First Inference (Cold)** includes one-off graph allocation and, in WebGL, initial shader compilation / pipeline linking.
> - **Tensor Memory** represents active TensorFlow.js tensor memory allocations (`tf.memory().numBytes`), **NOT** whole browser RAM or total device GPU memory.
> - **uint8 storage** refers to 8-bit quantized weight storage on disk/IndexedDB, dequantized to float kernels at inference time.

## 3. Multi-Lead Frozen Rollout Numerical Outputs

| Model | Horizon | Predicted Runoff | Actual ERA5 Reference | Units | Outage Policy |
|---|:---:|---:|---:|:---:|:---:|
| Bao_Ha_Runoff / FP32 | 1 day(s) | **0.5464** | 0.5663 | mm day-1 | `2020-12-31` |
| Bao_Ha_Runoff / FP32 | 3 day(s) | **1.3036** | 0.5483 | mm day-1 | `2020-12-31` |
| Bao_Ha_Runoff / FP32 | 7 day(s) | **1.3012** | 0.6356 | mm day-1 | `2020-12-31` |
| Bao_Ha_Runoff / uint8 storage | 1 day(s) | **0.4791** | 0.5663 | mm day-1 | `2020-12-31` |
| Bao_Ha_Runoff / uint8 storage | 3 day(s) | **1.2964** | 0.5483 | mm day-1 | `2020-12-31` |
| Bao_Ha_Runoff / uint8 storage | 7 day(s) | **1.2528** | 0.6356 | mm day-1 | `2020-12-31` |

## 4. Offline Reload Verification

- **Network Status**: Emulated offline (`offline = true`, download/upload = 0).
- **Service Worker**: Cache status `cuunet-research-v4` active (IndexedDB: `cuunet-research-v1`); assets served from Cache Storage.
- **IndexedDB**: Retained 2 models and 4 báo cáo đã lưu trong IndexedDB.
- **Offline Forecast Execution**: Output = **0.5464 mm/d** (target date 2021-01-01).

---
*Report generated automatically by `run_browser_verification.mjs`.*
