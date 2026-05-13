"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Map,
  Brain,
  Users,
  Siren,
  HandHeart,
  BarChart3,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Clock,
  ChevronRight,
  Activity,
} from "lucide-react";
import { recentDisasters, sosAlerts } from "@/data/disaster-data";
import type { DisasterType, SeverityLevel } from "@/lib/types";

// =============================================================================
// MODULE CONFIG (Lucide icons thay vì emoji)
// =============================================================================

const MODULES: Array<{
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  borderColor: string;
  stat?: { value: string; label: string };
}> = [
  {
    href: "/map",
    icon: <Map className="w-5 h-5" />,
    title: "Bản đồ Thiên tai",
    description: "Theo dõi real-time 63 tỉnh thành với heatmap, cảnh báo sớm và bản đồ tương tác",
    borderColor: "#3B82F6",
    stat: { value: "63", label: "tỉnh theo dõi" },
  },
  {
    href: "/predict",
    icon: <Brain className="w-5 h-5" />,
    title: "AI Dự đoán",
    description: "Mô hình Machine Learning dự đoán rủi ro thiên tai theo khu vực và mùa vụ",
    borderColor: "#8B5CF6",
    stat: { value: "6", label: "loại thiên tai" },
  },
  {
    href: "/report",
    icon: <Users className="w-5 h-5" />,
    title: "Báo cáo Cộng đồng",
    description: "Crowd-sourced báo cáo thiên tai từ người dân địa phương với xác minh",
    borderColor: "#22C55E",
    stat: { value: "10K+", label: "báo cáo" },
  },
  {
    href: "/alerts",
    icon: <Siren className="w-5 h-5" />,
    title: "Cảnh báo & SOS",
    description: "Hệ thống cảnh báo khẩn cấp CAP-inspired và nút SOS cứu nạn 1 chạm",
    borderColor: "#EF4444",
    stat: { value: "4", label: "mức cảnh báo" },
  },
  {
    href: "/rescue",
    icon: <HandHeart className="w-5 h-5" />,
    title: "Phối hợp Cứu trợ",
    description: "Điều phối cứu hộ ICS, 3W Dashboard, triage SOS, quản lý tài nguyên",
    borderColor: "#F59E0B",
    stat: { value: "ICS", label: "chuẩn quốc tế" },
  },
  {
    href: "/dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Dashboard Thống kê",
    description: "Trực quan hóa dữ liệu thiên tai 25 năm với 8 loại biểu đồ tương tác",
    borderColor: "#06B6D4",
    stat: { value: "25", label: "năm dữ liệu" },
  },
  {
    href: "/education",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Giáo dục Sinh tồn",
    description: "Học kỹ năng sinh tồn, sơ cứu, xây dựng kế hoạch phòng chống thiên tai",
    borderColor: "#14B8A6",
    stat: { value: "25+", label: "bài học" },
  },
];

// =============================================================================
// SEVERITY CONFIG
// =============================================================================

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string }> = {
  critical: { label: "KHẨN CẤP", color: "#EF4444" },
  high: { label: "NGUY HIỂM", color: "#F97316" },
  medium: { label: "CẢNH BÁO", color: "#F59E0B" },
  low: { label: "THEO DÕI", color: "#22C55E" },
};

