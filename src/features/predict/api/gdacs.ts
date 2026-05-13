/**
 * GDACS API Client
 *
 * Global Disaster Alert and Coordination System - Free, no auth.
 * Documentation: https://www.gdacs.org/api/
 *
 * Provides real-time disaster alerts worldwide.
 * We filter for Vietnam (country code VNM).
 * Results are cached for 30 minutes via Next.js revalidation.
 */

import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { ExternalAlert } from "../lib/types";

const GDACS_BASE = "https://www.gdacs.org/api/event/geteventlist";

// === TYPE MAPPING ===

/**
 * Map GDACS event type codes to our DisasterType.
 * GDACS codes: FL (Flood), TC (Tropical Cyclone), EQ (Earthquake),
 * DR (Drought), LS (Landslide), VF (Volcano), WF (Wildfire)
 */
const GDACS_EVENT_TYPE_MAP: Record<string, DisasterType> = {
  FL: "flood",
  TC: "storm",
  EQ: "earthquake",
  DR: "drought",
  LS: "landslide",
  VF: "earthquake",   // Volcano → treat as earthquake for simplicity
  WF: "drought",      // Wildfire → treat as drought-related
};

/**
 * Map GDACS alert levels to SeverityLevel.
 * GDACS levels: "green" (low), "orange" (medium), "red" (high)
 */
const GDACS_ALERT_LEVEL_MAP: Record<string, SeverityLevel> = {
  green: "low",
  orange: "medium",
  red: "high",
};

// === RESPONSE TYPES ===

interface GDACSFeature {
  properties: {
    eventid: string;
    eventtype: string;
    alertlevel: string;
    title: string;
    fromdate: string;
    todate?: string;
    country?: string;
    iso3?: string;
    description?: string;
  };
  geometry?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

interface GDACSResponse {
  features?: GDACSFeature[];
}

// === API CLIENT ===

/**
 * Fetch GDACS disaster alerts for Vietnam.
 *
 * @returns Array of normalized ExternalAlert objects
 *
 * @example
 * ```ts
 * const alerts = await getGDACSAlerts();
 * const storms = alerts.filter(a => a.type === "storm");
 * ```
 */
export async function getGDACSAlerts(): Promise<ExternalAlert[]> {
  try {
    const url = `${GDACS_BASE}?country=VNM&format=json`;
    const res = await fetch(url, {
      next: { revalidate: 1800 }, // Cache 30 minutes
    });

    if (!res.ok) {
      console.warn(`[GDACS] API returned ${res.status}`);
      return [];
    }

    const data: GDACSResponse = await res.json();
    return (data.features ?? []).map(normalizeGDACSFeature).filter(Boolean) as ExternalAlert[];
  } catch (err) {
    console.warn("[GDACS] Failed to fetch:", (err as Error).message);
    return [];
  }
}

// === NORMALIZER ===

/**
 * Normalize a GDACS feature to our ExternalAlert format.
 */
function normalizeGDACSFeature(feature: GDACSFeature): ExternalAlert | null {
  const { properties, geometry } = feature;
  if (!properties.title) return null;

  const type = GDACS_EVENT_TYPE_MAP[properties.eventtype] ?? "flood";
  const severity = GDACS_ALERT_LEVEL_MAP[properties.alertlevel?.toLowerCase()] ?? "low";

  const coords = geometry?.coordinates;

  return {
    id: `gdacs-${properties.eventid}`,
    source: "gdacs",
    title: properties.title,
    type,
    severity,
    date: properties.fromdate ?? new Date().toISOString(),
    lng: coords?.[0],
    lat: coords?.[1],
  };
}
