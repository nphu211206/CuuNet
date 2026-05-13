import type { DisasterType, SeverityLevel, WeatherData } from "@/lib/types";
import type { RiskScore, RiskFactors, ProvinceRisk } from "./types";
import { getSeasonalMultiplier, MONTH_NAMES } from "./seasonal-data";
import {
  getBaseFrequency,
  getExposure,
  getVulnerability,
  getGeographicFactor,
  getWeatherModifier,
  getAllProvinces,
} from "./geo-risk";
import { DISASTER_CONFIG } from "../config/predict-config";

// === Core Risk Calculation ===

/**
 * Convert numeric score to severity level.
 */
export function scoreToLevel(score: number): SeverityLevel {
  if (score >= 0.80) return "critical";
  if (score >= 0.60) return "high";
  if (score >= 0.35) return "medium";
  return "low";
}

/**
 * Get risk level label in Vietnamese.
 */
export function getRiskLevelLabel(level: SeverityLevel): string {
  const labels: Record<SeverityLevel, string> = {
    critical: "Nghiêm trọng",
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };
  return labels[level];
}

/**
 * Calculate risk score for a specific province, disaster type, and month.
 * Uses INFORM-inspired formula: Risk = f(Hazard, Exposure, Vulnerability, Weather)
 *
 * Weights: Hazard 40%, Exposure 30%, Vulnerability 30%
 */
export function calculateRiskScore(
  province: string,
  type: DisasterType,
  month: number,
  weather?: WeatherData,
  scenarioModifier: number = 1.0
): RiskScore {
  const base = getBaseFrequency(province, type);
  const seasonal = getSeasonalMultiplier(type, month);
  const exposure = getExposure(province);
  const vulnerability = getVulnerability(province);
  const geoBoost = getGeographicFactor(province, type);
  const weatherMod = weather ? getWeatherModifier(weather, type) : 1.0;

  // Hazard = base frequency × seasonal × geographic boost
  const hazard = base * seasonal * geoBoost;

  // INFORM formula: weighted combination
  const rawScore = hazard * 0.4 + exposure * 0.3 + vulnerability * 0.3;

  // Apply weather modifier and scenario modifier
  const finalScore = Math.min(1, Math.max(0, rawScore * weatherMod * scenarioModifier));

  const factors: RiskFactors = { hazard, exposure, vulnerability, weatherMod };
  const explanation = generateExplanation(province, type, month, finalScore, factors);

  return {
    score: finalScore,
    level: scoreToLevel(finalScore),
    factors,
    explanation,
  };
}

/**
 * Generate Vietnamese explanation for a risk score.
 */
function generateExplanation(
  province: string,
  type: DisasterType,
  month: number,
  score: number,
  factors: RiskFactors
): string {
  const level = scoreToLevel(score);
  const levelLabel = getRiskLevelLabel(level);
  const typeName = DISASTER_CONFIG[type]?.label ?? type;
  const monthName = MONTH_NAMES[month];

  const reasons: string[] = [];

  // Seasonal factor
  const seasonal = getSeasonalMultiplier(type, month);
  if (seasonal >= 0.7) {
    reasons.push(`${monthName} là mùa cao điểm ${typeName.toLowerCase()} (hệ số: ${seasonal.toFixed(2)})`);
  } else if (seasonal >= 0.4) {
    reasons.push(`${monthName} có nguy cơ ${typeName.toLowerCase()} trung bình (hệ số: ${seasonal.toFixed(2)})`);
  }

  // Geographic factor
  if (factors.hazard > 0.6) {
    reasons.push(`${province} có lịch sử thiên tai cao`);
  }

  // Exposure
  if (factors.exposure > 0.6) {
    reasons.push("Khu vực đông dân cư, mức phơi nhiễm cao");
  }

  // Vulnerability
  if (factors.vulnerability > 0.6) {
    reasons.push("Cơ sở hạ tầng hạn chế, tính dễ bị tổn thương cao");
  }

  // Weather
  if (factors.weatherMod > 1.1) {
    reasons.push("Điều kiện thời tiết hiện tại làm tăng rủi ro");
  } else if (factors.weatherMod < 0.9) {
    reasons.push("Điều kiện thời tiết hiện tại làm giảm rủi ro");
  }

  if (reasons.length === 0) {
    reasons.push("Các yếu tố rủi ro ở mức trung bình");
  }

  return `${province} có rủi ro ${typeName} ${levelLabel.toLowerCase()} (${(score * 100).toFixed(0)}%) vì: ${reasons.join("; ")}.`;
}

