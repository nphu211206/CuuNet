"use client";

// =============================================================================
// GLASS HEATMAP - Temporal Heatmap (Month × Year)
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Custom SVG heatmap (Recharts doesn't have heatmap)
//
// Features:
//   - Rows: 12 months
//   - Columns: 25 years (2000-2024)
//   - Color scale: light → dark based on count
//   - Glass cells with rounded corners
//   - Hover tooltip with exact count
//   - Year labels on x-axis
//   - Month labels on y-axis
//   - Animated entrance
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassHeatmapProps, HeatmapDataPoint } from "../../lib/types";
import { DASHBOARD_ANIMATION, MONTH_LABELS } from "../../config/dashboard-config";
import { formatNumber } from "../../lib/formatters";

// =============================================================================
// COLOR INTERPOLATION
// =============================================================================

function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = r1 + (r2 - r1) * factor;
  const g = g1 + (g2 - g1) * factor;
  const b = b1 + (b2 - b1) * factor;

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function getColorForValue(value: number, min: number, max: number): string {
  if (max === min) return "#1e3a5f";
  const factor = (value - min) / (max - min);
  return interpolateColor("#1e3a5f", "#ef4444", factor);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassHeatmapComponent({
  data,
  title,
  titleVi,
  height = 400,
  xLabels,
  yLabels,
  colorScale,
  className,
}: GlassHeatmapProps & {
  colorScale?: [string, string];
}) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate min/max for color scale
  const { min, max } = useMemo(() => {
    const values = data.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  // Create grid map
  const gridMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    for (const point of data) {
      map.set(`${point.month}-${point.year}`, point);
    }
    return map;
  }, [data]);

  // Cell dimensions
  const cellSize = 24;
  const cellGap = 2;
  const labelWidth = 50;
  const labelHeight = 30;
  const chartWidth = labelWidth + (xLabels.length * (cellSize + cellGap));
  const chartHeight = labelHeight + (yLabels.length * (cellSize + cellGap));

  const handleCellHover = useCallback(
    (point: HeatmapDataPoint, e: React.MouseEvent) => {
      setHoveredCell(point);
      const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    },
    []
  );

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

      {/* Scrollable container for many years */}
      <div className="overflow-x-auto scrollbar-hide">
        <svg
          width={Math.max(chartWidth, 600)}
          height={chartHeight}
          className="mx-auto"
        >
          {/* Month labels (y-axis) */}
          {yLabels.map((label, i) => (
            <text
              key={`month-${i}`}
              x={labelWidth - 5}
              y={labelHeight + i * (cellSize + cellGap) + cellSize / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#94A3B8"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Year labels (x-axis) */}
          {xLabels.map((label, i) => (
            <text
              key={`year-${i}`}
              x={labelWidth + i * (cellSize + cellGap) + cellSize / 2}
              y={labelHeight - 5}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize={9}
              transform={`rotate(-45, ${labelWidth + i * (cellSize + cellGap) + cellSize / 2}, ${labelHeight - 5})`}
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {yLabels.map((_, monthIdx) =>
            xLabels.map((yearLabel, yearIdx) => {
              const year = parseInt(yearLabel);
              const month = monthIdx + 1;
              const point = gridMap.get(`${month}-${year}`);
              const value = point?.value || 0;
              const color = colorScale
                ? interpolateColor(colorScale[0], colorScale[1], (value - min) / Math.max(max - min, 1))
                : getColorForValue(value, min, max);

              return (
                <motion.rect
                  key={`${month}-${year}`}
                  x={labelWidth + yearIdx * (cellSize + cellGap)}
                  y={labelHeight + monthIdx * (cellSize + cellGap)}
                  width={cellSize}
                  height={cellSize}
                  rx={4}
                  ry={4}
                  fill={color}
                  fillOpacity={0.8}
                  stroke="rgba(15,23,42,0.3)"
                  strokeWidth={0.5}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: (monthIdx * xLabels.length + yearIdx) * 0.005,
                  }}
                  onMouseEnter={(e) => point && handleCellHover(point, e)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Color scale legend */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-[9px] text-slate-500">Ít</span>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => {
            const factor = i / 4;
            const color = colorScale
              ? interpolateColor(colorScale[0], colorScale[1], factor)
              : interpolateColor("#1e3a5f", "#ef4444", factor);
            return (
              <div
                key={i}
                className="w-5 h-2"
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
        <span className="text-[9px] text-slate-500">Nhiều</span>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 px-3 py-2 rounded-xl border shadow-lg pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -100%)",
            backgroundColor: "rgba(15,23,42,0.95)",
            borderColor: "rgba(148,163,184,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p className="text-xs font-semibold text-slate-800">{hoveredCell.label}</p>
          <p className="text-[11px] text-blue-400">{hoveredCell.value} sự kiện</p>
        </div>
      )}
    </motion.div>
  );
}

export const GlassHeatmap = memo(GlassHeatmapComponent);
