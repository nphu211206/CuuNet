"use client";

// =============================================================================
// EXECUTIVE DASHBOARD - High-Level Overview
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Layout:
//   - KPI Cards Row (6 cards)
//   - Trend Chart (70%) + Top Provinces (30%)
//   - Donut: Disaster Type + Gauge: Risk Index
//
// Inspired by: HDX Key Figures, OCHA Country Dashboard
// =============================================================================

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import clsx from "clsx";
import type { ExecutiveDashboardProps } from "../lib/types";
import { DASHBOARD_ANIMATION } from "../config/dashboard-config";
import { formatNumber, formatCompact, formatVNDBillionShort } from "../lib/formatters";
import { getTopProvinces, provincesToBarData, aggregateByType, generateTreemapData } from "../lib/aggregation";

// Components
import { KPICardGrid } from "./KPICard";
import { GlassAreaChart } from "./charts/GlassAreaChart";
import { GlassBarChart } from "./charts/GlassBarChart";
import { GlassPieChart } from "./charts/GlassPieChart";
import { GlassTreemap } from "./charts/GlassTreemap";
import { GlassGauge } from "./charts/GlassGauge";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay },
  }),
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ExecutiveDashboardComponent({
  yearlyData,
  provinceData,
  typeDistribution,
  stats,
  kpis,
  className,
}: ExecutiveDashboardProps) {
  // Prepare trend data
  const trendData = useMemo(
    () => yearlyData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.deaths })),
    [yearlyData]
  );

  // Prepare damage trend data
  const damageTrendData = useMemo(
    () => yearlyData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.economicDamageBillionVND })),
    [yearlyData]
  );

  // Top provinces by deaths
  const topProvincesDeaths = useMemo(
    () => provincesToBarData(provinceData, "totalDeaths", 10),
    [provinceData]
  );

  // Top provinces by damage
  const topProvincesDamage = useMemo(
    () => provincesToBarData(provinceData, "totalDamageBillionVND", 10),
    [provinceData]
  );

  // Treemap data
  const treemapData = useMemo(
    () => generateTreemapData(stats),
    [stats]
  );

  // Risk gauge
  const riskGauge = useMemo(() => {
    const last5Deaths = yearlyData.slice(-5).reduce((s, d) => s + d.deaths, 0) / 5;
    const riskValue = Math.min(100, Math.round(last5Deaths / 3));
    return {
      value: riskValue,
      maxValue: 100,
      label: "Risk Index",
      labelVi: "Chỉ số rủi ro",
      color: riskValue > 70 ? "#EF4444" : riskValue > 40 ? "#F59E0B" : "#22C55E",
      level: riskValue > 70 ? "High" : riskValue > 40 ? "Medium" : "Low",
      levelVi: riskValue > 70 ? "Cao" : riskValue > 40 ? "Trung bình" : "Thấp",
    };
  }, [yearlyData]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* KPI Cards */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <KPICardGrid kpis={kpis} />
      </motion.div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart (70%) */}
        <motion.div
          custom={0.2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <GlassAreaChart
            data={trendData}
            title="Disaster Deaths Trend"
            titleVi="Xu hướng thương vong thiên tai (2000-2024)"
            height={320}
            xKey="year"
            yKey="value"
            color="#EF4444"
            gradientId="executiveDeathGradient"
            annotation={{ year: 2024, label: "Bão Yagi" }}
            showSMA
            smaWindow={5}
          />
        </motion.div>

        {/* Top Provinces (30%) */}
        <motion.div
          custom={0.3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassBarChart
            data={topProvincesDeaths}
            title="Top 10 Provinces"
            titleVi="Top 10 tỉnh受影响 nặng nhất"
            height={320}
            layout="horizontal"
            xKey="nameVi"
            yKey="value"
          />
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Type Distribution Donut */}
        <motion.div
          custom={0.4}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassPieChart
            data={typeDistribution.map((t) => ({
              name: t.label,
              nameVi: t.labelVi,
              value: t.count,
              color: t.color,
              percentage: t.percentage,
            }))}
            title="Disaster Type Distribution"
            titleVi="Phân bố loại thiên tai"
            height={280}
            innerRadius={50}
            outerRadius={90}
            centerLabel="Tổng"
            centerValue={`${stats.totalEvents}`}
          />
        </motion.div>

        {/* Damage Trend */}
        <motion.div
          custom={0.5}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassAreaChart
            data={damageTrendData}
            title="Economic Damage Trend"
            titleVi="Xu hướng thiệt hại kinh tế (tỷ VND)"
            height={280}
            xKey="year"
            yKey="value"
            color="#F59E0B"
            gradientId="executiveDamageGradient"
          />
        </motion.div>

        {/* Risk Gauge + Treemap */}
        <motion.div
          custom={0.6}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4 flex items-center justify-center">
            <GlassGauge
              data={riskGauge}
              titleVi="Chỉ số rủi ro thiên tai"
              size={140}
              strokeWidth={12}
            />
          </div>
          <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-3">
            <h4 className="text-xs font-semibold text-slate-200 mb-2">📊 Thống kê nhanh</h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">TB sự kiện/năm</span>
                <span className="text-[11px] font-bold text-blue-400">{Math.round(stats.totalEvents / yearlyData.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">TB chết/năm</span>
                <span className="text-[11px] font-bold text-red-400">{stats.averageDeathsPerYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">TB thiệt hại/năm</span>
                <span className="text-[11px] font-bold text-amber-400">{formatVNDBillionShort(stats.averageDamagePerYear)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Năm chết nhiều nhất</span>
                <span className="text-[11px] font-bold text-red-400">{stats.mostDeadlyYear.year} ({stats.mostDeadlyYear.deaths})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Xu hướng</span>
                <span className={clsx(
                  "text-[11px] font-bold",
                  stats.trendDirection === "decreasing" ? "text-green-400" : stats.trendDirection === "increasing" ? "text-red-400" : "text-slate-400"
                )}>
                  {stats.trendDirection === "decreasing" ? "↓ Giảm" : stats.trendDirection === "increasing" ? "↑ Tăng" : "→ Ổn định"} {Math.abs(stats.trendPercent)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Damage Treemap */}
      <motion.div
        custom={0.7}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <GlassTreemap
          data={treemapData}
          title="Damage Breakdown by Sector"
          titleVi="Thiệt hại theo lĩnh vực"
          height={200}
        />
      </motion.div>
    </div>
  );
}

export const ExecutiveDashboard = memo(ExecutiveDashboardComponent);
