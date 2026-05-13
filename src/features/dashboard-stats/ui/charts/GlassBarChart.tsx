"use client";

// =============================================================================
// GLASS BAR CHART - Comparison Visualization
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - Vertical and horizontal layout
//   - Rounded bar corners
//   - Gradient fills
//   - Custom glassmorphism tooltip
//   - Animated entrance
//   - Responsive container
// =============================================================================

import { memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassBarChartProps, BarChartDataPoint } from "../../lib/types";
import { CHART_THEME, DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber, formatAxisValue, formatCompact } from "../../lib/formatters";

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload: BarChartDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="px-3 py-2 rounded-xl border shadow-lg"
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        borderColor: CHART_THEME.tooltipBorder,
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: CHART_THEME.tooltipText }}>
        {payload[0]?.payload?.nameVi || label}
      </p>
      {payload.map((item, i) => (
        <p key={i} className="text-[11px]" style={{ color: item.color || item.payload?.color }}>
          {formatNumber(item.value)}
        </p>
      ))}
    </div>
  );
}

// =============================================================================
// CUSTOM BAR SHAPE
// =============================================================================

function RoundedBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  layout?: "vertical" | "horizontal";
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill, layout } = props;
  const radius = 4;

  if (layout === "horizontal") {
    return (
      <path
        d={`M${x},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height - radius} Q${x + width},${y + height} ${x + width - radius},${y + height} L${x},${y + height} Z`}
        fill={fill}
      />
    );
  }

  return (
    <path
      d={`M${x},${y + height} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`}
      fill={fill}
    />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassBarChartComponent({
  data,
  title,
  titleVi,
  height = 300,
  layout = "vertical",
  xKey = "name",
  yKey = "value",
  showGrid = true,
  showLabel = false,
  className,
}: GlassBarChartProps & {
  layout?: "vertical" | "horizontal";
  xKey?: string;
  yKey?: string;
  showGrid?: boolean;
  showLabel?: boolean;
}) {
  const isHorizontal = layout === "horizontal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DASHBOARD_ANIMATION.duration.slow }}
      className={clsx("rounded-xl bg-slate-900/40 border border-slate-700/30 p-4", className)}
    >
      {/* Title */}
      {(title || titleVi) && (
        <div className="mb-3">
          {titleVi && <h3 className="text-sm font-semibold text-slate-200">{titleVi}</h3>}
          {title && <p className="text-[10px] text-slate-500">{title}</p>}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 10, left: isHorizontal ? 60 : 0, bottom: isHorizontal ? 0 : 40 }}
        >
          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray={CHART_THEME.gridStrokeDash}
              stroke={CHART_THEME.gridStroke}
            />
          )}

          {/* Axes */}
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                stroke={CHART_THEME.axisStroke}
                tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
                tickLine={false}
                tickFormatter={formatAxisValue}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                stroke={CHART_THEME.axisStroke}
                tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
                tickLine={false}
                width={55}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                stroke={CHART_THEME.axisStroke}
                tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis
                stroke={CHART_THEME.axisStroke}
                tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
                tickLine={false}
                tickFormatter={formatAxisValue}
              />
            </>
          )}

          {/* Tooltip */}
          <Tooltip content={<GlassTooltip />} />

          {/* Bar */}
          <Bar
            dataKey={yKey}
            shape={<RoundedBar layout={isHorizontal ? "horizontal" : "vertical"} />}
            animationBegin={CHART_THEME.animationBegin}
            animationDuration={CHART_THEME.animationDuration}
            animationEasing={CHART_THEME.animationEasing}
            label={showLabel ? {
              position: "top",
              fill: CHART_THEME.legendText,
              fontSize: 10,
              formatter: (value: number) => formatCompact(value),
            } : undefined}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || "#3B82F6"}
                fillOpacity={CHART_THEME.barFillOpacity}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export const GlassBarChart = memo(GlassBarChartComponent);
