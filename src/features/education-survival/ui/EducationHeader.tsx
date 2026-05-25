"use client";

// =============================================================================
// EDUCATION HEADER - Header with 6 View Tabs
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - 6 view tabs (Courses, Scenarios, Quiz, Practice, Community, Info)
//   - Active tab colored indicator
//   - XP + Level display
//   - Streak counter
//   - Responsive: horizontal scroll on mobile
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import clsx from "clsx";
import type { EducationTab, EducationHeaderProps } from "../lib/types";
import { EDUCATION_TAB_CONFIG, LEVEL_CONFIG, EDUCATION_ANIMATION } from "../config/education-config";
import { calculateLevel } from "../lib/progress-tracker";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EDUCATION_ANIMATION.ease,
    },
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function EducationHeaderComponent({
  activeTab,
  onTabChange,
  progress,
  className,
}: EducationHeaderProps) {
  const currentLevel = calculateLevel(progress.xp);
  const streak = progress.streak.current;

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm",
        className
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Title bar */}
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              📚 Giáo dục & Nhận thức
            </h1>
            <p className="text-[10px] text-slate-500">
              Module 7 - Học kỹ năng sinh tồn, cứu hộ, phòng chống thiên tai
            </p>
          </div>

          {/* XP + Streak */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] font-bold text-orange-400">{streak}</span>
              </div>
            )}

            {/* XP + Level */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-sm">{currentLevel.icon}</span>
              <div>
                <span className="text-[10px] font-bold" style={{ color: currentLevel.color }}>
                  Lv.{currentLevel.level}
                </span>
                <span className="text-[9px] text-slate-500 ml-1">
                  <Zap className="w-2.5 h-2.5 inline text-amber-400" /> {progress.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {EDUCATION_TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium",
                  "transition-all duration-200 border whitespace-nowrap",
                  isActive
                    ? "border-opacity-40 text-opacity-100"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${tab.color}15`,
                        borderColor: `${tab.color}40`,
                        color: tab.color,
                      }
                    : undefined
                }
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.labelVi}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}

export const EducationHeader = memo(EducationHeaderComponent);
