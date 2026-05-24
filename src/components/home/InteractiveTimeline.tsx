"use client";

import { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Clock, Users, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { recentDisasters } from "@/data/disaster-data";
import type { DisasterType, SeverityLevel } from "@/lib/types";

const SEVERITY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#dc2626", bg: "#fecaca", label: "KHẨN CẤP" },
  high: { color: "#f97316", bg: "#fed7aa", label: "NGUY HIỂM" },
  medium: { color: "#d97706", bg: "#fef08a", label: "CẢNH BÁO" },
  low: { color: "#16a34a", bg: "#bbf7d0", label: "THEO DÕI" },
};

const DISASTER_EMOJI: Record<string, string> = {
  flood: "🌊", storm: "🌪️", landslide: "⛰️", drought: "☀️", earthquake: "🏔️", tsunami: "🌊",
};

export default function InteractiveTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const events = useMemo(() => {
    return [...recentDisasters]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 12);
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.15em] mb-2 block">
              Timeline tương tác
            </span>
            <h2
              className="text-2xl md:text-3xl font-black text-slate-900"
              style={{ fontFamily: "var(--font-heading, inherit)" }}
            >
              Diễn biến Thiên tai
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-slate-200 z-0" />

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 relative z-10 snap-x snap-mandatory"
          >
            {events.map((event, i) => {
              const sev = SEVERITY_COLORS[event.severity];
              const isHovered = hoveredId === event.id;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex-shrink-0 snap-start"
                  onMouseEnter={() => setHoveredId(event.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Timeline dot */}
                  <div className="flex justify-center mb-4">
                    <motion.div
                      className="w-4 h-4 rounded-full border-2 bg-white z-10 relative"
                      style={{ borderColor: sev.color }}
                      animate={isHovered ? { scale: 1.5, backgroundColor: sev.color } : { scale: 1, backgroundColor: "#ffffff" }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>

                  {/* Card */}
                  <motion.div
                    className="w-[280px] p-5 rounded-2xl bg-white border border-slate-200 cursor-pointer transition-all duration-300"
                    animate={{
                      borderColor: isHovered ? `${sev.color}60` : "#e2e8f0",
                      boxShadow: isHovered
                        ? `0 8px 24px ${sev.color}15, 0 2px 8px rgba(0,0,0,0.06)`
                        : "0 1px 3px rgba(0,0,0,0.04)",
                      y: isHovered ? -4 : 0,
                    }}
                  >
                    {/* Emoji + Severity badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{DISASTER_EMOJI[event.type]}</span>
                      <span
                        className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: `${sev.color}15`, color: sev.color }}
                      >
                        {sev.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location.province}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.startDate).toLocaleDateString("vi-VN", { month: "short", year: "numeric" })}
                      </span>
                    </div>

                    {/* Affected */}
                    {event.affectedPeople > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Users className="w-3 h-3" />
                        <span>
                          {event.affectedPeople >= 1_000_000
                            ? `${(event.affectedPeople / 1_000_000).toFixed(1)}M`
                            : event.affectedPeople >= 1_000
                              ? `${(event.affectedPeople / 1_000).toFixed(0)}K`
                              : event.affectedPeople} người ảnh hưởng
                        </span>
                      </div>
                    )}

                    {/* Expanded detail on hover */}
                    <motion.div
                      initial={false}
                      animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                        {event.description}
                      </p>
                      <Link
                        href="/map"
                        className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        Xem trên bản đồ <ArrowRight className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Fade edges */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#f8fafc] to-transparent z-20 pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f8fafc] to-transparent z-20 pointer-events-none" />
          )}
        </div>
      </div>
    </section>
  );
}