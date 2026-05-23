"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { recentDisasters, sosAlerts } from "@/data/disaster-data";
import MapStatsBar from "@/features/map-disaster/ui/MapStatsBar";
import TileToggle from "@/features/map-disaster/ui/TileToggle";
import { TILE_OPTIONS, type TileMode } from "@/features/map-disaster/config/map-config";
import IntroSection from "@/components/shared/IntroSection";
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
    <div className="min-h-screen bg-aurora pb-24">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section */}
        <IntroSection
          moduleNumber="1"
          icon={<MapIcon className="w-4 h-4" />}
          title="Giám sát Thiên tai Thời gian Thực"
          subtitle="Theo dõi 63 tỉnh thành với heatmap, markers, và dữ liệu thời tiết real-time. Click vào marker để xem chi tiết sự kiện."
          accentColor="#3B82F6"
          guideSteps={[
            { icon: <MousePointerClick className="w-3.5 h-3.5" />, text: "Click marker để xem chi tiết sự kiện" },
            { icon: <Clock className="w-3.5 h-3.5" />, text: "Kéo timeline để xem diễn biến theo thời gian" },
            { icon: <LayersIcon className="w-3.5 h-3.5" />, text: "Bật/tắt Heatmap, Markers, Choropleth, Thời tiết" },
            { icon: <MapIcon className="w-3.5 h-3.5" />, text: "Chuyển đổi: Sáng / Tối / Vệ tinh" },
          ]}
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

      {/* Cross-links: Bước tiếp theo */}
      <ScrollReveal delay={300}>
      <div className="mt-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-700/30">
        <h4 className="text-xs font-semibold text-slate-300 mb-3">Bước tiếp theo</h4>
        <div className="flex flex-wrap gap-2">
          <Link href="/predict" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 text-xs hover:border-blue-500/40 hover:text-blue-400 transition-colors">
            <Brain className="w-3.5 h-3.5" /> Xem dự đoán cho khu vực này <ArrowRight className="w-3 h-3" />
          </Link>
          <Link href="/report" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 text-xs hover:border-green-500/40 hover:text-green-400 transition-colors">
            <Users className="w-3.5 h-3.5" /> Gửi báo cáo thiên tai <ArrowRight className="w-3 h-3" />
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 text-xs hover:border-cyan-500/40 hover:text-cyan-400 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" /> Xem thống kê <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}
