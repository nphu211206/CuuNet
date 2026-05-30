# 🚀 CUUNET MASTER PLAN — FINAL UPGRADE

## MỤC TIÊU
Nâng cấp toàn diện từ **90%** lên **100%** — đẹp, mượt, đẳng cấp, mới lạ.

---

## PHASE 1: GIAO DIỆN ĐỒNG NHẤT (100% light theme)

### 1.1. Fix dark backgrounds còn sót
- [ ] `bg-slate-900` trong predict loading → `bg-slate-100`
- [ ] `bg-slate-800` trong education toast → `bg-slate-100`
- [ ] `bg-slate-700` trong alerts map border → `border-slate-200`
- [ ] `bg-slate-950` trong education loading → `bg-slate-50`

### 1.2. Fix dark text colors
- [ ] `text-slate-200` → `text-slate-700` (tất cả pages)
- [ ] `text-slate-300` → `text-slate-600` (tất cả pages)
- [ ] `text-slate-400` trên dark bg → `text-slate-500` (alerts, rescue)

### 1.3. Thống nhất typography
- [ ] Font family: Space Grotesk (headings) + Inter (body)
- [ ] Font size: Display 60px, H1 48px, H2 36px, H3 24px, H4 20px
- [ ] Font weight: Black 900, Bold 700, Semibold 600, Medium 500, Regular 400

### 1.4. Thống nhất colors
- [ ] Background: #F8FAFC (slate-50)
- [ ] Cards: white + border-slate-200 + shadow-sm
- [ ] Text: #0F172A (primary), #475569 (secondary), #94A3B8 (muted)
- [ ] Accent: #0066FF (brand blue), #00C9A7 (teal)
- [ ] Danger: #EF4444, Warning: #F59E0B, Success: #22C55E

---

## PHASE 2: NÂNG CẤP TRANG CHỦ

### 2.1. NASA Globe
- [x] Blue Marble texture
- [x] Vietnam label
- [x] Animated disaster markers
- [x] Connection arcs
- [ ] Atmosphere glow enhancement
- [ ] Click marker → popup chi tiết

### 2.2. Province Risk Ranking
- [x] Animated horizontal bars
- [x] Hover shimmer effect
- [x] Click to predict page
- [ ] Province drill-down modal

### 2.3. Hero Section
- [x] Typewriter effect
- [x] Gradient text
- [x] Particle field overlay
- [ ] Parallax scroll effect

### 2.4. Modules Grid
- [x] 7 module cards
- [x] Bento layout
- [ ] Hover lift + glow effect

### 2.5. GSAP Animations
- [x] ScrollTrigger cho tất cả sections
- [x] Fade-up, scale-in, stagger animations
- [ ] Parallax cho hero section

---

## PHASE 3: NÂNG CẤP TRANG MAP

### 3.1. Interactive Map
- [x] Leaflet markers
- [x] Heatmap layer
- [x] Choropleth layer
- [ ] Province click → fly to location
- [ ] Animated markers pulse

### 3.2. Sidebar Detail Panel
- [x] Danh sách sự kiện gần đây
- [x] Click → xem chi tiết
- [ ] Province click → highlight trên map

### 3.3. Quick Filters
- [x] Lọc theo loại thiên tai
- [x] Active state styling
- [ ] Filter animation

### 3.4. Timeline Slider
- [x] Lọc theo thời gian
- [ ] Animated play/pause

---

## PHASE 4: NÂNG CẤP TRANG PREDICT

### 4.1. Risk Gauge
- [x] Animated needle
- [x] Color-coded zones
- [ ] Smooth animation transitions

### 4.2. Trend Charts
- [x] Recharts line/bar charts
- [x] Tooltips
- [ ] Animated draw

### 4.3. Province Cards
- [x] Risk score display
- [x] Click to expand
- [ ] Expand/collapse animation

### 4.4. Scenario Simulator
- [x] 3 climate scenarios
- [x] Comparison view
- [ ] Animated transitions

