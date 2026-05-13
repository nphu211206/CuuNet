import type {
  DashboardView,
  TimeRange,
  VietnamRegion,
  OCHASeverityLevel,
  ChartType,
  DashboardFilter,
  DisasterTypeDistribution,
  RegionDistribution,
} from "../lib/types";

import type { DisasterType } from "@/lib/types";

// =============================================================================
// DASHBOARD STATS MODULE - Configuration
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. GENERAL CONFIG
// ---------------------------------------------------------------------------

export const DASHBOARD_CONFIG = {
  PAGE_SIZE: 20,
  AUTO_REFRESH_INTERVAL: 30_000,
  TOAST_DURATION: 4_000,
  CHART_ANIMATION_DURATION: 1_000,
  COUNTER_ANIMATION_DURATION: 1_500,
  DEBOUNCE_FILTER: 300,
  MAX_PROVINCES_DISPLAY: 15,
  MAX_BUBBLE_SIZE: 400,
  MIN_BUBBLE_SIZE: 50,
  HEATMAP_CELL_SIZE: 28,
  GAUGE_SIZE: 120,
  KPI_CARD_MIN_WIDTH: 140,
  EXPORT_SCALE: 2,
} as const;

// ---------------------------------------------------------------------------
// 2. STORAGE KEYS
// ---------------------------------------------------------------------------

export const DASHBOARD_STORAGE_KEYS = {
  ACTIVE_VIEW: "cuunet-dashboard-view",
  FILTER: "cuunet-dashboard-filter",
  SELECTED_PROVINCE: "cuunet-dashboard-province",
  CUSTOM_RANGE: "cuunet-dashboard-range",
} as const;

// ---------------------------------------------------------------------------
// 3. VIEW CONFIG
// ---------------------------------------------------------------------------

export const DASHBOARD_VIEW_CONFIG: Record<
  DashboardView,
  { label: string; labelVi: string; icon: string; color: string; description: string }
> = {
  executive: {
    label: "Executive",
    labelVi: "Tổng quan",
    icon: "📊",
    color: "#3B82F6",
    description: "Tổng quan cấp cao cho lãnh đạo - KPI cards, trend charts",
  },
  operational: {
    label: "Operational",
    labelVi: "Giám sát",
    icon: "📡",
    color: "#22C55E",
    description: "Giám sát thời gian thực - bản đồ, sự kiện đang xảy ra",
  },
  analytical: {
    label: "Analytical",
    labelVi: "Phân tích",
    icon: "🔍",
    color: "#8B5CF6",
    description: "Phân tích sâu - so sánh tỉnh, bubble chart, bảng chi tiết",
  },
  strategic: {
    label: "Strategic",
    labelVi: "Xu hướng",
    icon: "📈",
    color: "#F59E0B",
    description: "Xu hướng dài hạn - 5Y/10Y/20Y, heatmap, dự báo",
  },
};

// ---------------------------------------------------------------------------
// 4. TIME RANGE CONFIG
// ---------------------------------------------------------------------------

export const TIME_RANGE_CONFIG: Record<
  TimeRange,
  { label: string; labelVi: string; years: number; startYear: number }
> = {
  "1y": { label: "1 Year", labelVi: "1 năm", years: 1, startYear: 2024 },
  "5y": { label: "5 Years", labelVi: "5 năm", years: 5, startYear: 2020 },
  "10y": { label: "10 Years", labelVi: "10 năm", years: 10, startYear: 2015 },
  "20y": { label: "20 Years", labelVi: "20 năm", years: 20, startYear: 2005 },
  all: { label: "All", labelVi: "Tất cả", years: 25, startYear: 2000 },
  custom: { label: "Custom", labelVi: "Tùy chỉnh", years: 0, startYear: 2000 },
};

// ---------------------------------------------------------------------------
// 5. REGION CONFIG
// ---------------------------------------------------------------------------

export const REGION_CONFIG: Record<
  VietnamRegion,
  { label: string; labelVi: string; color: string; provinces: string[] }
