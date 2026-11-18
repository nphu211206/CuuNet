"""
Adversarial Stress Test Script by Reviewer 2 (Critic Mode)
"""

import os
import re
import docx
import zipfile
import xml.etree.ElementTree as ET

CLEAN_PATH = r"C:\Users\Admin\Desktop\HYDRO_D_26_00188_Revision1_Clean.docx"
TRACKED_PATH = r"C:\Users\Admin\Desktop\HYDRO_D_26_00188_TrackedChanges.docx"
RESPONSE_PATH = r"C:\Users\Admin\Desktop\HYDRO_D_26_00188_Response_to_Reviewers.docx"
ALTTEXT_PATH = r"C:\Users\Admin\Desktop\HYDRO_D_26_00188_AltText.docx"

docs = {
    "clean": (CLEAN_PATH, docx.Document(CLEAN_PATH)),
    "tracked": (TRACKED_PATH, docx.Document(TRACKED_PATH)),
    "response": (RESPONSE_PATH, docx.Document(RESPONSE_PATH)),
    "alttext": (ALTTEXT_PATH, docx.Document(ALTTEXT_PATH)),
}

print("=" * 80)
print("ADVERSARIAL TEST 1: PROHIBITED PHRASES & HARDCODED FABRICATIONS")
print("=" * 80)

prohibited_patterns = [
    (r"mathematically\s+defends", "Prohibited phrase 'mathematically defends'"),
    (r"4\.2\s*mJ", "Fabricated battery metric '4.2 mJ'"),
    (r"134\s*ms", "Fabricated latency metric '134 ms'"),
    (r"31\.3\s*mW", "Fabricated power metric '31.3 mW'"),
    (r"44\.5\s*°C", "Fabricated thermal metric '44.5°C'"),
    (r"18\.5\s*%\s*/\s*h", "Fabricated drain metric '18.5%/h'"),
    (r"<\s*1\.8\s*mW", "Fabricated sleep power metric '< 1.8 mW'"),
    (r"No\s+generative\s+AI", "Inaccurate AI declaration 'No generative AI'"),
    (r"痕", "Garbage character '痕'"),
    (r"Trích\s+dẫn", "Untranslated token 'Trích dẫn'"),
]

for pat, desc in prohibited_patterns:
    for name, (path, doc) in docs.items():
        # check paragraphs
        matches_p = []
        for i, p in enumerate(doc.paragraphs):
            if re.search(pat, p.text, re.IGNORECASE):
                matches_p.append((f"P{i}", p.text.strip()[:80]))
        # check tables
        matches_t = []
        for t_idx, tbl in enumerate(doc.tables):
            for r_idx, row in enumerate(tbl.rows):
                for c_idx, cell in enumerate(row.cells):
                    if re.search(pat, cell.text, re.IGNORECASE):
                        matches_t.append((f"T{t_idx} R{r_idx}C{c_idx}", cell.text.strip()[:80]))
        total = len(matches_p) + len(matches_t)
        if total > 0:
            print(f"[FAIL] {desc} found in {name.upper()}: {total} occurrences!")
            for loc, txt in matches_p + matches_t:
                print(f"   {loc}: {txt}")
        else:
            print(f"[PASS] {desc} absent from {name.upper()}")

print("\n" + "=" * 80)
print("ADVERSARIAL TEST 2: TITLE SYNCHRONIZATION")
print("=" * 80)

EXPECTED_TITLE = "An Offline-First Edge AI Framework for Composite Disaster Risk-Index Forecasting and Crowdsourced Alert Verification: A Case Study in Vietnam"

for name, (path, doc) in docs.items():
    # find occurrences of EXPECTED_TITLE
    found = False
    for i, p in enumerate(doc.paragraphs):
        if EXPECTED_TITLE.lower() in p.text.lower():
            print(f"[PASS] Exact Title verified in {name.upper()} at P{i}")
            found = True
            break
    if not found:
        # check in tables
        for t_idx, tbl in enumerate(doc.tables):
            for r_idx, row in enumerate(tbl.rows):
                for c_idx, cell in enumerate(row.cells):
                    if EXPECTED_TITLE.lower() in cell.text.lower():
                        print(f"[PASS] Exact Title verified in {name.upper()} at Table {t_idx} R{r_idx}C{c_idx}")
                        found = True
                        break
                if found:
                    break
            if found:
                break
    if not found:
        print(f"[FAIL] Expected title NOT found in {name.upper()}!")

