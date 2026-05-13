"use client";

import { useEffect, useRef, useCallback } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { Province } from "@/lib/types";

interface ProvinceChoroplethProps {
  provinces: Province[];
  geojsonData?: GeoJSON.FeatureCollection | null;
  onProvinceClick?: (province: Province) => void;
  visible?: boolean;
}

function getRiskColor(risk: string): string {
  const colors: Record<string, string> = {
    critical: "rgba(239, 68, 68, 0.35)",
    high: "rgba(249, 115, 22, 0.3)",
    medium: "rgba(234, 179, 8, 0.25)",
    low: "rgba(34, 197, 94, 0.25)",
  };
  return colors[risk] ?? "rgba(34, 197, 94, 0.1)";
}

function getRiskBorderColor(risk: string): string {
  const colors: Record<string, string> = {
    critical: "#EF4444",
    high: "#F97316",
    medium: "#EAB308",
    low: "#22C55E",
  };
  return colors[risk] ?? "#22C55E";
}

export default function ProvinceChoropleth({
  provinces,
  geojsonData,
  onProvinceClick,
  visible = true,
}: ProvinceChoroplethProps) {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const infoRef = useRef<L.Control | null>(null);

  const style = useCallback(
    (feature?: GeoJSON.Feature) => {
      const provinceName = feature?.properties?.NAME_1 ?? feature?.properties?.name ?? "";
      const province = provinces.find(
        (p) => p.name === provinceName || p.name.includes(provinceName)
      );
      const risk = province?.riskLevel ?? "low";

      return {
        fillColor: getRiskColor(risk),
        weight: 1.5,
        opacity: 0.8,
        color: getRiskBorderColor(risk),
        dashArray: "3",
        fillOpacity: visible ? 0.6 : 0,
      };
    },
    [provinces, visible]
  );

  const highlightFeature = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: "#60a5fa",
      dashArray: "",
      fillOpacity: 0.7,
    });
    layer.bringToFront();

    if (infoRef.current) {
      const props = layer.feature?.properties;
      (infoRef.current as any).update(props);
    }
  }, []);

  const resetHighlight = useCallback(
    (e: L.LeafletMouseEvent) => {
      geoJsonRef.current?.resetStyle(e.target);
      if (infoRef.current) {
        (infoRef.current as any).update();
      }
    },
    []
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer) => {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: (e: L.LeafletMouseEvent) => {
          const provinceName =
            feature.properties?.NAME_1 ?? feature.properties?.name ?? "";
          const province = provinces.find(
            (p) => p.name === provinceName || p.name.includes(provinceName)
          );
          if (province) {
            map.flyTo([province.center.lat, province.center.lng], 9, {
              duration: 1.5,
            });
            onProvinceClick?.(province);
          }
        },
      });
    },
    [highlightFeature, resetHighlight, provinces, map, onProvinceClick]
  );

  useEffect(() => {
    const InfoControl = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create("div", "info-control");
        (this as any)._div = div;
        (this as any).update();
        return div;
      },
      update(props?: Record<string, unknown>) {
        (this as any)._div.innerHTML = props
          ? `<div class="glass-card px-3 py-2 text-sm">
              <h4 class="font-bold text-white text-xs mb-1">Tỉnh/Thành phố</h4>
              <b class="text-blue-400">${props.NAME_1 ?? props.name ?? "N/A"}</b>
            </div>`
          : '<div class="glass-card px-3 py-2 text-xs text-slate-400">Hover để xem tên tỉnh</div>';
      },
    });

    const info = new InfoControl({ position: "topright" });
    info.addTo(map);
    infoRef.current = info as any;

    return () => {
      info.remove();
      infoRef.current = null;
    };
  }, [map]);

  if (!visible || !geojsonData) return null;

  return (
    <GeoJSON
      ref={geoJsonRef as any}
      data={geojsonData}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
