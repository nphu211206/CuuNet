# MASTER PLAN: Phase 2 - Module AI Dự đoán Thiên tai

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1 (Bản đồ Thiên tai) đã hoàn thành với 9 UI components, heatmap, choropleth, timeline slider. Bây giờ chuyển sang **Phase 2: Module AI Dự đoán** - module thể hiện khả năng AI/ML mạnh nhất.

**Tại sao module này là "heart" của luận văn:**
- Thể hiện kiến thức AI/ML thực tế (không chỉ placeholder)
- TensorFlow.js chạy 100% trên browser - không cần server, miễn phí
- Kết hợp 3 phương pháp: Heuristic + Statistical + ML
- Hội đồng đánh giá cao: "Hệ thống AI thật sự, có giải thích được tại sao"

---

## Scope: AI Dự đoán Thiên tai

### Tính năng chính (10 features)
1. **Risk Score Engine** - INFORM-inspired risk scoring (Hazard × Exposure × Vulnerability)
2. **Time-series Prediction** - Statistical engine + TF.js LSTM cho xu hướng 3-6 tháng
3. **Seasonal Analysis** - Ma trận mùa vụ thiên tai Việt Nam (12 tháng × 6 loại)
4. **Province Risk Map** - Leaflet choropleth tích hợp từ module map
5. **What-if Scenarios** - El Nino / La Nina / Climate Change simulation
6. **Confidence Intervals** - 95% confidence band trên prediction charts
7. **Trend Charts** - Recharts AreaChart, RadarChart, BarChart
8. **AI Explanation (XAI-lite)** - Giải thích lý do dự đoán bằng tiếng Việt
9. **Real-time Weather Factor** - Open-Meteo API integration
10. **External Data Integration** - ReliefWeb + GDACS + USGS Earthquake APIs

---

## Kiến trúc Tổng quan

```
┌──────────────────────────────────────────────────────────────────┐
│                         PREDICT PAGE                              │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ PredictStats│ │   RiskMap   │ │  TrendChart │ │  Scenario  │ │
│  │    Bar      │ │  (Leaflet)  │ │ (Recharts)  │ │   Panel    │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │
│         └────────────────┴───────────────┴──────────────┘        │
│                                │                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │  Seasonal   │ │  Province   │ │ Explanation │ │  External  │ │
│  │  Calendar   │ │  RiskCard   │ │   Panel     │ │   Data     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                │                                  │
│                    ┌───────────┴───────────┐                     │
│                    │   Prediction Context   │                     │
│                    │   (React Context)      │                     │
│                    └───────────┬───────────┘                     │
│                                │                                  │
│         ┌──────────────────────┼──────────────────────┐          │
│         │                      │                      │          │
│  ┌──────┴──────┐    ┌──────────┴──────────┐   ┌──────┴──────┐  │
│  │ Risk Engine │    │  Prediction Engine  │   │  External   │  │
│  │ (Heuristic) │    │  (Web Worker)       │   │  API Client │  │
│  └──────┬──────┘    └──────────┬──────────┘   └──────┬──────┘  │
│         │                      │                      │          │
│  ┌──────┴──────┐    ┌──────────┴──────────┐   ┌──────┴──────┐  │
│  │  Seasonal   │    │  Statistical + ML   │   │ ReliefWeb   │  │
│  │  + GeoRisk  │    │  (MovingAvg/LSTM)   │   │ GDACS/USGS  │  │
│  └─────────────┘    └─────────────────────┘   └─────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Risk Scoring Methodology

### INFORM-Inspired Formula

Dựa trên **INFORM Risk Index** (EU JRC) - chuẩn quốc tế đánh giá rủi ro thiên tai:

```
RiskScore = Hazard × Exposure × Vulnerability
```

**Mở rộng cho CứuNet:**
```
RiskScore(province, disasterType, month) =
  f(Hazard, Exposure, Vulnerability, SeasonalModifier, WeatherModifier)

Trong đó:
  Hazard       = BaseFrequency(province, disasterType) × SeasonalMultiplier(disasterType, month)
  Exposure     = PopulationDensity(province) × AssetValue(province)
  Vulnerability = 1 - ResilienceIndex(province)

Final Score = normalize(Hazard × 0.4 + Exposure × 0.3 + Vulnerability × 0.3)
              × SeasonalModifier × WeatherModifier
