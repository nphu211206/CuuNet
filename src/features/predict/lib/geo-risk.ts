import type { DisasterType, WeatherData } from "@/lib/types";

/**
 * Base disaster frequency by province (0-1)
 * Based on EM-DAT historical data and Vietnam MARD statistics.
 * Higher value = more frequent historical occurrence.
 */
export const BASE_FREQUENCY: Record<string, Record<DisasterType, number>> = {
  "Quảng Bình":   { flood: 0.92, storm: 0.75, landslide: 0.65, drought: 0.15, earthquake: 0.05, tsunami: 0.10 },
  "Đà Nẵng":      { flood: 0.70, storm: 0.90, landslide: 0.45, drought: 0.10, earthquake: 0.08, tsunami: 0.15 },
  "Huế":           { flood: 0.85, storm: 0.80, landslide: 0.55, drought: 0.12, earthquake: 0.05, tsunami: 0.12 },
  "Lào Cai":       { flood: 0.55, storm: 0.30, landslide: 0.92, drought: 0.20, earthquake: 0.15, tsunami: 0.00 },
  "Yên Bái":       { flood: 0.50, storm: 0.35, landslide: 0.88, drought: 0.18, earthquake: 0.12, tsunami: 0.00 },
  "Quảng Nam":     { flood: 0.80, storm: 0.85, landslide: 0.70, drought: 0.10, earthquake: 0.06, tsunami: 0.10 },
  "Cần Thơ":       { flood: 0.60, storm: 0.25, landslide: 0.02, drought: 0.90, earthquake: 0.02, tsunami: 0.05 },
  "An Giang":      { flood: 0.65, storm: 0.20, landslide: 0.01, drought: 0.88, earthquake: 0.02, tsunami: 0.03 },
  "Bến Tre":       { flood: 0.45, storm: 0.30, landslide: 0.01, drought: 0.85, earthquake: 0.02, tsunami: 0.05 },
  "Hà Nội":        { flood: 0.55, storm: 0.40, landslide: 0.10, drought: 0.30, earthquake: 0.05, tsunami: 0.00 },
  "Hải Phòng":     { flood: 0.50, storm: 0.65, landslide: 0.05, drought: 0.20, earthquake: 0.08, tsunami: 0.08 },
  "Hồ Chí Minh":   { flood: 0.40, storm: 0.30, landslide: 0.01, drought: 0.35, earthquake: 0.03, tsunami: 0.05 },
  "Trà Vinh":      { flood: 0.40, storm: 0.25, landslide: 0.01, drought: 0.80, earthquake: 0.02, tsunami: 0.05 },
  "Đà Lạt":        { flood: 0.30, storm: 0.20, landslide: 0.75, drought: 0.40, earthquake: 0.10, tsunami: 0.00 },
  "Nha Trang":     { flood: 0.45, storm: 0.70, landslide: 0.30, drought: 0.25, earthquake: 0.12, tsunami: 0.18 },
};

/**
 * Province exposure - normalized population density (0-1)
 * Based on Vietnam General Statistics Office data.
 */
export const PROVINCE_EXPOSURE: Record<string, number> = {
  "Hà Nội": 1.00,
  "Hồ Chí Minh": 0.95,
  "Hải Phòng": 0.70,
  "Đà Nẵng": 0.60,
  "Cần Thơ": 0.55,
  "Huế": 0.45,
  "Nha Trang": 0.50,
  "Quảng Bình": 0.35,
  "Quảng Nam": 0.40,
  "Bến Tre": 0.50,
  "Trà Vinh": 0.40,
  "An Giang": 0.55,
  "Lào Cai": 0.20,
  "Yên Bái": 0.22,
  "Đà Lạt": 0.25,
};

/**
 * Province vulnerability - 1 minus resilience index (0-1)
 * Higher = more vulnerable to disasters.
 * Based on infrastructure quality, poverty rate, emergency response capacity.
 */
export const PROVINCE_VULNERABILITY: Record<string, number> = {
  "Quảng Bình": 0.85,
  "Lào Cai": 0.80,
  "Yên Bái": 0.82,
  "Huế": 0.65,
  "Quảng Nam": 0.70,
  "Cần Thơ": 0.55,
  "An Giang": 0.60,
  "Bến Tre": 0.65,
  "Trà Vinh": 0.70,
  "Đà Nẵng": 0.30,
  "Hà Nội": 0.20,
  "Hồ Chí Minh": 0.25,
  "Hải Phòng": 0.35,
  "Đà Lạt": 0.45,
  "Nha Trang": 0.40,
};

