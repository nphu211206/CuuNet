# 🏆 MEGA MASTER BILLION PREMIUM PLAN
# CuuNet — Nền tảng Quản lý Thiên tai Quốc gia Việt Nam
## Ultimate Upgrade Strategy | Version 2.0

**Ngày tạo:** 23/05/2026  
**Tác giả:** AI Agent (Cline) — AWF Framework  
**Skills đã đọc:** nextjs-styling, common-ui-design, nextjs _INDEX.md  
**Source code đã phân tích:** Toàn bộ 7 trang (40,000+ lines), 100+ files  

---

# PHẦN I — TỔNG QUAN DỰ ÁN HIỆN TẠI

## 1.1. Kiến trúc hiện tại

Dự án CuuNet được xây dựng bằng Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, với 7 module chính:

| Module | Route | Lines of Code | Trạng thái |
|--------|-------|---------------|------------|
| Bản đồ Thiên tai | /map | ~2,000 | Hoạt động nhưng bản đồ tối đen |
| AI Dự đoán | /predict | ~3,500 | Đầy đủ tính năng, UI tốt |
| Báo cáo Cộng đồng | /report | ~2,800 | Hoạt động tốt |
| Cảnh báo & SOS | /alerts | ~4,000 | Quá nhiều tabs (7 tabs) |
| Phối hợp Cứu trợ | /rescue | ~5,000 | Quá nhiều tabs (14 tabs) |
| Dashboard Thống kê | /dashboard | ~3,200 | Hoạt động tốt |
| Giáo dục Sinh tồn | /education | ~3,000 | Hoạt động tốt |
| **Trang chủ** | / | ~2,500 | Đã nâng cấp Phase 1-10 |

**Tổng cộng:** 40,000+ lines, 100+ files, 9 routes hoạt động

## 1.2. Tech Stack hiện tại

```
Frontend:      Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4
Animation:     Framer Motion 12 · CSS Animations
Visualization: Leaflet.js · Recharts · D3.js concepts
AI/ML:         TensorFlow.js 4 · Web Workers · LSTM Neural Network
Data:          Open-Meteo API · ReliefWeb API · USGS API · GDACS API
Standards:     INFORM Risk Index · CAP v1.2 · ICS (FEMA) · UN OCHA 3W
```

## 1.3. APIs đã tích hợp

| API | Nhà cung cấp | Dữ liệu | Cache | Trạng thái |
|-----|-------------|----------|-------|------------|
| Weather | Open-Meteo | Nhiệt độ, mưa, gió | 30 phút | ✅ Hoạt động |
| Disasters | ReliefWeb (UN) | Thiên tai Việt Nam | 1 giờ | ✅ Hoạt động |
| Alerts | GDACS | Cảnh báo toàn cầu | 30 phút | ✅ Hoạt động |
| Earthquakes | USGS | Động đất bán kính 500km | 30 phút | ✅ Hoạt động |

## 1.4. Standards quốc tế đã tham khảo

| Chuẩn | Tổ chức | Áp dụng trong |
|-------|---------|--------------|
| INFORM Risk Index | EU JRC | Risk Scoring |
| CAP v1.2 | OASIS | Alert System |
| ICS / NIMS | FEMA | Incident Command |
| 3W/4W/5W | UN OCHA | Coordination |
| START Triage | CA EMSA | Triage Engine |
| Sendai Framework | UNDRR | KPIs |
| Octalysis | Yu-kai Chou | Gamification |
| SM-2 | SuperMemo | Spaced Repetition |
| EM-DAT | CRED UCLouvain | Historical Data |

---

# PHẦN II — PHÂN TÍCH VẤN ĐỀ CHI TIẾT

## 2.1. Vấn đề CRITICAL (Phải fix ngay)

### 2.1.1. Bản đồ tối đen — Không thấy đường

**Vị trí:** `src/features/map-disaster/config/map-config.ts` dòng 9  
**Hiện tại:** Sử dụng `dark_all` CARTO tiles — bản đồ hoàn toàn tối, không thấy tên đường, tên thành phố, ranh giới tỉnh  
**Tác động:** Ảnh hưởng đến 3 trang có bản đồ: /map, /alerts (AlertMap), /rescue (OperationsMap)  
**So sánh:** Google Maps, Apple Maps, Grab — tất cả đều dùng bản đồ sáng, rõ ràng  
**Mức độ nghiêm trọng:** CRITICAL — người dùng không thể sử dụng bản đồ hiệu quả  

### 2.1.2. Background quá tối — Thiếu contrast

**Vị trí:** `src/app/globals.css` dòng 4  
**Hiện tại:** Background `#06080f` — gần như đen hoàn toàn  
**Vấn đề:** Text `#f1f5f9` trên nền `#06080f` tạo contrast quá cao, gây mỏi mắt khi sử dụng lâu  
**So sánh:** Linear.app dùng `#0a0f1e`, Vercel dùng `#000` nhưng có nhiều điểm nhấn sáng, Stripe dùng gradient nhẹ  
**Mức độ nghiêm trọng:** HIGH — ảnh hưởng đến trải nghiệm người dùng toàn bộ ứng dụng  

