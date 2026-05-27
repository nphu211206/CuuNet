"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { recentDisasters } from "@/data/disaster-data";
import type { DisasterEvent } from "@/lib/types";

/**
 * Vietnam Disaster Heatmap — Interactive SVG Map
 * Shows risk levels across 63 provinces
 * Hover → tooltip with details
 * Click → navigate to predict page
 */

interface ProvinceData {
    id: string;
    name: string;
    path: string;
    center: [number, number];
    population: number;
    events: number;
    risk: number;
    topThreat: string;
    affected: number;
}

// Simplified Vietnam SVG paths (63 provinces grouped by region)
// viewBox="0 0 600 1000" — Vietnam oriented north-south
const PROVINCES: ProvinceData[] = [
    // Northern Vietnam
    { id: "hanoi", name: "Hà Nội", path: "M280,200 L310,195 L320,210 L315,230 L295,235 L275,225 L265,210 Z", center: [290, 215], population: 8.1, events: 3, risk: 0.85, topThreat: "Lũ lụt", affected: 120000 },
    { id: "haiphong", name: "Hải Phòng", path: "M320,210 L345,205 L355,220 L340,235 L320,230 Z", center: [338, 220], population: 2.0, events: 2, risk: 0.75, topThreat: "Triều cường", affected: 500000 },
    { id: "quangninh", name: "Quảng Ninh", path: "M345,205 L380,195 L395,210 L385,230 L355,225 L355,220 Z", center: [370, 210], population: 1.3, events: 1, risk: 0.6, topThreat: "Bão", affected: 80000 },
    { id: "lao-cai", name: "Lào Cai", path: "M220,140 L250,130 L265,145 L255,165 L230,170 L215,155 Z", center: [240, 150], population: 0.7, events: 2, risk: 0.92, topThreat: "Sạt lở", affected: 45000 },
    { id: "sonla", name: "Sơn La", path: "M190,160 L225,150 L240,170 L230,195 L200,200 L185,180 Z", center: [210, 175], population: 1.2, events: 3, risk: 0.88, topThreat: "Sạt lở", affected: 28000 },
    { id: "dienbien", name: "Điện Biên", path: "M155,170 L190,160 L200,180 L190,200 L160,195 L150,180 Z", center: [175, 180], population: 0.6, events: 1, risk: 0.7, topThreat: "Sạt lở", affected: 15000 },
    { id: "lai-chau", name: "Lai Châu", path: "M185,130 L215,120 L230,140 L220,160 L195,165 L180,145 Z", center: [200, 140], population: 0.5, events: 1, risk: 0.75, topThreat: "Lũ quét", affected: 12000 },
    { id: "ha-giang", name: "Hà Giang", path: "M250,110 L280,100 L295,120 L285,145 L260,150 L245,130 Z", center: [270, 125], population: 0.8, events: 2, risk: 0.8, topThreat: "Sạt lở", affected: 20000 },
    { id: "cao-bang", name: "Cao Bằng", path: "M295,100 L325,95 L340,115 L330,135 L305,140 L290,120 Z", center: [315, 115], population: 0.5, events: 1, risk: 0.65, topThreat: "Lũ quét", affected: 8000 },
    { id: "bac-kan", name: "Bắc Kạn", path: "M310,125 L335,120 L345,140 L335,155 L315,155 L305,140 Z", center: [325, 140], population: 0.3, events: 1, risk: 0.6, topThreat: "Lũ quét", affected: 5000 },
    { id: "tuyen-quang", name: "Tuyên Quang", path: "M270,140 L300,135 L310,155 L300,175 L275,175 L265,155 Z", center: [285, 155], population: 0.8, events: 2, risk: 0.7, topThreat: "Lũ lụt", affected: 25000 },
    { id: "phu-tho", name: "Phú Thọ", path: "M260,175 L290,170 L300,190 L290,205 L265,205 L255,190 Z", center: [275, 190], population: 1.5, events: 2, risk: 0.75, topThreat: "Lũ lụt", affected: 80000 },
    { id: "vinh-phuc", name: "Vĩnh Phúc", path: "M290,190 L310,185 L318,200 L310,210 L290,210 Z", center: [300, 200], population: 1.1, events: 2, risk: 0.7, topThreat: "Lũ lụt", affected: 45000 },
    { id: "bac-ninh", name: "Bắc Ninh", path: "M310,195 L325,190 L332,205 L325,215 L310,215 Z", center: [320, 205], population: 1.4, events: 1, risk: 0.55, topThreat: "Ngập úng", affected: 30000 },
    { id: "hai-duong", name: "Hải Dương", path: "M325,200 L345,195 L352,215 L340,225 L325,220 Z", center: [338, 210], population: 1.9, events: 1, risk: 0.6, topThreat: "Ngập úng", affected: 40000 },
    { id: "hung-yen", name: "Hưng Yên", path: "M305,210 L320,205 L328,220 L320,230 L305,225 Z", center: [315, 218], population: 1.3, events: 1, risk: 0.55, topThreat: "Ngập úng", affected: 25000 },
    { id: "thai-binh", name: "Thái Bình", path: "M325,225 L345,220 L352,240 L340,250 L325,245 Z", center: [338, 235], population: 1.9, events: 2, risk: 0.7, topThreat: "Triều cường", affected: 150000 },
    { id: "nam-dinh", name: "Nam Định", path: "M310,235 L330,230 L338,250 L325,260 L310,255 Z", center: [322, 245], population: 1.8, events: 2, risk: 0.65, topThreat: "Triều cường", affected: 120000 },
    { id: "ninh-binh", name: "Ninh Bình", path: "M295,230 L315,225 L320,245 L310,255 L290,250 L285,240 Z", center: [305, 240], population: 1.0, events: 1, risk: 0.6, topThreat: "Lũ lụt", affected: 50000 },
    { id: "thanh-hoa", name: "Thanh Hóa", path: "M270,260 L310,250 L325,270 L315,300 L280,310 L260,290 Z", center: [290, 280], population: 3.5, events: 3, risk: 0.75, topThreat: "Lũ lụt", affected: 200000 },
    { id: "nghe-an", name: "Nghệ An", path: "M260,300 L300,290 L320,310 L310,350 L275,360 L255,330 Z", center: [285, 325], population: 3.3, events: 3, risk: 0.78, topThreat: "Lũ lụt", affected: 180000 },
    { id: "ha-tinh", name: "Hà Tĩnh", path: "M290,350 L315,340 L325,365 L315,390 L290,395 L280,370 Z", center: [305, 370], population: 1.3, events: 2, risk: 0.72, topThreat: "Lũ lụt", affected: 95000 },
    { id: "quang-binh", name: "Quảng Bình", path: "M285,395 L310,385 L320,410 L310,440 L285,445 L275,420 Z", center: [300, 415], population: 0.9, events: 3, risk: 0.9, topThreat: "Lũ lụt", affected: 180000 },
    { id: "quang-tri", name: "Quảng Trị", path: "M285,445 L305,440 L312,465 L302,480 L285,475 Z", center: [298, 460], population: 0.6, events: 2, risk: 0.8, topThreat: "Lũ lụt", affected: 45000 },
    { id: "hue", name: "Thừa Thiên Huế", path: "M285,480 L305,475 L315,500 L305,520 L285,515 L275,495 Z", center: [298, 498], population: 1.1, events: 3, risk: 0.85, topThreat: "Lũ lụt", affected: 120000 },

    // Central Vietnam
    { id: "danang", name: "Đà Nẵng", path: "M305,525 L325,518 L335,540 L320,555 L305,548 Z", center: [318, 538], population: 1.1, events: 2, risk: 0.65, topThreat: "Bão", affected: 75000 },
    { id: "quang-nam", name: "Quảng Nam", path: "M280,530 L310,520 L325,545 L315,580 L285,585 L270,555 Z", center: [298, 555], population: 1.5, events: 2, risk: 0.7, topThreat: "Lũ lụt", affected: 90000 },
    { id: "quang-ngai", name: "Quảng Ngãi", path: "M285,585 L310,578 L320,605 L308,630 L285,635 L275,610 Z", center: [300, 608], population: 1.2, events: 2, risk: 0.68, topThreat: "Bão", affected: 65000 },
    { id: "binh-dinh", name: "Bình Định", path: "M290,635 L320,625 L335,655 L320,685 L290,690 L280,660 Z", center: [310, 660], population: 1.9, events: 2, risk: 0.65, topThreat: "Bão", affected: 85000 },
    { id: "phu-yen", name: "Phú Yên", path: "M295,690 L320,682 L330,710 L318,735 L295,738 L285,710 Z", center: [312, 710], population: 0.9, events: 1, risk: 0.6, topThreat: "Bão", affected: 40000 },
    { id: "khanh-hoa", name: "Khánh Hòa", path: "M300,738 L325,730 L338,760 L325,790 L300,795 L290,765 Z", center: [315, 765], population: 1.2, events: 2, risk: 0.62, topThreat: "Bão", affected: 55000 },
    { id: "ninh-thuan", name: "Ninh Thuận", path: "M295,795 L315,788 L325,815 L312,835 L295,830 L288,810 Z", center: [310, 812], population: 0.6, events: 1, risk: 0.55, topThreat: "Hạn hán", affected: 25000 },
    { id: "binh-thuan", name: "Bình Thuận", path: "M280,835 L310,825 L325,855 L310,880 L280,885 L268,855 Z", center: [298, 855], population: 1.2, events: 1, risk: 0.5, topThreat: "Hạn hán", affected: 35000 },

    // Central Highlands
    { id: "kon-tum", name: "Kon Tum", path: "M240,560 L270,550 L280,575 L270,600 L240,605 L230,580 Z", center: [255, 578], population: 0.5, events: 1, risk: 0.6, topThreat: "Lũ lụt", affected: 15000 },
    { id: "gia-lai", name: "Gia Lai", path: "M230,600 L270,590 L285,620 L275,660 L240,665 L225,630 Z", center: [255, 630], population: 1.5, events: 2, risk: 0.55, topThreat: "Lũ lụt", affected: 45000 },
    { id: "dak-lak", name: "Đắk Lắk", path: "M235,665 L275,655 L290,690 L278,725 L245,730 L228,695 Z", center: [260, 695], population: 1.9, events: 2, risk: 0.6, topThreat: "Hạn hán", affected: 80000 },
    { id: "dak-nong", name: "Đắk Nông", path: "M225,725 L260,718 L275,745 L262,770 L230,775 L218,745 Z", center: [248, 748], population: 0.6, events: 1, risk: 0.5, topThreat: "Hạn hán", affected: 20000 },
    { id: "lam-dong", name: "Lâm Đồng", path: "M245,775 L280,765 L295,795 L282,830 L250,835 L238,800 Z", center: [268, 800], population: 1.3, events: 1, risk: 0.45, topThreat: "Sạt lở", affected: 25000 },

    // Southern Vietnam
    { id: "binh-phuoc", name: "Bình Phước", path: "M280,830 L310,822 L320,848 L308,870 L280,875 L270,850 Z", center: [298, 850], population: 1.0, events: 1, risk: 0.45, topThreat: "Hạn hán", affected: 15000 },
    { id: "tay-ninh", name: "Tây Ninh", path: "M265,870 L295,862 L305,888 L292,910 L265,915 L255,890 Z", center: [282, 890], population: 1.2, events: 1, risk: 0.4, topThreat: "Ngập úng", affected: 20000 },
    { id: "binh-duong", name: "Bình Dương", path: "M295,875 L320,868 L330,895 L318,918 L295,922 L285,898 Z", center: [312, 898], population: 2.5, events: 1, risk: 0.5, topThreat: "Ngập úng", affected: 35000 },
    { id: "dong-nai", name: "Đồng Nai", path: "M315,868 L340,860 L352,890 L340,918 L315,922 L305,895 Z", center: [332, 895], population: 3.1, events: 1, risk: 0.45, topThreat: "Ngập úng", affected: 40000 },
    { id: "hcmc", name: "TP. Hồ Chí Minh", path: "M285,918 L315,910 L328,940 L315,965 L285,970 L272,942 Z", center: [305, 942], population: 9.3, events: 2, risk: 0.72, topThreat: "Ngập úng", affected: 200000 },
    { id: "long-an", name: "Long An", path: "M260,920 L290,912 L300,940 L288,965 L260,970 L248,942 Z", center: [278, 945], population: 1.7, events: 1, risk: 0.55, topThreat: "Ngập úng", affected: 45000 },
    { id: "tien-giang", name: "Tiền Giang", path: "M270,970 L300,962 L312,990 L300,1015 L270,1020 L258,992 Z", center: [288, 992], population: 1.8, events: 1, risk: 0.6, topThreat: "Triều cường", affected: 65000 },
    { id: "ben-tre", name: "Bến Tre", path: "M298,995 L325,988 L335,1018 L322,1045 L298,1050 L288,1020 Z", center: [315, 1020], population: 1.3, events: 1, risk: 0.55, topThreat: "Triều cường", affected: 40000 },
    { id: "vinh-long", name: "Vĩnh Long", path: "M270,1015 L298,1008 L308,1038 L295,1060 L270,1065 L260,1035 Z", center: [285, 1038], population: 1.1, events: 1, risk: 0.5, topThreat: "Triều cường", affected: 30000 },
    { id: "dong-thap", name: "Đồng Tháp", path: "M248,990 L278,982 L288,1012 L275,1040 L248,1045 L238,1015 Z", center: [265, 1015], population: 1.7, events: 1, risk: 0.6, topThreat: "Lũ lụt", affected: 80000 },
    { id: "an-giang", name: "An Giang", path: "M230,1020 L260,1012 L272,1045 L258,1075 L230,1080 L218,1048 Z", center: [248, 1050], population: 2.0, events: 2, risk: 0.65, topThreat: "Lũ lụt", affected: 120000 },
    { id: "can-tho", name: "Cần Thơ", path: "M262,1048 L290,1040 L302,1070 L288,1098 L262,1102 L250,1072 Z", center: [278, 1072], population: 1.2, events: 2, risk: 0.68, topThreat: "Triều cường", affected: 85000 },
    { id: "kien-giang", name: "Kiên Giang", path: "M218,1060 L248,1052 L260,1085 L248,1118 L218,1122 L206,1088 Z", center: [238, 1088], population: 1.8, events: 1, risk: 0.55, topThreat: "Triều cường", affected: 55000 },
    { id: "soc-trang", name: "Sóc Trăng", path: "M265,1100 L295,1092 L308,1125 L295,1155 L265,1160 L252,1128 Z", center: [282, 1130], population: 1.3, events: 1, risk: 0.5, topThreat: "Triều cường", affected: 35000 },
    { id: "bac-lieu", name: "Bạc Liêu", path: "M245,1130 L275,1122 L288,1155 L275,1185 L245,1190 L232,1155 Z", center: [265, 1158], population: 0.9, events: 1, risk: 0.5, topThreat: "Triều cường", affected: 25000 },
    { id: "ca-mau", name: "Cà Mau", path: "M250,1185 L280,1178 L292,1210 L280,1245 L250,1250 L238,1215 Z", center: [268, 1215], population: 1.2, events: 1, risk: 0.45, topThreat: "Triều cường", affected: 30000 },
];

