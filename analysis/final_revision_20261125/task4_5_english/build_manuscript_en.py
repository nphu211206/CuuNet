"""Fill the English manuscript with the completed, immutable scientific results."""
from document_helpers_en import *
import pandas as pd

DATA = ROOT / 'analysis/final_revision_20261123/task2'
F = pd.read_csv(DATA / 'forecast_summary.csv')
O = pd.read_csv(DATA / 'outage_summary.csv')
P = pd.read_csv(DATA / 'paired_comparisons.csv')
C = pd.read_csv(DATA / 'coverage.csv').set_index('zone')
W = pd.read_csv(DATA / 'combination_weights.csv')
Q = pd.read_csv(DATA / 'quantisation_summary.csv')
SH = pd.read_csv(DATA / 'shrinkage_sensitivity.csv')

def testrow(zone, model):
    return F[(F.zone == zone) & (F['split'] == 'test') & (F.model == model)].iloc[0]

def pair(zone, candidate, comparator, evaluation='test', horizon=1):
    return P[(P.zone == zone) & (P.candidate == candidate) & (P.comparator == comparator)
             & (P.evaluation == evaluation) & (P.horizon == horizon)].iloc[0]

def site(zone, units=False):
    return LABELS[zone] + ('\n(' + unit(zone) + ')' if units else '')

