import { verifyReports } from './verification.mjs';

const $ = id => document.getElementById(id);
const log = [];
const models = new Map();
let active = null;
let busy = false;

// Regional Basins Metadata
const BASIN_METADATA = {
  Bao_Ha_Runoff: {
    lat: 22.26,
    lon: 104.47,
    name: 'Lưu vực Bảo Hà (Sông Hồng - Lào Cai)',
    color: '#0284c7',
    zoom: 9
  },
  Gianh_Runoff: {
    lat: 17.70,
    lon: 106.43,
    name: 'Lưu vực Sông Gianh (Quảng Bình)',
    color: '#059669',
    zoom: 10
  },
  Can_Tho_Runoff: {
    lat: 10.03,
    lon: 105.78,
    name: 'Lưu vực Cần Thơ (ĐBSCL)',
    color: '#7c3aed',
    zoom: 10
  }
};

let currentZone = 'Bao_Ha_Runoff';
let activeBasinCenter = BASIN_METADATA.Bao_Ha_Runoff;
let geojsonData = null;
let leafletMap = null;
let basinGeoJsonLayer = null;
let stationMarker = null;
let clickMarker = null;
let reportMarkersLayer = null;
let lastBenchmarkResult = null;
let lastForecastResult = null;
let lastVerificationResult = null;
let lastReports = [];
let lastPlottedHydrograph = null;

window.__cuunet = {
  get active() { return active; },
  get lastPlottedHydrograph() { return lastPlottedHydrograph; },
  get lastForecastResult() { return lastForecastResult; },
  models,
  log,
  verifyReports,
  loadPresetZip,
  drawHydrograph,
  drawSybilMap,
  get currentZone() { return currentZone; }
};
window.__cuunet_log = log;

