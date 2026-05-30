"use client";

// =============================================================================
// GLASS AREA CHART - Time Series Visualization
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - Gradient fill under area (glassmorphism style)
//   - Custom glassmorphism tooltip
//   - Annotation lines for major events
//   - 10-year moving average overlay
//   - Animated entrance
//   - Responsive container
// =============================================================================

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassAreaChartProps, TimeSeriesDataPoint } from "../../lib/types";
import { CHART_THEME, DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber, formatAxisValue } from "../../lib/formatters";
import { calculateSMA } from "../../lib/aggregation";

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
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
        {label}
      </p>
      {payload.map((item, i) => (
        <p key={i} className="text-[11px]" style={{ color: item.color }}>
          {item.name}: {formatNumber(item.value)}
        </p>
      ))}
    </div>
  );
}

// =============================================================================
// CUSTOM LEGEND
// =============================================================================

function GlassLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[10px]" style={{ color: CHART_THEME.legendText }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassAreaChartComponent({
  data,
  title,
  titleVi,
  height = 300,
  xKey = "year",
  yKey = "value",
  color = "#3B82F6",
  gradientId = "areaGradient",
  showGrid = true,
  showDots = false,
  annotation,
  className,
  secondaryKey,
  secondaryColor,
  showSMA,
  smaWindow,
}: GlassAreaChartProps & {
  xKey?: string;
  yKey?: string;
  color?: string;
  gradientId?: string;
  showGrid?: boolean;
  showDots?: boolean;
  annotation?: { year: number; label: string };
  secondaryKey?: string;
  secondaryColor?: string;
  showSMA?: boolean;
  smaWindow?: number;
}) {
  // Calculate SMA if requested
  const chartData = useMemo(() => {
    if (!showSMA) return data;
    const values = data.map((d) => (d as unknown as Record<string, number>)[yKey] || 0);
    const smaValues = calculateSMA(values, smaWindow || 10);
    return data.map((d, i) => ({
      ...d,
      sma: smaValues[i],
    }));
  }, [data, yKey, showSMA, smaWindow]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DASHBOARD_ANIMATION.duration.slow }}
      className={clsx("rounded-xl bg-white border border-slate-200 p-4", className)}
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
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
            {secondaryColor && (
              <linearGradient id={`${gradientId}Secondary`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity={0.05} />
              </linearGradient>
            )}
          </defs>

          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray={CHART_THEME.gridStrokeDash}
              stroke={CHART_THEME.gridStroke}
            />
          )}

          {/* Axes */}
          <XAxis
            dataKey={xKey}
            stroke={CHART_THEME.axisStroke}
            tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            stroke={CHART_THEME.axisStroke}
            tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
            tickLine={false}
            tickFormatter={formatAxisValue}
          />

          {/* Tooltip */}
          <Tooltip content={<GlassTooltip />} />

          {/* Legend */}
          <Legend content={<GlassLegend />} />

          {/* Annotation line */}
          {annotation && (
            <ReferenceLine
              x={annotation.year}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              label={{
                value: annotation.label,
                position: "top",
                fill: "#F59E0B",
                fontSize: 10,
              }}
            />
          )}

          {/* Main area */}
          <Area
            type="monotone"
            dataKey={yKey}
            name={titleVi || "Giá trị"}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={showDots ? { fill: color, strokeWidth: 0, r: 3 } : false}
            activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "#fff" }}
            animationBegin={CHART_THEME.animationBegin}
            animationDuration={CHART_THEME.animationDuration}
            animationEasing={CHART_THEME.animationEasing}
          />

          {/* Secondary area */}
          {secondaryKey && secondaryColor && (
            <Area
              type="monotone"
              dataKey={secondaryKey}
              name="So sánh"
              stroke={secondaryColor}
              strokeWidth={1.5}
              fill={`url(#${gradientId}Secondary)`}
              dot={false}
              animationBegin={CHART_THEME.animationBegin + 200}
              animationDuration={CHART_THEME.animationDuration}
              animationEasing={CHART_THEME.animationEasing}
            />
          )}

          {/* SMA line */}
          {showSMA && (
            <Area
              type="monotone"
              dataKey="sma"
              name={`TB động ${smaWindow || 10} năm`}
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="none"
              dot={false}
              animationBegin={CHART_THEME.animationBegin + 400}
              animationDuration={CHART_THEME.animationDuration}
              animationEasing={CHART_THEME.animationEasing}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export const GlassAreaChart = memo(GlassAreaChartComponent);