---

## PHASE 5: NÂNG CẤP TRANG ALERTS

### 5.1. SOS Button
- [x] Animated pulse effect
- [x] Red gradient
- [ ] Glow effect on hover

### 5.2. Alert Feed
- [x] Severity-based styling
- [x] Filter/sort
- [ ] Expand/collapse animation

### 5.3. Emergency Directory
- [x] Danh bạ khẩn cấp
- [x] Province filter
- [ ] Quick dial button

### 5.4. Checklist Manager
- [x] 72-hour kit
- [x] Progress tracking
- [ ] Completion confetti

---

## PHASE 6: NÂNG CẤP TRANG DASHBOARD

### 6.1. Executive Dashboard
- [x] KPI cards
- [x] Type distribution chart
- [x] Province ranking
- [ ] Animated counters

### 6.2. Analytical Dashboard
- [x] Yearly trend chart
- [x] Province comparison
- [ ] Chart animations

### 6.3. Province Drill-down
- [x] Stats grid
- [x] Major events
- [x] Type distribution
- [ ] Back button animation

### 6.4. Export
- [x] CSV export
- [x] PDF export
- [ ] Export progress animation

---

## PHASE 7: NÂNG CẤP TRANG EDUCATION

### 7.1. Course Browser
- [x] 8 courses
- [x] Progress bars
- [ ] Progress animation

### 7.2. Quiz Engine
- [x] IRT-based questions
- [x] Immediate feedback
- [ ] Score animation

### 7.3. Badge System
- [x] 20 badges
- [x] Lock/unlock states
- [ ] Unlock confetti

### 7.4. Scenario Simulator
- [x] Decision tree
- [x] Debrief view
- [ ] Path animation

---

## PHASE 8: NÂNG CẤP TRANG REPORT

### 8.1. Submit Wizard
- [x] 4-step form
- [x] Progress indicator
- [ ] Step animation

### 8.2. Community Feed
- [x] Report cards
- [x] Vote buttons
- [ ] Vote animation

### 8.3. Map View
- [x] Markers trên map
- [x] Cluster markers
- [ ] Click to detail

---

## PHASE 9: NÂNG CẤP TRANG RESCUE

### 9.1. Task Board
- [x] 3 columns (Pending/In Progress/Done)
- [x] Drag & drop
- [ ] Drag animation

### 9.2. Resource Registry
- [x] Status badges
- [x] Deploy/Return actions
- [ ] Status animation

### 9.3. Communication Hub
- [x] Channel list
- [x] Message feed
- [ ] Message animation

---

## PHASE 10: PERFORMANCE OPTIMIZATION

### 10.1. Code Splitting
- [x] Dynamic imports cho heavy components
- [x] Route-based code splitting
- [ ] Lazy loading cho images

### 10.2. Image Optimization
- [x] Next.js Image component
- [x] AVIF/WebP formats
- [ ] Responsive images

### 10.3. Bundle Optimization
- [x] Tree shaking
- [x] Minimize bundle size
- [ ] Gzip compression

---

## PHASE 11: MICRO-INTERACTIONS

### 11.1. Page Transitions
- [x] Framer Motion AnimatePresence
- [x] Fade + slide animations
- [ ] Route change animation

### 11.2. Scroll Animations
- [x] GSAP ScrollTrigger
- [x] Fade-up, scale-in, stagger
- [ ] Parallax effects

### 11.3. Hover Effects
- [x] Cards: lift + shadow
- [x] Buttons: scale + glow
- [ ] Links: underline animation

### 11.4. Loading States
- [x] Skeleton screens
- [x] Progress bars
- [ ] Shimmer effect

---

## PHASE 12: ACCESSIBILITY

### 12.1. Keyboard Navigation
- [x] Tab/Enter/Escape cho interactive elements
- [x] Focus indicators (2px blue outline)
- [ ] Skip to main content link

### 12.2. Screen Reader
- [x] aria-labels
- [x] aria-live cho dynamic content
- [ ] Semantic HTML structure

