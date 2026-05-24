# 🌍 MEGA WORLD-CLASS TRANSFORMATION PLAN
## CuuNet — Nền tảng Quản lý Thiên tai Quốc gia
### Ngày: 24/05/2026 | Version: 2.0

---

## PHẦN I — PHÂN TÍCH VẤN ĐỀ HIỆN TẠI

### 1.1 Giao diện (UI/UX)

**Vấn đề #1: Dark theme quá nặng**
- Background `#0a0f1e` — gần như đen tuyền
- Website về **cứu nạn, phòng chống, giáo dục** → cần giao diện **sáng, sạch, đáng tin cậy**
- Dark theme khiến người dùng (đặc biệt người lớn tuổi, nông dân) khó đọc
- Không phù hợp với bản chất "khẩn cấp, cần hành động" của thiên tai
- Tham khảo world-class: **Apple Health** (sáng), **Google Crisis Response** (sáng), **FEMA.gov** (sáng), **WHO** (sáng), **UNDRR** (sáng)

**Vấn đề #2: Trang rối — quá nhiều nội dung**
- Homepage: 10 sections liên tục → user scroll mỏi tay
- Mỗi section có animation riêng → competing nhau, rối mắt
- Inner pages: Quá nhiều tabs, quá nhiều data cùng lúc
- Thiếu hierarchy — không biết nhìn đâu trước
- Thiếu whitespace thực sự — mọi thứ dày đặc

**Vấn đề #3: Animations quá generic**
- ScrollReveal fade-up lặp lại ở mọi section → nhàm chán
- Particle field — đẹp nhưng không liên quan đến thiên tai
- Typewriter effect — đã lỗi thời (2020 trend)
- Không có mouse-tracking, không có 3D, không có interactive storytelling

**Vấn đề #4: Typography chưa đủ mạnh**
- Heading chưa đủ lớn và bold
- Thiếu visual hierarchy rõ ràng
- Body text quá nhỏ trên mobile

### 1.2 Dữ liệu

**Vấn đề #5: Dữ liệu quá cũ (2024)**
- `disaster-data.ts`: Toàn sự kiện 2024 — đã 2 năm tuổi
- Cần cập nhật đến tháng 5/2026
- Cần thêm thiên tai mới nhất Việt Nam + thế giới

**Vấn đề #6: Chỉ dùng mock data**
- Không có API real-time integration
- Không có cập nhật tự động
- Dữ liệu "chết" — không thay đổi

### 1.3 Tính năng

**Vấn đề #7: Bản đồ quá cơ bản**
- Chỉ có Leaflet 2D — quá phổ biến, không có gì đặc biệt
- Không có 3D visualization
- Không có interactive data viz
- Không có storytelling về thiên tai

**Vấn đề #8: Thiếu "wow factor"**
- Không có gì khiến user "wow" khi vào trang
- Không có interactive elements độc đáo
- Không có gamification thực sự
- Không có social features

---

## PHẦN II — DESIGN DIRECTION MỚI

### 2.1 Aesthetic Direction

**Tone:** `Organic/Natural` + `Editorial/Magazine` + `Emergency Dashboard`

**Tham khảo:**
- **Apple.com** — Typography, whitespace, scroll animations, storytelling
- **Stripe.com** — Gradient mesh, interactive demos, clean layout
- **Linear.app** — Minimal, efficient, keyboard-first
- **Vercel.com** — Clean, white theme, subtle animations
- **Globe.gl** — 3D interactive globe visualization
- **Earth.nullschool.net** — Real-time weather visualization
- **Google Crisis Response** — Light theme, clear hierarchy, emergency focus
- **FEMA.gov** — Government standard, accessible, trustworthy
- **Apple Health** — Clean data visualization, card-based layout

### 2.2 Color Palette MỚI

