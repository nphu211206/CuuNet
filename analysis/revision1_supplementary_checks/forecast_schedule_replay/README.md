# Desktop forecast scheduling replay

The replay compares three ways to refresh a daily forecast in the CuuNet browser demonstrator. It uses the published FP32 exports for Bảo Hà, Sông Gianh and Cần Thơ on the TensorFlow.js CPU backend. Each export supplies 64 consecutive held-out daily input windows with one-day target dates from 1 January to 5 March 2021. Each origin is replayed separately at the 1-, 3- and 7-day horizons, for 576 origin–horizon requests.

Each replay day makes one saved input window available at hour 0. The four logical checks occur at hours 0, 6, 12 and 18. Six-hour periodic refresh executes at every check. Daily periodic refresh executes at hour 0. Refresh on input change executes when the model, saved input window or requested horizon changes. At each of the four checks all schedules must have a forecast for the current request. All 4,608 pairwise comparisons of full forecast paths and their timestamps agreed exactly.

| Refresh schedule | Checks | Forecasts issued | TensorFlow.js graph calls |
| --- | ---: | ---: | ---: |
| Every six hours | 2,304 | 2,304 | 8,448 |
| Daily | 2,304 | 576 | 2,112 |
| On input change | 2,304 | 576 | 2,112 |

One graph call corresponds to one recursive lead step within a rollout. Refresh on input change used 75% fewer calls than unconditional six-hour refresh and the same count as daily refresh with aligned daily delivery. Model executions were counted at the existing forecast entry point by instrumenting its graph execution method. The logical schedule ran in accelerated time. The input-change policy's warm median refresh times for new windows were 5.5, 16.5 and 34.8 ms at the three horizons, including the interface update. The timing values describe the saved desktop session and depend on the machine. Energy, device temperature and mobile behavior require device-level measurement.

The deployment bundles retain a legacy level-5 text label in their metadata. The three basin IDs agree with the level-7 geometries in `public/research/CuuNet_ERA5Land_L7_basins.geojson`. The lagged rollout input and reference runoff values for all 64 windows per basin were cross-checked against the prepared level-7 daily CSVs. The largest absolute differences were below 1.61 × 10⁻⁷ mm/day for scaled-then-inverted input runoff and 2.23 × 10⁻¹⁶ mm/day for target runoff.

## Reproduce the replay

Run from the repository root with Node.js 22 or later and a desktop Chrome executable. The script starts a headless instance in a temporary profile, serves the repository's browser demonstrator on loopback and passes the saved forecasts through its existing UI handler. Three warm-up calls per model are excluded. The run rotates the order of the three schedules by site, horizon and daily case.

```powershell
node notebooks/run_forecast_schedule_replay.mjs --chrome 'C:/Program Files/Google/Chrome/Application/chrome.exe' --out "$env:TEMP/cuunet-schedule-results.json"
```

`results.json` records invocation counts, per-request timings, displayed forecast paths, file hashes and the desktop software versions. Timing values can vary between runs.