```

### Chi tiết từng Factor

#### 1. Hazard (Mối nguy hiểm) - Weight 40%

**BaseFrequency** - Tần suất thiên tai lịch sử (0-1), dựa trên EM-DAT + MARD data:

```typescript
const BASE_FREQUENCY: Record<string, Record<DisasterType, number>> = {
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
```

**SeasonalMultiplier** - Hệ số mùa vụ (0-1), dựa trên patterns thực tế Việt Nam:

```typescript
const SEASONAL_MULTIPLIER: Record<DisasterType, number[]> = {
  // Index 0=Jan, 1=Feb, ..., 11=Dec
  flood:     [0.15, 0.15, 0.25, 0.35, 0.55, 0.70, 0.80, 0.90, 1.00, 0.85, 0.60, 0.25],
  storm:     [0.05, 0.05, 0.08, 0.15, 0.25, 0.45, 0.65, 0.80, 1.00, 0.90, 0.55, 0.15],
  landslide: [0.15, 0.15, 0.25, 0.35, 0.55, 0.70, 0.80, 0.90, 1.00, 0.80, 0.45, 0.15],
  drought:   [0.70, 0.80, 0.90, 1.00, 0.65, 0.35, 0.15, 0.10, 0.10, 0.20, 0.40, 0.60],
  earthquake:[0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50],
  tsunami:   [0.25, 0.25, 0.30, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.65, 0.45, 0.30],
};
```

#### 2. Exposure (Mức độ phơi nhiễm) - Weight 30%

```typescript
// Population density normalized (0-1)
const PROVINCE_EXPOSURE: Record<string, number> = {
  "Hà Nội": 1.00,      // 2,200 people/km²
  "Hồ Chí Minh": 0.95,  // 2,100 people/km²
  "Hải Phòng": 0.70,    // 1,100 people/km²
  "Đà Nẵng": 0.60,     // 800 people/km²
  "Cần Thơ": 0.55,     // 650 people/km²
  "Huế": 0.45,         // 450 people/km²
  "Quảng Bình": 0.35,  // 300 people/km²
  "Quảng Nam": 0.40,   // 350 people/km²
  "Bến Tre": 0.50,     // 550 people/km²
  "Trà Vinh": 0.40,    // 380 people/km²
  "An Giang": 0.55,    // 600 people/km²
  "Lào Cai": 0.20,     // 150 people/km²
  "Yên Bái": 0.22,     // 170 people/km²
  "Đà Lạt": 0.25,     // 200 people/km²
  "Nha Trang": 0.50,   // 500 people/km²
};
```

#### 3. Vulnerability (Tính dễ bị tổn thương) - Weight 30%

```typescript
// 1 - ResilienceIndex (0-1, higher = more vulnerable)
const PROVINCE_VULNERABILITY: Record<string, number> = {
  "Quảng Bình": 0.85,  // Poor infrastructure, frequent floods
  "Lào Cai": 0.80,     // Mountainous, limited access
  "Yên Bái": 0.82,     // Mountainous, poor roads
  "Huế": 0.65,         // Medium infrastructure
  "Quảng Nam": 0.70,   // Mixed urban/rural
  "Cần Thơ": 0.55,     // Better infrastructure
  "An Giang": 0.60,    // River delta challenges
  "Bến Tre": 0.65,     // Island-like, limited access
  "Trà Vinh": 0.70,    // Remote, poor infrastructure
  "Đà Nẵng": 0.30,     // Good infrastructure, urban
  "Hà Nội": 0.20,      // Best infrastructure
  "Hồ Chí Minh": 0.25, // Good infrastructure
  "Hải Phòng": 0.35,   // Good port city infrastructure
  "Đà Lạt": 0.45,      // Mountainous but developed
  "Nha Trang": 0.40,   // Tourist city, decent infrastructure
};
```

#### 4. WeatherModifier - Hệ số thời tiết real-time

```typescript
function getWeatherModifier(weather: WeatherData, type: DisasterType): number {
  switch (type) {
    case "flood":
      // Precipitation > 50mm/day → high risk
      if (weather.precipitation > 80) return 1.5;
      if (weather.precipitation > 50) return 1.3;
      if (weather.precipitation > 20) return 1.1;
      if (weather.precipitation < 5) return 0.7;
      return 1.0;
    case "storm":
      // Wind speed > 60km/h → high risk
      if (weather.windSpeed > 100) return 1.5;
      if (weather.windSpeed > 60) return 1.3;
      if (weather.windSpeed > 40) return 1.1;
      return 0.8;
    case "landslide":
      // High humidity + precipitation → landslide risk
      if (weather.humidity > 90 && weather.precipitation > 30) return 1.5;
      if (weather.humidity > 80 && weather.precipitation > 15) return 1.2;
      return 0.9;
    case "drought":
      // High temp + no rain → drought risk
      if (weather.temperature > 38 && weather.precipitation < 2) return 1.5;
      if (weather.temperature > 35 && weather.precipitation < 5) return 1.3;
      if (weather.precipitation > 30) return 0.5; // Rain reduces drought
      return 1.0;
    default:
      return 1.0;
  }
}
```

#### 5. Final Score Calculation

```typescript
function calculateRiskScore(
  province: string,
  type: DisasterType,
  month: number,
  weather?: WeatherData
): RiskScore {
  const hazard = BASE_FREQUENCY[province]?.[type] ?? 0.1;
  const seasonal = SEASONAL_MULTIPLIER[type][month];
  const exposure = PROVINCE_EXPOSURE[province] ?? 0.3;
  const vulnerability = PROVINCE_VULNERABILITY[province] ?? 0.5;
  const weatherMod = weather ? getWeatherModifier(weather, type) : 1.0;

  // INFORM-inspired: Risk = Hazard × Exposure × Vulnerability
  const baseRisk = (hazard * seasonal) * 0.4 + exposure * 0.3 + vulnerability * 0.3;
  const finalScore = Math.min(1, Math.max(0, baseRisk * weatherMod));

  return {
    score: finalScore,
    level: scoreToLevel(finalScore),
    factors: { hazard: hazard * seasonal, exposure, vulnerability, weatherMod },
    explanation: generateExplanation(province, type, month, finalScore, { hazard, seasonal, exposure, vulnerability, weatherMod }),
  };
}
```

---

## Prediction Engine Architecture

### Strategy Pattern cho Prediction Algorithms

```typescript
// Interface cho tất cả prediction strategies
interface PredictionStrategy {
  name: string;
  predict(historicalData: number[], months: number): TimeSeriesPoint[];
  getConfidence(): number;
}

// Strategy 1: Moving Average
class MovingAverageStrategy implements PredictionStrategy {
  name = "Moving Average";
  predict(data: number[], months: number): TimeSeriesPoint[] {
    const windowSize = 3;
    const ma = data.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    // ... predict based on trend from MA
  }
  getConfidence() { return 0.6; }
}

// Strategy 2: Linear Regression
class LinearRegressionStrategy implements PredictionStrategy {
  name = "Linear Regression";
  predict(data: number[], months: number): TimeSeriesPoint[] {
    // Least squares fit → predict future points
  }
  getConfidence() { return 0.7; }
}

// Strategy 3: Seasonal Decomposition
class SeasonalDecompositionStrategy implements PredictionStrategy {
  name = "Seasonal Decomposition";
  predict(data: number[], months: number): TimeSeriesPoint[] {
    // Decompose: trend + seasonal + residual
    // Predict each component separately
  }
  getConfidence() { return 0.75; }
}

// Strategy 4: TensorFlow.js LSTM (loaded dynamically)
class LSTMStrategy implements PredictionStrategy {
  name = "LSTM Neural Network";
  private model: tf.LayersModel | null = null;
  async load() { /* load from /models/disaster-predict/ */ }
  predict(data: number[], months: number): TimeSeriesPoint[] {
    // Run inference in Web Worker
  }
  getConfidence() { return 0.85; }
}

// Factory: chọn strategy tốt nhất có sẵn
class PredictionEngine {
  private strategies: PredictionStrategy[] = [];

  async initialize() {
    this.strategies.push(new MovingAverageStrategy());
    this.strategies.push(new LinearRegressionStrategy());
    this.strategies.push(new SeasonalDecompositionStrategy());

    const lstm = new LSTMStrategy();
    const loaded = await lstm.load();
    if (loaded) this.strategies.push(lstm);
  }

  predict(province: string, type: DisasterType, months: number): PredictionResult {
    // Chạy tất cả strategies, ensemble kết quả
    const results = this.strategies.map(s => s.predict(historicalData, months));
    // Weighted average theo confidence
    return ensembleResults(results);
  }
}
```

### TensorFlow.js Web Worker Pattern

```javascript
// public/workers/prediction-worker.js
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.x');

let model = null;

self.onmessage = async function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      await tf.ready();
      try {
        model = await tf.loadLayersModel('/models/disaster-predict/model.json');
        self.postMessage({ type: 'ready', success: true });
      } catch {
        self.postMessage({ type: 'ready', success: false });
      }
      break;

    case 'predict':
      if (!model) {
        self.postMessage({ type: 'error', message: 'Model not loaded' });
        return;
      }
      // Wrap in tf.tidy to auto-dispose tensors
      const result = tf.tidy(() => {
        const input = tf.tensor2d(data.features);
        const prediction = model.predict(input);
        return prediction.dataSync();
      });
      // Transfer with zero-copy
      self.postMessage({ type: 'prediction', result: Array.from(result) });
      break;

    case 'dispose':
      if (model) {
        model.dispose();
        model = null;
      }
      break;
  }
};
```

```typescript
// src/features/predict/lib/use-prediction-worker.ts
"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function usePredictionWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const worker = new Worker("/workers/prediction-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        setIsReady(e.data.success);
      }
      if (e.data.type === "prediction") {
        setIsLoading(false);
        // Handle result
      }
    };

    worker.postMessage({ type: "init" });

    return () => {
      worker.postMessage({ type: "dispose" });
      worker.terminate();
    };
  }, []);

  const predict = useCallback((features: number[][]) => {
    if (!workerRef.current || !isReady) return;
    setIsLoading(true);
    workerRef.current.postMessage({ type: "predict", data: { features } });
  }, [isReady]);

  return { isReady, isLoading, predict };
}
```

### Confidence Interval Calculation

```typescript
function calculateConfidence(
  historicalData: number[],
  predictionPoint: number,
  monthsAhead: number
): { lower: number; upper: number } {
  // Standard deviation of residuals
  const residuals = calculateResiduals(historicalData);
  const stdDev = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
  );

  // Confidence widens with time (uncertainty increases)
  const z95 = 1.96; // 95% confidence
  const uncertaintyGrowth = 1 + (monthsAhead * 0.15); // 15% wider per month
  const margin = z95 * stdDev * uncertaintyGrowth;

  return {
    lower: Math.max(0, predictionPoint - margin),
    upper: Math.min(1, predictionPoint + margin),
  };
}
```

---

## External API Integration

### 1. ReliefWeb API (Free, No Auth)

```typescript
// src/features/predict/api/reliefweb.ts
const RELIEFWEB_BASE = "https://api.reliefweb.int/v1";