```css
/* === BACKGROUND === */
--bg-primary:    #f8fafc;     /* Trắng xám nhẹ — sạch sẽ, chuyên nghiệp */
--bg-secondary:  #f1f5f9;     /* Xám nhạt — phân section */
--bg-card:       #ffffff;     /* Trắng — cards nổi bật */
--bg-hero:       #0c1222;     /* Dark navy — hero section GIỮ DARK */
--bg-emergency:  #fef2f2;     /* Đỏ nhạt — cảnh báo khẩn cấp */

/* === TEXT === */
--text-primary:   #0f172a;    /* Gần đen — dễ đọc trên nền sáng */
--text-secondary: #475569;    /* Xám — phụ */
--text-muted:     #94a3b8;    /* Xám nhạt — caption */
--text-on-dark:   #f8fafc;    /* Trắng — trên dark hero */

/* === ACCENT COLORS === */
--color-primary:   #0369a1;   /* Xanh dương đậm — đáng tin cậy (NOAA/NASA) */
--color-primary-light: #38bdf8; /* Xanh dương sáng — hover */
--color-danger:    #dc2626;   /* Đỏ — emergency, SOS */
--color-danger-light: #fca5a5; /* Đỏ nhạt — background */
--color-warning:   #d97706;   /* Cam — cảnh báo */
--color-success:   #16a34a;   /* Xanh lá — an toàn */
--color-info:      #0891b2;   /* Cyan — thông tin */

/* === GRADIENTS === */
--gradient-hero:   linear-gradient(135deg, #0c1222 0%, #1e3a5f 50%, #0c1222 100%);
--gradient-card:   linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
--gradient-accent: linear-gradient(135deg, #0369a1 0%, #0891b2 100%);

/* === SHADOWS === */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1);

/* === BORDERS === */
--border-light: #e2e8f0;
--border-medium: #cbd5e1;
--border-focus: #0369a1;
```

### 2.3 Typography MỚI

```css
/* Heading: Space Grotesk — geometric, modern, trustworthy */
--font-heading: 'Space Grotesk', sans-serif;

/* Body: Inter — clean, readable, professional */
--font-body: 'Inter', sans-serif;

/* Mono: JetBrains Mono — for data, stats, code */
--font-mono: 'JetBrains Mono', monospace;

/* Sizes */
--text-hero:    clamp(3rem, 8vw, 7rem);   /* Hero title */
--text-h1:      clamp(2rem, 4vw, 3.5rem);  /* Section title */
--text-h2:      clamp(1.5rem, 3vw, 2.5rem); /* Sub-section */
--text-h3:      1.25rem;                     /* Card title */
--text-body:    1rem;                        /* Body */
--text-small:   0.875rem;                    /* Small text */
--text-caption: 0.75rem;                     /* Caption */
```

---

## PHẦN III — KẾ HOẠCH 12 GIAI ĐOẠN CHI TIẾT

### GIAI ĐOẠN 1: THEME TRANSFORMATION
**Mục tiêu:** Chuyển sang light theme với hero dark

**Thay đổi cụ thể:**

`globals.css`:
- `--background: #f8fafc` (thay `#0a0f1e`)
- `--foreground: #0f172a` (thay `#f8fafc`)
- Tất cả `.glass-card` → `.card-light` (white bg + shadow)
- Borders: `border-slate-200` thay `border-slate-700/30`
- Shadows mới: `shadow-sm`, `shadow-md`, `shadow-lg`

`page.tsx` (Homepage):
- Hero section: GIỮ DARK (`bg-[#0c1222]`) — tạo contrast mạnh
- How It Works: `bg-white` với subtle gradient
- Modules: `bg-slate-50` với white cards
- Impact: `bg-white` với blue accent gradient background
- CTA: `bg-[#0c1222]` dark section (mirror hero)
- Footer: `bg-white`

`Navbar.tsx`:
- Default: `bg-white/80 backdrop-blur-xl border-b border-slate-200`
- Scrolled: `bg-white shadow-md`

`Footer.tsx`:
- `bg-white border-t border-slate-200`
- Text: `text-slate-600`

Tất cả 7 inner pages:
- Background: `bg-slate-50` hoặc `bg-white`
- Cards: `bg-white border border-slate-200 shadow-sm`
- Headers: `bg-white/80 backdrop-blur`
- Stats bars: White cards với colored accents

