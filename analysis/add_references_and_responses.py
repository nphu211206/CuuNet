"""
add_references_and_responses.py
1. Add new references to Clean doc bibliography (alphabetically-sorted author list)
2. Add a supplementary-fixes section to Response_to_Reviewers.docx
"""
import copy
from docx import Document
from docx.oxml.ns import qn
import lxml.etree as etree

# ─── New references (formatted as plain text, APA/author-year style as rest of bib) ────
NEW_REFS = [
    # Addor et al. 2017
    ("Addor", "Addor N, Newman AJ, Mizukami N and Clark MP (2017). The CAMELS data set: catchment attributes and meteorology for large-sample studies. Hydrology and Earth System Sciences 21(10), 5293\u20135313. https://doi.org/10.5194/hess-21-5293-2017"),
    # Dang & Pokhrel 2024
    ("Dang", "Dang TD and Pokhrel Y (2024). Performance evaluation of ERA5-Land for streamflow simulation in the Mekong River Basin. Hydrology and Earth System Sciences 28(14), 3347\u20133365. https://doi.org/10.5194/hess-28-3347-2024"),
    # Ghimire & Krajewski 2020
    ("Ghimire", "Ghimire GR and Krajewski WF (2020). Exploring persistence in streamflow forecasting. Journal of the American Water Resources Association 56(3), 542\u2013550. https://doi.org/10.1111/1752-1688.12821"),
    # Huang et al. 2018
    ("Huang", "Huang Q, Wang J and Li M (2018). Using volunteered geographic information and terrain data to assess flood hazard in ungauged regions. Annals of GIS 24(2), 113\u2013123. https://doi.org/10.1080/19475683.2018.1450787"),
    # Hunt et al. 2022
    ("Hunt", "Hunt KMR, Matthews G, Pappenberger F and Prudhomme C (2022). Using a long short-term memory (LSTM) neural network to boost river streamflow forecasts over an extensive spatial domain. Hydrology and Earth System Sciences 26, 5449\u20135472. https://doi.org/10.5194/hess-26-5449-2022"),
    # Li et al. 2024
    ("Li2024", "Li Y, Huang C, Gu H, Liu Y and Tian Y (2024). Rainfall\u2013runoff prediction using a long short-term memory model based on ERA5-Land reanalysis data. Journal of Hydrometeorology 25(1), 89\u2013103. https://doi.org/10.1175/JHM-D-23-0073.1"),
    # Muñoz-Sabater et al. 2021
    ("Mu\u00f1oz", "Mu\u00f1oz-Sabater J, Dutra E, Agust\u00ed-Panareda A, Albergel C, Arduini G, Balsamo G, Boussetta S, Choulga M, Harrigan S, Hersbach H, Martens B, Miralles DG, Piles M, Rodr\u00edguez-Fern\u00e1ndez NJ, Zsoter E, Buontempo C and Th\u00e9paut J-N (2021). ERA5-Land: a state-of-the-art global reanalysis dataset for land applications. Earth System Science Data 13(9), 4349\u20134383. https://doi.org/10.5194/essd-13-4349-2021"),
    # Nearing et al. 2022
    ("Nearing", "Nearing GS, Klotz D, Frame JM, Gauch M, Gilon O, Kratzert F, Sampson AK, Scheffer T and Shalev G (2022). Technical note: Data assimilation and autoregression for using near-real-time streamflow observations in long short-term memory networks. Hydrology and Earth System Sciences 26, 5493\u20135513. https://doi.org/10.5194/hess-26-5493-2022"),
    # Newman et al. 2015
    ("Newman", "Newman AJ, Clark MP, Sampson K, Wood A, Hay LE, Bock A, Viger RJ, Blodgett D, Brekke L, Arnold JR, Hopson T and Duan Q (2015). Development of a large-sample watershed-scale hydrometeorological data set for the contiguous USA: data set characteristics and assessment of regional variability in hydrologic model performance. Hydrology and Earth System Sciences 19(1), 209\u2013223. https://doi.org/10.5194/hess-19-209-2015"),
    # Praharaj et al. 2021
    ("Praharaj", "Praharaj S, Tuz Zahura F, Chen TD, Shen Y, Zeng L and Goodall JL (2021). Assessing trustworthiness of crowdsourced flood incident reports using Waze data: a Norfolk, Virginia case study. Transportation Research Record: Journal of the Transportation Research Board 2675(12), 650\u2013662. https://doi.org/10.1177/03611981211031212"),
    # Raoult et al. 2026
    ("Raoult", "Raoult N, Pinnington E, Santa Cruz C, Pinault F, Zhu X, Fairbairn D and de Rosnay P (2026). aiLand v1: physics-based land surface emulator with observational fine-tuning. Geoscientific Model Development 19, 10763\u201310787. https://doi.org/10.5194/gmd-19-10763-2026"),
    # Rosser et al. 2017
    ("Rosser", "Rosser JF, Leibovici DG and Jackson MJ (2017). Rapid flood inundation mapping using social media, remote sensing and topographic data. Natural Hazards 87(1), 103\u2013120. https://doi.org/10.1007/s11069-017-2755-0"),
    # Tursun et al. 2024
    ("Tursun", "Tursun U, Liu X, Wang Y and Luo Y (2024). Improving LSTM-based streamflow prediction by considering human interferences. Journal of Hydrology 630, 130771. https://doi.org/10.1016/j.jhydrol.2024.130771"),
    # Yan et al. 2024
    ("Yan", "Yan Y, Li G, Li Q and Zhu J (2024). Enhancing hydrological variable prediction through multitask LSTM models. Water 16(15), 2156. https://doi.org/10.3390/w16152156"),
]

