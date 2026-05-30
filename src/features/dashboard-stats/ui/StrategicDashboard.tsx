"use client";

// =============================================================================
// STRATEGIC DASHBOARD - Long-Term Trends & Analysis
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Layout:
//   - Period Selector (5Y / 10Y / 20Y / All)
//   - Frequency Trend + Damage Trend
//   - Type Shift + Geographic Shift
//   - Insights Panel
//
// Inspired by: EM-DAT Trend Analysis, UNDRR Global Assessment
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Lightbulb, AlertTriangle, ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { StrategicDashboardProps, TimeRange } from "../lib/types";
import { DASHBOARD_ANIMATION, TIME_RANGE_CONFIG, MONTH_LABELS } from "../config/dashboard-config";
import { formatNumber, formatVNDBillionShort, formatPercentChange } from "../lib/formatters";
import {
  filterByTimeRange,
  aggregateYearlyStats,
  aggregateByType,
  generateHeatmapData,
  generateInsights,
  detectTrend,
  calculateCorrelation,
} from "../lib/aggregation";

// Components
import { GlassAreaChart } from "./charts/GlassAreaChart";
import { GlassBarChart } from "./charts/GlassBarChart";
import { GlassHeatmap } from "./charts/GlassHeatmap";
import { GlassPieChart } from "./charts/GlassPieChart";

// =============================================================================
// PERIOD SELECTOR
// =============================================================================

