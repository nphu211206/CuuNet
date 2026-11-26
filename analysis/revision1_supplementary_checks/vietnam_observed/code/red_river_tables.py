"""Extract dated station values, preserving gaps and source ambiguity."""
from datetime import date
from hashlib import sha256
from io import BytesIO
from numbers import Real
from pathlib import Path
from zipfile import ZipFile
import calendar, json, math, os, re

import pandas as pd
from lxml import etree
from openpyxl import load_workbook


def open_source(path):
    data = BytesIO()
    with ZipFile(path) as original, ZipFile(data,"w") as copy:
        for member in original.infolist():
            contents=original.read(member.filename)
            if member.filename == "xl/workbook.xml":
                xml=etree.fromstring(contents)
                for node in xml.findall(".//{*}definedName"):
                    if node.get("name") in ("_xlnm.Print_Area","_xlnm.Print_Titles"):
                        node.getparent().remove(node)
                contents=etree.tostring(xml)
            copy.writestr(member,contents)
    return load_workbook(data,read_only=True,data_only=True)


def plausible_int(value, lo, hi):
    return isinstance(value,Real) and math.isfinite(value) and int(value)==value and lo<=value<=hi


def table_year(row):
    for i, cell in enumerate(row):
        if not isinstance(cell,str):
            continue
        match=re.search(r"\b(?:year|năm)\s*:\s*(19\d{2}|20\d{2})",cell,re.I)
        if match:
            return int(match[1])
        if re.fullmatch(r"\s*(?:year|năm)\s*:\s*",cell,re.I) and i+1<len(row) and plausible_int(row[i+1],1900,2100):
            return int(row[i+1])
    return None


def annual_grid(sheet):
    year=None
    series={}
    headings={}
    for i,row in enumerate(sheet.iter_rows(max_col=13, values_only=True),start=1):
        header = table_year(row)
        if header is not None:
            if header in headings:
                raise ValueError(f"Duplicated source heading {sheet.title}: {header}")
            year=header
            headings[year]={"worksheet_row":i,"header":[v for v in row if isinstance(v,str) and v.strip()]}
        if year is None or not plausible_int(row[0],1,31):
            continue
        for m in range(1,13):
            if row[0]>calendar.monthrange(year,m)[1]:
                continue
            d=pd.Timestamp(date(year,m,int(row[0])))
            if d in series:
                raise ValueError(f"Duplicated day {sheet.title}: {d}")
            series[d]=row[m]
    q=pd.to_numeric(pd.Series(series, dtype=object),errors="coerce").sort_index()
    if (q<0).any():
        raise ValueError(f"Negative daily Q {sheet.title}")
    return q,headings
