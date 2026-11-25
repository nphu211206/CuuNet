## Abstract

Communication outages can leave cached hydrological models executable while their physical inputs become stale. This study evaluates browser deployment for forecasting under input interruptions and local crowdsourced evidence aggregation. Daily ERA5-Land runoff depth for three Vietnam regions (mm/day) and observed WaterBench-Iowa discharge for three USGS gauges (m³/s) are evaluated separately using 90 neural fits and seven statistical comparators. Persistence has the lowest one-day MAE at two Vietnam regions and all Iowa gauges; a seven-day moving average leads at Cần Thơ. Censored-input training reduces seven-day interruption MAE by 26.4–61.1% relative to ordinary temporal-attention LSTM in Vietnam, but increases it at two Iowa gauges. In 71 synthetic configurations with 1,000 matched trials each, grouped evidence under frozen reputation yields 1.2% false alerts and 14.9% missed alerts in a prespecified mimic setting; self-consensus feedback raises both to 100%. Six hundred saved desktop Chrome measurements and an offline reload audit support local execution and persistence. ERA5-Land represents modelled runoff generation and Iowa lies outside Vietnam. Typhoon Yagi only motivates simulated outages; these results establish neither observed Vietnam flood validation nor mobile, energy or field performance.

Keywords: hydrological forecasting; input interruption; temporal attention LSTM; browser computing; evidence dependence; Sybil attack

## Highlights

Physical runoff and discharge targets support separate hydrological evaluations.

Persistence remains a strong one-day forecasting baseline.

Censored-input training helps Vietnam interruption forecasts and has mixed Iowa effects.

Matched simulations reveal cold-start and self-consensus feedback failures.

Desktop logs verify local browser execution and offline persistence within a tested scope.

## 1 Introduction

Hydrological forecasts depend on the availability of inputs, computation and delivery. A cached model can execute after network failure, but its observations may become progressively stale. This distinction matters for a browser application intended to support local decisions during a storm. Typhoon Yagi in 2024 motivates the simulated interruption scenarios examined here. The study does not reconstruct an instrumented deployment during that event and uses no event-specific crowdsourced observations, damage inventory or emergency operational outcomes.

Data-driven hydrological forecasting is established, including LSTM rainfall–runoff modelling (Kratzert et al. 2018) and the applications reviewed by Sit et al. (2020). Browser deep learning also has precedents: Ma et al. (2019) examine its practical limits, TensorFlow.js supplies a deployment runtime (Smilkov et al. 2019), and HydroLang provides a web programming framework for hydrological sciences (Erazo Ramirez et al. 2022). Hydrology@Home supports distributed volunteer computation (Agliamzanov et al. 2019). Recent work by Issa et al. (2026) studies water-level and discharge measurement from imagery at the edge, a different task from forecasting with stale inputs. These studies provide the context for assessing a browser integration and its empirical limitations.

Crowdsourced flood information introduces a separate problem: many accounts may provide dependent evidence or be controlled by one attacker. Kwon and Kang (2016) analyse flood signals in Twitter and provide related reporting context. Sybil attacks exploit multiple identities under common control (Douceur 2002). Reputation systems such as EigenTrust use a network of trust relationships (Kamvar et al. 2003), whereas a local batch of reports does not provide an authenticated historical graph. Dempster–Shafer combination is established (Dempster 1967; Shafer 1976), and dependence among evidence sources requires explicit treatment (Denoeux 2008).

The forecasting assessment uses physical hydrological targets rather than a constructed disaster-risk index. Vietnam runoff reanalysis evaluates reproduction of a modelled physical quantity, while Iowa discharge provides a supplementary comparison against measured river flow. Their errors are reported in their own units and are not pooled into an assessment of observed Vietnam floods. Vulnerability research in Vietnam (Adger 1999) remains relevant social context but does not justify arbitrary numerical weights in a hydrological target.

The aim is to evaluate a reproducible browser deployment path for forecasting during input interruptions and to identify the limits of local crowdsourced evidence aggregation. RQ1 asks whether a bias-aware statistical combination or temporal attention improves physical-target accuracy relative to strong constituent and persistence baselines. RQ2 asks how forecast errors change when recent physical inputs become unavailable and where censored-input training helps. RQ3 asks when geographic and temporal pooling reduces coordinated-report errors and when cold starts or reputation feedback defeat it. Browser execution time, memory and numerical equivalence are separate feasibility checks supporting this assessment.

