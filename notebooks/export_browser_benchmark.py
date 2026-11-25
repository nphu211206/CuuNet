"""Package an offline-capable browser benchmark for the newly exported models.

The page measures real browser repetitions. Creating it does not create latency
results; those must be collected on named devices and returned as raw CSV files.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path


HTML = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CuuNet browser inference benchmark</title><link rel="stylesheet" href="benchmark.css"></head>
<body><main><p class="eyebrow">HYDRO-D-26-00188</p><h1>CuuNet browser inference benchmark</h1>
<p>Measure one monthly forecast on a fixed held-out input. Results describe this device and backend.</p>
<div class="controls"><label>River reach<select id="zone"></select></label>
<label>Backend<select id="backend"><option value="webgl">WebGL</option><option value="wasm">WASM</option><option value="cpu">CPU</option></select></label>
<label>Weight storage<select id="precision"><option value="uint8">uint8 weights</option><option value="fp32">FP32 weights</option></select></label>
<label>Device model<input id="device" placeholder="For example Redmi 9 or desktop CPU model" required></label></div>
<p id="cache" role="status">Preparing local cache...</p>
<button id="run" disabled>Run 50 measured repetitions</button><button id="download" disabled>Download raw CSV</button>
<p id="status" role="status">Loading benchmark configuration...</p><pre id="summary"></pre>
<p class="note">The first load caches the page, models and fixed inputs. Local inference and queued inputs do not establish multi-device offline consensus. uint8 refers to stored weights, which are dequantized for float backend kernels. Tensor allocation is not total browser RAM.</p>
</main><script src="vendor/tf.min.js"></script><script src="vendor/tfjs-backend-wasm.min.js"></script><script src="benchmark.js"></script></body></html>'''

CSS = '''*{box-sizing:border-box}body{margin:0;background:#f3f5f7;color:#17212b;font:16px/1.5 system-ui,sans-serif}main{max-width:900px;margin:32px auto;padding:32px;background:white;border:1px solid #d7dee5;border-radius:12px}h1{font-size:28px;line-height:1.2;margin:8px 0 20px}.eyebrow{font-size:13px;letter-spacing:.04em;color:#475569}.controls{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0}label{display:grid;gap:7px;font-weight:600}select,input,button{font:inherit;padding:11px;border:1px solid #aab6c2;border-radius:6px}button{background:#1e4668;color:white;margin:12px 8px 12px 0;cursor:pointer}button:disabled{background:#dde3e8;color:#607080;cursor:default}pre{white-space:pre-wrap;background:#f4f6f8;padding:20px;border-radius:6px;overflow-wrap:anywhere}.note{font-size:13px;color:#506170;border-top:1px solid #d7dee5;padding-top:16px}@media(max-width:620px){main{margin:0;border-radius:0;padding:22px}.controls{grid-template-columns:1fr}h1{font-size:24px}}'''

JS = r'''const ui = id => document.getElementById(id);
let configuration, rows = [];
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const quantile = (values, p) => { const sorted = [...values].sort((a,b)=>a-b); const x = (sorted.length-1)*p;
  const low = Math.floor(x); return sorted[low] + (sorted[Math.ceil(x)]-sorted[low])*(x-low); };
const scalar = async output => { const tensors = output instanceof tf.Tensor ? [output] : Array.isArray(output) ? output : Object.values(output);
  if(tensors.length!==1 || tensors[0].size!==1) throw new Error('Expected one scalar forecast');
  return Number((await tensors[0].data())[0]); };
async function initialise(){
  configuration = await (await fetch('benchmark_manifest.json')).json();
  for(const zone of configuration.zones){ const option=document.createElement('option');option.value=zone.id;option.textContent=zone.label;ui('zone').append(option); }
  if(!configuration.wasm_available) ui('backend').querySelector('[value="wasm"]').remove();
  if('serviceWorker' in navigator){
    await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
    ui('cache').textContent='Page, models and fixed inputs cached. Reload this address after disconnecting to test local operation.';
  } else ui('cache').textContent='Service worker unavailable; this browser has no verified offline cache.';
  ui('run').disabled=false;ui('status').textContent='Ready. Enter a device model and choose the backend.';
}
ui('run').addEventListener('click',async()=>{
  let model,input;
  const device=ui('device').value.trim(); if(!device){ui('status').textContent='Enter the device model before recording a benchmark.';return;}
  ui('run').disabled=true;ui('download').disabled=true;rows=[];
  try{
    const zone=configuration.zones.find(value=>value.id===ui('zone').value);
    const backend=ui('backend').value,precision=ui('precision').value;
    if(backend==='wasm') tf.wasm.setWasmPaths('vendor/');
    if(!await tf.setBackend(backend)) throw new Error('Requested backend could not initialize'); await tf.ready();
    const reference=await(await fetch(zone.case_url)).json();
    const modelURL=precision==='fp32'?zone.fp32_url:zone.uint8_url;
    const loadStart=performance.now(); model=await tf.loadGraphModel(modelURL);const loadMs=performance.now()-loadStart;
    input=tf.tensor3d([reference.inputs[0]],[1,...reference.input_shape.slice(1)],'float32');
    for(let i=0;i<10;i++){const output=await model.executeAsync(input);await scalar(output);tf.dispose(output);}
    for(let i=0;i<50;i++){
      const start=performance.now();const output=await model.executeAsync(input);let predicted;
      try{predicted=await scalar(output);}finally{tf.dispose(output);}const elapsed=performance.now()-start;
      if(!Number.isFinite(predicted)) throw new Error('Nonfinite browser prediction');
      let physical=(predicted-reference.target_scaler.min)/reference.target_scaler.scale;
      if(reference.prediction_bounds?.lower!=null) physical=Math.max(reference.prediction_bounds.lower,physical);
      if(reference.prediction_bounds?.upper!=null) physical=Math.min(reference.prediction_bounds.upper,physical);
      const memory=tf.memory();
      rows.push({run_id:configuration.run_id,zone:zone.id,backend:tf.getBackend(),weight_storage:precision,
        arithmetic:'float backend kernels',integer_only_inference:false,device_model:device,browser_user_agent:navigator.userAgent,
        tensorflowjs_version:tf.version.tfjs,measured_at_utc:new Date().toISOString(),repetition:i+1,warmup_repetitions:10,
        latency_ms:elapsed,model_load_ms:loadMs,model_bytes:precision==='fp32'?zone.fp32_bytes:zone.uint8_bytes,
        input_case_sha256:zone.case_sha256,input_month:reference.dates?.[0]??'',batch_size:1,lookback:reference.input_shape[1],
        features:reference.input_shape[2],predicted_scaled:predicted,predicted_physical:physical,
        keras_reference_scaled:reference.keras_float_scaled_predictions[0],
        absolute_scaled_difference_from_keras:Math.abs(predicted-reference.keras_float_scaled_predictions[0]),
        allocated_tensor_bytes:memory.numBytes,tensor_memory_unreliable:memory.unreliable,
        cross_origin_isolated:globalThis.crossOriginIsolated,service_worker_controls_page:Boolean(navigator.serviceWorker?.controller)});
      ui('status').textContent=`Measured ${i+1}/50 repetitions`;await new Promise(resolve=>setTimeout(resolve,0));
    }
    const values=rows.map(row=>row.latency_ms),average=mean(values);
    const standardDeviation=Math.sqrt(values.reduce((sum,value)=>sum+(value-average)**2,0)/(values.length-1));
    ui('summary').textContent=`${device}\n${zone.label}\nBackend ${backend}   Stored weights ${precision}\n\nMedian ${quantile(values,.5).toFixed(3)} ms\nMean ${average.toFixed(3)} ms\nStandard deviation ${standardDeviation.toFixed(3)} ms\np95 ${quantile(values,.95).toFixed(3)} ms\nMeasured repetitions ${rows.length}\n\nLoad time and allocated tensor bytes are recorded separately in the CSV.`;
    ui('status').textContent='Completed. Download the raw CSV and retain the device and browser details.';ui('download').disabled=false;
  }catch(error){ui('status').textContent=error.message;ui('summary').textContent='';}
  finally{input?.dispose();model?.dispose();ui('run').disabled=false;}
});
ui('download').addEventListener('click',()=>{
  const keys=Object.keys(rows[0]);const escape=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const csv=[keys.map(escape).join(','),...rows.map(row=>keys.map(key=>escape(row[key])).join(','))].join('\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');
  anchor.href=url;anchor.download=`raw_latency_${rows[0].zone}_${rows[0].backend}_${rows[0].weight_storage}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
initialise().catch(error=>ui('status').textContent=error.message);'''


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export_benchmark(output: Path, repository: Path) -> dict:
    run = json.loads((output / "run_manifest.json").read_text(encoding="utf-8"))
    benchmark = output / "browser_benchmark"
    benchmark.mkdir(parents=True, exist_ok=True)
    zones = []
    for zone in run["manifest"]["zones"]:
        identifier = zone["id"]
        float_source = output / "tfjs_models_float" / identifier
        uint8_source = output / "tfjs_models" / identifier
        case_source = output / "tfjs_equivalence_cases" / f"{identifier}.json"
        if not all(path.is_file() for path in (float_source / "model.json", uint8_source / "model.json", case_source)):
            continue
        for source, folder in ((float_source, "models_fp32"), (uint8_source, "models_uint8")):
            shutil.copytree(source, benchmark / folder / identifier, dirs_exist_ok=True)
        case_target = benchmark / "cases" / case_source.name
        case_target.parent.mkdir(exist_ok=True)
        shutil.copy2(case_source, case_target)
        zones.append({"id": identifier, "label": zone.get("label", identifier),
            "fp32_url": f"models_fp32/{identifier}/model.json", "uint8_url": f"models_uint8/{identifier}/model.json",
            "fp32_bytes": sum(path.stat().st_size for path in float_source.rglob("*") if path.is_file()),
            "uint8_bytes": sum(path.stat().st_size for path in uint8_source.rglob("*") if path.is_file()),
            "case_url": f"cases/{case_source.name}", "case_sha256": checksum(case_source)})
    if not zones:
        return {"status": "unavailable", "reason": "No converted graph models were generated; see tfjs_conversion.json"}
    vendor = benchmark / "vendor"
    vendor.mkdir(exist_ok=True)
    tf_library = repository / "node_modules" / "@tensorflow" / "tfjs" / "dist" / "tf.min.js"
    if not tf_library.is_file():
        raise FileNotFoundError("Install the pinned @tensorflow/tfjs npm package before exporting the benchmark")
    shutil.copy2(tf_library, vendor / "tf.min.js")
    wasm_root = repository / "node_modules" / "@tensorflow" / "tfjs-backend-wasm" / "dist"
    wasm_library = wasm_root / "tfjs-backend-wasm.min.js"
    wasm_available = wasm_library.is_file()
    if wasm_available:
        shutil.copy2(wasm_library, vendor / wasm_library.name)
        for asset in wasm_root.glob("*.wasm"):
            shutil.copy2(asset, vendor / asset.name)
    else:
        (vendor / "tfjs-backend-wasm.min.js").write_text("// Optional WASM backend was not installed.\n", encoding="utf-8")
    (benchmark / "index.html").write_text(HTML, encoding="utf-8")
    (benchmark / "benchmark.css").write_text(CSS, encoding="utf-8")
    (benchmark / "benchmark.js").write_text(JS, encoding="utf-8")
    (benchmark / "benchmark_manifest.json").write_text(json.dumps({"run_id": run["run_id"], "zones": zones,
        "wasm_available": wasm_available, "latency_logs_exist": False}, indent=2), encoding="utf-8")
    assets = ["./"] + [path.relative_to(benchmark).as_posix() for path in sorted(benchmark.rglob("*")) if path.is_file() and path.name != "sw.js"]
    worker = "const NAME=" + json.dumps("cuunet-revision-benchmark-" + run["run_id"]) + ";const FILES=" + json.dumps(assets) + ";\n" + r'''
self.addEventListener('install',event=>{event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('fetch',event=>{if(event.request.method==='GET')event.respondWith(caches.open(NAME).then(async cache=>
  await cache.match(event.request,{ignoreSearch:true})||fetch(event.request)));});
'''
    (benchmark / "sw.js").write_text(worker, encoding="utf-8")
    (benchmark / "RUN_BROWSER_BENCHMARK.md").write_text(
        "# Browser inference benchmark\n\n"
        "Serve this directory on localhost using `python -m http.server 8765 --directory browser_benchmark`, "
        "then open `http://localhost:8765/`. For a phone, serve it through an HTTPS origin so the service worker can register. "
        "Record the device model, browser version and backend, run both stored-weight variants, and retain the raw CSV exports. "
        "The page records 10 warm-up and 50 measured batch-one repetitions, including output materialization. "
        "Test an offline reload after the cache is ready; record that outcome separately from timing. "
        "No mobile latency, battery or offline-consensus result is generated merely by packaging this page.\n", encoding="utf-8")
    return {"status": "packaged", "directory": "browser_benchmark", "zones": len(zones), "raw_latency_logs_exist": False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    result = export_benchmark(args.output_dir.resolve(), Path(__file__).resolve().parents[1])
    print(json.dumps(result))


if __name__ == "__main__":
    main()
