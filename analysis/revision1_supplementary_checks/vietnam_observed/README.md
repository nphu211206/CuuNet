# Vietnamese station observations

The supplementary checks use the forecast methods in the primary revision with additional station observations. The primary artifacts are archived at [v2.0-revision1](https://github.com/nphu211206/CuuNet/releases/tag/v2.0-revision1).

## Data sources

- Bình Liêu daily discharge and Tiên Yên daily rainfall by Tran Tuan Thach. The source archive transcribes records of the National Centre for Hydro-Meteorological Forecasting (Vietnam). Data are CC BY 4.0. Use the station-published discharge from Q_BinhLieu.xlsx through 2023 and from the Qn sheet of BinhLieu_H(90-25).xlsx in 2024. The 1,461 values in both workbooks from 2020–2023 match exactly. X_TienYen.xlsx supplies daily rainfall. The benchmark uses published discharge before the archive's homogenisation step. [Zenodo](https://doi.org/10.5281/zenodo.23981946)
- Cần Thơ, Châu Đốc, Tân Châu and Mỹ Thuận ADCP records by S. E. Darby, C. R. Hackney, D. R. Parsons and P. D. V. Tri. Published by the NERC Environmental Information Data Centre under the Open Government Licence v3. The primary Cần Thơ match uses 121 dates with unambiguous year labels. Per-date averages use the available transects, and calendar-month adjustment uses means from those same paired dates. The upstream comparisons use each gauge's separate date set. [NERC EIDC](https://doi.org/10.5285/ac5b28ca-e087-4aec-974a-5a9f84b06595)
- Daily discharge at Hòa Bình, Vụ Quang and Sơn Tây by Son Nguyen, CC BY 4.0. The comparison fits 2000–2008, selects LSTM epochs on validation targets in 2011–2013 after a 30-day warm-up and scores 2016. Sơn Tây uses the provider's 365 mean values from its 2015 sheet as antecedent input. Its 2009–2010 discharge blocks label the river as Đà and are excluded at all sites. We omit the separately laid out 2014 subdaily block. [Mendeley Data](https://doi.org/10.17632/gmtw3zxhzc.1)
- Signed hourly discharge at Trung Trang and hourly water level at Trung Trang and Hòn Dấu by Juliette Pénicaud, CC BY 4.0. The coverage record verifies the complete 2021–2022 grid. [Zenodo](https://doi.org/10.5281/zenodo.13283821)

## Forecast protocol

The Bình Liêu benchmark scores 1,461 one-day forecasts in 2021–2024 and 208 frozen-input origins at each of 1, 3 and 7 days. It uses a 30-day input window, the manuscript's seven statistical methods and its three recurrent variants with five matched seeds. Station rainfall and discharge date strictly before each target. The robust STL comparison uses seven-day interpolation of trend and low-pass smooths with the same smoothing spans. At 84 monthly origins, the mean absolute differences from daily smoothing were 0.091, 0.111 and 0.111 m³/s for the three lead times. The expected-MSE weights and leading baseline are selected on validation.

The Red River check uses the plain LSTM and three simple discharge baselines at each gauge. Its paired forecast errors compare fitted models conditional on the recorded 2016 test period. Differences among stations are observational.

## Reproduce the numerical checks

Place the source workbooks and archives under data/observed_vietnam with the same layout as in the source receipts. The prepared outputs use the current machine's temporary directory. Run from the repository root with the scientific Python environment. The fit used TensorFlow 2.20.0, Keras 3.15.1, NumPy 2.2.6, pandas 2.2.3 and Statsmodels 0.14.6. The Excel parsers also need openpyxl and lxml.

~~~powershell
$code = 'analysis/revision1_supplementary_checks/vietnam_observed/code'
$work = Join-Path ([IO.Path]::GetTempPath()) 'cuunet-hydro-observed'
$env:PYTHONPATH = (Resolve-Path -LiteralPath 'notebooks').Path
$env:PYTHONHASHSEED = '42'
$env:TF_ENABLE_ONEDNN_OPTS = '0'
python "$code/extract_binh_lieu.py"
python "$code/prepare_binh_lieu.py"
python "$code/prepare_red_river.py"
python "$code/check_mekong_adcp.py"
python "$code/trung_trang_audit.py"
python "$code/binh_lieu_baselines_interpolated.py" --daily "$work/binh_lieu_daily_2000_2024.csv" --out "$work/binh_lieu_stats_interpolated" --workers 7
foreach ($seed in @(42, 123, 456, 789, 2024)) {
    python "$code/binh_lieu_neural.py" --daily "$work/binh_lieu_daily_2000_2024.csv" --seed $seed --out "$work/binh_lieu_full"
    python "$code/red_river_fit.py" --daily "$work/red_river_daily.csv" --seed $seed --out "$work/red_river_fits"
}
python "$code/binh_lieu_replay.py" --daily "$work/binh_lieu_daily_2000_2024.csv" --fits "$work/binh_lieu_full" --out "$work/binh_lieu_replay"
python "$code/summarize_vietnam.py" --work $work --out "$work/published" --case binh
python "$code/summarize_vietnam.py" --work $work --out "$work/published" --case red
~~~

The metrics CSVs, per-date prediction archives and JSON files give the scores, source fingerprints, paired intervals and fit configuration. The source workbooks are available from the cited DOI records.
