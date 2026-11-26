import hashlib, os, re
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

print('=== FINAL QA REPORT ===')
print()
all_pass = True
for name, path in files.items():
    if not os.path.exists(path):
        print(f'[MISSING] {name}')
        all_pass = False
        continue
    sha = sha256_file(path)
    size_kb = os.path.getsize(path) // 1024
    doc = Document(path)
    all_text = ' '.join(get_text(p) for p in doc.paragraphs)
    
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
        for marker in FIX_MARKERS:
            if marker not in all_text:
                issues.append(f'MISSING FIX: "{marker[:40]}"')
    
    if name == 'Clean':
        for doi in NEW_REFS_CHECK:
            if doi not in all_text:
                issues.append(f'MISSING REF: {doi}')
    
    status = 'PASS' if not issues else 'FAIL'
    if issues:
        all_pass = False
    print(f'[{status}] {name} | SHA:{sha} | {size_kb} KB')
    for iss in issues:
        print(f'       -> {iss}')
    print()

print('=== END QA ===')
print('OVERALL:', 'ALL PASS' if all_pass else 'SOME FAILURES')
