"use client";

// =============================================================================
// DISPATCH ENGINE - Geospatial Best-Fit Unit Algorithm
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// "Best-Fit Unit" Algorithm (NOT just nearest):
//   DispatchScore = (Distance × 0.35) + (Capability × 0.30) + (Availability × 0.20)
//                  + (Capacity × 0.10) + (Speed × 0.05)
//
// Uses Turf.js for geospatial calculations:
//   - turf.distance() - Haversine distance
//   - turf.destination() - Point at distance + bearing
//   - turf.bbox() - Bounding box
//   - turf.booleanPointInPolygon() - Point-in-polygon check
//   - turf.nearestPoint() - Find nearest point
//   - turf.center() - Calculate center of features
//
// Inspired by:
//   - AVL (Automatic Vehicle Location) - FEMA
//   - Resource Typing - NIMS
//   - Multi-factor dispatch optimization
// =============================================================================

import * as turf from "@turf/turf";
import type {
  RescueResource,
  RescueSOSRequest,
  Incident,
  IncidentLocation,
  ResourceType,
  ResourceCapability,
  ResourceStatus,
  DispatchRecommendation,
  DispatchReason,
  DispatchResult,
} from "./types";

import {
  DISPATCH_WEIGHTS,
  AVAILABILITY_SCORES,
  RESOURCE_TYPE_CONFIG,
  INCIDENT_TYPE_CONFIG,
  RESCUE_CONFIG,
} from "../config/rescue-config";

// =============================================================================
// 1. GEOSPATIAL DISTANCE CALCULATION
// =============================================================================

/**
 * Calculate Haversine distance between two points using Turf.js
 * Returns distance in kilometers
 */
export function calculateDistance(
  from: IncidentLocation,
  to: IncidentLocation
): number {
  const fromPoint = turf.point([from.lng, from.lat]);
  const toPoint = turf.point([to.lng, to.lat]);
  return turf.distance(fromPoint, toPoint, { units: "kilometers" });
}

/**
 * Calculate estimated arrival time in minutes
 * Based on distance and resource speed
 */
export function calculateETA(distanceKm: number, speedKmh: number): number {
  if (speedKmh <= 0) return Infinity;
  const hours = distanceKm / speedKmh;
  return Math.round(hours * 60);
}

/**
 * Calculate bearing between two points (for display)
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(
  from: IncidentLocation,
  to: IncidentLocation
): number {
  const fromPoint = turf.point([from.lng, from.lat]);
  const toPoint = turf.point([to.lng, to.lat]);
  return turf.bearing(fromPoint, toPoint);
}

/**
 * Find the center point of multiple locations
 */
export function findCenter(locations: IncidentLocation[]): IncidentLocation {
  if (locations.length === 0) {
    return { lat: 16.0, lng: 108.0, province: "Unknown", district: "Unknown" };
  }
  if (locations.length === 1) {
    return locations[0];
  }

  const points = turf.featureCollection(
    locations.map((loc) => turf.point([loc.lng, loc.lat]))
  );
  const center = turf.center(points);
  const [lng, lat] = center.geometry.coordinates;

  return {
    lat,
    lng,
    province: locations[0].province,
    district: locations[0].district,
  };
}

/**
 * Check if a point is within a given radius of another point
 */
export function isWithinRadius(
  point: IncidentLocation,
  center: IncidentLocation,
  radiusKm: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}

/**
 * Find all resources within a radius of a location
 */
export function findResourcesWithinRadius(
  resources: RescueResource[],
  center: IncidentLocation,
  radiusKm: number
): RescueResource[] {
  return resources.filter((resource) =>
    isWithinRadius(resource.location, center, radiusKm)
  );
}

/**
 * Get bounding box for a set of incidents
 * Returns [minLng, minLat, maxLng, maxLat]
 */
export function getIncidentsBoundingBox(
  incidents: Incident[]
): [number, number, number, number] | null {
  if (incidents.length === 0) return null;

  const points = turf.featureCollection(
    incidents.map((inc) => turf.point([inc.location.lng, inc.location.lat]))
  );
  return turf.bbox(points) as [number, number, number, number];
}

// =============================================================================
// 2. CAPABILITY MATCHING
// =============================================================================

/**
 * Calculate capability match score
 * Compares required capabilities of the incident vs available capabilities of the resource
 *
 * Returns a score from 0-100:
 *   - 100 = Resource has ALL required capabilities
 *   - 50+ = Resource has most required capabilities
 *   - 0 = Resource has NONE of the required capabilities
 */
export function calculateCapabilityMatch(
  requiredCapabilities: ResourceCapability[],
  resourceCapabilities: ResourceCapability[]
): number {
  if (requiredCapabilities.length === 0) return 100;

  const matched = requiredCapabilities.filter((req) =>
    resourceCapabilities.includes(req)
  );

  return Math.round((matched.length / requiredCapabilities.length) * 100);
}

