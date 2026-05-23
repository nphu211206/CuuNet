"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

interface ModuleCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  borderColor: string;
  glow: string;
  stat?: { value: string; label: string };
  featured?: boolean;
  index: number;
}

export default function ModuleCard({
  href,
  icon,
  title,
  description,
  borderColor,
  glow,
  stat,
  featured = false,
  index,
}: ModuleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fadeUp = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.08,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      variants={fadeUp}
      className={featured ? "md:col-span-2 md:row-span-2" : ""}
    >
      <Link
        href={href}
        className="group relative block rounded-2xl border overflow-hidden transition-all duration-400 h-full"
        style={{
          background: isHovered
            ? `linear-gradient(135deg, ${borderColor}08 0%, rgba(15,17,28,0.8) 50%, ${borderColor}05 100%)`
            : "rgba(15,17,28,0.6)",
          borderColor: isHovered ? `${borderColor}50` : "rgba(51,65,85,0.3)",
          boxShadow: isHovered
            ? `0 16px 48px ${glow}, 0 0 0 1px ${borderColor}20, inset 0 1px 0 ${borderColor}10`
            : "0 4px 12px rgba(0,0,0,0.2)",
          transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setExpanded(false);
        }}
      >
        {/* Top accent bar with gradient animation */}
        <div className="relative h-1.5 w-full overflow-hidden">
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: `linear-gradient(to right, ${borderColor}, ${borderColor}30)`,
              opacity: isHovered ? 1 : 0.5,
            }}
          />
          {/* Shimmer on hover */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${borderColor}80 50%, transparent 100%)`,
            }}
            animate={isHovered ? { x: ["-100%", "100%"] } : { x: "-100%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>

        <div className={`p-6 ${featured ? "md:p-8" : ""}`}>
          {/* Icon + Badge row */}
          <div className="flex items-start justify-between mb-5">
            <div className="relative">
              {/* Icon glow background */}
              <motion.div
                className="absolute -inset-2 rounded-2xl opacity-0 blur-lg"
                style={{ backgroundColor: borderColor }}
                animate={isHovered ? { opacity: 0.15 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
              {/* Icon container */}
              <div
                className="relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-400"
                style={{
                  backgroundColor: `${borderColor}12`,
                  color: borderColor,
                  transform: isHovered ? "scale(1.1) rotate(3deg)" : "scale(1) rotate(0deg)",
                }}
              >
                {icon}
              </div>
            </div>

            {/* Stat badge */}
            {stat && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300"
                style={{
                  backgroundColor: `${borderColor}12`,
                  color: borderColor,
                  border: `1px solid ${borderColor}20`,
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span className="text-sm font-black">{stat.value}</span>
                <span className="opacity-70">{stat.label}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className={`${featured ? "text-xl md:text-2xl" : "text-base"} font-bold mb-3 transition-colors duration-300`}
            style={{ color: isHovered ? "#ffffff" : "#e2e8f0" }}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className={`${featured ? "text-sm" : "text-[12px]"} text-slate-500 leading-relaxed mb-5 ${!featured && !expanded ? "line-clamp-2" : ""}`}
          >
            {description}
          </p>

          {/* Expand button for non-featured */}
          {!featured && description.length > 80 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-1 text-[10px] font-bold mb-4 transition-colors"
              style={{ color: `${borderColor}80` }}
            >
              {expanded ? "Thu gọn" : "Xem thêm"}
              <ChevronDown
                className="w-3 h-3 transition-transform"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
          )}

          {/* Bottom section */}
          <div className="flex items-center justify-between mt-auto">
            {/* Progress bar (fake health indicator) */}
            <div className="flex-1 mr-4">
              <div className="h-1 rounded-full bg-slate-800/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: `${borderColor}60` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${75 + (index * 3) % 20}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-[9px] text-slate-600 mt-1 block">Hoạt động</span>
            </div>

            {/* Arrow */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: isHovered ? `${borderColor}15` : "rgba(30,41,59,0.5)",
                color: isHovered ? borderColor : "#475569",
                transform: isHovered ? "translateX(2px)" : "translateX(0)",
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Corner decoration */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${borderColor}10 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      </Link>
    </motion.div>
  );
}
