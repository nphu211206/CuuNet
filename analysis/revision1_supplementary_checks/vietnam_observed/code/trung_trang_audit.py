"""Check signed hourly discharge and both hourly level records."""
from hashlib import sha256
from pathlib import Path
import json, math, os
from numbers import Real
from datetime import date

from openpyxl import load_workbook
import pandas as pd

source=Path("data/observed_vietnam/Data_2021_2022_TrungTrang_HonDau.xlsx")
book=load_workbook(source,read_only=True,data_only=True)
result={"dataset_doi":"10.5281/zenodo.13283821","license":"CC BY 4.0",
        "sha256":sha256(source.read_bytes()).hexdigest(),"series":{}}
minutes=pd.date_range("2021-01-01","2022-12-31 23:00",freq="h")
for sheet in book.worksheets:
    values={}
    is_q=sheet.title.startswith("River_discharge")
    for row in sheet.iter_rows(max_col=25,values_only=True):
        if not isinstance(row[0],date) or not 2021<=row[0].year<=2022:
            continue
        day=pd.Timestamp(row[0]).normalize()
        cells = {int(row[1]):row[2]} if is_q else dict(enumerate(row[1:25]))
        for hour,value in cells.items():
            timestamp=day+pd.Timedelta(hours=hour)
            value=float(value)
            assert timestamp not in values and math.isfinite(value)
            values[timestamp]=value
    reading=pd.Series(values,dtype=float).sort_index()
    assert reading.index.equals(minutes)
    daily=reading.resample("D").mean()
    result["series"][sheet.title]={"hours":len(reading),"days":len(daily),"min_max":[float(reading.min()),float(reading.max())],
      "negative_hours":int((reading<0).sum()),"daily_mean_range":[float(daily.min()),float(daily.max())]}
book.close()
print(json.dumps(result,indent=2,ensure_ascii=False))
(Path(os.environ["TEMP"])/"cuunet-hydro-observed"/"trung_trang_coverage.json").write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
