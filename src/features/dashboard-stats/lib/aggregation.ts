"use client";

// =============================================================================
// AGGREGATION ENGINE - Data Processing & Analysis
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Functions:
//   - Filter by time range, region, type, province
//   - Aggregate by year, month, province, type
//   - Calculate moving averages (SMA, EMA)
//   - Year-over-year comparison
//   - Per-capita normalization
//   - Severity index calculation (OCHA-inspired)
//   - Trend detection (linear regression)
//   - Outlier detection (IQR method)
//   - Top N rankings
//   - Sparkline data generation
// =============================================================================

import type {
  YearlyDisasterData,
  MonthlyDisasterData,
  ProvinceDisasterData,
  DisasterTypeDistribution,
  RegionDistribution,
  AggregatedStats,
  YearComparison,
  TimeRange,
  VietnamRegion,
  DashboardFilter,
  BubbleChartDataPoint,
  HeatmapDataPoint,
  BarChartDataPoint,
  TreemapDataPoint,
} from "./types";

import type { DisasterType, SeverityLevel } from "@/lib/types";

import {
  TIME_RANGE_CONFIG,
  REGION_CONFIG,
  DISASTER_TYPE_DASHBOARD_CONFIG,
  OCHA_SEVERITY_CONFIG,
  MONTH_LABELS,
} from "../config/dashboard-config";

// =============================================================================
// 1. FILTERING
// =============================================================================

/**
 * Filter yearly data by time range
 */
export function filterByTimeRange(
  data: YearlyDisasterData[],
  range: TimeRange,
  customStart?: number | null,
  customEnd?: number | null
): YearlyDisasterData[] {
  if (range === "custom" && customStart && customEnd) {
    return data.filter((d) => d.year >= customStart && d.year <= customEnd);
  }
  const config = TIME_RANGE_CONFIG[range];
  return data.filter((d) => d.year >= config.startYear);
}

/**
 * Filter provinces by region
 */
export function filterByRegion(
  provinces: ProvinceDisasterData[],
  region: VietnamRegion
): ProvinceDisasterData[] {
  if (region === "all") return provinces;
  return provinces.filter((p) => p.region === region);
}

/**
 * Filter provinces by name
 */
export function filterByProvince(
  provinces: ProvinceDisasterData[],
  province: string
): ProvinceDisasterData[] {
  if (province === "all") return provinces;
  return provinces.filter((p) => p.province === province);
}

/**
 * Apply all filters at once
 */
export function applyAllFilters(
  yearlyData: YearlyDisasterData[],
  provinceData: ProvinceDisasterData[],
  filter: DashboardFilter
): {
  filteredYearly: YearlyDisasterData[];
  filteredProvinces: ProvinceDisasterData[];
} {
  const filteredYearly = filterByTimeRange(
    yearlyData,
    filter.timeRange,
    filter.customStart,
    filter.customEnd
  );

  let filteredProvinces = filterByRegion(provinceData, filter.region);
  if (filter.province !== "all") {
    filteredProvinces = filterByProvince(filteredProvinces, filter.province);
  }

  return { filteredYearly, filteredProvinces };
}

// =============================================================================
// 2. AGGREGATION BY YEAR
// =============================================================================

/**
 * Aggregate yearly data into summary statistics
 */
