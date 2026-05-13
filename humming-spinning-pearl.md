# SUPER MASTER PLAN: Phase 6 - Module Trực Quan Hóa Dữ Liệu (Data Visualization Dashboard)

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1-5 đã hoàn thành:
- Phase 1: Bản đồ Thiên Tai ✅
- Phase 2: AI Dự Đoán ✅
- Phase 3: Báo cáo Cộng đồng ✅
- Phase 4: Cảnh Báo & SOS ✅
- Phase 5: Phối Hợp Cứu Trợ ✅ (24 files, ~12,800 lines)

**Phase 6: Module Trực Quan Hóa Dữ Liệu** - module biến dữ liệu thiên tai thành INSIGHTS có thể hành động. Đây là "brain" của luận văn.

**Tại sao module này là "intelligence layer":**
- Phase 1-5: Thu thập dữ liệu (bản đồ, dự đoán, báo cáo, cảnh báo, cứu hộ) = **DATA**
- Phase 6: Phân tích → Trực quan hóa → Xu hướng → So sánh = **INSIGHTS**
- Hội đồng: "Hệ thống không chỉ thu thập dữ liệu mà còn PHÂN TÍCH và TRỰC QUAN HÓA được"
- Kết nối toàn bộ: Hiển thị dữ liệu từ TẤT CẢ Phase 1-5 trong một dashboard thống nhất

**Tham khảo quốc tế:**
- UN OCHA HDX (Humanitarian Data Exchange) - crisis dashboard pattern
- EM-DAT (International Disaster Database) - bubble chart, trend analysis
- GDACS (Global Disaster Alert System) - real-time monitoring dashboard
- ReliefWeb - crisis page pattern
- DesInventar - bottom-up disaster inventory visualization

---

## Phần I: Phân tích Vấn đề - Trực quan hóa Dữ liệu Thiên tai Việt Nam

### 1.1. Thực trạng hiện tại

| Vấn đề | Mô tả | Nguồn |
|--------|--------|-------|
| **Dữ liệu phân tán** | Mỗi cơ quan có dữ liệu riêng, không tích hợp | VNDMA Gap Analysis |
| **Không có dashboard thống nhất** | Không nhìn thấy toàn cảnh thiên tai quốc gia | UNDRR Assessment |
| **Báo cáo PDF khó phân tích** | VNDMA xuất PDF, không interactive | Post-Yagi 2024 |
| **Không có so sánh tỉnh** | Không biết tỉnh nào bị nặng nhất | WB Vietnam |
| **Không có xu hướng thời gian** | Không thấy thiên tai tăng hay giảm | EM-DAT Gap |
| **Thiếu dữ liệu thời gian thực** | Dashboard cũ, cập nhật thủ công | GDACS Comparison |
| **Không có drill-down** | Không click từ quốc gia → tỉnh → huyện | DesInventar Pattern |
| **Không export được** | Không xuất CSV/PNG cho báo cáo | HDX Standard |

### 1.2. Khoảng cách CứuNet có thể lấp đầy

| Khoảng cách | Giải pháp CứuNet | Chuẩn tham khảo |
|-------------|-----------------|-----------------|
| Không có dashboard thống nhất | Multi-view Dashboard (4 chế độ) | HDX, GDACS |
| Không có xu hướng thời gian | Time Series Charts (2000-2024) | EM-DAT |
| Không có so sánh tỉnh | Province Comparison Charts | DesInventar |
| Không có phân bố loại thiên tai | Donut/Treemap Charts | EM-DAT |
| Không có bản đồ nhiệt | Choropleth + Heatmap | GDACS |
| Không có real-time monitoring | Operational Dashboard | GDACS |
| Không có export | Export CSV/PNG/PDF | HDX |
| Không có drill-down | Province Detail View | DesInventar |

---

## Phần II: Nghiên cứu Quốc tế - Hệ thống Trực quan hóa Thiên tai

### 2.1. UN OCHA - Humanitarian Data Exchange (HDX)

**Nguồn:** data.humdata.org

**Dashboard Architecture:**
- **Country dashboards**: Per-country pages combining maps, key figures, dataset links
- **Crisis dashboards**: Event-specific pages aggregating all related data
- **Key Figures cards**: Single big numbers with trend arrows

