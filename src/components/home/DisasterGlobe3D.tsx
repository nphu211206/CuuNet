"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { recentDisasters } from "@/data/disaster-data";
import { worldDisasters } from "@/data/world-disaster-data";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const VN_POINTS = recentDisasters.map((d) => ({
    lat: d.location.lat,
    lng: d.location.lng,
    type: d.type,
    severity: d.severity,
    label: `${d.location.province} — ${d.title}`,
    size: d.severity === "critical" ? 0.6 : d.severity === "high" ? 0.45 : 0.3,
    color: d.severity === "critical" ? "#FF4757" : d.severity === "high" ? "#FF6B6B" : d.severity === "medium" ? "#FFB800" : "#00D68F",
    people: d.affectedPeople >= 1000000
        ? `${(d.affectedPeople / 1000000).toFixed(1)}M`
        : d.affectedPeople >= 1000
            ? `${(d.affectedPeople / 1000).toFixed(0)}K`
            : `${d.affectedPeople}`,
}));

const WORLD_POINTS = worldDisasters.slice(0, 15).map((d) => ({
    lat: d.location.lat,
    lng: d.location.lng,
    type: d.type,
    severity: d.severity,
    label: `${d.location.province} — ${d.title}`,
    size: d.severity === "critical" ? 0.5 : d.severity === "high" ? 0.35 : 0.25,
    color: d.severity === "critical" ? "#FF4757" : d.severity === "high" ? "#FF6B6B" : d.severity === "medium" ? "#FFB800" : "#00D68F",
    people: d.affectedPeople >= 1000000
        ? `${(d.affectedPeople / 1000000).toFixed(1)}M`
        : d.affectedPeople >= 1000
            ? `${(d.affectedPeople / 1000).toFixed(0)}K`
            : `${d.affectedPeople}`,
}));

const ALL_POINTS = [...VN_POINTS, ...WORLD_POINTS];

const ARCS = [
    { startLat: 21.03, startLng: 105.85, endLat: 21.33, endLng: 103.91, color: "#3B82F6" },
    { startLat: 12.71, startLng: 108.23, endLat: 20.84, endLng: 106.69, color: "#FF6B6B" },
    { startLat: 10.82, startLng: 106.63, endLat: 17.47, endLng: 106.62, color: "#FFB800" },
    { startLat: 37.17, startLng: 37.03, endLat: 30.38, endLng: 69.35, color: "#EF4444" },
    { startLat: 39.9, startLng: 116.4, endLat: 15.5, endLng: 121.0, color: "#8B5CF6" },
];

function createTooltipHTML(point: any) {
    const icon = point.type === "flood" ? "🌊" : point.type === "storm" ? "🌪️" : point.type === "landslide" ? "⛰️" : point.type === "drought" ? "☀️" : "🏔️";
    const sevLabel = point.severity === "critical" ? "KHẨN CẤP" : point.severity === "high" ? "NGUY HIỂM" : "CẢNH BÁO";
    return `<div style="font-family:Inter,system-ui,sans-serif;padding:12px 16px;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.12);min-width:180px;pointer-events:none"><div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:16px">${icon}</span><span style="font-size:12px;font-weight:700;color:#0F172A;line-height:1.3">${point.label}</span></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;background:${point.color}15;color:${point.color}">${sevLabel}</span><span style="font-size:10px;color:#64748B">${point.people} người</span></div></div>`;
}

// Vietnam label data for globe
const VN_LABELS = [
    { lat: 16.0, lng: 108.0, text: "VIỆT NAM", size: 1.2, color: "#0066FF" },
];

export default function DisasterGlobe3D() {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const pointData = useMemo(() =>
        ALL_POINTS.map((p) => ({ ...p, altitude: 0.01, radius: p.size })), []);

    const arcData = useMemo(() =>
        ARCS.map((a) => ({
            ...a, altitude: 0.2, arcDashLength: 0.4, arcDashGap: 0.2,
            arcDashInitialGap: Math.random(), arcDashAnimateTime: 2000, stroke: 0.8,
        })), []);

    const labelData = useMemo(() => VN_LABELS, []);

    if (!isMounted) return null;

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-aurora" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[200px]" />

            <div className="max-w-7xl mx-auto relative">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">
                        🌍 Giám sát Toàn cầu
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        Bản đồ Thiên tai <span className="text-gradient-flow">Thời gian Thực</span>
                    </h2>
                    <p className="text-base text-slate-600 max-w-xl mx-auto">
                        Kéo để xoay • Hover marker để xem chi tiết • Cuộn để zoom
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto" style={{ height: "65vh", maxHeight: "700px", maxWidth: "1000px" }}>
                    <Globe
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        backgroundImageUrl=""
                        backgroundColor="rgba(0,0,0,0)"
                        showAtmosphere={true}
                        atmosphereColor="#4A90D9"
                        atmosphereAltitude={0.15}
                        pointsData={pointData}
                        pointLat="lat"
                        pointLng="lng"
                        pointColor="color"
                        pointAltitude="altitude"
                        pointRadius="radius"
                        pointsMerge={false}
                        pointLabel={(d: any) => createTooltipHTML(d)}
                        labelsData={labelData}
                        labelLat="lat"
                        labelLng="lng"
                        labelText="text"
                        labelSize="size"
                        labelColor="color"
                        labelAltitude={0.02}
                        labelResolution={2}
                        arcsData={arcData}
                        arcColor="color"
                        arcDashLength="arcDashLength"
                        arcDashGap="arcDashGap"
                        arcDashInitialGap="arcDashInitialGap"
                        arcDashAnimateTime="arcDashAnimateTime"
                        arcStroke="stroke"
                    />

                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-700">{ALL_POINTS.length} sự kiện đang theo dõi</span>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500">Dữ liệu: USGS • ReliefWeb • GDACS</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-wrap justify-center gap-4 mt-8">
                    {[{ color: "#FF4757", label: "Khẩn cấp" }, { color: "#FF6B6B", label: "Nguy hiểm" }, { color: "#FFB800", label: "Cảnh báo" }, { color: "#00D68F", label: "Theo dõi" }].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}