"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import type { ProvinceRiskCardProps, RiskScore } from "../lib/types";
import type { DisasterType } from "@/lib/types";
import { DISASTER_CONFIG, RISK_COLORS } from "../config/predict-config";
import { getRiskColor, getRiskLevelLabel, scoreToLevel } from "../lib/risk-engine";
import { PROVINCE_GEO_TYPE } from "../lib/geo-risk";
import RiskGauge from "./RiskGauge";
import ExplanationPanel from "./ExplanationPanel";

// === CONSTANTS ===

const DISASTER_TYPES: DisasterType[] = [
  "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
];

const GEO_LABELS: Record<string, string> = {
  coastal: "Ven biển",
  mountain: "Miền núi",
  delta: "Đồng bằng",
  urban: "Đô thị",
  highland: "Cao nguyên",
};

const GEO_ICONS: Record<string, string> = {
  coastal: "🏖️",
  mountain: "⛰️",
  delta: "🌾",
  urban: "🏙️",
  highland: "🏔️",
};

const TREND_CONFIG = {
  increasing: { icon: TrendingUp, label: "Tăng", color: "text-red-400", bgColor: "bg-red-500/10" },
  decreasing: { icon: TrendingDown, label: "Giảm", color: "text-green-400", bgColor: "bg-green-500/10" },
  stable: { icon: Minus, label: "Ổn định", color: "text-slate-400", bgColor: "bg-slate-500/10" },
};

// === RISK BAR ===

function RiskBar({
  type,
  score,
  delay,
}: {
  type: DisasterType;
  score: RiskScore;
  delay: number;
}) {
  const config = DISASTER_CONFIG[type];
  const color = getRiskColor(score.score);
  const percentage = Math.round(score.score * 100);

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="text-sm w-6 text-center">{config.icon}</span>
      <span className="text-xs text-slate-400 w-16 truncate">{config.label}</span>

      <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <span
        className="text-xs font-mono font-semibold w-10 text-right"
        style={{ color }}
      >
        {percentage}%
      </span>

      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full min-w-[48px] text-center"
        style={{
          backgroundColor: `${color}15`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {getRiskLevelLabel(score.level)}
      </span>
    </motion.div>
  );
}

// === TOP THREATS ===

function TopThreats({
  risks,
}: {
  risks: Record<DisasterType, RiskScore>;
}) {
  const sorted = DISASTER_TYPES.map((t) => ({ type: t, score: risks[t] }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 3);

  return (
    <div className="flex items-center gap-2">
      {sorted.map((item, i) => (
        <span
          key={item.type}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${getRiskColor(item.score.score)}10`,
            color: getRiskColor(item.score.score),
            border: `1px solid ${getRiskColor(item.score.score)}25`,
          }}
        >
          {DISASTER_CONFIG[item.type].icon}
          {DISASTER_CONFIG[item.type].label}
        </span>
      ))}
    </div>
  );
}

// === MAIN COMPONENT ===

export default function ProvinceRiskCard({
  provinceRisk,
  isExpanded: controlledExpanded,
  onToggle,
}: ProvinceRiskCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<DisasterType | null>(null);

  const isExpanded = controlledExpanded ?? internalExpanded;
  const toggle = onToggle ?? (() => setInternalExpanded(!internalExpanded));

  const { province, risks, overallRisk, topThreat, trend } = provinceRisk;
  const overallColor = getRiskColor(overallRisk);
  const overallLevel = scoreToLevel(overallRisk);
  const geoType = PROVINCE_GEO_TYPE[province] ?? "urban";
  const trendConfig = TREND_CONFIG[trend];
  const TrendIcon = trendConfig.icon;

  // Sort types by score for the expanded view
  const sortedTypes = useMemo(
    () =>
      DISASTER_TYPES.map((t) => ({ type: t, score: risks[t] })).sort(
        (a, b) => b.score.score - a.score.score
      ),
    [risks]
  );

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      layout
    >
      {/* Collapsed Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/20 transition-colors"
        onClick={toggle}
      >
        {/* Province info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-slate-200 truncate">
              {province}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 flex-shrink-0">
              {GEO_ICONS[geoType]} {GEO_LABELS[geoType]}
            </span>
          </div>

          {/* Top threats */}
          <TopThreats risks={risks} />
        </div>

        {/* Risk gauge (small) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <TrendIcon className={`w-3.5 h-3.5 ${trendConfig.color}`} />
              <span className={`text-xs ${trendConfig.color}`}>
                {trendConfig.label}
              </span>
            </div>
          </div>

          <RiskGauge score={overallRisk} size="sm" showLevel={false} animated={false} />

          {/* Expand chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-700/30">
              {/* Risk bars for all types */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Chi tiết rủi ro theo loại thiên tai
                  </span>
                  <span className="text-[10px] text-slate-600">
                    Click vào loại thiên tai để xem giải thích
                  </span>
                </div>

                {sortedTypes.map((item, i) => (
                  <div
                    key={item.type}
                    className={`rounded-lg p-2 cursor-pointer transition-colors ${
                      selectedType === item.type
                        ? "bg-slate-800/40 ring-1 ring-slate-700/50"
                        : "hover:bg-slate-800/20"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedType(
                        selectedType === item.type ? null : item.type
                      );
                    }}
                  >
                    <RiskBar
                      type={item.type}
                      score={item.score}
                      delay={i * 0.05}
                    />
                  </div>
                ))}
              </div>

              {/* Explanation panel */}
              <AnimatePresence>
                {selectedType && risks[selectedType] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3"
                  >
                    <ExplanationPanel
                      riskScore={risks[selectedType]}
                      disasterType={selectedType}
                      province={province}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overall explanation (if no type selected) */}
              {!selectedType && (
                <motion.div
                  className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: overallColor }}
                    />
                    <div>
                      <p className="text-xs text-slate-300 font-medium mb-1">
                        Tổng quan rủi ro {province}
                      </p>
                      <p className="text-xs text-slate-500">
                        {risks[topThreat].explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