The contribution is a systems integration and evaluation protocol that distinguishes input age from runtime availability, retains missing observed references, estimates ensemble weights on chronological validation data and reports abstention alongside decision errors. Conventional attention, forecast combination and DBSCAN are used as established components. Maximum-support pooling is an engineering approximation to dependence control. Its benefits are conditional empirical findings rather than new architecture, forecast-combination theory or a general security guarantee.

## 2 Data and geographic scope

### 2.1 Vietnam runoff reanalysis

The primary dataset uses the Earth Engine collection ECMWF/ERA5_LAND/DAILY_AGGR for 1 January 2000 through 31 December 2024 (Google Earth Engine and Copernicus Climate Change Service 2026). ERA5-Land is a land-surface reanalysis (Muñoz-Sabater et al. 2021). The accumulated runoff_sum band in metres is converted to daily runoff depth in mm/day. It represents local surface and subsurface runoff generation, rather than routed river discharge, measured stage, inundation extent, landslide initiation or observed damage.

Three fixed anchors identify HydroBASINS level 7 polygons: Bảo Hà at 22.26° N, 104.47° E; Sông Gianh at 17.70° N, 106.43° E; and Cần Thơ at 10.03° N, 105.78° E. The enclosing polygon is selected in stable HYBAS_ID order (Lehner and Grill 2013). The initial level 5 acquisition was excluded because the central coastal support extended too far beyond the study region. This decision used geographic boundaries before forecast evaluation. Table 1 and Figure 1 record the final identifiers and spatial supports; the polygons are regional averaging units and are not asserted to be complete upstream gauge catchments.

TABLE|1

FIG|1

Historical precipitation accumulation, two-metre temperature and first-layer soil water accompany lagged runoff. Regional means are weighted by the area of valid land pixels in the provider’s native projection. Daily accumulated quantities are used directly, without deriving daily totals from monthly means. The final export contains 9,132 complete and unique daily rows per region, or 27,396 rows overall. No negative runoff or precipitation values required correction in the final dataset. Export receipts, prepared CSVs and the basin GeoJSON identify the source, transformations and file hashes.

### 2.2 Supplementary observed discharge

WaterBench-Iowa combines hydrometeorological data with USGS discharge records (Demir et al. 2022). Its source archive is pinned and checked against a Git object and SHA256 receipt. Discharge in cubic feet per second is multiplied by 0.028316846592 to obtain m³/s. A daily reference requires at least 22 valid hourly observations out of 24; days failing this rule remain missing in the target. Historical inputs may be carried forward causally with an availability indicator and an age channel, but reference outcomes are never interpolated or filled.

Three gauges were selected using at least 95% training-period daily availability and proximity to the 25th, 50th and 75th percentiles of static catchment area among eligible stations. Held-out discharge values, missingness and forecast errors did not determine selection. The archive contains 125 hourly series; Table 2 records the selected gauges and Figure 2 shows their observed daily hydrographs. These Iowa observations serve as a supplementary method benchmark outside Vietnam. They do not validate Vietnam reanalysis or demonstrate geographic transfer or simulated Yagi event performance.

TABLE|2

FIG|2

### 2.3 Provenance and chronological partitions

Source manifests record collection or repository identifiers, transformations, units, dates, hashes and spatial support. The fixed partitions in Table 3 replace the former inconsistent 70/15/15 description. Feature scalers use training inputs only; target scaling uses finite training references only. Source files and experimental code are copied into each result package before fitting, and source-change checks identify modified runs. Earlier incomplete development runs are excluded from the publication results.

TABLE|3

Input calendars are complete and unique. Missing Iowa reference outcomes remain missing and are excluded on common dates for every method at each evaluation horizon. This distinguishes missing outcomes from intentionally unavailable model inputs. The complete reference coverage and peak-threshold records are retained with the results.

## 3 Methods

### 3.1 Forecasting tasks and comparators

