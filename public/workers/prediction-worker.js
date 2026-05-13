/**
 * Prediction Web Worker
 *
 * Runs heavy computation (risk calculation + prediction) off the main thread.
 * Communicates via postMessage/onmessage.
 *
 * Messages:
 *   IN:  { type: 'init' }
 *   OUT: { type: 'ready', success: boolean, backend: string|null }
 *
 *   IN:  { type: 'predict', data: { provinces, historicalData, month, scenarioModifier } }
 *   OUT: { type: 'result', data: { riskScores, predictions } }
 *
 *   IN:  { type: 'dispose' }
 *   OUT: { type: 'disposed' }
 */

/* eslint-disable no-restricted-globals */

// === INLINE RISK CALCULATION (avoid import issues in workers) ===

const SEASONAL_MULTIPLIER = {
  flood:     [0.15, 0.15, 0.25, 0.35, 0.55, 0.70, 0.80, 0.90, 1.00, 0.85, 0.60, 0.25],
  storm:     [0.05, 0.05, 0.08, 0.15, 0.25, 0.45, 0.65, 0.80, 1.00, 0.90, 0.55, 0.15],
  landslide: [0.15, 0.15, 0.25, 0.35, 0.55, 0.70, 0.80, 0.90, 1.00, 0.80, 0.45, 0.15],
  drought:   [0.70, 0.80, 0.90, 1.00, 0.65, 0.35, 0.15, 0.10, 0.10, 0.20, 0.40, 0.60],
  earthquake:[0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50],
  tsunami:   [0.25, 0.25, 0.30, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.65, 0.45, 0.30],
};

const BASE_FREQUENCY = {
  "Quảng Bình":   { flood: 0.92, storm: 0.75, landslide: 0.65, drought: 0.15, earthquake: 0.05, tsunami: 0.10 },
  "Đà Nẵng":      { flood: 0.70, storm: 0.90, landslide: 0.45, drought: 0.10, earthquake: 0.08, tsunami: 0.15 },
  "Huế":           { flood: 0.85, storm: 0.80, landslide: 0.55, drought: 0.12, earthquake: 0.05, tsunami: 0.12 },
  "Lào Cai":       { flood: 0.55, storm: 0.30, landslide: 0.92, drought: 0.20, earthquake: 0.15, tsunami: 0.00 },
  "Yên Bái":       { flood: 0.50, storm: 0.35, landslide: 0.88, drought: 0.18, earthquake: 0.12, tsunami: 0.00 },
  "Quảng Nam":     { flood: 0.80, storm: 0.85, landslide: 0.70, drought: 0.10, earthquake: 0.06, tsunami: 0.10 },
  "Cần Thơ":       { flood: 0.60, storm: 0.25, landslide: 0.02, drought: 0.90, earthquake: 0.02, tsunami: 0.05 },
  "An Giang":      { flood: 0.65, storm: 0.20, landslide: 0.01, drought: 0.88, earthquake: 0.02, tsunami: 0.03 },
  "Bến Tre":       { flood: 0.45, storm: 0.30, landslide: 0.01, drought: 0.85, earthquake: 0.02, tsunami: 0.05 },
  "Hà Nội":        { flood: 0.55, storm: 0.40, landslide: 0.10, drought: 0.30, earthquake: 0.05, tsunami: 0.00 },
  "Hải Phòng":     { flood: 0.50, storm: 0.65, landslide: 0.05, drought: 0.20, earthquake: 0.08, tsunami: 0.08 },
  "Hồ Chí Minh":   { flood: 0.40, storm: 0.30, landslide: 0.01, drought: 0.35, earthquake: 0.03, tsunami: 0.05 },
  "Trà Vinh":      { flood: 0.40, storm: 0.25, landslide: 0.01, drought: 0.80, earthquake: 0.02, tsunami: 0.05 },
  "Đà Lạt":        { flood: 0.30, storm: 0.20, landslide: 0.75, drought: 0.40, earthquake: 0.10, tsunami: 0.00 },
  "Nha Trang":     { flood: 0.45, storm: 0.70, landslide: 0.30, drought: 0.25, earthquake: 0.12, tsunami: 0.18 },
};

