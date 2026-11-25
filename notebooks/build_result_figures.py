"""Standalone scientific figures from the verified task-2 tables and fixed geometry."""
from pathlib import Path
import hashlib,json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon,FancyBboxPatch
from matplotlib.ticker import MaxNLocator

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'analysis/final_revision_20261123/task2'
OUT=ROOT/'paper_submission/figures_final_results_20261123'
OUT.mkdir(parents=True,exist_ok=True)
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9.5,'axes.titlesize':10.5,
    'axes.labelsize':9.5,'xtick.labelsize':8.5,'ytick.labelsize':9,
    'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none','pdf.fonttype':42})
manifest={}


def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def save(fig,name,caption,alt,sources):
    for extension in ('png','svg','pdf'):
        fig.savefig(OUT/f'{name}.{extension}',dpi=300,bbox_inches='tight',pad_inches=.08,facecolor='white')
    plt.close(fig)
    manifest[name]={'path':str(OUT/f'{name}.png'),'caption':caption,'alt':alt,
        'files':{extension:{'path':str(OUT/f'{name}.{extension}'),'sha256':sha(OUT/f'{name}.{extension}')} for extension in ('png','svg','pdf')},
        'data_sha256':{str(path.relative_to(ROOT)):sha(path) for path in sources}}


VN=('Bao_Ha_Runoff','Gianh_Runoff','Can_Tho_Runoff')
IOWA=('USGS_06903900','USGS_05421000','USGS_05453520')
LABELS={'Bao_Ha_Runoff':'Bao Ha','Gianh_Runoff':'Gianh','Can_Tho_Runoff':'Can Tho',
    **{zone:zone.replace('_',' ') for zone in IOWA}}
MODELS=('persistence','seasonal_persistence','moving_average','seasonal_decomposition','expected_mse_ensemble',
    'lstm_no_attention','ta_lstm','ta_lstm_outage')
MODEL_LABELS=['Persistence','Seasonal persistence','MA (7 days)','Seasonal decomp.','Expected-MSE','LSTM','TA-LSTM','Censored TA-LSTM']
COLORS={'persistence':'#303030','lstm_no_attention':'#707b87','ta_lstm':'#3b65a0','ta_lstm_outage':'#c56a24'}
forecast=pd.read_csv(DATA/'forecast_summary.csv')
outage=pd.read_csv(DATA/'outage_summary.csv')


def error_figure(zones,name,unit):
    fig,axes=plt.subplots(2,3,figsize=(7.15,6.15),sharey=True,layout='constrained')
    y=np.arange(len(MODELS))[::-1]
    for column,zone in enumerate(zones):
        rows=forecast[(forecast.zone==zone)&(forecast['split']=='test')].set_index('model')
        for row_index,metric in enumerate(('mae','rmse')):
            ax=axes[row_index,column]
            for position,model in zip(y,MODELS):
                point=rows.loc[model,metric+'_mean'];sd=rows.loc[model,metric+'_seed_sd']
                ax.errorbar(point,position,xerr=sd if model in COLORS and model!='persistence' else None,
                    fmt='o',markersize=4.5,capsize=2,color=COLORS.get(model,'#303030'),lw=1)
            ax.set_yticks(y,MODEL_LABELS);ax.grid(axis='x',alpha=.18);ax.set_axisbelow(True)
            ax.set_xlabel(f'{metric.upper()} ({unit})');ax.set_ylim(-.65,len(MODELS)-.35)
            maximum=max(rows.loc[model,metric+'_mean']+rows.loc[model,metric+'_seed_sd'] for model in MODELS)
            ax.set_xlim(0,maximum*1.15);ax.xaxis.set_major_locator(MaxNLocator(4))
            if row_index==0:ax.set_title(f'{LABELS[zone]}\nn = {int(rows.iloc[0].observations)}',pad=8)
    save(fig,name,
        'Held-out one-day forecasting errors. Neural points are means over five seeds; horizontal bars show one sample standard deviation across seeds, not confidence intervals. Deterministic baselines have no seed bars. All ten methods and paired time-block intervals are retained in the tables; linear trend and equal-weight combination are omitted only from this compact plot.',
        'Three columns show the selected regions or gauges. Top panels compare MAE and bottom panels RMSE in physical units. Persistence and seasonal baselines are displayed alongside three recurrent variants. Neural models do not consistently outperform persistence.',[DATA/'forecast_summary.csv'])


