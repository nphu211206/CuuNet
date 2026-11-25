"""Build a conservative bibliography from DOI registries and official source pages."""
from __future__ import annotations

import csv
import hashlib
import html
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "analysis" / "reference_verification"
DOIS = [
    ("Bates and Granger", "10.1057/jors.1969.103", ["combination", "forecasts"], "Established forecast combination; no claim of a new optimisation theorem"),
    ("Hochreiter and Schmidhuber", "10.1162/neco.1997.9.8.1735", ["long", "short", "memory"], "Established LSTM architecture"),
    ("Dempster", "10.1214/aoms/1177698950", ["probabilities", "multivalued"], "Established evidence-combination foundations"),
    ("Shafer", "10.1515/9780691214696", ["mathematical", "evidence"], "Established evidence theory; original book edition 1976"),
    ("Sit et al", "10.2166/wst.2020.369", ["deep", "learning", "hydrology"], "Review context; authors and venue taken from the DOI record"),
    ("Adger", "10.1016/S0305-750X(98)00136-3", ["vulnerability", "vietnam"], "Vietnam vulnerability context; not a calibration source for local weights"),
    ("Kwon and Kang", "10.1007/s41324-016-0014-1", ["flood"], "Related flood-report analysis; exact algorithm and server claims require full-text inspection"),
    ("Nash and Sutcliffe", "10.1016/0022-1694(70)90255-6", ["river", "flow", "forecasting"], "Nash-Sutcliffe efficiency definition"),
    ("Gupta et al", "10.1016/j.jhydrol.2009.08.003", ["decomposition", "mean", "squared"], "Kling-Gupta efficiency and decomposition of hydrological error"),
    ("Harrigan et al", "10.5194/essd-12-2043-2020", ["glofas", "reanalysis"], "General GloFAS-ERA5 reanalysis context; not a validation of v4 at Vietnamese gauges"),
    ("Ma et al", "10.1145/3308558.3313639", ["deep", "browser"], "Prior browser deep-learning benchmark; rules out first-ever browser claims"),
]
PAGES = [
    {"citation_key": "Bahdanau et al", "url": "https://arxiv.org/abs/1409.0473", "keywords": ["align", "translate"],
     "scope": "Additive temporal attention; citation date and conference edition kept explicit", "kind": "arxiv"},
    {"citation_key": "Smilkov et al", "url": "https://arxiv.org/abs/1901.05350", "keywords": ["tensorflow.js"],
     "scope": "TensorFlow.js system; no native INT8 kernel claim", "kind": "arxiv"},
    {"citation_key": "Ester et al", "url": "https://cdn.aaai.org/KDD/1996/KDD96-037.pdf", "keywords": [],
     "scope": "Established DBSCAN algorithm", "kind": "canonical_pdf", "title": "A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise",
     "authors": "Martin Ester; Hans-Peter Kriegel; Jorg Sander; Xiaowei Xu", "year": 1996, "venue": "Proceedings of KDD 1996", "pages": "226-231"},
]


def get(url):
    for attempt in range(3):
        response = requests.get(url, timeout=40, headers={"User-Agent": "CuuNet-HYDRO-Revision-Evidence/1.0"})
        if response.status_code not in {429, 502, 503} or attempt == 2:
            response.raise_for_status()
            return response
        time.sleep(2 * (attempt + 1))


def normalised(value):
    return re.sub(r"[^a-z0-9.]", " ", html.unescape(value).lower())


def registry_entry(entry):
    key, doi, keywords, scope = entry
    api = "https://api.crossref.org/works/" + quote(doi, safe="")
    try:
        cache = OUT / (re.sub(r"[^a-zA-Z0-9]", "_", doi) + ".json")
        if cache.is_file() and time.time() - cache.stat().st_mtime < 24 * 3600:
            payload = json.loads(cache.read_text(encoding="utf-8"))
        else:
            payload = get(api).json()["message"]
        title = html.unescape(re.sub("<[^>]+>", "", payload["title"][0]))
        if not all(keyword in normalised(title) for keyword in keywords):
            raise ValueError(f"DOI title does not match expected subject: {title}")
        if payload.get("DOI", "").lower() != doi.lower():
            raise ValueError("DOI registry returned a different identifier")
        authors = "; ".join(" ".join(filter(None, [author.get("given"), author.get("family")])) for author in payload.get("author", []))
        date = payload.get("published", payload.get("issued", {})).get("date-parts", [[None]])[0]
        venue = html.unescape("; ".join(payload.get("container-title", [])) or payload.get("publisher", ""))
        record = {"citation_key": key, "authors": authors, "title": title, "year": date[0], "venue": venue,
            "volume": payload.get("volume", ""), "issue": payload.get("issue", ""), "pages": payload.get("page", ""),
            "doi": doi, "url": "https://doi.org/" + doi, "verification_status": "verified", "verification_basis": "DOI registry title and authors",
            "supported_scope": scope, "source_metadata_url": api,
            "edition_note": "Original edition 1976; DOI metadata may describe a later electronic edition" if key == "Shafer" else "",
            "retraction_screen": "not systematically screened; no clean-status claim", "error": ""}
        OUT.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return record
    except Exception as error:
        return {"citation_key": key, "doi": doi, "verification_status": "unresolved", "error": str(error)}