const PROVINCE_EXPOSURE = {
  "Hà Nội": 1.00, "Hồ Chí Minh": 0.95, "Hải Phòng": 0.70, "Đà Nẵng": 0.60,
  "Cần Thơ": 0.55, "Huế": 0.45, "Nha Trang": 0.50, "Quảng Bình": 0.35,
  "Quảng Nam": 0.40, "Bến Tre": 0.50, "Trà Vinh": 0.40, "An Giang": 0.55,
  "Lào Cai": 0.20, "Yên Bái": 0.22, "Đà Lạt": 0.25,
};

const PROVINCE_VULNERABILITY = {
  "Quảng Bình": 0.85, "Lào Cai": 0.80, "Yên Bái": 0.82, "Huế": 0.65,
  "Quảng Nam": 0.70, "Cần Thơ": 0.55, "An Giang": 0.60, "Bến Tre": 0.65,
  "Trà Vinh": 0.70, "Đà Nẵng": 0.30, "Hà Nội": 0.20, "Hồ Chí Minh": 0.25,
  "Hải Phòng": 0.35, "Đà Lạt": 0.45, "Nha Trang": 0.40,
};

const GEO_RISK_BOOST = {
  coastal: { storm: 1.3, tsunami: 1.5, flood: 1.1 },
  mountain: { landslide: 1.4, earthquake: 1.2, flood: 0.8 },
  delta:   { flood: 1.3, drought: 1.2 },
  urban:   { flood: 1.1 },
  highland: { landslide: 1.3, drought: 1.2 },
};

const PROVINCE_GEO_TYPE = {
  "Quảng Bình": "coastal", "Đà Nẵng": "coastal", "Huế": "coastal",
  "Lào Cai": "mountain", "Yên Bái": "mountain", "Quảng Nam": "coastal",
  "Cần Thơ": "delta", "An Giang": "delta", "Bến Tre": "delta",
  "Hà Nội": "urban", "Hải Phòng": "coastal", "Hồ Chí Minh": "urban",
  "Trà Vinh": "delta", "Đà Lạt": "highland", "Nha Trang": "coastal",
};

function calculateRiskScore(province, type, month, scenarioModifier) {
  const base = BASE_FREQUENCY[province]?.[type] ?? 0.1;
  const seasonal = SEASONAL_MULTIPLIER[type]?.[month] ?? 0.5;
  const exposure = PROVINCE_EXPOSURE[province] ?? 0.3;
  const vulnerability = PROVINCE_VULNERABILITY[province] ?? 0.5;
  const geoType = PROVINCE_GEO_TYPE[province];
  const geoBoost = GEO_RISK_BOOST[geoType]?.[type] ?? 1.0;

  const hazard = base * seasonal * geoBoost;
  const rawScore = hazard * 0.4 + exposure * 0.3 + vulnerability * 0.3;
  return Math.min(1, Math.max(0, rawScore * (scenarioModifier || 1.0)));
}

