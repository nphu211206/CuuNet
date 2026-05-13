"use client";

// =============================================================================
// GLASS PIE CHART - Donut/Pie Visualization
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - Donut style (inner radius) or full pie
//   - Center label for donut
//   - Custom glassmorphism tooltip
//   - Animated segment reveal
//   - Legend with percentages
//   - Responsive container
// =============================================================================

import { memo, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassPieChartProps, PieChartDataPoint } from "../../lib/types";
import { CHART_THEME, DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber, formatPercent } from "../../lib/formatters";

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

function GlassTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: PieChartDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const data = item.payload;

  return (
    <div
      className="px-3 py-2 rounded-xl border shadow-lg"
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        borderColor: CHART_THEME.tooltipBorder,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="text-xs font-semibold" style={{ color: CHART_THEME.tooltipText }}>
          {data.nameVi || data.name}
        </p>
      </div>
      <p className="text-[11px] text-slate-300">
        {formatNumber(item.value)} ({formatPercent(data.percentage)})
      </p>
    </div>
  );
}

// =============================================================================
// CUSTOM LEGEND
// =============================================================================

function GlassLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string; payload: PieChartDataPoint }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[10px]" style={{ color: CHART_THEME.legendText }}>
            {item.payload?.nameVi || item.value}
          </span>
          <span className="text-[9px] text-slate-500">
            ({formatPercent(item.payload?.percentage || 0)})
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// CUSTOM LABEL
// =============================================================================

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  if (percent < 0.05) return null; // Don't show label for < 5%

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassPieChartComponent({
  data,
  title,
  titleVi,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLabel = true,
  showLegend = true,
  centerLabel,
  centerValue,
  className,
}: GlassPieChartProps & {
  centerLabel?: string;
  centerValue?: string;
}) {
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
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              nameKey="name"
              label={showLabel ? renderCustomLabel : false}
              labelLine={false}
              animationBegin={CHART_THEME.animationBegin}
              animationDuration={CHART_THEME.animationDuration}
              animationEasing={CHART_THEME.animationEasing}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={0.85}
                  stroke="rgba(15,23,42,0.5)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip />} />
            {showLegend && <Legend content={<GlassLegend />} />}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label for donut */}
        {centerLabel && innerRadius > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="text-xl font-bold text-white">{centerValue}</span>
            )}
            <span className="text-[10px] text-slate-400">{centerLabel}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const GlassPieChart = memo(GlassPieChartComponent);
