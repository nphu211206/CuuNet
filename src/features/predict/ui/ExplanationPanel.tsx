"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Info, BarChart3, Cloud, MapPin, Users, Shield } from "lucide-react";
import type { ExplanationPanelProps, RiskFactors } from "../lib/types";
import type { DisasterType } from "@/lib/types";
import { DISASTER_CONFIG } from "../config/predict-config";
import { getRiskColor, getRiskLevelLabel, scoreToLevel } from "../lib/risk-engine";
import { getSeasonalMultiplier, MONTH_NAMES } from "../lib/seasonal-data";
import { PROVINCE_GEO_TYPE, getGeographicFactor } from "../lib/geo-risk";

// === FACTOR DEFINITIONS ===

interface FactorDisplay {
  key: keyof RiskFactors;
  label: string;
  icon: React.ReactNode;
  description: string;
  maxValue: number;
}

const FACTOR_DEFS: FactorDisplay[] = [
  {
    key: "hazard",
    label: "Mối nguy hiểm",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    description: "Tần suất × Mùa vụ × Địa lý",
    maxValue: 1.0,
  },
  {
    key: "exposure",
    label: "Mức phơi nhiễm",
    icon: <Users className="w-3.5 h-3.5" />,
    description: "Mật độ dân số, giá trị tài sản",
    maxValue: 1.0,
  },
  {
    key: "vulnerability",
    label: "Tính dễ bị tổn thương",
    icon: <Shield className="w-3.5 h-3.5" />,
    description: "Cơ sở hạ tầng, khả năng ứng phó",
    maxValue: 1.0,
  },
  {
    key: "weatherMod",
    label: "Yếu tố thời tiết",
    icon: <Cloud className="w-3.5 h-3.5" />,
    description: "Điều kiện thời tiết hiện tại",
    maxValue: 1.5,
  },
];

// === FACTOR BAR ===

function FactorBar({
  factor,
  value,
  delay,
}: {
  factor: FactorDisplay;
  value: number;
  delay: number;
}) {
  const normalizedValue = Math.min(1, value / factor.maxValue);
  const percentage = Math.round(normalizedValue * 100);
  const color = getRiskColor(normalizedValue);

  return (
    <motion.div
      className="flex items-center gap-3 group"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {factor.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-300 font-medium">
            {factor.label}
          </span>
          <span
            className="text-xs font-mono font-semibold"
            style={{ color }}
          >
            {value.toFixed(2)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: delay + 0.15, duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <p className="text-[10px] text-slate-600 mt-0.5 group-hover:text-slate-500 transition-colors">
          {factor.description}
        </p>
      </div>
    </motion.div>
  );
}

// === CONTEXTUAL FACTORS ===

function ContextualFactors({
  province,
  type,
  month,
}: {
  province: string;
  type: DisasterType;
  month: number;
}) {
  const factors = useMemo(() => {
    const items: { label: string; value: string; color: string; icon: string }[] = [];

    // Seasonal factor
    const seasonal = getSeasonalMultiplier(type, month);
    if (seasonal >= 0.7) {
      items.push({
        label: `${MONTH_NAMES[month]} - Mùa cao điểm`,
        value: `Hệ số: ${seasonal.toFixed(2)}`,
        color: "#EF4444",
        icon: "🌧️",
      });
    } else if (seasonal >= 0.4) {
      items.push({
        label: `${MONTH_NAMES[month]} - Mùa trung bình`,
        value: `Hệ số: ${seasonal.toFixed(2)}`,
        color: "#EAB308",
        icon: "🌤️",
      });
    } else {
      items.push({
        label: `${MONTH_NAMES[month]} - Mùa thấp điểm`,
        value: `Hệ số: ${seasonal.toFixed(2)}`,
        color: "#22C55E",
        icon: "☀️",
      });
    }

    // Geographic factor
    const geoType = PROVINCE_GEO_TYPE[province];
    const geoBoost = getGeographicFactor(province, type);
    if (geoBoost > 1.1) {
      items.push({
        label: `Vị trí ${geoType === "coastal" ? "ven biển" : geoType === "mountain" ? "miền núi" : geoType === "delta" ? "đồng bằng" : "đô thị"}`,
        value: `Hệ số: ${geoBoost.toFixed(2)}`,
        color: "#F97316",
        icon: "📍",
      });
    }

    return items;
  }, [province, type, month]);

  if (factors.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {factors.map((f, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        >
          <span>{f.icon}</span>
          <span className="text-slate-400">{f.label}</span>
          <span className="font-mono ml-auto" style={{ color: f.color }}>
            {f.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// === MAIN COMPONENT ===

export default function ExplanationPanel({
  riskScore,
  disasterType,
  province,
}: ExplanationPanelProps) {
  const config = DISASTER_CONFIG[disasterType];
  const color = getRiskColor(riskScore.score);
  const level = scoreToLevel(riskScore.score);
  const levelLabel = getRiskLevelLabel(level);
  const percentage = Math.round(riskScore.score * 100);

  const currentMonth = new Date().getMonth();

  return (
    <motion.div
      className="rounded-xl border border-slate-700/40 overflow-hidden"
      style={{ backgroundColor: `${color}05` }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: `${color}20`, backgroundColor: `${color}08` }}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" style={{ color }} />
          <h4 className="text-sm font-semibold text-slate-200">
            Giải thích rủi ro
          </h4>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          <span className="font-medium text-slate-300">{province}</span> có rủi ro{" "}
          <span className="font-semibold" style={{ color }}>
            {config.icon} {config.label}
          </span>{" "}
          <span className="font-semibold" style={{ color }}>
            {levelLabel.toLowerCase()}
          </span>{" "}
          ({percentage}%)
        </p>
      </div>

      {/* Factor breakdown */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-500 font-medium mb-2">
          Phân tích yếu tố rủi ro:
        </p>

        {FACTOR_DEFS.map((factor, i) => (
          <FactorBar
            key={factor.key}
            factor={factor}
            value={riskScore.factors[factor.key]}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* Contextual factors */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <p className="text-xs text-slate-500 font-medium mb-2">
            Yếu tố bối cảnh:
          </p>
          <ContextualFactors
            province={province}
            type={disasterType}
            month={currentMonth}
          />
        </div>
      </div>

      {/* AI Explanation */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">🤖</span>
            <div>
              <p className="text-xs text-blue-400 font-medium mb-1">
                Phân tích AI:
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {riskScore.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence note */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-slate-600 text-center">
          Độ tin cậy mô hình: 75% | Dữ liệu: EM-DAT, MARD, Open-Meteo
        </p>
      </div>
    </motion.div>
  );
}
