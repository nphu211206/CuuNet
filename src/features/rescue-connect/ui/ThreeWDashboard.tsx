"use client";

// =============================================================================
// 3W DASHBOARD - Who-What-Where Dashboard (UN OCHA Inspired)
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Split view: Organization list + 3W summary stats
//
// Features:
//   - Organization cards grouped by type
//   - 3W activity summary by cluster
//   - 5W gap analysis display
//   - Coverage rate visualization
//   - Beneficiary progress bars
//   - Filter by cluster/province/org type
//   - Animated entrance with stagger
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Users,
  Target,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronRight,
  Globe,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import type {
  Organization,
  OrganizationType,
  ThreeWEntry,
  FiveWGapAnalysis,
  HumanitarianCluster,
  ThreeWDashboardProps,
} from "../lib/types";
import {
  ORGANIZATION_TYPE_CONFIG,
  HUMANITARIAN_CLUSTER_CONFIG,
  ACTIVITY_STATUS_CONFIG,
} from "../config/rescue-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

// =============================================================================
// COVERAGE GAUGE
// =============================================================================

function CoverageGauge({ rate, label }: { rate: number; label: string }) {
  const radius = 32;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (rate / 100) * circumference;

  const color = rate >= 80 ? "#22C55E" : rate >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={72} height={72} className="-rotate-90">
          <circle cx={36} cy={36} r={radius} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={5} />
          <motion.circle
            cx={36} cy={36} r={radius}
            fill="none" stroke={color} strokeWidth={5}
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black tabular-nums" style={{ color }}>{rate}%</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-500 mt-1">{label}</span>
    </div>
  );
}

// =============================================================================
// ORGANIZATION CARD
// =============================================================================