/**
 * Geographic classification for provinces.
 */
export type GeoType = "coastal" | "mountain" | "delta" | "urban" | "highland";

export const PROVINCE_GEO_TYPE: Record<string, GeoType> = {
  "Quảng Bình": "coastal",
  "Đà Nẵng": "coastal",
  "Huế": "coastal",
  "Lào Cai": "mountain",
  "Yên Bái": "mountain",
  "Quảng Nam": "coastal",
  "Cần Thơ": "delta",
  "An Giang": "delta",
  "Bến Tre": "delta",
  "Hà Nội": "urban",
  "Hải Phòng": "coastal",
  "Hồ Chí Minh": "urban",
  "Trà Vinh": "delta",
  "Đà Lạt": "highland",
  "Nha Trang": "coastal",
};

/**
 * Geographic risk boost by geo type and disaster type.
 * Applied as a multiplier to the base risk.
 */
const GEO_RISK_BOOST: Record<GeoType, Partial<Record<DisasterType, number>>> = {
  coastal: { storm: 1.3, tsunami: 1.5, flood: 1.1 },
  mountain: { landslide: 1.4, earthquake: 1.2, flood: 0.8 },
  delta:   { flood: 1.3, drought: 1.2 },
  urban:   { flood: 1.1 },
  highland: { landslide: 1.3, drought: 1.2 },
};

/**
 * Get geographic factor for a province and disaster type.
 * Returns a multiplier (typically 0.8-1.5).
 */
export function getGeographicFactor(province: string, type: DisasterType): number {
  const geoType = PROVINCE_GEO_TYPE[province];
  if (!geoType) return 1.0;
  return GEO_RISK_BOOST[geoType]?.[type] ?? 1.0;
}

/**
 * Get base frequency for a province and disaster type.
 */
export function getBaseFrequency(province: string, type: DisasterType): number {
  return BASE_FREQUENCY[province]?.[type] ?? 0.1;
}

/**
 * Get exposure value for a province.
 */
export function getExposure(province: string): number {
  return PROVINCE_EXPOSURE[province] ?? 0.3;
}

/**
 * Get vulnerability value for a province.
 */
export function getVulnerability(province: string): number {
  return PROVINCE_VULNERABILITY[province] ?? 0.5;
}

/**
 * Get weather modifier based on current weather conditions and disaster type.
 * Returns a multiplier (typically 0.5-1.5).
 */
export function getWeatherModifier(weather: WeatherData, type: DisasterType): number {
  switch (type) {
    case "flood":
      if (weather.precipitation > 80) return 1.5;
      if (weather.precipitation > 50) return 1.3;
      if (weather.precipitation > 20) return 1.1;
      if (weather.precipitation < 5) return 0.7;
      return 1.0;
    case "storm":
      if (weather.windSpeed > 100) return 1.5;
      if (weather.windSpeed > 60) return 1.3;
      if (weather.windSpeed > 40) return 1.1;
      return 0.8;
    case "landslide":
      if (weather.humidity > 90 && weather.precipitation > 30) return 1.5;
      if (weather.humidity > 80 && weather.precipitation > 15) return 1.2;
      return 0.9;
    case "drought":
      if (weather.temperature > 38 && weather.precipitation < 2) return 1.5;
      if (weather.temperature > 35 && weather.precipitation < 5) return 1.3;
      if (weather.precipitation > 30) return 0.5;
      return 1.0;
    case "earthquake":
    case "tsunami":
      return 1.0; // Weather doesn't affect these
    default:
      return 1.0;
  }
}

/**
 * Get all province names from the data.
 */
export function getAllProvinces(): string[] {
  return Object.keys(BASE_FREQUENCY);
}

/**
 * Get disaster types relevant to a province's geography.
 */
export function getRelevantDisasterTypes(province: string): DisasterType[] {
  const geoType = PROVINCE_GEO_TYPE[province];
  const types: DisasterType[] = ["flood", "storm", "landslide", "drought", "earthquake", "tsunami"];

  // Filter by geographic relevance
  return types.filter((t) => {
    const freq = BASE_FREQUENCY[province]?.[t] ?? 0;
    const boost = getGeographicFactor(province, t);
    return freq > 0.1 || boost > 1.1;
  });
}