const request = req => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const db = await new Promise((resolve, reject) => {
  const r = indexedDB.open('cuunet-research-v1', 1);
  r.onupgradeneeded = () => {
    r.result.createObjectStore('reports', { keyPath: 'id' });
    r.result.createObjectStore('models', { keyPath: 'id' });
  };
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

async function all(store) {
  return request(db.transaction(store).objectStore(store).getAll());
}

async function put(store, value) {
  await new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function download(value, name) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], {
    type: typeof value === 'string' ? 'text/csv' : 'application/json'
  }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function note(kind, value) {
  log.push({ time: new Date().toISOString(), kind, ...value });
}

function fail(element, error) {
  if ($(element)) $(element).textContent = error.message;
  note('failure', { stage: element, error: error.message });
}

async function counts() {
  const reps = await all('reports');
  lastReports = reps;
  if ($('reportCount')) $('reportCount').textContent = `${reps.length} báo cáo đã lưu trong IndexedDB`;
}
await counts();

// Network status listener
function updateNetStatus() {
  const el = $('netStatus');
  if (!el) return;
  if (navigator.onLine) {
    el.className = 'status-pill online';
    el.textContent = '● Đang trực tuyến (Online)';
  } else {
    el.className = 'status-pill offline';
    el.textContent = '● Ngoại tuyến (Offline PWA Active)';
  }
}
window.addEventListener('online', updateNetStatus);
window.addEventListener('offline', updateNetStatus);
updateNetStatus();

// Service Worker setup
if ('serviceWorker' in navigator) {
  try {
    await navigator.serviceWorker.register('./sw.js');
    const readyOrTimeout = Promise.race([
      navigator.serviceWorker.ready,
      new Promise(res => setTimeout(() => res('timeout'), 4000))
    ]);
    const result = await readyOrTimeout;
    if ($('cacheStatus')) {
      if (result === 'timeout') {
        $('cacheStatus').textContent = 'PWA Service Worker đã đăng ký. Đang kiểm tra Cache Storage…';
      } else {
        $('cacheStatus').textContent = '✓ Cache v4 sẵn sàng (Hỗ trợ reload ngoại tuyến & IndexedDB)';
      }
    }
  } catch (e) {
    fail('cacheStatus', e);
  }
} else if ($('cacheStatus')) {
  $('cacheStatus').textContent = 'Trình duyệt không hỗ trợ Service Worker.';
}

function calendar(date) {
  const first = Date.UTC(date.getUTCFullYear(), 0, 1);
  const end = Date.UTC(date.getUTCFullYear() + 1, 0, 1);
  const phase = (date.getTime() - first) / (end - first);
  return {
    annual_sin: Math.sin(2 * Math.PI * phase),
    annual_cos: Math.cos(2 * Math.PI * phase)
  };
}

function addDays(value, days) {
  const d = new Date(value + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const iso = date => date.toISOString().slice(0, 10);

async function predictTensor(sequence) {
  const input = tf.tensor3d([sequence]);
  const outputs = await active.model.executeAsync(input);
  try {
    const array = outputs instanceof tf.Tensor ? [outputs] : Array.isArray(outputs) ? outputs : Object.values(outputs);
    if (array.length !== 1 || array[0].size !== 1) throw Error('Model must return one scalar');
    const scaled = (await array[0].data())[0];
    const s = active.record.preprocessing.target_scaler;
    const b = active.record.preprocessing.prediction_bounds;
    let value = (scaled - s.min) / s.scale;
    if (b.lower != null) value = Math.max(value, b.lower);
    if (b.upper != null) value = Math.min(value, b.upper);
    if (!Number.isFinite(value)) throw Error('Nonfinite prediction');
    return value;
  } finally {
    input.dispose();
    tf.dispose(outputs);
  }
}

async function forecast(index, horizon) {
  const c = active.record.case;
  const p = active.record.preprocessing;
  const names = p.feature_columns;
  if (!Number.isInteger(index) || index < 0 || index >= c.inputs.length) {
    throw Error('Invalid case index');
  }

  let seq = c.inputs[index].map(row => [...row]);
  const last = [...seq.at(-1)];
  const origin = iso(addDays(c.dates[index], -1));
  let value;
  const rolloutPoints = [];

  const ageIndex = names.indexOf(p.age_feature_column);
  const ageStart = ageIndex >= 0 ? (last[ageIndex] - p.feature_scaler.min[ageIndex]) / p.feature_scaler.scale[ageIndex] : 0;

  for (let lead = 1; lead <= horizon; lead++) {
    value = await predictTensor(seq);
    const targetD = iso(addDays(origin, lead));
    const actIdx = c.dates.indexOf(targetD);
    const actVal = actIdx >= 0 ? c.actual_physical[actIdx] : null;
    rolloutPoints.push({ lead, date: targetD, prediction: value, actual: actVal });

    if (lead < horizon) {
      const row = [...last];
      const cal = calendar(addDays(origin, lead));
      for (const [name, raw] of Object.entries(cal)) {
        const i = names.indexOf(name);
        if (i >= 0) row[i] = raw * p.feature_scaler.scale[i] + p.feature_scaler.min[i];
      }
      for (const name of p.availability_feature_columns) {
        const i = names.indexOf(name);
        row[i] = p.feature_scaler.min[i];
      }
      if (ageIndex >= 0) {
        row[ageIndex] = Math.min(1, ageStart + lead / p.age_normalisation_steps) * p.feature_scaler.scale[ageIndex] + p.feature_scaler.min[ageIndex];
      }
      seq = [...seq.slice(1), row];
    }
  }

  const targetDate = iso(addDays(origin, horizon));
  const actualIndex = c.dates.indexOf(targetDate);
  const actual = actualIndex >= 0 ? c.actual_physical[actualIndex] : null;

  return {
    origin,
    target_date: targetDate,
    horizon,
    physical_inputs_frozen_after: origin,
    prediction: value,
    actual,
    units: p.target_metadata.units,
    scope: 'retrospective input-interruption case',
    rolloutPoints
  };
}

// Canvas Hydrograph Visualizer
function drawHydrograph(history, rolloutPoints = []) {
  const canvas = $('hydrographCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 700;
  const height = canvas.clientHeight || 260;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!history || !history.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Chưa có dữ liệu dòng chảy. Hãy nạp mô hình và bấm Dự báo.', width / 2, height / 2);
    return;
  }

  // De-normalize historical lookback values to physical units (mm/d) using the target feature scaler
  let targetIdx = 0;
  let targetScaler = null;
  let bounds = null;
  if (active && active.record && active.record.preprocessing) {
    const p = active.record.preprocessing;
    if (p.target_feature_name && p.feature_columns && p.feature_columns.indexOf(p.target_feature_name) >= 0) {
      targetIdx = p.feature_columns.indexOf(p.target_feature_name);
    } else if (p.feature_columns) {
      const found = p.feature_columns.findIndex(c => c.includes('runoff') || c.includes('streamflow'));
      if (found >= 0) targetIdx = found;
    }
    if (p.target_scaler && p.target_scaler.scale > 0) {
      targetScaler = p.target_scaler;
    } else if (p.feature_scaler && p.feature_scaler.scale && p.feature_scaler.scale[targetIdx] > 0) {
      targetScaler = {
        min: p.feature_scaler.min[targetIdx],
        scale: p.feature_scaler.scale[targetIdx]
      };
    }
    bounds = p.prediction_bounds;
  }

  const histVals = history.map(row => {
    const raw = row[targetIdx];
    if (targetScaler && targetScaler.scale > 0) {
      let val = (raw - targetScaler.min) / targetScaler.scale;
      if (bounds && bounds.lower != null) val = Math.max(val, bounds.lower);
      if (bounds && bounds.upper != null) val = Math.min(val, bounds.upper);
      return val;
    }
    return raw;
  });

  const allVals = [...histVals];
  if (rolloutPoints) {
    for (const p of rolloutPoints) {
      if (p.prediction != null) allVals.push(p.prediction);
      if (p.actual != null) allVals.push(p.actual);
    }
  }
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(1, ...allVals) * 1.15;

  const padLeft = 50, padRight = 30, padTop = 25, padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getY = val => padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
  const totalSteps = 30 + (rolloutPoints?.length || 1);
  const getX = idx => padLeft + (idx / totalSteps) * plotW;

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  const yTicks = 4;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';

  for (let i = 0; i <= yTicks; i++) {
    const val = minVal + (maxVal - minVal) * (i / yTicks);
    const y = getY(val);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    ctx.fillText(val.toFixed(1), padLeft - 6, y + 3);
  }
  ctx.setLineDash([]);

  // Shaded background for historical lookback
  const freezeX = getX(30);
  ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
  ctx.fillRect(padLeft, padTop, freezeX - padLeft, plotH);

  // Shaded background for Outage Forecast Zone
  ctx.fillStyle = 'rgba(254, 243, 199, 0.4)';
  ctx.fillRect(freezeX, padTop, width - padRight - freezeX, plotH);

  // Vertical Disconnection / Stale Marker
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(freezeX, padTop);
  ctx.lineTo(freezeX, padTop + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#ef4444';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Điểm đứt gãy (Origin)', freezeX, padTop - 6);

  // Plot Points Storage for Hover
  const pointRegistry = [];

  // Plot 30-Day Historical Lookback Curve
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 30; i++) {
    const x = getX(i);
    const y = getY(histVals[i]);
    pointRegistry.push({ x, y, idx: i, val: histVals[i], type: 'history' });
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Plot Rollout Forecast Points & Curve
  if (rolloutPoints && rolloutPoints.length) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(getX(29), getY(histVals[29]));

    for (const p of rolloutPoints) {
      const x = getX(30 + p.lead);
      const y = getY(p.prediction);
      ctx.lineTo(x, y);
      pointRegistry.push({ x, y, idx: 30 + p.lead, val: p.prediction, actual: p.actual, lead: p.lead, date: p.date, type: 'rollout' });
    }
    ctx.stroke();

    // Draw forecast markers
    for (const p of rolloutPoints) {
      const x = getX(30 + p.lead);
      const y = getY(p.prediction);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // If actual value available, draw ground truth
      if (p.actual != null) {
        const yAct = getY(p.actual);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, yAct, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#065f46';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Axis labels
  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('30 ngày quan trắc lịch sử (Lookback Window)', padLeft + (freezeX - padLeft) / 2, height - 10);
  ctx.fillText('Hạn dự báo đứt gãy (+1d, +3d, +7d)', freezeX + (width - padRight - freezeX) / 2, height - 10);

  // Y-axis title
  ctx.save();
  ctx.translate(14, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Dòng chảy (mm/d)', 0, 0);
  ctx.restore();

  lastPlottedHydrograph = { history, rolloutPoints, pointRegistry };
}

// Canvas Sybil Map Visualizer (Cartesian Mode)
function drawSybilMap(reports = [], result = null) {
  const canvas = $('sybilMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 500;
  const height = canvas.clientHeight || 260;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // Coordinate Grid (Range: -3km to +3km initially)
  const kmScale = 45; // 45px per km
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);

  for (let r = 1; r <= 3; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * kmScale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText(`${r}km`, cx + r * kmScale + 3, cy - 3);
  }
  ctx.setLineDash([]);

  // Axis cross
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(0, cy); ctx.lineTo(width, cy);
  ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
  ctx.stroke();

  if (!reports || !reports.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Chưa có báo cáo nào. Bấm thử một kịch bản hoặc thêm báo cáo.', cx, cy + 50);
    return;
  }

  // Draw DBSCAN neighborhood halo if selected reports exist
  if (result && result.selected > 0) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.0 * kmScale, 0, Math.PI * 2); // epsilon = 1km
    ctx.fill();
    ctx.stroke();
  }

  // Draw reports
  for (const r of reports) {
    const isDistant = Math.abs(r.x) > 3.2 || Math.abs(r.y) > 2.2;
    let px = cx + r.x * kmScale;
    let py = cy - r.y * kmScale;

    if (isDistant) {
      px = cx + Math.sign(r.x) * (width / 2 - 25);
      py = cy - Math.sign(r.y) * (height / 2 - 25);
    }

    const radius = 4 + (r.reputation || 0.5) * 5;

    if (isDistant) {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 6, py - 6); ctx.lineTo(px + 6, py + 6);
      ctx.moveTo(px + 6, py - 6); ctx.lineTo(px - 6, py + 6);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Sybil Outlier (${r.x}km)`, px - 10, py - 10);
    } else {
      ctx.fillStyle = r.claim ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

// Update Dempster-Shafer Mass Bar & Banner
function updateDempsterShaferUI(result) {
  if (!result) return;
  lastVerificationResult = result;
  const mDis = Math.max(0, Math.min(1, result.disaster || 0));
  const mNo = Math.max(0, Math.min(1, result.noDisaster || 0));
  const u = Math.max(0, Math.min(1, result.uncertainty || 0));

  if ($('massDisasterSeg')) $('massDisasterSeg').style.width = `${(mDis * 100).toFixed(1)}%`;
  if ($('massNoDisasterSeg')) $('massNoDisasterSeg').style.width = `${(mNo * 100).toFixed(1)}%`;
  if ($('massUncertaintySeg')) $('massUncertaintySeg').style.width = `${(u * 100).toFixed(1)}%`;

  if ($('massDisasterVal')) $('massDisasterVal').textContent = `${(mDis * 100).toFixed(1)}%`;
  if ($('massNoDisasterVal')) $('massNoDisasterVal').textContent = `${(mNo * 100).toFixed(1)}%`;
  if ($('massUncertaintyVal')) $('massUncertaintyVal').textContent = `${(u * 100).toFixed(1)}%`;

  const banner = $('actionDecisionBanner');
  if (banner) {
    if (result.action === 1) {
      banner.className = 'action-banner alert';
      banner.textContent = `🚨 KÍCH HOẠT CẢNH BÁO THIÊN TAI (m_Disaster = ${(mDis * 100).toFixed(1)}% ≥ 75%)`;
    } else if (result.action === 0) {
      banner.className = 'action-banner safe';
      banner.textContent = `✅ KHÔNG CÓ THIÊN TAI / AN TOÀN (m_NoDisaster = ${(mNo * 100).toFixed(1)}% ≥ 75%)`;
    } else {
      banner.className = 'action-banner uncertain';
      banner.textContent = `⚠️ ĐỘ BẤT ĐỊNH CAO / TẠM HOÃN HÀNH ĐỘNG (u = ${(u * 100).toFixed(1)}%)`;
    }
  }
}

// Leaflet GIS Map Functions
function initLeafletMap() {
  const container = $('leafletMap');
  if (!container || typeof L === 'undefined') return;

  leafletMap = L.map('leafletMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([activeBasinCenter.lat, activeBasinCenter.lon], activeBasinCenter.zoom);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    subdomains: ['a', 'b', 'c']
  }).addTo(leafletMap);

  reportMarkersLayer = L.layerGroup().addTo(leafletMap);

  fetch('./CuuNet_ERA5Land_L7_basins.geojson')
    .then(r => r.json())
    .then(data => {
      geojsonData = data;
      renderActiveBasin();
    })
    .catch(e => console.warn('Could not load GeoJSON basins:', e));

  leafletMap.on('click', e => {
    const center = activeBasinCenter;
    const dLat = e.latlng.lat - center.lat;
    const dLon = e.latlng.lng - center.lon;
    const yKm = +(dLat * 110.574).toFixed(3);
    const xKm = +(dLon * 111.32 * Math.cos(center.lat * Math.PI / 180)).toFixed(3);

    if ($('reportX')) $('reportX').value = xKm;
    if ($('reportY')) $('reportY').value = yKm;

    if (clickMarker) leafletMap.removeLayer(clickMarker);
    clickMarker = L.circleMarker(e.latlng, {
      radius: 7,
      color: '#f59e0b',
      fillColor: '#fbbf24',
      fillOpacity: 0.9,
      weight: 2,
      dashArray: '3, 3'
    }).addTo(leafletMap);

    clickMarker.bindPopup(`
      <div style="font-size:12px; font-family:sans-serif;">
        <strong style="color:#d97706;">📍 Điểm chọn trên bản đồ</strong><br>
        Tọa độ GPS: [${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}]<br>
        Khoảng cách trạm: X = ${xKm} km, Y = ${yKm} km<br>
        <em>Đã điền vào form bên dưới. Nhấp 'Lưu báo cáo' để thêm.</em>
      </div>
    `).openPopup();
  });
}

function renderActiveBasin() {
  if (!leafletMap || !geojsonData) return;
  if (basinGeoJsonLayer) leafletMap.removeLayer(basinGeoJsonLayer);
  if (stationMarker) leafletMap.removeLayer(stationMarker);

  const feature = geojsonData.features.find(f => f.properties.zone === currentZone);
  const meta = BASIN_METADATA[currentZone] || BASIN_METADATA.Bao_Ha_Runoff;
  activeBasinCenter = meta;

  if (feature) {
    basinGeoJsonLayer = L.geoJSON(feature, {
      style: {
        color: meta.color,
        weight: 2.5,
        dashArray: '5, 5',
        fillColor: meta.color,
        fillOpacity: 0.18
      }
    }).addTo(leafletMap);

    leafletMap.flyToBounds(basinGeoJsonLayer.getBounds(), { padding: [20, 20], maxZoom: 12 });
  } else {
    leafletMap.flyTo([meta.lat, meta.lon], meta.zoom);
  }

  stationMarker = L.marker([meta.lat, meta.lon]).addTo(leafletMap);
  stationMarker.bindPopup(`
    <div style="font-size:12px; font-family:sans-serif;">
      <strong>🏢 Trạm Thủy văn Cục bộ</strong><br>
      ${meta.name}<br>
      Tọa độ tâm: [${meta.lat}, ${meta.lon}]<br>
      <em>Tọa độ gốc (0, 0) km cho mạng lưới cảm biến.</em>
    </div>
  `);
}

function updateLeafletMarkers(reports = [], result = null) {
  if (!leafletMap || !reportMarkersLayer) return;
  reportMarkersLayer.clearLayers();

  const center = activeBasinCenter;
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    const lat = center.lat + r.y / 110.574;
    const lon = center.lon + r.x / (111.32 * Math.cos(center.lat * Math.PI / 180));

    const isOutlier = Math.abs(r.x) > 3.2 || Math.abs(r.y) > 2.2;
    const radius = 5 + (r.reputation || 0.5) * 4;

    const markerColor = isOutlier ? '#94a3b8' : (r.claim ? '#ef4444' : '#10b981');
    const marker = L.circleMarker([lat, lon], {
      radius: radius,
      color: isOutlier ? '#ef4444' : '#ffffff',
      weight: 1.5,
      fillColor: markerColor,
      fillOpacity: 0.85
    }).addTo(reportMarkersLayer);

    const statusBadge = isOutlier
      ? '<span style="color:#ef4444; font-weight:700;">[Ngoại lai Sybil — Loại bỏ]</span>'
      : '<span style="color:#10b981; font-weight:700;">[Báo cáo hợp lệ]</span>';

    marker.bindPopup(`
      <div style="font-size:12px; font-family:sans-serif; line-height:1.4;">
        <strong>Báo cáo #${i + 1}</strong> ${statusBadge}<br>
        Tọa độ GPS: [${lat.toFixed(4)}, ${lon.toFixed(4)}]<br>
        Khoảng cách trạm: X = ${r.x} km, Y = ${r.y} km<br>
        Nội dung: <b>${r.claim ? '🚨 CÓ NGẬP' : '✅ KHÔNG NGẬP'}</b><br>
        Điểm uy tín: <b>${(r.reputation * 100).toFixed(0)}%</b> (Đóng băng)<br>
        Tuổi dữ liệu: <b>${(r.age || 0).toFixed(1)} giờ</b>
      </div>
    `);
  }
}

async function loadModel(id) {
  if (busy) return;
  busy = true;
  try {
    if (active) active.model.dispose();
    active = null;
    await tf.setBackend($('backend').value);
    await tf.ready();

    const record = models.get(id);
    if (!record) throw Error('Nạp gói mô hình trước.');

    // Automatically synchronize GIS zone with loaded model
    if (id.includes('Bao_Ha')) currentZone = 'Bao_Ha_Runoff';
    else if (id.includes('Gianh')) currentZone = 'Gianh_Runoff';
    else if (id.includes('Can_Tho')) currentZone = 'Can_Tho_Runoff';
    renderActiveBasin();

    const j = record.json;
    const artifacts = {
      modelTopology: j.modelTopology,
      weightSpecs: j.weightsManifest.flatMap(g => g.weights),
      weightData: record.weightData,
      format: j.format,
      signature: j.signature,
      generatedBy: j.generatedBy,
      convertedBy: j.convertedBy
    };
    const start = performance.now();
    const model = await tf.loadGraphModel({ load: async () => artifacts });
    active = { record, model };
    const loadMs = performance.now() - start;
    note('load', { model: id, backend: tf.getBackend(), load_ms: loadMs });

    if ($('forecastStatus')) {
      $('forecastStatus').textContent = `Đã nạp ${id}.\nBackend: ${tf.getBackend().toUpperCase()}\nNguồn dữ liệu: ${record.preprocessing.target_metadata.data_class} (Retrospective Evaluation)\nThời gian nạp đồ thị: ${loadMs.toFixed(2)} ms`;
    }
    if ($('predict')) $('predict').disabled = false;
    if ($('benchmark')) $('benchmark').disabled = false;

    // Draw initial historical lookback
    const c = record.case;
    const idx = Number($('caseIndex').value || 0);
    if (c.inputs && c.inputs[idx]) {
      drawHydrograph(c.inputs[idx]);
    }
  } catch (e) {
    fail('forecastStatus', e);
    if ($('predict')) $('predict').disabled = true;
    if ($('benchmark')) $('benchmark').disabled = true;
  } finally {
    busy = false;
  }
}

function catalogue() {
  const select = $('modelSelect');
  if (!select) return;
  select.innerHTML = '<option value="">Chọn mô hình đã nạp</option>';
  for (const [id] of models) {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = id;
    select.append(o);
  }
}

for (const r of await all('models')) models.set(r.id, r);
catalogue();

if ($('modelSelect')) $('modelSelect').onchange = () => loadModel($('modelSelect').value);
if ($('backend')) $('backend').onchange = () => loadModel($('modelSelect').value);

// Slider synchronization
if ($('caseSlider') && $('caseIndex')) {
  $('caseSlider').oninput = () => {
    $('caseIndex').value = $('caseSlider').value;
    if (active && active.record.case.inputs) {
      drawHydrograph(active.record.case.inputs[Number($('caseIndex').value)]);
    }
  };
  $('caseIndex').oninput = () => {
    $('caseSlider').value = $('caseIndex').value;
    if (active && active.record.case.inputs) {
      drawHydrograph(active.record.case.inputs[Number($('caseIndex').value)]);
    }
  };
}

async function processBundleZip(fileBuffer, fileName) {
  const files = fflate.unzipSync(new Uint8Array(fileBuffer));
  const read = name => {
    if (!files[name]) throw Error('Missing ' + name);
    return JSON.parse(new TextDecoder().decode(files[name]));
  };
  const manifest = read('deployment_bundle_manifest.json');
  if (manifest.format !== 'cuunet-browser-model-v1' || !['observed', 'reanalysis'].includes(manifest.provenance_class) || !manifest.forecast_audit_passed) {
    throw Error('Gói chưa phải kết quả vật lý đã kiểm toán.');
  }

  for (const [name, expected] of Object.entries(manifest.files)) {
    if (!files[name]) throw Error('Missing ' + name);
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', files[name]))].map(x => x.toString(16).padStart(2, '0')).join('');
    if (hash !== expected) throw Error('Checksum mismatch ' + name);
  }

  for (const item of manifest.models) {
    const j = read(item.model_json);
    const p = read(item.preprocessing);
    const c = read(item.case_json);
    if (j.format !== 'graph-model' || c.input_shape[1] !== 30 || ![5, 8].includes(c.input_shape[2])) {
      throw Error('Unsupported physical model shape');
    }
    if (p.feature_columns.length !== c.input_shape[2] || p.target_scaler.scale <= 0 || p.outage_input_policy !== 'frozen') {
      throw Error('Invalid preprocessing');
    }
    const prefix = item.model_json.slice(0, item.model_json.lastIndexOf('/') + 1);
    const chunks = j.weightsManifest.flatMap(g => g.paths).map(path => files[prefix + path]);
    if (chunks.some(x => !x)) throw Error('Missing model shard');
    const total = chunks.reduce((s, x) => s + x.length, 0);
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    const record = { id: item.id, json: j, weightData: combined.buffer, preprocessing: p, case: c };
    await put('models', record);
    models.set(record.id, record);
  }
  catalogue();
  if ($('forecastStatus')) {
    $('forecastStatus').textContent = `Đã lưu mô hình từ ${fileName} vào IndexedDB.\nKiểm tra mã băm SHA-256: HỢP LỆ (100% Khớp manifest).\nChọn mô hình để bắt đầu.`;
  }
}

async function loadPresetZip(url) {
  try {
    if ($('forecastStatus')) $('forecastStatus').textContent = `Đang tải ${url}…`;
    const resp = await fetch(url);
    if (!resp.ok) throw Error(`Không thể tải ${url}: ${resp.status}`);
    const buf = await resp.arrayBuffer();
    await processBundleZip(buf, url);
    const select = $('modelSelect');
    if (select && select.options.length > 1) {
      select.selectedIndex = 1;
      await loadModel(select.value);
    }
  } catch (e) {
    fail('forecastStatus', e);
  }
}

// Preset Buttons
if ($('btnPresetBaoHa')) $('btnPresetBaoHa').onclick = () => {
  currentZone = 'Bao_Ha_Runoff';
  loadPresetZip('model_bundle_bao_ha.zip');
};
if ($('btnPresetGianh')) $('btnPresetGianh').onclick = () => {
  currentZone = 'Gianh_Runoff';
  loadPresetZip('model_bundle_gianh.zip');
};
if ($('btnPresetCanTho')) $('btnPresetCanTho').onclick = () => {
  currentZone = 'Can_Tho_Runoff';
  loadPresetZip('model_bundle_can_tho.zip');
};

if ($('modelZip')) {
  $('modelZip').onchange = async () => {
    try {
      const file = $('modelZip').files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) throw Error('Nạp gói browser model nhỏ, không phải ZIP toàn bộ kết quả.');
      await processBundleZip(await file.arrayBuffer(), file.name);
    } catch (e) {
      fail('forecastStatus', e);
    }
  };
}

// Predict button
if ($('predict')) {
  $('predict').onclick = async () => {
    if (!active || busy) return;
    busy = true;
    try {
      const start = performance.now();
      const idx = Number($('caseIndex').value || 0);
      const h = Number($('horizon').value || 1);
      const result = await forecast(idx, h);
      const elapsed = performance.now() - start;

      lastForecastResult = result;
      note('forecast', { model: active.record.id, backend: tf.getBackend(), ms: elapsed, ...result });

      if ($('statPrediction')) $('statPrediction').textContent = `${result.prediction.toFixed(2)} mm/d`;
      if ($('statActual')) $('statActual').textContent = result.actual != null ? `${result.actual.toFixed(2)} mm/d` : 'N/A';
      if ($('statAbsError')) {
        $('statAbsError').textContent = result.actual != null ? `${Math.abs(result.prediction - result.actual).toFixed(2)} mm/d` : 'N/A';
      }
      if ($('statOutagePolicy')) {
        $('statOutagePolicy').textContent = `Đóng băng từ ${result.physical_inputs_frozen_after}`;
      }

      if ($('forecastStatus')) {
        $('forecastStatus').textContent = JSON.stringify(result, null, 2);
      }

      drawHydrograph(active.record.case.inputs[idx], result.rolloutPoints);
    } catch (e) {
      fail('forecastStatus', e);
    } finally {
      busy = false;
    }
  };
}

// Benchmark 50 repetitions
if ($('benchmark')) {
  $('benchmark').onclick = async () => {
    if (!active || busy) return;
    busy = true;
    try {
      const index = Number($('caseIndex').value || 0);
      const sequence = active.record.case.inputs[index];
      if (!sequence) throw Error('Invalid case index');

      // 10 Warmup
      const inputTensor = tf.tensor3d([sequence]);
      const coldStart = performance.now();
      const coldOut = await active.model.executeAsync(inputTensor);
      tf.dispose(coldOut);
      const first_inference_ms = performance.now() - coldStart;

      for (let i = 0; i < 10; i++) {
        const out = await active.model.executeAsync(inputTensor);
        tf.dispose(out);
      }

      // 50 Measured passes
      const times = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        const out = await active.model.executeAsync(inputTensor);
        tf.dispose(out);
        times.push(performance.now() - start);
      }
      inputTensor.dispose();

      const sorted = [...times].sort((a, b) => a - b);
      const warm_median_ms = sorted[Math.floor(sorted.length / 2)];
      const warm_p95_ms = sorted[Math.ceil(0.95 * sorted.length) - 1];
      const mem = tf.memory();
      const heap = performance.memory?.usedJSHeapSize ?? null;

      if ($('statCold')) $('statCold').textContent = `${first_inference_ms.toFixed(1)} ms`;
      if ($('statMedian')) $('statMedian').textContent = `${warm_median_ms.toFixed(2)} ms`;
      if ($('statP95')) $('statP95').textContent = `${warm_p95_ms.toFixed(2)} ms`;
      if ($('statTensorMem')) $('statTensorMem').textContent = `${(mem.numBytes / 1024 / 1024).toFixed(2)} MB`;
      if ($('statHeap')) $('statHeap').textContent = heap ? `${(heap / 1024 / 1024).toFixed(1)} MB` : 'N/A';

      const result = {
        model: active.record.id,
        backend: tf.getBackend(),
        tfjs: tf.version.tfjs,
        user_agent: navigator.userAgent,
        repeats: 50,
        warmup_runs: 10,
        first_inference_ms,
        warm_median_ms,
        warm_p95_ms,
        times_ms: times,
        tensor_memory: mem,
        js_heap_bytes: heap,
        scope: 'single cached case; tensor/JS memory is not total device or GPU memory; no energy measurement'
      };
      lastBenchmarkResult = result;
      note('benchmark', result);
      if ($('forecastStatus')) $('forecastStatus').textContent = JSON.stringify(result, null, 2);
    } catch (e) {
      fail('forecastStatus', e);
    } finally {
      busy = false;
    }
  };
}

// Master Scientific Export
if ($('exportLogs')) {
  $('exportLogs').onclick = () => {
    const auditPackage = {
      format: 'cuunet-browser-scientific-audit-v1',
      timestamp: new Date().toISOString(),
      manuscript: 'HYDRO-D-26-00188 (Journal of Hydroinformatics)',
      author: 'Nguyen Phu Toan (nphu211206@gmail.com)',
      environment: {
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        hardware_concurrency: navigator.hardwareConcurrency,
        device_memory_gb: navigator.deviceMemory || 'unsupported',
        backend: tf.getBackend(),
        tfjs_version: tf.version.tfjs
      },
      active_model: active ? {
        id: active.record.id,
        zone: currentZone,
        provenance_class: active.record.preprocessing?.target_metadata?.data_class,
        outage_policy: active.record.preprocessing?.outage_input_policy,
        input_shape: active.record.case?.input_shape,
        feature_columns: active.record.preprocessing?.feature_columns
      } : null,
      verification_benchmarks: lastBenchmarkResult,
      rollout_forecast: lastForecastResult,
      sybil_defence_consensus: lastVerificationResult,
      session_logs: log
    };
    download(auditPackage, `CuuNet_browser_audit_${currentZone}_${Date.now()}.json`);
  };
}

// Crowdsourced Report Handling
if ($('reportForm')) {
  $('reportForm').onsubmit = async event => {
    event.preventDefault();
    try {
      const existing = await all('reports');
      if (existing.length >= 500) throw Error('Bộ lưu trữ đã đạt giới hạn tối đa 500 báo cáo trên thiết bị.');
      const f = new FormData(event.target);
      const r = {
        id: crypto.randomUUID(),
        x: Number(f.get('x')),
        y: Number(f.get('y')),
        reputation: Number(f.get('reputation')),
        claim: f.get('claim') === 'true',
        timestamp: Date.now()
      };
      verifyReports([{ ...r, age: 0 }]);
      await put('reports', r);
      await counts();
      const allReps = await all('reports');
      drawSybilMap(allReps);
      updateLeafletMarkers(allReps);
    } catch (e) {
      fail('verificationStatus', e);
    }
  };
}

if ($('verify')) {
  $('verify').onclick = async () => {
    try {
      const now = Date.now();
      const allReps = await all('reports');
      const reports = allReps.filter(r => r.timestamp <= now).map(r => ({ ...r, age: (now - r.timestamp) / 3600000 }));
      const result = verifyReports(reports, { terrain: $('terrain')?.checked || false });
      note('local_verification', { ...result, reports: reports.length, terrain_simulation: $('terrain')?.checked || false });

      updateDempsterShaferUI(result);
      drawSybilMap(allReps, result);
      updateLeafletMarkers(allReps, result);

      if ($('verificationStatus')) {
        $('verificationStatus').textContent = JSON.stringify({ ...result, scope: 'local batch only; reputation frozen; no independently verified event label' }, null, 2);
      }
    } catch (e) {
      fail('verificationStatus', e);
    }
  };
}

// Presets for Adversarial Scenarios
async function loadScenario(reports) {
  const tx = db.transaction('reports', 'readwrite');
  tx.objectStore('reports').clear();
  await new Promise(res => { tx.oncomplete = res; });

  const now = Date.now();
  for (const r of reports) {
    await put('reports', {
      id: crypto.randomUUID(),
      x: r.x,
      y: r.y,
      reputation: r.reputation,
      claim: r.claim,
      timestamp: now - (r.age || 0) * 3600000
    });
  }
  await counts();
  $('verify').click();
}

if ($('btnScenarioA')) {
  $('btnScenarioA').onclick = () => loadScenario([
    { x: 0, y: 0, reputation: 0.9, claim: true, age: 0.1 },
    { x: 0.2, y: 0.1, reputation: 0.85, claim: true, age: 0.2 },
    { x: 0.3, y: 0.2, reputation: 0.8, claim: true, age: 0.3 },
    { x: 50, y: 50, reputation: 0.9, claim: false, age: 0.1 } // distant Sybil outlier
  ]);
}

if ($('btnScenarioB')) {
  $('btnScenarioB').onclick = () => loadScenario([
    { x: 0, y: 0, reputation: 0.9, claim: true, age: 0.1 },
    { x: 0.1, y: 0.1, reputation: 0.9, claim: true, age: 0.2 },
    { x: 0.2, y: 0, reputation: 0.9, claim: false, age: 0.1 },
    { x: 0, y: 0.2, reputation: 0.9, claim: false, age: 0.2 }
  ]);
}

if ($('btnScenarioC')) {
  $('btnScenarioC').onclick = () => loadScenario([
    { x: 0, y: 0, reputation: 0.95, claim: true, age: 7.5 },
    { x: 0.1, y: 0, reputation: 0.95, claim: true, age: 8.0 },
    { x: 0.2, y: 0.1, reputation: 0.95, claim: true, age: 9.0 }
  ]);
}

if ($('exportReports')) {
  $('exportReports').onclick = async () => download({ format: 'cuunet-local-reports-v1', scope: 'local unverified reports', reports: await all('reports') }, 'CuuNet_local_reports.json');
}

if ($('importReports')) {
  $('importReports').onchange = async () => {
    try {
      const file = $('importReports').files[0];
      if (!file) return;
      const data = JSON.parse(await file.text());
      if (data.format !== 'cuunet-local-reports-v1' || !Array.isArray(data.reports) || data.reports.length > 500) {
        throw Error('Invalid local report batch');
      }
      const existing = await all('reports');
      const map = new Map(existing.map(r => [r.id, r]));
      for (const r of data.reports) {
        if (typeof r.id !== 'string' || !Number.isFinite(r.timestamp)) throw Error('Invalid report identifier/time');
        verifyReports([{ ...r, age: 0 }]);
        map.set(r.id, r);
      }
      if (map.size > 500) throw Error(`Tổng số báo cáo sau khi nhập (${map.size}) vượt quá 500.`);
      for (const r of data.reports) await put('reports', r);
      await counts();
      const allReps = await all('reports');
      drawSybilMap(allReps);
      updateLeafletMarkers(allReps);
      if ($('verificationStatus')) $('verificationStatus').textContent = 'Đã nhập báo cáo cục bộ.';
    } catch (e) {
      fail('verificationStatus', e);
    }
  };
}

// View Toggle Buttons (GIS Leaflet vs Cartesian DBSCAN)
if ($('btnViewGIS') && $('btnViewCluster')) {
  $('btnViewGIS').onclick = () => {
    $('btnViewGIS').classList.add('active');
    $('btnViewCluster').classList.remove('active');
    $('leafletMapWrapper').style.display = 'block';
    $('sybilCanvasWrapper').style.display = 'none';
    if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 50);
  };
  $('btnViewCluster').onclick = () => {
    $('btnViewCluster').classList.add('active');
    $('btnViewGIS').classList.remove('active');
    $('leafletMapWrapper').style.display = 'none';
    $('sybilCanvasWrapper').style.display = 'block';
    drawSybilMap(lastReports, lastVerificationResult);
  };
}

// Initialize Leaflet Map
initLeafletMap();

// Initial Map and Hydrograph Render
drawHydrograph([]);
drawSybilMap(await all('reports'));
updateLeafletMarkers(await all('reports'));

// If no models loaded, auto-load Bao Ha model bundle for immediate live demonstration
if (models.size === 0) {
  loadPresetZip('model_bundle_bao_ha.zip');
}