**Files:** `globals.css`, `page.tsx`, `Navbar.tsx`, `Footer.tsx`, `map/page.tsx`, `predict/page.tsx`, `alerts/page.tsx`, `rescue/page.tsx`, `dashboard/page.tsx`, `education/page.tsx`, `report/page.tsx`, `HeroVideo.tsx`

---

### GIAI ĐOẠN 2: DATA MODERNIZATION
**Mục tiêu:** Dữ liệu cập nhật đến tháng 5/2026

**Sự kiện thiên tai mới (Việt Nam 2025-2026):**

```typescript
// Thêm vào disaster-data.ts:

// 2025
{
  id: "dis-025-001",
  type: "storm",
  severity: "critical",
  status: "resolved",
  title: "Bão số 3 (Yagi) — Cấp 16",
  description: "Bão siêu mạnh đổ bộ Quảng Ninh-Hải Phòng, gió giật cấp 16-17. Thiệt hại nặng nề nhất 30 năm.",
  location: { lat: 20.8449, lng: 106.6881, province: "Hải Phòng" },
  affectedPeople: 3200000,
  startDate: "2025-09-07T08:00:00Z",
  updatedAt: "2025-09-15T18:00:00Z",
},
{
  id: "dis-025-002",
  type: "flood",
  severity: "critical",
  status: "resolved",
  title: "Lũ lụt miền Trung 2025",
  description: "Mưa lớn kéo dài gây lũ lụt nghiêm trọng tại Quảng Bình, Quảng Trị, Thừa Thiên Huế.",
  location: { lat: 17.4689, lng: 106.6223, province: "Quảng Bình" },
  affectedPeople: 850000,
  startDate: "2025-10-15T06:00:00Z",
  updatedAt: "2025-10-25T12:00:00Z",
},
{
  id: "dis-025-003",
  type: "landslide",
  severity: "high",
  status: "resolved",
  title: "Sạt lở Lai Châu 2025",
  description: "Sạt lở đất nghiêm trọng do mưa bão, nhiều thôn bản bị cô lập.",
  location: { lat: 22.338, lng: 103.8447, province: "Lai Châu" },
  affectedPeople: 35000,
  startDate: "2025-08-12T03:00:00Z",
  updatedAt: "2025-08-20T18:00:00Z",
},

// 2026
{
  id: "dis-026-001",
  type: "drought",
  severity: "high",
  status: "active",
  title: "Hạn hán Tây Nguyên 2026",
  description: "Thiếu nước nghiêm trọng tại Đắk Lắk, Gia Lai. Hồ chứa xuống mức thấp kỷ lục.",
  location: { lat: 12.7122, lng: 108.2346, province: "Đắk Lắk" },
  affectedPeople: 450000,
  startDate: "2026-02-01T00:00:00Z",
  updatedAt: "2026-05-20T00:00:00Z",
},
{
  id: "dis-026-002",
  type: "storm",
  severity: "medium",
  status: "monitoring",
  title: "Áp thấp nhiệt đới tháng 5/2026",
  description: "Áp thấp nhiệt đới trên Biển Đông, có khả năng mạnh lên thành bão.",
  location: { lat: 15.0, lng: 112.0, province: "Biển Đông" },
  affectedPeople: 0,
  startDate: "2026-05-22T00:00:00Z",
  updatedAt: "2026-05-24T06:00:00Z",
},
{
  id: "dis-026-003",
  type: "flood",
  severity: "medium",
  status: "active",
  title: "Ngập lụt miền Bắc tháng 5/2026",
  description: "Mưa lớn gây ngập lụt tại Hà Nội, Vĩnh Phúc, Phú Thọ.",
  location: { lat: 21.0285, lng: 105.8542, province: "Hà Nội" },
  affectedPeople: 120000,
  startDate: "2026-05-18T06:00:00Z",
  updatedAt: "2026-05-23T18:00:00Z",
},
{
  id: "dis-026-004",
  type: "landslide",
  severity: "high",
  status: "active",
  title: "Sạt lở Sơn La tháng 5/2026",
  description: "Sạt lở đất do mưa lớn kéo dài, nhiều tuyến đường bị chia cắt.",
  location: { lat: 21.327, lng: 103.914, province: "Sơn La" },
  affectedPeople: 28000,
  startDate: "2026-05-20T02:00:00Z",
  updatedAt: "2026-05-23T10:00:00Z",
},
{
  id: "dis-026-005",
  type: "flood",
  severity: "high",
  status: "active",
  title: "Nắng nóng kỷ lục miền Bắc",
  description: "Nhiệt độ lên tới 42°C tại nhiều tỉnh miền Bắc, ảnh hưởng nghiêm trọng đến sức khỏe.",
  location: { lat: 20.8449, lng: 106.6881, province: "Hải Phòng" },
  affectedPeople: 5000000,
  startDate: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-24T00:00:00Z",
},

// World events 2025-2026
{
  id: "dis-world-001",
  type: "earthquake",
  severity: "critical",
  status: "resolved",
  title: "Động đất Thổ Nhĩ Kỳ-Syria 2025",
  description: "Động đất mạnh 7.8 độ richter tại biên giới Thổ Nhĩ Kỳ-Syria.",
  location: { lat: 37.1744, lng: 37.0315, province: "Thổ Nhĩ Kỳ" },
  affectedPeople: 15000000,
  startDate: "2025-02-06T01:17:00Z",
  updatedAt: "2025-03-15T00:00:00Z",
},
```

