"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { DisasterType } from "@/lib/types";
import type { ProvinceRisk, RiskScore } from "../lib/types";
import { MAP_CONFIG, VIETNAM_PROVINCES } from "../../map-disaster/config/map-config";
import { DISASTER_CONFIG } from "../config/predict-config";
import { getRiskColor, getRiskLevelLabel, scoreToLevel } from "../lib/risk-engine";
import { PROVINCE_GEO_TYPE } from "../lib/geo-risk";

// === CONSTANTS ===

const DISASTER_TYPES: DisasterType[] = [
  "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
];

const GEO_LABELS: Record<string, string> = {
  coastal: "Ven biển",
  mountain: "Miền núi",
  delta: "Đồng bằng",
  urban: "Đô thị",
  highland: "Cao nguyên",
};

// === MAP STYLES ===

const TILE_URL = MAP_CONFIG.tileUrl;
const TILE_ATTRIBUTION = MAP_CONFIG.attribution;

// === RISK COLOR WITH ALPHA ===

function getRiskFill(score: number, alpha: number = 0.6): string {
  if (score >= 0.80) return `rgba(239, 68, 68, ${alpha})`;
  if (score >= 0.60) return `rgba(249, 115, 22, ${alpha})`;
  if (score >= 0.35) return `rgba(234, 179, 8, ${alpha})`;
  return `rgba(34, 197, 94, ${alpha})`;
}

function getRiskBorder(score: number): string {
  if (score >= 0.80) return "#EF4444";
  if (score >= 0.60) return "#F97316";
  if (score >= 0.35) return "#EAB308";
  return "#22C55E";
}

// === PROVINCE MARKER SIZE ===

function getMarkerRadius(overallRisk: number): number {
  const base = 12;
  const scale = 10;
  return base + overallRisk * scale;
}

// === PROVINCE RISK POPUP ===

function ProvincePopup({
  provinceRisk,
  onExpand,
}: {
  provinceRisk: ProvinceRisk;
  onExpand?: () => void;
}) {
  const { province, risks, overallRisk, topThreat, trend } = provinceRisk;
  const color = getRiskColor(overallRisk);
  const level = scoreToLevel(overallRisk);
  const levelLabel = getRiskLevelLabel(level);
  const geoType = PROVINCE_GEO_TYPE[province] ?? "urban";

  // Top 3 risks
  const top3 = DISASTER_TYPES.map((t) => ({ type: t, score: risks[t] }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 3);

  const trendSymbol = trend === "increasing" ? "▲" : trend === "decreasing" ? "▼" : "●";
  const trendColor = trend === "increasing" ? "#EF4444" : trend === "decreasing" ? "#22C55E" : "#94A3B8";

  return (
    <div className="min-w-[220px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
        <div>
          <h3 className="text-sm font-bold text-white">{province}</h3>
          <p className="text-[10px] text-slate-500">{GEO_LABELS[geoType]}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono" style={{ color }}>
            {(overallRisk * 100).toFixed(0)}%
          </div>
          <div
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {levelLabel}
          </div>
        </div>
      </div>

      {/* Top threats */}
      <div className="space-y-1.5 mb-2">
        {top3.map((item) => {
          const itemColor = getRiskColor(item.score.score);
          return (
            <div key={item.type} className="flex items-center gap-2">
              <span className="text-xs">{DISASTER_CONFIG[item.type].icon}</span>
              <span className="text-[11px] text-slate-400 flex-1">
                {DISASTER_CONFIG[item.type].label}
              </span>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.score.score * 100}%`,
                    backgroundColor: itemColor,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-mono w-8 text-right"
                style={{ color: itemColor }}
              >
                {(item.score.score * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1.5 text-xs pt-2 border-t border-slate-700/50">
        <span style={{ color: trendColor }}>{trendSymbol}</span>
        <span className="text-slate-500">
          Xu hướng:{" "}
          <span style={{ color: trendColor }}>
            {trend === "increasing" ? "Tăng" : trend === "decreasing" ? "Giảm" : "Ổn định"}
          </span>
        </span>
      </div>

      {/* Expand button */}
      {onExpand && (
        <button
          onClick={onExpand}
          className="w-full mt-2 text-[10px] text-blue-400 hover:text-blue-300 py-1 rounded bg-blue-500/10 hover:bg-blue-500/15 transition-colors"
        >
          Xem chi tiết →
        </button>
      )}
    </div>
  );
}

// === MAP CONTROLS ===

function MapControls({
  selectedType,
  onTypeChange,
}: {
  selectedType: DisasterType | null;
  onTypeChange: (type: DisasterType | null) => void;
}) {
  return (
    <div className="absolute top-3 left-3 z-[1000]">
      <div className="glass-card px-3 py-2">
        <p className="text-[10px] text-slate-500 mb-1.5 font-medium">
          Hiển thị theo loại:
        </p>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onTypeChange(null)}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
              selectedType === null
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-slate-800/40 text-slate-500 hover:text-slate-400"
            }`}
          >
            Tất cả
          </button>
          {DISASTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                selectedType === type
                  ? "border text-white"
                  : "bg-slate-800/40 text-slate-500 hover:text-slate-400"
              }`}
              style={
                selectedType === type
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
    </div>
  );
}

// === LEGEND ===

function RiskLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000]">
      <div className="glass-card px-3 py-2">
        <p className="text-[10px] text-slate-500 mb-1.5 font-medium">
          Mức rủi ro:
        </p>
        <div className="flex items-center gap-3">
          {[
            { label: "Thấp", color: "#22C55E", range: "< 35%" },
            { label: "TB", color: "#EAB308", range: "35-60%" },
            { label: "Cao", color: "#F97316", range: "60-80%" },
            { label: "NC", color: "#EF4444", range: "> 80%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 6px ${item.color}60`,
                }}
              />
              <div>
                <span className="text-[9px] text-slate-400 block">{item.label}</span>
                <span className="text-[8px] text-slate-600">{item.range}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === FLY TO PROVINCE ===

function FlyToProvince({ province }: { province: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!province) return;
    const coords = VIETNAM_PROVINCES.find((p) => p.name === province);
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 9, { duration: 1.5 });
    }
  }, [province, map]);

  return null;
}

