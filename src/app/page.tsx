"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import {
  Map, Brain, Users, Siren, HandHeart, BarChart3, BookOpen,
  ArrowRight, Shield, Zap, ChevronDown,
} from "lucide-react";
import type { ReactNode } from "react";

// ─── DYNAMIC IMPORTS ──────────────────────────────────────────────────────────
const ParticleField = dynamic(() => import("@/components/home/ParticleField"), { ssr: false });
const AnimatedCounter = dynamic(() => import("@/components/home/AnimatedCounter"), { ssr: false });

// ─── MODULE CONFIG ────────────────────────────────────────────────────────────
const MODULES = [
  { href: "/map", icon: <Map className="w-6 h-6" />, title: "Bản đồ Thiên tai", desc: "Giám sát real-time 63 tỉnh thành", color: "#3B82F6", stat: "63 tỉnh" },
  { href: "/predict", icon: <Brain className="w-6 h-6" />, title: "AI Dự đoán", desc: "Machine Learning dự đoán rủi ro", color: "#8B5CF6", stat: "75% chính xác" },
  { href: "/alerts", icon: <Siren className="w-6 h-6" />, title: "Cảnh báo & SOS", desc: "Cảnh báo CAP-inspired 1 chạm", color: "#EF4444", stat: "4 mức cảnh báo" },
  { href: "/rescue", icon: <HandHeart className="w-6 h-6" />, title: "Phối hợp Cứu trợ", desc: "Điều phối ICS quốc tế", color: "#F59E0B", stat: "ICS chuẩn" },
  { href: "/report", icon: <Users className="w-6 h-6" />, title: "Báo cáo Cộng đồng", desc: "Crowd-sourced từ người dân", color: "#22C55E", stat: "24/7 giám sát" },
  { href: "/dashboard", icon: <BarChart3 className="w-6 h-6" />, title: "Thống kê", desc: "25 năm dữ liệu thiên tai", color: "#06B6D4", stat: "8 biểu đồ" },
  { href: "/education", icon: <BookOpen className="w-6 h-6" />, title: "Giáo dục Sinh tồn", desc: "Microlearning + Gamification", color: "#14B8A6", stat: "25+ bài học" },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — MEGA HERO
          Linear.app style: massive typography, video background, 1 CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1920&q=80"
          >
            <source src="https://cdn.coverr.co/videos/coverr-aerial-view-of-flooded-area-5765/1080p.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/70 via-[#0a0f1e]/85 to-[#0a0f1e]" />
        </div>

        {/* Particle Field */}
        <ParticleField />

        {/* Gradient Mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[150px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/6 blur-[120px]" />
          <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-cyan-600/5 blur-[100px]" />
        </div>

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-[11px] font-semibold text-red-400 uppercase tracking-[0.2em]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Đang giám sát 63 tỉnh thành
            </span>
          </motion.div>

          {/* Title — Massive Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3.5rem,10vw,9rem)] font-black leading-[0.85] tracking-tighter mb-8"
            style={{ fontFamily: "var(--font-heading, inherit)" }}
          >
            <span className="text-white">Cứu</span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Net
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl md:text-2xl lg:text-3xl text-slate-300 font-light max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Nền tảng Quản lý Thiên tai Thông minh
            <br />
            <span className="text-slate-500 text-lg md:text-xl">Powered by AI & Machine Learning</span>
          </motion.p>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/map"
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-bold text-base hover:bg-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5"
            >
              <Map className="w-5 h-5" />
              Xem Bản đồ
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/alerts"
              className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl border border-slate-700 text-slate-300 font-medium text-base hover:border-slate-500 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              <Siren className="w-5 h-5 text-red-400" />
              SOS Khẩn cấp
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
            className="mt-20 flex items-center justify-center gap-8 md:gap-16"
          >
            {[
              { value: 63, label: "Tỉnh thành", suffix: "" },
              { value: 24, label: "Giám sát", suffix: "/7" },
              { value: 7, label: "Modules", suffix: "" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-1">
                  <AnimatedCounter end={stat.value} className="tabular-nums" />
                  <span className="text-blue-400">{stat.suffix}</span>
                </div>
                <span className="text-[11px] text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-10"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
        >
          <span className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">Khám phá</span>
          <ChevronDown className="w-5 h-5 text-slate-600 animate-scroll-bounce" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — MODULES (Bento Grid)
          Clean, minimal cards with hover glow
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealBlock>
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-[0.2em] mb-4 block">
              Hệ thống tích hợp
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight"
              style={{ fontFamily: "var(--font-heading, inherit)" }}
            >
              7 Module Chức năng
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
              Hệ thống quản lý thiên tai hoàn chỉnh — từ giám sát đến giáo dục cộng đồng.
            </p>
          </RevealBlock>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {/* Featured card — spans 2 cols */}
            <RevealBlock delay={0.1}>
              <ModuleCardFeatured module={MODULES[0]} />
            </RevealBlock>
            {/* Regular cards */}
            {MODULES.slice(1).map((mod, i) => (
              <RevealBlock key={mod.href} delay={0.15 + i * 0.05}>
                <ModuleCardSimple module={mod} />
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — IMPACT STATS
          3 massive numbers with gradient background
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e] via-blue-950/10 to-[#0a0f1e]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/5 rounded-full blur-[200px]" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <RevealBlock className="text-center mb-20">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-[0.2em] mb-4 block">
              Tác động
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight"
              style={{ fontFamily: "var(--font-heading, inherit)" }}
            >
              Bảo vệ người dân Việt Nam
            </h2>
          </RevealBlock>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: 63, suffix: "", label: "Tỉnh thành được giám sát", desc: "Bao phủ toàn bộ lãnh thổ Việt Nam" },
              { value: 25, suffix: "+", label: "Năm dữ liệu thiên tai", desc: "Từ 2000 đến 2025, cập nhật liên tục" },
              { value: 99, suffix: "%", label: "Thời gian hoạt động", desc: "Hệ thống giám sát 24/7 không ngừng nghỉ" },
            ].map((stat, i) => (
              <RevealBlock key={stat.label} delay={i * 0.1}>
                <div className="text-center p-8 rounded-3xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-500">
                  <div className="text-6xl md:text-7xl font-black mb-4" style={{ fontFamily: "var(--font-heading, inherit)" }}>
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      <AnimatedCounter end={stat.value} className="tabular-nums" />
                    </span>
                    <span className="text-blue-400/70">{stat.suffix}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{stat.label}</h3>
                  <p className="text-sm text-slate-500">{stat.desc}</p>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — CTA
          Clean gradient + 1 button
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e] via-blue-950/20 to-[#0a0f1e]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[200px]" />
        </div>

        <RevealBlock className="max-w-3xl mx-auto text-center relative">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tight"
            style={{ fontFamily: "var(--font-heading, inherit)" }}
          >
            Sẵn sàng bảo vệ{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              cộng đồng
            </span>
            ?
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Tham gia cùng hàng nghìn người đang sử dụng CứuNet để giám sát và ứng phó với thiên tai.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/map"
              className="group inline-flex items-center gap-3 px-12 py-6 rounded-2xl bg-white text-black font-bold text-lg hover:bg-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5"
            >
              Bắt đầu ngay
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/education"
              className="inline-flex items-center gap-3 px-10 py-6 rounded-2xl border border-slate-700 text-slate-300 font-medium text-lg hover:border-slate-500 hover:text-white transition-all duration-300"
            >
              Tìm hiểu thêm
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center gap-6 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Không cần đăng ký
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Miễn phí
            </span>
            <span className="flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5" />
              Mã nguồn mở
            </span>
          </div>
        </RevealBlock>
      </section>
    </div>
  );
}

// ─── REVEAL BLOCK (Scroll-triggered animation) ────────────────────────────────
function RevealBlock({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MODULE CARD — Featured (spans 2 cols) ────────────────────────────────────
function ModuleCardFeatured({ module }: { module: (typeof MODULES)[0] }) {
  return (
    <Link
      href={module.href}
      className="group relative block p-8 rounded-3xl bg-slate-900/40 border border-slate-800/50 md:col-span-2 overflow-hidden hover:border-slate-700/50 transition-all duration-500"
    >
      {/* Gradient accent */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${module.color}15 0%, transparent 60%)` }}
      />

      <div className="relative">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${module.color}15`, color: module.color }}
        >
          {module.icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
          {module.title}
        </h3>
        <p className="text-base text-slate-400 mb-6 max-w-md leading-relaxed">
          {module.desc}
        </p>
        <div className="flex items-center gap-4">
          <span
            className="text-sm font-bold px-4 py-2 rounded-full"
            style={{ backgroundColor: `${module.color}15`, color: module.color }}
          >
            {module.stat}
          </span>
          <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// ─── MODULE CARD — Simple ─────────────────────────────────────────────────────
function ModuleCardSimple({ module }: { module: (typeof MODULES)[0] }) {
  return (
    <Link
      href={module.href}
      className="group relative block p-6 rounded-2xl bg-slate-900/30 border border-slate-800/40 overflow-hidden hover:border-slate-700/50 transition-all duration-500 hover:-translate-y-1"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${module.color}10 0%, transparent 60%)` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${module.color}12`, color: module.color }}
          >
            {module.icon}
          </div>
          <span
            className="text-[10px] font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: `${module.color}10`, color: `${module.color}aa` }}
          >
            {module.stat}
          </span>
        </div>
        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors">
          {module.title}
        </h3>
        <p className="text-[13px] text-slate-500 leading-relaxed">{module.desc}</p>
        <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all mt-4" />
      </div>
    </Link>
  );
}