"use client";

// =============================================================================
// TRIAGE ENGINE - Priority Scoring Algorithm
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Implements 3 triage methods:
//   1. START Triage (Simple Triage and Rapid Treatment) - 1983, Newport Beach CA
//   2. SALT Triage (Sort, Assess, Lifesaving interventions, Treatment/Transport) - CDC 2006/2021
//   3. Custom Weighted Scoring (CứuNet innovation) - 4-factor weighted algorithm
//
// Scoring Formula:
//   TriageScore = (Severity × 0.40) + (Population × 0.30) + (Accessibility × 0.20) + (Urgency × 0.10)
//
// XAI-lite: Every score includes a Vietnamese-language explanation of WHY
// =============================================================================

import type {
  RescueSOSRequest,
  TriageMethod,
  TriageColor,
  TriageBreakdown,
  SOSEmergencyLevel,
  STARTAssessment,
  SALTAssessment,
  IncidentType,
  IncidentPriority,
} from "./types";

import {
  RESCUE_CONFIG,
  TRIAGE_WEIGHTS,
  ACCESSIBILITY_SCORES,
  POPULATION_LOG_SCALE,
  URGENCY_TIME_SCALE,
  INCIDENT_TYPE_CONFIG,
} from "../config/rescue-config";

// =============================================================================
// 1. START TRIAGE ALGORITHM
// =============================================================================

/**
 * START Triage Decision Tree
 * Simple Triage and Rapid Treatment - developed 1983 by Newport Beach Fire Department
 *
 * Decision flow:
 *   1. Can patient walk? → GREEN (Minor)
 *   2. Is patient breathing?
 *      - No → Open airway → Still no → BLACK (Expectant)
 *      - No → Open airway → Now breathing → RED (Immediate)
 *      - Yes, rate > 30/min → RED (Immediate)
 *      - Yes, rate ≤ 30/min → Continue
 *   3. Assess circulation (radial pulse / capillary refill)
 *      - No pulse OR refill > 2s → RED (Immediate)
 *      - Pulse OK, refill ≤ 2s → Continue
 *   4. Assess mental status
 *      - Cannot follow commands → RED (Immediate)
 *      - Follows commands → YELLOW (Delayed)
 *
 * Time per patient: < 60 seconds
 */
export function assessSTART(assessment: STARTAssessment): {
  color: TriageColor;
  score: number;
  explanation: string;
} {
  // Step 1: Can the patient walk?
  if (assessment.canWalk) {
    return {
      color: "green",
      score: 25,
      explanation: "Bệnh nhân ĐI ĐƯỢC → XANH (Minor): Thương nhẹ, có thể tự di chuyển đến khu điều trị.",
    };
  }

  // Step 2: Is the patient breathing?
  if (!assessment.isBreathing) {
    // Try to open airway - assume done
    // Still not breathing → BLACK (Expectant)
    return {
      color: "black",
      score: 0,
      explanation: "Bệnh nhân KHÔNG THỞ → ĐEN (Expectant): Không thở sau khi mở đường thở. Tử vong hoặc thương tích không thể cứu.",
    };
  }

  // Breathing but rate check
  if (assessment.breathingRate !== undefined && assessment.breathingRate > 30) {
    return {
      color: "red",
      score: 95,
      explanation: `Thở bất thường (${assessment.breathingRate}/phút > 30) → ĐỎ (Immediate): Nguy hiểm tính mạng, cần can thiệp ngay.`,
    };
  }

  // Step 3: Assess circulation
  if (!assessment.hasRadialPulse) {
    return {
      color: "red",
      score: 90,
      explanation: "Không có mạch quay tay → ĐỎ (Immediate): Tuần hoàn kém, cần can thiệp ngay.",
    };
  }

  if (assessment.capillaryRefillSeconds !== undefined && assessment.capillaryRefillSeconds > 2) {
    return {
      color: "red",
      score: 85,
      explanation: `Nạp mao mạch ${assessment.capillaryRefillSeconds}s (> 2s) → ĐỎ (Immediate): Tuần hoàn ngoại vi kém.`,
    };
  }

  // Step 4: Assess mental status
  if (!assessment.followsCommands) {
    return {
      color: "red",
      score: 80,
      explanation: "Không làm theo lệnh đơn giản → ĐỎ (Immediate): Suy giảm ý thức, cần can thiệp ngay.",
    };
  }

  // All checks passed → YELLOW (Delayed)
  return {
    color: "yellow",
    score: 50,
    explanation: "Thở bình thường, có mạch, làm theo lệnh → VÀNG (Delayed): Nghiêm trọng nhưng có thể chờ điều trị.",
  };
}

