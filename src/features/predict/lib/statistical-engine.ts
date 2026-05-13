import type { TimeSeriesPoint, PredictionStrategy } from "./types";
import { PREDICTION_CONFIG } from "../config/predict-config";
import { MONTH_NAMES_SHORT } from "./seasonal-data";

// === UTILITY FUNCTIONS ===

/**
 * Calculate arithmetic mean of an array.
 */
function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Calculate standard deviation.
 */
function standardDeviation(data: number[]): number {
  if (data.length < 2) return 0;
  const avg = mean(data);
  const squaredDiffs = data.map((val) => (val - avg) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / (data.length - 1));
}

/**
 * Calculate linear regression slope and intercept.
 */
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate prediction confidence based on data quality and forecast distance.
 */
function calculateConfidence(data: number[], monthsAhead: number): number {
  const n = data.length;
  const stdDev = standardDeviation(data);
  const avg = mean(data);

  // Base confidence from data quality
  const dataQuality = Math.min(1, n / 12); // More data = higher confidence
  const volatility = avg > 0 ? Math.min(1, stdDev / avg) : 0.5; // Lower volatility = higher confidence
  const baseConfidence = dataQuality * (1 - volatility * 0.5);

  // Decay with forecast distance
  const decayFactor = Math.pow(1 - PREDICTION_CONFIG.CONFIDENCE_GROWTH_RATE, monthsAhead);

  return Math.max(0.1, Math.min(0.95, baseConfidence * decayFactor));
}

/**
 * Calculate 95% confidence interval.
 */
function calculateConfidenceInterval(
  predicted: number,
  data: number[],
  monthsAhead: number
): { lower: number; upper: number } {
  const stdDev = standardDeviation(data);
  const z = PREDICTION_CONFIG.CONFIDENCE_Z_SCORE;
  const uncertaintyGrowth = 1 + (monthsAhead * PREDICTION_CONFIG.CONFIDENCE_GROWTH_RATE);
  const margin = z * stdDev * uncertaintyGrowth;

  return {
    lower: Math.max(0, predicted - margin),
    upper: Math.min(1, predicted + margin),
  };
}

/**
 * Generate future month labels.
 */
function getFutureMonthLabels(count: number): string[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const labels: string[] = [];

  for (let i = 1; i <= count; i++) {
    const futureMonth = (currentMonth + i) % 12;
    const futureYear = currentYear + Math.floor((currentMonth + i) / 12);
    labels.push(`${MONTH_NAMES_SHORT[futureMonth]} ${futureYear}`);
  }

  return labels;
}

// === STRATEGY 1: MOVING AVERAGE ===

export class MovingAverageStrategy implements PredictionStrategy {
  name = "Moving Average";
  private windowSize: number;

  constructor(windowSize: number = PREDICTION_CONFIG.MA_WINDOW) {
    this.windowSize = windowSize;
  }

  predict(historicalData: number[], months: number): TimeSeriesPoint[] {
    if (historicalData.length < this.windowSize) {
      return this.fallbackPredict(historicalData, months);
    }

    const labels = getFutureMonthLabels(months);
    const predictions: TimeSeriesPoint[] = [];

    // Calculate initial moving average
    const recentData = historicalData.slice(-this.windowSize);
    let currentMA = mean(recentData);

    // Calculate trend from recent MA windows
    let trend = 0;
    if (historicalData.length >= this.windowSize * 2) {
      const prevData = historicalData.slice(-this.windowSize * 2, -this.windowSize);
      const prevMA = mean(prevData);
      trend = (currentMA - prevMA) / this.windowSize;
    }

    for (let i = 0; i < months; i++) {
      const predicted = Math.max(0, Math.min(1, currentMA + trend * (i + 1)));
      const ci = calculateConfidenceInterval(predicted, historicalData, i + 1);

      predictions.push({
        month: labels[i],
        predicted,
        lower: ci.lower,
        upper: ci.upper,
      });
    }

    return predictions;
  }

  private fallbackPredict(data: number[], months: number): TimeSeriesPoint[] {
    const labels = getFutureMonthLabels(months);
    const avg = mean(data);
    return labels.map((label, i) => ({
      month: label,
      predicted: avg,
      lower: Math.max(0, avg - 0.2),
      upper: Math.min(1, avg + 0.2),
    }));
  }

  getConfidence(): number {
    return 0.6;
  }
}

// === STRATEGY 2: LINEAR REGRESSION ===

export class LinearRegressionStrategy implements PredictionStrategy {
  name = "Linear Regression";

  predict(historicalData: number[], months: number): TimeSeriesPoint[] {
    const labels = getFutureMonthLabels(months);
    const predictions: TimeSeriesPoint[] = [];

    const { slope, intercept } = linearRegression(historicalData);
    const n = historicalData.length;

    for (let i = 0; i < months; i++) {
      const x = n + i;
      const predicted = Math.max(0, Math.min(1, slope * x + intercept));
      const ci = calculateConfidenceInterval(predicted, historicalData, i + 1);

      predictions.push({
        month: labels[i],
        predicted,
        lower: ci.lower,
        upper: ci.upper,
      });
    }

    return predictions;
  }

  getConfidence(): number {
    return 0.7;
  }
}

// === STRATEGY 3: SEASONAL DECOMPOSITION ===

export class SeasonalDecompositionStrategy implements PredictionStrategy {
  name = "Seasonal Decomposition";

