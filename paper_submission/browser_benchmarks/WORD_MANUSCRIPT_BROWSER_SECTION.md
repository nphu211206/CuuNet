# Formulated Browser Demonstrator Table & Manuscript Text for Word Integration
**Manuscript**: HYDRO-D-26-00188 (*Journal of Hydroinformatics*)  
**Protocol Version**: v7.1-audited / Revision 1  
**Audit Date**: 2026-11-23  
**Verified Source Commit**: `27cc510a5ea511205f935b87fb677f1a45f96d3b`  
**Cache Storage**: `cuunet-research-v4` | **IndexedDB**: `cuunet-research-v1`  
**Execution Environment**: Automated Google Chrome (HeadlessChromium 157.x) on Windows 11 x64 Desktop (CPU & WebGL Rasterizer backends)

---

## 1. Candidate Manuscript Table (for Section 4.2 / Table 5)

### Table 5: In-browser execution latency, allocated runtime buffer memory, and numerical agreement against Python Keras reference across three regional Vietnamese river basins.
*Measurements derived from 50 consecutive batch-one execution repetitions following 10 unmeasured warmup runs via an automated Google Chrome instance on a Windows x64 desktop system. Latencies include complete tensor materialization (`executeAsync` and scalar extraction). Active tensor memory denotes runtime buffer allocations reported by TensorFlow.js (`tf.memory().numBytes`). Stored uint8 models utilize 8-bit integer weight storage on disk/IndexedDB, but are dequantized to 32-bit floating point representations at execution time.*

| River Basin / Reach | Stored Weight Format | Execution Backend | First Inference / Cold Start (ms) | Warm Median Latency (ms) | Warm Mean ± SD (ms) | 95th Percentile Latency (ms) | Active Tensor Buffer | Discrepancy vs Keras Python Ref. (mm/day) |
|---|---|:---:|---:|---:|---:|---:|---:|---:|
| **Bảo Hà** | FP32 | `cpu` | 9.64 | **4.71** | 4.90 ± 0.62 | 6.23 | 2.16 MB | $1.03 \times 10^{-6}$ |
| **Bảo Hà** | uint8 storage | `cpu` | 6.31 | **4.37** | 4.55 ± 0.59 | 5.49 | 2.16 MB | 0.0672 |
| **Bảo Hà** | FP32 | `webgl` | 2,907.51 | **12.16** | 12.82 ± 2.22 | 17.11 | 2.16 MB | $4.33 \times 10^{-7}$ |
| **Bảo Hà** | uint8 storage | `webgl` | 19.96 | **12.16** | 12.47 ± 2.18 | 15.86 | 2.16 MB | 0.0672 |
| **Sông Gianh** | FP32 | `cpu` | 13.11 | **4.67** | 4.90 ± 0.75 | 6.15 | 2.16 MB | $6.73 \times 10^{-6}$ |
| **Sông Gianh** | uint8 storage | `cpu` | 5.39 | **5.35** | 5.54 ± 0.85 | 6.97 | 2.16 MB | 0.0304 |
| **Sông Gianh** | FP32 | `webgl` | 22.60 | **12.00** | 12.25 ± 1.89 | 16.55 | 2.16 MB | $1.06 \times 10^{-5}$ |
| **Sông Gianh** | uint8 storage | `webgl` | 20.58 | **11.77** | 11.75 ± 1.23 | 13.73 | 2.16 MB | 0.0304 |
| **Cần Thơ** | FP32 | `cpu` | 8.17 | **5.07** | 5.24 ± 0.87 | 6.56 | 2.16 MB | $1.54 \times 10^{-7}$ |
| **Cần Thơ** | uint8 storage | `cpu` | 5.46 | **4.86** | 5.22 ± 0.84 | 7.12 | 2.16 MB | 0.0552 |
| **Cần Thơ** | FP32 | `webgl` | 19.74 | **11.94** | 12.28 ± 1.81 | 16.38 | 2.16 MB | $1.54 \times 10^{-7}$ |
| **Cần Thơ** | uint8 storage | `webgl` | 27.61 | **12.05** | 12.99 ± 2.83 | 17.81 | 2.16 MB | 0.0552 |

---

## 2. Formulated Text for Section 3.5 (Browser Deployment and Capability Boundary)