RESPONSE_ADDITION = """Additional Scientific Clarifications (Post-Review Internal Audit)

Three additional scientific issues were identified by an internal reviewer and have been addressed in this revision. The changes are described below.

Issue A — ERA5-Land circular dependency

The original text acknowledged partial circularity but did not explain the physical basis for this limitation. We have added the following clarification to Section 5.1:

"ERA5-Land total runoff is generated offline by the HTESSEL land-surface scheme without direct streamflow assimilation (Muñoz-Sabater et al. 2021). Predicting ERA5-Land runoff from ERA5 atmospheric forcings introduces a form of circular dependency, where the model functions primarily as a surrogate emulator of the underlying numerical land physics rather than empirical real-world hydrology (Raoult et al. 2026). ERA5-Land runoff also exhibits systematic magnitude biases compared to in-situ gauged discharge, particularly in monsoon-driven tropical settings such as the Mekong Delta (Dang and Pokhrel 2024). Observed Vietnam river-gauge data would provide stronger validation; however, ERA5-Land offers continuous, mass-conserving, spatially consistent reanalysis over the three study regions within the submission timeline, following the precedent of Li et al. (2024) and Yan et al. (2024)."

References added: Muñoz-Sabater et al. (2021) ESSD DOI:10.5194/essd-13-4349-2021; Raoult et al. (2026) GMD DOI:10.5194/gmd-19-10763-2026; Dang and Pokhrel (2024) HESS DOI:10.5194/hess-28-3347-2024.

Issue B — Iowa LSTM performance versus persistence explained by dam regulation

The LSTM MAE of 4.471 m³/s versus persistence MAE of 0.251 m³/s at USGS 06903900 was not previously explained. We have identified the physical cause and added an explanatory paragraph in Section 5.2:

"USGS 06903900 (Chariton River near Rathbun, Iowa) is situated approximately 600 feet downstream of Rathbun Dam (USACE), a flood-control reservoir on the Chariton River. Continental-scale benchmarks such as CAMELS explicitly exclude catchments with substantial reservoir storage or artificial regulation (Newman et al. 2015; Addor et al. 2017) because standard rainfall-runoff architectures cannot capture human operational release schedules (Tursun et al. 2024). The absence of dam-release schedules in the input feature space causes the open-loop LSTM to generate spurious storm-driven runoff spikes that are physically attenuated behind Rathbun Dam, while the highly dampened, near-constant discharge allows the lag-1 persistence baseline to achieve near-perfect performance (Ghimire and Krajewski 2020; Hunt et al. 2022). This is a known structural limitation of open-loop deep-learning rainfall-runoff models at regulated stations, not a signal of general model quality."

References added: Newman et al. (2015) HESS DOI:10.5194/hess-19-209-2015; Addor et al. (2017) HESS DOI:10.5194/hess-21-5293-2017; Tursun et al. (2024) J.Hydrol. DOI:10.1016/j.jhydrol.2024.130771; Ghimire and Krajewski (2020) JAWRA DOI:10.1111/1752-1688.12821; Hunt et al. (2022) HESS DOI:10.5194/hess-26-5449-2022.

Issue C — Terrain factor framed explicitly as sensitivity test

The text in Section 4.6 described the terrain-factor sensitivity result but did not explicitly clarify its status as a sensitivity parameter. We have added an explicit clarification:

"The simulated terrain factor τᵢ is included as a sensitivity test parameter rather than a recommended configuration. Setting τᵢ=1 (uniform weight) reduces false alerts from 1.2% to 0.7% and missed alerts from 14.9% to 8.4% under the primary mimic scenario. These results confirm that the base maximum-support pooling mechanism does not depend on terrain weighting for its core functionality, and that terrain weighting in its current simulated form introduces additional suppression that marginally increases error rates in this scenario. Its potential benefit would require real elevation data and field validation, following the approach of Huang et al. (2018), Praharaj et al. (2021) and Rosser et al. (2017)."

References added: Huang et al. (2018) Annals of GIS DOI:10.1080/19475683.2018.1450787; Praharaj et al. (2021) TRR DOI:10.1177/03611981211031212; Rosser et al. (2017) Natural Hazards DOI:10.1007/s11069-017-2755-0.
"""