def build_table(d, number):
    if number == '1':
        rows = deepcopy(FROZEN_TABLES['1']['values'])
        table(d, 1, 'HydroBASINS level 7 regional runoff supports',
              ['Region', 'HYBAS_ID', 'Catalogue area\n(km²)', 'Valid land support\n(km²)', 'Daily rows'],
              rows, [2.4, 3.2, 3.6, 4.0, 3.2],
              'The three regions contain 27,396 daily rows overall. Each anchor is inside its selected polygon. Calendars are complete and unique; no negative runoff or precipitation required correction. The support is a regional averaging unit, not a claimed full upstream gauge catchment.')
    elif number == '2':
        table(d, 2, 'WaterBench Iowa gauges and missing daily reference outcomes',
              ['USGS gauge', 'IFC ID', 'Area\n(km²)', 'Missing days\n(full period)', 'Observed test\ndays'],
              [['06903900', '579', '1,402', '67', '717/730'], ['05421000', '592', '2,723', '18', '726/730'],
               ['05453520', '540', '8,067', '49', '730/730']], [3.2, 1.9, 3.1, 4.0, 4.2],
              'The full record is 1 October 2011 to 30 September 2018. Daily means require at least 22 valid hourly observations. Missing target days are neither interpolated nor filled before scoring. Discharge is in m³/s and is not combined with Vietnam runoff depth.')
    elif number == '3':
        table(d, 3, 'Fixed chronological forecasting protocol', ['Setting', 'Vietnam reanalysis', 'Observed Iowa'],
              [['Target', 'Regional runoff generation (mm/day)', 'Daily mean discharge (m³/s)'],
               ['Training', '1 Jan 2000–31 Dec 2017', '1 Oct 2011–30 Sep 2015'],
               ['Validation', '1 Jan 2018–31 Dec 2020', '1 Oct 2015–30 Sep 2016'],
               ['Testing', '1 Jan 2021–31 Dec 2024', '1 Oct 2016–30 Sep 2018'],
               ['Calendar rows: train / validation / test', '6,575 / 1,096 / 1,461 per region', '1,461 / 366 / 730 per gauge'],
               ['Lookback and features', '30 days; 8 features', '30 days; 5 features'],
               ['Seeds per recurrent variant', '42, 123, 456, 789, 2024', '42, 123, 456, 789, 2024'],
               ['Interruption horizons', '1, 3 and 7 days', '1, 3 and 7 days'],
               ['Scheduled interruption origins', '208 per region', '104 per gauge']], [4.0, 6.2, 6.2],
              'Vietnam reference outcomes are complete. Iowa missing outcomes remain missing, so observed counts differ from calendar counts. Feature and target scalers use training data only. Interruption reference coverage is reported in Table 8.')
    elif number in ('4', '5'):
        zones = VN if number == '4' else IOWA
        rows = []
        for zone in zones:
            for model in MODELS:
                x = testrow(zone, model)
                rows.append([site(zone), MODEL_NAMES[model], ms(x, 'mae'), ms(x, 'rmse'), fmt(x.nse_mean), fmt(x.kge_mean)])
        table(d, number, 'One day test forecasts in ' + ('Vietnam (mm/day)' if number == '4' else 'Iowa (m³/s)'),
              ['Region or gauge', 'Method', 'MAE', 'RMSE', 'NSE', 'KGE'], rows, [2.5, 3.7, 3.2, 3.2, 1.9, 1.9],
              'Recurrent scores are means across five seeds; MAE and RMSE include sample seed SD, while NSE and KGE are seed means. Deterministic comparators have one score without seed SD. All ten methods are retained. Time intervals, bias and high-target errors are preserved in the source tables. Common observed test counts are ' + ('1,461 per region.' if number == '4' else '717, 726 and 730, respectively.'))
    elif number == '6':
        rows = []
        for zone in ZONES:
            for a,b,label in [('expected_mse_ensemble', 'seasonal_decomposition', 'Expected-MSE − seasonal decomposition'),
                              ('ta_lstm', 'lstm_no_attention', 'TA-LSTM − LSTM')]:
                x = pair(zone, a, b)
                rows.append([site(zone, True), label, ci(x, 'mae'), ci(x, 'rmse')])
        table(d, 6, 'Paired test error differences with 95% time intervals',
              ['Site and units', 'Comparison', 'ΔMAE [95% CI]', 'ΔRMSE [95% CI]'], rows, [2.7, 3.7, 5.0, 5.0],
              'Difference is the first method minus its comparator; negative values indicate lower error. Units are shown for each site. Circular block-bootstrap intervals use 2,000 resamples and thirty retained reference-date positions; they are conditional on the five fitted seeds, not independent retraining significance tests.')
    elif number == '7':
        rows = []
        for zone in ZONES:
            x = W[W.zone == zone].set_index('model').loc[['moving_average', 'linear_trend', 'seasonal_decomposition']]
            rows.append([site(zone, True), str(int(x.estimation_observations.iloc[0])),
                         *[fmt(v, 4) for v in x.weight], '; '.join(fmt(v, 3) for v in x.validation_bias)])
        table(d, 7, 'Validation fitted ensemble weights and bias',
              ['Site and bias units', 'n', 'w moving\naverage', 'w linear\ntrend', 'w seasonal\ndecomposition', 'Bias vector b\n(same order)'],
              rows, [2.6, 1.3, 2.2, 2.2, 2.4, 5.7],
              'Bias has the site’s physical units; covariance and Q have squared units. Nonnegative weights sum to one before rounding. Validation dates, full bias/covariance matrices, Q and weights are saved in the estimation artifacts. The primary diagonal shrinkage is λ=0.10.')
    elif number == '8':
        rows = []
        for zone in ZONES:
            x = C.loc[zone]
            coverage = json.loads(x.outage_observed_by_horizon)
            rows.append([site(zone), str(int(x.scheduled_outage_origins)), *[str(coverage[str(h)]) for h in (1,3,7)]])
        table(d, 8, 'Observed reference coverage for input interruptions',
              ['Region or gauge', 'Scheduled\norigins', '1 day', '3 days', '7 days'], rows, [3.4, 3.6, 3.1, 3.1, 3.2],
              'All methods use the same finite reference outcomes within each site and horizon. Missing target days remain missing. Circular bootstrap blocks use five retained origin positions. Different horizons refer to different target dates.')
    elif number == '9':
        rows = []
        for zone in ZONES:
            for model in MODELS:
                x = O[(O.zone == zone) & (O.model == model)].set_index('horizon')
                rows.append([site(zone, True), MODEL_NAMES[model], *[ms(x.loc[h], 'mae') for h in (1,3,7)]])
        table(d, 9, 'MAE with frozen physical inputs at all interruption horizons',
              ['Site and units', 'Method', '1 day', '3 days', '7 days'], rows, [2.7, 3.8, 3.3, 3.3, 3.3],
              'Recurrent scores are five-seed means ± sample seed SD; statistical scores are deterministic. Units are explicit for each site. Complete RMSE, NSE, KGE, bias, high-target coverage and time intervals are retained in outage_summary.csv. Horizons have different target dates, so errors need not increase monotonically.')
    elif number == '10':
        rows = []
        for zone in ZONES:
            for comparator in ('ta_lstm', 'persistence'):
                x = pair(zone, 'ta_lstm_outage', comparator, 'input_outage', 7)
                rows.append([site(zone, True), MODEL_NAMES[comparator], ci(x, 'mae'), ci(x, 'rmse')])
        table(d, 10, 'Censored TA-LSTM minus comparator at seven day interruption',
              ['Site and units', 'Comparator', 'ΔMAE [95% CI]', 'ΔRMSE [95% CI]'], rows, [2.7, 2.7, 5.5, 5.5],
              'Negative differences indicate lower error for censored TA-LSTM. Paired time intervals use common reference dates, 2,000 resamples and five retained origin positions, conditional on the fixed fitted seeds. MAE intervals against persistence include zero at all three Vietnam regions.')
    elif number == '11':
        rows = []
        for x in Q.to_dict('records'):
            rows.append([site(x['zone'], True), str(x['selected_seed']),
                         fmt(x['float_model_bytes']/1e6, 3) + ' / ' + fmt(x['uint8_model_bytes']/1e6, 3),
                         fmt(x['tfjs_float_vs_uint8_mean_abs_physical_difference'], 4),
                         fmt(x['tfjs_float_mae']) + ' / ' + fmt(x['tfjs_uint8_weight_storage_mae']),
                         fmt(x['mae_degradation_percent'], 2)])
        table(d, 11, 'Complete test evaluation of FP32 and uint8 weight storage',
              ['Site and units', 'Selected\nseed', 'Model MB\nFP32 / uint8', 'Mean absolute\ndifference', 'MAE\nFP32 / uint8', 'ΔMAE\n(%)'],
              rows, [2.7, 1.6, 3.1, 2.9, 3.9, 2.2],
              'One deployment seed is selected by validation within the censored variant at each site; this differs from five-seed results. MB=1,000,000 bytes. Prediction differences and MAE use the displayed site units. ΔMAE%=(MAE uint8/MAE FP32−1)×100; negative values indicate lower MAE. Uint8 is weight storage with floating-point arithmetic after dequantisation.')
    elif number == '12':
        rows = deepcopy(FROZEN_TABLES['12']['values'])
        table(d, 12, 'Saved desktop Chrome inference times in milliseconds',
              ['Region', 'Storage', 'Backend', 'Warm\nmean', 'Warm\nmedian', 'Warm\nP95', 'First\ninference'],
              rows, [2.3, 1.4, 1.7, 2.6, 2.6, 2.6, 3.2],
              'Each row has ten untimed warmup passes and fifty measured batch-one passes on one saved input, for 600 warm samples. P95 is the interpolated 0.95 quantile. First inference is one observation per configuration in the saved session, not a repeated cold-start distribution or complete application load time. The browser is Headless Chrome 157 on Windows x64, using TensorFlow.js 4.22.0.')
    elif number == '13':
        rows = deepcopy(FROZEN_TABLES['13']['values'])
        table(d, 13, 'Mean rates over malicious rounds 4–10 in the mimic configuration',
              ['Feedback', 'Method', 'False\nalerts (%)', 'Missed\nalerts (%)', 'Abstention\n(%)', 'Decisive\ncoverage (%)'],
              rows, [2.6, 3.4, 2.6, 2.4, 2.8, 2.6],
              'Five honest reporters start at reputation 0.95 and twenty mimic attackers at 0.50, with 1,000 matched trajectories. False alerts condition on an absent event; missed alerts condition on an active event and include abstention. The last two columns average both event conditions. Repeated rounds are not independent trials; per-round Wilson intervals and worst malicious-round values are retained in the campaign CSV.')
    elif number == 'A1':
        rows = []
        for zone in ZONES:
            for model in MODELS:
                x = testrow(zone, model)
                rows.append([site(zone, True), MODEL_NAMES[model], ms(x, 'mean_bias'), ms(x, 'peak_mae'), str(int(x.peak_count))])
        table(d, 'A1', 'Bias and high target MAE for every test method',
              ['Site and units', 'Method', 'Mean bias', 'High target MAE', 'High\ndays'], rows, [2.7, 3.8, 4.0, 4.2, 1.7],
              'High targets meet or exceed the training target’s fixed 90th percentile and are not verified floods. Recurrent values are five-seed means ± sample seed SD. High-target test counts are 178, 200, 225, 9, 151 and 32 in site order. Complete time intervals are retained in forecast_summary.csv.')
    elif number == 'B1':
        rows = []
        for zone in ZONES:
            for x in SH[SH.zone == zone].sort_values('shrinkage').to_dict('records'):
                rows.append([site(zone, True), fmt(x['shrinkage'], 2),
                             '; '.join(fmt(v, 4) for v in json.loads(x['weights'])),
                             fmt(x['test_mae']), fmt(x['test_rmse'])])
        table(d, 'B1', 'Four prespecified diagonal shrinkage settings',
              ['Site and error units', 'λ', 'Weights: moving average;\nlinear trend; seasonal decomposition', 'Test MAE', 'Test RMSE'],
              rows, [2.7, 1.3, 5.8, 3.3, 3.3],
              'The primary value is λ=0.10. Other values describe sensitivity and do not select a configuration by test error. Full weights and result values remain in shrinkage_sensitivity.csv.')
    else:
        raise ValueError('Unrecognised table ' + number)

