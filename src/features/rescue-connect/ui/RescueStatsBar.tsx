"use client";

// =============================================================================
// RESCUE STATS BAR - Dashboard Statistics Component
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// 8 glassmorphism stat cards with animated counters:
//   1. Sự cố đang hoạt động (activeIncidents)
//   2. Người có nguy cơ (peopleAtRisk)
//   3. SOS chờ xử lý (pendingSOS)
//   4. SOS đã cứu hộ (resolvedSOS)
//   5. Tài nguyên sẵn sàng (availableResources)
//   6. Tình nguyện viên (activeVolunteers)
//   7. Nơi trú ẩn đang mở (openShelters)
//   8. Người mất tích (missingPersons)
//
// Features:
//   - Animated counters with ease-out cubic easing
//   - Staggered entrance animations (Framer Motion)
//   - Glow effect matching severity color
//   - Pulse animation for critical stats
//   - Responsive grid: 2 cols mobile → 4 cols tablet → 8 cols desktop
//   - Glassmorphism dark theme with backdrop-blur
// =============================================================================

import { memo, useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Users,
  Siren,
  CheckCircle2,
  Truck,
  HandHeart,
  Home,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react";
import clsx from "clsx";
import type { RescueStats, RescueStatsBarProps } from "../lib/types";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
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

const pulseVariants = {
  pulse: {
    scale: [1, 1.03, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// =============================================================================
// ANIMATED COUNTER HOOK
// =============================================================================

function useAnimatedCounter(
  target: number,
  duration: number = 1500,
  startOnMount: boolean = true
) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount) return;

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
  }, [target, duration, startOnMount]);

  return count;
}

// =============================================================================
// STAT CARD SUB-COMPONENT
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  suffix?: string;
  isPulsing?: boolean;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  index: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
  suffix = "",
  isPulsing = false,
  trend,
  trendValue,
  index,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, 1500 + index * 100);

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      className={clsx(
        "relative overflow-hidden rounded-xl p-3",
        "bg-slate-900/60 backdrop-blur-xl",
        "border border-slate-700/40",
        "hover:border-slate-600/60 transition-colors duration-300"
      )}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-10 rounded-xl"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${color}40 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon + Label */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-[10px] font-medium text-slate-400 leading-tight">
            {label}
          </span>
        </div>

        {/* Value */}
        <motion.div
          variants={isPulsing ? pulseVariants : undefined}
          animate={isPulsing ? "pulse" : undefined}
          className="flex items-baseline gap-1"
        >
          <span
            className="text-2xl font-black tabular-nums"
            style={{ color }}
          >
            {animatedValue.toLocaleString()}
          </span>
          {suffix && (
            <span className="text-xs text-slate-500">{suffix}</span>
          )}
        </motion.div>

        {/* Trend */}
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-red-400" />
            ) : trend === "down" ? (
              <TrendingDown className="w-3 h-3 text-green-400" />
            ) : (
              <Minus className="w-3 h-3 text-slate-500" />
            )}
            <span
              className={clsx(
                "text-[10px] font-medium",
                trend === "up" ? "text-red-400" : trend === "down" ? "text-green-400" : "text-slate-500"
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function RescueStatsBarComponent({ stats, className }: RescueStatsBarProps) {
  const statCards = useMemo(
    () => [
      {
        icon: <AlertTriangle className="w-4 h-4" />,
        label: "Sự cố hoạt động",
        value: stats.activeIncidents,
        color: "#EF4444",
        isPulsing: stats.activeIncidents > 0,
        trend: "stable" as const,
        trendValue: `${stats.totalIncidents} tổng`,
      },
      {
        icon: <Users className="w-4 h-4" />,
        label: "Người có nguy cơ",
        value: stats.peopleAtRisk,
        color: "#F97316",
        isPulsing: stats.peopleAtRisk > 1000,
        trend: "up" as const,
        trendValue: "Cần cứu hộ",
      },
      {
        icon: <Siren className="w-4 h-4" />,
        label: "SOS chờ xử lý",
        value: stats.pendingSOS,
        color: "#DC2626",
        isPulsing: stats.pendingSOS > 0,
        trend: (stats.pendingSOS > 5 ? "up" : "stable") as "up" | "stable",
        trendValue: `${stats.totalSOS} tổng SOS`,
      },
      {
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: "SOS đã cứu hộ",
        value: stats.resolvedSOS,
        color: "#22C55E",
        trend: "down" as const,
        trendValue: `${stats.peopleRescued} người`,
      },
      {
        icon: <Truck className="w-4 h-4" />,
        label: "Tài nguyên sẵn sàng",
        value: stats.availableResources,
        color: "#3B82F6",
        trend: "stable" as const,
        trendValue: `${stats.deployedResources} đã triển khai`,
      },
      {
        icon: <HandHeart className="w-4 h-4" />,
        label: "TNV đang hoạt động",
        value: stats.activeVolunteers,
        color: "#8B5CF6",
        trend: "stable" as const,
        trendValue: `${stats.totalVolunteers} tổng`,
      },
      {
        icon: <Home className="w-4 h-4" />,
        label: "Nơi trú ẩn mở",
        value: stats.openShelters,
        color: "#06B6D4",
        trend: "stable" as const,
        trendValue: `${stats.totalShelters} tổng`,
      },
      {
        icon: <HelpCircle className="w-4 h-4" />,
        label: "Người mất tích",
        value: stats.missingPersons,
        color: "#EC4899",
        isPulsing: stats.missingPersons > 0,
        trend: (stats.missingPersons > 0 ? "up" : "stable") as "up" | "stable",
        trendValue: stats.missingPersons > 0 ? "Cần tìm kiếm" : "Không có",
      },
    ],
    [stats]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2",
        className
      )}
    >
      {statCards.map((card, index) => (
        <StatCard
          key={card.label}
          icon={card.icon}
          label={card.label}
          value={card.value}
          color={card.color}
          isPulsing={card.isPulsing}
          trend={card.trend}
          trendValue={card.trendValue}
          index={index}
        />
      ))}
    </motion.div>
  );
}

export const RescueStatsBar = memo(RescueStatsBarComponent);