export async function getVietnamDisasters(limit = 10): Promise<ReliefWebReport[]> {
  const url = `${RELIEFWEB_BASE}/reports`;
  const body = {
    filter: {
      field: "country.iso3",
      value: "VNM",
    },
    sort: ["date.created:desc"],
    limit,
    fields: {
      include: ["title", "date", "disaster_type", "country", "status"],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 3600 }, // Cache 1 hour
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.map((item: any) => ({
    id: item.id,
    title: item.fields.title,
    date: item.fields.date?.created,
    type: item.fields.disaster_type?.[0]?.name,
    status: item.fields.status,
  })) ?? [];
}
```

### 2. GDACS API (Free, No Auth)

```typescript
// src/features/predict/api/gdacs.ts
const GDACS_BASE = "https://www.gdacs.org/api/event/geteventlist";

export async function getGDACSAlerts(): Promise<GDACSAlert[]> {
  const url = `${GDACS_BASE}?country=VNM&format=json`;
  const res = await fetch(url, { next: { revalidate: 1800 } }); // 30 min cache
  if (!res.ok) return [];
  const data = await res.json();
  return data.features?.map((f: any) => ({
    id: f.properties.eventid,
    type: f.properties.eventtype,
    severity: f.properties.alertlevel,
    title: f.properties.title,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    date: f.properties.fromdate,
  })) ?? [];
}
```

### 3. USGS Earthquake API (Free, No Auth)

```typescript
// src/features/predict/api/usgs.ts
const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export async function getVietnamEarthquakes(days = 30): Promise<Earthquake[]> {
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const url = `${USGS_BASE}?format=geojson&starttime=${startDate}&minlatitude=8&maxlatitude=23&minlongitude=102&maxlongitude=110&minmagnitude=3`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const data = await res.json();

  return data.features?.map((f: any) => ({
    id: f.id,
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: new Date(f.properties.time).toISOString(),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    depth: f.geometry.coordinates[2],
  })) ?? [];
}
```

---

## What-if Scenarios

### Scientific Basis

```typescript
// src/features/predict/lib/scenarios.ts
export const SCENARIOS: Scenario[] = [
  {
    id: "normal",
    name: "Bình thường",
    nameEn: "Normal",
    description: "Điều kiện khí tượng trung bình nhiều năm",
    icon: "🌤️",
    modifiers: {
      flood: 1.0, storm: 1.0, landslide: 1.0,
      drought: 1.0, earthquake: 1.0, tsunami: 1.0,
    },
  },
  {
    id: "el-nino",
    name: "El Nino",
    nameEn: "El Nino",
    description: "Nhiệt đới hóa Thái Bình Dương → Nắng nóng, hạn hán tăng, bão giảm",
    icon: "🔥",
    // Based on historical El Nino impacts on Vietnam
    modifiers: {
      flood: 0.7,      // -30% (less rainfall in central)
      storm: 0.8,       // -20% (fewer typhoons)
      landslide: 0.6,   // -40% (less rain = less landslides)
      drought: 1.5,     // +50% (severe drought)
      earthquake: 1.0,  // No change
      tsunami: 1.0,     // No change
    },
    scientificBasis: "El Nino 2015-2016: Vietnam experienced severe drought, saltwater intrusion in Mekong Delta, reduced typhoon activity.",
  },
  {
    id: "la-nina",
    name: "La Nina",
    nameEn: "La Nina",
    description: "Lạnh hóa Thái Bình Dương → Mưa lũ tăng, bão mạnh hơn",
    icon: "🌊",
    modifiers: {
      flood: 1.5,       // +50% (extreme rainfall)
      storm: 1.4,       // +40% (more typhoons, stronger)
      landslide: 1.5,   // +50% (more rain-triggered)
      drought: 0.5,     // -50% (more rain)
      earthquake: 1.0,
      tsunami: 1.0,
    },
    scientificBasis: "La Nina 2010-2011: Record flooding in Central Vietnam, 10+ typhoons, severe landslides in Northern mountains.",
  },
  {
    id: "climate-change",
    name: "Biến đổi khí hậu",
    nameEn: "Climate Change",
    description: "Nhiệt độ +1.5°C, mực nước biển +0.5m, thời tiết cực đoan tăng",
    icon: "🌡️",
    modifiers: {
      flood: 1.25,      // +25% (sea level rise + extreme rain)
      storm: 1.15,      // +15% (warmer seas = stronger storms)
      landslide: 1.20,  // +20% (more extreme weather)
      drought: 1.30,    // +30% (higher evaporation)
      earthquake: 1.0,
      tsunami: 1.05,    // +5% (sea level rise amplifies)
    },
    scientificBasis: "IPCC AR6: Vietnam is among the most climate-vulnerable countries. Mekong Delta could lose 40% of land by 2100.",
  },
];

// Apply scenario to risk score
function applyScenario(baseScore: number, scenario: Scenario, type: DisasterType): number {
  return Math.min(1, baseScore * scenario.modifiers[type]);
}
```

---

## UI Component Specifications

### 1. RiskGauge - SVG Circular Gauge

```typescript
// src/features/predict/ui/RiskGauge.tsx
// Pure SVG implementation (no external library needed for thesis)
// - 270° arc (3/4 circle)
// - Color segments: green(0-0.25) → lime(0.25-0.5) → yellow(0.5-0.7) → orange(0.7-0.85) → red(0.85-1.0)
// - Animated needle (Framer Motion spring)
// - Center: score number + risk level text
// - Glass morphism card wrapper
```

**SVG Path Calculation:**
```typescript
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}
```

### 2. TrendChart - Recharts ComposedChart

```typescript
// src/features/predict/ui/TrendChart.tsx
<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={predictions}>
    <defs>
      <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
    <YAxis domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
    <Tooltip
      contentStyle={{
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "12px",
        color: "#f1f5f9",
      }}
    />
    {/* Confidence band */}
    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confidenceGradient)" />
    <Area type="monotone" dataKey="lower" stroke="none" fill="url(#confidenceGradient)" />
    {/* Historical actual */}
    <Line type="monotone" dataKey="actual" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} />
    {/* Prediction */}
    <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 4 }} />
  </ComposedChart>