def build():
    d = newdoc()
    para(d, TITLE, 'Title')
    subtitle = para(d, SUBTITLE)
    subtitle.paragraph_format.keep_with_next = True
    para(d, AUTHOR + ' | ' + EMAIL)
    para(d, 'Affiliation: ')
    para(d, 'ORCID: ')
    text = (WORK / 'manuscript_en.md').read_text(encoding='utf-8')
    for block in text.split('\n\n'):
        block = block.strip()
        if not block:
            continue
        if block.startswith('### '):
            heading(d, block[4:], 2)
        elif block.startswith('## '):
            section_heading = heading(d, block[3:])
            if block[3:] == 'References':
                section_heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif block.startswith('TABLE|'):
            build_table(d, block.split('|')[1])
        elif block.startswith('FIG|'):
            figure(d, int(block.split('|')[1]))
        elif block.startswith('EQ|'):
            equation(d, int(block.split('|')[1]))
        elif block == 'REFERENCES':
            references(d)
        elif block == 'PAGEBREAK':
            d.add_page_break()
        else:
            para(d, block.replace('\n', ' '))
    assert len(TABLES) == 15
    d.save(STAGE / NAMES['clean'])
    (WORK / 'table_registry_en.json').write_text(json.dumps(TABLES, ensure_ascii=False, indent=2), encoding='utf-8')
    abstract = text.split('## Abstract\n\n')[1].split('\n\n')[0]
    print(json.dumps({'manuscript': str(STAGE / NAMES['clean']), 'tables': len(TABLES),
                      'figures': len(FIGURES), 'equations': len(EQ), 'abstract_words': len(abstract.split())}, indent=2))

if __name__ == '__main__':
    build()