### 2.1.3. Không có hướng dẫn sử dụng

**Vấn đề:** Khi vào /map, /predict, /alerts... người dùng không biết trang này làm gì, cách sử dụng ra sao  
**So sánh:** Tất cả ứng dụng chuyên nghiệp đều có intro section hoặc onboarding  
**Mức độ nghiêm trọng:** HIGH — người dùng mới sẽ bỏ đi ngay  

## 2.2. Vấn đề MEDIUM (Nên fix sớm)

### 2.2.1. Quá nhiều tabs — UX rối mắt

**/rescue:** 14 tabs (Tổng quan, Bản đồ, SOS, Nhiệm vụ, Tài nguyên, 3W, Nơi trú, Liên lạc, Timeline, TNV, Check-in, Điều phối, Chỉ huy, Dòng TN)  
**/alerts:** 7 tabs (Tổng quan, Cảnh báo, Bản đồ, SOS, Danh bạ, Checklist, Lịch sử)  
**Vấn đề:** Người dùng bị ngợp, không biết bắt đầu từ đâu  
**Giải pháp:** Gộp tabs chính (3-5 tabs) + dropdown cho tabs phụ  

### 2.2.2. Không có map tile toggle

**Vấn đề:** Chỉ có 1 loại bản đồ (dark), không thể chuyển sang light hoặc satellite  
**So sánh:** Google Maps có 3 chế độ (Default, Satellite, Terrain), Apple Maps có 2 chế độ  
**Giải pháp:** Thêm toggle button cho 3 chế độ: Light (Voyager), Dark (CARTO Dark), Satellite (Esri)  

### 2.2.3. Font chữ nhàm chán

**Hiện tại:** Chỉ dùng Inter cho toàn bộ  
**Vấn đề:** Không có hierarchy typography, headings và body text dùng cùng font  
**Giải pháp:** Thêm Space Grotesk cho headings (hiện đại, mạnh mẽ), giữ Inter cho body  

### 2.2.4. Thiếu scroll animations

**Hiện tại:** Các section hiện ra đột ngột khi scroll  
**Vấn đề:** Không có cảm giác "mượt mà", thiếu professional  
**Giải pháp:** Thêm IntersectionObserver animations cho tất cả sections  

## 2.3. Vấn đề LOW (Nice to have)

### 2.3.1. Không có skeleton loading states

### 2.3.2. Mobile experience chưa tối ưu

### 2.3.3. Không có PWA support

### 2.3.4. Không có keyboard shortcuts

---

# PHẦN III — NGHIÊN CỨU THẾ GIỚI

## 3.1. Tham khảo từ các phần mềm hàng đầu

### 3.1.1. Linear.app (Productivity Tool)

**Điểm hay:**
- Page transitions: smooth slide + fade (duration 0.3s, ease cubic-bezier(0.22, 1, 0.36, 1))
- Hover states: subtle lift (translateY -2px) + shadow tăng nhẹ
- Loading: skeleton shimmer với gradient animation
- Typography: Inter cho body, custom font cho headings
- Color: Dark theme với accent colors nhẹ, không quá tối

**Áp dụng cho CuuNet:**
- Dùng cùng easing curve cho tất cả animations
- Skeleton loading cho mọi component
- Hover effects nhẹ nhàng, không quá dramatic

### 3.1.2. Stripe.com (Fintech)

**Điểm hay:**
- Gradient mesh backgrounds — các orbs màu di chuyển nhẹ theo chuột
- Floating particles — hiệu ứng bay lên từ dưới
- Scroll-triggered reveals — sections fade in khi scroll vào viewport
- Typewriter effects cho hero text
- Card designs: glassmorphism nhẹ, border mờ

**Áp dụng cho CuuNet:**
- Đã có particle field ở homepage — cần áp dụng cho các trang khác
- Scroll reveals cho tất cả sections
- Gradient mesh backgrounds cho hero sections

### 3.1.3. Vercel.com (Developer Tools)

**Điểm hay:**
- Dark theme với điểm nhấn sáng (blue, purple)
- Grid overlay patterns — tạo depth
- Glow effects trên interactive elements
- Minimal UI — ít elements, nhiều whitespace
- Typography: Geist font family

**Áp dụng cho CuuNet:**
- Grid overlay đã có ở homepage — cần áp dụng toàn bộ
- Glow effects cho buttons và cards
- Tăng whitespace giữa các sections

### 3.1.4. Figma.com (Design Tool)

**Điểm hay:**
- Smooth zoom transitions
- Real-time collaboration indicators
- Minimal, clean UI
- Color palette: nhẹ nhàng, không chói

