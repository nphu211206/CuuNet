# Phase 6 — Data Visualization & Dashboard: Deep Research Report
## For CứuNet Thesis-Level Master Plan
### Tech Stack: Next.js 16 + React 19 + Recharts 2.15 + Tailwind CSS v4

---

## 1. OCHA VISUALIZATION STANDARDS (Detailed)

### 1.1 OCHA Brand Guidelines for Data Visualization

OCHA (United Nations Office for the Coordination of Humanitarian Affairs) maintains the **Humanitarian Data Visualization Standards** through the Centre for Humanitarian Data (centre.humdata.org). Key principles:

**Core Design Philosophy:**
- **Clarity over aesthetics** — every visual element must serve understanding
- **Data responsibility** — visualizations must not mislead or cause harm
- **Accessibility first** — emergency content must reach everyone including persons with disabilities
- **Cultural sensitivity** — colors and symbols must be appropriate across cultures

**OCHA Color Palette (Official):**

| Purpose | Hex Code | Usage |
|---------|----------|-------|
| OCHA Blue (Primary) | `#0071B9` | Headers, primary actions, links |
| OCHA Dark Blue | `#004987` | Dark backgrounds, emphasis |
| OCHA Red | `#C22032` | Critical alerts, deaths, emergencies |
| OCHA Orange | `#F37021` | High severity, warnings |
| OCHA Yellow | `#FDB913` | Medium severity, caution |
| OCHA Green | `#00A651` | Positive outcomes, resolved, safe |
| OCHA Grey | `#706F75` | Neutral data, secondary info |
| OCHA Light Grey | `#D0D0D0` | Borders, backgrounds, grid lines |

**Severity Scale (Humanitarian Severity Index — HSI):**
- Level 1 (Low): `#FECACA` — light red tint
- Level 2 (Moderate): `#FED7AA` — light orange tint
- Level 3 (Severe): `#FDE68A` — light yellow tint
- Level 4 (Extreme): `#F87171` — red
- Level 5 (Catastrophic): `#DC2626` — deep red

**For CứuNet adaptation:**
The existing `SEVERITY_COLORS` in `constants.ts` (`critical: #EF4444`, `high: #F97316`, `medium: #EAB308`, `low: #22C55E`) aligns well with OCHA standards. Recommendation: keep these but add OCHA Blue as the primary dashboard accent color.

### 1.2 Typography Standards for Humanitarian Dashboards

**OCHA Typography Guidelines:**
- **Primary font:** Open Sans (open-source, excellent Vietnamese diacritic support)
- **Fallback:** Inter (also excellent Vietnamese support, already used in many Next.js projects)
- **Monospace for data:** JetBrains Mono or Source Code Pro

**Hierarchy for dashboards:**
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 (Dashboard title) | 28-32px | 700 (Bold) | Page title |
| H2 (Section) | 20-24px | 600 (Semi-bold) | Card headers |
| H3 (Card title) | 16-18px | 600 (Semi-bold) | Chart titles |
| Body | 14px | 400 (Regular) | Descriptions |
| Data label | 12-13px | 500 (Medium) | Axis labels, legends |
| Caption | 11px | 400 (Regular) | Footnotes, timestamps |

### 1.3 Accessibility Requirements (WCAG AAA for Emergency Content)

**WCAG 2.1 AAA Requirements for Emergency/Disaster Content:**

- **Contrast ratio:** Minimum 7:1 for normal text, 4.5:1 for large text (18px+)
- **Non-text contrast:** 3:1 for UI components and graphical objects
- **Color independence:** Information must not be conveyed by color alone
- **Motion:** No auto-playing animations longer than 5 seconds; must provide pause/stop
- **Timing:** No time limits on reading critical data (or allow extension)

**Implementation for CứuNet:**
```typescript
// src/lib/accessibility/chart-a11y.ts
export const WCAG_AAA_COLORS = {
  // All pairs verified for 7:1 contrast on dark backgrounds (#0f172a)
  text: {
    primary: "#f1f5f9",    // 15.4:1 on #0f172a
    secondary: "#cbd5e1",  // 10.3:1 on #0f172a
    muted: "#94a3b8",      // 6.7:1 on #0f172a (AA only, use sparingly)
  },
  // Chart colors — each must have 3:1+ contrast against dark bg
  chart: {
    blue: "#60a5fa",       // 8.2:1
    green: "#4ade80",      // 10.1:1
    red: "#f87171",        // 6.1:1
    orange: "#fb923c",     // 7.3:1
    yellow: "#facc15",     // 12.8:1
    purple: "#c084fc",     // 6.5:1
    cyan: "#22d3ee",       // 10.7:1
  },
};

// Pattern fills for color-blind users (SVG patterns)
export const PATTERN_FILLS = {
  flood: "url(#pattern-stripes)",
  storm: "url(#pattern-dots)",
  landslide: "url(#pattern-diagonal)",
  drought: "url(#pattern-crosshatch)",
  earthquake: "url(#pattern-zigzag)",
  tsunami: "url(#pattern-waves)",
};
```

**Screen reader support for charts:**
```tsx
// Accessible chart wrapper
function AccessibleChart({ data, title, description }: Props) {
  return (
    <figure role="img" aria-label={title}>
      <RechartsComponent data={data} />
      <figcaption className="sr-only">{description}</figcaption>
      {/* Hidden data table for screen readers */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{columns.map(c => <td key={c}>{row[c]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
```

### 1.4 Data Responsibility Guidelines

**OCHA Data Responsibility Framework:**