> = {
  all: {
    label: "All Regions",
    labelVi: "Toàn quốc",
    color: "#3B82F6",
    provinces: [],
  },
  north: {
    label: "Northern Mountains",
    labelVi: "Miền núi phía Bắc",
    color: "#22C55E",
    provinces: ["Lào Cai", "Yên Bái", "Hà Giang", "Cao Bằng", "Lạng Sơn", "Sơn La", "Lai Châu"],
  },
  north_central: {
    label: "North Central",
    labelVi: "Bắc Trung Bộ",
    color: "#EF4444",
    provinces: ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế"],
  },
  south_central: {
    label: "South Central",
    labelVi: "Nam Trung Bộ",
    color: "#F97316",
    provinces: ["Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận"],
  },
  central_highlands: {
    label: "Central Highlands",
    labelVi: "Tây Nguyên",
    color: "#8B5CF6",
    provinces: ["Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"],
  },
  southeast: {
    label: "Southeast",
    labelVi: "Đông Nam Bộ",
    color: "#EC4899",
    provinces: ["TP.HCM", "Bình Dương", "Đồng Nai", "Bà Rịa-Vũng Tàu", "Tây Ninh", "Bình Phước"],
  },
  mekong_delta: {
    label: "Mekong Delta",
    labelVi: "Đồng bằng sông Cửu Long",
    color: "#06B6D4",
    provinces: ["Cần Thơ", "An Giang", "Đồng Tháp", "Long An", "Tiền Giang", "Bến Tre", "Vĩnh Long", "Trà Vinh", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau", "Kiên Giang"],
  },
};

// ---------------------------------------------------------------------------
// 6. DISASTER TYPE CONFIG (reuse from global)
// ---------------------------------------------------------------------------

export const DISASTER_TYPE_DASHBOARD_CONFIG: Record<
  DisasterType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  flood: { label: "Flood", labelVi: "Lũ lụt", icon: "🌊", color: "#3B82F6" },
  storm: { label: "Storm", labelVi: "Bão", icon: "🌪️", color: "#8B5CF6" },
  landslide: { label: "Landslide", labelVi: "Sạt lở", icon: "⛰️", color: "#92400E" },
  drought: { label: "Drought", labelVi: "Hạn hán", icon: "☀️", color: "#F59E0B" },
  earthquake: { label: "Earthquake", labelVi: "Động đất", icon: "🏔️", color: "#EF4444" },
  tsunami: { label: "Tsunami", labelVi: "Sóng thần", icon: "🌊", color: "#0EA5E9" },
};

// ---------------------------------------------------------------------------
// 7. OCHA SEVERITY CONFIG (5-level)
// ---------------------------------------------------------------------------

export const OCHA_SEVERITY_CONFIG: Record<
  OCHASeverityLevel,
  { label: string; labelVi: string; color: string; description: string; minDeaths: number; minDamageBillion: number }
> = {
  1: {
    label: "Minor",
    labelVi: "Nhẹ",
    color: "#22C55E",
    description: "Tác động thấp, phản ứng địa phương đủ",
    minDeaths: 0,
    minDamageBillion: 0,
  },
  2: {
    label: "Moderate",
    labelVi: "Trung bình",
    color: "#EAB308",
    description: "Tác động trung bình, cần một số hỗ trợ bên ngoài",
    minDeaths: 5,
    minDamageBillion: 10,
  },
  3: {
    label: "Severe",
    labelVi: "Nghiêm trọng",
    color: "#F97316",
    description: "Tác động đáng kể, cần phản ứng phối hợp",
    minDeaths: 20,
    minDamageBillion: 50,
  },
  4: {
    label: "Extreme",
    labelVi: "Cực kỳ nghiêm trọng",
    color: "#EF4444",
    description: "Tác động lớn, cần huy động quốc gia",
    minDeaths: 50,
    minDamageBillion: 200,
  },
  5: {
    label: "Catastrophic",
    labelVi: "Thảm họa",
    color: "#A855F7",
    description: "Tác động thảm khốc, cần viện trợ quốc tế",
    minDeaths: 200,
    minDamageBillion: 1000,
  },
};

// ---------------------------------------------------------------------------
// 8. DEFAULT FILTER
// ---------------------------------------------------------------------------

export const DEFAULT_DASHBOARD_FILTER: DashboardFilter = {
  timeRange: "all",
  customStart: null,
  customEnd: null,
  region: "all",
  disasterType: "all",
  province: "all",
  severityLevel: "all",
};

// ---------------------------------------------------------------------------
// 9. CHART THEME (Dark Glassmorphism)
// ---------------------------------------------------------------------------

