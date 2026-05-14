"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Map, Brain, Users, Siren, HandHeart, BarChart3, BookOpen,
  ArrowRight, AlertTriangle, MapPin, Clock, ChevronRight, Activity, Zap, Shield, Radio,
} from "lucide-react";
import { recentDisasters, sosAlerts } from "@/data/disaster-data";
import type { DisasterType, SeverityLevel } from "@/lib/types";

// ─── MODULE CONFIG ────────────────────────────────────────────────────────────
const MODULES = [
  { href: "/map", icon: <Map className="w-6 h-6" />, title: "Bản đồ Thiên tai", description: "Theo dõi real-time 63 tỉnh thành với heatmap và cảnh báo sớm tương tác", borderColor: "#3B82F6", glow: "rgba(59,130,246,0.25)", stat: { value: "63", label: "tỉnh theo dõi" } },
  { href: "/predict", icon: <Brain className="w-6 h-6" />, title: "AI Dự đoán", description: "Mô hình Machine Learning dự đoán rủi ro thiên tai theo khu vực và mùa vụ", borderColor: "#8B5CF6", glow: "rgba(139,92,246,0.25)", stat: { value: "6", label: "loại thiên tai" } },
  { href: "/report", icon: <Users className="w-6 h-6" />, title: "Báo cáo Cộng đồng", description: "Crowd-sourced báo cáo thiên tai từ người dân địa phương với xác minh", borderColor: "#22C55E", glow: "rgba(34,197,94,0.25)", stat: { value: "24/7", label: "giám sát" } },
  { href: "/alerts", icon: <Siren className="w-6 h-6" />, title: "Cảnh báo & SOS", description: "Hệ thống cảnh báo khẩn cấp CAP-inspired và nút SOS cứu nạn 1 chạm", borderColor: "#EF4444", glow: "rgba(239,68,68,0.25)", stat: { value: "4", label: "mức cảnh báo" } },
  { href: "/rescue", icon: <HandHeart className="w-6 h-6" />, title: "Phối hợp Cứu trợ", description: "Điều phối cứu hộ ICS, 3W Dashboard, triage SOS, quản lý tài nguyên", borderColor: "#F59E0B", glow: "rgba(245,158,11,0.25)", stat: { value: "ICS", label: "chuẩn quốc tế" } },
  { href: "/dashboard", icon: <BarChart3 className="w-6 h-6" />, title: "Dashboard Thống kê", description: "Trực quan hóa dữ liệu thiên tai với 8 loại biểu đồ tương tác", borderColor: "#06B6D4", glow: "rgba(6,182,212,0.25)", stat: { value: "8", label: "loại biểu đồ" } },
  { href: "/education", icon: <BookOpen className="w-6 h-6" />, title: "Giáo dục Sinh tồn", description: "Học kỹ năng sinh tồn, sơ cứu, xây dựng kế hoạch phòng chống thiên tai", borderColor: "#14B8A6", glow: "rgba(20,184,166,0.25)", stat: { value: "25+", label: "bài học" } },
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
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

// Ticker items
const TICKER_ITEMS = [
  "🌪️ Bão số 4 tiếp cận bờ biển Quảng Nam",
  "🌊 Lũ lụt nghiêm trọng tại Hà Giang — 12,000 hộ bị ảnh hưởng",
  "⚠️ Cảnh báo sạt lở đất khu vực Tây Nguyên",
  "🆘 3 SOS đang hoạt động — Điện Biên, Lai Châu, Hà Giang",
  "🌡️ Nắng nóng trên 40°C tại Nghệ An & Hà Tĩnh",
];

export default function Home() {
  const activeSOS = sosAlerts.filter((s) => s.status === "active").length;
  const activeDisasters = recentDisasters.filter((d) => d.status === "active" || d.status === "monitoring").length;
  const recentEvents = useMemo(
    () => [...recentDisasters].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 4),
    []
  );

  return (
    <div className="min-h-screen bg-[#06080f]">

      {/* ── LIVE TICKER ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-red-950/40 border-b border-red-900/40 py-2">
        <div className="flex items-center gap-0">
          <div className="shrink-0 flex items-center gap-2 px-4 bg-red-600 h-full py-0.5 mr-4">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">LIVE</span>
          </div>
          <div className="overflow-hidden flex-1">
            <motion.div
              className="flex gap-16 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="text-[11px] text-red-300 shrink-0">{item}</span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1920&q=80"
            alt="Vietnam flood aerial"
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-slate-950/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06080f] via-slate-950/60 to-transparent" />
          {/* Animated glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-3xl">

            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-[11px] font-semibold text-red-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Đang giám sát toàn quốc
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] mb-5">
              Cứu
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">Net</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-xl md:text-2xl text-slate-200 font-light mb-3">
              Nền tảng Quản lý Thiên tai Thông minh
            </motion.p>

            <motion.p variants={fadeUp} custom={3} className="text-sm text-slate-400 mb-10 max-w-xl leading-relaxed">
              AI & Machine Learning giám sát, dự đoán và ứng phó với thiên tai trên toàn lãnh thổ Việt Nam. Cứu sống con người bằng công nghệ.
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-3 mb-10">
              {[
                { value: activeSOS, label: "SOS Active", color: "#EF4444", icon: <Siren className="w-3.5 h-3.5" /> },
                { value: activeDisasters, label: "Đang theo dõi", color: "#F59E0B", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { value: recentDisasters.length, label: "Sự kiện", color: "#3B82F6", icon: <MapPin className="w-3.5 h-3.5" /> },
                { value: 7, label: "Modules", color: "#22C55E", icon: <Shield className="w-3.5 h-3.5" /> },
              ].map((stat) => (
                <div key={stat.label}
                  className="px-4 py-3 rounded-2xl backdrop-blur border"
                  style={{ backgroundColor: `${stat.color}10`, borderColor: `${stat.color}30` }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5" style={{ color: stat.color }}>
                    {stat.icon}
                    <span className="text-2xl font-black tabular-nums">{stat.value}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-3">
              <Link href="/map"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <Map className="w-4 h-4" /> Xem Bản đồ
              </Link>
              <Link href="/alerts"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-600/30 hover:border-red-400 transition-all hover:-translate-y-0.5"
              >
                <Siren className="w-4 h-4" /> SOS Khẩn cấp
              </Link>
              <Link href="/report"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm font-bold hover:border-slate-500 hover:text-white transition-all hover:-translate-y-0.5"
              >
                <Users className="w-4 h-4" /> Gửi Báo cáo
              </Link>
            </motion.div>
          </motion.div>

          {/* Floating activity card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:block"
          >
            <div className="w-64 rounded-2xl bg-slate-900/70 backdrop-blur border border-slate-700/50 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Hoạt động gần đây</span>
              </div>
              {recentDisasters.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span className="text-base">{DISASTER_ICONS[d.type]}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-200 truncate">{d.title}</p>
                    <p className="text-[10px] text-slate-500">{d.location.province}</p>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: SEVERITY_CONFIG[d.severity].color, backgroundColor: SEVERITY_CONFIG[d.severity].bg }}>
                    {SEVERITY_CONFIG[d.severity].label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS FLOW ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Quy trình</span>
            <h2 className="text-2xl font-black text-white mt-2 mb-3">CứuNet hoạt động thế nào?</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Từ giám sát đến cứu hộ — hệ thống hoàn chỉnh bảo vệ người dân Việt Nam trước thiên tai
            </p>
          </motion.div>

          {/* Flow Steps */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            {[
              { icon: <Map className="w-6 h-6" />, label: "Giám sát", desc: "Theo dõi real-time 63 tỉnh", stat: "63 tỉnh", color: "#3B82F6", href: "/map" },
              { icon: <Brain className="w-6 h-6" />, label: "Dự đoán", desc: "AI phân tích rủi ro", stat: "6 loại", color: "#8B5CF6", href: "/predict" },
              { icon: <Siren className="w-6 h-6" />, label: "Cảnh báo", desc: "Thông báo khẩn cấp", stat: "4 mức", color: "#EF4444", href: "/alerts" },
              { icon: <HandHeart className="w-6 h-6" />, label: "Cứu hộ", desc: "Điều phối cứu trợ", stat: "ICS", color: "#F59E0B", href: "/rescue" },
              { icon: <BarChart3 className="w-6 h-6" />, label: "Phân tích", desc: "Thống kê & báo cáo", stat: "8 biểu đồ", color: "#06B6D4", href: "/dashboard" },
            ].map((step, i) => (
              <motion.div key={step.label} variants={fadeUp} custom={i} className="flex items-center gap-3 md:gap-4">
                <Link href={step.href} className="group flex flex-col items-center text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                    style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
                  >
                    <span style={{ color: step.color }}>{step.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{step.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{step.desc}</span>
                  <span className="text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${step.color}15`, color: step.color }}>
                    {step.stat}
                  </span>
                </Link>
                {i < 4 && (
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="hidden md:block"
                  >
                    <ArrowRight className="w-5 h-5 text-slate-600" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Summary line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <p className="text-xs text-slate-600">
              Giám sát → Dự đoán → Cảnh báo → Cứu hộ → Phân tích = <span className="text-blue-400 font-semibold">Hệ thống hoàn chỉnh</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MODULES GRID ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Hệ thống tích hợp</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">7 Module Chức năng</h2>
            <p className="text-sm text-slate-500">Hệ thống quản lý thiên tai hoàn chỉnh từ giám sát đến giáo dục cộng đồng</p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {MODULES.map((mod, i) => (
              <motion.div key={mod.href} variants={fadeUp} custom={i}>
                <Link href={mod.href}
                  className="group block rounded-2xl border border-slate-700/30 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                  style={{ background: "rgba(15,17,28,0.6)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${mod.borderColor}50`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${mod.glow}, 0 0 0 1px ${mod.borderColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.3)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  {/* Top accent bar */}
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${mod.borderColor}, ${mod.borderColor}30)` }} />

                  <div className="p-5">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${mod.borderColor}15`, color: mod.borderColor }}>
                      {mod.icon}
                    </div>

                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{mod.description}</p>

                    <div className="flex items-center justify-between">
                      {mod.stat && (
                        <span className="text-[10px] text-slate-600">
                          <span className="font-bold text-slate-400">{mod.stat.value}</span>{" "}{mod.stat.label}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── RECENT EVENTS ────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-slate-700/30 bg-slate-900/30 backdrop-blur p-8">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest">Realtime</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Sự kiện gần đây</h2>
                <p className="text-sm text-slate-500">Các thiên tai đang được theo dõi</p>
              </div>
              <Link href="/map" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
              {recentEvents.map((event, i) => {
                const sev = SEVERITY_CONFIG[event.severity];
                return (
                  <motion.div key={event.id} variants={fadeUp} custom={i}>
                    <Link href="/map"
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-700/20 hover:border-slate-600/40 transition-all hover:bg-slate-800/30"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: sev.bg }}>
                        {DISASTER_ICONS[event.type]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ backgroundColor: sev.bg, color: sev.color }}>
                            {sev.label}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                            {event.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location.province}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.startDate).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.affectedPeople >= 1_000_000
                              ? `${(event.affectedPeople / 1_000_000).toFixed(1)}M`
                              : event.affectedPeople >= 1_000
                                ? `${(event.affectedPeople / 1_000).toFixed(0)}K`
                                : event.affectedPeople} người
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black">
              Cứu<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Net</span>
            </span>
            <span className="text-[10px] text-slate-600">v1.0</span>
          </div>
          <p className="text-[10px] text-slate-600 text-center">
            Khóa luận Tốt nghiệp 2025 • Nền tảng Quản lý Thiên tai Thông minh
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <span>Next.js</span><span>•</span><span>React 19</span><span>•</span><span>TypeScript</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