**Áp dụng cho CuuNet:**
- Smooth transitions giữa các tab
- Real-time indicators cho SOS status
- Clean UI — giảm clutter

### 3.1.5. Apple Maps / Google Maps

**Điểm hay:**
- Bản đồ sáng, rõ ràng, labels dễ đọc
- 3 chế độ: Default, Satellite, Terrain/Hybrid
- Markers nổi bật trên nền sáng
- Search bar luôn visible
- Compass và zoom controls rõ ràng

**Áp dụng cho CuuNet:**
- Đổi sang bản đồ sáng (CartoDB Voyager)
- Thêm 3 chế độ toggle
- Markers cần nổi bật hơn trên nền sáng

### 3.1.6. Grab / Gojek (Super Apps Đông Nam Á)

**Điểm hay:**
- UI thân thiện với người dùng Việt Nam
- Màu sắc tươi sáng, không quá tối
- Icons lớn, dễ hiểu
- Bottom navigation cho mobile
- Loading states mượt mà

**Áp dụng cho CuuNet:**
- Màu sắc cần sáng hơn, thân thiện hơn
- Icons cần lớn hơn, dễ hiểu hơn
- Mobile bottom navigation

## 3.2. Tham khảo từ các ứng dụng thiên tai

### 3.2.1. GDACS (Global Disaster Alert Coordination System)

**Website:** https://www.gdacs.org  
**Điểm hay:**
- Dashboard tổng quan rõ ràng
- Bản đồ với markers màu sắc theo severity
- Timeline slider để xem diễn biến
- Alert levels rõ ràng (Green, Orange, Red)

**Áp dụng cho CuuNet:**
- Dashboard layout tương tự
- Color coding theo severity
- Timeline đã có — cần cải thiện UX

### 3.2.2. ReliefWeb (UN OCHA)

**Website:** https://reliefweb.int  
**Điểm hay:**
- Clean, professional UI
- Filter system mạnh mẽ
- Country profiles chi tiết
- Report format chuẩn

**Áp dụng cho CuuNet:**
- Filter system cho /report và /alerts
- Province profiles cho /dashboard
- Report format chuẩn

### 3.2.3. NASA FIRMS (Fire Information for Resource Management)

**Website:** https://firms.modaps.eosdis.nasa.gov  
**Điểm hay:**
- Bản đồ vệ tinh chất lượng cao
- Real-time fire detection
- Time slider để xem diễn biến
- Export data options

**Áp dụng cho CuuNet:**
- Bản đồ vệ tinh option
- Real-time detection indicators
- Export options cho /dashboard

### 3.2.4. Japan Bousai (防災教育 — Giáo dục phòng chống thiên tai Nhật Bản)

**Điểm hay:**
- Gamification tuyệt vời
- Interactive scenarios
- Visual learning materials
- Progress tracking

**Áp dụng cho CuuNet:**
- Gamification đã có (Octalysis) — cần cải thiện visuals
- Interactive scenarios đã có — cần thêm animations
- Visual learning materials

## 3.3. Dữ liệu Việt Nam — Nguồn tham khảo

### 3.3.1. Ban Chỉ huy PCTT&TKCN

**Website:** http://phongchongthientai.vn  
**Dữ liệu:**
- Cảnh báo thiên tai chính thức
- Số liệu thiệt hại hàng năm
- Bản đồ vùng nguy hiểm
- Kế hoạch phòng chống

### 3.3.2. Trung tâm Khí tượng Thủy văn Quốc gia

**Website:** https://nchmf.gov.vn  
**Dữ liệu:**
- Dự báo thời tiết chính thức
- Cảnh báo bão, lũ
- Dữ liệu thủy văn
- Bản đồ thời tiết

### 3.3.3. EM-DAT (International Disaster Database)

**Website:** https://www.emdat.be  
**Dữ liệu:**
- 25 năm dữ liệu thiên tai Việt Nam (2000-2024)
- Số liệu thiệt hại, thương vong
- Phân loại theo loại thiên tai
- So sánh quốc tế

### 3.3.4. VNDMA (Vietnam Disaster Management Authority)

**Dữ liệu:**
- Kế hoạch PCTT quốc gia
- Số liệu thống kê
- Báo cáo hàng năm
- Chính sách PCTT

---

# PHẦN IV — CHI TIẾT TỪNG PHASE

## PHASE 1: FIX BẢN ĐỒ — ĐỔI TILES SANG SÁNG

### 1.1. Mục tiêu
Chuyển bản đồ từ chế độ tối (dark_all) sang chế độ sáng (Voyager) mặc định, và thêm tùy chọn切换 giữa 3 chế độ.

### 1.2. Tile Maps được chọn

