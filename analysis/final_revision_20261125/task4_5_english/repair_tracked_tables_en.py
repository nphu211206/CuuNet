"""Repair a Word comparison table seam without changing any tracked report text."""
from document_helpers_en import *
from zipfile import ZipFile, ZIP_DEFLATED
from docx.oxml import parse_xml
import shutil

def main():
    path = STAGE / NAMES['tracked']
    backup = WORK / 'qa_word/tracked_before_table_repair.docx'
    shutil.copy2(path, backup)
    with ZipFile(path) as archive:
        parts = {n: archive.read(n) for n in archive.namelist()}
    root = parse_xml(parts['word/document.xml'])
    text_before = root.xpath('.//w:t/text() | .//w:delText/text() | .//m:t/text()')
    tables = root.xpath('./w:body/w:tbl')
    left = next(t for t in tables if ''.join(t.getprevious().xpath('.//w:t/text()')).startswith('Table 5 One day test forecasts in Iowa'))
    middle, right = left.getnext(), left.getnext().getnext()
    assert middle.tag == qn('w:tbl') and right.tag == qn('w:tbl')
    assert len(middle.xpath('./w:tr')) == len(middle.xpath('./w:tr[w:trPr/w:del]')) == 1
    assert ''.join(right.xpath('./w:tr[1]//w:t/text()')).startswith('USGS 05421000Seasonal persistence')
    assert len(left.xpath('./w:tr')) + len(right.xpath('./w:tr')) == 31
    moved = 0
    for fragment in (middle, right):
        for row in list(fragment.xpath('./w:tr')):
            fragment.remove(row)
            left.append(row)
            moved += 1
        fragment.getparent().remove(fragment)
    assert text_before == root.xpath('.//w:t/text() | .//w:delText/text() | .//m:t/text()')
    assert len(left.xpath('./w:tr')) == 32
    parts['word/document.xml'] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
        for name,data in parts.items():
            archive.writestr(name, data)
    record = {'scope': 'Join Word comparison fragments of Table 5 into the intended single six-column table',
              'tracked_source_sha256': sha(backup), 'tracked_repaired_sha256': sha(path),
              'rows_in_tracked_table': 32, 'fully_deleted_legacy_rows': 1,
              'expected_rows_after_acceptance': 31, 'row_text_unchanged': True,
              'all_document_text_and_deletion_text_unchanged': True,
              'moved_rows': moved, 'other_package_parts_unchanged': True}
    (WORK / 'tracked_table_repair_en.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    print(json.dumps(record, indent=2))

if __name__ == '__main__':
    main()
