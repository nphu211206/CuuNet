"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { recentDisasters } from "@/data/disaster-data";
import { TrendingUp, MapPin, Users, AlertTriangle, ChevronRight } from "lucide-react";

interface ProvinceRisk {
    name: string;
    risk: number;
    events: number;
    affected: number;
    topThreat: string;
    icon: string;
}

const PROVINCE_DATA: ProvinceRisk[] = [
    { name: "Quảng Bình", risk: 92, events: 3, affected: 180000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Lào Cai", risk: 90, events: 2, affected: 45000, topThreat: "Sạt lở", icon: "⛰️" },
    { name: "Sơn La", risk: 88, events: 3, affected: 28000, topThreat: "Sạt lở", icon: "⛰️" },
    { name: "Hà Nội", risk: 85, events: 3, affected: 120000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Thừa Thiên Huế", risk: 84, events: 3, affected: 120000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Quảng Trị", risk: 82, events: 2, affected: 45000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Hà Giang", risk: 80, events: 2, affected: 20000, topThreat: "Sạt lở", icon: "⛰️" },
    { name: "Nghệ An", risk: 78, events: 3, affected: 180000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Thanh Hóa", risk: 76, events: 3, affected: 200000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Hải Phòng", risk: 75, events: 2, affected: 500000, topThreat: "Triều cường", icon: "🌊" },
    { name: "Phú Thọ", risk: 74, events: 2, affected: 80000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Hà Tĩnh", risk: 72, events: 2, affected: 95000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "TP. Hồ Chí Minh", risk: 70, events: 2, affected: 200000, topThreat: "Ngập úng", icon: "💧" },
    { name: "Quảng Nam", risk: 68, events: 2, affected: 90000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Cần Thơ", risk: 67, events: 2, affected: 85000, topThreat: "Triều cường", icon: "🌊" },
    { name: "An Giang", risk: 65, events: 2, affected: 120000, topThreat: "Lũ lụt", icon: "🌊" },
    { name: "Đắk Lắk", risk: 64, events: 2, affected: 80000, topThreat: "Hạn hán", icon: "☀️" },
    { name: "Quảng Ngãi", risk: 63, events: 2, affected: 65000, topThreat: "Bão", icon: "🌪️" },
    { name: "Bình Định", risk: 62, events: 2, affected: 85000, topThreat: "Bão", icon: "🌪️" },
    { name: "Khánh Hòa", risk: 60, events: 2, affected: 55000, topThreat: "Bão", icon: "🌪️" },
];

function getRiskColor(risk: number): string {
    if (risk >= 80) return "#EF4444";
    if (risk >= 65) return "#F97316";
    if (risk >= 50) return "#EAB308";
    return "#22C55E";
}

function getRiskBg(risk: number): string {
    if (risk >= 80) return "rgba(239,68,68,0.1)";
    if (risk >= 65) return "rgba(249,115,22,0.1)";
    if (risk >= 50) return "rgba(234,179,8,0.1)";
    return "rgba(34,197,94,0.1)";
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
}

export default function ProvinceRiskRanking() {
    const router = useRouter();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const stats = useMemo(() => ({
        totalProvinces: PROVINCE_DATA.length,
        highRisk: PROVINCE_DATA.filter(p => p.risk >= 80).length,
        totalAffected: PROVINCE_DATA.reduce((s, p) => s + p.affected, 0),
        totalEvents: PROVINCE_DATA.reduce((s, p) => s + p.events, 0),
    }), []);

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-aurora" />

            <div className="max-w-6xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600 uppercase tracking-widest mb-4">
                        📊 Phân tích Rủi ro
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        Xếp hạng <span className="text-gradient-flow">Rủi ro</span> Tỉnh thành
                    </h2>
                    <p className="text-base text-slate-600 max-w-xl mx-auto">
                        Top 20 tỉnh có rủi ro thiên tai cao nhất — Dựa trên dữ liệu EM-DAT & MARD
                    </p>
                </motion.div>

                {/* Stats summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
                >
                    {[
                        { label: "Tỉnh theo dõi", value: stats.totalProvinces.toString(), icon: <MapPin className="w-4 h-4" />, color: "#3B82F6" },
                        { label: "Rủi ro cao", value: stats.highRisk.toString(), icon: <AlertTriangle className="w-4 h-4" />, color: "#EF4444" },
                        { label: "Tổng sự kiện", value: stats.totalEvents.toString(), icon: <TrendingUp className="w-4 h-4" />, color: "#F59E0B" },
                        { label: "Ảnh hưởng", value: formatNumber(stats.totalAffected), icon: <Users className="w-4 h-4" />, color: "#8B5CF6" },
                    ].map((stat) => (
                        <div key={stat.label} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}12`, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div>
                                <span className="text-xl font-bold block" style={{ color: stat.color }}>{stat.value}</span>
                                <span className="text-[10px] text-slate-500">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Risk ranking bars */}
                <div className="space-y-2">
                    {PROVINCE_DATA.map((province, i) => (
                        <motion.div
                            key={province.name}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => router.push(`/predict?province=${encodeURIComponent(province.name)}`)}
                            className="group relative flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                        >
                            {/* Rank */}
                            <span className="w-7 text-center text-sm font-bold tabular-nums" style={{ color: i < 3 ? getRiskColor(province.risk) : "#94A3B8" }}>
                                {i + 1}
                            </span>

                            {/* Province info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm">{province.icon}</span>
                                    <span className="text-sm font-semibold text-slate-900 truncate">{province.name}</span>
                                    <span className="text-[10px] text-slate-400 hidden sm:inline">• {province.topThreat}</span>
                                </div>

                                {/* Risk bar */}
                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${province.risk}%` }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.04 + 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: getRiskColor(province.risk) }}
                                    />
                                    {/* Shimmer effect on hover */}
                                    {hoveredIndex === i && (
                                        <motion.div
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-[11px] shrink-0">
                                <div className="text-center hidden md:block">
                                    <span className="block font-bold tabular-nums" style={{ color: getRiskColor(province.risk) }}>{province.risk}%</span>
                                    <span className="text-[9px] text-slate-400">Rủi ro</span>
                                </div>
                                <div className="text-center hidden md:block">
                                    <span className="block font-semibold text-slate-700">{province.events}</span>
                                    <span className="text-[9px] text-slate-400">Sự kiện</span>
                                </div>
                                <div className="text-center hidden lg:block">
                                    <span className="block font-semibold text-slate-700">{formatNumber(province.affected)}</span>
                                    <span className="text-[9px] text-slate-400">Ảnh hưởng</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0066FF] transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-[10px] text-slate-400 mt-6"
                >
                    Dữ liệu: EM-DAT • MARD • USGS • ReliefWeb | Cập nhật: Tháng 5/2026 | Click tỉnh để xem dự đoán AI
                </motion.p>
            </div>
        </section>
    );
}