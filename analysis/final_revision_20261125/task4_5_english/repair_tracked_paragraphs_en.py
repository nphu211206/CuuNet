"""Replace malformed comparison insertions, retaining their original deleted text."""
from document_helpers_en import *
from docx.oxml import parse_xml
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

def projection(element, accept):
    pieces = []
    for node in element.xpath('.//w:t | .//w:delText | .//m:t'):
        parents = list(node.iterancestors())
        inserted = any(x.tag in (qn('w:ins'), qn('w:moveTo')) for x in parents)
        deleted = any(x.tag in (qn('w:del'), qn('w:moveFrom')) for x in parents) or node.tag == qn('w:delText')
        if (accept and not deleted) or (not accept and not inserted):
            pieces.append(node.text or '')
    return ''.join(pieces)

def main():
    path = STAGE / NAMES['tracked']
    backup = WORK / 'qa_word/tracked_before_paragraph_repair.docx'
    shutil.copy2(path, backup)
    a = Document(WORK / 'qa_word/authored_clean_before_word.docx')
    b = Document(WORK / 'qa_word/accepted_repaired_by_word.docx')
    authored = [p for p in a.paragraphs if p.text and p.style.name != 'Equation']
    accepted = [p for p in b.paragraphs if p.text and p.style.name != 'Equation']
    assert len(authored) == len(accepted)
    with ZipFile(path) as archive:
        parts = {n: archive.read(n) for n in archive.namelist()}
    root = parse_xml(parts['word/document.xml'])
    ids = [int(x.get(qn('w:id'))) for x in root.xpath('.//*[@w:id]') if x.get(qn('w:id'), '').isdigit()]
    counter = max(ids, default=0)
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    def revision(tag):
        nonlocal counter
        counter += 1
        value = OxmlElement('w:' + tag)
        value.set(qn('w:id'), str(counter))
        value.set(qn('w:author'), 'Codex')
        value.set(qn('w:date'), stamp)
        return value
    repairs = []
    for expected, actual in zip(authored, accepted):
        if expected.text == actual.text:
            continue
        candidates = [p for p in root.xpath('./w:body/w:p') if projection(p, True) == actual.text]
        assert len(candidates) == 1, 'Cannot uniquely locate malformed comparison paragraph.'
        paragraph = candidates[0]
        old_text = projection(paragraph, False)
        for child in list(paragraph):
            if child.tag != qn('w:pPr'):
                paragraph.remove(child)
        if old_text:
            deletion = revision('del')
            run = OxmlElement('w:r')
            text = OxmlElement('w:delText')
            text.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
            text.text = old_text
            run.append(text)
            deletion.append(run)
            paragraph.append(deletion)
        insertion = revision('ins')
        for child in expected._p:
            if child.tag != qn('w:pPr'):
                insertion.append(deepcopy(child))
        paragraph.append(insertion)
        assert projection(paragraph, True) == expected.text
        assert projection(paragraph, False) == old_text
        repairs.append({'authored_prefix': expected.text[:110], 'malformed_accepted_text': actual.text,
                        'correct_authored_text': expected.text, 'original_deletion_text_preserved': old_text})
    assert len(repairs) == 5
    parts['word/document.xml'] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
        for name,data in parts.items():
            archive.writestr(name,data)
    (WORK / 'tracked_paragraph_repair_en.json').write_text(json.dumps({
        'scope': 'Repair malformed native comparison insertions while retaining their baseline text',
        'paragraphs_repaired': len(repairs), 'repairs': repairs,
        'other_package_parts_unchanged': True, 'tracked_repaired_sha256': sha(path),
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'paragraphs_repaired': len(repairs), 'original_baseline_text_preserved': True,
                      'tracked_sha256': sha(path)}, indent=2))

if __name__ == '__main__':
    main()
