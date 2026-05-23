"use client";

import { motion } from "framer-motion";
import { Siren, AlertTriangle, Users, MapPin, Activity, Shield } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const LIVE_STATS = [
  {
    icon: <Siren className="w-5 h-5" />,
    value: 3,
    label: "SOS Active",
    sublabel: "Đang cứu hộ",
    color: "#EF4444",
    pulse: true,
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    value: 12,
    label: "Thiên tai",
    sublabel: "Đang theo dõi",
    color: "#F59E0B",
    pulse: true,
  },
  {
    icon: <Users className="w-5 h-5" />,
    value: 847,
    label: "Người ảnh hưởng",
    sublabel: "Nghìn người",
    color: "#8B5CF6",
    suffix: "K",
    pulse: false,
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    value: 28,
    label: "Tỉnh thành",
    sublabel: "Có cảnh báo",
    color: "#3B82F6",
    pulse: false,
  },
  {
    icon: <Activity className="w-5 h-5" />,
    value: 156,
    label: "Báo cáo",
    sublabel: "Hôm nay",
    color: "#22C55E",
    pulse: false,
  },
  {
    icon: <Shield className="w-5 h-5" />,
    value: 42,
    label: "Tình nguyện viên",
    sublabel: "Đang hoạt động",
    color: "#06B6D4",
    pulse: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function LiveStats() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Live Dashboard</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            Tình hình hiện tại
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Dữ liệu cập nhật real-time từ hệ thống giám sát toàn quốc
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {LIVE_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i}
              className="group relative"
            >
              <div
                className="p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:-translate-y-1 text-center"
                style={{
                  backgroundColor: `${stat.color}06`,
                  borderColor: `${stat.color}20`,
                }}
              >
                {/* Pulse indicator */}
                {stat.pulse && (
                  <div className="absolute top-3 right-3">
                    <span
                      className="flex h-2.5 w-2.5"
                    >
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ backgroundColor: stat.color }}
                      />
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}12`, color: stat.color }}
                >
                  {stat.icon}
                </div>

                {/* Number */}
                <div className="mb-1" style={{ color: stat.color }}>
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix || ""}
                    className="text-2xl font-black tabular-nums"
                  />
                </div>

                {/* Labels */}
                <p className="text-xs font-bold text-slate-300">{stat.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{stat.sublabel}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
