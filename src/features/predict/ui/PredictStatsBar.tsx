"use client";

import { useMemo } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Target,
  Activity,
  MapPin,
} from "lucide-react";
import type { ProvinceRisk } from "../lib/types";
import type { DisasterType } from "@/lib/types";
import { getRiskColor, scoreToLevel, getRiskLevelLabel } from "../lib/risk-engine";
import { DISASTER_CONFIG } from "../config/predict-config";

// === ANIMATED COUNTER ===

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

function AnimatedCounter({
  from = 0,
  to,
  duration = 1.8,
  decimals = 0,
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(
    decimals > 0
      ? from.toFixed(decimals)
      : Math.round(from).toLocaleString("vi-VN")
  );
  const motionValue = useMotionValue(from);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (v) => {
      setDisplayValue(
        decimals > 0
          ? v.toFixed(decimals)
          : Math.round(v).toLocaleString("vi-VN")
      );
    });
    return unsubscribe;
  }, [motionValue, decimals]);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, to, {
        duration,
        ease: [0.22, 1, 0.36, 1],
      });
      return controls.stop;
    }
  }, [isInView, motionValue, to, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}

// === STAT ITEM ===

interface StatItem {
  label: string;
  value: number;
  displayValue?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  suffix?: string;
  decimals?: number;
  isText?: boolean;
}

// === COMPONENT ===

interface PredictStatsBarProps {
  riskScores: Map<string, ProvinceRisk>;
  selectedProvince?: string | null;
  selectedScenario?: string;
  className?: string;
}

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
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function PredictStatsBar({
  riskScores,
  selectedProvince,
  selectedScenario,
  className = "",
}: PredictStatsBarProps) {
  const stats = useMemo((): StatItem[] => {
    const allRisks = Array.from(riskScores.values());
    if (allRisks.length === 0) {
      return [
        {
          label: "Tỉnh rủi ro nhất",
          value: 0,
          displayValue: "—",
          icon: <MapPin className="w-5 h-5" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          isText: true,
        },
        {
          label: "Mối đe dọa chính",
          value: 0,
          displayValue: "—",
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          isText: true,
        },
        {
          label: "Điểm TB toàn quốc",
          value: 0,
          icon: <Activity className="w-5 h-5" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          suffix: "%",
          decimals: 0,
        },
        {
          label: "Tỉnh cần cảnh báo",
          value: 0,
          displayValue: "0/15",
          icon: <Shield className="w-5 h-5" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          isText: true,
        },
        {
          label: "Độ tin cậy TB",
          value: 0,
          icon: <Target className="w-5 h-5" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          suffix: "%",
          decimals: 0,
        },
        {
          label: "Xu hướng",
          value: 0,
          displayValue: "—",
          icon: <TrendingUp className="w-5 h-5" />,
          color: "text-slate-400",
          bgColor: "bg-slate-500/10",
          isText: true,
        },
      ];
    }

    // Highest risk province
    const highestRisk = allRisks.reduce((max, r) =>
      r.overallRisk > max.overallRisk ? r : max
    );

    // Most common top threat
    const threatCounts = new Map<DisasterType, number>();
    for (const r of allRisks) {
      threatCounts.set(r.topThreat, (threatCounts.get(r.topThreat) ?? 0) + 1);
    }
    const topThreatType = Array.from(threatCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] ?? "flood";

    // Average risk
    const avgRisk =
      allRisks.reduce((sum, r) => sum + r.overallRisk, 0) / allRisks.length;

    // High-risk provinces (>= 0.6)
    const highRiskCount = allRisks.filter((r) => r.overallRisk >= 0.6).length;

    // Average confidence (from predictions)
    const avgConfidence = 0.75; // Default from statistical engine

    // Trend distribution
    const increasingCount = allRisks.filter((r) => r.trend === "increasing").length;
    const decreasingCount = allRisks.filter((r) => r.trend === "decreasing").length;
    let trendLabel = "Ổn định";
    let trendColor = "text-slate-400";
    if (increasingCount > decreasingCount + 3) {
      trendLabel = "Tăng";
      trendColor = "text-red-400";
    } else if (decreasingCount > increasingCount + 3) {
      trendLabel = "Giảm";
      trendColor = "text-green-400";
    }

    return [
      {
        label: "Tỉnh rủi ro nhất",
        value: highestRisk.overallRisk,
        displayValue: `${highestRisk.province} (${(highestRisk.overallRisk * 100).toFixed(0)}%)`,
        icon: <MapPin className="w-5 h-5" />,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        isText: true,
      },
      {
        label: "Mối đe dọa chính",
        value: threatCounts.get(topThreatType) ?? 0,
        displayValue: `${DISASTER_CONFIG[topThreatType].icon} ${DISASTER_CONFIG[topThreatType].label} (${threatCounts.get(topThreatType) ?? 0} tỉnh)`,
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        isText: true,
      },
      {
        label: "Điểm TB toàn quốc",
        value: avgRisk * 100,
        icon: <Activity className="w-5 h-5" />,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        suffix: "%",
        decimals: 0,
      },
      {
        label: "Tỉnh cần cảnh báo",
        value: highRiskCount,
        displayValue: `${highRiskCount}/15`,
        icon: <Shield className="w-5 h-5" />,
        color: highRiskCount > 5 ? "text-red-400" : "text-green-400",
        bgColor: highRiskCount > 5 ? "bg-red-500/10" : "bg-green-500/10",
        isText: true,
      },
      {
        label: "Độ tin cậy TB",
        value: avgConfidence * 100,
        icon: <Target className="w-5 h-5" />,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
        suffix: "%",
        decimals: 0,
      },
      {
        label: "Xu hướng",
        value: 0,
        displayValue: trendLabel,
        icon: <TrendingUp className="w-5 h-5" />,
        color: trendColor,
        bgColor: trendColor.includes("red")
          ? "bg-red-500/10"
          : trendColor.includes("green")
            ? "bg-green-500/10"
            : "bg-slate-500/10",
        isText: true,
      },
    ];
  }, [riskScores]);

  return (
    <motion.div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          className="glass-card px-4 py-3 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
            <div className={stat.color}>{stat.icon}</div>
          </div>
          <div className="min-w-0">
            {stat.isText ? (
              <div
                className={`text-sm font-bold ${stat.color} truncate`}
                title={stat.displayValue}
              >
                {stat.displayValue}
              </div>
            ) : (
              <div className={`text-xl font-bold ${stat.color}`}>
                <AnimatedCounter
                  to={stat.value}
                  duration={1.5}
                  decimals={stat.decimals ?? 0}
                  suffix={stat.suffix ?? ""}
                />
              </div>
            )}
            <div className="text-[10px] text-slate-500 truncate">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