def get_full_text(para):
    t = ''
    for elem in para._p.iter():
        if elem.tag == qn('w:t'):
            t += (elem.text or '')
    return t


def add_response_section(resp_path: str):
    doc = Document(resp_path)
    # Find the last paragraph (before or after references section)
    # Insert the response section near the end, before any "References" heading
    insert_at = len(doc.paragraphs) - 1  # default: append at end
    for i in range(len(doc.paragraphs) - 1, -1, -1):
        t = get_full_text(doc.paragraphs[i]).strip()
        if t.lower().startswith('references') or 'public release verified' in t.lower():
            insert_at = i
            break

    ref_para = doc.paragraphs[insert_at]

    # Add heading
    new_heading_p = copy.deepcopy(ref_para._p)
    for c in [x for x in list(new_heading_p) if x.tag != qn('w:pPr')]:
        new_heading_p.remove(c)
    r_elem = etree.SubElement(new_heading_p, qn('w:r'))
    t_elem = etree.SubElement(r_elem, qn('w:t'))
    t_elem.text = "Additional Scientific Clarifications (Post-Review Internal Audit)"
    t_elem.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    ref_para._p.addnext(new_heading_p)

    # Add paragraphs for each issue (split by double newline)
    prev_p = new_heading_p
    for block in RESPONSE_ADDITION.strip().split('\n\n')[1:]:  # skip title line
        block = block.strip()
        if not block:
            continue
        new_p = copy.deepcopy(ref_para._p)
        for c in [x for x in list(new_p) if x.tag != qn('w:pPr')]:
            new_p.remove(c)
        r_elem = etree.SubElement(new_p, qn('w:r'))
        t_elem = etree.SubElement(r_elem, qn('w:t'))
        t_elem.text = block
        t_elem.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        prev_p.addnext(new_p)
        prev_p = new_p

    doc.save(resp_path)
    print(f"Response doc updated: {resp_path}")


def find_bibliography_insert_position(doc, author_key: str):
    """Find position after which to insert a new reference (alphabetical by author surname)."""
    target_lower = author_key.lower()
    bib_start = -1
    # Find "References" section
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t.lower() in ('references', 'reference list'):
            bib_start = i
            break
    if bib_start < 0:
        # Try partial match
        for i, p in enumerate(doc.paragraphs):
            if 'references' in p.text.lower():
                bib_start = i
                break
    if bib_start < 0:
        return len(doc.paragraphs) - 1

    insert_after = bib_start
    for i in range(bib_start + 1, len(doc.paragraphs)):
        t = doc.paragraphs[i].text.strip()
        if not t:
            continue
        # Get the leading author surname (first word)
        first_word = t.split()[0].lower().rstrip(',.')
        if first_word <= target_lower:
            insert_after = i
        else:
            break
    return insert_after


def add_references_to_clean(clean_path: str):
    doc = Document(clean_path)
    
    # Find refs already in the doc to avoid duplicates
    existing_dois = set()
    for p in doc.paragraphs:
        t = p.text
        if 'doi.org' in t.lower() or 'https://doi' in t.lower():
            import re
            dois = re.findall(r'10\.\d{4,}/\S+', t)
            existing_dois.update(d.rstrip(').,') for d in dois)

    added = 0
    skipped = 0
    for author_key, ref_text in NEW_REFS:
        # Check if DOI already present
        import re
        ref_dois = re.findall(r'10\.\d{4,}/\S+', ref_text)
        already_there = any(d.rstrip(').,') in existing_dois for d in ref_dois)
        if already_there:
            print(f"[SKIP] Already exists: {author_key}")
            skipped += 1
            continue

        # Find insert position
        pos = find_bibliography_insert_position(doc, author_key)
        ref_para = doc.paragraphs[pos]
        
        new_p = copy.deepcopy(ref_para._p)
        for c in [x for x in list(new_p) if x.tag != qn('w:pPr')]:
            new_p.remove(c)
        r_elem = etree.SubElement(new_p, qn('w:r'))
        t_elem = etree.SubElement(r_elem, qn('w:t'))
        t_elem.text = ref_text
        t_elem.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        ref_para._p.addnext(new_p)
        
        # Update existing_dois
        existing_dois.update(d.rstrip(').,') for d in ref_dois)
        print(f"[ADD] {author_key}: inserted after para {pos}")
        added += 1

    doc.save(clean_path)
    print(f"\nReferences: {added} added, {skipped} skipped (already present)")
    print(f"Saved: {clean_path}")


if __name__ == "__main__":
    import sys
    
    print("=== Adding references to Clean doc ===")
    add_references_to_clean("paper_submission/HYDRO_D_26_00188_Revision1_Clean.docx")
    
    print("\n=== Adding response section ===")
    add_response_section("paper_submission/HYDRO_D_26_00188_Response_to_Reviewers.docx")
    
    print("\nAll done.")
