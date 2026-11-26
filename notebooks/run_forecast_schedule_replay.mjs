
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { cpus, tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const zones = [
  { modelId: 'Bao_Ha_Runoff / FP32', bundle: 'model_bundle_bao_ha.zip' },
  { modelId: 'Gianh_Runoff / FP32', bundle: 'model_bundle_gianh.zip' },
  { modelId: 'Can_Tho_Runoff / FP32', bundle: 'model_bundle_can_tho.zip' }
];
const workload = {
  horizons: [1, 3, 7],
  checkpointHours: [0, 6, 12, 18],
  warmupsPerModel: 3,
  policies: [
    { id: 'periodic_6h', intervalHours: 6 },
    { id: 'periodic_24h', intervalHours: 24 },
    { id: 'on_input_change', intervalHours: null }
  ]
};

const { values } = parseArgs({
  options: { chrome: { type: 'string' }, out: { type: 'string' } }
});
if (!values.chrome || !values.out) {
  throw new Error('Supply --chrome <browser executable> and --out <results.json>.');
}

const appRoot = fileURLToPath(new URL('../public/research/', import.meta.url));
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.geojson': 'application/geo+json',
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

async function readLocal(request, response) {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filename = path.resolve(appRoot, '.' + pathname);
    const relative = path.relative(appRoot, filename);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filename)] || 'application/octet-stream'
    }).end(body);
  } catch {
    response.writeHead(404).end();
  }
}

async function browserPage(child, profile, appUrl) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error('Chrome exited before opening its replay page.');
    try {
      const [port] = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/);
      const response = await fetch('http://127.0.0.1:' + port + '/json/list', {
        signal: AbortSignal.timeout(1000)
      });
      const targets = await response.json();
      const page = targets.find(target => target.type === 'page' && target.url === appUrl);
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome writes the debugging port after it finishes starting.
    }
    await sleep(150);
  }
  throw new Error('The Chrome replay page did not become ready.');
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Could not connect to local Chrome.')), { once: true });
  });
  const requests = new Map();
  let id = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    const request = requests.get(message.id);
    if (!request) return;
    clearTimeout(request.timeout);
    requests.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  socket.addEventListener('close', () => {
    for (const request of requests.values()) {
      clearTimeout(request.timeout);
      request.reject(new Error('Chrome closed during replay.'));
    }
    requests.clear();
  });
  return {
    call(method, params = {}) {
      const requestId = ++id;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          requests.delete(requestId);
          reject(new Error('Chrome timed out in ' + method));
        }, 240_000);
        requests.set(requestId, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id: requestId, method, params }));
      });
    },
    close() { socket.close(); }
  };
}

