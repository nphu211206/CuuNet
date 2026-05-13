"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { RiskGaugeProps } from "../lib/types";
import { GAUGE_CONFIG, RISK_COLORS } from "../config/predict-config";
import { scoreToLevel, getRiskLevelLabel } from "../lib/risk-engine";

// === SVG MATH HELPERS ===

/**
 * Convert polar coordinates (angle in degrees, radius) to Cartesian (x, y).
 * Angle 0 = top (12 o'clock), increases clockwise.
 */
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/**
 * Generate SVG arc path for a gauge segment.
 * Returns an SVG path "d" attribute string.
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/**
 * Get color for a given risk score (0-1).
 * Uses the 5-stop color scale from config.
 */
function getScoreColor(score: number): string {
  const stops = GAUGE_CONFIG.COLOR_STOPS;
  for (let i = 1; i < stops.length; i++) {
    if (score <= stops[i].offset) {
      const prev = stops[i - 1];
      const next = stops[i];
      const t = (score - prev.offset) / (next.offset - prev.offset);
      return interpolateColor(prev.color, next.color, t);
    }
  }
  return stops[stops.length - 1].color;
}

/**
 * Linearly interpolate between two hex colors.
 */
function interpolateColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// === SIZE CONFIG ===

interface GaugeDimensions {
  width: number;
  height: number;
  cx: number;
  cy: number;
  radius: number;
  strokeWidth: number;
  fontSize: number;
  labelSize: number;
}

function getDimensions(size: "sm" | "md" | "lg"): GaugeDimensions {
  const config = GAUGE_CONFIG.SIZES[size];
  const cx = config.width / 2;
  const cy = config.height / 2;
  const radius = (config.width - config.strokeWidth * 2) / 2 - 4;
  return {
    ...config,
    cx,
    cy,
    radius,
    labelSize: Math.round(config.fontSize * 0.45),
  };
}

// === COMPONENT ===

