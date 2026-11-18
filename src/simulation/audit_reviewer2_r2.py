"""
Independent Audit Script by Reviewer 2 (Iteration 2)
Auditing HYDRO-D-26-00188 revision deliverables on Desktop
"""

import os
import re
import docx

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
print("AUDIT 1: DOCUMENT STRUCTURE & INTEGRITY")
print("=" * 80)
for name, (path, doc) in docs.items():
    print(f"[{name.upper()}] Path: {path}")
    print(f"  Paragraphs: {len(doc.paragraphs)}, Tables: {len(doc.tables)}")

print("\n" + "=" * 80)
print("AUDIT 2: TASK 1 - CẦN THƠ DISASTER PROFILE HARMONIZATION")
print("=" * 80)

# Clean P57 & P240
clean_doc = docs["clean"][1]
print(f"Clean P57 text:\n  '{clean_doc.paragraphs[57].text}'")
print(f"Clean P240 text:\n  '{clean_doc.paragraphs[240].text}'")

tracked_doc = docs["tracked"][1]
print(f"Tracked P74 text:\n  '{tracked_doc.paragraphs[74].text}'")
print(f"Tracked P261 text:\n  '{tracked_doc.paragraphs[261].text}'")

# Search all documents for mentions of Cần Thơ and associated hazards
print("\nScanning all paragraphs in Clean for 'Cần Thơ' or 'Can Tho':")
for i, p in enumerate(clean_doc.paragraphs):
    if "cần thơ" in p.text.lower() or "can tho" in p.text.lower():
        print(f"  Clean P{i}: {p.text.strip()[:140]}...")

print("\nScanning all tables in Clean for 'Cần Thơ' or 'Can Tho':")
for t_idx, tbl in enumerate(clean_doc.tables):
    for r_idx, row in enumerate(tbl.rows):
        for c_idx, cell in enumerate(row.cells):
            if "cần thơ" in cell.text.lower() or "can tho" in cell.text.lower():
                print(f"  Clean Table {t_idx} [R{r_idx}C{c_idx}]: {cell.text.strip()[:140]}...")

print("\nScanning all documents for legacy 'drought' or 'salinity intrusion' associated with Cần Thơ:")
for name, (_, doc) in docs.items():
    found_legacy = []
    for i, p in enumerate(doc.paragraphs):
        text_lower = p.text.lower()
        if ("cần thơ" in text_lower or "can tho" in text_lower) and ("drought" in text_lower or "salin" in text_lower):
            found_legacy.append((i, p.text.strip()))
    for t_idx, tbl in enumerate(doc.tables):
        for r_idx, row in enumerate(tbl.rows):
            for c_idx, cell in enumerate(row.cells):
                c_text = cell.text.lower()
                if ("cần thơ" in c_text or "can tho" in c_text) and ("drought" in c_text or "salin" in c_text):
                    found_legacy.append((f"Table {t_idx} R{r_idx}C{c_idx}", cell.text.strip()))
    print(f"  [{name.upper()}] Legacy Cần Thơ drought/salinity associations found: {len(found_legacy)}")
    for loc, txt in found_legacy:
        print(f"    Location {loc}: {txt}")


print("\n" + "=" * 80)
print("AUDIT 3: TASK 2 - FIGURE 1 CAPTION SYNCHRONIZATION")
print("=" * 80)
print(f"Clean P43 text:\n  '{clean_doc.paragraphs[43].text}'")
print(f"Tracked P59 text:\n  '{tracked_doc.paragraphs[59].text}'")
alttext_doc = docs["alttext"][1]
print(f"AltText P4 text:\n  '{alttext_doc.paragraphs[4].text}'")

# Search all occurrences of "Figure 1" across all documents
print("\nSearching all occurrences of 'Figure 1.' across documents:")
for name, (_, doc) in docs.items():
    for i, p in enumerate(doc.paragraphs):
        if p.text.startswith("Figure 1.") or p.text.startswith("Caption: Figure 1."):
            print(f"  [{name.upper()}] P{i}: '{p.text.strip()}'")

