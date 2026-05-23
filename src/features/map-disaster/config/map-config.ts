import type { SeverityLevel, DisasterType } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════
// TILE OPTIONS — 3 chế độ xem bản đồ
// ═══════════════════════════════════════════════════════════════════════

export type TileMode = "light" | "dark" | "satellite";

export const TILE_OPTIONS: Record<TileMode, { url: string; label: string; icon: string; attribution: string }> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    label: "Sáng",
    icon: "☀️",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    label: "Tối",
    icon: "🌙",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    label: "Vệ tinh",
    icon: "🛰️",
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
};

export const MAP_CONFIG = {
  center: [14.0583, 108.2772] as [number, number],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
  tileUrl: TILE_OPTIONS.light.url,
  attribution: TILE_OPTIONS.light.attribution,
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

export const SEVERITY_GLOW: Record<SeverityLevel, string> = {
  critical: "rgba(239, 68, 68, 0.4)",
  high: "rgba(249, 115, 22, 0.4)",
  medium: "rgba(234, 179, 8, 0.4)",
  low: "rgba(34, 197, 94, 0.4)",
};

export const DISASTER_ICONS: Record<DisasterType, string> = {
  flood: "🌊",
  storm: "🌪️",
  landslide: "⛰️",
  drought: "☀️",
  earthquake: "🔴",
  tsunami: "🌊",
};

export const DISASTER_CONFIG: Record<
  DisasterType,
  { label: string; icon: string; color: string }
> = {
  flood: { label: "Lũ lụt", icon: "🌊", color: "#3B82F6" },
  storm: { label: "Bão", icon: "🌪️", color: "#F59E0B" },
  landslide: { label: "Sạt lở", icon: "⛰️", color: "#A855F7" },
  drought: { label: "Hạn hán", icon: "☀️", color: "#F97316" },
  earthquake: { label: "Động đất", icon: "🔴", color: "#EF4444" },
  tsunami: { label: "Sóng thần", icon: "🌊", color: "#06B6D4" },
};

export const DISASTER_COLORS: Record<DisasterType, string> = {
  flood: "#3B82F6",
  storm: "#F59E0B",
  landslide: "#A855F7",
  drought: "#F97316",
  earthquake: "#EF4444",
  tsunami: "#06B6D4",
};

export const HEATMAP_GRADIENT = {
  0.0: "#0b0d17",
  0.15: "#1e3a5f",
  0.3: "#2563eb",
  0.5: "#3b82f6",
  0.65: "#eab308",
  0.8: "#f97316",
  0.9: "#ef4444",
  1.0: "#dc2626",
};

export const CHOROPLETH_COLORS = {
  none: "rgba(34, 197, 94, 0.1)",
  low: "rgba(34, 197, 94, 0.25)",
  medium: "rgba(234, 179, 8, 0.25)",
  high: "rgba(249, 115, 22, 0.3)",
  critical: "rgba(239, 68, 68, 0.35)",
};

export const VIETNAM_PROVINCES = [
  { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
  { name: "Hồ Chí Minh", lat: 10.8231, lng: 106.6297 },
  { name: "Đà Nẵng", lat: 16.0748, lng: 108.223 },
  { name: "Huế", lat: 16.4637, lng: 107.5909 },
  { name: "Cần Thơ", lat: 10.0452, lng: 105.7469 },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881 },
  { name: "Nha Trang", lat: 12.2388, lng: 109.1967 },
  { name: "Đà Lạt", lat: 11.9404, lng: 108.4583 },
  { name: "Quảng Bình", lat: 17.4689, lng: 106.6223 },
  { name: "Quảng Nam", lat: 15.8794, lng: 108.3353 },
  { name: "Bến Tre", lat: 10.2415, lng: 106.3759 },
  { name: "Trà Vinh", lat: 9.9513, lng: 106.3346 },
  { name: "Lào Cai", lat: 22.338, lng: 103.8447 },
  { name: "Yên Bái", lat: 21.7229, lng: 104.8722 },
  { name: "An Giang", lat: 10.5216, lng: 105.1259 },
];