| Chế độ | Provider | URL Pattern | Ưu điểm |
|--------|----------|-------------|---------|
| **Light (Default)** | CartoDB Voyager | basemaps.cartocdn.com/rastertiles/voyager | Đẹp nhất, labels rõ, miễn phí, không cần API key |
| **Dark** | CartoDB Dark | basemaps.cartocdn.com/dark_all | Cho ban đêm hoặc người thích dark mode |
| **Satellite** | Esri World Imagery | server.arcgisonline.com | Ảnh vệ tinh miễn phí, chất lượng cao |

### 1.3. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/features/map-disaster/config/map-config.ts` | Đổi tileUrl mặc định sang Voyager, thêm TILE_OPTIONS object |
| `src/features/map-disaster/ui/MapControls.tsx` | Thêm TileToggle component cho 3 chế độ |
| `src/features/map-disaster/ui/DisasterMap.tsx` | Nhận tileMode prop và thay đổi TileLayer URL |
| `src/app/map/page.tsx` | Quản lý tileMode state |
| `src/features/alert-sos/ui/AlertMap.tsx` | Nhận tileMode prop |
| `src/features/rescue-connect/ui/OperationsMap.tsx` | Nhận tileMode prop |

### 1.4. UI/UX cho TileToggle

- Vị trí: Góc phải trên của bản đồ
- Design: 3 buttons nhỏ (☀️ Sáng, 🌙 Tối, 🛰️ Vệ tinh)
- Active state: Border xanh + background nhẹ
- Animation: Fade in/out khi switch
- Responsive: Collapse thành dropdown trên mobile

### 1.5. Ước tính thời gian: 30 phút

---

## PHASE 2: TĂNG BRIGHTNESS TOÀN BỘ

### 2.1. Mục tiêu
Tăng độ sáng tổng thể của ứng dụng, tạo cảm giác chuyên nghiệp hơn, giảm mỏi mắt.

### 2.2. Color System mới

**Backgrounds:**
- Page background: `#06080f` → `#0a0f1e` (sáng hơn 1 cấp)
- Card background: `rgba(15,17,33,0.5)` → `rgba(15,23,42,0.7)` (tăng opacity)
- Card hover: `rgba(15,17,33,0.6)` → `rgba(15,23,42,0.85)`
- Glass effect: `backdrop-blur(16px)` → `backdrop-blur(20px)`

**Borders:**
- Default: `rgba(51,65,85,0.3)` → `rgba(148,163,184,0.12)` (nhẹ hơn, tinh tế hơn)
- Hover: `rgba(51,65,85,0.5)` → `rgba(148,163,184,0.25)`
- Active: Giữ nguyên accent color

**Text:**
- Primary: `#f1f5f9` → `#f8fafc` (sáng hơn 1 cấp)
- Secondary: `#94a3b8` (giữ nguyên)
- Muted: `#64748b` → `#64748b` (giữ nguyên)

**Accent Colors (giữ nguyên):**
- Primary Blue: `#3B82F6`
- Purple: `#8B5CF6`
- Cyan: `#06B6D4`
- Green: `#22C55E`
- Amber: `#F59E0B`
- Red: `#EF4444`

### 2.3. Typography mới

**Headings:** Space Grotesk (hiện đại, mạnh mẽ, geometric)
- H1: 3rem/3.5rem, font-weight 900, letter-spacing -0.02em
- H2: 2rem/2.5rem, font-weight 800, letter-spacing -0.01em
- H3: 1.5rem, font-weight 700

**Body:** Inter (giữ nguyên — readable, professional)
- Body: 1rem, font-weight 400, line-height 1.6
- Small: 0.875rem, font-weight 400
- Caption: 0.75rem, font-weight 500

### 2.4. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/app/globals.css` | Cập nhật CSS variables, thêm typography classes |
| `src/app/layout.tsx` | Import Space Grotesk font, thêm variable |

### 2.5. Ước tính thời gian: 1 giờ

---

## PHASE 3: INTRO SECTIONS CHO MỖI TRANG

### 3.1. Mục tiêu
Thêm hero section vào đầu mỗi trang (ngoài homepage) để giải thích trang này làm gì, tại sao quan trọng, và hướng dẫn sử dụng nhanh.

### 3.2. Nội dung intro cho từng trang

**/map — Bản đồ Thiên tai:**
- Title: "Giám sát Thiên tai Thời gian Thực"
- Subtitle: "Theo dõi 63 tỉnh thành với heatmap, markers, và dữ liệu thời tiết real-time"
- Guide steps:
  1. "Click marker để xem chi tiết sự kiện"
  2. "Kéo timeline để xem diễn biến theo thời gian"
  3. "Bật/tắt các lớp: Heatmap, Markers, Choropleth, Thời tiết"
  4. "Chuyển đổi chế độ: Sáng / Tối / Vệ tinh"

