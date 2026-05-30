"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { AlertTriangle, Activity, MapPin, Shield, TrendingUp, Droplets } from "lucide-react";

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
  duration = 2,
  decimals = 0,
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(
    decimals > 0 ? from.toFixed(decimals) : Math.round(from).toLocaleString("vi-VN")
  );
  const motionValue = useMotionValue(from);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (v) => {
      setDisplayValue(
        decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("vi-VN")
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

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  suffix?: string;
  decimals?: number;
}

interface MapStatsBarProps {
  activeDisasters: number;
  monitoringDisasters: number;
  affectedProvinces: number;
  totalAffected: number;
  weatherAlerts?: number;
  sosCount?: number;
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

export default function MapStatsBar({
  activeDisasters,
  monitoringDisasters,
  affectedProvinces,
  totalAffected,
  weatherAlerts = 0,
  sosCount = 0,
}: MapStatsBarProps) {
  const stats: StatItem[] = [
    {
      label: "Đang hoạt động",
      value: activeDisasters,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Đang theo dõi",
      value: monitoringDisasters,
      icon: <Activity className="w-5 h-5" />,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Tỉnh thành",
      value: affectedProvinces,
      icon: <MapPin className="w-5 h-5" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Người ảnh hưởng",
      value: totalAffected >= 1000000
        ? totalAffected / 1000000
        : totalAffected >= 1000
          ? totalAffected / 1000
          : totalAffected,
      icon: <Shield className="w-5 h-5" />,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      suffix: totalAffected >= 1000000 ? "M" : totalAffected >= 1000 ? "K" : "",
      decimals: totalAffected >= 1000000 ? 1 : 0,
    },
    {
      label: "Cảnh báo thời tiết",
      value: weatherAlerts,
      icon: <Droplets className="w-5 h-5" />,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "SOS khẩn cấp",
      value: sosCount,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          className="glass-card px-4 py-3 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
            <div className={stat.color}>{stat.icon}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              <AnimatedCounter
                to={stat.value}
                duration={1.5}
                decimals={stat.decimals ?? 0}
                suffix={stat.suffix ?? ""}
              />
            </div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
