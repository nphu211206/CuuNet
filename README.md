<div align="center">

# 🌊 CứuNet

### Nền tảng Quản lý Thiên tai Thông minh

**AI & Machine Learning giám sát, dự đoán và ứng phó với thiên tai trên toàn lãnh thổ Việt Nam**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)]()
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?style=flat-square&logo=vercel)]()

---

**🌏 [Live Demo](https://cuunet.vercel.app)** · **[Report Bug](https://github.com/nphu211206/CuuNet/issues)** · **[Request Feature](https://github.com/nphu211206/CuuNet/issues)**

</div>

---

## 📖 Giới thiệu

CứuNet là nền tảng quản lý thiên thai thông minh dành cho Việt Nam — tích hợp AI dự đoán, giám sát real-time, cảnh báo sớm, phối hợp cứu trợ và giáo dục cộng đồng trong một hệ thống duy nhất.

> *"Mỗi người dân là một cảm biến thiên tai"* — CứuNet biến crowd-sourced data thành actionable intelligence.

---

## ✨ Tính năng nổi bật

### 🏠 Trang chủ — Interactive Command Center
- **NASA Globe** — Bản đồ trái đất 3D với NASA Blue Marble texture, atmosphere glow, animated disaster markers
- **Province Risk Ranking** — Xếp hạng rủi ro 63 tỉnh thành với animated bars
- **Live Ticker** — Banner cảnh báo real-time chạy liên tục
- **Hero Section** — Typewriter effect, gradient text, particle field overlay
- **7 Module Cards** — Bento grid layout với hover effects

### 🗺️ Bản đồ Thiên tai (`/map`)
- **Interactive Leaflet Map** — Markers, heatmap, choropleth layers
- **Quick Filters** — Lọc nhanh theo loại thiên tai (Lũ lụt, Bão, Sạt lở, Hạn hán)
- **Sidebar Detail Panel** — Click sự kiện → xem chi tiết
- **Tile Toggle** — Chuyển đổi Street/Satellite/Terrain
- **Timeline Slider** — Lọc theo thời gian

### 🧠 AI Dự đoán (`/predict`)
- **Risk Engine** — INFORM Risk Index + Statistical Engine (MA/LR/Seasonal)
- **Risk Gauge** — Animated needle hiển thị mức rủi ro
- **Trend Charts** — Biểu đồ xu hướng 6 tháng tới
- **Seasonal Calendar** — Lịch mùa vụ thiên tai
- **Scenario Simulator** — 3 kịch bản khí hậu (Bình thường, El Niño, Biến đổi khí hậu)
- **Province Drill-down** — Click tỉnh → xem chi tiết rủi ro

### ⚠️ Cảnh báo & SOS (`/alerts`)
- **CAP-inspired Alerts** — Hệ thống cảnh báo chuẩn quốc tế
- **SOS 1 Chạm** — Gửi tín hiệu cứu hộ khẩn cấp
- **Emergency Directory** — Danh bạ khẩn cấp theo tỉnh
- **Checklist Manager** — Bộ đồ sinh tồn 72 giờ
- **Offline Mode** — SOS lưu offline, tự động gửi khi có mạng

### 🤝 Phối hợp Cứu trợ (`/rescue`)
- **ICS Command Board** — Sơ đồ chỉ huy sự cố chuẩn quốc tế
- **Task Board** — Quản lý nhiệm vụ cứu hộ
- **Resource Registry** — Theo dõi tài nguyên cứu trợ
- **3W Dashboard** — Who-What-Where coordination
- **Shelter Manager** — Quản lý nơi trú ẩn
- **Communication Hub** — Kênh liên lạc cứu trợ

### 📊 Dashboard Thống kê (`/dashboard`)
- **4 góc nhìn** — Executive, Operational, Analytical, Strategic
- **25 năm dữ liệu** — Thiên tai Việt Nam 2000-2024
- **Interactive Charts** — Bar, Line, Pie, Heatmap
- **Province Drill-down** — Click tỉnh → xem chi tiết
- **Export CSV + PDF** — Xuất dữ liệu bất cứ lúc nào

### 📚 Giáo dục Sinh tồn (`/education`)
- **8 Khóa học** — Microlearning với progress tracking
- **Quiz Engine** — Câu hỏi thích ứng (IRT-based)
- **Scenario Simulator** — Kịch bản mô phỏng thiên tai
- **First Aid Guide** — Hướng dẫn sơ cứu
- **Emergency Kit Builder** — Xây dựng bộ đồ 72 giờ
- **Badge System** — Gamification với 20 huy hiệu

### 📢 Báo cáo Cộng đồng (`/report`)
- **Submit Wizard** — 4 bước gửi báo cáo thiên tai
- **Community Feed** — Xem báo cáo từ cộng đồng
- **Verification System** — Xác minh bởi cộng đồng (upvote/downvote)
- **Map View** — Markers trên bản đồ
- **Offline Support** — Lưu offline khi mất mạng

---

## 🎨 Design System

| Element | Specification |
|---------|--------------|
| **Theme** | Light theme thống nhất (#F8FAFC) |
| **Typography** | Space Grotesk (headings) + Inter (body) |
| **Colors** | Brand Blue (#0066FF), Accent Teal (#00C9A7) |
| **Animations** | Framer Motion + GSAP ScrollTrigger |
| **3D** | Three.js + react-globe.gl |
| **Maps** | Leaflet + react-leaflet |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **State** | React Context + Reducer |
| **Animations** | Framer Motion, GSAP |
| **3D/Maps** | Three.js, react-globe.gl, Leaflet |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Utilities** | clsx, date-fns |
| **Export** | jsPDF, html2canvas |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/nphu211206/CuuNet.git
cd CuuNet

# Install
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command Palette |
| `?` | Keyboard Shortcuts Guide |
| `D` | Toggle Dark/Light Mode |
| `L` | Toggle Language (VI/EN) |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage (8 sections)
│   ├── map/               # Disaster Map
│   ├── predict/           # AI Prediction
│   ├── alerts/            # Alerts & SOS
│   ├── rescue/            # Rescue Coordination
│   ├── dashboard/         # Data Dashboard
│   ├── education/         # Education Hub
│   └── report/            # Community Reports
├── components/            # Shared components
│   ├── home/              # Homepage components
│   └── shared/            # Navbar, Footer, etc.
├── features/              # Feature modules
│   ├── map-disaster/      # Map feature
│   ├── predict/           # Prediction engine
│   ├── alert-sos/         # Alert system
│   ├── rescue-connect/    # Rescue coordination
│   ├── dashboard-stats/   # Dashboard
│   ├── education-survival/# Education
│   └── community-report/  # Reports
├── data/                  # Disaster data
├── lib/                   # Utilities
└── shared/                # Shared types
```

---

## 🌍 Data Sources

| Source | Type | Coverage |
|--------|------|----------|
| **EM-DAT** | Historical disasters | Vietnam 2000-2026 |
| **MARD** | Agricultural damage | Vietnam provinces |
| **USGS** | Earthquakes | Global |
| **GDACS** | Multi-hazard alerts | Global |
| **ReliefWeb** | Humanitarian news | Global |
| **Open-Meteo** | Weather data | Global |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Fork → Clone → Branch → Commit → PR
git checkout -b feature/amazing-feature
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [UNICEF](https://unicef.org) — Child-Centered DRR Framework
- [IFRC](https://ifrc.org) — Disaster Response Guidelines
- [Vietnam NDMA](https://vndma.gov.vn) — National Disaster Management
- [NASA](https://nasa.gov) — Blue Marble Earth Textures
- [OpenStreetMap](https://openstreetmap.org) — Map Tiles

---

<div align="center">

**Built with ❤️ for Vietnam**

*Phòng ngừa hơn chữa trị — Preparedness saves lives*

</div>