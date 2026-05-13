"use client";

import type {
  Alert,
  AlertSeverity,
  AlertUrgency,
  RelevanceFactors,
  RelevanceResult,
  AlertUserPreferences,
  SOSRequest,
} from "./types";

import {
  RELEVANCE_CONFIG,
  ALERT_SEVERITY_CONFIG,
  VIETNAM_BOUNDS,
} from "../config/alert-config";

// =============================================================================
// RELEVANCE ENGINE
// AI-Powered Alert Relevance Scoring System
// Inspired by: FEMA IPAWS, Google Public Alerts, Alert Fatigue Research
//
// Purpose: Reduce "alert fatigue" by scoring how relevant each alert is
// to a specific user based on 5 factors:
//   1. Distance (40%) - How close the user is to the alert zone
//   2. Severity (25%) - How dangerous the alert is
//   3. Vulnerability (20%) - User's risk profile
//   4. Preference (10%) - User's subscribed types/provinces
//   5. Urgency (5%) - How soon the threat will occur
//
// Features:
//   - Point-in-polygon check (simplified bounding box)
//   - Haversine distance calculation
//   - Deduplication by event+area+severity
//   - Severity-based threshold filtering
//   - Quiet hours awareness
//   - Max alerts per day throttling
// =============================================================================

// ---------------------------------------------------------------------------
// 1. DISTANCE CALCULATION - Haversine Formula
// ---------------------------------------------------------------------------

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 *
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ---------------------------------------------------------------------------
// 2. GEO-TARGETING - Point-in-Region Check
// ---------------------------------------------------------------------------

/**
 * Check if a user location is within an alert's affected area
 * Uses simplified bounding box + circle check
 *
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param alert - The alert to check against
 * @returns Object with isInside flag and distance to center
 */
