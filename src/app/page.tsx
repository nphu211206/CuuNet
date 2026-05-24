"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Map, Brain, Users, Siren, HandHeart, BarChart3, BookOpen,
  ArrowRight, MapPin, Activity, Zap, Shield, Radio,
  ChevronDown,
} from "lucide-react";
import { recentDisasters } from "@/data/disaster-data";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import HeroVideo from "@/components/home/HeroVideo";
import AnimatedCounter from "@/components/home/AnimatedCounter";
import ScrollReveal from "@/components/home/ScrollReveal";
import ModuleCard from "@/components/home/ModuleCard";

// Dynamic imports for heavy below-fold components (Phase 8 — Performance)
const ParticleField = dynamic(() => import("@/components/home/ParticleField"), { ssr: false });
const FlowTimeline = dynamic(() => import("@/components/home/FlowTimeline"), { ssr: false });
const TechStack = dynamic(() => import("@/components/home/TechStack"), { ssr: false });
const LiveStats = dynamic(() => import("@/components/home/LiveStats"), { ssr: false });
const EventsTimeline = dynamic(() => import("@/components/home/EventsTimeline"), { ssr: false });
const ImpactShowcase = dynamic(() => import("@/components/home/ImpactShowcase"), { ssr: false });
const TrustedBy = dynamic(() => import("@/components/home/TrustedBy"), { ssr: false });
const CTASection = dynamic(() => import("@/components/home/CTASection"), { ssr: false });

