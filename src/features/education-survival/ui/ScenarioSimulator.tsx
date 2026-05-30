"use client";

// =============================================================================
// SCENARIO SIMULATOR - Interactive Branching Scenarios
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - Branching decision tree
//   - Multiple choice decisions
//   - Consequence feedback
//   - Score tracking (safety, resources, time, morale)
//   - Debrief with lessons learned
//   - Animated transitions between nodes
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Star,
  Shield,
  Clock,
  Users,
  Heart,
  Trophy,
  Package,
} from "lucide-react";
import clsx from "clsx";
import type { Scenario, ScenarioNode, ScenarioChoice, ScenarioResult, ScenarioSimulatorProps } from "../lib/types";
import { SCENARIO_TYPE_CONFIG, EDUCATION_ANIMATION } from "../config/education-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const nodeVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EDUCATION_ANIMATION.ease },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

const choiceVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.1, duration: 0.3 },
  }),
};

const metricsVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

// =============================================================================
// METRICS DISPLAY
// =============================================================================

function MetricsDisplay({
  metrics,
  className,
}: {
  metrics: { safety: number; resources: number; time: number; morale: number };
  className?: string;
}) {
  const items = [
    { label: "An toàn", value: metrics.safety, icon: <Shield className="w-3.5 h-3.5" />, color: metrics.safety >= 0 ? "#22C55E" : "#EF4444" },
    { label: "Tài nguyên", value: metrics.resources, icon: <Package className="w-3.5 h-3.5" />, color: metrics.resources >= 0 ? "#3B82F6" : "#F59E0B" },
    { label: "Thời gian", value: metrics.time, icon: <Clock className="w-3.5 h-3.5" />, color: metrics.time >= 0 ? "#22C55E" : "#F97316" },
    { label: "Tinh thần", value: metrics.morale, icon: <Heart className="w-3.5 h-3.5" />, color: metrics.morale >= 0 ? "#22C55E" : "#EF4444" },
  ];

  return (
    <motion.div
      variants={metricsVariants}
      initial="hidden"
      animate="visible"
      className={clsx("grid grid-cols-4 gap-2", className)}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <span style={{ color: item.color }}>{item.icon}</span>
            <span className="text-[9px] text-slate-500">{item.label}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: item.color }}>
            {item.value > 0 ? "+" : ""}{item.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

// =============================================================================
// CORRECTNESS BADGE
// =============================================================================

function CorrectnessBadge({ correctness }: { correctness: string }) {
  const config = {
    optimal: { label: "Tối ưu", labelVi: "Lựa chọn tốt nhất!", color: "#22C55E", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    acceptable: { label: "Chấp nhận", labelVi: "Khá tốt", color: "#3B82F6", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    suboptimal: { label: "Kém", labelVi: "Không lý tưởng", color: "#F59E0B", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    dangerous: { label: "Nguy hiểm", labelVi: "Rất nguy hiểm!", color: "#EF4444", icon: <XCircle className="w-3.5 h-3.5" /> },
  }[correctness] || { label: "?", labelVi: "?", color: "#6B7280", icon: null };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ backgroundColor: `${config.color}15`, color: config.color }}
    >
      {config.icon} {config.labelVi}
    </span>
  );
}

// =============================================================================
// DECISION NODE
// =============================================================================

function DecisionNode({
  node,
  onChoiceSelect,
}: {
  node: ScenarioNode;
  onChoiceSelect: (choiceId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-white border border-slate-200"
      >
        <p className="text-sm text-slate-800 leading-relaxed">{node.narrativeVi}</p>
      </motion.div>

      {/* Choices */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quyết định của bạn</p>
        {node.choices?.map((choice, i) => (
          <motion.button
            key={choice.id}
            custom={i}
            variants={choiceVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onChoiceSelect(choice.id)}
            className={clsx(
              "w-full p-3 rounded-xl border text-left transition-all duration-200",
              "bg-white border-slate-200 hover:border-slate-300",
              "hover:bg-slate-100"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                {String.fromCharCode(65 + i)}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-800">{choice.textVi}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Time limit indicator */}
      {node.timeLimit && node.timeLimit > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <Clock className="w-3 h-3" />
          <span>Bạn có {node.timeLimit} giây để quyết định</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// OUTCOME NODE
// =============================================================================

function OutcomeNode({
  node,
  choice,
  onContinue,
}: {
  node: ScenarioNode;
  choice?: ScenarioChoice;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Consequence narrative */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={clsx(
          "p-4 rounded-xl border",
          choice?.correctness === "dangerous"
            ? "bg-red-500/10 border-red-500/20"
            : choice?.correctness === "optimal"
              ? "bg-green-500/10 border-green-500/20"
              : "bg-white border-slate-200"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          {choice && <CorrectnessBadge correctness={choice.correctness} />}
        </div>
        <p className="text-sm text-slate-800 leading-relaxed">{node.narrativeVi}</p>
      </motion.div>

      {/* Learning note */}
      {choice?.learningNoteVi && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-[10px] font-medium text-blue-400 mb-1">💡 Bài học:</p>
          <p className="text-xs text-blue-300">{choice.learningNoteVi}</p>
        </div>
      )}

      {/* Metrics change */}
      {node.metrics && <MetricsDisplay metrics={{ safety: node.metrics.safety || 0, resources: node.metrics.resources || 0, time: node.metrics.time || 0, morale: node.metrics.morale || 0 }} />}

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 transition-colors"
      >
        Tiếp tục →
      </button>
    </div>
  );
}

// =============================================================================
// DEBRIEF NODE
// =============================================================================

function DebriefNode({
  node,
  result,
  onRestart,
  onBack,
}: {
  node: ScenarioNode;
  result: ScenarioResult | null;
  onRestart: () => void;
  onBack: () => void;
}) {
  const score = result?.score || 0;
  const scoreColor = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  const scoreLabel = score >= 80 ? "Xuất sắc!" : score >= 60 ? "Tốt!" : score >= 40 ? "Trung bình" : "Cần cải thiện";

  return (
    <div className="space-y-4">
      {/* Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="p-6 rounded-xl bg-white border border-slate-200 text-center"
      >
        <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: scoreColor }} />
        <h3 className="text-2xl font-black tabular-nums" style={{ color: scoreColor }}>
          {score}/100
        </h3>
        <p className="text-sm font-medium mt-1" style={{ color: scoreColor }}>{scoreLabel}</p>
        {result?.xpEarned && (
          <p className="text-[10px] text-slate-500 mt-1">+{result.xpEarned} XP</p>
        )}
      </motion.div>

      {/* Final metrics */}
      {result?.finalMetrics && <MetricsDisplay metrics={result.finalMetrics} />}

      {/* Debrief narrative */}
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <p className="text-xs text-green-300 leading-relaxed">{node.narrativeVi}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium hover:border-slate-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Thử lại
        </button>
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Chọn kịch bản khác
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ScenarioSimulatorComponent({
  scenario,
  activeNode,
  result,
  onChoiceSelect,
  onRestart,
  onBack,
  className,
}: ScenarioSimulatorProps) {
  const [selectedChoice, setSelectedChoice] = useState<ScenarioChoice | undefined>();
  const [showOutcome, setShowOutcome] = useState(false);
  const [accumulatedMetrics, setAccumulatedMetrics] = useState({
    safety: 0,
    resources: 0,
    time: 0,
    morale: 0,
  });

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!activeNode?.choices) return;
      const choice = activeNode.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      setSelectedChoice(choice);
      setShowOutcome(true);

      // Update accumulated metrics
      if (choice.metricChanges) {
        setAccumulatedMetrics((prev) => ({
          safety: prev.safety + (choice.metricChanges?.safety || 0),
          resources: prev.resources + (choice.metricChanges?.resources || 0),
          time: prev.time + (choice.metricChanges?.time || 0),
          morale: prev.morale + (choice.metricChanges?.morale || 0),
        }));
      }
    },
    [activeNode]
  );

  const handleContinue = useCallback(() => {
    if (selectedChoice) {
      onChoiceSelect(selectedChoice.id);
    }
    setShowOutcome(false);
    setSelectedChoice(undefined);
  }, [selectedChoice, onChoiceSelect]);

  const typeConfig = SCENARIO_TYPE_CONFIG[scenario.type];

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Scenario header */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${scenario.color}20` }}
          >
            {scenario.icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{scenario.titleVi}</h2>
            <p className="text-[10px] text-slate-500">
              {typeConfig.icon} {typeConfig.labelVi} • {scenario.region} • ⚡ {scenario.xpReward} XP
            </p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">{scenario.descriptionVi}</p>

        {/* Accumulated metrics */}
        <div className="mt-3">
          <MetricsDisplay metrics={accumulatedMetrics} />
        </div>
      </div>

      {/* Current node */}
      <AnimatePresence mode="wait">
        {activeNode && (
          <motion.div
            key={activeNode.id}
            variants={nodeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {activeNode.type === "decision" && !showOutcome && (
              <DecisionNode node={activeNode} onChoiceSelect={handleChoiceSelect} />
            )}

            {(activeNode.type === "outcome" || showOutcome) && (
              <OutcomeNode
                node={activeNode}
                choice={selectedChoice}
                onContinue={handleContinue}
              />
            )}

            {activeNode.type === "debrief" && (
              <DebriefNode
                node={activeNode}
                result={result}
                onRestart={onRestart}
                onBack={onBack}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ScenarioSimulator = memo(ScenarioSimulatorComponent);
