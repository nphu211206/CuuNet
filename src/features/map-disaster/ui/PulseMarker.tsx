"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { DisasterEvent } from "@/lib/types";
import { SEVERITY_COLORS, DISASTER_ICONS } from "../config/map-config";

interface PulseMarkerProps {
  disaster: DisasterEvent;
  onClick?: (disaster: DisasterEvent) => void;
}

export default function PulseMarker({ disaster, onClick }: PulseMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const color = SEVERITY_COLORS[disaster.severity];
    const icon = DISASTER_ICONS[disaster.type];
    const isActive = disaster.status === "active";

    const pulseHtml = isActive
      ? `<div class="pulse-ring" style="position:absolute;inset:-4px;border:2px solid ${color};border-radius:50%;animation:pulse-expand 2s ease-out infinite;"></div>
         <div class="pulse-ring" style="position:absolute;inset:-4px;border:2px solid ${color};border-radius:50%;animation:pulse-expand 2s ease-out 0.6s infinite;"></div>`
      : "";

    const markerIcon = L.divIcon({
      className: "disaster-marker",
      html: `
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
          ${pulseHtml}
          <div style="
            width:36px;height:36px;
            background:${color}22;
            border:2px solid ${color};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;
            box-shadow:0 0 12px ${color}44;
            ${isActive ? "animation:glow-breathe 2s ease-in-out infinite;" : ""}
          ">${icon}</div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });

    const marker = L.marker(
      [disaster.location.lat, disaster.location.lng],
      { icon: markerIcon }
    ).addTo(map);

    marker.on("click", () => {
      onClick?.(disaster);
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, disaster, onClick]);

  return null;
}