</ResponsiveContainer>
```

### 3. SeasonalCalendar - Custom SVG Heatmap

```typescript
// src/features/predict/ui/SeasonalCalendar.tsx
// Grid: 12 columns (months) × 6 rows (disaster types)
// Each cell: <rect> with color interpolation
// Color scale: risk 0 → #0b0d17 (dark), risk 1 → #ef4444 (red)
// Hover: tooltip with exact score + explanation
// Current month: highlighted border
// Animation: cells fade in with stagger
```

**Color Interpolation:**
```typescript
function riskToColor(risk: number): string {
  if (risk < 0.25) return `rgba(34, 197, 94, ${0.2 + risk * 2})`;   // Green
  if (risk < 0.50) return `rgba(132, 204, 22, ${0.3 + risk})`;      // Lime
  if (risk < 0.70) return `rgba(234, 179, 8, ${0.4 + risk * 0.5})`; // Yellow
  if (risk < 0.85) return `rgba(249, 115, 22, ${0.5 + risk * 0.3})`;// Orange
  return `rgba(239, 68, 68, ${0.6 + risk * 0.4})`;                   // Red
}
```

### 4. ScenarioPanel - Toggle with Comparison

```typescript
// src/features/predict/ui/ScenarioPanel.tsx
// - 4 scenario buttons in a row (Normal, El Nino, La Nina, Climate Change)
// - Active button: glow + color border
// - Below: comparison bar chart (current scenario vs normal)
// - Description text with scientific basis
// - Animated transition when switching scenarios
```

### 5. ProvinceRiskCard - Expandable Detail

```typescript
// src/features/predict/ui/ProvinceRiskCard.tsx
// Collapsed:
//   ┌──────────────────────────────────┐
//   │ 🌊 Quảng Bình        [0.89 ▓▓▓]│
//   │ Top: Lũ lụt → Bão → Sạt lở     │
//   │ ▲ Xu hướng tăng                 │
//   └──────────────────────────────────┘
//
// Expanded (click):
//   ┌──────────────────────────────────┐
//   │ 🌊 Quảng Bình        [0.89 ▓▓▓]│
//   │                                  │
//   │ Lũ lụt     ████████████░ 0.89   │
//   │ Bão        ██████████░░░ 0.75   │
//   │ Sạt lở     ████████░░░░░ 0.65   │
//   │ Hạn hán    ██░░░░░░░░░░ 0.15   │
//   │                                  │
//   │ 📖 Giải thích:                  │
//   │ "Mùa mưa (tháng 9), vị trí     │
//   │  ven biển miền Trung, lịch sử   │
//   │  12 trận lũ trong 10 năm"       │
//   └──────────────────────────────────┘
```

### 6. ExplanationPanel - XAI-lite

```typescript
// src/features/predict/ui/ExplanationPanel.tsx
// Structure:
//   "Quảng Bình có rủi ro LŨ LỤT cao (0.89) vì:"
//
//   Factor bars:
//   ┌─────────────────────────────────────┐
//   │ 🌧️ Mùa mưa (tháng 9)    [████] 1.0│
//   │ 🌊 Ven biển miền Trung   [███░] 0.85│
//   │ 📊 Lịch sử 12 trận/10yr [███░] 0.80│
//   │ 👥 Dân số cao            [██░░] 0.65│
//   │ ⚠️ El Nino đang hoạt động [█░░░] 0.50│
//   └─────────────────────────────────────┘
```

### 7. PredictStatsBar - Animated Counters

```typescript
// src/features/predict/ui/PredictStatsBar.tsx
// Reuse AnimatedCounter pattern from MapStatsBar
// Stats:
//   1. Tỉnh rủi ro nhất: "Quảng Bình" (0.89)
//   2. Mối đe dọa chính: "Lũ lụt" (count provinces)
//   3. Độ tin cậy TB: "78%"
//   4. Tỉnh cần cảnh báo: "8/15"
// Glass morphism cards, stagger animation
```

### 8. RiskMap - Leaflet Integration

```typescript
// src/features/predict/ui/RiskMap.tsx
// Reuse MapContainer + TileLayer from Phase 1
// Province choropleth: color = risk score (not fixed risk level)
// Dynamic color based on selected month + scenario
// Click province → ProvinceRiskCard appears
// Legend: continuous color scale (green → red)
```

---

## State Management

### Prediction Context

```typescript
// src/features/predict/lib/prediction-context.tsx
"use client";