*The paragraph below directly replaces the placeholder `[PENDING EDGE: complete the five-feature and eight-feature 30-step export preflight...]` in Section 3.5:*

> To verify client-side execution feasibility under network isolation, selected TensorFlow models (the canonical censored-input Temporal Attention LSTM chosen by validation loss for each basin) were exported to TensorFlow.js graph model artifacts in both 32-bit floating point (FP32) and 8-bit quantized storage (`uint8`) variants. The client demonstrator was packaged as a Progressive Web Application (PWA) incorporating a Service Worker cache (`cuunet-research-v4`) and client-side IndexedDB storage (`cuunet-research-v1`). The Service Worker pre-caches all essential static assets (`index.html`, `style.css`, application logic `app.mjs`, validation modules `verification.mjs`, Leaflet GIS libraries, and hydrological basin vector GeoJSON files). The activation lifecycle was strictly configured to invalidate only previous research cache namespaces (`cuunet-research-*`), preserving independent third-party origin caches. In-browser storage of model bundles and crowdsourced reports was implemented via IndexedDB transactions. Multi-horizon recursive rollout under telemetry interruption was tested by fixing historical inputs after the declared forecast origin (`2020-12-31`) while advancing calendar cycles (`annual_sin`, `annual_cos`) and sensor age. End-to-end local execution was verified through an automated Chrome DevTools Protocol (CDP) test harness on a desktop Chromium environment.

---

## 3. Formulated Text for Section 4.2 (In-Browser Benchmark Results and Numerical Parity)

*The text below directly replaces the placeholder `[PENDING EDGE: insert FP32 versus uint8-storage prediction differences...]` in Section 4.2:*

> Client-side execution characteristics and numerical equivalence against the native Python Keras implementations were evaluated across all 12 experimental combinations (3 regional basins $\times$ 2 weight precision formats $\times$ 2 execution backends). Benchmarking comprised 10 unmeasured warmup runs followed by 50 measured batch-one execution passes per configuration on an automated desktop Google Chrome session (Table 5). Across all basins, the CPU backend achieved warm median execution latencies of 4.37–5.35 ms (mean 4.55–5.54 ms, 95th percentile 5.49–7.12 ms), whereas the WebGL rasterizer backend recorded warm median latencies of 11.77–12.16 ms (mean 11.75–12.99 ms, 95th percentile 13.73–17.81 ms). Initial cold start latency on CPU was 5.39–13.11 ms; on WebGL, first-inference latency ranged from 19.74 ms to 2,907.51 ms, with the elevated initial overhead reflecting one-time shader compilation, GPU pipeline construction, and context initialization in the desktop browser.
>
> In terms of memory consumption, active TensorFlow.js runtime tensor allocations remained constant at 2.16 MB ($2,260,756\text{ bytes}$) across all configurations. Total JavaScript heap allocation during execution stabilized between 26.0 MB and 35.5 MB. Numerical equivalence between browser FP32 executions and Python Keras references was confirmed: maximum absolute difference across single-step held-out cases was $\le 1.06 \times 10^{-5}\text{ mm/day}$ on WebGL and $\le 6.73 \times 10^{-6}\text{ mm/day}$ on CPU. Over the 9 multi-lead frozen outage rollout points (horizons 1, 3, and 7 days at origin 2020-12-31), the maximum absolute discrepancy between browser FP32 and Keras outage traces was $4.97 \times 10^{-6}\text{ mm/day}$. Quantization to uint8 weights compressed the on-disk/cache footprint from ~2.43 MB to ~0.74 MB (a 69.3% reduction in bundle payload), incurring an average absolute physical prediction divergence of 0.0304–0.0672 mm/day relative to FP32.
>
> Offline PWA resilience and local state persistence were verified under complete network severance (`navigator.onLine = false`, download and upload throughput set to 0 KB/s). Upon hard page reload under severed conditions, the PWA successfully reloaded entirely from Service Worker cache (`cuunet-research-v4`). All 6 model definitions in IndexedDB were retained, and client-side inference executed with zero network access (e.g. producing 0.5464 mm/day at Bảo Hà for lead 1d). Furthermore, local crowdsourced flood reports stored prior to disconnection persisted bit-for-bit in IndexedDB across the reload, verifying that local evidential reasoning and recursive hydrological forecasts remain operational on an isolated device.

---

