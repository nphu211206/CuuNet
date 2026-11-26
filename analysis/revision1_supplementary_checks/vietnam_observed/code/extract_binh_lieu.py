from collections import Counter
from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import calendar, hashlib, json, math, os
from numbers import Real

import pandas as pd
from lxml import etree
from openpyxl import load_workbook

root=Path("data/observed_vietnam")
out=Path(os.environ["TEMP"])/"cuunet-hydro-observed"
out.mkdir(exist_ok=True)
docs=root/"data/raw_excel"

def open_source(path):
    # A few source sheets have broken print-area metadata. Omit it in a
    # temporary in-memory copy and leave sheet cells and their source unchanged.
    temp=BytesIO()
    with ZipFile(path) as original, ZipFile(temp, "w") as copy:
        for item in original.infolist():
            data=original.read(item.filename)
            if item.filename=="xl/workbook.xml":
                xml=etree.fromstring(data)
                for element in xml.findall(".//{*}definedName"):
                    if element.get("name") in ("_xlnm.Print_Area","_xlnm.Print_Titles"):
                        element.getparent().remove(element)
                data=etree.tostring(xml)
            copy.writestr(item,data)
    return load_workbook(temp,read_only=True,data_only=True)

def entries(path):
    workbook=open_source(path)
    try:
        sheet=workbook.active
        stream=sheet.iter_rows(max_col=2,values_only=True)
        values = {}
        for d,value in stream:
            if not isinstance(d,date):
                continue
            d=pd.Timestamp(d).normalize()
            assert d not in values
            values[d]=value
        return pd.to_numeric(pd.Series(values, dtype=object),errors="coerce").sort_index()
    finally:
        workbook.close()

def calendar_grid(rows, year_col=6):
    year=None
    values={}
    nonnumeric=Counter()
    for row in rows:
        key=row[year_col]
        if isinstance(key, Real) and 1900<=key<=2100 and any(label in str(row[year_col-1] or "").casefold() for label in ("year","năm")):
            year=int(key)
        day=row[0]
        if year is None or not isinstance(day, Real) or day%1!=0 or not 1<=day<=31:
            continue
        for month in range(1,13):
            if day>calendar.monthrange(year,month)[1]:
                continue
            timestamp=pd.Timestamp(date(year,month,int(day)))
            assert timestamp not in values, timestamp
            v=row[month]
            if not isinstance(v,Real) or not math.isfinite(v):
                nonnumeric[str(v)]+=1
            values[timestamp]=v
    return pd.to_numeric(pd.Series(values,dtype=object),errors="coerce").sort_index(),nonnumeric

def describe(s):
    valid=s.dropna()
    return {
        "record_grid": [str(s.index.min().date()), str(s.index.max().date())],
        "first_last_finite": [str(valid.index.min().date()), str(valid.index.max().date())] if len(valid) else [],
        "valid":int(s.notna().sum()), "missing_in_grid":int(s.isna().sum()),
        "missing_calendar_dates":int((s.index.max()-s.index.min()).days+1-len(s)),
        "negative":int((s<0).sum()), "zero":int((s==0).sum()),
        "min_max":[float(valid.min()),float(valid.max())] if len(valid) else [],
    }

q=entries(docs/"Q_BinhLieu.xlsx")
rain=entries(docs/"X_TienYen.xlsx")
hwb=open_source(docs/"BinhLieu_H(90-25).xlsx")
h,miss_h=calendar_grid(hwb["90-25"].iter_rows(max_col=13,values_only=True))
h_early,miss_h_early=calendar_grid(hwb["1961-1989"].iter_rows(max_col=13,values_only=True))
q2,miss_q2=calendar_grid(hwb["Qn"].iter_rows(max_col=13,values_only=True))
hwb.close()
joint=pd.concat([q.rename("q_raw"),q2.rename("q_qn"),h.rename("stage"),rain.rename("rain")],axis=1)
joint.to_csv(out/"binh_lieu_extracted.csv",index_label="date",lineterminator="\n")
print("Binh Lieu:", {k:describe(v) for k,v in (("Q raw",q),("Qn in H workbook",q2),("H 1990 onward",h),("H 1961–1989",h_early),("Tien Yen rain",rain))})
print("non-numeric cells",miss_q2,miss_h,miss_h_early)
byyear=joint.loc["2017":"2026"].groupby(joint.loc["2017":"2026"].index.year)
print("per year finite counts\n",byyear.count().to_string())
print("per year longest gauge entries and range\n", byyear[["q_qn","rain"]].agg(["min","max"]).to_string())
overlap=joint[["q_raw","q_qn"]].dropna()
assert len(overlap)>0
difference=(overlap.q_raw-overlap.q_qn).abs()
print("Q workbook overlap",len(overlap),"equal exactly",int((difference==0).sum()),"nonzero first",difference[difference>0].head(12).to_dict())
print("2024 gauge 7-day sample",joint.loc["2024-09-05":"2024-09-13",["q_raw","q_qn","stage","rain"]].to_string())
