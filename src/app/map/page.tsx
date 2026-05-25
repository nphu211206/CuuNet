"use client";

import { useMemo, useState, useCallback } from "react";
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
import { Brain, Users, BarChart3, ArrowRight, Map as MapIcon, MousePointerClick, Clock, Layers as LayersIcon } from "lucide-react";

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

export default function MapPage() {
  const [filteredByTime, setFilteredByTime] = useState(recentDisasters);
  const [tileMode, setTileMode] = useState<TileMode>("light");

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

        {/* Map Container */}
        <div className="relative h-[65vh] min-h-[550px]">
          <DisasterMap disasters={filteredByTime} tileMode={tileMode} />
          <TileToggle currentMode={tileMode} onModeChange={setTileMode} />
          <MapSearchBar onProvinceSelect={(p) => {
            // Future: fly map to province
          }} />
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