// === STATISTICAL PREDICTION (INLINE) ===

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function linearRegression(data) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += data[i]; sumXY += i * data[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function predictStatistical(historicalData, months) {
  const n = historicalData.length;
  if (n < 3) {
    const avg = mean(historicalData);
    return Array(months).fill(null).map((_, i) => ({
      predicted: avg, lower: Math.max(0, avg - 0.3), upper: Math.min(1, avg + 0.3),
    }));
  }

  // Moving Average
  const window = Math.min(3, n);
  const recentMA = mean(historicalData.slice(-window));
  const prevMA = n >= window * 2 ? mean(historicalData.slice(-window * 2, -window)) : recentMA;
  const trend = (recentMA - prevMA) / window;

  // Linear Regression
  const { slope, intercept } = linearRegression(historicalData);

  // Ensemble
  const predictions = [];
  for (let i = 0; i < months; i++) {
    const maPred = recentMA + trend * (i + 1);
    const lrPred = slope * (n + i) + intercept;
    const predicted = Math.max(0, Math.min(1, (maPred * 0.5 + lrPred * 0.5)));

    const stdDev = Math.sqrt(historicalData.reduce((s, v) => s + (v - mean(historicalData)) ** 2, 0) / n);
    const margin = 1.96 * stdDev * (1 + i * 0.15);

    predictions.push({
      predicted,
      lower: Math.max(0, predicted - margin),
      upper: Math.min(1, predicted + margin),
    });
  }
  return predictions;
}

// === TF.JS MODEL ===

let tfModel = null;

async function tryLoadTFModel() {
  try {
    importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
    await tf.ready();
    try {
      tfModel = await tf.loadLayersModel("/models/disaster-predict/model.json");
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

// === MESSAGE HANDLER ===

self.onmessage = async function(e) {
  const { type, data } = e.data;

  switch (type) {
    case "init": {
      const modelLoaded = await tryLoadTFModel();
      self.postMessage({
        type: "ready",
        success: true,
        modelLoaded,
        backend: typeof tf !== "undefined" ? tf.getBackend() : null,
      });
      break;
    }

    case "predict": {
      const { provinces, month, scenarioModifier } = data;
      const types = ["flood", "storm", "landslide", "drought", "earthquake", "tsunami"];
      const riskScores = {};
      const predictions = {};

      for (const province of provinces) {
        const risks = {};
        let totalScore = 0;
        let highestScore = 0;
        let topThreat = "flood";

        for (const type of types) {
          const score = calculateRiskScore(province, type, month, scenarioModifier);
          risks[type] = {
            score,
            level: score >= 0.8 ? "critical" : score >= 0.6 ? "high" : score >= 0.35 ? "medium" : "low",
            factors: { hazard: 0, exposure: 0, vulnerability: 0, weatherMod: 1 },
            explanation: "",
          };
          totalScore += score;
          if (score > highestScore) { highestScore = score; topThreat = type; }
        }

        riskScores[province] = {
          province,
          risks,
          overallRisk: totalScore / types.length,
          topThreat,
          trend: "stable",
        };

        // Generate predictions for each type
        for (const type of types) {
          const key = `${province}-${type}`;
          const historical = [];
          for (let m = 0; m < 12; m++) {
            historical.push(calculateRiskScore(province, type, m, 1.0));
          }

          const preds = predictStatistical(historical, 6);
          const now = new Date();
          const monthNames = ["Thg 1","Thg 2","Thg 3","Thg 4","Thg 5","Thg 6","Thg 7","Thg 8","Thg 9","Thg 10","Thg 11","Thg 12"];

          predictions[key] = {
            province,
            disasterType: type,
            historicalData: historical,
            predictions: preds.map((p, i) => {
              const fm = (now.getMonth() + i + 1) % 12;
              const fy = now.getFullYear() + Math.floor((now.getMonth() + i + 1) / 12);
              return { month: `${monthNames[fm]} ${fy}`, ...p };
            }),
            trend: preds[preds.length - 1].predicted > preds[0].predicted + 0.05 ? "increasing"
              : preds[preds.length - 1].predicted < preds[0].predicted - 0.05 ? "decreasing" : "stable",
            confidence: 0.7,
            strategy: "Worker Ensemble",
          };
        }
      }

      self.postMessage({ type: "result", data: { riskScores, predictions } });
      break;
    }

    case "dispose": {
      if (tfModel) {
        tfModel.dispose();
        tfModel = null;
      }
      self.postMessage({ type: "disposed" });
      break;
    }
  }
};