**/predict — AI Dự đoán:**
- Title: "AI Dự đoán Thiên tai"
- Subtitle: "Mô hình Machine Learning dự đoán rủi ro theo khu vực, thời gian và kịch bản khí hậu"
- Guide steps:
  1. "Chọn tỉnh/thành phố ở panel trái"
  2. "Chọn tháng để xem dự đoán theo mùa"
  3. "Chọn kịch bản: El Niño, La Niña, Biến đổi khí hậu"
  4. "Xem biểu đồ xu hướng 6 tháng tới"

**/alerts — Cảnh báo & SOS:**
- Title: "Cảnh báo & SOS Thiên tai"
- Subtitle: "Hệ thống cảnh báo CAP-inspired và nút SOS cứu nạn 1 chạm"
- Guide steps:
  1. "Xem cảnh báo gần đây ở tab Tổng quan"
  2. "Gửi SOS khẩn cấp bằng nút đỏ"
  3. "Tìm danh bạ khẩn cấp theo tỉnh"
  4. "Kiểm tra checklist phòng chống thiên tai"

**/report — Báo cáo Cộng đồng:**
- Title: "Báo cáo Thiên tai Cộng đồng"
- Subtitle: "Mỗi người dân là một cảm biến thiên tai. Gửi báo cáo 6 bước, xác minh cộng đồng."
- Guide steps:
  1. "Chọn loại thiên tai đã chứng kiến"
  2. "Xác định vị trí trên bản đồ"
  3. "Mô tả tình hình và đính kèm ảnh"
  4. "Gửi báo cáo — sẽ được cộng đồng xác minh"

**/rescue — Phối hợp Cứu trợ:**
- Title: "Phối hợp Cứu trợ Thiên tai"
- Subtitle: "Điều phối cứu hộ theo chuẩn ICS, 3W Dashboard, triage SOS, quản lý tài nguyên"
- Guide steps:
  1. "Xem Tổng quan để biết tình hình hiện tại"
  2. "Theo dõi SOS trên Bản đồ tác chiến"
  3. "Quản lý Nhiệm vụ và Tài nguyên"
  4. "Phối hợp với Tình nguyện viên và Tổ chức"

**/dashboard — Dashboard Thống kê:**
- Title: "Trực quan hóa Dữ liệu Thiên tai"
- Subtitle: "25 năm dữ liệu thiên tai Việt Nam (2000-2024). 4 góc nhìn. Xuất CSV."
- Guide steps:
  1. "Executive View: KPI Cards cho lãnh đạo"
  2. "Operational View: Giám sát thời gian thực"
  3. "Analytical View: Phân tích chi tiết"
  4. "Strategic View: Xu hướng dài hạn"

**/education — Giáo dục Sinh tồn:**
- Title: "Giáo dục Phòng chống Thiên tai"
- Subtitle: "8 khóa học microlearning, SM-2 spaced repetition, 20 huy hiệu, bảng xếp hạng"
- Guide steps:
  1. "Chọn khóa học phù hợp với khu vực"
  2. "Hoàn thành bài học 5 phút mỗi ngày"
  3. "Làm quiz để kiểm tra kiến thức"
  4. "Thu thập huy hiệu và leo bảng xếp hạng"

### 3.3. Design Pattern cho Intro Section

**Layout:**
- Full-width section, padding 48px top/bottom
- Background: gradient nhẹ từ blue/5 sang transparent
- Content: max-width 4xl, centered
- Badge: Module number + icon
- Title: H1 với gradient text
- Subtitle: text-lg, slate-400
- Guide steps: flex wrap, 4 cards nhỏ với icon + text

**Animation:**
- Fade in từ dưới lên khi scroll vào viewport
- Stagger animation cho guide steps (delay 0.1s mỗi step)

### 3.4. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/app/map/page.tsx` | Thêm IntroSection component ở đầu |
| `src/app/predict/page.tsx` | Thêm IntroSection component ở đầu |
| `src/app/alerts/page.tsx` | Thêm IntroSection component ở đầu |
| `src/app/report/page.tsx` | Thêm IntroSection component ở đầu |
| `src/app/rescue/page.tsx` | Thêm IntroSection component ở đầu |
| `src/app/dashboard/page.tsx` | Thêm IntroSection component ở đầu |
| `src/app/education/page.tsx` | Thêm IntroSection component ở đầu |
| `src/components/shared/IntroSection.tsx` | Tạo component mới (reusable) |

### 3.5. Ước tính thời gian: 2 giờ

---

## PHASE 4: GIẢM TABS — UX OVERHAUL

### 4.1. Mục tiêu
Giảm số tabs ở /rescue (14→5) và /alerts (7→4) để UX rõ ràng hơn.

### 4.2. /rescue — 14 tabs → 5 tabs chính + dropdown

**Tabs chính (luôn visible):**
1. Tổng quan (dashboard)
2. Bản đồ (operations)
3. SOS (sos)
4. Nhiệm vụ (tasks)
5. Tài nguyên (resources)

