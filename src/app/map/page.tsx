"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { recentDisasters, sosAlerts } from "@/data/disaster-data";
import MapStatsBar from "@/features/map-disaster/ui/MapStatsBar";

const DisasterMap = dynamic(
  () => import("@/features/map-disaster/ui/DisasterMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-slate-900/50 rounded-2xl border border-slate-800/50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Đang tải bản đồ...</p>
        </div>
      </div>
    ),
  }
);

const TimelineSlider = dynamic(
  () => import("@/features/map-disaster/ui/TimelineSlider"),
  {
    ssr: false,
  }
);

export default function MapPage() {
  const [filteredByTime, setFilteredByTime] = useState(recentDisasters);

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
    <div className="min-h-screen bg-aurora pb-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Bản đồ Thiên tai</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Giám sát thiên tai real-time trên toàn lãnh thổ Việt Nam
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-6">
          <MapStatsBar
            activeDisasters={stats.active}
            monitoringDisasters={stats.monitoring}
            affectedProvinces={stats.provinces}
            totalAffected={stats.affected}
            sosCount={stats.activeSOS}
          />
        </div>

        {/* Map Container */}
        <div className="h-[65vh] min-h-[550px]">
          <DisasterMap disasters={filteredByTime} />
        </div>
      </div>

      {/* Timeline Slider */}
      <TimelineSlider
        disasters={recentDisasters}
        onFilterByTime={handleFilterByTime}
      />
    </div>
  );
}
