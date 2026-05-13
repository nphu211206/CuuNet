"use client";

// =============================================================================
// FORMATTERS - Number, Date, VND, Percent Formatting
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Vietnamese formatting standards:
//   - Numbers: dots as thousand separators (1.234.567)
//   - Date: dd/mm/yyyy
//   - Currency: VND with compact notation (tỷ, triệu)
//   - Percent: +15% / -8%
// =============================================================================

// =============================================================================
// 1. NUMBER FORMATTING
// =============================================================================

/**
 * Format number with Vietnamese locale (dots as thousand separators)
 * Example: 1234567 → "1.234.567"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number with compact notation
 * Example: 1234567 → "1,2 triệu", 1234567890 → "1,2 tỷ"
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} triệu`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(".", ",")} nghìn`;
  }
  return value.toString();
}

/**
 * Format number with unit
 * Example: formatWithUnit(1500, "người") → "1.500 người"
 */
export function formatWithUnit(value: number, unit: string, compact: boolean = false): string {
  if (compact) {
    return `${formatCompact(value)} ${unit}`;
  }
  return `${formatNumber(value)} ${unit}`;
}

/**
 * Format large number with abbreviation
 * Example: formatAbbreviated(1234567) → "1.2M"
 */
export function formatAbbreviated(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

// =============================================================================
// 2. VND CURRENCY FORMATTING
// =============================================================================

/**
 * Format VND currency
 * Example: formatVND(1234567) → "1.234.567 VND"
 */
export function formatVND(value: number): string {
  return `${formatNumber(value)} VND`;
}

/**
 * Format VND in billions (tỷ VND)
 * Example: formatVNDBillion(12345) → "12.345 tỷ VND"
 */
export function formatVNDBillion(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")} nghìn tỷ VND`;
  }
  return `${value.toFixed(0)} tỷ VND`;
}

/**
 * Format VND compact for charts
 * Example: formatVNDBillionShort(12345) → "12,3 nghìn tỷ"
 */
export function formatVNDBillionShort(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")} nghìn tỷ`;
  }
  if (value >= 1) {
    return `${value.toFixed(0)} tỷ`;
  }
  return `${(value * 1000).toFixed(0)} triệu`;
}

/**
 * Format economic damage with context
 * Example: formatDamage(85000) → "85.000 tỷ VND (~3,5 tỷ USD)"
 */
export function formatDamage(billionVND: number): string {
  const usdEstimate = Math.round(billionVND / 25); // ~25,000 VND/USD
  return `${formatNumber(billionVND)} tỷ VND (~${formatCompact(usdEstimate * 1_000_000)} USD)`;
}

// =============================================================================
// 3. PERCENTAGE FORMATTING
// =============================================================================

/**
 * Format percentage with sign
 * Example: formatPercentChange(15) → "+15%", formatPercentChange(-8) → "-8%"
 */
export function formatPercentChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

/**
 * Format percentage
 * Example: formatPercent(45.67) → "45,7%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

/**
 * Format percentage with color indicator
 */
export function formatPercentWithColor(value: number): {
  text: string;
  color: "green" | "red" | "gray";
} {
  if (value > 5) return { text: formatPercentChange(value), color: "red" };
  if (value < -5) return { text: formatPercentChange(value), color: "green" };
  return { text: formatPercentChange(value), color: "gray" };
}

// =============================================================================
// 4. DATE FORMATTING
// =============================================================================

/**
 * Format date in Vietnamese format (dd/mm/yyyy)
 * Example: formatDate("2024-09-07") → "07/09/2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Format date with time (dd/mm/yyyy HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format month name in Vietnamese
 * Example: formatMonth(1) → "Tháng 1"
 */
export function formatMonth(month: number): string {
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];
  return months[month - 1] || "";
}

/**
 * Format month short
 * Example: formatMonthShort(1) → "T1"
 */
export function formatMonthShort(month: number): string {
  return `T${month}`;
}

/**
 * Format year range
 * Example: formatYearRange(2000, 2024) → "2000-2024"
 */
export function formatYearRange(start: number, end: number): string {
  return `${start}-${end}`;
}

/**
 * Format relative time
 * Example: formatRelativeTime("2024-09-07") → "8 tháng trước"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
}

// =============================================================================
// 5. DISASTER-SPECIFIC FORMATTING
// =============================================================================

/**
 * Format disaster count with type
 * Example: formatDisasterCount(23, "flood") → "23 trận lũ lụt"
 */
export function formatDisasterCount(count: number, type: string): string {
  const typeNames: Record<string, string> = {
    flood: "trận lũ lụt",
    storm: "cơn bão",
    landslide: "vụ sạt lở",
    drought: "đợt hạn hán",
    earthquake: "trận động đất",
    tsunami: "trận sóng thần",
  };
  return `${formatNumber(count)} ${typeNames[type] || "sự kiện"}`;
}

/**
 * Format people affected
 * Example: formatPeopleAffected(5700000) → "5,7 triệu người"
 */
