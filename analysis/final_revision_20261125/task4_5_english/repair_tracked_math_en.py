"""Use a native OMML equation array so Word preserves each mathematical line."""
from document_helpers_en import *
from repair_tracked_paragraphs_en import projection
from docx.oxml import parse_xml
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

def main():
    authored = Document(WORK / 'qa_word/authored_clean_before_word.docx')
    paragraphs = [p._p for p in authored.paragraphs if p.style.name == 'Equation']
    assert len(paragraphs) == 8
    target_equations = []
    for number, old in enumerate(paragraphs, 1):
        temporary = newdoc()
        new = equation(temporary, number)._p
        old.getparent().replace(old, deepcopy(new))
        target_equations.append(deepcopy(new))
    authored.save(WORK / 'qa_word/authored_clean_with_multiline_math.docx')
    path = STAGE / NAMES['tracked']
    shutil.copy2(path, WORK / 'qa_word/tracked_before_multiline_math_repair.docx')
    with ZipFile(path) as archive:
        parts = {n: archive.read(n) for n in archive.namelist()}
    root = parse_xml(parts['word/document.xml'])
    # Native comparison may inherit the old heading alignment. Restore the
    # authored References paragraph properties without changing either text view.
    authored_references = next(p for p in authored.paragraphs if p.text == 'References')
    tracked_references = [p for p in root.xpath('./w:body/w:p')
                          if projection(p, True) == 'References']
    assert len(tracked_references) == 1
    reference_p = tracked_references[0]
    old_properties = reference_p.find(qn('w:pPr'))
    if old_properties is not None:
        reference_p.remove(old_properties)
    reference_p.insert(0, deepcopy(authored_references._p.pPr))
    tracked_equations = root.xpath('./w:body/w:p[w:pPr/w:pStyle[@w:val="Equation"]]')
    assert len(tracked_equations) == 8
    counter = max(int(x.get(qn('w:id'))) for x in root.xpath('.//*[@w:id]') if x.get(qn('w:id'),'').isdigit())
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    def revision(tag):
        nonlocal counter
        counter += 1
        value = OxmlElement('w:' + tag)
        value.set(qn('w:id'), str(counter))
        value.set(qn('w:author'), 'Codex')
        value.set(qn('w:date'), stamp)
        return value
    projection_before = projection(root, False)
    for old, new in zip(tracked_equations, target_equations):
        baseline = projection(old, False)
        for child in list(old):
            if child.tag not in (qn('w:pPr'), qn('w:bookmarkStart'), qn('w:bookmarkEnd')):
                old.remove(child)
        if baseline:
            deletion = revision('del')
            run, text = OxmlElement('w:r'), OxmlElement('w:delText')
            text.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
            text.text = baseline
            run.append(text)
            deletion.append(run)
            old.append(deletion)
        insertion = revision('ins')
        for child in new:
            if child.tag not in (qn('w:pPr'), qn('w:bookmarkStart'), qn('w:bookmarkEnd')):
                insertion.append(deepcopy(child))
        old.append(insertion)
        assert projection(old, False) == baseline
    assert projection(root, False) == projection_before
    parts['word/document.xml'] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
        for name,data in parts.items():
            archive.writestr(name,data)
    record = {'equations': 8, 'native_multiline_arrays': 6, 'old_text_fragments_preserved': True,
              'representation': 'One native OMML math object per equation with eqArr rows for multiline formulas',
              'model_results_changed': False, 'tracked_sha256': sha(path)}
    (WORK / 'tracked_math_repair_en.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    print(json.dumps(record, indent=2))

if __name__ == '__main__':
    main()