def outage_figure(zones,name,unit):
    fig,axes=plt.subplots(1,3,figsize=(7.15,3.35),layout='constrained')
    markers={'persistence':'s','lstm_no_attention':'^','ta_lstm':'o','ta_lstm_outage':'D'}
    for ax,zone in zip(axes,zones):
        top=0.
        for model in COLORS:
            rows=outage[(outage.zone==zone)&(outage.model==model)].sort_values('horizon')
            h=rows.horizon.to_numpy();mean=rows.mae_mean.to_numpy();sd=rows.mae_seed_sd.to_numpy()
            label=MODEL_LABELS[MODELS.index(model)]
            ax.plot(h,mean,marker=markers[model],ms=4,lw=1.5,color=COLORS[model],
                linestyle='--' if model=='persistence' else '-',label=label)
            if model!='persistence':ax.fill_between(h,np.maximum(0,mean-sd),mean+sd,color=COLORS[model],alpha=.10)
            top=max(top,float(np.max(mean+sd)))
        ax.set_title(LABELS[zone],pad=8);ax.set_xticks([1,3,7]);ax.set_xlim(.7,7.3);ax.set_ylim(0,top*1.12)
        ax.grid(alpha=.18);ax.set_xlabel('Horizon (days)');ax.yaxis.set_major_locator(MaxNLocator(4))
    axes[0].set_ylabel(f'MAE ({unit})')
    handles,labels=axes[0].get_legend_handles_labels()
    fig.legend(handles,labels,loc='outside lower center',ncol=4,frameon=False,fontsize=8.5)
    save(fig,name,
        'Frozen-input interruption errors at one, three and seven days. Neural curves show five-seed means and shaded one-SD training variation. Persistence is the validation-selected baseline for these runs. Evaluated horizons use the same scheduled origins but different target dates; missing observed targets are excluded equally, and errors need not rise monotonically with horizon. Paired time-block intervals and all ten methods are in the tables.',
        'Three panels compare persistence, LSTM without attention, temporal-attention LSTM and censored-input temporal-attention LSTM at three outage horizons. Vietnam generally benefits from censored training relative to ordinary attention; the observed Iowa benchmark shows mixed effects.',[DATA/'outage_summary.csv',DATA/'coverage.csv'])


def deployment():
    fig,ax=plt.subplots(figsize=(7.15,4.4));fig.subplots_adjust(left=.015,right=.985,top=.985,bottom=.02)
    ax.set(xlim=(0,1),ylim=(0,1));ax.axis('off');box_texts=[]
    width=.265;height=.18
    def box(x,y,text):
        patch=FancyBboxPatch((x,y),width,height,boxstyle='round,pad=.007,rounding_size=.013',
            facecolor='#f1f5f8',edgecolor='#627482',lw=1);ax.add_patch(patch)
        label=ax.text(x+width/2,y+height/2,text,ha='center',va='center',fontsize=9.3,linespacing=1.25)
        box_texts.append((patch,label))
    def arrow(start,end):ax.annotate('',xy=end,xytext=start,arrowprops={'arrowstyle':'->','lw':1.2,'color':'#4c5862'})
    x=(.025,.365,.705);top=.76;middle=.43;bottom=.08
    box(x[0],top,'Historical physical data\nRecorded provenance')
    box(x[1],top,'Model training\nValidation and five seeds')
    box(x[2],top,'FP32 / uint8 storage\nExport equivalence')
    arrow((x[0]+width,top+.09),(x[1],top+.09));arrow((x[1]+width,top+.09),(x[2],top+.09))
    box(x[0],middle,'Cached local inputs\nAvailability and age')
    box(x[1],middle,'Browser forecasting\nFrozen physical inputs')
    arrow((x[0]+width,middle+.09),(x[1],middle+.09));arrow((x[2]+width/2,top),(x[1]+width/2,middle+height))
    box(x[2],middle,'Reports on the device\nIndexedDB storage')
    box(x[2],bottom,'Local verification\nDBSCAN + grouped DST')
    box(x[1],bottom,'JSON export / import\nShared delivery needs\nseparate transport')
    arrow((x[2]+width/2,middle),(x[2]+width/2,bottom+height));arrow((x[2],bottom+.09),(x[1]+width,bottom+.09))
    ax.text(.025,.13,'Desktop browser tests\nSimulated input outages\nNo global consensus',fontsize=9.2,va='center',linespacing=1.3)
    fig.canvas.draw();renderer=fig.canvas.get_renderer()
    for patch,label in box_texts:
        if label.get_window_extent(renderer).width>.94*patch.get_window_extent(renderer).width:
            raise ValueError('Diagram label exceeds its box: '+label.get_text())
    save(fig,'Deployment_design',
        'Implemented deployment path separates local forecasting and local report verification from report transport. Browser inference and cached persistence have desktop test logs; input outages are retrospective simulations. JSON export/import is implemented locally and does not establish shared consensus across disconnected devices.',
        'Historical physical data lead to model training, validation and numerical export. Cached inputs feed local browser inference. Reports are persisted and verified as a local batch. A separate transport mechanism is needed to share exported reports; offline global consensus is not claimed.',
        [ROOT/'public/research/app.mjs',ROOT/'public/research/verification.mjs',ROOT/'paper_submission/browser_benchmarks/offline_reload_persistence_audit.json'])


