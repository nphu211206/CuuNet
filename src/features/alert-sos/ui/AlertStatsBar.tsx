"use client";

// =============================================================================
// ALERT STATS BAR - Dashboard Statistics Component
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// 5 glassmorphism stat cards with animated counters:
//   1. Cảnh báo đang hoạt động (totalActive)
//   2. Cảnh báo cực kỳ nghiêm trọng (extremeCount)
//   3. SOS chờ xử lý (pendingSOS)
//   4. SOS đã giải quyết hôm nay (resolvedTodaySOS)
//   5. Checklist hoàn thành (checklistCompletionAvg %)
//
// Features:
//   - Animated counters with ease-out cubic easing
//   - Staggered entrance animations (Framer Motion)
//   - Glow effect matching severity color
//   - Trend indicator (increasing/stable/decreasing)
//   - Responsive grid: 2 cols mobile → 3 cols tablet → 5 cols desktop
//   - Glassmorphism dark theme with backdrop-blur
// =============================================================================

import { memo, useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Flame,
  Siren,
  CheckCircle2,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Users,
} from "lucide-react";
import clsx from "clsx";
import type { AlertStats, AlertStatsBarProps } from "../lib/types";
import { ALERT_SEVERITY_CONFIG } from "../config/alert-config";
import { DISASTER_CONFIG } from "@/lib/constants";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
    scale: [1, 1.02, 1],
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
  duration: number = 1200,
  delay: number = 0
) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    setCount(0);

    const timer = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
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

