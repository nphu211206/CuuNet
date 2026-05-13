"use client";

// =============================================================================
// SOS HISTORY PANEL - SOS Request History & Status Tracker
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Features:
//   - SOS history list with status timeline
//   - Status progression tracker (visual pipeline)
//   - Stats summary (total, active, resolved, failed)
//   - Filter by status
//   - Time formatting (relative + absolute)
//   - Priority badge with color coding
//   - Situation type icon + label
//   - People count + special needs chips
//   - GPS accuracy indicator
//   - Offline badge for offline-created SOS
//   - Animated entrance with stagger
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Baby,
  PersonStanding,
  Accessibility,
  Stethoscope,
  Lock,
  Zap,
  Heart,
  TrendingUp,
  BarChart3,
  Shield,
  Activity,
} from "lucide-react";
import clsx from "clsx";
import type {
  SOSHistoryPanelProps,
  SOSStatusTrackerProps,
  SOSRequest,
  SOSStatus,
  SOSType,
  SOSEmergencyLevel,
} from "../lib/types";
import {
  SOS_STATUS_CONFIG,
  SOS_TYPE_CONFIG,
  SOS_EMERGENCY_LEVEL_CONFIG,
} from "../config/alert-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

const stepVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.15 + i * 0.08, duration: 0.3, ease: "easeOut" as const },
  }),
};

// =============================================================================
// CONSTANTS
// =============================================================================

/** Các bước trong pipeline trạng thái SOS */
const SOS_STATUS_PIPELINE: SOSStatus[] = [
  "queued",
  "sent",
  "delivered",
  "acknowledged",
  "dispatched",
  "resolved",
];

/** Trạng thái là terminal (không thể thay đổi nữa) */
const TERMINAL_STATUSES: Set<SOSStatus> = new Set(["resolved", "failed"]);

