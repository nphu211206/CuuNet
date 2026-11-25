"""Restore four corrupted inserted labels from the authored English table."""
from document_helpers_en import *
from docx.oxml import parse_xml
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

def main():
    path = STAGE / NAMES['tracked']
    backup = WORK / 'qa_word/tracked_before_label_repair.docx'
    shutil.copy2(path, backup)
    authored = Document(WORK / 'qa_word/authored_clean_before_word.docx')
    with ZipFile(path) as archive:
        parts = {n: archive.read(n) for n in archive.namelist()}
    root = parse_xml(parts['word/document.xml'])
    table = root.xpath('./w:body/w:tbl')[3]
    deletions_before = root.xpath('.//w:delText/text()')
    repairs = []
    for row_index in (2, 5, 22, 25):
        cell = table.xpath('./w:tr')[row_index].xpath('./w:tc')[0]
        nodes = cell.xpath('.//w:ins//w:t')
        assert len(nodes) == 1
        expected = authored.tables[3].rows[row_index].cells[0].text
        repairs.append({'table': 4, 'row_including_header': row_index, 'old_inserted_label': nodes[0].text,
                        'correct_authored_label': expected})
        nodes[0].text = expected
        nodes[0].set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    assert deletions_before == root.xpath('.//w:delText/text()')
    parts['word/document.xml'] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
        for name,data in parts.items():
            archive.writestr(name,data)
    record = {'scope': 'Repair inserted region labels generated incorrectly by the native comparison engine',
              'repairs': repairs, 'all_baseline_deletion_text_unchanged': True,
              'all_numeric_cells_unchanged': True, 'other_package_parts_unchanged': True,
              'tracked_source_sha256': sha(backup), 'tracked_repaired_sha256': sha(path)}
    (WORK / 'tracked_label_repair_en.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(record, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