// =============================================================================
// STAT CARD SUB-COMPONENT
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  glowColor: string;
  trend?: "increasing" | "stable" | "decreasing";
  isUrgent?: boolean;
  delay?: number;
  onClick?: () => void;
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
  glowColor,
  trend,
  isUrgent = false,
  delay = 0,
  onClick,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(value, 1000, delay);

  const TrendIcon = useMemo(() => {
    switch (trend) {
      case "increasing":
        return TrendingUp;
      case "decreasing":
        return TrendingDown;
      default:
        return Minus;
    }
  }, [trend]);

  const trendColor = useMemo(() => {
    switch (trend) {
      case "increasing":
        return "text-red-400";
      case "decreasing":
        return "text-green-400";
      default:
        return "text-slate-500";
    }
  }, [trend]);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        "relative rounded-2xl p-4 overflow-hidden cursor-pointer",
        "bg-white backdrop-blur-xl",
        "border border-slate-200",
        "hover:border-slate-300 hover:shadow-xl hover:shadow-black/20",
        "transition-all duration-300",
        "group"
      )}
    >
      {/* Background glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity duration-500"
        style={{ backgroundColor: glowColor }}
      />

      {/* Urgent pulse border */}
      {isUrgent && value > 0 && (
        <motion.div
          variants={pulseVariants}
          animate="pulse"
          className="absolute inset-0 rounded-2xl border-2 opacity-30"
          style={{ borderColor: color }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header: Icon + Trend */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {icon}
          </div>

          {trend && trend !== "stable" && (
            <div className={clsx("flex items-center gap-0.5", trendColor)}>
              <TrendIcon className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <motion.span
            className="text-3xl font-black tabular-nums tracking-tight"
            style={{ color }}
          >
            {animatedValue.toLocaleString()}
          </motion.span>
          {suffix && (
            <span className="text-sm font-medium text-slate-500">{suffix}</span>
          )}
        </div>

        {/* Label */}
        <p className="text-xs text-slate-500 mt-1.5 font-medium tracking-wide uppercase">
          {label}
        </p>

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
}

// =============================================================================
// TREND BADGE SUB-COMPONENT
// =============================================================================

function TrendBadge({ trend }: { trend: "increasing" | "stable" | "decreasing" }) {
  const config = useMemo(() => {
    switch (trend) {
      case "increasing":
        return {
          icon: TrendingUp,
          label: "Tăng",
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
        };
      case "decreasing":
        return {
          icon: TrendingDown,
          label: "Giảm",
          color: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/20",
        };
      default:
        return {
          icon: Minus,
          label: "Ổn định",
          color: "text-slate-500",
          bg: "bg-slate-500/10",
          border: "border-slate-500/20",
        };
    }
  }, [trend]);

  const Icon = config.icon;

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
        config.bg,
        config.border,
        "border",
        config.color
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}

// =============================================================================
// MINI BREAKDOWN SUB-COMPONENT
// =============================================================================

function SeverityBreakdown({ stats }: { stats: AlertStats }) {
  const severities = useMemo(
    () => [
      {
        key: "extreme" as const,
        count: stats.extremeCount,
        config: ALERT_SEVERITY_CONFIG.extreme,
      },
      {
        key: "severe" as const,
        count: stats.severeCount,
        config: ALERT_SEVERITY_CONFIG.severe,
      },
      {
        key: "moderate" as const,
        count: stats.moderateCount,
        config: ALERT_SEVERITY_CONFIG.moderate,
      },
      {
        key: "minor" as const,
        count: stats.minorCount,
        config: ALERT_SEVERITY_CONFIG.minor,
      },
    ],
    [stats.extremeCount, stats.severeCount, stats.moderateCount, stats.minorCount]
  );

  const total = severities.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {severities.map(
        (s) =>
          s.count > 0 && (
            <div
              key={s.key}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: `${s.config.color}15` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: s.config.color }}
              />
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: s.config.color }}
              >
                {s.count}
              </span>
            </div>
          )
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function AlertStatsBarComponent({ stats, className }: AlertStatsBarProps) {
  // Top disaster type info
  const topTypeInfo = useMemo(() => {
    const config = DISASTER_CONFIG[stats.topDisasterType];
    return {
      icon: config?.icon || "🌊",
      label: config?.label || stats.topDisasterType,
    };
  }, [stats.topDisasterType]);

  // SOS status summary
  const sosUrgencyColor = useMemo(() => {
    if (stats.pendingSOS >= 10) return "#DC2626";
    if (stats.pendingSOS >= 5) return "#F97316";
    if (stats.pendingSOS > 0) return "#F59E0B";
    return "#22C55E";
  }, [stats.pendingSOS]);

  // Checklist readiness
  const checklistInfo = useMemo(() => {
    const pct = stats.checklistCompletionAvg;
    if (pct >= 80) return { color: "#22C55E", label: "Tốt" };
    if (pct >= 50) return { color: "#F59E0B", label: "Trung bình" };
    if (pct > 0) return { color: "#EF4444", label: "Thấp" };
    return { color: "#6B7280", label: "Chưa có" };
  }, [stats.checklistCompletionAvg]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx("space-y-3", className)}
    >
      {/* Main stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Total Active Alerts */}
        <StatCard
          icon={<ShieldAlert className="w-5 h-5" />}
          label="Cảnh báo hoạt động"
          value={stats.totalActive}
          color="#3B82F6"
          glowColor="#3B82F6"
          trend={stats.recentTrend}
          delay={0}
        />

        {/* 2. Extreme Alerts */}
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Cực kỳ nghiêm trọng"
          value={stats.extremeCount}
          color="#DC2626"
          glowColor="#DC2626"
          isUrgent
          delay={100}
        />

        {/* 3. Pending SOS */}
        <StatCard
          icon={<Siren className="w-5 h-5" />}
          label="SOS chờ xử lý"
          value={stats.pendingSOS}
          color={sosUrgencyColor}
          glowColor={sosUrgencyColor}
          isUrgent
          delay={200}
        />

        {/* 4. Resolved Today */}
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="SOS đã giải quyết"
          value={stats.resolvedTodaySOS}
          suffix="hôm nay"
          color="#22C55E"
          glowColor="#22C55E"
          delay={300}
        />

        {/* 5. Checklist Completion */}
        <StatCard
          icon={<ListChecks className="w-5 h-5" />}
          label="Checklist hoàn thành"
          value={stats.checklistCompletionAvg}
          suffix="%"
          color={checklistInfo.color}
          glowColor={checklistInfo.color}
          delay={400}
        />
      </div>

      {/* Secondary info bar */}
      <motion.div
        variants={cardVariants}
        className={clsx(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl",
          "bg-white backdrop-blur-sm",
          "border border-slate-200"
        )}
      >
        {/* Left: Severity breakdown */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            Phân bổ:
          </span>
          <SeverityBreakdown stats={stats} />
        </div>

        {/* Center: Top info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Loại phổ biến:</span>
            <span className="text-xs font-medium text-slate-700">
              {topTypeInfo.icon} {topTypeInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Tỉnh nhiều nhất:</span>
            <span className="text-xs font-medium text-slate-700">
              📍 {stats.topProvince}
            </span>
          </div>
        </div>

        {/* Right: Meta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">
              TB phản hồi: {Math.round(stats.averageResponseTime)} phút
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">
              {stats.onlineUserCount.toLocaleString()} online
            </span>
          </div>

          <TrendBadge trend={stats.recentTrend} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export const AlertStatsBar = memo(AlertStatsBarComponent);