The ordinary task is one-day prediction from the preceding 30 daily input rows. Iowa inputs comprise lagged discharge, availability, normalised input age and two annual sine/cosine calendar channels. Vietnam adds precipitation, temperature and soil water, giving five and eight features, respectively. Only inputs earlier than the target timestamp are supplied. Earthquake and tsunami channels from the former composite-index model are removed because these hydrological tasks do not predict those hazards.

Ten methods comprise seven statistical comparators and three recurrent variants. The statistical methods are persistence, seasonal persistence, a seven-day moving average, linear trend, seasonal decomposition, an equal-weight ensemble and an expected-MSE ensemble. Persistence uses the last available target input; seasonal persistence uses its 365-observation lag. Statistical histories are capped at 1,095 days. Linear trend is fitted to historical positions by ordinary least squares. Seasonal decomposition uses robust STL with period 365, extrapolates a linear trend fitted to the last 365 trend values and repeats the final seasonal cycle. Both ensembles combine moving average, linear trend and seasonal decomposition; persistence and seasonal persistence remain independent strong benchmarks.

The platform repository is https://github.com/nphu211206/CuuNet. The physical-target experiments use notebooks/revision_experiments.py and the source code and configurations copied into each canonical result package. These saved scientific outputs are distinct from demonstration indicators on the product interface. Every constituent, combination and recurrent variant is retained in the tables, regardless of ranking.

### 3.2 Forecast combination accounting for bias

Forecast combination follows Bates and Granger (1969). Let eₜ contain the three constituent prediction errors on common finite validation dates and b be their sample mean. Equation 1 estimates weights by minimising expected squared error under nonnegativity and a unit-sum constraint. Equation 2 retains the bias outer product as well as error covariance; minimising variance alone would not minimise MSE when forecasts are biased.

EQ|1

EQ|2

Sample covariance uses the n−1 denominator on the entire validation window: 1,096 common dates per Vietnam region and 357, 365 and 364 dates at the three Iowa gauges, respectively. Diagonal shrinkage is fixed at λ=0.10, with 0, 0.05 and 0.20 as prespecified sensitivity settings. Constrained SLSQP optimisation enforces nonnegative weights summing to one. The saved forecast_combination_estimation.json files contain the validation dates, bias vector, sample covariance, shrunk covariance, Q and fitted weights. No new closed-form solution or KKT theorem is claimed.

Weights remain fixed in held-out testing and interruption experiments. RMSE is the primary metric aligned with the squared-error objective; MAE is a complementary loss that can produce a different ranking. An ensemble’s improvement over one constituent does not establish superiority over persistence or a recurrent comparator.

### 3.3 Temporal attention LSTM and censored inputs

The model uses a conventional 64-unit LSTM (Hochreiter and Schmidhuber 1997), a 32-unit additive attention layer and dropout of 0.20. Equation 3 applies attention only over temporal hidden states. It has no spatial attention, graph or cross-region interaction and is therefore termed Temporal Attention LSTM (TA-LSTM). Additive attention is attributed to Bahdanau et al. (2014), whose preprint was presented at ICLR in 2015, rather than to scaled dot-product attention.

EQ|3

Five fixed seeds, 42, 123, 456, 789 and 2024, are used for each of three variants: TA-LSTM, an otherwise matched LSTM without attention, and TA-LSTM trained with censored recent physical inputs. Each uses Adam with learning rate 0.001 and clipnorm 1.0, batch size 64, MSE loss and at most 100 epochs. Early stopping monitors normalised validation MAE with patience 15 and restores the best weights. Within one site, the common affine target scaling preserves the ordering of physical and normalised MAE. The deployment seed is selected by physical validation MAE within the prespecified censored-input variant; test scores do not select the seed.

For censored-input training, 50% of training sequences are selected with a recorded seed. Their last one to seven physical input rows are frozen at the most recent available row, availability becomes zero and normalised age increases. Calendar channels and target labels remain unchanged. This is a training intervention on the same architecture, modelling stale recent inputs rather than a new recurrent cell or every type of sensor failure. After conversion to physical units, predictions are bounded below by zero under the same rule for all methods, without an arbitrary upper bound.

### 3.4 Input interruptions

