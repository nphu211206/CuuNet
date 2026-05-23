"use client";

import { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Map, BookOpen, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

// Seeded pseudo-random to avoid hydration mismatch
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function FloatingParticle({ delay, x, size, color, riseDistance, driftX }: { delay: number; x: number; size: number; color: string; riseDistance: number; driftX: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: "-10%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${size * 0.3}px)`,
      }}
      animate={{
        y: [0, -riseDistance],
        x: [0, driftX],
        opacity: [0, 0.8, 0.6, 0],
        scale: [0.5, 1, 0.8],
      }}
      transition={{
        duration: 6 + seededRandom(delay) * 4,
        delay: delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: seededRandom(i * 7 + 1) * 8,
    x: seededRandom(i * 13 + 3) * 100,
    size: 4 + seededRandom(i * 19 + 5) * 12,
    color: ["#3B82F6", "#8B5CF6", "#06B6D4", "#22C55E"][i % 4],
    riseDistance: 600 + seededRandom(i * 23 + 7) * 400,
    driftX: (seededRandom(i * 31 + 11) - 0.5) * 200,
  })), []);

  return (
    <section ref={ref} className="relative py-32 px-6 overflow-hidden">
      {/* ── Background Layers ── */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080f] via-[#0a0f1f] to-[#06080f]" />

        {/* Large gradient orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-600/8 rounded-full blur-[200px]" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[150px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#06080f_70%)]" />
      </div>

      {/* ── Floating Particles ── */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Icon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em]">
            Miễn phí 100%
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 leading-tight tracking-tight"
        >
          Sẵn sàng bảo vệ{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-text">
              cộng đồng
            </span>
            {/* Underline decoration */}
            <motion.div
              className="absolute -bottom-2 left-0 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          ?
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Tham gia cùng hàng nghìn người đang sử dụng CứuNet để giám sát và ứng phó với thiên tai.
          Không cần đăng ký, không giới hạn sử dụng.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-5 mb-16"
        >
          {/* Primary CTA */}
          <Link
            href="/map"
            className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-blue-600 text-white font-bold text-base transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Map className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Bắt đầu ngay</span>
            <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/education"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-slate-300 font-bold text-base backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:text-white hover:-translate-y-1"
          >
            <BookOpen className="w-5 h-5" />
            <span>Tìm hiểu thêm</span>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6 md:gap-10"
        >
          {[
            { icon: <Shield className="w-4 h-4" />, text: "Không cần đăng ký" },
            { icon: <Zap className="w-4 h-4" />, text: "Không quảng cáo" },
            { icon: <Sparkles className="w-4 h-4" />, text: "Mã nguồn mở" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-500">
              <span className="text-slate-600">{item.icon}</span>
              <span className="text-[12px] font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}