const DISASTER_ICONS: Record<DisasterType, string> = {
  flood: "🌊",
  storm: "🌪️",
  landslide: "⛰️",
  drought: "☀️",
  earthquake: "🏔️",
  tsunami: "🌊",
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function Home() {
  const activeSOS = sosAlerts.filter((s) => s.status === "active").length;
  const activeDisasters = recentDisasters.filter((d) => d.status === "active" || d.status === "monitoring").length;
  const recentEvents = useMemo(
    () =>
      [...recentDisasters]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 4),
    []
  );

  return (
    <div className="min-h-screen">
      {/* ================================================================== */}
      {/* HERO SECTION                                                       */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1920&q=80"
            alt="Vietnam flood aerial view"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-slate-950/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            {/* Status badge */}
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur border border-slate-700/40 text-[11px] font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Đang giám sát toàn quốc
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4"
            >
              CứuNet
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-slate-300 mb-2"
            >
              Nền tảng Quản lý Thiên tai Thông minh cho Việt Nam
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={3}
              className="text-sm text-slate-400 mb-8 max-w-xl leading-relaxed"
            >
              Sử dụng AI & Machine Learning để dự đoán, giám sát và ứng phó với thiên tai
              trên toàn lãnh thổ Việt Nam. Cứu sống con người bằng công nghệ.
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex flex-wrap gap-3 mb-8"
            >
              {[
                { value: activeSOS, label: "SOS active", color: "#EF4444" },
                { value: activeDisasters, label: "Đang theo dõi", color: "#F59E0B" },
                { value: 63, label: "Tỉnh thành", color: "#3B82F6" },
                { value: 7, label: "Module", color: "#22C55E" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-2.5 rounded-xl bg-slate-900/60 backdrop-blur border border-slate-700/40"
                >
                  <span className="text-xl font-bold tabular-nums block" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-slate-500">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} custom={5} className="flex gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
              >
                <Map className="w-4 h-4" />
                Xem Bản đồ
              </Link>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/60 backdrop-blur border border-slate-700/40 text-slate-300 text-sm font-semibold hover:border-slate-600/60 hover:text-white transition-colors"
              >
                <Users className="w-4 h-4" />
                Gửi Báo cáo
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* MODULES GRID                                                        */}
      {/* ================================================================== */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold text-white mb-2">7 Module Chức năng</h2>
            <p className="text-sm text-slate-500">Hệ thống quản lý thiên ai hoàn chỉnh từ giám sát đến giáo dục</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {MODULES.map((module, i) => (
              <motion.div key={module.href} variants={fadeUp} custom={i}>
                <Link
                  href={module.href}
                  className="group block rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 overflow-hidden"
                >
                  {/* Top border */}
                  <div
                    className="h-1 w-full"
                    style={{ background: `linear-gradient(to right, ${module.borderColor}, ${module.borderColor}80)` }}
                  />

                  <div className="p-4">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${module.borderColor}15`, color: module.borderColor }}
                      >
                        {module.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {module.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      {module.description}
                    </p>

                    {/* Footer: stat + arrow */}
                    <div className="flex items-center justify-between">
                      {module.stat && (
                        <span className="text-[10px] text-slate-600">
                          <span className="font-bold text-slate-400">{module.stat.value}</span>{" "}
                          {module.stat.label}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* RECENT EVENTS                                                       */}
      {/* ================================================================== */}
      <section className="py-16 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Sự kiện gần đây</h2>
              <p className="text-sm text-slate-500">Các thiên tai đang được theo dõi</p>
            </div>
            <Link
              href="/map"
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-2"
          >
            {recentEvents.map((event, i) => {
              const severity = SEVERITY_CONFIG[event.severity];
              return (
                <motion.div
                  key={event.id}
                  variants={fadeUp}
                  custom={i}
                >
                  <Link
                    href="/map"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  >
                    {/* Severity badge */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${severity.color}15` }}
                    >
                      {DISASTER_ICONS[event.type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${severity.color}20`, color: severity.color }}
                        >
                          {severity.label}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-200 truncate">{event.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location.province}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.startDate).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(event.affectedPeople / 1000000).toFixed(1)}M người
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER                                                              */}
      {/* ================================================================== */}
      <footer className="py-8 px-6 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">CứuNet</span>
            <span className="text-[10px] text-slate-600">v1.0</span>
          </div>
          <p className="text-[10px] text-slate-600 text-center">
            Khóa luận Tốt nghiệp 2025 • Nền tảng Quản lý Thiên tai Thông minh
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <span>Next.js 16</span>
            <span>•</span>
            <span>React 19</span>
            <span>•</span>
            <span>TypeScript</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