## 4. Formulated Text for Section 5.3 (Offline Operation and Scope Caveats)

*The text below integrates strict caveats into Section 5.3, clarifying scientific boundaries and preventing over-claiming:*

> While the client-side demonstrator verifies the software feasibility of running recursive hydrological rollouts and local Dempster-Shafer report verification inside a modern browser engine, several strict empirical boundaries must be recognized. First, all benchmark latencies and memory traces reported herein were collected using automated Google Chrome (Chromium) on a desktop x64 workstation equipped with dedicated hardware rasterization. These measurements cannot be extrapolated to handheld mobile devices, smartphones, or low-cost field tablets, which possess heterogeneous SoC architectures, aggressive thermal governors, and variable WebGL implementations. Consequently, no assertions of sub-150 ms latency on mobile hardware, battery energy savings, or extended operating life in remote field deployments are made. Second, reported tensor memory (2.16 MB) reflects allocated TensorFlow.js computational buffers (`tf.memory().numBytes`), not total application RAM or system-level GPU memory. Third, weight quantization to uint8 operates solely as a storage-compression mechanism; web execution kernels dequantize weights into float32 representations. Finally, persistent local report storage inside IndexedDB demonstrates single-device survival across reloads; it does not constitute peer-to-peer distributed synchronization or multi-device consensus across disjoint flood communities.

---

## 5. Formulated Response to Reviewers (Browser & Offline Comments)

*Text for `HYDRO_D_26_00188_Response_to_Reviewers.docx` regarding edge demonstrator, mobile claims, memory definitions, and PWA verification:*

> **Reviewer Comment on Edge / Browser Demonstrator & Mobile Claims**:  
> *The authors must provide empirical evidence for client-side execution claims, clarify definitions of reported memory, remove unsupported claims of mobile phone performance or battery energy savings, and establish whether offline PWA persistence is genuinely verified.*
>
> **Author Response**:  
> We thank the reviewer for this essential critique. In this revision, we have thoroughly audited and re-benchmarked the browser demonstrator, strictly bound our claims to actual experimental data, and removed all unsupported assertions:
> 1. **Removal of Mobile & Battery Over-Claims**: We have completely excised all claims of "sub-150 ms mobile latency", "battery conservation", "native INT8 kernel acceleration", and "field deployment". We explicitly declare in Sections 3.5, 4.2, and 5.3 that all latency measurements (warm medians 4.37–5.35 ms on CPU, 11.77–12.16 ms on WebGL) were acquired via automated Headless Chrome on a Windows x64 desktop environment, and cannot be generalized to mobile phones without dedicated handheld hardware logging.
> 2. **Rigorous Measurement Definitions**: Table 5 and Section 4.2 explicitly define "Tensor Memory" as active TensorFlow.js runtime buffer allocation (`tf.memory().numBytes`, measured at 2.16 MB), distinct from JavaScript heap (26–35 MB) or system OS RAM. We also clarify that uint8 weight storage is a ~69% storage compression mechanism that dequantizes to float arithmetic during kernel execution.
> 3. **Exact Raw Data & Metric Parity**: Narrative ranges in the text now mirror the exact raw logs and summary CSVs (`browser_benchmarks_recomputed.csv`, 12 configurations $\times$ 50 warm repetitions = 600 passes). Maximum FP32 numerical difference from Python Keras is accurately reported as $\le 1.06 \times 10^{-5}$ mm/day for Case 0 single-step inference and $< 4.98 \times 10^{-6}$ mm/day across 9 multi-lead outage rollout reference comparisons.
> 4. **Verified True Offline PWA & Report Persistence**: We updated the Service Worker (`public/research/sw.js`) to scope cache deletion exclusively to `cuunet-research-*` namespaces. We implemented and executed an automated CDP offline audit harness (`notebooks/verify_offline_persistence.mjs`): 3 crowdsourced reports and model bundles were stored in IndexedDB (`cuunet-research-v1`), the network connection was severed completely (`offline = true`, 0 throughput), and the page was hard reloaded. The audit confirmed 100% pass (11/11 assertions): the page was served from cache `cuunet-research-v4`, Service Worker was active, report count and all 3 report payloads survived intact bit-for-bit, and offline forecast inference executed successfully with zero network connectivity. Full JSON and markdown audit artifacts have been deposited in `paper_submission/browser_benchmarks/`.
