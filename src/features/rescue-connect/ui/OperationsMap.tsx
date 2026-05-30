"use client";

// =============================================================================
// OPERATIONS MAP - Multi-Layer Tactical Map
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Interactive Leaflet map showing rescue operations:
//   - Incident markers (colored by severity)
//   - SOS request markers (pulsing red dots)
//   - Resource markers (deployed assets)
//   - Shelter markers (with occupancy gauges)
//   - Volunteer markers (clustered)
//   - Organization markers (3W)
//   - Incident heatmap layer
//   - Danger zone polygons
//
// Features:
//   - 8 toggleable layers with controls panel
//   - Custom L.divIcon markers with CSS animations
//   - Click-to-select incidents and SOS
//   - Popup with details
//   - Marker clustering for dense areas
//   - Responsive layer controls
//   - Dynamic import compatible (ssr: false)
// =============================================================================

import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap, Circle, Rectangle, Popup } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Eye,
  EyeOff,
  AlertTriangle,
  Siren,
  Truck,
  Home,
  HandHeart,
  Building2,
  Thermometer,
  ShieldAlert,
  Navigation,
  ZoomIn,
  ZoomOut,
  Locate,
  X,
} from "lucide-react";
import clsx from "clsx";

import type {
  Incident,
  RescueSOSRequest,
  RescueResource,
  Shelter,
  Volunteer,
  Organization,
  OperationsMapProps,
  MapLayerConfig,
} from "../lib/types";

import {
  INCIDENT_STATUS_CONFIG,
  INCIDENT_PRIORITY_CONFIG,
  INCIDENT_TYPE_CONFIG,
  RESCUE_SOS_STATUS_CONFIG,
  RESOURCE_TYPE_CONFIG,
  RESOURCE_STATUS_CONFIG,
  SHELTER_TYPE_CONFIG,
  SHELTER_STATUS_CONFIG,
  ORGANIZATION_TYPE_CONFIG,
  DEFAULT_MAP_LAYERS,
  SHELTER_OCCUPANCY_THRESHOLDS,
} from "../config/rescue-config";

import { calculateDistance } from "../lib/dispatch-engine";

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

const MAP_CENTER: [number, number] = [16.0, 108.0];
const MAP_ZOOM = 6;
const MAP_MIN_ZOOM = 5;
const MAP_MAX_ZOOM = 18;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const panelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

const layerItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

// =============================================================================
// MAP CONTROLS PANEL
// =============================================================================

function MapControlsPanel({
  layers,
  onToggleLayer,
}: {
  layers: MapLayerConfig[];
  onToggleLayer: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-white/90 backdrop-blur-xl border border-slate-200",
          "hover:border-slate-300 transition-colors",
          isOpen && "border-blue-500/50"
        )}
      >
        <Layers className="w-5 h-5 text-slate-700" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              "absolute top-12 right-0 w-56",
              "bg-white/95 backdrop-blur-xl rounded-xl",
              "border border-slate-200 shadow-2xl",
              "overflow-hidden"
            )}
          >
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-800">Lớp bản đồ</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-slate-200"
                >
                  <X className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-2 space-y-0.5">
              {layers.map((layer, i) => (
                <motion.button
                  key={layer.id}
                  variants={layerItemVariants}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  onClick={() => onToggleLayer(layer.id)}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg",
                    "transition-all duration-200",
                    layer.visible
                      ? "bg-slate-100"
                      : "hover:bg-slate-50"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: layer.visible ? `${layer.color}20` : "rgba(100,116,139,0.1)",
                      color: layer.visible ? layer.color : "#64748B",
                    }}
                  >
                    {layer.icon}
                  </div>
                  <span
                    className={clsx(
                      "text-xs font-medium flex-1 text-left",
                      layer.visible ? "text-slate-800" : "text-slate-500"
                    )}
                  >
                    {layer.nameVi}
                  </span>
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAP LEGEND
// =============================================================================

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000]">
      <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-slate-200 p-3">
        <h4 className="text-[10px] font-semibold text-slate-500 mb-2">Chú giải</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] text-slate-500">Sự cố P1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-[10px] text-slate-500">Sự cố P2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-slate-500">Sự cố P3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] text-slate-500">Sự cố P4</span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 mt-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] text-slate-500">SOS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-[10px] text-slate-500">Tài nguyên</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-500" />
              <span className="text-[10px] text-slate-500">Nơi trú ẩn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAP ZOOM CONTROLS