**Visualization Types:**
- Choropleth maps (primary) - color-coded severity by admin boundary
- Key Figures cards - single big numbers with trend arrows
- Stacked bar charts - funding tracked vs required
- Donut charts - sector-level funding breakdown
- Line charts - time series of humanitarian needs
- 3W maps (Who-What-Where) - operational presence

**Design Principles:**
- Minimal color palette: red/orange severity, blue operational, green positive
- Data always sourced and timestamped
- Downloadable in multiple formats (CSV, JSON, API)
- Mobile-responsive but map-centric on desktop

### 2.2. EM-DAT (International Disaster Database)

**Nguồn:** emdat.be, CRED UCLouvain

**Coverage:** 26,000+ mass disasters from 1900 to present

**Signature Visualization - Bubble Chart:**
- X-axis: year
- Y-axis: deaths
- Bubble size: total damage
- Color: disaster type

**Other Visualizations:**
- Country profile pages - bar charts by type, time series of impact
- Trend line charts - 10-year moving average of disaster frequency
- Treemap - proportional area showing damage by disaster type
- Heat matrix - disaster type vs. decade showing frequency

**Key Metrics:**
- Occurrence (count per year)
- Deaths (total and per event)
- Affected persons (total and per 100K population)
- Damage in USD (absolute and as % of GDP)

### 2.3. GDACS (Global Disaster Alert and Coordination System)

**Dashboard Architecture:**
- **Real-time event map** (center) - interactive world map with event markers
- **Event severity color coding**: Green (no alert), Orange (moderate), Red (severe)
- **Event timeline sidebar** - recent events listed chronologically
- **Event detail panel** - expands on click with impact estimates

**Visualization Types:**
- Interactive map with clustered markers
- Severity gauge - circular/radial indicator per event type
- Population exposure bar - horizontal bar showing exposed population
- Flood extent maps - satellite-derived flood polygons
- Wind field visualization - typhoon track with wind speed contours

**Alert System:**
- Traffic light system (green/orange/red) used consistently
- Icon-based disaster type identification
- RSS/webhook integration for push alerts

### 2.4. ReliefWeb

**Crisis Pages Pattern:**
- Aggregated dashboard per crisis with key figures, maps, reports
- Interactive timeline - horizontal timeline of crisis events with drill-down
- "About this crisis" sidebar - structured metadata

### 2.5. DesInventar

**Innovation:**
- Custom query builder - users select dimensions, filters, and visualization type
- Geographic heat maps - admin-level choropleth with graduated colors
- Multi-variable comparison - side-by-side charts comparing disaster impacts
- Bottom-up data collection (commune/ward level aggregated upward)
- Supports "slow-onset" disasters (drought, erosion)

---

## Phần III: Scope - Module Trực Quan Hóa Dữ Liệu

### Tính năng chính (12 features)

#### Dashboard Views (4 views)
1. **Executive Dashboard** - Tổng quan cấp cao cho lãnh đạo (KPI cards, trend charts)
2. **Operational Dashboard** - Giám sát thời gian thực (real-time map, active events)
3. **Analytical Dashboard** - Phân tích sâu (multi-variable, province comparison)
4. **Strategic Dashboard** - Xu hướng dài hạn (5Y/10Y/20Y trends, predictions)

#### Chart Components (8 chart types)
5. **Time Series Charts** - Line/Area charts cho xu hướng 2000-2024
6. **Choropleth Map** - Bản đồ 63 tỉnh theo mức độ thiên tai
7. **Bubble Chart** - Đa chiều: năm × số chết × thiệt hại × loại (EM-DAT style)
8. **Donut/Pie Charts** - Phân bố theo loại thiên tai, vùng miền
9. **Bar Charts** - So sánh tỉnh, so sánh năm, so sánh mùa
10. **Treemap** - Thiệt hại theo lĩnh vực (nhà cửa, nông nghiệp, hạ tầng)
11. **Gauge Charts** - Mức cảnh báo, tiến độ cứu trợ
12. **Heatmap** - Thiên tai theo tháng × năm (temporal heatmap)

### Tại sao 12 tính năng này?

