import type { WeatherData, Province } from "@/lib/types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
}

export async function getWeatherForProvince(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&timezone=Asia/Ho_Chi_Minh`;

  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data: OpenMeteoResponse = await res.json();

  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
  };
}

export async function getBatchWeather(
  provinces: Province[]
): Promise<Map<string, WeatherData>> {
  const result = new Map<string, WeatherData>();

  if (provinces.length === 0) return result;

  const lats = provinces.map((p) => p.center.lat).join(",");
  const lons = provinces.map((p) => p.center.lng).join(",");

  const url = `${OPEN_METEO_BASE}/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&timezone=Asia/Ho_Chi_Minh`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      throw new Error(`Weather API error: ${res.status}`);
    }

    const data = await res.json();

    const results = Array.isArray(data) ? data : [data];

    results.forEach((item: OpenMeteoResponse, index: number) => {
      if (index < provinces.length) {
        result.set(provinces[index].name, {
          temperature: item.current.temperature_2m,
          humidity: item.current.relative_humidity_2m,
          precipitation: item.current.precipitation,
          windSpeed: item.current.wind_speed_10m,
          windDirection: item.current.wind_direction_10m,
        });
      }
    });
  } catch (error) {
    console.error("Batch weather fetch failed:", error);
  }

  return result;
}
