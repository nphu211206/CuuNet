"use client";

// =============================================================================
// DASHBOARD STATS MODULE - TypeScript Types
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Inspired by:
//   - UN OCHA HDX (Humanitarian Data Exchange) - Key Figures pattern
//   - EM-DAT (International Disaster Database) - Bubble Chart data model
//   - GDACS (Global Disaster Alert System) - Severity scale
//   - DesInventar - Bottom-up disaster inventory
//   - OCHA HSI (Humanitarian Severity Index) - 5-level scale
// =============================================================================

import type { DisasterType, SeverityLevel } from "@/lib/types";

// ---------------------------------------------------------------------------
// 1. DASHBOARD VIEW TYPES
// ---------------------------------------------------------------------------

/** Chế độ xem dashboard */
export type DashboardView = "executive" | "operational" | "analytical" | "strategic";

/** Khoảng thời gian */
export type TimeRange = "1y" | "5y" | "10y" | "20y" | "all" | "custom";

/** Vùng miền */
export type VietnamRegion =
  | "all"
  | "north"
  | "north_central"
  | "south_central"
  | "central_highlands"
  | "southeast"
  | "mekong_delta";

/** Mức độ nghiêm trọng OCHA (5-level) */
export type OCHASeverityLevel = 1 | 2 | 3 | 4 | 5;

/** Loại biểu đồ */
export type ChartType = "area" | "bar" | "pie" | "bubble" | "treemap" | "heatmap" | "gauge" | "choropleth";

// ---------------------------------------------------------------------------
// 2. HISTORICAL DISASTER DATA (2000-2024)
// ---------------------------------------------------------------------------

/** Dữ liệu thiên tai hàng năm */
export interface YearlyDisasterData {
  year: number;
  totalEvents: number;
  deaths: number;
  missing: number;
  injured: number;
  affected: number;              // hàng nghìn người
  housesDamaged: number;         // hàng nghìn nhà
  economicDamageBillionVND: number;
  economicDamagePercentGDP: number;
  agriculturalDamageHa: number;  // hecta
  // Phân theo loại
  floods: number;
  storms: number;
  landslides: number;
  drought: number;
  other: number;
  // Sự kiện nổi bật
  topEvent: string;
}

/** Dữ liệu thiên tai theo tháng (trung bình 20 năm) */
export interface MonthlyDisasterData {
  month: number;                 // 1-12
  monthName: string;             // "Tháng 1"
  averageEvents: number;
  floods: number;
  storms: number;
  landslides: number;
  drought: number;
  other: number;
}

// ---------------------------------------------------------------------------
// 3. PROVINCE DATA
// ---------------------------------------------------------------------------

/** Dữ liệu thiên tai tỉnh */
export interface ProvinceDisasterData {
  province: string;
  code: string;
  region: VietnamRegion;
  lat: number;
  lng: number;
  population: number;
  areaKm2: number;
  gdpBillionVND: number;
  riskScore: number;             // 1-10
  riskLevel: SeverityLevel;
  // Tổng hợp 2000-2024
  totalEvents: number;
  totalDeaths: number;
  totalMissing: number;
  totalAffected: number;
  totalDamageBillionVND: number;
  averageDamagePerEvent: number;
  mostCommonType: DisasterType;
  // Dữ liệu theo năm (cho sparklines)
  yearlyDeaths: number[];
  yearlyDamage: number[];
  // Phân theo loại
  typeDistribution: Record<DisasterType, number>;
  // Sự kiện lớn
  majorEvents: ProvinceMajorEvent[];
}

/** Sự kiện lớn của tỉnh */
export interface ProvinceMajorEvent {
  year: number;
  name: string;
  type: DisasterType;
  deaths: number;
  damageBillionVND: number;
}

// ---------------------------------------------------------------------------
// 4. DISASTER TYPE DISTRIBUTION
// ---------------------------------------------------------------------------

/** Phân bố loại thiên tai */
export interface DisasterTypeDistribution {
  type: DisasterType;
  label: string;
  labelVi: string;
  icon: string;
  color: string;
  count: number;
  percentage: number;
  totalDeaths: number;
  totalDamageBillionVND: number;
}

/** Phân bố theo vùng miền */
export interface RegionDistribution {
  region: VietnamRegion;
  label: string;
  labelVi: string;
  color: string;
  totalEvents: number;
  totalDeaths: number;
  totalDamageBillionVND: number;
  percentage: number;
  provinces: string[];
}

// ---------------------------------------------------------------------------
// 5. KPI TYPES
// ---------------------------------------------------------------------------

/** KPI Card data */
export interface KPIData {
  id: string;
  label: string;
  labelVi: string;
  icon: string;
  value: number;
  formattedValue: string;
  suffix?: string;
  prefix?: string;
  trend: "up" | "down" | "stable";
  trendValue: string;
  trendPercent: number;
  color: string;
  description: string;
}

/** KPI Group */
export interface KPIGroup {
  title: string;
  titleVi: string;
  kpis: KPIData[];
}

