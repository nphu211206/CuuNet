/**
 * Real-time API Integration Utility
 * 
 * Tổng hợp tất cả external APIs cho CứuNet:
 * - USGS: Earthquake data
 * - GDACS: Global disaster alerts
 * - ReliefWeb: Disaster news
 * - Open-Meteo: Weather data
 * 
 * Tất cả APIs đều free, không cần auth.
 */

// === TYPES ===

export interface RealtimeWeather {
  location: string;
  lat: number;
  lng: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  timestamp: string;
}

export interface RealtimeEarthquake {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  lat: number;
  lng: number;
  depth: number;
  tsunami: boolean;
  url: string;
}

export interface RealtimeStats {
  earthquakesToday: number;
  maxMagnitudeToday: number;
  weatherAlerts: number;
  lastUpdated: string;
}

// === CONSTANTS ===

const VIETNAM_MAJOR_CITIES = [
  { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
  { name: "TP.HCM", lat: 10.8231, lng: 106.6297 },
  { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
  { name: "Hải Phòng", lat: 20.8449, lng: 106.6881 },
  { name: "Cần Thơ", lat: 10.0452, lng: 105.7469 },
];

const VN_BOUNDS = {
  minLat: 8,
  maxLat: 23,
  minLng: 102,
  maxLng: 110,
};

// === WEATHER API ===

/**
 * Lấy thời tiết real-time cho các thành phố lớn VN
 */
export async function getVietnamWeather(): Promise<RealtimeWeather[]> {
  const lats = VIETNAM_MAJOR_CITIES.map((c) => c.lat).join(",");
  const lngs = VIETNAM_MAJOR_CITIES.map((c) => c.lng).join(",");

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&timezone=Asia/Ho_Chi_Minh`;

    const res = await fetch(url, { next: { revalidate: 1800 } }); // Cache 30min

    if (!res.ok) {
      console.warn("[Weather] API error:", res.status);
      return [];
    }

    const data = await res.json();
    const results = Array.isArray(data) ? data : [data];

    return results.map((item: any, i: number) => ({
      location: VIETNAM_MAJOR_CITIES[i]?.name || "Unknown",
      lat: VIETNAM_MAJOR_CITIES[i]?.lat || 0,
      lng: VIETNAM_MAJOR_CITIES[i]?.lng || 0,
      temperature: item.current?.temperature_2m ?? 0,
      humidity: item.current?.relative_humidity_2m ?? 0,
      precipitation: item.current?.precipitation ?? 0,
      windSpeed: item.current?.wind_speed_10m ?? 0,
      windDirection: item.current?.wind_direction_10m ?? 0,
      timestamp: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("[Weather] Fetch failed:", (err as Error).message);
    return [];
  }
}

// === EARTHQUAKE API ===

/**
 * Lấy dữ liệu động đất gần VN (7 ngày gần nhất)
 */
export async function getRecentEarthquakes(
  days = 7,
  minMag = 2.5
): Promise<RealtimeEarthquake[]> {
  const startDate = new Date(Date.now() - days * 86400000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    format: "geojson",
    starttime: startDate,
    minlatitude: String(VN_BOUNDS.minLat),
    maxlatitude: String(VN_BOUNDS.maxLat),
    minlongitude: String(VN_BOUNDS.minLng),
    maxlongitude: String(VN_BOUNDS.maxLng),
    minmagnitude: String(minMag),
    orderby: "time",
  });

  try {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) {
      console.warn("[USGS] API error:", res.status);
      return [];
    }

    const data = await res.json();
    return (data.features ?? []).map((f: any) => ({
      id: f.id,
      magnitude: f.properties?.mag ?? 0,
      place: f.properties?.place ?? "Unknown",
      time: new Date(f.properties?.time ?? 0).toISOString(),
      lat: f.geometry?.coordinates?.[1] ?? 0,
      lng: f.geometry?.coordinates?.[0] ?? 0,
      depth: f.geometry?.coordinates?.[2] ?? 0,
      tsunami: (f.properties?.tsunami ?? 0) === 1,
      url: f.properties?.url ?? "",
    }));
  } catch (err) {
    console.warn("[USGS] Fetch failed:", (err as Error).message);
    return [];
  }
}

// === REALTIME STATS ===

/**
 * Tổng hợp stats real-time cho homepage
 */
export async function getRealtimeStats(): Promise<RealtimeStats> {
  const earthquakes = await getRecentEarthquakes(1, 0);

  return {
    earthquakesToday: earthquakes.length,
    maxMagnitudeToday:
      earthquakes.length > 0
        ? Math.max(...earthquakes.map((e) => e.magnitude))
        : 0,
    weatherAlerts: 0, // Placeholder — GDACS integration
    lastUpdated: new Date().toISOString(),
  };
}

// === RELIEF WEB (News) ===

/**
 * Lấy tin tức thiên tai mới nhất từ ReliefWeb
 */
export async function getDisasterNews(limit = 5): Promise<
  Array<{
    id: string;
    title: string;
    date: string;
    source: string;
    url: string;
    country: string;
  }>
> {
  try {
    const url = `https://api.reliefweb.int/v1/disasters?appname=cuunet&limit=${limit}&sort[]=date:desc&filter[field]=country&filter[value]=Viet%20Nam`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1h

    if (!res.ok) {
      console.warn("[ReliefWeb] API error:", res.status);
      return [];
    }

    const data = await res.json();

    return (data.data ?? []).map((item: any) => ({
      id: item.id?.toString() ?? "",
      title: item.fields?.name ?? "Unknown",
      date: item.fields?.date?.created ?? "",
      source: "ReliefWeb",
      url: item.fields?.url ?? "",
      country: "Vietnam",
    }));
  } catch (err) {
    console.warn("[ReliefWeb] Fetch failed:", (err as Error).message);
    return [];
  }
}