**Files:** `disaster-data.ts`, `mock-data.ts` (tất cả features), `seasonal-data.ts`, `constants.ts`

---

### GIAI ĐOẠN 3: 3D GLOBE VISUALIZATION
**Mục tiêu:** 3D interactive globe trên homepage

**Cài đặt:** `globe.gl` (dựa trên Three.js, WebGL)

**Component mới:** `src/components/home/GlobeVisualization.tsx`

**Tính năng:**
- 3D Globe hiển thị Việt Nam + các điểm thiên tai toàn cầu
- Points layer — mỗi điểm thiên tai là 1 dot phát sáng
- Arcs layer — đường nối các sự kiện liên quan
- Labels layer — tên tỉnh/thành phố
- Atmosphere layer — glow effect cho globe
- Auto-rotate nhẹ khi idle (0.5 deg/s)
- Mouse interaction: zoom, rotate, hover tooltip
- Click → fly to location (smooth camera animation)
- Color-coded theo severity: đỏ (critical), cam (high), vàng (medium), xanh lá (low)
- Pulse animation cho điểm active

**Vị trí trên homepage:**
- Thay thế hoặc thêm TRƯỚC Modules section
- Section title: "Giám sát Toàn cầu"
- Subtitle: "Thiên tai đang được theo dõi trên toàn thế giới"
- Globe chiếm ~60vh height
- 2 bên: Stats cards (Tổng sự kiện, Người ảnh hưởng, Quốc gia)

**Dependencies:** `globe.gl`, `three`, `@types/three`

---

### GIAI ĐOẠN 4: INTERACTIVE DATA VISUALIZATION
**Mục tiêu:** Thay thế charts tĩnh bằng interactive visualizations

**4a. Interactive Timeline**
- Component: `src/components/home/InteractiveTimeline.tsx`
- Timeline ngang (horizontal scroll)
- Mỗi node là 1 sự kiện thiên tai
- Hover → hiện popup chi tiết
- Click → navigate đến trang chi tiết
- Zoom in/out (pinch hoặc scroll)
- Color-coded theo severity
- Animated dots cho sự kiện active

**4b. Force-Directed Network Graph**
- Component: `src/components/home/ForceGraph.tsx`
- D3.js force simulation
- Nodes = tỉnh/thành phố, Edges = mối quan hệ thiên tai
- Hover node → highlight connections
- Click node → hiện chi tiết
- Animated physics simulation

