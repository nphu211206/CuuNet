"""Generate a self-contained Kaggle notebook and a hash-checked research input ZIP."""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import subprocess
import textwrap
import zipfile
import zlib
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP_REVISION = 2
NOTEBOOK_REVISION = 6
UV_BOOTSTRAP_CODE = '''
# Kaggle's distribution Python may have pip but no working ensurepip.
# Install only uv into a task-local target using the existing kernel pip.
UV_TOOLS = ROOT / '.bootstrap_uv_v2'
UV_TOOLS.mkdir(parents=True, exist_ok=True)
run([sys.executable, '-m', 'pip', '--version'])
UV = UV_TOOLS / 'bin' / ('uv.exe' if os.name == 'nt' else 'uv')
uv_cached = False
if UV.is_file():
    uv_cached = run([UV, '--version'], capture_output=True, text=True).stdout.strip().startswith('uv 0.9.6')
if not uv_cached:
    run([sys.executable, '-m', 'pip', 'install', '--no-deps', '--upgrade',
         '--target', UV_TOOLS, 'uv==0.9.6'])
assert UV.is_file(), 'uv executable not found after pip --target installation'
uv_version = run([UV, '--version'], capture_output=True, text=True).stdout.strip()
assert uv_version.startswith('uv 0.9.6'), uv_version
print('Bootstrap v2 ready:', uv_version, '- no Python ensurepip required', flush=True)
'''
INPUT_FILES = [
    "notebooks/glofas_data_bundle.py", "notebooks/test_glofas_data_bundle.py",
    "notebooks/requirements_glofas_cpu.lock.txt",
    "notebooks/prepare_glofas_revision_data.py", "notebooks/revision_experiments.py",
    "notebooks/verify_tfjs_equivalence.mjs", "notebooks/test_tfjs_equivalence.mjs",
    "notebooks/test_revision_pipeline.py", "notebooks/audit_revision_outputs.py",
    "notebooks/finalize_revision_bundle.py", "notebooks/export_browser_benchmark.py",
    "notebooks/requirements_revision_kaggle.txt", "notebooks/requirements_revision_kaggle.lock.txt",
    "src/simulation/sybil_revision_experiments.py", "src/simulation/sybil_pipeline_campaign.py",
    "data/source_manifest.glofas.verified.json", "analysis/verified_bibliography.glofas.csv",
    "data/experiment_manifest.synthetic.json", "data/Quang_Binh_monthly_risk_index.csv",
    "data/Lao_Cai_monthly_risk_index.csv", "data/Can_Tho_monthly_risk_index.csv",
]


def cell(kind, text):
    source = textwrap.dedent(text).strip() + "\n"
    result = {"cell_type": kind, "metadata": {}, "source": source.splitlines(keepends=True)}
    if kind == "code":
        result.update({"execution_count": None, "outputs": []})
    return result