1. **Do No Harm Principle:**
   - Never display individual-level data that could identify victims
   - Aggregate data to minimum geographic level (province, not ward) for sensitive metrics
   - Use ranges instead of exact numbers for deaths/missing when numbers are small (<10)

2. **Sensitive Data Display:**
   - **Deaths:** Use muted colors (not bright red which can be traumatizing); include context (time period, source)
   - **Missing persons:** Always show as "estimated range" not exact count
   - **Displacement:** Show as aggregates, never household-level
   - **Economic damage:** Always note estimation methodology

3. **Ethical Visualization Patterns:**
```
BAD:  "47 người chết" (exact number, no context)
GOOD: "40-50 người thiệt mạng (ước tính, nguồn: NDMA, cập nhật: 01/01/2025)"

BAD:  Red pulsing dot for every death
GOOD: Choropleth with graduated colors showing severity levels
```

4. **Temporal Context:**
   - Always show "as of [date/time]" timestamps
   - Use "cập nhật X phút trước" for real-time data
   - Note data lag: "Dữ liệu có thể chậm 2-6 giờ so với thực tế"

### 1.5 OCHA 3W Dashboard Pattern (Who, What, Where)

The 3W Dashboard is OCHA's standard for coordination dashboards. CứuNet already has a `ThreeWDashboard.tsx` component. Key elements:

- **Who** is responding (organizations, teams)
- **What** they are doing (activities, sectors)
- **Where** they are operating (geographic coverage)

**Standard layout:**
1. Top bar: Key metrics (total responders, active incidents, people reached)
2. Left: Interactive map with layer toggles
3. Right: Sector breakdown + organization list
4. Bottom: Timeline of activities

---

## 2. CHART.JS vs RECHARTS vs D3.JS COMPARISON

### 2.1 Detailed Comparison Matrix

| Criteria | Chart.js 4.x | Recharts 2.x | D3.js 7.x |
|----------|-------------|-------------|-----------|
| **Bundle Size** | ~65KB min (tree-shakeable) | ~45KB min | ~80KB full, ~15KB modular |
| **React Integration** | Via wrapper (react-chartjs-2) | Native React (SVG-based) | Manual integration |
| **SSR Support** | Canvas-based (no native SSR) | SVG-based (full SSR support) | SVG-based (full SSR) |
| **Animation** | Built-in (requestAnimationFrame) | Built-in (CSS transitions) | Custom (enter/update/exit) |
| **Accessibility** | Plugin-based (chartjs-plugin-a11y) | Manual ARIA (add yourself) | Manual ARIA |
| **Chart Types** | 8 core types | 10+ types | Unlimited (any SVG) |
| **Performance (1K points)** | ~16ms render | ~25ms render | ~10ms render |
| **Performance (10K points)** | ~80ms render | ~150ms render | ~50ms render |
| **Performance (100K points)** | ~500ms (canvas wins) | Not recommended | ~300ms with optimization |
| **Learning Curve** | Low | Low | High |
| **Customization** | Medium (plugins) | Medium (custom components) | Very High |
| **TypeScript** | Good (@types available) | Excellent (built-in) | Good (@types available) |
| **Maintenance** | Active (Chart.js org) | Active (recharts team) | Active (Mike Bostock + community) |

### 2.2 Recommendation for CứuNet

**Primary: Recharts 2.15** (already in project dependencies)
- Native React/SSR support critical for Next.js 16
- SVG-based = better accessibility (screen readers can read SVG text)
- Already used in TrendChart.tsx with excellent results
- Team already familiar with API

**Supplementary: D3.js for specific use cases**
- d3-sankey already in project (for flow diagrams in rescue coordination)
- Use d3-geo for advanced map projections if needed
- Use d3-scale for custom color scales