/**
 * Get required capabilities for an incident type
 */
export function getRequiredCapabilitiesForIncident(
  incidentType: ResourceType
): ResourceCapability[] {
  const config = INCIDENT_TYPE_CONFIG[incidentType as keyof typeof INCIDENT_TYPE_CONFIG];
  return (config?.requiredCapabilities as ResourceCapability[]) || ["search_rescue"];
}

/**
 * Check if a resource can handle a specific incident type
 */
export function canResourceHandleIncident(
  resource: RescueResource,
  incidentType: ResourceType
): boolean {
  const required = getRequiredCapabilitiesForIncident(incidentType);
  const matchScore = calculateCapabilityMatch(required, resource.capabilities);
  return matchScore >= 50; // At least 50% capability match
}

// =============================================================================
// 3. AVAILABILITY SCORING
// =============================================================================

/**
 * Calculate availability score for a resource
 * Available resources score highest, deployed resources score 0
 */
export function calculateAvailabilityScore(status: ResourceStatus): number {
  return AVAILABILITY_SCORES[status] || 0;
}

/**
 * Check if a resource is available for deployment
 */
export function isResourceAvailable(resource: RescueResource): boolean {
  return resource.status === "available";
}

/**
 * Get all available resources sorted by availability
 */
export function getAvailableResources(resources: RescueResource[]): RescueResource[] {
  return resources
    .filter((r) => r.status === "available")
    .sort((a, b) => {
      const scoreA = calculateAvailabilityScore(a.status);
      const scoreB = calculateAvailabilityScore(b.status);
      return scoreB - scoreA;
    });
}

// =============================================================================
// 4. CAPACITY SCORING
// =============================================================================

/**
 * Calculate capacity score
 * Compares resource capacity with the number of people at risk
 *
 * Returns a score from 0-100:
 *   - 100 = Resource can handle all people at risk
 *   - 50 = Resource can handle half
 *   - 0 = Resource has no capacity
 */
export function calculateCapacityScore(
  resourceCapacity: number,
  peopleAtRisk: number
): number {
  if (peopleAtRisk <= 0) return 100;
  if (resourceCapacity <= 0) return 0;

  const ratio = resourceCapacity / peopleAtRisk;
  return Math.min(100, Math.round(ratio * 100));
}

// =============================================================================
// 5. SPEED SCORING
// =============================================================================

/**
 * Calculate speed score
 * Normalizes resource speed to a 0-100 scale
 *
 * Assumptions:
 *   - Walking speed: 5 km/h = score 5
 *   - Boat speed: 30 km/h = score 30
 *   - Helicopter speed: 200 km/h = score 100
 *   - Max score capped at 100
 */
export function calculateSpeedScore(speedKmh: number): number {
  return Math.min(100, Math.round(speedKmh));
}

// =============================================================================
// 6. MAIN DISPATCH ALGORITHM
// =============================================================================

/**
 * Calculate dispatch score for a single resource against an incident/SOS
 *
 * DispatchScore = (Distance × 0.35) + (Capability × 0.30) + (Availability × 0.20)
 *                + (Capacity × 0.10) + (Speed × 0.05)
 *
 * @param resource - The resource to evaluate
 * @param targetLocation - Location of the incident/SOS
 * @param requiredCapabilities - Capabilities needed for the incident
 * @param peopleAtRisk - Number of people at risk
 * @returns Score from 0-100 and breakdown
 */
export function calculateDispatchScore(
  resource: RescueResource,
  targetLocation: IncidentLocation,
  requiredCapabilities: ResourceCapability[],
  peopleAtRisk: number
): {
  totalScore: number;
  distanceScore: number;
  capabilityScore: number;
  availabilityScore: number;
  capacityScore: number;
  speedScore: number;
  distanceKm: number;
  etaMinutes: number;
  reasons: DispatchReason[];
} {
  // 1. Distance score (inverse - closer is better)
  const distanceKm = calculateDistance(resource.location, targetLocation);
  const maxDistance = 200; // Max reasonable distance in km
  const distanceScore = Math.max(0, Math.round(100 - (distanceKm / maxDistance) * 100));

  // 2. Capability match score
  const capabilityScore = calculateCapabilityMatch(requiredCapabilities, resource.capabilities);

  // 3. Availability score
  const availabilityScore = calculateAvailabilityScore(resource.status);

  // 4. Capacity score
  const capacityScore = calculateCapacityScore(resource.capacity, peopleAtRisk);

  // 5. Speed score
  const speedScore = calculateSpeedScore(resource.speed);

  // 6. Calculate weighted total
  const totalScore = Math.round(
    distanceScore * DISPATCH_WEIGHTS.distance +
    capabilityScore * DISPATCH_WEIGHTS.capability +
    availabilityScore * DISPATCH_WEIGHTS.availability +
    capacityScore * DISPATCH_WEIGHTS.capacity +
    speedScore * DISPATCH_WEIGHTS.speed
  );

  // 7. Calculate ETA
  const etaMinutes = calculateETA(distanceKm, resource.speed);

  // 8. Determine reasons
  const reasons: DispatchReason[] = [];
  if (distanceScore >= 80) reasons.push("nearest");
  if (capabilityScore >= 80) reasons.push("best_capability");
  if (capacityScore >= 80) reasons.push("highest_capacity");
  if (speedScore >= 80) reasons.push("fastest_response");
  if (availabilityScore >= 80) reasons.push("most_available");
  if (totalScore >= 75) reasons.push("best_overall");

  // Ensure at least one reason
  if (reasons.length === 0) {
    if (distanceScore >= capabilityScore && distanceScore >= availabilityScore) {
      reasons.push("nearest");
    } else if (capabilityScore >= distanceScore && capabilityScore >= availabilityScore) {
      reasons.push("best_capability");
    } else {
      reasons.push("most_available");
    }
  }

  return {
    totalScore,
    distanceScore,
    capabilityScore,
    availabilityScore,
    capacityScore,
    speedScore,
    distanceKm,
    etaMinutes,
    reasons,
  };
}

