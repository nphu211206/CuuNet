"""Add isolated two-GPU orchestration to the frozen, verified v7.1 notebook."""
import ast,base64,hashlib,json,zlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'paper_submission/kaggle_revision'
ADDED=('notebooks/revision_dual_gpu.py','notebooks/dual_gpu_preflight.py','notebooks/test_dual_gpu_execution.py')


def build():
    original=OUT/'CuuNet_HYDRO_Physical_Kaggle_v7_1.ipynb';original_bytes=original.read_bytes()
    nb=json.loads(original_bytes)
    cell=next(c for c in nb['cells'] if c['cell_type']=='code' and 'FILES = json.loads' in ''.join(c['source']))
    source=''.join(cell['source']);assignments={}
    for node in ast.parse(source).body:
        if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ('FILES','HASHES'):
            assignments[node.targets[0].id]=(node,json.loads(ast.literal_eval(node.value.args[0])))
    files={name:zlib.decompress(base64.b64decode(data)) for name,data in assignments['FILES'][1].items()}
    for name,data in files.items():assert hashlib.sha256(data).hexdigest()==assignments['HASHES'][1][name],name
    for name in ADDED:files[name]=(ROOT/name).read_bytes()
    context=json.loads(files['revision_bundle_context.json'])
    context.update(format='cuunet-kaggle-physical-v8',base_notebook_sha256=hashlib.sha256(original_bytes).hexdigest(),
        execution='two isolated single-GPU training workers; unchanged canonical v7 scoring and source',
        gpu_preflight_verified_on_author_machine=False)
    for name in ADDED:context['source_sha256'][name]=hashlib.sha256(files[name]).hexdigest()
    files['revision_bundle_context.json']=json.dumps(context,indent=2).encode()
    encoded={name:base64.b64encode(zlib.compress(data,9)).decode() for name,data in files.items()}
    hashes={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
    lines=source.splitlines(keepends=True)
    for name,(node,_) in sorted(assignments.items(),key=lambda pair:pair[1][0].lineno,reverse=True):
        values=encoded if name=='FILES' else hashes
        lines[node.lineno-1:node.end_lineno]=[f'{name} = json.loads({json.dumps(values)!r})\n']
    cell['source']=''.join(lines).replace("print('Notebook revision:', '7.1', flush=True)",
                                         "print('Notebook revision:', '8 dual-GPU', flush=True)").splitlines(keepends=True)
    nb['cells'][0]['source']=[
        '# CuuNet physical target experiments v8 two GPUs\n\n',
        'Chọn **GPU T4 ×2** và Internet ON. Mặc định chạy **USGS_06903900**; mỗi lượt một trạm.\n',
        'Hai tiến trình chia đủ 15 mô hình, mỗi tiến trình một GPU và checkpoint riêng. Seed, kiến trúc và split giữ nguyên v7.1.\n',
        'Baseline CPU chạy đồng thời với huấn luyện GPU và in tiến độ. Chỉ chấm điểm sau khi đủ mô hình đã kiểm tra checksum.\n',
        'Mandatory preflight chạy tensor tổng hợp nhỏ trên cả hai GPU, kiểm tra save/load và đối chiếu với chạy tuần tự. Nếu thất bại, huấn luyện chính bị chặn.\n',
        'Các kiểm thử điều phối đã chạy trên máy tác giả; preflight hai GPU thực cần xác nhận trên Kaggle. Không hứa tốc độ gấp đôi toàn bộ notebook.\n',
        'Ba vùng Việt Nam đã hoàn tất: dùng bản này cho các trạm Iowa còn thiếu. Không gọi Copernicus EWDS/MARS.\n']
    for c in nb['cells']:
        text=''.join(c['source'])
        if c['cell_type']=='code' and "BENCHMARK = 'vietnam'" in text:
            text=text.replace("BENCHMARK = 'vietnam'  # This run uses the attached complete level-7 Vietnam dataset.",
                "BENCHMARK = 'observed'  # Supplementary observed discharge benchmark.").replace(
                "ZONE_ID = 'Bao_Ha_Runoff'  # Other Vietnam zones: Gianh_Runoff, Can_Tho_Runoff.",
                "ZONE_ID = 'USGS_06903900'  # Next: USGS_05421000, USGS_05453520.")
            text=text.replace("assert BENCHMARK in ('observed','vietnam')",
                "assert BENCHMARK in ('observed','vietnam')\n"
                "GPU_TOOL = shutil.which('nvidia-smi')\n"
                "assert GPU_TOOL, 'Select GPU T4 x2 for v8; nvidia-smi is unavailable'\n"
                "GPU_INVENTORY = subprocess.check_output([GPU_TOOL,'--query-gpu=index,uuid,name','--format=csv,noheader'],text=True)\n"
                "GPU_INDICES = {int(line.split(',')[0].strip()) for line in GPU_INVENTORY.splitlines() if line.strip()}\n"
                "assert {0,1}.issubset(GPU_INDICES), 'v8 requires GPU IDs 0 and 1; select T4 x2'\n"
                "print('Physical GPU inventory:',GPU_INVENTORY,flush=True)")
        if c['cell_type']=='code' and "run([NODE,'--test'" in text:
            text=text.replace("run([PYTHON,'notebooks/test_revision_handoff_v7.py'])",
                "run([PYTHON,'notebooks/test_revision_handoff_v7.py'])\nrun([PYTHON,'notebooks/test_dual_gpu_execution.py'])")
            text=text.replace('PREFLIGHT_OK=True',
                "run([PYTHON,'notebooks/dual_gpu_preflight.py','--output-dir',OUTPUT/'dual_gpu_preflight'],timeout=1200)\n"
                "DUAL_PREFLIGHT=json.loads((OUTPUT/'dual_gpu_preflight/dual_gpu_preflight_result.json').read_text())\n"
                "assert DUAL_PREFLIGHT['passed'] and DUAL_PREFLIGHT['publication_eligible'] is False\n"
                "shutil.copy2(OUTPUT/'dual_gpu_preflight/dual_gpu_preflight_result.json',PRIMARY/'dual_gpu_preflight_result.json')\n"
                "PREFLIGHT_OK=True")
            text=text.replace('Both daily deployment shapes passed numerical export checks.',
                              'Export equivalence and both GPU training/serialization preflights passed.')
        if c['cell_type']=='code' and 'command=[str(PYTHON)' in text:
            text=text.replace("'notebooks/revision_experiments.py'","'notebooks/revision_dual_gpu.py'")
            text=text.replace("'--bootstrap-repetitions','2000']","'--bootstrap-repetitions','2000','--gpu-ids','0,1']")
        if c['cell_type']=='code' and "ARCHIVE=Path('/kaggle/working')" in text:
            text=text.replace("'CuuNet_v7_'","'CuuNet_v8_'")
        c['source']=text.splitlines(keepends=True) if c['cell_type']=='code' else c['source']
    for i,c in enumerate(nb['cells']):
        c['id']=f'physical-v8-{i:02d}'
        if c['cell_type']=='code':compile(''.join(c['source']),f'v8_cell_{i}','exec')
    nb['metadata']['cuunet_notebook_revision']=8
    path=OUT/'CuuNet_HYDRO_Physical_Kaggle_v8_DualGPU.ipynb'
    path.write_text(json.dumps(nb,ensure_ascii=False,indent=1),encoding='utf-8')
    manifest={**context,'notebook_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'bytes':path.stat().st_size,'cells':len(nb['cells']),'default_benchmark':'observed','default_zone':'USGS_06903900'}
    (OUT/'bundle_manifest_v8.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    assert original.read_bytes()==original_bytes,'v7.1 was changed'
    print(json.dumps({'notebook':str(path),'bytes':path.stat().st_size,'cells':len(nb['cells']),
        'unchanged_canonical_source_sha256':hashes['notebooks/revision_experiments.py'],'added_sources':list(ADDED)},indent=2))
    return path


if __name__=='__main__':build()