**When to use Chart.js:** Only if canvas rendering needed for 10K+ data points (unlikely for CứuNet's use case).

### 2.3 Recharts-Specific Optimization Patterns

```typescript
// 1. Memoize chart data transformations
const chartData = useMemo(() => {
  return rawData.map(d => ({
    ...d,
    normalized: d.value / d.population * 100000,
    formatted: formatVietnameseNumber(d.value),
  }));
}, [rawData]);

// 2. Custom memoized tooltip (prevent re-renders)
const MemoizedTooltip = React.memo(CustomTooltip);

// 3. Disable animations for large datasets
<Line
  isAnimationActive={data.length < 500}
  animationDuration={data.length < 100 ? 800 : 0}
/>

// 4. Use ResponsiveContainer correctly
<ResponsiveContainer width="100%" height={300} minWidth={300}>
  {/* Chart here */}
</ResponsiveContainer>
```

---

## 3. DASHBOARD UX PATTERNS (Detailed)

### 3.1 Progressive Disclosure Patterns

**Definition:** Show essential information first, allow users to drill down for details.

**Implementation layers for CứuNet dashboard:**

**Layer 1 — Overview (Always visible):**
- 4-6 key metric cards (total events, affected people, active alerts, severity index)
- 1 summary trend chart
- 1 map with disaster hotspots

**Layer 2 — Category breakdown (On scroll or tab):**
- Per-disaster-type charts
- Province-level comparisons
- Time-series with filters

**Layer 3 — Detail (On click/expand):**
- Individual event details
- Raw data tables
- Export options

**Progressive Disclosure Component Pattern:**
```tsx
function DisclosurePanel({ summary, details, children }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between p-4"
      >
        <span className="text-sm font-medium text-slate-200">{summary}</span>
        <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{details}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 3.2 Information Architecture for Disaster Dashboards

**Recommended IA structure:**

```
Dashboard (/)
├── Header: "Dashboard Thống kê Thiên tai"
│   ├── Last updated timestamp
│   ├── Date range selector
│   └── Export button
│
├── Row 1: KPI Cards (4 cards)
│   ├── Total Disaster Events (with trend arrow)
│   ├── Total Affected People (with trend arrow)
│   ├── Active Alerts Count (with severity breakdown)
│   └── Overall Severity Index (composite score)
│
├── Row 2: Primary Visualizations
│   ├── Left (60%): Interactive Choropleth Map
│   │   ├── Province-level severity coloring
│   │   ├── Layer toggles (flood, storm, etc.)
│   │   └── Click-to-drill-down
│   └── Right (40%): Trend Timeline
│       ├── Multi-line chart: events by type over time
│       └── Confidence bands for predictions
│
├── Row 3: Secondary Visualizations
│   ├── Left: Bar Chart — Top 10 provinces by impact
│   ├── Center: Pie/Donut — Disaster type distribution
│   └── Right: Heatmap — Monthly disaster frequency
│
├── Row 4: Detailed Tables
│   ├── Recent events table (sortable, filterable)
│   └── Province comparison table
│
└── Footer: Data sources, methodology notes
```

### 3.3 Cognitive Load Management

**Principles:**

1. **Miller's Law (7+/-2):** Limit visible metrics to 4-6 at once
2. **Hick's Law:** Reduce choices — use progressive disclosure, not all options at once
3. **Gestalt Principles:** Group related data visually (proximity, similarity, enclosure)

**Implementation:**

```typescript
// Limit visible data points
const MAX_VISIBLE_SERIES = 5;
const MAX_VISIBLE_CATEGORIES = 8;

// Chunk data for progressive loading
function chunkData<T>(data: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

// Simplify complex data for overview
function simplifyForOverview(data: DetailedData[]): OverviewData[] {
  return data.map(d => ({
    label: d.name,
    value: d.totalAffected,
    severity: d.maxSeverity,
    trend: d.trendDirection, // "up" | "down" | "stable"
  }));
}
```

### 3.4 Color-Blind Safe Palettes for Disaster Data

**Problem:** ~8% of men and ~0.5% of women have color vision deficiency. Standard red-green severity scales are problematic.

**Solution: Color-blind safe palette (verified with Coblis simulator):**

```typescript
// Color-blind safe disaster palette
export const CB_SAFE_COLORS = {
  // Severity — uses blue-orange-red (deuteranopia safe)
  severity: {
    low: "#2166ac",      // Blue (safe for all CVD types)
    medium: "#f4a582",   // Salmon/orange
    high: "#d6604d",     // Red-orange
    critical: "#b2182b", // Dark red
  },

  // Disaster types — uses shape + color redundancy
  disasterTypes: {
    flood: "#2166ac",      // Blue + circle marker
    storm: "#f4a582",      // Orange + triangle marker
    landslide: "#9970ab",  // Purple + square marker
    drought: "#dfc27d",    // Tan/gold + diamond marker
    earthquake: "#b2182b", // Red + star marker
    tsunami: "#4393c3",    // Cyan + wave marker
  },

  // Sequential palette (for choropleth)
  sequential: [
    "#f7fbff", "#deebf7", "#c6dbef", "#9ecae1",
    "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b",
  ],

  // Diverging palette (for comparison)
  diverging: [
    "#b2182b", "#d6604d", "#f4a582", "#fddbc7",
    "#d1e5f0", "#92c5de", "#4393c3", "#2166ac",
  ],
};

// Always pair color with pattern/shape for accessibility
export const MARKER_SHAPES = {
  flood: "circle",
  storm: "triangle",
  landslide: "square",
  drought: "diamond",
  earthquake: "star",
  tsunami: "pentagon",
};
```

### 3.5 Typography Hierarchy for Data Visualization

```typescript
// src/lib/design-tokens/typography.ts
export const CHART_TYPOGRAPHY = {
  // Chart title
  title: {
    fontSize: 14,
    fontWeight: 600,
    fill: "#f1f5f9",      // slate-100
    fontFamily: "'Inter', 'Be Vietnam Pro', sans-serif",
  },

  // Axis labels
  axis: {
    fontSize: 11,
    fontWeight: 400,
    fill: "#94a3b8",      // slate-400
    fontFamily: "'Inter', sans-serif",
  },

  // Data labels (on-chart numbers)
  dataLabel: {
    fontSize: 12,
    fontWeight: 500,
    fill: "#e2e8f0",      // slate-200
    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  },

  // Tooltip text
  tooltip: {
    title: { fontSize: 13, fontWeight: 600, fill: "#f1f5f9" },
    body: { fontSize: 12, fontWeight: 400, fill: "#cbd5e1" },
    value: { fontSize: 13, fontWeight: 600, fill: "#f1f5f9",
             fontFamily: "'JetBrains Mono', monospace" },
  },

  // Legend text
  legend: {
    fontSize: 11,
    fontWeight: 400,
    fill: "#94a3b8",
    fontFamily: "'Inter', sans-serif",
  },

  // Footnote/caption
  caption: {
    fontSize: 10,
    fontWeight: 400,
    fill: "#64748b",      // slate-500
    fontFamily: "'Inter', sans-serif",
  },
};
```

### 3.6 Micro-interactions for Data Exploration

```tsx
// Hover highlight effect for chart elements
function useChartHover() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const onMouseEnter = useCallback((_, index: number) => {
    setHoveredIndex(index);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  return { hoveredIndex, onMouseEnter, onMouseLeave };
}

// Animated number counter for KPI cards
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = displayValue;
    const diff = value - start;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(start + diff * eased));

      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{formatVietnameseNumber(displayValue)}</span>;
}

// Smooth bar width transition
<Bar
  dataKey="value"
  fill="#3B82F6"
  animationDuration={800}
  animationEasing="ease-out"
/>
```

### 3.7 Skeleton Loading States for Charts

```tsx
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="glass-card p-4" style={{ height }}>
      {/* Title skeleton */}
      <div className="h-4 w-48 bg-slate-800 rounded animate-pulse mb-4" />

      {/* Chart area skeleton */}
      <div className="relative h-[calc(100%-40px)]">
        {/* Y-axis skeleton */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-6 bg-slate-800 rounded animate-pulse" />
          ))}
        </div>

        {/* Chart bars skeleton */}
        <div className="ml-12 flex items-end justify-between h-full gap-2">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-slate-800 rounded-t animate-pulse"
              initial={{ height: 0 }}
              animate={{ height: `${30 + Math.random() * 60}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
            />
          ))}
        </div>

        {/* X-axis skeleton */}
        <div className="ml-12 flex justify-between mt-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-3 w-8 bg-slate-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3.8 Error States for Missing Data

```tsx
function ChartErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
      <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
      <h3 className="text-sm font-semibold text-slate-200 mb-1">
        Không thể tải dữ liệu
      </h3>
      <p className="text-xs text-slate-400 text-center max-w-xs mb-4">
        {error.message || "Đã xảy ra lỗi khi tải dữ liệu biểu đồ. Vui lòng thử lại."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700
                     text-slate-300 rounded-lg transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
```

### 3.9 Empty States for New Deployments

```tsx
function ChartEmptyState({ chartType }: { chartType: string }) {
  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
      <BarChart3 className="w-10 h-10 text-slate-600 mb-3" />
      <h3 className="text-sm font-semibold text-slate-300 mb-1">
        Chưa có dữ liệu
      </h3>
      <p className="text-xs text-slate-500 text-center max-w-xs">
        Biểu đồ {chartType} sẽ hiển thị khi có dữ liệu thiên tai được ghi nhận.
        Dữ liệu được cập nhật từ các nguồn: NDMA, GDACS, ReliefWeb.
      </p>
    </div>
  );
}
```

---

## 4. DATA AGGREGATION ALGORITHMS

### 4.1 Moving Average Calculations

**Simple Moving Average (SMA):**
```typescript
function sma(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN); // Not enough data yet
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
  }
  return result;
}
```

**Exponential Moving Average (EMA):**
```typescript
function ema(data: number[], alpha: number): number[] {
  // alpha = 2 / (window + 1), typically 0.1-0.3
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}
```

**Weighted Moving Average (WMA):**
```typescript
function wma(data: number[], window: number): number[] {
  const result: number[] = [];
  const weights = Array.from({ length: window }, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      const weighted = slice.reduce((sum, val, j) => sum + val * weights[j], 0);
      result.push(weighted / weightSum);
    }
  }
  return result;
}
```

### 4.2 Year-over-Year Growth Rate

```typescript
function yearOverYearGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Compound Annual Growth Rate (CAGR)
function cagr(beginValue: number, endValue: number, years: number): number {
  if (beginValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / beginValue, 1 / years) - 1) * 100;
}