// =============================================================================
// 7. BEST-FIT DISPATCH (Top N Recommendations)
// =============================================================================

/**
 * Find the best-fit resources for an incident/SOS
 * Returns top N recommendations sorted by score (highest first)
 *
 * This is the MAIN dispatch function that should be called by the UI
 *
 * @param resources - All available resources
 * @param targetLocation - Location of the incident/SOS
 * @param incidentType - Type of incident (for capability matching)
 * @param peopleAtRisk - Number of people at risk
 * @param topN - Number of recommendations to return (default: 3)
 * @param excludeDeployed - Whether to exclude already-deployed resources
 */
export function findBestFitResources(
  resources: RescueResource[],
  targetLocation: IncidentLocation,
  incidentType: ResourceType,
  peopleAtRisk: number,
  topN: number = RESCUE_CONFIG.DISPATCH_TOP_N,
  excludeDeployed: boolean = true
): DispatchRecommendation[] {
  // Filter resources
  let candidates = [...resources];

  if (excludeDeployed) {
    candidates = candidates.filter((r) => r.status === "available");
  }

  // Get required capabilities for this incident type
  const requiredCapabilities = getRequiredCapabilitiesForIncident(incidentType);

  // Calculate scores for all candidates
  const scored = candidates.map((resource) => {
    const result = calculateDispatchScore(
      resource,
      targetLocation,
      requiredCapabilities,
      peopleAtRisk
    );

    return {
      unitId: resource.id,
      unitName: resource.name,
      unitType: resource.type,
      matchScore: result.totalScore,
      etaMinutes: result.etaMinutes,
      distanceKm: Math.round(result.distanceKm * 10) / 10,
      reasons: result.reasons,
      capabilities: resource.capabilities,
    } as DispatchRecommendation;
  });

  // Sort by score (highest first) and return top N
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}

// =============================================================================
// 8. DISPATCH RESULT GENERATOR
// =============================================================================

/**
 * Generate a complete dispatch result for an SOS request
 * This is the full pipeline: SOS → Calculate → Recommend
 */
export function generateDispatchResult(
  sos: RescueSOSRequest,
  resources: RescueResource[],
  incident?: Incident
): DispatchResult {
  const targetLocation = sos.location;
  const incidentType = sos.situation.type as ResourceType;
  const peopleAtRisk = sos.situation.peopleCount;

  const recommendations = findBestFitResources(
    resources,
    targetLocation,
    incidentType,
    peopleAtRisk,
    RESCUE_CONFIG.DISPATCH_TOP_N
  );

  return {
    incidentId: sos.incidentId || "unknown",
    sosId: sos.id,
    recommendations,
    calculatedAt: new Date().toISOString(),
    algorithm: "best_fit",
    factors: {
      distanceWeight: DISPATCH_WEIGHTS.distance,
      capabilityWeight: DISPATCH_WEIGHTS.capability,
      availabilityWeight: DISPATCH_WEIGHTS.availability,
      capacityWeight: DISPATCH_WEIGHTS.capacity,
      speedWeight: DISPATCH_WEIGHTS.speed,
    },
  };
}

// =============================================================================
// 9. BATCH DISPATCH
// =============================================================================

/**
 * Generate dispatch results for multiple SOS requests
 * Useful for dashboard overview
 */
