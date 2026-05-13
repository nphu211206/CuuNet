# MASTER PLAN: Phase 1 - Module Bản đồ Thiên tai

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1 là module đầu tiên và là nền tảng cho tất cả module khác.

**Lý chọn Module 1 đầu tiên:**
- Tất cả module khác đều liên quan đến bản đồ
- Leaflet.js + react-leaflet đã cài đặt
- Module "showcase" tốt nhất cho hội đồng

---

## Scope: Bản đồ Thiên tai Real-time

### Tính năng chính (10 features)
1. Interactive map (Leaflet.js + CartoDB Dark Matter tiles)
2. Animated pulse markers theo loại thiên tai
3. Heatmap mật độ thiên tai (Leaflet.heat)
4. Province choropleth (GeoJSON + color coding rủi ro)
5. Custom dark-themed popups
6. Filter sidebar với Framer Motion animations
7. Stats bar với animated counters
8. Layer toggle (heatmap, choropleth, markers, weather)
9. Timeline slider (disaster progression playback)
10. Weather overlay (Open-Meteo API)

---

## Implementation (20 Tasks - COMPLETED)

### Phase 1A: Foundation (Tasks 1-5) ✅

| Task | File | Status |
|------|------|--------|
| 1 | `src/lib/utils.ts`, `src/lib/types.ts`, `src/lib/constants.ts` | ✅ |
| 2 | `src/data/disaster-data.ts` (12 disasters + 6 SOS) | ✅ |
| 3 | `src/components/shared/Navbar.tsx` | ✅ |
| 4 | `src/components/shared/Footer.tsx` | ✅ |
| 5 | `src/app/globals.css` (design tokens) | ✅ |

### Phase 1B: Map Core (Tasks 6-13) ✅

| Task | File | Status |
|------|------|--------|
| 6 | `next.config.ts` + `leaflet.heat` install | ✅ |
| 7 | `src/features/map-disaster/config/map-config.ts` | ✅ |
| 8 | `src/features/map-disaster/ui/PulseMarker.tsx` | ✅ |
| 9 | `src/features/map-disaster/ui/HeatmapLayer.tsx` | ✅ |
| 10 | `src/features/map-disaster/ui/ProvinceChoropleth.tsx` | ✅ |
| 11 | `src/features/map-disaster/ui/DisasterPopup.tsx` | ✅ |
| 12 | `src/features/map-disaster/ui/MapControls.tsx` | ✅ |
| 13 | `src/features/map-disaster/ui/DisasterMap.tsx` | ✅ |

### Phase 1C: Sidebar & Stats (Tasks 14-17) ✅

| Task | File | Status |
|------|------|--------|
| 14 | `src/features/map-disaster/ui/FilterSidebar.tsx` | ✅ |
| 15 | `src/features/map-disaster/ui/MapStatsBar.tsx` | ✅ |
| 16 | `src/features/map-disaster/ui/TimelineSlider.tsx` | ✅ |
| 17 | `src/features/map-disaster/ui/WeatherOverlay.tsx` | ✅ |

### Phase 1D: Page Assembly (Tasks 18-20) ✅

| Task | File | Status |
|------|------|--------|
| 18 | `src/features/map-disaster/api/weather.ts` | ✅ |
| 19 | `src/app/map/page.tsx` | ✅ |
| 20 | Verify & Polish | ✅ |

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── map/
│       └── page.tsx
├── components/
│   └── shared/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── features/
│   └── map-disaster/
│       ├── api/
│       │   └── weather.ts
│       ├── config/
│       │   └── map-config.ts
│       └── ui/
│           ├── DisasterMap.tsx
│           ├── HeatmapLayer.tsx
│           ├── PulseMarker.tsx
│           ├── ProvinceChoropleth.tsx
│           ├── DisasterPopup.tsx
│           ├── MapControls.tsx
│           ├── MapStatsBar.tsx
│           ├── TimelineSlider.tsx
│           └── WeatherOverlay.tsx
├── lib/
│   ├── utils.ts
│   ├── types.ts
│   └── constants.ts
└── data/
    └── disaster-data.ts
```

---

## Dependencies

```bash
npm install leaflet react-leaflet leaflet.heat framer-motion recharts lucide-react clsx tailwind-merge
npm install -D @types/leaflet @types/leaflet.heat
```

---

## Design Specifications

### Color Palette
```
Backgrounds:  #06080F, #0B0D17, #0F1121, #151829
Text:         #F1F5F9, #94A3B8, #64748B
Accent Blue:  #3B82F6
Accent Red:   #EF4444
Accent Orange:#F97316
Accent Yellow:#EAB308
Accent Green: #22C55E
Glass:        rgba(15, 17, 33, 0.7) bg, rgba(255, 255, 255, 0.08) border
```

### Map Tiles
**CartoDB Dark Matter** (free, no API key):
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

---

## Innovation Points

1. Animated Pulse Markers - CSS pulse rings theo severity
2. Heatmap với Custom Gradient - Dark theme optimized
3. Province Choropleth - Hover highlight, click fly-to
4. Glass Morphism UI - Backdrop blur, colored glow
5. Animated Stats Counters - Framer Motion number counting
6. Timeline Slider - Disaster progression playback
7. Dark Theme Map - CartoDB Dark Matter tiles
8. Weather Overlay - Open-Meteo real-time data
9. Layer Toggle System - Multiple visualization layers
10. Responsive Design - Mobile-first approach

---

## Status: ✅ COMPLETED

All 20 tasks completed. Build passes with zero errors. All 9 routes return 200 OK.
