"""
apply_3_fixes_tracked.py — Apply 3 scientific fixes to TrackedChanges.docx
Using the correct anchor text found in the TrackedChanges document.
"""
import copy
from docx import Document
from docx.oxml.ns import qn
import lxml.etree as etree

FIX1_INSERT = (
    "ERA5-Land total runoff is generated offline by the HTESSEL land-surface scheme without "
    "direct streamflow assimilation (Muñoz-Sabater et al. 2021). Predicting ERA5-Land runoff "
    "from ERA5 atmospheric forcings introduces a form of circular dependency, where the model "
    "functions primarily as a surrogate emulator of the underlying numerical land physics "
    "rather than empirical real-world hydrology (Raoult et al. 2026). ERA5-Land runoff also "
    "exhibits systematic magnitude biases compared to in-situ gauged discharge, particularly "
    "in monsoon-driven tropical settings such as the Mekong Delta (Dang and Pokhrel 2024). "
    "Observed Vietnam river-gauge data would provide stronger validation; however, ERA5-Land "
    "offers continuous, mass-conserving, spatially consistent reanalysis over the three study "
    "regions within the submission timeline, following the precedent of Li et al. (2024) and "
    "Yan et al. (2024)."
)

FIX2_INSERT = (
    "USGS 06903900 (Chariton River near Rathbun, Iowa) is situated approximately 600 feet "
    "downstream of Rathbun Dam (USACE), a flood-control reservoir on the Chariton River. "
    "Continental-scale benchmarks such as CAMELS explicitly exclude catchments with "
    "substantial reservoir storage or artificial regulation (Newman et al. 2015; Addor et al. "
    "2017) because standard rainfall-runoff architectures cannot capture human operational "
    "release schedules (Tursun et al. 2024). The absence of dam-release schedules in the "
    "input feature space causes the open-loop LSTM to generate spurious storm-driven runoff "
    "spikes that are physically attenuated behind Rathbun Dam, while the highly dampened, "
    "near-constant discharge allows the lag-1 persistence baseline to achieve near-perfect "
    "performance (Ghimire and Krajewski 2020; Hunt et al. 2022). This is a known structural "
    "limitation of open-loop deep-learning rainfall-runoff models at regulated stations, not "
    "a signal of general model quality."
)

FIX3_INSERT = (
    "The simulated terrain factor \u03c4\u1d62 is included as a sensitivity test parameter rather than "
    "a recommended configuration. Setting \u03c4\u1d62=1 (uniform weight) reduces false alerts from "
    "1.2% to 0.7% and missed alerts from 14.9% to 8.4% under the primary mimic scenario. "
    "These results confirm that the base maximum-support pooling mechanism does not depend "
    "on terrain weighting for its core functionality, and that terrain weighting in its "
    "current simulated form introduces additional suppression that marginally increases "
    "error rates in this scenario. Its potential benefit would require real elevation data "
    "and field validation, following the approach of Huang et al. (2018), Praharaj et al. "
    "(2021) and Rosser et al. (2017)."
)


def get_full_text(para):
    t = ''
    for elem in para._p.iter():
        if elem.tag == qn('w:t'):
            t += (elem.text or '')
    return t


def find_para_index(doc, search_start: str) -> int:
    for i, p in enumerate(doc.paragraphs):
        t = get_full_text(p).strip()
        if t.startswith(search_start[:60]):
            return i
    return -1


def insert_paragraph_after(doc, idx: int, text: str):
    ref_para = doc.paragraphs[idx]
    new_p = copy.deepcopy(ref_para._p)
    # Clear everything except pPr (paragraph properties)
    children_to_remove = [
        child for child in list(new_p)
        if child.tag != qn('w:pPr')
    ]
    for child in children_to_remove:
        new_p.remove(child)
    # Create a single run
    r_elem = etree.SubElement(new_p, qn('w:r'))
    t_elem = etree.SubElement(r_elem, qn('w:t'))
    t_elem.text = text
    t_elem.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    # Insert after ref_para
    ref_para._p.addnext(new_p)


def apply_fixes_tracked(input_path: str, output_path: str):
    doc = Document(input_path)

    # FIX3: after para [279] — "Removing the simulated terrain factor..."
    idx3 = find_para_index(doc, "Removing the simulated terrain factor in the primary frozen-reputation case")
    if idx3 >= 0:
        insert_paragraph_after(doc, idx3, FIX3_INSERT)
        print(f"[FIX3] Inserted terrain paragraph after para {idx3}")
    else:
        print("[FIX3] WARNING: terrain anchor not found!")

    # FIX2: after para [287] — "At Cần Thơ, stage and inundation..."  
    # or look for USGS 06903900 context
    idx2 = find_para_index(doc, "At C\u1ea7n Th\u01a1, stage and inundation also depend on upstream inflow")
    if idx2 < 0:
        idx2 = find_para_index(doc, "USGS 06903900 has only nine high-discharge test days")
    if idx2 >= 0:
        insert_paragraph_after(doc, idx2, FIX2_INSERT)
        print(f"[FIX2] Inserted Iowa dam paragraph after para {idx2}")
    else:
        print("[FIX2] WARNING: Iowa anchor not found!")

    # FIX1: after para [286] — "Physical targets make forecast errors interpretable..."
    idx1 = find_para_index(doc, "Physical targets make forecast errors interpretable but do not turn reanalysis into observation")
    if idx1 >= 0:
        insert_paragraph_after(doc, idx1, FIX1_INSERT)
        print(f"[FIX1] Inserted ERA5 circular dependency paragraph after para {idx1}")
    else:
        print("[FIX1] WARNING: ERA5 anchor not found!")

    doc.save(output_path)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    apply_fixes_tracked(
        "paper_submission/HYDRO_D_26_00188_TrackedChanges.docx",
        "paper_submission/HYDRO_D_26_00188_TrackedChanges.docx",
    )
    print("Done.")
