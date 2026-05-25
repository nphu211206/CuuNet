"use client";

// =============================================================================
// DASHBOARD HEADER - Header with View Tabs + Filter Bar
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - 4 view tabs (Executive/Operational/Analytical/Strategic)
//   - Active tab colored indicator
//   - Responsive: horizontal scroll on mobile
//   - Glassmorphism dark theme
//   - Animated entrance
// =============================================================================

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Map,
  Filter,
  X,
  ChevronDown,
  Download,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import clsx from "clsx";
import type {
  DashboardView,
  DashboardHeaderProps,
  DashboardFilter,
  FilterBarProps,
  TimeRange,
  VietnamRegion,
} from "../lib/types";
import {
  DASHBOARD_VIEW_CONFIG,
  TIME_RANGE_CONFIG,
  REGION_CONFIG,
  DISASTER_TYPE_DASHBOARD_CONFIG,
  DASHBOARD_ANIMATION,
} from "../config/dashboard-config";
import type { DisasterType } from "@/lib/types";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: DASHBOARD_ANIMATION.ease,
    },
  },
};

const tabIndicatorVariants = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// =============================================================================
// VIEW TABS
// =============================================================================

function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}) {
  const views: Array<{ id: DashboardView; label: string; icon: string; color: string }> = [
    { id: "executive", label: "Tổng quan", icon: "📊", color: "#3B82F6" },
    { id: "operational", label: "Giám sát", icon: "📡", color: "#22C55E" },
    { id: "analytical", label: "Phân tích", icon: "🔍", color: "#8B5CF6" },
    { id: "strategic", label: "Xu hướng", icon: "📈", color: "#F59E0B" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
      {views.map((view) => {
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={clsx(
              "relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              isActive
                ? "border-opacity-40 text-opacity-100 bg-opacity-15"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50 hover:text-slate-300"
            )}
            style={
              isActive
                ? {
                    backgroundColor: `${view.color}15`,
                    borderColor: `${view.color}40`,
                    color: view.color,
                  }
                : undefined
            }
          >
            <span className="text-sm">{view.icon}</span>
            <span>{view.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{ backgroundColor: view.color }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// FILTER BAR
// =============================================================================

function FilterBarComponent({
  filter,
  onFilterChange,
  onReset,
  provinces,
  className,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      onFilterChange({ timeRange: range });
    },
    [onFilterChange]
  );

  const handleRegionChange = useCallback(
    (region: VietnamRegion) => {
      onFilterChange({ region });
    },
    [onFilterChange]
  );

  const handleTypeChange = useCallback(
    (type: DisasterType | "all") => {
      onFilterChange({ disasterType: type });
    },
    [onFilterChange]
  );

  const handleProvinceChange = useCallback(
    (province: string) => {
      onFilterChange({ province });
    },
    [onFilterChange]
  );

  const hasActiveFilters =
    filter.timeRange !== "all" ||
    filter.region !== "all" ||
    filter.disasterType !== "all" ||
    filter.province !== "all";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={clsx(
        "rounded-xl bg-slate-900/40 border border-slate-700/30 p-3",
        className
      )}
    >
      {/* Main filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter icon */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-300">Bộ lọc</span>
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Thời gian:</span>
          <div className="flex gap-0.5">
            {Object.entries(TIME_RANGE_CONFIG).filter(([key]) => key !== "custom").map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleTimeRangeChange(key as TimeRange)}
                className={clsx(
                  "px-2 py-1 rounded-md text-[10px] font-medium transition-colors border",
                  filter.timeRange === key
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                    : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:text-slate-300"
                )}
              >
                {config.labelVi}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Vùng:</span>
          <select
            value={filter.region}
            onChange={(e) => handleRegionChange(e.target.value as VietnamRegion)}
            className="bg-slate-800/50 border border-slate-700/30 rounded-md px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500/50"
          >
            {Object.entries(REGION_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.labelVi}</option>
            ))}
          </select>
        </div>

        {/* Disaster Type */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">Loại:</span>
          <select
            value={filter.disasterType}
            onChange={(e) => handleTypeChange(e.target.value as DisasterType | "all")}
            className="bg-slate-800/50 border border-slate-700/30 rounded-md px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">Tất cả</option>
            {Object.entries(DISASTER_TYPE_DASHBOARD_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.labelVi}</option>
            ))}
          </select>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronDown className={clsx("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
          Mở rộng
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-slate-700/20 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Province selector */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tỉnh/Thành phố</label>
                <select
                  value={filter.province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/30 rounded-md px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">Tất cả</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Severity Level */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Mức độ nghiêm trọng</label>
                <select
                  value={filter.severityLevel === "all" ? "all" : filter.severityLevel}
                  onChange={(e) => onFilterChange({ severityLevel: e.target.value === "all" ? "all" : parseInt(e.target.value) as any })}
                  className="w-full bg-slate-800/50 border border-slate-700/30 rounded-md px-2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">Tất cả</option>
                  <option value="1">1 - Nhẹ</option>
                  <option value="2">2 - Trung bình</option>
                  <option value="3">3 - Nghiêm trọng</option>
                  <option value="4">4 - Cực kỳ nghiêm trọng</option>
                  <option value="5">5 - Thảm họa</option>
                </select>
              </div>

              {/* Active filter summary */}
              <div className="lg:col-span-2">
                <label className="text-[10px] text-slate-500 block mb-1">Bộ lọc đang áp dụng</label>
                <div className="flex flex-wrap gap-1">
                  {filter.timeRange !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {TIME_RANGE_CONFIG[filter.timeRange].labelVi}
                      <button onClick={() => onFilterChange({ timeRange: "all" })} className="hover:text-blue-200">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {filter.region !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] bg-green-500/10 text-green-400 border border-green-500/20">
                      {REGION_CONFIG[filter.region].labelVi}
                      <button onClick={() => onFilterChange({ region: "all" })} className="hover:text-green-200">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {filter.disasterType !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {DISASTER_TYPE_DASHBOARD_CONFIG[filter.disasterType].labelVi}
                      <button onClick={() => onFilterChange({ disasterType: "all" })} className="hover:text-purple-200">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {filter.province !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {filter.province}
                      <button onClick={() => onFilterChange({ province: "all" })} className="hover:text-amber-200">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {!hasActiveFilters && (
                    <span className="text-[9px] text-slate-600">Không có bộ lọc nào</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const FilterBar = memo(FilterBarComponent);

// =============================================================================
// EXPORT BUTTONS
// =============================================================================

function ExportButtons({
  onExportCSV,
  onExportPNG,
}: {
  onExportCSV: () => void;
  onExportPNG: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-[11px] font-medium hover:border-slate-600/50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Xuất
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full right-0 mt-1 w-36 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-lg overflow-hidden z-50"
          >
            <button
              onClick={() => { onExportCSV(); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
              Xuất CSV
            </button>
            <button
              onClick={() => { onExportPNG(); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <Image className="w-3.5 h-3.5 text-blue-400" />
              Xuất PNG
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD HEADER
// =============================================================================

function DashboardHeaderComponent({
  activeView,
  onViewChange,
  className,
  onExportCSV,
  onExportPNG,
}: DashboardHeaderProps & {
  onExportCSV?: () => void;
  onExportPNG?: () => void;
}) {
  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm",
        className
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Title bar */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              📊 Dashboard Thống kê
            </h1>
            <p className="text-[10px] text-slate-500">
              Module 6 - Trực quan hóa dữ liệu thiên tai Việt Nam (2000-2024)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onExportCSV && onExportPNG && (
              <ExportButtons onExportCSV={onExportCSV} onExportPNG={onExportPNG} />
            )}
          </div>
        </div>

        {/* View tabs */}
        <div className="pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <ViewTabs activeView={activeView} onViewChange={onViewChange} />
        </div>
      </div>
    </motion.header>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);
