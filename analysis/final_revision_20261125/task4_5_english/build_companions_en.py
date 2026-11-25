"""English companions with surgical preservation of the author's edited responses."""
from document_helpers_en import *

SOURCE = Document(BASELINE / NAMES['response'])
OLDER = Document(ROOT / 'paper_submission/HYDRO_D_26_00188_Response_to_Reviewers.docx.bak')
SOURCE_TEXT = {i: p.text for i,p in enumerate(SOURCE.paragraphs)}
USED = {}
CORRECTIONS = []
REVIEWER_ITEMS = []

def replace_xml_text(paragraph, old, new):
    """Replace only the intended character range, retaining surrounding runs and formatting."""
    nodes = paragraph.xpath('.//w:t')
    text = ''.join(x.text or '' for x in nodes)
    assert old in text, 'Unmatched author-source correction: ' + old
    start, end = text.index(old), text.index(old) + len(old)
    cursor = 0
    inserted = False
    for node in nodes:
        current = node.text or ''
        a, b = cursor, cursor + len(current)
        cursor = b
        if b <= start or a >= end:
            continue
        before = current[:max(0, start-a)]
        after = current[max(0, end-a):] if end < b else ''
        node.text = before + (new if not inserted else '') + after
        node.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        inserted = True
    assert inserted

def author_paragraph(d, index, item, replacements=()):
    element = deepcopy(SOURCE.paragraphs[index]._p)
    for old,new,reason in replacements:
        replace_xml_text(element, old, new)
        CORRECTIONS.append({'source_paragraph': index, 'item': item, 'old': old, 'new': new, 'reason': reason})
    # Source paragraphs are English prose with no embedded media or external relationships.
    assert not element.xpath('.//*[@r:id or @r:embed or @r:link]')
    d._element.body.insert_element_before(element, 'w:sectPr')
    USED.setdefault(index, []).append(item)
    return element

def prose(d, text, lead=None):
    p = para(d, '')
    if lead:
        p.add_run(lead + ' ').bold = True
    p.add_run(text)
    return p

def item(d, code, title, comment, locations):
    heading(d, code + ' ' + title, 2)
    prose(d, comment, 'Comment summary.')
    REVIEWER_ITEMS.append({'code': code, 'title': title, 'comment_summary': comment, 'locations': locations})

def location(d, text):
    para(d, 'Revised locations: ' + text, 'Caption')

