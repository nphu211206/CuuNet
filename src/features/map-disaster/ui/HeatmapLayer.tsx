"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { HEATMAP_GRADIENT } from "../config/map-config";

interface HeatmapLayerProps {
  points: [number, number, number?][];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  visible?: boolean;
}

export default function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 17,
  max = 1.0,
  visible = true,
}: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !points || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius,
      blur,
      maxZoom,
      max,
      gradient: HEATMAP_GRADIENT,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, radius, blur, maxZoom, max, visible]);

  return null;
}