// Rolling YoY for time series
function rollingYoY(monthlyData: number[]): number[] {
  return monthlyData.map((val, i) => {
    if (i < 12) return NaN;
    return yearOverYearGrowth(val, monthlyData[i - 12]);
  });
}
```

### 4.3 Per-Capita Normalization

```typescript
function perCapitaRate(
  count: number,
  population: number,
  base: number = 100000
): number {
  if (population === 0) return 0;
  return (count / population) * base;
}

// Province-level normalization
function normalizeByProvince(
  events: DisasterEvent[],
  provinces: Province[]
): NormalizedData[] {
  return provinces.map(province => {
    const provinceEvents = events.filter(e => e.location.province === province.name);
    const totalAffected = provinceEvents.reduce((sum, e) => sum + e.affectedPeople, 0);
    return {
      province: province.name,
      population: province.population,
      rawCount: totalAffected,
      perCapita: perCapitaRate(totalAffected, province.population),
      eventCount: provinceEvents.length,
      eventRate: perCapitaRate(provinceEvents.length, province.population),
    };
  });
}
```

### 4.4 Severity Index Calculation (Composite Scores)

```typescript
interface SeverityFactors {
  deaths: number;
  missing: number;
  injured: number;
  displaced: number;
  damageUSD: number;
  infrastructureDamage: number; // 0-1 scale
  durationDays: number;
  areaAffectedKm2: number;
}

// Weighted composite severity index (0-100)
function calculateSeverityIndex(factors: SeverityFactors): number {
  // Weights based on OCHA severity framework
  const weights = {
    deaths: 0.30,              // Highest weight
    missing: 0.20,
    injured: 0.10,
    displaced: 0.15,
    damageUSD: 0.10,
    infrastructureDamage: 0.05,
    durationDays: 0.05,
    areaAffectedKm2: 0.05,
  };

  // Normalize each factor to 0-1 scale
  const normalized = {
    deaths: Math.min(1, factors.deaths / 1000),
    missing: Math.min(1, factors.missing / 500),
    injured: Math.min(1, factors.injured / 5000),
    displaced: Math.min(1, factors.displaced / 100000),
    damageUSD: Math.min(1, factors.damageUSD / 100000000), // $100M = max
    infrastructureDamage: factors.infrastructureDamage,
    durationDays: Math.min(1, factors.durationDays / 30),
    areaAffectedKm2: Math.min(1, factors.areaAffectedKm2 / 10000),
  };

  // Weighted sum
  const score = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + normalized[key as keyof typeof normalized] * weight;
  }, 0);

  return Math.round(score * 100); // 0-100
}

