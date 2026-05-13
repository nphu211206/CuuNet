"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MapPin,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import clsx from "clsx";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { ReportStatus, DatePreset, ReportFiltersProps } from "../lib/types";
import {
  DISASTER_CONFIG,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
  DATE_PRESET_CONFIG,
  PROVINCE_LIST,
  REPORT_CONFIG,
} from "../config/report-config";

// ============================================================
// REPORT FILTERS COMPONENT
// ============================================================
// Bộ lọc báo cáo thiên tai
// - FilterSearch: debounced search input
// - FilterTypeSection: 6 disaster type checkboxes
// - FilterSeveritySection: 4 severity checkboxes
// - FilterProvinceSection: multi-select dropdown
// - FilterStatusSection: 4 status checkboxes
// - FilterVerifiedToggle: switch component
// - FilterDateSection: preset buttons
// - ActiveFilterBadge: count of active filters
// - ClearFiltersButton: reset all filters
// ============================================================

// === ANIMATION VARIANTS ===

const sectionVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const filterContainerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// === MAIN COMPONENT ===

function ReportFiltersComponent({
  filters,
  stats,
  onFilterChange,
  onReset,
  onSearch,
  className,
}: ReportFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    types: true,
    severities: true,
    provinces: false,
    statuses: true,
    date: true,
  });

  // Toggle section expand/collapse
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types.length > 0) count++;
    if (filters.severities.length > 0) count++;
    if (filters.provinces.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.dateRange.preset !== "all") count++;
    return count;
  }, [filters]);

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      // Propagate search to parent for actual filtering
      onSearch?.(value);
    },
    [onSearch]
  );

  return (
    <motion.div
      variants={filterContainerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Bộ lọc</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-700/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm kiếm báo cáo..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <div className="divide-y divide-slate-700/30">
        {/* Disaster Types */}
        <FilterSection
          title="Loại thiên tai"
          icon="🌊"
          isExpanded={expandedSections.types}
          onToggle={() => toggleSection("types")}
          activeCount={filters.types.length}
        >
          <FilterTypeSection
            selectedTypes={filters.types}
            stats={stats.byType}
            onToggle={(type) => {
              const current = filters.types;
              const updated = current.includes(type)
                ? current.filter((t) => t !== type)
                : [...current, type];
              onFilterChange({ types: updated });
            }}
          />
        </FilterSection>

        {/* Severities */}
        <FilterSection
          title="Mức độ nghiêm trọng"
          icon="⚡"
          isExpanded={expandedSections.severities}
          onToggle={() => toggleSection("severities")}
          activeCount={filters.severities.length}
        >
          <FilterSeveritySection
            selectedSeverities={filters.severities}
            stats={stats.bySeverity}
            onToggle={(severity) => {
              const current = filters.severities;
              const updated = current.includes(severity)
                ? current.filter((s) => s !== severity)
                : [...current, severity];
              onFilterChange({ severities: updated });
            }}
          />
        </FilterSection>

        {/* Provinces */}
        <FilterSection
          title="Tỉnh/Thành phố"
          icon="📍"
          isExpanded={expandedSections.provinces}
          onToggle={() => toggleSection("provinces")}
          activeCount={filters.provinces.length}
        >
          <FilterProvinceSection
            selectedProvinces={filters.provinces}
            stats={stats.byProvince}
            onToggle={(province) => {
              const current = filters.provinces;
              const updated = current.includes(province)
                ? current.filter((p) => p !== province)
                : [...current, province];
              onFilterChange({ provinces: updated });
            }}
          />
        </FilterSection>

        {/* Statuses */}
        <FilterSection
          title="Trạng thái"
          icon="📋"
          isExpanded={expandedSections.statuses}
          onToggle={() => toggleSection("statuses")}
          activeCount={filters.statuses.length}
        >
          <FilterStatusSection
            selectedStatuses={filters.statuses}
            stats={stats.byStatus}
            onToggle={(status) => {
              const current = filters.statuses;
              const updated = current.includes(status)
                ? current.filter((s) => s !== status)
                : [...current, status];
              onFilterChange({ statuses: updated });
            }}
          />
        </FilterSection>

        {/* Verified Only Toggle */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">✅</span>
              <span className="text-sm text-slate-300">Chỉ hiện đã xác minh</span>
            </div>
            <button
              onClick={() => onFilterChange({ verifiedOnly: !filters.verifiedOnly })}
              className={clsx(
                "relative w-11 h-6 rounded-full transition-colors",
                filters.verifiedOnly ? "bg-green-500" : "bg-slate-600"
              )}
            >
              <motion.div
                animate={{ x: filters.verifiedOnly ? 22 : 2 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
              />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <FilterSection
          title="Thời gian"
          icon="🕐"
          isExpanded={expandedSections.date}
          onToggle={() => toggleSection("date")}
          activeCount={filters.dateRange.preset !== "all" ? 1 : 0}
        >
          <FilterDateSection
            selectedPreset={filters.dateRange.preset}
            onSelect={(preset) =>
              onFilterChange({
                dateRange: { preset, start: null, end: null },
              })
            }
          />
        </FilterSection>
      </div>
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

/**
 * Filter Section: Collapsible section wrapper
 */
function FilterSection({
  title,
  icon,
  isExpanded,
  onToggle,
  activeCount,
  children,
}: {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  activeCount: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-sm font-medium text-slate-300">{title}</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
              {activeCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Section content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={sectionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Filter Type Section: 6 disaster type checkboxes
 */
function FilterTypeSection({
  selectedTypes,
  stats,
  onToggle,
}: {
  selectedTypes: DisasterType[];
  stats: Record<DisasterType, number>;
  onToggle: (type: DisasterType) => void;
}) {
  const disasterTypes: DisasterType[] = [
    "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
  ];

  return (
    <div className="space-y-1">
      {disasterTypes.map((type) => {
        const config = DISASTER_CONFIG[type];
        const isSelected = selectedTypes.includes(type);
        const count = stats[type] || 0;

        return (
          <FilterCheckbox
            key={type}
            isSelected={isSelected}
            onToggle={() => onToggle(type)}
            label={config.label}
            icon={config.icon}
            count={count}
            color={config.color}
          />
        );
      })}
    </div>
  );
}

/**
 * Filter Severity Section: 4 severity checkboxes
 */
function FilterSeveritySection({
  selectedSeverities,
  stats,
  onToggle,
}: {
  selectedSeverities: SeverityLevel[];
  stats: Record<SeverityLevel, number>;
  onToggle: (severity: SeverityLevel) => void;
}) {
  const severities: SeverityLevel[] = ["critical", "high", "medium", "low"];

  return (
    <div className="space-y-1">
      {severities.map((severity) => {
        const config = SEVERITY_CONFIG[severity];
        const isSelected = selectedSeverities.includes(severity);
        const count = stats[severity] || 0;

        return (
          <FilterCheckbox
            key={severity}
            isSelected={isSelected}
            onToggle={() => onToggle(severity)}
            label={config.label}
            count={count}
            color={config.color}
          />
        );
      })}
    </div>
  );
}

/**
 * Filter Province Section: Multi-select dropdown
 */
function FilterProvinceSection({
  selectedProvinces,
  stats,
  onToggle,
}: {
  selectedProvinces: string[];
  stats: Record<string, number>;
  onToggle: (province: string) => void;
}) {
  const [provinceSearch, setProvinceSearch] = useState("");

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return PROVINCE_LIST;
    const query = provinceSearch.toLowerCase();
    return PROVINCE_LIST.filter((p) => p.toLowerCase().includes(query));
  }, [provinceSearch]);

  return (
    <div className="space-y-2">
      {/* Province search */}
      <div className="relative">
        <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
        <input
          type="text"
          value={provinceSearch}
          onChange={(e) => setProvinceSearch(e.target.value)}
          placeholder="Tìm tỉnh..."
          className="w-full pl-7 pr-3 py-1.5 rounded bg-slate-800/50 border border-slate-700/30 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {/* Province list */}
      <div className="max-h-40 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {filteredProvinces.map((province) => {
          const isSelected = selectedProvinces.includes(province);
          const count = stats[province] || 0;

          return (
            <FilterCheckbox
              key={province}
              isSelected={isSelected}
              onToggle={() => onToggle(province)}
              label={province}
              count={count}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Filter Status Section: 4 status checkboxes
 */
function FilterStatusSection({
  selectedStatuses,
  stats,
  onToggle,
}: {
  selectedStatuses: ReportStatus[];
  stats: Record<ReportStatus, number>;
  onToggle: (status: ReportStatus) => void;
}) {
  const statuses: ReportStatus[] = ["pending", "verified", "resolved", "rejected"];

  return (
    <div className="space-y-1">
      {statuses.map((status) => {
        const config = STATUS_CONFIG[status];
        const isSelected = selectedStatuses.includes(status);
        const count = stats[status] || 0;

        return (
          <FilterCheckbox
            key={status}
            isSelected={isSelected}
            onToggle={() => onToggle(status)}
            label={config.label}
            icon={config.icon}
            count={count}
            color={config.color}
          />
        );
      })}
    </div>
  );
}

/**
 * Filter Date Section: Preset buttons
 */
function FilterDateSection({
  selectedPreset,
  onSelect,
}: {
  selectedPreset: DatePreset;
  onSelect: (preset: DatePreset) => void;
}) {
  const presets: DatePreset[] = ["1h", "6h", "24h", "7d", "30d", "all"];

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const config = DATE_PRESET_CONFIG[preset];
        const isSelected = selectedPreset === preset;

        return (
          <button
            key={preset}
            onClick={() => onSelect(preset)}
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors",
              isSelected
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:bg-slate-700/50"
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filter Checkbox: Checkbox + label + count badge
 */
function FilterCheckbox({
  isSelected,
  onToggle,
  label,
  icon,
  count,
  color,
}: {
  isSelected: boolean;
  onToggle: () => void;
  label: string;
  icon?: string;
  count?: number;
  color?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
        isSelected
          ? "bg-blue-500/10 text-blue-400"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
      )}
    >
      {/* Checkbox */}
      <div
        className={clsx(
          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
          isSelected
            ? "bg-blue-500 border-blue-500"
            : "border-slate-600 bg-slate-800/50"
        )}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Icon */}
      {icon && <span className="text-sm">{icon}</span>}

      {/* Color dot */}
      {color && !icon && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Label */}
      <span className="flex-1 text-left truncate">{label}</span>

      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-slate-500 tabular-nums">{count}</span>
      )}
    </button>
  );
}

// Export memoized component
export const ReportFilters = memo(ReportFiltersComponent);
