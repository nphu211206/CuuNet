"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CompactPageHeader from "@/components/shared/CompactPageHeader";
import {
  Brain,
  ChevronDown,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Layers,
  Zap,
  Info,
  Target,
  TrendingUp,
  Globe,
} from "lucide-react";
import { PredictionProvider, usePrediction } from "@/features/predict/lib/prediction-context";
import type { DisasterType } from "@/lib/types";
import type { ProvinceRisk, PredictionResult } from "@/features/predict/lib/types";
import { MONTH_NAMES, MONTH_NAMES_SHORT } from "@/features/predict/lib/seasonal-data";
import { getAllProvinces } from "@/features/predict/lib/geo-risk";
import { getProvincesByRisk, getHighRiskProvinces } from "@/features/predict/lib/risk-engine";
import { SCENARIOS, DISASTER_CONFIG } from "@/features/predict/config/predict-config";
import { fetchAllExternalData } from "@/features/predict/api/external-data";

// === DYNAMIC IMPORTS (SSR-safe for Leaflet) ===

import dynamic from "next/dynamic";

const RiskMap = dynamic(() => import("@/features/predict/ui/RiskMap"), {
  ssr: false,
  loading: () => <ComponentSkeleton height={450} label="Đang tải bản đồ..." />,
});

// Use enhanced skeleton for map loading
import { SkeletonMap } from "@/components/shared/Skeleton";
const TrendChart = dynamic(() => import("@/features/predict/ui/TrendChart"), {
  ssr: false,
  loading: () => <ComponentSkeleton height={300} />,
});
const SeasonalCalendar = dynamic(() => import("@/features/predict/ui/SeasonalCalendar"), {
  ssr: false,
  loading: () => <ComponentSkeleton height={350} label="Đang tải lịch mùa vụ..." />,
});
const ScenarioPanel = dynamic(() => import("@/features/predict/ui/ScenarioPanel"), {
  ssr: false,
  loading: () => <ComponentSkeleton height={200} label="Đang tải kịch bản..." />,
});
const ProvinceRiskCard = dynamic(() => import("@/features/predict/ui/ProvinceRiskCard"), {
  ssr: false,
  loading: () => <ComponentSkeleton height={120} />,
});
const PredictStatsBar = dynamic(() => import("@/features/predict/ui/PredictStatsBar"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card h-16 animate-pulse" />
      ))}
    </div>
  ),
});
const RiskGauge = dynamic(() => import("@/features/predict/ui/RiskGauge"), {
  ssr: false,
  loading: () => (
    <div className="w-[100px] h-[100px] bg-slate-100 rounded-full animate-pulse" />
  ),
});

// === LOADING FALLBACK ===

function ComponentSkeleton({ height = 200, label }: { height?: number; label?: string }) {
  return (
    <div
      className="glass-card flex items-center justify-center animate-pulse"
      style={{ minHeight: height }}
    >
      <div className="text-center">
        <Loader2 className="w-6 h-6 text-slate-600 animate-spin mx-auto mb-2" />
        {label && <p className="text-xs text-slate-600">{label}</p>}
      </div>
    </div>
  );
}

// === PROVINCE SELECTOR ===

function ProvinceSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (province: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const provinces = getAllProvinces();

  const filtered = useMemo(
    () =>
      provinces.filter((p) =>
        p.toLowerCase().includes(search.toLowerCase())
      ),
    [provinces, search]
  );

  return (
    <div className="relative">
      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Tỉnh/Thành phố
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 hover:border-slate-300 transition-colors"
      >
        <span className="truncate">{value ?? "Chọn tỉnh..."}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 glass-card border border-slate-200 shadow-xl max-h-60 overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-slate-200">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tỉnh..."
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500/40"
                autoFocus
              />
            </div>

            {/* Province list */}
            <div className="overflow-y-auto max-h-48">
              {filtered.map((province) => (
                <button
                  key={province}
                  onClick={() => {
                    onChange(province);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${province === value
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                >
                  {province}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-slate-600 text-center">
                  Không tìm thấy
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === MONTH SELECTOR ===

function MonthSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (month: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Tháng
      </label>
      <div className="grid grid-cols-4 gap-1">
        {MONTH_NAMES_SHORT.map((name, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`text-[10px] px-2 py-1.5 rounded-md transition-all ${i === value
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold"
              : i === new Date().getMonth()
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

// === SCENARIO SELECTOR ===

function ScenarioSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (scenarioId: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
        <Layers className="w-3 h-3" />
        Kịch bản
      </label>
      <div className="space-y-1">
        {SCENARIOS.map((scenario) => {
          const isActive = scenario.id === value;
          return (
            <button
              key={scenario.id}
              onClick={() => onChange(scenario.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isActive
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : "bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
                }`}
            >
              <span className="text-base">{scenario.icon}</span>
              <span className="font-medium">{scenario.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// === DISASTER TYPE FILTER ===

function DisasterTypeFilter({
  value,
  onChange,
}: {
  value: DisasterType | null;
  onChange: (type: DisasterType | null) => void;
}) {
  const types: DisasterType[] = [
    "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
  ];

  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
        <BarChart3 className="w-3 h-3" />
        Loại thiên tai
      </label>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onChange(null)}
          className={`text-[10px] px-2 py-1.5 rounded-md transition-colors ${value === null
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "bg-slate-50 text-slate-500 hover:text-slate-700"
            }`}
        >
          Tất cả
        </button>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`text-[10px] px-2 py-1.5 rounded-md transition-colors ${value === type
              ? "border text-white font-medium"
              : "bg-slate-800/30 text-slate-500 hover:text-slate-400"
              }`}
            style={
              value === type
                ? {
                  backgroundColor: `${DISASTER_CONFIG[type].color}20`,
                  borderColor: `${DISASTER_CONFIG[type].color}40`,
                  color: DISASTER_CONFIG[type].color,
                }
                : undefined
            }
          >
            {DISASTER_CONFIG[type].icon} {DISASTER_CONFIG[type].label}
          </button>
        ))}
      </div>
    </div>
  );
}

// === PROVINCE RISK LIST ===

function ProvinceRiskList({
  riskScores,
  selectedProvince,
  onProvinceSelect,
}: {
  riskScores: Map<string, ProvinceRisk>;
  selectedProvince: string | null;
  onProvinceSelect: (province: string) => void;
}) {
  const sortedProvinces = useMemo(
    () => getProvincesByRisk(riskScores),
    [riskScores]
  );

  const [showAll, setShowAll] = useState(false);
  const displayList = showAll ? sortedProvinces : sortedProvinces.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          Xếp hạng rủi ro tỉnh/thành
        </h3>
        <span className="text-[10px] text-slate-600">
          {sortedProvinces.length} tỉnh
        </span>
      </div>

      <div className="space-y-2">
        {displayList.map((risk, i) => (
          <motion.div
            key={risk.province}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onProvinceSelect(risk.province)}
            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${risk.province === selectedProvince
              ? "bg-blue-500/10 border border-blue-500/25"
              : "bg-slate-50 border border-transparent hover:bg-slate-100"
              }`}
          >
            <span className="text-xs font-mono text-slate-600 w-5 text-right">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 font-medium truncate">
                {risk.province}
              </p>
              <p className="text-[10px] text-slate-600">
                {DISASTER_CONFIG[risk.topThreat].icon}{" "}
                {DISASTER_CONFIG[risk.topThreat].label}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className="text-xs font-mono font-bold"
                style={{
                  color:
                    risk.overallRisk >= 0.8
                      ? "#EF4444"
                      : risk.overallRisk >= 0.6
                        ? "#F97316"
                        : risk.overallRisk >= 0.35
                          ? "#EAB308"
                          : "#22C55E",
                }}
              >
                {(risk.overallRisk * 100).toFixed(0)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {sortedProvinces.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {showAll ? "Thu gọn" : `Xem tất cả (${sortedProvinces.length})`}
        </button>
      )}
    </div>
  );
}

// === EXTERNAL ALERTS PANEL ===

function ExternalAlertsPanel() {
  const [alerts, setAlerts] = useState<import("@/features/predict/lib/types").ExternalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { alerts: data, errors } = await fetchAllExternalData({
          reliefwebLimit: 5,
          earthquakeDays: 14,
        });
        if (!cancelled) {
          setAlerts(data.slice(0, 8));
          if (errors.length > 0) {
            console.warn("[ExternalData] Some APIs failed:", errors);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Không thể tải dữ liệu bên ngoài");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-200">
            Cảnh báo bên ngoài
          </h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-slate-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || alerts.length === 0) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-200">
            Cảnh báo bên ngoài
          </h3>
        </div>
        <p className="text-xs text-slate-600 text-center py-4">
          {error ?? "Không có cảnh báo gần đây"}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200">
          Cảnh báo bên ngoài
        </h3>
        <span className="text-[10px] text-slate-600 ml-auto">
          ReliefWeb, GDACS, USGS
        </span>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {alerts.map((alert) => {
          const config = DISASTER_CONFIG[alert.type] ?? DISASTER_CONFIG.flood;
          const severityColors: Record<string, string> = {
            critical: "#EF4444",
            high: "#F97316",
            medium: "#EAB308",
            low: "#22C55E",
          };
          const sevColor = severityColors[alert.severity] ?? "#94A3B8";

          return (
            <div
              key={alert.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="text-sm mt-0.5">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 truncate">{alert.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[9px] px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: `${sevColor}15`,
                      color: sevColor,
                    }}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    {alert.source.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    {new Date(alert.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === MAIN PAGE CONTENT ===

function PredictPageContent() {
  const {
    state,
    setProvince,
    setMonth,
    setScenario,
    initializeRiskScores,
    generatePredictions,
  } = usePrediction();

  const {
    selectedProvince,
    selectedMonth,
    selectedScenario,
    riskScores,
    predictions,
    isLoading,
    error,
  } = state;

  const [selectedType, setSelectedType] = useState<DisasterType | null>(null);
  const [activeTab, setActiveTab] = useState<"map" | "charts" | "calendar">("map");

  // Initialize on mount
  useEffect(() => {
    initializeRiskScores();
  }, []);

  // Re-calculate when month or scenario changes
  useEffect(() => {
    if (riskScores.size > 0) {
      initializeRiskScores();
    }
  }, [selectedMonth, selectedScenario]);

  // Generate predictions when province is selected
  useEffect(() => {
    if (selectedProvince) {
      generatePredictions(selectedProvince);
    }
  }, [selectedProvince]);

  // Get predictions for selected province
  const provincePredictions = useMemo(() => {
    if (!selectedProvince) return [];
    const result: PredictionResult[] = [];
    const types: DisasterType[] = [
      "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
    ];
    for (const type of types) {
      const key = `${selectedProvince}-${type}`;
      const pred = predictions.get(key);
      if (pred) result.push(pred);
    }
    return result;
  }, [selectedProvince, predictions]);

  // Get selected province risk
  const selectedProvinceRisk = useMemo(() => {
    if (!selectedProvince) return null;
    return riskScores.get(selectedProvince) ?? null;
  }, [selectedProvince, riskScores]);

  // High risk provinces
  const highRiskProvinces = useMemo(
    () => getHighRiskProvinces(riskScores, 0.6),
    [riskScores]
  );

  const handleRefresh = useCallback(() => {
    initializeRiskScores();
    if (selectedProvince) {
      generatePredictions(selectedProvince);
    }
  }, [selectedProvince]);

  return (
    <div className="min-h-screen">
      {/* Compact Page Header */}
      <CompactPageHeader
        icon={<Brain className="w-4 h-4" />}
        title="AI Dự đoán Thiên tai"
        subtitle="Mô hình AI dự đoán rủi ro thiên tai theo khu vực, thời gian và kịch bản khí hậu"
        accentColor="#8B5CF6"
        actions={
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        }
      />

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="glass-card px-4 py-3 border border-red-500/20 bg-red-500/5 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <PredictStatsBar
        riskScores={riskScores}
        selectedProvince={selectedProvince}
        selectedScenario={selectedScenario}
        className="mb-6"
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Sidebar - Controls */}
        <motion.div
          className="lg:col-span-3 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Province Selector */}
          <div className="glass-card p-4">
            <ProvinceSelector
              value={selectedProvince}
              onChange={setProvince}
            />
          </div>

          {/* Month Selector */}
          <div className="glass-card p-4">
            <MonthSelector value={selectedMonth} onChange={setMonth} />
          </div>

          {/* Scenario Selector */}
          <div className="glass-card p-4">
            <ScenarioSelector
              value={selectedScenario}
              onChange={setScenario}
            />
          </div>

          {/* Disaster Type Filter */}
          <div className="glass-card p-4">
            <DisasterTypeFilter
              value={selectedType}
              onChange={setSelectedType}
            />
          </div>

          {/* Selected Province Gauge */}
          {selectedProvinceRisk && (
            <div className="glass-card p-4">
              <label className="text-xs text-slate-500 mb-3 block flex items-center gap-1">
                <Info className="w-3 h-3" />
                Tổng rủi ro - {selectedProvince}
              </label>
              <div className="flex justify-center">
                <RiskGauge
                  score={selectedProvinceRisk.overallRisk}
                  size="md"
                  label={selectedProvince ?? undefined}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          className="lg:col-span-9 space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 glass-card w-fit">
            {[
              { id: "map" as const, label: "Bản đồ", icon: <MapPin className="w-3.5 h-3.5" /> },
              { id: "charts" as const, label: "Biểu đồ", icon: <BarChart3 className="w-3.5 h-3.5" /> },
              { id: "calendar" as const, label: "Mùa vụ", icon: <Calendar className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                  : "text-slate-500 hover:text-slate-400"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Map View */}
          <AnimatePresence mode="wait">
            {activeTab === "map" && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <RiskMap
                  riskScores={riskScores}
                  selectedProvince={selectedProvince}
                  selectedMonth={selectedMonth}
                  selectedScenario={selectedScenario}
                  onProvinceSelect={setProvince}
                  className="h-[450px]"
                />
              </motion.div>
            )}

            {activeTab === "charts" && (
              <motion.div
                key="charts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {provincePredictions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {provincePredictions.map((pred) => (
                      <TrendChart
                        key={`${pred.province}-${pred.disasterType}`}
                        data={pred.predictions}
                        disasterType={pred.disasterType}
                        height={260}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">
                        Chọn tỉnh để xem biểu đồ dự đoán
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Biểu đồ sẽ hiển thị xu hướng 6 tháng tới
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SeasonalCalendar
                  province={selectedProvince ?? "Quảng Bình"}
                  selectedMonth={selectedMonth}
                  onMonthSelect={setMonth}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scenario Panel */}
          <ScenarioPanel
            activeScenario={selectedScenario}
            onScenarioChange={setScenario}
            comparisonData={
              selectedProvinceRisk
                ? {
                  normal: selectedProvinceRisk.overallRisk,
                  current: selectedProvinceRisk.overallRisk,
                }
                : undefined
            }
          />

          {/* Province Risk Cards (high risk only) */}
          {highRiskProvinces.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Tỉnh có rủi ro cao cần chú ý
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highRiskProvinces.map((risk) => (
                  <ProvinceRiskCard
                    key={risk.province}
                    provinceRisk={risk}
                    isExpanded={risk.province === selectedProvince}
                    onToggle={() =>
                      setProvince(
                        risk.province === selectedProvince
                          ? null
                          : risk.province
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Section - Province Rankings + External Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* Province Rankings */}
        <motion.div
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ProvinceRiskList
            riskScores={riskScores}
            selectedProvince={selectedProvince}
            onProvinceSelect={setProvince}
          />
        </motion.div>

        {/* External Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ExternalAlertsPanel />
        </motion.div>
      </div>

      {/* Footer Info */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-[10px] text-slate-700">
          Mô hình AI: INFORM Risk Index + Statistical Engine (MA/LR/Seasonal) + TensorFlow.js LSTM
          | Dữ liệu: EM-DAT, MARD, ReliefWeb, GDACS, USGS, Open-Meteo
          | Độ tin cậy: 75% (Ensemble)
        </p>
      </motion.div>
    </div>
  );
}

// === PAGE WRAPPER ===

export default function PredictPage() {
  return (
    <PredictionProvider>
      <div className="min-h-screen p-4 md:p-6 relative">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-purple-600/3 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] bg-blue-600/3 rounded-full blur-[120px] pointer-events-none" />
        <PredictPageContent />
      </div>
    </PredictionProvider>
  );
}