// =============================================================================

function MapZoomControls() {
  const map = useMap();

  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-xl border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
      >
        <ZoomIn className="w-4 h-4 text-slate-500" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-xl border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
      >
        <ZoomOut className="w-4 h-4 text-slate-500" />
      </button>
      <button
        onClick={() => map.setView(MAP_CENTER, MAP_ZOOM)}
        className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-xl border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors"
      >
        <Locate className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
}

// =============================================================================
// INCIDENT MARKERS
// =============================================================================

function IncidentMarkers({
  incidents,
  selectedIncident,
  onIncidentSelect,
  visible,
}: {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentSelect: (incident: Incident | null) => void;
  visible: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const incident of incidents) {
      const priorityConfig = INCIDENT_PRIORITY_CONFIG[incident.priority];
      const typeConfig = INCIDENT_TYPE_CONFIG[incident.type];
      const isSelected = selectedIncident?.id === incident.id;

      const icon = L.divIcon({
        className: "incident-marker",
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? 36 : 28}px;
            height: ${isSelected ? 36 : 28}px;
            transition: all 0.2s;
          ">
            <div style="
              position: absolute;
              inset: 0;
              background: ${priorityConfig.color};
              border-radius: 50%;
              opacity: 0.3;
              animation: pulse-expand 2s infinite;
            "></div>
            <div style="
              position: absolute;
              inset: 3px;
              background: ${priorityConfig.color};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isSelected ? 14 : 11}px;
              border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'};
              box-shadow: 0 0 ${isSelected ? 15 : 8}px ${priorityConfig.color}60;
            ">${typeConfig.icon}</div>
          </div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
      });

      const marker = L.marker([incident.location.lat, incident.location.lng], { icon })
        .addTo(map);

      const statusConfig = INCIDENT_STATUS_CONFIG[incident.status];
      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 200px;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px;">${incident.title}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">${incident.location.district}, ${incident.location.province}</div>
          <div style="display: flex; gap: 6px; margin-bottom: 6px;">
            <span style="background: ${priorityConfig.bgColor}; color: ${priorityConfig.color}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">${priorityConfig.labelVi}</span>
            <span style="background: ${statusConfig.bgColor}; color: ${statusConfig.color}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">${statusConfig.labelVi}</span>
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            👥 ${incident.peopleAtRisk.toLocaleString()} người có nguy cơ<br/>
            📏 ${incident.affectedAreaKm2} km²
          </div>
        </div>
      `);

      marker.on("click", () => {
        onIncidentSelect(incident);
      });

      markersRef.current.set(incident.id, marker);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [incidents, selectedIncident, visible, map, onIncidentSelect]);

  return null;
}

// =============================================================================
// SOS MARKERS
// =============================================================================

function SOSMarkers({
  sosRequests,
  visible,
}: {
  sosRequests: RescueSOSRequest[];
  visible: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const sos of sosRequests) {
      if (sos.dispatch.status === "resolved" || sos.dispatch.status === "cancelled") continue;

      const triageColor = sos.triage.color === "red" ? "#EF4444" : sos.triage.color === "yellow" ? "#F59E0B" : "#22C55E";

      const icon = L.divIcon({
        className: "sos-marker",
        html: `
          <div style="
            position: relative;
            width: 22px;
            height: 22px;
          ">
            <div style="
              position: absolute;
              inset: 0;
              background: ${triageColor};
              border-radius: 50%;
              opacity: 0.4;
              animation: pulse-expand 1.5s infinite;
            "></div>
            <div style="
              position: absolute;
              inset: 4px;
              background: ${triageColor};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              border: 1.5px solid rgba(255,255,255,0.5);
            ">🆘</div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([sos.location.lat, sos.location.lng], { icon })
        .addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: bold; font-size: 12px; color: ${triageColor}; margin-bottom: 4px;">
            SOS ${sos.id}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">
            ${sos.location.district}, ${sos.location.province}
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            👥 ${sos.situation.peopleCount} người<br/>
            ⚡ Điểm triage: ${sos.triage.score}/100<br/>
            📋 ${sos.triage.explanation.substring(0, 80)}...
          </div>
        </div>
      `);

      markersRef.current.set(sos.id, marker);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [sosRequests, visible, map]);

  return null;
}

// =============================================================================
// RESOURCE MARKERS
// =============================================================================

function ResourceMarkers({
  resources,
  visible,
}: {
  resources: RescueResource[];
  visible: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const resource of resources) {
      const typeConfig = RESOURCE_TYPE_CONFIG[resource.type];
      const statusConfig = RESOURCE_STATUS_CONFIG[resource.status];

      const icon = L.divIcon({
        className: "resource-marker",
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: ${statusConfig.color}20;
            border: 1.5px solid ${statusConfig.color}60;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">${typeConfig.icon}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([resource.location.lat, resource.location.lng], { icon })
        .addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">${resource.name}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 4px;">
            <span style="background: ${statusConfig.color}20; color: ${statusConfig.color}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${statusConfig.labelVi}</span>
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            📦 Sức chứa: ${resource.capacity}<br/>
            🏃 Tốc độ: ${resource.speed} km/h<br/>
            📍 ${resource.location.province}
          </div>
        </div>
      `);

      markersRef.current.set(resource.id, marker);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [resources, visible, map]);

  return null;
}

