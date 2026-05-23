"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, ChevronRight, ChevronDown, ArrowRight } from "lucide-react";
import type { DisasterEvent } from "@/lib/types";

interface EventsTimelineProps {
  events: DisasterEvent[];
  severityConfig: Record<string, { label: string; color: string; bg: string }>;
  disasterIcons: Record<string, string>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function EventsTimeline({ events, severityConfig, disasterIcons }: EventsTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest">Realtime</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-1">Sự kiện gần đây</h2>
            <p className="text-sm text-slate-500">Các thiên tai đang được theo dõi trên toàn quốc</p>
          </div>
          <Link
            href="/map"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-600/20 transition-colors"
          >
            Xem bản đồ <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-slate-700/50 via-slate-700/30 to-transparent" />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-4 md:space-y-0"
          >
            {events.map((event, i) => {
              const sev = severityConfig[event.severity];
              const isExpanded = expandedId === event.id;
              const isEven = i % 2 === 0;

              return (
                <motion.div
                  key={event.id}
                  variants={fadeUp}
                  custom={i}
                  className={`md:flex md:items-center md:gap-8 ${i > 0 ? "md:mt-6" : ""}`}
                >
                  {/* Left side (even items) or empty */}
                  <div className={`md:w-1/2 ${isEven ? "md:pr-8" : "md:order-2 md:pl-8"}`}>
                    {((isEven) || (!isEven)) && (
                      <div
                        className="group cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      >
                        <div
                          className="relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5"
                          style={{
                            backgroundColor: isExpanded ? `${sev.color}06` : "rgba(15,17,28,0.5)",
                            borderColor: isExpanded ? `${sev.color}30` : "rgba(51,65,85,0.2)",
                          }}
                        >
                          {/* Severity accent line */}
                          <div
                            className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300"
                            style={{
                              backgroundColor: sev.color,
                              opacity: isExpanded ? 1 : 0.4,
                            }}
                          />

                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                              style={{ backgroundColor: sev.bg }}
                            >
                              {disasterIcons[event.type]}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span
                                  className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                                  style={{ backgroundColor: sev.bg, color: sev.color }}
                                >
                                  {sev.label}
                                </span>
                                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                                  {event.title}
                                </h3>
                              </div>

                              <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{event.location.province}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(event.startDate).toLocaleDateString("vi-VN", { month: "short", year: "numeric" })}
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

                              {/* Expanded details */}
                              <motion.div
                                initial={false}
                                animate={{
                                  height: isExpanded ? "auto" : 0,
                                  opacity: isExpanded ? 1 : 0,
                                  marginTop: isExpanded ? 12 : 0,
                                }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3 border-t border-slate-700/30">
                                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div>
                                      <span className="text-slate-600">Loại thiên tai</span>
                                      <p className="text-slate-300 font-medium capitalize">{event.type}</p>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Trạng thái</span>
                                      <p className="text-slate-300 font-medium capitalize">{event.status}</p>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Khu vực</span>
                                      <p className="text-slate-300 font-medium">{event.location.province}</p>
                                    </div>
                                    <div>
                                      <span className="text-slate-600">Mức độ</span>
                                      <p className="font-medium" style={{ color: sev.color }}>{sev.label}</p>
                                    </div>
                                  </div>
                                  <Link
                                    href="/map"
                                    className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    Xem trên bản đồ <ChevronRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </motion.div>
                            </div>

                            {/* Expand indicator */}
                            <ChevronDown
                              className="w-4 h-4 text-slate-600 shrink-0 transition-transform duration-300 mt-1"
                              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center dot (desktop) */}
                  <div className="hidden md:flex items-center justify-center w-4 shrink-0">
                    <motion.div
                      className="w-3.5 h-3.5 rounded-full border-2 relative z-10"
                      style={{
                        borderColor: sev.color,
                        backgroundColor: isExpanded ? sev.color : "#06080f",
                      }}
                      whileHover={{ scale: 1.3 }}
                    />
                  </div>

                  {/* Right side (odd items) or empty */}
                  {!isEven && <div className="md:w-1/2 md:order-1" />}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Mobile "Xem tất cả" */}
        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-600/20 transition-colors"
          >
            Xem tất cả trên bản đồ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