export function batchGenerateDispatchResults(
  sosRequests: RescueSOSRequest[],
  resources: RescueResource[],
  incidents: Incident[]
): DispatchResult[] {
  return sosRequests
    .filter((sos) => sos.dispatch.status === "pending" || sos.dispatch.status === "triaged")
    .map((sos) => {
      const incident = incidents.find((inc) => inc.id === sos.incidentId);
      return generateDispatchResult(sos, resources, incident);
    });
}

// =============================================================================
// 10. RESOURCE UTILIZATION ANALYSIS
// =============================================================================

/**
 * Analyze resource utilization across incidents
 * Returns statistics about resource deployment
 */
export function analyzeResourceUtilization(resources: RescueResource[]): {
  total: number;
  available: number;
  deployed: number;
  returning: number;
  maintenance: number;
  utilizationRate: number;
  byType: Record<ResourceType, { total: number; deployed: number; available: number }>;
} {
  const total = resources.length;
  const available = resources.filter((r) => r.status === "available").length;
  const deployed = resources.filter((r) => r.status === "deployed").length;
  const returning = resources.filter((r) => r.status === "returning").length;
  const maintenance = resources.filter((r) => r.status === "maintenance").length;

  const utilizationRate = total > 0 ? Math.round((deployed / total) * 100) : 0;

  // Group by type
  const byType = {} as Record<ResourceType, { total: number; deployed: number; available: number }>;

  for (const resource of resources) {
    if (!byType[resource.type]) {
      byType[resource.type] = { total: 0, deployed: 0, available: 0 };
    }
    byType[resource.type].total++;
    if (resource.status === "deployed") byType[resource.type].deployed++;
    if (resource.status === "available") byType[resource.type].available++;
  }

  return {
    total,
    available,
    deployed,
    returning,
    maintenance,
    utilizationRate,
    byType,
  };
}

// =============================================================================
// 11. COVERAGE ANALYSIS
// =============================================================================

/**
 * Analyze coverage gaps - which incidents don't have enough resources nearby
 */
export function analyzeCoverageGaps(
  incidents: Incident[],
  resources: RescueResource[],
  maxDistanceKm: number = 50
): Array<{
  incidentId: string;
  incidentTitle: string;
  location: IncidentLocation;
  nearbyResources: number;
  availableNearby: number;
  hasGap: boolean;
  gapSeverity: "none" | "low" | "medium" | "high" | "critical";
}> {
  return incidents
    .filter((inc) => inc.status === "active" || inc.status === "escalated")
    .map((incident) => {
      const nearbyResources = resources.filter(
        (r) => calculateDistance(r.location, incident.location) <= maxDistanceKm
      );
      const availableNearby = nearbyResources.filter((r) => r.status === "available").length;

      // Determine gap severity based on people at risk vs available resources
      const ratio = availableNearby > 0 ? incident.peopleAtRisk / availableNearby : Infinity;
      let gapSeverity: "none" | "low" | "medium" | "high" | "critical" = "none";

      if (availableNearby === 0) {
        gapSeverity = "critical";
      } else if (ratio > 1000) {
        gapSeverity = "critical";
      } else if (ratio > 500) {
        gapSeverity = "high";
      } else if (ratio > 200) {
        gapSeverity = "medium";
      } else if (ratio > 100) {
        gapSeverity = "low";
      }

      return {
        incidentId: incident.id,
        incidentTitle: incident.title,
        location: incident.location,
        nearbyResources: nearbyResources.length,
        availableNearby,
        hasGap: gapSeverity !== "none",
        gapSeverity,
      };
    });
}

// =============================================================================
// 12. ROUTE ESTIMATION
// =============================================================================

/**
 * Estimate route between two points (straight-line with correction factor)
 * Real routing would use OSRM/Google Maps API, but for thesis we use Turf.js
 */
export function estimateRoute(
  from: IncidentLocation,
  to: IncidentLocation,
  terrainFactor: number = 1.3 // Roads are ~30% longer than straight line
): {
  straightLineKm: number;
  estimatedRouteKm: number;
  bearing: number;
  estimatedMinutes: number;
  speedKmh: number;
} {
  const straightLineKm = calculateDistance(from, to);
  const estimatedRouteKm = Math.round(straightLineKm * terrainFactor * 10) / 10;
  const bearing = calculateBearing(from, to);

  // Estimate speed based on terrain
  let speedKmh = 60; // Default road speed
  if (from.province.includes("Lào Cai") || from.province.includes("Yên Bái") || from.province.includes("Cao Bằng")) {
    speedKmh = 30; // Mountainous roads
  } else if (from.province.includes("Hà Nội") || from.province.includes("Hải Phòng")) {
    speedKmh = 40; // Urban traffic
  }

  const estimatedMinutes = Math.round((estimatedRouteKm / speedKmh) * 60);

  return {
    straightLineKm: Math.round(straightLineKm * 10) / 10,
    estimatedRouteKm,
    bearing: Math.round(bearing),
    estimatedMinutes,
    speedKmh,
  };
}
