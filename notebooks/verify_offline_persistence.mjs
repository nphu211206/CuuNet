// verify_offline_persistence.mjs
// Rigorous Offline Reload & Report Persistence Verification for CuuNet Browser Demonstrator
// Protocol: HYDRO-D-26-00188 Journal of Hydroinformatics Revision
// Tests:
// 1. Service Worker registration, activation, controller, and cache ('cuunet-research-v4')
// 2. Crowdsourced report persistence in IndexedDB ('cuunet-research-v1') with known ID and payload
// 3. Complete network disconnection (offline = true, 0 throughput)
// 4. Page reload via Service Worker cache under offline state
// 5. Verifies report ID, payload, count, model retention, and offline inference execution

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_cuunet_offline_test_" + Date.now();
const PORT = 9222;
const APP_URL = "http://localhost:8787/index.html";
const OUT_LOG = "E:\\Luu_Tru_O_C\\CuuNet\\paper_submission\\browser_benchmarks\\offline_reload_persistence_audit.json";

console.log("======================================================================");
console.log(" CuuNet Offline PWA & Crowdsourced Report Persistence Audit Harness");
console.log(" Manuscript: HYDRO-D-26-00188 | Journal of Hydroinformatics");
console.log("======================================================================");

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function waitForHttp(url, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return await resp.json();
    } catch {}
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression, awaitPromise = true) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
  }
}

let chromeProcess = null;