// === COMPONENT PROPS ===

interface RiskMapProps {
  riskScores: Map<string, ProvinceRisk>;
  selectedProvince?: string | null;
  selectedMonth?: number;
  selectedScenario?: string;
  onProvinceSelect?: (province: string) => void;
  onProvinceExpand?: (province: string) => void;
  className?: string;
}

// === MAIN COMPONENT ===

export default function RiskMap({
  riskScores,
  selectedProvince,
  selectedMonth,
  selectedScenario,
  onProvinceSelect,
  onProvinceExpand,
  className = "",
}: RiskMapProps) {
  const [selectedType, setSelectedType] = useState<DisasterType | null>(null);

  // Build marker data
  const markers = useMemo(() => {
    return VIETNAM_PROVINCES.map((p) => {
      const risk = riskScores.get(p.name);
      if (!risk) return null;

      const displayScore = selectedType
        ? risk.risks[selectedType]?.score ?? 0
        : risk.overallRisk;

      return {
        ...p,
        risk,
        displayScore,
        color: getRiskFill(displayScore),
        border: getRiskBorder(displayScore),
        radius: getMarkerRadius(displayScore),
      };
    }).filter(Boolean);
  }, [riskScores, selectedType]);

  const handleMarkerClick = useCallback(
    (province: string) => {
      onProvinceSelect?.(province);
    },
    [onProvinceSelect]
  );

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden border border-slate-700/40 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Map Controls */}
      <MapControls selectedType={selectedType} onTypeChange={setSelectedType} />

      {/* Legend */}
      <RiskLegend />

      {/* Leaflet Map */}
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        className="w-full h-full z-0"
        style={{ background: "#06080F" }}
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {/* Fly to selected province */}
        <FlyToProvince province={selectedProvince ?? null} />

        {/* Province markers */}
        {markers.map((marker) => {
          if (!marker) return null;
          const isSelected = marker.name === selectedProvince;

          return (
            <CircleMarker
              key={marker.name}
              center={[marker.lat, marker.lng]}
              radius={isSelected ? marker.radius + 3 : marker.radius}
              pathOptions={{
                fillColor: marker.color,
                fillOpacity: isSelected ? 0.8 : 0.55,
                color: isSelected ? "#60a5fa" : marker.border,
                weight: isSelected ? 3 : 2,
                opacity: isSelected ? 1 : 0.8,
              }}
              eventHandlers={{
                click: () => handleMarkerClick(marker.name),
              }}
            >
              <Popup className="risk-popup" maxWidth={280} closeButton={false}>
                <ProvincePopup
                  provinceRisk={marker.risk}
                  onExpand={() => onProvinceExpand?.(marker.name)}
                />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Province count badge */}
      <div className="absolute top-3 right-3 z-[1000]">
        <div className="glass-card px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Tỉnh:</span>
          <span className="text-xs font-mono text-blue-400 font-semibold">
            {markers.length}
          </span>
          {selectedType && (
            <span className="text-[10px] text-slate-500">
              | {DISASTER_CONFIG[selectedType].icon} {DISASTER_CONFIG[selectedType].label}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
