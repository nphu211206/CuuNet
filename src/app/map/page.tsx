"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { recentDisasters, sosAlerts } from "@/data/disaster-data";
import MapStatsBar from "@/features/map-disaster/ui/MapStatsBar";
import TileToggle from "@/features/map-disaster/ui/TileToggle";
import { TILE_OPTIONS, type TileMode } from "@/features/map-disaster/config/map-config";
import CompactPageHeader from "@/components/shared/CompactPageHeader";
import ScrollReveal from "@/components/shared/ScrollReveal";
import MapSearchBar from "@/features/map-disaster/ui/MapSearchBar";
import { SkeletonMap, SkeletonStatBar } from "@/components/shared/Skeleton";
import { Brain, Users, BarChart3, ArrowRight, Map as MapIcon, MousePointerClick, Clock, Layers as LayersIcon, Filter, X, TrendingUp, AlertTriangle, Droplets, Wind, Mountain, Thermometer } from "lucide-react";

const DisasterMap = dynamic(
  () => import("@/features/map-disaster/ui/DisasterMap"),
  {
    ssr: false,
    loading: () => <SkeletonMap height="600px" />,
  }
);

const TimelineSlider = dynamic(
  () => import("@/features/map-disaster/ui/TimelineSlider"),
  {
    ssr: false,
  }
);

const QUICK_FILTERS = [
  { type: "all" as const, label: "Tất cả", icon: <LayersIcon className="w-3.5 h-3.5" />, color: "#3B82F6" },
  { type: "flood" as const, label: "Lũ lụt", icon: <Droplets className="w-3.5 h-3.5" />, color: "#3B82F6" },
  { type: "storm" as const, label: "Bão", icon: <Wind className="w-3.5 h-3.5" />, color: "#8B5CF6" },
  { type: "landslide" as const, label: "Sạt lở", icon: <Mountain className="w-3.5 h-3.5" />, color: "#92400E" },
  { type: "drought" as const, label: "Hạn hán", icon: <Thermometer className="w-3.5 h-3.5" />, color: "#F59E0B" },
];

