"use client";

// =============================================================================
// EMERGENCY KIT BUILDER - Interactive Checklist
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - 5 categories (water/food, medical, tools, documents, personal)
//   - Checkbox items with priority badges
//   - Progress gauge per category
//   - Overall completion percentage
//   - Cost estimation
//   - Tips for each item
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Package,
  Droplets,
  Stethoscope,
  Wrench,
  FileText,
  User,
  Info,
  DollarSign,
} from "lucide-react";
import clsx from "clsx";
import type { KitItem, KitCategory, EmergencyKitBuilderProps } from "../lib/types";
import { KIT_CATEGORY_CONFIG, EDUCATION_ANIMATION } from "../config/education-config";

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
// CATEGORY ICONS
// =============================================================================

const CATEGORY_ICONS: Record<KitCategory, React.ReactNode> = {
  water_food: <Droplets className="w-4 h-4" />,
  medical: <Stethoscope className="w-4 h-4" />,
  tools: <Wrench className="w-4 h-4" />,
  documents: <FileText className="w-4 h-4" />,
  personal: <User className="w-4 h-4" />,
};

// =============================================================================
// KIT ITEM ROW
// =============================================================================

function KitItemRow({
  item,
  checked,
  onToggle,
}: {
  item: KitItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const priorityConfig = {
    essential: { label: "Thiết yếu", color: "#EF4444" },
    recommended: { label: "Nên có", color: "#F59E0B" },
    optional: { label: "Tùy chọn", color: "#6B7280" },
  }[item.priority];

  return (
    <motion.div
      variants={itemVariants}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      className={clsx(
        "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        checked
          ? "bg-green-500/5 border border-green-500/15"
          : "bg-slate-900/30 border border-slate-700/20 hover:border-slate-600/40"
      )}
    >
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        {checked ? (
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
              checked ? "text-slate-500 line-through" : "text-slate-200"
            )}
          >
            {item.nameVi}
          </h4>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: `${priorityConfig.color}15`,
              color: priorityConfig.color,
            }}
          >
            {priorityConfig.label}
          </span>
        </div>
        <p className={clsx("text-xs mt-1", checked ? "text-slate-600" : "text-slate-500")}>
          {item.descriptionVi}
        </p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
          <span>📦 {item.quantity}</span>
          {item.estimatedCost && <span>💰 {item.estimatedCost}</span>}
        </div>
        {item.tipsVi && !checked && (
          <p className="text-[10px] text-purple-400/70 mt-1 italic">💡 {item.tipsVi}</p>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// CATEGORY GROUP
// =============================================================================

function CategoryGroup({
  category,
  items,
  checkedIds,
  onToggle,
}: {
  category: KitCategory;
  items: KitItem[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = KIT_CATEGORY_CONFIG[category];
  const checkedCount = items.filter((i) => checkedIds.has(i.id)).length;
  const allChecked = checkedCount === items.length;

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
          {checkedCount}/{items.length}
        </span>
        {allChecked && <CheckCircle2 className="w-4 h-4 text-green-400" />}
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
                <KitItemRow
                  key={item.id}
                  item={item}
                  checked={checkedIds.has(item.id)}
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

function EmergencyKitBuilderComponent({
  items,
  progress,
  onToggleItem,
  onReset,
  className,
}: EmergencyKitBuilderProps) {
  const checkedIds = useMemo(() => new Set(progress.checkedItems), [progress.checkedItems]);

  // Group items by category
  const grouped = useMemo(() => {
    const groups = new Map<KitCategory, KitItem[]>();
    for (const item of items) {
      const existing = groups.get(item.category) || [];
      existing.push(item);
      groups.set(item.category, existing);
    }
    return Array.from(groups.entries()).sort(
      (a, b) => Object.keys(KIT_CATEGORY_CONFIG).indexOf(a[0]) - Object.keys(KIT_CATEGORY_CONFIG).indexOf(b[0])
    );
  }, [items]);

  // Calculate stats
  const essentialItems = useMemo(() => items.filter((i) => i.priority === "essential"), [items]);
  const essentialChecked = useMemo(
    () => essentialItems.filter((i) => checkedIds.has(i.id)).length,
    [essentialItems, checkedIds]
  );

  // Estimate total cost
  const totalCost = useMemo(() => {
    return items
      .filter((i) => !checkedIds.has(i.id) && i.estimatedCost)
      .reduce((sum, i) => {
        const match = i.estimatedCost?.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
  }, [items, checkedIds]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header with progress */}
      <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
        {/* Progress gauge */}
        <div className="relative inline-flex items-center justify-center">
          <svg width={80} height={80} className="-rotate-90">
            <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={6} />
            <motion.circle
              cx={40} cy={40} r={32}
              fill="none" stroke="#22C55E" strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={32 * 2 * Math.PI}
              initial={{ strokeDashoffset: 32 * 2 * Math.PI }}
              animate={{ strokeDashoffset: 32 * 2 * Math.PI * (1 - progress.completionPercent / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-green-400">{progress.completionPercent}%</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">Bộ đồ 72 giờ</h3>
          <p className="text-xs text-slate-400 mt-1">
            {checkedIds.size}/{items.length} mục đã chuẩn bị
          </p>
          {essentialChecked < essentialItems.length && (
            <p className="text-xs text-amber-400 mt-1">
              ⚠️ Còn {essentialItems.length - essentialChecked} mục thiết yếu
            </p>
          )}
          {totalCost > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">
              💰 Chi phí ước tính còn lại: {totalCost.toLocaleString("vi-VN")}đ
            </p>
          )}
        </div>
      </div>

      {/* Category groups */}
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
            checkedIds={checkedIds}
            onToggle={onToggleItem}
          />
        ))}
      </motion.div>

      {/* Tips */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <p className="text-xs text-purple-400 font-medium mb-1.5">💡 Mẹo chuẩn bị</p>
        <ul className="space-y-1">
          <li className="text-[11px] text-purple-300/70">• Bọc nilon cho giấy tờ quan trọng</li>
          <li className="text-[11px] text-purple-300/70">• Kiểm tra hạn sử dụng thực phẩm và thuốc mỗi 6 tháng</li>
          <li className="text-[11px] text-purple-300/70">• Để bộ đồ ở nơi dễ lấy, gần cửa ra vào</li>
          <li className="text-[11px] text-purple-300/70">• Chuẩn bị thêm cho người già, trẻ em, thú cưng</li>
        </ul>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-xs font-medium hover:text-red-400 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset checklist
      </button>
    </div>
  );
}

export const EmergencyKitBuilder = memo(EmergencyKitBuilderComponent);