# Check if legacy caption string exists anywhere
legacy_caption = "Spatio-temporal division of the three geographic study area zones in Vietnam"
for name, (_, doc) in docs.items():
    count = sum(1 for p in doc.paragraphs if legacy_caption.lower() in p.text.lower())
    print(f"  [{name.upper()}] Legacy caption occurrences: {count}")


print("\n" + "=" * 80)
print("AUDIT 4: TASK 3 - RESPONSE TO REVIEWERS TONE NEUTRALIZATION")
print("=" * 80)
response_doc = docs["response"][1]
target_paras = [23, 53, 184, 297]
for idx in target_paras:
    print(f"Response P{idx}:\n  '{response_doc.paragraphs[idx].text}'")

# Search for hyperbolic / emotive tokens across entire Response to Reviewers
hyperbolic_patterns = [
    r"profound\s+gratitude",
    r"extraordinarily\s+fair",
    r"astute",
    r"flawless\s+precision",
    r"deep\s+mortification",
    r"unreserved\s+apologies",
    r"exceptionally\s+thorough",
    r"razor-sharp",
    r"deeply\s+grateful",
    r"invaluable\s+and\s+perceptive",
    r"tremendous\s+insight",
    r"profoundly\s+appreciate",
    r"boundless",
    r"masterful",
    r"breathtaking"
]

print("\nScanning Response to Reviewers for hyperbolic / emotive phrases:")
for pat in hyperbolic_patterns:
    matches = []
    for i, p in enumerate(response_doc.paragraphs):
        if re.search(pat, p.text, re.IGNORECASE):
            matches.append((i, p.text.strip()[:100]))
    print(f"  Pattern '{pat}': {len(matches)} matches")
    for i, txt in matches:
        print(f"    P{i}: {txt}")


print("\n" + "=" * 80)
print("AUDIT 5: TASK 4 - BRITISH ENGLISH SPELLING STANDARDIZATION")
print("=" * 80)

print(f"Clean P132:\n  '{clean_doc.paragraphs[132].text}'")
print(f"Clean P204:\n  '{clean_doc.paragraphs[204].text}'")
print(f"Clean P206:\n  '{clean_doc.paragraphs[206].text}'")

print(f"Tracked P4:\n  '{tracked_doc.paragraphs[4].text}'")
print(f"Tracked P5:\n  '{tracked_doc.paragraphs[5].text}'")
print(f"Tracked P6:\n  '{tracked_doc.paragraphs[6].text}'")
print(f"Tracked P8:\n  '{tracked_doc.paragraphs[8].text}'")
print(f"Tracked P149:\n  '{tracked_doc.paragraphs[149].text}'")
print(f"Tracked P221:\n  '{tracked_doc.paragraphs[221].text}'")
print(f"Tracked P223:\n  '{tracked_doc.paragraphs[223].text}'")

american_targets = [
    r"\binitialization\b",
    r"\binitializations\b",
    r"\boptimizes\b",
    r"\bminimize\b",
    r"\bminimized\b",
    r"\bminimizes\b",
    r"\bminimizing\b",
    r"\brecognized\b",
    r"\bdefense\b",
    r"\bharmonized\b",
    r"\blocalized\b",
]

print("\nScanning Clean.docx for American spellings:")
for pat in american_targets:
    found = []
    for i, p in enumerate(clean_doc.paragraphs):
        m = re.findall(pat, p.text, re.IGNORECASE)
        if m:
            found.append((i, m, p.text.strip()[:100]))
    print(f"  Clean '{pat}': {len(found)} matches")
    for i, m, txt in found:
        print(f"    P{i} {m}: {txt}")

print("\nScanning TrackedChanges.docx for American spellings:")
for pat in american_targets:
    found = []
    for i, p in enumerate(tracked_doc.paragraphs):
        m = re.findall(pat, p.text, re.IGNORECASE)
        if m:
            found.append((i, m, p.text.strip()[:100]))
    print(f"  Tracked '{pat}': {len(found)} matches")
    for i, m, txt in found:
        print(f"    P{i} {m}: {txt}")

print("\n" + "=" * 80)
print("AUDIT FINISHED")
print("=" * 80)
