/**
 * USGS Earthquake API Client
 *
 * United States Geological Survey - Free, no auth.
 * Documentation: https://earthquake.usgs.gov/fdsnws/event/1/
 *
 * Fetches earthquake data for Vietnam's geographic bounding box.
 * Vietnam bounds: lat 8-23°N, lng 102-110°E
 * Results are cached for 30 minutes via Next.js revalidation.
 */

import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { ExternalAlert, Earthquake } from "../lib/types";

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";

// === VIETNAM BOUNDING BOX ===

const VN_BOUNDS = {
  minLatitude: 8,
  maxLatitude: 23,
  minLongitude: 102,
  maxLongitude: 110,
};

// === RESPONSE TYPES ===

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;      // Unix timestamp ms
    url?: string;
    title?: string;
    type?: string;
    tsunami?: number;  // 0 or 1
    felt?: number;     // Number of "Did You Feel It?" responses
    alert?: string;    // PAGER alert level
    significance?: number;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [lng, lat, depth_km]
  };
}

interface USGSResponse {
  features?: USGSFeature[];
  metadata?: {
    count: number;
    generated: number;
  };
}

// === API CLIENT ===

/**
 * Fetch recent earthquakes in Vietnam from USGS.
 *
 * @param days - Number of days to look back (default: 30)
 * @param minMagnitude - Minimum magnitude to include (default: 3.0)
 * @returns Array of Earthquake objects
 *
 * @example
 * ```ts
 * const quakes = await getVietnamEarthquakes(7, 4.0);
 * console.log(`Found ${quakes.length} earthquakes in last 7 days`);
 * ```
 */
export async function getVietnamEarthquakes(
  days = 30,
  minMagnitude = 3.0
): Promise<Earthquake[]> {
  try {
    const startDate = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];

    const params = new URLSearchParams({
      format: "geojson",
      starttime: startDate,
      minlatitude: String(VN_BOUNDS.minLatitude),
      maxlatitude: String(VN_BOUNDS.maxLatitude),
      minlongitude: String(VN_BOUNDS.minLongitude),
      maxlongitude: String(VN_BOUNDS.maxLongitude),
      minmagnitude: String(minMagnitude),
    });

    const url = `${USGS_BASE}?${params.toString()}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 }, // Cache 30 minutes
    });

    if (!res.ok) {
      console.warn(`[USGS] API returned ${res.status}`);
      return [];
    }

    const data: USGSResponse = await res.json();
    return (data.features ?? []).map(normalizeEarthquake);
  } catch (err) {
    console.warn("[USGS] Failed to fetch:", (err as Error).message);
    return [];
  }
}

/**
 * Fetch earthquakes and convert to ExternalAlert format.
 * This is the primary function used by the aggregator.
 *
 * @param days - Number of days to look back (default: 30)
 * @returns Array of ExternalAlert objects with type="earthquake"
 */
export async function getVietnamEarthquakeAlerts(days = 30): Promise<ExternalAlert[]> {
  const earthquakes = await getVietnamEarthquakes(days);
  return earthquakes.map(eqToAlert);
}

// === NORMALIZER ===

/**
 * Normalize a USGS feature to our Earthquake format.
 */
function normalizeEarthquake(feature: USGSFeature): Earthquake {
  const { properties, geometry } = feature;
  return {
    id: feature.id,
    magnitude: properties.mag ?? 0,
    place: properties.place ?? "Unknown location",
    time: new Date(properties.time).toISOString(),
    lng: geometry.coordinates[0],
    lat: geometry.coordinates[1],
    depth: geometry.coordinates[2] ?? 0,
  };
}

/**
 * Convert an Earthquake to ExternalAlert format.
 */
function eqToAlert(eq: Earthquake): ExternalAlert {
  return {
    id: `usgs-${eq.id}`,
    source: "usgs",
    title: `M${eq.magnitude.toFixed(1)} - ${eq.place}`,
    type: "earthquake" as DisasterType,
    severity: magnitudeToSeverity(eq.magnitude),
    date: eq.time,
    lat: eq.lat,
    lng: eq.lng,
  };
}

/**
 * Map earthquake magnitude to SeverityLevel.
 * Based on USGS PAGER alert system thresholds.
 */
function magnitudeToSeverity(magnitude: number): SeverityLevel {
  if (magnitude >= 7.0) return "critical";
  if (magnitude >= 6.0) return "high";
  if (magnitude >= 4.5) return "medium";
  return "low";
}
