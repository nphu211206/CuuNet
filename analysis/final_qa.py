import hashlib, os, re, zipfile
from xml.etree import ElementTree as ET
from docx import Document
from docx.oxml.ns import qn

def get_text(para):
    t = ''
    for elem in para._p.iter():
        if elem.tag == qn('w:t'):
            t += (elem.text or '')
    return t

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest().upper()[:16]

files = {
    'Clean': 'paper_submission/HYDRO_D_26_00188_Revision1_Clean.docx',
    'TrackedChanges': 'paper_submission/HYDRO_D_26_00188_TrackedChanges.docx',
    'Response': 'paper_submission/HYDRO_D_26_00188_Response_to_Reviewers.docx',
    'AltText': 'paper_submission/HYDRO_D_26_00188_AltText.docx',
    'CoverLetter': 'paper_submission/Cover_Letter.docx',
}

AI_DECL = 'ChatGPT and GitHub Copilot were used for drafting and coding assistance.'
BAD_PATTERNS = ['former inconsistent', 'localhost', '37.5%', 'first spatio']
# Check for standalone COMPLETED label (all-caps, as a status tag), not the word "completed" in prose
BAD_EXACT = [r'\bCOMPLETED\b(?! empirical| physical| adversarial| audit| campaign| observed| streamflow| forecasting| evaluation)']
FIX_MARKERS = ['HTESSEL land-surface scheme', 'Rathbun Dam (USACE)', 'sensitivity test parameter rather than']
NEW_REFS_CHECK = ['10.5194/hess-21-5293-2017', '10.1016/j.jhydrol.2024.130771', '10.5194/gmd-19-10763-2026']
MALFORMED_SERVER_URL = re.compile(r'https?://the\s+local\s+development\s+server\b', re.IGNORECASE)
STALE_AUDIT_PREFIX = re.compile(
    r'^(?:DATA VN & OBSERVED IOWA|FCAST EXPERIMENTS|OUTAGE EXPERIMENTS|'
    r'EDGE & OFFLINE PWA AUDIT):\s*[.&](?=\s|$)'
)
TABLE_5_ALT_ROWS = re.compile(r'^Table 5\b.*?\bcontains (\d+) data rows\b')
REPLAY_COMMIT = '26084c7b33e487819ee9117c8a3f908ef4f5feb7'
SUPP_COMMIT = '81ba768a2a9b48dbe7427b820f89b00b5a43a5b9'
REPLAY_NUMBERS = ('8,448', '2,112', '2,304')


def check_docx_hyperlinks(path):
    """Ensure every w:hyperlink r:id maps cleanly to an external relationship."""
    w_hl = qn('w:hyperlink')
    r_id = qn('r:id')
    broken = []
    with zipfile.ZipFile(path) as zf:
        rels_tree = ET.fromstring(zf.read('word/_rels/document.xml.rels'))
        rel_map = {el.attrib['Id']: el.attrib.get('Target', '') for el in rels_tree}
        doc_tree = ET.fromstring(zf.read('word/document.xml'))
    for hl in doc_tree.iter(w_hl):
        rid = hl.attrib.get(r_id)
        if rid and not rel_map.get(rid):
            broken.append(rid)
    return broken

