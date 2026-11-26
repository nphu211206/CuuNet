"""Prepare the station-published Binh Lieu discharge and Tien Yen rainfall benchmark."""
from hashlib import sha256
from pathlib import Path
import json, os
import pandas as pd

root = Path.cwd()
scratch = Path(os.environ["TEMP"]) / "cuunet-hydro-observed"
obs = root / "data" / "observed_vietnam" / "data" / "raw_excel"
extract = pd.read_csv(scratch/"binh_lieu_extracted.csv",parse_dates=["date"]).set_index("date")
overlap=extract[["q_raw","q_qn"]].dropna()
assert len(overlap)==1461 and overlap.q_raw.eq(overlap.q_qn).all()
dates=pd.date_range("2000-01-01","2024-12-31",freq="D")
series=extract.loc[dates]
flow=series.q_raw.combine_first(series.q_qn)
assert flow.notna().all() and (flow>0).all()
assert series.q_raw.isna().equals(pd.Series(dates.year==2024,index=dates))
assert series.rain.notna().all() and (series.rain>=0).all()
frame=pd.DataFrame({"discharge_m3s":flow,"rainfall_mm":series.rain,"flow_available":1,
                    "age_01":0.0,"target_source":["Qn" if d.year==2024 else "Q_BinhLieu.xlsx" for d in dates]},index=dates)
frame.to_csv(scratch/"binh_lieu_daily_2000_2024.csv",index_label="date",lineterminator="\n")
source_manifest = {"dataset_doi":"10.5281/zenodo.23981946","rights":"CC BY 4.0","attribution":"Tran, Tuan Thach (2026). Source archive from the National Centre for Hydro-Meteorological Forecasting (Vietnam).",
                   "q_original_file":"Q_BinhLieu.xlsx","q_2024_file":"BinhLieu_H(90-25).xlsx","q_2024_sheet":"Qn",
                   "units":"m3/s","precipitation":"X_TienYen.xlsx, daily station rainfall in mm",
                   "overlap_q_records_match":int(len(overlap)),"complete_q_2024":int(series.q_raw.isna().sum()),
                   "raw_workbooks":{name:sha256((obs/name).read_bytes()).hexdigest() for name in ("Q_BinhLieu.xlsx","BinhLieu_H(90-25).xlsx","X_TienYen.xlsx")},
                   "discharge_processing":"Station-published, no smoothing or rating-curve correction applied in this check. Q file for 2000–2023; Qn for 2024. No use of 2025 values.",
                   "precipitation_processing":"Station-published rainfall. Only rainfall dated before the target is included in a neural input window."}
(scratch/"binh_lieu_source_manifest.json").write_text(json.dumps(source_manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print("prepared",len(frame),"published Q/rainfall days",int((frame.index.year==2024).sum()),"Qn days")
