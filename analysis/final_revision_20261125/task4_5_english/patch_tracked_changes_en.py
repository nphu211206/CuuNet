"""Update TrackedChanges cleanly in OOXML when Word COM save is blocked by product activation."""
from pathlib import Path
from datetime import datetime, timezone
from zipfile import ZipFile, ZIP_DEFLATED
import copy, hashlib, json, shutil
from lxml import etree
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

from document_helpers_en import (
    AUTHOR, AFFILIATION, EMAIL, FULL_TITLE, NAMES, ORCID, ROOT, STAGE, WORK, sha
)

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'dcterms': 'http://purl.org/dc/terms/',
}
W = '{' + NS['w'] + '}'
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'


def projection(element, accept):
    pieces = []
    for node in element.xpath('.//w:t | .//w:delText | .//m:t', namespaces=NS):
        anc = [a.tag for a in node.iterancestors()]
        inserted = any(t in (W + 'ins', W + 'moveTo') for t in anc)
        deleted = any(t in (W + 'del', W + 'moveFrom') for t in anc) or node.tag == W + 'delText'
        if (accept and not deleted) or (not accept and not inserted):
            pieces.append(node.text or '')
    return ''.join(pieces)


def ooxml_accept_root(root):
    doc = copy.deepcopy(root)
    for tag in ('rPrChange', 'pPrChange', 'tblPrChange', 'trPrChange', 'tcPrChange', 'sectPrChange'):
        for el in doc.xpath(f'.//w:{tag}', namespaces=NS):
            el.getparent().remove(el)
    for el in doc.xpath('.//w:tr[w:trPr/w:del]', namespaces=NS):
        el.getparent().remove(el)
    for el in doc.xpath('.//w:tc[w:tcPr/w:cellDel]', namespaces=NS):
        el.getparent().remove(el)
    for el in doc.xpath('.//w:cellIns', namespaces=NS):
        el.getparent().remove(el)
    for p in reversed(doc.xpath('.//w:p[w:pPr/w:rPr/w:del]', namespaces=NS)):
        nxt = p.getnext()
        while nxt is not None and nxt.tag != W + 'p':
            nxt = nxt.getnext()
        for d in p.xpath('./w:pPr/w:rPr/w:del', namespaces=NS):
            d.getparent().remove(d)
        if nxt is not None and nxt is p.getnext():
            for ch in list(nxt):
                if ch.tag != W + 'pPr':
                    nxt.remove(ch)
                    p.append(ch)
            nxt.getparent().remove(nxt)
    for el in doc.xpath('.//w:del | .//w:moveFrom', namespaces=NS):
        el.getparent().remove(el)
    for el in doc.xpath('.//w:ins | .//w:moveTo', namespaces=NS):
        parent = el.getparent()
        if parent is not None and parent.tag == W + 'rPr' and parent.getparent().tag == W + 'pPr':
            parent.remove(el)
            continue
        idx = list(parent).index(el)
        for offset, child in enumerate(list(el)):
            el.remove(child)
            parent.insert(idx + offset, child)
        parent.remove(el)
    return doc


def ooxml_reject_snapshot(root):
    body = root.find('w:body', NS)
    blocks = []
    for child in body:
        local = etree.QName(child).localname
        if local == 'sectPr':
            continue
        if local == 'p':
            p_del = child.xpath('./w:pPr/w:rPr/w:del', namespaces=NS)
            p_ins = child.xpath('./w:pPr/w:rPr/w:ins', namespaces=NS)
            if p_ins and not projection(child, False):
                continue
            txt = projection(child, False)
            if txt or p_del:
                blocks.append(('p', txt))
        elif local == 'tbl':
            rows = []
            for tr in child.xpath('./w:tr', namespaces=NS):
                if tr.xpath('./w:trPr/w:ins', namespaces=NS):
                    continue
                rows.append([projection(tc, False) for tc in tr.xpath('./w:tc', namespaces=NS)
                             if not tc.xpath('./w:tcPr/w:cellIns', namespaces=NS)])
            blocks.append(('tbl', rows))
    return blocks


def clean_snapshot(docx_path):
    doc = Document(docx_path)
    with ZipFile(docx_path) as z:
        root = etree.fromstring(z.read('word/document.xml'))
    body = root.find('w:body', NS)
    blocks = []
    for child in body:
        local = etree.QName(child).localname
        if local == 'sectPr':
            continue
        if local == 'p':
            txt = ''.join(child.xpath('.//w:t/text() | .//m:t/text()', namespaces=NS))
            has_media = bool(child.xpath('.//w:drawing | .//w:br', namespaces=NS))
            if txt or has_media:
                blocks.append(('p', txt, bool(child.xpath('.//w:drawing', namespaces=NS))))
        elif local == 'tbl':
            rows = [[''.join(tc.xpath('.//w:t/text() | .//m:t/text()', namespaces=NS))
                     for tc in tr.xpath('./w:tc', namespaces=NS)]
                    for tr in child.xpath('./w:tr', namespaces=NS)]
            blocks.append(('tbl', rows))
    media = sorted(hashlib.sha256(ZipFile(docx_path).read(n)).hexdigest()
                   for n in ZipFile(docx_path).namelist() if n.startswith('word/media/'))
    return doc, root, blocks, media