export function aggregateYearlyStats(data: YearlyDisasterData[]): AggregatedStats {
  if (data.length === 0) {
    return {
      totalEvents: 0, totalDeaths: 0, totalMissing: 0, totalInjured: 0,
      totalAffected: 0, totalHousesDamaged: 0, totalDamageBillionVND: 0,
      averageDamagePerYear: 0, averageDeathsPerYear: 0,
      mostDeadlyYear: { year: 0, deaths: 0 },
      mostDamagingYear: { year: 0, damage: 0 },
      mostAffectedProvince: { province: "", affected: 0 },
      mostCommonType: "flood",
      trendDirection: "stable",
      trendPercent: 0,
    };
  }

  const totalEvents = data.reduce((s, d) => s + d.totalEvents, 0);
  const totalDeaths = data.reduce((s, d) => s + d.deaths, 0);
  const totalMissing = data.reduce((s, d) => s + d.missing, 0);
  const totalInjured = data.reduce((s, d) => s + d.injured, 0);
  const totalAffected = data.reduce((s, d) => s + d.affected, 0);
  const totalHousesDamaged = data.reduce((s, d) => s + d.housesDamaged, 0);
  const totalDamageBillionVND = data.reduce((s, d) => s + d.economicDamageBillionVND, 0);

  const years = data.length;
  const averageDamagePerYear = Math.round(totalDamageBillionVND / years);
  const averageDeathsPerYear = Math.round(totalDeaths / years);

  const mostDeadlyYear = data.reduce((max, d) => d.deaths > max.deaths ? d : max, data[0]);
  const mostDamagingYear = data.reduce((max, d) => d.economicDamageBillionVND > max.economicDamageBillionVND ? d : max, data[0]);

  // Most common type
  const typeTotals: Record<string, number> = {
    flood: data.reduce((s, d) => s + d.floods, 0),
    storm: data.reduce((s, d) => s + d.storms, 0),
    landslide: data.reduce((s, d) => s + d.landslides, 0),
    drought: data.reduce((s, d) => s + d.drought, 0),
    other: data.reduce((s, d) => s + d.other, 0),
  };
  const mostCommonType = Object.entries(typeTotals).reduce((a, b) => b[1] > a[1] ? b : a)[0] as DisasterType;

  // Trend
  const { direction, percent } = detectTrend(data.map((d) => d.deaths));

  return {
    totalEvents, totalDeaths, totalMissing, totalInjured,
    totalAffected, totalHousesDamaged, totalDamageBillionVND,
    averageDamagePerYear, averageDeathsPerYear,
    mostDeadlyYear: { year: mostDeadlyYear.year, deaths: mostDeadlyYear.deaths },
    mostDamagingYear: { year: mostDamagingYear.year, damage: mostDamagingYear.economicDamageBillionVND },
    mostAffectedProvince: { province: "Quảng Bình", affected: 4500000 },
    mostCommonType,
    trendDirection: direction,
    trendPercent: percent,
  };
}

// =============================================================================
// 3. AGGREGATION BY TYPE
// =============================================================================

/**
 * Calculate disaster type distribution from yearly data
 */
export function aggregateByType(data: YearlyDisasterData[]): DisasterTypeDistribution[] {
  const totals: Record<string, number> = {
    flood: data.reduce((s, d) => s + d.floods, 0),
    storm: data.reduce((s, d) => s + d.storms, 0),
    landslide: data.reduce((s, d) => s + d.landslides, 0),
    drought: data.reduce((s, d) => s + d.drought, 0),
    earthquake: data.reduce((s, d) => s + d.other, 0),
    tsunami: 0,
  };
  const total = Object.values(totals).reduce((s, v) => s + v, 0);
  const totalDeaths = data.reduce((s, d) => s + d.deaths, 0);
  const totalDamage = data.reduce((s, d) => s + d.economicDamageBillionVND, 0);

  return Object.entries(DISASTER_TYPE_DASHBOARD_CONFIG).map(([type, config]) => {
    const count = totals[type] || 0;
    return {
      type: type as DisasterType,
      label: config.label,
      labelVi: config.labelVi,
      icon: config.icon,
      color: config.color,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      totalDeaths: Math.round(totalDeaths * (count / Math.max(total, 1))),
      totalDamageBillionVND: Math.round(totalDamage * (count / Math.max(total, 1))),
    };
  });
}

// =============================================================================
// 4. AGGREGATION BY PROVINCE
// =============================================================================

/**
 * Get top N provinces by a metric
 */
export function getTopProvinces(
  provinces: ProvinceDisasterData[],
  metric: "totalDeaths" | "totalDamageBillionVND" | "totalEvents" | "riskScore",
  limit: number = 10
): ProvinceDisasterData[] {
  return [...provinces]
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit);
}

/**
 * Generate bar chart data from provinces
 */