**4c. Real-time Counter Grid**
- Component nâng cấp từ `AnimatedCounter.tsx`
- 6 counters chạy liên tục (không chỉ khi scroll vào viewport)
- Hiệu ứng số chạy như odometer (cuộn số)
- Color-coded theo giá trị (xanh → vàng → đỏ)

**4d. Animated Heatmap Canvas**
- Component: `src/components/home/HeatmapCanvas.tsx`
- Canvas-based heatmap animation
- Hiển thị mật độ thiên tai theo thời gian
- Playback controls (play/pause/speed)
- Legend với color scale

---

### GIAI ĐOẠN 5: MOUSE-TRACKING & CURSOR EFFECTS
**Mục tiêu:** Mọi cử chỉ user đều thấy sự độc đáo

**5a. Cursor Glow Follower**
- Component: `src/components/shared/CursorGlow.tsx`
- Gradient blob (80px) theo chuột
- Mix-blend-mode: soft-light trên light theme
- Smooth follow với spring physics (damping: 0.15)
- Chỉ hiện trên desktop (ẩn trên mobile)

**5b. Parallax Layers (Hero)**
- 3 layers di chuyển theo chuột:
  - Layer 1 (far): Gradient mesh — chậm nhất
  - Layer 2 (mid): Grid overlay — trung bình
  - Layer 3 (near): Content — nhanh nhất
- Tạo chiều sâu 3D mà không cần WebGL

**5c. Tilt Cards (3D Effect)**
- Cards nghiêng theo vị trí chuột (max 8deg)
- Highlight edge gần chuột nhất
- Transition mượt khi mouse leave
- Áp dụng cho Module cards, Stat cards

**5d. Magnetic Buttons**
- Buttons hút về phía chuột khi đến gần (100px radius)
- Di chuyển max 8px
- Tạo cảm giác "sống" cho buttons
- Áp dụng cho CTA buttons chính

**5e. Scroll Progress Bar**
- Component: `src/components/shared/ScrollProgress.tsx`
- Thanh tiến trình mỏng (2px) ở đầu trang
- Gradient blue → cyan
- Smooth animation

**5f. Page Transition**
- Fade + slide khi chuyển trang
- Duration: 300ms
- Easing: cubic-bezier(0.22, 1, 0.36, 1)

---

### GIAI ĐOẠN 6: HOMEPAGE RESTRUCTURE
**Mục tiêu:** Giảm từ 10 sections xuống 7 sections

**Trước (10 sections):**
```
1. LIVE TICKER
2. HERO
3. HOW IT WORKS (FlowTimeline)
4. MODULES GRID
5. TECH STACK ← XÓA
6. LIVE STATS ← MERGE vào Impact
7. IMPACT SHOWCASE
8. TRUSTED BY ← XÓA
9. EVENTS TIMELINE
10. CTA
```

**Sau (7 sections):**
```
1. HERO (dark — video + 3D globe mini + typewriter + CTA)
2. IMPACT STATS (light — 4 massive numbers + animated counters)
3. HOW IT WORKS (light — FlowTimeline + interactive steps)
4. 3D GLOBE (dark — interactive globe visualization)
5. MODULES GRID (light — bento cards + hover tilt)
6. EVENTS TIMELINE (light — recent disasters)
7. CTA (dark — gradient + magnetic button)
```

**Logic:**
- Dark → Light → Light → Dark → Light → Light → Dark (alternating)
- Mỗi section có purpose rõ ràng
- Ít sections hơn nhưng mỗi section ấn tượng hơn

---

### GIAI ĐOẠN 7: INNER PAGES REDESIGN

**7a. /map — Bản đồ**
- Giữ Leaflet map nhưng thêm:
  - Sidebar trái: Province list với search
  - Bottom bar: Timeline slider
  - Top: Stats bar compact
  - Right: Filter panel (collapsible)
- Light theme: White sidebar, light controls

**7b. /predict — AI Dự đoán**
- Redesign layout: 2 columns
  - Left: Controls (province, month, scenario)
  - Right: Map + Charts
- Thêm "AI Explanation" card — giải thích tại sao dự đoán như vậy
- Thêm "Compare Scenarios" — so sánh El Niño vs La Niña

