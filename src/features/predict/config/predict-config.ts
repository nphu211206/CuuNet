import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { Scenario } from "../lib/types";

// === PREDICTION SETTINGS ===

export const PREDICTION_CONFIG = {
  /** Number of months to predict ahead */
  MONTHS_AHEAD: 6,

  /** Confidence level for prediction intervals (z-score) */
  CONFIDENCE_Z_SCORE: 1.96, // 95%

  /** Confidence band width growth per month (multiplier) */
  CONFIDENCE_GROWTH_RATE: 0.15,

  /** Minimum data points required for prediction */
  MIN_DATA_POINTS: 6,

  /** Moving average window size */
  MA_WINDOW: 3,

  /** Default province to show on page load */
  DEFAULT_PROVINCE: "Quảng Bình",

  /** Default month (current month, 0-indexed) */
  DEFAULT_MONTH: new Date().getMonth(),

  /** Default scenario */
  DEFAULT_SCENARIO: "normal",
};

// === RISK SCORE THRESHOLDS ===

export const RISK_THRESHOLDS: Record<SeverityLevel, { min: number; max: number }> = {
  critical: { min: 0.80, max: 1.00 },
  high:     { min: 0.60, max: 0.79 },
  medium:   { min: 0.35, max: 0.59 },
  low:      { min: 0.00, max: 0.34 },
};

// === DISASTER TYPE CONFIG ===

export const DISASTER_CONFIG: Record<DisasterType, { label: string; icon: string; color: string }> = {
  flood:      { label: "Lũ lụt", icon: "🌊", color: "#3B82F6" },
  storm:      { label: "Bão", icon: "🌪️", color: "#F59E0B" },
  landslide:  { label: "Sạt lở", icon: "⛰️", color: "#A855F7" },
  drought:    { label: "Hạn hán", icon: "☀️", color: "#F97316" },
  earthquake: { label: "Động đất", icon: "🔴", color: "#EF4444" },
  tsunami:    { label: "Sóng thần", icon: "🌊", color: "#06B6D4" },
};

// === CHART COLORS ===

export const CHART_COLORS = {
  actual:      "#22C55E",  // Green - historical data
  predicted:   "#3B82F6",  // Blue - prediction
  confidence:  "rgba(59, 130, 246, 0.15)", // Light blue - confidence band
  grid:        "#1e293b",  // Dark grid lines
  axis:        "#94a3b8",  // Axis labels
  tooltip:     {
    bg: "#0f172a",
    border: "#334155",
    text: "#f1f5f9",
  },
};

// === SCENARIOS ===

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
    scientificBasis: "Điều kiện khí tượng trung bình dựa trên dữ liệu 30 năm.",
  },
  {
    id: "el-nino",
    name: "El Nino",
    nameEn: "El Nino",
    description: "Nhiệt đới hóa Thái Bình Dương → Nắng nóng, hạn hán tăng, bão giảm",
    icon: "🔥",
    modifiers: {
      flood: 0.7, storm: 0.8, landslide: 0.6,
      drought: 1.5, earthquake: 1.0, tsunami: 1.0,
    },
    scientificBasis: "El Nino 2015-2016: Việt Nam trải qua hạn hán nghiêm trọng, xâm nhập mặn ở ĐBSCL, hoạt động bão giảm.",
  },
  {
    id: "la-nina",
    name: "La Nina",
    nameEn: "La Nina",
    description: "Lạnh hóa Thái Bình Dương → Mưa lũ tăng, bão mạnh hơn",
    icon: "🌊",
    modifiers: {
      flood: 1.5, storm: 1.4, landslide: 1.5,
      drought: 0.5, earthquake: 1.0, tsunami: 1.0,
    },
    scientificBasis: "La Nina 2010-2011: Lũ lụt kỷ lục ở miền Trung, 10+ cơn bão, sạt lở nghiêm trọng ở miền núi phía Bắc.",
  },
  {
    id: "climate-change",
    name: "Biến đổi khí hậu",
    nameEn: "Climate Change",
    description: "Nhiệt độ +1.5°C, mực nước biển +0.5m, thời tiết cực đoan tăng",
    icon: "🌡️",
    modifiers: {
      flood: 1.25, storm: 1.15, landslide: 1.20,
      drought: 1.30, earthquake: 1.0, tsunami: 1.05,
    },
    scientificBasis: "IPCC AR6: Việt Nam là một trong những quốc gia dễ bị tổn thương nhất bởi BĐKH. ĐBSCL có thể mất 40% diện tích đất vào năm 2100.",
  },
];

// === RISK COLOR SCALE ===

export const RISK_COLORS = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
  veryLow: "#84CC16",
};

// === GAUGE CONFIG ===

export const GAUGE_CONFIG = {
  /** Arc angle in degrees (270 = 3/4 circle) */
  ARC_ANGLE: 270,

  /** Start angle (from top, clockwise) */
  START_ANGLE: 135,

  /** Color stops for gauge arc */
  COLOR_STOPS: [
    { offset: 0.00, color: "#22C55E" },  // Green
    { offset: 0.25, color: "#84CC16" },  // Lime
    { offset: 0.50, color: "#EAB308" },  // Yellow
    { offset: 0.75, color: "#F97316" },  // Orange
    { offset: 1.00, color: "#EF4444" },  // Red
  ],

  /** Sizes for different variants */
  SIZES: {
    sm: { width: 100, height: 100, strokeWidth: 8, fontSize: 16 },
    md: { width: 150, height: 150, strokeWidth: 12, fontSize: 24 },
    lg: { width: 200, height: 200, strokeWidth: 16, fontSize: 32 },
  },
};

// === ANIMATION CONFIG ===

export const ANIMATION = {
  gauge: { duration: 1.5, ease: "easeOut" },
  chart: { duration: 0.8, ease: "easeInOut" },
  card: { stagger: 0.08, duration: 0.5 },
  calendar: { duration: 0.3, ease: "ease" },
  scenario: { type: "spring", stiffness: 300, damping: 25 },
};