### 12.3. Reduced Motion
- [x] prefers-reduced-motion support
- [x] Disable animations option
- [ ] No infinite animations

---

## PHASE 13: INTERNATIONALIZATION

### 13.1. i18n Setup
- [x] Vietnamese (default)
- [x] English
- [ ] Language switcher animation

### 13.2. Translation Keys
- [x] All UI strings
- [x] Error messages
- [ ] Date/number formatting

---

## PHASE 14: DARK MODE

### 14.1. Theme System
- [x] Light mode (default)
- [x] Dark mode
- [ ] System preference detection

### 14.2. Theme Toggle
- [x] Navbar toggle button
- [x] Smooth transition
- [ ] Theme persistence

---

## PHASE 15: ADVANCED FEATURES

### 15.1. Command Palette
- [x] Ctrl+K shortcut
- [x] Search commands
- [ ] Command history

### 15.2. AI Chatbot
- [x] Floating widget
- [x] Predefined responses
- [ ] AI integration

### 15.3. Keyboard Shortcuts
- [x] ? for help
- [x] D for dark mode
- [ ] Custom shortcuts

---

## THỜI GIAN DỰ KIẾN

| Phase | Tasks | Thời gian |
|-------|-------|-----------|
| 1. Giao diện đồng nhất | 15 | 2h |
| 2. Nâng cấp trang chủ | 8 | 1.5h |
| 3. Nâng cấp trang map | 8 | 1.5h |
| 4. Nâng cấp trang predict | 6 | 1h |
| 5. Nâng cấp trang alerts | 6 | 1h |
| 6. Nâng cấp trang dashboard | 6 | 1h |
| 7. Nâng cấp trang education | 6 | 1h |
| 8. Nâng cấp trang report | 4 | 0.5h |
| 9. Nâng cấp trang rescue | 4 | 0.5h |
| 10. Performance | 4 | 0.5h |
| 11. Micro-interactions | 6 | 1h |
| 12. Accessibility | 4 | 0.5h |
| 13. Internationalization | 3 | 0.5h |
| 14. Dark Mode | 3 | 0.5h |
| 15. Advanced Features | 4 | 0.5h |
| **Tổng** | **87** | **~14h** |

---

## MỤC TIÊU CUỐI CÙNG

✅ Giao diện 100% light theme thống nhất
✅ Tất cả 8 trang hoạt động hoàn hảo
✅ Animations mượt mà, đẳng cấp
✅ Tính năng đầy đủ, có ý nghĩa
✅ Responsive trên mọi thiết bị
✅ Performance tối ưu
✅ Accessibility đầy đủ
✅ i18n tiếng Việt + tiếng Anh
✅ Dark mode support
✅ Code quality cao

---

## TIẾN ĐỘ HIỆN TẠI

| Phase | Trạng thái | % |
|-------|-----------|---|
| 1. Giao diện đồng nhất | ⚠️ | 85% |
| 2. Nâng cấp trang chủ | ✅ | 95% |
| 3. Nâng cấp trang map | ✅ | 90% |
| 4. Nâng cấp trang predict | ✅ | 85% |
| 5. Nâng cấp trang alerts | ✅ | 85% |
| 6. Nâng cấp trang dashboard | ✅ | 85% |
| 7. Nâng cấp trang education | ✅ | 85% |
| 8. Nâng cấp trang report | ✅ | 80% |
| 9. Nâng cấp trang rescue | ✅ | 80% |
| 10. Performance | ✅ | 80% |
| 11. Micro-interactions | ✅ | 75% |
| 12. Accessibility | ⚠️ | 60% |
| 13. Internationalization | ✅ | 80% |
| 14. Dark Mode | ✅ | 80% |
| 15. Advanced Features | ✅ | 80% |

**Tổng: ~85%** → Mục tiêu: **100%**

---

**Next step:** Bắt đầu triển khai từ Phase 1 (Giao diện đồng nhất) — quan trọng nhất.