export const CHART_THEME = {
  // Grid
  gridStroke: "rgba(255,255,255,0.05)",
  gridStrokeDash: "3 3",
  // Axis
  axisStroke: "rgba(148,163,184,0.3)",
  axisTick: "#94A3B8",
  axisLabel: "#94A3B8",
  // Tooltip
  tooltipBg: "rgba(15,23,42,0.9)",
  tooltipBorder: "rgba(148,163,184,0.2)",
  tooltipText: "#F1F5F9",
  // Legend
  legendText: "#CBD5E1",
  // Area fill
  areaFillOpacity: 0.3,
  // Bar
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  barFillOpacity: 0.8,
  // Animation
  animationBegin: 200,
  animationDuration: 1000,
  animationEasing: "ease-out" as const,
} as const;

// ---------------------------------------------------------------------------
// 10. KPI CONFIG
// ---------------------------------------------------------------------------

export const KPI_CONFIG = {
  animationDuration: 1500,
  trendThreshold: 5, // % change to show trend
  decimals: 1,
} as const;

// ---------------------------------------------------------------------------
// 11. EXPORT CONFIG
// ---------------------------------------------------------------------------

export const EXPORT_CONFIG = {
  pngScale: 2,
  pngBackgroundColor: "#0F172A",
  csvBOM: "﻿",
  csvDelimiter: ",",
  csvEncoding: "text/csv;charset=utf-8;",
  filenamePrefix: "cuunet-dashboard",
} as const;

// ---------------------------------------------------------------------------
// 12. MONTH LABELS (Vietnamese)
// ---------------------------------------------------------------------------

export const MONTH_LABELS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
] as const;

// ---------------------------------------------------------------------------
// 13. ANIMATION CONFIG
// ---------------------------------------------------------------------------

export const DASHBOARD_ANIMATION = {
  stagger: 0.05,
  delayChildren: 0.1,
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    chart: 1.0,
    counter: 1.5,
  },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  spring: {
    gentle: { type: "spring" as const, stiffness: 100, damping: 15 },
    bouncy: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
} as const;

// ---------------------------------------------------------------------------
// 14. DEFAULT DISTRIBUTIONS
// ---------------------------------------------------------------------------

export const DEFAULT_TYPE_DISTRIBUTION: DisasterTypeDistribution[] = [
  { type: "flood", label: "Flood", labelVi: "Lũ lụt", icon: "🌊", color: "#3B82F6", count: 0, percentage: 45, totalDeaths: 0, totalDamageBillionVND: 0 },
  { type: "storm", label: "Storm", labelVi: "Bão", icon: "🌪️", color: "#8B5CF6", count: 0, percentage: 30, totalDeaths: 0, totalDamageBillionVND: 0 },
  { type: "landslide", label: "Landslide", labelVi: "Sạt lở", icon: "⛰️", color: "#92400E", count: 0, percentage: 10, totalDeaths: 0, totalDamageBillionVND: 0 },
  { type: "drought", label: "Drought", labelVi: "Hạn hán", icon: "☀️", color: "#F59E0B", count: 0, percentage: 8, totalDeaths: 0, totalDamageBillionVND: 0 },
  { type: "earthquake", label: "Earthquake", labelVi: "Động đất", icon: "🏔️", color: "#EF4444", count: 0, percentage: 4, totalDeaths: 0, totalDamageBillionVND: 0 },
  { type: "tsunami", label: "Tsunami", labelVi: "Sóng thần", icon: "🌊", color: "#0EA5E9", count: 0, percentage: 3, totalDeaths: 0, totalDamageBillionVND: 0 },
];

export const DEFAULT_REGION_DISTRIBUTION: RegionDistribution[] = [
  { region: "north_central", label: "North Central", labelVi: "Bắc Trung Bộ", color: "#EF4444", totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0, percentage: 40, provinces: [] },
  { region: "south_central", label: "South Central", labelVi: "Nam Trung Bộ", color: "#F97316", totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0, percentage: 20, provinces: [] },
  { region: "mekong_delta", label: "Mekong Delta", labelVi: "ĐBSCL", color: "#06B6D4", totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0, percentage: 20, provinces: [] },
  { region: "north", label: "Northern Mountains", labelVi: "Miền núi Bắc", color: "#22C55E", totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0, percentage: 15, provinces: [] },
  { region: "central_highlands", label: "Central Highlands", labelVi: "Tây Nguyên", color: "#8B5CF6", totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0, percentage: 3, provinces: [] },
  { region: "southeast", label: "Southeast", labelVi: "Đông Nam Bộ", color: "#EC4899", totalEvents: 0, totalDeaths: 0, totalDamageBillionVND: 0, percentage: 2, provinces: [] },
];