print('=== FINAL QA REPORT ===')
print()
all_pass = True
expected_table_5_rows = None
for name, path in files.items():
    if not os.path.exists(path):
        print(f'[MISSING] {name}')
        all_pass = False
        continue
    sha = sha256_file(path)
    size_kb = os.path.getsize(path) // 1024
    doc = Document(path)
    paragraphs = [get_text(p) for p in doc.paragraphs]
    all_text = ' '.join(paragraphs)
    
    issues = []
    for bad in BAD_PATTERNS:
        if bad.lower() in all_text.lower():
            issues.append(f'BAD: found "{bad}"')
    # Check standalone COMPLETED label
    import re as _re
    if _re.search(r'(?<!\w)COMPLETED(?!\s+(empirical|physical|adversarial|audit|campaign|observed|streamflow|forecasting|evaluation|physical-metric|run))', all_text):
        issues.append('BAD: standalone COMPLETED label found')
    
    if name != 'AltText':
        if AI_DECL not in all_text:
            issues.append('MISSING AI declaration')
    
    if name in ('Clean', 'TrackedChanges'):
        if MALFORMED_SERVER_URL.search(all_text):
            issues.append('BAD: local development server written as a malformed URL')
        for marker in FIX_MARKERS:
            if marker not in all_text:
                issues.append(f'MISSING FIX: "{marker[:40]}"')
    
    if name == 'Clean':
        if len(doc.tables) < 5:
            issues.append('MISSING Table 5 for the alt text check')
        else:
            table_5 = doc.tables[4]
            expected_table_5_rows = len(table_5.rows) - 1  # The first row is the column header.
        for doi in NEW_REFS_CHECK:
            if doi not in all_text:
                issues.append(f'MISSING REF: {doi}')
        try:
            abs_idx = paragraphs.index('Abstract') + 1
            abstract_text = paragraphs[abs_idx]
            abs_words = len(abstract_text.split())
            if abs_words > 200:
                issues.append(f'BAD: Abstract has {abs_words} words (limit <= 200)')
            if 'TA-LSTM' in abstract_text:
                issues.append('BAD: undefined TA-LSTM abbreviation in Abstract')
            if 'Bình Liêu' not in abstract_text:
                issues.append('MISSING: Bình Liêu benchmark in Abstract')
        except ValueError:
            issues.append('MISSING: Abstract heading')
        try:
            hl_idx = paragraphs.index('Highlights') + 1
            highlights = [p for p in paragraphs[hl_idx:hl_idx + 5] if p.strip()]
            hl_chars = sum(len(h) for h in highlights)
            if len(highlights) != 5 or hl_chars > 425:
                issues.append(f'BAD: Highlights count={len(highlights)} chars={hl_chars} (must be 5 bullets, <= 425 chars)')
        except ValueError:
            issues.append('MISSING: Highlights heading')
        try:
            conc_idx = paragraphs.index('6 Conclusions') + 1
            conc_text = paragraphs[conc_idx]
            if 'Bình Liêu' not in conc_text or '8,448' not in conc_text or '2,112' not in conc_text:
                issues.append('MISSING: Bình Liêu or replay call counts in 6 Conclusions')
        except ValueError:
            issues.append('MISSING: 6 Conclusions heading')

    if name in ('Clean', 'TrackedChanges', 'Response'):
        for num in REPLAY_NUMBERS:
            if num not in all_text:
                issues.append(f'MISSING replay metric "{num}"')
        if REPLAY_COMMIT not in all_text or SUPP_COMMIT not in all_text:
            issues.append('MISSING pinned supplementary/replay commit hash')

    if name == 'CoverLetter':
        if REPLAY_COMMIT not in all_text or SUPP_COMMIT not in all_text:
            issues.append('MISSING pinned supplementary/replay commit hash in CoverLetter')
        for num in ('8,448', '2,112'):
            if num not in all_text:
                issues.append(f'MISSING replay metric "{num}" in CoverLetter')

    if name in ('Clean', 'Response', 'CoverLetter'):
        broken_links = check_docx_hyperlinks(path)
        if broken_links:
            issues.append(f'BAD: broken hyperlink IDs {broken_links}')
    
    if name == 'Response':
        for paragraph in paragraphs:
            if STALE_AUDIT_PREFIX.match(paragraph):
                issues.append(f'BAD: malformed verification summary label "{paragraph.split(":", 1)[0]}"')
        tail_text = ' '.join(paragraphs[-25:])
        for metric in ('8,448', '2,112', '4,608'):
            if metric not in tail_text:
                issues.append(f'MISSING replay metric "{metric}" inside Verification summary section')

    if name == 'AltText' and expected_table_5_rows is not None:
        stated_rows = [
            int(match[1]) for paragraph in paragraphs
            if (match := TABLE_5_ALT_ROWS.match(paragraph))
        ]
        if stated_rows != [expected_table_5_rows]:
            issues.append(
                f'BAD: Table 5 alt text row counts {stated_rows} must match {expected_table_5_rows} data rows'
            )

    status = 'PASS' if not issues else 'FAIL'
    if issues:
        all_pass = False
    print(f'[{status}] {name} | SHA:{sha} | {size_kb} KB')
    for iss in issues:
        print(f'       -> {iss}')
    print()

print('=== END QA ===')
print('OVERALL:', 'ALL PASS' if all_pass else 'SOME FAILURES')