print("\n" + "=" * 80)
print("ADVERSARIAL TEST 3: COMPREHENSIVE BRITISH SPELLING SCAN (-ize vs -ise, -yze vs -yse)")
print("=" * 80)

# Typical British spellings that have American -ize/-yze/-or equivalents:
spelling_pairs = [
    (r"\binitializ(e|es|ed|ing|ation|ations)\b", "initialis..."),
    (r"\boptimiz(e|es|ed|ing|ation|ations)\b", "optimis..."),
    (r"\bminimiz(e|es|ed|ing|ation|ations)\b", "minimis..."),
    (r"\brecogniz(e|es|ed|ing|ation|ations)\b", "recognis..."),
    (r"\bharmoniz(e|es|ed|ing|ation|ations)\b", "harmonis..."),
    (r"\blocaliz(e|es|ed|ing|ation|ations)\b", "localis..."),
    (r"\bquantiz(e|es|ed|ing|ation|ations)\b", "quantis..."),
    (r"\bstandardiz(e|es|ed|ing|ation|ations)\b", "standardis..."),
    (r"\bprioritiz(e|es|ed|ing|ation|ations)\b", "prioritis..."),
    (r"\bcentraliz(e|es|ed|ing|ation|ations)\b", "centralis..."),
    (r"\bdecentraliz(e|es|ed|ing|ation|ations)\b", "decentralis..."),
    (r"\bsynchroniz(e|es|ed|ing|ation|ations)\b", "synchronis..."),
    (r"\bgeneraliz(e|es|ed|ing|ation|ations)\b", "generalis..."),
    (r"\bcategoriz(e|es|ed|ing|ation|ations)\b", "categoris..."),
    (r"\banalyz(e|es|ed|ing)\b", "analys..."),
    (r"\bdefense\b", "defence"),
]

for pat, b_pref in spelling_pairs:
    for doc_key in ["clean", "tracked"]:
        name, doc = doc_key, docs[doc_key][1]
        matches = []
        for i, p in enumerate(doc.paragraphs):
            # Exclude code snippets, URLs, or reference titles if any
            m = re.findall(pat, p.text, re.IGNORECASE)
            if m:
                # check if it's inside a formal citation title or external URL
                matches.append((f"P{i}", m, p.text.strip()[:100]))
        for t_idx, tbl in enumerate(doc.tables):
            for r_idx, row in enumerate(tbl.rows):
                for c_idx, cell in enumerate(row.cells):
                    m = re.findall(pat, cell.text, re.IGNORECASE)
                    if m:
                        matches.append((f"T{t_idx} R{r_idx}C{c_idx}", m, cell.text.strip()[:100]))
        if matches:
            print(f"[CHECK] {name.upper()}: Found {len(matches)} potential American spellings for {pat} (suggested {b_pref}):")
            for loc, m, txt in matches[:5]:
                print(f"    {loc} {m}: {txt}")
        else:
            print(f"[PASS] {name.upper()}: 0 matches for {pat}")

print("\n" + "=" * 80)
print("ADVERSARIAL TEST 4: DOCX XML INTEGRITY & PACKAGE VALIDATION")
print("=" * 80)

for name, (path, _) in docs.items():
    try:
        with zipfile.ZipFile(path, 'r') as zf:
            # check document.xml can parse cleanly
            doc_xml = zf.read('word/document.xml')
            root = ET.fromstring(doc_xml)
            # count paragraphs and tables in XML directly
            w_p = root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
            w_tbl = root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tbl')
            print(f"[PASS] {name.upper()} XML parsed cleanly: {len(w_p)} <w:p> elements, {len(w_tbl)} <w:tbl> elements")
    except Exception as e:
        print(f"[FAIL] {name.upper()} XML validation error: {e}")

print("\n" + "=" * 80)
print("ADVERSARIAL TEST 5: MULTI-PAGE TABLE HEADER REPEAT CHECK (<w:tblHeader/>)")
print("=" * 80)

for name in ["clean", "tracked"]:
    path = docs[name][0]
    with zipfile.ZipFile(path, 'r') as zf:
        doc_xml = zf.read('word/document.xml')
        root = ET.fromstring(doc_xml)
        tbl_headers = root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tblHeader')
        print(f"[{name.upper()}] Tables with <w:tblHeader/> elements: {len(tbl_headers)}")

print("\n" + "=" * 80)
print("ADVERSARIAL TESTS COMPLETED")
print("=" * 80)