def accepted_snapshot(accepted_root):
    body = accepted_root.find('w:body', NS)
    blocks = []
    for child in body:
        local = etree.QName(child).localname
        if local == 'sectPr':
            continue
        if local == 'p':
            txt = ''.join(child.xpath('.//w:t/text() | .//m:t/text()', namespaces=NS))
            has_media = bool(child.xpath('.//w:drawing | .//w:br', namespaces=NS))
            if txt or has_media:
                blocks.append(('p', txt, bool(child.xpath('.//w:drawing', namespaces=NS))))
        elif local == 'tbl':
            rows = [[''.join(tc.xpath('.//w:t/text() | .//m:t/text()', namespaces=NS))
                     for tc in tr.xpath('./w:tc', namespaces=NS)]
                    for tr in child.xpath('./w:tr', namespaces=NS)]
            blocks.append(('tbl', rows))
    return blocks


def make_run(text, rpr=None, del_text=False):
    r = etree.Element(W + 'r')
    if rpr is not None:
        r.append(copy.deepcopy(rpr))
    t = etree.SubElement(r, W + ('delText' if del_text else 't'))
    if text.startswith(' ') or text.endswith(' ') or '  ' in text:
        t.set(XML_SPACE, 'preserve')
    t.text = text
    return r


def main():
    base_tracked = WORK / 'qa_word/tracked_base_20261126.docx'
    paper_tracked = ROOT / 'paper_submission' / NAMES['tracked']
    if not base_tracked.exists():
        base_tracked.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(paper_tracked, base_tracked)

    clean_path = STAGE / NAMES['clean']
    clean_doc, _, clean_blocks, clean_media = clean_snapshot(clean_path)

    # Canonical new strings sourced verbatim from staged Clean
    new_title = clean_doc.paragraphs[0].text
    new_affil = clean_doc.paragraphs[3].text
    new_orcid = clean_doc.paragraphs[4].text
    new_abstract = clean_doc.paragraphs[6].text
    new_decl = next(p.text for p in clean_doc.paragraphs if p.text.startswith('Phu Toan Nguyen: conceptualisation;'))
    new_bahdanau = next(p.text for p in clean_doc.paragraphs if p.text.startswith('Dzmitry Bahdanau;'))
    new_kamvar = next(p.text for p in clean_doc.paragraphs if p.text.startswith('Sepandar D. Kamvar;'))
    new_smilkov = next(p.text for p in clean_doc.paragraphs if p.text.startswith('Daniel Smilkov;'))

    assert new_affil == 'Affiliation: ' + AFFILIATION
    assert new_orcid == 'ORCID: ' + ORCID

    with ZipFile(base_tracked) as z:
        parts = {n: z.read(n) for n in z.namelist()}

    base_root = etree.fromstring(parts['word/document.xml'])
    root = copy.deepcopy(base_root)
    ids = [int(x.get(W + 'id')) for x in root.xpath('.//*[@w:id]', namespaces=NS) if x.get(W + 'id', '').isdigit()]
    counter = max(ids, default=0)
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

    def next_rev(tag):
        nonlocal counter
        counter += 1
        el = etree.Element(W + tag)
        el.set(W + 'id', str(counter))
        el.set(W + 'author', 'Codex')
        el.set(W + 'date', stamp)
        return el

    ps = root.xpath('./w:body/w:p', namespaces=NS)
    patches = []

    # 1. P[0] Title: Browser based -> Browser-based
    p0 = ps[0]
    old_r0 = next(ch for ch in p0 if ch.tag == W + 'r')
    old_t0 = ''.join(old_r0.xpath('.//w:t/text()', namespaces=NS))
    assert old_t0 == 'Browser based hydrological forecasting under input interruptions and crowdsourced evidence verification'
    rpr0 = old_r0.find('w:rPr', NS)
    pos0 = list(p0).index(old_r0)
    p0.remove(old_r0)
    del0 = next_rev('del')
    del0.append(make_run('Browser based', rpr0, del_text=True))
    ins0 = next_rev('ins')
    ins0.append(make_run('Browser-based', rpr0, del_text=False))
    tail0 = make_run(' hydrological forecasting under input interruptions and crowdsourced evidence verification', rpr0, del_text=False)
    p0.insert(pos0, del0)
    p0.insert(pos0 + 1, ins0)
    p0.insert(pos0 + 2, tail0)
    assert projection(p0, True) == new_title
    patches.append('Title')

    # 2. P[4] Affiliation (already <w:ins>)
    p4 = ps[4]
    ins4 = p4.find('w:ins', NS)
    rpr4 = ins4.find('w:r/w:rPr', NS)
    for ch in list(ins4):
        ins4.remove(ch)
    ins4.append(make_run(new_affil, rpr4))
    assert projection(p4, True) == new_affil
    patches.append('Affiliation')

    # 3. P[5] ORCID (already <w:ins>)
    p5 = ps[5]
    ins5 = p5.find('w:ins', NS)
    rpr5 = ins5.find('w:r/w:rPr', NS)
    for ch in list(ins5):
        ins5.remove(ch)
    ins5.append(make_run(new_orcid, rpr5))
    assert projection(p5, True) == new_orcid
    patches.append('ORCID')

    # 4. P[7] Abstract (existing <w:del> preserved; update <w:ins>)
    p7 = ps[7]
    ins7 = p7.find('w:ins', NS)
    rpr7 = ins7.find('w:r/w:rPr', NS)
    for ch in list(ins7):
        ins7.remove(ch)
    ins7.append(make_run(new_abstract, rpr7))
    assert projection(p7, True) == new_abstract
    patches.append('Abstract')

    # 5. P[204] Declarations (already <w:ins>)
    p204 = ps[204]
    ins204 = p204.find('w:ins', NS)
    rpr204 = ins204.find('w:r/w:rPr', NS)
    for ch in list(ins204):
        ins204.remove(ch)
    ins204.append(make_run(new_decl, rpr204))
    assert projection(p204, True) == new_decl
    patches.append('Declarations')

    # 6. P[210] Bahdanau et al. (already <w:ins>, 9.5pt)
    p210 = ps[210]
    ins210 = p210.find('w:ins', NS)
    rpr210 = ins210.find('w:r/w:rPr', NS)
    assert rpr210 is not None
    for ch in list(ins210):
        ins210.remove(ch)
    ins210.append(make_run(new_bahdanau, rpr210))
    assert projection(p210, True) == new_bahdanau
    patches.append('Bahdanau et al.')

    # 7. P[227] Kamvar et al. (collapse double space inside existing <w:ins>)
    p227 = ps[227]
    ins227_list = p227.xpath('./w:ins', namespaces=NS)
    ins227_tail = ins227_list[-1]
    rpr227 = ins227_tail.find('w:r/w:rPr', NS)
    tail227 = ''.join(ins227_tail.xpath('.//w:t/text()', namespaces=NS))
    assert 'World Wide Web  - WWW' in tail227
    for ch in list(ins227_tail):
        ins227_tail.remove(ch)
    ins227_tail.append(make_run(tail227.replace('World Wide Web  - WWW', 'World Wide Web - WWW'), rpr227))
    assert projection(p227, True) == new_kamvar
    patches.append('Kamvar et al.')

    # 8. P[244] Smilkov et al. (was unchanged <w:r>+<w:r>; track old author order -> new First Last)
    p244 = ps[244]
    old_smilkov = projection(p244, False)
    old_authors = (
        'Smilkov, Daniel; Thorat, Nikhil; Assogba, Yannick; Yuan, Ann; Kreeger, Nick; '
        'Yu, Ping; Zhang, Kangyi; Cai, Shanqing; Nielsen, Eric; Soergel, David; '
        'Bileschi, Stan; Terry, Michael; Nicholson, Charles; Gupta, Sandeep N.; '
        'Sirajuddin, Sarah; Sculley, D.; Monga, Rajat; Corrado, Greg; '
        'Vi\u00e9gas, Fernanda B.; Wattenberg, Martin'
    )
    suffix = ' (2019). TensorFlow.js: Machine Learning for the Web and Beyond. arXiv preprint. https://arxiv.org/abs/1901.05350'
    assert old_smilkov == old_authors + suffix
    new_authors = new_smilkov[:-len(suffix)]
    assert new_smilkov == new_authors + suffix
    rpr244 = p244.find('w:r/w:rPr', NS)
    assert rpr244 is not None
    for ch in list(p244):
        if ch.tag != W + 'pPr':
            p244.remove(ch)
    del244 = next_rev('del')
    del244.append(make_run(old_authors, rpr244, del_text=True))
    ins244 = next_rev('ins')
    ins244.append(make_run(new_authors, rpr244, del_text=False))
    tail244 = make_run(suffix, rpr244, del_text=False)
    p244.append(del244)
    p244.append(ins244)
    p244.append(tail244)
    assert projection(p244, False) == old_smilkov
    assert projection(p244, True) == new_smilkov
    patches.append('Smilkov et al.')

    # Verify unique revision w:id across word/document.xml (excluding bookmarkStart/bookmarkEnd pairs)
    all_ids = [x.get(W + 'id') for x in root.xpath('.//*[@w:id]', namespaces=NS)
               if etree.QName(x).localname not in ('bookmarkStart', 'bookmarkEnd')]
    assert len(all_ids) == len(set(all_ids)), 'Duplicate revision w:id detected!'

    parts['word/document.xml'] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)

    # Update docProps/core.xml title & modified timestamp
    core = etree.fromstring(parts['docProps/core.xml'])
    core.find('dc:title', NS).text = FULL_TITLE
    core.find('dcterms:modified', NS).text = stamp
    parts['docProps/core.xml'] = etree.tostring(core, xml_declaration=True, encoding='UTF-8', standalone=True)

    out_tracked = STAGE / NAMES['tracked']
    with ZipFile(out_tracked, 'w', ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)

    # Verify OOXML AcceptAll == staged/Clean & RejectAll == base_tracked
    with ZipFile(out_tracked) as z:
        patched_root = etree.fromstring(z.read('word/document.xml'))
        assert z.testzip() is None
    assert ooxml_reject_snapshot(patched_root) == ooxml_reject_snapshot(base_root), 'Baseline (RejectAll) changed!'
    acc_root = ooxml_accept_root(patched_root)
    acc_blocks = accepted_snapshot(acc_root)
    assert acc_blocks == clean_blocks, 'OOXML AcceptAll blocks do not match staged/Clean.docx!'

    # Check media superset/integrity & References alignment in Clean and TrackedChanges
    tracked_media = sorted(hashlib.sha256(ZipFile(out_tracked).read(n)).hexdigest()
                           for n in ZipFile(out_tracked).namelist() if n.startswith('word/media/'))
    assert set(clean_media).issubset(set(tracked_media)), 'Missing media image in TrackedChanges!'

    # Verify References alignments in Clean & TrackedChanges XML (no justification on References)
    for label, xml_root in (('Clean', etree.fromstring(ZipFile(clean_path).read('word/document.xml'))),
                            ('TrackedAccepted', acc_root)):
        ref_heading = next(p for p in xml_root.xpath('./w:body/w:p', namespaces=NS)
                           if ''.join(p.xpath('.//w:t/text()', namespaces=NS)) == 'References')
        jc = ref_heading.find('w:pPr/w:jc', NS)
        assert jc is None or jc.get(W + 'val') == 'left', (label, 'References heading not left')
        ref_ps = []
        seen = False
        for p in xml_root.xpath('./w:body/w:p', namespaces=NS):
            t = ''.join(p.xpath('.//w:t/text() | .//m:t/text()', namespaces=NS)).strip()
            if t == 'References':
                seen = True
                continue
            if seen:
                st = p.find('w:pPr/w:pStyle', NS)
                if st is not None and st.get(W + 'val', '').startswith('Heading'):
                    break
                if t:
                    ref_ps.append(p)
        assert len(ref_ps) == 25, (label, len(ref_ps))
        for p in ref_ps:
            pjc = p.find('w:pPr/w:jc', NS)
            assert pjc is None or pjc.get(W + 'val') == 'left', (label, 'Reference entry not left')

    proof = {
        'passed': True,
        'method': 'Surgical OOXML revision patch from Word-COM TrackedChanges baseline + spec OOXML Accept/Reject verification',
        'word_com_available': False,
        'word_com_blocker': 'Microsoft Word on host entered Product Activation Failed (KMS 0xC004F056), locking Word COM SaveAs2 and ExportAsFixedFormat',
        'tracked_base': str(base_tracked),
        'tracked_base_sha256': sha(base_tracked),
        'tracked_patched': str(out_tracked),
        'tracked_patched_sha256': sha(out_tracked),
        'clean': str(clean_path),
        'clean_sha256': sha(clean_path),
        'paragraphs_patched': patches,
        'baseline_reject_all_matches_base_tracked': True,
        'accepted_ooxml_matches_staged_clean_blocks_and_15_tables': True,
        'unique_revision_ids': len(all_ids),
        'author': AUTHOR,
        'affiliation': AFFILIATION,
        'orcid': ORCID,
        'language': 'en-GB',
        'experiments_rerun': False,
    }
    (WORK / 'ooxml_acceptance_proof_en.json').write_text(json.dumps(proof, indent=2), encoding='utf-8')
    print(json.dumps(proof, indent=2))


if __name__ == '__main__':
    main()
