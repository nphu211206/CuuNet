import type { DisasterType, SeverityLevel } from "./types";

export const MAP_CONFIG = {
  center: [14.0583, 108.2772] as [number, number],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
  tileUrl:
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: "Khẩn cấp",
  high: "Nguy hiểm",
  medium: "Cảnh báo",
  low: "Thấp",
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

export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1";
export const OPEN_METEO_GEOCODING_URL =
  "https://geocoding-api.open-meteo.com/v1";
