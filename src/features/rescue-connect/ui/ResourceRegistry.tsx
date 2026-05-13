"use client";

// =============================================================================
// RESOURCE REGISTRY - Resource Management Grid
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - Resource grid with cards
//   - Status filter (available/deployed/returning/maintenance)
//   - Type filter (boat/helicopter/ambulance/etc.)
//   - Deploy/Return actions
//   - Capability badges
//   - Location display
//   - Utilization stats bar
//   - Animated entrance with stagger
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  MapPin,
  Users,
  Zap,
  Filter,
  ChevronDown,
  ChevronRight,
  Send,
  RotateCcw,
  Wrench,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import type {
  RescueResource,
  ResourceType,
  ResourceStatus,
  ResourceCapability,
  ResourceRegistryProps,
} from "../lib/types";
import {
  RESOURCE_TYPE_CONFIG,
  RESOURCE_STATUS_CONFIG,
  RESOURCE_CAPABILITY_CONFIG,
} from "../config/rescue-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35 },
  },
};

// =============================================================================
// UTILIZATION STATS BAR
// =============================================================================

function UtilizationBar({ resources }: { resources: RescueResource[] }) {
  const stats = useMemo(() => {
    const total = resources.length;
    const available = resources.filter((r) => r.status === "available").length;
    const deployed = resources.filter((r) => r.status === "deployed").length;
    const returning = resources.filter((r) => r.status === "returning").length;
    const maintenance = resources.filter((r) => r.status === "maintenance").length;

    return {
      total,
      available,
      deployed,
      returning,
      maintenance,
      utilizationRate: total > 0 ? Math.round((deployed / total) * 100) : 0,
    };
  }, [resources]);

  return (
    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-200">Sử dụng tài nguyên</span>
        <span className="text-xs font-bold text-blue-400">{stats.utilizationRate}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
        {stats.total > 0 && (
          <>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.deployed / stats.total) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-blue-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.returning / stats.total) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full bg-amber-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.maintenance / stats.total) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-slate-600"
            />
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        {[
          { label: "Sẵn sàng", count: stats.available, color: "#22C55E" },
          { label: "Triển khai", count: stats.deployed, color: "#3B82F6" },
          { label: "Trở về", count: stats.returning, color: "#F59E0B" },
          { label: "Bảo trì", count: stats.maintenance, color: "#6B7280" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-slate-500">
              {item.label}: {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// STATUS FILTER ROW
// =============================================================================

function StatusFilterRow({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: ResourceStatus | "all";
  onFilterChange: (status: ResourceStatus | "all") => void;
}) {
  const filters: Array<{ id: ResourceStatus | "all"; label: string; icon: string; color?: string }> = [
    { id: "all", label: "Tất cả", icon: "📋" },
    { id: "available", label: "Sẵn sàng", icon: "🟢", color: "#22C55E" },
    { id: "deployed", label: "Triển khai", icon: "🔵", color: "#3B82F6" },
    { id: "returning", label: "Trở về", icon: "🟡", color: "#F59E0B" },
    { id: "maintenance", label: "Bảo trì", icon: "⚫", color: "#6B7280" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              isActive
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50"
            )}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// TYPE FILTER ROW
// =============================================================================

function TypeFilterRow({
  activeType,
  onTypeChange,
  resources,
}: {
  activeType: ResourceType | "all";
  onTypeChange: (type: ResourceType | "all") => void;
  resources: RescueResource[];
}) {
  const typeCounts = useMemo(() => {
    const counts = new Map<ResourceType, number>();
    for (const r of resources) {
      counts.set(r.type, (counts.get(r.type) || 0) + 1);
    }
    return counts;
  }, [resources]);

  const types: Array<{ id: ResourceType | "all"; label: string; icon: string }> = [
    { id: "all", label: "Tất cả", icon: "📋" },
    ...(Object.entries(RESOURCE_TYPE_CONFIG) as [ResourceType, typeof RESOURCE_TYPE_CONFIG[ResourceType]][]).map(([id, config]) => ({
      id,
      label: config.labelVi,
      icon: config.icon,
    })),
  ];

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
      {types.map((type) => {
        const isActive = activeType === type.id;
        const count = type.id === "all" ? resources.length : typeCounts.get(type.id) || 0;

        if (count === 0 && type.id !== "all") return null;

        return (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={clsx(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              isActive
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50"
            )}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
            <span className="text-[9px] text-slate-600 ml-0.5">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// CAPABILITY BADGES
// =============================================================================

function CapabilityBadges({ capabilities }: { capabilities: ResourceCapability[] }) {
  if (capabilities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {capabilities.slice(0, 4).map((cap) => {
        const config = RESOURCE_CAPABILITY_CONFIG[cap];
        if (!config) return null;

        return (
          <span
            key={cap}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-medium bg-slate-800/50 text-slate-400 border border-slate-700/30"
          >
            {config.icon} {config.labelVi}
          </span>
        );
      })}
      {capabilities.length > 4 && (
        <span className="text-[8px] text-slate-600 px-1 py-0.5">
          +{capabilities.length - 4}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// RESOURCE CARD
// =============================================================================

function ResourceCard({
  resource,
  incidents,
  onDeploy,
  onReturn,
}: {
  resource: RescueResource;
  incidents: ResourceRegistryProps["incidents"];
  onDeploy: (resourceId: string, incidentId: string) => void;
  onReturn: (resourceId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = RESOURCE_TYPE_CONFIG[resource.type];
  const statusConfig = RESOURCE_STATUS_CONFIG[resource.status];

  const canDeploy = resource.status === "available";
  const canReturn = resource.status === "deployed";

  const assignedIncident = resource.assignedIncidentId
    ? incidents.find((i) => i.id === resource.assignedIncidentId)
    : null;

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={clsx(
        "rounded-xl border p-3 transition-all duration-200",
        "bg-slate-900/50 border-slate-700/30 hover:border-slate-600/50"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            backgroundColor: `${statusConfig.color}15`,
            border: `1px solid ${statusConfig.color}30`,
          }}
        >
          {typeConfig.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{resource.name}</h4>
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
              style={{
                backgroundColor: `${statusConfig.color}15`,
                color: statusConfig.color,
              }}
            >
              {statusConfig.labelVi}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {resource.capacity}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {resource.speed} km/h
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {resource.location.province}
            </span>
          </div>

          {/* Assigned incident */}
          {assignedIncident && (
            <div className="mt-1 p-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
              <p className="text-[10px] text-blue-400">
                🚁 {assignedIncident.title}
              </p>
            </div>
          )}

          {/* Capabilities */}
          <CapabilityBadges capabilities={resource.capabilities} />
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-slate-800/50"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-slate-700/20 space-y-2">
              {/* Notes */}
              {resource.notes && (
                <p className="text-[11px] text-slate-400">{resource.notes}</p>
              )}

              {/* Contact */}
              {resource.contactName && (
                <div className="text-[10px] text-slate-500">
                  <span>📞 {resource.contactName}</span>
                  {resource.contactPhone && <span className="ml-2">{resource.contactPhone}</span>}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {canDeploy && (
                  <button
                    onClick={() => {
                      // Deploy to first active incident
                      const activeIncident = incidents.find(
                        (i) => i.status === "active" || i.status === "escalated"
                      );
                      if (activeIncident) {
                        onDeploy(resource.id, activeIncident.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-medium hover:bg-blue-500/25 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Triển khai
                  </button>
                )}
                {canReturn && (
                  <button
                    onClick={() => onReturn(resource.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-medium hover:bg-green-500/25 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Trở về
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ statusFilter, typeFilter }: { statusFilter: string; typeFilter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <Truck className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-sm text-slate-400 mb-1">Không có tài nguyên</p>
      <p className="text-xs text-slate-600">
        {statusFilter === "all" && typeFilter === "all"
          ? "Chưa có tài nguyên nào được đăng ký"
          : "Không tài nguyên nào khớp với bộ lọc"}
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ResourceRegistryComponent({
  resources,
  incidents,
  onResourceAdd,
  onResourceUpdate,
  onResourceDeploy,
  onResourceReturn,
  className,
}: ResourceRegistryProps) {
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");

  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    return filtered;
  }, [resources, statusFilter, typeFilter]);

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Utilization stats */}
      <UtilizationBar resources={resources} />

      {/* Filters */}
      <div className="space-y-2">
        <StatusFilterRow activeFilter={statusFilter} onFilterChange={setStatusFilter} />
        <TypeFilterRow activeType={typeFilter} onTypeChange={setTypeFilter} resources={resources} />
      </div>

      {/* Resource grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
      >
        {filteredResources.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState statusFilter={statusFilter} typeFilter={typeFilter} />
          </div>
        ) : (
          filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              incidents={incidents}
              onDeploy={onResourceDeploy}
              onReturn={onResourceReturn}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}

export const ResourceRegistry = memo(ResourceRegistryComponent);