Forecast origins are scheduled every seven days in the held-out period, with one-, three- and seven-day horizons. After each origin, no further observed physical inputs are supplied: values remain at the last known row while calendar and age channels advance. The primary rollout does not feed future observations or predicted targets back into the physical lag channels. Statistical methods use only the history available at the origin and ensemble weights remain frozen. The policy and exact origin/target dates are saved by notebooks/outage_revision_experiments.py.

Predictions are retained even when a later observed reference is unavailable. Scores use common finite reference dates for all methods within a site and horizon, with the corresponding coverage recorded. Thus cached execution and useful prediction during prolonged input interruption are assessed separately. Different horizons have different target dates and errors need not increase monotonically with horizon.

### 3.5 Browser deployment and evaluation

Selected models are exported as TensorFlow.js graph models with FP32 and uint8 weight-storage variants. Uint8 reduces storage and transfer size; browser arithmetic uses floating-point values after dequantisation. It does not demonstrate native INT8 kernels, a fixed energy reduction or faster inference. Numerical and accuracy comparisons use common saved inputs and are expressed in each target’s physical units. Complete held-out export evaluations for six selected models are distinguished from the single input repeated in each browser timing configuration.

The research demonstrator is located in public/research and was tested at http://localhost:8787/index.html. Its Service Worker uses cache cuunet-research-v4, and IndexedDB database cuunet-research-v1 stores imported models and reports. Cache cleanup is restricted to the cuunet-research- namespace. Local JSON export/import provides report exchange through a separate transport channel; the demonstrator does not provide peer-to-peer transport or shared consensus among disconnected devices. Figure 3 separates these functions.

FIG|3

Saved logs use Headless Chrome 157 on Windows x64 and TensorFlow.js 4.22.0. Twelve configurations combine three Vietnam regions, two storage variants and CPU or WebGL. Each uses ten untimed warmup passes and fifty measured batch-one passes. Warm inference time and the first inference are reported separately; neither measures complete application load, user interaction or interface drawing. The logs describe this desktop session and do not evaluate phones, WASM, battery consumption or temperature.

### 3.6 Report selection and evidence discounting

The verification simulation uses local planar positions, report ages, claims and reputations. DBSCAN has distance epsilon of 1 km and minimum samples of three (Ester et al. 1996). Reports older than six hours are ineligible. The largest eligible spatial component is selected without a trusted geographic or identity anchor. Distance dᵢ is measured from that component’s centroid, tᵢ is report age and T=6 hours. Equation 4 caps discounted effective support at 0.95.

EQ|4

The simulated terrain factor is τᵢ=1−0.35 min(|yᵢ|/0.75 km,1), bounded between 0.65 and one. It is an explicit simulation assumption rather than an SRTM-derived or field-calibrated plausibility model. Terrain removal uses matched geometry. Former undefined slope/elevation coefficients and INFORM-derived forecast weights are excluded from the physical-target task.

### 3.7 Grouped evidence and reputation feedback

Local positions are assigned to fixed 0.25 km cells and report ages to 0.5-hour bins. Equation 5 retains maximum positive and negative support separately within each geographic and temporal group. An absent claim has zero support. Exact repetition of the same claim, effective mass and group does not increase group evidence, an idempotence property of the maximum operator. Accounts occupying additional groups can still increase total support.

EQ|5

Positive simple support places mass pɡ on event D and 1−pɡ on ignorance; negative support places nɡ on no event N and 1−nɡ on ignorance. Normalised Dempster fusion in Equation 6 combines the group representation. Empty selections return ignorance and abstention; numerical total conflict remains unresolved. This policy approximates dependence control but does not implement Denoeux’s cautious combination rule, authenticate people or establish independence among groups. Fixed geographic and temporal boundaries can be exploited.

EQ|6

EQ|7

The two-sided threshold q=0.75 gives alert, rejection or unresolved decisions in Equation 7. Equation 8 uses retention α=0.90, reward scale β=0.10 and contradiction penalty η=0.30. The count u comprises other selected same-claim reporters and excludes the reporter being updated. An available judgment determines agreement or contradiction; without verified feedback, reputation remains unchanged.

EQ|8

