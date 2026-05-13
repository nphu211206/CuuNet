"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { ScenarioPanelProps } from "../lib/types";
import type { DisasterType } from "@/lib/types";
import { SCENARIOS, DISASTER_CONFIG } from "../config/predict-config";
import type { Scenario } from "../lib/types";

// === CONSTANTS ===

const DISASTER_TYPES: DisasterType[] = [
  "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
];

const SCENARIO_COLORS: Record<string, string> = {
  normal: "#3B82F6",
  "el-nino": "#F97316",
  "la-nina": "#06B6D4",
  "climate-change": "#A855F7",
};

// === CUSTOM TOOLTIP ===

interface ComparisonTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ComparisonDataPoint }>;
  label?: string;
}

interface ComparisonDataPoint {
  type: string;
  typeLabel: string;
  icon: string;
  normal: number;
  current: number;
  modifier: number;
  difference: number;
}

function ComparisonTooltip({ active, payload, label }: ComparisonTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const diffPercent = ((data.modifier - 1) * 100).toFixed(0);
  const isIncrease = data.modifier > 1;

  return (
    <div className="glass-card border border-slate-700/50 shadow-xl px-4 py-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
        <span className="text-base">{data.icon}</span>
        <span className="text-sm font-semibold text-slate-200">{data.typeLabel}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Bình thường:</span>
          <span className="font-mono text-blue-400">{(data.normal * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Kịch bản:</span>
          <span className="font-mono text-amber-400">{(data.current * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-xs pt-1 border-t border-slate-700/50">
          <span className="text-slate-400">Thay đổi:</span>
          <span
            className={`font-mono font-semibold ${
              isIncrease ? "text-red-400" : data.modifier < 1 ? "text-green-400" : "text-slate-400"
            }`}
          >
            {isIncrease ? "+" : ""}{diffPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

// === SCENARIO BUTTON ===

interface ScenarioButtonProps {
  scenario: Scenario;
  isActive: boolean;
  onClick: () => void;
}

function ScenarioButton({ scenario, isActive, onClick }: ScenarioButtonProps) {
  const color = SCENARIO_COLORS[scenario.id] ?? "#3B82F6";

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl
        border transition-all duration-300 cursor-pointer
        ${isActive
          ? "border-opacity-60 bg-opacity-15 shadow-lg"
          : "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/60 hover:bg-slate-800/40"
        }
      `}
      style={
        isActive
          ? {
              borderColor: color,
              backgroundColor: `${color}15`,
              boxShadow: `0 0 20px ${color}20, 0 0 40px ${color}10`,
            }
          : undefined
      }
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Active glow effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(ellipse at center, ${color}10 0%, transparent 70%)`,
          }}
          layoutId="scenario-glow"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span className="text-xl relative z-10">{scenario.icon}</span>
      <span
        className={`text-xs font-semibold relative z-10 ${
          isActive ? "text-slate-100" : "text-slate-400"
        }`}
      >
        {scenario.name}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full absolute -bottom-0.5"
          style={{ backgroundColor: color }}
          layoutId="scenario-indicator"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

// === COMPONENT ===

export default function ScenarioPanel({
  activeScenario,
  onScenarioChange,
  comparisonData,
}: ScenarioPanelProps) {
  const [showDetails, setShowDetails] = useState(false);
  const currentScenario = SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[0];
  const activeColor = SCENARIO_COLORS[activeScenario] ?? "#3B82F6";

  // Build comparison chart data
  const chartData = useMemo((): ComparisonDataPoint[] => {
    return DISASTER_TYPES.map((type) => {
      const normalScore = comparisonData?.normal ?? 0.5;
      const currentScore = comparisonData?.current ?? 0.5;
      const modifier = currentScenario.modifiers[type];

      return {
        type,
        typeLabel: DISASTER_CONFIG[type].label,
        icon: DISASTER_CONFIG[type].icon,
        normal: normalScore,
        current: Math.min(1, currentScore * modifier),
        modifier,
        difference: (modifier - 1) * 100,
      };
    });
  }, [activeScenario, comparisonData, currentScenario]);

  return (
    <motion.div
      className="glass-card p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Kịch bản mô phỏng
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô phỏng tác động của các hiện tượng khí hậu lên rủi ro thiên tai
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/50"
        >
          {showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
        </button>
      </div>

      {/* Scenario buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {SCENARIOS.map((scenario) => (
          <ScenarioButton
            key={scenario.id}
            scenario={scenario}
            isActive={activeScenario === scenario.id}
            onClick={() => onScenarioChange(scenario.id)}
          />
        ))}
      </div>

      {/* Active scenario description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScenario}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div
            className="rounded-lg p-3 border"
            style={{
              backgroundColor: `${activeColor}08`,
              borderColor: `${activeColor}20`,
            }}
          >
            <p className="text-xs text-slate-300 mb-1.5">
              <span className="font-semibold">{currentScenario.name}</span>
              {" - "}
              {currentScenario.description}
            </p>
            {showDetails && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-slate-500 italic"
              >
                {currentScenario.scientificBasis}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modifier breakdown */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {DISASTER_TYPES.map((type) => {
          const modifier = currentScenario.modifiers[type];
          const isIncrease = modifier > 1;
          const isDecrease = modifier < 1;
          const config = DISASTER_CONFIG[type];

          return (
            <div
              key={type}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/30"
            >
              <span className="text-sm">{config.icon}</span>
              <span
                className={`text-xs font-mono font-bold ${
                  isIncrease
                    ? "text-red-400"
                    : isDecrease
                      ? "text-green-400"
                      : "text-slate-400"
                }`}
              >
                {isIncrease ? "+" : ""}
                {((modifier - 1) * 100).toFixed(0)}%
              </span>
              <span className="text-[9px] text-slate-500">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Comparison bar chart */}
      {comparisonData && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">
            So sánh rủi ro: <span className="text-blue-400">Bình thường</span> vs{" "}
            <span style={{ color: activeColor }}>{currentScenario.name}</span>
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              barGap={2}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="typeLabel"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip content={<ComparisonTooltip />} />

              <Bar dataKey="normal" fill="#3B82F6" radius={[3, 3, 0, 0]} barSize={12} opacity={0.5}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#3B82F6" opacity={0.5} />
                ))}
              </Bar>

              <Bar dataKey="current" radius={[3, 3, 0, 0]} barSize={12}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.modifier > 1 ? "#EF4444" : entry.modifier < 1 ? "#22C55E" : activeColor}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
