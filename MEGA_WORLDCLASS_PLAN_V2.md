# 🌍 MEGA WORLD-CLASS MASTER PLAN V2 — CứuNet 2026

> **Phiên bản:** 2.0  
> **Ngày:** 24/05/2026  
> **Mục tiêu:** Biến CứuNet thành nền tảng quản lý thiên tai #1 Đông Nam Á — đẳng cấp thế giới  
> **Loại tài liệu:** MASTER PLAN — Yêu cầu & Khảo sát thuần túy, không chứa code

---

## PHẦN I — TỔNG QUAN VẤN ĐỀ HIỆN TẠI

### 1.1. Phân tích vấn đề màu sắc (CRITICAL)

**Tình trạng hiện tại:**
- Hero section dùng nền đen đậm (#0c1222) tạo cảm giác "tối tăm, nặng nề"
- Body trang dùng nền sáng (#f8fafc) nhưng các card lại dùng glass-card tối → MẤT THỐNG NHẤT
- Gradient neon: blue-400 → cyan-400 → purple-400 quá CHÓI, tạo cảm giác "game" chứ không phải website thiên tai
- Badge severity dùng rgba mờ trên nền sáng → Nhìn "giả", không chuyên nghiệp
- Cross-links section ở cuối mỗi trang dùng bg-slate-900/40 trên nền light → LẠC LÕẼ hoàn toàn
- Alert page header dùng bg-slate-950/80 (gần đen) trong khi body là light → CONTRAST GÂY MỎI MẮT
- Predict page toàn bộ sidebar dùng glass-card tối trên nền sáng → NHÌN NHƯ 2 APP KHÁC NHAU

**Yêu cầu mới:**
- Website về thiên tai, phòng tránh và giáo dục → PHẢI SÁNG SỦA, TIN CẬY, CHUYÊN NGHIỆP
- Màu chủ đạo: Xanh dương đậm (#0066FF) thể hiện SỰ TIN CẬY + TECHNOLOGY
- Màu phụ: Teal (#00C9A7) thể hiện SỰ AN TOÀN + HY VỌNG
- Màu cảnh báo: Cam đỏ tinh tế (không phải neon chói)
- NỀN TOÀN BỘ TRANG: Light theme thống nhất — trắng ngà, xám nhạt
- BỎ HOÀN TOÀN dark backgrounds trên tất cả trang con
- Cho phép 1 chút "huyền bí" ở Hero section: gradient xanh dương ĐẬM sang xanh nhạt, KHÔNG phải đen

---

### 1.2. Phân tích vấn đề bố cục (CRITICAL)

**Tình trạng trang chủ hiện tại — QUÁ NHIỀU SECTIONS:**
1. Live Ticker (banner chạy chữ đỏ)
2. Hero Section (chiếm 100vh — QUÁ LỚN)
3. How It Works — FlowTimeline
4. 7 Module Cards — Bento Grid
5. 3D Globe Visualization
6. Live Stats
7. Impact Showcase
8. Weather Widget
9. Interactive Timeline
10. CTA Section

→ Tổng cộng 10 SECTIONS → Người dùng phải scroll MÃI mới hết
→ Không có hierarchy rõ ràng → MẤT TẬP TRUNG
→ Quá tải thông tin → USER BỊ RỐI
→ Hero chiếm quá nhiều không gian → Nội dung thực sự bị đẩy xuống

**Tình trạng các trang con:**
- Map page: Intro section + Stats bar + Map + Timeline + Cross-links → Tạm ổn nhưng cross-links xấu
- Predict page: Intro + Stats + Sidebar 3 cột + Main content + Rankings + External alerts → QUÁ NHIỀU, sidebar dài
- Dashboard page: Intro + Header tabs + Filter + 4 views + Cross-links → RỐI, quá nhiều tab
- Education page: Intro + Header 6 tabs + Content + Cross-links → 6 tabs cùng lúc → RỐI
- Alerts page: Intro + Header 7 tabs + Stats + Content + Modal + Toast + Offline banner → OVERLOAD
- Rescue page: Chưa đọc chi tiết nhưng dự đoán cũng tương tự
- Report page: Chưa đọc chi tiết

**Yêu cầu mới:**
- GIẢM số sections trang chủ: TỐI ĐA 5-6 sections
- Hero COMPACT: Chiếm tối đa 60vh
- Mỗi trang con: TỐI ĐA 3-4 tab chính (ẩn次要 vào dropdown)
- Sidebar: Thu gọn, dùng accordion/collapse
- Cross-links: BỎ hoàn toàn hoặc đưa vào footer
- Tạo VISUAL HIERARCHY rõ ràng: Title lớn → Subtitle → Content → CTA

---

### 1.3. Phân tích vấn đề dữ liệu (CRITICAL)

**Tình trạng dữ liệu hiện tại:**
- `disaster-data.ts`: 22 sự kiện, trong đó:
  - 12 sự kiện từ 2024 (CŨ)
  - 5 sự kiện từ 2025
  - 5 sự kiện từ 2026 (mới nhất: 24/05/2026)
- `sos-alerts.ts`: 6 SOS alerts, TOÀN BỘ từ 2024 → CŨ HOÀN TOÀN
- Dashboard: Dữ liệu yearly stats chỉ đến 2024
- Không có dữ liệu thiên tai THẾ GIỚI
- Weather widget: Dùng mock data hoặc API không ổn định
- Predict page: Dùng dữ liệu tính toán nội bộ, không có dữ liệu thực

**Yêu cầu mới:**
- Dữ liệu Việt Nam: PHẢI cập nhật đến ít nhất 23/05/2026
- Dữ liệu thế giới: PHẢI có ít nhất 50 sự kiện thiên tai lớn toàn cầu
- Tích hợp API real-time: Open-Meteo (thời tiết), USGS (động đất), ReliefWeb (alerts)
- SOS alerts: Cập nhật theo thời gian thực hoặc ít nhất có dữ liệu 2026
- Dashboard: Mở rộng dữ liệu đến 2026
- Thêm DATA SOURCE INDICATORS: Hiển thị nguồn dữ liệu và thời gian cập nhật

---

### 1.4. Phân tích vấn đề Animation & 3D (HIGH)

**Tình trạng hiện tại:**
- Globe 3D: Chỉ có globe.gl cơ bản, xoay vô hồn, markers tĩnh
- Map: Leaflet cơ bản, không có animation đặc biệt
- Animations: Chỉ có fade-up, fade-in, scale-in → QUÁ ĐƠN GIẢN
- Micro-interactions: Có cursor glow, scroll progress, typewriter → TẠM ĐƯỢC nhưng chưa đủ
- Không có PARALLAX EFFECT
- Không có PAGE TRANSITIONS
- Không có INTERACTIVE DATA VISUALIZATION
- Không có PARTICLE EFFECTS ngoài Hero
- Không có SOUND/HAPTIC FEEDBACK

**Yêu cầu mới — WORLD-CLASS INTERACTIONS:**

**A. Mô hình 3D tương tác (không chỉ bản đồ):**
- Globe 3D nâng cấp: Markers animate, click để zoom, weather layers, real-time data overlay
- Disaster Simulation 3D: Mô phỏng lũ lụt, bão, sạt lở bằng 3D terrain
- Building/Structure 3D: Mô hình nhà chống bão, hệ thống thoát nước — cho Education
- Cross-section 3D: Cắt ngang địa chất để hiểu sạt lở, động đất
- Timeline 3D: Trục thời gian 3D, kéo để xem sự kiện theo năm

**B. Mô hình 5D/7D/9D:**
- 5D = 3D + Time + Data: Globe xoay + timeline slider + dữ liệu thay đổi theo thời gian
- 7D = 5D + Weather + Interaction: Thêm layer thời tiết + user tương tác trực tiếp
- 9D = 7D + Sound + Haptic + AR: Thêm âm thanh + phản hồi rung + AR overlay

**C. Animation đẳng cấp:**
- Page transitions: Morphing, slide, fade giữa các trang
- Scroll-triggered animations: Parallax, reveal, counter, progress
- Hover effects: Card lift, glow, morph, particle burst
- Loading animations: Skeleton, progress ring, spinner custom
- Data animations: Animated charts, real-time counters, flow visualization
- Cursor effects: Custom cursor theo context, trail effect, magnetic hover

---

### 1.5. Phân tích vấn đề tính năng (HIGH)

**Tính năng hiện tại — Đánh giá:**

| Module | Trạng thái | Vấn đề | Đề xuất |
|--------|-----------|--------|---------|
| Bản đồ | Tốt | Leaflet cơ bản, thiếu 3D terrain | Nâng cấp lên Mapbox GL hoặc Deck.gl |
| AI Dự đoán | Khá | Dùng mock engine, không có model thực | Tích hợp TensorFlow.js LSTM thực |
| Báo cáo | Trung bình | Form cơ bản | Thêm ảnh/video, xác minh AI, map integration |
| Cảnh báo/SOS | Khá | Quá nhiều tab, rối | Đơn giản hóa, focus SOS |
| Cứu trợ | Khá | Chưa đọc chi tiết | Cần đánh giá thêm |
| Dashboard | Khá | 4 views quá nhiều | Giảm xuống 2-3 views |
| Giáo dục | Khá | 6 tabs quá nhiều | Giảm xuống 3-4 tabs |

**Tính năng MỚI cần thêm:**

1. **AI Chatbot Trợ lý Thiên tai:**
   - Trả lời câu hỏi về thiên tai
   - Gợi ý hành động phòng tránh
   - Hỗ trợ đa ngôn ngữ
   - Tích hợp vào mọi trang

2. **Hệ thống thông báo Push:**
   - Push notification cho cảnh báo
   - Email alerts
   - SMS integration (cho SOS)

3. **Đa ngôn ngữ:**
   - Vietnamese (chính)
   - English (phụ)
   - Chuẩn bị cho mở rộng quốc tế

4. **Dark/Light Mode Toggle:**
   - Mặc định: Light mode
   - Cho phép chuyển sang dark mode
   - Lưu preference vào localStorage

5. **Command Palette (Ctrl+K):**
   - Tìm kiếm nhanh toàn bộ tính năng
   - Điều hướng nhanh
   - Tham khảo: Vercel, Linear, Raycast

6. **Offline Mode nâng cấp:**
   - Service Worker caching
   - Offline data access
   - Background sync khi có mạng

7. **Accessibility (a11y):**
   - WCAG 2.1 AA compliance
   - Screen reader support
   - Keyboard navigation
   - High contrast mode

---

## PHẦN II — THIẾT KẾ HỆ THỐNG MỚI

### 2.1. Color Palette mới

**Brand Colors:**
- Primary: #0066FF (Bright Blue) — Điểm nhấn chính, nút bấm, link
- Secondary: #00C9A7 (Teal) — Điểm nhấn phụ, trạng thái tích cực
- Accent: #FF6B6B (Coral) — SOS, cảnh báo khẩn cấp
- Warning: #FFB800 (Gold) — Cảnh báo mức trung bình
- Success: #00D68F (Green) — Thành công, an toàn
- Error: #FF4757 (Red) — Lỗi, nguy hiểm

**Neutral Colors:**
- 50: #F8FAFC — Background chính
- 100: #F1F5F9 — Background secondary
- 200: #E2E8F0 — Border nhẹ
- 300: #CBD5E1 — Border trung bình
- 400: #94A3B8 — Text muted
- 500: #64748B — Text secondary
- 600: #475569 — Text primary trên nền sáng
- 700: #334155 — Text emphasis
- 800: #1E293B — Text trên nền tối
- 900: #0F172A — Text trên nền rất tối

**Gradients:**
- Hero: linear-gradient(135deg, #0A1628 0%, #1E3A5F 40%, #2D5986 100%) — Xanh dương ĐẬM, không đen
- Brand: linear-gradient(135deg, #0066FF 0%, #00C9A7 100%)
- Card Hover: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)
- Glass: rgba(255, 255, 255, 0.8) với backdrop-blur

**Áp dụng cho từng trang:**
- Trang chủ Hero: Gradient xanh dương đậm (KHÔNG phải đen) với subtle particles
- Trang chủ Body: #F8FAFC (light)
- Tất cả trang con: #F8FAFC nền, white cards, brand accent
- Alert/SOS: Coral accent cho nút SOS, badges severity
- Predict: Purple accent cho AI, blue cho data
- Dashboard: Cyan accent cho charts
- Education: Green accent cho learning
- Map: Blue accent cho markers

---

### 2.2. Typography mới

**Font families:**
- Heading: Space Grotesk (hiện có) — Bold, modern, tech-forward
- Body: Inter (hiện có) — Clean, readable, professional
- Mono: JetBrains Mono — Cho code/data display

**Type scale:**
- Display: 60px — Hero title duy nhất
- H1: 48px — Page title
- H2: 36px — Section title
- H3: 24px — Subsection
- H4: 20px — Card title
- Body Large: 18px — Intro text
- Body: 16px — Content chính
- Body Small: 14px — Secondary content
- Caption: 12px — Labels, badges
- Micro: 10px — Timestamps, metadata

**Font weights:**
- Black (900): Hero title, counters
- Bold (700): Section titles, emphasis
- Semibold (600): Card titles, buttons
- Medium (500): Navigation, labels
- Regular (400): Body text
- Light (300): Subtitles, descriptions

---

### 2.3. Spacing & Layout mới

**Spacing system (8px base):**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px
- 4xl: 96px
- 5xl: 128px

**Border radius:**
- sm: 6px — Badges, small elements
- md: 10px — Buttons, inputs
- lg: 16px — Cards
- xl: 24px — Large cards, modals
- full: 9999px — Pills, avatars

**Shadows:**
- sm: 0 1px 2px rgba(0,0,0,0.05) — Subtle
- md: 0 4px 12px rgba(0,0,0,0.08) — Cards
- lg: 0 8px 24px rgba(0,0,0,0.12) — Elevated cards
- xl: 0 16px 48px rgba(0,0,0,0.16) — Modals
- brand: 0 4px 16px rgba(0,102,255,0.15) — Brand glow

**Max widths:**
- Content: 1280px (max-w-7xl)
- Text: 768px (max-w-3xl)
- Narrow: 640px (max-w-xl)

---

### 2.4. Component Design mới

**Cards:**
- Background: White (#FFFFFF)
- Border: 1px solid #E2E8F0
- Border radius: 16px
- Shadow: sm → md on hover
- Hover: translateY(-2px) + shadow increase + border color change
- KHÔNG dùng glass-card dark nữa

**Buttons:**
- Primary: bg #0066FF, text white, rounded-xl, shadow-brand
- Secondary: bg transparent, border #E2E8F0, text #475569
- Danger/SOS: bg #FF6B6B, text white, rounded-xl
- Ghost: bg transparent, text #475569, hover bg #F1F5F9
- Sizes: sm (32px), md (40px), lg (48px)

**Navigation:**
- Navbar: White background, shadow-md, sticky top
- Active indicator: Bottom border hoặc background accent
- Mobile: Bottom navigation bar
- KHÔNG dùng dark navbar

**Forms:**
- Input: White bg, border #E2E8F0, rounded-lg, focus ring brand
- Select: Custom dropdown với search
- Checkbox/Radio: Custom styled
- Textarea: Auto-resize

---

## PHẦN III — CẤU TRÚC TRANG CHỦ MỚI

### 3.1. Hero Section (Compact — 55vh)

**Bố cục:**
- Background: Gradient xanh dương đậm (#0A1628 → #2D5986) với subtle animated particles
- Badge: "Đang giám sát 63 tỉnh thành" với pulse dot xanh lá
- Title: "CứuNet" lớn (72-96px) với gradient text
- Subtitle: "Nền tảng Quản lý Thiên tai Thông minh" — typewriter effect
- Description: 1 dòng mô tả ngắn
- 3 CTAs: "Xem Bản đồ" (primary) | "SOS Khẩn cấp" (danger) | "Gửi Báo cáo" (secondary)
- Stats row: 4 ô counter nhỏ (63 tỉnh | 24/7 giám sát | 6 loại thiên tai | 7 modules)
- Scroll indicator: Chevron down với bounce animation

**KHÔNG có:** Activity card bên phải (loại bỏ, quá rối)

---

### 3.2. Live Alert Banner (Compact)

**Bố cục:**
- Banner chạy chữ ngay dưới Hero
- Nền: Nhẹ nhàng (gradient xanh nhạt hoặc trắng)
- Icon: Radio pulse + "LIVE"
- Nội dung: 3-5 alert mới nhất
- KHÔNG dùng nền đỏ đậm như hiện tại

---

### 3.3. Quick Access Dashboard (MỚI)

**Bố cục:**
- Chia 2 cột trên desktop, 1 cột trên mobile
- Cột TRÁI (60%): Mini interactive map với markers real-time (350px height)
- Cột PHẢI (40%): 
  - Weather widget hiện tại
  - 3 alert mới nhất (compact cards)
  - Quick action buttons

---

### 3.4. 7 Modules Grid (Compact)

**Bố cục:**
- Grid 4 cột trên desktop, 2 cột trên tablet, 1 cột trên mobile
- Mỗi card: Icon (24px) + Title + 1 dòng description + Stat badge
- KHÔNG có featured card (tất cả bình đẳng)
- Hover: Lift + glow nhẹ
- Click: Navigate đến trang tương ứng

---

### 3.5. Impact Numbers (Compact)

**Bố cục:**
- Background: Nhẹ nhàng (#F1F5F9 hoặc gradient nhẹ)
- 4 ô counter lớn: Tỉnh thành | Sự kiện | Người ảnh hưởng | Modules
- Animated counting khi scroll vào view
- KHÔNG cần section riêng — có thể merge vào hero hoặc modules

---

### 3.6. Trust/Partner Section (Compact)

**Bố cục:**
- Logo carousel hoặc grid: UNICEF, Red Cross, VNDMA, etc.
- Hoặc: "Được xây dựng dựa trên chuẩn quốc tế"
- KHÔNG cần quá dài

---

## PHẦN IV — CẤU TRÚC CÁC TRANG CON MỚI

### 4.1. Trang Bản đồ (/map)

**Hiện tại:** Intro + Stats + Map + Timeline + Cross-links  
**Mới:**
- BỎ IntroSection (dùng page header compact thay thế)
- Stats bar: Thu gọn thành 1 hàng, chỉ hiện 3-4 metrics chính
- Map: Giữ nguyên nhưng nâng cấp UI controls
- Timeline: Giữ nguyên
- BỎ Cross-links
- THÊM: Side panel trượt ra khi click marker (không phải popup)

---

### 4.2. Trang AI Dự đoán (/predict)

**Hiện tại:** Intro + Stats + Sidebar 3 cột (Province/Month/Scenario) + Main content (3 tabs) + Rankings + External alerts  
**Mới:**
- BỎ IntroSection
- Stats bar: Thu gọn
- Sidebar: Thu gọn, dùng accordion/collapse cho Province/Month/Scenario
- Main content: Giữ 3 tabs (Map/Charts/Calendar)
- Rankings: Đưa vào sidebar dưới dạng collapsible
- External alerts: Đưa vào sidebar dưới dạng collapsible
- THÊM: AI confidence indicator
- THÊM: Export prediction report

---

### 4.3. Trang Dashboard (/dashboard)

**Hiện tại:** Intro + Header 4 tabs + Filter + Content + Cross-links  
**Mới:**
- BỎ IntroSection
- Header: Thu gọn, chỉ 3 tabs (Executive | Analytical | Strategic)
- BỎ Operational tab (merge vào Executive)
- Filter: Compact, 1 hàng
- Content: Giữ nguyên nhưng light theme
- BỎ Cross-links
- THÊM: Export PDF
- THÊM: Custom dashboard layout (drag & drop widgets)

---

### 4.4. Trang Giáo dục (/education)

**Hiện tại:** Intro + Header 6 tabs + Content + Cross-links  
**Mới:**
- BỎ IntroSection
- Header: Giảm xuống 4 tabs (Khóa học | Kịch bản | Thực hành | Tiến độ)
- BỎ tab "Quiz" riêng (merge vào khóa học)
- BỎ tab "Info" (đưa vào footer hoặc modal)
- Content: Light theme
- BỎ Cross-links
- THÊM: Learning path visualization (roadmap)
- THÊM: Daily challenge

---

### 4.5. Trang Cảnh báo & SOS (/alerts)

**Hiện tại:** Intro + Header 7 tabs + Stats + Content + Modal + Toast + Offline  
**Mới:**
- BỎ IntroSection
- Header: Giảm xuống 4 tabs (Tổng quan | Cảnh báo | SOS | Danh bạ)
- BỎ Checklist tab (đưa vào Education)
- BỎ History tab (merge vào Tổng quan)
- Stats bar: Thu gọn
- SOS: NÚT LỚN NỔI BẬT ở header
- Content: Light theme
- THÊM: Real-time alert sound
- THÊM: Alert severity filter nhanh

---

### 4.6. Trang Cứu trợ (/rescue)

**Nâng cấp:**
- Light theme thống nhất
- Operations map nâng cấp
- Resource management dashboard
- Team coordination interface
- Status timeline

---

### 4.7. Trang Báo cáo (/report)

**Nâng cấp:**
- Light theme thống nhất
- Multi-step form (wizard)
- Upload ảnh/video
- Map picker cho location
- AI verification indicator
- Report status tracking

---

## PHẦN V — 3D, 5D, 7D, 9D MODELS

### 5.1. Mô hình 3D hiện có & nâng cấp

**Globe 3D (hiện có — globe.gl):**
- Nâng cấp: Thêm weather layers, real-time markers, click interaction
- Animation: Auto-rotate, zoom on click, marker pulse
- Data overlay: Disaster heatmap, population density, risk zones

**Bản đồ 3D (MỚI):**
- 3D terrain map (Mapbox GL hoặc Deck.gl)
- Elevation data cho Việt Nam
- Flood simulation trên terrain
- Building extrusion cho đô thị

---

### 5.2. Mô hình 5D (3D + Time + Data)

**Disaster Timeline 3D:**
- Globe 3D + Timeline slider bên dưới
- Kéo timeline → Globe hiển thị sự kiện theo thời gian
- Markers animate xuất hiện/mất dần
- Data panel bên cạnh cập nhật theo thời gian

**Flood Simulation 5D:**
- 3D terrain + Time slider + Water level data
- Kéo time → Nước dâng dần trên terrain
- Hiển thị vùng ngập theo thời gian thực
- Overlay: Dân số ảnh hưởng, thiệt hại ước tính

---

### 5.3. Mô hình 7D (5D + Weather + Interaction)

**Weather-Disaster Correlation 7D:**
- 3D terrain + Timeline + Weather data layers
- User tương tác: Click vào vùng → Xem chi tiết
- Weather layers: Mưa, gió, nhiệt độ, độ ẩm
- Correlation visualization: Mưa → Lũ → Sạt lở

**Interactive Risk Assessment 7D:**
- 3D map + Province selection + Risk calculation
- User chọn tỉnh → Hiển thị risk profile 3D
- Overlay: Population, infrastructure, historical data
- Scenario simulation: El Niño, La Niña, Climate change

---

### 5.4. Mô hình 9D (7D + Sound + Haptic + AR)

**Immersive Disaster Experience 9D:**
- 3D environment + Full sensory simulation
- Sound: Tiếng mưa, gió, sóng, cảnh báo
- Haptic: Rung khi có cảnh báo (nếu thiết bị hỗ trợ)
- AR: Camera overlay hiển thị risk zones khi đi thực tế
- VR-ready: Chuẩn bị cho VR headset

**AR Safety Check 9D (MỚI):**
- Mobile camera → Quét môi trường xung quanh
- AR overlay: Hiển thị evacuation routes, safe zones
- Voice guidance: Hướng dẫn bằng giọng nói
- Haptic feedback: Rung khi gần danger zone

---

### 5.5. Mô hình TƯƠNG TÁC ĐỘC ĐÁO khác

**A. Disaster Flow Diagram (Tương tác):**
- Flowchart 3D: Giám sát → Dự đoán → Cảnh báo → Cứu hộ → Phân tích
- User click mỗi bước → Zoom vào chi tiết
- Animation: Data flow giữa các bước
- Particle effects: Data streams

**B. Risk Heatmap Globe (Tương tác):**
- Globe với heatmap gradient theo risk level
- Rotate → Heatmap thay đổi theo góc nhìn
- Click country → Drill down vào chi tiết
- Compare mode: So sánh 2 quốc gia

**C. Resource Flow Sankey (Tương tác):**
- Sankey diagram 3D: Nguồn lực cứu trợ flow
- Từ: Quân đội, NGO, Chính phủ → Đến: Tỉnh, huyện, xã
- Tương tác: Click vào flow → Xem chi tiết
- Animation: Flow animate liên tục

**D. Population Impact Bubble Chart (Tương tác):**
- 3D bubble chart: Mỗi bubble = 1 sự kiện
- Size = Số người ảnh hưởng
- Color = Severity
- Position = Location
- Click → Xem chi tiết
- Time animation: Bubbles xuất hiện theo thời gian

**E. Evacuation Route Simulator (Tương tác):**
- 3D city map + Evacuation routes
- User chọn điểm bắt đầu → AI tính route an toàn nhất
- Animation: People flow along route
- Time estimate: Thời gian di chuyển

---

## PHẦN VI — ANIMATION WORLD-CLASS

### 6.1. Page Transitions

**Yêu cầu:**
- Slide transition: Khi navigate giữa các trang
- Morph transition: Element morph từ trang này sang trang kia
- Fade + Scale: Content fade in với scale nhẹ
- Loading indicator: Progress bar hoặc skeleton

**Tham khảo:**
- Apple.com: Smooth page transitions
- Stripe.com: Gradient morph transitions
- Linear.app: Slide + fade transitions

---

### 6.2. Scroll Animations

**Yêu cầu:**
- Parallax: Background và foreground di chuyển khác tốc độ
- Reveal: Content fade-in khi scroll vào view
- Stagger: Items xuất hiện lần lượt
- Counter: Numbers animate từ 0 đến giá trị
- Progress: Progress bar animate theo scroll

**Tham khảo:**
- Awwwards.com: Scroll-triggered animations
- Locomotive Scroll: Smooth scroll library
- GSAP ScrollTrigger: Professional scroll animations

---

### 6.3. Hover Effects

**Yêu cầu:**
- Card lift: translateY(-4px) + shadow increase
- Glow: Box-shadow brand color nhẹ
- Border animate: Border color change
- Icon scale: Icon scale(1.1) + rotate(3deg)
- Magnetic: Element "hút" cursor khi đến gần
- Particle burst: Particles tỏa ra khi hover

**Tham khảo:**
- Stripe.com: Card hover effects
- Vercel.com: Button hover effects
- Linear.app: Subtle hover transitions

---

### 6.4. Loading Animations

**Yêu cầu:**
- Skeleton: Pulse animation cho content loading
- Progress ring: Circular progress cho actions
- Spinner custom: Brand-styled spinner
- Shimmer: Gradient shimmer effect
- Typewriter: Text type-in effect

---

### 6.5. Data Animations

**Yêu cầu:**
- Chart animate: Charts animate khi xuất hiện
- Counter: Numbers count up
- Flow: Data flow animation (particles di chuyển)
- Gauge: Gauge needle animate
- Timeline: Events animate theo thời gian

---

### 6.6. Cursor Effects

**Yêu cầu:**
- Custom cursor: Thay đổi theo context (default, pointer, text, map)
- Cursor glow: Glow effect theo cursor
- Trail effect: Cursor để lại trail
- Magnetic hover: Elements "hút" cursor
- Ripple: Ripple effect khi click

---

### 6.7. Micro-interactions

**Yêu cầu:**
- Button press: scale(0.97) + brightness(0.9)
- Toggle: Spring animation
- Toast slide-in: Từ phải vào
- Modal scale-in: Scale từ 0.95 lên 1
- Tab indicator: Underline animate
- Badge pulse: Pulse animation cho live indicators
- Number glow: Text-shadow glow khi hover

---

## PHẦN VII — DỮ LIỆU CẦN CẬP NHẬT

### 7.1. Dữ liệu Việt Nam

**Thiên tai 2026 cần thêm (ước tính):**
- Bão/ATNĐ mùa 2026 (tháng 5-11)
- Lũ lụt miền Bắc tháng 5/2026
- Sạt lở Sơn La tháng 5/2026
- Hạn hán Tây Nguyên tháng 2-5/2026
- Nắng nóng kỷ lục miền Bắc tháng 5/2026

**SOS alerts 2026:**
- Cập nhật SOS alerts mới nhất
- Đảm bảo dữ liệu đến 23/05/2026

**Dashboard stats:**
- Mở rộng yearly data đến 2026
- Cập nhật province data

---

### 7.2. Dữ liệu Thế giới

**Cần thêm:**
- Động đất lớn 2025-2026 (Thổ Nhĩ Kỳ, Nhật Bản, etc.)
- Bão lớn (Atlantic, Pacific)
- Lũ lụt (Pakistan, Libya, Brazil)
- Hạn hán (Châu Phi, Ấn Độ)
- Sóng thần cảnh báo
- núi lửa phun trào

**Nguồn dữ liệu:**
- ReliefWeb (reliefweb.int)
- GDACS (gdacs.org)
- USGS (earthquake.usgs.gov)
- EM-DAT (emdat.be)
- NOAA (noaa.gov)

---

### 7.3. Real-time APIs cần tích hợp

1. **Open-Meteo** — Thời tiết real-time cho 63 tỉnh
2. **USGS Earthquake API** — Động đất thế giới real-time
3. **ReliefWeb API** — Alerts thiên tai toàn cầu
4. **GDACS RSS** — Cảnh báo thiên tai toàn cầu
5. **VNĐMA API** — Cảnh báo thiên tai Việt Nam (nếu có)
6. **OpenWeatherMap** — Thời tiết chi tiết (backup)

---

## PHẦN VIII — TÍNH NĂNG MỚI ĐỀ XUẤT

### 8.1. AI Chatbot Trợ lý Thiên tai (NEW)

**Mô tả:**
- Chat interface ở góc phải màn hình
- Trả lời câu hỏi: "Bão đang ở đâu?", "Tôi nên làm gì khi lũ?", etc.
- Gợi ý hành động dựa trên vị trí và tình hình
- Đa ngôn ngữ: Vietnamese + English
- Học từ dữ liệu CứuNet
- Tích hợp vào mọi trang

**Tham khảo:**
- ChatGPT interface
- Intercom widget
- Drift chatbot

---

### 8.2. Command Palette (Ctrl+K) (NEW)

**Mô tả:**
- Nhấn Ctrl+K → Mở search box
- Tìm kiếm: Trang, tính năng, dữ liệu, sự kiện
- Điều hướng nhanh
- Recent searches
- Keyboard shortcuts

**Tham khảo:**
- Vercel (cmdk)
- Linear (cmdk)
- Raycast
- Spotlight (macOS)

---

### 8.3. Notification Center (NEW)

**Mô tả:**
- Bell icon ở Navbar
- Dropdown hiển thị thông báo mới
- Push notification cho cảnh báo khẩn cấp
- Email alerts (optional)
- Sound notification cho SOS
- Notification preferences

---

### 8.4. Multi-language (NEW)

**Mô tả:**
- Vietnamese (default)
- English
- Language switcher ở Navbar
- Lưu preference vào localStorage
- Tất cả text đều có bản dịch

---

### 8.5. Dark/Light Mode (NEW)

**Mô tả:**
- Toggle switch ở Navbar
- Default: Light mode
- Persist preference
- System preference detection
- Smooth transition giữa 2 mode

---

### 8.6. Export & Reports (NEW)

**Mô tả:**
- Export dashboard → PDF
- Export data → CSV/Excel
- Export map → PNG
- Scheduled reports (email)
- Custom report builder

---

### 8.7. User Profile & Settings (NEW)

**Mô tả:**
- User profile page
- Settings: Language, Notifications, Theme
- Saved locations
- Alert preferences
- Learning progress (Education)

---

## PHẦN IX — THAM KHẢO WORLD-CLASS

### 9.1. Trang web thiên tai tham khảo

| Trang web | Điểm mạnh | Học hỏi |
|-----------|-----------|---------|
| ReliefWeb.int | Data organization, Clean UI | Layout, Data hierarchy |
| GDACS.org | Real-time alerts, Map-centric | Alert system |
| FEMA.gov | Emergency focus, Accessibility | Emergency UX |
| JMA.go.jp | Data visualization, Professional | Charts, Data display |
| Windy.com | Stunning weather viz, Interactive map | Map visualization |
| Earth.nullschool.net | 3D globe, Beautiful animations | Globe visualization |
| Ready.gov | Simple, Clear, Actionable | Emergency communication |

### 9.2. Trang web design tham khảo

| Trang web | Điểm mạnh | Học hỏi |
|-----------|-----------|---------|
| Stripe.com | Gradient, Card design, Animation | Color, Cards, Hover |
| Linear.app | Clean, Minimal, Fast | UI simplicity |
| Vercel.com | Dark/Light, Animation, Performance | Transitions |
| Apple.com | Scroll animations, Product showcase | Scroll effects |
| Awwwards.com | Creative design, Innovation | Inspiration |
| Framer.com | Motion design, Interactions | Animation |
| Raycast.com | Command palette, UX | Quick actions |

### 9.3. 3D/Interactive tham khảo

| Dự án | Điểm mạnh | Học hỏi |
|-------|-----------|---------|
| Globe.gl | 3D globe, Markers | Globe visualization |
| Deck.gl | WebGL maps, Layers | Map rendering |
| Three.js examples | 3D scenes, Interactions | 3D models |
| Mapbox GL | 3D terrain, Custom styles | Map styling |
| Observablehq.com | Data viz, Interactivity | Charts |
| D3.js gallery | Data visualization | Custom viz |

---

## PHẦN X — TECH STACK ĐỀ XUẤT

### 10.1. Giữ nguyên (hiện có):
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Recharts
- Leaflet + React-Leaflet
- Three.js
- Globe.gl
- Lucide React
- TensorFlow.js

### 10.2. Thêm mới (đề xuất):

**3D & Visualization:**
- @react-three/fiber — React renderer cho Three.js
- @react-three/drei — 3D helpers & abstractions
- @react-three/postprocessing — 3D post-processing effects
- Mapbox GL JS — Advanced map rendering (thay thế hoặc bổ sung Leaflet)
- Deck.gl — Large-scale data visualization trên map

**Animation:**
- GSAP — Professional animations (ScrollTrigger, timelines)
- Lottie — After Effects animations trong React
- react-spring — Physics-based animations

**State & Data:**
- Zustand — Lightweight state management
- @tanstack/react-query — Data fetching & caching
- Socket.io-client — Real-time WebSocket

**UI & UX:**
- cmdk — Command palette
- vaul — Drawer component
- sonner — Toast notifications
- next-intl — Internationalization
- next-themes — Dark/Light mode
- react-hot-toast — Notifications

**Utilities:**
- date-fns — Date formatting
- lodash-es — Utility functions
- nanoid — ID generation
- zod — Schema validation

---

## PHẦN XI — KPIs & SUCCESS METRICS

### 11.1. Technical KPIs:
- Page load time: < 2 giây
- Time to interactive: < 3 giây
- Lighthouse Performance: > 90
- Lighthouse Accessibility: > 95
- Lighthouse SEO: > 95
- Bundle size: < 500KB (gzipped)

### 11.2. UX KPIs:
- User engagement: +50%
- Session duration: +30%
- Bounce rate: -20%
- Mobile usage: +40%
- Task completion rate: > 90%

### 11.3. Design KPIs:
- Visual consistency: 100% (không có dark/light mismatch)
- Color contrast ratio: > 4.5:1 (WCAG AA)
- Responsive breakpoints: 100% coverage
- Animation performance: 60fps

---

## PHẦN XII — TIMELINE TRIỂN KHAI

### Phase 1: Design System Overhaul (Tuần 1-2)
- Color palette mới
- Typography system
- Component library (Cards, Buttons, Badges, Forms)
- Spacing & Layout system
- Navbar & Footer redesign

### Phase 2: Trang chủ Redesign (Tuần 3-4)
- Hero section compact
- Live Alert Banner
- Quick Access Dashboard
- Modules Grid compact
- Impact Numbers
- Trust Section

### Phase 3: Trang con Redesign (Tuần 5-6)
- Chuyển tất cả trang con sang light theme
- BỎ IntroSection trên tất cả trang
- Giảm số tabs trên mỗi trang
- BỎ Cross-links
- Compact layouts

### Phase 4: Dữ liệu Cập nhật (Tuần 7-8)
- Cập nhật dữ liệu VN 2026
- Thêm dữ liệu thế giới
- Tích hợp real-time APIs
- Weather integration
- Dashboard data expansion

### Phase 5: 3D & Interactive (Tuần 9-12)
- Globe 3D nâng cấp
- 3D terrain map
- Disaster simulation
- Interactive data viz
- Micro-interactions

### Phase 6: Animation & Polish (Tuần 13-14)
- Page transitions
- Scroll animations
- Hover effects
- Cursor effects
- Loading animations

### Phase 7: New Features (Tuần 15-18)
- AI Chatbot
- Command Palette
- Notification Center
- Multi-language
- Dark/Light mode
- Export & Reports

### Phase 8: Performance & Testing (Tuần 19-20)
- Performance optimization
- Accessibility audit
- Cross-browser testing
- Mobile testing
- User testing

---

## PHẦN XIII — ƯU TIÊN THỰC HIỆN

### 🔴 PRIORITY 1 — NGAY LẬP TỨC (Tuần này):
1. Cập nhật color palette → Loại bỏ dark backgrounds
2. Cập nhật disaster data 2026
3. Loại bỏ IntroSection trên tất cả trang con
4. Thống nhất light theme

### 🟡 PRIORITY 2 — TUẦN SAU:
1. Redesign trang chủ (compact)
2. Giảm số tabs trên trang con
3. Cập nhật Navbar/Footer
4. Thêm world disaster data

### 🟢 PRIORITY 3 — 2 TUẦN TỚI:
1. Nâng cấp 3D Globe
2. Thêm micro-interactions
3. Tích hợp real-time APIs
4. Page transitions

### 🔵 PRIORITY 4 — 1 THÁNG TỚI:
1. AI Chatbot
2. Command Palette
3. Multi-language
4. 3D simulations

---

> **GHI CHÚ:** Đây là MASTER PLAN — tài liệu yêu cầu thuần túy.  
> Không chứa code implementation.  
> Mỗi phase sẽ có PLAN riêng chi tiết khi bắt đầu thực hiện.  
> Cần review và approve trước khi bắt đầu phase nào.