// =============================================================================
// SHELTER MARKERS
// =============================================================================

function ShelterMarkers({
  shelters,
  visible,
}: {
  shelters: Shelter[];
  visible: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const shelter of shelters) {
      const typeConfig = SHELTER_TYPE_CONFIG[shelter.type];
      const statusConfig = SHELTER_STATUS_CONFIG[shelter.status];
      const occupancy = shelter.capacity.max > 0 ? shelter.capacity.current / shelter.capacity.max : 0;
      const occupancyPercent = Math.round(occupancy * 100);

      let occupancyColor: string = SHELTER_OCCUPANCY_THRESHOLDS.low.color;
      if (occupancy >= 0.95) occupancyColor = SHELTER_OCCUPANCY_THRESHOLDS.critical.color;
      else if (occupancy >= 0.8) occupancyColor = SHELTER_OCCUPANCY_THRESHOLDS.high.color;
      else if (occupancy >= 0.5) occupancyColor = SHELTER_OCCUPANCY_THRESHOLDS.medium.color;

      const icon = L.divIcon({
        className: "shelter-marker",
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: ${occupancyColor}20;
            border: 2px solid ${occupancyColor}80;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            position: relative;
          ">
            ${typeConfig.icon}
            <div style="
              position: absolute;
              bottom: -3px;
              right: -3px;
              width: 12px;
              height: 12px;
              background: ${occupancyColor};
              border-radius: 50%;
              border: 1.5px solid #1E293B;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 6px;
              color: white;
              font-weight: bold;
            ">${occupancyPercent > 99 ? "F" : occupancyPercent}</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([shelter.location.lat, shelter.location.lng], { icon })
        .addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 200px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">${shelter.name}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 6px;">
            <span style="background: ${statusConfig.color}20; color: ${statusConfig.color}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${statusConfig.labelVi}</span>
            <span style="background: ${occupancyColor}20; color: ${occupancyColor}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${occupancyPercent}%</span>
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            👥 ${shelter.capacity.current}/${shelter.capacity.max} người<br/>
            👴 Người già: ${shelter.specialNeeds.elderly}<br/>
            👶 Trẻ em: ${shelter.specialNeeds.children}<br/>
            ♿ Khuyết tật: ${shelter.specialNeeds.disabled}<br/>
            📍 ${shelter.location.district}, ${shelter.location.province}
          </div>
        </div>
      `);

      markersRef.current.set(shelter.id, marker);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [shelters, visible, map]);

  return null;
}

// =============================================================================
// ORGANIZATION MARKERS
// =============================================================================

function OrganizationMarkers({
  organizations,
  visible,
}: {
  organizations: Organization[];
  visible: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const org of organizations) {
      const config = ORGANIZATION_TYPE_CONFIG[org.type];

      const icon = L.divIcon({
        className: "org-marker",
        html: `
          <div style="
            width: 26px;
            height: 26px;
            background: ${config.color}20;
            border: 1.5px solid ${config.color}60;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
          ">${config.icon}</div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([org.location.lat, org.location.lng], { icon })
        .addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 2px;">${org.name}</div>
          <div style="font-size: 10px; color: ${config.color}; margin-bottom: 4px;">${org.acronym} • ${config.labelVi}</div>
          <div style="font-size: 11px; color: #94A3B8;">
            👥 Sức chứa: ${org.capacity} nhân sự<br/>
            📍 ${org.location.province}<br/>
            📞 ${org.contactInfo.phone}
          </div>
        </div>
      `);

      markersRef.current.set(org.id, marker);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [organizations, visible, map]);

  return null;
}

// =============================================================================
// DANGER ZONE CIRCLES
// =============================================================================

function DangerZones({
  incidents,
  visible,
}: {
  incidents: Incident[];
  visible: boolean;
}) {
  const map = useMap();
  const circlesRef = useRef<L.Circle[]>([]);

  useEffect(() => {
    if (!visible) {
      circlesRef.current.forEach((circle) => circle.remove());
      circlesRef.current = [];
      return;
    }

    circlesRef.current.forEach((circle) => circle.remove());
    circlesRef.current = [];

    for (const incident of incidents) {
      if (incident.status !== "active" && incident.status !== "escalated") continue;

      const priorityConfig = INCIDENT_PRIORITY_CONFIG[incident.priority];
      const radiusKm = Math.sqrt(incident.affectedAreaKm2 / Math.PI) * 1000;

      const circle = L.circle(
        [incident.location.lat, incident.location.lng],
        {
          radius: radiusKm,
          color: priorityConfig.color,
          fillColor: priorityConfig.color,
          fillOpacity: 0.08,
          weight: 1,
          dashArray: "5 5",
        }
      ).addTo(map);

      circlesRef.current.push(circle);
    }

    return () => {
      circlesRef.current.forEach((circle) => circle.remove());
    };
  }, [incidents, visible, map]);

  return null;
}

// =============================================================================
// FLY-TO CONTROLLER
// =============================================================================

function FlyToController({
  selectedIncident,
}: {
  selectedIncident: Incident | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident) {
      map.flyTo(
        [selectedIncident.location.lat, selectedIncident.location.lng],
        12,
        { duration: 1.5 }
      );
    }
  }, [selectedIncident, map]);

  return null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function OperationsMapComponent({
  incidents,
  sosRequests,
  resources,
  shelters,
  volunteers,
  organizations,
  selectedIncident,
  layers,
  onIncidentSelect,
  onSOSClick,
  onResourceClick,
  onShelterClick,
  className,
}: OperationsMapProps) {
  const [mapLayers, setMapLayers] = useState<MapLayerConfig[]>(layers);

  const toggleLayer = useCallback((layerId: string) => {
    setMapLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const isLayerVisible = useCallback(
    (layerId: string) => mapLayers.find((l) => l.id === layerId)?.visible ?? false,
    [mapLayers]
  );

  return (
    <div className={clsx("relative", className)}>
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="w-full h-full rounded-xl"
        zoomControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {/* Zoom controls */}
        <MapZoomControls />

        {/* Fly to selected incident */}
        <FlyToController selectedIncident={selectedIncident} />

        {/* Layer: Incidents */}
        <IncidentMarkers
          incidents={incidents}
          selectedIncident={selectedIncident}
          onIncidentSelect={onIncidentSelect}
          visible={isLayerVisible("incidents")}
        />

        {/* Layer: SOS */}
        <SOSMarkers
          sosRequests={sosRequests}
          visible={isLayerVisible("sos")}
        />

        {/* Layer: Resources */}
        <ResourceMarkers
          resources={resources}
          visible={isLayerVisible("resources")}
        />

        {/* Layer: Shelters */}
        <ShelterMarkers
          shelters={shelters}
          visible={isLayerVisible("shelters")}
        />

        {/* Layer: Organizations */}
        <OrganizationMarkers
          organizations={organizations}
          visible={isLayerVisible("organizations")}
        />

        {/* Layer: Danger Zones */}
        <DangerZones
          incidents={incidents}
          visible={isLayerVisible("zones")}
        />
      </MapContainer>

      {/* Layer controls */}
      <MapControlsPanel
        layers={mapLayers}
        onToggleLayer={toggleLayer}
      />

      {/* Legend */}
      <MapLegend />
    </div>
  );
}

export const OperationsMap = memo(OperationsMapComponent);