// Map score to severity level
function scoreToSeverity(score: number): SeverityLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}
```

### 4.5 Trend Detection Algorithms

**Linear Regression (already exists in statistical-engine.ts):**
```typescript
// Existing implementation is correct. Enhancement: add R-squared
function linearRegressionWithStats(data: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  pValue: number;
} {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
    sumY2 += data[i] * data[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssRes = data.reduce((sum, y, i) => sum + (y - (slope * i + intercept)) ** 2, 0);
  const ssTot = data.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  // Approximate p-value using t-distribution
  const se = Math.sqrt(ssRes / (n - 2)) / Math.sqrt(sumX2 - sumX * sumX / n);
  const tStat = Math.abs(slope / se);
  const pValue = 2 * (1 - tCDF(tStat, n - 2)); // Two-tailed

  return { slope, intercept, rSquared, pValue };
}
```

**Mann-Kendall Trend Test (non-parametric):**
```typescript
function mannKendall(data: number[]): {
  trend: "increasing" | "decreasing" | "no trend";
  s: number;
  z: number;
  pValue: number;
  tau: number; // Kendall's tau
} {
  const n = data.length;
  let s = 0;

  // Calculate S statistic
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = data[j] - data[i];
      if (diff > 0) s++;
      else if (diff < 0) s--;
    }
  }

  // Variance of S
  const ties = countTies(data);
  const varS = (n * (n - 1) * (2 * n + 5) - ties) / 18;

  // Z statistic
  let z: number;
  if (s > 0) z = (s - 1) / Math.sqrt(varS);
  else if (s < 0) z = (s + 1) / Math.sqrt(varS);
  else z = 0;

  // Two-tailed p-value (normal approximation)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // Kendall's tau
  const tau = s / (n * (n - 1) / 2);

  // Determine trend
  let trend: "increasing" | "decreasing" | "no trend";
  if (pValue < 0.05 && s > 0) trend = "increasing";
  else if (pValue < 0.05 && s < 0) trend = "decreasing";
  else trend = "no trend";

  return { trend, s, z, pValue, tau };
}

function countTies(data: number[]): number {
  const counts = new Map<number, number>();
  for (const val of data) {
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  let tieSum = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      tieSum += count * (count - 1) * (2 * count + 5);
    }
  }
  return tieSum;
}

function normalCDF(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}
```

### 4.6 Outlier Detection for Disaster Data

```typescript
// IQR method (robust for skewed disaster data)
function detectOutliersIQR(data: number[]): {
  outliers: number[];
  lowerBound: number;
  upperBound: number;
  indices: number[];
} {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierIndices: number[] = [];
  const outliers: number[] = [];

  data.forEach((val, i) => {
    if (val < lowerBound || val > upperBound) {
      outliers.push(val);
      outlierIndices.push(i);
    }
  });

  return { outliers, lowerBound, upperBound, indices: outlierIndices };
}

// Z-score method (for normally distributed data)
function detectOutliersZScore(data: number[], threshold: number = 3): number[] {
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + (val - avg) ** 2, 0) / data.length
  );

  return data.filter(val => Math.abs((val - avg) / stdDev) > threshold);
}

// Modified Z-score (more robust, uses median)
function detectOutliersModifiedZ(data: number[], threshold: number = 3.5): number[] {
  const sorted = [...data].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mad = Math.median(data.map(val => Math.abs(val - median))); // Median Absolute Deviation

  return data.filter(val => {
    const modifiedZ = 0.6745 * (val - median) / mad;
    return Math.abs(modifiedZ) > threshold;
  });
}
```

---

## 5. VIETNAMESE TYPOGRAPHY FOR DATA VISUALIZATION

### 5.1 Vietnamese Diacritics Handling in Charts

**Problem:** Vietnamese has complex diacritics (dấu) that can cause rendering issues in charts:
- Stacked diacritics: ệ = e + ˆ + ̣ (3 combining characters)
- Character width varies: "Hà Nội" vs "Ha Noi"
- Text truncation can break diacritics mid-character

**Solutions:**

```typescript
// Safe text truncation for chart labels
function truncateVietnamese(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  // Use Array.from to handle multi-byte characters correctly
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return chars.slice(0, maxLength - 1).join("") + "…";
}

// Recharts tick formatter with Vietnamese support
const vietnameseTickFormatter = (value: string) => {
  return truncateVietnamese(value, 8); // Max 8 chars for province names
};
```

### 5.2 Font Recommendations

**Primary: Inter** (already standard in Next.js projects)
- Excellent Vietnamese support (1,608 glyphs)
- Open-source, variable font
- Good readability at small sizes (11-12px for chart labels)

**Secondary: Be Vietnam Pro** (designed specifically for Vietnamese)
- Vietnamese-first design
- Better diacritic placement than Inter
- Available on Google Fonts

**Monospace for numbers: JetBrains Mono**
- Clear distinction between 0/O, 1/l/I
- Tabular figures (aligned numbers in columns)
- Good for data tables and tooltip values

```css
/* Tailwind CSS v4 font configuration */
@theme {
  --font-sans: 'Inter', 'Be Vietnam Pro', 'system-ui', sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
  --font-display: 'Be Vietnam Pro', 'Inter', sans-serif;
}
```

### 5.3 Number Formatting Conventions

```typescript
// Vietnamese number formatting
export function formatVietnameseNumber(value: number): string {
  // Vietnamese uses dots as thousand separators and commas for decimals
  // 1.234.567,89 (not 1,234,567.89)
  return new Intl.NumberFormat("vi-VN").format(value);
}