  predict(historicalData: number[], months: number): TimeSeriesPoint[] {
    const labels = getFutureMonthLabels(months);
    const predictions: TimeSeriesPoint[] = [];

    if (historicalData.length < 12) {
      // Fall back to linear regression if not enough data for seasonal
      const lr = new LinearRegressionStrategy();
      return lr.predict(historicalData, months);
    }

    // Decompose: trend + seasonal + residual
    const trend = this.extractTrend(historicalData);
    const seasonal = this.extractSeasonal(historicalData);
    const trendSlope = this.calculateTrendSlope(trend);

    const n = historicalData.length;
    const currentMonth = new Date().getMonth();

    for (let i = 0; i < months; i++) {
      const futureMonth = (currentMonth + i + 1) % 12;
      const futureTrend = trend[trend.length - 1] + trendSlope * (i + 1);
      const seasonalFactor = seasonal[futureMonth];
      const predicted = Math.max(0, Math.min(1, futureTrend + seasonalFactor));
      const ci = calculateConfidenceInterval(predicted, historicalData, i + 1);

      predictions.push({
        month: labels[i],
        predicted,
        lower: ci.lower,
        upper: ci.upper,
      });
    }

    return predictions;
  }

  private extractTrend(data: number[]): number[] {
    // Simple moving average for trend extraction
    const windowSize = Math.min(6, Math.floor(data.length / 2));
    const trend: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      trend.push(mean(window));
    }

    return trend;
  }

  private extractSeasonal(data: number[]): number[] {
    // Calculate average deviation from trend for each month
    const trend = this.extractTrend(data);
    const seasonal = new Array(12).fill(0);
    const counts = new Array(12).fill(0);

    const currentMonth = new Date().getMonth();
    for (let i = 0; i < data.length; i++) {
      const monthIndex = (currentMonth - data.length + i + 12 + 1) % 12;
      seasonal[monthIndex] += data[i] - trend[i];
      counts[monthIndex]++;
    }

    return seasonal.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
  }

  private calculateTrendSlope(trend: number[]): number {
    const { slope } = linearRegression(trend);
    return slope;
  }

  getConfidence(): number {
    return 0.75;
  }
}

// === ENSEMBLE ENGINE ===

export class PredictionEngine {
  private strategies: PredictionStrategy[] = [];

  constructor() {
    this.strategies = [
      new MovingAverageStrategy(),
      new LinearRegressionStrategy(),
      new SeasonalDecompositionStrategy(),
    ];
  }

  /**
   * Run all strategies and combine results with weighted averaging.
   */
  predict(historicalData: number[], months: number): {
    predictions: TimeSeriesPoint[];
    trend: "increasing" | "stable" | "decreasing";
    confidence: number;
    strategy: string;
  } {
    if (historicalData.length < PREDICTION_CONFIG.MIN_DATA_POINTS) {
      // Not enough data, use simple average
      const avg = mean(historicalData);
      const labels = getFutureMonthLabels(months);
      return {
        predictions: labels.map((label) => ({
          month: label,
          predicted: avg,
          lower: Math.max(0, avg - 0.3),
          upper: Math.min(1, avg + 0.3),
        })),
        trend: "stable",
        confidence: 0.3,
        strategy: "Insufficient Data - Average",
      };
    }

    // Run all strategies
    const results = this.strategies.map((s) => ({
      strategy: s,
      predictions: s.predict(historicalData, months),
      confidence: s.getConfidence(),
    }));

    // Weighted ensemble
    const totalWeight = results.reduce((sum, r) => sum + r.confidence, 0);
    const ensemblePredictions: TimeSeriesPoint[] = [];

    for (let i = 0; i < months; i++) {
      let weightedPredicted = 0;
      let weightedLower = 0;
      let weightedUpper = 0;

      for (const result of results) {
        const weight = result.confidence / totalWeight;
        weightedPredicted += result.predictions[i].predicted * weight;
        weightedLower += result.predictions[i].lower * weight;
        weightedUpper += result.predictions[i].upper * weight;
      }

      ensemblePredictions.push({
        month: results[0].predictions[i].month,
        predicted: Math.max(0, Math.min(1, weightedPredicted)),
        lower: Math.max(0, weightedLower),
        upper: Math.min(1, weightedUpper),
      });
    }

    // Determine trend
    const firstPred = ensemblePredictions[0].predicted;
    const lastPred = ensemblePredictions[ensemblePredictions.length - 1].predicted;
    const diff = lastPred - firstPred;
    let trend: "increasing" | "stable" | "decreasing";
    if (diff > 0.05) trend = "increasing";
    else if (diff < -0.05) trend = "decreasing";
    else trend = "stable";

    // Overall confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      predictions: ensemblePredictions,
      trend,
      confidence: avgConfidence,
      strategy: "Ensemble (MA + LR + Seasonal)",
    };
  }

  /**
   * Get trend from historical data.
   */
  detectTrend(data: number[]): "increasing" | "stable" | "decreasing" {
    if (data.length < 3) return "stable";

    const { slope } = linearRegression(data);
    const avg = mean(data);
    const relativeSlope = avg > 0 ? slope / avg : 0;

    if (relativeSlope > 0.05) return "increasing";
    if (relativeSlope < -0.05) return "decreasing";
    return "stable";
  }
}

// === SINGLETON INSTANCE ===

export const predictionEngine = new PredictionEngine();