**7c. /alerts — Cảnh báo & SOS**
- Dashboard-style layout
- Top: Alert stats bar
- Left: Alert feed (scrollable)
- Right: Map với alert markers
- Bottom: SOS history
- Light theme với red accent cho alerts

**7d. /rescue — Phối hợp Cứu trợ**
- Kanban board layout cho tasks
- Map với incident markers
- Resource allocation visual
- Volunteer management

**7e. /dashboard — Thống kê**
- 4 views (Executive, Operational, Analytical, Strategic)
- Light theme với colorful charts
- Interactive drill-down
- Export functionality

**7f. /education — Giáo dục**
- Card-based course browser
- Progress visualization
- Quiz engine
- Scenario simulator

**7g. /report — Báo cáo**
- Wizard-style submit form
- Feed layout cho reports
- Map view
- My reports panel

---

### GIAI ĐOẠN 8: ANIMATION SYSTEM OVERHAUL
**Mục tiêu:** Ít animation hơn nhưng mỗi animation phải đỉnh cao

**Quy tắc mới:**
- Max 3-4 animated elements per viewport
- Duration: 200-600ms (không > 800ms)
- CSS-first, Framer Motion cho complex sequences
- Luôn có `prefers-reduced-motion` support

**Animations mới:**

**8a. Page Load Sequence**
```
0ms:    Logo fade in
200ms:  Navbar slide down
400ms:  Hero title fade up
600ms:  Hero subtitle fade up
800ms:  Hero CTA fade up
1000ms: Hero stats counter animation
1200ms: Floating card slide in from right
```

**8b. Scroll-triggered (mới)**
- Sections: fade + scale (0.98 → 1) thay vì chỉ fade + translateY
- Cards: staggered entrance với perspective
- Stats: counter animation khi vào viewport
- Globe: rotate to Vietnam khi scroll vào

**8c. Hover effects (mới)**
- Cards: lift + shadow + subtle glow
- Buttons: scale + shadow
- Links: underline animation
- Icons: rotate/scale

**8d. Loading states**
- Skeleton screens (đã có)
- Progressive image loading (blur-up)
- Content fade-in khi loaded

---

### GIAI ĐOẠN 9: REAL-TIME API INTEGRATION
**Mục tiêu:** Dữ liệu thật, không chỉ mock

**APIs cần tích hợp:**

| API | Dữ liệu | Endpoint | Status |
|-----|----------|----------|--------|
| USGS Earthquake | Động đất toàn cầu | `earthquake.usgs.gov/fdsnws/event/1/` | Đã có trong predict |
| GDACS | Cảnh báo toàn cầu | `gdacs.org` | Đã có trong predict |
| Open-Meteo | Thời tiết | `api.open-meteo.com/v1/forecast` | Đã có trong map |
| ReliefWeb | Tin tức thiên tai | `api.reliefweb.int/v1/disasters` | Đã có trong predict |
| VNDMA | Thiên tai VN | Không có public API — dùng mock | Cần mock |
| VNRC | SOS | Không có public API — dùng mock | Cần mock |

**Strategy:**
- Trang chủ: Dùng data từ `disaster-data.ts` (updated) — KHÔNG gọi API
- /map: Gọi Open-Meteo API cho weather overlay (đã có)
- /predict: Gọi USGS + GDACS + ReliefWeb (đã có)
- /alerts: Dùng mock data (không có API thật)
- /dashboard: Dùng mock data (25 năm historical)
- /rescue: Dùng mock data
- /education: Dùng static content

---

### GIAI ĐOẠN 10: ACCESSIBILITY & PERFORMANCE
**Mục tiêu:** Lighthouse > 95, WCAG 2.1 AA

**Accessibility:**
- `prefers-reduced-motion` support (đã có)
- `prefers-color-scheme` auto dark/light mode (THÊM)
- Keyboard navigation improvements
- Screen reader support (ARIA labels — đã có)
- Focus indicators (đã có)
- Color contrast compliance