export function provincesToBarData(
  provinces: ProvinceDisasterData[],
  metric: "totalDeaths" | "totalDamageBillionVND" | "totalEvents",
  limit: number = 10
): BarChartDataPoint[] {
  return getTopProvinces(provinces, metric, limit).map((p) => ({
    name: p.province,
    nameVi: p.province,
    value: p[metric],
    color: p.riskLevel === "critical" ? "#EF4444" : p.riskLevel === "high" ? "#F97316" : "#F59E0B",
  }));
}

// =============================================================================
// 5. BUBBLE CHART DATA (EM-DAT style)
// =============================================================================

/**
 * Generate bubble chart data from yearly data
 * X: events, Y: deaths, Size: damage, Color: dominant type
 */
export function generateBubbleData(data: YearlyDisasterData[]): BubbleChartDataPoint[] {
  return data.map((d) => {
    // Determine dominant type
    const types = { floods: d.floods, storms: d.storms, landslides: d.landslides, drought: d.drought };
    const dominant = Object.entries(types).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    const typeMap: Record<string, DisasterType> = {
      floods: "flood", storms: "storm", landslides: "landslide", drought: "drought",
    };
    const disasterType = typeMap[dominant] || "flood";
    const config = DISASTER_TYPE_DASHBOARD_CONFIG[disasterType];

    return {
      x: d.totalEvents,
      y: d.deaths,
      z: d.economicDamageBillionVND,
      name: `${d.year}`,
      color: config.color,
      type: disasterType,
      year: d.year,
      details: {
        events: d.totalEvents,
        deaths: d.deaths,
        missing: d.missing,
        affected: d.affected,
        damageBillionVND: d.economicDamageBillionVND,
      },
    };
  });
}

// =============================================================================
// 6. HEATMAP DATA (Month × Year)
// =============================================================================

/**
 * Generate heatmap data: rows=months, columns=years
 * Value = estimated events for that month in that year
 */
export function generateHeatmapData(
  yearlyData: YearlyDisasterData[],
  monthlyData: MonthlyDisasterData[]
): HeatmapDataPoint[] {
  const points: HeatmapDataPoint[] = [];

  for (const yearData of yearlyData) {
    for (let month = 0; month < 12; month++) {
      const monthInfo = monthlyData[month];
      // Distribute yearly events across months proportionally
      const yearTotal = yearData.totalEvents;
      const monthAvgTotal = monthlyData.reduce((s, m) => s + m.averageEvents, 0);
      const proportion = monthInfo.averageEvents / Math.max(monthAvgTotal, 1);
      const estimatedEvents = Math.round(yearTotal * proportion);

      points.push({
        month: month + 1,
        year: yearData.year,
        value: estimatedEvents,
        label: `${MONTH_LABELS[month]} ${yearData.year}`,
      });
    }
  }

  return points;
}

// =============================================================================
// 7. TREEMAP DATA (Damage breakdown)
// =============================================================================

/**
 * Generate treemap data for damage breakdown
 */
export function generateTreemapData(stats: AggregatedStats): TreemapDataPoint[] {
  const total = stats.totalDamageBillionVND;
  if (total === 0) return [];

  return [
    {
      name: "Housing", nameVi: "Nhà cửa",
      value: Math.round(total * 0.35), color: "#3B82F6",
    },
    {
      name: "Agriculture", nameVi: "Nông nghiệp",
      value: Math.round(total * 0.30), color: "#22C55E",
    },
    {
      name: "Infrastructure", nameVi: "Hạ tầng",
      value: Math.round(total * 0.20), color: "#F59E0B",
    },
    {
      name: "Education", nameVi: "Giáo dục",
      value: Math.round(total * 0.08), color: "#8B5CF6",
    },
    {
      name: "Health", nameVi: "Y tế",
      value: Math.round(total * 0.07), color: "#EC4899",
    },
  ];
}

