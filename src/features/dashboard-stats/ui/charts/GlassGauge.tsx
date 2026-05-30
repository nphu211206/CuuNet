"use client";

// =============================================================================
// GLASS GAUGE - Custom SVG Gauge Chart
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Custom SVG gauge (Recharts doesn't have native gauge)
//
// Features:
//   - Semicircular arc with gradient fill
//   - Needle indicator
//   - Glass background
//   - Animated fill on mount
//   - Color-coded by level
//   - Center value display
// =============================================================================

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { GlassGaugeProps, GaugeData } from "../../lib/types";
import { DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber } from "../../lib/formatters";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function GlassGaugeComponent({
  data,
  title,
  titleVi,
  height,
  size = 120,
  strokeWidth = 10,
  className,
}: GlassGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Semicircle
  const percentage = data.maxValue > 0 ? (data.value / data.maxValue) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  // Arc path for semicircle
  const centerX = size / 2;
  const centerY = size / 2 + 10;

  // Calculate needle angle (-90 to 90 degrees)
  const needleAngle = -90 + (percentage / 100) * 180;
  const needleLength = radius * 0.7;
  const needleX = centerX + needleLength * Math.cos((needleAngle * Math.PI) / 180);
  const needleY = centerY - needleLength * Math.sin((needleAngle * Math.PI) / 180);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DASHBOARD_ANIMATION.duration.slow }}
      className={clsx("flex flex-col items-center", className)}
    >
      {/* Title */}
      {(title || titleVi) && (
        <div className="mb-2 text-center">
          {titleVi && <h3 className="text-xs font-semibold text-slate-800">{titleVi}</h3>}
        </div>
      )}

      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2},${centerY} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${centerY}`}
            fill="none"
            stroke="rgba(100,116,139,0.15)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gauge-gradient-${data.label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>

          {/* Value arc */}
          <motion.path
            d={`M ${strokeWidth / 2},${centerY} A ${radius},${radius} 0 0,1 ${size - strokeWidth / 2},${centerY}`}
            fill="none"
            stroke={data.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = -90 + (tick / 100) * 180;
            const tickRad = (tickAngle * Math.PI) / 180;
            const innerR = radius - strokeWidth - 3;
            const outerR = radius - strokeWidth + 3;
            const x1 = centerX + innerR * Math.cos(tickRad);
            const y1 = centerY - innerR * Math.sin(tickRad);
            const x2 = centerX + outerR * Math.cos(tickRad);
            const y2 = centerY - outerR * Math.sin(tickRad);
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(148,163,184,0.3)"
                strokeWidth={1}
              />
            );
          })}

          {/* Needle */}
          <motion.line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            initial={{ x2: centerX, y2: centerY - needleLength }}
            animate={{ x2: needleX, y2: needleY }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          />

          {/* Needle center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r={4}
            fill="white"
            stroke="rgba(15,23,42,0.5)"
            strokeWidth={1}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-xl font-black tabular-nums"
            style={{ color: data.color }}
          >
            {formatNumber(data.value)}
          </motion.span>
          <span className="text-[9px] text-slate-500">{data.labelVi}</span>
        </div>
      </div>

      {/* Level badge */}
      <div
        className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
        style={{
          backgroundColor: `${data.color}20`,
          color: data.color,
        }}
      >
        {data.levelVi}
      </div>
    </motion.div>
  );
}

export const GlassGauge = memo(GlassGaugeComponent);