| Tính năng | Giải quyết vấn đề gì | Chuẩn tham khảo |
|-----------|---------------------|-----------------|
| Executive Dashboard | Lãnh đạo cần nhìn tổng quan 1 glance | HDX Key Figures |
| Operational Dashboard | Giám sát sự cố đang xảy ra | GDACS Real-time |
| Analytical Dashboard | Nghiên cứu sâu, so sánh | DesInventar Query |
| Strategic Dashboard | Thấy xu hướng dài hạn | EM-DAT Trends |
| Time Series | Thấy thiên tai tăng hay giảm | EM-DAT |
| Choropleth Map | Tỉnh nào bị nặng nhất | HDX, GDACS |
| Bubble Chart | Đa chiều trong 1 biểu đồ | EM-DAT Signature |
| Donut Charts | Phân bố loại thiên tai | HDX, ReliefWeb |
| Bar Charts | So sánh trực tiếp | EM-DAT |
| Treemap | Thiệt hại theo tỷ lệ | EM-DAT |
| Gauge Charts | Mức cảnh báo hiện tại | GDACS |
| Heatmap | Mùa nào thiên tai nhiều nhất | Custom |

---

## Phần IV: Kiến trúc Tổng quan

### 4.1. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD PAGE (/dashboard)                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    DashboardHeader + View Tabs                       │  │
│  │  [Tổng quan] [Giám sát] [Phân tích] [Xu hướng]                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    FilterBar (Time + Region + Type)                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │  Executive   │ │ Operational  │ │  Analytical  │ │   Strategic    │  │
│  │  Dashboard   │ │  Dashboard   │ │  Dashboard   │ │   Dashboard    │  │
│  │              │ │              │ │              │ │                │  │
│  │ KPI Cards    │ │ Real-time    │ │ Province     │ │ 5Y/10Y/20Y    │  │
│  │ Trend Chart  │ │ Map          │ │ Comparison   │ │ Trend Charts  │  │
│  │ Donut Chart  │ │ Event Feed   │ │ Bubble Chart │ │ Heatmap       │  │
│  │ Top Province │ │ Live Metrics │ │ Detail Table │ │ Predictions   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │
│                                                                           │
│                    ┌────────────────────┐                                 │
│                    │  Dashboard Context │                                 │
│                    │  (React Context)   │                                 │
│                    └─────────┬──────────┘                                 │
│                              │                                            │
│         ┌────────────────────┼────────────────────┐                      │
│         │                    │                    │                      │
│  ┌──────┴──────┐    ┌───────┴───────┐   ┌───────┴───────┐              │
│  │ Mock Data   │    │ Aggregation   │   │ Formatters    │              │
│  │ Generator   │    │ Engine        │   │ (VND, %, etc) │              │
│  └─────────────┘    └───────────────┘   └───────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Data Flow

```
Mock Data → Aggregation Engine → Dashboard Context → Chart Components
                ↓
        Filter (Time/Region/Type) → Filtered Data → Charts re-render
```

### 4.3. Technology Stack

| Công nghệ | Phiên bản | Sử dụng |
|-----------|-----------|---------|
| Next.js | 16.2.4 | App Router, dynamic import |
| React | 19.2.4 | Hooks, Context, useReducer |
| TypeScript | 5.x | Strict typing |
| Tailwind CSS | 4 | Dark glassmorphism theme |
| Framer Motion | 12 | Animations, transitions |
| Recharts | 2.15 | All chart components |
| Leaflet | 1.9.4 | Choropleth map |
| react-leaflet | 5 | React wrapper |
| lucide-react | 0.468 | Icons |
| clsx | latest | Conditional classes |

---

## Phần V: Chi tiết Từng Tính năng

### 5.1. Executive Dashboard

**File:** `src/features/dashboard-stats/ui/ExecutiveDashboard.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  KPI Cards Row (6 cards)                         │
│  [Sự kiện] [Thương vong] [Thiệt hại] [Ảnh hưởng]│
│  [Tỉnh] [Cảnh báo]                               │
├──────────────────────────┬──────────────────────┤
│  Trend Chart (70%)       │ Top Provinces (30%)  │
│  Area chart: events/yr   │ Bar chart: top 10    │
│  2000-2024               │ provinces by damage  │
├──────────────────────────┼──────────────────────┤
│  Donut: Disaster Type    │ Gauge: Risk Index    │
│  Pie chart               │ Semicircular gauge   │
└──────────────────────────┴──────────────────────┘
```

**KPI Cards (6 cards):**
1. Tổng sự kiện thiên tai (năm nay vs năm trước, % thay đổi)
2. Thương vong (số chết + mất tích)
3. Thiệt hại kinh tế (tỷ VND, % GDP)
4. Người bị ảnh hưởng (triệu người)
5. Tỉnh bị ảnh hưởng (x/63 tỉnh)
6. Cảnh báo đang hoạt động