export default function MapPage() {
  const [filteredByTime, setFilteredByTime] = useState(recentDisasters);
  const [tileMode, setTileMode] = useState<TileMode>("light");
  const [quickFilter, setQuickFilter] = useState<string>("all");
  const [selectedDisaster, setSelectedDisaster] = useState<typeof recentDisasters[0] | null>(null);

  const stats = useMemo(() => {
    const active = recentDisasters.filter((d) => d.status === "active").length;
    const monitoring = recentDisasters.filter(
      (d) => d.status === "monitoring"
    ).length;
    const provinces = new Set(
      recentDisasters.map((d) => d.location.province)
    ).size;
    const affected = recentDisasters.reduce(
      (sum, d) => sum + d.affectedPeople,
      0
    );
    const activeSOS = sosAlerts.filter((s) => s.status === "active").length;

    return { active, monitoring, provinces, affected, activeSOS };
  }, []);

  const handleFilterByTime = useCallback((disasters: typeof recentDisasters) => {
    setFilteredByTime(disasters);
  }, []);

  return (
    <div className="min-h-screen bg-aurora pb-24 relative">
      {/* Aurora background accent */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[300px] bg-cyan-600/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Page Header */}
        <CompactPageHeader
          icon={<MapIcon className="w-4 h-4" />}
          title="Giám sát Thiên tai Thời gian Thực"
          subtitle="Theo dõi 63 tỉnh thành với heatmap, markers, và dữ liệu thời tiết real-time."
          accentColor="#3B82F6"
        />

        {/* Stats Bar */}
        <ScrollReveal delay={100} className="mb-6">
          <MapStatsBar
            activeDisasters={stats.active}
            monitoringDisasters={stats.monitoring}
            affectedProvinces={stats.provinces}
            totalAffected={stats.affected}
            sosCount={stats.activeSOS}
          />
        </ScrollReveal>

        {/* Quick Filters */}
        <ScrollReveal delay={150} className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.type}
                onClick={() => setQuickFilter(f.type)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${quickFilter === f.type
                    ? "bg-blue-500/15 text-blue-600 border-blue-200 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-slate-400 hidden sm:block">
              {quickFilter === "all" ? filteredByTime.length : filteredByTime.filter((d) => d.type === quickFilter).length} sự kiện
            </span>
          </div>
        </ScrollReveal>

        {/* Map + Sidebar Layout */}
        <div className="flex gap-4">
          {/* Map Container */}
          <div className="relative flex-1 h-[65vh] min-h-[550px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <DisasterMap
              disasters={quickFilter === "all" ? filteredByTime : filteredByTime.filter((d) => d.type === quickFilter)}
              tileMode={tileMode}
            />
            <TileToggle currentMode={tileMode} onModeChange={setTileMode} />
            <MapSearchBar onProvinceSelect={(p) => { }} />
          </div>

          {/* Sidebar Detail Panel */}
          <div className="hidden lg:block w-80 shrink-0 space-y-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-700">Live — Cập nhật 2 phút trước</span>
            </div>

            {/* Recent events list */}
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Sự kiện gần đây</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">{stats.active} hoạt động</span>
              </div>
              <div className="max-h-[45vh] overflow-y-auto">
                {filteredByTime.slice(0, 8).map((d, i) => {
                  const icon = d.type === "flood" ? "🌊" : d.type === "storm" ? "🌪️" : d.type === "landslide" ? "⛰️" : d.type === "drought" ? "☀️" : "🏔️";
                  const sevColor = d.severity === "critical" ? "#EF4444" : d.severity === "high" ? "#F97316" : d.severity === "medium" ? "#F59E0B" : "#22C55E";
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDisaster(selectedDisaster?.id === d.id ? null : d)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-slate-50 last:border-0 ${selectedDisaster?.id === d.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                        }`}
                    >
                      <span className="text-base mt-0.5 shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-900 truncate">{d.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{d.location.province} • {(d.affectedPeople / 1000).toFixed(0)}K người</p>
                      </div>
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: sevColor }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected event detail */}
            {selectedDisaster && (
              <div className="rounded-xl bg-white border border-blue-200 shadow-sm overflow-hidden">
                <div className="px-3 py-2.5 border-b border-blue-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700">Chi tiết sự kiện</span>
                  <button onClick={() => setSelectedDisaster(null)} className="p-0.5 rounded text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedDisaster.type === "flood" ? "🌊" : selectedDisaster.type === "storm" ? "🌪️" : selectedDisaster.type === "landslide" ? "⛰️" : "☀️"}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedDisaster.title}</p>
                      <p className="text-[9px] text-slate-500">{selectedDisaster.location.province}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="font-semibold" style={{ color: selectedDisaster.status === "active" ? "#EF4444" : selectedDisaster.status === "monitoring" ? "#F59E0B" : "#22C55E" }}>
                        {selectedDisaster.status === "active" ? "Đang hoạt động" : selectedDisaster.status === "monitoring" ? "Đang theo dõi" : "Đã giải quyết"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Ảnh hưởng:</span>
                      <span className="font-semibold text-slate-700">{(selectedDisaster.affectedPeople / 1000).toFixed(0)}K người</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Mức độ:</span>
                      <span className="font-semibold" style={{ color: selectedDisaster.severity === "critical" ? "#EF4444" : "#F59E0B" }}>
                        {selectedDisaster.severity === "critical" ? "KHẨN CẤP" : selectedDisaster.severity === "high" ? "NGUY HIỂM" : "CẢNH BÁO"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{selectedDisaster.description}</p>
                  <Link href="/alerts" className="block text-center text-[10px] text-blue-600 font-semibold hover:underline mt-2">
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Slider */}
      <ScrollReveal delay={200}>
        <TimelineSlider
          disasters={recentDisasters}
          onFilterByTime={handleFilterByTime}
        />

      </ScrollReveal>

    </div>
  );
}
