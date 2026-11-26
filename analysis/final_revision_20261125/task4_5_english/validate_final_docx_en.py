"""Validate the five English DOCX files without rendering or running experiments."""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
from lxml import etree
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm

WORK = Path(__file__).resolve().parent
ROOT = WORK.parents[2]
NAMES = [
    'HYDRO_D_26_00188_Revision1_Clean.docx',
    'HYDRO_D_26_00188_TrackedChanges.docx',
    'HYDRO_D_26_00188_Response_to_Reviewers.docx',
    'HYDRO_D_26_00188_AltText.docx', 'Cover_Letter.docx',
]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def effective(paragraph, attribute):
    value = getattr(paragraph.paragraph_format, attribute)
    style = paragraph.style
    while value is None and style is not None:
        value = getattr(style.paragraph_format, attribute)
        style = style.base_style
    if value is None and attribute == 'alignment':
        # Word omits redundant LEFT properties when saving. The inherited
        # OOXML default is LEFT, independently confirmed in Word COM below.
        return WD_ALIGN_PARAGRAPH.LEFT
    return value


def main():
    checks = {}
    def check(name, condition):
        checks[name] = bool(condition)
        assert condition, name

    docs = {}
    for name in NAMES:
        path = WORK / 'staged' / name
        with ZipFile(path) as archive:
            check(name + ' ZIP integrity', archive.testzip() is None)
            xmls = [etree.fromstring(archive.read(n)) for n in archive.namelist()
                    if n.endswith('.xml') or n.endswith('.rels')]
            # A genuine redline retains baseline deletions, including the old
            # release placeholder. Check the current accepted view in every part.
            current_text = [''.join(x.xpath(
                './/w:t[not(ancestor::w:del) and not(ancestor::w:moveFrom)]/text()',
                namespaces=NS)) for x in xmls]
            check(name + ' no current PENDING RELEASE', all(
                'PENDING RELEASE' not in text.upper() for text in current_text))
        docs[name] = Document(path)
        check(name + ' English metadata', docs[name].core_properties.language == 'en-GB')

    clean = docs[NAMES[0]]
    check('15 editable tables', len(clean.tables) == 15)
    widths = {'7': [2.6, 1.3, 2.2, 2.2, 2.4, 5.7],
              '11': [2.7, 1.6, 3.1, 2.9, 3.9, 2.2],
              'B1': [2.7, 1.3, 5.8, 3.3, 3.3]}
    indices = {'7': 6, '11': 10, 'B1': 14}
    width_evidence = {}
    for number, expected in widths.items():
        table = clean.tables[indices[number]]
        actual = [c.width.twips for c in table.columns]
        target = [Cm(v).twips for v in expected]
        width_evidence[number] = {'actual_twips': actual, 'expected_twips': target}
        check('Table ' + number + ' grid widths', actual == target)
        check('Table ' + number + ' every cell width', all(
            [c.width.twips for c in row.cells] == target for row in table.rows))

    for number in (7, 8):
        matches = [p for p in clean.paragraphs if p.text.startswith(f'Figure {number} ')]
        check(f'Figure {number} caption keeps together',
              len(matches) == 1 and effective(matches[0], 'keep_together') is True)
    table12 = clean.tables[11]
    note_element = table12._tbl.getnext()
    while note_element is not None and not ''.join(note_element.itertext()).strip():
        note_element = note_element.getnext()
    notes = [p for p in clean.paragraphs if p._p is note_element]
    check('Table 12 notes keep together', len(notes) == 1 and
          notes[0].text.startswith('Each row has ten untimed warmup passes') and
          effective(notes[0], 'keep_together') is True)
    check('Table 12 last row keeps with notes', all(
        effective(p, 'keep_with_next') is True
        for c in table12.rows[-1].cells for p in c.paragraphs))

    references = [p for p in clean.paragraphs if p.text == 'References']
    check('References heading effective LEFT', len(references) == 1 and
          effective(references[0], 'alignment') == WD_ALIGN_PARAGRAPH.LEFT)
    ref_start = next(
        i for i, p in enumerate(clean.paragraphs) if p.text == 'References')
    ref_entries = []
    for p in clean.paragraphs[ref_start + 1:]:
        if p.style.name.startswith('Heading'):
            break
        if p.text.strip():
            ref_entries.append(p)
    check('25 left aligned reference entries', len(ref_entries) == 25 and all(
        effective(p, 'alignment') == WD_ALIGN_PARAGRAPH.LEFT for p in ref_entries))

    alt = docs[NAMES[3]]
    eq8 = next(i for i, p in enumerate(alt.paragraphs)
               if p.text.startswith('Equation 8 Conditional reputation update'))
    title, description, equation = alt.paragraphs[eq8:eq8 + 3]
    check('AltText Equation 8 title keeps with description',
          effective(title, 'keep_with_next') is True)
    check('AltText Equation 8 description keeps with equation',
          effective(description, 'keep_with_next') is True and
          effective(description, 'keep_together') is True)
    check('AltText Equation 8 native equation keeps together',
          equation.style.name == 'Equation' and
          effective(equation, 'keep_together') is True and
          len(equation._p.xpath('.//m:eqArr/m:e')) == 3)

    ooxml_proof_path = WORK / 'ooxml_acceptance_proof_en.json'
    word_proof_path = WORK / 'word_acceptance_proof_en.json'
    acceptance = json.loads(word_proof_path.read_text(encoding='utf-8-sig'))
    if acceptance.get('tracked_sha256') == sha(WORK / 'staged' / NAMES[1]):
        fidelity = json.loads((WORK / 'accepted_clean_fidelity_en.json').read_text(encoding='utf-8'))
        check('accepted_clean_fidelity passed', fidelity['passed'] is True)
        accepted = WORK / 'qa_word/accepted_repaired_by_word.docx'
        check('Clean byte identical to real Word AcceptAll',
              sha(accepted) == sha(WORK / 'staged' / NAMES[0]) == fidelity['clean_sha256'])
        check('Word accepted all revisions', acceptance['revisions_before'] > 0 and
              acceptance['revisions_after'] == 0 and acceptance['tracked_input_unchanged'])
        check('Word COM confirms References LEFT (0)',
              acceptance['references_heading_alignment_word'] == 0 and
              acceptance['reference_entry_alignments_word'] == [0] * 25)
        verification_mode = 'microsoft_word_com_accept_all'
    else:
        assert ooxml_proof_path.exists(), 'Neither Word COM nor OOXML proof matches current TrackedChanges.'
        ooxml_proof = json.loads(ooxml_proof_path.read_text(encoding='utf-8'))
        check('OOXML acceptance proof passed', ooxml_proof['passed'] is True)
        check('OOXML proof identifies current Clean and TrackedChanges',
              ooxml_proof['clean_sha256'] == sha(WORK / 'staged' / NAMES[0]) and
              ooxml_proof['tracked_patched_sha256'] == sha(WORK / 'staged' / NAMES[1]))
        check('TrackedChanges RejectAll baseline matches Word base',
              ooxml_proof['baseline_reject_all_matches_base_tracked'] is True)
        check('TrackedChanges AcceptAll matches staged Clean blocks and 15 tables',
              ooxml_proof['accepted_ooxml_matches_staged_clean_blocks_and_15_tables'] is True)
        with ZipFile(WORK / 'staged' / NAMES[0]) as clean_zip, ZipFile(WORK / 'staged' / NAMES[1]) as tracked_zip:
            clean_doc_xml = etree.fromstring(clean_zip.read('word/document.xml'))
            clean_revs = clean_doc_xml.xpath(
                './/w:ins | .//w:del | .//w:moveFrom | .//w:moveTo | .//w:pPrChange | .//w:rPrChange | .//w:tblPrChange | .//w:trPrChange | .//w:tcPrChange',
                namespaces=NS)
            check('Clean has zero tracked revisions or highlights',
                  not clean_revs and not clean_doc_xml.xpath('.//w:highlight', namespaces=NS))
            tracked_settings = etree.fromstring(tracked_zip.read('word/settings.xml'))
            check('TrackedChanges enables w:trackRevisions',
                  bool(tracked_settings.xpath('.//w:trackRevisions', namespaces=NS)))
            tracked_doc_xml = etree.fromstring(tracked_zip.read('word/document.xml'))
            ids = [x.get('{' + NS['w'] + '}id') for x in tracked_doc_xml.xpath('.//*[@w:id]', namespaces=NS)
                   if etree.QName(x).localname not in ('bookmarkStart', 'bookmarkEnd')]
            check('TrackedChanges has unique revision w:id attributes', len(ids) == len(set(ids)) and len(ids) > 0)
        verification_mode = 'ooxml_spec_accept_reject_proof_plus_libreoffice_render'

    registry = json.loads((WORK / 'table_registry_en.json').read_text(encoding='utf-8'))
    before = json.loads((WORK / 'qa/table_registry_before.json').read_text(encoding='utf-8'))
    check('All authored scientific table values unchanged', registry == before)
    check('All accepted scientific table values match registry',
          [[[c.text for c in row.cells] for row in t.rows[1:]] for t in clean.tables] ==
          [t['values'] for t in registry])
    snapshot = json.loads((WORK / 'qa/scientific_snapshot_before.json').read_text(encoding='utf-8'))
    changed = [p for p, value in snapshot.items() if sha(ROOT / p) != value]
    check('All selected scientific source artifacts unchanged', not changed)

    release = json.loads((WORK / 'release_publication_en.json').read_text(encoding='utf-8'))
    check('Published Release is immutable', release['immutable'] is True and not release['draft'])
    release_url = release['html_url']
    for index in (0, 2, 4):
        check(NAMES[index] + ' contains verified Release URL',
              release_url in '\n'.join(p.text for p in docs[NAMES[index]].paragraphs))

    expected_title = 'Browser-based hydrological forecasting under input interruptions and crowdsourced evidence verification'
    expected_subtitle = 'A Vietnam case study with an observed Iowa discharge benchmark'
    expected_full_title = expected_title + ': ' + expected_subtitle
    expected_affiliation = 'Hanoi University of Business and Technology, Hanoi, Vietnam'
    expected_orcid = '0009-0005-0529-2131'
    check('Clean has punctuated title and subtitle',
          clean.paragraphs[0].text == expected_title and clean.paragraphs[1].text == expected_subtitle and
          clean.core_properties.title == expected_full_title)
    check('Response Cover and AltText contain full colon-joined title',
          all(expected_full_title in '\n'.join(p.text for p in docs[NAMES[i]].paragraphs) for i in (2, 3, 4)))
    for index in (0, 2, 4):
        joined = '\n'.join(p.text for p in docs[NAMES[index]].paragraphs)
        check(NAMES[index] + ' contains completed affiliation and ORCID',
              expected_affiliation in joined and expected_orcid in joined)
    for name in NAMES:
        with ZipFile(WORK / 'staged' / name) as archive:
            xmls = [etree.fromstring(archive.read(n)) for n in archive.namelist()
                    if n.endswith('.xml') or n.endswith('.rels')]
            current = '\n'.join(''.join(x.xpath('.//w:t[not(ancestor::w:del) and not(ancestor::w:moveFrom)]/text()', namespaces=NS)) for x in xmls)
            for forbidden in ('quantization', 'characterized', 'dequantized', 'summarizes',
                              'remain blank', 'for author completion', 'Author review before submission:',
                              'PENDING AUTHOR'):
                check(f'{name} excludes stale text ({forbidden})', forbidden not in current)
    abstract_idx = next(i for i, p in enumerate(clean.paragraphs) if p.text == 'Abstract')
    abstract_text = clean.paragraphs[abstract_idx + 1].text
    check('Abstract within 200-word limit and expands key abbreviations',
          len(abstract_text.split()) <= 200 and
          'mean absolute error (MAE)' in abstract_text and
          'Long Short-Term Memory (LSTM)' in abstract_text and
          'U.S. Geological Survey (USGS)' in abstract_text)
    check('All 25 references use uniform First Last names and clean spacing',
          all(',' not in p.text.split(' (', 1)[0] and '  ' not in p.text for p in ref_entries))

    report = {'passed': all(checks.values()), 'verification_mode': verification_mode, 'checks': checks,
              'table_widths': width_evidence, 'scientific_files_unchanged': len(snapshot),
              'release_url': release_url, 'release_immutable': release['immutable'],
              'sha256': {n: sha(WORK / 'staged' / n) for n in NAMES},
              'experiments_rerun': False, 'scientific_data_modified': False,
              'png_or_pdf_rendering_performed': False}
    (WORK / 'final_docx_validation_en.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