function PeriodSelector({
  activeRange,
  onChange,
}: {
  activeRange: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  const ranges: Array<{ id: TimeRange; label: string }> = [
    { id: "5y", label: "5 năm" },
    { id: "10y", label: "10 năm" },
    { id: "20y", label: "20 năm" },
    { id: "all", label: "Tất cả" },
  ];

  return (
    <div className="flex gap-1">
      {ranges.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
            activeRange === r.id
              ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
              : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// INSIGHTS PANEL
// =============================================================================

function InsightsPanel({ insights }: { insights: string[] }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        Phân tích & Nhận định
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-start gap-2 p-2 rounded-lg bg-slate-50"
          >
            <ArrowRight className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
            <span className="text-[11px] text-slate-700">{insight}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TREND SUMMARY CARD
// =============================================================================

function TrendSummaryCard({
  label,
  labelVi,
  value,
  trend,
  trendPercent,
  color,
}: {
  label: string;
  labelVi: string;
  value: string;
  trend: "increasing" | "decreasing" | "stable";
  trendPercent: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3">
      <span className="text-[10px] text-slate-500">{labelVi}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
        <span
          className={clsx(
            "text-[10px] font-medium",
            trend === "decreasing" ? "text-green-400" : trend === "increasing" ? "text-red-400" : "text-slate-500"
          )}
        >
          {trend === "decreasing" ? "↓" : trend === "increasing" ? "↑" : "→"} {Math.abs(trendPercent)}%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function StrategicDashboardComponent({
  yearlyData,
  monthlyData,
  provinceData,
  stats,
  className,
}: StrategicDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // Filter data by time range
  const filteredData = useMemo(
    () => filterByTimeRange(yearlyData, timeRange),
    [yearlyData, timeRange]
  );

  // Frequency trend
  const frequencyData = useMemo(
    () => filteredData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.totalEvents })),
    [filteredData]
  );

  // Damage trend
  const damageData = useMemo(
    () => filteredData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.economicDamageBillionVND })),
    [filteredData]
  );

  // Deaths trend
  const deathsData = useMemo(
    () => filteredData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.deaths })),
    [filteredData]
  );

  // Type distribution for filtered period
  const typeDist = useMemo(() => aggregateByType(filteredData), [filteredData]);

  // Heatmap data
  const heatmapData = useMemo(
    () => generateHeatmapData(filteredData, monthlyData),
    [filteredData, monthlyData]
  );

  // Year labels for heatmap
  const yearLabels = useMemo(
    () => filteredData.map((d) => `${d.year}`),
    [filteredData]
  );

  // Month labels
  const monthLabels = useMemo(
    () => MONTH_LABELS.map((m) => m.replace("Tháng ", "T")),
    []
  );

  // Trends
  const frequencyTrend = useMemo(() => detectTrend(filteredData.map((d) => d.totalEvents)), [filteredData]);
  const deathsTrend = useMemo(() => detectTrend(filteredData.map((d) => d.deaths)), [filteredData]);
  const damageTrend = useMemo(() => detectTrend(filteredData.map((d) => d.economicDamageBillionVND)), [filteredData]);

  // Correlation: events vs damage
  const correlation = useMemo(
    () => calculateCorrelation(
      filteredData.map((d) => d.totalEvents),
      filteredData.map((d) => d.economicDamageBillionVND)
    ),
    [filteredData]
  );

  // Insights
  const insights = useMemo(
    () => generateInsights(filteredData, provinceData),
    [filteredData, provinceData]
  );

  // Aggregated stats for period
  const periodStats = useMemo(() => aggregateYearlyStats(filteredData), [filteredData]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          Phân tích xu hướng dài hạn
        </h3>
        <PeriodSelector activeRange={timeRange} onChange={setTimeRange} />
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <TrendSummaryCard
          label="Frequency Trend"
          labelVi="Xu hướng tần suất"
          value={`${Math.round(periodStats.totalEvents / filteredData.length)} sự kiện/năm`}
          trend={frequencyTrend.direction}
          trendPercent={frequencyTrend.percent}
          color="#3B82F6"
        />
        <TrendSummaryCard
          label="Deaths Trend"
          labelVi="Xu hướng thương vong"
          value={`${periodStats.averageDeathsPerYear} người/năm`}
          trend={deathsTrend.direction}
          trendPercent={deathsTrend.percent}
          color="#EF4444"
        />
        <TrendSummaryCard
          label="Damage Trend"
          labelVi="Xu hướng thiệt hại"
          value={`${formatVNDBillionShort(periodStats.averageDamagePerYear)}/năm`}
          trend={damageTrend.direction}
          trendPercent={damageTrend.percent}
          color="#F59E0B"
        />
        <TrendSummaryCard
          label="Correlation"
          labelVi="Tương quan sự kiện-thiệt hại"
          value={correlation.toFixed(2)}
          trend={correlation > 0.5 ? "increasing" : correlation < -0.5 ? "decreasing" : "stable"}
          trendPercent={Math.round(correlation * 100)}
          color="#8B5CF6"
        />
      </div>

      {/* Frequency + Damage Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassAreaChart
          data={frequencyData}
          titleVi="Tần suất thiên tai theo năm"
          height={280}
          xKey="year"
          yKey="value"
          color="#3B82F6"
          gradientId="strategicFreq"
          showSMA
          smaWindow={5}
        />
        <GlassAreaChart
          data={damageData}
          titleVi="Thiệt hại kinh tế theo năm (tỷ VND)"
          height={280}
          xKey="year"
          yKey="value"
          color="#F59E0B"
          gradientId="strategicDamage"
          showSMA
          smaWindow={5}
        />
      </div>

      {/* Type Shift + Deaths Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassPieChart
          data={typeDist.map((t) => ({
            name: t.label,
            nameVi: t.labelVi,
            value: t.count,
            color: t.color,
            percentage: t.percentage,
          }))}
          titleVi={`Phân bố loại thiên tai (${TIME_RANGE_CONFIG[timeRange].labelVi})`}
          height={280}
          innerRadius={50}
          outerRadius={90}
        />
        <GlassAreaChart
          data={deathsData}
          titleVi="Thương vong theo năm"
          height={280}
          xKey="year"
          yKey="value"
          color="#EF4444"
          gradientId="strategicDeaths"
          showSMA
          smaWindow={5}
        />
      </div>

      {/* Heatmap */}
      <GlassHeatmap
        data={heatmapData}
        titleVi="Bản đồ nhiệt thiên ai (Tháng × Năm)"
        height={350}
        xLabels={yearLabels}
        yLabels={monthLabels}
      />

      {/* Insights */}
      <InsightsPanel insights={insights} />
    </div>
  );
}

export const StrategicDashboard = memo(StrategicDashboardComponent);
