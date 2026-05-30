"use client";

// =============================================================================
// GLASS TREEMAP - Proportional Area Visualization
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - Proportional area display
//   - Glass-effect cells with rounded corners
//   - Label overlay: category name + percentage
//   - Color-coded by category
//   - Animated entrance
//   - Responsive container
// =============================================================================

import { memo, useCallback } from "react";
import { ResponsiveContainer, Treemap } from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassTreemapProps, TreemapDataPoint } from "../../lib/types";
import { DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber, formatCompact, formatPercent } from "../../lib/formatters";

// =============================================================================
// CUSTOM CONTENT
// =============================================================================

function CustomTreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  nameVi?: string;
  value?: number;
  color?: string;
  root?: { value?: number };
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, nameVi, value, color, root } = props;

  if (width < 20 || height < 20) return null;

  const total = root?.value || 1;
  const percentage = value ? (value / total) * 100 : 0;
  const showLabel = width > 40 && height > 30;
  const showValue = width > 60 && height > 45;

  return (
    <g>
      {/* Background rect */}
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        rx={6}
        ry={6}
        fill={color || "#3B82F6"}
        fillOpacity={0.7}
        stroke="rgba(15,23,42,0.5)"
        strokeWidth={1}
      />

      {/* Hover effect rect */}
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        rx={6}
        ry={6}
        fill="transparent"
        className="hover:fill-white/5 transition-colors cursor-pointer"
      />

      {/* Label */}
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showValue ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={width > 80 ? 12 : 10}
          fontWeight={600}
        >
          {nameVi || name}
        </text>
      )}

      {/* Value */}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize={10}
        >
          {formatPercent(percentage, 0)}
        </text>
      )}
    </g>
  );
}

// =============================================================================
// CUSTOM TOOLTIP (via click/hover)
// =============================================================================

function TreemapTooltip({
  data,
  visible,
}: {
  data: TreemapDataPoint | null;
  visible: boolean;
}) {
  if (!visible || !data) return null;

  return (
    <div
      className="absolute top-2 right-2 px-3 py-2 rounded-xl border shadow-lg z-10"
      style={{
        backgroundColor: "rgba(15,23,42,0.95)",
        borderColor: "rgba(148,163,184,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: data.color }} />
        <p className="text-xs font-semibold text-slate-800">
          {data.nameVi || data.name}
        </p>
      </div>
      <p className="text-[11px] text-slate-700">
        {formatNumber(data.value)} tỷ VND
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassTreemapComponent({
  data,
  title,
  titleVi,
  height = 300,
  className,
}: GlassTreemapProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DASHBOARD_ANIMATION.duration.slow }}
      className={clsx("rounded-xl bg-white border border-slate-200 p-4 relative", className)}
    >
      {/* Title */}
      {(title || titleVi) && (
        <div className="mb-3">
          {titleVi && <h3 className="text-sm font-semibold text-slate-800">{titleVi}</h3>}
          {title && <p className="text-[10px] text-slate-500">{title}</p>}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          content={<CustomTreemapContent />}
          animationBegin={DASHBOARD_ANIMATION.duration.chart * 1000}
          animationDuration={DASHBOARD_ANIMATION.duration.chart * 1000}
        />
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-slate-500">
              {item.nameVi || item.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export const GlassTreemap = memo(GlassTreemapComponent);
