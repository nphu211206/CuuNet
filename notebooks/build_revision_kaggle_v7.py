"""Self-contained physical-target notebook; acquisition is outside GPU runtime."""
import base64,hashlib,json,textwrap,zipfile
from pathlib import Path
import build_revision_kaggle_bundle as old

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'paper_submission/kaggle_revision'
SOURCES=['notebooks/revision_experiments.py','notebooks/outage_revision_experiments.py',
 'notebooks/audit_revision_outputs.py','notebooks/prepare_runoff_revision_data.py',
 'notebooks/prepare_waterbench_reference.py','notebooks/acquire_waterbench_reference.py',
 'notebooks/export_era5_land_level7.js','notebooks/tfjs_daily_preflight.py',
 'notebooks/verify_tfjs_equivalence.mjs','notebooks/test_tfjs_equivalence.mjs',
 'notebooks/test_runoff_revision.py','notebooks/test_revision_pipeline.py','notebooks/test_revision_handoff_v7.py',
 'notebooks/requirements_revision_kaggle.lock.txt','notebooks/requirements_revision_kaggle.txt',
 'analysis/verified_bibliography.runoff.csv','analysis/master_revision_20261121/waterbench_selection.json']
SOURCES += [p.relative_to(ROOT).as_posix() for folder in ['data/waterbench_observed/prepared'] for p in (ROOT/folder).glob('*') if p.is_file()]
SOURCES += [p.relative_to(ROOT).as_posix() for p in (ROOT/'data/waterbench_observed/raw').glob('*.json')]
SOURCES += [p.relative_to(ROOT).as_posix() for p in (ROOT/'data/waterbench_observed/raw').glob('*.csv')]