**Performance:**
- Dynamic imports cho heavy components (đã có)
- Image optimization: WebP, blur placeholder
- Code splitting per route (Next.js auto)
- Lazy load below-fold content
- Compress video (hero) < 3MB
- Service worker caching (PWA — đã có)

---

### GIAI ĐOẠN 11: RESPONSIVE & MOBILE
**Mục tiêu:** Mobile-first, touch-friendly

- Touch targets ≥ 44px (đã có)
- Bottom navigation (đã có)
- Swipe gestures cho carousels
- Responsive typography
- Collapsible panels trên mobile
- Map fullscreen trên mobile

---

### GIAI ĐOẠN 12: SEO & SOCIAL
**Mục tiêu:** Tối ưu SEO + social sharing

- Open Graph tags (đã có)
- Twitter Card tags (THÊM)
- Structured data (JSON-LD)
- Sitemap.xml
- robots.txt
- Meta descriptions cho mỗi trang
- Alt text cho tất cả images

---

## PHẦN IV — DEPENDENCIES MỚI

```bash
npm install globe.gl three @types/three d3 @types/d3
```

**Đã có:**
- framer-motion (animations)
- recharts (charts)
- leaflet + react-leaflet (maps)
- tailwindcss (styling)
- lucide-react (icons)
- @dnd-kit (drag and drop)
- @tensorflow/tfjs (AI/ML)

---

## PHẦN V — FILES THAY ĐỔI ƯỚC TÍNH

| Giai đoạn | Files sửa | Files mới | Effort |
|-----------|-----------|-----------|--------|
| 1. Theme | ~15 | 0 | Cao |
| 2. Data | ~8 | 0 | Trung bình |
| 3. 3D Globe | 1 | 1 | Cao |
| 4. Interactive Viz | 2 | 3 | Cao |
| 5. Mouse Effects | 5 | 3 | Trung bình |
| 6. Homepage | 1 | 0 | Cao |
| 7. Inner Pages | 7 | 0 | Cao |
| 8. Animation | 10 | 0 | Trung bình |
| 9. API | 3 | 1 | Trung bình |
| 10. A11y+Perf | 5 | 0 | Thấp |
| 11. Mobile | 3 | 0 | Thấp |
| 12. SEO | 2 | 2 | Thấp |
| **TỔNG** | **~57** | **~10** | |

---

## PHẦN VI — THỨ TỰ THỰC HIỆN KHUYẾN NGHỊ

```
Phase 1: Theme Transformation (ưu tiên #1 — thay đổi toàn diện nhất)
Phase 2: Data Modernization (ưu tiên #1 — dữ liệu mới)
Phase 3: 3D Globe (wow factor #1)
Phase 6: Homepage Restructure (cùng với Phase 1)
Phase 5: Mouse Effects (wow factor #2)
Phase 4: Interactive Viz (wow factor #3)
Phase 8: Animation Overhaul (polish)
Phase 7: Inner Pages (redesign)
Phase 9: API Integration (real data)
Phase 10: A11y + Performance
Phase 11: Mobile
Phase 12: SEO
```

---

## PHẦN VII — THAM KHỐO WORLD-CLASS

### Websites cần tham khảo:
1. **apple.com/health** — Light theme, card-based, clean data viz
2. **crisisresponse.google** — Disaster response, light theme, maps
3. **stripe.com** — Gradient mesh, interactive demos
4. **linear.app** — Minimal, efficient, keyboard-first
5. **vercel.com** — Clean, white theme, subtle animations
6. **globe.gl/examples** — 3D globe visualization
7. **earth.nullschool.net** — Real-time weather viz
8. **fema.gov** — Government standard, accessible
9. **reliefweb.int** — Disaster information hub
10. **gdacs.org** — Global disaster alert system

### Open-source projects:
1. **globe.gl** — 3D globe (Three.js based)
2. **react-globe.gl** — React wrapper
3. **d3.js** — Data visualization
4. **three.js** — 3D graphics
5. **framer-motion** — Animations (đã có)
6. **react-spring** — Physics-based animations
7. **leva** — Debug UI (cho development)
8. **react-rough** — Sketch-style charts