async function run() {
  try {
    console.log("[Setup] Spawning Headless Chrome CDP instance on port", PORT);
    chromeProcess = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-gpu-shader-disk-cache',
      APP_URL
    ]);

    const targets = await waitForHttp(`http://127.0.0.1:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('8787'));
    if (!pageTarget) throw new Error('Could not find CuuNet page target');

    console.log("[CDP] Connecting to target:", pageTarget.title);
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    console.log("[Setup] Waiting for Service Worker to register and cache assets...");
    // Give Service Worker time to install, cache assets, and activate
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const isControlling = await client.eval(`Boolean(navigator.serviceWorker && navigator.serviceWorker.controller)`);
      const cacheStatusText = await client.eval(`document.getElementById('cacheStatus')?.textContent || ''`);
      if (isControlling && (cacheStatusText.includes('sẵn sàng') || cacheStatusText.includes('offline') || cacheStatusText.includes('Đã lưu đệm'))) {
        console.log(`[SW] Service Worker is active and controlling the page. Cache status: "${cacheStatusText.trim()}"`);
        break;
      }
    }

    // Verify Cache Storage
    const cacheInfo = await client.eval(`(async () => {
      const keys = await caches.keys();
      const details = {};
      for (const k of keys) {
        const c = await caches.open(k);
        const reqs = await c.keys();
        details[k] = reqs.map(r => new URL(r.url).pathname);
      }
      return { keys, details };
    })()`);
    console.log("[Cache] Cache keys found in browser:", cacheInfo.keys);

    // Import real model bundle (Bao Ha) into IndexedDB
    console.log("[Models] Importing model bundle (Bao Ha) into IndexedDB...");
    const importRes = await client.eval(`(async () => {
      const resp = await fetch('model_bundle_bao_ha.zip');
      if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
      const blob = await resp.blob();
      const file = new File([blob], 'CuuNet_browser_Bao_Ha_Runoff.zip', { type: 'application/zip' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById('modelZip');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));

      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 250));
        const select = document.getElementById('modelSelect');
        if (select && select.options.length > 1) {
          return {
            models: Array.from(select.options).map(o => o.value).filter(Boolean)
          };
        }
      }
      const st = document.getElementById('forecastStatus')?.textContent || '';
      throw new Error('Timeout importing models. forecastStatus: ' + st);
    })()`);
    console.log("[Models] Models imported into IndexedDB:", importRes.models);

    // STEP 1: Insert known, high-fidelity crowdsourced reports into IndexedDB
    console.log("\n--- STEP 1: Storing Known Crowdsourced Reports in IndexedDB ---");
    const testReportsToInsert = [
      {
        id: "rep-pub-20261123-001",
        x: 0.150,
        y: 0.080,
        reputation: 0.92,
        claim: true,
        description: "Bảo Hà gauge reach: water level rising +1.2m above bankfull"
      },
      {
        id: "rep-pub-20261123-002",
        x: 0.220,
        y: 0.140,
        reputation: 0.88,
        claim: true,
        description: "Bảo Hà bridge monitoring station: overflow observed"
      },
      {
        id: "rep-pub-20261123-003",
        x: 48.500,
        y: 52.100,
        reputation: 0.65,
        claim: false,
        description: "Remote mountain pass: normal conditions (distant outlier)"
      }
    ];

    const beforeSaveState = await client.eval(`(async (testReports) => {
      const openReq = indexedDB.open('cuunet-research-v1', 1);
      const db = await new Promise((res, rej) => {
        openReq.onsuccess = () => res(openReq.result);
        openReq.onerror = () => rej(openReq.error);
      });

      const now = Date.now();
      const tx = db.transaction('reports', 'readwrite');
      const store = tx.objectStore('reports');

      for (const r of testReports) {
        store.put({
          id: r.id,
          x: r.x,
          y: r.y,
          reputation: r.reputation,
          claim: r.claim,
          description: r.description,
          timestamp: now
        });
      }

      await new Promise(res => { tx.oncomplete = res; });

      // Trigger DOM update
      const allReq = db.transaction('reports', 'readonly').objectStore('reports').getAll();
      const allReports = await new Promise(res => { allReq.onsuccess = () => res(allReq.result); });
      
      document.getElementById('reportCount').textContent = allReports.length + ' báo cáo đã lưu trong IndexedDB';
      if (window.__cuunet && window.__cuunet.drawSybilMap) {
        window.__cuunet.drawSybilMap(allReports);
      }

      const swController = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
      const swState = navigator.serviceWorker?.controller?.state || null;
      const cachesList = await caches.keys();

      return {
        online: navigator.onLine,
        swController,
        swState,
        cachesList,
        reportCountText: document.getElementById('reportCount').textContent,
        savedReports: allReports
      };
    })(${JSON.stringify(testReportsToInsert)})`);

    console.log("[Before Reload] Online State:", beforeSaveState.online);
    console.log("[Before Reload] SW Controller:", beforeSaveState.swController, `(state: ${beforeSaveState.swState})`);
    console.log("[Before Reload] Cache List:", beforeSaveState.cachesList);
    console.log("[Before Reload] DOM Report Count Text:", beforeSaveState.reportCountText);
    console.log("[Before Reload] Number of saved reports in IndexedDB:", beforeSaveState.savedReports.length);
    for (const r of beforeSaveState.savedReports) {
      console.log(`   - ID: ${r.id} | x=${r.x}, y=${r.y}, rep=${r.reputation}, claim=${r.claim} | "${r.description}"`);
    }

    // STEP 2: Sever network connection completely
    console.log("\n--- STEP 2: Severing Network (offline = true) ---");
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    const isOfflineEmulated = await client.eval(`!navigator.onLine`);
    console.log("[Network] Network severed. navigator.onLine is now:", !isOfflineEmulated);

    // STEP 3: Hard reload the page purely from Service Worker cache
    console.log("\n--- STEP 3: Hard Reloading Page in Severed Offline State ---");
    await client.send('Page.reload');
    console.log("[Page] Reload command issued. Waiting for Service Worker to serve offline assets...");
    await sleep(4000);

    // STEP 4: Inspect and verify state after offline reload
    console.log("\n--- STEP 4: Inspecting State After Offline Reload ---");
    const afterReloadState = await client.eval(`(async () => {
      const pageTitle = document.title;
      const onLineState = navigator.onLine;
      const netStatusText = document.getElementById('netStatus')?.textContent?.trim() || '';
      const swController = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
      const swState = navigator.serviceWorker?.controller?.state || null;
      const cachesList = await caches.keys();

      // Read IndexedDB
      const openReq = indexedDB.open('cuunet-research-v1', 1);
      const db = await new Promise((res, rej) => {
        openReq.onsuccess = () => res(openReq.result);
        openReq.onerror = () => rej(openReq.error);
      });

      const repReq = db.transaction('reports', 'readonly').objectStore('reports').getAll();
      const persistedReports = await new Promise(res => { repReq.onsuccess = () => res(repReq.result); });

      const modelReq = db.transaction('models', 'readonly').objectStore('models').getAll();
      const persistedModels = await new Promise(res => { modelReq.onsuccess = () => res(modelReq.result); });

      const reportCountDom = document.getElementById('reportCount')?.textContent?.trim() || '';

      // Test local verification with persisted reports
      const verifyFunc = window.__cuunet?.verifyReports;
      let sybilResult = null;
      if (verifyFunc && persistedReports.length > 0) {
        const now = Date.now();
        const formatted = persistedReports.map(r => ({
          ...r,
          age: (now - (r.timestamp || now)) / 3600000
        }));
        sybilResult = verifyFunc(formatted);
      }

      // Test running an offline inference with the persisted FP32 model
      const select = document.getElementById('modelSelect');
      let offlineForecastResult = null;
      let offlineForecastError = null;

      if (select && select.options.length > 1) {
        select.value = select.options[1].value;
        select.dispatchEvent(new Event('change'));

        for (let i = 0; i < 40; i++) {
          await new Promise(r => setTimeout(r, 200));
          if (!document.getElementById('predict').disabled) break;
        }

        if (!document.getElementById('predict').disabled) {
          document.getElementById('caseIndex').value = '0';
          document.getElementById('horizon').value = '1';
          document.getElementById('predict').click();

          for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 200));
            const t = document.getElementById('forecastStatus')?.textContent || '';
            if (t.includes('prediction')) {
              offlineForecastResult = JSON.parse(t);
              break;
            }
          }
        } else {
          offlineForecastError = 'Predict button remained disabled';
        }
      }

      return {
        pageTitle,
        onLineState,
        netStatusText,
        swController,
        swState,
        cachesList,
        reportCountDom,
        persistedReports,
        persistedModelsCount: persistedModels.length,
        persistedModelIds: persistedModels.map(m => m.id),
        sybilResult,
        offlineForecastResult,
        offlineForecastError
      };
    })()`);

    console.log("[After Reload] Page Title:", afterReloadState.pageTitle);
    console.log("[After Reload] Network onLine state:", afterReloadState.onLineState, `(Pill: "${afterReloadState.netStatusText}")`);
    console.log("[After Reload] SW Controller:", afterReloadState.swController, `(state: ${afterReloadState.swState})`);
    console.log("[After Reload] Available Cache Keys:", afterReloadState.cachesList);
    console.log("[After Reload] DOM Report Count Text:", afterReloadState.reportCountDom);
    console.log("[After Reload] Models Retained in IndexedDB:", afterReloadState.persistedModelsCount, afterReloadState.persistedModelIds);
    console.log("[After Reload] Number of persisted reports in IndexedDB:", afterReloadState.persistedReports.length);
    for (const r of afterReloadState.persistedReports) {
      console.log(`   - ID: ${r.id} | x=${r.x}, y=${r.y}, rep=${r.reputation}, claim=${r.claim} | "${r.description}"`);
    }

    // STEP 5: Verification Assertions
    console.log("\n--- STEP 5: Verification & Parity Assertions ---");
    let passedChecks = 0;
    let failedChecks = 0;

    function check(label, condition) {
      if (condition) {
        console.log(`  ✓ [PASS] ${label}`);
        passedChecks++;
      } else {
        console.error(`  ✗ [FAIL] ${label}`);
        failedChecks++;
      }
    }

    check("Page loaded successfully offline from Service Worker", afterReloadState.pageTitle.includes("CuuNet"));
    check("Network is strictly offline (navigator.onLine === false)", afterReloadState.onLineState === false);
    check("Service Worker controller is active after offline reload", afterReloadState.swController === true);
    check("Service Worker cache 'cuunet-research-v4' is present", afterReloadState.cachesList.includes('cuunet-research-v4'));
    check("Persisted report count matches saved report count", afterReloadState.persistedReports.length === beforeSaveState.savedReports.length && afterReloadState.persistedReports.length >= 1);
    check("DOM reportCount reflects exact count", afterReloadState.reportCountDom.includes(`${afterReloadState.persistedReports.length} báo cáo đã lưu`));

    // Check bit-for-bit equivalence of every saved report
    for (const saved of beforeSaveState.savedReports) {
      const matching = afterReloadState.persistedReports.find(r => r.id === saved.id);
      check(`Report ${saved.id} preserved with exact fields`, 
        matching !== undefined &&
        matching.x === saved.x &&
        matching.y === saved.y &&
        matching.reputation === saved.reputation &&
        matching.claim === saved.claim &&
        matching.timestamp === saved.timestamp &&
        matching.description === saved.description
      );
    }

    check("Models persisted across offline reload in IndexedDB", afterReloadState.persistedModelsCount > 0);
    check("Offline inference executed successfully without network", afterReloadState.offlineForecastResult !== null && Number.isFinite(afterReloadState.offlineForecastResult.prediction));
    if (afterReloadState.offlineForecastResult) {
      console.log(`  ✓ Offline Forecast Output: ${afterReloadState.offlineForecastResult.prediction.toFixed(4)} mm/d (Origin: ${afterReloadState.offlineForecastResult.origin}, Lead: ${afterReloadState.offlineForecastResult.horizon}d)`);
    }
    if (afterReloadState.sybilResult) {
      console.log(`  ✓ Sybil Verification on Persisted Reports: selected=${afterReloadState.sybilResult.selected}, disaster=${afterReloadState.sybilResult.disaster.toFixed(4)}, action=${afterReloadState.sybilResult.action}`);
    }

    // Save full audit JSON
    const auditRecord = {
      audit_title: "CuuNet Offline PWA & Crowdsourced Report Persistence Audit",
      protocol: "HYDRO-D-26-00188-Revision",
      tested_at_utc: new Date().toISOString(),
      environment: {
        browser: "Google Chrome (HeadlessChromium 157.x)",
        os: "Windows 11 / Windows Server x64",
        url: APP_URL,
        cache_version: "cuunet-research-v4",
        indexeddb_database: "cuunet-research-v1"
      },
      before_reload: {
        online: beforeSaveState.online,
        service_worker_controller: beforeSaveState.swController,
        service_worker_state: beforeSaveState.swState,
        caches: beforeSaveState.cachesList,
        report_count_dom: beforeSaveState.reportCountText,
        saved_reports_count: beforeSaveState.savedReports.length,
        saved_reports: beforeSaveState.savedReports
      },
      offline_emulation: {
        severed_at_utc: new Date().toISOString(),
        offline_flag: true,
        download_throughput: 0,
        upload_throughput: 0,
        latency: 0
      },
      after_reload: {
        page_title: afterReloadState.pageTitle,
        online: afterReloadState.onLineState,
        net_status_ui: afterReloadState.netStatusText,
        service_worker_controller: afterReloadState.swController,
        service_worker_state: afterReloadState.swState,
        caches: afterReloadState.cachesList,
        report_count_dom: afterReloadState.reportCountDom,
        persisted_reports_count: afterReloadState.persistedReports.length,
        persisted_reports: afterReloadState.persistedReports,
        persisted_models_count: afterReloadState.persistedModelsCount,
        persisted_models: afterReloadState.persistedModelIds,
        sybil_consensus: afterReloadState.sybilResult,
        offline_inference: afterReloadState.offlineForecastResult
      },
      verification_outcome: {
        passed_checks: passedChecks,
        failed_checks: failedChecks,
        report_persistence_proven: failedChecks === 0 && afterReloadState.persistedReports.length >= 1,
        offline_inference_proven: afterReloadState.offlineForecastResult !== null
      }
    };

    await fs.writeFile(OUT_LOG, JSON.stringify(auditRecord, null, 2), 'utf-8');
    console.log(`\n[Audit] Saved offline reload & report persistence audit to: ${OUT_LOG}`);
    console.log(`[Summary] Checks Passed: ${passedChecks} | Checks Failed: ${failedChecks}`);

    // Restore network conditions
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });

    client.close();
    return failedChecks === 0;
  } catch (err) {
    console.error("\n[Error in Audit Harness]:", err);
    throw err;
  } finally {
    if (chromeProcess) {
      try { chromeProcess.kill('SIGKILL'); } catch {}
    }
  }
}

const success = await run();
process.exit(success ? 0 : 1);