export default function RiskGauge({
  score,
  size = "md",
  label,
  showLevel = true,
  animated = true,
  className = "",
}: RiskGaugeProps) {
  const dim = getDimensions(size);
  const clampedScore = Math.max(0, Math.min(1, score));
  const level = scoreToLevel(clampedScore);
  const levelLabel = getRiskLevelLabel(level);
  const scoreColor = getScoreColor(clampedScore);
  const percentage = Math.round(clampedScore * 100);

  // Calculate arc angles
  const startAngle = GAUGE_CONFIG.START_ANGLE;
  const endAngle = startAngle + GAUGE_CONFIG.ARC_ANGLE;
  const scoreAngle = startAngle + GAUGE_CONFIG.ARC_ANGLE * clampedScore;

  // Generate background arc segments (colored zones)
  const segments = useMemo(() => {
    const segs: { path: string; color: string; startDeg: number; endDeg: number }[] = [];
    const stops = GAUGE_CONFIG.COLOR_STOPS;

    for (let i = 0; i < stops.length - 1; i++) {
      const segStart = startAngle + GAUGE_CONFIG.ARC_ANGLE * stops[i].offset;
      const segEnd = startAngle + GAUGE_CONFIG.ARC_ANGLE * stops[i + 1].offset;
      segs.push({
        path: describeArc(dim.cx, dim.cy, dim.radius, segStart, segEnd),
        color: stops[i].color,
        startDeg: segStart,
        endDeg: segEnd,
      });
    }
    return segs;
  }, [startAngle, dim]);

  // Generate value arc path
  const valueArcPath = useMemo(() => {
    if (clampedScore <= 0) return "";
    return describeArc(dim.cx, dim.cy, dim.radius, startAngle, scoreAngle);
  }, [clampedScore, startAngle, scoreAngle, dim]);

  // Needle endpoint
  const needleEnd = polarToCartesian(dim.cx, dim.cy, dim.radius - 8, scoreAngle);

  // Tick marks (every 25%)
  const ticks = useMemo(() => {
    const marks: { x1: number; y1: number; x2: number; y2: number; label: string }[] = [];
    for (let i = 0; i <= 4; i++) {
      const angle = startAngle + (GAUGE_CONFIG.ARC_ANGLE * i) / 4;
      const outer = polarToCartesian(dim.cx, dim.cy, dim.radius + 2, angle);
      const inner = polarToCartesian(dim.cx, dim.cy, dim.radius - 6, angle);
      const labelPos = polarToCartesian(dim.cx, dim.cy, dim.radius + 14, angle);
      marks.push({
        x1: outer.x,
        y1: outer.y,
        x2: inner.x,
        y2: inner.y,
        label: `${i * 25}`,
      });
    }
    return marks;
  }, [startAngle, dim]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="drop-shadow-lg"
      >
        {/* Background glow */}
        <defs>
          <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`needle-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track (dark) */}
        <path
          d={describeArc(dim.cx, dim.cy, dim.radius, startAngle, endAngle)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={dim.strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored zone segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth={dim.strokeWidth}
            strokeLinecap="butt"
            opacity={0.15}
          />
        ))}

        {/* Value arc (animated) */}
        {valueArcPath && (
          <motion.path
            d={valueArcPath}
            fill="none"
            stroke={scoreColor}
            strokeWidth={dim.strokeWidth}
            strokeLinecap="round"
            filter={`url(#glow-${size})`}
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={animated ? { duration: 1.5, ease: "easeOut" } : undefined}
          />
        )}

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#475569"
              strokeWidth={1.5}
            />
            {size !== "sm" && (
              <text
                x={tick.x1}
                y={tick.y1 + 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize={8}
                fontFamily="monospace"
              >
                {tick.label}
              </text>
            )}
          </g>
        ))}

        {/* Needle (animated) */}
        <motion.line
          x1={dim.cx}
          y1={dim.cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={scoreColor}
          strokeWidth={size === "sm" ? 2 : 3}
          strokeLinecap="round"
          filter={`url(#needle-glow-${size})`}
          initial={animated ? { x2: dim.cx, y2: dim.cy - dim.radius + 8 } : undefined}
          animate={animated ? { x2: needleEnd.x, y2: needleEnd.y } : undefined}
          transition={
            animated
              ? { type: "spring", stiffness: 80, damping: 12, delay: 0.5 }
              : undefined
          }
        />

        {/* Center dot */}
        <circle cx={dim.cx} cy={dim.cy} r={4} fill={scoreColor} />
        <circle cx={dim.cx} cy={dim.cy} r={2} fill="#0f172a" />

        {/* Score text */}
        <motion.text
          x={dim.cx}
          y={dim.cy + (size === "sm" ? 18 : 24)}
          textAnchor="middle"
          fill="#f1f5f9"
          fontSize={dim.fontSize}
          fontWeight="bold"
          fontFamily="monospace"
          initial={animated ? { opacity: 0 } : undefined}
          animate={animated ? { opacity: 1 } : undefined}
          transition={animated ? { delay: 0.8, duration: 0.5 } : undefined}
        >
          {percentage}
        </motion.text>

        {/* Percentage sign */}
        <text
          x={dim.cx + (size === "sm" ? 16 : 22)}
          y={dim.cy + (size === "sm" ? 14 : 18)}
          textAnchor="start"
          fill="#94a3b8"
          fontSize={dim.labelSize}
          fontFamily="monospace"
        >
          %
        </text>

        {/* Risk level text */}
        {showLevel && (
          <motion.text
            x={dim.cx}
            y={dim.cy + (size === "sm" ? 32 : 40)}
            textAnchor="middle"
            fill={scoreColor}
            fontSize={dim.labelSize}
            fontWeight="600"
            initial={animated ? { opacity: 0, y: dim.cy + 50 } : undefined}
            animate={animated ? { opacity: 1, y: dim.cy + (size === "sm" ? 32 : 40) } : undefined}
            transition={animated ? { delay: 1.0, duration: 0.4 } : undefined}
          >
            {levelLabel}
          </motion.text>
        )}
      </svg>

      {/* Optional label below */}
      {label && (
        <span className="mt-1 text-xs text-slate-400 text-center">{label}</span>
      )}
    </div>
  );
}
