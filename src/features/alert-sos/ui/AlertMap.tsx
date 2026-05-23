"use client";

// =============================================================================
// ALERT MAP - Interactive Map with Alert Zones & SOS Markers
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Interactive Leaflet map showing:
//   - Alert zone polygons (colored by severity level)
//   - SOS request markers (red pulsing dots)
//   - User location marker (blue pulsing dot)
//   - Emergency facility markers
//   - Layer toggle controls
//   - Severity legend
//
// Features:
//   - Dark theme tiles (CartoDB Dark Matter)
//   - Custom L.divIcon markers with CSS pulse animations
//   - Polygon zones with severity-based fill + border colors
//   - Click-to-select alerts and SOS requests
//   - Popup with alert/SOS details
//   - Responsive layer controls panel
//   - Dynamic import compatible (ssr: false)
//
// Technical Notes:
//   - Uses react-leaflet for container, raw L for custom markers
//   - Marker lifecycle managed in useEffect (create → add → cleanup)
//   - Polygon coordinates from AlertArea (circle + bounding box)
//   - Pulse animations via CSS keyframes from globals.css
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
  MapPin,
  AlertTriangle,
  Siren,
  Navigation,
  ZoomIn,
  ZoomOut,
  Locate,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { Alert, SOSRequest, AlertMapProps, AlertSeverity, DeliveryChannel } from "../lib/types";
import {
  ALERT_SEVERITY_CONFIG,
  ALERT_MAP_CONFIG,
  SOS_TYPE_CONFIG,
  SOS_STATUS_CONFIG,
  DELIVERY_CHANNEL_CONFIG,
} from "../config/alert-config";

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

const MAP_CENTER: [number, number] = [14.0583, 108.2772];
const MAP_ZOOM = 6;
const MAP_MIN_ZOOM = 5;
const MAP_MAX_ZOOM = 18;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Layer toggle config */
interface MapLayerConfig {
  id: string;
  label: string;
  labelVi: string;
  icon: React.ReactNode;
  visible: boolean;
  color: string;
}

const DEFAULT_LAYERS: MapLayerConfig[] = [
  { id: "alerts", label: "Alert Zones", labelVi: "Vùng cảnh báo", icon: <AlertTriangle className="w-3.5 h-3.5" />, visible: true, color: "#F59E0B" },
  { id: "sos", label: "SOS Requests", labelVi: "Yêu cầu SOS", icon: <Siren className="w-3.5 h-3.5" />, visible: true, color: "#DC2626" },
  { id: "user", label: "Your Location", labelVi: "Vị trí của bạn", icon: <Navigation className="w-3.5 h-3.5" />, visible: true, color: "#3B82F6" },
];

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

const legendVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.2 },
  },
};

// =============================================================================
// MAP CONTROLS SUB-COMPONENT
// =============================================================================

