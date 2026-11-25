"""Build a self-contained CPU acquisition notebook without TensorFlow or CUDA."""
from __future__ import annotations
import base64
import hashlib
import json
from pathlib import Path
import textwrap
import zlib

from build_revision_kaggle_bundle import cell, UV_BOOTSTRAP_CODE

ROOT = Path(__file__).resolve().parents[1]
INPUTS = ['notebooks/prepare_glofas_revision_data.py', 'notebooks/glofas_data_bundle.py',
          'notebooks/test_glofas_data_bundle.py', 'notebooks/requirements_glofas_cpu.lock.txt',
          'data/source_manifest.glofas.verified.json']


def build(output: Path) -> Path:
    files = {name:(ROOT/name).read_bytes() for name in INPUTS}
    encoded = {name:base64.b64encode(zlib.compress(value,9)).decode() for name,value in files.items()}
    hashes = {name:hashlib.sha256(value).hexdigest() for name,value in files.items()}
    extraction = '''
    import base64, hashlib, json, os, shutil, subprocess, sys, zipfile, zlib
    from pathlib import Path
    from datetime import datetime, timezone
    ROOT = Path('/kaggle/working/CuuNet_glofas_cpu')
    ROOT.mkdir(parents=True, exist_ok=True)
    FILES = json.loads(ENCODED)
    HASHES = json.loads(HASH_LITERAL)
    for relative,value in FILES.items():
        target = (ROOT/relative).resolve()
        assert target.is_relative_to(ROOT.resolve())
        data = zlib.decompress(base64.b64decode(value))
        assert hashlib.sha256(data).hexdigest()==HASHES[relative], relative
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
    CHILD_ENV = os.environ.copy()
    CHILD_ENV.update({'CUDA_VISIBLE_DEVICES':'-1','UV_CACHE_DIR':str(ROOT/'.uv_cache'),
                      'UV_PYTHON_INSTALL_DIR':str(ROOT/'.managed_python')})
    def run(command, **kwargs):
        return subprocess.run([str(value) for value in command],cwd=ROOT,env=CHILD_ENV,check=True,**kwargs)
    STAMP = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    CHECKPOINT = Path('/kaggle/working/CuuNet_GloFAS_checkpoint.zip')
    print('CPU acquisition notebook v1; no neural training or GPU runtime')
    '''.replace('ENCODED',repr(json.dumps(encoded))).replace('HASH_LITERAL',repr(json.dumps(hashes)))
    cells = [
        cell('markdown','''
        # CuuNet GloFAS acquisition on CPU

        Chọn **Accelerator None**, bật Internet và giữ notebook private. Chờ Copernicus không cần GPU.
        Dữ liệu cần có: GloFAS v4 daily discharge 2000–2024 cho Bảo Hà và Cần Thơ, ban đầu 50 request theo năm.
        Không cần đăng ký ERA5, SRTM hay dữ liệu xã hội cho mô hình ba đầu vào đã khóa.

        Trong Add-ons → Secrets, thêm `CDSAPI_KEY` của EWDS sau khi chấp nhận giấy phép CEMS-FLOODS.
        Mã không ghi token vào file. Mã yêu cầu hiện tại được dùng lại và kiểm tra đầy đủ trước khi tải.
        Sau khi có ZIP dữ liệu hoàn chỉnh, gắn nó làm Kaggle Dataset private cho notebook GPU v6.
        '''),
        cell('code',textwrap.dedent(extraction)),
        cell('markdown','## 1 Install the small CPU environment\n\nPython 3.12 và 21 gói có hash, không cài TensorFlow, converter hay CUDA.'),
        cell('code', UV_BOOTSTRAP_CODE + textwrap.dedent('''
        RUNTIME = ROOT/'.runtime_glofas_cpu'
        PYTHON = RUNTIME/'bin/python'
        if not PYTHON.is_file():
            run([UV,'venv','--python','3.12','--managed-python',RUNTIME])
        run([UV,'pip','install','--python',PYTHON,'--require-hashes','-r',ROOT/'notebooks/requirements_glofas_cpu.lock.txt'])
        run([PYTHON,'notebooks/test_glofas_data_bundle.py'])
        ''')),
        cell('markdown','''
        ## 2 Restore saved requests and record the existing job

        Nếu đã có checkpoint từ lần chạy trước, gắn ZIP đó làm Kaggle Dataset private và điền đường dẫn vào
        `IMPORT_CHECKPOINT`. Nếu vẫn dùng phiên đang có dữ liệu, có thể để None.
        Mã Bảo Hà năm 2000 lấy từ ảnh bạn gửi; nếu job đó đã bị xóa hoặc hết hạn, chương trình dừng để bạn kiểm tra.
        Cell này chỉ ghi mã hiện có vào nhật ký, chưa liên hệ Copernicus hay gửi yêu cầu mới.
        '''),
        cell('code','''
        IMPORT_CHECKPOINT = None  # '/kaggle/input/.../CuuNet_GloFAS_checkpoint.zip'
        EXISTING_REQUESTS = ['Bao_Ha_Reach:2000:30c75b54-8d44-4d31-aae9-0ab722e0722b']
        if IMPORT_CHECKPOINT:
            run([PYTHON,'notebooks/glofas_data_bundle.py','--import',IMPORT_CHECKPOINT])
        command = [PYTHON,'notebooks/prepare_glofas_revision_data.py','--register-only','--checkpoint-out',CHECKPOINT]
        for request in EXISTING_REQUESTS: command += ['--adopt-request',request]
        run(command)
        from IPython.display import FileLink, display
        display(FileLink(str(CHECKPOINT)))
        print('Save this checkpoint before leaving the session. It contains UUIDs and parameters, no token.')
        '''),
        cell('markdown','''
        ## 3 Download sequentially and prepare the monthly data

        Mỗi job mới được ghi vào nhật ký và checkpoint ngay sau submit, trước khi đợi.
        Dừng tiến trình không gọi delete; khi chạy lại, chương trình nối tới UUID đã lưu thay vì gửi trùng.
        File checkpoint trong Outputs được làm mới ở mỗi bước. Hãy tải checkpoint và các dữ liệu đã có về trước khi kết thúc phiên.
        Các phần hoàn tất được kiểm tra hash; kế hoạch chia nhỏ request cũng được giữ lại.
        '''),
        cell('code','''
        from kaggle_secrets import UserSecretsClient
        CHILD_ENV['CDSAPI_KEY'] = UserSecretsClient().get_secret('CDSAPI_KEY')
        CHILD_ENV['CDSAPI_URL'] = 'https://ewds.climate.copernicus.eu/api'
        assert CHILD_ENV['CDSAPI_KEY'], 'Missing private CDSAPI_KEY secret'
        COMPLETE = False
        try:
            run([PYTHON,'notebooks/prepare_glofas_revision_data.py','--download-only','--checkpoint-out',CHECKPOINT])
            run([PYTHON,'notebooks/prepare_glofas_revision_data.py','--prepare-only'])
            COMPLETE = True
        finally:
            run([PYTHON,'notebooks/glofas_data_bundle.py','--export',CHECKPOINT,'--metadata-only'])
            label = 'data' if COMPLETE else 'partial'
            ARCHIVE = Path('/kaggle/working')/('CuuNet_GloFAS_'+label+'_'+STAMP+'.zip')
            run([PYTHON,'notebooks/glofas_data_bundle.py','--export',ARCHIVE])
            display(FileLink(str(CHECKPOINT)))
            display(FileLink(str(ARCHIVE)))
        assert COMPLETE, 'Keep the partial archive and checkpoint to resume acquisition'
        print('Data complete. Stop the CPU session; attach this private archive to GPU notebook v6 later.')
        ''')
    ]
    for i,item in enumerate(cells):
        item['id'] = f'glofas-cpu-{i:02d}'
        if item['cell_type']=='code': compile(''.join(item['source']),f'cpu_cell_{i}','exec')
    notebook = {'cells':cells,'metadata':{'cuunet_acquisition_revision':1,
        'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},
        'language_info':{'name':'python','version':'3.12'}},'nbformat':4,'nbformat_minor':5}
    output.mkdir(parents=True,exist_ok=True)
    target = output/'CuuNet_GloFAS_Acquire_CPU_v1.ipynb'
    target.write_text(json.dumps(notebook,ensure_ascii=False,indent=1),encoding='utf-8')
    print(json.dumps({'cpu_notebook':str(target),'inputs':len(files),
                      'code_cells_compiled':sum(item['cell_type']=='code' for item in cells)}))
    return target


if __name__=='__main__':
    build(ROOT/'paper_submission/kaggle_revision')
