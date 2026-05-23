"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Globe, Brain, Users, TrendingUp, Heart, Zap, Radio } from "lucide-react";

interface StatItem {
  value: number;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  suffix: string;
}

const IMPACT_STATS: StatItem[] = [
  {
    value: 63,
    label: "Tỉnh thành",
    sublabel: "Giám sát toàn quốc",
    icon: <Globe className="w-7 h-7" />,
    color: "#3B82F6",
    suffix: "",
  },
  {
    value: 2500000,
    label: "Người được bảo vệ",
    sublabel: "Tính đến 2025",
    icon: <Users className="w-7 h-7" />,
    color: "#8B5CF6",
    suffix: "+",
  },
  {
    value: 99,
    label: "Độ chính xác",
    sublabel: "Cảnh báo sớm AI",
    icon: <Brain className="w-7 h-7" />,
    color: "#06B6D4",
    suffix: ".7%",
  },
  {
    value: 24,
    label: "Giám sát",
    sublabel: "Không ngừng nghỉ",
    icon: <Shield className="w-7 h-7" />,
    color: "#22C55E",
    suffix: "/7",
  },
];

const ACHIEVEMENTS = [
  { icon: <Zap className="w-3.5 h-3.5" />, text: "Hệ thống cảnh báo < 30 giây" },
  { icon: <Heart className="w-3.5 h-3.5" />, text: "Cứu sống hàng nghìn người mỗi năm" },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, text: "Dự đoán chính xác 6 loại thiên tai" },
  { icon: <Radio className="w-3.5 h-3.5" />, text: "Kết nối 63 tỉnh thành real-time" },
  { icon: <Shield className="w-3.5 h-3.5" />, text: "Chuẩn ICS quốc tế" },
  { icon: <Brain className="w-3.5 h-3.5" />, text: "AI & TensorFlow.js powered" },
  { icon: <Globe className="w-3.5 h-3.5" />, text: "Dữ liệu từ NASA, EM-DAT, GDACS" },
  { icon: <Users className="w-3.5 h-3.5" />, text: "Crowd-sourced báo cáo cộng đồng" },
];

function MegaCounter({ end, suffix, duration = 2500 }: { end: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Exponential ease out for dramatic effect
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(count)}{suffix}
    </span>
  );
}

export default function ImpactShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* ── Animated Gradient Mesh Background ── */}
      <div className="absolute inset-0">
        {/* Base dark */}
        <div className="absolute inset-0 bg-[#06080f]" />

        {/* Gradient orbs that follow mouse subtly */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full blur-[200px] opacity-20"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
          animate={{
            x: mousePos.x * 200 - 100,
            y: mousePos.y * 200 - 100,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
          initial={{ top: "-20%", left: "10%" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent 70%)" }}
          animate={{
            x: mousePos.x * -150 + 75,
            y: mousePos.y * -150 + 75,
          }}
          transition={{ type: "spring", stiffness: 25, damping: 18 }}
          initial={{ bottom: "-10%", right: "10%" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[150px] opacity-10"
          style={{ background: "radial-gradient(circle, #06B6D4, transparent 70%)" }}
          animate={{
            x: mousePos.x * 100 - 50,
            y: mousePos.y * 100 - 50,
          }}
          transition={{ type: "spring", stiffness: 20, damping: 15 }}
          initial={{ top: "40%", left: "50%" }}
        />

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.2] mix-blend-overlay"
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 512 512%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')",
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em]">
              Tác động thực tế
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
            Con số{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              nói lên tất cả
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CứuNet — nền tảng quản lý thiên tai thông minh, bảo vệ hàng triệu người dân Việt Nam mỗi ngày bằng công nghệ AI
          </p>
        </motion.div>

        {/* ── Mega Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {IMPACT_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.12,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative"
            >
              {/* Card glow on hover */}
              <div
                className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: `${stat.color}15` }}
              />

              <div
                className="relative p-7 md:p-8 rounded-2xl backdrop-blur-xl border text-center transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}08 0%, rgba(15,17,28,0.6) 50%, ${stat.color}05 100%)`,
                  borderColor: `${stat.color}20`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}08)`,
                    color: stat.color,
                    boxShadow: `0 0 30px ${stat.color}10`,
                  }}
                >
                  {stat.icon}
                </div>

                {/* Mega Number */}
                <div
                  className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 leading-none"
                  style={{
                    color: stat.color,
                    textShadow: `0 0 40px ${stat.color}30, 0 0 80px ${stat.color}15`,
                  }}
                >
                  <MegaCounter end={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <p className="text-sm font-bold text-slate-200 mb-1">{stat.label}</p>
                <p className="text-[11px] text-slate-500">{stat.sublabel}</p>

                {/* Bottom accent bar */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-500 group-hover:w-3/4"
                  style={{ background: `linear-gradient(to right, transparent, ${stat.color}, transparent)` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Achievement Ticker (Infinite Scroll) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative"
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#06080f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#06080f] to-transparent z-10 pointer-events-none" />

          {/* Scrolling achievements */}
          <div className="overflow-hidden py-4">
            <motion.div
              className="flex gap-6 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...ACHIEVEMENTS, ...ACHIEVEMENTS].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm shrink-0 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
                >
                  <span className="text-blue-400">{item.icon}</span>
                  <span className="text-[12px] text-slate-400 font-medium">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}