**Tabs phụ (trong dropdown "Thêm ▼"):**
6. 3W Dashboard
7. Nơi trú ẩn
8. Liên lạc
9. Timeline
10. Tình nguyện viên
11. Check-in
12. Điều phối
13. Chỉ huy
14. Dòng tài nguyên

**UI cho dropdown:**
- Button "Thêm ▼" bên phải tabs chính
- Dropdown menu với icons + labels
- Active tab trong dropdown được highlight

### 4.3. /alerts — 7 tabs → 4 tabs chính

**Tabs chính:**
1. Tổng quan (dashboard)
2. Cảnh báo (feed)
3. SOS (sos)
4. Danh bạ (directory)

**Tabs phụ (trong dropdown):**
5. Bản đồ (map)
6. Checklist (checklist)
7. Lịch sử (history)

### 4.4. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/app/rescue/page.tsx` | Refactor tabs: 5 chính + dropdown |
| `src/app/alerts/page.tsx` | Refactor tabs: 4 chính + dropdown |
| `src/components/shared/TabDropdown.tsx` | Tạo component mới (reusable) |

### 4.5. Ước tính thời gian: 1.5 giờ

---

## PHASE 5: SCROLL ANIMATIONS TOÀN BỘ

### 5.1. Mục tiêu
Thêm scroll-triggered animations cho tất cả sections trong mọi trang.

### 5.2. Animation Patterns

**Fade In Up (cho sections):**
- opacity: 0 → 1
- transform: translateY(30px) → translateY(0)
- duration: 0.7s
- easing: cubic-bezier(0.22, 1, 0.36, 1)
- trigger: IntersectionObserver, threshold 0.1

**Stagger Children (cho lists/grids):**
- Mỗi child delay 0.08s
- Dùng cho: module cards, event lists, stat cards

**Scale In (cho modals/cards quan trọng):**
- opacity: 0 → 1
- transform: scale(0.95) → scale(1)
- duration: 0.5s

### 5.3. Components cần thêm animation

| Component | Animation | Trang |
|-----------|-----------|-------|
| StatsBar | Fade in up | /map, /predict, /alerts, /rescue, /dashboard |
| Map Container | Fade in | /map, /alerts, /rescue |
| Filter Bar | Fade in up | /predict, /dashboard |
| Cards Grid | Stagger fade in | /dashboard, /education |
| Timeline Items | Stagger fade in left | /alerts, /rescue |
| Tab Content | Fade in | Tất cả |

### 5.4. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/components/shared/ScrollReveal.tsx` | Đã có — cần sử dụng rộng rãi hơn |
| Tất cả page.tsx | Wrap sections trong ScrollReveal |

### 5.5. Ước tính thời gian: 1.5 giờ

---

## PHASE 6: COLOR SYSTEM & TYPOGRAPHY

### 6.1. Mục tiêu
Thiết lập hệ thống màu sắc và typography thống nhất toàn bộ ứng dụng.

### 6.2. CSS Variables mới

```css
:root {
  /* Backgrounds */
  --bg-page: #0a0f1e;
  --bg-card: rgba(15, 23, 42, 0.7);
  --bg-card-hover: rgba(15, 23, 42, 0.85);
  --bg-glass: rgba(15, 23, 42, 0.5);
  
  /* Borders */
  --border-default: rgba(148, 163, 184, 0.12);
  --border-hover: rgba(148, 163, 184, 0.25);
  --border-active: var(--color-primary);
  
  /* Text */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Accent Colors */
  --color-primary: #3B82F6;
  --color-secondary: #8B5CF6;
  --color-accent: #06B6D4;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.3);
}
```

### 6.3. Typography Classes