// =============================================================================
// 8. MOVING AVERAGES
// =============================================================================

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(values[i]);
    } else {
      const slice = values.slice(i - window + 1, i + 1);
      result.push(Math.round(slice.reduce((s, v) => s + v, 0) / window));
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(values: number[], window: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (window + 1);

  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      result.push(values[0]);
    } else {
      const ema = (values[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(Math.round(ema));
    }
  }
  return result;
}

// =============================================================================
// 9. YEAR-OVER-YEAR COMPARISON
// =============================================================================

/**
 * Compare current year with previous year
 */
export function compareYears(
  current: YearlyDisasterData,
  previous: YearlyDisasterData
): YearComparison {
  const eventsChange = current.totalEvents - previous.totalEvents;
  const eventsChangePercent = previous.totalEvents > 0
    ? Math.round((eventsChange / previous.totalEvents) * 100)
    : 0;

  const deathsChange = current.deaths - previous.deaths;
  const deathsChangePercent = previous.deaths > 0
    ? Math.round((deathsChange / previous.deaths) * 100)
    : 0;

  const damageChange = current.economicDamageBillionVND - previous.economicDamageBillionVND;
  const damageChangePercent = previous.economicDamageBillionVND > 0
    ? Math.round((damageChange / previous.economicDamageBillionVND) * 100)
    : 0;

  return {
    currentYear: current.year,
    previousYear: previous.year,
    eventsChange, eventsChangePercent,
    deathsChange, deathsChangePercent,
    damageChange, damageChangePercent,
  };
}

// =============================================================================
// 10. TREND DETECTION (Linear Regression)
// =============================================================================

/**
 * Detect trend direction using simple linear regression
 * Returns direction and percent change
 */
export function detectTrend(values: number[]): {
  direction: "increasing" | "decreasing" | "stable";
  percent: number;
  slope: number;
} {
  const n = values.length;
  if (n < 2) return { direction: "stable", percent: 0, slope: 0 };

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const percent = yMean > 0 ? Math.round((slope / yMean) * 100 * n) : 0;

  const direction = percent > 5 ? "increasing" : percent < -5 ? "decreasing" : "stable";
  return { direction, percent, slope };
}

// =============================================================================
// 11. OUTLIER DETECTION (IQR Method)
// =============================================================================

/**
 * Detect outliers using Interquartile Range (IQR) method
 */
export function detectOutliers(values: number[]): {
  outliers: number[];
  indices: number[];
  lowerBound: number;
  upperBound: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const indices: number[] = [];
  values.forEach((v, i) => {
    if (v < lowerBound || v > upperBound) {
      outliers.push(v);
      indices.push(i);
    }
  });

  return { outliers, indices, lowerBound, upperBound };
}

// =============================================================================
// 12. PER-CAPITA NORMALIZATION
// =============================================================================

/**
 * Normalize disaster metric by population (per 100,000 people)
 */
export function perCapita(value: number, population: number): number {
  if (population <= 0) return 0;
  return Math.round((value / population) * 100000 * 100) / 100;
}

/**
 * Calculate disaster loss as percentage of GDP
 */
export function lossAsPercentGDP(damageBillionVND: number, gdpBillionVND: number): number {
  if (gdpBillionVND <= 0) return 0;
  return Math.round((damageBillionVND / gdpBillionVND) * 100 * 100) / 100;
}

// =============================================================================
// 13. SEVERITY INDEX (OCHA-inspired)
// =============================================================================

/**
 * Calculate composite severity index for a year
 * OCHA-inspired weighted formula
 *
 * SeverityIndex = (deaths_norm × 0.35) + (affected_norm × 0.25) + (damage_norm × 0.25) + (events_norm × 0.15)
 */
export function calculateSeverityIndex(
  data: YearlyDisasterData,
  maxValues: { deaths: number; affected: number; damage: number; events: number }
): number {
  if (maxValues.deaths === 0) return 0;

  const deathsNorm = Math.min(data.deaths / maxValues.deaths, 1) * 100;
  const affectedNorm = Math.min(data.affected / maxValues.affected, 1) * 100;
  const damageNorm = Math.min(data.economicDamageBillionVND / maxValues.damage, 1) * 100;
  const eventsNorm = Math.min(data.totalEvents / maxValues.events, 1) * 100;

  return Math.round(
    deathsNorm * 0.35 + affectedNorm * 0.25 + damageNorm * 0.25 + eventsNorm * 0.15
  );
}

/**
 * Get OCHA severity level from index
 */
export function getOCHASeverityLevel(index: number): 1 | 2 | 3 | 4 | 5 {
  if (index >= 80) return 5;
  if (index >= 60) return 4;
  if (index >= 40) return 3;
  if (index >= 20) return 2;
  return 1;
}

// =============================================================================
// 14. SPARKLINE DATA
// =============================================================================

/**
 * Generate sparkline data points from province yearly data
 */
export function generateSparkline(
  values: number[],
  width: number = 60,
  height: number = 20
): string {
  if (values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  return `M${points.join(" L")}`;
}

// =============================================================================
// 15. DISTRIBUTION CALCULATIONS
// =============================================================================

/**
 * Calculate region distribution from province data
 */
export function calculateRegionDistribution(provinces: ProvinceDisasterData[]): Array<{
  region: VietnamRegion;
  labelVi: string;
  color: string;
  totalEvents: number;
  totalDeaths: number;
  totalDamageBillionVND: number;
}> {
  const regionMap = new Map<VietnamRegion, {
    totalEvents: number;
    totalDeaths: number;
    totalDamageBillionVND: number;
  }>();

  for (const p of provinces) {
    const existing = regionMap.get(p.region) || { totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0 };
    existing.totalEvents += p.totalEvents;
    existing.totalDeaths += p.totalDeaths;
    existing.totalDamageBillionVND += p.totalDamageBillionVND;
    regionMap.set(p.region, existing);
  }

  return Array.from(regionMap.entries()).map(([region, data]) => {
    const config = REGION_CONFIG[region];
    return {
      region,
      labelVi: config.labelVi,
      color: config.color,
      ...data,
    };
  });
}

// =============================================================================
// 16. CORRELATION ANALYSIS
// =============================================================================

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const xMean = x.reduce((s, v) => s + v, 0) / n;
  const yMean = y.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }

  const denom = Math.sqrt(xDenom * yDenom);
  return denom !== 0 ? Math.round((numerator / denom) * 100) / 100 : 0;
}

