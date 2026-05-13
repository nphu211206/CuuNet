"use client";

// =============================================================================
// KPI CARD - Animated KPI Card with Trend
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - Animated counter with ease-out cubic easing
//   - Trend indicator (up/down/stable)
//   - Glow effect matching color
//   - Staggered entrance animation
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import clsx from "clsx";
import type { KPICardProps, KPIData } from "../lib/types";
import { DASHBOARD_ANIMATION } from "../config/dashboard-config";

// =============================================================================
// ANIMATED COUNTER HOOK
// =============================================================================

function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [target, duration]);

  return count;
}

// =============================================================================
// CARD VARIANTS
// =============================================================================

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: index * 0.08,
      ease: DASHBOARD_ANIMATION.ease,
    },
  }),
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// =============================================================================
// KPI CARD COMPONENT
// =============================================================================

function KPICardComponent({ kpi, index, className }: KPICardProps) {
  const animatedValue = useAnimatedCounter(kpi.value, 1500 + index * 100);
  const isUrgent = kpi.trend === "up" && (kpi.id === "deaths" || kpi.id === "damage");

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={clsx(
        "relative overflow-hidden rounded-xl p-3",
        "bg-slate-900/60 backdrop-blur-xl",
        "border border-slate-700/40",
        "hover:border-slate-600/60 transition-colors duration-300",
        className
      )}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-10 rounded-xl"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${kpi.color}40 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon + Label */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ backgroundColor: `${kpi.color}20` }}
          >
            {kpi.icon}
          </div>
          <span className="text-[10px] font-medium text-slate-400 leading-tight flex-1">
            {kpi.labelVi}
          </span>
        </div>

        {/* Value */}
        <motion.div
          variants={isUrgent ? pulseVariants : undefined}
          animate={isUrgent ? "pulse" : undefined}
          className="flex items-baseline gap-1"
        >
          <span
            className="text-2xl font-black tabular-nums"
            style={{ color: kpi.color }}
          >
            {kpi.formattedValue || (isNaN(animatedValue) ? "0" : animatedValue.toLocaleString("vi-VN"))}
          </span>
          {kpi.suffix && (
            <span className="text-xs text-slate-500">{kpi.suffix}</span>
          )}
        </motion.div>

        {/* Trend */}
        {kpi.trendValue && (
          <div className="flex items-center gap-1 mt-1.5">
            {kpi.trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-red-400" />
            ) : kpi.trend === "down" ? (
              <TrendingDown className="w-3 h-3 text-green-400" />
            ) : (
              <Minus className="w-3 h-3 text-slate-500" />
            )}
            <span
              className={clsx(
                "text-[10px] font-medium",
                kpi.trend === "up" ? "text-red-400" : kpi.trend === "down" ? "text-green-400" : "text-slate-500"
              )}
            >
              {kpi.trendValue}
            </span>
            <span className="text-[9px] text-slate-600 ml-1">{kpi.description}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const KPICard = memo(KPICardComponent);

// =============================================================================
// KPI CARD GRID
// =============================================================================

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

function KPICardGridComponent({ kpis, className }: { kpis: KPIData[]; className?: string }) {
  return (
    <motion.div
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2",
        className
      )}
    >
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.id} kpi={kpi} index={index} />
      ))}
    </motion.div>
  );
}

export const KPICardGrid = memo(KPICardGridComponent);
