"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SeasonalCalendarProps } from "../lib/types";
import type { DisasterType } from "@/lib/types";
import { DISASTER_CONFIG } from "../config/predict-config";
import {
  SEASONAL_MULTIPLIER,
  MONTH_NAMES_SHORT,
  getSeasonalRiskLabel,
  getSeasonDescription,
  getPeakMonth,
} from "../lib/seasonal-data";
import { calculateRiskScore } from "../lib/risk-engine";

// === CONSTANTS ===

const DISASTER_TYPES: DisasterType[] = [
  "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
];

// === COLOR INTERPOLATION ===

/**
 * Convert risk score (0-1) to a background color.
 * Uses a 5-stop gradient: dark → green → lime → yellow → orange → red
 */
function riskToColor(risk: number): string {
  const clamped = Math.max(0, Math.min(1, risk));
  if (clamped < 0.15) return "rgba(15, 23, 42, 0.8)";
  if (clamped < 0.25) return `rgba(34, 197, 94, ${0.15 + clamped * 0.6})`;
  if (clamped < 0.40) return `rgba(132, 204, 22, ${0.2 + clamped * 0.8})`;
  if (clamped < 0.55) return `rgba(234, 179, 8, ${0.3 + clamped * 0.6})`;
  if (clamped < 0.70) return `rgba(249, 115, 22, ${0.4 + clamped * 0.5})`;
  if (clamped < 0.85) return `rgba(239, 68, 68, ${0.5 + clamped * 0.3})`;
  return `rgba(220, 38, 38, ${0.7 + clamped * 0.3})`;
}

/**
 * Get text color that contrasts with the background.
 */
function riskToTextColor(risk: number): string {
  if (risk < 0.25) return "#64748b";
  if (risk < 0.50) return "#a3e635";
  if (risk < 0.70) return "#fbbf24";
  return "#fca5a5";
}

// === TOOLTIP ===

interface CellTooltip {
  month: number;
  type: DisasterType;
  multiplier: number;
  riskScore: number;
  province?: string;
  x: number;
  y: number;
}