// ---------------------------------------------------------------------------
// 6. CHART DATA TYPES
// ---------------------------------------------------------------------------

/** Data point cho Area/Line chart */
export interface TimeSeriesDataPoint {
  year: number;
  label: string;
  value: number;
  secondary?: number;
  annotation?: string;
}

/** Data point cho Bar chart */
export interface BarChartDataPoint {
  name: string;
  nameVi: string;
  value: number;
  color: string;
  secondary?: number;
}

/** Data point cho Pie/Donut chart */
export interface PieChartDataPoint {
  name: string;
  nameVi: string;
  value: number;
  color: string;
  percentage: number;
}

/** Data point cho Bubble chart (EM-DAT style) */
export interface BubbleChartDataPoint {
  x: number;           // Số sự kiện
  y: number;           // Số người chết
  z: number;           // Thiệt hại kinh tế (size)
  name: string;        // Tên năm
  color: string;       // Màu theo loại thiên tai chính
  type: DisasterType;  // Loại thiên tai chính
  year: number;
  details: {
    events: number;
    deaths: number;
    missing: number;
    affected: number;
    damageBillionVND: number;
  };
}

/** Data point cho Treemap */
export interface TreemapDataPoint {
  name: string;
  nameVi: string;
  value: number;
  color: string;
  children?: TreemapDataPoint[];
}

/** Data point cho Heatmap (tháng × năm) */
export interface HeatmapDataPoint {
  month: number;
  year: number;
  value: number;
  label: string;
}

/** Data cho Gauge chart */
export interface GaugeData {
  value: number;
  maxValue: number;
  label: string;
  labelVi: string;
  color: string;
  level: string;
  levelVi: string;
}

// ---------------------------------------------------------------------------
// 7. FILTER TYPES
// ---------------------------------------------------------------------------

/** Dashboard filter state */
export interface DashboardFilter {
  timeRange: TimeRange;
  customStart: number | null;
  customEnd: number | null;
  region: VietnamRegion;
  disasterType: DisasterType | "all";
  province: string | "all";
  severityLevel: OCHASeverityLevel | "all";
}

/** Filter option */
export interface FilterOption {
  id: string;
  label: string;
  labelVi: string;
  icon?: string;
  color?: string;
}

// ---------------------------------------------------------------------------
// 8. AGGREGATION TYPES
// ---------------------------------------------------------------------------

/** Thống kê tổng hợp */
export interface AggregatedStats {
  totalEvents: number;
  totalDeaths: number;
  totalMissing: number;
  totalInjured: number;
  totalAffected: number;
  totalHousesDamaged: number;
  totalDamageBillionVND: number;
  averageDamagePerYear: number;
  averageDeathsPerYear: number;
  mostDeadlyYear: { year: number; deaths: number };
  mostDamagingYear: { year: number; damage: number };
  mostAffectedProvince: { province: string; affected: number };
  mostCommonType: DisasterType;
  trendDirection: "increasing" | "decreasing" | "stable";
  trendPercent: number;
}

/** So sánh năm */
export interface YearComparison {
  currentYear: number;
  previousYear: number;
  eventsChange: number;
  eventsChangePercent: number;
  deathsChange: number;
  deathsChangePercent: number;
  damageChange: number;
  damageChangePercent: number;
}

// ---------------------------------------------------------------------------
// 9. CONTEXT & STATE TYPES
// ---------------------------------------------------------------------------

/** State của Dashboard module */
export interface DashboardState {
  // View
  activeView: DashboardView;
  // Filter
  filter: DashboardFilter;
  // Data
  yearlyData: YearlyDisasterData[];
  monthlyData: MonthlyDisasterData[];
  provinceData: ProvinceDisasterData[];
  // Computed
  aggregatedStats: AggregatedStats | null;
  typeDistribution: DisasterTypeDistribution[];
  regionDistribution: RegionDistribution[];
  // UI
  selectedProvince: string | null;
  selectedYear: number | null;
  isExporting: boolean;
  // Toast
  toasts: DashboardToast[];
}

/** Toast notification */
export interface DashboardToast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  duration: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 10. ACTION TYPES
// ---------------------------------------------------------------------------