// =============================================================================
// 2. SALT TRIAGE ALGORITHM
// =============================================================================

/**
 * SALT Triage - Sort, Assess, Lifesaving interventions, Treatment/Transport
 * Developed by CDC 2006, updated 2021
 *
 * Phase 1 - SORT (~30 seconds global sorting):
 *   - "If you can hear my voice and can walk, come to me now"
 *   - Still/Motionless → Obvious dead or severely injured
 *   - Moving → Can follow commands
 *   - Major hemorrhage → Identify those with obvious bleeding
 *
 * Phase 2 - ASSESS (individual):
 *   1. Massive hemorrhage? → Apply tourniquet → RED
 *   2. Not breathing? → Open airway → Still not → BLACK
 *   3. No pulse / in shock? → RED
 *   4. Cannot follow commands? → RED
 *   5. Follows commands → YELLOW
 *
 * Phase 3 - LIFESAVING INTERVENTIONS (< 5 min/patient):
 *   - Tourniquet, direct pressure, airway opening
 *   - NO CPR in mass casualty events
 *
 * Phase 4 - TREATMENT/TRANSPORT:
 *   - RED first, then YELLOW, then GREEN
 *   - BLACK: Comfort care, do not transport
 */
export function assessSALT(assessment: SALTAssessment): {
  color: TriageColor;
  score: number;
  explanation: string;
} {
  // Phase 2, Step 1: Massive hemorrhage?
  if (assessment.massiveHemorrhage) {
    return {
      color: "red",
      score: 100,
      explanation: "Chảy máu nhiều → ĐỎ (Immediate): Cần garo/ép trực tiếp ngay. Nguy hiểm tính mạng.",
    };
  }

  // Phase 2, Step 2: Is patient breathing?
  if (!assessment.isBreathing) {
    return {
      color: "black",
      score: 0,
      explanation: "Không thở → ĐEN (Expectant): Tử vong hoặc thương tích không thể cứu trong sự cố mass casualty.",
    };
  }

  // Phase 2, Step 3: Has pulse / not in shock?
  if (!assessment.hasPulse) {
    return {
      color: "red",
      score: 95,
      explanation: "Không có mạch → ĐỎ (Immediate): Sốc, cần can thiệp ngay.",
    };
  }

  // Phase 2, Step 4: Can follow commands?
  if (!assessment.followsCommands) {
    return {
      color: "red",
      score: 85,
      explanation: "Không làm theo lệnh → ĐỎ (Immediate): Suy giảm ý thức.",
    };
  }

  // Purposeful movements check
  if (!assessment.purposefulMovements) {
    return {
      color: "red",
      score: 80,
      explanation: "Không có cử động có mục đích → ĐỎ (Immediate): Cần đánh giá thêm.",
    };
  }

  // All checks passed → YELLOW (Delayed)
  return {
    color: "yellow",
    score: 50,
    explanation: "Thở, có mạch, làm theo lệnh → VÀNG (Delayed): Nghiêm trọng nhưng có thể chờ.",
  };
}

// =============================================================================
// 3. CUSTOM WEIGHTED SCORING ALGORITHM (CứuNet Innovation)
// =============================================================================

/**
 * Calculate severity score based on emergency level
 */