// ─── MODULE CONFIG ────────────────────────────────────────────────────────────
const MODULES = [
  { href: "/map", icon: <Map className="w-7 h-7" />, title: "Bản đồ Thiên tai", description: "Theo dõi real-time 63 tỉnh thành với heatmap và cảnh báo sớm tương tác", borderColor: "#3B82F6", glow: "rgba(59,130,246,0.25)", stat: { value: "63", label: "tỉnh theo dõi" } },
  { href: "/predict", icon: <Brain className="w-7 h-7" />, title: "AI Dự đoán", description: "Mô hình Machine Learning dự đoán rủi ro thiên tai theo khu vực và mùa vụ", borderColor: "#8B5CF6", glow: "rgba(139,92,246,0.25)", stat: { value: "6", label: "loại thiên tai" } },
  { href: "/report", icon: <Users className="w-7 h-7" />, title: "Báo cáo Cộng đồng", description: "Crowd-sourced báo cáo thiên tai từ người dân địa phương với xác minh", borderColor: "#22C55E", glow: "rgba(34,197,94,0.25)", stat: { value: "24/7", label: "giám sát" } },
  { href: "/alerts", icon: <Siren className="w-7 h-7" />, title: "Cảnh báo & SOS", description: "Hệ thống cảnh báo khẩn cấp CAP-inspired và nút SOS cứu nạn 1 chạm", borderColor: "#EF4444", glow: "rgba(239,68,68,0.25)", stat: { value: "4", label: "mức cảnh báo" } },
  { href: "/rescue", icon: <HandHeart className="w-7 h-7" />, title: "Phối hợp Cứu trợ", description: "Điều phối cứu hộ ICS, 3W Dashboard, triage SOS, quản lý tài nguyên", borderColor: "#F59E0B", glow: "rgba(245,158,11,0.25)", stat: { value: "ICS", label: "chuẩn quốc tế" } },
  { href: "/dashboard", icon: <BarChart3 className="w-7 h-7" />, title: "Dashboard Thống kê", description: "Trực quan hóa dữ liệu thiên tai với 8 loại biểu đồ tương tác", borderColor: "#06B6D4", glow: "rgba(6,182,212,0.25)", stat: { value: "8", label: "loại biểu đồ" } },
  { href: "/education", icon: <BookOpen className="w-7 h-7" />, title: "Giáo dục Sinh tồn", description: "Học kỹ năng sinh tồn, sơ cứu, xây dựng kế hoạch phòng chống thiên tai", borderColor: "#14B8A6", glow: "rgba(20,184,166,0.25)", stat: { value: "25+", label: "bài học" } },
];

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bg: string }> = {
  critical: { label: "KHẨN CẤP", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  high:     { label: "NGUY HIỂM", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  medium:   { label: "CẢNH BÁO",  color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  low:      { label: "THEO DÕI",  color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
};

const DISASTER_ICONS: Record<DisasterType, string> = {
  flood: "🌊", storm: "🌪️", landslide: "⛰️", drought: "☀️", earthquake: "🏔️", tsunami: "🌊",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

// Ticker items
const TICKER_ITEMS = [
  "🌊 Ngập lụt miền Bắc — Hà Nội, Vĩnh Phúc, Phú Thọ bị ngập sâu",
  "⛰️ Sạt lở Sơn La — nhiều tuyến đường bị chia cắt, cô lập bản làng",
  "🌡️ Nắng nóng kỷ lục 42°C tại miền Bắc — ảnh hưởng 5 triệu người",
  "🌪️ Áp thấp nhiệt đới trên Biển Đông — cảnh báo mưa lớn miền Trung",
  "☀️ Hạn hán Tây Nguyên — hồ chứa xuống mức thấp kỷ lục",
];

// Hero stats config
const HERO_STATS = [
  { value: 63, label: "Tỉnh thành", color: "#3B82F6", icon: <MapPin className="w-4 h-4" />, suffix: "" },
  { value: 24, label: "Giám sát", color: "#22C55E", icon: <Shield className="w-4 h-4" />, suffix: "/7" },
  { value: 6, label: "Loại thiên tai", color: "#8B5CF6", icon: <Brain className="w-4 h-4" />, suffix: "" },
  { value: 7, label: "Modules", color: "#06B6D4", icon: <Zap className="w-4 h-4" />, suffix: "" },
];

export default function Home() {
  const recentEvents = useMemo(
    () => [...recentDisasters].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 4),
    []
  );

  // Typewriter effect
  const [typewriterText, setTypewriterText] = useState("");
  const fullText = "Nền tảng Quản lý Thiên tai Thông minh";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypewriterText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── LIVE TICKER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-red-950/40 border-b border-red-900/40 py-2.5">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-red-950/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-red-950/80 to-transparent z-10 pointer-events-none" />
        <div className="flex items-center gap-0">
          <div className="shrink-0 flex items-center gap-2 px-4 bg-red-600 h-full py-1 mr-4">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider" role="status" aria-live="polite">LIVE</span>
          </div>
          <div className="overflow-hidden flex-1">
            <motion.div
              className="flex gap-16 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            >
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="text-[11px] text-red-300 shrink-0">{item}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <HeroVideo
        posterSrc="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1920&q=80"
        videoSrc="https://cdn.coverr.co/videos/coverr-aerial-view-of-flooded-area-5765/1080p.mp4"
      >
        {/* Particle field overlay */}
        <ParticleField />

        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12 items-center">

            {/* Left content — 3 cols */}
            <div className="xl:col-span-3">
              <motion.div variants={stagger} initial="hidden" animate="visible">

                {/* Badge */}
                <motion.div variants={fadeUp} custom={0} className="mb-8">
                  <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-[11px] font-semibold text-red-400 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Đang giám sát toàn quốc
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1 variants={fadeUp} custom={1} className="text-7xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] mb-6 tracking-tighter" style={{ fontFamily: "var(--font-heading, inherit)" }}>
                  Cứu
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-text">Net</span>
                </motion.h1>

                {/* Typewriter subtitle */}
                <motion.div variants={fadeUp} custom={2} className="mb-4 h-10">
                  <p className="text-xl md:text-2xl text-slate-200 font-light">
                    {typewriterText}
                    <span className="typewriter-cursor ml-0.5">&nbsp;</span>
                  </p>
                </motion.div>

                <motion.p variants={fadeUp} custom={3} className="text-base text-slate-400 mb-10 max-w-xl leading-relaxed">
                  AI & Machine Learning giám sát, dự đoán và ứng phó với thiên tai trên toàn lãnh thổ Việt Nam. Cứu sống con người bằng công nghệ.
                </motion.p>

                {/* Animated Stats */}
                <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                  {HERO_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="px-4 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105"
                      style={{ backgroundColor: `${stat.color}08`, borderColor: `${stat.color}25` }}
                    >
                      <div className="flex items-center gap-2 mb-1" style={{ color: stat.color }}>
                        {stat.icon}
                        <AnimatedCounter
                          end={stat.value}
                          className="text-3xl font-black tabular-nums"
                        />
                        <span className="text-lg font-bold">{stat.suffix}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTAs */}
                <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-4">
                  <Link href="/map"
                    aria-label="Xem bản đồ thiên tai"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-black text-sm font-bold hover:bg-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-1"
                  >
                    <Map className="w-5 h-5" />
                    <span>Xem Bản đồ</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/alerts"
                    aria-label="Gửi tín hiệu SOS khẩn cấp"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-600/30 hover:border-red-400 transition-all duration-300 hover:-translate-y-1"
                  >
                    <Siren className="w-5 h-5" />
                    <span>SOS Khẩn cấp</span>
                  </Link>
                  <Link href="/report"
                    aria-label="Gửi báo cáo thiên tai cộng đồng"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm font-bold hover:border-slate-500 hover:text-white transition-all duration-300 hover:-translate-y-1"
                  >
                    <Users className="w-5 h-5" />
                    <span>Gửi Báo cáo</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Right — Floating activity card */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="xl:col-span-2 hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />

                <div className="relative rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Hoạt động gần đây</span>
                        <p className="text-[10px] text-slate-500">Cập nhật real-time</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-green-400">LIVE</span>
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

                  {/* Disaster list */}
                  {recentDisasters.slice(0, 3).map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.15 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: SEVERITY_CONFIG[d.severity].bg }}>
                        {DISASTER_ICONS[d.type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-200 truncate">{d.title}</p>
                        <p className="text-[10px] text-slate-500">{d.location.province}</p>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg"
                        style={{ color: SEVERITY_CONFIG[d.severity].color, backgroundColor: SEVERITY_CONFIG[d.severity].bg }}>
                        {SEVERITY_CONFIG[d.severity].label}
                      </span>
                    </motion.div>
                  ))}

                  {/* Quick action */}
                  <Link href="/map" className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-600/20 transition-colors">
                    <Map className="w-3.5 h-3.5" />
                    Xem bản đồ đầy đủ
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          role="button"
          aria-label="Cuộn xuống khám phá"
          tabIndex={0}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Khám phá</span>
          <ChevronDown className="w-5 h-5 text-slate-500 animate-scroll-bounce" />
        </motion.div>
      </HeroVideo>

      {/* ── HOW IT WORKS FLOW ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-slate-200 relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-600/5 rounded-full blur-[100px]" />

        <div className="max-w-6xl mx-auto relative">
          <ScrollReveal className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">
              Quy trình
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">CứuNet hoạt động thế nào?</h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Từ giám sát đến cứu hộ — hệ thống hoàn chỉnh bảo vệ người dân Việt Nam trước thiên tai
            </p>
          </ScrollReveal>

          {/* Interactive Flow Timeline */}
          <FlowTimeline />

          {/* Summary line */}
          <ScrollReveal delay={400} className="text-center mt-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100 border border-slate-200">
              <span className="text-sm text-slate-600">
                Giám sát → Dự đoán → Cảnh báo → Cứu hộ → Phân tích
              </span>
              <span className="text-blue-600 font-bold text-sm">= Hệ thống hoàn chỉnh</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── MODULES GRID (BENTO) ──────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="mb-16">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Hệ thống tích hợp</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">7 Module Chức năng</h2>
            <p className="text-base text-slate-600">Hệ thống quản lý thiên tai hoàn chỉnh từ giám sát đến giáo dục cộng đồng</p>
          </ScrollReveal>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-auto"
          >
            {MODULES.map((mod, i) => (
              <ModuleCard
                key={mod.href}
                href={mod.href}
                icon={mod.icon}
                title={mod.title}
                description={mod.description}
                borderColor={mod.borderColor}
                glow={mod.glow}
                stat={mod.stat}
                featured={i === 0}
                index={i}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TECH STACK ──────────────────────────────────────────────────────── */}
      <TechStack />

      {/* ── LIVE STATS ─────────────────────────────────────────────────────── */}
      <LiveStats />

      {/* ── IMPACT SHOWCASE (PHASE 5) ──────────────────────────────────────── */}
      <ImpactShowcase />

      {/* ── TRUSTED BY ─────────────────────────────────────────────────────── */}
      <TrustedBy />

      {/* ── EVENTS TIMELINE ────────────────────────────────────────────────── */}
      <EventsTimeline
        events={recentEvents}
        severityConfig={SEVERITY_CONFIG}
        disasterIcons={DISASTER_ICONS}
      />

      {/* ── CTA SECTION (PHASE 6) ──────────────────────────────────────────── */}
      <CTASection />

    </div>
  );
}