### 5.2. Operational Dashboard

**File:** `src/features/dashboard-stats/ui/OperationalDashboard.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Alert Banner (active warnings)                  │
├──────────────────────────┬──────────────────────┤
│  Real-time Map (60%)     │ Event Feed (40%)     │
│  Choropleth + markers    │ Scrolling event list │
├──────────────────────────┴──────────────────────┤
│  Live Metrics Row                               │
│  [Mực nước] [Lượng mưa] [Gió] [Cảnh báo]       │
├─────────────────────────────────────────────────┤
│  Response Status                                │
│  [Đang xử lý] [Đã triển khai] [Nơi trú ẩn]    │
└─────────────────────────────────────────────────┘
```

### 5.3. Analytical Dashboard

**File:** `src/features/dashboard-stats/ui/AnalyticalDashboard.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Filter Bar (time range, region, type, province) │
├─────────────────────────────────────────────────┤
│  Visualization Tabs                              │
│  [Xu hướng] [Địa lý] [So sánh] [Đa chiều]      │
├─────────────────────────────────────────────────┤
│  Large Chart Area (full width)                   │
│  (Switches between chart types based on tab)     │
├─────────────────────────────────────────────────┤
│  Detail Table (sortable, filterable, exportable) │
└─────────────────────────────────────────────────┘
```

**Bubble Chart (EM-DAT signature):**
- X-axis: Số sự kiện/năm
- Y-axis: Số người chết
- Bubble size: Thiệt hại kinh tế
- Color: Loại thiên tai
- Tooltip: Chi tiết đầy đủ

### 5.4. Strategic Dashboard

**File:** `src/features/dashboard-stats/ui/StrategicDashboard.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Period Selector (5Y / 10Y / 20Y / All)         │
├──────────────────────────┬──────────────────────┤
│  Frequency Trend         │ Damage Trend         │
│  Line chart: events/yr   │ Area chart: damage   │
├──────────────────────────┼──────────────────────┤
│  Type Shift              │ Geographic Shift     │
│  Stacked area: types/yr  │ Heatmap: province×yr │
├──────────────────────────┴──────────────────────┤
│  Insights Panel                                  │
│  [Key Findings] [Predictions] [Risks]            │
└─────────────────────────────────────────────────┘
```

### 5.5. Time Series Charts

**File:** `src/features/dashboard-stats/ui/charts/GlassAreaChart.tsx`

**Recharts Component:** `<AreaChart>` with `<ResponsiveContainer>`

**Data:** 25 years (2000-2024) × multiple metrics

**Design:**
- Gradient fill under area (matching glassmorphism)
- Custom glassmorphism tooltip
- Annotation lines for major events (Yagi 2024, Damrey 2017)
- 10-year moving average overlay
- Animation: 1000ms ease-out, staggered by series

### 5.6. Choropleth Map

**File:** `src/features/dashboard-stats/ui/charts/ProvinceChoropleth.tsx`

**Approach:** Leaflet + GeoJSON Vietnam provinces