function calculateSeverityScore(severity: SOSEmergencyLevel): number {
  switch (severity) {
    case "life_threatening":
      return 100;
    case "urgent":
      return 75;
    case "need_help":
      return 50;
    default:
      return 50;
  }
}

/**
 * Calculate population score using logarithmic scale
 * More people = higher score, but with diminishing returns
 */
function calculatePopulationScore(count: number): number {
  if (count <= 0) return 0;

  // Find the appropriate range in the log scale
  for (let i = POPULATION_LOG_SCALE.length - 1; i >= 0; i--) {
    if (count >= POPULATION_LOG_SCALE[i].threshold) {
      // Interpolate within the range
      if (i === POPULATION_LOG_SCALE.length - 1) {
        return POPULATION_LOG_SCALE[i].score;
      }
      const lower = POPULATION_LOG_SCALE[i];
      const upper = POPULATION_LOG_SCALE[i + 1];
      const ratio = (count - lower.threshold) / (upper.threshold - lower.threshold);
      return Math.round(lower.score + ratio * (upper.score - lower.score));
    }
  }
  return POPULATION_LOG_SCALE[0].score;
}

/**
 * Calculate accessibility score based on terrain type
 * Higher score = easier to access = lower priority boost
 * Lower score = harder to access = higher priority boost
 */
function calculateAccessibilityScore(
  incidentType: IncidentType,
  province: string,
  isFloodZone: boolean,
  isMountainous: boolean
): number {
  // Base score from terrain
  let baseScore = 60; // Default rural

  if (isMountainous) {
    baseScore = ACCESSIBILITY_SCORES["mountainous"] || 35;
  } else if (isFloodZone) {
    baseScore = ACCESSIBILITY_SCORES["flood_zone"] || 15;
  } else if (province.includes("Hà Nội") || province.includes("TP.HCM") || province.includes("Hải Phòng")) {
    baseScore = ACCESSIBILITY_SCORES["urban"] || 95;
  } else {
    baseScore = ACCESSIBILITY_SCORES["rural"] || 60;
  }

  // Adjust based on incident type
  if (incidentType === "landslide") {
    baseScore = Math.max(10, baseScore - 30); // Landslides make areas much harder to access
  } else if (incidentType === "flood") {
    baseScore = Math.max(10, baseScore - 20); // Floods reduce accessibility
  } else if (incidentType === "tsunami") {
    baseScore = Math.max(5, baseScore - 40); // Tsunami devastates infrastructure
  }

  return Math.min(100, Math.max(0, baseScore));
}

/**
 * Calculate urgency score based on time elapsed since incident
 * Longer wait = higher urgency score
 */
function calculateUrgencyScore(hoursElapsed: number): number {
  if (hoursElapsed <= 0) return 0;

  for (let i = URGENCY_TIME_SCALE.length - 1; i >= 0; i--) {
    if (hoursElapsed >= URGENCY_TIME_SCALE[i].hours) {
      if (i === URGENCY_TIME_SCALE.length - 1) {
        return URGENCY_TIME_SCALE[i].score;
      }
      const lower = URGENCY_TIME_SCALE[i];
      const upper = URGENCY_TIME_SCALE[i + 1];
      const ratio = (hoursElapsed - lower.hours) / (upper.hours - lower.hours);
      return Math.round(lower.score + ratio * (upper.score - lower.score));
    }
  }
  return URGENCY_TIME_SCALE[0].score;
}

/**
 * Generate XAI-lite explanation in Vietnamese
 * Explains WHY the score was given, not just what the score is
 */
