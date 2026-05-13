"use client";

// =============================================================================
// CHECKLIST MANAGER - Disaster Preparedness Checklist
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Features:
//   - SVG circular progress gauge
//   - 6 category groups with checkboxes
//   - Priority badges (essential/recommended/optional)
//   - Season + region filter
//   - Province selector
//   - Printable version
//   - Cost estimation
//   - Readiness level indicator
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Printer,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  Package,
  FileText,
  Home,
  Wifi,
  Footprints,
  Heart,
  Star,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import type {
  ChecklistManagerProps,
  ChecklistItem,
  ChecklistCategory,
  ChecklistPriority,
  ChecklistSeason,
} from "../lib/types";
import {
  CHECKLIST_CATEGORY_CONFIG,
  CHECKLIST_PRIORITY_CONFIG,
  CHECKLIST_SEASON_CONFIG,
} from "../config/alert-config";
import {
  filterChecklistItems,
  calculateChecklistStats,
  getReadinessLevel,
  getCurrentSeason,
  getSeasonForProvince,
  estimateTotalCost,
  getSeasonalTips,
} from "../lib/checklist-data";

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

// =============================================================================
// SVG CIRCULAR PROGRESS GAUGE
// =============================================================================

function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const readiness = getReadinessLevel(percentage);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(100,116,139,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={readiness.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-3xl font-black tabular-nums"
          style={{ color: readiness.color }}
        >
          {percentage}%
        </motion.span>
        <span className="text-[10px] text-slate-500 mt-0.5">{readiness.labelVi}</span>
      </div>
    </div>
  );
}

// =============================================================================
// CHECKBOX ITEM SUB-COMPONENT
// =============================================================================

