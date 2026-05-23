"use client";

// =============================================================================
// PROVINCE CHOROPLETH - Leaflet Map with Province Coloring
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Features:
//   - 63 provinces colored by disaster metric
//   - Hover: Province name + key stats
//   - Click: Drill-down to province detail
//   - Legend: Color scale with value ranges
//   - Custom markers for selected province
//   - Dynamic import compatible (ssr: false)
// =============================================================================

import { memo, useState, useCallback, useEffect, useRef, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Info } from "lucide-react";
import clsx from "clsx";
import type { ProvinceChoroplethProps, ProvinceDisasterData } from "../../lib/types";
import { DASHBOARD_ANIMATION } from "../../config/dashboard-config";
import { formatNumber, formatCompact, formatRiskScore } from "../../lib/formatters";

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

const MAP_CENTER: [number, number] = [16.0, 108.0];
const MAP_ZOOM = 5;
const MAP_MIN_ZOOM = 4;
const MAP_MAX_ZOOM = 12;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// =============================================================================
// COLOR SCALE
// =============================================================================

function getProvinceColor(
  province: ProvinceDisasterData,
  metric: "deaths" | "damage" | "events" | "risk"
): string {
  let value: number;
  let max: number;

  switch (metric) {
    case "deaths":
      value = province.totalDeaths;
      max = 400;
      break;
    case "damage":
      value = province.totalDamageBillionVND;
      max = 65000;
      break;
    case "events":
      value = province.totalEvents;
      max = 90;
      break;
    case "risk":
      value = province.riskScore;
      max = 10;
      break;
    default:
      value = province.riskScore;
      max = 10;
  }

  const ratio = Math.min(value / max, 1);

  if (ratio >= 0.8) return "#EF4444";
  if (ratio >= 0.6) return "#F97316";
  if (ratio >= 0.4) return "#F59E0B";
  if (ratio >= 0.2) return "#EAB308";
  return "#22C55E";
}

// =============================================================================
// PROVINCE MARKERS
// =============================================================================

function ProvinceMarkers({
  provinces,
  metric,
  selectedProvince,
  onProvinceSelect,
}: {
  provinces: ProvinceDisasterData[];
  metric: "deaths" | "damage" | "events" | "risk";
  selectedProvince: string | null;
  onProvinceSelect: (name: string | null) => void;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Circle>>(new Map());

  useEffect(() => {
    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const province of provinces) {
      const color = getProvinceColor(province, metric);
      const isSelected = selectedProvince === province.province;
      const radius = isSelected ? 25000 : 15000;

      const circle = L.circle([province.lat, province.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: isSelected ? 0.6 : 0.4,
        weight: isSelected ? 3 : 1,
      }).addTo(map);

      // Popup content
      const metricValue = metric === "deaths" ? `${province.totalDeaths} người chết`
        : metric === "damage" ? `${formatNumber(province.totalDamageBillionVND)} tỷ VND`
        : metric === "events" ? `${province.totalEvents} sự kiện`
        : `Điểm rủi ro: ${province.riskScore}`;

      circle.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">${province.province}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">
            Dân số: ${formatCompact(province.population)} | Diện tích: ${formatNumber(province.areaKm2)} km²
          </div>
          <div style="font-size: 11px; color: #94A3B8; space-y: 2px;">
            <div>📊 ${province.totalEvents} sự kiện (2000-2024)</div>
            <div>💀 ${province.totalDeaths} người chết</div>
            <div>💰 ${formatNumber(province.totalDamageBillionVND)} tỷ VND thiệt hại</div>
            <div>⚠️ ${formatRiskScore(province.riskScore)}</div>
            <div>🏷️ Loại phổ biến: ${province.mostCommonType === "flood" ? "Lũ lụt" : province.mostCommonType === "storm" ? "Bão" : "Sạt lở"}</div>
          </div>
        </div>
      `);

      circle.on("click", () => {
        onProvinceSelect(province.province);
      });

      markersRef.current.set(province.province, circle);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [provinces, metric, selectedProvince, map, onProvinceSelect]);

  return null;
}

// =============================================================================
// MAP CONTROLS
// =============================================================================

function MapControls({
  metric,
  onMetricChange,
}: {
  metric: string;
  onMetricChange: (m: "deaths" | "damage" | "events" | "risk") => void;
}) {
  const metrics = [
    { id: "risk" as const, label: "Rủi ro", icon: "⚠️" },
    { id: "deaths" as const, label: "Thương vong", icon: "💀" },
    { id: "damage" as const, label: "Thiệt hại", icon: "💰" },
    { id: "events" as const, label: "Sự kiện", icon: "📊" },
  ];

  return (
    <div className="absolute top-3 left-3 z-[1000] flex gap-1">
      {metrics.map((m) => (
        <button
          key={m.id}
          onClick={() => onMetricChange(m.id)}
          className={clsx(
            "px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-colors",
            metric === m.id
              ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
              : "bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-600/60"
          )}
        >
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// LEGEND
// =============================================================================

function ChoroplethLegend({ metric }: { metric: string }) {
  const levels = [
    { color: "#22C55E", label: "Thấp" },
    { color: "#EAB308", label: "Trung bình" },
    { color: "#F59E0B", label: "Cao" },
    { color: "#F97316", label: "Rất cao" },
    { color: "#EF4444", label: "Cực kỳ cao" },
  ];

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/50 p-2.5">
      <h4 className="text-[9px] font-semibold text-slate-400 mb-1.5">
        {metric === "deaths" ? "Thương vong" : metric === "damage" ? "Thiệt hại" : metric === "events" ? "Sự kiện" : "Mức rủi ro"}
      </h4>
      <div className="space-y-1">
        {levels.map((level) => (
          <div key={level.label} className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded" style={{ backgroundColor: level.color }} />
            <span className="text-[9px] text-slate-400">{level.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ProvinceChoroplethComponent({
  provinceData,
  selectedProvince,
  onProvinceSelect,
  metric = "risk",
  className,
}: ProvinceChoroplethProps) {
  const [activeMetric, setActiveMetric] = useState<"deaths" | "damage" | "events" | "risk">(metric);

  const handleMetricChange = useCallback(
    (m: "deaths" | "damage" | "events" | "risk") => {
      setActiveMetric(m);
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DASHBOARD_ANIMATION.duration.slow }}
      className={clsx("relative rounded-xl overflow-hidden border border-slate-700/30", className)}
    >
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        <ProvinceMarkers
          provinces={provinceData}
          metric={activeMetric}
          selectedProvince={selectedProvince}
          onProvinceSelect={onProvinceSelect}
        />
      </MapContainer>

      {/* Controls */}
      <MapControls metric={activeMetric} onMetricChange={handleMetricChange} />

      {/* Legend */}
      <ChoroplethLegend metric={activeMetric} />

      {/* Info */}
      <div className="absolute top-3 right-3 z-[1000]">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-lg border border-slate-700/50 px-2 py-1.5">
          <span className="text-[9px] text-slate-400">
            Nhấp vào tỉnh để xem chi tiết
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export const ProvinceChoropleth = memo(ProvinceChoroplethComponent);