function generateExplanation(
  priority: IncidentPriority,
  severityScore: number,
  populationScore: number,
  accessibilityScore: number,
  urgencyScore: number,
  peopleCount: number,
  severity: SOSEmergencyLevel,
  isMountainous: boolean,
  isFloodZone: boolean,
  hoursElapsed: number
): string {
  const severityVi =
    severity === "life_threatening"
      ? "nguy hiểm tính mạng"
      : severity === "urgent"
        ? "khẩn cấp"
        : "cần giúp đỡ";

  const priorityVi =
    priority === "P1"
      ? "Khẩn cấp"
      : priority === "P2"
        ? "Gấp"
        : priority === "P3"
          ? "Tiêu chuẩn"
          : "Thấp";

  const accessDesc = isMountainous
    ? "miền núi khó tiếp cận"
    : isFloodZone
      ? "vùng ngập lụt"
      : "khu vực có thể tiếp cận";

  const timeDesc =
    hoursElapsed > 12
      ? "thời gian chờ đợi rất lâu"
      : hoursElapsed > 6
        ? "thời gian chờ đợi lâu"
        : hoursElapsed > 3
          ? "thời gian chờ đợi đáng kể"
          : "thời gian chờ đợi ngắn";

  return `Ưu tiên ${priority} (${priorityVi}): Mức độ nghiêm trọng: ${severityVi}, ${peopleCount} người có nguy cơ, ${accessDesc}, ${timeDesc}. Điểm: Mức độ=${severityScore}, Số người=${populationScore}, Tiếp cận=${accessibilityScore}, Khẩn cấp=${urgencyScore}.`;
}

/**
 * Custom weighted scoring algorithm
 *
 * TriageScore = (Severity × 0.40) + (Population × 0.30) + (Accessibility × 0.20) + (Urgency × 0.10)
 *
 * @param sos - SOS request to triage
 * @param hoursElapsed - Hours since the incident started
 * @param isFloodZone - Whether the location is in a flood zone
 * @param isMountainous - Whether the location is mountainous
 */
export function calculateCustomTriageScore(
  sos: RescueSOSRequest,
  hoursElapsed: number,
  isFloodZone: boolean = false,
  isMountainous: boolean = false
): {
  color: TriageColor;
  score: number;
  breakdown: TriageBreakdown;
  explanation: string;
} {
  // Calculate individual factor scores
  const severityScore = calculateSeverityScore(sos.situation.severity);
  const populationScore = calculatePopulationScore(sos.situation.peopleCount);
  const accessibilityScore = calculateAccessibilityScore(
    sos.situation.type,
    sos.location.province,
    isFloodZone,
    isMountainous
  );
  const urgencyScore = calculateUrgencyScore(hoursElapsed);

  // Apply weights
  const weightedSeverity = severityScore * TRIAGE_WEIGHTS.severity;
  const weightedPopulation = populationScore * TRIAGE_WEIGHTS.population;
  const weightedAccessibility = accessibilityScore * TRIAGE_WEIGHTS.accessibility;
  const weightedUrgency = urgencyScore * TRIAGE_WEIGHTS.urgency;

  // Calculate total score
  const totalScore = Math.round(
    weightedSeverity + weightedPopulation + weightedAccessibility + weightedUrgency
  );

  // Determine priority and color
  let priority: IncidentPriority;
  let color: TriageColor;

  if (totalScore >= RESCUE_CONFIG.TRIAGE_SCORE_P1) {
    priority = "P1";
    color = "red";
  } else if (totalScore >= RESCUE_CONFIG.TRIAGE_SCORE_P2) {
    priority = "P2";
    color = "yellow";
  } else if (totalScore >= RESCUE_CONFIG.TRIAGE_SCORE_P3) {
    priority = "P3";
    color = "green";
  } else {
    priority = "P4";
    color = "green";
  }

  // Generate explanation
  const explanation = generateExplanation(
    priority,
    severityScore,
    populationScore,
    accessibilityScore,
    urgencyScore,
    sos.situation.peopleCount,
    sos.situation.severity,
    isMountainous,
    isFloodZone,
    hoursElapsed
  );

  return {
    color,
    score: totalScore,
    breakdown: {
      severityScore,
      severityWeight: TRIAGE_WEIGHTS.severity,
      populationScore,
      populationWeight: TRIAGE_WEIGHTS.population,
      accessibilityScore,
      accessibilityWeight: TRIAGE_WEIGHTS.accessibility,
      urgencyScore,
      urgencyWeight: TRIAGE_WEIGHTS.urgency,
      totalScore,
    },
    explanation,
  };
}

