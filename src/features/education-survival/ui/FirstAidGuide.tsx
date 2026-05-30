"use client";

// =============================================================================
// FIRST AID GUIDE - Step-by-Step First Aid Instructions
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - Topic selector (CPR, bleeding, burns, fractures, drowning)
//   - Step-by-step instructions with icons
//   - Warning boxes
//   - Do Not boxes
//   - Tips for each step
//   - Animated step transitions
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Phone,
  Heart,
  Info,
} from "lucide-react";
import clsx from "clsx";
import type { FirstAidGuide as FirstAidGuideType, FirstAidGuideProps } from "../lib/types";
import { FIRST_AID_TOPIC_CONFIG, EMERGENCY_NUMBERS } from "../config/education-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const stepVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

// =============================================================================
// STEP CARD
// =============================================================================

function StepCard({ step, index, isLast }: { step: FirstAidGuideType["steps"][0]; index: number; isLast: boolean }) {
  return (
    <motion.div
      custom={index}
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-3"
    >
      {/* Step number + connector line */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
          {step.stepNumber}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-700/30 mt-1" />}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-4">
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{step.icon}</span>
            <h4 className="text-xs font-semibold text-slate-800">{step.titleVi}</h4>
            {step.duration && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 ml-auto">
                {step.duration}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{step.descriptionVi}</p>

          {/* Tips */}
          {step.tipsVi && step.tipsVi.length > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
              <ul className="space-y-0.5">
                {step.tipsVi.map((tip, i) => (
                  <li key={i} className="text-[10px] text-blue-300/70 flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// GUIDE DETAIL VIEW
// =============================================================================

function GuideDetail({
  guide,
  onBack,
}: {
  guide: FirstAidGuideType;
  onBack: () => void;
}) {
  const topicConfig = FIRST_AID_TOPIC_CONFIG[guide.topic];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-medium hover:border-slate-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại danh sách
      </button>

      {/* Header */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${guide.color}20` }}
          >
            {guide.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{guide.titleVi}</h2>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: guide.urgency === "immediate" ? "#EF444420" : guide.urgency === "urgent" ? "#F59E0B20" : "#22C55E20",
                color: guide.urgency === "immediate" ? "#EF4444" : guide.urgency === "urgent" ? "#F59E0B" : "#22C55E",
              }}
            >
              {guide.urgency === "immediate" ? "Ngay lập tức" : guide.urgency === "urgent" ? "Khẩn cấp" : "Không khẩn cấp"}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency call */}
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-400" />
          <span className="text-xs font-medium text-red-400">
            Gọi 115 (Cấp cứu) ngay nếu tình trạng nghiêm trọng!
          </span>
        </div>
      </div>

      {/* Steps */}
      <div>
        <h3 className="text-xs font-semibold text-slate-700 mb-3">Các bước thực hiện</h3>
        {guide.steps.map((step, i) => (
          <StepCard
            key={step.stepNumber}
            step={step}
            index={i}
            isLast={i === guide.steps.length - 1}
          />
        ))}
      </div>

      {/* Warnings */}
      {guide.warningsVi.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Lưu ý quan trọng</span>
          </div>
          <ul className="space-y-1">
            {guide.warningsVi.map((warning, i) => (
              <li key={i} className="text-[11px] text-amber-300/70 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Do Not */}
      {guide.doNotVi.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">KHÔNG nên làm</span>
          </div>
          <ul className="space-y-1">
            {guide.doNotVi.map((item, i) => (
              <li key={i} className="text-[11px] text-red-300/70 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// GUIDE LIST VIEW
// =============================================================================

function GuideList({
  guides,
  onSelect,
}: {
  guides: FirstAidGuideType[];
  onSelect: (guide: FirstAidGuideType) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Chọn chủ đề sơ cứu</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {guides.map((guide) => {
          const topicConfig = FIRST_AID_TOPIC_CONFIG[guide.topic];
          return (
            <motion.button
              key={guide.id}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(guide)}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${guide.color}20` }}
                >
                  {guide.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800">{guide.titleVi}</h4>
                  <p className="text-[10px] text-slate-500">{guide.steps.length} bước</p>
                </div>
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: guide.urgency === "immediate" ? "#EF444420" : "#F59E0B20",
                    color: guide.urgency === "immediate" ? "#EF4444" : "#F59E0B",
                  }}
                >
                  {guide.urgency === "immediate" ? "Ngay" : "Khẩn"}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Emergency numbers */}
      <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
        <h4 className="text-[10px] font-semibold text-red-400 mb-2">📞 Số khẩn cấp Việt Nam</h4>
        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_NUMBERS.map((num) => (
            <div key={num.number} className="flex items-center gap-2">
              <span className="text-sm">{num.icon}</span>
              <div>
                <span className="text-xs font-bold text-slate-800">{num.number}</span>
                <span className="text-[9px] text-slate-500 ml-1">{num.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function FirstAidGuideComponent({
  guide,
  guides,
  onTopicSelect,
  onBack,
  className,
}: FirstAidGuideProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {guide ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GuideDetail guide={guide} onBack={onBack} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <GuideList guides={guides} onSelect={onTopicSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FirstAidGuide = memo(FirstAidGuideComponent);
