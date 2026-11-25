"""Recover the actual embedded bytes and check the observed evidence contract."""
import ast,base64,hashlib,json,os,tempfile,zlib
from pathlib import Path
import revision_experiments as exp

ROOT=Path(__file__).resolve().parents[1]
nb=json.loads((ROOT/'paper_submission/kaggle_revision/CuuNet_HYDRO_Physical_Kaggle_v7.ipynb').read_text(encoding='utf-8'))
source=next(''.join(c['source']) for c in nb['cells'] if c['cell_type']=='code' and 'FILES = json.loads' in ''.join(c['source']))
values={}
for node in ast.parse(source).body:
 if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name) and node.targets[0].id in {'FILES','HASHES'}:
  values[node.targets[0].id]=json.loads(ast.literal_eval(node.value.args[0]))
parent=ROOT/'analysis/master_revision_20261121'; temporary=tempfile.TemporaryDirectory(prefix='v7_bundle_check_',dir=parent)
folder=Path(temporary.name).resolve(); assert folder.is_relative_to(parent.resolve())
try:
 for name,encoded in values['FILES'].items():
  path=(folder/name).resolve(); assert path.is_relative_to(folder)
  data=zlib.decompress(base64.b64decode(encoded)); assert hashlib.sha256(data).hexdigest()==values['HASHES'][name]
  path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(data)
 archive=folder/'data/waterbench_observed/raw/data_time_series.zip'
 os.link(ROOT/'data/waterbench_observed/raw/data_time_series.zip',archive)
 manifest=exp.load_manifest(folder/'data/waterbench_observed/prepared/experiment_manifest.json')
 evidence=exp.validate_evidence_contract(folder,manifest)
 for zone in manifest['zones']: exp.load_zone(folder,zone,manifest['splits'])
 result={'embedded_hashes_passed':True,'source_files':len(values['FILES']),'observed_contract_passed':True,
         'observed_zones':len(manifest['zones']),'gpu_training_performed':False}
 (parent/'v7_bundle_input_audit.json').write_text(json.dumps(result,indent=2))
 print(json.dumps(result,indent=2))
finally:
 assert folder.is_relative_to(parent.resolve()); temporary.cleanup()