```css
.heading-1 {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.heading-2 {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.heading-3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}

.body-text {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
}

.caption {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

### 6.4. Ước tính thời gian: 1 giờ

---

## PHASE 7: MICRO-INTERACTIONS & HOVER EFFECTS

### 7.1. Mục tiêu
Thêm micro-interactions cho tất cả interactive elements.

### 7.2. Button Interactions

**Default state:**
- background: accent color
- transform: none
- box-shadow: shadow-sm

**Hover state:**
- background: accent color (sáng hơn 10%)
- transform: translateY(-2px)
- box-shadow: shadow-md + glow

**Active/Press state:**
- transform: translateY(0) scale(0.98)
- box-shadow: shadow-sm

**Transition:**
- duration: 0.2s
- easing: ease-out

### 7.3. Card Interactions

**Default state:**
- background: var(--bg-card)
- border: var(--border-default)
- transform: none
- box-shadow: shadow-sm

**Hover state:**
- background: var(--bg-card-hover)
- border: var(--border-hover)
- transform: translateY(-4px)
- box-shadow: shadow-lg

**Transition:**
- duration: 0.3s
- easing: cubic-bezier(0.22, 1, 0.36, 1)

### 7.4. Toggle/Switch Interactions

**Animation:**
- Spring animation (stiffness: 300, damping: 30)
- Color transition: 0.2s ease

### 7.5. Toast Notifications

**Animation:**
- Enter: slide from right + fade in + scale(0.95 → 1)
- Exit: slide to right + fade out
- Spring physics cho enter

### 7.6. Modal Animations

**Animation:**
- Backdrop: fade in (opacity 0 → 0.5)
- Content: scale(0.95 → 1) + fade in
- duration: 0.3s
- easing: cubic-bezier(0.22, 1, 0.36, 1)

### 7.7. Ước tính thời gian: 1.5 giờ

---

## PHASE 8: MAP ENHANCEMENT

### 8.1. Mục tiêu
Nâng cấp trải nghiệm bản đồ lên ngang hàng Google Maps.

### 8.2. Tính năng mới

**8.2.1. Search bar trên bản đồ:**
- Vị trí: Top center của map container
- Chức năng: Tìm kiếm tỉnh/thành phố, zoom đến vị trí
- UI: Input với icon search, dropdown suggestions

**8.2.2. Compass indicator:**
- Vị trí: Top right, dưới tile toggle
- Chức năng: Hiển thị hướng bắc, click để reset rotation
- UI: Icon compass nhỏ

**8.2.3. Scale bar:**
- Vị trí: Bottom left
- Chức năng: Hiển thị tỷ lệ km
- UI: Line với numbers

**8.2.4. Current location button:**
- Vị trí: Right center
- Chức năng: Zoom đến vị trí hiện tại (GPS)
- UI: Icon crosshair

**8.2.5. Fullscreen toggle:**
- Vị trí: Top right
- Chức năng: Toàn màn hình
- UI: Icon expand

### 8.3. Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/features/map-disaster/ui/MapControls.tsx` | Thêm search, compass, scale, location, fullscreen |
| `src/features/map-disaster/ui/DisasterMap.tsx` | Tích hợp controls mới |

### 8.4. Ước tính thời gian: 3 giờ

---

## PHASE 9: DATA SOURCES NÂNG CẤP

### 9.1. Mục tiêu
Thêm dữ liệu từ các nguồn mới để CứuNet chính xác và đầy đủ hơn.

### 9.2. APIs mới nên tích hợp

| API | Mục đích | Miễn phí? | Ưu tiên |
|-----|----------|-----------|---------|
| **OpenWeatherMap** | Thời tiết chi tiết, forecasts | Free tier 1000/day | HIGH |
| **NASA FIRMS** | Phát hiện cháy rừng real-time | Miễn phí | HIGH |
| **AirVisual** | Chất lượng không khí | Free tier | MEDIUM |
| **Vietnam Weather API** | Dự báo chính thức VN | Miễn phí | MEDIUM |
| **Sentinel Hub** | Ảnh vệ tinh ESA | Free tier | LOW |
| **Mapbox** | Custom map styles | Free tier | LOW |

### 9.3. Dữ liệu Việt Nam cần bổ sung

**9.3.1. Dân số theo tỉnh:**
- Nguồn: Tổng cục Thống kê (GSO)
- Dùng cho: Tính exposure score trong risk calculation

**9.3.2. Cơ sở hạ tầng:**
- Nguồn: Bộ Giao thông Vận tải
- Dùng cho: Tính accessibility score trong dispatch

**9.3.3. Lịch sử thiên tai chi tiết:**
- Nguồn: EM-DAT + VNDMA
- Dùng cho: Training AI model, historical analysis

**9.3.4. Dữ liệu thủy văn:**
- Nguồn: Trung tâm Khí tượng Thủy văn Quốc gia
- Dùng cho: Dự báo lũ lụt chính xác hơn

### 9.4. Ước tính thời gian: 4 giờ

---

## PHASE 10: LOADING STATES & SKELETON

### 10.1. Mục tiêu
Thêm skeleton loading states cho tất cả components để UX mượt mà hơn.

### 10.2. Components cần skeleton

| Component | Skeleton Type |
|-----------|--------------|
| Map Container | Rectangle với shimmer |
| StatsBar | 6 cards nhỏ với shimmer |
| Alert Feed | 5 rows với shimmer |
| Province List | 10 rows với shimmer |
| Chart Container | Rectangle với shimmer |
| Card Grid | Grid với shimmer cards |

### 10.3. Animation cho Skeleton

- Background: gradient shimmer (trái sang phải)
- Duration: 1.5s
- Repeat: infinite
- Easing: linear

### 10.4. Ước tính thời gian: 1.5 giờ

---

## PHASE 11: MOBILE UX OPTIMIZATION

### 11.1. Mục tiêu
Tối ưu trải nghiệm trên điện thoại di động.

### 11.2. Cải thiện