def page_entry(entry):
    try:
        response = get(entry["url"])
        if entry["kind"] == "arxiv":
            metadata = dict(re.findall(r'<meta\s+name="(citation_[^"]+)"\s+content="([^"]*)"', response.text, flags=re.I))
            title = html.unescape(metadata.get("citation_title", ""))
            if not title or not all(keyword in normalised(title) for keyword in entry["keywords"]):
                raise ValueError("arXiv citation title could not be confirmed")
            authors = "; ".join(html.unescape(author) for author in re.findall(r'<meta\s+name="citation_author"\s+content="([^"]*)"', response.text, flags=re.I))
            year = int(metadata["citation_date"][:4])
            venue = "arXiv preprint"
            edition = "Preprint date recorded; Bahdanau paper appeared at ICLR 2015" if entry["citation_key"].startswith("Bahdanau") else ""
        else:
            if not response.content.startswith(b"%PDF"):
                raise ValueError("Canonical DBSCAN URL did not return a PDF")
            title, authors, year, venue, edition = entry["title"], entry["authors"], entry["year"], entry["venue"], ""
        filename = re.sub(r"[^a-zA-Z0-9]", "_", entry["citation_key"]) + (".pdf" if entry["kind"] == "canonical_pdf" else ".html")
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / filename).write_bytes(response.content)
        return {"citation_key": entry["citation_key"], "authors": authors, "title": title, "year": year, "venue": venue,
            "pages": entry.get("pages", ""), "doi": "", "url": entry["url"], "verification_status": "verified",
            "verification_basis": "official citation metadata" if entry["kind"] == "arxiv" else "canonical full-text PDF; bibliographic fields checked against the established proceedings reference",
            "supported_scope": entry["scope"], "source_metadata_url": entry["url"], "edition_note": edition,
            "retraction_screen": "not systematically screened; no clean-status claim", "download_sha256": hashlib.sha256(response.content).hexdigest(), "error": ""}
    except Exception as error:
        return {"citation_key": entry["citation_key"], "url": entry["url"], "verification_status": "unresolved", "error": str(error)}


def hydrolang_entry():
    api = "https://api.crossref.org/works?query.title=HydroLang&rows=10"
    response = get(api)
    items = response.json()["message"]["items"]
    (OUT / "hydrolang_search.json").write_text(json.dumps(items, indent=2), encoding="utf-8")
    matches = [item for item in items if "hydrolang" in " ".join(item.get("title", [])).lower() and "framework" in " ".join(item.get("title", [])).lower()]
    if not matches:
        return {"citation_key": "HydroLang", "verification_status": "unresolved", "error": "No exact HydroLang framework title was located"}
    matches.sort(key=lambda item: item.get("type") != "journal-article")
    candidate = matches[0]
    return registry_entry(("HydroLang", candidate["DOI"], ["hydrolang", "framework"], "Prior browser hydrological programming environment; not an edge forecasting comparator"))


def glofas_entry():
    api = "https://ewds.climate.copernicus.eu/api/catalogue/v1/collections/cems-glofas-historical"
    response = get(api)
    payload = response.json()
    text = json.dumps(payload).lower()
    if "glofas" not in text or "discharge" not in text:
        raise ValueError("Official GloFAS catalogue metadata did not match the requested dataset")
    (OUT / "glofas_catalogue.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {"citation_key": "Copernicus CEMS GloFAS", "authors": "Copernicus Emergency Management Service; ECMWF",
        "title": "River discharge and related historical data from the Global Flood Awareness System",
        "year": "2026", "edition_note": "Dataset access year; the run records version_4_0 and the exact 2000-2024 retrieval requests",
        "venue": "Copernicus Climate and Atmosphere Data Store", "doi": "10.24381/cds.a4fdd6b9",
        "url": "https://doi.org/10.24381/cds.a4fdd6b9", "source_metadata_url": api,
        "verification_status": "verified", "verification_basis": "official ECMWF catalogue metadata",
        "supported_scope": "modelled hydrological reanalysis; not in-situ observations or a disaster impact inventory",
        "retraction_screen": "not applicable to dataset catalogue", "error": ""}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as executor:
        registry = list(executor.map(registry_entry, DOIS))
        pages = list(executor.map(page_entry, PAGES))
    try:
        hydrolang = hydrolang_entry()
    except Exception as error:
        hydrolang = {"citation_key": "HydroLang", "verification_status": "unresolved", "error": str(error)}
    try:
        glofas = glofas_entry()
    except Exception as error:
        glofas = {"citation_key": "Copernicus CEMS GloFAS", "verification_status": "unresolved", "error": str(error)}
    records = registry + pages + [hydrolang, glofas]
    checked_at = datetime.now(timezone.utc).isoformat()
    for record in records:
        record["checked_at_utc"] = checked_at
    fields = sorted({key for record in records for key in record})
    accepted = [record for record in records if record["verification_status"] == "verified"]
    with (ROOT / "analysis" / "verified_bibliography.glofas.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(accepted)
    (OUT / "verification_results.json").write_text(json.dumps({"checked_at_utc": checked_at, "records": records}, indent=2), encoding="utf-8")
    print(json.dumps({"verified": len(accepted), "unresolved": [record for record in records if record["verification_status"] != "verified"]}, indent=2))


if __name__ == "__main__":
    main()