def support_map():
    country_path=ROOT/'analysis/revision_review_20261121/natural_earth_countries_50m.geojson'
    support_path=ROOT/'data/runoff_revision/raw/CuuNet_ERA5Land_L7_basins.geojson'
    countries=json.loads(country_path.read_text(encoding='utf-8'));supports=json.loads(support_path.read_text(encoding='utf-8'))
    colors=dict(zip(VN,('#aa4933','#326c93','#4b8260')))
    def polygons(geometry):return geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
    def basemap(ax):
        ax.set_facecolor('#f7fafc')
        for feature in countries['features']:
            name=feature['properties'].get('ADMIN',feature['properties'].get('NAME',''))
            if name not in ('Vietnam','Laos','Cambodia','Thailand','China'):continue
            for polygon in polygons(feature['geometry']):
                ax.add_patch(Polygon(polygon[0],facecolor='#e5edf1' if name=='Vietnam' else '#f0f1f1',edgecolor='#8a9298',lw=.5))
    def support(ax,feature):
        color=colors[feature['properties']['zone']]
        for polygon in polygons(feature['geometry']):
            ax.add_patch(Polygon(polygon[0],facecolor=color,edgecolor=color,alpha=.55,lw=.8))
            for hole in polygon[1:]:ax.add_patch(Polygon(hole,facecolor='#f7fafc',edgecolor=color,lw=.5))
    fig=plt.figure(figsize=(7.15,6.9),layout='constrained');grid=fig.add_gridspec(3,2,width_ratios=[1.0,1.25])
    main=fig.add_subplot(grid[:,0]);basemap(main)
    main.set(xlim=(101.6,111.0),ylim=(8.2,24.7),xlabel='Longitude (E)',ylabel='Latitude (N)')
    main.set_aspect('equal',adjustable='box');main.grid(alpha=.12);main.set_title('Vietnam study anchors',pad=10)
    main.xaxis.set_major_locator(MaxNLocator(4));main.yaxis.set_major_locator(MaxNLocator(6))
    for row,zone in enumerate(VN):
        feature=next(f for f in supports['features'] if f['properties']['zone']==zone);p=feature['properties']
        support(main,feature);main.scatter(p['centre_lon'],p['centre_lat'],s=25,color=colors[zone],edgecolor='white',lw=.6,zorder=4)
        main.annotate(LABELS[zone],(p['centre_lon'],p['centre_lat']),xytext=(6,5),textcoords='offset points',fontsize=9,color=colors[zone])
        ax=fig.add_subplot(grid[row,1]);basemap(ax);support(ax,feature)
        coordinates=np.concatenate([np.asarray(polygon[0]) for polygon in polygons(feature['geometry'])])
        low=coordinates.min(axis=0);high=coordinates.max(axis=0);padding=(high-low)*.15
        ax.set(xlim=(low[0]-padding[0],high[0]+padding[0]),ylim=(low[1]-padding[1],high[1]+padding[1]))
        ax.scatter(p['centre_lon'],p['centre_lat'],s=25,color=colors[zone],edgecolor='white',lw=.6,zorder=4)
        ax.set_aspect('equal',adjustable='box');ax.grid(alpha=.15)
        ax.xaxis.set_major_locator(MaxNLocator(3));ax.yaxis.set_major_locator(MaxNLocator(3))
        ax.set_title(f'{LABELS[zone]} — HYBAS_ID {int(p["HYBAS_ID"])}',fontsize=9.3,pad=7)
        ax.set_xlabel('Longitude (E)',fontsize=8.8);ax.set_ylabel('Latitude (N)',fontsize=8.8)
    save(fig,'HydroBASINS_L7_regional_supports',
        'The three fixed Vietnam anchors and their selected HydroBASINS level-7 regional runoff supports. Boundaries are exported source polygons, not flood extent or asserted complete upstream gauge catchments. Country outlines use Natural Earth 1:50 million data. Runoff averages use valid ERA5-Land pixels within each support.',
        'An overview marks Bao Ha, Gianh and Can Tho. Three insets show the actual selected level-7 polygons and fixed acquisition anchors with identifiers 4071015370, 4070015440 and 4070017020. The polygons define regional runoff averaging supports, not observed inundation.',[country_path,support_path])


error_figure(VN,'Vietnam_test_errors','mm day⁻¹')
error_figure(IOWA,'Iowa_test_errors','m³ s⁻¹')
outage_figure(VN,'Vietnam_frozen_input_MAE','mm day⁻¹')
outage_figure(IOWA,'Iowa_frozen_input_MAE','m³ s⁻¹')
deployment();support_map()
(OUT/'figure_manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'figures':len(manifest),'folder':str(OUT),'formats':['300dpi PNG','SVG','PDF']},indent=2))
