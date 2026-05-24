"use client";

import { useEffect, useRef, useMemo } from "react";
import Globe from "globe.gl";
import { recentDisasters } from "@/data/disaster-data";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#d97706",
  low: "#16a34a",
};

export default function GlobeVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  const disasterPoints = useMemo(() => {
    return recentDisasters
      .filter((d) => d.status === "active" || d.status === "monitoring")
      .map((d) => ({
        lat: d.location.lat,
        lng: d.location.lng,
        size: d.severity === "critical" ? 0.4 : d.severity === "high" ? 0.3 : 0.2,
        color: SEVERITY_COLORS[d.severity] || "#3B82F6",
        title: d.title,
        province: d.location.province,
        severity: d.severity,
        affected: d.affectedPeople,
        type: d.type,
      }));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || globeRef.current) return;

    // Check reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const globe = new Globe(container)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .atmosphereColor("rgba(59,130,246,0.3)")
      .atmosphereAltitude(0.25)
      // Points layer
      .pointsData(disasterPoints)
      .pointLat("lat")
      .pointLng("lng")
      .pointColor("color")
      .pointAltitude(0.02)
      .pointRadius("size")
      .pointsMerge(false)
      .pointLabel(
        (d: any) =>
          `<div style="
            background: rgba(15,23,42,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid ${d.color}40;
            border-radius: 12px;
            padding: 12px 16px;
            color: #f8fafc;
            font-family: 'Inter', sans-serif;
            min-width: 200px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          ">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="
                width:8px;height:8px;border-radius:50%;
                background:${d.color};
                box-shadow: 0 0 8px ${d.color};
              "></span>
              <strong style="font-size:13px;">${d.title}</strong>
            </div>
            <div style="font-size:11px;color:#94a3b8;">
              📍 ${d.province} · ${d.affected > 0 ? (d.affected / 1000).toFixed(0) + "K người" : "Chưa xác định"}
            </div>
          </div>`
      )
      // Rings layer (pulse effect for critical)
      .ringsData(disasterPoints.filter((d) => d.severity === "critical"))
      .ringLat("lat")
      .ringLng("lng")
      .ringColor(() => (t: number) => `rgba(220,38,38,${1 - t})`)
      .ringMaxRadius(2)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1200);

    // Camera - focus on Vietnam
    globe.pointOfView({ lat: 16.0, lng: 108.0, altitude: 2.5 }, 0);

    // Auto-rotate
    if (!mq.matches) {
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.3;
    }
    globe.controls().enableZoom = true;
    globe.controls().enablePan = false;
    globe.controls().minDistance = 1.5;
    globe.controls().maxDistance = 5;

    // Renderer settings
    const renderer = globe.renderer();
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    globeRef.current = globe;

    // Resize handler
    const handleResize = () => {
      globe.width(container.clientWidth);
      globe.height(container.clientHeight);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [disasterPoints]);

  return (
    <section className="py-20 px-6 relative overflow-hidden bg-[#0c1222]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-[#0c1222] to-[#0c1222]" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-400 uppercase tracking-widest mb-4">
            🌍 Giám sát Toàn cầu
          </span>
          <h2
            className="text-3xl md:text-4xl font-black text-white mb-3"
            style={{ fontFamily: "var(--font-heading, inherit)" }}
          >
            Thiên tai đang theo dõi
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            {disasterPoints.length} sự kiện active/monitoring trên {new Set(disasterPoints.map((d) => d.province)).size} tỉnh thành
          </p>
        </div>

        {/* Globe */}
        <div className="relative">
          <div
            ref={containerRef}
            className="w-full rounded-2xl overflow-hidden border border-slate-700/30"
            style={{ height: "60vh", minHeight: "450px" }}
          />

          {/* Stats overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3 justify-center">
            {[
              { label: "Critical", count: disasterPoints.filter((d) => d.severity === "critical").length, color: "#dc2626" },
              { label: "High", count: disasterPoints.filter((d) => d.severity === "high").length, color: "#f97316" },
              { label: "Medium", count: disasterPoints.filter((d) => d.severity === "medium").length, color: "#d97706" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 text-xs"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}
                />
                <span className="text-slate-400">{s.label}:</span>
                <span className="font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600" /> Critical
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Medium
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600" /> Low
          </span>
          <span className="text-slate-600">|</span>
          <span>Kéo để xoay · Scroll để zoom · Hover để xem chi tiết</span>
        </div>
      </div>
    </section>
  );
}