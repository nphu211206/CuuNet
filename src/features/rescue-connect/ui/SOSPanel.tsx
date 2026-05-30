"use client";

// =============================================================================
// SOS PANEL - Emergency SOS Management with Triage Visualization
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - SOS request list with status pipeline
//   - Triage score visualization (gauge + breakdown)
//   - START/SALT assessment display
//   - Quick actions (triage, dispatch, resolve)
//   - Status filter row
//   - Priority badges with color coding
//   - Special needs chips (children, elderly, disabled, trapped, medical)
//   - Animated entrance with stagger
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  MapPin,
  Users,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Tag,
  Heart,
  Baby,
  PersonStanding,
  Accessibility,
  Link2,
  Stethoscope,
  Filter,
  Zap,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import type {
  RescueSOSRequest,
  RescueSOSStatus,
  TriageColor,
  TriageMethod,
  SOSPanelProps,
} from "../lib/types";
import {
  RESCUE_SOS_STATUS_CONFIG,
  TRIAGE_COLOR_CONFIG,
  INCIDENT_TYPE_CONFIG,
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

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

const expandVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 },
  },
};

// =============================================================================
// TRIAGE GAUGE SUB-COMPONENT
// =============================================================================

function TriageGauge({ score, color }: { score: number; color: TriageColor }) {
  const gaugeColor = TRIAGE_COLOR_CONFIG[color].color;
  const radius = 36;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={80} height={80} className="-rotate-90">
        <circle
          cx={40}
          cy={40}
          r={radius}
          fill="none"
          stroke="rgba(100,116,139,0.15)"
          strokeWidth={6}
        />
        <motion.circle
          cx={40}
          cy={40}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-black tabular-nums"
          style={{ color: gaugeColor }}
        >
          {score}
        </span>
        <span className="text-[8px] text-slate-500">/100</span>
      </div>
    </div>
  );
}

// =============================================================================
// TRIAGE BREAKDOWN SUB-COMPONENT
// =============================================================================

