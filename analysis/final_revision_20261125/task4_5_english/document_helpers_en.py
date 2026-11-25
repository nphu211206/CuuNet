"""Shared English manuscript structure, native Word mathematics and audited tables."""
from pathlib import Path
from copy import deepcopy
from datetime import datetime, timezone
import csv, hashlib, json, re
from lxml import etree
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

WORK = Path(__file__).resolve().parent
ROOT = WORK.parents[2]
BASELINE = WORK / 'source_backup_20261125'
STAGE = WORK / 'staged'
STAGE.mkdir(exist_ok=True)
TITLE = 'Browser based hydrological forecasting under input interruptions and crowdsourced evidence verification'
SUBTITLE = 'A Vietnam case study with an observed Iowa discharge benchmark'
FULL_TITLE = TITLE + ' ' + SUBTITLE
AUTHOR = 'Phu Toan Nguyen'
EMAIL = 'nphu211206@gmail.com'
NAMES = {'clean': 'HYDRO_D_26_00188_Revision1_Clean.docx', 'tracked': 'HYDRO_D_26_00188_TrackedChanges.docx',
         'response': 'HYDRO_D_26_00188_Response_to_Reviewers.docx', 'alt': 'HYDRO_D_26_00188_AltText.docx',
         'cover': 'Cover_Letter.docx'}
VN = ['Bao_Ha_Runoff', 'Gianh_Runoff', 'Can_Tho_Runoff']
IOWA = ['USGS_06903900', 'USGS_05421000', 'USGS_05453520']
ZONES = VN + IOWA
LABELS = {'Bao_Ha_Runoff': 'Bảo Hà', 'Gianh_Runoff': 'Sông Gianh', 'Can_Tho_Runoff': 'Cần Thơ',
          **{x: x.replace('_', ' ') for x in IOWA}}
MODELS = ['persistence', 'seasonal_persistence', 'moving_average', 'linear_trend', 'seasonal_decomposition',
          'equal_weight_ensemble', 'expected_mse_ensemble', 'lstm_no_attention', 'ta_lstm', 'ta_lstm_outage']
MODEL_NAMES = {'persistence': 'Persistence', 'seasonal_persistence': 'Seasonal persistence',
               'moving_average': 'MA (7 days)', 'linear_trend': 'Linear trend',
               'seasonal_decomposition': 'Seasonal decomposition', 'equal_weight_ensemble': 'Equal-weight ensemble',
               'expected_mse_ensemble': 'Expected-MSE ensemble', 'lstm_no_attention': 'LSTM',
               'ta_lstm': 'TA-LSTM', 'ta_lstm_outage': 'Censored TA-LSTM'}
FROZEN_TABLES = json.loads((WORK / 'manuscript_evidence_en.json').read_text(encoding='utf-8'))['tables']
FIGURES = json.loads((ROOT / 'paper_submission/figures_final_results_20261125_english/figure_manifest_en.json').read_text(encoding='utf-8'))
TABLES = []

