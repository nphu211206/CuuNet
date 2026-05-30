"use client";

// =============================================================================
// ALERT FEED - Timeline Alert List with Filters
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Features:
//   - Timeline layout with severity-colored left border
//   - Filter chips: severity, type, urgency
//   - Sort dropdown (newest, most severe, most urgent, etc.)
//   - Animated card entrance (stagger)
//   - Click to open AlertDetailModal
//   - Empty state with illustration
//   - Loading skeleton
// =============================================================================

import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  SortAsc,
  ChevronDown,
  Clock,
  MapPin,
  AlertTriangle,
  Flame,
  Shield,
  Info,
  X,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type {
  Alert,
  AlertFeedProps,
  AlertSeverity,
  AlertUrgency,
  AlertFilters,
  AlertSortOption,
} from "../lib/types";
import type { DisasterType } from "@/lib/types";
import {
  ALERT_SEVERITY_CONFIG,
  ALERT_URGENCY_CONFIG,
  ALERT_CATEGORY_CONFIG,
  ALERT_SORT_OPTIONS,
} from "../config/alert-config";
import { DISASTER_CONFIG } from "@/lib/constants";

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
  hidden: { opacity: 0, x: -20, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// =============================================================================
// TIME FORMATTER
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

function formatExpiry(expiresStr: string): string {
  const now = Date.now();
  const expires = new Date(expiresStr).getTime();
  const diff = expires - now;

  if (diff <= 0) return "Đã hết hạn";
  if (diff < 3600_000) return `Còn ${Math.ceil(diff / 60_000)} phút`;
  if (diff < 86400_000) return `Còn ${Math.ceil(diff / 3600_000)} giờ`;
  return `Còn ${Math.ceil(diff / 86400_000)} ngày`;
}

// =============================================================================
// FILTER CHIP SUB-COMPONENT
// =============================================================================

function FilterChip({
  label,
  icon,
  active,
  onClick,
  color,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
        "text-xs font-medium transition-all duration-200",
        "border whitespace-nowrap",
        active
          ? "border-opacity-50 shadow-sm"
          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
      )}
      style={
        active
          ? {
              backgroundColor: `${color || "#3B82F6"}18`,
              borderColor: `${color || "#3B82F6"}50`,
              color: color || "#3B82F6",
            }
          : undefined
      }
    >
      {icon}
      {label}
    </motion.button>
  );
}

// =============================================================================
// ALERT CARD SUB-COMPONENT
// =============================================================================

function AlertCard({
  alert,
  onClick,
}: {
  alert: Alert;
  onClick: () => void;
}) {
  const severityConfig = ALERT_SEVERITY_CONFIG[alert.info.severity];
  const urgencyConfig = ALERT_URGENCY_CONFIG[alert.info.urgency];
  const categoryConfig = ALERT_CATEGORY_CONFIG[alert.info.category];

  const isExpired = new Date(alert.info.expires).getTime() < Date.now();
  const isCancelled = alert.msgType === "cancel";

  return (
    <motion.div
      variants={cardVariants}
      layout
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={clsx(
        "relative flex gap-3 p-3.5 rounded-xl cursor-pointer",
        "bg-white backdrop-blur-sm",
        "border border-slate-200",
        "hover:border-slate-300 hover:bg-slate-900/70",
        "transition-all duration-200 group",
        isExpired && "opacity-50",
        isCancelled && "opacity-40"
      )}
    >
      {/* Severity left bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: severityConfig.color }}
      />

      {/* Severity icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${severityConfig.color}18` }}
      >
        <span className="text-lg">{severityConfig.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className="text-sm font-semibold truncate"
            style={{ color: isExpired ? "#64748b" : "#e2e8f0" }}
          >
            {alert.info.headline}
          </h4>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: `${urgencyConfig.color}20`,
              color: urgencyConfig.color,
            }}
          >
            {urgencyConfig.labelVi}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Category */}
          <span className="text-[10px] text-slate-500">
            {categoryConfig.icon} {categoryConfig.labelVi}
          </span>

          {/* Provinces */}
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {alert.info.area.provinces.slice(0, 2).join(", ")}
            {alert.info.area.provinces.length > 2 && ` +${alert.info.area.provinces.length - 2}`}
          </span>

          {/* Time */}
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(alert.sent)}
          </span>
        </div>

        {/* Expiry */}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={clsx(
              "text-[10px] font-medium",
              isExpired ? "text-red-400" : "text-slate-500"
            )}
          >
            {formatExpiry(alert.info.expires)}
          </span>

          {/* Sender */}
          <span className="text-[10px] text-slate-600">
            • {alert.info.senderName}
          </span>
        </div>
      </div>

      {/* Severity badge */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: `${severityConfig.color}20`,
            color: severityConfig.color,
          }}
        >
          {severityConfig.labelVi}
        </span>

        {/* Delivery stats */}
        <div className="text-[10px] text-slate-600">
          {alert.delivery.acknowledgedCount}/{alert.delivery.deliveredCount} xác nhận
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Shield className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-500 mb-1">
        {hasFilters ? "Không tìm thấy cảnh báo" : "Không có cảnh báo"}
      </h3>
      <p className="text-sm text-slate-600 max-w-xs">
        {hasFilters
          ? "Thử thay đổi bộ lọc để xem thêm cảnh báo"
          : "Hiện tại không có cảnh báo nào đang hoạt động. Bạn an toàn!"}
      </p>
    </motion.div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex gap-3 p-3.5 rounded-xl bg-white border border-slate-200 animate-pulse"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
          <div className="w-16 h-6 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SORT DROPDOWN
