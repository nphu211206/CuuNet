"""Prepare a common chronological comparison for three Red River gauges."""
from pathlib import Path
from hashlib import sha256
import json, os
import numpy as np
import pandas as pd
from red_river_tables import annual_grid, open_source, plausible_int

here=Path(os.environ["TEMP"])/"cuunet-hydro-observed"
root=Path("data/observed_vietnam")
folder=next(root.glob("mendeley*"))

def parse_son_tay_2015(sheet):
    """Read the provider's mean Q from the 365 consecutive day groups."""
    days=[]
    for row in sheet.iter_rows(min_row=5,max_col=7,values_only=True):
        d, hour, q, daymean=row[2],row[3],row[5],row[6]
        if plausible_int(d,1,31) and plausible_int(hour,0,23) and isinstance(q,(float,int)):
            days.append({"day":int(d),"means":[]})
        if days and plausible_int(hour,0,23) and isinstance(daymean,(int,float)):
            days[-1]["means"].append(daymean)
    calendar=pd.date_range("2015-01-01","2015-12-31",freq="D")
    assert len(days)==len(calendar) and [d["day"] for d in days]==list(calendar.day)
    assert all(len(d["means"])==1 for d in days)
    return pd.Series([d["means"][0] for d in days],index=calendar,dtype=float)

sources={
    "Hoa_Binh":("HBinh-Q_SPM_1975_2016_en.xlsx",["Q_HB_1975-2016"]),
    "Vu_Quang":("VuQuang_Q_SPM_2000-2016_en.xlsx",["Qn"]),
    "Son_Tay":("SonTay-Q_SPM_1975-2016_en.xlsx",["Q_Qn_1975_2013","Q-2016"]),
}
records={}
metadata={"dataset":"Son Nguyen (2023), Mendeley Data v1","doi":"10.17632/gmtw3zxhzc.1","license":"CC BY 4.0","stations":{}}
idx=pd.date_range("2000-01-01","2016-12-31",freq="D")
for station,(name,sheets) in sources.items():
    path=folder/name
    wb=open_source(path)
    grids=[annual_grid(wb[sheet]) for sheet in sheets]
    q=pd.concat([pair[0] for pair in grids])
    if station=="Son_Tay":
        q=pd.concat([q,parse_son_tay_2015(wb["Q-SonTay_2015"])])
        for year in (2009,2010):
            assert any("River: Đà" in s for s in grids[0][1][year]["header"])
    wb.close()
    assert q.index.is_unique
    records[station]=q.reindex(idx)
    metadata["stations"][station]={"file":name,"sha256":sha256(path.read_bytes()).hexdigest(),
                                   "n_published":int(q.count()),
                                   "obs_2000_2016_in_read_daily_blocks":int(q.reindex(idx).count()),
                                   "published_zeros_2000_2016":int((q.reindex(idx)==0).sum())}
frame=pd.DataFrame(records)
metadata["chronology"]={
    "train":"2000–2008",
    "validation_for_early_stopping":"2011–2013, excluding first 30 targets to use newly available 30-day windows",
    "test":"2016, 366 common observed test dates. Provider 2015 daily mean Q is available as antecedent history.",
    "why":"Sơn Tây's 2009 and 2010 annual sheets label River Đà. They are excluded from learning at all sites. The separately laid out 2014 subdaily block was outside the analysis. No missing values are represented as observed test targets.",
}
keep=(idx.year<=2008)|((idx.year>=2011)&(idx.year<=2013))|(idx.year>=2015)
frame.loc[~keep,:]=np.nan
assert frame.loc[keep].notna().all().all()
for gauge in frame:
    print(gauge, "train",frame[gauge].loc["2000":"2008"].count(),"validation",frame[gauge].loc["2011":"2013"].count(),"test",frame[gauge].loc["2016"].count(),
          "lag 1 Pearson",frame[gauge].loc["2016"].corr(frame[gauge].shift().loc["2016"]))
frame.to_csv(here/"red_river_daily.csv",index_label="date",lineterminator="\n")
(here/"red_river_source_manifest.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