EQ = {
    1: ('Nonnegative forecast combination',
        ['w* = arg min wᵀQw', 'wᵢ ≥ 0; Σᵢ wᵢ = 1'],
        'Choose nonnegative forecast weights that sum to one and minimise the estimated expected squared error of the combination. The minimisation is over the weight vector w.'),
    2: ('Bias aware error matrix',
        ['Q = (1 − λ)Σ̂ + λ diag(Σ̂) + bbᵀ;  λ = 0.10'],
        'The matrix Q is sample error covariance shrunk towards its diagonal, plus the outer product of the mean error vector b. Sample covariance uses the n minus one denominator; the prespecified primary shrinkage coefficient is 0.10.'),
    3: ('Additive temporal attention',
        ['sₜ = vᵀ tanh(Whₜ + a)', 'αₜ = exp(sₜ) / Σⱼ exp(sⱼ);  z = Σₜ αₜhₜ'],
        'Score each temporal hidden state using additive attention, normalise the scores with a softmax over time and form a weighted context vector. This is temporal attention and has no spatial mechanism.'),
    4: ('Discounted report support',
        ['aᵢ = min[0.95, Rᵢ exp(−(dᵢ/ε)²) exp(−tᵢ/T) τᵢ]'],
        'Discount a report’s reputation by its distance from the selected cluster centroid, its age and a bounded simulated terrain factor, then cap effective support at 0.95. The primary distance scale is one kilometre and the age scale six hours.'),
    5: ('Maximum support within a group',
        ['pɡ = max aᵢ for i in g with claim D', 'nɡ = max aᵢ for i in g with claim N'],
        'Within each geographic and temporal group g, retain the strongest support for event D and the strongest support for no event N separately. The maximum of an absent claim is defined as zero. Exact repeated evidence in the same group does not increase support.'),
    6: ('Normalised Dempster combination',
        ['m(A) = [Σᴮ∩ᶜ⁼ᴬ m₁(B)m₂(C)] / (1 − K)', 'K = Σᴮ∩ᶜ⁼∅ m₁(B)m₂(C)'],
        'For each nonempty set A, sum products of masses whose intersection is A, then divide by one minus conflict K. Conflict sums products whose intersection is empty. Numerical total conflict is unresolved rather than a confident decision.'),
    7: ('Two sided decision rule',
        ['action = alert if m(D) ≥ q; reject if m(N) ≥ q', 'action = unresolved otherwise;  q = 0.75'],
        'Issue an alert or rejection only when the corresponding singleton mass reaches 0.75; otherwise abstain. With an active event in the simulation, abstention counts as a missed alert.'),
    8: ('Conditional reputation update',
        ['R′ = clip(αR + tanh(βu), 0, 1) for judged agreement',
         'R′ = clip(αR − η, 0, 1) for judged contradiction',
         'R′ = R when no judgment is available'],
        'When a feedback label is available, retain reputation with alpha and add a bounded reward for agreement or subtract a penalty for contradiction. Alpha is 0.90, beta is 0.10 and eta is 0.30; u counts other same-claim reports. Without a verified label, reputation remains unchanged. Independent-reference and self-consensus feedback are separate simulation regimes.'),
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def fmt(value, digits=3):
    return f'{float(value):.{digits}f}'

def ms(row, metric, digits=3):
    value = fmt(row[metric + '_mean'], digits)
    return value + ' ± ' + fmt(row[metric + '_seed_sd'], digits) if int(row['seeds']) else value

def ci(row, metric, digits=3):
    return fmt(row[metric + '_difference'], digits) + ' [' + fmt(row[metric + '_ci_low'], digits) + ', ' + fmt(row[metric + '_ci_high'], digits) + ']'

def unit(zone):
    return 'mm/day' if zone in VN else 'm³/s'

def style_fonts(style, name='Times New Roman'):
    style.font.name = name
    fonts = style.element.get_or_add_rPr().get_or_add_rFonts()
    for key in ('ascii', 'hAnsi', 'eastAsia', 'cs'):
        fonts.set(qn('w:' + key), name)
    for key in ('asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme'):
        fonts.attrib.pop(qn('w:' + key), None)

def newdoc(title=FULL_TITLE):
    d = Document()
    section = d.sections[0]
    section.page_width, section.page_height = Cm(21), Cm(29.7)
    section.top_margin = section.bottom_margin = Cm(2.1)
    section.left_margin = section.right_margin = Cm(2.3)
    for border in list(d.styles.element.xpath('.//w:pBdr')):
        border.getparent().remove(border)
    normal = d.styles['Normal']
    style_fonts(normal)
    normal.font.size = Pt(11)
    normal.paragraph_format.line_spacing = 1.1
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.widow_control = True
    lang = OxmlElement('w:lang')
    lang.set(qn('w:val'), 'en-GB')
    normal.element.get_or_add_rPr().append(lang)
    for name, size in (('Title', 16), ('Heading 1', 13), ('Heading 2', 11.5), ('Heading 3', 11)):
        style = d.styles[name]
        style_fonts(style)
        style.font.size, style.font.bold = Pt(size), True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.font.underline = False
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.space_before = Pt(9)
        style.paragraph_format.space_after = Pt(5)
        for color in style.element.xpath('.//w:color'):
            color.attrib.pop(qn('w:themeColor'), None)
            color.set(qn('w:val'), '000000')
    caption = d.styles['Caption']
    style_fonts(caption)
    caption.font.size, caption.font.italic, caption.font.bold = Pt(9.5), False, False
    caption.font.color.rgb = RGBColor(0, 0, 0)
    caption.paragraph_format.line_spacing = 1.05
    caption.paragraph_format.space_after = Pt(7)
    caption.paragraph_format.keep_with_next = False
    if 'Equation' not in d.styles:
        d.styles.add_style('Equation', 1)
    equation_style = d.styles['Equation']
    equation_style.base_style = normal
    equation_style.paragraph_format.keep_together = True
    equation_style.paragraph_format.space_before = Pt(4)
    equation_style.paragraph_format.space_after = Pt(6)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    field = OxmlElement('w:fldSimple')
    field.set(qn('w:instr'), 'PAGE')
    run, text = OxmlElement('w:r'), OxmlElement('w:t')
    text.text = '1'
    run.append(text)
    field.append(run)
    footer._p.append(field)
    d.core_properties.title, d.core_properties.author = title, AUTHOR
    d.core_properties.language = 'en-GB'
    d.core_properties.subject = 'HYDRO-D-26-00188 hydrological forecasting and local evidence aggregation'
    d.core_properties.category = 'HYDRO-D-26-00188'
    d.core_properties.comments = ''
    d.core_properties.modified = datetime.now(timezone.utc)
    d.settings._element.append(OxmlElement('w:doNotAutoCompressPictures'))
    return d

def para(d, text, style=None):
    p = d.add_paragraph(text, style=style)
    if style is None:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return p

def heading(d, text, level=1):
    return para(d, text, 'Heading ' + str(level))

def table(d, number, title, headers, rows, widths, notes=None, small=9):
    assert abs(sum(widths) - 16.4) < .05, (number, widths)
    caption = para(d, f'Table {number} {title}', 'Caption')
    caption.runs[0].font.bold = True
    caption.paragraph_format.keep_with_next = True
    t = d.add_table(rows=1, cols=len(headers))
    t.autofit = False
    for col, width in zip(t.columns, widths):
        col.width = Cm(width)
    borders = OxmlElement('w:tblBorders')
    for key in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        item = OxmlElement('w:' + key)
        for attribute, value in (('val', 'single'), ('sz', '4'), ('color', 'D9D9D9')):
            item.set(qn('w:' + attribute), value)
        borders.append(item)
    t._tbl.tblPr.append(borders)
    margins = OxmlElement('w:tblCellMar')
    for key, value in (('top', '70'), ('bottom', '70'), ('left', '80'), ('right', '80')):
        item = OxmlElement('w:' + key)
        item.set(qn('w:w'), value)
        item.set(qn('w:type'), 'dxa')
        margins.append(item)
    t._tbl.tblPr.append(margins)
    for cell, value, width in zip(t.rows[0].cells, headers, widths):
        cell.text, cell.width = str(value), Cm(width)
    for values in rows:
        for cell, value, width in zip(t.add_row().cells, values, widths):
            cell.text, cell.width = str(value), Cm(width)
    for i, row in enumerate(t.rows):
        pr = row._tr.get_or_add_trPr()
        pr.append(OxmlElement('w:cantSplit'))
        if i == 0:
            pr.append(OxmlElement('w:tblHeader'))
        is_last = (i == len(t.rows) - 1)
        for j, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if i == 0:
                shade = OxmlElement('w:shd')
                shade.set(qn('w:fill'), 'E8ECEF')
                cell._tc.get_or_add_tcPr().append(shade)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.line_spacing = 1.02
                if notes and is_last:
                    p.paragraph_format.keep_with_next = True
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if j < 2 else WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size, run.font.bold = Pt(small), i == 0
                    run.font.color.rgb = RGBColor(0, 0, 0)
    if notes:
        note_p = para(d, notes, 'Caption')
        note_p.paragraph_format.keep_together = True
    else:
        spacer = d.add_paragraph()
        spacer.paragraph_format.space_after = Pt(3)
        spacer.paragraph_format.space_before = Pt(0)
        spacer.paragraph_format.line_spacing = Pt(3)
    TABLES.append({'number': str(number), 'title': title, 'rows': len(rows), 'headers': headers, 'values': rows})
    return t

def figure(d, number, width=15.8):
    info = FIGURES[str(number)]
    p = d.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.keep_together = True
    p.paragraph_format.space_before, p.paragraph_format.space_after = Pt(4), Pt(3)
    with Image.open(info['path']) as image:
        width = min(width, 12.5*image.width/image.height)
    shape = p.add_run().add_picture(info['path'], width=Cm(width))
    shape._inline.docPr.set('descr', info['alt'])
    shape._inline.docPr.set('title', f'Figure {number} ' + info['title'])
    caption = para(d, '', 'Caption')
    caption.paragraph_format.keep_together = True
    caption.add_run(f'Figure {number} {info["title"]}. ').bold = True
    caption.add_run(info['caption'])

def _math_text(parent, text):
    if not text:
        return
    run, props = OxmlElement('m:r'), OxmlElement('m:rPr')
    props.append(OxmlElement('m:nor'))
    run.append(props)
    wrpr, fonts = OxmlElement('w:rPr'), OxmlElement('w:rFonts')
    fonts.set(qn('w:ascii'), 'Cambria Math')
    fonts.set(qn('w:hAnsi'), 'Cambria Math')
    wrpr.append(fonts)
    size = OxmlElement('w:sz')
    size.set(qn('w:val'), '22')
    wrpr.append(size)
    run.append(wrpr)
    item = OxmlElement('m:t')
    item.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    item.text = text
    run.append(item)
    parent.append(run)

def _script(parent, base_text, value, superscript=False):
    item = OxmlElement('m:sSup' if superscript else 'm:sSub')
    base = OxmlElement('m:e')
    _math_text(base, base_text)
    item.append(base)
    index = OxmlElement('m:sup' if superscript else 'm:sub')
    _math_text(index, value)
    item.append(index)
    parent.append(item)

def _math_line(parent, text):
    scripts = {'ₜ': ('t', False), 'ᵢ': ('i', False), 'ⱼ': ('j', False), 'ɡ': ('g', False),
               '₁': ('1', False), '₂': ('2', False), 'ᵀ': ('T', True), '²': ('2', True)}
    buffer = ''
    for char in text:
        if char == '\u0302' and buffer:
            _math_text(parent, buffer[:-1])
            accent = OxmlElement('m:acc')
            props, character = OxmlElement('m:accPr'), OxmlElement('m:chr')
            character.set(qn('m:val'), '\u0302')
            props.append(character)
            accent.append(props)
            base = OxmlElement('m:e')
            _math_text(base, buffer[-1])
            accent.append(base)
            parent.append(accent)
            buffer = ''
        elif char in scripts and buffer:
            _math_text(parent, buffer[:-1])
            value, superscript = scripts[char]
            _script(parent, buffer[-1], value, superscript)
            buffer = ''
        else:
            buffer += char
    _math_text(parent, buffer)

def equation(d, number):
    title, lines, alt = EQ[number]
    p = d.add_paragraph(style='Equation')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    start = OxmlElement('w:bookmarkStart')
    start.set(qn('w:id'), str(number + 100))
    start.set(qn('w:name'), f'Equation_{number}')
    p._p.append(start)
    math = OxmlElement('m:oMath')
    array = None
    if len(lines) > 1:
        array = OxmlElement('m:eqArr')
        properties, alignment = OxmlElement('m:eqArrPr'), OxmlElement('m:baseJc')
        alignment.set(qn('m:val'), 'center')
        properties.append(alignment)
        array.append(properties)
        math.append(array)
    for i, line in enumerate(lines):
        target = OxmlElement('m:e') if array is not None else math
        if number == 1 and i == 0:
            _script(target, 'w', '*', True)
            _math_text(target, ' = ')
            lower = OxmlElement('m:limLow')
            base, index = OxmlElement('m:e'), OxmlElement('m:lim')
            _math_text(base, 'arg min')
            _math_text(index, 'w')
            lower.append(base)
            lower.append(index)
            target.append(lower)
            _math_line(target, ' wᵀQw')
        elif number == 6:
            _math_text(target, 'm(A) = ' if i == 0 else 'K = ')
            numerator = OxmlElement('m:num') if i == 0 else target
            lower = OxmlElement('m:sSub')
            base, index = OxmlElement('m:e'), OxmlElement('m:sub')
            _math_text(base, 'Σ')
            _math_text(index, 'B∩C=A' if i == 0 else 'B∩C=∅')
            lower.append(base)
            lower.append(index)
            numerator.append(lower)
            _math_line(numerator, ' m₁(B)m₂(C)')
            if i == 0:
                fraction, denominator = OxmlElement('m:f'), OxmlElement('m:den')
                _math_text(denominator, '1 − K')
                fraction.append(numerator)
                fraction.append(denominator)
                target.append(fraction)
        else:
            _math_line(target, line)
        if array is not None:
            array.append(target)
    p._p.append(math)
    p.add_run('    (' + str(number) + ')')
    end = OxmlElement('w:bookmarkEnd')
    end.set(qn('w:id'), str(number + 100))
    p._p.append(end)
    return p

def references(d):
    keys = {'Bates and Granger', 'Hochreiter and Schmidhuber', 'Dempster', 'Shafer', 'Sit et al', 'Adger',
            'Kwon and Kang', 'Nash and Sutcliffe', 'Gupta et al', 'Ma et al', 'Bahdanau et al', 'Smilkov et al',
            'Ester et al', 'HydroLang', 'Abozweita et al', 'Agliamzanov et al', 'Munoz-Sabater et al', 'Douceur',
            'Kamvar et al', 'Denoeux', 'Lehner and Grill', 'Demir et al WaterBench', 'Earth Engine daily',
            'Kratzert et al', 'Issa et al'}
    path = ROOT / 'analysis/verified_bibliography.runoff.csv'
    with path.open(encoding='utf-8-sig', newline='') as stream:
        rows = [r for r in csv.DictReader(stream) if r['citation_key'] in keys]
    assert len(rows) == len(keys)
    sort_keys = {'HydroLang': 'Erazo Ramirez', 'Earth Engine daily': 'Google Earth Engine',
                 'Demir et al WaterBench': 'Demir', 'Munoz-Sabater et al': 'Muñoz-Sabater'}
    for row in sorted(rows, key=lambda r: sort_keys.get(r['citation_key'], r['citation_key']).casefold()):
        assert row['verification_status'] == 'verified' and row['url'].startswith('https://')
        volume = row['volume'].removesuffix('.0')
        venue = row['venue'] + (' ' + volume if volume else '') + ('(' + row['issue'] + ')' if row['issue'] else '') + (', ' + row['pages'] if row['pages'] else '')
        text = f'{row["authors"]} ({row["year"]}). {row["title"]}. {venue}. {row["url"]}'
        if row['citation_key'] == 'Shafer':
            text += ' Original book published in 1976; the DOI links to the electronic edition.'
        if row['citation_key'] == 'Bahdanau et al':
            text += ' Preprint published in 2014 and presented at ICLR in 2015.'
        p = para(d, text)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.02
        for run in p.runs:
            run.font.size = Pt(9.5)
    (WORK / 'retained_references_en.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    return rows
