"use client";

// =============================================================================
// ANALYTICAL DASHBOARD - Deep Dive Analysis
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Layout:
//   - Filter visualization tabs
//   - Large chart area (switches between chart types)
//   - Province comparison table
//
// Inspired by: DesInventar Query Builder, EM-DAT Country Profile
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Map, Grid3X3, TrendingUp, Download, Filter } from "lucide-react";
import clsx from "clsx";
import type { AnalyticalDashboardProps, DashboardFilter } from "../lib/types";
import { DASHBOARD_ANIMATION, DISASTER_TYPE_DASHBOARD_CONFIG } from "../config/dashboard-config";
import { formatNumber, formatCompact, formatVNDBillionShort, formatPercent } from "../lib/formatters";
import {
  generateBubbleData,
  provincesToBarData,
  aggregateByType,
  getTopProvinces,
} from "../lib/aggregation";

// Components
import { GlassAreaChart } from "./charts/GlassAreaChart";
import { GlassBarChart } from "./charts/GlassBarChart";
import { GlassScatterChart } from "./charts/GlassScatterChart";
import { GlassPieChart } from "./charts/GlassPieChart";

// =============================================================================
// VISUALIZATION TABS
// =============================================================================

type VizTab = "trends" | "geographic" | "comparison" | "multidimensional";

const VIZ_TABS: Array<{ id: VizTab; label: string; icon: React.ReactNode }> = [
  { id: "trends", label: "Xu hướng", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: "geographic", label: "Địa lý", icon: <Map className="w-3.5 h-3.5" /> },
  { id: "comparison", label: "So sánh", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "multidimensional", label: "Đa chiều", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
];

// =============================================================================
// TRENDS VIEW
// =============================================================================

function TrendsView({ yearlyData }: { yearlyData: AnalyticalDashboardProps["yearlyData"] }) {
  const deathsData = useMemo(
    () => yearlyData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.deaths })),
    [yearlyData]
  );

  const eventsData = useMemo(
    () => yearlyData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.totalEvents })),
    [yearlyData]
  );

  const affectedData = useMemo(
    () => yearlyData.map((d) => ({ year: d.year, label: `${d.year}`, value: d.affected })),
    [yearlyData]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassAreaChart
          data={deathsData}
          titleVi="Thương vong theo năm"
          height={300}
          xKey="year"
          yKey="value"
          color="#EF4444"
          gradientId="analyticalDeaths"
          showSMA
          smaWindow={5}
        />
        <GlassAreaChart
          data={eventsData}
          titleVi="Số sự kiện theo năm"
          height={300}
          xKey="year"
          yKey="value"
          color="#3B82F6"
          gradientId="analyticalEvents"
          showSMA
          smaWindow={5}
        />
      </div>
      <GlassAreaChart
        data={affectedData}
        titleVi="Số người受影响 theo năm (nghìn)"
        height={250}
        xKey="year"
        yKey="value"
        color="#8B5CF6"
        gradientId="analyticalAffected"
      />
    </div>
  );
}

// =============================================================================
// GEOGRAPHIC VIEW
// =============================================================================

