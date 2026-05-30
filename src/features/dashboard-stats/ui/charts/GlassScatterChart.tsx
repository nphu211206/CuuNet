"use client";

// =============================================================================
// GLASS SCATTER CHART - Bubble Chart (EM-DAT Style)
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// EM-DAT signature visualization:
//   - X-axis: Number of events
//   - Y-axis: Number of deaths
//   - Bubble size: Economic damage
//   - Color: Dominant disaster type
//
// Features:
//   - Glassmorphism bubbles with opacity
//   - Custom tooltip showing all dimensions
//   - Click to filter by disaster type
//   - Animated entrance
//   - Responsive container
// =============================================================================

import { memo, useCallback } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassScatterChartProps, BubbleChartDataPoint } from "../../lib/types";
import { CHART_THEME, DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber, formatCompact } from "../../lib/formatters";

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

function GlassTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BubbleChartDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div
      className="px-4 py-3 rounded-xl border shadow-lg min-w-[180px]"
      style={{
        backgroundColor: CHART_THEME.tooltipBg,
        borderColor: CHART_THEME.tooltipBorder,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="text-sm font-bold" style={{ color: CHART_THEME.tooltipText }}>
          {data.name}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Sự kiện:</span>
          <span className="text-[11px] font-medium text-blue-400">{formatNumber(data.details.events)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Thương vong:</span>
          <span className="text-[11px] font-medium text-red-400">{formatNumber(data.details.deaths)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Mất tích:</span>
          <span className="text-[11px] font-medium text-amber-400">{formatNumber(data.details.missing)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">受影响:</span>
          <span className="text-[11px] font-medium text-purple-400">{formatCompact(data.details.affected * 1000)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Thiệt hại:</span>
          <span className="text-[11px] font-medium text-amber-300">{formatNumber(data.details.damageBillionVND)} tỷ</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-200">
        <span className="text-[9px] text-slate-500">
          Loại chính: {data.type === "flood" ? "Lũ lụt" : data.type === "storm" ? "Bão" : data.type === "landslide" ? "Sạt lở" : data.type === "drought" ? "Hạn hán" : "Khác"}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassScatterChartComponent({
  data,
  title,
  titleVi,
  height = 400,
  xKey = "x",
  yKey = "y",
  zKey = "z",
  showGrid = true,
  className,
  onBubbleClick,
}: GlassScatterChartProps & {
  xKey?: string;
  yKey?: string;
  zKey?: string;
  showGrid?: boolean;
  onBubbleClick?: (data: BubbleChartDataPoint) => void;
}) {
  const handleClick = useCallback(
    (data: BubbleChartDataPoint) => {
      if (onBubbleClick) onBubbleClick(data);
    },
    [onBubbleClick]
  );

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
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            type="number"
            name="Sự kiện"
            stroke={CHART_THEME.axisStroke}
            tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
            tickLine={false}
            label={{
              value: "Số sự kiện",
              position: "bottom",
              offset: -5,
              style: { fill: CHART_THEME.axisTick, fontSize: 10 },
            }}
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name="Thương vong"
            stroke={CHART_THEME.axisStroke}
            tick={{ fill: CHART_THEME.axisTick, fontSize: 10 }}
            tickLine={false}
            label={{
              value: "Số người chết",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fill: CHART_THEME.axisTick, fontSize: 10 },
            }}
          />
          <ZAxis
            dataKey={zKey}
            type="number"
            range={[50, 400]}
            name="Thiệt hại"
          />

          {/* Tooltip */}
          <Tooltip content={<GlassTooltip />} />

          {/* Scatter */}
          <Scatter
            data={data}
            animationBegin={CHART_THEME.animationBegin}
            animationDuration={CHART_THEME.animationDuration}
            animationEasing={CHART_THEME.animationEasing}
            onClick={handleClick}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                fillOpacity={0.6}
                stroke={entry.color}
                strokeWidth={1}
                strokeOpacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] text-slate-500">Lũ lụt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-[10px] text-slate-500">Bão</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-700" />
          <span className="text-[10px] text-slate-500">Sạt lở</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-slate-500">Hạn hán</span>
        </div>
      </div>

      {/* Info note */}
      <p className="text-[9px] text-slate-600 text-center mt-2">
        Kích thước bong bóng = Thiệt hại kinh tế | Nhấp vào bong bóng để xem chi tiết
      </p>
    </motion.div>
  );
}

export const GlassScatterChart = memo(GlassScatterChartComponent);
