"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import type { DisasterEvent, DisasterType, SeverityLevel, MapLayer, Province, WeatherData } from "@/lib/types";
import { MAP_CONFIG, TILE_OPTIONS, VIETNAM_PROVINCES, type TileMode } from "../config/map-config";
import PulseMarker from "./PulseMarker";
import HeatmapLayer from "./HeatmapLayer";
import ProvinceChoropleth from "./ProvinceChoropleth";
import DisasterPopup from "./DisasterPopup";
import MapControls from "./MapControls";
import WeatherOverlay from "./WeatherOverlay";

interface DisasterMapProps {
  disasters: DisasterEvent[];
  geojsonData?: GeoJSON.FeatureCollection | null;
  tileMode?: TileMode;
}

const DEFAULT_LAYERS: MapLayer[] = [
  { id: "markers", name: "Điểm thiên tai", visible: true, type: "markers" },
  { id: "heatmap", name: "Bản đồ nhiệt", visible: true, type: "heatmap" },
  { id: "choropleth", name: "Theo tỉnh", visible: false, type: "choropleth" },
  { id: "weather", name: "Thời tiết", visible: false, type: "weather" },
];

export default function DisasterMap({
  disasters,
  geojsonData,
  tileMode = "light",
}: DisasterMapProps) {
  const [layers, setLayers] = useState<MapLayer[]>(DEFAULT_LAYERS);
  const [activeTypes, setActiveTypes] = useState<DisasterType[]>([
    "flood",
    "storm",
    "landslide",
    "drought",
    "earthquake",
    "tsunami",
  ]);
  const [activeSeverities, setActiveSeverities] = useState<SeverityLevel[]>([
    "critical",
    "high",
    "medium",
    "low",
  ]);
  const [selectedDisaster, setSelectedDisaster] =
    useState<DisasterEvent | null>(null);
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData>>(new Map());

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const toggleType = useCallback((type: DisasterType) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const toggleSeverity = useCallback((severity: SeverityLevel) => {
    setActiveSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  }, []);

  const filteredDisasters = useMemo(
    () =>
      disasters.filter(
        (d) => activeTypes.includes(d.type) && activeSeverities.includes(d.severity)
      ),
    [disasters, activeTypes, activeSeverities]
  );

  const heatmapPoints = useMemo<[number, number, number][]>(
    () =>
      filteredDisasters.map((d) => [
        d.location.lat,
        d.location.lng,
        d.severity === "critical"
          ? 1.0
          : d.severity === "high"
            ? 0.7
            : d.severity === "medium"
              ? 0.4
              : 0.2,
      ]),
    [filteredDisasters]
  );

  const handleMarkerClick = useCallback((disaster: DisasterEvent) => {
    setSelectedDisaster(disaster);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedDisaster(null);
  }, []);

  const provinces: Province[] = useMemo(
    () =>
      VIETNAM_PROVINCES.map((p, i) => ({
        id: `prov-${i}`,
        name: p.name,
        code: `VN-${i}`,
        center: { lat: p.lat, lng: p.lng },
        riskLevel: "low" as const,
        population: 0,
      })),
    []
  );

  const markerLayer = layers.find((l) => l.id === "markers");
  const heatmapLayer = layers.find((l) => l.id === "heatmap");
  const choroplethLayer = layers.find((l) => l.id === "choropleth");
  const weatherLayer = layers.find((l) => l.id === "weather");

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200">
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        className="w-full h-full"
        style={{ height: "100%", minHeight: "500px" }}
        zoomControl={false}
      >
        <TileLayer
          url={TILE_OPTIONS[tileMode].url}
          attribution={TILE_OPTIONS[tileMode].attribution}
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Heatmap Layer */}
        {heatmapLayer?.visible && heatmapPoints.length > 0 && (
          <HeatmapLayer points={heatmapPoints} radius={30} blur={20} />
        )}

        {/* Province Choropleth Layer */}
        {choroplethLayer?.visible && geojsonData && (
          <ProvinceChoropleth
            provinces={[]}
            geojsonData={geojsonData}
            visible={choroplethLayer.visible}
          />
        )}

        {/* Disaster Markers */}
        {markerLayer?.visible &&
          filteredDisasters.map((disaster) => (
            <PulseMarker
              key={disaster.id}
              disaster={disaster}
              onClick={handleMarkerClick}
            />
          ))}

        {/* Weather Overlay */}
        {weatherLayer?.visible && (
          <WeatherOverlay
            provinces={provinces}
            weatherData={weatherData}
            visible={weatherLayer.visible}
          />
        )}

        {/* Selected Disaster Popup */}
        {selectedDisaster && (
          <DisasterPopup
            disaster={selectedDisaster}
            isOpen={true}
            onClose={handlePopupClose}
          />
        )}
      </MapContainer>

      {/* Map Controls */}
      <MapControls
        layers={layers}
        onToggleLayer={toggleLayer}
        activeTypes={activeTypes}
        onToggleType={toggleType}
        activeSeverities={activeSeverities}
        onToggleSeverity={toggleSeverity}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-card px-3 py-2">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-500">Khẩn cấp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-500">Nguy hiểm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-500">Cảnh báo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-slate-500">Thấp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