function MapControlsPanel({
  layers,
  onToggleLayer,
  onLocateUser,
  isLocating,
}: {
  layers: MapLayerConfig[];
  onToggleLayer: (id: string) => void;
  onLocateUser: () => void;
  isLocating: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50",
          "text-slate-300 hover:text-white hover:border-slate-600/70",
          "transition-all duration-200",
          isOpen && "bg-slate-800/90 border-blue-500/40"
        )}
      >
        <Layers className="w-4 h-4" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              "absolute top-12 right-0 w-56 rounded-xl overflow-hidden",
              "bg-slate-900/90 backdrop-blur-xl",
              "border border-slate-700/50",
              "shadow-xl shadow-black/30"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/40">
              <span className="text-xs font-medium text-slate-300">Lớp bản đồ</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layer toggles */}
            <div className="p-2 space-y-1">
              {layers.map((layer, index) => (
                <motion.button
                  key={layer.id}
                  custom={index}
                  variants={layerItemVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => onToggleLayer(layer.id)}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg",
                    "text-left transition-all duration-200",
                    layer.visible
                      ? "bg-slate-800/60 text-slate-200"
                      : "text-slate-500 hover:text-slate-400 hover:bg-slate-800/30"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: layer.visible ? `${layer.color}20` : "transparent",
                      color: layer.visible ? layer.color : undefined,
                    }}
                  >
                    {layer.icon}
                  </div>
                  <span className="text-xs font-medium flex-1">{layer.labelVi}</span>
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Locate button */}
            <div className="px-2 pb-2">
              <button
                onClick={onLocateUser}
                disabled={isLocating}
                className={clsx(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg",
                  "text-xs font-medium transition-all duration-200",
                  "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                  "hover:bg-blue-500/20 hover:border-blue-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Locate className={clsx("w-3.5 h-3.5", isLocating && "animate-pulse")} />
                {isLocating ? "Đang xác định..." : "Vị trí của tôi"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// SEVERITY LEGEND SUB-COMPONENT
// =============================================================================

function SeverityLegend() {
  const severities: Array<{ key: AlertSeverity; label: string }> = [
    { key: "extreme", label: "Cực kỳ nghiêm trọng" },
    { key: "severe", label: "Nghiêm trọng" },
    { key: "moderate", label: "Trung bình" },
    { key: "minor", label: "Nhẹ" },
  ];

  return (
    <motion.div
      variants={legendVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "absolute bottom-3 left-3 z-[1000]",
        "px-3 py-2.5 rounded-xl",
        "bg-slate-900/80 backdrop-blur-xl",
        "border border-slate-700/50"
      )}
    >
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5">
        Mức độ cảnh báo
      </p>
      <div className="flex flex-col gap-1">
        {severities.map((s) => {
          const config = ALERT_SEVERITY_CONFIG[s.key];
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm border"
                style={{
                  backgroundColor: `${config.color}30`,
                  borderColor: `${config.color}60`,
                }}
              />
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* SOS marker legend */}
      <div className="mt-2 pt-2 border-t border-slate-700/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-slate-400">SOS</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[10px] text-slate-400">Vị trí của bạn</span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// ALERT ZONE MARKER
// =============================================================================

function AlertZoneMarker({
  alert,
  isSelected,
  onSelect,
}: {
  alert: Alert;
  isSelected: boolean;
  onSelect: (alert: Alert) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    const severityConfig = ALERT_SEVERITY_CONFIG[alert.info.severity];
    const color = severityConfig.color;

    // Create marker icon
    const markerIcon = L.divIcon({
      className: "alert-zone-marker",
      html: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <div class="pulse-ring" style="position:absolute;inset:-6px;border:2px solid ${color};border-radius:50%;animation:pulse-expand 2.5s ease-out infinite;"></div>
          <div style="
            width:36px;height:36px;
            background:${color}22;
            border:2px solid ${color};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;
            box-shadow:0 0 16px ${color}44;
            animation:glow-breathe 3s ease-in-out infinite;
          ">${severityConfig.icon}</div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Calculate center of alert area
    const { area } = alert.info;
    let centerLat: number;
    let centerLng: number;

    if (area.circle) {
      centerLat = area.circle.lat;
      centerLng = area.circle.lng;
    } else {
      // Estimate center from provinces (use first province coords)
      const provinceCoords: Record<string, [number, number]> = {
        "Hà Nội": [21.0285, 105.8542],
        "Hồ Chí Minh": [10.8231, 106.6297],
        "Đà Nẵng": [16.0748, 108.223],
        "Huế": [16.4637, 107.5909],
        "Cần Thơ": [10.0452, 105.7469],
        "Hải Phòng": [20.8449, 106.6881],
        "Nha Trang": [12.2388, 109.1967],
        "Đà Lạt": [11.9404, 108.4583],
        "Quảng Bình": [17.4689, 106.6223],
        "Quảng Nam": [15.8794, 108.335],
        "Bến Tre": [10.2415, 106.3756],
        "Trà Vinh": [9.9347, 106.3453],
        "Lào Cai": [22.4856, 103.9707],
        "Yên Bái": [21.7229, 104.8984],
        "An Giang": [10.5216, 105.1259],
      };
      const firstProvince = area.provinces[0];
      const coords = provinceCoords[firstProvince] || [14.0583, 108.2772];
      [centerLat, centerLng] = coords;
    }

    // Create marker
    const marker = L.marker([centerLat, centerLng], { icon: markerIcon }).addTo(map);

    // Popup content
    const popupContent = `
      <div style="font-family:system-ui;min-width:200px;">
        <div style="font-size:14px;font-weight:700;color:${color};margin-bottom:6px;">
          ${severityConfig.icon} ${alert.info.headline}
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">
          ${alert.info.event} • ${alert.info.area.provinces.join(", ")}
        </div>
        <div style="font-size:11px;color:#64748b;">
          ${alert.info.description.substring(0, 120)}...
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      className: "alert-popup",
      closeButton: false,
      offset: [0, -20],
    });

    marker.on("click", () => {
      onSelect(alert);
    });

    markerRef.current = marker;

    // Create circle for alert area
    if (area.circle) {
      const circle = L.circle([area.circle.lat, area.circle.lng], {
        radius: area.circle.radiusKm * 1000,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      circleRef.current = circle;
    }

    return () => {
      marker.remove();
      circleRef.current?.remove();
      markerRef.current = null;
      circleRef.current = null;
    };
  }, [map, alert, onSelect]);

  // Highlight selected
  useEffect(() => {
    if (markerRef.current) {
      if (isSelected) {
        markerRef.current.openPopup();
      } else {
        markerRef.current.closePopup();
      }
    }
  }, [isSelected]);

  return null;
}

// =============================================================================
// SOS MARKER
// =============================================================================

function SOSMarker({
  sos,
  isSelected,
  onSelect,
}: {
  sos: SOSRequest;
  isSelected: boolean;
  onSelect: (sos: SOSRequest) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const sosConfig = SOS_TYPE_CONFIG[sos.situation.type];
    const statusConfig = SOS_STATUS_CONFIG[sos.status];
    const isActive = ["queued", "sent", "delivered", "acknowledged", "dispatched"].includes(sos.status);

    const markerIcon = L.divIcon({
      className: "sos-marker",
      html: `
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
          ${isActive ? `
            <div class="pulse-ring" style="position:absolute;inset:-8px;border:3px solid #DC2626;border-radius:50%;animation:pulse-expand 1.5s ease-out infinite;"></div>
            <div class="pulse-ring" style="position:absolute;inset:-8px;border:3px solid #DC2626;border-radius:50%;animation:pulse-expand 1.5s ease-out 0.5s infinite;"></div>
          ` : ""}
          <div style="
            width:32px;height:32px;
            background:${isActive ? "#DC2626" : "#6B7280"}33;
            border:2px solid ${isActive ? "#DC2626" : "#6B7280"};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;
            box-shadow:0 0 20px ${isActive ? "#DC2626" : "#6B7280"}55;
            ${isActive ? "animation:glow-breathe 1.5s ease-in-out infinite;" : ""}
          ">${sosConfig.icon}</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker(
      [sos.location.lat, sos.location.lng],
      { icon: markerIcon }
    ).addTo(map);

    // Popup
    const popupContent = `
      <div style="font-family:system-ui;min-width:180px;">
        <div style="font-size:13px;font-weight:700;color:#DC2626;margin-bottom:4px;">
          ${sosConfig.icon} SOS - ${sosConfig.labelVi}
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">
          ${statusConfig.icon} ${statusConfig.labelVi} • ${sos.situation.peopleCount} người
        </div>
        <div style="font-size:11px;color:#64748b;">
          ${sos.location.address || `${sos.location.lat.toFixed(4)}, ${sos.location.lng.toFixed(4)}`}
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      className: "sos-popup",
      closeButton: false,
      offset: [0, -18],
    });

    marker.on("click", () => {
      onSelect(sos);
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, sos, onSelect]);

  useEffect(() => {
    if (markerRef.current) {
      if (isSelected) {
        markerRef.current.openPopup();
      } else {
        markerRef.current.closePopup();
      }
    }
  }, [isSelected]);

  return null;
}

// =============================================================================
// USER LOCATION MARKER
// =============================================================================

function UserLocationMarker({
  position,
}: {
  position: { lat: number; lng: number };
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    const markerIcon = L.divIcon({
      className: "user-location-marker",
      html: `
        <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;inset:-6px;
            border:2px solid #3B82F6;
            border-radius:50%;
            animation:pulse-expand 2s ease-out infinite;
            opacity:0.5;
          "></div>
          <div style="
            width:16px;height:16px;
            background:#3B82F6;
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 0 12px #3B82F688;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([position.lat, position.lng], {
      icon: markerIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    // Accuracy circle
    const accuracy = L.circle([position.lat, position.lng], {
      radius: 500, // Default 500m accuracy
      color: "#3B82F6",
      fillColor: "#3B82F6",
      fillOpacity: 0.06,
      weight: 1,
      dashArray: "4 4",
    }).addTo(map);

    markerRef.current = marker;
    accuracyRef.current = accuracy;

    return () => {
      marker.remove();
      accuracy.remove();
      markerRef.current = null;
      accuracyRef.current = null;
    };
  }, [map, position.lat, position.lng]);

  return null;
}

// =============================================================================
// MAP ZOOM CONTROLS
// =============================================================================

function ZoomControls() {
  const map = useMap();

  return (
    <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => map.zoomIn()}
        className={clsx(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50",
          "text-slate-300 hover:text-white hover:border-slate-600/70",
          "transition-all duration-200"
        )}
      >
        <ZoomIn className="w-4 h-4" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => map.zoomOut()}
        className={clsx(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          "bg-slate-900/80 backdrop-blur-xl border border-slate-700/50",
          "text-slate-300 hover:text-white hover:border-slate-600/70",
          "transition-all duration-200"
        )}
      >
        <ZoomOut className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// =============================================================================
// FLY TO USER CONTROLLER
// =============================================================================

function FlyToController({
  shouldFly,
  position,
  onFlyComplete,
}: {
  shouldFly: boolean;
  position: { lat: number; lng: number };
  onFlyComplete: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (shouldFly) {
      map.flyTo([position.lat, position.lng], 12, {
        duration: 1.5,
      });
      onFlyComplete();
    }
  }, [shouldFly, map, position, onFlyComplete]);

  return null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function AlertMapComponent({
  alerts,
  sosRequests,
  userLocation,
  selectedAlert,
  onAlertSelect,
  onSOSSelect,
  className,
}: AlertMapProps) {
  const [layers, setLayers] = useState<MapLayerConfig[]>(DEFAULT_LAYERS);
  const [shouldFlyToUser, setShouldFlyToUser] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const handleLocateUser = useCallback(() => {
    if (userLocation) {
      setShouldFlyToUser(true);
    } else {
      setIsLocating(true);
      // Try to get location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setIsLocating(false);
            setShouldFlyToUser(true);
          },
          () => {
            setIsLocating(false);
          },
          { timeout: 10000 }
        );
      } else {
        setIsLocating(false);
      }
    }
  }, [userLocation]);

  const handleFlyComplete = useCallback(() => {
    setShouldFlyToUser(false);
  }, []);

  const handleAlertSelect = useCallback(
    (alert: Alert) => {
      onAlertSelect(alert);
    },
    [onAlertSelect]
  );

  const handleSOSSelect = useCallback(
    (sos: SOSRequest) => {
      onSOSSelect(sos);
    },
    [onSOSSelect]
  );

  // Layer visibility
  const showAlertLayer = layers.find((l) => l.id === "alerts")?.visible ?? true;
  const showSOSLayer = layers.find((l) => l.id === "sos")?.visible ?? true;
  const showUserLayer = layers.find((l) => l.id === "user")?.visible ?? true;

  // Active SOS (should pulse)
  const activeSOSCount = useMemo(
    () => sosRequests.filter((s) => ["queued", "sent", "delivered", "dispatched"].includes(s.status)).length,
    [sosRequests]
  );

  return (
    <div className={clsx("relative w-full h-full rounded-2xl overflow-hidden border border-slate-800/50", className)}>
      {/* Map */}
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="w-full h-full"
        style={{ height: "100%", minHeight: "500px" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Alert Zone Markers */}
        {showAlertLayer &&
          alerts.map((alert) => (
            <AlertZoneMarker
              key={alert.id}
              alert={alert}
              isSelected={selectedAlert?.id === alert.id}
              onSelect={handleAlertSelect}
            />
          ))}

        {/* SOS Markers */}
        {showSOSLayer &&
          sosRequests.map((sos) => (
            <SOSMarker
              key={sos.id}
              sos={sos}
              isSelected={false}
              onSelect={handleSOSSelect}
            />
          ))}

        {/* User Location */}
        {showUserLayer && userLocation && (
          <UserLocationMarker position={userLocation} />
        )}

        {/* Fly to user controller */}
        {userLocation && (
          <FlyToController
            shouldFly={shouldFlyToUser}
            position={userLocation}
            onFlyComplete={handleFlyComplete}
          />
        )}

        {/* Zoom controls */}
        <ZoomControls />
      </MapContainer>

      {/* Layer controls */}
      <MapControlsPanel
        layers={layers}
        onToggleLayer={toggleLayer}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
      />

      {/* Severity legend */}
      <SeverityLegend />

      {/* Top-left info badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            "bg-slate-900/80 backdrop-blur-xl",
            "border border-slate-700/50"
          )}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-slate-300">
              {alerts.length} cảnh báo
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700/50" />
          <div className="flex items-center gap-1.5">
            <Siren className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-slate-300">
              {activeSOSCount} SOS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AlertMapComponent);