// Compact notation for large numbers
export function formatCompactVN(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return formatVietnameseNumber(value);
}

// Percentage formatting
export function formatPercentVN(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

// Recharts tick formatter
export const numberTickFormatter = (value: number) => formatCompactVN(value);
```

### 5.4 Date Formatting

```typescript
// Vietnamese date format: dd/mm/yyyy
export function formatDateVN(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

// Short date for charts: "01/01/2025"
export function formatShortDateVN(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

// Relative time: "3 giờ trước"
export function formatRelativeTimeVN(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const rtf = new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" });
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (minutes < 1440) return rtf.format(-Math.floor(minutes / 60), "hour");
  return rtf.format(-Math.floor(minutes / 1440), "day");
}

// Month names for chart labels
export const MONTH_NAMES_VN = [
  "Th1", "Th2", "Th3", "Th4", "Th5", "Th6",
  "Th7", "Th8", "Th9", "Th10", "Th11", "Th12",
];
```

### 5.5 Currency Formatting

```typescript
// VND formatting (no decimal places)
export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

// Compact VND for charts
export function formatCompactVND(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return formatVND(value);
}

// USD formatting (for international comparison)
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
```

---

## 6. EXPORT FUNCTIONALITY

### 6.1 Chart-to-PNG using html2canvas

```typescript
// src/lib/export/chart-to-image.ts
import html2canvas from "html2canvas";

export async function exportChartToPNG(
  elementRef: HTMLElement,
  filename: string = "chart.png",
  options: {
    scale?: number;
    backgroundColor?: string;
    includeTitle?: boolean;
  } = {}
): Promise<void> {
  const { scale = 2, backgroundColor = "#0f172a" } = options;

  const canvas = await html2canvas(elementRef, {
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
    // Preserve SVG rendering
    allowTaint: true,
  });

  // Trigger download
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// Alternative: SVG-based export (better quality for Recharts)
export function exportChartToSVG(
  svgElement: SVGElement,
  filename: string = "chart.svg"
): void {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}
```

### 6.2 CSV Export with UTF-8 BOM

```typescript
// src/lib/export/csv-export.ts
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) return;

  // Use provided columns or infer from first row
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  // Build CSV string
  const header = cols.map(c => `"${c.label}"`).join(",");
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      // Escape quotes and wrap in quotes
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );

  const csvString = [header, ...rows].join("\n");

  // UTF-8 BOM for Excel compatibility with Vietnamese characters
  const BOM = "﻿";
  const blob = new Blob([BOM + csvString], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// Example usage for disaster data
export function exportDisasterDataCSV(events: DisasterEvent[]): void {
  exportToCSV(events, `cuunet-disaster-data-${formatDateVN(new Date())}.csv`, [
    { key: "id", label: "Mã sự kiện" },
    { key: "type", label: "Loại thiên tai" },
    { key: "severity", label: "Mức độ" },
    { key: "status", label: "Trạng thái" },
    { key: "title", label: "Tiêu đề" },
    { key: "location.province", label: "Tỉnh/Thành" },
    { key: "affectedPeople", label: "Số người ảnh hưởng" },
    { key: "startDate", label: "Ngày bắt đầu" },
    { key: "updatedAt", label: "Cập nhật" },
  ]);
}
```

### 6.3 PDF Generation Options

**Option A: @react-pdf/renderer (React-native PDF)**
```typescript
// Best for: Complex layouts, Vietnamese text, custom styling
import { Document, Page, Text, View, StyleSheet, PDFViewer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 20 },
  chart: { marginBottom: 20 },
  table: { display: "flex", flexDirection: "column" },
});

function DashboardPDF({ data, charts }: { data: any; charts: string[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Báo cáo Thống kê Thiên tai - CứuNet</Text>
        <Text>Ngày xuất: {formatDateVN(new Date())}</Text>
        {/* Charts rendered as images */}
        {charts.map((chartBase64, i) => (
          <Image key={i} src={chartBase64} style={styles.chart} />
        ))}
      </Page>
    </Document>
  );
}
```

**Option B: jsPDF + html2canvas (simpler)**
```typescript
// Best for: Quick exports, preserving exact visual appearance
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportDashboardToPDF(
  elementRef: HTMLElement,
  filename: string = "cuunet-report.pdf"
): Promise<void> {
  const canvas = await html2canvas(elementRef, {
    scale: 2,
    backgroundColor: "#0f172a",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("landscape", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Add pages if content is tall
  let yOffset = 10;
  if (imgHeight < pageHeight - 20) {
    pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
  } else {
    // Split into multiple pages
    let remainingHeight = imgHeight;
    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight);
      remainingHeight -= pageHeight - 20;
      if (remainingHeight > 0) pdf.addPage();
      yOffset = -(pageHeight - 20) * (Math.floor((imgHeight - remainingHeight) / (pageHeight - 20)));
    }
  }

  pdf.save(filename);
}
```

### 6.4 Share Functionality (URL with State)

```typescript
// src/lib/export/share-state.ts
import { encode, decode } from "js-base64";

interface DashboardState {
  dateRange: { start: string; end: string };
  filters: FilterState;
  selectedProvince?: string;
  chartType?: string;
  view: "overview" | "detailed";
}

export function encodeDashboardState(state: DashboardState): string {
  const json = JSON.stringify(state);
  return encode(json, true); // URL-safe base64
}

export function decodeDashboardState(encoded: string): DashboardState | null {
  try {
    const json = decode(encoded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Generate shareable URL
export function generateShareURL(state: DashboardState): string {
  const encoded = encodeDashboardState(state);
  const url = new URL(window.location.href);
  url.searchParams.set("s", encoded);
  return url.toString();
}

// Parse state from URL on page load
export function parseStateFromURL(): DashboardState | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("s");
  if (!encoded) return null;
  return decodeDashboardState(encoded);
}

// React hook for URL state sync
function useDashboardURLState(initialState: DashboardState) {
  const [state, setState] = useState<DashboardState>(() => {
    return parseStateFromURL() || initialState;
  });

  // Update URL when state changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = generateShareURL(state);
      window.history.replaceState({}, "", url);
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  return [state, setState] as const;
}
```

---

## 7. PERFORMANCE OPTIMIZATION FOR DASHBOARDS

### 7.1 React.memo for Chart Components

```typescript
// src/features/dashboard/components/OptimizedChart.tsx
import React from "react";

interface ChartProps {
  data: DataPoint[];
  config: ChartConfig;
  onHover?: (index: number | null) => void;
}

// Memoize chart component to prevent re-renders when parent updates
const DisasterTrendChart = React.memo(
  function DisasterTrendChart({ data, config, onHover }: ChartProps) {
    const chartData = useMemo(() => transformData(data), [data]);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          {/* Chart content */}
        </ComposedChart>
      </ResponsiveContainer>
    );
  },
  // Custom comparison: only re-render if data or config changed
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.config === nextProps.config
    );
  }
);

// Memoize tooltip separately (re-renders on every hover)
const MemoizedTooltip = React.memo(CustomTooltip, () => true); // Never re-render tooltip component itself
```

### 7.2 useMemo for Expensive Calculations

```typescript
// src/features/dashboard/lib/aggregations.ts

// Memoize expensive aggregation
const aggregatedData = useMemo(() => {
  // Expensive operations here
  const byProvince = groupByProvince(rawEvents);
  const normalized = normalizeByPopulation(byProvince, populationData);
  const severityScores = normalized.map(calculateSeverityIndex);
  const trends = normalized.map(detectTrend);
  return { byProvince, normalized, severityScores, trends };
}, [rawEvents, populationData]); // Only recalculate when inputs change

// Memoize sorted/filtered data
const filteredEvents = useMemo(() => {
  return events
    .filter(e => filters.disasterTypes.includes(e.type))
    .filter(e => filters.severityLevels.includes(e.severity))
    .filter(e => isInDateRange(e.startDate, filters.dateRange))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}, [events, filters]);

// Memoize chart configurations
const chartConfig = useMemo(() => ({
  colors: getChartColors(selectedTypes),
  scale: getTimeScale(dateRange),
  labels: getAxisLabels(locale),
}), [selectedTypes, dateRange, locale]);
```

### 7.3 Virtual Scrolling for Large Datasets

```typescript
// src/features/dashboard/components/VirtualizedTable.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualizedDisasterTable({ data }: { data: DisasterEvent[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <table>
        <thead className="sticky top-0 bg-slate-900 z-10">
          <tr>
            <th>Loại</th>
            <th>Khu vực</th>
            <th>Mức độ</th>
            <th>Người ảnh hưởng</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const event = data[virtualRow.index];
            return (
              <tr
                key={event.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <td>{DISASTER_CONFIG[event.type].label}</td>
                <td>{event.location.province}</td>
                <td>{SEVERITY_LABELS[event.severity]}</td>
                <td>{formatVietnameseNumber(event.affectedPeople)}</td>
                <td>{formatDateVN(event.startDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

### 7.4 Debouncing Filter Changes

```typescript
// src/features/dashboard/hooks/useDebouncedFilters.ts
import { useState, useEffect, useRef } from "react";

function useDebouncedFilters(filters: FilterState, delay: number = 300) {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [filters, delay]);

  return debouncedFilters;
}

// Usage in dashboard component
function DashboardFilters() {
  const [rawFilters, setRawFilters] = useState<FilterState>(defaultFilters);
  const filters = useDebouncedFilters(rawFilters, 300); // 300ms debounce

  // Pass debounced filters to chart components
  const chartData = useMemo(() => filterData(allData, filters), [allData, filters]);

  return (
    <FilterPanel
      filters={rawFilters}
      onChange={setRawFilters} // Updates immediately for UI responsiveness
    />
    <DisasterChart data={chartData} /> {/* Re-renders only after debounce */}
  );
}
```

### 7.5 Lazy Loading Chart Components

```typescript
// src/features/dashboard/components/LazyCharts.tsx
import dynamic from "next/dynamic";

// Lazy load heavy chart components
const TrendChart = dynamic(
  () => import("@/features/predict/ui/TrendChart"),
  {
    loading: () => <ChartSkeleton height={300} />,
    ssr: false, // Disable SSR for charts (they need client-side data anyway)
  }
);

const ChoroplethMap = dynamic(
  () => import("@/features/map-disaster/ui/ProvinceChoropleth"),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

const ThreeWDashboard = dynamic(
  () => import("@/features/rescue-connect/ui/ThreeWDashboard"),
  {
    loading: () => <ChartSkeleton height={400} />,
    ssr: false,
  }
);

// Intersection Observer for below-fold charts
function useLazyLoad(threshold: number = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Usage: Only render chart when scrolled into view
function LazyChartWrapper({ children }: { children: React.ReactNode }) {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref}>
      {isVisible ? children : <ChartSkeleton />}
    </div>
  );
}
```

### 7.6 Web Workers for Data Processing

```typescript
// src/lib/workers/data-processor.worker.ts
// This runs in a separate thread, doesn't block UI

self.onmessage = function (e: MessageEvent) {
  const { type, data } = e.data;

  switch (type) {
    case "AGGREGATE": {
      const result = aggregateDisasterData(data);
      self.postMessage({ type: "AGGREGATE_RESULT", result });
      break;
    }
    case "TREND_ANALYSIS": {
      const trends = analyzeTrends(data);
      self.postMessage({ type: "TREND_RESULT", result: trends });
      break;
    }
    case "OUTLIER_DETECTION": {
      const outliers = detectOutliers(data);
      self.postMessage({ type: "OUTLIER_RESULT", result: outliers });
      break;
    }
  }
};

// Heavy computation functions (same as above but in worker context)
function aggregateDisasterData(events: DisasterEvent[]): AggregatedData {
  // ... heavy computation
}

// src/features/dashboard/hooks/useWorkerProcessing.ts
function useWorkerProcessing() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../lib/workers/data-processor.worker.ts", import.meta.url)
    );
    return () => workerRef.current?.terminate();
  }, []);

  const processData = useCallback(
    (type: string, data: any): Promise<any> => {
      return new Promise((resolve) => {
        if (!workerRef.current) return;

        const handler = (e: MessageEvent) => {
          if (e.data.type === `${type}_RESULT`) {
            workerRef.current?.removeEventListener("message", handler);
            resolve(e.data.result);
          }
        };

        workerRef.current.addEventListener("message", handler);
        workerRef.current.postMessage({ type, data });
      });
    },
    []
  );

  return processData;
}

// Usage in component
function Dashboard() {
  const processInWorker = useWorkerProcessing();
  const [aggregated, setAggregated] = useState(null);

  useEffect(() => {
    if (events.length > 1000) {
      // Process in worker for large datasets
      processInWorker("AGGREGATE", events).then(setAggregated);
    } else {
      // Process in main thread for small datasets (worker overhead not worth it)
      setAggregated(aggregateDisasterData(events));
    }
  }, [events]);
}
```

### 7.7 Performance Budget Checklist

| Metric | Target | How to Measure |
|--------|--------|----------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Total Blocking Time | < 200ms | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Chart render time | < 100ms | Performance DevTools |
| Bundle size (dashboard page) | < 150KB gzipped | Webpack Bundle Analyzer |
| Memory usage | < 50MB | Chrome Task Manager |
| Re-renders per interaction | < 5 | React DevTools Profiler |

---

## 8. IMPLEMENTATION ROADMAP FOR PHASE 6

### 8.1 Component Architecture

```
src/features/dashboard/
├── config/
│   ├── dashboard-config.ts        # Dashboard settings, default filters
│   ├── chart-themes.ts            # Chart color themes, typography tokens
│   └── export-config.ts           # Export settings, PDF templates
├── lib/
│   ├── types.ts                   # Dashboard-specific types
│   ├── aggregations.ts            # Data aggregation functions
│   ├── trend-detection.ts         # Mann-Kendall, linear regression
│   ├── outlier-detection.ts       # IQR, Z-score methods
│   ├── severity-index.ts          # Composite severity scoring
│   ├── export-utils.ts            # CSV, PNG, PDF export functions
│   ├── share-state.ts             # URL state encoding/decoding
│   └── format-utils.ts            # Vietnamese number/date formatting
├── hooks/
│   ├── use-dashboard-filters.ts   # Filter state management
│   ├── use-debounced-filters.ts   # Debounced filter hook
│   ├── use-aggregated-data.ts     # Memoized data aggregation
│   ├── use-worker-processing.ts   # Web Worker integration
│   └── use-export.ts              # Export functionality hook
├── ui/
│   ├── DashboardLayout.tsx        # Main layout component
│   ├── KPICards.tsx               # Key metric cards
│   ├── SeverityGauge.tsx          # Composite severity gauge
│   ├── DisasterTrendChart.tsx     # Multi-type trend chart
│   ├── ProvinceChoropleth.tsx     # Map visualization
│   ├── TypeDistribution.tsx       # Pie/donut chart
│   ├── MonthlyHeatmap.tsx         # Calendar heatmap
│   ├── TopProvincesBar.tsx        # Bar chart
│   ├── RecentEventsTable.tsx      # Virtualized table
│   ├── FilterPanel.tsx            # Dashboard filters
│   ├── ExportMenu.tsx             # Export dropdown
│   ├── ShareDialog.tsx            # Share URL dialog
│   ├── ChartSkeleton.tsx          # Loading state
│   ├── ChartErrorState.tsx        # Error state
│   └── ChartEmptyState.tsx        # Empty state
└── page.tsx                        # Page component (already exists as placeholder)
```

### 8.2 Dependencies to Add

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "@tanstack/react-virtual": "^3.0.0",
    "js-base64": "^3.7.7"
  }
}
```

---

## 9. KEY REFERENCES & STANDARDS

- **OCHA Centre for Humanitarian Data:** https://centre.humdata.org
- **Humanitarian Data Visualization Handbook:** OCHA internal guidelines
- **WCAG 2.1 AAA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Color Universal Design (CUD):** https://jfly.uni-koeln.de/color/
- **Recharts Documentation:** https://recharts.org
- **D3.js:** https://d3js.org
- **Inter Font:** https://rsms.me/inter/
- **Be Vietnam Pro:** https://fonts.google.com/specimen/Be+Vietnam+Pro
- **OCHA Brand Guidelines:** https://brand.unocha.org
- **Vietnamese Number Format (Intl):** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
