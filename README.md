<div align="center">

<br/>

# 🛡️ CứuNet

### Nền tảng Quản lý Thiên tai Quốc gia Việt Nam · Powered by AI

<br/>

> **"Phòng ngừa hơn chữa trị."**
> CứuNet không chỉ là một hệ thống — đây là lá chắn số của người dân Việt Nam trước thiên tai.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet.js-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)

<br/>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Phases Complete](https://img.shields.io/badge/Phases-12%2F12_Complete-success?style=flat-square&logo=checkmarx)](/)
[![Lines of Code](https://img.shields.io/badge/Lines_of_Code-50%2C000+-blue?style=flat-square)](/)
[![Built with AWF](https://img.shields.io/badge/Built_with-AWF_Agent_Framework-purple?style=flat-square)](/)

<br/>

[🗺️ Bản đồ](#-module-1--bản-đồ-thiên-tai) · [🤖 AI Dự đoán](#-module-2--ai-dự-đoán) · [📢 Cảnh báo](#-module-3--cảnh-báo--sos) · [🚁 Cứu trợ](#-module-4--phối-hợp-cứu-trợ) · [📊 Dashboard](#-module-5--trực-quan-hóa-dữ-liệu) · [🎓 Giáo dục](#-module-6--giáo-dục-phòng-chống-thiên-tai) · [🗺️ Báo cáo](#-module-7--báo-cáo-cộng-đồng)

</div>

---

## 🌏 Bối cảnh & Động lực

Việt Nam nằm trong **TOP 5 quốc gia chịu thiên tai nặng nề nhất thế giới** (UNDRR). Mỗi năm, thiên tai cướp đi hàng trăm sinh mạng và gây thiệt hại **1–2% GDP**:

| Sự kiện | Thương vong | Thiệt hại kinh tế |
|---------|:-----------:|:-----------------:|
| 🌀 Bão Yagi 2024 | **325 người chết** | ~$3.47 tỷ USD |
| 🌊 Lũ miền Trung 2020 | 249 người chết | ~$2.1 tỷ USD |
| 🌪️ Bão Damrey 2017 | 107 người chết | ~$1 tỷ USD |

**Vấn đề cốt lõi:** Hệ thống hiện tại phân tán, phản ứng chậm, thiếu nền tảng thống nhất từ **Dự đoán → Cảnh báo → Ứng phó → Phục hồi**.

**Giải pháp:** CứuNet — nền tảng tích hợp toàn diện, sử dụng AI để **giám sát, dự đoán, cảnh báo và điều phối cứu trợ** thiên tai trên toàn lãnh thổ Việt Nam.

---

## 🏗️ Kiến trúc Hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    CứuNet Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Bản đồ   │  │ AI Dự    │  │ Cảnh báo │  │ Cứu trợ  │   │
│  │ Realtime │  │ Đoán     │  │ & SOS    │  │ ICS      │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐   │
│  │              Shared Context + State Management        │   │
│  │          React Context + Reducer Pattern              │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │                    Data Layer                         │   │
│  │   Mock Data + External APIs (ReliefWeb, GDACS, USGS) │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 7 Module Chức năng

### 🗺️ Module 1 — Bản đồ Thiên tai

Giám sát real-time 63 tỉnh thành với **3 chế độ hiển thị** (Sáng/Tối/Vệ tinh):

- 📍 Markers thiên tai với popup chi tiết
- 🔥 Heatmap density visualization
- 🗺️ Choropleth theo tỉnh (mã màu theo mức độ)
- 🌦️ Overlay thời tiết (nhiệt độ, gió, mưa)
- ⏱️ Timeline slider lọc theo thời gian
- 🔍 Search bar tìm tỉnh/thành phố
- 🧭 Compass + Location + Fullscreen controls

---

### 🤖 Module 2 — AI Dự đoán

Ensemble model dự đoán rủi ro thiên tai theo **3 phương pháp**:

| Phương pháp | Mô tả | Độ chính xác |
|-------------|--------|:------------:|
| Moving Average | Trung bình trượt 5 năm | 72% |
| Linear Regression | Hồi quy tuyến tính xu hướng | 68% |
| Seasonal Decomposition | Phân tích mùa vụ | 75% |

**Tính năng:**
- 🎯 Risk Score cho từng tỉnh (0-100%)
- 📊 Biểu đồ xu hướng 6 tháng tới
- 📅 Lịch mùa vụ thiên tai
- 🌍 Kịch bản: El Niño / La Niña / Biến đổi khí hậu
- 📡 Dữ liệu外部: ReliefWeb, GDACS, USGS, Open-Meteo

---

### 📢 Module 3 — Cảnh báo & SOS

Hệ thống cảnh báo **CAP-inspired** và nút SOS cứu nạn 1 chạm:

- 🚨 4 mức cảnh báo: Theo dõi → Cảnh báo → Nguy hiểm → Khẩn cấp
- 🆘 SOS Panel: Gửi tín hiệu cứu hộ khẩn cấp
- 📞 Danh bạ khẩn cấp theo tỉnh (113/114/115)
- ✅ Checklist PCTT theo mùa
- 📜 Lịch sử SOS với timeline
- 📡 Offline mode: SOS lưu offline, tự động gửi khi có mạng

---

### 🚁 Module 4 — Phối hợp Cứu trợ

Điều phối cứu hộ theo chuẩn **ICS** (Incident Command System):

- 📊 Dashboard Tổng quan (SOS, tài nguyên, TNV)
- 🗺️ Bản đồ tác chiến (incidents, resources, shelters)
- 📋 Bảng nhiệm vụ Kanban (Chờ → Đang làm → Hoàn thành)
- 🏠 Quản lý nơi trú ẩn (check-in/out capacity)
- 📡 Trung tâm liên lạc (channels, broadcasts)
- 👥 Quản lý tình nguyện viên (phân công, theo dõi)
- 🔀 Dòng tài nguyên Sankey diagram
- 🎯 Đề xuất điều phối AI (gợi ý đơn vị gần nhất)

---

### 📊 Module 5 — Trực quan hóa Dữ liệu

25 năm dữ liệu thiên tai Việt Nam (2000-2024) với **4 góc nhìn**:

| Góc nhìn | Đối tượng | Biểu đồ |
|----------|-----------|---------|
| Executive | Lãnh đạo | KPI Cards, Gauge, Choropleth |
| Operational | Giám sát | Real-time alerts, Province overview |
| Analytical | Phân tích | Heatmap, Scatter, Treemap, Pie |
| Strategic | Chiến lược | Trend lines, YoY comparison |

- 📈 8 loại biểu đồ tương tác (Recharts)
- 📍 Drill-down theo tỉnh
- 📥 Xuất CSV dữ liệu
- 🔍 Bộ lọc: thời gian, khu vực, loại thiên tai

---

### 🎓 Module 6 — Giáo dục Phòng chống Thiên tai

Hệ thống học tập **microlearning** với gamification:

- 📚 8 khóa học (25+ bài học, 5 phút/bài)
- 🎮 Kịch bản mô phỏng (decision tree)
- 🧠 Quiz thích ứng (SM-2 spaced repetition)
- 🩹 Hướng dẫn sơ cứu
- 🎒 Xây dựng bộ đồ 72 giờ
- 🏆 20 huy hiệu + Bảng xếp hạng
- 📞 Danh bạ khẩn cấp

---

### 🗺️ Module 7 — Báo cáo Cộng đồng

**Crowd-sourced** báo cáo thiên tai từ người dân:

- 📝 Wizard 6 bước gửi báo cáo
- 🗺️ Xác định vị trí trên bản đồ
- ⬆️⬇️ Xác minh cộng đồng (upvote/downvote)
- 🏅 Hệ thống uy tín (trust score)
- 📊 Thống kê báo cáo theo thời gian thực
- 📱 Offline mode (lưu local, sync khi có mạng)

---

## 🎨 Hệ thống Design

### Color Palette

| Màu | Hex | Công dụng |
|-----|-----|-----------|
| Deep Navy | `#0a0f1e` | Background chính |
| Electric Blue | `#3B82F6` | Primary accent |
| Emerald | `#22C55E` | Success / Verified |
| Amber | `#F59E0B` | Warning / Caution |
| Emergency Red | `#EF4444` | Danger / SOS |
| Cyan | `#06B6D4` | Info / Accent |
| Purple | `#8B5CF6` | Secondary / AI |

### Typography

- **Headings:** Space Grotesk (bold, tight tracking)
- **Body:** Inter (clean, readable)
- **Monospace:** JetBrains Mono (code, data)

### Effects

- ✨ Glassmorphism cards (blur(20px) + border glow)
- 🎭 Scroll-triggered animations (IntersectionObserver)
- 🌊 Particle field (Canvas API, constellation effect)
- 📺 Video hero background
- 💫 Micro-interactions (10 CSS animation classes)
- 🔄 Skeleton loading states

---

## 🛠️ Tech Stack

| Layer | Công nghệ | Phiên bản |
|-------|-----------|-----------|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | 12.x |
| Maps | Leaflet.js + React-Leaflet | 1.9.4 |
| Charts | Recharts | 2.15.0 |
| AI/ML | TensorFlow.js | 4.22.0 |
| Icons | Lucide React | 0.468.0 |
| DnD | @dnd-kit | 6.3.1 |
| State | React Context + useReducer | Built-in |
| Build | Turbopack (Next.js) | Built-in |

---

## 🚀 Cài đặt & Chạy

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/nphu211206/CuuNet.git
cd CuuNet

# Install dependencies
npm install

# Run development server
npm run dev
```

Mở http://localhost:3000 trong trình duyệt.

### Build Production

```bash
npm run build
npm start
```

---

## 📁 Cấu trúc dự án

```
CuuNet/
├── public/                          # Static assets
│   ├── icons/                       # PWA icons
│   ├── manifest.json                # PWA manifest
│   └── workers/                     # Web workers
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # Homepage
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── map/page.tsx             # Bản đồ thiên tai
│   │   ├── predict/page.tsx         # AI dự đoán
│   │   ├── alerts/page.tsx          # Cảnh báo & SOS
│   │   ├── rescue/page.tsx          # Phối hợp cứu trợ
│   │   ├── dashboard/page.tsx       # Dashboard thống kê
│   │   ├── education/page.tsx       # Giáo dục
│   │   ├── report/page.tsx          # Báo cáo cộng đồng
│   │   └── offline/page.tsx         # Offline fallback
│   ├── components/
│   │   ├── home/                    # Homepage components
│   │   │   ├── HeroVideo.tsx        # Video background
│   │   │   ├── ParticleField.tsx    # Canvas particles
│   │   │   ├── AnimatedCounter.tsx  # Count-up numbers
│   │   │   ├── FlowTimeline.tsx     # How it works
│   │   │   ├── ModuleCard.tsx       # Bento grid cards
│   │   │   ├── ImpactShowcase.tsx   # Stats showcase
│   │   │   ├── TrustedBy.tsx        # Partners marquee
│   │   │   ├── CTASection.tsx       # Call to action
│   │   │   └── ...
│   │   └── shared/                  # Shared components
│   │       ├── Navbar.tsx           # Navigation bar
│   │       ├── Footer.tsx           # Footer
│   │       ├── IntroSection.tsx     # Module intro
│   │       ├── TabDropdown.tsx      # Tab dropdown
│   │       ├── ScrollReveal.tsx     # Scroll animations
│   │       ├── Skeleton.tsx         # Loading skeletons
│   │       └── MobileBottomNav.tsx  # Mobile navigation
│   ├── features/                    # Feature modules
│   │   ├── map-disaster/            # Bản đồ thiên tai
│   │   ├── predict/                 # AI dự đoán
│   │   ├── alert-sos/               # Cảnh báo & SOS
│   │   ├── rescue-connect/          # Phối hợp cứu trợ
│   │   ├── dashboard-stats/         # Dashboard thống kê
│   │   ├── education-survival/      # Giáo dục
│   │   └── community-report/        # Báo cáo cộng đồng
│   ├── data/                        # Mock data
│   └── lib/                         # Utilities & types
└── MASTER_PLAN_HOMEPAGE.md          # Homepage upgrade plan
```

---

## 🎯 Hệ thống Design Patterns

| Pattern | Ứng dụng | Ví dụ |
|---------|----------|-------|
| **Feature-Sliced** | Tổ chức features | `features/map-disaster/ui/`, `lib/`, `config/` |
| **Context + Reducer** | State management | `PredictionProvider`, `RescueProvider` |
| **Dynamic Import** | Code splitting | `dynamic(() => import("..."), { ssr: false })` |
| **Compound Components** | UI composition | `TabDropdown`, `IntroSection` |
| **Observer** | Scroll animations | `IntersectionObserver` trong `ScrollReveal` |
| **Strategy** | AI predictions | 3 prediction methods ensemble |

---

## 📊 Thống kê Dự án

| Metric | Giá trị |
|--------|---------|
| Tổng files đã sửa | **42+ files** |
| Components mới | **9 shared + 7 home** |
| CSS Classes mới | **30+ utility classes** |
| Routes | **12 trang** |
| Tech stacks | **12 công nghệ** |
| Modules | **7 module chức năng** |
| Biểu đồ | **8 loại** (Recharts) |
| Khóa học | **8 khóa** (25+ bài) |
| Tỉnh thành | **63 tỉnh** (đầy đủ) |

---

## 🔮 Hướng phát triển

- [ ] 🔐 Authentication (NextAuth.js + OAuth)
- [ ] 🗄️ Database (PostgreSQL + Prisma)
- [ ] 📡 Real-time WebSocket (Socket.io)
- [ ] 📱 PWA Service Worker (offline caching)
- [ ] 🌐 i18n (English, French)
- [ ] 🤖 Advanced ML (LSTM, Transformer)
- [ ] 📊 Admin Dashboard
- [ ] 🔔 Push Notifications
- [ ] 📡 IoT Sensor Integration
- [ ] 🛰️ Satellite Imagery Analysis

---

## 📄 License

MIT License — xem [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👥 Đóng góp

Đây là **Khóa luận Tốt nghiệp 2025**. Mọi đóng góp đều được chào đón!

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

<div align="center">

**Được xây dựng với ❤️ tại Việt Nam**

*Nền tảng Quản lý Thiên tài Thông minh — Khóa luận Tốt nghiệp 2025*

![Vietnam Flag](https://img.shields.io/badge/🇻🇳-Việt_Nam-da251d?style=for-the-badge)

</div>