Three regimes isolate feedback assumptions. The independently labelled simulated reference is an optimistic oracle; self-consensus uses each method’s own decisive result and can poison reputation; absent verified feedback freezes reputation. Each method evolves its own reputation trajectory while sharing geometry and initial information. The oracle is not an implemented independent sensor service. The local demonstrator uses frozen reputation.

### 3.8 Adversarial design and uncertainty

The completed campaign contains 71 unique configurations and 1,000 matched geometry trials per configuration. Primary sweeps vary 0, 5, 20, 50 and 100 attacker accounts, initial attacker reputation 0.15, 0.50 and 0.80, and mimic, dispersed, remote-cluster and stale patterns. Honest positions are Gaussian around the local origin with coordinate standard deviation 0.10 km; mimic attackers use 0.05 km. Remote attackers form a Gaussian cluster at (3,1) km with standard deviation 0.05 km, while dispersed positions are uniform over [−4,4] km on each axis. Report ages are uniform from zero to one hour, except stale attackers assigned 48 hours. Additional configurations vary one, three or five neutral-reputation honest reporters and one-at-a-time parameters. Zero-attacker duplicates are removed. This is a primary sweep plus finite sensitivity analysis, rather than a full factorial design.

Every trajectory has ten rounds, with three benign rounds followed by seven malicious rounds. Event-active and event-absent conditions are simulated separately. Six methods comprise classical Dempster fusion, grouped maximum-support fusion, weighted Bayesian Beta updating, weighted voting at 0.75 and 0.50, and majority. The Bayesian baseline uses a Beta(1,1) prior with fractional reputation-discounted positive and negative counts; its score is posterior P(θ>0.5), rather than a symmetric Beta MAP classifier equivalent to majority. Ties and empty selections remain unresolved. The source and saved traces in src/simulation/dependence_revision_campaign.py and data/dependence_revision specify the campaign.

False-alert rate is the proportion of event-absent trials issuing an alert. Missed-alert rate is the proportion of event-active trials not issuing an alert, including rejection and abstention. Abstention, decisive coverage and error conditional on a decisive result are retained separately. Per-round rates have 95% Wilson intervals. Mean and worst malicious-round values are retained so that late oracle recovery cannot conceal transient failures. Seven rounds from the same 1,000 trajectories are not treated as 7,000 independent trials. Matched geometry and seeds support numerical comparison; simulation uncertainty does not capture real-world distribution shift.

Hydrological scores include physical-unit MAE, RMSE, mean bias and high-target-subset MAE, with NSE (Nash and Sutcliffe 1970) and KGE (Gupta et al. 2009) where defined. The high-target threshold is the training target’s 90th percentile, fixed before testing; these subsets are not verified flood occurrences. Five-seed mean and sample standard deviation describe training variation. Time intervals and paired differences use 2,000 circular block-bootstrap resamples: blocks of thirty retained reference-date positions for ordinary forecasts or five retained origin positions for interruptions. Comparators use the same resampled positions. Intervals are conditional on the five fitted seeds and are not independent retraining tests or simultaneous intervals corrected for multiple comparisons.

## 4 Results

### 4.1 Ordinary forecasts and strong baselines

Six canonical result packages contain 90 neural fits. Tables 4–5 retain all ten methods, while Figures 4–5 compactly show MAE and RMSE. The saved summaries contain 120 validation/test rows, 180 interruption rows and 246 paired comparisons. The completed audit independently checked mean and seed-standard-deviation MAE/RMSE against original predictions across these forecast and interruption rows, with 1,200 matching comparisons.

TABLE|4

TABLE|5

FIG|4

FIG|5

Persistence has the lowest test MAE at Bảo Hà (1.455 mm/day) and Sông Gianh (1.807 mm/day), while the seven-day moving average leads at Cần Thơ (1.114 mm/day). The no-attention LSTM has the lowest point RMSE in the three Vietnam regions, respectively 4.036, 7.322 and 2.525 mm/day, although paired intervals do not distinguish every small difference. At all three Iowa gauges, persistence has the lowest MAE and RMSE: MAE is 0.251, 8.100 and 7.362 m³/s, with RMSE 1.471, 22.717 and 15.419 m³/s. These outcomes do not support universal recurrent-model superiority.

