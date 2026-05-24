"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Droplets, Wind, Thermometer, Loader2 } from "lucide-react";

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
}

const WEATHER_ICONS: Record<string, string> = {
  hot: "🌡️",
  warm: "☀️",
  mild: "⛅",
  cool: "🌤️",
  cold: "❄️",
  rainy: "🌧️",
  stormy: "⛈️",
};

function getWeatherEmoji(temp: number, precipitation: number): string {
  if (precipitation > 5) return WEATHER_ICONS.stormy;
  if (precipitation > 1) return WEATHER_ICONS.rainy;
  if (temp > 35) return WEATHER_ICONS.hot;
  if (temp > 28) return WEATHER_ICONS.warm;
  if (temp > 22) return WEATHER_ICONS.mild;
  if (temp > 15) return WEATHER_ICONS.cool;
  return WEATHER_ICONS.cold;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const cities = [
          { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
          { name: "TP.HCM", lat: 10.8231, lng: 106.6297 },
          { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
        ];

        const lats = cities.map((c) => c.lat).join(",");
        const lngs = cities.map((c) => c.lng).join(",");

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=Asia/Ho_Chi_Minh`
        );

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const results = Array.isArray(data) ? data : [data];

        setWeather(
          results.map((item: any, i: number) => ({
            location: cities[i]?.name || "Unknown",
            temperature: Math.round(item.current?.temperature_2m ?? 0),
            humidity: item.current?.relative_humidity_2m ?? 0,
            precipitation: item.current?.precipitation ?? 0,
            windSpeed: Math.round(item.current?.wind_speed_10m ?? 0),
          }))
        );
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        <span className="ml-2 text-xs text-slate-500">Đang tải thời tiết...</span>
      </div>
    );
  }

  if (error || weather.length === 0) return null;

  return (
    <section className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.15em]">
            Thời tiết Real-time
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Open-Meteo API — Cập nhật mỗi 30 phút
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weather.map((city, i) => (
            <motion.div
              key={city.location}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">{city.location}</h4>
                <span className="text-2xl">
                  {getWeatherEmoji(city.temperature, city.precipitation)}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-3">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-black text-slate-900">{city.temperature}°C</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <Droplets className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                  <span className="text-[11px] font-semibold text-slate-700">{city.humidity}%</span>
                  <span className="text-[9px] text-slate-500 block">Độ ẩm</span>
                </div>
                <div>
                  <Cloud className="w-3.5 h-3.5 text-slate-500 mx-auto mb-0.5" />
                  <span className="text-[11px] font-semibold text-slate-700">{city.precipitation}mm</span>
                  <span className="text-[9px] text-slate-500 block">Mưa</span>
                </div>
                <div>
                  <Wind className="w-3.5 h-3.5 text-teal-500 mx-auto mb-0.5" />
                  <span className="text-[11px] font-semibold text-slate-700">{city.windSpeed}km/h</span>
                  <span className="text-[9px] text-slate-500 block">Gió</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Dữ liệu từ Open-Meteo API • Không cần API key • Cập nhật tự động
        </p>
      </div>
    </section>
  );
}