// =============================================================================

function SortDropdown({
  value,
  onChange,
}: {
  value: AlertSortOption;
  onChange: (sort: AlertSortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = ALERT_SORT_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
          "text-xs font-medium",
          "bg-slate-100 border border-slate-200",
          "text-slate-700 hover:border-slate-300",
          "transition-all duration-200"
        )}
      >
        <SortAsc className="w-3.5 h-3.5" />
        {current?.labelVi || "Sắp xếp"}
        <ChevronDown className={clsx("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={clsx(
              "absolute top-full right-0 mt-1 w-44 rounded-xl overflow-hidden z-50",
              "bg-white/95 backdrop-blur-xl",
              "border border-slate-200",
              "shadow-xl shadow-black/30"
            )}
          >
            {ALERT_SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2 text-left",
                  "text-xs transition-colors",
                  value === option.value
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <span>{option.icon}</span>
                {option.labelVi}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function AlertFeedComponent({
  alerts,
  filters,
  sort,
  onAlertClick,
  onFilterChange,
  onSortChange,
  isLoading,
  className,
}: AlertFeedProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.severities.length > 0) count++;
    if (filters.urgencies.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.provinces.length > 0) count++;
    return count;
  }, [filters]);

  const hasFilters = activeFilterCount > 0;

  const toggleSeverity = useCallback(
    (severity: AlertSeverity) => {
      const current = filters.severities;
      const updated = current.includes(severity)
        ? current.filter((s) => s !== severity)
        : [...current, severity];
      onFilterChange({ severities: updated });
    },
    [filters.severities, onFilterChange]
  );

  const toggleUrgency = useCallback(
    (urgency: AlertUrgency) => {
      const current = filters.urgencies;
      const updated = current.includes(urgency)
        ? current.filter((u) => u !== urgency)
        : [...current, urgency];
      onFilterChange({ urgencies: updated });
    },
    [filters.urgencies, onFilterChange]
  );

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
              "text-xs font-medium transition-all duration-200",
              "border",
              showFilters || hasFilters
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Lọc
            {hasFilters && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </motion.button>

          {/* Alert count */}
          <span className="text-xs text-slate-500">
            {alerts.length} cảnh báo
          </span>
        </div>

        {/* Sort */}
        <SortDropdown value={sort} onChange={onSortChange} />
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-3">
              {/* Severity filters */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">
                  Mức độ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(ALERT_SEVERITY_CONFIG) as [AlertSeverity, typeof ALERT_SEVERITY_CONFIG[AlertSeverity]][]).map(
                    ([key, config]) => (
                      <FilterChip
                        key={key}
                        label={config.labelVi}
                        active={filters.severities.includes(key)}
                        onClick={() => toggleSeverity(key)}
                        color={config.color}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Urgency filters */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">
                  Mức độ khẩn cấp
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(ALERT_URGENCY_CONFIG) as [AlertUrgency, typeof ALERT_URGENCY_CONFIG[AlertUrgency]][]).map(
                    ([key, config]) => (
                      <FilterChip
                        key={key}
                        label={config.labelVi}
                        icon={<span className="text-[10px]">{config.icon}</span>}
                        active={filters.urgencies.includes(key)}
                        onClick={() => toggleUrgency(key)}
                        color={config.color}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Clear all */}
              {hasFilters && (
                <button
                  onClick={() =>
                    onFilterChange({ severities: [], urgencies: [], categories: [], provinces: [] })
                  }
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : alerts.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={() => onAlertClick(alert)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export const AlertFeed = memo(AlertFeedComponent);
