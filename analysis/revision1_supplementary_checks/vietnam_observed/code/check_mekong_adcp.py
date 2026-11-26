import hashlib,json,os
from pathlib import Path
from zipfile import ZipFile
import numpy as np,pandas as pd

root=Path("data/observed_vietnam/eidc_mekong_10.5285_ac5b28ca")
out=Path(os.environ["TEMP"])/"cuunet-hydro-observed"
era_path=Path("data/runoff_revision/Can_Tho_Runoff.csv")
era=pd.read_csv(era_path,parse_dates=["date"]).set_index("date")["runoff_mm"].rename("runoff_mm_day")
assert era.index.equals(pd.date_range(era.index.min(),era.index.max(),freq="D"))
fields=["Month","Day","Year","Discharge (m3/s)"]
years={"Cantho":"Cần Thơ","Tanchau":"Tân Châu","Chaudoc":"Châu Đốc","Mythaun":"Mỹ Thuận"}
stats={"doi":"10.5285/ac5b28ca-e087-4aec-974a-5a9f84b06595", "licence":"OGL UK 3.0",
       "summary":"Archive ratings files contain ADCP discharge measurements. Fluxes files contain the derived sediment flux series.",
       "stations":{}}
def dates(ok):
    return pd.to_datetime(ok[["Year","Month","Day"]].rename(columns=str.lower),errors="coerce")
def paired_stats(pair,value):
    x=pair["runoff_mm_day"]; y=pair[value]
    seasonal=pair[[value,"runoff_mm_day"]].groupby(pair.index.month).transform("mean")
    return {"n":len(pair),"pearson_r":float(x.corr(y)),"spearman_rho":float(x.corr(y,method="spearman")),
            "pearson_r_after_month_centering":float((x-seasonal.runoff_mm_day).corr(y-seasonal[value]))}

zpath=next(root.glob("*.zip"))
with ZipFile(zpath) as z:
    for tag, name in years.items():
        source=root/"data"/f"{tag}ratings.csv"
        member=next(n for n in z.namelist() if Path(n).name==source.name)
        assert z.read(member)==source.read_bytes()
        raw=pd.read_csv(source,usecols=fields)
        short_year=raw.Year.between(0,99)
        valid_year=raw.Year.between(1900,2026)
        days=dates(raw.loc[valid_year])
        q=pd.to_numeric(raw[fields[-1]],errors="coerce")
        good=raw.loc[valid_year].assign(date=days,discharge=q.loc[valid_year]).dropna(subset=["date","discharge"])
        day_summary=good.groupby("date")["discharge"].agg(["count","mean","median"]).rename(columns={
            "count":"adcp_samples","mean":"mean_sampled_discharge_m3s","median":"median_sampled_discharge_m3s"})
        station={"rows":len(raw),"usable_measurements":len(good),"unique_dates":len(day_summary),
                 "short_year_counts":raw.loc[short_year,"Year"].value_counts().to_dict(),
                 "missing_or_invalid_date_with_four_digit_year":int(days.isna().sum()),
                 "coverage":[str(day_summary.index.min().date()),str(day_summary.index.max().date())],
                 "negative_q_measurements":int((good.discharge<0).sum()),
                 "counts_by_year":good.date.dt.year.value_counts().sort_index().to_dict(),
                 "source_sha256":hashlib.sha256(source.read_bytes()).hexdigest()}
        pair=day_summary.join(era,how="inner")
        if tag in ("Tanchau","Chaudoc"):
            station["can_tho_regional_runoff_association"]={
                **paired_stats(pair,"mean_sampled_discharge_m3s"),
                "scope":"Upstream station measurements against the Cần Thơ regional runoff series. This is a contextual association across different supports.",
            }
        stats["stations"][name]=station
        print(name,station)
        if tag!="Cantho":
            continue
        result={
            "runoff_source":era_path.as_posix(),
            "matched_dates":len(pair),
            "date_matching":"Exact calendar date labels. Source ADCP transects lack times in this table; statistics use a per-date mean/median over available transects.",
            "physical_scope":"The area-averaged ERA5-Land runoff depth and channel discharge have different supports and units. This retrospective association uses measurement days and does not test the forecast model.",
            "mean_summary":paired_stats(pair,"mean_sampled_discharge_m3s"),
            "median_summary":paired_stats(pair,"median_sampled_discharge_m3s"),
            "per_date_transects_quantiles":pair.adcp_samples.quantile([0,.25,.5,.75,1]).to_dict(),
            "days_with_single_transect":int((pair.adcp_samples==1).sum()),
            "days_with_multiple_transects":int((pair.adcp_samples>1).sum()),
        }
        extras=raw.loc[short_year].copy()
        print("Can Tho abbreviated years in source", extras.groupby("Year")[["Month","Day"]].agg(["min","max"]).to_string(),
              raw.loc[valid_year & (raw.Year==2010)].shape[0],"unambiguous 2010 rows")
        if set(extras.Year)=={10}:
            extra_dates=dates(extras.assign(Year=2010))
            extended=pd.concat([good[["date","discharge"]],
                pd.DataFrame({"date":extra_dates,"discharge":q.loc[short_year]}).dropna()])
            extended=extended.groupby("date").discharge.mean().rename("candidate").to_frame().join(era,how="inner")
            result["sensitivity_if_year_10_means_2010"]=paired_stats(extended,"candidate")
        stats["can_tho_pairing"]=result
        pair.to_csv(out/"can_tho_adcp_era5_pairs.csv",index_label="date",lineterminator="\n")
        print("Cần Thơ matched-date association",json.dumps(result,indent=2,ensure_ascii=False))
(out/"mekong_adcp_audit.json").write_text(json.dumps(stats,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