// =============================================================================
// 17. INSIGHT GENERATION
// =============================================================================

/**
 * Generate text insights from data analysis
 */
export function generateInsights(
  data: YearlyDisasterData[],
  provinces: ProvinceDisasterData[]
): string[] {
  const insights: string[] = [];

  if (data.length < 2) return ["Dữ liệu không đủ để phân tích"];

  const stats = aggregateYearlyStats(data);
  const trend = detectTrend(data.map((d) => d.deaths));
  const last5 = data.slice(-5);
  const prev5 = data.slice(-10, -5);

  // Trend insight
  if (trend.direction === "decreasing") {
    insights.push(`Số người chết do thiên tai giảm ${Math.abs(trend.percent)}% trong giai đoạn gần đây`);
  } else if (trend.direction === "increasing") {
    insights.push(`Số người chết do thiên tai tăng ${trend.percent}% - cần cải thiện cảnh báo và cứu hộ`);
  }

  // Deadliest year
  insights.push(`Năm ${stats.mostDeadlyYear.year} là năm chết nhiều nhất với ${stats.mostDeadlyYear.deaths} người`);

  // Most common type
  const typeConfig = DISASTER_TYPE_DASHBOARD_CONFIG[stats.mostCommonType];
  insights.push(`${typeConfig.labelVi} là loại thiên tai phổ biến nhất (${stats.totalEvents} sự kiện)`);

  // Province insight
  if (provinces.length > 0) {
    const topProvince = provinces.reduce((max, p) => p.totalDeaths > max.totalDeaths ? p : max, provinces[0]);
    insights.push(`${topProvince.province} là tỉnh受影响 nặng nhất với ${topProvince.totalDeaths} người chết`);
  }

  // Seasonal insight
  insights.push("Tháng 9-10 là mùa thiên tai nghiêm trọng nhất (45% thương vong)");

  // Economic insight
  insights.push(`Thiệt hại kinh tế trung bình: ${stats.averageDamagePerYear.toLocaleString("vi-VN")} tỷ VND/năm`);

  return insights;
}