**Color Scale:**
- Sequential: Deep blue (#1e3a5f) → bright red (#ef4444) for severity
- 5 levels: Low/Medium/High/Extreme/Catastrophic

**Data:** 63 provinces with disaster metrics

**Interaction:**
- Hover: Province name + key stats
- Click: Drill-down to province detail
- Legend: Color scale with value ranges

### 5.7. Bubble Chart

**File:** `src/features/dashboard-stats/ui/charts/GlassBubbleChart.tsx`

**Recharts Component:** `<ScatterChart>` with `<ZAxis>` for bubble size

**Dimensions:**
- X: Số sự kiện/năm
- Y: Số người chết
- Size: Thiệt hại kinh tế
- Color: Loại thiên tai

**Design:**
- Glassmorphism bubbles with opacity
- Custom tooltip showing all dimensions
- Click to filter by disaster type

### 5.8. Donut/Pie Charts

**File:** `src/features/dashboard-stats/ui/charts/GlassPieChart.tsx`

**Recharts Component:** `<PieChart>` with `innerRadius` for donut

**Use Cases:**
- Disaster type distribution (floods 45%, storms 30%, landslides 10%, drought 8%, other 7%)
- Regional distribution (Miền Trung 40%, ĐBSCL 20%, Miền Bắc 15%, etc.)
- Response phase distribution

**Design:**
- Center text: total value or dominant category
- Animated segment reveal on mount
- Max 7 segments, group smaller as "Khác"

### 5.9. Bar Charts

**File:** `src/features/dashboard-stats/ui/charts/GlassBarChart.tsx`

**Recharts Component:** `<BarChart>` with `<Bar>` elements

**Use Cases:**
- Top 10 provinces by damage (horizontal bar)
- Monthly disaster count (vertical bar)
- Year-over-year comparison (grouped bar)
- Before/after comparison (stacked bar)

**Design:**
- Rounded bar corners
- Gradient fills
- Animated entrance

### 5.10. Treemap

**File:** `src/features/dashboard-stats/ui/charts/GlassTreemap.tsx`

**Recharts Component:** `<Treemap>`

**Use Cases:**
- Damage breakdown: Housing | Agriculture | Infrastructure | Education | Health
- Disaster type frequency (proportional area)
- Resource allocation by sector

**Design:**
- Glass-effect cells with rounded corners
- Label overlay: category name + percentage
- Color-coded by category

### 5.11. Gauge Charts

**File:** `src/features/dashboard-stats/ui/charts/GlassGauge.tsx`

**Approach:** Custom SVG (Recharts doesn't have native gauge)

**Use Cases:**
- Current disaster alert level (1-5 scale)
- Response readiness score
- Funding progress (% of target)
- Risk index composite score

**Design:**
- Semicircular arc with gradient fill
- Needle indicator
- Glass background
- Animated fill on mount

### 5.12. Heatmap

**File:** `src/features/dashboard-stats/ui/charts/GlassHeatmap.tsx`

**Approach:** Custom SVG grid (Recharts doesn't have heatmap)

**Data:** Rows = months (12), Columns = years (25), Color = disaster count

**Design:**
- Glass cells with rounded corners
- Color scale: light → dark based on count
- Hover tooltip with exact count
- Year labels on x-axis, month labels on y-axis

---

## Phần VI: File Structure

```
src/
├── app/
│   └── dashboard/
│       └── page.tsx                          # Main dashboard page
├── features/
│   ├── dashboard-stats/
│   │   ├── api/
│   │   │   └── mock-data.ts                  # Historical disaster data 2000-2024
│   │   ├── config/
│   │   │   └── dashboard-config.ts           # Colors, labels, chart configs
│   │   ├── lib/
│   │   │   ├── types.ts                      # TypeScript interfaces
│   │   │   ├── dashboard-context.tsx          # React Context + Reducer
│   │   │   ├── aggregation.ts                # Data aggregation utilities
│   │   │   ├── formatters.ts                 # Number/date/VND formatters
│   │   │   └── use-dashboard-hooks.ts        # Custom hooks
│   │   └── ui/
│   │       ├── DashboardHeader.tsx            # Header with view tabs
│   │       ├── FilterBar.tsx                  # Global filters
│   │       ├── KPICard.tsx                    # Single KPI card
│   │       ├── KPICardGrid.tsx               # Responsive KPI grid
│   │       ├── ExecutiveDashboard.tsx         # Executive view
│   │       ├── OperationalDashboard.tsx       # Operational view
│   │       ├── AnalyticalDashboard.tsx        # Analytical view
│   │       ├── StrategicDashboard.tsx         # Strategic view
│   │       ├── ProvinceDetail.tsx             # Province drill-down
│   │       └── charts/
│   │           ├── GlassAreaChart.tsx         # Styled area chart
│   │           ├── GlassBarChart.tsx          # Styled bar chart
│   │           ├── GlassLineChart.tsx         # Styled line chart
│   │           ├── GlassPieChart.tsx          # Styled donut/pie
│   │           ├── GlassTreemap.tsx           # Styled treemap
│   │           ├── GlassScatterChart.tsx      # Styled bubble/scatter
│   │           ├── GlassHeatmap.tsx           # Custom heatmap
│   │           ├── GlassGauge.tsx             # Custom gauge
│   │           └── ProvinceChoropleth.tsx     # Leaflet choropleth
│   ├── alert-sos/                            # Phase 4 (existing)
│   ├── community-report/                     # Phase 3 (existing)
│   ├── map-disaster/                         # Phase 1 (existing)
│   ├── predict/                              # Phase 2 (existing)
│   └── rescue-connect/                       # Phase 5 (existing)
```

---

## Phần VII: Implementation Plan (18 Tasks, 6 Phases)

### Phase 6A: Foundation (Tasks 1-4)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 1 | `lib/types.ts` | TypeScript interfaces cho dashboard | ~300 |
| 2 | `config/dashboard-config.ts` | Config constants, colors, chart themes | ~200 |
| 3 | `api/mock-data.ts` | Historical data 2000-2024, 15 provinces, 6 disaster types | ~500 |
| 4 | `lib/dashboard-context.tsx` | React Context + Reducer + localStorage | ~400 |

### Phase 6B: Utilities (Tasks 5-6)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 5 | `lib/aggregation.ts` | Data aggregation (by time/region/type/province) | ~300 |
| 6 | `lib/formatters.ts` | Number/VND/date/percent formatters | ~150 |

### Phase 6C: Chart Components (Tasks 7-14)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 7 | `ui/charts/GlassAreaChart.tsx` | Time series area chart | ~200 |
| 8 | `ui/charts/GlassBarChart.tsx` | Bar chart (vertical/horizontal/grouped/stacked) | ~200 |
| 9 | `ui/charts/GlassPieChart.tsx` | Donut/pie chart | ~180 |
| 10 | `ui/charts/GlassScatterChart.tsx` | Bubble chart (EM-DAT style) | ~200 |
| 11 | `ui/charts/GlassTreemap.tsx` | Treemap chart | ~180 |
| 12 | `ui/charts/GlassHeatmap.tsx` | Custom temporal heatmap | ~250 |
| 13 | `ui/charts/GlassGauge.tsx` | Custom SVG gauge | ~200 |
| 14 | `ui/charts/ProvinceChoropleth.tsx` | Leaflet choropleth map | ~350 |

### Phase 6D: Dashboard Views (Tasks 15-18)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 15 | `ui/KPICard.tsx` + `ui/KPICardGrid.tsx` | KPI cards with animated counters | ~250 |
| 16 | `ui/ExecutiveDashboard.tsx` | Executive view (KPIs + trend + donut + top provinces) | ~400 |
| 17 | `ui/AnalyticalDashboard.tsx` | Analytical view (bubble chart + province comparison + table) | ~400 |
| 18 | `ui/StrategicDashboard.tsx` | Strategic view (long-term trends + heatmap + insights) | ~400 |

### Phase 6E: Page Assembly (Tasks 19-20)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 19 | `ui/DashboardHeader.tsx` + `ui/FilterBar.tsx` | Header + global filters | ~250 |
| 20 | `app/dashboard/page.tsx` | Main page (4 views, dynamic imports, Provider) | ~500 |

### Phase 6F: Polish (Tasks 21-22)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 21 | `ui/OperationalDashboard.tsx` | Operational view (real-time map + event feed) | ~350 |
| 22 | Build Verify | `npm run build` + testing | - |

**Total Estimated:** ~5,500+ lines of code

---

## Phần VIII: Mock Data Specification

### 8.1. Historical Disaster Data (2000-2024)

```typescript
interface YearlyDisasterData {
  year: number;
  totalEvents: number;
  deaths: number;
  missing: number;
  injured: number;
  affected: number;          // millions
  housesDamaged: number;     // thousands
  economicDamageBillionVND: number;
  economicDamagePercentGDP: number;
  agriculturalDamageHa: number;
  // Breakdown by type
  floods: number;
  storms: number;
  landslides: number;
  drought: number;
  other: number;
}
```

**Data Points (25 years):**
| Year | Events | Deaths | Damage (B VND) | Top Event |
|------|--------|--------|----------------|-----------|
| 2000 | 12 | 460 | 8,000 | Central Vietnam floods |
| 2006 | 14 | 250 | 12,000 | Typhoon Xangsane |
| 2009 | 10 | 180 | 15,000 | Typhoon Ketsana |
| 2017 | 16 | 380 | 60,000 | Typhoon Damrey |
| 2020 | 22 | 350 | 46,000 | Central Vietnam floods |
| 2024 | 15 | 350 | 85,000 | Typhoon Yagi |

### 8.2. Province Data (15 provinces)

```typescript
interface ProvinceDisasterData {
  province: string;
  region: string;
  riskScore: number;         // 1-10
  totalEvents: number;       // 2000-2024
  totalDeaths: number;
  totalDamageBillionVND: number;
  averageDamagePerEvent: number;
  mostCommonType: DisasterType;
  population: number;
  // Per-year data for sparklines
  yearlyDeaths: number[];
  yearlyDamage: number[];
}
```

### 8.3. Monthly Distribution Data

```typescript
interface MonthlyDisasterData {
  month: number;             // 1-12
  monthName: string;         // "Tháng 1" etc.
  averageEvents: number;     // 20-year average
  floods: number;
  storms: number;
  landslides: number;
  drought: number;
  other: number;
}
```

---

## Phần IX: Design Tokens

### Chart Colors

```
Disaster Types:
  Flood:      #3B82F6 (blue)
  Storm:      #8B5CF6 (purple)
  Landslide:  #92400E (brown)
  Drought:    #F59E0B (amber)
  Earthquake: #EF4444 (red)
  Other:      #6B7280 (gray)

Severity Scale (5-level):
  1-Minor:       #22C55E (green)
  2-Moderate:    #EAB308 (yellow)
  3-Severe:      #F97316 (orange)
  4-Extreme:     #EF4444 (red)
  5-Catastrophic:#A855F7 (purple)

Regions:
  Miền Trung:    #EF4444 (red - most affected)
  ĐBSCL:         #3B82F6 (blue)
  Miền Bắc:      #22C55E (green)
  Tây Nguyên:    #F59E0B (amber)
  Đông Nam Bộ:   #8B5CF6 (purple)
  ĐB sông Hồng:  #06B6D4 (cyan)

Chart Theme (Dark Glassmorphism):
  Grid lines:     rgba(255,255,255,0.05)
  Axis text:      #94A3B8 (slate-400)
  Tooltip bg:     rgba(15,23,42,0.9) + backdrop-blur
  Legend text:    #F1F5F9 (slate-100)
  Data fills:     semi-transparent with gradient
```

### Typography

```
KPI Value:     text-2xl font-bold tabular-nums
KPI Label:     text-[10px] text-slate-500
Chart Title:   text-sm font-semibold text-slate-200
Axis Label:    text-[10px] text-slate-400
Tooltip:       text-xs text-slate-300
```

### Animation

```
KPI counter:      spring, stiffness: 100, damping: 15, duration: 1500ms
Chart entrance:   0.5s ease-out, stagger 0.1s
Card entrance:    0.3s ease, stagger 0.05s
Tab switch:       0.2s ease
Gauge fill:       1s ease-in-out
Heatmap cell:     0.1s ease, stagger 0.02s
```

---

## Phần X: Innovation Points

| # | Innovation | Reference | Uniqueness in Vietnam |
|---|-----------|-----------|----------------------|
| 1 | 4-View Dashboard (Executive/Operational/Analytical/Strategic) | HDX, GDACS | Lần đầu VN có dashboard thiên tai 4 chế độ |
| 2 | EM-DAT Bubble Chart (đa chiều) | EM-DAT | Lần đầu áp dụng cho dữ liệu VN |
| 3 | Temporal Heatmap (tháng × năm) | Custom | Hiển thị mùa thiên ai trực quan |
| 4 | Province Choropleth (63 tỉnh) | HDX, DesInventar | Bản đồ nhiệt thiên tai 63 tỉnh |
| 5 | Custom Glassmorphism Charts | CứuNet | Theme thống nhất với toàn bộ hệ thống |
| 6 | Province Drill-down | DesInventar | Click tỉnh → xem chi tiết |
| 7 | Historical Trend Analysis (25 năm) | EM-DAT | Xu hướng 2000-2024 |
| 8 | Real-time Operational View | GDACS | Giám sát thời gian thực |
| 9 | Data Export (CSV/PNG) | HDX | Xuất dữ liệu cho báo cáo |
| 10 | Vietnamese Disaster Scenarios | Real events | Dựa trên Yagi, Damrey, lũ 2020 |
| 11 | Cross-module Data Integration | CứuNet | Hiển thị data từ Phase 1-5 |
| 12 | Animated Chart Transitions | Framer Motion | Chuyển đổi mượt giữa các view |

---

## Phần XI: Scope Boundaries

### INCLUDED (trong scope)

- 4 dashboard views (Executive, Operational, Analytical, Strategic)
- 8 chart types (Area, Bar, Pie, Bubble, Treemap, Heatmap, Gauge, Choropleth)
- Historical disaster data 2000-2024 (25 years)
- 15 provinces with detailed data
- 6 disaster types breakdown
- Monthly seasonal distribution
- Province drill-down view
- Global filters (time range, region, type)
- Animated counters and chart transitions
- Dark glassmorphism theme
- Data export (CSV, PNG)
- Mock data based on real Vietnamese disaster scenarios
- localStorage persistence for filter preferences

### EXCLUDED (ngoài scope)

- Real API integration (mock data only)
- Real-time WebSocket updates (simulated)
- User authentication
- Custom report builder
- PDF export (only PNG/CSV)
- All 63 provinces with full data (15 detailed, others simplified)
- Machine learning predictions (Phase 2 handles this)
- Mobile native app

---

## Phần XII: Execution Order

```
Phase 6A: Task 1 → 2 → 3 → 4                      (Foundation)
Phase 6B: Task 5 → 6                               (Utilities)
Phase 6C: Task 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14  (Charts)
Phase 6D: Task 15 → 16 → 17 → 18                   (Dashboard Views)
Phase 6E: Task 19 → 20                              (Page Assembly)
Phase 6F: Task 21 → 22                              (Polish + Verify)
```

**Parallel Opportunities:**
- Tasks 7-14 (all chart components can be built in parallel)
- Tasks 16-18 (dashboard views can be built in parallel)

---

## Phần XIII: Verification Checklist

### Build & Runtime
- [ ] `npm run build` - zero errors
- [ ] `npm run dev` - http://localhost:3000/dashboard loads
- [ ] All 4 views navigate correctly
- [ ] No console errors or warnings

### Charts
- [ ] Area chart renders 25-year trend data
- [ ] Bar chart shows province comparison
- [ ] Pie/donut chart shows disaster type distribution
- [ ] Bubble chart shows multi-dimensional data
- [ ] Treemap shows damage breakdown
- [ ] Heatmap shows month × year matrix
- [ ] Gauge shows risk/alert level
- [ ] Choropleth map shows 63 provinces colored by severity

### Interactions
- [ ] Filter bar updates all charts
- [ ] Time range selector works
- [ ] Province click drills down
- [ ] Chart tooltips show Vietnamese labels
- [ ] Animated counters animate on mount
- [ ] Chart transitions are smooth

### Quality
- [ ] Mobile responsive (375px viewport)
- [ ] Glassmorphism theme consistent
- [ ] All labels in Vietnamese
- [ ] Export CSV works
- [ ] Export PNG works
- [ ] Performance: charts render < 500ms

---

## Phần XIV: Tổng kết

Phase 6 - Module Trực Quan Hóa Dữ Liệu là module **trí tuệ** của CứuNet:
- Biến dữ liệu thành INSIGHTS
- **12 tính năng**, **8 chart types**, **18 tasks**, **6 sub-phases**
- **5,500+ lines** of code
- **12 innovation points** cho thesis
- Tham khảo **5 chuẩn quốc tế** (HDX, EM-DAT, GDACS, ReliefWeb, DesInventar)
- Dựa trên **dữ liệu thực** Việt Nam 2000-2024

**Sau Phase 6, CứuNet sẽ là:**
```
Map → Predict → Report → Alert → Rescue → Dashboard = COMPLETE INTELLIGENCE
(Bản đồ) (AI)    (Cộng đồng) (Cảnh báo) (Cứu hộ) (Trực quan) = HỆ THỐNG THÔNG MINH
```

**So sánh với hệ thống quốc tế:**
| Tính năng | EM-DAT | HDX | GDACS | CứuNet Phase 6 |
|-----------|--------|-----|-------|----------------|
| Time Series | ✅ | ✅ | ❌ | ✅ 25 năm |
| Choropleth Map | ❌ | ✅ | ✅ | ✅ 63 tỉnh |
| Bubble Chart | ✅ | ❌ | ❌ | ✅ EM-DAT style |
| Real-time View | ❌ | ❌ | ✅ | ✅ Simulated |
| Province Drill-down | ❌ | ❌ | ❌ | ✅ Innovation |
| Heatmap | ✅ | ❌ | ❌ | ✅ Temporal |
| Vietnamese Language | ❌ | ❌ | ❌ | ✅ Native |
| Dark Theme | ❌ | ❌ | ❌ | ✅ Glassmorphism |
| Export CSV/PNG | ✅ | ✅ | ❌ | ✅ |