/**
 * Calculate overall risk for a province (average across all disaster types).
 */
export function calculateProvinceOverallRisk(
  province: string,
  month: number,
  weather?: WeatherData,
  scenarioModifier: number = 1.0
): ProvinceRisk {
  const types: DisasterType[] = ["flood", "storm", "landslide", "drought", "earthquake", "tsunami"];

  const risks = {} as Record<DisasterType, RiskScore>;
  let totalScore = 0;
  let highestScore = 0;
  let topThreat: DisasterType = "flood";

  for (const type of types) {
    const risk = calculateRiskScore(province, type, month, weather, scenarioModifier);
    risks[type] = risk;
    totalScore += risk.score;
    if (risk.score > highestScore) {
      highestScore = risk.score;
      topThreat = type;
    }
  }

  const overallRisk = totalScore / types.length;

  // Determine trend based on seasonal comparison
  const prevMonth = (month + 11) % 12;
  const nextMonth = (month + 1) % 12;
  const prevScore = calculateRiskScore(province, topThreat, prevMonth, undefined, scenarioModifier).score;
  const nextScore = calculateRiskScore(province, topThreat, nextMonth, undefined, scenarioModifier).score;

  let trend: "increasing" | "stable" | "decreasing";
  if (nextScore > overallRisk + 0.05) trend = "increasing";
  else if (nextScore < overallRisk - 0.05) trend = "decreasing";
  else trend = "stable";

  return { province, risks, overallRisk, topThreat, trend };
}

/**
 * Calculate risk scores for all provinces.
 */
export function calculateAllProvinceRisks(
  month: number,
  weather?: WeatherData,
  scenarioModifier: number = 1.0
): Map<string, ProvinceRisk> {
  const provinces = getAllProvinces();
  const result = new Map<string, ProvinceRisk>();

  for (const province of provinces) {
    result.set(province, calculateProvinceOverallRisk(province, month, weather, scenarioModifier));
  }

  return result;
}

/**
 * Get provinces sorted by risk (highest first).
 */
export function getProvincesByRisk(
  risks: Map<string, ProvinceRisk>,
  limit?: number
): ProvinceRisk[] {
  const sorted = Array.from(risks.values()).sort((a, b) => b.overallRisk - a.overallRisk);
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Get provinces that exceed a risk threshold.
 */
export function getHighRiskProvinces(
  risks: Map<string, ProvinceRisk>,
  threshold: number = 0.6
): ProvinceRisk[] {
  return Array.from(risks.values()).filter((r) => r.overallRisk >= threshold);
}

/**
 * Get risk color for visualization.
 */
export function getRiskColor(score: number): string {
  if (score >= 0.80) return "#EF4444"; // red
  if (score >= 0.60) return "#F97316"; // orange
  if (score >= 0.35) return "#EAB308"; // yellow
  return "#22C55E"; // green
}

/**
 * Get risk color with alpha for map overlays.
 */
export function getRiskColorAlpha(score: number, alpha: number = 0.6): string {
  if (score >= 0.80) return `rgba(239, 68, 68, ${alpha})`;
  if (score >= 0.60) return `rgba(249, 115, 22, ${alpha})`;
  if (score >= 0.35) return `rgba(234, 179, 8, ${alpha})`;
  return `rgba(34, 197, 94, ${alpha})`;
}