function TriageBreakdownDisplay({
  breakdown,
}: {
  breakdown: RescueSOSRequest["triage"]["breakdown"];
}) {
  const factors = [
    { label: "Mức độ", score: breakdown.severityScore, weight: breakdown.severityWeight, color: "#EF4444" },
    { label: "Số người", score: breakdown.populationScore, weight: breakdown.populationWeight, color: "#F97316" },
    { label: "Tiếp cận", score: breakdown.accessibilityScore, weight: breakdown.accessibilityWeight, color: "#3B82F6" },
    { label: "Khẩn cấp", score: breakdown.urgencyScore, weight: breakdown.urgencyWeight, color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-1.5">
      {factors.map((factor) => (
        <div key={factor.label} className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-16">{factor.label}</span>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${factor.score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: factor.color }}
            />
          </div>
          <span className="text-[10px] font-medium tabular-nums w-8 text-right" style={{ color: factor.color }}>
            {factor.score}
          </span>
          <span className="text-[9px] text-slate-600">×{factor.weight}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SPECIAL NEEDS CHIPS
// =============================================================================

function SpecialNeedsChips({ sos }: { sos: RescueSOSRequest }) {
  const chips: Array<{ icon: React.ReactNode; label: string; active: boolean; color: string }> = [
    { icon: <Baby className="w-3 h-3" />, label: "Trẻ em", active: sos.situation.hasChildren, color: "#F59E0B" },
    { icon: <PersonStanding className="w-3 h-3" />, label: "Người già", active: sos.situation.hasElderly, color: "#8B5CF6" },
    { icon: <Accessibility className="w-3 h-3" />, label: "Khuyết tật", active: sos.situation.hasDisabled, color: "#3B82F6" },
    { icon: <Link2 className="w-3 h-3" />, label: "Mắc kẹt", active: sos.situation.isTrapped, color: "#EF4444" },
    { icon: <Stethoscope className="w-3 h-3" />, label: "Cần y tế", active: sos.situation.needsMedical, color: "#EC4899" },
  ];

  const activeChips = chips.filter((c) => c.active);
  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {activeChips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium"
          style={{
            backgroundColor: `${chip.color}15`,
            color: chip.color,
            border: `1px solid ${chip.color}30`,
          }}
        >
          {chip.icon}
          {chip.label}
        </span>
      ))}
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
  activeFilter: RescueSOSStatus | "all";
  onFilterChange: (status: RescueSOSStatus | "all") => void;
}) {
  const filters: Array<{ id: RescueSOSStatus | "all"; label: string; icon: string }> = [
    { id: "all", label: "Tất cả", icon: "📋" },
    { id: "pending", label: "Chờ", icon: "⏳" },
    { id: "triaged", label: "Phân loại", icon: "🏷️" },
    { id: "dispatched", label: "Triển khai", icon: "🚁" },
    { id: "en_route", label: "Đang đi", icon: "🚗" },
    { id: "on_scene", label: "Tại chỗ", icon: "📍" },
    { id: "resolved", label: "Đã cứu", icon: "✅" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const config = filter.id !== "all" ? RESCUE_SOS_STATUS_CONFIG[filter.id] : null;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              isActive
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            {filter.id !== "all" && config && (
              <span
                className="w-1.5 h-1.5 rounded-full ml-0.5"
                style={{ backgroundColor: config.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// SOS CARD SUB-COMPONENT
// =============================================================================

function SOSCard({
  sos,
  isSelected,
  onSelect,
  onTriage,
  onDispatch,
  onResolve,
}: {
  sos: RescueSOSRequest;
  isSelected: boolean;
  onSelect: () => void;
  onTriage: (method: TriageMethod) => void;
  onDispatch: () => void;
  onResolve: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const triageConfig = TRIAGE_COLOR_CONFIG[sos.triage.color];
  const statusConfig = RESCUE_SOS_STATUS_CONFIG[sos.dispatch.status];
  const typeConfig = INCIDENT_TYPE_CONFIG[sos.situation.type as keyof typeof INCIDENT_TYPE_CONFIG];

  const canTriage = sos.dispatch.status === "pending";
  const canDispatch = sos.dispatch.status === "triaged";
  const canResolve = sos.dispatch.status === "on_scene" || sos.dispatch.status === "dispatched";

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={clsx(
        "rounded-xl border transition-all duration-200 cursor-pointer",
        isSelected
          ? "bg-slate-100 border-blue-500/40"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Header */}
      <div onClick={onSelect} className="p-3">
        <div className="flex items-start gap-3">
          {/* Triage gauge */}
          <TriageGauge score={sos.triage.score} color={sos.triage.color} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white">{sos.id}</span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: triageConfig.bgColor,
                  color: triageConfig.color,
                }}
              >
                {triageConfig.labelVi}
              </span>
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${statusConfig.color}15`,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.icon} {statusConfig.labelVi}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
              <MapPin className="w-3 h-3" />
              <span>{sos.location.district}, {sos.location.province}</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {sos.situation.peopleCount} người
              </span>
              {typeConfig && (
                <span className="flex items-center gap-1">
                  {typeConfig.icon} {typeConfig.labelVi}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(sos.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Special needs */}
            <div className="mt-1.5">
              <SpecialNeedsChips sos={sos} />
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded hover:bg-slate-100"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-slate-200 pt-3">
              {/* Description */}
              {sos.situation.description && (
                <p className="text-xs text-slate-500">{sos.situation.description}</p>
              )}

              {/* Triage explanation */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-medium text-slate-700 mb-1.5">📊 Giải thích phân loại</p>
                <p className="text-[11px] text-slate-500">{sos.triage.explanation}</p>
                <div className="mt-2">
                  <TriageBreakdownDisplay breakdown={sos.triage.breakdown} />
                </div>
              </div>

              {/* Dispatch info */}
              {sos.dispatch.assignedUnitId && (
                <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                  <p className="text-[10px] font-medium text-blue-400 mb-1">🚁 Đơn vị được triển khai</p>
                  <p className="text-xs text-slate-700">ID: {sos.dispatch.assignedUnitId}</p>
                  {sos.dispatch.etaMinutes && (
                    <p className="text-[11px] text-slate-500">ETA: {sos.dispatch.etaMinutes} phút</p>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-slate-500">📅 Timeline</p>
                {sos.timeline.slice(-4).map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px]">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: RESCUE_SOS_STATUS_CONFIG[entry.status]?.color || "#6B7280" }}
                    />
                    <div>
                      <span className="text-slate-500">
                        {new Date(entry.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {entry.note && <span className="text-slate-500 ml-1">- {entry.note}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {canTriage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriage("custom");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[11px] font-medium hover:bg-purple-500/25 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Phân loại
                  </button>
                )}
                {canDispatch && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDispatch();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-medium hover:bg-blue-500/25 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Triển khai
                  </button>
                )}
                {canResolve && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-medium hover:bg-green-500/25 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã cứu
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

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Siren className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-sm text-slate-500 mb-1">Không có yêu cầu SOS</p>
      <p className="text-xs text-slate-600">
        {filter === "all" ? "Chưa có yêu cầu cứu hộ nào" : `Không có yêu cầu ở trạng thái "${filter}"`}
      </p>
    </div>
  );
}

// =============================================================================
// STATS SUMMARY
// =============================================================================

function SOSStatsSummary({ requests }: { requests: RescueSOSRequest[] }) {
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((s) => s.dispatch.status === "pending").length;
    const critical = requests.filter((s) => s.triage.color === "red" && s.dispatch.status !== "resolved").length;
    const resolved = requests.filter((s) => s.dispatch.status === "resolved").length;

    return { total, pending, critical, resolved };
  }, [requests]);

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Tổng", value: stats.total, color: "#3B82F6" },
        { label: "Chờ", value: stats.pending, color: "#F59E0B" },
        { label: "Khẩn cấp", value: stats.critical, color: "#EF4444" },
        { label: "Đã cứu", value: stats.resolved, color: "#22C55E" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="p-2 rounded-lg bg-white border border-slate-200 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-lg font-bold tabular-nums block"
            style={{ color: stat.color }}
          >
            {stat.value}
          </motion.span>
          <span className="text-[9px] text-slate-500">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SOSPanelComponent({
  sosRequests,
  incidents,
  onTriage,
  onDispatch,
  onResolve,
  onSelect,
  selectedSOS,
  className,
}: SOSPanelProps) {
  const [statusFilter, setStatusFilter] = useState<RescueSOSStatus | "all">("all");

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return sosRequests;
    return sosRequests.filter((s) => s.dispatch.status === statusFilter);
  }, [sosRequests, statusFilter]);

  // Sort by triage score (highest first)
  const sortedRequests = useMemo(
    () => [...filteredRequests].sort((a, b) => b.triage.score - a.triage.score),
    [filteredRequests]
  );

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Stats summary */}
      <SOSStatsSummary requests={sosRequests} />

      {/* Status filter */}
      <StatusFilterRow activeFilter={statusFilter} onFilterChange={setStatusFilter} />

      {/* SOS list */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {sortedRequests.length === 0 ? (
          <EmptyState filter={statusFilter} />
        ) : (
          sortedRequests.map((sos) => (
            <SOSCard
              key={sos.id}
              sos={sos}
              isSelected={selectedSOS?.id === sos.id}
              onSelect={() => onSelect(sos)}
              onTriage={(method) => onTriage(sos.id, method)}
              onDispatch={() => onDispatch(sos.id, "")}
              onResolve={() => onResolve(sos.id)}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}

export const SOSPanel = memo(SOSPanelComponent);
