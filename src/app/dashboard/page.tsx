"use client";

// =============================================================================
// DASHBOARD PAGE - Main Page Assembly
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Layout:
//   - Header with 4 view tabs + export buttons
//   - FilterBar (time range, region, type, province)
//   - Tab-based content: Executive, Operational, Analytical, Strategic
//   - Toast notifications
//   - Province drill-down
//
// Architecture:
//   - DashboardProvider wraps entire page
//   - DashboardPageContent uses useDashboard hook
//   - All state management via context + reducer
// =============================================================================

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IntroSection from "@/components/shared/IntroSection";
import {
  X,
  Loader2,
  ArrowLeft,
  Map,
  Siren,
  ArrowRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Eye,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

import { DashboardProvider, useDashboard } from "@/features/dashboard-stats/lib/dashboard-context";
import type { DashboardView, DashboardToast } from "@/features/dashboard-stats/lib/types";

// UI Components
import { DashboardHeader, FilterBar } from "@/features/dashboard-stats/ui/DashboardHeader";
import { ExecutiveDashboard } from "@/features/dashboard-stats/ui/ExecutiveDashboard";
import { AnalyticalDashboard } from "@/features/dashboard-stats/ui/AnalyticalDashboard";
import { StrategicDashboard } from "@/features/dashboard-stats/ui/StrategicDashboard";

// Utilities
import { generateCSV, formatYearlyDataForExport, formatProvinceDataForExport, generateFilename } from "@/features/dashboard-stats/lib/formatters";
import { applyAllFilters, aggregateYearlyStats, aggregateByType } from "@/features/dashboard-stats/lib/aggregation";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.2 },
  },
};

const toastVariants = {
  initial: { opacity: 0, x: 50, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// =============================================================================
// TOAST STYLES
// =============================================================================

const TOAST_STYLES: Record<string, { bg: string; border: string; icon: string; iconSymbol: string }> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "text-green-400",
    iconSymbol: "✅",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
    iconSymbol: "❌",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    iconSymbol: "ℹ️",
  },
};