// =============================================================================
// 4. UNIFIED TRIAGE FUNCTION
// =============================================================================

/**
 * Main triage function that dispatches to the appropriate method
 *
 * @param sos - SOS request to triage
 * @param method - Triage method to use (START, SALT, or Custom)
 * @param hoursElapsed - Hours since incident (for Custom method)
 * @param startAssessment - START assessment data (for START method)
 * @param saltAssessment - SALT assessment data (for SALT method)
 * @param isFloodZone - Whether location is flood zone (for Custom method)
 * @param isMountainous - Whether location is mountainous (for Custom method)
 */
export function triageSOS(
  sos: RescueSOSRequest,
  method: TriageMethod = "custom",
  hoursElapsed: number = 1,
  startAssessment?: STARTAssessment,
  saltAssessment?: SALTAssessment,
  isFloodZone: boolean = false,
  isMountainous: boolean = false
): {
  color: TriageColor;
  score: number;
  breakdown: TriageBreakdown;
  explanation: string;
  method: TriageMethod;
} {
  switch (method) {
    case "start": {
      if (!startAssessment) {
        // Fallback: infer from SOS data
        startAssessment = inferSTARTFromSOS(sos);
      }
      const result = assessSTART(startAssessment);
      return {
        ...result,
        breakdown: {
          severityScore: result.score,
          severityWeight: 1.0,
          populationScore: 0,
          populationWeight: 0,
          accessibilityScore: 0,
          accessibilityWeight: 0,
          urgencyScore: 0,
          urgencyWeight: 0,
          totalScore: result.score,
        },
        method: "start",
      };
    }

    case "salt": {
      if (!saltAssessment) {
        saltAssessment = inferSALTFromSOS(sos);
      }
      const result = assessSALT(saltAssessment);
      return {
        ...result,
        breakdown: {
          severityScore: result.score,
          severityWeight: 1.0,
          populationScore: 0,
          populationWeight: 0,
          accessibilityScore: 0,
          accessibilityWeight: 0,
          urgencyScore: 0,
          urgencyWeight: 0,
          totalScore: result.score,
        },
        method: "salt",
      };
    }

    case "custom":
    default: {
      const result = calculateCustomTriageScore(sos, hoursElapsed, isFloodZone, isMountainous);
      return { ...result, method: "custom" };
    }
  }
}

// =============================================================================
// 5. INFERENCE HELPERS (convert SOS data to START/SALT assessments)
// =============================================================================

/**
 * Infer START assessment from SOS request data
 * Used when explicit assessment data is not available
 */
function inferSTARTFromSOS(sos: RescueSOSRequest): STARTAssessment {
  const isLifeThreatening = sos.situation.severity === "life_threatening";
  const isTrapped = sos.situation.isTrapped;
  const needsMedical = sos.situation.needsMedical;
  const hasChildren = sos.situation.hasChildren;
  const hasElderly = sos.situation.hasElderly;

  // Infer breathing status
  const isBreathing = !isLifeThreatening || sos.situation.peopleCount > 0;

  // Infer walking ability
  const canWalk = !isTrapped && !isLifeThreatening && !needsMedical;

  // Infer mental status
  const followsCommands = !isLifeThreatening || (!isTrapped && !needsMedical);

  // Infer circulation
  const hasRadialPulse = !isLifeThreatening || needsMedical;

  // Estimate breathing rate
  let breathingRate: number | undefined;
  if (isLifeThreatening) {
    breathingRate = 35; // Elevated
  } else if (needsMedical) {
    breathingRate = 24; // Slightly elevated
  } else {
    breathingRate = 18; // Normal
  }

  // Estimate capillary refill
  let capillaryRefillSeconds: number | undefined;
  if (isLifeThreatening) {
    capillaryRefillSeconds = 3; // Poor
  } else if (needsMedical) {
    capillaryRefillSeconds = 2; // Borderline
  } else {
    capillaryRefillSeconds = 1; // Normal
  }

  return {
    canWalk,
    isBreathing,
    breathingRate,
    hasRadialPulse,
    capillaryRefillSeconds,
    followsCommands,
  };
}