function ChecklistItemRow({
  item,
  completed,
  onToggle,
}: {
  item: ChecklistItem;
  completed: boolean;
  onToggle: () => void;
}) {
  const priorityConfig = CHECKLIST_PRIORITY_CONFIG[item.priority];

  return (
    <motion.div
      variants={itemVariants}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      className={clsx(
        "flex items-start gap-3 p-3 rounded-xl cursor-pointer",
        "transition-all duration-200",
        completed
          ? "bg-green-500/5 border border-green-500/15"
          : "bg-slate-900/30 border border-slate-700/20 hover:border-slate-600/40"
      )}
    >
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <Circle className="w-5 h-5 text-slate-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{item.icon}</span>
          <h4
            className={clsx(
              "text-sm font-medium",
              completed ? "text-slate-500 line-through" : "text-slate-200"
            )}
          >
            {item.title}
          </h4>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: priorityConfig.bgColor,
              color: priorityConfig.color,
            }}
          >
            {priorityConfig.labelVi}
          </span>
        </div>
        <p className={clsx("text-xs mt-1", completed ? "text-slate-600" : "text-slate-500")}>
          {item.description}
        </p>
        {item.estimatedCost && (
          <p className="text-[10px] text-slate-600 mt-1">💰 {item.estimatedCost}</p>
        )}
        {item.tips && !completed && (
          <p className="text-[10px] text-purple-400/70 mt-1 italic">💡 {item.tips}</p>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// CATEGORY GROUP SUB-COMPONENT
// =============================================================================

function CategoryGroup({
  category,
  items,
  completedIds,
  onToggle,
}: {
  category: ChecklistCategory;
  items: ChecklistItem[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = CHECKLIST_CATEGORY_CONFIG[category];
  const completedCount = items.filter((i) => completedIds.has(i.id)).length;

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
          "bg-slate-800/30 border border-slate-700/20",
          "hover:border-slate-600/40 transition-all duration-200"
        )}
      >
        <span className="text-base">{config.icon}</span>
        <span className="text-sm font-semibold text-slate-200 flex-1 text-left">
          {config.labelVi}
        </span>
        <span className="text-xs text-slate-500">
          {completedCount}/{items.length}
        </span>
        <ChevronDown
          className={clsx("w-4 h-4 text-slate-500 transition-transform", !isExpanded && "-rotate-90")}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 mt-1.5 ml-2">
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  completed={completedIds.has(item.id)}
                  onToggle={() => onToggle(item.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ChecklistManagerComponent({
  items,
  progress,
  province,
  season,
  onToggleItem,
  onProvinceChange,
  onSeasonChange,
  onReset,
  className,
}: ChecklistManagerProps) {
  const completedIds = useMemo(
    () => new Set(progress.filter((p) => p.completed).map((p) => p.itemId)),
    [progress]
  );

  const filteredItems = useMemo(
    () =>
      filterChecklistItems({
        season,
        province: province || undefined,
      }),
    [season, province]
  );

  const stats = useMemo(
    () => calculateChecklistStats(filteredItems, progress),
    [filteredItems, progress]
  );

  const readiness = useMemo(
    () => getReadinessLevel(stats.completionPercentage),
    [stats.completionPercentage]
  );

  const costEstimate = useMemo(
    () => estimateTotalCost(filteredItems.filter((i) => !completedIds.has(i.id))),
    [filteredItems, completedIds]
  );

  const seasonalTips = useMemo(() => getSeasonalTips(season), [season]);

  // Group items by category
  const grouped = useMemo(() => {
    const groups = new Map<ChecklistCategory, ChecklistItem[]>();
    for (const item of filteredItems) {
      const existing = groups.get(item.category) || [];
      existing.push(item);
      groups.set(item.category, existing);
    }
    // Sort by category order
    return Array.from(groups.entries()).sort(
      (a, b) => CHECKLIST_CATEGORY_CONFIG[a[0]].order - CHECKLIST_CATEGORY_CONFIG[b[0]].order
    );
  }, [filteredItems]);

  const handlePrint = useCallback(() => {
    const printContent = `
      <html><head><title>Checklist CứuNet</title>
      <style>body{font-family:system-ui;padding:20px;max-width:800px;margin:auto;}
      h1{text-align:center;} .item{padding:8px 0;border-bottom:1px solid #eee;display:flex;gap:8px;}
      .completed{opacity:0.5;text-decoration:line-through;}</style></head>
      <body><h1>🏠 Checklist Chuẩn Bị Thiên Tai</h1>
      <p>Tỉnh: ${province || "Toàn quốc"} | Mùa: ${CHECKLIST_SEASON_CONFIG[season].labelVi}</p>
      <p>Hoàn thành: ${stats.completionPercentage}%</p>
      ${filteredItems
        .map(
          (item) =>
            `<div class="item ${completedIds.has(item.id) ? "completed" : ""}">
              ${completedIds.has(item.id) ? "☑" : "☐"} ${item.icon} ${item.title}
              ${item.estimatedCost ? ` - ${item.estimatedCost}` : ""}
            </div>`
        )
        .join("")}
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  }, [province, season, stats, filteredItems, completedIds]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header with Progress */}
      <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <CircularProgress percentage={stats.completionPercentage} />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">Checklist chuẩn bị</h3>
          <p className="text-xs text-slate-400 mt-1">
            {stats.completedItems}/{stats.totalItems} mục hoàn thành
          </p>
          {stats.essentialRemaining > 0 && (
            <p className="text-xs text-amber-400 mt-1">
              ⚠️ Còn {stats.essentialRemaining} mục thiết yếu
            </p>
          )}
          <div
            className="mt-2 text-[10px] font-medium px-2 py-1 rounded inline-block"
            style={{
              backgroundColor: `${readiness.color}15`,
              color: readiness.color,
            }}
          >
            {readiness.icon} {readiness.message}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {/* Season selector */}
        <div className="flex gap-1 flex-1">
          {(Object.entries(CHECKLIST_SEASON_CONFIG) as [ChecklistSeason, typeof CHECKLIST_SEASON_CONFIG[ChecklistSeason]][]).map(
            ([key, config]) => (
              <button
                key={key}
                onClick={() => onSeasonChange(key)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg",
                  "text-[10px] font-medium transition-all duration-200 border",
                  season === key
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                    : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50"
                )}
              >
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.labelVi}</span>
              </button>
            )
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handlePrint}
          className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-200 transition-colors"
          title="In checklist"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-red-400 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Category Groups */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {grouped.map(([category, catItems]) => (
          <CategoryGroup
            key={category}
            category={category}
            items={catItems}
            completedIds={completedIds}
            onToggle={onToggleItem}
          />
        ))}
      </motion.div>

      {/* Cost Estimate */}
      {costEstimate.max > 0 && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-green-400 font-medium">
            💰 Chi phí ước tính còn lại: {costEstimate.formatted}
          </p>
        </div>
      )}

      {/* Seasonal Tips */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <p className="text-xs text-purple-400 font-medium mb-1.5">
          💡 Mẹo theo mùa
        </p>
        <ul className="space-y-1">
          {seasonalTips.map((tip, i) => (
            <li key={i} className="text-[11px] text-purple-300/70">
              • {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const ChecklistManager = memo(ChecklistManagerComponent);