**11.2.1. Bottom Navigation:**
- Thêm bottom nav bar cho mobile (ẩn trên desktop)
- Items: Home, Map, Alerts, SOS, More
- Active state: icon + label highlight

**11.2.2. Touch targets:**
- Đảm bảo tất cả buttons >= 44px
- Tăng spacing giữa các elements

**11.2.3. Swipe gestures:**
- Swipe left/right để chuyển tabs
- Pull to refresh cho feeds

**11.2.4. Responsive typography:**
- Font size nhỏ hơn trên mobile
- Line height tăng cho readability

### 11.3. Ước tính thời gian: 3 giờ

---

## PHASE 12: PWA & OFFLINE SUPPORT

### 12.1. Mục tiêu
Biến CứuNet thành Progressive Web App có thể cài đặt trên điện thoại.

### 12.2. Tính năng

**12.2.1. Install prompt:**
- Hiển thị "Thêm vào màn hình chính" sau 3 lần truy cập
- Custom install banner với logo CứuNet

**12.2.2. Offline support:**
- Cache static assets (CSS, JS, images)
- Cache API responses (stale-while-revalidate)
- Offline fallback page

**12.2.3. Background sync:**
- SOS offline queue (đã có) — cần cải thiện
- Sync khi có mạng trở lại

**12.2.4. Push notifications:**
- Browser push cho alerts quan trọng
- Notification sound tùy chỉnh

### 12.3. Ước tính thời gian: 4 giờ

---

# PHẦN V — TỔNG KẾT

## 5.1. Files cần thay đổi (Tổng cộng)

| Phase | Files | Thời gian |
|-------|-------|-----------|
| 1. Fix bản đồ | 6 files | 30 min |
| 2. Brightness | 2 files | 1 giờ |
| 3. Intro sections | 8 files | 2 giờ |
| 4. Giảm tabs | 3 files | 1.5 giờ |
| 5. Scroll animations | 8+ files | 1.5 giờ |
| 6. Color system | 2 files | 1 giờ |
| 7. Micro-interactions | 5+ files | 1.5 giờ |
| 8. Map enhancement | 2 files | 3 giờ |
| 9. Data sources | 4+ files | 4 giờ |
| 10. Loading states | 6+ files | 1.5 giờ |
| 11. Mobile UX | 3+ files | 3 giờ |
| 12. PWA | 3+ files | 4 giờ |
| **Tổng** | **50+ files** | **~28 giờ** |

## 5.2. Ưu tiên triển khai

| Priority | Phase | Lý do |
|----------|-------|-------|
| **P0** | 1. Fix bản đồ | Bản đồ tối đen — không sử dụng được |
| **P0** | 2. Brightness | Ảnh hưởng toàn bộ UX |
| **P0** | 3. Intro sections | Người dùng không biết sử dụng |
| **P1** | 4. Giảm tabs | UX rối mắt |
| **P1** | 5. Scroll animations | Thiếu mượt mà |
| **P1** | 6. Color system | Thiếu thống nhất |
| **P1** | 7. Micro-interactions | Thiếu professional |
| **P2** | 8. Map enhancement | Nice to have |
| **P2** | 9. Data sources | Cần thời gian tích hợp |
| **P2** | 10. Loading states | UX improvement |
| **P3** | 11. Mobile UX | Cần test kỹ |
| **P3** | 12. PWA | Nice to have |

## 5.3. Metrics thành công

| Metric | Hiện tại | Mục tiêu |
|--------|----------|----------|
| Lighthouse Performance | ~70 | > 90 |
| Lighthouse Accessibility | ~80 | > 95 |
| Mobile-friendly | Partial | 100% |
| Map usability | Poor | Excellent |
| User onboarding | None | Complete |
| Animation smoothness | Average | Excellent |

## 5.4. Tham khảo quốc tế

| Nguồn | URL | Áp dụng |
|-------|-----|---------|
| GDACS | gdacs.org | Dashboard layout |
| ReliefWeb | reliefweb.int | Filter system |
| NASA FIRMS | firms.modaps.eosdis.nasa.gov | Map features |
| Japan Bousai | bousai.go.jp | Education gamification |
| Linear.app | linear.app | Animation patterns |
| Stripe.com | stripe.com | Gradient effects |
| Vercel.com | vercel.com | Dark theme design |
| Apple Maps | maps.apple.com | Map UX |
| Google Maps | maps.google.com | Map features |

---

**Kế hoạch này được tạo dựa trên:**
- Phân tích toàn bộ source code (40,000+ lines)
- Đọc skills: nextjs-styling, common-ui-design
- Nghiên cứu 10+ phần mềm hàng đầu thế giới
- Tham khảo 5+ ứng dụng thiên tai quốc tế
- Dữ liệu Việt Nam từ 4+ nguồn chính thức

**Hãy "toggle to Act mode" để bắt đầu triển khai từ Phase 1.**