/**
 * Infer SALT assessment from SOS request data
 * Used when explicit assessment data is not available
 */
function inferSALTFromSOS(sos: RescueSOSRequest): SALTAssessment {
  const isLifeThreatening = sos.situation.severity === "life_threatening";
  const isTrapped = sos.situation.isTrapped;
  const needsMedical = sos.situation.needsMedical;

  return {
    massiveHemorrhage: isLifeThreatening && needsMedical,
    isBreathing: !isLifeThreatening || sos.situation.peopleCount > 0,
    hasPulse: !isLifeThreatening || needsMedical,
    followsCommands: !isLifeThreatening || (!isTrapped && !needsMedical),
    purposefulMovements: !isTrapped && !isLifeThreatening,
  };
}

// =============================================================================
// 6. BATCH TRIAGE
// =============================================================================

/**
 * Triage multiple SOS requests at once
 * Returns sorted by score (highest first = most urgent)
 */
export function batchTriage(
  requests: RescueSOSRequest[],
  method: TriageMethod = "custom",
  incidentStartTime?: string,
  floodZones: string[] = [],
  mountainousProvinces: string[] = []
): Array<RescueSOSRequest & { triageResult: ReturnType<typeof triageSOS> }> {
  const now = Date.now();

  return requests
    .map((sos) => {
      // Calculate hours elapsed
      const createdAt = new Date(sos.createdAt).getTime();
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

      // Check if location is in flood zone or mountainous area
      const isFloodZone = floodZones.some(
        (zone) => sos.location.province.includes(zone) || sos.location.district.includes(zone)
      );
      const isMountainous = mountainousProvinces.some(
        (prov) => sos.location.province.includes(prov)
      );

      const triageResult = triageSOS(
        sos,
        method,
        hoursElapsed,
        undefined,
        undefined,
        isFloodZone,
        isMountainous
      );

      return { ...sos, triageResult };
    })
    .sort((a, b) => b.triageResult.score - a.triageResult.score);
}

// =============================================================================
// 7. TRIAGE COLOR UTILITIES
// =============================================================================

/**
 * Get priority from triage score
 */
export function getPriorityFromScore(score: number): IncidentPriority {
  if (score >= RESCUE_CONFIG.TRIAGE_SCORE_P1) return "P1";
  if (score >= RESCUE_CONFIG.TRIAGE_SCORE_P2) return "P2";
  if (score >= RESCUE_CONFIG.TRIAGE_SCORE_P3) return "P3";
  return "P4";
}

/**
 * Get triage color from score
 */
export function getColorFromScore(score: number): TriageColor {
  if (score >= RESCUE_CONFIG.TRIAGE_SCORE_P1) return "red";
  if (score >= RESCUE_CONFIG.TRIAGE_SCORE_P2) return "yellow";
  if (score >= RESCUE_CONFIG.TRIAGE_SCORE_P3) return "green";
  return "green";
}

/**
 * Get required capabilities from incident type
 */
export function getRequiredCapabilities(incidentType: IncidentType): string[] {
  const config = INCIDENT_TYPE_CONFIG[incidentType];
  return config?.requiredCapabilities || ["search_rescue"];
}

/**
 * Estimate triage category distribution for a set of SOS requests
 */
export function estimateTriageDistribution(requests: RescueSOSRequest[]): {
  red: number;
  yellow: number;
  green: number;
  black: number;
  total: number;
} {
  const distribution = { red: 0, yellow: 0, green: 0, black: 0, total: requests.length };

  for (const sos of requests) {
    const color = sos.triage.color;
    if (color in distribution) {
      distribution[color]++;
    }
  }

  return distribution;
}
