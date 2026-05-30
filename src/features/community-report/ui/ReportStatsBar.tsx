"use client";

import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  Clock,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
} from "lucide-react";
import clsx from "clsx";
import type { ReportStats, ReportStatsBarProps } from "../lib/types";
import { DISASTER_CONFIG } from "../config/report-config";

// ============================================================
// REPORT STATS BAR COMPONENT
// ============================================================
// Thanh thống kê với 6 stat cards
// 1. Tổng báo cáo: total count (blue)
// 2. Đã xác minh: verified count + % (green)
// 3. Chờ xác minh: pending count (amber)
// 4. Hôm nay: todayCount (cyan)
// 5. Loại phổ biến: top type icon + label (purple)
// 6. Tỉnh nhiều nhất: top province (red)
// Animated counters với easing
// ============================================================

// === ANIMATION VARIANTS ===

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

// === ANIMATED COUNTER HOOK ===

function useAnimatedCounter(
  target: number,
  duration: number = 1000,
  delay: number = 0
) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset startTime khi target thay đổi để animation không bị skip
    startTimeRef.current = null;
    setCount(0);

    const timer = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        setCount(current);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      startTimeRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration, delay]);

  return count;
}

// === MAIN COMPONENT ===

function ReportStatsBarComponent({ stats, onStatClick, className }: ReportStatsBarProps) {
  // Verified percentage
  const verifiedPercent = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.verified / stats.total) * 100);
  }, [stats.verified, stats.total]);

  // Trend icon
  const TrendIcon = useMemo(() => {
    switch (stats.recentTrend) {
      case "increasing":
        return TrendingUp;
      case "decreasing":
        return TrendingDown;
      default:
        return Minus;
    }
  }, [stats.recentTrend]);

  const trendColor = useMemo(() => {
    switch (stats.recentTrend) {
      case "increasing":
        return "text-red-400";
      case "decreasing":
        return "text-green-400";
      default:
        return "text-slate-500";
    }
  }, [stats.recentTrend]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3",
        className
      )}
    >
      {/* 1. Total Reports */}
      <StatCard
        icon={<BarChart3 className="w-5 h-5" />}
        label="Tổng báo cáo"
        value={stats.total}
        color="#3B82F6"
        bgColor="bg-blue-500/10"
        onClick={() => onStatClick?.("total")}
      />

      {/* 2. Verified */}
      <StatCard
        icon={<CheckCircle className="w-5 h-5" />}
        label="Đã xác minh"
        value={stats.verified}
        suffix={`${verifiedPercent}%`}
        color="#22C55E"
        bgColor="bg-green-500/10"
        onClick={() => onStatClick?.("verified")}
      />

      {/* 3. Pending */}
      <StatCard
        icon={<Clock className="w-5 h-5" />}
        label="Chờ xác minh"
        value={stats.pending}
        color="#F59E0B"
        bgColor="bg-amber-500/10"
        onClick={() => onStatClick?.("pending")}
      />

      {/* 4. Today */}
      <StatCard
        icon={<CalendarDays className="w-5 h-5" />}
        label="Hôm nay"
        value={stats.todayCount}
        color="#06B6D4"
        bgColor="bg-cyan-500/10"
        onClick={() => onStatClick?.("today")}
      />

      {/* 5. Top Type */}
      <StatCard
        icon={
          <span className="text-lg">
            {DISASTER_CONFIG[stats.topType.type]?.icon || "🌊"}
          </span>
        }
        label="Loại phổ biến"
        value={stats.topType.count}
        suffix={DISASTER_CONFIG[stats.topType.type]?.label || ""}
        color="#A855F7"
        bgColor="bg-purple-500/10"
        onClick={() => onStatClick?.("topType")}
        isTextValue={false}
      />

      {/* 6. Top Province */}
      <StatCard
        icon={<MapPin className="w-5 h-5" />}
        label="Tỉnh nhiều nhất"
        value={stats.topProvince.count}
        suffix={stats.topProvince.name}
        color="#EF4444"
        bgColor="bg-red-500/10"
        onClick={() => onStatClick?.("topProvince")}
        isTextValue={false}
      />
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

/**
 * Stat Card: Individual stat with animated counter
 */
function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
  bgColor,
  onClick,
  isTextValue = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
  isTextValue?: boolean;
}) {
  const animatedValue = useAnimatedCounter(value, 800, 100);

  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={clsx(
        "relative rounded-xl p-3 border border-slate-200 overflow-hidden cursor-pointer",
        "hover:border-slate-300 hover:shadow-lg hover:shadow-black/10 transition-all",
        bgColor
      )}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: color }}
      />

      {/* Content */}
      <div className="relative">
        {/* Icon */}
        <div className="mb-2" style={{ color }}>
          {icon}
        </div>

        {/* Value */}
        {isTextValue ? (
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {animatedValue.toLocaleString()}
            </span>
            {suffix && (
              <span className="text-xs text-slate-500">{suffix}</span>
            )}
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color }}
            >
              {animatedValue}
            </span>
            {suffix && (
              <span className="text-xs text-slate-500 truncate">{suffix}</span>
            )}
          </div>
        )}

        {/* Label */}
        <p className="text-[10px] text-slate-500 mt-1 truncate">{label}</p>
      </div>
    </motion.div>
  );
}

// Export memoized component
export const ReportStatsBar = memo(ReportStatsBarComponent);
