"use client";

// =============================================================================
// 3W/5W MODULE - Who-What-Where Data Management
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Inspired by UN OCHA 3W/5W Dashboard Standard:
//   3W = Who is doing What Where
//   4W = 3W + When
//   5W = 4W + How many beneficiaries
//
// Features:
//   - Organization registry with type classification
//   - Activity tracking by cluster/sector
//   - Geographic aggregation (province/district/commune)
//   - Gap analysis (5W extension)
//   - Map layer data generation
//   - HXL-compatible data export
// =============================================================================

import type {
  Organization,
  OrganizationType,
  ThreeWEntry,
  FiveWGapAnalysis,
  HumanitarianCluster,
  ActivityStatus,
  IncidentLocation,
  Incident,
} from "./types";

import {
  ORGANIZATION_TYPE_CONFIG,
  HUMANITARIAN_CLUSTER_CONFIG,
  ACTIVITY_STATUS_CONFIG,
  RESCUE_PROVINCES,
} from "../config/rescue-config";

// =============================================================================
// 1. ORGANIZATION FILTERING & GROUPING
// =============================================================================

/**
 * Filter organizations by type
 */
export function filterOrganizationsByType(
  organizations: Organization[],
  type: OrganizationType
): Organization[] {
  return organizations.filter((org) => org.type === type);
}

/**
 * Group organizations by type
 * Returns a Map with OrganizationType as key and array of organizations as value
 */
export function groupOrganizationsByType(
  organizations: Organization[]
): Map<OrganizationType, Organization[]> {
  const groups = new Map<OrganizationType, Organization[]>();

  for (const org of organizations) {
    const existing = groups.get(org.type) || [];
    existing.push(org);
    groups.set(org.type, existing);
  }

  return groups;
}

/**
 * Group organizations by sector/cluster
 */
export function groupOrganizationsByCluster(
  organizations: Organization[]
): Map<HumanitarianCluster, Organization[]> {
  const groups = new Map<HumanitarianCluster, Organization[]>();

  for (const org of organizations) {
    for (const cluster of org.sectors) {
      const existing = groups.get(cluster) || [];
      if (!existing.find((o) => o.id === org.id)) {
        existing.push(org);
        groups.set(cluster, existing);
      }
    }
  }

  return groups;
}

/**
 * Get organizations active in a specific province
 */
export function getOrganizationsByProvince(
  organizations: Organization[],
  province: string
): Organization[] {
  if (province === "all") return organizations;
  return organizations.filter((org) => org.location.province === province);
}

/**
 * Calculate total organizational capacity
 */
export function calculateTotalCapacity(organizations: Organization[]): number {
  return organizations.reduce((sum, org) => sum + org.capacity, 0);
}

// =============================================================================
// 2. 3W ENTRY FILTERING & AGGREGATION
// =============================================================================

/**
 * Filter 3W entries by multiple criteria
 */
