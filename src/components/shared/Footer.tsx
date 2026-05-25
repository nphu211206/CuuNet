"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Brain, Users, AlertTriangle, Handshake, BarChart3, BookOpen,
  ChevronUp, Heart, Github, Mail, ExternalLink, Shield,
} from "lucide-react";

const FOOTER_MODULES = [
  { href: "/map", label: "Bản đồ Thiên tai", icon: Map },
  { href: "/predict", label: "AI Dự đoán", icon: Brain },
  { href: "/report", label: "Cộng đồng", icon: Users },
  { href: "/alerts", label: "Cảnh báo & SOS", icon: AlertTriangle },
  { href: "/rescue", label: "Cứu trợ", icon: Handshake },
  { href: "/dashboard", label: "Thống kê", icon: BarChart3 },
  { href: "/education", label: "Giáo dục", icon: BookOpen },
];

const DATA_SOURCES = [
  { name: "Open-Meteo API", url: "https://open-meteo.com" },
  { name: "OpenStreetMap", url: "https://www.openstreetmap.org" },
  { name: "EM-DAT", url: "https://www.emdat.be" },
  { name: "NASA EarthData", url: "https://earthdata.nasa.gov" },
  { name: "GDACS", url: "https://www.gdacs.org" },
  { name: "USGS Earthquake", url: "https://earthquake.usgs.gov" },
];

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="relative border-t border-slate-200 overflow-hidden bg-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] flex items-center justify-center shadow-sm">
                  <Shield className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading, inherit)' }}>
                  <span className="text-[#0F172A]">Cứu</span>
                  <span className="text-[#0066FF]">Net</span>
                </span>
              </Link>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Nền tảng AI quản lý thiên tai & phản ứng cộng đồng thông minh.
                Sử dụng công nghệ để cứu sống con người và bảo vệ cộng đồng.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Next.js 16", color: "#3B82F6" },
                  { label: "TensorFlow.js", color: "#FF6F00" },
                  { label: "Leaflet", color: "#199900" },
                ].map((t) => (
                  <span
                    key={t.label}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${t.color}10`,
                      color: t.color,
                      borderColor: `${t.color}25`,
                    }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Modules */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Modules
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <li key={mod.href}>
                      <Link
                        href={mod.href}
                        className="group flex items-center gap-2.5 text-sm text-slate-500 hover:text-[#0066FF] transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0066FF] transition-colors" />
                        {mod.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Data Sources */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#0066FF]" />
                Nguồn dữ liệu
              </h3>
              <ul className="space-y-2.5">
                {DATA_SOURCES.map((src) => (
                  <li key={src.name}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-sm text-slate-500 hover:text-[#0066FF] transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#0066FF] transition-colors" />
                      {src.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#FF6B6B]" />
                Về dự án
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed">
                  CứuNet là dự án Khóa luận Tốt nghiệp 2025, nhằm xây dựng nền tảng quản lý thiên tai thông minh cho Việt Nam.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/nphu211206/CuuNet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href="mailto:contact@cuunet.vn"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-lg font-black text-[#0066FF]">63</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tỉnh thành</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-[#00C9A7]">24/7</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Giám sát</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-[12px] text-slate-400 text-center sm:text-left">
                © {new Date().getFullYear()} CứuNet — Khóa luận Tốt nghiệp 2025. Bảo vệ cộng đồng bằng công nghệ.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-400">100% Miễn phí</span>
                <span className="text-slate-200">•</span>
                <span className="text-[11px] text-slate-400">Mã nguồn mở</span>
                <span className="text-slate-200">•</span>
                <span className="text-[11px] text-slate-400">Made with <Heart className="w-3 h-3 inline text-[#FF6B6B]" /> in Vietnam</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}