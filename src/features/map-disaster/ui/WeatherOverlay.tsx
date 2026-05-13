"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { WeatherData, Province } from "@/lib/types";

interface WeatherOverlayProps {
  provinces: Province[];
  weatherData: Map<string, WeatherData>;
  visible?: boolean;
}

function getTemperatureColor(temp: number): string {
  if (temp >= 35) return "#EF4444";
  if (temp >= 30) return "#F97316";
  if (temp >= 25) return "#EAB308";
  if (temp >= 20) return "#22C55E";
  return "#3B82F6";
}

function getWeatherIcon(temp: number, precipitation: number): string {
  if (precipitation > 5) return "🌧️";
  if (precipitation > 0) return "🌦️";
  if (temp >= 35) return "🔥";
  if (temp >= 30) return "☀️";
  if (temp >= 25) return "⛅";
  return "🌤️";
}

export default function WeatherOverlay({
  provinces,
  weatherData,
  visible = true,
}: WeatherOverlayProps) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!visible) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      return;
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    provinces.forEach((province) => {
      const weather = weatherData.get(province.name);
      if (!weather) return;

      const color = getTemperatureColor(weather.temperature);
      const icon = getWeatherIcon(
        weather.temperature,
        weather.precipitation
      );

      const markerIcon = L.divIcon({
        className: "weather-marker",
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px);
            border: 1px solid ${color}33;
            border-radius: 12px;
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 8px ${color}22;
            white-space: nowrap;
          ">
            <span style="font-size:16px;">${icon}</span>
            <div style="display:flex;flex-direction:column;line-height:1.2;">
              <span style="color:${color};font-weight:700;font-size:13px;">${Math.round(weather.temperature)}°C</span>
              <span style="color:#94a3b8;font-size:10px;">${Math.round(weather.humidity)}%</span>
            </div>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 20],
      });

      const marker = L.marker(
        [province.center.lat, province.center.lng],
        { icon: markerIcon }
      ).addTo(map);

      marker.bindPopup(`
        <div style="
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 12px;
          min-width: 180px;
        ">
          <h4 style="color:#f1f5f9;font-weight:700;margin:0 0 8px 0;font-size:14px;">
            ${province.name}
          </h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div>
              <div style="color:#64748b;font-size:11px;">Nhiệt độ</div>
              <div style="color:${color};font-weight:600;">${weather.temperature.toFixed(1)}°C</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:11px;">Độ ẩm</div>
              <div style="color:#f1f5f9;font-weight:600;">${weather.humidity}%</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:11px;">Mưa</div>
              <div style="color:#f1f5f9;font-weight:600;">${weather.precipitation}mm</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:11px;">Gió</div>
              <div style="color:#f1f5f9;font-weight:600;">${weather.windSpeed}km/h</div>
            </div>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, provinces, weatherData, visible]);

  return null;
}