// =============================================================================
// TOAST CONTAINER
// =============================================================================

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: DashboardToast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          return (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className={clsx(
                "pointer-events-auto p-3 rounded-xl border backdrop-blur-xl shadow-lg",
                style.bg,
                style.border
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{style.iconSymbol}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-xs font-semibold", style.icon)}>{toast.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{toast.message}</p>
                </div>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// PROVINCE DETAIL VIEW
// =============================================================================

function ProvinceDetailView({
  provinceName,
  onBack,
}: {
  provinceName: string;
  onBack: () => void;
}) {
  const { state, filteredYearlyData } = useDashboard();
  const province = state.provinceData.find((p) => p.province === provinceName);

  if (!province) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Không tìm thấy tỉnh {provinceName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-[11px] font-medium hover:border-slate-600/50 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Quay lại
      </button>

      {/* Province header */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
        <h2 className="text-lg font-bold text-white mb-1">{province.province}</h2>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Dân số: {(province.population / 1000000).toFixed(1)}M</span>
          <span>Diện tích: {province.areaKm2.toLocaleString("vi-VN")} km²</span>
          <span>GDP: {(province.gdpBillionVND / 1000).toFixed(0)} nghìn tỷ</span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              backgroundColor: province.riskScore >= 9 ? "#EF444420" : province.riskScore >= 7 ? "#F9731620" : "#F59E0B20",
              color: province.riskScore >= 9 ? "#EF4444" : province.riskScore >= 7 ? "#F97316" : "#F59E0B",
            }}
          >
            Rủi ro: {province.riskScore.toFixed(1)}/10
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tổng sự kiện", value: province.totalEvents, color: "#3B82F6" },
          { label: "Tổng chết", value: province.totalDeaths, color: "#EF4444" },
          { label: "Tổng受影响", value: province.totalAffected, color: "#8B5CF6" },
          { label: "Thiệt hại (tỷ)", value: province.totalDamageBillionVND, color: "#F59E0B" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
            <span className="text-xl font-bold block" style={{ color: stat.color }}>
              {stat.value.toLocaleString("vi-VN")}
            </span>
            <span className="text-[10px] text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Major events */}
      {province.majorEvents.length > 0 && (
        <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">📅 Sự kiện lớn</h3>
          <div className="space-y-2">
            {province.majorEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                <span className="text-sm font-bold text-amber-400 w-12">{event.year}</span>
                <div className="flex-1">
                  <p className="text-xs text-slate-200">{event.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {event.deaths} người chết • {event.damageBillionVND.toLocaleString("vi-VN")} tỷ VND
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type distribution */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">📊 Phân bố loại thiên tai</h3>
        <div className="space-y-2">
          {Object.entries(province.typeDistribution).map(([type, count]) => {
            const config = {
              flood: { label: "Lũ lụt", color: "#3B82F6", icon: "🌊" },
              storm: { label: "Bão", color: "#8B5CF6", icon: "🌪️" },
              landslide: { label: "Sạt lở", color: "#92400E", icon: "⛰️" },
              drought: { label: "Hạn hán", color: "#F59E0B", icon: "☀️" },
              earthquake: { label: "Động đất", color: "#EF4444", icon: "🏔️" },
              tsunami: { label: "Sóng thần", color: "#0EA5E9", icon: "🌊" },
            }[type as keyof typeof province.typeDistribution] || { label: type, color: "#6B7280", icon: "❓" };

            const total = Object.values(province.typeDistribution).reduce((s, v) => s + v, 0);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm">{config.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-200">{config.label}</span>
                    <span className="text-[10px] font-bold" style={{ color: config.color }}>{percent}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OPERATIONAL DASHBOARD (Simple version)
// =============================================================================

function OperationalDashboardSimple() {
  const { state, filteredProvinceData } = useDashboard();

  const activeIncidents = useMemo(
    () => state.yearlyData.filter((d) => d.year === 2024),
    [state.yearlyData]
  );

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚠️</span>
          <h3 className="text-sm font-semibold text-amber-400">Giám sát thời gian thực</h3>
        </div>
        <p className="text-[11px] text-amber-300/70">
          Chế độ giám sát hiển thị dữ liệu thời gian thực khi có sự cố đang xảy ra.
          Hiện tại không có sự cố lớn nào đang hoạt động.
        </p>
      </div>

      {/* Current year stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Sự kiện 2024", value: 21, color: "#3B82F6" },
          { label: "Thương vong 2024", value: 158, color: "#EF4444" },
          { label: "Thiệt hại (tỷ)", value: 13000, color: "#F59E0B" },
          { label: "受影响 (K)", value: 4100, color: "#8B5CF6" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
            <span className="text-xl font-bold block" style={{ color: stat.color }}>
              {stat.value.toLocaleString("vi-VN")}
            </span>
            <span className="text-[10px] text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Province overview */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">📍 Tổng quan tỉnh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredProvinceData.slice(0, 9).map((p) => (
            <div key={p.province} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: p.riskScore >= 9 ? "#EF444420" : p.riskScore >= 7 ? "#F9731620" : "#F59E0B20",
                  color: p.riskScore >= 9 ? "#EF4444" : p.riskScore >= 7 ? "#F97316" : "#F59E0B",
                }}
              >
                {p.riskScore.toFixed(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 truncate">{p.province}</p>
                <p className="text-[10px] text-slate-500">
                  {p.totalEvents} sự kiện • {p.totalDeaths} chết
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE CONTENT
// =============================================================================

function DashboardPageContent() {
  const {
    state,
    dispatch,
    filteredYearlyData,
    filteredProvinceData,
    kpis,
    showToast,
  } = useDashboard();

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // Toast dismiss
  const handleToastDismiss = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    },
    [dispatch]
  );

  // View change
  const handleViewChange = useCallback(
    (view: DashboardView) => {
      dispatch({ type: "SET_ACTIVE_VIEW", payload: view });
      setSelectedProvince(null);
    },
    [dispatch]
  );

  // Filter change
  const handleFilterChange = useCallback(
    (filter: Partial<typeof state.filter>) => {
      dispatch({ type: "SET_FILTER", payload: filter });
    },
    [dispatch]
  );

  // Filter reset
  const handleFilterReset = useCallback(() => {
    dispatch({ type: "RESET_FILTER" });
  }, [dispatch]);

  // Province select
  const handleProvinceSelect = useCallback(
    (province: string | null) => {
      setSelectedProvince(province);
    },
    []
  );

  // Export CSV
  const handleExportCSV = useCallback(() => {
    try {
      const data = formatYearlyDataForExport(filteredYearlyData as any);
      generateCSV(data, generateFilename("cuunet-disaster-data"));
      showToast({ type: "success", title: "Xuất CSV", message: "Đã xuất dữ liệu thành công", duration: 3000 });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể xuất dữ liệu", duration: 3000 });
    }
  }, [filteredYearlyData, showToast]);

  // Export PNG (placeholder)
  const handleExportPNG = useCallback(() => {
    showToast({ type: "info", title: "Xuất PNG", message: "Tính năng đang phát triển", duration: 3000 });
  }, [showToast]);

  // Aggregated data
  const stats = useMemo(
    () => state.aggregatedStats || {
      totalEvents: 0, totalDeaths: 0, totalMissing: 0, totalInjured: 0,
      totalAffected: 0, totalHousesDamaged: 0, totalDamageBillionVND: 0,
      averageDamagePerYear: 0, averageDeathsPerYear: 0,
      mostDeadlyYear: { year: 0, deaths: 0 },
      mostDamagingYear: { year: 0, damage: 0 },
      mostAffectedProvince: { province: "", affected: 0 },
      mostCommonType: "flood" as const,
      trendDirection: "stable" as const,
      trendPercent: 0,
    },
    [state.aggregatedStats]
  );

  // Province names for filter
  const provinceNames = useMemo(
    () => state.provinceData.map((p) => p.province),
    [state.provinceData]
  );

  // Render view content
  const renderView = () => {
    // Province drill-down
    if (selectedProvince) {
      return (
        <ProvinceDetailView
          provinceName={selectedProvince}
          onBack={() => setSelectedProvince(null)}
        />
      );
    }

    switch (state.activeView) {
      case "executive":
        return (
          <ExecutiveDashboard
            yearlyData={filteredYearlyData}
            provinceData={filteredProvinceData}
            typeDistribution={state.typeDistribution}
            stats={stats}
            kpis={kpis}
          />
        );

      case "operational":
        return <OperationalDashboardSimple />;

      case "analytical":
        return (
          <AnalyticalDashboard
            yearlyData={filteredYearlyData}
            provinceData={filteredProvinceData}
            typeDistribution={state.typeDistribution}
            filter={state.filter}
          />
        );

      case "strategic":
        return (
          <StrategicDashboard
            yearlyData={filteredYearlyData}
            monthlyData={state.monthlyData}
            provinceData={filteredProvinceData}
            stats={stats}
          />
        );

      default:
        return (
          <ExecutiveDashboard
            yearlyData={filteredYearlyData}
            provinceData={filteredProvinceData}
            typeDistribution={state.typeDistribution}
            stats={stats}
            kpis={kpis}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Intro Section */}
      <IntroSection
        moduleNumber="6"
        icon={<BarChart3 className="w-4 h-4" />}
        title="Trực quan hóa Dữ liệu Thiên tai"
        subtitle="25 năm dữ liệu thiên tai Việt Nam (2000-2024). 4 góc nhìn. Xuất CSV. Phân tích xu hướng và so sánh quốc tế."
        accentColor="#06B6D4"
        guideSteps={[
          { icon: <Eye className="w-3.5 h-3.5" />, text: "Executive: KPI Cards cho lãnh đạo" },
          { icon: <Target className="w-3.5 h-3.5" />, text: "Operational: Giám sát thời gian thực" },
          { icon: <PieChart className="w-3.5 h-3.5" />, text: "Analytical: Phân tích chi tiết" },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, text: "Strategic: Xu hướng dài hạn" },
        ]}
      />

      {/* Header */}
      <DashboardHeader
        activeView={state.activeView}
        onViewChange={handleViewChange}
        onExportCSV={handleExportCSV}
        onExportPNG={handleExportPNG}
      />

      {/* Filter bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <FilterBar
          filter={state.filter}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          provinces={provinceNames}
        />
      </div>

      {/* Main content */}
      <main className="px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.activeView}-${selectedProvince}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Cross-links */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/30">
          <h4 className="text-xs font-semibold text-slate-300 mb-3">Bước tiếp theo</h4>
          <div className="flex flex-wrap gap-2">
            <Link href="/map" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 text-xs hover:border-blue-500/40 hover:text-blue-400 transition-colors">
              <Map className="w-3.5 h-3.5" /> Xem chi tiết trên bản đồ <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/alerts" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 text-xs hover:border-red-500/40 hover:text-red-400 transition-colors">
              <Siren className="w-3.5 h-3.5" /> Xem cảnh báo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <ToastContainer toasts={state.toasts} onDismiss={handleToastDismiss} />
    </div>
  );
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardPageContent />
    </DashboardProvider>
  );
}
