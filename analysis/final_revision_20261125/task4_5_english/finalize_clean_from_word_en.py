"""Validate Word-accepted content against the authored data, then synchronise Clean and AltText."""
from document_helpers_en import *
from zipfile import ZipFile
import shutil

def root(path):
    with ZipFile(path) as archive:
        return etree.fromstring(archive.read('word/document.xml'))

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math'}

def cell_values(document):
    return [[[c.text for c in row.cells] for row in table.rows] for table in document.tables]

def semantic_blocks(path):
    document = root(path)
    result = []
    for block in document.find('w:body', NS):
        if block.tag == qn('w:sectPr'):
            continue
        text = ''.join(block.xpath('.//w:t/text() | .//m:t/text()', namespaces=NS))
        # Word canonicalises minus and prime characters inside native mathematics.
        if block.xpath('.//m:oMath', namespaces=NS):
            text = text.replace('−', '-').replace('′', "'")
        if not text and not block.xpath('.//w:drawing | .//w:br', namespaces=NS):
            continue
        result.append((etree.QName(block).localname, text))
    return result

def media(path):
    with ZipFile(path) as archive:
        return sorted(hashlib.sha256(archive.read(n)).hexdigest() for n in archive.namelist() if n.startswith('word/media/'))

def main():
    authored = WORK / 'qa_word/authored_clean_with_multiline_math.docx'
    accepted = WORK / 'qa_word/accepted_repaired_by_word.docx'
    a, b = Document(authored), Document(accepted)
    assert len(a.tables) == len(b.tables) == 15
    assert cell_values(a) == cell_values(b), 'Word acceptance changed a table cell or its row order.'
    assert semantic_blocks(authored) == semantic_blocks(accepted), 'Word acceptance changed authored content.'
    assert media(authored) == media(accepted), 'Word changed a scientific image.'
    rb = root(accepted)
    revisions = rb.xpath('.//w:ins | .//w:del | .//w:moveFrom | .//w:moveTo | .//w:pPrChange | .//w:rPrChange | .//w:tblPrChange | .//w:trPrChange | .//w:tcPrChange', namespaces=NS)
    assert not revisions
    assert not rb.xpath('.//w:highlight', namespaces=NS)
    assert len(rb.xpath('.//w:drawing', namespaces=NS)) == 9
    equations = rb.xpath('.//w:p[w:pPr/w:pStyle[@w:val="Equation"]]', namespaces=NS)
    assert len(equations) == 8
    assert len(rb.xpath('.//m:eqArr', namespaces=NS)) == 6
    assert [len(p.xpath('.//m:eqArr/m:e', namespaces=NS)) for p in equations] == [2, 0, 2, 0, 2, 2, 2, 3]
    assert b.core_properties.author == AUTHOR and b.core_properties.title == FULL_TITLE
    assert b.core_properties.language == 'en-GB'
    # The delivered Clean is exactly the file obtained through real Word Accept All.
    shutil.copy2(accepted, STAGE / NAMES['clean'])
    alt = Document(STAGE / NAMES['alt'])
    old_equations = [p._p for p in alt.paragraphs if p.style.name == 'Equation']
    assert len(old_equations) == 8
    for old, new in zip(old_equations, equations):
        old.getparent().replace(old, deepcopy(new))
    alt.save(STAGE / NAMES['alt'])
    ra = root(STAGE / NAMES['alt'])
    alt_equations = ra.xpath('.//w:p[w:pPr/w:pStyle[@w:val="Equation"]]', namespaces=NS)
    assert [etree.tostring(p, method='c14n', exclusive=True) for p in equations] == [etree.tostring(p, method='c14n', exclusive=True) for p in alt_equations]
    record = {
        'passed': True, 'authored_content_matches_real_word_acceptance': True,
        'all_15_tables_and_cell_values_identical': True,
        'all_9_embedded_scientific_images_identical': True,
        'all_8_native_equations_synchronised_to_alttext': True,
        'six_native_multiline_equation_arrays_preserved_by_word': True,
        'clean_has_no_revisions_or_highlights': True,
        'clean_is_byte_identical_to_actual_word_accepted_file': sha(accepted) == sha(STAGE / NAMES['clean']),
        'clean_sha256': sha(STAGE / NAMES['clean']), 'accepted_sha256': sha(accepted),
        'intentional_word_serialisation': 'Word canonicalises native math minus/prime characters and retains four empty comparison paragraphs; all authored text, numerical cells and scientific images are unchanged.',
        'table_rows_including_headers': [len(t.rows) for t in b.tables],
        'author': AUTHOR, 'affiliation': '', 'orcid': '', 'language': 'en-GB',
        'experiments_rerun': False,
    }
    (WORK / 'accepted_clean_fidelity_en.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    print(json.dumps(record, indent=2))

if __name__ == '__main__':
    main()
