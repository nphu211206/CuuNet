import type { DisasterType, SeverityLevel } from "@/lib/types";

// === RISK SCORING ===

export interface RiskFactors {
  hazard: number;       // BaseFrequency × SeasonalMultiplier
  exposure: number;     // Population density normalized
  vulnerability: number; // 1 - ResilienceIndex
  weatherMod: number;   // Weather condition modifier
}

export interface RiskScore {
  score: number;           // 0-1
  level: SeverityLevel;
  factors: RiskFactors;
  explanation: string;     // Vietnamese explanation
}

export interface ProvinceRisk {
  province: string;
  risks: Record<DisasterType, RiskScore>;
  overallRisk: number;     // Average of all types
  topThreat: DisasterType;
  trend: "increasing" | "stable" | "decreasing";
}

// === PREDICTION ===

export interface TimeSeriesPoint {
  month: string;           // "Thg 1 2025"
  actual?: number;         // Historical data (if available)
  predicted: number;       // Predicted value
  lower: number;           // 95% confidence lower bound
  upper: number;           // 95% confidence upper bound
}

export interface PredictionResult {
  province: string;
  disasterType: DisasterType;
  historicalData: number[];      // Past 12 months
  predictions: TimeSeriesPoint[]; // Next 6 months
  trend: "increasing" | "stable" | "decreasing";
  confidence: number;            // 0-1
  strategy: string;              // Which algorithm was used
}

// === SCENARIOS ===

export interface Scenario {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  modifiers: Record<DisasterType, number>;
  scientificBasis: string;
}

// === EXTERNAL DATA ===

export interface ExternalAlert {
  id: string;
  source: "reliefweb" | "gdacs" | "usgs";
  title: string;
  type: DisasterType;
  severity: SeverityLevel;
  date: string;
  lat?: number;
  lng?: number;
  url?: string;
}

export interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  lat: number;
  lng: number;
  depth: number;
}

// === SEASONAL ===

export interface SeasonalData {
  month: number;           // 0-11
  monthName: string;       // "Tháng 1"
  disasterType: DisasterType;
  multiplier: number;      // 0-1
  description: string;     // Vietnamese description
}

// === STRATEGY PATTERN ===

export interface PredictionStrategy {
  name: string;
  predict(historicalData: number[], months: number): TimeSeriesPoint[];
  getConfidence(): number;
}

// === STATE MANAGEMENT ===

export interface PredictionState {
  selectedProvince: string | null;
  selectedMonth: number;        // 0-11
  selectedScenario: string;     // scenario id
  riskScores: Map<string, ProvinceRisk>;
  predictions: Map<string, PredictionResult>;
  externalAlerts: ExternalAlert[];
  isLoading: boolean;
  error: string | null;
}

export type PredictionAction =
  | { type: "SET_PROVINCE"; payload: string | null }
  | { type: "SET_MONTH"; payload: number }
  | { type: "SET_SCENARIO"; payload: string }
  | { type: "SET_RISK_SCORES"; payload: Map<string, ProvinceRisk> }
  | { type: "SET_PREDICTIONS"; payload: Map<string, PredictionResult> }
  | { type: "SET_ALERTS"; payload: ExternalAlert[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_PROVINCE_RISK"; payload: ProvinceRisk };

// === COMPONENT PROPS ===

export interface RiskGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showLevel?: boolean;
  animated?: boolean;
  className?: string;
}

export interface TrendChartProps {
  data: TimeSeriesPoint[];
  disasterType: DisasterType;
  height?: number;
  showConfidence?: boolean;
}

export interface SeasonalCalendarProps {
  province: string;
  selectedMonth?: number;
  onMonthSelect?: (month: number) => void;
}

export interface ScenarioPanelProps {
  activeScenario: string;
  onScenarioChange: (scenarioId: string) => void;
  comparisonData?: { normal: number; current: number };
}

export interface ProvinceRiskCardProps {
  provinceRisk: ProvinceRisk;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export interface ExplanationPanelProps {
  riskScore: RiskScore;
  disasterType: DisasterType;
  province: string;
}
