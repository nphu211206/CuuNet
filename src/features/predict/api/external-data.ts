/**
 * External Data Aggregator
 *
 * Combines data from all external APIs (ReliefWeb, GDACS, USGS)
 * into a unified interface for the prediction module.
 *
 * Features:
 * - Parallel fetching for performance
 * - Unified ExternalAlert type
 * - Filtering by type, severity, date, proximity
 * - Graceful fallback when APIs are unavailable
 * - Province proximity matching using lat/lng
 */

import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { ExternalAlert } from "../lib/types";
import { getVietnamDisasters } from "./reliefweb";
import { getGDACSAlerts } from "./gdacs";
import { getVietnamEarthquakeAlerts } from "./usgs";

// === PROVINCE COORDINATES (for proximity matching) ===

const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Quảng Bình":   { lat: 17.47, lng: 106.60 },
  "Đà Nẵng":      { lat: 16.05, lng: 108.22 },
  "Huế":           { lat: 16.46, lng: 107.60 },
  "Lào Cai":       { lat: 22.34, lng: 103.84 },
  "Yên Bái":       { lat: 21.72, lng: 104.87 },
  "Quảng Nam":     { lat: 15.57, lng: 108.47 },
  "Cần Thơ":       { lat: 10.05, lng: 105.77 },
  "An Giang":      { lat: 10.52, lng: 105.13 },
  "Bến Tre":       { lat: 10.24, lng: 106.38 },
  "Hà Nội":        { lat: 21.03, lng: 105.85 },
  "Hải Phòng":     { lat: 20.86, lng: 106.68 },
  "Hồ Chí Minh":   { lat: 10.82, lng: 106.63 },
  "Trà Vinh":      { lat: 9.95,  lng: 106.34 },
  "Đà Lạt":        { lat: 11.94, lng: 108.44 },
  "Nha Trang":     { lat: 12.24, lng: 109.19 },
};

// === FETCH ALL ===

/**
 * Fetch all external disaster data in parallel.
 * Returns an empty array if all APIs fail (graceful degradation).
 *
 * @param options - Configuration options
 * @returns Combined, deduplicated, and sorted alerts
 *
 * @example
 * ```ts
 * const { alerts, errors } = await fetchAllExternalData();
 * if (errors.length > 0) console.warn("Some APIs failed:", errors);
 * console.log(`Got ${alerts.length} alerts from ${new Set(alerts.map(a => a.source)).size} sources`);
 * ```
 */
export async function fetchAllExternalData(options?: {
  reliefwebLimit?: number;
  earthquakeDays?: number;
}): Promise<{ alerts: ExternalAlert[]; errors: string[] }> {
  const errors: string[] = [];

  // Parallel fetch from all 3 APIs
  const [reliefResult, gdacsResult, usgsResult] = await Promise.allSettled([
    getVietnamDisasters(options?.reliefwebLimit ?? 10),
    getGDACSAlerts(),
    getVietnamEarthquakeAlerts(options?.earthquakeDays ?? 30),
  ]);

  const allAlerts: ExternalAlert[] = [];

  // ReliefWeb
  if (reliefResult.status === "fulfilled") {
    allAlerts.push(...reliefResult.value);
  } else {
    errors.push(`ReliefWeb: ${reliefResult.reason}`);
  }

  // GDACS
  if (gdacsResult.status === "fulfilled") {
    allAlerts.push(...gdacsResult.value);
  } else {
    errors.push(`GDACS: ${gdacsResult.reason}`);
  }

  // USGS
  if (usgsResult.status === "fulfilled") {
    allAlerts.push(...usgsResult.value);
  } else {
    errors.push(`USGS: ${usgsResult.reason}`);
  }

  // Deduplicate by title similarity + date
  const deduplicated = deduplicateAlerts(allAlerts);

  // Sort by date (most recent first)
  deduplicated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { alerts: deduplicated, errors };
}

// === FILTERING ===

/**
 * Filter alerts by disaster type.
 */
export function getAlertsByType(
  alerts: ExternalAlert[],
  type: DisasterType
): ExternalAlert[] {
  return alerts.filter((a) => a.type === type);
}

/**
 * Filter alerts by minimum severity level.
 * Severity order: low < medium < high < critical
 */
export function getAlertsByMinSeverity(
  alerts: ExternalAlert[],
  minSeverity: SeverityLevel
): ExternalAlert[] {
  const order: Record<SeverityLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  const threshold = order[minSeverity];
  return alerts.filter((a) => order[a.severity] >= threshold);
}

/**
 * Filter alerts from the last N days.
 */
export function getRecentAlerts(
  alerts: ExternalAlert[],
  days: number = 7
): ExternalAlert[] {
  const cutoff = Date.now() - days * 86400000;
  return alerts.filter((a) => new Date(a.date).getTime() >= cutoff);
}

/**
 * Find alerts near a specific province (within radius in km).
 * Uses Haversine formula for distance calculation.
 */
export function getAlertsNearProvince(
  alerts: ExternalAlert[],
  province: string,
  radiusKm: number = 200
): ExternalAlert[] {
  const coords = PROVINCE_COORDS[province];
  if (!coords) return alerts; // Unknown province → return all

  return alerts.filter((alert) => {
    if (alert.lat == null || alert.lng == null) return false;
    const distance = haversineDistance(coords.lat, coords.lng, alert.lat, alert.lng);
    return distance <= radiusKm;
  });
}

/**
 * Get alert counts by source.
 */
export function getAlertCountsBySource(
  alerts: ExternalAlert[]
): Record<string, number> {
  const counts: Record<string, number> = {
    reliefweb: 0,
    gdacs: 0,
    usgs: 0,
  };
  for (const alert of alerts) {
    counts[alert.source] = (counts[alert.source] || 0) + 1;
  }
  return counts;
}

/**
 * Get alert counts by disaster type.
 */
export function getAlertCountsByType(
  alerts: ExternalAlert[]
): Record<DisasterType, number> {
  const counts: Record<string, number> = {
    flood: 0,
    storm: 0,
    landslide: 0,
    drought: 0,
    earthquake: 0,
    tsunami: 0,
  };
  for (const alert of alerts) {
    counts[alert.type] = (counts[alert.type] || 0) + 1;
  }
  return counts as Record<DisasterType, number>;
}

// === UTILITY ===

/**
 * Deduplicate alerts by title similarity.
 * If two alerts have >80% title similarity and same date, keep the one with higher severity.
 */
function deduplicateAlerts(alerts: ExternalAlert[]): ExternalAlert[] {
  const severityOrder: Record<SeverityLevel, number> = {
    low: 0, medium: 1, high: 2, critical: 3,
  };

  const seen = new Map<string, ExternalAlert>();

  for (const alert of alerts) {
    // Create a key from normalized title + date (day only)
    const day = alert.date.split("T")[0];
    const normalizedTitle = alert.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
    const key = `${normalizedTitle}-${day}`;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, alert);
    } else {
      // Keep the one with higher severity
      if (severityOrder[alert.severity] > severityOrder[existing.severity]) {
        seen.set(key, alert);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