function OrganizationCard({ org }: { org: Organization }) {
  const config = ORGANIZATION_TYPE_CONFIG[org.type];

  return (
    <motion.div
      variants={cardVariants}
      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30` }}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-slate-800 truncate">{org.name}</h4>
          <p className="text-[10px] font-medium mt-0.5" style={{ color: config.color }}>
            {org.acronym} • {config.labelVi}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {org.capacity} nhân sự
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {org.location.province}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {org.sectors.slice(0, 3).map((cluster) => {
              const clusterConfig = HUMANITARIAN_CLUSTER_CONFIG[cluster];
              return (
                <span
                  key={cluster}
                  className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200"
                >
                  {clusterConfig.icon} {clusterConfig.labelVi}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CLUSTER SUMMARY CARD
// =============================================================================

function ClusterSummaryCard({
  cluster,
  activities,
  beneficiaries,
  organizations,
}: {
  cluster: HumanitarianCluster;
  activities: number;
  beneficiaries: number;
  organizations: number;
}) {
  const config = HUMANITARIAN_CLUSTER_CONFIG[cluster];

  return (
    <motion.div
      variants={cardVariants}
      className="p-3 rounded-xl bg-white border border-slate-200"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: `${config.color}15` }}
        >
          {config.icon}
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-800">{config.labelVi}</h4>
          <p className="text-[9px] text-slate-500">{organizations} tổ chức</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-1.5 rounded-lg bg-slate-50">
          <span className="text-[9px] text-slate-500 block">Hoạt động</span>
          <span className="text-sm font-bold text-blue-400">{activities}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50">
          <span className="text-[9px] text-slate-500 block">Tiếp cận</span>
          <span className="text-sm font-bold text-green-400">{beneficiaries.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// GAP ANALYSIS CARD
// =============================================================================

function GapAnalysisCard({ gap }: { gap: FiveWGapAnalysis }) {
  const clusterConfig = HUMANITARIAN_CLUSTER_CONFIG[gap.cluster];
  const gapColor = gap.gapPercentage >= 70 ? "#EF4444" : gap.gapPercentage >= 40 ? "#F97316" : "#F59E0B";

  return (
    <motion.div
      variants={cardVariants}
      className="p-3 rounded-xl bg-white border border-slate-200"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{clusterConfig.icon}</span>
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-slate-800">{clusterConfig.labelVi}</h4>
          <p className="text-[10px] text-slate-500">{gap.location.province}</p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: `${gapColor}15`, color: gapColor }}
        >
          {gap.gapPercentage}% thiếu
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${100 - gap.gapPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-green-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div>
          <span className="text-[9px] text-slate-500 block">Mục tiêu</span>
          <span className="text-[11px] font-bold text-slate-700">{gap.targetPopulation.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 block">Đã tiếp cận</span>
          <span className="text-[11px] font-bold text-green-400">{gap.reachedPopulation.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 block">Tổ chức</span>
          <span className="text-[11px] font-bold text-blue-400">{gap.organizationsActive}</span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ThreeWDashboardComponent({
  entries,
  organizations,
  incidents,
  gapAnalysis,
  onOrgSelect,
  className,
}: ThreeWDashboardProps) {
  const [orgTypeFilter, setOrgTypeFilter] = useState<OrganizationType | "all">("all");
  const [clusterFilter, setClusterFilter] = useState<HumanitarianCluster | "all">("all");

  // Filter organizations
  const filteredOrgs = useMemo(() => {
    if (orgTypeFilter === "all") return organizations;
    return organizations.filter((o) => o.type === orgTypeFilter);
  }, [organizations, orgTypeFilter]);

  // Group orgs by type
  const orgsByType = useMemo(() => {
    const groups = new Map<OrganizationType, Organization[]>();
    for (const org of filteredOrgs) {
      const existing = groups.get(org.type) || [];
      existing.push(org);
      groups.set(org.type, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredOrgs]);

  // Cluster summary
  const clusterSummary = useMemo(() => {
    const summary = new Map<HumanitarianCluster, { activities: number; beneficiaries: number; orgs: Set<string> }>();
    for (const entry of entries) {
      const cluster = entry.what.cluster;
      if (!summary.has(cluster)) {
        summary.set(cluster, { activities: 0, beneficiaries: 0, orgs: new Set() });
      }
      const data = summary.get(cluster)!;
      data.activities++;
      data.beneficiaries += entry.what.actualBeneficiaries;
      data.orgs.add(entry.who.id);
    }
    return Array.from(summary.entries())
      .map(([cluster, data]) => ({
        cluster,
        activities: data.activities,
        beneficiaries: data.beneficiaries,
        organizations: data.orgs.size,
      }))
      .sort((a, b) => b.activities - a.activities);
  }, [entries]);

  // Overall stats
  const totalBeneficiaries = useMemo(
    () => entries.reduce((sum, e) => sum + e.what.actualBeneficiaries, 0),
    [entries]
  );
  const totalTarget = useMemo(
    () => entries.reduce((sum, e) => sum + e.what.targetBeneficiaries, 0),
    [entries]
  );
  const coverageRate = totalTarget > 0 ? Math.round((totalBeneficiaries / totalTarget) * 100) : 0;

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
          <Building2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <span className="text-xl font-bold text-white block">{organizations.length}</span>
          <span className="text-[10px] text-slate-500">Tổ chức</span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
          <Target className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <span className="text-xl font-bold text-white block">{entries.length}</span>
          <span className="text-[10px] text-slate-500">Hoạt động</span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
          <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <span className="text-xl font-bold text-white block">{totalBeneficiaries.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">Đã tiếp cận</span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          <CoverageGauge rate={coverageRate} label="Tỷ lệ phủ" />
        </div>
      </div>

      {/* Org type filter */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {[{ id: "all" as const, label: "Tất cả", icon: "📋" },
          ...Object.entries(ORGANIZATION_TYPE_CONFIG).map(([id, config]) => ({
            id: id as OrganizationType,
            label: config.labelVi,
            icon: config.icon,
          })),
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setOrgTypeFilter(filter.id)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              orgTypeFilter === filter.id
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Organizations by type */}
      <div className="space-y-3">
        {orgsByType.map(([type, orgs]) => {
          const config = ORGANIZATION_TYPE_CONFIG[type];
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{config.icon}</span>
                <span className="text-xs font-semibold text-slate-800">{config.labelVi}</span>
                <span className="text-[10px] text-slate-500">({orgs.length})</span>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-2"
              >
                {orgs.map((org) => (
                  <OrganizationCard key={org.id} org={org} />
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Cluster summary */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">📊 Tổng hợp theo lĩnh vực</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
        >
          {clusterSummary.map((item) => (
            <ClusterSummaryCard
              key={item.cluster}
              cluster={item.cluster}
              activities={item.activities}
              beneficiaries={item.beneficiaries}
              organizations={item.organizations}
            />
          ))}
        </motion.div>
      </div>

      {/* Gap analysis */}
      {gapAnalysis.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Phân tích khoảng cách (5W)
          </h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {gapAnalysis.slice(0, 6).map((gap, i) => (
              <GapAnalysisCard key={`${gap.location.province}-${gap.cluster}-${i}`} gap={gap} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export const ThreeWDashboard = memo(ThreeWDashboardComponent);
