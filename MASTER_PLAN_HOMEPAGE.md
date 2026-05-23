# MASTER PLAN — CuuNet Homepage Upgrade
## Version: 1.0 | Target: Production-Grade Landing Page

---

## PHASE 0 — DESIGN PHILOSOPHY

### Aesthetic Direction
- **Tone**: Cinematic Dark Tech — inspired by Vercel, Linear, Stripe
- **Differentiation**: Video hero background + animated particle field + glassmorphism cards
- **Typography**: Custom font pairing (Space Grotesk display + Inter body)
- **Color**: Deep navy (#06080f) base + electric blue (#3B82F6) accent + emergency red (#EF4444) highlights

### Core Principles
1. **Immersive first impression** — video background conveys urgency and scale
2. **Progressive disclosure** — show key info first, details on scroll
3. **Micro-interactions everywhere** — every element responds to user
4. **Performance-first** — lazy load below-fold, optimize video, use next/image
5. **Accessibility** — prefers-reduced-motion, proper contrast, semantic HTML

---

## PHASE 1 — HERO SECTION (Cinematic Impact)

### 1.1 Video Background
- Add looping video background (Vietnam disaster/response footage)
- Fallback to static image for slow connections
- Dark overlay with gradient (85% opacity)
- Subtle parallax scroll effect

### 1.2 Animated Particle Field
- Canvas-based particle system (blue/cyan dots)
- Particles connect with lines when close (constellation effect)
- Responsive to mouse movement (subtle attraction)
- Performance: max 80 particles, requestAnimationFrame

### 1.3 Hero Content Redesign
- **Title**: Larger, with typewriter animation effect
- **Subtitle**: Fade in after title
- **Stats**: Animated counter (count up from 0)
- **CTAs**: Glowing border animation on hover
- **Activity Card**: Glassmorphism with live pulse indicator

### 1.4 Scroll Indicator
- Animated chevron bouncing at bottom
- "Khám phá" text with fade effect
- Smooth scroll to next section on click

---

## PHASE 2 — HOW IT WORKS (Interactive Flow)

### 2.1 Redesigned Flow
- Vertical timeline on mobile, horizontal on desktop
- Each step has animated icon + progress line
- Active step highlights with glow effect
- Click any step → smooth scroll to that module

### 2.2 Animated Connection Lines
- SVG path animation between steps
- Dashed line with moving gradient
- Pulse effect at connection points

### 2.3 Step Cards
- Glassmorphism background
- Icon with subtle bounce animation
- Hover: card lifts + border glow
- Active state: expanded description

---

## PHASE 3 — MODULES GRID (Showcase)

### 3.1 Card Redesign
- Larger cards with more breathing room
- Top accent bar with gradient animation on hover
- Icon: scale + rotate on hover
- Description: truncate with "Xem thêm" expand
- Bottom: animated progress bar showing "health" of each module

### 3.2 Layout
- Bento grid layout (asymmetric, some cards span 2 cols)
- Featured module (Bản đồ) takes 2x2 space
- Other modules in standard grid
- Gap: 16px consistent

### 3.3 Hover Effects
- Card lifts with shadow
- Border color transitions to module's accent
- Background: subtle gradient shift
- Icon: scale 1.1x with glow

---

## PHASE 4 — LIVE DASHBOARD PREVIEW

### 4.1 Mini Map Section
- Embedded Leaflet map (small, centered)
- Animated markers for recent disasters
- Heatmap overlay with pulsing effect
- "Xem bản đồ đầy đủ" CTA

### 4.2 Live Stats Ticker
- Animated numbers (SOS active, disasters tracked, people affected)
- Real-time pulse indicators
- Color-coded by severity

### 4.3 Recent Events Timeline
- Vertical timeline with alternating cards
- Each card: severity badge + icon + title + location + time
- Hover: expand to show more details
- Animated entrance on scroll

---

## PHASE 5 — TESTIMONIALS & SOCIAL PROOF

### 5.1 Stats Section
- Large animated counters
- "63 tỉnh thành" / "24/7 giám sát" / "AI-powered"
- Gradient background with noise texture

### 5.2 Technology Stack
- Logo grid with hover effects
- Next.js, TensorFlow, Leaflet, etc.
- Subtle float animation

---

## PHASE 6 — CTA SECTION (Call to Action)

### 6.1 Full-Width CTA
- Gradient background (blue → purple)
- Large text: "Sẵn sàng bảo vệ cộng đồng?"
- Two buttons: primary (Xem bản đồ) + secondary (Tìm hiểu thêm)
- Animated background particles

---

## PHASE 7 — FOOTER REDESIGN

### 7.1 Enhanced Footer
- 4-column layout
- Newsletter signup
- Social links with hover effects
- Back to top button (animated)
- Copyright with current year

---

## PHASE 8 — GLOBAL ANIMATIONS & EFFECTS

### 8.1 Scroll-Triggered Animations
- All sections fade in on scroll (IntersectionObserver)
- Staggered entrance for lists/grids
- Parallax for background elements

### 8.2 Micro-Interactions
- Button hover: scale + shadow + color shift
- Link hover: underline animation
- Card hover: lift + glow
- Icon hover: rotate/scale

### 8.3 Loading States
- Skeleton screens for dynamic content
- Smooth page transitions
- Image blur-up placeholder

---

## PHASE 9 — PERFORMANCE OPTIMIZATION

### 9.1 Video Optimization
- Compress video to < 5MB
- Use WebM format for smaller size
- Lazy load video (only when in viewport)
- Poster image as fallback

### 9.2 Image Optimization
- Use next/image for all images
- WebP format with fallback
- Blur placeholder for loading
- Responsive srcset

### 9.3 Code Optimization
- Dynamic imports for heavy components
- Tree-shake unused Lucide icons
- Optimize framer-motion bundle
- Use CSS animations where possible (lighter than JS)

---

## PHASE 10 — ACCESSIBILITY & UX

### 10.1 Accessibility
- prefers-reduced-motion support
- Proper ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast compliance

### 10.2 Mobile Optimization
- Touch-friendly tap targets (min 44px)
- Swipe gestures for carousels
- Responsive typography
- Bottom navigation for mobile

---

## IMPLEMENTATION ORDER

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| P0 | 1.1 Video Background | Medium | HIGH |
| P0 | 1.2 Particle Field | Medium | HIGH |
| P0 | 1.3 Hero Redesign | Low | HIGH |
| P1 | 2.1-2.3 How It Works | Medium | MEDIUM |
| P1 | 3.1-3.3 Modules Grid | Medium | MEDIUM |
| P2 | 4.1-4.3 Live Dashboard | High | HIGH |
| P2 | 5.1-5.2 Social Proof | Low | MEDIUM |
| P3 | 6.1 CTA Section | Low | MEDIUM |
| P3 | 7.1 Footer | Low | LOW |
| P1 | 8.1-8.3 Global Animations | Medium | HIGH |
| P0 | 9.1-9.3 Performance | Medium | HIGH |
| P1 | 10.1-10.2 Accessibility | Low | MEDIUM |

---

## TECH STACK (Already Available)

- **Animation**: framer-motion (already installed)
- **Icons**: lucide-react (already installed)
- **Styling**: Tailwind CSS 4 (already installed)
- **Utility**: clsx, tailwind-merge (already installed)
- **Video**: HTML5 <video> + next/image for poster
- **Particles**: Custom Canvas component
- **Charts**: recharts (already installed)

## NEW DEPENDENCIES (if needed)

- **@next/font**: Already in Next.js 16
- **No new deps required** — all can be done with existing stack

---

## FILE CHANGES ESTIMATE

| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | REWRITE | Complete homepage redesign |
| `src/app/globals.css` | UPDATE | New animations, particles, video styles |
| `src/app/layout.tsx` | UPDATE | Font optimization, metadata |
| `src/components/home/HeroVideo.tsx` | CREATE | Video background component |
| `src/components/home/ParticleField.tsx` | CREATE | Canvas particle animation |
| `src/components/home/AnimatedCounter.tsx` | CREATE | Count-up number animation |
| `src/components/home/ScrollReveal.tsx` | CREATE | Scroll-triggered animation wrapper |
| `src/components/home/ModuleCard.tsx` | CREATE | Enhanced module card |
| `src/components/home/LiveStats.tsx` | CREATE | Live statistics section |
| `src/components/home/Timeline.tsx` | CREATE | Recent events timeline |
| `src/components/home/CTASection.tsx` | CREATE | Call-to-action section |

---

## SUCCESS METRICS

- [ ] Video background loads in < 2s
- [ ] Particle field runs at 60fps
- [ ] All animations respect prefers-reduced-motion
- [ ] Lighthouse Performance > 90
- [ ] Mobile-friendly (all tap targets > 44px)
- [ ] No layout shift (CLS < 0.1)
