"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Map, Brain, Siren, HandHeart, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

const FLOW_STEPS = [
  {
    icon: <Map className="w-8 h-8" />,
    label: "Giám sát",
    desc: "Theo dõi real-time 63 tỉnh thành với heatmap, cảnh báo sớm và dữ liệu thời tiết",
    stat: "63 tỉnh",
    color: "#3B82F6",
    href: "/map",
    detail: "Bản đồ tương tác với lớp heatmap, marker thiên tai và timeline sự kiện",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    label: "Dự đoán",
    desc: "AI phân tích rủi ro theo khu vực, mùa vụ và dữ liệu lịch sử",
    stat: "6 loại",
    color: "#8B5CF6",
    href: "/predict",
    detail: "Mô hình ML đánh giá rủi ro lũ lụt, bão, sạt lở, hạn hán, động đất, sóng thần",
  },
  {
    icon: <Siren className="w-8 h-8" />,
    label: "Cảnh báo",
    desc: "Hệ thống cảnh báo khẩn cấp CAP-inspired và nút SOS cứu nạn 1 chạm",
    stat: "4 mức",
    color: "#EF4444",
    href: "/alerts",
    detail: "Cảnh báo theo mức: Theo dõi → Cảnh báo → Nguy hiểm → Khẩn cấp",
  },
  {
    icon: <HandHeart className="w-8 h-8" />,
    label: "Cứu hộ",
    desc: "Điều phối cứu hộ theo chuẩn ICS, quản lý tài nguyên và tình nguyện viên",
    stat: "ICS",
    color: "#F59E0B",
    href: "/rescue",
    detail: "3W Dashboard, triage SOS, phân công nhiệm vụ, theo dõi tiến độ",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    label: "Phân tích",
    desc: "Trực quan hóa dữ liệu thiên tai với 8 loại biểu đồ tương tác",
    stat: "8 biểu đồ",
    color: "#06B6D4",
    href: "/dashboard",
    detail: "Area, Bar, Pie, Scatter, Heatmap, Treemap, Gauge, Choropleth",
  },
];

export default function FlowTimeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lineProgress, setLineProgress] = useState(0);

  // Animate line progress on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLineProgress(1);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:block">
        {/* Connection line SVG */}
        <svg className="absolute top-[60px] left-0 w-full h-2 z-0" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
              <stop offset="25%" stopColor="#8B5CF6" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#EF4444" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#F59E0B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="25%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="75%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background line */}
          <line x1="10%" y1="8" x2="90%" y2="8" stroke="rgba(51,65,85,0.3)" strokeWidth="2" strokeDasharray="8 4" />
          {/* Animated gradient line */}
          <motion.line
            x1="10%" y1="8" x2="90%" y2="8"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: lineProgress }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {/* Moving dash overlay */}
          <line x1="10%" y1="8" x2="90%" y2="8" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="4 12" opacity="0.5">
            <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="2s" repeatCount="indefinite" />
          </line>
        </svg>

        {/* Steps row */}
        <div className="grid grid-cols-5 gap-4 relative z-10">
          {FLOW_STEPS.map((step, i) => {
            const isActive = activeStep === i;
            const isHovered = hoveredStep === i;

            return (
              <motion.div
                key={step.label}
                ref={(el) => { stepRefs.current[i] = el; }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center"
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => setActiveStep(isActive ? null : i)}
              >
                {/* Step number + icon circle */}
                <Link href={step.href} className="group flex flex-col items-center text-center mb-4">
                  <div className="relative mb-3">
                    {/* Pulse ring on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: `${step.color}20` }}
                      animate={isHovered ? { scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    {/* Icon container */}
                    <div
                      className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                      style={{
                        backgroundColor: `${step.color}12`,
                        border: `2px solid ${step.color}30`,
                        boxShadow: isHovered ? `0 0 30px ${step.color}25, 0 8px 24px rgba(0,0,0,0.3)` : "0 4px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      <span style={{ color: step.color }}>{step.icon}</span>
                    </div>
                    {/* Step number badge */}
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ backgroundColor: step.color }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors mb-1">
                    {step.label}
                  </span>
                  <span className="text-[11px] text-slate-500 max-w-[160px] leading-relaxed">
                    {step.desc}
                  </span>
                  <span
                    className="text-[10px] font-bold mt-2 px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${step.color}12`, color: step.color }}
                  >
                    {step.stat}
                  </span>
                </Link>

                {/* Expanded detail card */}
                <motion.div
                  initial={false}
                  animate={{
                    height: isActive ? "auto" : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden w-full"
                >
                  <div
                    className="p-4 rounded-xl backdrop-blur-xl border mt-2"
                    style={{ backgroundColor: `${step.color}08`, borderColor: `${step.color}20` }}
                  >
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.detail}</p>
                    <Link
                      href={step.href}
                      className="flex items-center gap-1.5 mt-3 text-[11px] font-bold transition-colors"
                      style={{ color: step.color }}
                    >
                      Khám phá <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical timeline */}
      <div className="md:hidden space-y-0">
        {FLOW_STEPS.map((step, i) => {
          const isActive = activeStep === i;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative flex gap-4"
              onClick={() => setActiveStep(isActive ? null : i)}
            >
              {/* Vertical line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10"
                  style={{
                    backgroundColor: `${step.color}15`,
                    border: `2px solid ${step.color}30`,
                  }}
                >
                  <span style={{ color: step.color }} className="scale-75">{step.icon}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[40px]" style={{ background: `linear-gradient(to bottom, ${step.color}40, ${FLOW_STEPS[i + 1].color}40)` }} />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-200">{step.label}</span>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${step.color}15`, color: step.color }}
                  >
                    {step.stat}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed mb-2">{step.desc}</p>

                <motion.div
                  initial={false}
                  animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-3 rounded-lg backdrop-blur-xl border mt-2"
                    style={{ backgroundColor: `${step.color}08`, borderColor: `${step.color}20` }}
                  >
                    <p className="text-[11px] text-slate-400">{step.detail}</p>
                    <Link href={step.href} className="flex items-center gap-1 mt-2 text-[11px] font-bold" style={{ color: step.color }}>
                      Khám phá <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