def response():
    d = newdoc('Response to the editor and reviewers')
    para(d, 'Response to the editor and reviewers', 'Title')
    para(d, 'Journal of Hydroinformatics | HYDRO-D-26-00188')
    para(d, 'Revised title: ' + FULL_TITLE)
    para(d, 'Dear Editor and Reviewers,')
    author_paragraph(d, 5, 'Opening')
    author_paragraph(d, 6, 'Opening', [
        ('the supplied 19 November clean manuscript with this replacement draft',
         'the supplied original English Clean manuscript in source_backup (22 November 2026) with the revised manuscript',
         'Use the author-requested English baseline, rather than the previous 19 November comparison.'),
        ('It is a genuine whole-manuscript redline, not a comparison against an unavailable original submission.',
         'Accepting all revisions reproduces the revised Clean manuscript. The comparison does not assert that the supplied baseline was the journal’s initial submission.',
         'State the reproducible acceptance requirement and the actual baseline identity.')])
    para(d, 'Each review point is addressed below using an English summary of its substance. The summaries are not verbatim quotations. Reviewer 2 minor, literature and supplementary requests have separate identifiers to make their coverage explicit.')

    heading(d, 'Reviewer 1')
    loc = 'Abstract; Sections 2.1–2.3, 4.1, 5.1 and 6; Tables 1–5; Figures 1–2 and 4–5.'
    item(d, 'R1 1', 'Physical hydrological target', 'A self-constructed risk index does not demonstrate hydrological forecasting skill. Replace it with an observed or reanalysis physical quantity, or independently validate disaster impacts.', loc)
    author_paragraph(d, 9, 'R1 1', [
        ('45 neural models, 96,000–98,000 independent validation checks per station with zero failures',
         '45 neural models and matching baselines', 'The stated per-station audit totals are not the physical-metric checks in scientific_evidence.json.'),
        ('Forecasting results demonstrate that simple baselines (persistence and moving averages) remain formidable on aggregate MAE, while neural architectures improve RMSE and peak runoff subsets.',
         'Forecasting results demonstrate that simple baselines (persistence and moving averages) remain strong on aggregate MAE. The no-attention LSTM has the lowest point RMSE in the three Vietnam regions; persistence has the lowest MAE, RMSE and high-subset MAE at the Iowa gauges.',
         'Restrict neural benefits to their supported Vietnam comparison and retain adverse Iowa results.'),
        ('Abstract, Table 3, and Conclusions report these audited physical metrics',
         'The Abstract, Tables 4–5 and Conclusions report these audited physical metrics', 'Update the revised table numbering.')])
    prose(d, 'The completed physical-metric audit records 1,200 matching MAE/RMSE mean and seed-SD checks across 120 forecast and 180 interruption summary rows. These consistency checks are distinct from independent hydrological validation. Vietnam has 9,132 days per region, 27,396 overall, with verified level 7 boundaries. Observed Vietnam gauges are not part of this study.')
    location(d, loc)

    loc = 'Sections 3.6–3.8, 4.5–4.6 and 5.3; Table 13; Figures 8–9.'
    item(d, 'R1 2', 'Systematic Sybil evaluation', 'Seven reports cannot support a general defence claim. Vary attacker count, reputation, spatial/temporal pattern, sparse reports and thresholds, and include numerical comparators.', loc)
    author_paragraph(d, 11, 'R1 2', [
        ('Sections 3.6–3.8 and 4.3', 'Sections 3.6–3.8 and 4.5–4.6', 'Update result-section numbering.'),
        ('Table 4 and Figures 4–5', 'Table 13 and Figures 8–9', 'Update verification table and figure numbering.')])
    prose(d, 'The audit matches 281,160 checks over 25,560 saved summary rows. In the prespecified five-honest/20-attacker mimic case (initial reputations 0.95/0.50), grouped support under frozen reputation has 1.2% false alerts and 14.9% missed alerts. Self-consensus feedback raises both to 100%. Majority, two weighted votes, weighted Bayesian Beta updating and classical DST are retained. An authenticated graph baseline is not implemented because the experiment contains no identity or historical trust graph.')
    location(d, loc)

    loc = 'Sections 1, 3.2–3.3, 3.7 and 5.2–5.3; Cover Letter.'
    item(d, 'R1 3', 'Contribution and prior browser hydrology', 'Standard temporal attention, forecast combination and DBSCAN are established. Position the integration against browser and edge hydrological work.', loc)
    author_paragraph(d, 13, 'R1 3')
    prose(d, 'Issa et al. (2026) add current edge-computing context for imagery-based water-level/discharge measurement; that task is explicitly distinguished from stale-input forecasting. The simulated terrain factor is not presented as a calibrated hydrological contribution, and event-driven energy benefit is not claimed.')
    location(d, loc)

    loc = 'Abstract; Sections 3.1–3.2 and 4.1–4.3; Tables 4–6, 9–10 and A1.'
    item(d, 'R1 4', 'Strong baselines and adverse results', 'Avoid selective improvement percentages against a weak moving-average baseline. Retain seasonal decomposition, all constituents and stronger alternatives even when they win.', loc)
    author_paragraph(d, 15, 'R1 4', [
        ('alongside the weaker moving-average comparator', 'alongside moving average and linear trend',
         'The new physical-target results include a moving-average winner, so it is not universally weak.'),
        ('Table 3 has explicit physical-unit result slots', 'Tables 4–5 contain the completed physical-unit results', 'Replace stale result-slot wording with completed tables.')])
    prose(d, 'Persistence also has the lowest one-day MAE and RMSE at all three Iowa gauges. Tables 4–5 and 9 retain ten methods, including the ensemble constituents and equal-weight combination. Table 6 reports paired ensemble-versus-seasonal-decomposition and attention ablations; Table A1 includes all high-target errors and bias. The high-subset days are not called verified floods.')
    location(d, loc)

    loc = 'Abstract; Sections 1, 5.4 and 6; Cover Letter.'
    item(d, 'R1 5', 'Simulated Typhoon Yagi motivation', 'Distinguish simulated Yagi scenarios from real event-specific VGI, losses and deployment outcomes.', loc)
    author_paragraph(d, 17, 'R1 5')
    location(d, loc)

    loc = 'Sections 3.3, 4.1, 4.3–4.4 and 4.6; Tables 6, 10–11; Figures 6–7.'
    item(d, 'R1 6', 'Attention storage terrain and retention ablations', 'Evaluate attention removal, quantisation error, the terrain factor and reputation retention with appropriate uncertainty.', loc)
    author_paragraph(d, 19, 'R1 6', [
        ('lead times 1, 3, and 7 days across 208 origins',
         'lead times 1, 3 and 7 days across 208 scheduled origins per Vietnam region and 104 per Iowa gauge',
         'Use the distinct canonical Vietnam and Iowa origin counts.'),
        ('The censored-input variant significantly reduces degradation under 7-day frozen outages (by 26.4% to 61.1% compared to standard attention LSTM).',
         'The censored-input variant reduces seven-day MAE by 26.4% to 61.1% relative to ordinary TA-LSTM in Vietnam, with paired time intervals below zero. It increases MAE by 26.5% and 9.0% at Iowa gauges 06903900 and 05453520.',
         'Report the actual loss and comparator, retain adverse Iowa effects and avoid independent-seed significance claims.'),
        ('with mean physical divergence of 0.0304–0.0672 mm/day relative to FP32',
         'with physical differences of 0.0304–0.0672 mm/day relative to FP32 on the single repeated Vietnam timing input',
         'This range describes the repeated timing input, not mean divergence over the complete test set.')])
    prose(d, 'Complete held-out quantisation results in Table 11 give mean absolute FP32/uint8 differences of 0.0416–0.0814 mm/day for Vietnam and 0.0711–0.9956 m³/s for Iowa, with either an increase or decrease in MAE. Removing the simulated terrain factor changes primary frozen-reputation false/missed alerts from 1.2%/14.9% to 0.7%/8.4%, so a beneficial terrain effect is not asserted. Retention is varied by feedback regime; it cannot change frozen-reputation output.')
    location(d, loc)

    loc = 'Sections 3.2–3.3 and 3.6–3.7; Equations 1–8; AltText document.'
    item(d, 'R1 7', 'Equation numbering and complete branches', 'Repair numbering, additive-attention attribution, candidate-state notation and the malformed reputation penalty branch.', loc)
    author_paragraph(d, 21, 'R1 7')
    location(d, loc)

    loc = 'Sections 3.2 and 3.6–3.8, 4.2 and 4.6; Tables 7 and B1; campaign manifest.'
    item(d, 'R1 8', 'Parameter justification and sensitivity', 'Unsupported risk weights and empirical spatial, reputation and decision parameters require reasons and sensitivity analysis.', loc)
    author_paragraph(d, 23, 'R1 8')
    prose(d, 'The manuscript gives the simulated terrain formula and its range [0.65,1]. Primary grouping is 0.25 km and 0.5 hours; sensitivity uses cells 0.125/0.25/0.50 km, time bins 0.25/0.5/1 hour, thresholds 0.60/0.75/0.90, retention 0.70/0.85/0.90/0.95, rewards 0.05/0.10/0.20, penalties 0.10/0.30/0.50 and DBSCAN distances 0.25/1/5 km. These are prespecified finite simulations, not field-calibrated optimal constants.')
    location(d, loc)

    loc = 'Sections 3.5, 4.4 and 5.4; Tables 11–12.'
    item(d, 'R1 9', 'Event driven inference and energy evidence', 'A proposed reduction of battery drain and thermal throttling requires measurements or a narrower claim.', loc)
    author_paragraph(d, 25, 'R1 9', [
        ('Sections 3.5, 4.2 and 5.3', 'Sections 3.5, 4.4 and 5.4', 'Update result and discussion references.'),
        ('3 basins x 2 precisions x 2 backends', '3 regions × 2 storage variants × 2 backends', 'Distinguish weight storage from arithmetic precision.'),
        ('Active memory is strictly reported as TensorFlow.js runtime tensor buffer allocation (2.16 MB via tf.memory().numBytes)',
         'Memory is reported as TensorFlow.js runtime tensor allocation (2,260,756 bytes, or 2.26 MB and 2.16 MiB, via tf.memory().numBytes)',
         'Correct decimal MB versus binary MiB.'),
        ('JavaScript heap (26–35 MB)', 'JavaScript heap (25.99–35.93 MB)', 'Use the recorded heap range.')])
    prose(d, 'Table 12 retains the first WebGL inference of 2,907.51 ms. CPU tensor-memory estimates have unreliable=true; the field is not total RAM or GPU memory. Event-driven inference remains a hypothesis for reducing calls. No controlled invocation-count, energy, battery or temperature experiment has been performed, so that requested measurement is not represented as complete.')
    location(d, loc)

    loc = 'Entire manuscript; Author and publishing declarations.'
    item(d, 'R1 10', 'Concision author responsibility and AI disclosure', 'Shorten repetitive writing and classical derivations, ensure human scientific review and correct the generative-AI declaration.', loc)
    author_paragraph(d, 27, 'R1 10', [
        ('a shorter account distinguishing protocol, completed simulations and pending measurements',
         'an account distinguishing protocol, completed forecasting and simulation results, desktop measurements and unmeasured operational effects',
         'Replace stale unfinished-result wording while retaining the actual limitations.'),
        ('PENDING AUTHOR requires final human verification, author metadata and CRediT confirmation.',
         'The author must complete final human verification, author metadata and CRediT confirmation before submission. Affiliation and ORCID remain blank.',
         'Keep the author’s final-review requirement without a submission placeholder.')])
    location(d, loc)

    heading(d, 'Reviewer 2 Major points')
    loc = 'Abstract; Sections 2, 3.1, 4.1, 5.1 and 6; Tables 1–5.'
    item(d, 'R2 M1', 'Physical quantities and scope', 'Replace dimensionless risk-index errors with physical hydrological evaluation or narrow every claim, including the Abstract.', loc)
    author_paragraph(d, 30, 'R2 M1', [
        ('whereas recurrent models reduce RMSE and peak errors',
         'whereas the no-attention LSTM has the lowest point RMSE in Vietnam. Persistence also has the lowest Iowa RMSE and high-subset MAE',
         'Prevent a Vietnam-only neural benefit from being applied to Iowa.')])
    prose(d, 'This is physical-target replacement plus explicit scope restriction: Vietnam runoff is reanalysis of runoff generation, while Iowa is observed discharge outside Vietnam. No measured Vietnam stage, discharge, inundation or landslide validation is claimed.')
    location(d, loc)

    loc = 'Sections 3.1–3.2, 4.1–4.2 and 5.2; Equations 1–2; Tables 4–7, A1 and B1.'
    item(d, 'R2 M2', 'Expected MSE and ensemble benchmarking', 'Include forecast bias, describe covariance estimation and constraints, and report comparisons against seasonal decomposition, LSTM and strong baselines.', loc)
    author_paragraph(d, 32, 'R2 M2', [
        ('Table 3 reports audited results alongside seasonal decomposition and persistence',
         'Tables 4–5 report audited results alongside all constituents, seasonal decomposition, LSTM and persistence',
         'Update completed result tables and make the LSTM comparison explicit.')])
    prose(d, 'Validation has 1,096 common dates per Vietnam region and 357/365/364 at the Iowa gauges. Table 7 records weights and bias; the saved estimation files retain sample covariance, shrunk covariance and Q. Table 6 provides paired differences versus seasonal decomposition and Table B1 all four shrinkage settings. At Bảo Hà, ensemble RMSE is 4.757 mm/day versus 4.055 for TA-LSTM; at Cần Thơ, 2.545 versus 2.551 mm/day. These point comparisons do not establish universal superiority or validated flood-peak benefit.')
    location(d, loc)

    loc = 'Sections 3.7–3.8, 4.5–4.6 and 5.3; Table 13; Figures 8–9.'
    item(d, 'R2 M3', 'Neutral reputation attacks and numerical baselines', 'Sweep attacker counts and neutral initial reputation, report false and missed alerts, include majority and discuss observed failures.', loc)
    author_paragraph(d, 34, 'R2 M3', [
        ('Sections 3.8 and 4.3', 'Sections 3.8 and 4.5–4.6', 'Update result-section numbering.'),
        ('Table 4 and Figure 5', 'Table 13 and Figure 9', 'Update verification table and trajectory figure numbering.')])
    prose(d, 'With five neutral honest reporters and twenty neutral mimic attackers, frozen grouped support has 98.1% false alerts and 100% missed alerts. One neutral honest report without attackers remains unresolved under the minimum cluster size and misses 100% of active events. Both failures are retained. The 353 static numerical-parity fixtures confirm consistency of the local implementations; they do not add independent security-effectiveness evidence.')
    location(d, loc)

    loc = 'Sections 3.5, 4.4 and 5.4; Figure 3; offline_reload_persistence_audit.json.'
    item(d, 'R2 M4', 'Offline local processing and report transport', 'Explain how verification operates with zero connectivity and identify transport or reconciliation requirements without implying shared offline consensus.', loc)
    author_paragraph(d, 36, 'R2 M4', [
        ('retains all six imported models in IndexedDB', 'retains the two imported Bảo Hà models (FP32 and uint8 storage) in IndexedDB',
         'The cited reload audit verifies two models; a separate earlier integration log contains six.'),
        ('produces offline recursive forecasts', 'produces offline forecasts with frozen physical inputs',
         'The audited primary rollout does not recursively inject predicted physical targets.'),
        ('the application reloads reliably from cache', 'the application reloads from previously populated cache in the audited session',
         'Avoid extending one emulated reload to universal cache reliability.')])
    prose(d, 'The audit passes eleven checks, preserves three synthetic report fixtures bit-for-bit and returns 0.546370 mm/day for the saved one-day Bảo Hà case. At reload, the available verification batch is unresolved. Local JSON export/import is implemented, but transport, cross-device reconciliation and a shared consensus protocol are not demonstrated. Report persistence does not establish report truth.')
    location(d, loc)

    loc = 'Abstract; Sections 1, 5.4 and 6; Cover Letter.'
    item(d, 'R2 M5', 'Simulated Yagi and deployment readiness', 'Label every Yagi reference as simulation and withdraw claims of community use, completed pilots or operational capability.', loc)
    author_paragraph(d, 38, 'R2 M5')
    location(d, loc)

    loc = 'Sections 2.1, 3.1, 3.6 and 4.6; Equation 4.'
    item(d, 'R2 M6', 'Unsupported index and terrain parameters', 'Justify empirical index weights and undefined slope/elevation coefficients or remove them and quantify remaining assumptions.', loc)
    author_paragraph(d, 40, 'R2 M6', [
        ('Section 4.4 characterises', 'Section 4.6 characterises', 'Update the sensitivity-section reference.')])
    prose(d, 'The terrain factor is explicitly τᵢ=1−0.35 min(|yᵢ|/0.75 km,1). Its removal performs better in the primary frozen case, so the revision retains that negative ablation and makes no field-calibration claim.')
    location(d, loc)

    heading(d, 'Reviewer 2 Minor scientific and technical points')
    loc = 'Abstract; Section 6.'
    item(d, 'R2 N1', 'Prominent limitations in the Abstract', 'The Abstract must disclose the observational, geographic, simulation and deployment limitations.', loc)
    author_paragraph(d, 49, 'R2 N1', [
        ('simulation and pending-measurement limitations', 'simulation and desktop-only deployment limitations',
         'Physical forecasts and desktop measurements are complete, while mobile/energy/field evidence is absent.')])
    location(d, loc)

    loc = 'Section 1, immediately before RQ1–RQ3.'
    item(d, 'R2 N2', 'Aim before research questions', 'Place one concise research-aim statement immediately before the three research questions.', loc)
    prose(d, 'The aim now immediately precedes RQ1–RQ3: to evaluate a reproducible browser deployment path for forecasting during input interruptions and identify the limits of local crowdsourced evidence aggregation. The three questions then address physical forecast comparisons, stale-input training and evidence/feedback failures.')
    location(d, loc)

    loc = 'Sections 2.3, 3.3 and 3.8; Tables 3–6, 9–10; complete source tables.'
    item(d, 'R2 N3', 'Repeated training and chronological reproducibility', 'Provide repeated-seed uncertainty, exact partitions and matched LSTM ablation hyperparameters; remove the inconsistent split description.', loc)
    author_paragraph(d, 45, 'R2 N3', [
        ('paired 30-day block bootstrap intervals with 2,000 samples',
         'paired block-bootstrap intervals with 2,000 resamples and thirty retained reference-date positions for ordinary forecasts or five retained origin positions for interruptions',
         'Describe the actual position-based blocks, including gaps in observed references.')])
    prose(d, 'Intervals resample time conditional on five fitted seeds and are not independent retraining significance claims. The interruption schedule is 208 origins per Vietnam region and 104 per Iowa gauge. Missing target coverage is identical across comparators within a site and horizon.')
    location(d, loc)

    loc = 'Equations 1–8; Section 3; AltText document.'
    item(d, 'R2 N4', 'Equation housekeeping', 'Repair equation cross-references, candidate-state notation, the penalty branch and the attention citation.', loc)
    author_paragraph(d, 47, 'R2 N4')
    location(d, loc)

    loc = 'Title; Abstract; Sections 3.3, 3.7–3.8 and 4.5–4.6.'
    item(d, 'R2 N5', 'Temporal attention and calibrated defence terminology', 'Either implement a spatial mechanism or rename the model, and replace unrestricted confidence/defence claims with scenario-specific results.', loc)
    author_paragraph(d, 43, 'R2 N5')
    prose(d, 'The former greater-than-99% verified-disaster headline is replaced by false/missed alerts, abstention and coverage under specified reputation and feedback assumptions. Neither high belief nor a low false-alert rate is represented as a general Sybil guarantee.')
    location(d, loc)

    loc = 'Sections 3.1 and 3.6; References; Data and code availability; responses R2 L1–L4 and S1.'
    item(d, 'R2 N6', 'Input channels and miscellaneous citation details', 'Explain earthquake/tsunami inputs, remove unnecessary year letters, correct INFORM attribution and Adger, cite or remove Abozweita, and unify availability statements.', loc)
    prose(d, 'Earthquake and tsunami channels are removed with the composite target. The five Iowa and eight Vietnam features are physical lag/covariate, availability, age and calendar channels. Unused year suffixes are removed. INFORM construction is excluded rather than attributed to Dilley or Peduzzi. Adger’s title is corrected, verified Abozweita is cited in Section 5.2, and one availability statement retains the real repository and removes the obsolete anonymous link. Separate literature and supplementary responses below give the details.')
    location(d, loc)

    loc = 'Sections 5.1–5.4.'
    item(d, 'R2 N7', 'Balanced Discussion and supported literature comparison', 'Synthesise relevant verified literature and operational boundaries instead of repeating favourable results; discuss the relationship to reporting and server-side systems.', loc)
    prose(d, 'The Discussion separates hydrological interpretation, mixed training effects, established forecast/browser methods, evidence dependence and deployment requirements. HydroLang, TensorFlow.js, Bates–Granger, Abozweita, Douceur and Denoeux are used for their supported contributions. Kwon and Kang (2016) analyse Twitter flood signals and provide reporting context. An equivalent server-side algorithm or security benchmark is not implemented here, so numerical superiority over that work is not claimed.')
    location(d, loc)

    loc = 'Sections 3.5, 4.4 and 5.4; Tables 11–12.'
    item(d, 'R2 N8', 'Verifiable desktop execution and memory', 'Retain useful feasibility measurements with identifiable workloads, devices, numerical equivalence and correctly defined memory.', loc)
    prose(d, 'The former seven-device and 150 KB index-model table is replaced by the twelve saved physical-model desktop configurations and 600 warm measurements. Table 12 reports warm mean/median/P95 and first inference, including 2,907.51 ms. Runtime tensor allocation is 2,260,756 bytes (2.26 MB or 2.16 MiB), separate from heap at 25.99–35.93 MB. CPU estimates carry unreliable=true. Uint8 storage, complete-test accuracy and repeated-input differences are distinguished; WASM, phone, power and thermal performance are not inferred.')
    location(d, loc)

    heading(d, 'Reviewer 2 Literature and research integrity')
    loc = 'Section 1; References.'
    item(d, 'R2 L1', 'Correct Sit and Adger metadata', 'Correct the author/venue of the Sit review and the exact title of Adger’s article, with DOI or stable URL.', loc)
    author_paragraph(d, 52, 'R2 L1')
    location(d, loc)

    loc = 'Sections 1, 3.2–3.3 and 5.2; References.'
    item(d, 'R2 L2', 'Attention combination and browser sources', 'Attribute additive attention correctly, acknowledge Bates–Granger, and cite direct browser hydrology precedents.', loc)
    prose(d, 'Additive attention uses Bahdanau et al. (2014), with its ICLR 2015 appearance noted consistently. Forecast combination cites Bates and Granger (1969). Ma et al. (2019), Smilkov et al. (2019) and Erazo Ramirez et al. (2022) supply direct browser/TensorFlow.js/HydroLang context. Hydrology@Home is cited using the verified 2019 bibliographic record. Every retained entry has a DOI or stable official URL.')
    location(d, loc)

    loc = 'References; verified_bibliography.runoff.csv and retained_references_en.json.'
    item(d, 'R2 L3', 'Unverifiable entries and inconsistent keys', 'Remove articles that cannot be verified as cited; a real author or a different paper does not validate a disputed reference.', loc)
    author_paragraph(d, 54, 'R2 L3')
    prose(d, 'The retained bibliography contains twenty-five entries verified against DOI-registry or official provider metadata and cited in the manuscript. Excluded articles are not silently replaced with other publications by the same authors. This metadata verification does not constitute a comprehensive full-text or retraction review.')
    location(d, loc)

    loc = 'Section 5.2; References.'
    item(d, 'R2 L4', 'Verify and cite Abozweita', 'Verify Abozweita et al. (2024) and cite it in the text or remove the uncited entry.', loc)
    prose(d, 'Abozweita et al. (2024), Enhancing hydrological predictions: optimised decision tree modelling for improved monthly inflow forecasting, is verified at https://doi.org/10.2166/hydro.2024.205 and cited in Section 5.2. The citation provides monthly-inflow context; it does not imply the same interruption protocol or a measured performance comparison.')
    location(d, loc)

    loc = 'Reference scope in Sections 1 and 5; bibliography audit records.'
    item(d, 'R2 L5', 'Retraction screening remains distinct', 'Do not report an inconclusive screening state as a clean retraction record; distinguish metadata and full-text verification.', loc)
    prose(d, 'The source audit verifies article existence and bibliographic metadata. It does not contain a comprehensive systematic check for retraction or expressions of concern, so no clean-screening claim is made. Metadata or abstract inspection is also not represented as full-text algorithm comparison. Final human reference review remains the author’s responsibility before submission.')
    location(d, loc)

    heading(d, 'Reviewer 2 Supplementary material')
    loc = 'Sections 3.1–3.5; Data and code availability.'
    item(d, 'R2 S1', 'Repository and a single availability statement', 'Retain the real GitHub asset in Methods, consolidate availability statements and remove the obsolete anonymous link.', loc)
    author_paragraph(d, 58, 'R2 S1', [
        ('all trained model weights (FP32 and uint8 storage bundles)',
         'all neural fit artifacts and the selected FP32 and uint8 deployment bundles',
         'Distinguish ninety fitted neural models from the six selected deployment exports.'),
        ('PENDING RELEASE requires an immutable release identifier and verification that every claimed public artefact is actually available upon repository deposit.',
         'The complete revision package has no immutable public release identifier yet. Every claimed public artifact must be verified as available when the repository deposit is made.',
         'Retain the author’s release requirement and actual local/public distinction without a placeholder.')])
    location(d, loc)

    loc = 'Section 4; Data and code availability; complete result CSVs, configurations, weights, traces and audits.'
    item(d, 'R2 S2', 'Weights configurations traces and actual availability', 'Ensure the exact products underlying the tables are present before asserting public availability, including weights and configuration files.', loc)
    author_paragraph(d, 56, 'R2 S2', [
        ('complete and audited (96,287 to 98,067 checks per station, zero failures)',
         'complete and audited', 'The per-station totals are not the canonical physical-metric audit figures in the supplied evidence.')])
    prose(d, 'The existing canonical archive contains ninety neural fits, per-seed predictions, baseline predictions, ensemble estimation matrices/weights, four shrinkage settings, selected FP32/uint8 exports, raw Sybil traces and audits, and saved browser/offline logs. Source hashes match the supplied evidence. Local completeness is not public deposit: the complete revision artifacts have not yet received an immutable release or DOI, and the manuscript states that limitation. The author must confirm permissions and final public availability before making a public-availability claim.')
    location(d, loc)

    heading(d, 'Author checks before submission')
    author_paragraph(d, 60, 'Checklist')
    author_paragraph(d, 61, 'Checklist')
    author_paragraph(d, 62, 'Checklist', [
        ('leads 1, 3, 7 days across 208 origins per basin',
         'leads 1, 3 and 7 days across 208 scheduled origins per Vietnam region and 104 per Iowa gauge',
         'Correct the origin counts in the author’s completion checklist.'),
        ('censored-input training significantly mitigates multi-day outage degradation',
         'censored-input training reduces seven-day MAE relative to ordinary TA-LSTM in Vietnam and has mixed Iowa effects',
         'Retain completion while correcting the scope and adverse benchmark effects.')])
    author_paragraph(d, 63, 'Checklist', [
        ('active tensor memory confirmed at 2.16 MB', 'runtime tensor allocation logged as 2.26 MB (2.16 MiB), with unreliable=true on CPU',
         'Correct memory units and retain the CPU measurement limitation.')])
    author_paragraph(d, 64, 'Checklist', [
        ('persistence remains strongest on aggregate MAE', 'persistence and the moving average remain strong on aggregate MAE',
         'Include the Cần Thơ moving-average winner.'),
        ('censored training robustly protects against telemetry freezing',
         'censored training improves seven-day Vietnam interruption MAE relative to ordinary TA-LSTM and has mixed Iowa effects',
         'Avoid a universal robustness claim contradicted by the Iowa results.')])
    author_paragraph(d, 65, 'Checklist', [('PENDING AUTHOR:', 'Author review before submission:', 'Replace a placeholder with the author’s explicit remaining review action.')])
    author_paragraph(d, 66, 'Checklist', [('PENDING RELEASE:', 'Public archive before an availability claim:', 'Preserve the pending public-release requirement as an explicit action.')])
    para(d, 'Affiliation and ORCID remain blank for author completion. The revision deadline recorded in the editorial letter is 6 December 2026. The remaining human checks include the final scientific interpretation, declaration accuracy, reference/retraction review and artifact release status.')
    para(d, 'Sincerely,\n' + AUTHOR + '\n' + EMAIL).alignment = WD_ALIGN_PARAGRAPH.LEFT
    d.save(STAGE / NAMES['response'])
    changed = [i for i,p in enumerate(SOURCE.paragraphs)
               if i < len(OLDER.paragraphs) and p.text != OLDER.paragraphs[i].text]
    assert not (set(changed) - set(USED)), 'A manually edited author paragraph was omitted: ' + str(set(changed) - set(USED))
    assert len(REVIEWER_ITEMS) == 31
    (WORK / 'reviewer_coverage_en.json').write_text(json.dumps(REVIEWER_ITEMS, ensure_ascii=False, indent=2), encoding='utf-8')
    (WORK / 'author_edit_preservation_en.json').write_text(json.dumps({
        'source': str(BASELINE / NAMES['response']), 'source_sha256': sha(BASELINE / NAMES['response']),
        'older_comparison': str(ROOT / 'paper_submission/HYDRO_D_26_00188_Response_to_Reviewers.docx.bak'),
        'author_changed_paragraphs': changed, 'all_author_changed_paragraphs_included': True,
        'source_paragraph_placement': USED, 'targeted_scientific_and_reference_corrections': CORRECTIONS,
        'preservation_method': 'Original English paragraph XML is cloned; only documented character ranges are replaced, retaining surrounding runs and formatting.',
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    return d

def alt():
    d = newdoc('Alternative text for figures tables and equations')
    para(d, 'Alternative text for figures tables and equations', 'Title')
    para(d, 'Journal of Hydroinformatics | HYDRO-D-26-00188')
    para(d, 'Revised title: ' + FULL_TITLE)
    para(d, 'Descriptions match the nine numbered figures and eight native Word equations in the revised Clean manuscript. The numerical tables remain editable text with repeating headers; their scope and column meanings are also described below.')
    for number in range(1,10):
        x = FIGURES[str(number)]
        heading(d, f'Figure {number} ' + x['title'])
        alt_p = para(d, x['alt'])
        alt_p.paragraph_format.keep_with_next = True
        alt_p.paragraph_format.keep_together = True
        cap_p = para(d, 'Caption: ' + x['caption'], 'Caption')
        cap_p.paragraph_format.keep_together = True
    for number,(title,lines,description) in EQ.items():
        heading(d, f'Equation {number} ' + title)
        desc_p = para(d, description)
        desc_p.paragraph_format.keep_with_next = True
        desc_p.paragraph_format.keep_together = True
        equation(d, number)
    heading(d, 'Tables')
    tables = json.loads((WORK / 'table_registry_en.json').read_text(encoding='utf-8'))
    for x in tables:
        para(d, f'Table {x["number"]} {x["title"]}. The table contains {x["rows"]} data rows. Columns are ' +
             ', '.join(y.replace('\n',' ') for y in x['headers']) + '.')
    para(d, 'Vietnam errors use mm/day and Iowa errors m³/s. The ± symbol denotes sample SD across five seeds; CI denotes a paired time confidence interval. Negative paired differences indicate lower error for the candidate. Missing reference outcomes are excluded equally for every method. Sybil errors condition on event status and missed alerts include abstention. Table 13 averages malicious rounds 4–10, without treating repeated rounds as independent trials.')
    d.save(STAGE / NAMES['alt'])
    return d

def cover():
    d = newdoc('Revision cover letter')
    para(d, 'Revision cover letter', 'Title')
    para(d, '25 November 2026')
    para(d, 'Journal of Hydroinformatics | HYDRO-D-26-00188')
    para(d, 'Dear Professor Gabriele Freni,')
    para(d, 'Please consider the revised manuscript entitled ' + FULL_TITLE + '. The revision evaluates browser deployment for physical-target forecasting under input interruptions and local crowdsourced evidence aggregation, with the contribution positioned as systems integration and empirical assessment.')
    para(d, 'The completed study uses ERA5-Land runoff depth for three Vietnam regions (mm/day) and a supplementary observed discharge benchmark at three WaterBench-Iowa USGS gauges (m³/s). Ninety neural fits and seven statistical comparators are reported across fixed chronological partitions. Persistence and moving-average strengths are retained. Censored-input training improves seven-day Vietnam interruption MAE relative to ordinary TA-LSTM but has mixed Iowa effects; temporal attention is not presented as a universal accuracy benefit.')
    para(d, 'The synthetic verification campaign comprises 71 configurations, 1,000 matched trials per configuration, six numerical methods and three feedback regimes. It reports conditional pooling benefits, abstention and failures under neutral honest cold starts or self-consensus feedback. Saved desktop Chrome measurements and an offline reload audit support local execution and persistence. Typhoon Yagi only motivates simulated outages; no observed Vietnam flood validation, mobile or energy benefit, or field deployment is claimed.')
    para(d, 'The package contains the Clean manuscript, tracked comparison against the supplied original English Clean dated 22 November 2026, a point-by-point response and alternative text matching nine figures and eight equations. The manuscript states the current local/public artifact availability and acknowledges established attention, forecast-combination and browser methods. The AI disclosure accurately describes assistance during this revision; I retain responsibility for scientific accuracy and the final text.')
    para(d, 'Sincerely,\n' + AUTHOR + '\n' + EMAIL).alignment = WD_ALIGN_PARAGRAPH.LEFT
    para(d, 'Affiliation: ')
    para(d, 'ORCID: ')
    d.save(STAGE / NAMES['cover'])
    return d

if __name__ == '__main__':
    response()
    alt()
    cover()
    print(json.dumps({'companion_documents': 3, 'reviewer_items': len(REVIEWER_ITEMS),
                      'author_paragraphs_preserved': len(USED), 'documented_corrections': len(CORRECTIONS),
                      'output': str(STAGE)}, indent=2))