export function formatPeopleAffected(thousands: number): string {
  const total = thousands * 1000;
  if (total >= 1_000_000) {
    return `${(total / 1_000_000).toFixed(1).replace(".", ",")} triệu người`;
  }
  if (total >= 1_000) {
    return `${(total / 1_000).toFixed(0)} nghìn người`;
  }
  return `${formatNumber(total)} người`;
}

/**
 * Format houses damaged
 * Example: formatHousesDamaged(320) → "320.000 nhà"
 */
export function formatHousesDamaged(thousands: number): string {
  return `${formatNumber(thousands * 1000)} nhà`;
}

/**
 * Format agricultural damage
 * Example: formatAgriculturalDamage(450000) → "450.000 ha"
 */
export function formatAgriculturalDamage(hectares: number): string {
  if (hectares >= 1000) {
    return `${(hectares / 1000).toFixed(0)} nghìn ha`;
  }
  return `${formatNumber(hectares)} ha`;
}

/**
 * Format risk score with level
 * Example: formatRiskScore(9.5) → "9.5 - Cực kỳ cao"
 */
export function formatRiskScore(score: number): string {
  let level: string;
  if (score >= 9) level = "Cực kỳ cao";
  else if (score >= 7) level = "Rất cao";
  else if (score >= 5) level = "Cao";
  else if (score >= 3) level = "Trung bình";
  else level = "Thấp";
  return `${score.toFixed(1)} - ${level}`;
}

/**
 * Format severity level in Vietnamese
 */
export function formatSeverityLevel(level: 1 | 2 | 3 | 4 | 5): string {
  const levels: Record<number, string> = {
    1: "Nhẹ",
    2: "Trung bình",
    3: "Nghiêm trọng",
    4: "Cực kỳ nghiêm trọng",
    5: "Thảm họa",
  };
  return levels[level] || "Không xác định";
}

// =============================================================================
// 6. CHART-SPECIFIC FORMATTING
// =============================================================================

/**
 * Format value for chart tooltip
 * Example: formatChartValue(12345, "deaths") → "12.345 người chết"
 */
export function formatChartValue(value: number, metric: string): string {
  const units: Record<string, string> = {
    deaths: "người chết",
    events: "sự kiện",
    damage: "tỷ VND",
    affected: "người受影响",
    houses: "nhà",
    hectares: "ha",
  };
  return `${formatNumber(value)} ${units[metric] || ""}`;
}

/**
 * Format value for chart axis
 * Compact format for axis labels
 */
export function formatAxisValue(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

/**
 * Format value for pie chart label
 * Example: formatPieLabel("flood", 45) → "Lũ lụt: 45%"
 */
export function formatPieLabel(name: string, percent: number): string {
  return `${name}: ${percent.toFixed(0)}%`;
}

// =============================================================================
// 7. EXPORT FORMATTING
// =============================================================================

/**
 * Format data for CSV export
 * Handles Vietnamese characters and special cases
 */
export function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    // Escape quotes and wrap in quotes if contains comma or newline
    if (value.includes(",") || value.includes("\n") || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  return String(value);
}

/**
 * Generate CSV content from data array
 */
export function generateCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;

  const BOM = "﻿"; // UTF-8 BOM for Excel compatibility
  const headers = Object.keys(data[0]).map(formatCSVValue).join(",");
  const rows = data.map((row) =>
    Object.values(row).map(formatCSVValue).join(",")
  );
  const csv = [headers, ...rows].join("\n");

  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Generate filename with timestamp
 * Example: generateFilename("cuunet-disaster-data") → "cuunet-disaster-data_2024-05-11"
 */
export function generateFilename(prefix: string, extension: string = "csv"): string {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}_${date}.${extension}`;
}

// =============================================================================
// 8. RAW DATA FORMATTING (for export)
// =============================================================================

/**
 * Format yearly disaster data for export
 */
export function formatYearlyDataForExport(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((row) => ({
    "Năm": row.year,
    "Sự kiện": row.totalEvents,
    "Chết": row.deaths,
    "Mất tích": row.missing,
    "Bị thương": row.injured,
    "受影响 (nghìn)": row.affected,
    "Nhà thiệt hại (nghìn)": row.housesDamaged,
    "Thiệt hại (tỷ VND)": row.economicDamageBillionVND,
    "% GDP": row.economicDamagePercentGDP,
    "NN thiệt hại (ha)": row.agriculturalDamageHa,
    "Lũ lụt": row.floods,
    "Bão": row.storms,
    "Sạt lở": row.landslides,
    "Hạn hán": row.drought,
    "Sự kiện nổi bật": row.topEvent,
  }));
}

/**
 * Format province data for export
 */
export function formatProvinceDataForExport(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((row) => ({
    "Tỉnh": row.province,
    "Vùng": row.region,
    "Dân số": row.population,
    "Diện tích (km²)": row.areaKm2,
    "GDP (tỷ VND)": row.gdpBillionVND,
    "Điểm rủi ro": row.riskScore,
    "Tổng sự kiện": row.totalEvents,
    "Tổng chết": row.totalDeaths,
    "Tổng受影响": row.totalAffected,
    "Tổng thiệt hại (tỷ VND)": row.totalDamageBillionVND,
    "Loại phổ biến": row.mostCommonType,
  }));
}
