"use client";

// =============================================================================
// DISPATCH ADVISOR - AI-Powered Dispatch Recommendations
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// "Đề xuất triển khai" UI showing:
//   - Top 3 recommended units per SOS
//   - Match score gauge (0-100)
//   - ETA + Distance display
//   - Reason tags (nearest, best_capability, etc.)
//   - Capability badges
//   - Deploy button
//   - SOS selector
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  MapPin,
  Clock,
  Zap,
  Target,
  Truck,
  Users,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Star,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import type {
  DispatchRecommendation,
  DispatchReason,
  RescueSOSRequest,
  RescueResource,
  Incident,
  DispatchAdvisorProps,
} from "../lib/types";
import {
  DISPATCH_REASON_CONFIG,
  RESOURCE_TYPE_CONFIG,
  RESCUE_SOS_STATUS_CONFIG,
  TRIAGE_COLOR_CONFIG,
} from "../config/rescue-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4 },
  },
};

// =============================================================================
// MATCH SCORE GAUGE
// =============================================================================

function MatchScoreGauge({ score, rank }: { score: number; rank: number }) {
  const radius = 30;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : score >= 40 ? "#F97316" : "#EF4444";
  const rankEmoji = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={68} height={68} className="-rotate-90">
        <circle cx={34} cy={34} r={radius} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={5} />
        <motion.circle
          cx={34} cy={34} r={radius}
          fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs">{rankEmoji}</span>
        <span className="text-sm font-black tabular-nums" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// =============================================================================
// REASON TAGS
// =============================================================================

function ReasonTags({ reasons }: { reasons: DispatchReason[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {reasons.map((reason) => {
        const config = DISPATCH_REASON_CONFIG[reason];
        return (
          <span
            key={reason}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-medium"
            style={{
              backgroundColor: `${config.color}15`,
              color: config.color,
              border: `1px solid ${config.color}25`,
            }}
          >
            {config.icon} {config.labelVi}
          </span>
        );
      })}
    </div>
  );
}

// =============================================================================
// RECOMMENDATION CARD
// =============================================================================

function RecommendationCard({
  recommendation,
  rank,
  onDeploy,
}: {
  recommendation: DispatchRecommendation;
  rank: number;
  onDeploy: (unitId: string) => void;
}) {
  const typeConfig = RESOURCE_TYPE_CONFIG[recommendation.unitType];

  return (
    <motion.div
      variants={cardVariants}
      className={clsx(
        "p-3 rounded-xl border transition-all duration-200",
        rank === 0
          ? "bg-green-500/5 border-green-500/20"
          : "bg-white border-slate-200"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Score gauge */}
        <MatchScoreGauge score={recommendation.matchScore} rank={rank} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{typeConfig.icon}</span>
            <h4 className="text-xs font-semibold text-slate-800 truncate">{recommendation.unitName}</h4>
            {rank === 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                ĐỀ XUẤT
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-1.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {recommendation.distanceKm} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ETA {recommendation.etaMinutes} phút
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {recommendation.capabilities.length} năng lực
            </span>
          </div>

          {/* Reason tags */}
          <ReasonTags reasons={recommendation.reasons} />

          {/* Deploy button */}
          <button
            onClick={() => onDeploy(recommendation.unitId)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium mt-2 transition-colors",
              rank === 0
                ? "bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30"
                : "bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
            )}
          >
            <Send className="w-3.5 h-3.5" />
            Triển khai
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// SOS SELECTOR
// =============================================================================

function SOSSelector({
  sosRequests,
  selectedSOSId,
  onSelect,
}: {
  sosRequests: RescueSOSRequest[];
  selectedSOSId: string | null;
  onSelect: (sosId: string) => void;
}) {
  const pendingSOS = useMemo(
    () => sosRequests.filter((s) => s.dispatch.status === "pending" || s.dispatch.status === "triaged"),
    [sosRequests]
  );

  if (pendingSOS.length === 0) {
    return (
      <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
        <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
        <p className="text-xs text-slate-500">Tất cả SOS đã được xử lý</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-slate-700">Chọn SOS để đề xuất</h4>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {pendingSOS.map((sos) => {
          const triageConfig = TRIAGE_COLOR_CONFIG[sos.triage.color];
          const isSelected = selectedSOSId === sos.id;

          return (
            <button
              key={sos.id}
              onClick={() => onSelect(sos.id)}
              className={clsx(
                "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 border",
                isSelected
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ backgroundColor: `${triageConfig.color}20`, color: triageConfig.color }}
              >
                {sos.triage.score}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-800 truncate block">{sos.id}</span>
                <span className="text-[9px] text-slate-500">
                  {sos.location.district} • {sos.situation.peopleCount} người
                </span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function DispatchAdvisorComponent({
  recommendations,
  incidents,
  sosRequests,
  resources,
  onDispatch,
  onCalculate,
  className,
}: DispatchAdvisorProps) {
  const [selectedSOSId, setSelectedSOSId] = useState<string | null>(null);

  // Get recommendations for selected SOS
  const currentRecommendations = useMemo(() => {
    if (!selectedSOSId) return [];
    return recommendations.filter((r) => {
      // Find the SOS that matches this recommendation
      const sos = sosRequests.find((s) => s.id === selectedSOSId);
      return sos && r.unitId; // Show all recommendations
    });
  }, [recommendations, selectedSOSId, sosRequests]);

  const handleDeploy = useCallback(
    (unitId: string) => {
      if (selectedSOSId) {
        onDispatch(unitId, selectedSOSId);
      }
    },
    [selectedSOSId, onDispatch]
  );

  const handleCalculate = useCallback(() => {
    if (selectedSOSId) {
      onCalculate(selectedSOSId);
    }
  }, [selectedSOSId, onCalculate]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-800">Đề xuất triển khai</h3>
      </div>

      {/* SOS Selector */}
      <SOSSelector
        sosRequests={sosRequests}
        selectedSOSId={selectedSOSId}
        onSelect={setSelectedSOSId}
      />

      {/* Calculate button */}
      {selectedSOSId && (
        <button
          onClick={handleCalculate}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Tính toán đề xuất
        </button>
      )}

      {/* Recommendations */}
      {currentRecommendations.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top {currentRecommendations.length} đề xuất
          </h4>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {currentRecommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.unitId}
                recommendation={rec}
                rank={index}
                onDeploy={handleDeploy}
              />
            ))}
          </motion.div>
        </div>
      ) : selectedSOSId ? (
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
          <Target className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Nhấn "Tính toán đề xuất" để xem kết quả</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
          <Send className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Chọn một SOS để xem đề xuất triển khai</p>
        </div>
      )}
    </div>
  );
}

export const DispatchAdvisor = memo(DispatchAdvisorComponent);