export type DashboardAction =
  // View
  | { type: "SET_ACTIVE_VIEW"; payload: DashboardView }
  // Filter
  | { type: "SET_FILTER"; payload: Partial<DashboardFilter> }
  | { type: "RESET_FILTER" }
  | { type: "SET_TIME_RANGE"; payload: TimeRange }
  | { type: "SET_REGION"; payload: VietnamRegion }
  | { type: "SET_DISASTER_TYPE"; payload: DisasterType | "all" }
  | { type: "SET_PROVINCE"; payload: string | "all" }
  // Data
  | { type: "SET_YEARLY_DATA"; payload: YearlyDisasterData[] }
  | { type: "SET_MONTHLY_DATA"; payload: MonthlyDisasterData[] }
  | { type: "SET_PROVINCE_DATA"; payload: ProvinceDisasterData[] }
  // Computed
  | { type: "SET_AGGREGATED_STATS"; payload: AggregatedStats }
  | { type: "SET_TYPE_DISTRIBUTION"; payload: DisasterTypeDistribution[] }
  | { type: "SET_REGION_DISTRIBUTION"; payload: RegionDistribution[] }
  // UI
  | { type: "SELECT_PROVINCE"; payload: string | null }
  | { type: "SELECT_YEAR"; payload: number | null }
  | { type: "SET_EXPORTING"; payload: boolean }
  // Toast
  | { type: "ADD_TOAST"; payload: DashboardToast }
  | { type: "REMOVE_TOAST"; payload: string }
  // Reset
  | { type: "RESET_STATE" };

// ---------------------------------------------------------------------------
// 11. CONTEXT TYPE
// ---------------------------------------------------------------------------

export interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  // Computed
  filteredYearlyData: YearlyDisasterData[];
  filteredProvinceData: ProvinceDisasterData[];
  kpis: KPIData[];
  // Helpers
  showToast: (toast: Omit<DashboardToast, "id" | "createdAt">) => void;
  getProvinceByName: (name: string) => ProvinceDisasterData | undefined;
  getYearlyDataByRange: (range: TimeRange) => YearlyDisasterData[];
  getTopProvinces: (metric: "deaths" | "damage" | "events", limit?: number) => ProvinceDisasterData[];
  getDisasterTypeColor: (type: DisasterType) => string;
  getSeverityColor: (level: OCHASeverityLevel) => string;
  formatNumber: (value: number) => string;
  formatVND: (value: number) => string;
  formatPercent: (value: number) => string;
}

// ---------------------------------------------------------------------------
// 12. PROPS TYPES
// ---------------------------------------------------------------------------

export interface DashboardHeaderProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  className?: string;
}

export interface FilterBarProps {
  filter: DashboardFilter;
  onFilterChange: (filter: Partial<DashboardFilter>) => void;
  onReset: () => void;
  provinces: string[];
  className?: string;
}

export interface KPICardProps {
  kpi: KPIData;
  index: number;
  className?: string;
}

export interface KPICardGridProps {
  kpis: KPIData[];
  className?: string;
}

export interface ExecutiveDashboardProps {
  yearlyData: YearlyDisasterData[];
  provinceData: ProvinceDisasterData[];
  typeDistribution: DisasterTypeDistribution[];
  stats: AggregatedStats;
  kpis: KPIData[];
  className?: string;
}

export interface OperationalDashboardProps {
  provinceData: ProvinceDisasterData[];
  yearlyData: YearlyDisasterData[];
  className?: string;
}

export interface AnalyticalDashboardProps {
  yearlyData: YearlyDisasterData[];
  provinceData: ProvinceDisasterData[];
  typeDistribution: DisasterTypeDistribution[];
  filter: DashboardFilter;
  className?: string;
}

export interface StrategicDashboardProps {
  yearlyData: YearlyDisasterData[];
  monthlyData: MonthlyDisasterData[];
  provinceData: ProvinceDisasterData[];
  stats: AggregatedStats;
  className?: string;
}

export interface ProvinceDetailProps {
  province: ProvinceDisasterData;
  yearlyData: YearlyDisasterData[];
  onBack: () => void;
  className?: string;
}

// Chart props
export interface GlassChartProps {
  data: unknown[];
  title?: string;
  titleVi?: string;
  height?: number;
  className?: string;
}

export interface GlassAreaChartProps extends GlassChartProps {
  data: TimeSeriesDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  gradientId?: string;
  showGrid?: boolean;
  showDots?: boolean;
  annotation?: { year: number; label: string };
}

export interface GlassBarChartProps extends GlassChartProps {
  data: BarChartDataPoint[];
  layout?: "vertical" | "horizontal";
  xKey: string;
  yKey: string;
  showGrid?: boolean;
  showLabel?: boolean;
}

export interface GlassPieChartProps extends GlassChartProps {
  data: PieChartDataPoint[];
  innerRadius?: number;
  outerRadius?: number;
  showLabel?: boolean;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export interface GlassScatterChartProps extends GlassChartProps {
  data: BubbleChartDataPoint[];
  xKey: string;
  yKey: string;
  zKey: string;
  showGrid?: boolean;
}

export interface GlassTreemapProps extends GlassChartProps {
  data: TreemapDataPoint[];
}

export interface GlassHeatmapProps extends GlassChartProps {
  data: HeatmapDataPoint[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: [string, string];
}

export interface GlassGaugeProps {
  data: GaugeData;
  title?: string;
  titleVi?: string;
  height?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export interface ProvinceChoroplethProps {
  provinceData: ProvinceDisasterData[];
  selectedProvince: string | null;
  onProvinceSelect: (province: string | null) => void;
  metric: "deaths" | "damage" | "events" | "risk";
  className?: string;
}
