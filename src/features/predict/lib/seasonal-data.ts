import type { DisasterType } from "@/lib/types";

/**
 * Vietnam disaster seasonal multiplier (0-1)
 * Based on historical patterns from EM-DAT and Vietnam MARD data.
 * Index 0=January, 11=December.
 */
export const SEASONAL_MULTIPLIER: Record<DisasterType, number[]> = {
  flood:     [0.15, 0.15, 0.25, 0.35, 0.55, 0.70, 0.80, 0.90, 1.00, 0.85, 0.60, 0.25],
  storm:     [0.05, 0.05, 0.08, 0.15, 0.25, 0.45, 0.65, 0.80, 1.00, 0.90, 0.55, 0.15],
  landslide: [0.15, 0.15, 0.25, 0.35, 0.55, 0.70, 0.80, 0.90, 1.00, 0.80, 0.45, 0.15],
  drought:   [0.70, 0.80, 0.90, 1.00, 0.65, 0.35, 0.15, 0.10, 0.10, 0.20, 0.40, 0.60],
  earthquake:[0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50],
  tsunami:   [0.25, 0.25, 0.30, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.65, 0.45, 0.30],
};

export const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export const MONTH_NAMES_SHORT = [
  "Thg 1", "Thg 2", "Thg 3", "Thg 4",
  "Thg 5", "Thg 6", "Thg 7", "Thg 8",
  "Thg 9", "Thg 10", "Thg 11", "Thg 12",
];

/**
 * Season descriptions for Vietnam (Vietnamese)
 */
export const SEASON_DESCRIPTIONS: Record<string, string> = {
  "dry-early":   "Mùa khô đầu năm - Nắng nóng, hạn hán ở miền Tây, lạnh ở miền Bắc",
  "transition":  "Giao mùa - Mưa rào rải rác, chuẩn bị mùa mưa",
  "wet-peak":    "Đỉnh mùa mưa - Lũ lụt miền Trung, bão hoạt động mạnh",
  "wet-late":    "Mùa mưa muộn - Bão cuối mùa, lũ rút dần",
  "dry-late":    "Mùa khô cuối năm - Hạn hán bắt đầu, rét đậm miền Bắc",
};

export function getSeasonKey(month: number): string {
  if (month >= 0 && month <= 2) return "dry-early";
  if (month >= 3 && month <= 4) return "transition";
  if (month >= 5 && month <= 8) return "wet-peak";
  if (month >= 9 && month <= 10) return "wet-late";
  return "dry-late";
}

export function getSeasonDescription(month: number): string {
  return SEASON_DESCRIPTIONS[getSeasonKey(month)] ?? "";
}

/**
 * Get seasonal multiplier for a specific disaster type and month.
 */
export function getSeasonalMultiplier(type: DisasterType, month: number): number {
  const clampedMonth = Math.max(0, Math.min(11, month));
  return SEASONAL_MULTIPLIER[type][clampedMonth];
}

/**
 * Get risk level label from multiplier value.
 */
export function getSeasonalRiskLabel(multiplier: number): string {
  if (multiplier >= 0.8) return "Rất cao";
  if (multiplier >= 0.6) return "Cao";
  if (multiplier >= 0.4) return "Trung bình";
  if (multiplier >= 0.2) return "Thấp";
  return "Rất thấp";
}

/**
 * Get the peak month for a specific disaster type.
 */
export function getPeakMonth(type: DisasterType): number {
  const multipliers = SEASONAL_MULTIPLIER[type];
  return multipliers.indexOf(Math.max(...multipliers));
}

/**
 * Get all disaster types that are high-risk (>=0.7) for a given month.
 */
export function getHighRiskTypes(month: number): DisasterType[] {
  const types: DisasterType[] = ["flood", "storm", "landslide", "drought", "earthquake", "tsunami"];
  return types.filter((t) => SEASONAL_MULTIPLIER[t][month] >= 0.7);
}

/**
 * Generate seasonal data for calendar visualization.
 */
export function generateSeasonalCalendarData() {
  const types: DisasterType[] = ["flood", "storm", "landslide", "drought", "earthquake", "tsunami"];
  const data: { month: number; type: DisasterType; multiplier: number }[] = [];

  for (let m = 0; m < 12; m++) {
    for (const t of types) {
      data.push({ month: m, type: t, multiplier: SEASONAL_MULTIPLIER[t][m] });
    }
  }

  return data;
}
