"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Filter,
  X,
  Flame,
  MapPin,
  Cloud,
  Eye,
  EyeOff,
  Locate,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Navigation,
} from "lucide-react";
import type { DisasterType, SeverityLevel, MapLayer } from "@/lib/types";
import { DISASTER_CONFIG, SEVERITY_COLORS } from "../config/map-config";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  activeTypes: DisasterType[];
  onToggleType: (type: DisasterType) => void;
  activeSeverities: SeverityLevel[];
  onToggleSeverity: (severity: SeverityLevel) => void;
}

interface ExtendedMapControlsProps extends MapControlsProps {
  onLocateUser?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export default function MapControls({
  layers,
  onToggleLayer,
  activeTypes,
  onToggleType,
  activeSeverities,
  onToggleSeverity,
  onLocateUser,
  onToggleFullscreen,
  isFullscreen,
}: ExtendedMapControlsProps) {
  const [showLayers, setShowLayers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      {/* Layer Toggle Button */}
      <button
        onClick={() => {
          setShowLayers(!showLayers);
          setShowFilters(false);
        }}
        className={cn(
          "absolute top-4 right-4 z-[1000] p-2.5 rounded-xl transition-all",
          showLayers
            ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
            : "glass text-slate-500 hover:text-white"
        )}
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* Filter Button */}
      <button
        onClick={() => {
          setShowFilters(!showFilters);
          setShowLayers(false);
        }}
        className={cn(
          "absolute top-4 right-16 z-[1000] p-2.5 rounded-xl transition-all",
          showFilters
            ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
            : "glass text-slate-500 hover:text-white"
        )}
      >
        <Filter className="w-5 h-5" />
      </button>

      {/* Layers Panel */}
      <AnimatePresence>
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 right-4 z-[1000] glass-card p-4 w-56"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Lớp bản đồ</h3>
              <button
                onClick={() => setShowLayers(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    layer.visible
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-500 hover:text-white hover:bg-slate-100"
                  )}
                >
                  {layer.type === "heatmap" && <Flame className="w-4 h-4" />}
                  {layer.type === "markers" && <MapPin className="w-4 h-4" />}
                  {layer.type === "weather" && <Cloud className="w-4 h-4" />}
                  {layer.type === "choropleth" && (
                    <Layers className="w-4 h-4" />
                  )}
                  <span className="flex-1 text-left">{layer.name}</span>
                  {layer.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 right-16 z-[1000] glass-card p-4 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Bộ lọc</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Disaster Types */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-slate-500 mb-2">
                Loại thiên tai
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(DISASTER_CONFIG) as [DisasterType, { label: string; icon: string; color: string }][]).map(
                  ([type, config]) => (
                    <button
                      key={type}
                      onClick={() => onToggleType(type)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                        activeTypes.includes(type)
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : "border-slate-700 text-slate-500 hover:border-slate-600"
                      )}
                    >
                      {config.icon} {config.label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Severity Levels */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-2">
                Mức độ nghiêm trọng
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(["critical", "high", "medium", "low"] as SeverityLevel[]).map(
                  (severity) => (
                    <button
                      key={severity}
                      onClick={() => onToggleSeverity(severity)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                        activeSeverities.includes(severity)
                          ? "border-opacity-30 bg-opacity-10"
                          : "border-slate-700 text-slate-500 hover:border-slate-600"
                      )}
                      style={
                        activeSeverities.includes(severity)
                          ? {
                              borderColor: `${SEVERITY_COLORS[severity]}44`,
                              backgroundColor: `${SEVERITY_COLORS[severity]}11`,
                              color: SEVERITY_COLORS[severity],
                            }
                          : undefined
                      }
                    >
                      {severity === "critical"
                        ? "Khẩn cấp"
                        : severity === "high"
                          ? "Nguy hiểm"
                          : severity === "medium"
                            ? "Cảnh báo"
                            : "Thấp"}
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-right controls: Location + Fullscreen */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Location Button */}
        {onLocateUser && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLocateUser}
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:text-white hover:border-slate-500 transition-all shadow-lg"
            title="Vị trí của tôi"
          >
            <Locate className="w-4 h-4" />
          </motion.button>
        )}

        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleFullscreen}
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:text-white hover:border-slate-500 transition-all shadow-lg"
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
        )}

        {/* Compass */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:text-white hover:border-slate-500 transition-all shadow-lg"
          title="Hướng Bắc"
        >
          <Navigation className="w-4 h-4" />
        </motion.button>
      </div>
    </>
  );
}