Removing attention does not worsen point MAE at any site in this experiment. Table 6 reports TA-LSTM minus LSTM and expected-MSE ensemble minus seasonal decomposition. The attention MAE intervals include zero at Sông Gianh and USGS 06903900; the other four are positive. The expected-MSE ensemble improves over seasonal decomposition at all six sites, but is not therefore the best method. At USGS 06903900, its MAE of 1.141 m³/s remains greater than persistence at 0.251 m³/s. Table A1 retains bias and high-target errors for every method. This gauge has only nine high-discharge test days and persistence also has lower high-subset MAE than the recurrent variants.

TABLE|6

### 4.2 Ensemble weights and shrinkage sensitivity

TABLE|7

Table 7 reports validation-fitted weights and bias in the same constituent order. Table B1 retains all twenty-four rows for four prespecified shrinkage values. These settings change weights and test errors within the evaluated range but do not select a new primary value using test performance. For example, ensemble RMSE at Bảo Hà changes from 4.754 mm/day with λ=0 to 4.765 mm/day with λ=0.20. This is descriptive sensitivity of the fitted protocol, rather than test-set optimisation.

### 4.3 Forecasts during input interruptions

TABLE|8

TABLE|9

FIG|6

FIG|7

At seven days, censored TA-LSTM minus ordinary TA-LSTM has MAE differences of −2.826, −2.920 and −0.504 mm/day at Bảo Hà, Sông Gianh and Cần Thơ, corresponding to reductions of 61.1%, 60.0% and 26.4%. All three paired MAE intervals in Table 10 lie below zero. Against validation-selected persistence, however, the Vietnam MAE intervals all include zero, while the RMSE intervals lie below zero. Improvement relative to ordinary attention therefore does not imply improvement under every loss or against every baseline.

Iowa effects are mixed. Censored TA-LSTM minus ordinary TA-LSTM has MAE differences of +1.207 and +2.824 m³/s at USGS 06903900 and 05453520, increases of 26.5% and 9.0%, with positive paired MAE intervals. At 05421000 the point MAE decreases by 7.5%, but its interval [−6.257, 0.751] m³/s includes zero; the RMSE interval lies below zero. Against persistence at 05421000, both MAE and RMSE decrease at seven days with intervals below zero. Training-intervention effects therefore depend on the site, metric and comparator.

TABLE|10

### 4.4 Model exports and offline execution

TABLE|11

Uint8 storage reduces total model-file size by 69.13–69.36%, from approximately 2.334–2.426 MB to 0.720–0.744 MB. Complete held-out evaluation gives mean absolute prediction differences from FP32 of 0.0416–0.0814 mm/day for Vietnam and 0.0711–0.9956 m³/s for Iowa. MAE increases or decreases depending on the site. These values differ from the 0.0304–0.0672 mm/day differences for a single input repeated in the Vietnam browser benchmark.

TABLE|12

Warm median inference is 4.37–5.35 ms on CPU and 11.77–12.16 ms on WebGL. The largest first WebGL inference is 2,907.51 ms, so warm medians do not establish immediate startup. On the saved Vietnam timing input, the largest FP32 difference from the Keras reference is 6.73×10⁻⁶ mm/day on CPU and 1.058×10⁻⁵ mm/day on WebGL. A separate saved rollout log for three regions, origin 31 December 2020 and horizons 1, 3 and 7 days contains nine reference comparisons, with maximum FP32 difference below 4.98×10⁻⁶ mm/day.

The tf.memory().numBytes field records 2,260,756 bytes, equivalent to 2.26 MB or 2.16 MiB. Its unreliable flag is true on CPU and false on WebGL. This runtime tensor-allocation measure is distinct from total application RAM or GPU memory. JavaScript heap ranges from 25.99 to 35.93 MB. These measurements do not establish battery, energy or thermal improvements or native integer arithmetic.