interface PredictionState {
  selectedProvince: string | null;
  selectedMonth: number; // 0-11
  selectedScenario: string; // "normal" | "el-nino" | "la-nina" | "climate-change"
  riskScores: Map<string, ProvinceRisk>;
  predictions: Map<string, PredictionResult>;
  externalAlerts: ExternalAlert[];
  isLoading: boolean;
  error: string | null;
}

interface PredictionContextType {
  state: PredictionState;
  dispatch: React.Dispatch<PredictionAction>;
}

// Actions
type PredictionAction =
  | { type: "SET_PROVINCE"; payload: string | null }
  | { type: "SET_MONTH"; payload: number }
  | { type: "SET_SCENARIO"; payload: string }
  | { type: "SET_RISK_SCORES"; payload: Map<string, ProvinceRisk> }
  | { type: "SET_PREDICTIONS"; payload: Map<string, PredictionResult> }
  | { type: "SET_ALERTS"; payload: ExternalAlert[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };
```

---

## Implementation Plan (22 Tasks)

### Phase 2A: Foundation & Data Layer (Tasks 1-6)

#### Task 1: Install Dependencies & Configure
**Install:**
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
```

**Files:**
- `next.config.ts` - TF.js headers for SharedArrayBuffer (optional WASM support)

**Verify:**
- `npm run build` passes
- TF.js imports work

#### Task 2: Create Prediction TypeScript Types
**File:** `src/features/predict/lib/types.ts`

All interfaces: RiskScore, ProvinceRisk, PredictionResult, Scenario, TimeSeriesPoint, ExternalAlert, PredictionState, FactorBreakdown

#### Task 3: Create Seasonal Data Module
**File:** `src/features/predict/lib/seasonal-data.ts`

- SEASONAL_MULTIPLIER cho 6 disaster types × 12 months
- Vietnam disaster season descriptions (Vietnamese)
- Season-to-month mapping utilities

#### Task 4: Create Geographic Risk Module
**File:** `src/features/predict/lib/geo-risk.ts`

- BASE_FREQUENCY matrix (15 provinces × 6 types)
- PROVINCE_EXPOSURE (population density normalized)
- PROVINCE_VULNERABILITY (infrastructure index)
- Geographic classification (coastal/mountain/delta/urban)
- getGeographicFactor() function

#### Task 5: Create Core Risk Engine
**File:** `src/features/predict/lib/risk-engine.ts`

- calculateRiskScore() - INFORM-inspired formula
- getWeatherModifier() - weather factor calculation
- scoreToLevel() - score to SeverityLevel mapping
- generateExplanation() - Vietnamese explanation text
- calculateAllProvinceRisks() - batch calculation for 15 provinces

#### Task 6: Create Prediction Config
**File:** `src/features/predict/config/predict-config.ts`

- PREDICTION_MONTHS_AHEAD (default: 6)
- CONFIDENCE_LEVEL (0.95)
- RISK_SCORE_THRESHOLDS (for level mapping)
- CHART_COLORS (for Recharts)
- SCENARIO_CONFIG

---

### Phase 2B: Prediction Engines (Tasks 7-11)

#### Task 7: Create Statistical Prediction Engine
**File:** `src/features/predict/lib/statistical-engine.ts`

- MovingAverageStrategy (3-month, 6-month windows)
- LinearRegressionStrategy (least squares)
- SeasonalDecompositionStrategy (trend + seasonal + residual)
- calculateConfidence() - std dev × z-score × time growth
- predictNextMonths() - main prediction function

#### Task 8: Create TensorFlow.js Engine
**File:** `src/features/predict/lib/tf-engine.ts`

- loadModel() - dynamic model loading with fallback
- predictWithModel() - inference with tf.tidy()
- createInputTensor() - feature engineering for model input
- disposeModel() - cleanup

#### Task 9: Create Prediction Web Worker
**File:** `public/workers/prediction-worker.js`

- TF.js initialization in worker
- Model loading with error handling
- Prediction message handling
- Memory cleanup on dispose
- Zero-copy result transfer

#### Task 10: Create Worker React Hook
**File:** `src/features/predict/lib/use-prediction-worker.ts`

- usePredictionWorker() hook
- Worker lifecycle management
- Message passing (init/predict/dispose)
- Error handling
- Loading state

#### Task 11: Create Prediction Context
**File:** `src/features/predict/lib/prediction-context.tsx`

- PredictionProvider - React Context provider
- usePrediction() hook - access state
- predictionReducer - state management
- Initial state setup
- Action types

---

### Phase 2C: External API Integration (Tasks 12-14)

#### Task 12: Create ReliefWeb API Client
**File:** `src/features/predict/api/reliefweb.ts`

- getVietnamDisasters() - fetch recent disaster reports
- Response type mapping
- Error handling with fallback to empty array

#### Task 13: Create GDACS + USGS API Clients
**Files:**
- `src/features/predict/api/gdacs.ts` - GDACS alerts
- `src/features/predict/api/usgs.ts` - USGS earthquakes

#### Task 14: Create API Aggregator
**File:** `src/features/predict/api/external-data.ts`

- fetchAllExternalData() - parallel fetch all APIs
- normalizeAlertType() - map external types to DisasterType
- mergeWithLocalData() - combine with mock data
- Cache strategy (revalidate: 1800)

---

### Phase 2D: UI Components (Tasks 15-20)

#### Task 15: Create RiskGauge Component
**File:** `src/features/predict/ui/RiskGauge.tsx`

- Pure SVG circular gauge (270° arc)
- 5 color segments (green → red)
- Animated needle (Framer Motion spring)
- Center score + level text
- Size variants (sm/md/lg)
- Glass morphism wrapper

#### Task 16: Create TrendChart Component
**File:** `src/features/predict/ui/TrendChart.tsx`

- Recharts ComposedChart
- Confidence band (Area × 2)
- Historical line (solid) + Prediction line (dashed)
- Dark theme styling
- Responsive container
- Tooltip with confidence range

#### Task 17: Create SeasonalCalendar Component
**File:** `src/features/predict/ui/SeasonalCalendar.tsx`

- Custom SVG grid (12 × 6)
- Color interpolation per cell
- Hover tooltip
- Current month highlight
- Stagger entrance animation

#### Task 18: Create ScenarioPanel Component
**File:** `src/features/predict/ui/ScenarioPanel.tsx`

- 4 scenario toggle buttons
- Comparison bar chart (Recharts)
- Description + scientific basis text
- Animated transitions

#### Task 19: Create ProvinceRiskCard + ExplanationPanel
**Files:**
- `src/features/predict/ui/ProvinceRiskCard.tsx` - Expandable card
- `src/features/predict/ui/ExplanationPanel.tsx` - XAI explanation

#### Task 20: Create RiskMap Component
**File:** `src/features/predict/ui/RiskMap.tsx`

- MapContainer + TileLayer (reuse from Phase 1)
- Province choropleth with dynamic risk colors
- Click → ProvinceRiskCard
- Legend with continuous color scale

---

### Phase 2E: Page Assembly & Verification (Tasks 21-22)

#### Task 21: Create Predict Page
**File:** `src/app/predict/page.tsx`

- PredictionProvider wrapper
- Province selector dropdown
- Month selector (current + next 6)
- Dynamic import RiskMap (ssr: false)
- Layout: StatsBar → RiskMap + Sidebar → Charts → Calendar
- Responsive grid

#### Task 22: Verify & Polish
- `npm run build` - no errors
- `npm run dev` - test all features
- Risk scores calculate correctly for all 15 provinces
- Prediction charts render with confidence bands
- Scenario toggle changes risk map
- Seasonal calendar shows correct patterns
- External API calls work (or fallback gracefully)
- Explanation panel shows meaningful text
- Mobile responsive
- Console: no errors
- Performance: risk calculation < 100ms, prediction < 500ms

---

## File Structure After Phase 2

```
src/
├── app/
│   └── predict/
│       └── page.tsx                          # REWRITE (Task 21)
├── features/
│   ├── predict/
│   │   ├── api/
│   │   │   ├── reliefweb.ts                  # CREATE (Task 12)
│   │   │   ├── gdacs.ts                      # CREATE (Task 13)
│   │   │   ├── usgs.ts                       # CREATE (Task 13)
│   │   │   └── external-data.ts              # CREATE (Task 14)
│   │   ├── config/
│   │   │   └── predict-config.ts             # CREATE (Task 6)
│   │   ├── lib/
│   │   │   ├── types.ts                      # CREATE (Task 2)
│   │   │   ├── risk-engine.ts                # CREATE (Task 5)
│   │   │   ├── seasonal-data.ts              # CREATE (Task 3)
│   │   │   ├── geo-risk.ts                   # CREATE (Task 4)
│   │   │   ├── statistical-engine.ts         # CREATE (Task 7)
│   │   │   ├── tf-engine.ts                  # CREATE (Task 8)
│   │   │   ├── use-prediction-worker.ts      # CREATE (Task 10)
│   │   │   └── prediction-context.tsx        # CREATE (Task 11)
│   │   └── ui/
│   │       ├── RiskGauge.tsx                 # CREATE (Task 15)
│   │       ├── TrendChart.tsx                # CREATE (Task 16)
│   │       ├── SeasonalCalendar.tsx          # CREATE (Task 17)
│   │       ├── ScenarioPanel.tsx             # CREATE (Task 18)
│   │       ├── ProvinceRiskCard.tsx          # CREATE (Task 19)
│   │       ├── ExplanationPanel.tsx          # CREATE (Task 19)
│   │       └── RiskMap.tsx                   # CREATE (Task 20)
│   └── map-disaster/                         # (existing, reuse)
├── lib/
│   ├── types.ts                              # (existing)
│   └── utils.ts                              # (existing)
└── data/
    └── disaster-data.ts                      # (existing)

public/
├── models/
│   └── disaster-predict/
│       ├── model.json                        # Optional (Task 8)
│       └── group1-shard1of1.bin              # Optional (Task 8)
└── workers/
    └── prediction-worker.js                  # CREATE (Task 9)

scripts/
├── train_model.py                            # CREATE (Task 8 - reference)
└── requirements.txt                          # CREATE (Task 8 - reference)
```

---

## Dependencies

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
```

No additional UI libraries needed - pure SVG for gauges, Recharts for charts, custom SVG for heatmap.

---

## Execution Order

```
Phase 2A: Task 1 → 2 → 3 → 4 → 5 → 6
Phase 2B: Task 7 → 8 → 9 → 10 → 11
Phase 2C: Task 12 → 13 → 14
Phase 2D: Task 15 → 16 → 17 → 18 → 19 → 20
Phase 2E: Task 21 → 22
```

---

## Design Tokens

### Colors
```
Risk Scale:    #22C55E → #84CC16 → #EAB308 → #F97316 → #EF4444 → #DC2626
Confidence:    rgba(59, 130, 246, 0.15) band, #3B82F6 line
Actual Data:   #22C55E (green)
Prediction:    #3B82F6 (blue, dashed)
Normal:        #3B82F6
El Nino:       #F97316
La Nina:       #06B6D4
Climate:       #A855F7
```

### Typography
```
Gauge Score:   text-3xl font-bold
Risk Level:    text-sm font-medium
Explanation:   text-sm text-slate-400
Chart Label:   text-xs text-slate-500
Card Title:    text-lg font-semibold
```

### Animation
```
Gauge needle:  spring, stiffness: 200, damping: 15
Chart draw:    0.8s ease-in-out
Card stagger:  0.08s delay
Cell fade:     0.3s ease
Scenario:      0.5s spring, stiffness: 300, damping: 25
```

---

## Verification Checklist

1. [ ] `npm run build` - zero errors
2. [ ] `npm run dev` - http://localhost:3000/predict loads
3. [ ] Risk scores calculate for all 15 provinces × 6 types = 90 scores
4. [ ] RiskMap choropleth updates when changing month
5. [ ] RiskMap choropleth updates when changing scenario
6. [ ] Click province → ProvinceRiskCard appears
7. [ ] ProvinceRiskCard expands to show detail + explanation
8. [ ] TrendChart shows historical + prediction + confidence band
9. [ ] SeasonalCalendar shows correct heatmap pattern
10. [ ] Scenario toggle changes all risk values
11. [ ] ExplanationPanel shows meaningful Vietnamese text
12. [ ] PredictStatsBar counters animate
13. [ ] External API calls work OR fallback gracefully
14. [ ] Web Worker loads TF.js model (if available)
15. [ ] Statistical engine works as fallback
16. [ ] Mobile responsive (no horizontal overflow)
17. [ ] Console: no errors, no warnings about memory leaks
18. [ ] Performance: risk calc < 100ms, prediction < 500ms
19. [ ] No tensor memory leaks (tf.memory() check)
20. [ ] All charts render dark theme correctly

---

## Innovation Points (Thesis Impressiveness)

1. **INFORM-Inspired Risk Formula** - Hazard × Exposure × Vulnerability (chẩn quốc tế)
2. **Hybrid AI Engine** - Heuristic + Statistical + LSTM (3 lớp prediction)
3. **TensorFlow.js Browser ML** - Chạy ML trên browser, zero server cost
4. **Web Worker Offloading** - Heavy computation không block UI
5. **Strategy Pattern** - Swappable prediction algorithms
6. **What-if Scenarios** - El Nino/La Nina với cơ sở khoa học
7. **Confidence Intervals** - Dự đoán có độ tin cậy thống kê
8. **XAI-lite Explanations** - AI giải thích được lý do
9. **External API Integration** - ReliefWeb + GDACS + USGS (real data)
10. **Vietnam-Specific Data** - Mùa vụ, địa lý, dân số thực tế

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| TF.js model too large (>5MB) | Slow load | float16 quantization (50% reduction), lazy loading |
| TF.js Web Worker fails | No ML prediction | Statistical engine as primary fallback |
| External APIs down | No real-time data | Graceful fallback to mock data + console warning |
| Browser memory leak | App crash | tf.tidy() in every inference, dispose on unmount |
| Recharts SSR hydration mismatch | Visual bug | Dynamic import with ssr: false |
| 15 provinces × 6 types = 90 calculations | Slow UI | useMemo + Web Worker + batch calculation |
| Mobile viewport too small for charts | Bad UX | ResponsiveContainer + scrollable sections |

---

## Scope Boundaries

**INCLUDED:**
- INFORM-inspired risk scoring (Hazard × Exposure × Vulnerability)
- Statistical prediction engine (Moving Average, Linear Regression, Seasonal Decomposition)
- TensorFlow.js integration (pre-trained model + Web Worker)
- Province risk choropleth map
- Trend charts with confidence intervals
- Seasonal heatmap calendar
- What-if scenarios (El Nino, La Nina, Climate Change)
- AI explanation (XAI-lite)
- External API integration (ReliefWeb, GDACS, USGS)
- Responsive dark-themed UI

**EXCLUDED:**
- Model training on browser (train offline with Python)
- Real-time model weight updates
- User authentication / data persistence
- Paid API services
- Server-side rendering of predictions (client-side only)
- 63 provinces (only 15 with complete data)