def cell(kind,text): return old.cell(kind,text)
def build():
 files={p:(ROOT/p).read_bytes() for p in SOURCES}
 context={'format':'cuunet-kaggle-physical-v7','full_vietnam_data_included':False,'observed_prepared_data_included':True,
          'source_sha256':{p:hashlib.sha256(b).hexdigest() for p,b in files.items()},
          'scope':'Daily physical targets, three neural variants, five seeds, expected-MSE weights and frozen-input interruption tests'}
 files['revision_bundle_context.json']=json.dumps(context,indent=2).encode()
 old.NOTEBOOK_REVISION=7
 base=old.make_notebook(files)
 extraction=''.join(base['cells'][2]['source']).replace(
     "return subprocess.run([str(value) for value in command], cwd=ROOT, env=CHILD_ENV, check=True, **kwargs)",
     "kwargs.setdefault('timeout', 900)\n    return subprocess.run([str(value) for value in command], cwd=ROOT, env=CHILD_ENV, check=True, **kwargs)")
 base['cells'][2]['source']=extraction.splitlines(keepends=True)
 cells=[cell('markdown','''
 # CuuNet physical target experiments v7

 Không tải EWDS/MARS trong notebook. Mặc định chạy **một gauge Iowa** đã chuẩn bị; sau đó chạy hai gauge còn lại.
 Bộ Việt Nam dùng Earth Engine **level 7**, mỗi vùng chạy một phiên. Level 5 vùng Gianh quá rộng nên không dùng làm primary.
 Chọn Internet ON và GPU T4; nếu chỉ có T4 ×2, notebook chỉ dùng GPU số 0.
 Mỗi lượt giữ đủ ba biến thể và năm seed. ZIP checkpoint sau mỗi seed giúp khôi phục mô hình đã hoàn thành.
 Đây là mã đã đóng gói và kiểm thử hợp đồng dữ liệu; toàn bộ huấn luyện và preflight GPU cần được xác nhận bằng lượt chạy của bạn.
 '''),*base['cells'][1:3],cell('markdown','## Choose one zone and validate inputs before installing TensorFlow'),cell('code','''
 BENCHMARK = 'observed'  # 'observed' now; 'vietnam' after attaching all level-7 annual CSVs.
 ZONE_ID = 'USGS_06903900'  # Other observed gauges: USGS_05421000, USGS_05453520.
 # Vietnam IDs: Bao_Ha_Runoff, Gianh_Runoff, Can_Tho_Runoff.
 RESUME_ZIP = None  # Exact /kaggle/input/.../CuuNet_checkpoint_....zip, if restoring interrupted work.
 JOB_TIMEOUT_HOURS = 8.0  # Bound the main child job before Kaggle's 12-hour container limit.
 assert BENCHMARK in ('observed','vietnam')
 import urllib.request
 if BENCHMARK == 'observed':
     raw = ROOT / 'data/waterbench_observed/raw/data_time_series.zip'
     expected = '64879ffce056c1183cf708ad68a3153f3f87155be93282831ff6105219a87316'
     if not raw.exists():
         attached = list(Path('/kaggle/input').rglob('data_time_series.zip'))
         if len(attached) == 1:
             shutil.copy2(attached[0],raw)
         else:
             url='https://raw.githubusercontent.com/uihilab/WaterBench/46689cf41e4d3c6a09180c2ed17a162c26b87957/data/rawData/data_time_series.zip'
             print('Downloading the pinned 51 MB observed archive; no Copernicus requests.',flush=True)
             with urllib.request.urlopen(url,timeout=60) as response, raw.open('wb') as stream:
                 shutil.copyfileobj(response,stream)
     assert hashlib.sha256(raw.read_bytes()).hexdigest()==expected, 'Observed source archive hash mismatch'
     original_manifest=ROOT/'data/waterbench_observed/prepared/experiment_manifest.json'
 else:
     import re
     VN_FILES=[]
     for year in range(2000,2025):
         matches=list(Path('/kaggle/input').rglob('CuuNet_ERA5Land_L7_daily_'+str(year)+'.csv'))
         assert len(matches)==1, 'Attach one level-7 CSV for '+str(year)+'; found '+str(len(matches))
         VN_FILES.append(matches[0])
     geometries=list(Path('/kaggle/input').rglob('CuuNet_ERA5Land_L7_basins.geojson'))
     assert len(geometries)==1, 'Attach the level-7 basin GeoJSON'
     VN_GEOMETRY=geometries[0]
     original_manifest=ROOT/'data/runoff_revision/experiment_manifest.json'
 print('Input presence check passed. Benchmark:',BENCHMARK,'zone:',ZONE_ID,flush=True)
 '''),*base['cells'][3:5],cell('markdown','''
 ## Prepare and audit the selected chronological dataset
 The complete observed manifest is included. Vietnam preparation rejects missing dates, wrong provenance, mixed basin supports and level-5 primary data.
 '''),cell('code','''
 if BENCHMARK=='vietnam':
     run([PYTHON,'notebooks/prepare_runoff_revision_data.py','--input',*VN_FILES,'--basin-geojson',VN_GEOMETRY,
          '--output-dir',ROOT/'data/runoff_revision','--frequency','daily'])
 full=json.loads(original_manifest.read_text())
 selected=[zone for zone in full['zones'] if zone['id']==ZONE_ID]
 assert len(selected)==1, 'ZONE_ID does not belong to the selected benchmark'
 full['zones']=selected
 full['training']['write_progress_archives']=True
 MANIFEST=ROOT/'data'/('manifest_v7_'+BENCHMARK+'_'+ZONE_ID+'.json')
 MANIFEST.write_text(json.dumps(full,indent=2))
 PRIMARY=OUTPUT/(BENCHMARK+'_'+ZONE_ID)
 PRIMARY.mkdir(parents=True,exist_ok=True)
 if RESUME_ZIP:
     with zipfile.ZipFile(RESUME_ZIP) as archive:
         checkpoint=json.loads(archive.read('checkpoint_manifest.json'))
         assert checkpoint['format']=='cuunet-training-checkpoint-v1' and checkpoint['publication_eligible'] is False
         for name,expected in checkpoint['files'].items():
             dest=(PRIMARY/name).resolve()
             assert dest.is_relative_to(PRIMARY.resolve()), 'Checkpoint path outside output'
             data=archive.read(name)
             assert hashlib.sha256(data).hexdigest()==expected,name
             dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(data)
     print('Restored checkpoint; the runner checks source/data/seed signatures before reusing models.',flush=True)
 run([PYTHON,'-c',"import sys; sys.path.insert(0,'notebooks'); import revision_experiments as e; from pathlib import Path; m=e.load_manifest(Path(sys.argv[1])); print(e.validate_evidence_contract(Path.cwd(),m))",MANIFEST])
 '''),cell('markdown','''
 ## Mandatory deployment-shape preflight
 Test the actual 30 × 5 and 30 × 8 shapes with 64 LSTM units and 32 attention units. Random compatibility tensors are excluded from scientific results.
 '''),cell('code','''
 run([NODE,'--test','notebooks/test_tfjs_equivalence.mjs'])
 run([PYTHON,'notebooks/test_runoff_revision.py'])
 run([PYTHON,'notebooks/test_revision_handoff_v7.py'])
 run([PYTHON,'notebooks/tfjs_daily_preflight.py','--output-dir',OUTPUT/'compatibility_preflight'])
 PREFLIGHT_OK=True
 print('Both daily deployment shapes passed numerical export checks.',flush=True)
 '''),cell('markdown','''
 ## Run one zone with all three variants and five seeds
 Keep 2,000 bootstrap samples for the canonical output. Each completed model is saved with a checksum, source/data/config/seed signature and validation history.
 A partial checkpoint ZIP is not a completed experiment. It must be restored and finished before publication claims.
 '''),cell('code','''
 assert PREFLIGHT_OK
 import signal
 JOB_COMPLETE=False
 command=[str(PYTHON),'notebooks/revision_experiments.py','--manifest',str(MANIFEST),
          '--output-dir',str(PRIMARY),'--bootstrap-repetitions','2000']
 job=subprocess.Popen(command,cwd=ROOT,env=CHILD_ENV,start_new_session=True)
 try:
     status=job.wait(timeout=JOB_TIMEOUT_HOURS*3600)
     assert status==0, 'Primary job failed; review its printed diagnostics and saved checkpoint'
     result=json.loads((PRIMARY/'manuscript_results.json').read_text())
     assert result['audited'] and result['publication_eligible'], 'Primary output audit failed'
     assert len(result['neural_per_seed_metrics'])==30, 'Expected three models × five seeds × two evaluation splits'
     JOB_COMPLETE=True
 except subprocess.TimeoutExpired:
     os.killpg(job.pid,signal.SIGTERM)
     try: job.wait(timeout=30)
     except subprocess.TimeoutExpired:
         os.killpg(job.pid,signal.SIGKILL); job.wait()
     print('Main time budget reached. Finish the notebook to save the partial ZIP; resume checked completed models in another run.',flush=True)
 '''),cell('markdown','## Evaluate frozen physical inputs at one three and seven days'),cell('code','''
 OUTAGE_COMPLETE=False
 if JOB_COMPLETE:
     try:
         run([PYTHON,'notebooks/outage_revision_experiments.py','--manifest',MANIFEST,'--forecast-dir',PRIMARY,
              '--output-dir',PRIMARY/'input_outage','--bootstrap-repetitions','2000'],timeout=3600)
         outage=json.loads((PRIMARY/'input_outage/outage_manifest.json').read_text())
         assert outage['neural_complete'] and not outage['pending']
         assert outage['input_rollout_policy']=='frozen'
         OUTAGE_COMPLETE=True
         print('Completed one-step and interruption experiments for',ZONE_ID,flush=True)
     except subprocess.TimeoutExpired:
         print('Interruption time budget reached; one-step results are saved but interruption results remain pending.',flush=True)
 else:
     print('Skipping interruption scores because the primary experiment is unfinished.',flush=True)
 '''),cell('markdown','''
 ## Download the completed result ZIP
 Repeat with the other two gauge IDs; later switch to Vietnam and the three regional IDs after attaching the complete level-7 exports.
 Send all completed ZIPs back for audited figure/table filling. Kaggle produces no phone latency, battery measurements or real VGI reports.
 '''),cell('code','''
 (PRIMARY/'python_environment.txt').write_text(subprocess.check_output([str(PYTHON),'-m','pip','freeze'],env=CHILD_ENV,text=True))
 shutil.copy2(ROOT/'package-lock.json',PRIMARY/'node_package_lock.json')
 state={'primary_complete':JOB_COMPLETE,'outage_complete':OUTAGE_COMPLETE,'submission_ready':False}
 (PRIMARY/'handoff_state.json').write_text(json.dumps(state,indent=2))
 label='complete' if JOB_COMPLETE and OUTAGE_COMPLETE else 'partial'
 ARCHIVE=Path('/kaggle/working')/('CuuNet_v7_'+label+'_'+BENCHMARK+'_'+ZONE_ID+'_'+STAMP+'.zip')
 with zipfile.ZipFile(ARCHIVE,'w',zipfile.ZIP_DEFLATED) as archive:
     for source in sorted(PRIMARY.rglob('*')):
         if source.is_file(): archive.write(source,source.relative_to(PRIMARY).as_posix())
 with zipfile.ZipFile(ARCHIVE) as archive: assert archive.testzip() is None
 from IPython.display import FileLink,display
 print('Handoff state:',state,'ZIP:',ARCHIVE,'bytes',ARCHIVE.stat().st_size)
 display(FileLink(str(ARCHIVE)))
 checkpoint=PRIMARY.parent/('CuuNet_checkpoint_'+PRIMARY.name+'.zip')
 if checkpoint.is_file():
     print('Save this checkpoint outside the container before resuming. A local ZIP cannot survive container deletion by itself.')
     display(FileLink(str(checkpoint)))
 ''')]
 for i,c in enumerate(cells):
     c['id']=f'physical-v7-{i:02d}'
     if c['cell_type']=='code': compile(''.join(c['source']),f'v7_cell_{i}','exec')
 notebook={'cells':cells,'metadata':{'cuunet_notebook_revision':7,'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},
             'language_info':{'name':'python','version':'3.12'}},'nbformat':4,'nbformat_minor':5}
 OUT.mkdir(exist_ok=True,parents=True)
 path=OUT/'CuuNet_HYDRO_Physical_Kaggle_v7.ipynb'; path.write_text(json.dumps(notebook,ensure_ascii=False,indent=1),encoding='utf-8')
 manifest=OUT/'bundle_manifest_v7.json'
 manifest.write_text(json.dumps({**context,'notebook_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                                'notebook_cells':len(cells),'bytes':path.stat().st_size},indent=2),encoding='utf-8')
 print(json.dumps({'notebook':str(path),'bytes':path.stat().st_size,'cells':len(cells),'source_files':len(files)},indent=2))
 return notebook

if __name__=='__main__': build()