export function filterThreeWEntries(
  entries: ThreeWEntry[],
  filters: {
    organizationType?: OrganizationType;
    cluster?: HumanitarianCluster;
    province?: string;
    status?: ActivityStatus;
    incidentId?: string;
  }
): ThreeWEntry[] {
  let filtered = [...entries];

  if (filters.organizationType) {
    filtered = filtered.filter((e) => e.who.type === filters.organizationType);
  }

  if (filters.cluster) {
    filtered = filtered.filter((e) => e.what.cluster === filters.cluster);
  }

  if (filters.province && filters.province !== "all") {
    filtered = filtered.filter((e) => e.where.province === filters.province);
  }

  if (filters.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  if (filters.incidentId) {
    filtered = filtered.filter((e) => e.what.incidentId === filters.incidentId);
  }

  return filtered;
}

/**
 * Aggregate 3W entries by province
 * Returns summary for each province
 */
export function aggregateByProvince(
  entries: ThreeWEntry[]
): Array<{
  province: string;
  organizations: number;
  activities: number;
  targetBeneficiaries: number;
  actualBeneficiaries: number;
  clusters: HumanitarianCluster[];
}> {
  const provinceMap = new Map<
    string,
    {
      organizations: Set<string>;
      activities: number;
      targetBeneficiaries: number;
      actualBeneficiaries: number;
      clusters: Set<HumanitarianCluster>;
    }
  >();

  for (const entry of entries) {
    const province = entry.where.province;
    if (!provinceMap.has(province)) {
      provinceMap.set(province, {
        organizations: new Set(),
        activities: 0,
        targetBeneficiaries: 0,
        actualBeneficiaries: 0,
        clusters: new Set(),
      });
    }

    const data = provinceMap.get(province)!;
    data.organizations.add(entry.who.id);
    data.activities++;
    data.targetBeneficiaries += entry.what.targetBeneficiaries;
    data.actualBeneficiaries += entry.what.actualBeneficiaries;
    data.clusters.add(entry.what.cluster);
  }

  return Array.from(provinceMap.entries()).map(([province, data]) => ({
    province,
    organizations: data.organizations.size,
    activities: data.activities,
    targetBeneficiaries: data.targetBeneficiaries,
    actualBeneficiaries: data.actualBeneficiaries,
    clusters: Array.from(data.clusters),
  }));
}

/**
 * Aggregate 3W entries by cluster/sector
 */
export function aggregateByCluster(
  entries: ThreeWEntry[]
): Array<{
  cluster: HumanitarianCluster;
  organizations: number;
  activities: number;
  targetBeneficiaries: number;
  actualBeneficiaries: number;
  provinces: string[];
}> {
  const clusterMap = new Map<
    HumanitarianCluster,
    {
      organizations: Set<string>;
      activities: number;
      targetBeneficiaries: number;
      actualBeneficiaries: number;
      provinces: Set<string>;
    }
  >();

  for (const entry of entries) {
    const cluster = entry.what.cluster;
    if (!clusterMap.has(cluster)) {
      clusterMap.set(cluster, {
        organizations: new Set(),
        activities: 0,
        targetBeneficiaries: 0,
        actualBeneficiaries: 0,
        provinces: new Set(),
      });
    }

    const data = clusterMap.get(cluster)!;
    data.organizations.add(entry.who.id);
    data.activities++;
    data.targetBeneficiaries += entry.what.targetBeneficiaries;
    data.actualBeneficiaries += entry.what.actualBeneficiaries;
    data.provinces.add(entry.where.province);
  }

  return Array.from(clusterMap.entries()).map(([cluster, data]) => ({
    cluster,
    organizations: data.organizations.size,
    activities: data.activities,
    targetBeneficiaries: data.targetBeneficiaries,
    actualBeneficiaries: data.actualBeneficiaries,
    provinces: Array.from(data.provinces),
  }));
}

/**
 * Aggregate 3W entries by organization type
 */
export function aggregateByOrganizationType(
  entries: ThreeWEntry[]
): Array<{
  orgType: OrganizationType;
  organizations: number;
  activities: number;
  targetBeneficiaries: number;
  actualBeneficiaries: number;
}> {
  const typeMap = new Map<
    OrganizationType,
    {
      organizations: Set<string>;
      activities: number;
      targetBeneficiaries: number;
      actualBeneficiaries: number;
    }
  >();

  for (const entry of entries) {
    const orgType = entry.who.type;
    if (!typeMap.has(orgType)) {
      typeMap.set(orgType, {
        organizations: new Set(),
        activities: 0,
        targetBeneficiaries: 0,
        actualBeneficiaries: 0,
      });
    }

    const data = typeMap.get(orgType)!;
    data.organizations.add(entry.who.id);
    data.activities++;
    data.targetBeneficiaries += entry.what.targetBeneficiaries;
    data.actualBeneficiaries += entry.what.actualBeneficiaries;
  }

  return Array.from(typeMap.entries()).map(([orgType, data]) => ({
    orgType,
    organizations: data.organizations.size,
    activities: data.activities,
    targetBeneficiaries: data.targetBeneficiaries,
    actualBeneficiaries: data.actualBeneficiaries,
  }));
}

// =============================================================================
// 3. 5W GAP ANALYSIS
// =============================================================================

/**
 * Calculate 5W gap analysis
 * Identifies underserved areas and populations
 *
 * Gap = Target Population - Reached Population
 * Gap Percentage = (Gap / Target) × 100
 */
export function calculateGapAnalysis(
  entries: ThreeWEntry[],
  incidents: Incident[]
): FiveWGapAnalysis[] {
  const gaps: FiveWGapAnalysis[] = [];

  // Group entries by province + cluster
  const groupMap = new Map<
    string,
    {
      location: IncidentLocation;
      cluster: HumanitarianCluster;
      targetPopulation: number;
      reachedPopulation: number;
      organizationIds: Set<string>;
      needsIdentified: Set<string>;
    }
  >();

  for (const entry of entries) {
    const key = `${entry.where.province}-${entry.what.cluster}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        location: entry.where,
        cluster: entry.what.cluster,
        targetPopulation: 0,
        reachedPopulation: 0,
        organizationIds: new Set(),
        needsIdentified: new Set(),
      });
    }

    const data = groupMap.get(key)!;
    data.targetPopulation += entry.what.targetBeneficiaries;
    data.reachedPopulation += entry.what.actualBeneficiaries;
    data.organizationIds.add(entry.who.id);
  }

  // Add incident-based needs
  for (const incident of incidents) {
    if (incident.status !== "active" && incident.status !== "escalated") continue;

    const key = `${incident.location.province}-shelter`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        location: incident.location,
        cluster: "shelter",
        targetPopulation: incident.peopleAtRisk,
        reachedPopulation: 0,
        organizationIds: new Set(),
        needsIdentified: new Set(["shelter", "food", "water"]),
      });
    }
  }

  // Convert to gap analysis results
  for (const [, data] of groupMap) {
    const gap = data.targetPopulation - data.reachedPopulation;
    const gapPercentage =
      data.targetPopulation > 0
        ? Math.round((gap / data.targetPopulation) * 100)
        : 0;

    gaps.push({
      location: data.location,
      cluster: data.cluster,
      targetPopulation: data.targetPopulation,
      reachedPopulation: data.reachedPopulation,
      gapPercentage: Math.max(0, gapPercentage),
      organizationsActive: data.organizationIds.size,
      needsIdentified: Array.from(data.needsIdentified),
    });
  }

  // Sort by gap percentage (highest first = most underserved)
  return gaps.sort((a, b) => b.gapPercentage - a.gapPercentage);
}

// =============================================================================
// 4. MAP DATA GENERATION
// =============================================================================

/**
 * Generate map markers for organizations
 * Returns data suitable for Leaflet markers
 */
export function generateOrganizationMapData(
  organizations: Organization[]
): Array<{
  id: string;
  name: string;
  acronym: string;
  type: OrganizationType;
  lat: number;
  lng: number;
  color: string;
  icon: string;
}> {
  return organizations.map((org) => {
    const config = ORGANIZATION_TYPE_CONFIG[org.type];
    return {
      id: org.id,
      name: org.name,
      acronym: org.acronym,
      type: org.type,
      lat: org.location.lat,
      lng: org.location.lng,
      color: config.color,
      icon: config.icon,
    };
  });
}

/**
 * Generate map markers for 3W activities
 * Returns data suitable for Leaflet markers with popup content
 */
export function generateActivityMapData(
  entries: ThreeWEntry[]
): Array<{
  id: string;
  lat: number;
  lng: number;
  cluster: HumanitarianCluster;
  orgName: string;
  activityType: string;
  targetBeneficiaries: number;
  actualBeneficiaries: number;
  status: ActivityStatus;
  color: string;
  icon: string;
  popupContent: string;
}> {
  return entries.map((entry) => {
    const clusterConfig = HUMANITARIAN_CLUSTER_CONFIG[entry.what.cluster];
    const statusConfig = ACTIVITY_STATUS_CONFIG[entry.status];

    const popupContent = [
      `<strong>${entry.who.name} (${entry.who.acronym})</strong>`,
      `Hoạt động: ${entry.what.activityType}`,
      `Lĩnh vực: ${clusterConfig.labelVi}`,
      `Địa điểm: ${entry.where.district}, ${entry.where.province}`,
      `Mục tiêu: ${entry.what.targetBeneficiaries.toLocaleString()} người`,
      `Đã tiếp cận: ${entry.what.actualBeneficiaries.toLocaleString()} người`,
      `Trạng thái: ${statusConfig.labelVi}`,
    ].join("<br/>");

    return {
      id: entry.id,
      lat: entry.where.lat,
      lng: entry.where.lng,
      cluster: entry.what.cluster,
      orgName: entry.who.name,
      activityType: entry.what.activityType,
      targetBeneficiaries: entry.what.targetBeneficiaries,
      actualBeneficiaries: entry.what.actualBeneficiaries,
      status: entry.status,
      color: clusterConfig.color,
      icon: clusterConfig.icon,
      popupContent,
    };
  });
}

// =============================================================================
// 5. STATISTICS & SUMMARY
// =============================================================================

/**
 * Generate 3W summary statistics
 */
export function generateThreeWSummary(
  entries: ThreeWEntry[],
  organizations: Organization[]
): {
  totalOrganizations: number;
  totalActivities: number;
  totalTargetBeneficiaries: number;
  totalActualBeneficiaries: number;
  coverageRate: number;
  activeClusters: number;
  activeProvinces: number;
  byOrgType: Array<{
    type: OrganizationType;
    labelVi: string;
    count: number;
    color: string;
  }>;
  byCluster: Array<{
    cluster: HumanitarianCluster;
    labelVi: string;
    activities: number;
    beneficiaries: number;
    color: string;
  }>;
} {
  const totalOrganizations = organizations.length;
  const totalActivities = entries.length;
  const totalTargetBeneficiaries = entries.reduce(
    (sum, e) => sum + e.what.targetBeneficiaries,
    0
  );
  const totalActualBeneficiaries = entries.reduce(
    (sum, e) => sum + e.what.actualBeneficiaries,
    0
  );
  const coverageRate =
    totalTargetBeneficiaries > 0
      ? Math.round((totalActualBeneficiaries / totalTargetBeneficiaries) * 100)
      : 0;

  // Count unique clusters and provinces
  const uniqueClusters = new Set(entries.map((e) => e.what.cluster));
  const uniqueProvinces = new Set(entries.map((e) => e.where.province));

  // By org type
  const orgTypeGroups = groupOrganizationsByType(organizations);
  const byOrgType = Array.from(orgTypeGroups.entries()).map(([type, orgs]) => {
    const config = ORGANIZATION_TYPE_CONFIG[type];
    return {
      type,
      labelVi: config.labelVi,
      count: orgs.length,
      color: config.color,
    };
  });

  // By cluster
  const clusterAgg = aggregateByCluster(entries);
  const byCluster = clusterAgg.map((agg) => {
    const config = HUMANITARIAN_CLUSTER_CONFIG[agg.cluster];
    return {
      cluster: agg.cluster,
      labelVi: config.labelVi,
      activities: agg.activities,
      beneficiaries: agg.actualBeneficiaries,
      color: config.color,
    };
  });

  return {
    totalOrganizations,
    totalActivities,
    totalTargetBeneficiaries,
    totalActualBeneficiaries,
    coverageRate,
    activeClusters: uniqueClusters.size,
    activeProvinces: uniqueProvinces.size,
    byOrgType,
    byCluster,
  };
}

// =============================================================================
// 6. HXL-COMPATIBLE DATA EXPORT
// =============================================================================

/**
 * Export 3W data in HXL (Humanitarian Exchange Language) compatible format
 * HXL uses hashtag-based metadata for data interoperability
 *
 * @see https://hxlstandard.org/
 */
export function exportToHXLFormat(entries: ThreeWEntry[]): Array<Record<string, string | number>> {
  return entries.map((entry) => ({
    // WHO
    "#org+name": entry.who.name,
    "#org+acronym": entry.who.acronym,
    "#org+type": entry.who.type,

    // WHAT
    "#sector": entry.what.cluster,
    "#activity+type": entry.what.activityType,
    "#activity+description": entry.what.activityDescription,
    "#activity+status": entry.status,

    // WHERE
    "#adm1+name": entry.where.province,
    "#adm2+name": entry.where.district,
    "#adm3+name": entry.where.commune || "",
    "#lat": entry.where.lat,
    "#lon": entry.where.lng,

    // WHEN
    "#date+start": entry.when.started,
    "#date+end": entry.when.estimatedEnd || "",

    // HOW MANY (5W extension)
    "#targeted+num": entry.what.targetBeneficiaries,
    "#reached+num": entry.what.actualBeneficiaries,
  }));
}

/**
 * Generate HXL hashtag header row
 */
export function getHXLHeaderRow(): Record<string, string> {
  return {
    "#org+name": "Organization Name",
    "#org+acronym": "Organization Acronym",
    "#org+type": "Organization Type",
    "#sector": "Humanitarian Cluster",
    "#activity+type": "Activity Type",
    "#activity+description": "Activity Description",
    "#activity+status": "Activity Status",
    "#adm1+name": "Province",
    "#adm2+name": "District",
    "#adm3+name": "Commune",
    "#lat": "Latitude",
    "#lon": "Longitude",
    "#date+start": "Start Date",
    "#date+end": "End Date",
    "#targeted+num": "Target Beneficiaries",
    "#reached+num": "Reached Beneficiaries",
  };
}
