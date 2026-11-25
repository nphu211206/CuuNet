"""Apply the preflight metadata hotfix to the frozen v7 snapshot without overwriting it."""
import ast
import base64
import hashlib
import json
import zlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'paper_submission/kaggle_revision'
CHANGED=('notebooks/tfjs_daily_preflight.py','notebooks/test_revision_handoff_v7.py')


def build():
    original=OUT/'CuuNet_HYDRO_Physical_Kaggle_v7.ipynb'
    original_bytes=original.read_bytes()
    notebook=json.loads(original_bytes)
    extraction=next(c for c in notebook['cells'] if c['cell_type']=='code'
                    and 'FILES = json.loads' in ''.join(c['source']))
    source=''.join(extraction['source'])
    assignments={}
    for node in ast.parse(source).body:
        if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name):
            if node.targets[0].id in ('FILES','HASHES'):
                assignments[node.targets[0].id]=(node,json.loads(ast.literal_eval(node.value.args[0])))
    encoded=assignments['FILES'][1]
    hashes=assignments['HASHES'][1]
    files={name:zlib.decompress(base64.b64decode(data)) for name,data in encoded.items()}
    for name,data in files.items():
        assert hashlib.sha256(data).hexdigest()==hashes[name],name
    for name in CHANGED:
        files[name]=(ROOT/name).read_bytes()
    context=json.loads(files['revision_bundle_context.json'])
    context['format']='cuunet-kaggle-physical-v7_1'
    context['hotfix']='Preflight selected_seed metadata and regression consumer contract'
    context['base_notebook_sha256']=hashlib.sha256(original_bytes).hexdigest()
    for name in CHANGED:
        context['source_sha256'][name]=hashlib.sha256(files[name]).hexdigest()
    files['revision_bundle_context.json']=json.dumps(context,indent=2).encode()
    encoded={name:base64.b64encode(zlib.compress(data,9)).decode('ascii') for name,data in files.items()}
    hashes={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
    lines=source.splitlines(keepends=True)
    for name,(node,_) in sorted(assignments.items(),key=lambda pair:pair[1][0].lineno,reverse=True):
        values=encoded if name=='FILES' else hashes
        lines[node.lineno-1:node.end_lineno]=[f'{name} = json.loads({json.dumps(values)!r})\n']
    extraction['source']=''.join(lines).replace("print('Notebook revision:', 7, flush=True)",
                                              "print('Notebook revision:', '7.1', flush=True)").splitlines(keepends=True)
    notebook['cells'][0]['source']=''.join(notebook['cells'][0]['source']).replace(
        'experiments v7','experiments v7.1').splitlines(keepends=True)
    config=next(c for c in notebook['cells'] if c['cell_type']=='code'
                and "BENCHMARK = 'observed'" in ''.join(c['source']))
    config['source']=''.join(config['source']).replace(
        "BENCHMARK = 'observed'  # 'observed' now; 'vietnam' after attaching all level-7 annual CSVs.",
        "BENCHMARK = 'vietnam'  # This run uses the attached complete level-7 Vietnam dataset.").replace(
        "ZONE_ID = 'USGS_06903900'  # Other observed gauges: USGS_05421000, USGS_05453520.",
        "ZONE_ID = 'Bao_Ha_Runoff'  # Other Vietnam zones: Gianh_Runoff, Can_Tho_Runoff.").splitlines(keepends=True)
    notebook['metadata']['cuunet_notebook_revision']='7.1'
    notebook['metadata']['cuunet_hotfix']=context['hotfix']
    for i,cell in enumerate(notebook['cells']):
        cell['id']=f'physical-v7-1-{i:02d}'
        if cell['cell_type']=='code':
            compile(''.join(cell['source']),f'v7_1_cell_{i}','exec')
    path=OUT/'CuuNet_HYDRO_Physical_Kaggle_v7_1.ipynb'
    path.write_text(json.dumps(notebook,ensure_ascii=False,indent=1),encoding='utf-8')
    manifest={**context,'notebook_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
              'notebook_cells':len(notebook['cells']),'bytes':path.stat().st_size,
              'default_benchmark':'vietnam','default_zone':'Bao_Ha_Runoff',
              'full_gpu_export_verified_locally':False}
    (OUT/'bundle_manifest_v7_1.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    assert original.read_bytes()==original_bytes,'Original v7 snapshot changed'
    print(json.dumps({'notebook':str(path),'cells':len(notebook['cells']),
                      'changed_source_files':list(CHANGED),'original_v7_preserved':True},indent=2))
    return path


if __name__=='__main__':
    build()