function TooltipCard({ data }: { data: CellTooltip }) {
  const config = DISASTER_CONFIG[data.type];
  const riskLabel = getSeasonalRiskLabel(data.multiplier);
  const peakMonth = getPeakMonth(data.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card border border-slate-200 shadow-2xl p-4 min-w-[220px] pointer-events-none z-50"
      style={{ position: "fixed", left: data.x + 12, top: data.y - 10 }}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {config.label} - {MONTH_NAMES_SHORT[data.month]}
          </p>
          <p className="text-xs text-slate-500">
            Tháng cao điểm: {MONTH_NAMES_SHORT[peakMonth]}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Hệ số mùa vụ:</span>
          <span className="font-mono" style={{ color: riskToTextColor(data.multiplier) }}>
            {data.multiplier.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Mức rủi ro:</span>
          <span className="font-semibold" style={{ color: riskToTextColor(data.multiplier) }}>
            {riskLabel}
          </span>
        </div>

        {data.riskScore > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Điểm rủi ro:</span>
            <span className="font-mono text-slate-800">
              {(data.riskScore * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          {getSeasonDescription(data.month)}
        </p>
      </div>
    </motion.div>
  );
}

// === COMPONENT ===

export default function SeasonalCalendar({
  province,
  selectedMonth,
  onMonthSelect,
}: SeasonalCalendarProps) {
  const [tooltip, setTooltip] = useState<CellTooltip | null>(null);

  // Pre-compute all cell data
  const cellData = useMemo(() => {
    const data: Map<string, { multiplier: number; riskScore: number }> = new Map();
    for (let m = 0; m < 12; m++) {
      for (const type of DISASTER_TYPES) {
        const multiplier = SEASONAL_MULTIPLIER[type][m];
        const riskScore = calculateRiskScore(province, type, m).score;
        data.set(`${m}-${type}`, { multiplier, riskScore });
      }
    }
    return data;
  }, [province]);

  const handleCellHover = useCallback(
    (e: React.MouseEvent, month: number, type: DisasterType) => {
      const key = `${month}-${type}`;
      const cell = cellData.get(key);
      if (!cell) return;

      setTooltip({
        month,
        type,
        multiplier: cell.multiplier,
        riskScore: cell.riskScore,
        province,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [cellData, province]
  );

  const handleCellLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleCellClick = useCallback(
    (month: number) => {
      onMonthSelect?.(month);
    },
    [onMonthSelect]
  );

  const currentMonth = new Date().getMonth();

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Phân tích mùa vụ thiên tai
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {province} - Ma trận rủi ro 12 tháng × 6 loại thiên tai
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Thấp</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div
                key={v}
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: riskToColor(v) }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">Cao</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Month headers */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "80px repeat(12, 1fr)" }}>
            <div /> {/* Empty corner */}
            {MONTH_NAMES_SHORT.map((name, i) => (
              <div
                key={i}
                className={`text-center text-[10px] py-1 rounded-t ${
                  i === currentMonth
                    ? "text-blue-400 font-bold bg-blue-500/10"
                    : i === selectedMonth
                      ? "text-amber-400 font-semibold"
                      : "text-slate-500"
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {DISASTER_TYPES.map((type, rowIdx) => {
            const config = DISASTER_CONFIG[type];
            return (
              <motion.div
                key={type}
                className="grid gap-1 mb-1"
                style={{ gridTemplateColumns: "80px repeat(12, 1fr)" }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIdx * 0.06, duration: 0.3 }}
              >
                {/* Row label */}
                <div className="flex items-center gap-1.5 pr-2">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {config.label}
                  </span>
                </div>

                {/* Cells */}
                {Array.from({ length: 12 }, (_, month) => {
                  const key = `${month}-${type}`;
                  const cell = cellData.get(key);
                  const multiplier = cell?.multiplier ?? 0;
                  const riskScore = cell?.riskScore ?? 0;
                  const isCurrentMonth = month === currentMonth;
                  const isSelectedMonth = month === selectedMonth;
                  const isHighRisk = multiplier >= 0.7;

                  return (
                    <motion.div
                      key={month}
                      className={`
                        relative rounded-sm cursor-pointer transition-all duration-200
                        flex items-center justify-center
                        ${isCurrentMonth ? "ring-1 ring-blue-500/60" : ""}
                        ${isSelectedMonth ? "ring-1 ring-amber-500/60" : ""}
                        ${isHighRisk ? "ring-1 ring-red-500/30" : ""}
                        hover:scale-110 hover:z-10 hover:shadow-lg
                      `}
                      style={{
                        backgroundColor: riskToColor(multiplier),
                        aspectRatio: "1.4",
                      }}
                      onMouseEnter={(e) => handleCellHover(e, month, type)}
                      onMouseLeave={handleCellLeave}
                      onClick={() => handleCellClick(month)}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span
                        className="text-[9px] font-mono font-semibold"
                        style={{ color: riskToTextColor(multiplier) }}
                      >
                        {multiplier >= 0.1 ? multiplier.toFixed(2) : ""}
                      </span>

                      {/* High risk indicator dot */}
                      {isHighRisk && (
                        <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected month info */}
      {selectedMonth !== undefined && (
        <motion.div
          className="mt-4 pt-3 border-t border-slate-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-slate-500">
            <span className="text-slate-700 font-semibold">
              {MONTH_NAMES_SHORT[selectedMonth]}:
            </span>{" "}
            {getSeasonDescription(selectedMonth)}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {DISASTER_TYPES.filter(
              (t) => SEASONAL_MULTIPLIER[t][selectedMonth] >= 0.7
            ).map((type) => (
              <span
                key={type}
                className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {DISASTER_CONFIG[type].icon} {DISASTER_CONFIG[type].label} -{" "}
                {getSeasonalRiskLabel(SEASONAL_MULTIPLIER[type][selectedMonth])}
              </span>
            ))}
            {DISASTER_TYPES.filter(
              (t) => SEASONAL_MULTIPLIER[t][selectedMonth] < 0.3
            ).length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Nguy cơ thấp
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Tooltip portal */}
      <AnimatePresence>
        {tooltip && <TooltipCard data={tooltip} />}
      </AnimatePresence>
    </motion.div>
  );
}
