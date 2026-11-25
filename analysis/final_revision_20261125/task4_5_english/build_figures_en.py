"""Publish existing English figures and plot three figures from saved data only."""
from pathlib import Path
import hashlib, json, shutil
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

WORK = Path(__file__).resolve().parent
ROOT = WORK.parents[2]
OUT = ROOT / 'paper_submission/figures_final_results_20261125_english'
OUT.mkdir(exist_ok=True)
ORIGINAL = ROOT / 'paper_submission/figures_final_results_20261123'
manifest = {}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def register(number, key, title, caption, alt, sources, copied=False):
    manifest[str(number)] = {
        'key': key, 'title': title, 'caption': caption, 'alt': alt,
        'path': str(OUT / f'Figure_{number}.png'), 'language': 'en-GB',
        'files': {ext: {'path': str(OUT / f'Figure_{number}.{ext}'), 'sha256': sha(OUT / f'Figure_{number}.{ext}')}
                  for ext in ('png', 'svg', 'pdf')},
        'data_sha256': {str(p.relative_to(ROOT)): sha(p) for p in sources},
        'copied_from_verified_English_original': copied,
    }

def save(fig, number):
    fig.canvas.draw()
    for ext in ('png', 'svg', 'pdf'):
        fig.savefig(OUT / f'Figure_{number}.{ext}', dpi=300, bbox_inches='tight', pad_inches=.08, facecolor='white')
    plt.close(fig)