async function evaluate(client, expression) {
  const result = await client.call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

async function replayInPage(zone, settings, zoneIndex) {
  const app = window.__cuunet;
  const select = document.getElementById('modelSelect');
  document.getElementById('backend').value = 'cpu';
  await app.loadPresetZip(zone.bundle);
  if (app.active?.record.id !== zone.modelId) {
    select.value = zone.modelId;
    await select.onchange();
  }
  if (app.active?.record.id !== zone.modelId || tf.getBackend() !== 'cpu') {
    throw new Error('Could not select ' + zone.modelId + ': ' + document.getElementById('forecastStatus').textContent);
  }

  const { record, model } = app.active;
  const dates = record.case.dates;
  if (dates.length !== 64 || dates.length !== record.case.inputs.length) {
    throw new Error('Expected the 64 published test fixtures for ' + zone.modelId);
  }
  const indexField = document.getElementById('caseIndex');
  const horizonField = document.getElementById('horizon');
  const predict = document.getElementById('predict');
  let calls = 0;
  const execute = model.executeAsync;
  model.executeAsync = function (...args) {
    calls += 1;
    return execute.apply(this, args);
  };

  async function issue(caseIndex, horizon) {
    indexField.value = String(caseIndex);
    horizonField.value = String(horizon);
    const previous = app.lastForecastResult;
    const before = calls;
    const start = performance.now();
    await predict.onclick();
    const elapsedMs = performance.now() - start;
    const result = app.lastForecastResult;
    const modelCalls = calls - before;
    if (result === previous || result?.horizon !== horizon || modelCalls !== horizon ||
        result.rolloutPoints[0]?.date !== dates[caseIndex] ||
        result.rolloutPoints.some(point => !Number.isFinite(point.prediction))) {
      throw new Error('Forecast did not complete for ' + zone.modelId + ' ' + dates[caseIndex] + ' lead ' + horizon);
    }
    return { result, elapsedMs, modelCalls };
  }

  try {
    for (let i = 0; i < settings.warmupsPerModel; i++) await issue(0, 1);
    const callsAfterWarmup = calls;
    const rows = [];
    for (const [horizonIndex, horizon] of settings.horizons.entries()) {
      const results = new Map();
      for (const [caseIndex, date] of dates.entries()) {
        const requestKey = JSON.stringify([zone.modelId, caseIndex, horizon]);
        const timings = Object.fromEntries(settings.policies.map(policy => [policy.id, []]));
        const modelCalls = Object.fromEntries(settings.policies.map(policy => [policy.id, 0]));
        const rotation = (zoneIndex + horizonIndex + caseIndex) % settings.policies.length;
        const policyOrder = settings.policies.slice(rotation).concat(settings.policies.slice(0, rotation));
        for (const hour of settings.checkpointHours) {
          for (const policy of policyOrder) {
            const last = results.get(policy.id);
            const refresh = policy.intervalHours === null
              ? last?.requestKey !== requestKey
              : hour % policy.intervalHours === 0;
            if (refresh) {
              const issued = await issue(caseIndex, horizon);
              results.set(policy.id, { requestKey, result: issued.result });
              timings[policy.id].push(issued.elapsedMs);
              modelCalls[policy.id] += issued.modelCalls;
            }
            if (results.get(policy.id)?.requestKey !== requestKey) {
              throw new Error('A schedule missed the current request at a check.');
            }
          }
          const baseline = JSON.stringify(results.get('periodic_6h').result);
          for (const policy of settings.policies.slice(1)) {
            if (JSON.stringify(results.get(policy.id).result) !== baseline) {
              throw new Error('Forecast mismatch at ' + zone.modelId + ' ' + date + ' lead ' + horizon + ' hour ' + hour);
            }
          }
        }
        const reference = results.get('periodic_6h').result;
        rows.push({
          one_day_target_date: date,
          origin: reference.origin,
          horizon,
          checkpoint_comparisons: settings.checkpointHours.length * (settings.policies.length - 1),
          prediction_path: reference.rolloutPoints.map(point => point.prediction),
          refresh_ms: timings,
          model_calls: modelCalls
        });
      }
    }
    const measuredCalls = calls - callsAfterWarmup;
    const reportedCalls = rows.reduce((sum, row) =>
      sum + Object.values(row.model_calls).reduce((subtotal, count) => subtotal + count, 0), 0);
    if (measuredCalls !== reportedCalls) throw new Error('Unaccounted model calls.');
    return {
      model_id: zone.modelId,
      variant: record.case.model,
      seed: record.case.selected_seed,
      one_day_target_first: dates[0],
      one_day_target_last: dates.at(-1),
      n_daily_cases: dates.length,
      measured_calls: measuredCalls,
      rows
    };
  } finally {
    model.executeAsync = execute;
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = (sorted.length - 1) / 2;
  return (sorted[Math.floor(midpoint)] + sorted[Math.ceil(midpoint)]) / 2;
}

function summarize(models) {
  const rows = models.flatMap(model => model.rows);
  const schedules = workload.policies.map(({ id, intervalHours }) => {
    const expectedPerCase = intervalHours === null ? 1 : 24 / intervalHours;
    for (const row of rows) {
      if (row.refresh_ms[id].length !== expectedPerCase || row.model_calls[id] !== expectedPerCase * row.horizon) {
        throw new Error('Unexpected schedule count for ' + id);
      }
    }
    return {
      id,
      display_checkpoints: rows.length * workload.checkpointHours.length,
      issued_forecasts: rows.reduce((total, row) => total + row.refresh_ms[id].length, 0),
      model_calls: rows.reduce((total, row) => total + row.model_calls[id], 0),
      first_refresh_median_ms_by_horizon: Object.fromEntries(workload.horizons.map(horizon => [
        horizon, median(rows.filter(row => row.horizon === horizon).map(row => row.refresh_ms[id][0]))
      ]))
    };
  });
  return {
    daily_origins: models.reduce((total, model) => total + model.n_daily_cases, 0),
    origin_horizon_requests: rows.length,
    exact_checkpoint_comparisons: rows.reduce((total, row) => total + row.checkpoint_comparisons, 0),
    schedules
  };
}

async function checksum(name) {
  return createHash('sha256').update(await readFile(path.join(appRoot, name))).digest('hex');
}

const tempRoot = path.resolve(tmpdir());
const profile = await mkdtemp(path.join(tempRoot, 'cuunet-schedule-replay-'));
const server = createServer(readLocal);
let chrome;
let client;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const appUrl = 'http://127.0.0.1:' + server.address().port + '/index.html';
  chrome = spawn(values.chrome, [
    '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    '--user-data-dir=' + profile, '--disable-background-networking', '--disable-component-update',
    '--no-first-run', '--no-default-browser-check', '--no-proxy-server', appUrl
  ], { windowsHide: true, stdio: 'ignore' });
  await new Promise((resolve, reject) => {
    chrome.once('spawn', resolve);
    chrome.once('error', reject);
  });
  client = await connect(await browserPage(chrome, profile, appUrl));
  await client.call('Network.enable');
  await client.call('Network.setBlockedURLs', { urls: ['https://*'] });
  await client.call('Page.reload');
  for (let i = 0; ; i++) {
    if (await evaluate(client, "Boolean(window.__cuunet?.loadPresetZip && document.getElementById('predict')?.onclick)")) break;
    if (i === 80) throw new Error('The forecast demonstrator did not load.');
    await sleep(150);
  }
  const browser = await evaluate(client, '({ userAgent: navigator.userAgent, tensorflowJs: tf.version.tfjs })');
  const results = [];
  for (const [i, zone] of zones.entries()) {
    process.stdout.write('Starting ' + zone.modelId + '\n');
    const replay = await evaluate(client, '(' + replayInPage.toString() + ')(' +
      JSON.stringify(zone) + ',' + JSON.stringify(workload) + ',' + i + ')');
    replay.bundle = zone.bundle;
    replay.bundle_sha256 = await checksum(zone.bundle);
    results.push(replay);
    process.stdout.write('Completed ' + zone.modelId + ': ' + replay.measured_calls + ' model calls\n');
  }
  const summary = summarize(results);
  const report = {
    study_id: 'HYDRO-D-26-00188',
    protocol: {
      ...workload,
      workload: 'One new saved daily input window at hour 0. Both periodic schedules refresh unconditionally at their ticks. The input-change policy refreshes on a new model/window/horizon key. Four logical checkpoints share the current input.',
      timing: 'Accelerated desktop replay. First refresh timings are descriptive wall-clock measurements through the forecast handler after warmup, including UI updates.',
      scope: 'FP32 TensorFlow.js CPU graphs with saved ERA5-Land input cases. Forecast parity and executed graph calls.'
    },
    runtime: { ...browser, node: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model },
    app_sha256: await checksum('app.mjs'),
    tfjs_bundle_sha256: await checksum('vendor/tf.min.js'),
    summary,
    models: results
  };
  const output = path.resolve(values.out);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} finally {
  if (client) {
    try { await client.call('Browser.close'); } catch { /* The connection can close before the reply. */ }
    client.close();
  }
  if (chrome?.pid && chrome.exitCode === null) {
    await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), sleep(2000)]);
    if (chrome.exitCode === null) chrome.kill();
  }
  server.close();
  const relativeProfile = path.relative(tempRoot, profile);
  if (path.dirname(profile) === tempRoot && relativeProfile.startsWith('cuunet-schedule-replay-')) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (error) { process.stderr.write('Could not remove the temporary Chrome profile: ' + error.message + '\n'); }
  }
}
