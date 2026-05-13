/**
 * ReliefWeb API Client
 *
 * Free API, no authentication required.
 * Documentation: https://apidoc.reliefweb.int/
 *
 * Uses POST /v1/reports to search for Vietnam disaster reports.
 * Results are cached for 1 hour via Next.js revalidation.
 */

import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { ExternalAlert } from "../lib/types";

const RELIEFWEB_BASE = "https://api.reliefweb.int/v1";

// === TYPE MAPPING ===

/**
 * Map ReliefWeb disaster type names to our DisasterType.
 * ReliefWeb uses full names like "Flood", "Storm", "Earthquake", etc.
 */
const RELIEFWEB_TYPE_MAP: Record<string, DisasterType> = {
  flood: "flood",
  floods: "flood",
  storm: "storm",
  tropical_cyclone: "storm",
  typhoon: "storm",
  hurricane: "storm",
  cyclone: "storm",
  landslide: "landslide",
  landslides: "landslide",
  drought: "drought",
  droughts: "drought",
  earthquake: "earthquake",
  earthquakes: "earthquake",
  tsunami: "tsunami",
};

// === RESPONSE TYPES ===

interface ReliefWebReport {
  id: string;
  fields: {
    title: string;
    date?: {
      created: string;
      original?: string;
    };
    disaster_type?: Array<{
      id: string;
      name: string;
      shortname?: string;
    }>;
    country?: Array<{
      id: string;
      name: string;
      iso3?: string;
    }>;
    status?: string;
    url?: string;
  };
}

interface ReliefWebResponse {
  data?: ReliefWebReport[];
  totalCount?: number;
}

// === API CLIENT ===

/**
 * Fetch recent disaster reports for Vietnam from ReliefWeb.
 *
 * @param limit - Maximum number of reports to fetch (default: 10)
 * @returns Array of normalized ExternalAlert objects
 *
 * @example
 * ```ts
 * const alerts = await getVietnamDisasters(5);
 * console.log(alerts[0].title); // "Flood in Central Vietnam"
 * ```
 */
export async function getVietnamDisasters(limit = 10): Promise<ExternalAlert[]> {
  try {
    const url = `${RELIEFWEB_BASE}/reports`;
    const body = {
      filter: {
        field: "country.iso3",
        value: "VNM",
      },
      sort: ["date.created:desc"],
      limit,
      fields: {
        include: ["title", "date", "disaster_type", "country", "status", "url"],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) {
      console.warn(`[ReliefWeb] API returned ${res.status}`);
      return [];
    }

    const data: ReliefWebResponse = await res.json();
    return (data.data ?? []).map(normalizeReport).filter(Boolean) as ExternalAlert[];
  } catch (err) {
    console.warn("[ReliefWeb] Failed to fetch:", (err as Error).message);
    return [];
  }
}

// === NORMALIZER ===

/**
 * Normalize a ReliefWeb report to our ExternalAlert format.
 */
function normalizeReport(report: ReliefWebReport): ExternalAlert | null {
  const { id, fields } = report;
  if (!fields.title) return null;

  // Extract disaster type from the first disaster_type entry
  const rawType = fields.disaster_type?.[0]?.shortname?.toLowerCase()
    ?? fields.disaster_type?.[0]?.name?.toLowerCase()
    ?? "";
  const type = RELIEFWEB_TYPE_MAP[rawType] ?? "flood";

  // Map status to severity (ReliefWeb doesn't provide numeric severity)
  const severity = mapStatusToSeverity(fields.status);

  return {
    id: `rw-${id}`,
    source: "reliefweb",
    title: fields.title,
    type,
    severity,
    date: fields.date?.created ?? new Date().toISOString(),
    url: fields.url,
  };
}

/**
 * Map ReliefWeb report status to SeverityLevel.
 * ReliefWeb statuses: "alert", "warning", "update", "news"
 */
function mapStatusToSeverity(status?: string): SeverityLevel {
  switch (status?.toLowerCase()) {
    case "alert":
      return "critical";
    case "warning":
      return "high";
    case "update":
      return "medium";
    default:
      return "low";
  }
}