def main():
    originals = read(ORIGINAL / 'figure_manifest.json')
    mapping = {1: 'HydroBASINS_L7_regional_supports', 3: 'Deployment_design',
               4: 'Vietnam_test_errors', 5: 'Iowa_test_errors',
               6: 'Vietnam_frozen_input_MAE', 7: 'Iowa_frozen_input_MAE'}
    titles = {
        1: 'HydroBASINS level 7 regional supports for Vietnam runoff reanalysis',
        3: 'Browser forecasting and local report processing',
        4: 'One day forecasting errors for Vietnam runoff depth',
        5: 'One day forecasting errors for observed Iowa discharge',
        6: 'Vietnam forecast errors with frozen physical inputs',
        7: 'Iowa forecast errors with frozen physical inputs',
    }
    for number, key in mapping.items():
        item = originals[key]
        for ext in ('png', 'svg', 'pdf'):
            source = ORIGINAL / f'{key}.{ext}'
            assert sha(source) == item['files'][ext]['sha256']
            shutil.copy2(source, OUT / f'Figure_{number}.{ext}')
        sources = [ROOT / p for p in item['data_sha256']]
        for p in sources:
            assert sha(p) == item['data_sha256'][str(p.relative_to(ROOT))]
        caption = item['caption']
        alt = item['alt']
        if number == 1:
            caption += ' Bao Ha, Gianh and Can Tho denote Bảo Hà, Sông Gianh and Cần Thơ, respectively.'
        if number in (4, 5):
            caption += f' All ten methods are reported in Table {4 if number == 4 else 5}; paired intervals are in Table 6 and the source tables.'
        if number in (6, 7):
            caption += f' There are {208 if number == 6 else 104} scheduled origins per {"region" if number == 6 else "gauge"}. Reference coverage is in Table 8, all ten methods in Table 9, and seven day paired differences in Table 10.'
        register(number, key, titles[number], caption, alt, sources, copied=True)

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 9.5, 'axes.titlesize': 10,
                         'axes.labelsize': 9.5, 'xtick.labelsize': 8.5, 'ytick.labelsize': 9,
                         'svg.fonttype': 'none', 'pdf.fonttype': 42,
                         'axes.spines.top': False, 'axes.spines.right': False})

    prepared = ROOT / 'data/waterbench_observed/prepared'
    metadata = read(prepared / 'experiment_manifest.json')
    gauges = ('USGS_06903900', 'USGS_05421000', 'USGS_05453520')
    paths = [prepared / 'experiment_manifest.json']
    fig, axes = plt.subplots(3, 1, figsize=(7.15, 5.3), sharex=True, layout='constrained')
    start, validation, test, end = [pd.Timestamp(x) for x in ('2011-10-01', '2015-10-01', '2016-10-01', '2018-09-30')]
    for i, (ax, zone) in enumerate(zip(axes, gauges)):
        cfg = next(z for z in metadata['zones'] if z['id'] == zone)
        path = prepared / f'{zone}.csv'
        paths.append(path)
        frame = pd.read_csv(path, parse_dates=['date'])
        # Plot the reference outcome, preserving missing days as gaps.
        ax.plot(frame.date, frame[cfg['target_column']], lw=.7, color='#326c93', zorder=3)
        for date in (validation, test):
            ax.axvline(date, color='#b75b2b', ls='--', lw=.9, zorder=4)
        ax.axvspan(validation, test, color='#e6eef3', alpha=.6, zorder=0)
        ax.axvspan(test, end, color='#f7eee8', alpha=.55, zorder=0)
        ax.set_title(f'({chr(97+i)}) {zone.replace("_", " ")}', loc='left', pad=5)
        ax.set_ylabel('Discharge (m³/s)')
        ax.set_xlim(start, end)
        ax.grid(alpha=.16)
    axes[-1].set_xlabel('Date')
    axes[-1].xaxis.set_major_locator(mdates.YearLocator())
    axes[-1].xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    save(fig, 2)
    register(2, 'Iowa_observed_hydrographs', 'Observed daily discharge at the three WaterBench Iowa gauges',
             'Daily mean USGS discharge from 1 October 2011 to 30 September 2018. Dashed lines mark the starts of validation (1 October 2015) and testing (1 October 2016); the preceding interval is training. Validation and testing have blue and orange shading, respectively. Daily outcomes require at least 22 valid hourly observations; missing references remain gaps. This figure contains observed discharge and no model predictions.',
             'Three vertically aligned hydrographs show observed daily discharge in cubic metres per second at USGS 06903900, 05421000 and 05453520. Dashed vertical lines identify validation and test boundaries. Peaks differ among gauges, and missing days remain breaks in the reference series. These Iowa observations are a separate benchmark outside Vietnam.', paths)

    campaign = ROOT / 'data/dependence_revision'
    metadata = read(campaign / 'dependence_campaign_manifest.json')
    frame = pd.read_csv(campaign / 'dependence_campaign.csv')
    methods = ('classical_dst', 'group_max_dst', 'bayesian_weighted_beta', 'weighted_vote_075', 'weighted_vote_050', 'majority')
    labels = ('Classical DST', 'Grouped maximum support', 'Weighted Bayesian Beta', 'Weighted vote (0.75)', 'Weighted vote (0.50)', 'Majority')
    colors = ('#6b7785', '#b45c25', '#347c8d', '#9979a4', '#7e8b3b', '#333333')
    markers = ('o', 's', '^', 'D', 'v', 'x')
    primary_ids = []
    for case in metadata['cases']:
        cfg = case['configuration']
        if ('primary' in case['purposes'] and cfg['pattern'] == 'mimic' and cfg['honest_count'] == 5
                and cfg['honest_initial_reputation'] == .95 and cfg['bot_initial_reputation'] == .5):
            primary_ids.append(case['case_id'])
    rows = frame[frame.case_id.isin(primary_ids) & frame.malicious_round & (frame.feedback_mode == 'no_verified_feedback')]
    assert sorted(rows.bot_count.unique()) == [0, 5, 20, 50, 100]
    fig, axes = plt.subplots(1, 2, figsize=(7.15, 3.55), layout='constrained')
    plotted = {}
    for ax, metric, title in zip(axes, ('false_alert_rate', 'missed_alert_rate'),
                               ('(a) False alerts when the event is absent', '(b) Missed alerts when the event is active')):
        for method, label, color, marker in zip(methods, labels, colors, markers):
            rates = rows[rows.method == method].groupby('bot_count')[metric].mean()
            ax.plot(rates.index, 100*rates.values, marker=marker, ms=4, lw=1.2, label=label, color=color)
            plotted[metric + '/' + method] = {str(int(k)): float(v) for k,v in rates.items()}
        ax.set(xlabel='Number of attacker accounts', ylabel='Rate (%)', ylim=(-2, 103), xticks=[0, 5, 20, 50, 100])
        ax.set_title(title, fontsize=9, pad=9)
        ax.grid(alpha=.17)
    fig.legend(*axes[0].get_legend_handles_labels(), loc='outside lower center', ncol=3, frameon=False, fontsize=8)
    save(fig, 8)
    sources = [campaign / 'dependence_campaign.csv', campaign / 'dependence_campaign_manifest.json']
    register(8, 'Sybil_count_sweep', 'Attacker count sweep under frozen reputation',
             'Synthetic mimic attacks with five honest reporters at initial reputation 0.95 and attackers at initial reputation 0.50. Six methods are compared at 0, 5, 20, 50 and 100 attacker accounts. Rates average malicious rounds 4–10 from 1,000 matched geometry trajectories per configuration; repeated rounds are not independent trials. Missed alerts include unresolved decisions. All reputations remain frozen without verified feedback. Low false-alert rates alone do not establish useful detection or general Sybil security.',
             'Two panels compare false-alert and missed-alert percentages as attacker count increases from zero to one hundred. The curves represent classical Dempster fusion, grouped maximum support, weighted Bayesian Beta updating, two weighted voting thresholds and majority. Grouped support has a conditional advantage in the specified reputation setting, while abstention can hide poor detection in a method with few false alerts.', sources)

    main_id = next(c['case_id'] for c in metadata['cases'] if c['case_id'] in primary_ids and c['configuration']['bot_count'] == 20)
    rows = frame[frame.case_id == main_id]
    fig, axes = plt.subplots(2, 3, figsize=(7.15, 4.95), sharex=True, sharey=True, layout='constrained')
    feedback = ('no_verified_feedback', 'independent_reference', 'self_consensus')
    feedback_labels = ('Frozen reputation', 'Independent reference\n(simulated oracle)', 'Self-consensus feedback')
    for j, (mode, label) in enumerate(zip(feedback, feedback_labels)):
        for i, (metric, ylabel) in enumerate((('false_alert_rate', 'False-alert rate (%)'), ('missed_alert_rate', 'Missed-alert rate (%)'))):
            ax = axes[i, j]
            for method, color, linestyle, legend in (('group_max_dst', '#b45c25', '-', 'Grouped maximum support'),
                                                    ('classical_dst', '#6b7785', '--', 'Classical DST')):
                rates = rows[(rows.feedback_mode == mode) & (rows.method == method)].groupby('round')[metric].mean()
                assert len(rates) == 10
                ax.plot(rates.index, 100*rates.values, color=color, ls=linestyle, lw=1.5, label=legend)
            ax.axvspan(.5, 3.5, color='#e9edf0', alpha=.8, zorder=0)
            ax.set(ylim=(-2, 103), xlim=(.5, 10.5), xticks=[1, 3, 4, 7, 10])
            ax.grid(alpha=.15)
            if j == 0:
                ax.set_ylabel(ylabel)
            if i == 0:
                ax.set_title(label, fontsize=9.2, pad=8)
            else:
                ax.set_xlabel('Round')
    fig.legend(*axes[0,0].get_legend_handles_labels(), loc='outside lower center', ncol=2, frameon=False, fontsize=8.5)
    save(fig, 9)
    register(9, 'Sybil_feedback_trajectories', 'Ten round trajectories under three feedback regimes',
             'The same synthetic configuration has five honest reporters at initial reputation 0.95 and twenty mimic attackers at initial reputation 0.50. Top panels show false alerts; bottom panels show missed alerts, including unresolved decisions. Columns compare frozen reputation, an independently labelled simulated oracle and feedback from each method’s own decisions. Grey shading marks benign rounds 1–3; attacks occur in rounds 4–10. Solid lines are grouped maximum support and dashed lines classical DST. Each point uses 1,000 matched trajectories. The oracle is not an implemented independent sensor service, and late recovery does not remove earlier errors.',
             'Six panels show false-alert and missed-alert trajectories through ten rounds. Frozen reputation preserves a conditional benefit of grouped support, the simulated oracle changes the trajectory, and self-consensus feedback drives both error rates to one hundred percent in the reported setting. The first three rounds are benign and shaded.', sources)
    assert len(manifest) == 9
    manifest_sorted = {str(n): manifest[str(n)] for n in range(1, 10)}
    (OUT / 'figure_manifest_en.json').write_text(json.dumps(manifest_sorted, ensure_ascii=False, indent=2), encoding='utf-8')
    (WORK / 'figure_plot_values_en.json').write_text(json.dumps({'source_only': True, 'new_simulations': False,
                                                               'sybil_count_sweep': plotted, 'primary_case_id': main_id}, indent=2), encoding='utf-8')
    print(json.dumps({'figures': 9, 'copied_English_originals': 6, 'plots_from_saved_data': 3,
                      'formats': ['300 dpi PNG', 'SVG', 'PDF'], 'folder': str(OUT)}, indent=2))

if __name__ == '__main__':
    main()