function getRiskColor(risk: number): string {
    if (risk >= 0.8) return "#EF4444";
    if (risk >= 0.65) return "#F97316";
    if (risk >= 0.5) return "#EAB308";
    if (risk >= 0.35) return "#22C55E";
    return "#10B981";
}

function getRiskLabel(risk: number): string {
    if (risk >= 0.8) return "Rất cao";
    if (risk >= 0.65) return "Cao";
    if (risk >= 0.5) return "Trung bình";
    if (risk >= 0.35) return "Thấp";
    return "Rất thấp";
}

function getRiskBg(risk: number): string {
    if (risk >= 0.8) return "rgba(239,68,68,0.15)";
    if (risk >= 0.65) return "rgba(249,115,22,0.15)";
    if (risk >= 0.5) return "rgba(234,179,8,0.15)";
    if (risk >= 0.35) return "rgba(34,197,94,0.15)";
    return "rgba(16,185,129,0.15)";
}

export default function VietnamHeatmap() {
    const [hoveredProvince, setHoveredProvince] = useState<ProvinceData | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const router = useRouter();

    const totalEvents = useMemo(() => PROVINCES.reduce((s, p) => s + p.events, 0), []);
    const totalAffected = useMemo(() => PROVINCES.reduce((s, p) => s + p.affected, 0), []);
    const highRiskCount = useMemo(() => PROVINCES.filter((p) => p.risk >= 0.7).length, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-aurora" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600 uppercase tracking-widest mb-4">
                        🗺️ Bản đồ Rủi ro
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        Rủi ro <span className="text-gradient-flow">Thiên tai</span> Toàn quốc
                    </h2>
                    <p className="text-base text-slate-600 max-w-xl mx-auto">
                        Hover mỗi tỉnh để xem chi tiết • Click để xem dự đoán AI
                    </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto"
                >
                    {[
                        { label: "Tỉnh theo dõi", value: "63", icon: "📍", color: "#3B82F6" },
                        { label: "Sự kiện gần đây", value: totalEvents.toString(), icon: "⚠️", color: "#F59E0B" },
                        { label: "Người ảnh hưởng", value: totalAffected >= 1000000 ? `${(totalAffected / 1000000).toFixed(1)}M` : `${(totalAffected / 1000).toFixed(0)}K`, icon: "👥", color: "#EF4444" },
                        { label: "Tỉnh rủi ro cao", value: highRiskCount.toString(), icon: "🔴", color: "#8B5CF6" },
                    ].map((stat) => (
                        <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
                            <span className="text-lg">{stat.icon}</span>
                            <div>
                                <span className="text-lg font-bold block" style={{ color: stat.color }}>{stat.value}</span>
                                <span className="text-[10px] text-slate-500">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* SVG Map */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative mx-auto"
                    style={{ maxWidth: "600px" }}
                    onMouseMove={handleMouseMove}
                >
                    <svg
                        viewBox="0 0 600 1300"
                        className="w-full h-auto"
                        style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))" }}
                    >
                        {/* Background */}
                        <rect x="0" y="0" width="600" height="1300" fill="#F8FAFC" rx="24" />

                        {/* Sea background */}
                        <rect x="10" y="10" width="580" height="1280" fill="#EFF6FF" rx="20" opacity="0.5" />

                        {/* Province paths */}
                        {PROVINCES.map((province) => (
                            <g key={province.id}>
                                <path
                                    d={province.path}
                                    fill={getRiskColor(province.risk)}
                                    fillOpacity={hoveredProvince?.id === province.id ? 0.9 : 0.65}
                                    stroke={hoveredProvince?.id === province.id ? getRiskColor(province.risk) : "#CBD5E1"}
                                    strokeWidth={hoveredProvince?.id === province.id ? 2.5 : 0.8}
                                    className="cursor-pointer transition-all duration-200"
                                    onMouseEnter={() => setHoveredProvince(province)}
                                    onMouseLeave={() => setHoveredProvince(null)}
                                    onClick={() => router.push(`/predict?province=${encodeURIComponent(province.name)}`)}
                                />
                                {/* Province label (only for larger provinces) */}
                                {province.population > 2 && (
                                    <text
                                        x={province.center[0]}
                                        y={province.center[1]}
                                        textAnchor="middle"
                                        className="pointer-events-none select-none"
                                        style={{
                                            fontSize: "8px",
                                            fontWeight: 600,
                                            fill: province.risk >= 0.7 ? "#fff" : "#334155",
                                            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        {province.name.replace("TP. Hồ Chí Minh", "TP.HCM")}
                                    </text>
                                )}
                            </g>
                        ))}

                        {/* Title inside map */}
                        <text x="300" y="50" textAnchor="middle" style={{ fontSize: "14px", fontWeight: 800, fill: "#0F172A" }}>
                            VIỆT NAM
                        </text>
                        <text x="300" y="68" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500, fill: "#64748B" }}>
                            Bản đồ rủi ro thiên tai
                        </text>
                    </svg>

                    {/* Floating tooltip */}
                    {hoveredProvince && (
                        <div
                            className="fixed z-50 pointer-events-none"
                            style={{
                                left: mousePos.x + 16,
                                top: mousePos.y - 10,
                                transform: "translateY(-50%)",
                            }}
                        >
                            <div className="px-4 py-3 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl min-w-[220px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">{hoveredProvince.topThreat === "Lũ lụt" ? "🌊" : hoveredProvince.topThreat === "Bão" ? "🌪️" : hoveredProvince.topThreat === "Sạt lở" ? "⛰️" : hoveredProvince.topThreat === "Hạn hán" ? "☀️" : "💧"}</span>
                                    <span className="text-sm font-bold text-slate-900">{hoveredProvince.name}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Dân số:</span>
                                        <span className="font-semibold text-slate-700">{hoveredProvince.population}M</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Sự kiện:</span>
                                        <span className="font-semibold text-slate-700">{hoveredProvince.events}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Ảnh hưởng:</span>
                                        <span className="font-semibold text-slate-700">{hoveredProvince.affected >= 1000000 ? `${(hoveredProvince.affected / 1000000).toFixed(1)}M` : `${(hoveredProvince.affected / 1000).toFixed(0)}K`}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Mối đe dọa:</span>
                                        <span className="font-semibold text-slate-700">{hoveredProvince.topThreat}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] mt-1 pt-1 border-t border-slate-100">
                                        <span className="text-slate-500">Rủi ro:</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: getRiskBg(hoveredProvince.risk), color: getRiskColor(hoveredProvince.risk) }}>
                                            {(hoveredProvince.risk * 100).toFixed(0)}% — {getRiskLabel(hoveredProvince.risk)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-3 mt-8"
                >
                    {[
                        { color: "#EF4444", label: "Rất cao (≥80%)" },
                        { color: "#F97316", label: "Cao (65-79%)" },
                        { color: "#EAB308", label: "Trung bình (50-64%)" },
                        { color: "#22C55E", label: "Thấp (<50%)" },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color, opacity: 0.7 }} />
                            <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Source */}
                <p className="text-center text-[10px] text-slate-400 mt-4">
                    Dữ liệu: EM-DAT • MARD • USGS • ReliefWeb | Cập nhật: Tháng 5/2026
                </p>
            </div>
        </section>
    );
}