def make_notebook(files: dict[str, bytes]) -> dict:
    encoded = {name: base64.b64encode(zlib.compress(content, 9)).decode("ascii") for name, content in files.items()}
    hashes = {name: hashlib.sha256(content).hexdigest() for name, content in files.items()}
    extraction = '''
import base64, hashlib, json, os, shutil, subprocess, sys, time, zipfile, zlib
from pathlib import Path
from datetime import datetime, timezone
ROOT = Path('/kaggle/working/CuuNet_revision')
ROOT.mkdir(parents=True, exist_ok=True)
FILES = json.loads(ENCODED_LITERAL)
HASHES = json.loads(HASHES_LITERAL)
for relative, compressed in FILES.items():
    target = (ROOT / relative).resolve()
    assert target.is_relative_to(ROOT.resolve()), 'Input path left the notebook workspace'
    target.parent.mkdir(parents=True, exist_ok=True)
    content = zlib.decompress(base64.b64decode(compressed))
    assert hashlib.sha256(content).hexdigest() == HASHES[relative], relative
    target.write_bytes(content)
CHILD_ENV = os.environ.copy()
CHILD_ENV.update({'CUDA_VISIBLE_DEVICES':'0', 'PYTHONHASHSEED':'0', 'OMP_NUM_THREADS':'2',
                  'UV_CACHE_DIR':str(ROOT / '.uv_cache'), 'UV_PYTHON_INSTALL_DIR':str(ROOT / '.managed_python'),
                  'NPM_CONFIG_CACHE':str(ROOT / '.npm_cache')})
STAMP = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
OUTPUT = Path('/kaggle/working') / ('CuuNet_revision_results_' + STAMP)
OUTPUT.mkdir(parents=True, exist_ok=True)
PREFLIGHT_OK = False
def run(command, **kwargs):
    return subprocess.run([str(value) for value in command], cwd=ROOT, env=CHILD_ENV, check=True, **kwargs)
print('Extracted', len(FILES), 'verified input files')
print('Results folder:', OUTPUT)
print('Notebook bootstrap revision: 2', flush=True)
print('Notebook revision:', NOTEBOOK_REVISION_LITERAL, flush=True)
'''.replace("ENCODED_LITERAL", repr(json.dumps(encoded))).replace("HASHES_LITERAL", repr(json.dumps(hashes))).replace("NOTEBOOK_REVISION_LITERAL", str(NOTEBOOK_REVISION))
    cells = [
        cell("markdown", '''
        # CuuNet HYDRO revision experiments

        Notebook này dùng **GloFAS v4 reanalysis đã tải trên CPU** và chạy thí nghiệm tái lập cho HYDRO-D-26-00188.
        Dữ liệu không phải số đo trạm. Kiểm định này thay mục tiêu thực nghiệm bằng lưu lượng trung bình tháng;
        nó không xác thực chỉ số rủi ro cũ, báo cáo VGI thực tế hoặc tác động của bão Yagi.

        Trước khi chạy:

        1. Tạo notebook **private**, bật **Internet** và **GPU T4**. Nếu Kaggle chỉ có T4 ×2, chọn mục đó; mã chỉ dùng GPU số 0.
        2. Chạy notebook `CuuNet_GloFAS_Acquire_CPU_v1.ipynb` trước với Accelerator **None**, hoặc dùng downloader trên máy cá nhân.
        3. Khi có `CuuNet_GloFAS_data_<timestamp>.zip`, tải nó lên Kaggle Dataset **private** và gắn dataset vào notebook này. Notebook GPU không cần token Copernicus.
        4. Chạy các cell theo thứ tự. Notebook tự chứa mã và cấu hình; không cần thêm repository làm Kaggle Dataset.

        Kết quả cần gửi lại là ZIP được tạo ở cuối notebook. Việc tạo notebook chưa cung cấp kết quả dự báo hay số đo latency.
        '''),
        cell("markdown", "## 1 Extract the verified source snapshot\n\nCell này khôi phục các file được đóng gói và kiểm tra SHA-256."),
        cell("code", extraction),
        cell("markdown", '''
        ## 2 Create the locked Python and Node environment

        Python 3.12 được quản lý riêng để tránh xung đột với image mặc định của Kaggle.
        Lockfile đã được giải quyết cho Linux và chứa hash của các gói, gồm TensorFlow 2.19 và converter 4.22.
        Bước cài đặt đầu tiên có thể mất vài phút vì bao gồm thư viện CUDA.
        '''),
        cell("code", UV_BOOTSTRAP_CODE + textwrap.dedent('''
        RUNTIME = ROOT / '.runtime_py312_v2'
        PYTHON = RUNTIME / 'bin' / 'python'
        if not PYTHON.is_file():
            run([UV, 'venv', '--python', '3.12', '--managed-python', RUNTIME])
        run([PYTHON, '-c', "import sys; assert sys.version_info[:2] == (3,12), sys.version; print('Managed runtime:',sys.version)"])
        run([UV, 'pip', 'install', '--python', PYTHON, 'pip==25.2'])
        run([UV, 'pip', 'install', '--python', PYTHON, '--require-hashes', '-r', ROOT / 'notebooks/requirements_revision_kaggle.lock.txt'])
        NODE = shutil.which('node')
        if NODE is None or int(subprocess.check_output([NODE, '--version'], text=True).strip().lstrip('v').split('.')[0]) < 18:
            run([PYTHON, '-m', 'nodeenv', '--prebuilt', '--node=22.14.0', ROOT / '.node'])
            NODE = str(ROOT / '.node/bin/node')
        CHILD_ENV['PATH'] = str(PYTHON.parent) + os.pathsep + str(Path(NODE).parent) + os.pathsep + CHILD_ENV['PATH']
        package = {'private':True, 'type':'module', 'dependencies':{'@tensorflow/tfjs':'4.22.0','@tensorflow/tfjs-backend-wasm':'4.22.0'}}
        (ROOT / 'package.json').write_text(json.dumps(package, indent=2))
        NPM = shutil.which('npm', path=CHILD_ENV['PATH'])
        assert NPM, 'npm was not installed with Node'
        run([NPM, 'install', '--ignore-scripts', '--no-audit', '--no-fund'])
        run([PYTHON, '-c', "import tensorflow as tf; import tensorflowjs, ydf; from google import protobuf; print('TensorFlow',tf.__version__); print('Converter dependencies: YDF',ydf.__version__,'Protobuf',protobuf.__version__); assert ydf.__version__=='0.11.0' and protobuf.__version__=='5.29.6'; devices=tf.config.list_physical_devices('GPU'); print('Visible GPUs',devices); assert len(devices)==1, 'Enable a Kaggle T4 accelerator before the reference run'"])
        print('Locked Python and TensorFlow.js environment is ready')
        ''')),
        cell("markdown", '''
        ## 3 Run safety tests and an end to end synthetic preflight

        Đây là kiểm thử mã. Mọi kết quả trong thư mục `preflight_synthetic` bị đánh dấu không đủ điều kiện đưa vào bài báo.
        Preflight chạy một mạng nhỏ trong hai epoch để kiểm tra Keras → official TF.js converter → nạp model → đối chiếu số.
        Không tải dữ liệu tài khoản nếu bước này thất bại.
        '''),
        cell("code", '''
        PREFLIGHT_OK = False
        run([NODE, '--test', 'notebooks/test_tfjs_equivalence.mjs'])
        run([PYTHON, 'notebooks/revision_experiments.py', '--manifest', 'data/experiment_manifest.synthetic.json',
             '--output-dir', ROOT / 'analysis/revision_smoke/statistical', '--allow-synthetic', '--skip-neural', '--bootstrap-repetitions', '40'])
        run([PYTHON, 'notebooks/test_revision_pipeline.py'])
        smoke = json.loads((ROOT / 'data/experiment_manifest.synthetic.json').read_text())
        smoke['zones'] = smoke['zones'][:1]
        smoke['training'].update({'seeds':[42], 'epochs':2, 'early_stopping_patience':2, 'lstm_units':8,
                                  'attention_units':4, 'unroll_lstm':True})
        smoke['bootstrap_block_length'] = 12
        smoke_path = ROOT / 'data/experiment_manifest.neural_smoke.json'
        smoke_path.write_text(json.dumps(smoke, indent=2))
        SMOKE_OUTPUT = OUTPUT / 'preflight_synthetic'
        run([PYTHON, 'notebooks/revision_experiments.py', '--manifest', smoke_path, '--output-dir', SMOKE_OUTPUT,
             '--allow-synthetic', '--bootstrap-repetitions', '40'])
        smoke_results = json.loads((SMOKE_OUTPUT / 'manuscript_results.json').read_text())
        assert smoke_results['publication_eligible'] is False
        equivalence = smoke_results['quantisation_equivalence']
        if not equivalence or not all(row['status']=='completed' for row in equivalence):
            conversion = json.loads((SMOKE_OUTPUT / 'tfjs_conversion.json').read_text())
            print('TF.js conversion diagnostics:', json.dumps(conversion, indent=2), flush=True)
            print('TF.js equivalence diagnostics:', json.dumps(equivalence, indent=2), flush=True)
            raise RuntimeError('TF.js preflight failed; the converter and equivalence errors are printed above')
        PREFLIGHT_OK = True
        print('Preflight passed; synthetic metrics remain excluded from the manuscript')
        '''),
        cell("markdown", '''
        ## 4 Import and audit the previously acquired physical target

        Huấn luyện 2000–2017, validation 2018–2020, test 2021–2024. Chọn ô sông chỉ từ thời kỳ huấn luyện.
        Dữ liệu gốc, request receipts, SHA-256, độ phủ ngày và vị trí ô đã chọn đều được lưu.
        Cell này chỉ đọc archive đã tải, kiểm tra hash và xử lý lại dữ liệu ngày. Nó không gửi job hay chờ hàng đợi Copernicus.
        Tháng 9/2024 là chẩn đoán held-out; chỉ đoạn sông phía Bắc trùng phạm vi địa lý của Yagi.
        '''),
        cell("code", '''
        assert PREFLIGHT_OK, 'Complete the preflight first'
        DATA_ARCHIVE = None  # Optionally set the exact /kaggle/input/.../CuuNet_GloFAS_data_....zip path.
        candidates = []
        for path in Path('/kaggle/input').rglob('*.zip'):
            try:
                with zipfile.ZipFile(path) as zipped:
                    context = json.loads(zipped.read('glofas_bundle_manifest.json'))
                if context.get('format')=='cuunet-glofas-data-v1' and context.get('metadata_only') is False and 'data/experiment_manifest.glofas.json' in context.get('files',{}):
                    candidates.append(path)
            except (KeyError, ValueError, zipfile.BadZipFile):
                continue
        if DATA_ARCHIVE is None:
            assert len(candidates)==1, 'Attach exactly one completed private CuuNet GloFAS data archive, or set DATA_ARCHIVE explicitly'
            DATA_ARCHIVE = candidates[0]
        run([PYTHON, 'notebooks/glofas_data_bundle.py', '--import', DATA_ARCHIVE])
        run([PYTHON, 'notebooks/prepare_glofas_revision_data.py', '--prepare-only'])
        MANIFEST = ROOT / 'data/experiment_manifest.glofas.json'
        assert MANIFEST.is_file()
        selection = json.loads((ROOT / 'data/glofas_revision/glofas_selection_audit.json').read_text())
        for zone in selection['zones']:
            print(zone['zone'], 'grid', zone['selected_grid_latitude'], zone['selected_grid_longitude'],
                  'distance km', round(zone['distance_from_reach_centre_km'],2), 'missing fraction', zone['missing_daily_fraction'])
        '''),
        cell("markdown", '''
        ## 5 Run the reference forecasting experiments

        Hai kiến trúc × năm seed × hai đoạn sông. Baselines gồm persistence, seasonal persistence, moving average,
        linear trend, seasonal decomposition, equal weights và expected-MSE weights có cả bias.
        Dự báo một tháng tới được cập nhật bằng lịch sử trước thời điểm dự báo; không mô phỏng mất nguồn dữ liệu trong nhiều tháng.
        '''),
        cell("code", '''
        assert PREFLIGHT_OK and MANIFEST.is_file()
        run([PYTHON, 'notebooks/revision_experiments.py', '--manifest', MANIFEST, '--output-dir', OUTPUT,
             '--bootstrap-repetitions', '2000'])
        physical_results = json.loads((OUTPUT / 'manuscript_results.json').read_text())
        assert physical_results['audited'] and physical_results['publication_eligible'], 'Physical forecast output audit did not pass'
        print(json.dumps(physical_results['claims_eligible'], indent=2))
        '''),
        cell("markdown", '''
        ## 6 Run the synthetic spatial and Sybil experiments

        Mass-assignment stress tests dùng 2,000 lần thử mỗi kịch bản. Campaign không gian dùng 500 lần thử, 10 vòng,
        bot giả vị trí, cụm ở xa, phân tán, báo cáo cũ và cold-start của người thật.
        Feedback từ oracle mô phỏng và feedback từ chính consensus được báo cáo riêng. Mọi kết quả vẫn được gắn nhãn synthetic.
        '''),
        cell("code", '''
        assert physical_results['audited']
        run([PYTHON, 'src/simulation/sybil_revision_experiments.py', '--output-dir', OUTPUT / 'sybil_static',
             '--trials', '2000', '--seed', '42', '--threshold', '0.75'])
        run([PYTHON, 'src/simulation/sybil_pipeline_campaign.py', '--output-dir', OUTPUT / 'sybil_campaign',
             '--trials', '500', '--seed', '4242'])
        (OUTPUT / 'python_environment.txt').write_text(subprocess.check_output([str(PYTHON),'-m','pip','freeze'],text=True,env=CHILD_ENV))
        (OUTPUT / 'node_version.txt').write_text(subprocess.check_output([str(NODE),'--version'],text=True,env=CHILD_ENV))
        shutil.copy2(ROOT / 'package-lock.json', OUTPUT / 'node_package_lock.json')
        shutil.copy2(ROOT / 'notebooks/requirements_revision_kaggle.lock.txt', OUTPUT / 'python_requirements_lock.txt')
        run([PYTHON, 'notebooks/finalize_revision_bundle.py', '--output-dir', OUTPUT,
             '--static-sybil-dir', OUTPUT / 'sybil_static', '--campaign-dir', OUTPUT / 'sybil_campaign'])
        '''),
        cell("markdown", '''
        ## 7 Return the complete results archive

        ZIP bao gồm dữ liệu nguồn, mô hình từng seed, hai bản TF.js, dự báo từng tháng, CI, log Sybil và kiểm toán.
        Nếu giữ các claim latency hay offline browser, hãy đo thêm bằng trang `browser_benchmark` trên thiết bị có tên cụ thể
        và gửi các CSV thật. Kaggle không tự tạo số đo điện thoại, pin hoặc triển khai thực địa.
        '''),
        cell("code", '''
        summary = json.loads((OUTPUT / 'bundle_summary.json').read_text())
        assert all(summary[key] for key in ('forecast_audit_passed','static_sybil_audit_passed','campaign_audit_passed'))
        ARCHIVE = Path('/kaggle/working') / ('CuuNet_HYDRO_revision_results_' + STAMP + '.zip')
        with zipfile.ZipFile(ARCHIVE,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as zipped:
            for source in sorted(OUTPUT.rglob('*')):
                if source.is_file(): zipped.write(source,source.relative_to(OUTPUT).as_posix())
        from IPython.display import FileLink, display
        print('ZIP bytes:', ARCHIVE.stat().st_size)
        print(json.dumps(summary,indent=2))
        display(FileLink(str(ARCHIVE)))
        ''')
    ]
    for number, item in enumerate(cells):
        item["id"] = f"revision-{number:02d}"
        if item["cell_type"] == "code":
            compile("".join(item["source"]), f"kaggle_cell_{number}", "exec")
    return {"cells": cells, "metadata": {"cuunet_bootstrap_revision": BOOTSTRAP_REVISION,
        "cuunet_notebook_revision": NOTEBOOK_REVISION,
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.12"}}, "nbformat": 4, "nbformat_minor": 5}


def build(output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    files = {relative: (ROOT / relative).read_bytes() for relative in INPUT_FILES}
    try:
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        commit = None
    context = {"prepared_at_utc": datetime.now(timezone.utc).isoformat(), "source_git_commit": commit,
        "bootstrap_revision": BOOTSTRAP_REVISION, "notebook_revision": NOTEBOOK_REVISION,
        "contains_uncommitted_revision_code": True, "publication_data_included": False,
        "source_sha256": {name: hashlib.sha256(data).hexdigest() for name, data in files.items()},
        "purpose": "physical reanalysis acquisition and forecasting, plus separately labelled synthetic adversarial experiments"}
    files["revision_bundle_context.json"] = json.dumps(context, indent=2).encode()
    notebook = make_notebook(files)
    notebook_path = output_dir / "CuuNet_HYDRO_Revision_Kaggle.ipynb"
    notebook_path.write_text(json.dumps(notebook, ensure_ascii=False, indent=1), encoding="utf-8")
    versioned_notebook = output_dir / f"CuuNet_HYDRO_Revision_Kaggle_v{NOTEBOOK_REVISION}.ipynb"
    versioned_notebook.write_bytes(notebook_path.read_bytes())
    zip_path = output_dir / "CuuNet_revision_inputs.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zipped:
        for name, data in files.items():
            zipped.writestr(name, data)
    manifest = {"input_files": len(files), "notebook_cells": len(notebook["cells"]), "source_context": context,
        "bootstrap_revision": BOOTSTRAP_REVISION, "notebook_revision": NOTEBOOK_REVISION, "versioned_notebook": versioned_notebook.name,
        "notebook_sha256": hashlib.sha256(notebook_path.read_bytes()).hexdigest(), "input_zip_sha256": hashlib.sha256(zip_path.read_bytes()).hexdigest()}
    (output_dir / "bundle_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    # Verify that both deliverables carry the same exact source bytes.
    with zipfile.ZipFile(zip_path) as zipped:
        assert all(zipped.read(name) == data for name, data in files.items())
    print(json.dumps({"notebook": str(notebook_path), "input_zip": str(zip_path), "files": len(files),
                      "notebook_bytes": notebook_path.stat().st_size, "code_cells_compiled": sum(cell["cell_type"] == "code" for cell in notebook["cells"])}, indent=2))
    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("paper_submission/kaggle_revision"))
    args = parser.parse_args()
    output = args.output_dir if args.output_dir.is_absolute() else ROOT / args.output_dir
    build(output)


if __name__ == "__main__":
    main()