/** Trạng thái đang hoạt động (chưa kết thúc) */
const ACTIVE_STATUSES: Set<SOSStatus> = new Set([
  "queued",
  "sent",
  "delivered",
  "acknowledged",
  "dispatched",
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  if (diff < 60_000) return "Vừa xong";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} giờ trước`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatElapsedTime(createdAt: string, resolvedAt?: string): string {
  const start = new Date(createdAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const diff = end - start;

  if (diff < 60_000) return `${Math.floor(diff / 1000)} giây`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} phút`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} giờ`;
  return `${Math.floor(diff / 86400_000)} ngày`;
}

/** Lấy chỉ số bước trong pipeline */
function getStepIndex(status: SOSStatus): number {
  if (status === "failed") return -1;
  return SOS_STATUS_PIPELINE.indexOf(status);
}

/** Kiểm tra bước đã hoàn thành chưa */
function isStepCompleted(stepStatus: SOSStatus, currentStatus: SOSStatus): boolean {
  if (currentStatus === "failed") return false;
  const stepIdx = getStepIndex(stepStatus);
  const currentIdx = getStepIndex(currentStatus);
  return stepIdx <= currentIdx;
}

/** Kiểm tra bước hiện tại */
function isCurrentStep(stepStatus: SOSStatus, currentStatus: SOSStatus): boolean {
  return stepStatus === currentStatus;
}

// =============================================================================
// SOS STATUS TRACKER - Visual Pipeline Component
// =============================================================================

function SOSStatusTracker({ sosRequest, className }: SOSStatusTrackerProps) {
  const currentStatus = sosRequest.status;
  const isFailed = currentStatus === "failed";

  // Timeline map for quick lookup
  const timelineMap = useMemo(() => {
    const map = new Map<SOSStatus, string>();
    for (const entry of sosRequest.timeline) {
      map.set(entry.status, entry.timestamp);
    }
    return map;
  }, [sosRequest.timeline]);

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Trạng thái</span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: SOS_STATUS_CONFIG[currentStatus].bgColor,
            color: SOS_STATUS_CONFIG[currentStatus].color,
          }}
        >
          {SOS_STATUS_CONFIG[currentStatus].icon} {SOS_STATUS_CONFIG[currentStatus].labelVi}
        </span>
      </div>

      {/* Visual Pipeline */}
      <div className="relative">
        {/* Failed state */}
        {isFailed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25"
          >
            <XCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Gửi thất bại</p>
              <p className="text-[10px] text-red-300/60 mt-0.5">
                Đã thử {sosRequest.retryCount}/{sosRequest.maxRetries} lần •{" "}
                {timelineMap.has("failed")
                  ? formatRelativeTime(timelineMap.get("failed")!)
                  : "Không xác định"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Pipeline Steps */}
        {!isFailed && (
          <div className="flex items-center justify-between gap-1">
            {SOS_STATUS_PIPELINE.map((stepStatus, idx) => {
              const config = SOS_STATUS_CONFIG[stepStatus];
              const completed = isStepCompleted(stepStatus, currentStatus);
              const current = isCurrentStep(stepStatus, currentStatus);
              const timestamp = timelineMap.get(stepStatus);

              return (
                <motion.div
                  key={stepStatus}
                  custom={idx}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center flex-1"
                >
                  {/* Step dot */}
                  <div className="relative">
                    <div
                      className={clsx(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px]",
                        "transition-all duration-300",
                        current && "ring-2 ring-offset-1 ring-offset-slate-900",
                        completed
                          ? "text-white"
                          : "bg-slate-800 text-slate-600 border border-slate-700/50"
                      )}
                      style={{
                        backgroundColor: completed ? config.color : undefined,
                        borderColor: current ? config.color : undefined,
                        boxShadow: current
                          ? `0 0 12px ${config.color}40, 0 0 4px ${config.color}20`
                          : undefined,
                      }}
                    >
                      {completed ? "✓" : config.icon}
                    </div>

                    {/* Pulse ring for current step */}
                    {current && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${config.color}` }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </div>

                  {/* Connector line */}
                  {idx < SOS_STATUS_PIPELINE.length - 1 && (
                    <div
                      className="absolute h-0.5 top-3.5"
                      style={{
                        left: `${((idx + 0.5) / SOS_STATUS_PIPELINE.length) * 100}%`,
                        width: `${100 / SOS_STATUS_PIPELINE.length}%`,
                        backgroundColor: completed ? config.color : "rgba(100,116,139,0.2)",
                      }}
                    />
                  )}

                  {/* Label */}
                  <p
                    className={clsx(
                      "text-[9px] mt-1.5 text-center leading-tight",
                      current ? "font-bold" : completed ? "font-medium" : "text-slate-600"
                    )}
                    style={{
                      color: current
                        ? config.color
                        : completed
                        ? "#94a3b8"
                        : undefined,
                    }}
                  >
                    {config.labelVi}
                  </p>

                  {/* Timestamp */}
                  {timestamp && (
                    <p className="text-[8px] text-slate-600 mt-0.5">
                      {new Date(timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Elapsed Time */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/20">
        <span>
          Tạo lúc: {formatDateTime(sosRequest.createdAt)}
        </span>
        <span>
          Thời gian: {formatElapsedTime(sosRequest.createdAt, sosRequest.resolvedAt)}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SPECIAL NEEDS CHIPS
// =============================================================================

function SpecialNeedsChips({ sos }: { sos: SOSRequest }) {
  const chips: { label: string; icon: React.ReactNode; color: string }[] = [];

  if (sos.situation.hasChildren) {
    chips.push({ label: "Trẻ em", icon: <Baby className="w-3 h-3" />, color: "#EC4899" });
  }
  if (sos.situation.hasElderly) {
    chips.push({ label: "Người già", icon: <PersonStanding className="w-3 h-3" />, color: "#F59E0B" });
  }
  if (sos.situation.hasDisabled) {
    chips.push({ label: "Khuyết tật", icon: <Accessibility className="w-3 h-3" />, color: "#8B5CF6" });
  }
  if (sos.situation.isTrapped) {
    chips.push({ label: "Bị kẹt", icon: <Lock className="w-3 h-3" />, color: "#EF4444" });
  }
  if (sos.situation.needsMedical) {
    chips.push({ label: "Y tế", icon: <Stethoscope className="w-3 h-3" />, color: "#22C55E" });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="text-[9px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
          style={{
            backgroundColor: `${chip.color}15`,
            color: chip.color,
            border: `1px solid ${chip.color}25`,
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
// SOS CARD SUB-COMPONENT
// =============================================================================

function SOSCard({
  sos,
  onSelect,
}: {
  sos: SOSRequest;
  onSelect: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = SOS_TYPE_CONFIG[sos.situation.type];
  const emergencyConfig = SOS_EMERGENCY_LEVEL_CONFIG[sos.situation.severity];
  const statusConfig = SOS_STATUS_CONFIG[sos.status];
  const isActive = ACTIVE_STATUSES.has(sos.status);
  const isTerminal = TERMINAL_STATUSES.has(sos.status);

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={clsx(
        "rounded-xl overflow-hidden",
        "bg-slate-900/50 backdrop-blur-sm",
        "border transition-all duration-200",
        isActive
          ? "border-slate-700/40 hover:border-slate-600/60"
          : isTerminal && sos.status === "resolved"
          ? "border-green-500/15 opacity-70"
          : sos.status === "failed"
          ? "border-red-500/15 opacity-70"
          : "border-slate-700/30"
      )}
    >
      {/* Card Header */}
      <div
        className="flex items-start gap-3 p-3.5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Type Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
          style={{ backgroundColor: `${typeConfig.color}18` }}
        >
          {typeConfig.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-slate-200 truncate">
                  {typeConfig.labelVi}
                </h4>
                {sos.isOffline && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 flex items-center gap-0.5 shrink-0">
                    <WifiOff className="w-2.5 h-2.5" />
                    Offline
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {formatRelativeTime(sos.createdAt)}
                {sos.location.province && ` • ${sos.location.province}`}
              </p>
            </div>

            {/* Status badge */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
              }}
            >
              {statusConfig.icon} {statusConfig.labelVi}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Emergency level */}
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${emergencyConfig.color}20`,
                color: emergencyConfig.color,
              }}
            >
              {emergencyConfig.icon} {emergencyConfig.labelVi}
            </span>

            {/* People count */}
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {sos.situation.peopleCount} người
            </span>

            {/* GPS accuracy */}
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {sos.location.accuracy < 50
                ? "GPS chính xác"
                : sos.location.accuracy < 200
                ? "GPS tương đối"
                : "GPS kém"}
            </span>

            {/* Retry count if any */}
            {sos.retryCount > 0 && (
              <span className="text-[10px] text-slate-600">
                🔄 {sos.retryCount} lần thử
              </span>
            )}
          </div>

          {/* Special needs */}
          <SpecialNeedsChips sos={sos} />
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-slate-500 transition-transform shrink-0 mt-1",
            isExpanded && "rotate-180"
          )}
        />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-700/20 pt-3">
              {/* Status Tracker */}
              <SOSStatusTracker sosRequest={sos} />

              {/* Description */}
              {sos.situation.description && (
                <div className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 mb-1">Mô tả tình huống</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sos.situation.description}
                  </p>
                </div>
              )}

              {/* Location Details */}
              <div className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 mb-1.5">Vị trí GPS</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-600">Vĩ độ:</span>{" "}
                    <span className="text-slate-300 font-mono">
                      {sos.location.lat.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Kinh độ:</span>{" "}
                    <span className="text-slate-300 font-mono">
                      {sos.location.lng.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Độ chính xác:</span>{" "}
                    <span className="text-slate-300">±{sos.location.accuracy}m</span>
                  </div>
                  {sos.location.address && (
                    <div className="col-span-2">
                      <span className="text-slate-600">Địa chỉ:</span>{" "}
                      <span className="text-slate-300">{sos.location.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {(sos.contact.name || sos.contact.phone) && (
                <div className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 mb-1">Liên hệ</p>
                  <div className="space-y-0.5 text-[10px]">
                    {sos.contact.name && (
                      <p className="text-slate-300">
                        👤 {sos.contact.name}
                        {sos.contact.relationship && ` (${sos.contact.relationship})`}
                      </p>
                    )}
                    {sos.contact.phone && (
                      <p className="text-slate-300">📞 {sos.contact.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                  "text-xs font-medium transition-all duration-200",
                  "bg-slate-800/40 border border-slate-700/40",
                  "text-slate-300 hover:border-slate-600/60"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                Xem trên bản đồ
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// STATS SUMMARY SUB-COMPONENT
// =============================================================================

function SOSStatsSummary({ requests }: { requests: SOSRequest[] }) {
  const stats = useMemo(() => {
    const total = requests.length;
    const active = requests.filter((r) => ACTIVE_STATUSES.has(r.status)).length;
    const resolved = requests.filter((r) => r.status === "resolved").length;
    const failed = requests.filter((r) => r.status === "failed").length;
    const dispatched = requests.filter((r) => r.status === "dispatched").length;
    const offline = requests.filter((r) => r.isOffline).length;
    const lifeThreatening = requests.filter(
      (r) => r.situation.severity === "life_threatening"
    ).length;
    const totalPeople = requests.reduce((sum, r) => sum + r.situation.peopleCount, 0);
    const avgResponseTime = (() => {
      const resolvedRequests = requests.filter((r) => r.resolvedAt);
      if (resolvedRequests.length === 0) return null;
      const totalMs = resolvedRequests.reduce((sum, r) => {
        return sum + (new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime());
      }, 0);
      return totalMs / resolvedRequests.length;
    })();

    return {
      total,
      active,
      resolved,
      failed,
      dispatched,
      offline,
      lifeThreatening,
      totalPeople,
      avgResponseTime,
    };
  }, [requests]);

  const statCards = [
    {
      label: "Tổng SOS",
      value: stats.total,
      icon: <Heart className="w-4 h-4" />,
      color: "#3B82F6",
    },
    {
      label: "Đang hoạt động",
      value: stats.active,
      icon: <Zap className="w-4 h-4" />,
      color: "#F59E0B",
    },
    {
      label: "Đã cứu hộ",
      value: stats.resolved,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "#22C55E",
    },
    {
      label: "Thất bại",
      value: stats.failed,
      icon: <XCircle className="w-4 h-4" />,
      color: "#EF4444",
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* Main stat cards */}
      <div className="grid grid-cols-4 gap-2">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              "p-2.5 rounded-xl text-center",
              "bg-slate-900/40 border border-slate-700/30"
            )}
          >
            <div
              className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center"
              style={{ backgroundColor: `${card.color}18`, color: card.color }}
            >
              {card.icon}
            </div>
            <p className="text-lg font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-[9px] text-slate-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Extra stats row */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
        {stats.dispatched > 0 && (
          <span className="flex items-center gap-1">
            🚁 <span className="text-green-400 font-medium">{stats.dispatched}</span> đang cứu hộ
          </span>
        )}
        {stats.lifeThreatening > 0 && (
          <span className="flex items-center gap-1">
            ⚠️ <span className="text-red-400 font-medium">{stats.lifeThreatening}</span> nguy hiểm tính mạng
          </span>
        )}
        <span className="flex items-center gap-1">
          👥 <span className="text-blue-400 font-medium">{stats.totalPeople}</span> người liên quan
        </span>
        {stats.offline > 0 && (
          <span className="flex items-center gap-1">
            📴 <span className="text-amber-400 font-medium">{stats.offline}</span> gửi offline
          </span>
        )}
        {stats.avgResponseTime !== null && (
          <span className="flex items-center gap-1">
            ⏱️ TB: <span className="text-purple-400 font-medium">
              {formatElapsedTime("", new Date(Date.now() - stats.avgResponseTime).toISOString())}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// FILTER CHIPS
// =============================================================================

type StatusFilter = "all" | "active" | "resolved" | "failed";

function StatusFilterRow({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (filter: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}) {
  const filters: { key: StatusFilter; label: string; color: string }[] = [
    { key: "all", label: "Tất cả", color: "#94A3B8" },
    { key: "active", label: "Đang hoạt động", color: "#F59E0B" },
    { key: "resolved", label: "Đã cứu hộ", color: "#22C55E" },
    { key: "failed", label: "Thất bại", color: "#EF4444" },
  ];

  return (
    <div className="flex gap-1.5">
      {filters.map((filter) => (
        <motion.button
          key={filter.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(filter.key)}
          className={clsx(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
            "text-[10px] font-medium transition-all duration-200 border",
            value === filter.key
              ? "border-opacity-50"
              : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50"
          )}
          style={
            value === filter.key
              ? {
                  backgroundColor: `${filter.color}18`,
                  borderColor: `${filter.color}50`,
                  color: filter.color,
                }
              : undefined
          }
        >
          {filter.label}
          <span
            className="text-[9px] px-1 rounded"
            style={{
              backgroundColor:
                value === filter.key ? `${filter.color}25` : "rgba(100,116,139,0.15)",
            }}
          >
            {counts[filter.key]}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ filter }: { filter: StatusFilter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-400 mb-1">
        {filter === "all"
          ? "Chưa có yêu cầu SOS nào"
          : filter === "active"
          ? "Không có SOS đang hoạt động"
          : filter === "resolved"
          ? "Chưa có SOS được cứu hộ"
          : "Không có SOS thất bại"}
      </h3>
      <p className="text-sm text-slate-600 max-w-xs">
        {filter === "all"
          ? "Khi bạn gửi yêu cầu SOS, lịch sử sẽ xuất hiện ở đây"
          : "Thử thay đổi bộ lọc để xem thêm"}
      </p>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SOSHistoryPanelComponent({
  sosRequests,
  onSelectSOS,
  className,
}: SOSHistoryPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Filter counts
  const counts = useMemo(
    () => ({
      all: sosRequests.length,
      active: sosRequests.filter((r) => ACTIVE_STATUSES.has(r.status)).length,
      resolved: sosRequests.filter((r) => r.status === "resolved").length,
      failed: sosRequests.filter((r) => r.status === "failed").length,
    }),
    [sosRequests]
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let filtered = sosRequests;

    switch (statusFilter) {
      case "active":
        filtered = sosRequests.filter((r) => ACTIVE_STATUSES.has(r.status));
        break;
      case "resolved":
        filtered = sosRequests.filter((r) => r.status === "resolved");
        break;
      case "failed":
        filtered = sosRequests.filter((r) => r.status === "failed");
        break;
    }

    // Sort by newest first
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sosRequests, statusFilter]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Stats Summary */}
      <SOSStatsSummary requests={sosRequests} />

      {/* Filters */}
      <StatusFilterRow
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
      />

      {/* History List */}
      {filteredRequests.length === 0 ? (
        <EmptyState filter={statusFilter} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((sos) => (
              <SOSCard
                key={sos.id}
                sos={sos}
                onSelect={() => onSelectSOS(sos)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Footer Info */}
      {sosRequests.length > 0 && (
        <div className="text-center text-[10px] text-slate-600 pt-2 border-t border-slate-700/20">
          Hiển thị {filteredRequests.length}/{sosRequests.length} yêu cầu SOS
        </div>
      )}
    </div>
  );
}

export const SOSHistoryPanel = memo(SOSHistoryPanelComponent);