The saved offline reload audit uses Chrome DevTools Protocol network emulation with zero throughput and passes eleven checks without failure. Three synthetic report fixtures and two Bảo Hà models (FP32 and uint8 storage) persist unchanged in IndexedDB. The saved origin of 31 December 2020 gives an offline one-day prediction of 0.546370 mm/day. Report descriptions are test fixtures, not field observations. The local verification batch at reload is unresolved, so persistence does not establish truth of the reports. An earlier integration log contains six models; the cited persistence audit specifically verifies two.

### 4.5 Synthetic verification results

The 71-configuration campaign produces 25,560 summary rows. Its completed audit matches 281,160 checks against saved raw traces, including errors, abstention, coverage, belief summaries and Wilson intervals, with no failure. This verifies consistency with the declared simulation rather than realistic attacker or terrain distributions.

TABLE|13

Under frozen reputation in the prespecified mimic case with five honest reporters at 0.95 and twenty attackers at 0.50, grouped maximum support has 1.2% false alerts, 14.9% missed alerts and 13.7% mean abstention. Classical fusion has 98.7% false alerts and 100% missed alerts. Weighted voting at 0.75 issues no false alerts in this case but misses every true event through abstention. With self-consensus feedback, grouped support reaches 100% for both error rates. Figures 8–9 retain the attacker-count sweep and all ten feedback rounds.

FIG|8

FIG|9

The saved Python–JavaScript consistency audit passes 353 static fixtures at absolute and relative tolerances of 10⁻⁹, with maximum mass difference 1.421×10⁻¹⁴. Decisions, selected-report counts, groups and frozen-feedback mode match. These fixtures check implementation parity of static local batches; they are not additional independent Sybil-effectiveness trials or browser timing measurements and are not substituted for the campaign outcomes.

### 4.6 Cold starts and finite sensitivity

High initial honest reputation is a favourable assumption. When five honest reporters and twenty mimic attackers all start at 0.50, grouped support under frozen reputation has 98.1% false alerts and 100% missed alerts. With one neutral honest reporter and no attackers, the DBSCAN minimum of three points leaves every batch unresolved and misses all active events. These cases expose limits for new accounts and sparse reports.

Removing the simulated terrain factor in the primary frozen-reputation case changes false/missed alerts from 1.2%/14.9% to 0.7%/8.4%; the factor does not improve performance in that comparison. DBSCAN epsilon of 0.25 km gives 8.6%/70.3%, while 5 km gives 1.0%/11.2%. Under the simulated oracle, penalty η=0.10 gives 22.5%/31.3%, while η=0.50 gives 14.3%/14.5%. Retention, reward and penalty do not alter output when reputations are frozen, so sensitivity depends on the feedback regime. The manifest and campaign CSV retain every configuration, per-round intervals and worst malicious-round errors.

## 5 Discussion

### 5.1 Hydrological interpretation and geographic limits

Physical targets make forecast errors interpretable but do not turn reanalysis into observation. ERA5-Land evaluates prediction of a land-surface model’s runoff output; Iowa evaluates observed discharge. Strong persistence results in Iowa indicate that short-term temporal dependence can outweigh the benefit of greater model complexity in the selected periods. This external benchmark does not measure warnings at the three Vietnam regions.

At Cần Thơ, stage and inundation also depend on upstream inflow, river routing and tides, which regional runoff generation does not represent. High-target days are not an impact inventory. USGS 06903900 has only nine high-discharge test days, so peak interpretations require particular attention to sample size and uncertainty. Operational warnings would need an independently validated relation to an actionable hydrological quantity and decision threshold.

### 5.2 Training intervention and forecast combination

Censored-input training benefits Vietnam interruptions relative to ordinary TA-LSTM, but worsens MAE at two Iowa gauges. This difference is consistent with dependence on target dynamics, the training distribution and the evaluation loss; the experiment does not support applying the same intervention to every catchment. Temporal attention likewise gives no consistent point-MAE improvement over the matched LSTM. The value of the protocol lies in testing these assumptions and retaining their failures.

The Bates–Granger combination optimises a specified validation objective, without guaranteeing test MAE optimality or superiority over persistence. Abozweita et al. (2024) study monthly inflow forecasting, reinforcing the relevance of physical targets and appropriate temporal comparisons, while addressing a different frequency and task. HydroLang, TensorFlow.js and prior browser systems provide direct context for this implementation. The empirical contribution is the integration, input-interruption evaluation and reproducible reporting, rather than the classical methods themselves.

