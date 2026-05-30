"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { CommunityReport, ReportMapProps } from "../lib/types";
import {
  DISASTER_CONFIG,
  SEVERITY_CONFIG,
  REPORT_MAP_CONFIG,
  SEVERITY_MARKER_CONFIG,
} from "../config/report-config";

// ============================================================
// REPORT MAP COMPONENT
// ============================================================
// Hiển thị báo cáo trên bản đồ Leaflet
// - MapContainer + TileLayer (CartoDB Dark)
// - CircleMarker cho mỗi báo cáo (color = severity)
// - Popup: mini card (type + title + severity + "Xem chi tiết")
// - MapLegend: severity color scale overlay
// - MapFilters: compact filter bar overlay
// - FlyToProvince: auto-fly khi chọn province
// ============================================================

// Lazy load Leaflet components (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Province centers for fly-to
const PROVINCE_CENTERS: Record<string, [number, number]> = {
  "Hà Nội": [21.0285, 105.8542],
  "Hồ Chí Minh": [10.8231, 106.6297],
  "Đà Nẵng": [16.0544, 108.2022],
  "Huế": [16.4637, 107.5909],
  "Cần Thơ": [10.0452, 105.7469],
  "Hải Phòng": [20.8449, 106.6881],
  "Nha Trang": [12.2388, 109.1967],
  "Đà Lạt": [11.9404, 108.4583],
  "Quảng Bình": [17.4689, 106.6222],
  "Quảng Nam": [15.5394, 108.0191],
  "Bến Tre": [10.2434, 106.3756],
  "Trà Vinh": [9.9514, 106.3346],
  "Lào Cai": [22.3381, 103.8448],
  "Yên Bái": [21.7229, 104.9114],
  "An Giang": [10.5216, 105.1259],
};

// === MAIN COMPONENT ===

function ReportMapComponent({
  reports,
  onReportClick,
  selectedProvince,
  className,
}: ReportMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Group reports by location for clustering
  const markers = useMemo(() => {
    return reports.map((report) => ({
      id: report.id,
      position: [report.location.lat, report.location.lng] as [number, number],
      report,
    }));
  }, [reports]);

  // Calculate center based on reports
  const center = useMemo<[number, number]>(() => {
    if (selectedProvince && PROVINCE_CENTERS[selectedProvince]) {
      return PROVINCE_CENTERS[selectedProvince];
    }

    if (reports.length === 0) {
      return REPORT_MAP_CONFIG.center;
    }

    const avgLat =
      reports.reduce((sum, r) => sum + r.location.lat, 0) / reports.length;
    const avgLng =
      reports.reduce((sum, r) => sum + r.location.lng, 0) / reports.length;

    return [avgLat, avgLng];
  }, [reports, selectedProvince]);

  // Zoom level
  const zoom = useMemo(() => {
    if (selectedProvince) return 10;
    if (reports.length <= 5) return 7;
    return REPORT_MAP_CONFIG.zoom;
  }, [selectedProvince, reports.length]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={clsx(
        "relative rounded-xl overflow-hidden border border-slate-200",
        isFullscreen
          ? "fixed inset-0 z-40 rounded-none"
          : "h-[400px] md:h-[500px]",
        className
      )}
    >
      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={REPORT_MAP_CONFIG.minZoom}
        maxZoom={REPORT_MAP_CONFIG.maxZoom}
        className="w-full h-full"
        style={{ background: "#0b0d17" }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          url={REPORT_MAP_CONFIG.tileUrl}
          attribution={REPORT_MAP_CONFIG.attribution}
        />

        {/* Markers */}
        {markers.map((marker) => (
          <ReportMarker
            key={marker.id}
            position={marker.position}
            report={marker.report}
            onReportClick={onReportClick}
          />
        ))}
      </MapContainer>

      {/* Map Legend */}
      <MapLegend />

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-slate-200/80 backdrop-blur-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        title={isFullscreen ? "Thu nhỏ" : "Phóng to"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Report count */}
      <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-200/80 backdrop-blur-sm border border-slate-200 text-xs text-slate-500">
        <MapPin className="w-3 h-3 inline mr-1" />
        {reports.length} báo cáo
      </div>
    </div>
  );
}

// === SUB-COMPONENTS ===

/**
 * Report Marker: CircleMarker with popup
 */
function ReportMarker({
  position,
  report,
  onReportClick,
}: {
  position: [number, number];
  report: CommunityReport;
  onReportClick?: (report: CommunityReport) => void;
}) {
  const markerConfig = SEVERITY_MARKER_CONFIG[report.severity] ?? { radius: 8, color: "#6B7280", glow: "rgba(107, 114, 128, 0.3)", borderWidth: 1.5 };
  const disasterConfig = DISASTER_CONFIG[report.type] ?? { icon: "⚠️", label: report.type, color: "#6B7280" };
  const severityConfig = SEVERITY_CONFIG[report.severity] ?? { label: report.severity, color: "#6B7280", bgColor: "bg-gray-500/10" };

  return (
    <CircleMarker
      center={position}
      radius={markerConfig.radius}
      pathOptions={{
        color: markerConfig.color,
        fillColor: markerConfig.color,
        fillOpacity: 0.6,
        weight: markerConfig.borderWidth,
        opacity: 0.8,
      }}
    >
      <Popup className="custom-popup">
        <div className="min-w-[200px] p-1">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">{disasterConfig.icon}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">
                {report.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    color: severityConfig.color,
                    backgroundColor: `${severityConfig.color}15`,
                  }}
                >
                  {severityConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {report.location.district}, {report.location.province}
            </span>
          </div>

          {/* Description preview */}
          <p className="text-xs text-slate-600 line-clamp-2 mb-2">
            {report.description}
          </p>

          {/* View detail button */}
          <button
            onClick={() => onReportClick?.(report)}
            className="w-full px-3 py-1.5 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </Popup>
    </CircleMarker>
  );
}

/**
 * Map Legend: Severity color scale overlay
 */
function MapLegend() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-3 left-3 z-10">
      <div
        className={clsx(
          "rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 overflow-hidden transition-all",
          isExpanded ? "w-40" : "w-8"
        )}
      >
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Layers className="w-3 h-3" />
          {isExpanded && <span>Mức độ nghiêm trọng</span>}
        </button>

        {/* Legend items */}
        {isExpanded && (
          <div className="px-2 pb-2 space-y-1">
            {(["critical", "high", "medium", "low"] as SeverityLevel[]).map(
              (severity) => {
                const config = SEVERITY_CONFIG[severity];
                const markerConfig = SEVERITY_MARKER_CONFIG[severity];

                return (
                  <div
                    key={severity}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: markerConfig.color,
                        boxShadow: `0 0 6px ${markerConfig.glow}`,
                      }}
                    />
                    <span className="text-[10px] text-slate-500">
                      {config.label}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized component
export const ReportMap = memo(ReportMapComponent);