function GeographicView({ provinceData }: { provinceData: AnalyticalDashboardProps["provinceData"] }) {
  const deathsBar = useMemo(() => provincesToBarData(provinceData, "totalDeaths", 15), [provinceData]);
  const damageBar = useMemo(() => provincesToBarData(provinceData, "totalDamageBillionVND", 15), [provinceData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassBarChart
          data={deathsBar}
          titleVi="Thương vong theo tỉnh (2000-2024)"
          height={350}
          layout="horizontal"
          xKey="nameVi"
          yKey="value"
        />
        <GlassBarChart
          data={damageBar}
          titleVi="Thiệt hại theo tỉnh (tỷ VND)"
          height={350}
          layout="horizontal"
          xKey="nameVi"
          yKey="value"
        />
      </div>
    </div>
  );
}

// =============================================================================
// COMPARISON VIEW
// =============================================================================

function ComparisonView({ provinceData }: { provinceData: AnalyticalDashboardProps["provinceData"] }) {
  const typeDist = useMemo(() => aggregateByType(provinceData as any), [provinceData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassPieChart
          data={typeDist.map((t) => ({
            name: t.label,
            nameVi: t.labelVi,
            value: t.count,
            color: t.color,
            percentage: t.percentage,
          }))}
          titleVi="Phân bố loại thiên tai"
          height={300}
          innerRadius={50}
          outerRadius={90}
        />
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">📊 So sánh chi tiết</h3>
          <div className="space-y-2">
            {typeDist.slice(0, 5).map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ backgroundColor: `${t.color}20` }}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-200">{t.labelVi}</span>
                    <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MULTIDIMENSIONAL VIEW (Bubble Chart)
// =============================================================================

function MultidimensionalView({ yearlyData }: { yearlyData: AnalyticalDashboardProps["yearlyData"] }) {
  const bubbleData = useMemo(() => generateBubbleData(yearlyData), [yearlyData]);

  return (
    <div className="space-y-4">
      <GlassScatterChart
        data={bubbleData}
        title="EM-DAT Style Bubble Chart"
        titleVi="Biểu đồ bong bóng đa chiều (EM-DAT)"
        height={450}
        xKey="x"
        yKey="y"
        zKey="z"
      />
      <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">📖 Hướng dẫn đọc biểu đồ</h3>
        <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-400">
          <div>
            <p><strong className="text-slate-300">Trục X:</strong> Số sự kiện thiên tai/năm</p>
            <p><strong className="text-slate-300">Trục Y:</strong> Số người chết</p>
          </div>
          <div>
            <p><strong className="text-slate-300">Kích thước:</strong> Thiệt hại kinh tế (tỷ VND)</p>
            <p><strong className="text-slate-300">Màu sắc:</strong> Loại thiên tai chính</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PROVINCE TABLE
// =============================================================================

function ProvinceTable({ provinceData }: { provinceData: AnalyticalDashboardProps["provinceData"] }) {
  const [sortBy, setSortBy] = useState<"totalDeaths" | "totalDamageBillionVND" | "totalEvents" | "riskScore">("totalDeaths");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...provinceData].sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });
  }, [provinceData, sortBy, sortDir]);

  const handleSort = useCallback((col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }, [sortBy]);

  return (
    <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 overflow-hidden">
      <div className="p-3 border-b border-slate-700/30">
        <h3 className="text-sm font-semibold text-slate-200">📋 Bảng chi tiết tỉnh</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/30">
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400">Tỉnh</th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-200" onClick={() => handleSort("totalEvents")}>
                Sự kiện {sortBy === "totalEvents" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-200" onClick={() => handleSort("totalDeaths")}>
                Chết {sortBy === "totalDeaths" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-200" onClick={() => handleSort("totalDamageBillionVND")}>
                Thiệt hại {sortBy === "totalDamageBillionVND" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-400 cursor-pointer hover:text-slate-200" onClick={() => handleSort("riskScore")}>
                Rủi ro {sortBy === "riskScore" && (sortDir === "desc" ? "↓" : "↑")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <motion.tr
                key={p.province}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-5">{i + 1}</span>
                    <span className="text-xs text-slate-200">{p.province}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-xs text-blue-400 tabular-nums">{p.totalEvents}</td>
                <td className="px-3 py-2 text-right text-xs text-red-400 tabular-nums">{p.totalDeaths}</td>
                <td className="px-3 py-2 text-right text-xs text-amber-400 tabular-nums">{formatVNDBillionShort(p.totalDamageBillionVND)}</td>
                <td className="px-3 py-2 text-right">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: p.riskScore >= 9 ? "#EF444420" : p.riskScore >= 7 ? "#F9731620" : "#F59E0B20",
                      color: p.riskScore >= 9 ? "#EF4444" : p.riskScore >= 7 ? "#F97316" : "#F59E0B",
                    }}
                  >
                    {p.riskScore.toFixed(1)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function AnalyticalDashboardComponent({
  yearlyData,
  provinceData,
  typeDistribution,
  filter,
  className,
}: AnalyticalDashboardProps) {
  const [activeViz, setActiveViz] = useState<VizTab>("trends");

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Visualization Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {VIZ_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveViz(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              activeViz === tab.id
                ? "bg-purple-500/15 border-purple-500/40 text-purple-400"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeViz}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {activeViz === "trends" && <TrendsView yearlyData={yearlyData} />}
          {activeViz === "geographic" && <GeographicView provinceData={provinceData} />}
          {activeViz === "comparison" && <ComparisonView provinceData={provinceData} />}
          {activeViz === "multidimensional" && <MultidimensionalView yearlyData={yearlyData} />}
        </motion.div>
      </AnimatePresence>

      {/* Province Table */}
      <ProvinceTable provinceData={provinceData} />
    </div>
  );
}

export const AnalyticalDashboard = memo(AnalyticalDashboardComponent);