export function checkGeoTarget(
  userLat: number,
  userLng: number,
  alert: Alert
): { isInside: boolean; distanceKm: number; nearestProvince: string | null } {
  const { area } = alert.info;

  // Check circle area first (most common)
  if (area.circle) {
    const distance = haversineDistance(
      userLat,
      userLng,
      area.circle.lat,
      area.circle.lng
    );
    const isInside = distance <= area.circle.radiusKm;

    // Find nearest province from the alert's province list
    let nearestProvince: string | null = null;
    let minDist = Infinity;
    for (const province of area.provinces) {
      // We'd need province coords here - simplified to check first province
      nearestProvince = province;
      break;
    }

    return { isInside, distanceKm: distance, nearestProvince };
  }

  // Check polygon area (simplified bounding box)
  if (area.polygon) {
    const coords = area.polygon.coordinates[0];
    if (coords && coords.length > 0) {
      const lats = coords.map((c) => c[1]);
      const lngs = coords.map((c) => c[0]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const isInside =
        userLat >= minLat &&
        userLat <= maxLat &&
        userLng >= minLng &&
        userLng <= maxLng;

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const distance = haversineDistance(userLat, userLng, centerLat, centerLng);

      return {
        isInside,
        distanceKm: distance,
        nearestProvince: area.provinces[0] || null,
      };
    }
  }

  // Fallback: check by province name (if user's province is in alert's provinces)
  // This requires knowing the user's province - handled at a higher level
  return { isInside: false, distanceKm: 999, nearestProvince: null };
}

// ---------------------------------------------------------------------------
// 3. DISTANCE SCORING
// ---------------------------------------------------------------------------

/**
 * Calculate distance-based relevance score
 * Closer = higher score
 *
 * @param distanceKm - Distance to alert center in km
 * @param isInside - Whether user is inside the alert zone
 * @returns Score from 0 to 40 (max weight)
 */
export function calculateDistanceScore(distanceKm: number, isInside: boolean): number {
  const { DISTANCE_TIERS } = RELEVANCE_CONFIG;

  if (isInside) return DISTANCE_TIERS.inside.score;
  if (distanceKm <= 20) return DISTANCE_TIERS.within20km.score;
  if (distanceKm <= 50) return DISTANCE_TIERS.within50km.score;
  if (distanceKm <= 100) return DISTANCE_TIERS.within100km.score;
  return DISTANCE_TIERS.beyond.score;
}

// ---------------------------------------------------------------------------
// 4. SEVERITY SCORING
// ---------------------------------------------------------------------------

/**
 * Calculate severity-based relevance score
 * More severe = higher score
 *
 * @param severity - Alert severity level
 * @returns Score from 0 to 25 (max weight)
 */
export function calculateSeverityScore(severity: AlertSeverity): number {
  return RELEVANCE_CONFIG.SEVERITY_SCORES[severity] || 0;
}

// ---------------------------------------------------------------------------
// 5. VULNERABILITY SCORING
// ---------------------------------------------------------------------------

/**
 * Province vulnerability data (based on historical disaster impact)
 * Higher = more vulnerable
 */
const PROVINCE_VULNERABILITY: Record<string, number> = {
  "Quảng Bình": 0.92,
  "Lào Cai": 0.88,
  "Yên Bái": 0.85,
  "Quảng Nam": 0.82,
  "Huế": 0.80,
  "An Giang": 0.75,
  "Bến Tre": 0.72,
  "Trà Vinh": 0.70,
  "Cần Thơ": 0.68,
  "Đà Nẵng": 0.65,
  "Nha Trang": 0.62,
  "Hải Phòng": 0.58,
  "Đà Lạt": 0.55,
  "Hồ Chí Minh": 0.45,
  "Hà Nội": 0.40,
};

/**
 * Calculate vulnerability-based relevance score
 * Considers: province vulnerability, user profile (elderly, children, etc.)
 *
 * @param province - User's province
 * @param hasChildren - Whether user has children
 * @param hasElderly - Whether user has elderly family members
 * @returns Score from 0 to 20 (max weight)
 */
export function calculateVulnerabilityScore(
  province: string,
  hasChildren: boolean = false,
  hasElderly: boolean = false
): number {
  const baseVulnerability = PROVINCE_VULNERABILITY[province] || 0.5;

  // Bonus for vulnerable household members
  let bonus = 0;
  if (hasChildren) bonus += 0.15;
  if (hasElderly) bonus += 0.15;

  const totalVulnerability = Math.min(1, baseVulnerability + bonus);

  // Scale to 0-20
  return Math.round(totalVulnerability * RELEVANCE_CONFIG.WEIGHTS.vulnerability * 100);
}

// ---------------------------------------------------------------------------
// 6. PREFERENCE SCORING
// ---------------------------------------------------------------------------

/**
 * Calculate preference-based relevance score
 * Matches user's subscribed types and provinces
 *
 * @param alertType - The disaster type of the alert
 * @param alertProvinces - The affected provinces
 * @param preferences - User's preferences
 * @returns Score from 0 to 10 (max weight)
 */
export function calculatePreferenceScore(
  alertType: string,
  alertProvinces: string[],
  preferences: AlertUserPreferences
): number {
  let score = 0;

  // Type match
  const typeMatch = preferences.subscribedTypes.some((t) => t === alertType);
  if (typeMatch) score += 5;

  // Province match
  const provinceMatch = alertProvinces.some((p) =>
    preferences.subscribedProvinces.includes(p)
  );
  if (provinceMatch) score += 5;

  return Math.min(score, 10);
}

// ---------------------------------------------------------------------------
// 7. URGENCY SCORING
// ---------------------------------------------------------------------------

/**
 * Calculate urgency-based relevance score
 * More imminent = higher score
 *
 * @param urgency - Alert urgency level
 * @returns Score from 0 to 5 (max weight)
 */
export function calculateUrgencyScore(urgency: AlertUrgency): number {
  return RELEVANCE_CONFIG.URGENCY_SCORES[urgency] || 0;
}

// ---------------------------------------------------------------------------
// 8. MAIN RELEVANCE CALCULATION
// ---------------------------------------------------------------------------

/**
 * Calculate the total relevance score for an alert relative to a user
 * This is the main entry point for the relevance engine
 *
 * @param alert - The alert to score
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param userProvince - User's province (optional, for vulnerability)
 * @param preferences - User's alert preferences
 * @param userHasChildren - Whether user has children
 * @param userHasElderly - Whether user has elderly family
 * @returns RelevanceResult with score, factors, and notification decision
 */
export function calculateRelevance(
  alert: Alert,
  userLat: number,
  userLng: number,
  userProvince: string,
  preferences: AlertUserPreferences,
  userHasChildren: boolean = false,
  userHasElderly: boolean = false
): RelevanceResult {
  // 1. Geo-targeting check
  const geoResult = checkGeoTarget(userLat, userLng, alert);

  // 2. Calculate individual factor scores
  const factors: RelevanceFactors = {
    distanceScore: calculateDistanceScore(geoResult.distanceKm, geoResult.isInside),
    severityScore: calculateSeverityScore(alert.info.severity),
    vulnerabilityScore: calculateVulnerabilityScore(userProvince, userHasChildren, userHasElderly),
    preferenceScore: calculatePreferenceScore(
      getDisasterTypeFromEvent(alert.info.event),
      alert.info.area.provinces,
      preferences
    ),
    urgencyScore: calculateUrgencyScore(alert.info.urgency),
  };

  // 3. Calculate weighted total
  const totalScore = Math.round(
    factors.distanceScore +
    factors.severityScore +
    factors.vulnerabilityScore +
    factors.preferenceScore +
    factors.urgencyScore
  );

  // 4. Determine if notification should be sent (severity-based threshold)
  const threshold = getSeverityThreshold(alert.info.severity);
  const shouldNotify = totalScore >= threshold;

  // 5. Generate human-readable reason
  const reason = generateRelevanceReason(alert, factors, totalScore, shouldNotify, geoResult.distanceKm);

  // 6. Generate deduplication key
  const deduplicationKey = generateDeduplicationKey(alert);

  return {
    totalScore: Math.min(100, totalScore),
    factors,
    shouldNotify,
    reason,
    deduplicationKey,
  };
}

// ---------------------------------------------------------------------------
// 9. BATCH RELEVANCE CALCULATION
// ---------------------------------------------------------------------------

/**
 * Calculate relevance for multiple alerts and return sorted by score
 * Used for the alert feed to show most relevant alerts first
 *
 * @param alerts - Array of alerts to score
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param userProvince - User's province
 * @param preferences - User's preferences
 * @returns Array of alerts with relevance scores, sorted by score descending
 */
export function calculateBatchRelevance(
  alerts: Alert[],
  userLat: number,
  userLng: number,
  userProvince: string,
  preferences: AlertUserPreferences
): Array<{ alert: Alert; relevance: RelevanceResult }> {
  const results = alerts.map((alert) => ({
    alert,
    relevance: calculateRelevance(
      alert,
      userLat,
      userLng,
      userProvince,
      preferences
    ),
  }));

  // Sort by total score descending
  results.sort((a, b) => b.relevance.totalScore - a.relevance.totalScore);

  return results;
}

// ---------------------------------------------------------------------------
// 10. DEDUPLICATION
// ---------------------------------------------------------------------------

/**
 * Generate a deduplication key for an alert
 * Alerts with the same key are considered duplicates
 *
 * @param alert - The alert to generate a key for
 * @returns Deduplication key string
 */
export function generateDeduplicationKey(alert: Alert): string {
  const event = alert.info.event.toLowerCase().replace(/\s+/g, "-");
  const provinces = alert.info.area.provinces.sort().join("-");
  const severity = alert.info.severity;
  return `${event}-${provinces}-${severity}`;
}

/**
 * Deduplicate alerts - keep only the most recent of each duplicate group
 *
 * @param alerts - Array of alerts to deduplicate
 * @returns Deduplicated array
 */
export function deduplicateAlerts(alerts: Alert[]): Alert[] {
  const groups = new Map<string, Alert[]>();

  for (const alert of alerts) {
    const key = generateDeduplicationKey(alert);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(alert);
  }

  // Keep only the most recent alert from each group
  const deduplicated: Alert[] = [];
  for (const group of groups.values()) {
    const sorted = group.sort(
      (a, b) => new Date(b.sent).getTime() - new Date(a.sent).getTime()
    );
    deduplicated.push(sorted[0]);
  }

  return deduplicated;
}

// ---------------------------------------------------------------------------
// 11. QUIET HOURS CHECK
// ---------------------------------------------------------------------------

/**
 * Check if current time is within user's quiet hours
 * During quiet hours, only extreme alerts are shown
 *
 * @param quietStart - Quiet hours start time (HH:MM format)
 * @param quietEnd - Quiet hours end time (HH:MM format)
 * @returns Whether current time is within quiet hours
 */
export function isQuietHours(quietStart: string, quietEnd: string): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 - 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Check if an alert should be shown during quiet hours
 * Only extreme alerts bypass quiet hours
 *
 * @param alert - The alert to check
 * @param quietStart - Quiet hours start time
 * @param quietEnd - Quiet hours end time
 * @returns Whether the alert should be shown
 */
export function shouldShowDuringQuietHours(
  alert: Alert,
  quietStart: string,
  quietEnd: string
): boolean {
  if (!isQuietHours(quietStart, quietEnd)) return true;
  return alert.info.severity === "extreme";
}

// ---------------------------------------------------------------------------
// 12. DAILY ALERT THROTTLING
// ---------------------------------------------------------------------------

/**
 * Check if user has exceeded their daily alert limit
 *
 * @param todayAlertCount - Number of alerts shown today
 * @param maxPerDay - User's max alerts per day setting
 * @returns Whether more alerts can be shown
 */
export function canShowMoreAlerts(todayAlertCount: number, maxPerDay: number): boolean {
  return todayAlertCount < maxPerDay;
}

/**
 * Filter alerts through daily throttling
 * Always shows extreme alerts regardless of limit
 *
 * @param alerts - Alerts to filter
 * @param todayAlertCount - Alerts shown today
 * @param maxPerDay - Max alerts per day
 * @returns Filtered alerts
 */
export function applyDailyThrottle(
  alerts: Alert[],
  todayAlertCount: number,
  maxPerDay: number
): Alert[] {
  if (todayAlertCount >= maxPerDay) {
    // Only show extreme alerts when limit reached
    return alerts.filter((a) => a.info.severity === "extreme");
  }

  const remaining = maxPerDay - todayAlertCount;
  return alerts.slice(0, remaining);
}

// ---------------------------------------------------------------------------
// 13. SEVERITY THRESHOLD
// ---------------------------------------------------------------------------

/**
 * Get the minimum relevance score needed to show an alert of given severity
 * Extreme alerts always show (threshold 20), minor alerts need high relevance (80)
 *
 * @param severity - Alert severity
 * @returns Minimum score threshold
 */
export function getSeverityThreshold(severity: AlertSeverity): number {
  return RELEVANCE_CONFIG.THRESHOLDS[severity] || 80;
}

// ---------------------------------------------------------------------------
// 14. RELEVANCE REASON GENERATION
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable explanation of why an alert is relevant
 * This is the XAI-lite feature - explainable AI for alert relevance
 *
 * @param alert - The alert
 * @param factors - The relevance factor scores
 * @param totalScore - The total relevance score
 * @param shouldNotify - Whether notification should be sent
 * @param distanceKm - Distance to alert center
 * @returns Vietnamese explanation string
 */
export function generateRelevanceReason(
  alert: Alert,
  factors: RelevanceFactors,
  totalScore: number,
  shouldNotify: boolean,
  distanceKm: number
): string {
  const reasons: string[] = [];

  // Distance reason
  if (factors.distanceScore >= 40) {
    reasons.push("Bạn đang trong vùng cảnh báo");
  } else if (factors.distanceScore >= 30) {
    reasons.push(`Cách bạn ${Math.round(distanceKm)}km`);
  } else if (factors.distanceScore >= 15) {
    reasons.push(`Khu vực gần bạn (${Math.round(distanceKm)}km)`);
  }

  // Severity reason
  if (factors.severityScore >= 25) {
    reasons.push("CẢNH BÁO CỰC KỲ NGHIÊM TRỌNG");
  } else if (factors.severityScore >= 19) {
    reasons.push("Mức độ nghiêm trọng cao");
  } else if (factors.severityScore >= 13) {
    reasons.push("Mức độ cảnh báo trung bình");
  }

  // Urgency reason
  if (factors.urgencyScore >= 5) {
    reasons.push("Nguy hiểm ngay lập tức");
  } else if (factors.urgencyScore >= 3) {
    reasons.push("Dự kiến xảy ra sớm");
  }

  // Vulnerability reason
  if (factors.vulnerabilityScore >= 15) {
    reasons.push("Khu vực dễ bị tổn thương cao");
  }

  // Preference reason
  if (factors.preferenceScore >= 8) {
    reasons.push("Phù hợp với đăng ký của bạn");
  } else if (factors.preferenceScore >= 5) {
    reasons.push("Loại thiên tai bạn quan tâm");
  }

  if (reasons.length === 0) {
    return shouldNotify
      ? `Cảnh báo liên quan (điểm: ${totalScore}/100)`
      : `Cảnh báo ít liên quan (điểm: ${totalScore}/100)`;
  }

  const prefix = shouldNotify ? "Thông báo vì:" : "Lý do:";
  return `${prefix} ${reasons.join(". ")}.`;
}

// ---------------------------------------------------------------------------
// 15. SOS RELEVANCE (for prioritizing SOS requests)
// ---------------------------------------------------------------------------

/**
 * Calculate priority score for an SOS request
 * Used by rescue teams to prioritize which SOS to respond to first
 *
 * @param sos - The SOS request to score
 * @returns Priority score (higher = more urgent)
 */
export function calculateSOSPriority(sos: SOSRequest): number {
  let score = 0;

  // Emergency level (0-50)
  switch (sos.situation.severity) {
    case "life_threatening":
      score += 50;
      break;
    case "urgent":
      score += 30;
      break;
    case "need_help":
      score += 15;
      break;
  }

  // People count (0-20)
  score += Math.min(20, sos.situation.peopleCount * 2);

  // Vulnerable people bonus (0-15)
  if (sos.situation.hasChildren) score += 5;
  if (sos.situation.hasElderly) score += 5;
  if (sos.situation.hasDisabled) score += 5;

  // Trapped bonus (0-10)
  if (sos.situation.isTrapped) score += 10;

  // Medical emergency bonus (0-10)
  if (sos.situation.needsMedical) score += 10;

  // Time decay - older SOS get slightly higher priority (0-5)
  const hoursSinceCreated =
    (Date.now() - new Date(sos.createdAt).getTime()) / (1000 * 60 * 60);
  score += Math.min(5, Math.floor(hoursSinceCreated));

  // Offline SOS get bonus (they waited longer)
  if (sos.isOffline) score += 5;

  return score;
}

/**
 * Sort SOS requests by priority (highest first)
 *
 * @param sosRequests - Array of SOS requests
 * @returns Sorted array
 */
export function sortSOSByPriority(sosRequests: SOSRequest[]): SOSRequest[] {
  return [...sosRequests].sort(
    (a, b) => calculateSOSPriority(b) - calculateSOSPriority(a)
  );
}

// ---------------------------------------------------------------------------
// 16. HELPER: Map event text to disaster type
// ---------------------------------------------------------------------------

function getDisasterTypeFromEvent(event: string): string {
  const map: Record<string, string> = {
    "Bão": "storm",
    "Lũ": "flood",
    "Lũ lụt": "flood",
    "Ngập": "flood",
    "Triều cường": "flood",
    "Sạt lở": "landslide",
    "Hạn hán": "drought",
    "Xâm nhập mặn": "drought",
    "Động đất": "earthquake",
    "Sóng thần": "tsunami",
    "Mưa": "flood",
    "Giông": "storm",
    "Nắng nóng": "drought",
    "Áp thấp": "storm",
  };
  for (const [key, value] of Object.entries(map)) {
    if (event.includes(key)) return value;
  }
  return "other";
}

// ---------------------------------------------------------------------------
// 17. VALIDATION UTILITIES
// ---------------------------------------------------------------------------

/**
 * Validate if coordinates are within Vietnam bounds
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Whether the coordinates are within Vietnam
 */
export function isWithinVietnam(lat: number, lng: number): boolean {
  return (
    lat >= VIETNAM_BOUNDS.lat.min &&
    lat <= VIETNAM_BOUNDS.lat.max &&
    lng >= VIETNAM_BOUNDS.lng.min &&
    lng <= VIETNAM_BOUNDS.lng.max
  );
}

/**
 * Get GPS accuracy description in Vietnamese
 *
 * @param accuracyMeters - GPS accuracy in meters
 * @returns Vietnamese description
 */
export function getAccuracyDescription(accuracyMeters: number): string {
  if (accuracyMeters <= 5) return "Rất chính xác (±5m)";
  if (accuracyMeters <= 15) return "Chính xác (±15m)";
  if (accuracyMeters <= 50) return "Khá chính xác (±50m)";
  if (accuracyMeters <= 100) return "Tương đối (±100m)";
  return "Kém chính xác (±" + Math.round(accuracyMeters) + "m)";
}

// ---------------------------------------------------------------------------
// 18. STATISTICS HELPERS
// ---------------------------------------------------------------------------

/**
 * Calculate alert trend (increasing, stable, decreasing)
 * Based on comparing alerts in last 24h vs previous 24h
 *
 * @param alerts - All alerts
 * @returns Trend direction
 */
export function calculateAlertTrend(
  alerts: Alert[]
): "increasing" | "stable" | "decreasing" {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const last24h = alerts.filter(
    (a) => now - new Date(a.sent).getTime() < day
  ).length;

  const prev24h = alerts.filter((a) => {
    const age = now - new Date(a.sent).getTime();
    return age >= day && age < 2 * day;
  }).length;

  if (last24h > prev24h * 1.2) return "increasing";
  if (last24h < prev24h * 0.8) return "decreasing";
  return "stable";
}

/**
 * Get severity distribution as percentages
 *
 * @param alerts - All alerts
 * @returns Distribution object
 */
export function getSeverityDistribution(
  alerts: Alert[]
): Record<AlertSeverity, number> {
  const total = alerts.length;
  if (total === 0) {
    return { extreme: 0, severe: 0, moderate: 0, minor: 0 };
  }

  const counts: Record<string, number> = { extreme: 0, severe: 0, moderate: 0, minor: 0 };
  alerts.forEach((a) => {
    counts[a.info.severity] = (counts[a.info.severity] || 0) + 1;
  });

  return {
    extreme: Math.round((counts.extreme / total) * 100),
    severe: Math.round((counts.severe / total) * 100),
    moderate: Math.round((counts.moderate / total) * 100),
    minor: Math.round((counts.minor / total) * 100),
  };
}