### 5.3 Evidence dependence and feedback

Maximum support limits exact repetition in a group but does not identify people, discover every dependency or prevent attackers from occupying more groups. Neutral honest cold-start and self-consensus failures accord with the broader Sybil and evidence-dependence concerns described by Douceur (2002) and Denoeux (2008). Kwon and Kang (2016) provide social-reporting context; the present study does not implement an equivalent server-side security benchmark for numerical ranking.

Freezing reputation without verified labels prevents an unsupported decision from becoming a reward or penalty, but also prevents learning from reports during that interval. Independent references, rate limits and stronger authentication are potential countermeasures whose operational effectiveness is not evaluated here. The simulated oracle isolates the role of label availability and does not establish an independent verification service in the demonstrator.

### 5.4 Desktop feasibility and deployment boundaries

Application reload, numerical correctness, forecast quality with stale inputs and report persistence are separate availability questions. The offline log checks software behaviour on one desktop with assets already cached. It does not evaluate shared consensus, operating-system cache eviction or a first launch without previously acquired resources. Only the research demonstrator and saved scientific execution path support the manuscript’s implementation claims.

Event-driven inference could reduce invocation count relative to a periodic schedule, but no controlled count, energy, battery or temperature comparison establishes its benefit. It remains a future measurement hypothesis. Desktop warm latency and smaller uint8 storage cannot be extrapolated to mobile devices or battery life. Network emulation also does not reproduce disaster conditions, maintenance or community use. Simulated Yagi motivation is retained without claiming field deployment during the typhoon.

## 6 Conclusions

The completed evaluation uses physical hydrological targets, strong baselines and explicit browser and evidence-aggregation boundaries. The expected-MSE ensemble improves over seasonal decomposition in these datasets but is not universally best; temporal attention does not consistently improve MAE. Censored-input training reduces seven-day interruption MAE in the three Vietnam reanalysis regions relative to ordinary TA-LSTM and has mixed Iowa effects. Grouped evidence reduces errors under some reputation assumptions and fails under neutral honest cold starts or self-consensus feedback. Desktop logs support local offline execution and persistence within the tested scope. Observed Vietnam flood validation, mobile and energy performance, operational deployment and general Sybil security remain outside the demonstrated evidence.

## Data and code availability

The CuuNet platform repository is https://github.com/nphu211206/CuuNet. WaterBench-Iowa is pinned to commit 46689cf41e4d3c6a09180c2ed17a162c26b87957, with archive SHA256 64879ffce056c1183cf708ad68a3153f3f87155be93282831ff6105219a87316 and dataset record https://doi.org/10.5281/zenodo.7087806. ERA5-Land and HydroBASINS retain their respective source attribution and use conditions.

Revision artifacts comprise prepared CSVs and receipts, basin boundaries, configurations, weights, per-seed predictions, forecast and interruption scores, simulation traces and audits, research-demonstrator code and browser logs. They are held in the author’s working archive under analysis/kaggle_intake_20261123, analysis/final_revision_20261123/task2, analysis/final_revision_20261123/task3, data/dependence_revision and paper_submission/browser_benchmarks. No immutable public release or archival DOI has yet been assigned to the complete revision package. The platform URL therefore does not assert public availability of every new artifact. The complete source tables retain validation scores, uncertainty and all 246 paired comparisons.

## Author and publishing declarations

Phu Toan Nguyen: conceptualisation; methodology; software; validation; formal analysis; investigation; data curation; writing of the original draft; review and editing; visualisation. The research received no external funding from public, commercial or non-profit organisations. The author declares no competing interests. Affiliation and ORCID fields on the title page are left for author completion.

During this revision, ChatGPT and Codex assisted with literature searching, experimental protocol development, software editing, statistical presentation and manuscript drafting. The author is responsible for verifying references, data, analyses and the final text. This disclosure replaces the earlier statements of no generative-AI use or language editing alone.

## References

REFERENCES

PAGEBREAK

## Appendix A Bias and high target errors

TABLE|A1

## Appendix B Ensemble shrinkage sensitivity

TABLE|B1
