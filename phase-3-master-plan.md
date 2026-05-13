# MASTER PLAN: Phase 3 - Module Báo cáo Cộng đồng (Community Report)

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1 (Bản đồ Thiên tai) và Phase 2 (AI Dự đoán) đã hoàn thành. Bây giờ chuyển sang **Phase 3: Module Báo cáo Cộng đồng** - module thể hiện sức mạnh "crowd-sourcing" và sự tham gia của cộng đồng.

**Tại sao module này quan trọng cho luận văn:**
- Thể hiện tính "Community" - sức mạnh của cộng đồng trong giám sát thiên tai
- Crowd-sourced data = nguồn dữ liệu real-time bổ sung cho AI prediction
- UX/UI đẳng cấp: multi-step wizard, real-time feed, interactive map, social verification
- Hội đồng đánh giá cao: "Hệ thống không chỉ AI mà còn có con người tham gia"
- Kết nối trực tiếp với Phase 1 (map) và Phase 2 (prediction) - dữ liệu cộng đồng → cải thiện dự đoán

---

## Scope: Báo cáo Cộng đồng

### Tính năng chính (10 features)

1. **Report Submission Wizard** - Form 6 bước: Type → Location → Details → Photos → Contact → Review
2. **Real-time Report Feed** - Infinite scroll, filters, search, sort, animated cards
3. **Report Map View** - Leaflet markers, click → popup, filter sync
4. **Report Detail Modal** - Full info, photo lightbox, mini map, timeline, verification
5. **Community Verification** - Upvote/Downvote, trust score algorithm, badge system
6. **Report Statistics** - Animated counters, charts (Recharts), type/province distribution
7. **My Reports Panel** - Personal reports, stats, quick actions
8. **Offline Support** - localStorage + IndexedDB, draft auto-save, sync indicator
9. **Toast Notifications** - Verification updates, new reports nearby
10. **Report Templates** - 6 pre-built templates cho quick reporting

---

## Kiến trúc Tổng quan

```
┌──────────────────────────────────────────────────────────────────────┐
│                         REPORT PAGE                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    REPORT HEADER + STATS BAR                    │ │
│  │  [Tổng BC] [Đã XM] [Chờ XM] [Hôm nay] [Loại phổ biến] [Tỉnh] │ │
│  └──────────────────────────────────┬──────────────────────────────┘ │
│                                     │                                │
│  ┌────────────────┐  ┌─────────────┴─────────────┐  ┌────────────┐ │
│  │  FILTER PANEL  │  │      MAIN CONTENT         │  │  SIDEBAR   │ │
│  │                │  │                            │  │            │ │
│  │ • DisasterType │  │  ┌─────┐ ┌─────┐          │  │ • My Reports│ │
│  │ • Severity     │  │  │ FEED│ │ MAP │ (toggle) │  │ • Quick    │ │
│  │ • Province     │  │  └──┬──┘ └──┬──┘          │  │   Report   │ │
│  │ • DateRange    │  │     │       │             │  │ • Templates│ │
│  │ • Status       │  │  ┌──┴───────┴──┐          │  │ • Leaderbd │ │
│  │ • Verified     │  │  │ ReportCard  │          │  │            │ │
│  │                │  │  │ ReportCard  │          │  │            │ │
│  └────────────────┘  │  │ ReportCard  │          │  └────────────┘ │
│                      │  │ ...         │          │                  │
│                      │  └─────────────┘          │                  │
│                      └───────────────────────────┘                  │
│                                     │                                │
│  ┌──────────────────────────────────┴──────────────────────────────┐ │
│  │                   REPORT DETAIL MODAL                           │ │
│  │  [Full Info] [Photos] [Mini Map] [Verification] [Timeline]     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                     │                                │
│  ┌──────────────────────────────────┴──────────────────────────────┐ │
│  │                 SUBMIT REPORT WIZARD (Modal)                    │ │
│  │  Step 1→2→3→4→5→6  với validation + auto-save mỗi step       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                     │                                │
│                    ┌────────────────┴────────────────┐               │
│                    │      Report Context              │               │
│                    │      (React Context + Reducer)   │               │
│                    └────────────────┬────────────────┘               │
│                                     │                                │
│         ┌───────────────────────────┼───────────────────────┐       │
│         │                           │                       │       │
│  ┌──────┴──────┐         ┌──────────┴──────────┐   ┌───────┴─────┐ │
│  │ Report API  │         │   localStorage      │   │  Validation │ │
│  │ (Mock+Real) │         │   + IndexedDB       │   │   Engine    │ │
│  └─────────────┘         └─────────────────────┘   └─────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Model (Full TypeScript Definitions)

### Core Interfaces

```typescript
// === CORE REPORT ===

interface CommunityReport {
  id: string;                          // crypto.randomUUID()
  type: DisasterType;                  // reuse from @/lib/types
  severity: SeverityLevel;             // reuse from @/lib/types
  status: ReportStatus;

  // Location
  location: ReportLocation;

  // Content
  title: string;                       // 10-100 chars
  description: string;                 // 50-2000 chars
  photos: ReportPhoto[];               // max 5 photos

  // Reporter
  reporter: ReporterInfo;

  // Verification
  verification: VerificationData;

  // Metadata
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
  templateId?: string;                 // if created from template
  isOffline?: boolean;                 // created while offline
  syncStatus: "synced" | "pending";
  reportNumber: number;                // sequential display number
}

interface ReportLocation {
  lat: number;                         // -90 to 90
  lng: number;                         // -180 to 180
  province: string;                    // one of 15 provinces
  district: string;                    // district name
  address: string;                     // full address string
  accuracy?: number;                   // GPS accuracy in meters
}

interface ReportPhoto {
  id: string;                          // crypto.randomUUID()
  data: string;                        // base64 data URL (compressed)
  thumbnail: string;                   // base64 thumbnail (200x200)
  originalSize: number;                // bytes before compression
  compressedSize: number;              // bytes after compression
  width: number;                       // pixel width
  height: number;                      // pixel height
  caption: string;                     // optional caption
  uploadedAt: string;                  // ISO 8601
}

interface ReporterInfo {
  id: string;                          // anonymous UUID from localStorage
  name: string;                        // "" if anonymous
  phone: string;                       // "" if anonymous
  isAnonymous: boolean;
  reportCount: number;                 // total reports by this user
  avgTrustScore: number;               // average trust score of user's reports
  joinedAt: string;                    // first report date
}

interface VerificationData {
  upvotes: number;
  downvotes: number;
  trustScore: number;                  // 0-1, algorithm-calculated
  voterIds: string[];                  // user IDs who voted (prevent double-vote)
  badge: "verified" | "disputed" | null;
  verifiedAt?: string;                 // when badge was earned
  lastVoteAt?: string;                 // most recent vote timestamp
}

type ReportStatus = "pending" | "verified" | "resolved" | "rejected";

// === FILTERS & SORTING ===

interface ReportFilters {
  types: DisasterType[];               // empty = all types
  severities: SeverityLevel[];         // empty = all levels
  provinces: string[];                 // empty = all provinces
  statuses: ReportStatus[];            // empty = all statuses
  verifiedOnly: boolean;               // show only verified
  dateRange: DateRangeFilter;
  sortBy: SortOption;
}

interface DateRangeFilter {
  preset: "1h" | "6h" | "24h" | "7d" | "30d" | "all";
  start: string | null;                // ISO 8601
  end: string | null;                  // ISO 8601
}

type SortOption =
  | "newest"                           // createdAt DESC
  | "oldest"                           // createdAt ASC
  | "mostSevere"                       // severity weight DESC
  | "mostVerified"                     // trustScore DESC
  | "mostVotes"                        // total votes DESC
  | "nearest";                         // distance from user ASC

// === STATS ===

interface ReportStats {
  total: number;
  verified: number;
  pending: number;
  resolved: number;
  rejected: number;
  todayCount: number;
  thisWeekCount: number;
  avgTrustScore: number;
  byType: Record<DisasterType, number>;
  byProvince: Record<string, number>;
  bySeverity: Record<SeverityLevel, number>;
  byStatus: Record<ReportStatus, number>;
  topProvince: { name: string; count: number };
  topType: { type: DisasterType; count: number };
  recentTrend: "increasing" | "stable" | "decreasing";
}

// === TEMPLATES ===

interface ReportTemplate {
  id: string;
  type: DisasterType;
  name: string;                        // "Lũ lụt nhanh"
  nameEn: string;                      // "Quick Flood"
  icon: string;                        // emoji
  color: string;                       // hex color
  titleTemplate: string;               // "Lũ lụt tại {location}"
  descriptionTemplate: string;         // pre-filled description
  severityHint: SeverityLevel;         // suggested severity
  tags: string[];                      // ["flood", "quick", "urban"]
  usageCount: number;                  // how many times used
}

// === WIZARD STATE ===

interface WizardState {
  currentStep: number;                 // 1-6
  direction: 1 | -1;                   // animation direction
  data: WizardFormData;
  errors: Record<string, string>;      // field → error message
  isDirty: boolean;                    // has unsaved changes
  isSubmitting: boolean;
  submitProgress: number;              // 0-100
}

interface WizardFormData {
  // Step 1
  type: DisasterType | null;

  // Step 2
  location: {
    lat: number | null;
    lng: number | null;
    province: string;
    district: string;
    address: string;
    useGPS: boolean;
  };

  // Step 3
  title: string;
  description: string;
  severity: SeverityLevel;

  // Step 4
  photos: ReportPhoto[];

  // Step 5
  reporter: {
    isAnonymous: boolean;
    name: string;
    phone: string;
  };

  // Step 6
  confirmed: boolean;
  templateId?: string;
}
```

---

## Trust Score Algorithm

### Công thức tính Trust Score

```
TrustScore = BaseScore × VoteWeight × TimeDecay × ReporterBonus

Trong đó:
  BaseScore    = (upvotes - downvotes) / max(upvotes + downvotes, 1)
  VoteWeight   = min(1, totalVotes / VERIFICATION_THRESHOLD)
  TimeDecay    = max(0.5, 1 - hoursSinceLastVote / 168)  // decay over 7 days
  ReporterBonus = min(1.2, 0.8 + reporter.avgTrustScore * 0.4)

Final: clamp(BaseScore × VoteWeight × TimeDecay × ReporterBonus, 0, 1)
```

### Verification Thresholds

```typescript
const VERIFICATION_CONFIG = {
  // Number of upvotes needed for "verified" badge
  UPVOTE_THRESHOLD: 5,

  // Minimum trust score for badge
  MIN_TRUST_FOR_BADGE: 0.6,

  // "Disputed" badge if downvotes > upvotes
  DISPUTE_RATIO: 0.6, // downvotes / total > 0.6

  // Maximum votes per user per report
  MAX_VOTES_PER_USER: 1,

  // Vote weight decay after 7 days
  VOTE_DECAY_HOURS: 168,

  // Reporter history bonus multiplier
  REPORTER_BONUS_MIN: 0.8,
  REPORTER_BONUS_MAX: 1.2,
};
```

### Trust Score Calculation (Full Implementation)

```typescript
function calculateTrustScore(
  upvotes: number,
  downvotes: number,
  reporterAvgTrust: number,
  lastVoteAt?: string
): number {
  const total = upvotes + downvotes;

  // Base score: normalized difference
  const baseScore = total === 0 ? 0.5 : (upvotes - downvotes) / total;

  // Vote weight: more votes = more reliable
  const voteWeight = Math.min(1, total / VERIFICATION_CONFIG.UPVOTE_THRESHOLD);

  // Time decay: trust decreases over time without new votes
  const hoursSinceLastVote = lastVoteAt
    ? (Date.now() - new Date(lastVoteAt).getTime()) / (1000 * 60 * 60)
    : 72; // default 3 days if no votes
  const timeDecay = Math.max(
    0.5,
    1 - hoursSinceLastVote / VERIFICATION_CONFIG.VOTE_DECAY_HOURS
  );

  // Reporter bonus: experienced reporters get bonus
  const reporterBonus = Math.min(
    VERIFICATION_CONFIG.REPORTER_BONUS_MAX,
    VERIFICATION_CONFIG.REPORTER_BONUS_MIN + reporterAvgTrust * 0.4
  );

  // Final score
  const raw = baseScore * voteWeight * timeDecay * reporterBonus;
  return Math.max(0, Math.min(1, raw));
}

function determineBadge(trustScore: number, upvotes: number, downvotes: number): "verified" | "disputed" | null {
  const total = upvotes + downvotes;
  if (total < 3) return null; // not enough votes

  if (trustScore >= VERIFICATION_CONFIG.MIN_TRUST_FOR_BADGE &&
      upvotes >= VERIFICATION_CONFIG.UPVOTE_THRESHOLD) {
    return "verified";
  }

  if (total > 0 && downvotes / total > VERIFICATION_CONFIG.DISPUTE_RATIO) {
    return "disputed";
  }

  return null;
}
```

---

## Mock Data Generation Algorithm

### Province Data (Real Coordinates)

```typescript
const PROVINCE_DATA: Record<string, { lat: number; lng: number; districts: string[] }> = {
  "Hà Nội": {
    lat: 21.0285, lng: 105.8542,
    districts: ["Hoàn Kiếm", "Ba Đình", "Đống Đa", "Hai Bà Trưng", "Thanh Xuân", "Long Biên", "Cầu Giấy"]
  },
  "Hồ Chí Minh": {
    lat: 10.8231, lng: 106.6297,
    districts: ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Thủ Đức", "Tân Bình", "Gò Vấp"]
  },
  "Đà Nẵng": {
    lat: 16.0748, lng: 108.223,
    districts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu"]
  },
  "Huế": {
    lat: 16.4637, lng: 107.5909,
    districts: ["Thuận Hóa", "Phú Xuân", "Phong Điền", "Hương Thủy", "Hương Trà"]
  },
  "Cần Thơ": {
    lat: 10.0452, lng: 105.7469,
    districts: ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn", "Thốt Nốt"]
  },
  "Hải Phòng": {
    lat: 20.8449, lng: 106.6881,
    districts: ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An", "Hải An", "Đồ Sơn"]
  },
  "Nha Trang": {
    lat: 12.2388, lng: 109.1967,
    districts: ["Vĩnh Hải", "Vĩnh Phước", "Phương Sài", "Phương Sơn", "Tân Lập"]
  },
  "Đà Lạt": {
    lat: 11.9404, lng: 108.4583,
    districts: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5"]
  },
  "Quảng Bình": {
    lat: 17.4689, lng: 106.6223,
    districts: ["Đồng Hới", "Ba Đồn", "Quảng Trạch", "Bố Trạch", "Quảng Ninh", "Lệ Thủy"]
  },
  "Quảng Nam": {
    lat: 15.8794, lng: 108.3353,
    districts: ["Tam Kỳ", "Hội An", "Đại Lộc", "Điện Bàn", "Duy Xuyên", "Thăng Bình"]
  },
  "Bến Tre": {
    lat: 10.2415, lng: 106.3759,
    districts: ["Bến Tre", "Châu Thành", "Chợ Lách", "Mỏ Cày Nam", "Giồng Trôm"]
  },
  "Trà Vinh": {
    lat: 9.9513, lng: 106.3346,
    districts: ["Trà Vinh", "Càng Long", "Cầu Kè", "Tiểu Cần", "Châu Thành"]
  },
  "Lào Cai": {
    lat: 22.338, lng: 103.8447,
    districts: ["Lào Cai", "Sa Pa", "Bảo Thắng", "Bảo Yên", "Bát Xát"]
  },
  "Yên Bái": {
    lat: 21.7229, lng: 104.8722,
    districts: ["Yên Bái", "Nghĩa Lộ", "Lục Yên", "Văn Yên", "Trấn Yên"]
  },
  "An Giang": {
    lat: 10.5216, lng: 105.1259,
    districts: ["Long Xuyên", "Châu Đốc", "Tân Châu", "Châu Phú", "Thoại Sơn"]
  },
};
```

### Vietnamese Description Templates

```typescript
const DESCRIPTION_TEMPLATES: Record<DisasterType, string[]> = {
  flood: [
    "Mưa lớn kéo dài {days} ngày liên tiếp, mực nước sông dâng cao {height}m so với bình thường. Nhiều khu vực ngập sâu 0.5-1.5m, giao thông tê liệt, người dân phải di tản.",
    "Lũ quét đột ngột sau mưa lớn, nước từ thượng nguồn đổ về nhanh. Nhiều nhà dân bị ngập, tài sản hư hại nặng. Cần cứu hộ khẩn cấp.",
    "Triều cường dâng cao kết hợp mưa lớn gây ngập nặng tại khu vực trũng thấp. Nước ngập vào nhà, nhiều hộ dân phải di chuyển lên tầng cao.",
    "Sông {river} dâng vượt mức báo động cấp 3, đê có nguy cơ vỡ. Chính quyền địa phương đang huy động lực lượng gia cố đê điều.",
    "Ngập úng diện rộng do hệ thống thoát nước quá tải. Đường phố biến thành sông, xe cộ không thể di chuyển.",
  ],
  storm: [
    "Bão số {number} đổ bộ với sức gió cấp {level}, giật cấp {gust}. Nhiều cây cối bị gãy đổ, nhà cửa hư hại, mái tôn bay khắp nơi.",
    "Giông lốc kèm mưa lớn xảy ra đột ngột, tốc mái nhiều nhà dân. Đường dây điện đứt, mất điện diện rộng.",
    "Bão kèm theo mưa to gió lớn, sóng biển cao 3-5m đánh vào bờ. Khu vực ven biển bị ảnh hưởng nặng nề.",
    "Áp thấp nhiệt đới mạnh lên thành bão, đổ bộ vào khu vực {area}. Sức gió mạnh gây hư hại nhiều công trình.",
  ],
  landslide: [
    "Sạt lở đất nghiêm trọng do mưa lớn kéo dài, khối lượng đất đá lớn tràn xuống đường, cô lập nhiều thôn bản. Có người bị mắc kẹt.",
    "Taluy âm sạt lở cắt đứt tuyến đường chính, giao thông bị chia cắt. Nhiều hộ dân sống ven đồi núi phải di tản khẩn cấp.",
    "Đất đá từ triền núi sạt lở vùi lấp nhà dân, lực lượng cứu hộ đang tìm kiếm người mất tích. Tình hình rất nghiêm trọng.",
    "Mưa lớn làm đất bão hòa, sạt lở xảy ra tại nhiều điểm trên tuyến đường {road}. Xe cộ không thể qua lại.",
  ],
  drought: [
    "Hạn hán kéo dài {months} tháng, nước giếng khô cạn, đồng ruộng nứt nẻ. Nông dân mất trắng vụ mùa, thiếu nước sinh hoạt nghiêm trọng.",
    "Xâm nhập mặn sâu vào nội đồng, độ mặn vượt ngưỡng {ppt}‰. Vườn cây ăn trái chết hàng loạt, thiệt hại hàng tỷ đồng.",
    "Thiếu nước sinh hoạt trầm trọng, nhiều hộ dân phải mua nước với giá cao. Hồ chứa nước chỉ còn {percent}% dung tích.",
    "Nắng nóng gay gắt trên 40°C kéo dài, ảnh hưởng nghiêm trọng đến sức khỏe người già và trẻ em. Thiếu nước uống trầm trọng.",
  ],
  earthquake: [
    "Động đất magnitude {mag} xảy ra tại khu vực {area}, rung chấn lan rộng. Nhiều tòa nhà xuất hiện vết nứt, người dân hoảng loạn chạy ra đường.",
    "Run chấn từ trận động đất magnitude {mag} làm đồ vật rơi vỡ, tường nhà nứt. Người dân lo lắng, không dám vào nhà.",
    "Động đất xảy ra lúc {time}, tâm chấn cách {km}km. Cảm nhận rõ rung lắc tại tầng cao, một số công trình bị hư hại nhẹ.",
  ],
  tsunami: [
    "Sóng thần cao {height}m ập vào bờ biển sau trận động đất. Nước biển dâng nhanh, tràn sâu vào đất liền {distance}km.",
    "Cảnh báo sóng thần sau động đất, người dân ven biển đang di tản khẩn cấp lên vùng cao. Tình hình rất cấp bách.",
    "Sóng thần bất ngờ ập vào bãi biển, nhiều du khách và ngư dân bị cuốn. Lực lượng cứu hộ đang tìm kiếm người mất tích.",
  ],
};
```

### Mock Report Title Templates

```typescript
const TITLE_TEMPLATES: Record<DisasterType, string[]> = {
  flood: [
    "Lũ lụt nghiêm trọng tại {district}",
    "Ngập lụt diện rộng ở {province}",
    "Lũ quét bất ngờ tại {district}",
    "Triều cường ngập nặng {province}",
    "Sông dâng cao, ngập sâu {district}",
  ],
  storm: [
    "Bão số {n} đổ bộ {province}",
    "Giông lốc mạnh tại {district}",
    "Bão kèm mưa lớn ở {province}",
    "Lốc xoáy tốc mái {district}",
  ],
  landslide: [
    "Sạt lở đất nghiêm trọng tại {district}",
    "Sạt lở cắt đứt đường ở {province}",
    "Đất trùm nhà dân tại {district}",
    "Sạt lở taluy âm ở {province}",
  ],
  drought: [
    "Hạn hán nghiêm trọng tại {province}",
    "Xâm nhập mặn sâu ở {district}",
    "Thiếu nước sinh hoạt tại {province}",
    "Nắng nóng gay gắt {district}",
  ],
  earthquake: [
    "Động đất magnitude {mag} tại {province}",
    "Run chấn mạnh felt tại {district}",
    "Động đất làm nứt nhà ở {province}",
  ],
  tsunami: [
    "Sóng thần tấn công bờ biển {province}",
    "Cảnh báo sóng thần tại {district}",
    "Sóng biển cao bất thường ở {province}",
  ],
};
```

### Distribution Algorithm

```typescript
function generateMockReports(count: number): CommunityReport[] {
  const reports: CommunityReport[] = [];
  const now = Date.now();

  // Distribution ratios
  const typeDistribution: [DisasterType, number][] = [
    ["flood", 0.35],
    ["storm", 0.20],
    ["landslide", 0.15],
    ["drought", 0.12],
    ["earthquake", 0.10],
    ["tsunami", 0.08],
  ];

  const statusDistribution: [ReportStatus, number][] = [
    ["pending", 0.45],
    ["verified", 0.30],
    ["resolved", 0.18],
    ["rejected", 0.07],
  ];

  const severityDistribution: [SeverityLevel, number][] = [
    ["critical", 0.15],
    ["high", 0.30],
    ["medium", 0.35],
    ["low", 0.20],
  ];

  for (let i = 0; i < count; i++) {
    const type = weightedRandom(typeDistribution);
    const status = weightedRandom(statusDistribution);
    const severity = weightedRandom(severityDistribution);
    const province = randomProvince();
    const district = randomDistrict(province);

    // Random timestamp within last 30 days
    const createdAt = new Date(
      now - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Verification based on status
    const verification = generateVerification(status);

    // Reporter
    const reporter = generateReporter();

    reports.push({
      id: crypto.randomUUID(),
      type,
      severity,
      status,
      location: generateLocation(province, district),
      title: generateTitle(type, province, district),
      description: generateDescription(type, province, district),
      photos: generatePhotos(Math.floor(Math.random() * 4)),
      reporter,
      verification,
      createdAt,
      updatedAt: createdAt,
      syncStatus: "synced",
      reportNumber: i + 1,
    });
  }

  return reports.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

---

## Photo Compression Algorithm

```typescript
const PHOTO_CONFIG = {
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
  QUALITY: 0.7,              // JPEG quality
  THUMBNAIL_SIZE: 200,       // 200x200 thumbnail
  MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB
  MAX_PHOTOS: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
};

async function compressPhoto(file: File): Promise<ReportPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > PHOTO_CONFIG.MAX_WIDTH) {
          height = (height * PHOTO_CONFIG.MAX_WIDTH) / width;
          width = PHOTO_CONFIG.MAX_WIDTH;
        }
        if (height > PHOTO_CONFIG.MAX_HEIGHT) {
          width = (width * PHOTO_CONFIG.MAX_HEIGHT) / height;
          height = PHOTO_CONFIG.MAX_HEIGHT;
        }

        // Draw compressed image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const compressedData = canvas.toDataURL("image/jpeg", PHOTO_CONFIG.QUALITY);

        // Generate thumbnail
        const thumbCanvas = document.createElement("canvas");
        const thumbSize = PHOTO_CONFIG.THUMBNAIL_SIZE;
        thumbCanvas.width = thumbSize;
        thumbCanvas.height = thumbSize;
        const thumbCtx = thumbCanvas.getContext("2d")!;
        const scale = Math.max(thumbSize / img.width, thumbSize / img.height);
        const sx = (img.width - thumbSize / scale) / 2;
        const sy = (img.height - thumbSize / scale) / 2;
        thumbCtx.drawImage(img, sx, sy, thumbSize / scale, thumbSize / scale, 0, 0, thumbSize, thumbSize);
        const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.6);

        resolve({
          id: crypto.randomUUID(),
          data: compressedData,
          thumbnail: thumbnailData,
          originalSize: file.size,
          compressedSize: Math.round(compressedData.length * 0.75), // base64 overhead
          width: Math.round(width),
          height: Math.round(height),
          caption: "",
          uploadedAt: new Date().toISOString(),
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

## Validation Engine

### Per-Step Validation Rules

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// Step 1: Disaster Type
function validateStep1(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.type) {
    errors.type = "Vui lòng chọn loại thiên tai";
  }
  return { isValid: Object.keys(errors).length === 0, errors, warnings: {} };
}

// Step 2: Location
function validateStep2(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!data.location.lat || !data.location.lng) {
    errors.location = "Vui lòng chọn vị trí trên bản đồ hoặc dùng GPS";
  }
  if (!data.location.province) {
    errors.province = "Vui lòng chọn tỉnh/thành phố";
  }
  if (!data.location.address || data.location.address.length < 5) {
    errors.address = "Vui lòng nhập địa chỉ chi tiết (tối thiểu 5 ký tự)";
  }
  // Check if location is within Vietnam bounds
  if (data.location.lat && (data.location.lat < 8 || data.location.lat > 23)) {
    warnings.location = "Vị trí có vẻ ngoài lãnh thổ Việt Nam";
  }
  if (data.location.lng && (data.location.lng < 102 || data.location.lng > 110)) {
    warnings.location = "Vị trí có vẻ ngoài lãnh thổ Việt Nam";
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// Step 3: Details
function validateStep3(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!data.title || data.title.length < 10) {
    errors.title = "Tiêu đề tối thiểu 10 ký tự";
  }
  if (data.title && data.title.length > 100) {
    errors.title = "Tiêu đề tối đa 100 ký tự";
  }
  if (!data.description || data.description.length < 50) {
    errors.description = "Mô tả tối thiểu 50 ký tự";
  }
  if (data.description && data.description.length > 2000) {
    errors.description = "Mô tả tối đa 2000 ký tự";
  }
  if (!data.severity) {
    errors.severity = "Vui lòng chọn mức độ nghiêm trọng";
  }
  // Warning if description is short
  if (data.description && data.description.length < 100) {
    warnings.description = "Mô tả chi tiết hơn sẽ giúp xác minh nhanh hơn";
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// Step 4: Photos (optional)
function validateStep4(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (data.photos.length === 0) {
    warnings.photos = "Thêm ảnh sẽ tăng độ tin cậy của báo cáo";
  }
  if (data.photos.length > PHOTO_CONFIG.MAX_PHOTOS) {
    errors.photos = `Tối đa ${PHOTO_CONFIG.MAX_PHOTOS} ảnh`;
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// Step 5: Contact (optional)
function validateStep5(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.reporter.isAnonymous) {
    if (!data.reporter.name || data.reporter.name.length < 2) {
      errors.name = "Vui lòng nhập tên hoặc chọn ẩn danh";
    }
    if (data.reporter.phone && !/^(0|\+84)[0-9]{9}$/.test(data.reporter.phone)) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings: {} };
}

// Step 6: Confirmation
function validateStep6(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.confirmed) {
    errors.confirmed = "Vui lòng xác nhận thông tin trước khi gửi";
  }
  return { isValid: Object.keys(errors).length === 0, errors, warnings: {} };
}
```

### XSS Prevention

```typescript
function sanitizeInput(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

function sanitizeReport(report: CommunityReport): CommunityReport {
  return {
    ...report,
    title: sanitizeInput(report.title),
    description: sanitizeInput(report.description),
    location: {
      ...report.location,
      address: sanitizeInput(report.location.address),
      district: sanitizeInput(report.location.district),
    },
    reporter: {
      ...report.reporter,
      name: sanitizeInput(report.reporter.name),
    },
  };
}
```

---

## localStorage Schema

```typescript
// Keys
const STORAGE_KEYS = {
  REPORTS: "cuunet-reports",              // CommunityReport[]
  MY_REPORTS: "cuunet-my-reports",        // string[] (report IDs)
  USER_ID: "cuunet-user-id",              // string (UUID)
  USER_VOTES: "cuunet-user-votes",        // Record<string, "up" | "down">
  DRAFT: "cuunet-report-draft",           // WizardFormData
  FILTERS: "cuunet-report-filters",       // ReportFilters
  LAST_SYNC: "cuunet-last-sync",          // ISO timestamp
};

// IndexedDB
const DB_NAME = "cuunet-community-report";
const DB_VERSION = 1;
const PHOTO_STORE = "photos";             // ReportPhoto objects

// Max localStorage size management
const MAX_REPORTS_IN_STORAGE = 200;       // keep last 200 reports
const CLEANUP_THRESHOLD = 180;            // cleanup when > 180
```

---

## Implementation Plan (18 Tasks)

### Phase 3A: Foundation & Types (Tasks 1-4)

#### Task 1: Create Report TypeScript Types
**File:** `src/features/community-report/lib/types.ts` (~200 lines)

All interfaces defined in Data Model section above:
- CommunityReport, ReportLocation, ReportPhoto, ReporterInfo, VerificationData
- ReportStatus, ReportFilters, DateRangeFilter, SortOption
- ReportStats, ReportTemplate, WizardState, WizardFormData
- ReportAction (16 action types)
- Component props interfaces

#### Task 2: Create Report Config
**File:** `src/features/community-report/config/report-config.ts` (~250 lines)

```typescript
export const REPORT_CONFIG = {
  PAGE_SIZE: 20,                         // reports per page
  AUTO_REFRESH_INTERVAL: 30_000,         // 30 seconds
  MAX_PHOTOS: 5,
  MAX_PHOTO_SIZE: 5 * 1024 * 1024,       // 5MB
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DESCRIPTION_LENGTH: 50,
  AUTO_SAVE_INTERVAL: 5_000,             // 5 seconds
  DEBOUNCE_SEARCH: 300,                  // 300ms
  SKELETON_COUNT: 3,                     // loading skeleton cards
  TOAST_DURATION: 5_000,                 // 5 seconds
};

export const VERIFICATION_CONFIG = { /* as defined above */ };
export const PHOTO_CONFIG = { /* as defined above */ };
export const REPORT_TEMPLATES: ReportTemplate[] = [ /* 6 templates */ ];
export const STATUS_CONFIG: Record<ReportStatus, { icon: string; label: string; color: string; bgColor: string }> = { /* */ };
export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};
```

#### Task 3: Create Mock Data Generator
**File:** `src/features/community-report/lib/mock-data.ts` (~400 lines)

Full implementation with:
- PROVINCE_DATA with real coordinates + districts
- DESCRIPTION_TEMPLATES (5-6 Vietnamese descriptions per type)
- TITLE_TEMPLATES (4-5 titles per type)
- generateMockReports(count): CommunityReport[]
- generateLocation(province, district): ReportLocation
- generateVerification(status): VerificationData
- generateReporter(): ReporterInfo
- generatePhotos(count): ReportPhoto[]
- weightedRandom<T>(distribution): T helper
- randomProvince(), randomDistrict(province) helpers
- MOCK_REPORT_COUNT: 80

#### Task 4: Create Validation Engine
**File:** `src/features/community-report/lib/validation.ts` (~200 lines)

- validateStep1-6(data): ValidationResult (as defined above)
- validateFullReport(report): ValidationResult
- sanitizeInput(text): string
- sanitizeReport(report): CommunityReport
- validatePhoto(file): { valid: boolean; error?: string }
- ValidationResult interface

---

### Phase 3B: State Management & API (Tasks 5-7)

#### Task 5: Create Report Context
**File:** `src/features/community-report/lib/report-context.tsx` (~350 lines)

- ReportProvider with useReducer
- useReport() hook
- reportReducer with 16 action handlers
- initializeState() - load from localStorage + merge mock data
- saveToStorage() - persist to localStorage
- calculateStats(reports): ReportStats
- applyFilters(reports, filters, search): CommunityReport[]
- generateReportId(): string

**Reducer implementation pattern:**
```typescript
function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case "SET_REPORTS":
      return { ...state, reports: action.payload, stats: calculateStats(action.payload) };
    case "ADD_REPORT": {
      const updated = [action.payload, ...state.reports];
      return { ...state, reports: updated, stats: calculateStats(updated) };
    }
    case "VOTE_REPORT": {
      const { reportId, voteType, userId } = action.payload;
      const updated = state.reports.map(r => {
        if (r.id !== reportId) return r;
        const newVerification = applyVote(r.verification, voteType, userId);
        return { ...r, verification: newVerification, updatedAt: new Date().toISOString() };
      });
      return { ...state, reports: updated, stats: calculateStats(updated) };
    }
    // ... 13 more cases
  }
}
```

#### Task 6: Create Report API
**File:** `src/features/community-report/api/report-api.ts` (~300 lines)

- fetchReports(filters, page, limit): Promise<PaginatedReports>
- fetchReportById(id): Promise<CommunityReport | null>
- submitReport(data: WizardFormData): Promise<CommunityReport>
- updateReport(id, updates): Promise<CommunityReport>
- deleteReport(id): Promise<boolean>
- voteReport(reportId, voteType, userId): Promise<CommunityReport>
- searchReports(query, filters): Promise<CommunityReport[]>
- getReportStats(): Promise<ReportStats>
- getMyReports(userId): Promise<CommunityReport[]>
- saveDraft(draft: WizardFormData): void
- loadDraft(): WizardFormData | null
- clearDraft(): void
- getUserId(): string (generate if not exists)
- getUserVotes(): Record<string, "up" | "down">
- saveUserVotes(votes): void

#### Task 7: Create Report Hooks
**File:** `src/features/community-report/lib/use-report-hooks.ts` (~350 lines)

8 custom hooks:

```typescript
// 1. useReportSubmit() - submission logic
function useReportSubmit() {
  // submit(data: WizardFormData): Promise<boolean>
  // isSubmitting: boolean
  // submitProgress: number (0-100)
  // submitError: string | null
}

// 2. useReportFilters() - filter management
function useReportFilters() {
  // filters: ReportFilters
  // setFilter(key, value): void
  // resetFilters(): void
  // activeFilterCount: number
  // filteredReports: CommunityReport[]
  // debouncedSearch: string
}

// 3. useReportVotes() - voting with optimistic update
function useReportVotes() {
  // vote(reportId: string, type: "up" | "down"): void
  // hasVoted(reportId): "up" | "down" | null
  // canVote(reportId): boolean
  // isVoting: boolean
}

// 4. useGeolocation() - GPS + reverse geocoding
function useGeolocation() {
  // position: { lat, lng } | null
  // accuracy: number | null
  // isLoading: boolean
  // error: string | null
  // getCurrentPosition(): Promise<void>
  // reverseGeocode(lat, lng): Promise<{ province, district, address }>
}

// 5. usePhotoUpload() - photo handling
function usePhotoUpload() {
  // photos: ReportPhoto[]
  // addPhotos(files: FileList): Promise<void>
  // removePhoto(id: string): void
  // reorderPhotos(fromIndex, toIndex): void
  // isProcessing: boolean
  // totalSize: number
}

// 6. useAutoSave() - draft persistence
function useAutoSave(data: WizardFormData, enabled: boolean) {
  // lastSaved: Date | null
  // save(): void
  // clear(): void
  // hasDraft: boolean
  // loadDraft(): WizardFormData | null
}

// 7. useOfflineSync() - offline support
function useOfflineSync() {
  // isOnline: boolean
  // pendingCount: number
  // syncPending(): Promise<void>
  // offlineSince: Date | null
}

// 8. useToast() - notification toasts
function useToast() {
  // toasts: Toast[]
  // showToast(message, type): void
  // dismissToast(id): void
}
```

---

### Phase 3C: UI Components - Core (Tasks 8-12)

#### Task 8: Create ReportCard Component
**File:** `src/features/community-report/ui/ReportCard.tsx` (~280 lines)

**Animation variants:**
```typescript
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const voteVariants = {
  tap: { scale: 0.85 },
  voted: { scale: [1, 1.3, 1], transition: { duration: 0.3 } },
};
```

**Sub-components:**
- ReportCardHeader: type icon + title + severity badge + status badge
- ReportCardBody: location + time + truncated description
- ReportCardMeta: photo count + vote buttons + trust score bar + reporter info
- TrustScoreBar: animated progress bar with color interpolation
- VoteButton: icon button with optimistic animation
- TimeAgo: relative time display ("2 giờ trước")

#### Task 9: Create ReportFeed Component
**File:** `src/features/community-report/ui/ReportFeed.tsx` (~300 lines)

**Infinite scroll implementation:**
```typescript
function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    if (node) observerRef.current.observe(node);
  }, [callback, hasMore]);
  return sentinelRef;
}
```

**Sub-components:**
- ReportFeedHeader: count + sort dropdown + view toggle
- ReportFeedGrid: responsive grid container
- ReportFeedSkeleton: 3 skeleton cards with pulse
- ReportFeedEmpty: illustration + "Chưa có báo cáo" + reset filters CTA
- NewReportsBadge: floating banner "X báo cáo mới" with slide-in animation
- LoadMoreSentinel: invisible div for IntersectionObserver

#### Task 10: Create ReportDetailModal Component
**File:** `src/features/community-report/ui/ReportDetailModal.tsx` (~400 lines)

**Modal animation:**
```typescript
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 200 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.3 } },
};
```

**Sub-components:**
- DetailHeader: close button + type icon + title + severity + status
- PhotoGallery: horizontal scroll + click → fullscreen lightbox
- PhotoLightbox: full-screen overlay with zoom + swipe
- DetailLocation: address + mini Leaflet map
- DetailDescription: full text with paragraphs
- VerificationSection: upvote/downvote buttons + trust gauge + badge
- TrustGauge: SVG circular gauge (reuse pattern from RiskGauge)
- TimelineSection: vertical timeline with animated entries
- ActionButtons: verify + dispute + flag + share

#### Task 11: Create SubmitWizard Component
**File:** `src/features/community-report/ui/SubmitWizard.tsx` (~500 lines)

**Wizard step animation:**
```typescript
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0, opacity: 1,
    transition: { type: "spring", damping: 25, stiffness: 200 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};
```

**Sub-components:**
- WizardHeader: step indicator (6 dots + labels + progress line)
- WizardNavigation: back/next/submit buttons
- Step1DisasterType: 6 type cards in 2x3 grid
- Step2Location: GPS button + Leaflet map picker + province dropdown + address input
- Step3Details: title input + severity slider + description textarea + character counter
- Step4Photos: drag & drop zone + photo grid + remove/reorder
- Step5Contact: anonymous toggle + name + phone inputs
- Step6Review: full summary card + confirmation checkbox
- StepIndicator: animated progress dots
- SuccessOverlay: checkmark animation + "Báo cáo đã gửi thành công!"

#### Task 12: Create ReportMap Component
**File:** `src/features/community-report/ui/ReportMap.tsx` (~300 lines)

**Marker styling:**
```typescript
const SEVERITY_MARKER_CONFIG: Record<SeverityLevel, { radius: number; color: string; glow: string }> = {
  critical: { radius: 12, color: "#EF4444", glow: "rgba(239,68,68,0.4)" },
  high:     { radius: 10, color: "#F97316", glow: "rgba(249,115,22,0.4)" },
  medium:   { radius: 8,  color: "#EAB308", glow: "rgba(234,179,8,0.4)" },
  low:      { radius: 6,  color: "#22C55E", glow: "rgba(34,197,94,0.4)" },
};
```

**Sub-components:**
- ReportMapContainer: MapContainer + TileLayer (CartoDB Dark)
- ReportMarker: CircleMarker with popup
- ReportPopup: mini card in popup (type + title + severity + "Xem chi tiết" button)
- MapLegend: severity color scale overlay
- MapFilters: compact filter bar overlay on map
- FlyToProvince: auto-fly when province selected

---

### Phase 3D: UI Components - Supporting (Tasks 13-15)

#### Task 13: Create ReportFilters Component
**File:** `src/features/community-report/ui/ReportFilters.tsx` (~300 lines)

**Sub-components:**
- FilterSearch: debounced search input with icon
- FilterSection: collapsible section wrapper (animated height)
- FilterCheckbox: checkbox + label + count badge
- FilterTypeSection: 6 disaster type checkboxes
- FilterSeveritySection: 4 severity checkboxes
- FilterProvinceSection: multi-select dropdown with search
- FilterStatusSection: 4 status checkboxes
- FilterVerifiedToggle: switch component
- FilterDateSection: preset buttons (1h, 6h, 24h, 7d, 30d, all)
- ActiveFilterBadge: count of active filters
- ClearFiltersButton: reset all filters
- MobileFilterDrawer: slide-in drawer for mobile

#### Task 14: Create ReportStatsBar Component
**File:** `src/features/community-report/ui/ReportStatsBar.tsx` (~250 lines)

Reuse AnimatedCounter pattern from PredictStatsBar.

**6 stat cards:**
1. 📊 Tổng báo cáo: total count, blue
2. ✅ Đã xác minh: verified count + percentage, green
3. ⏳ Chờ xác minh: pending count, amber
4. 📅 Hôm nay: todayCount, cyan
5. 🌊 Loại phổ biến: top type icon + label + count, purple
6. 📍 Tỉnh nhiều nhất: top province name + count, red

**Animation:**
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};
```

#### Task 15: Create MyReportsPanel Component
**File:** `src/features/community-report/ui/MyReportsPanel.tsx` (~250 lines)

**Sub-components:**
- MyReportsHeader: title + count + "Gửi mới" button
- MyReportCard: compact card (type icon + title + status + date + trust score)
- MyReportActions: edit/delete dropdown
- MyStatsSection: personal stats (total, verified %, avg trust, top province)
- MyReportsEmpty: empty state with CTA to submit first report
- SubmitNewButton: animated button → opens wizard

---

### Phase 3E: Page Assembly & Verification (Tasks 16-18)

#### Task 16: Create Report Page
**File:** `src/app/report/page.tsx` (~500 lines)

**Layout structure:**
```tsx
<ReportProvider>
  <div className="min-h-screen">
    {/* Header */}
    <ReportHeader onNewReport={() => dispatch({ type: "TOGGLE_WIZARD", payload: true })} />

    {/* Stats Bar */}
    <ReportStatsBar stats={state.stats} className="mb-6" />

    {/* Main Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Filters Sidebar - hidden on mobile, shown in drawer */}
      <aside className="hidden lg:block lg:col-span-3">
        <ReportFilters />
      </aside>

      {/* Main Content */}
      <main className="col-span-1 lg:col-span-6">
        <AnimatePresence mode="wait">
          {state.viewMode === "feed" ? (
            <ReportFeed key="feed" />
          ) : (
            <ReportMap key="map" />
          )}
        </AnimatePresence>
      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:block lg:col-span-3">
        <MyReportsPanel />
      </aside>
    </div>

    {/* Modals */}
    <AnimatePresence>
      {state.isDetailModalOpen && <ReportDetailModal />}
      {state.isSubmitWizardOpen && <SubmitWizard />}
    </AnimatePresence>

    {/* Mobile Filter Drawer */}
    <MobileFilterDrawer />

    {/* Toast Notifications */}
    <ToastContainer />
  </div>
</ReportProvider>
```

**Dynamic imports (ssr: false):**
- ReportMap (Leaflet)
- ReportDetailModal (Leaflet mini map)
- SubmitWizard (Leaflet map picker)

#### Task 17: Create Loading & Error States
**Files:**
- `src/app/report/loading.tsx` (~40 lines)
- `src/app/report/error.tsx` (~55 lines)

#### Task 18: Verify & Polish

**Checklist (25 items):**
1. [ ] `npm run build` - zero errors across all 9 routes
2. [ ] `/report` page loads with 80+ mock reports
3. [ ] Feed view: cards render with stagger animation
4. [ ] Feed view: infinite scroll loads more (20 per page)
5. [ ] Feed view: search filters results (debounced 300ms)
6. [ ] Feed view: sort changes order (6 sort options)
7. [ ] Map view: markers show correct positions (15 provinces)
8. [ ] Map view: marker size/color reflects severity
9. [ ] Map view: click marker → popup with summary
10. [ ] Map view: filter markers by type/severity
11. [ ] Detail modal: shows full report info
12. [ ] Detail modal: photo gallery with lightbox
13. [ ] Detail modal: mini map shows location
14. [ ] Detail modal: vote up/down updates trust score
15. [ ] Detail modal: trust gauge animates
16. [ ] Submit wizard: all 6 steps work sequentially
17. [ ] Submit wizard: GPS location detection works
18. [ ] Submit wizard: photo upload with compression
19. [ ] Submit wizard: validation prevents empty submit
20. [ ] Submit wizard: submit → report appears in feed
21. [ ] My Reports: shows user's submitted reports
22. [ ] Stats bar: animated counters match data
23. [ ] Filters: all filter types work correctly
24. [ ] localStorage: data persists after page refresh
25. [ ] Responsive: mobile (375px) to desktop (1920px)

---

## File Structure After Phase 3

```
src/
├── app/
│   └── report/
│       ├── page.tsx                          # REWRITE (Task 16) ~500 lines
│       ├── loading.tsx                       # CREATE (Task 17) ~40 lines
│       └── error.tsx                         # CREATE (Task 17) ~55 lines
├── features/
│   ├── community-report/
│   │   ├── api/
│   │   │   └── report-api.ts                 # CREATE (Task 6) ~300 lines
│   │   ├── config/
│   │   │   └── report-config.ts              # CREATE (Task 2) ~250 lines
│   │   ├── lib/
│   │   │   ├── types.ts                      # CREATE (Task 1) ~200 lines
│   │   │   ├── mock-data.ts                  # CREATE (Task 3) ~400 lines
│   │   │   ├── validation.ts                 # CREATE (Task 4) ~200 lines
│   │   │   ├── report-context.tsx            # CREATE (Task 5) ~350 lines
│   │   │   └── use-report-hooks.ts           # CREATE (Task 7) ~350 lines
│   │   └── ui/
│   │       ├── ReportCard.tsx                # CREATE (Task 8) ~280 lines
│   │       ├── ReportFeed.tsx                # CREATE (Task 9) ~300 lines
│   │       ├── ReportDetailModal.tsx         # CREATE (Task 10) ~400 lines
│   │       ├── SubmitWizard.tsx              # CREATE (Task 11) ~500 lines
│   │       ├── ReportMap.tsx                 # CREATE (Task 12) ~300 lines
│   │       ├── ReportFilters.tsx             # CREATE (Task 13) ~300 lines
│   │       ├── ReportStatsBar.tsx            # CREATE (Task 14) ~250 lines
│   │       └── MyReportsPanel.tsx            # CREATE (Task 15) ~250 lines
│   ├── map-disaster/                         # (Phase 1)
│   ├── predict/                              # (Phase 2)
│   └── ...
├── lib/
│   ├── types.ts                              # (existing)
│   └── utils.ts                              # (existing)
└── data/
    └── disaster-data.ts                      # (existing)

Total new files: 18
Total estimated lines: ~5,400+
```

---

## Dependencies

### Không cần install thêm packages!

Phase 3 sử dụng hoàn toàn dependencies hiện có:
- **framer-motion** - animations (variants, AnimatePresence, layoutId)
- **leaflet** + **react-leaflet** - map (MapContainer, CircleMarker, Popup)
- **recharts** - statistics charts (PieChart, BarChart)
- **lucide-react** - icons (Camera, MapPin, ThumbsUp, Shield, etc.)
- **clsx** + **tailwind-merge** - classnames

**Browser APIs:**
- Geolocation API - GPS positioning
- File API + Canvas API - photo upload + compression
- IntersectionObserver - infinite scroll
- localStorage - data persistence
- Notification API - optional browser notifications

---

## Design Tokens

### Colors
```
Report Card:     bg-slate-900/50 + backdrop-blur + border-slate-800/50
Severity:        critical=#EF4444, high=#F97316, medium=#EAB308, low=#22C55E
Status:          pending=#F59E0B, verified=#22C55E, resolved=#3B82F6, rejected=#EF4444
Trust Score:     0-0.3=#EF4444, 0.3-0.6=#EAB308, 0.6-0.85=#84CC16, 0.85-1=#22C55E
Wizard Steps:    active=#3B82F6, completed=#22C55E, pending=#475569
Upload Zone:     border-dashed border-slate-600, hover:border-blue-500, drag:border-green-500
Vote Buttons:    up=#22C55E, down=#EF4444, neutral=#64748B
Toast:           success=#22C55E, error=#EF4444, info=#3B82F6, warning=#F59E0B
```

### Typography
```
Card Title:      text-base font-semibold text-slate-200
Description:     text-sm text-slate-400 line-clamp-3
Stats Value:     text-2xl font-bold
Stats Label:     text-[10px] text-slate-500 uppercase tracking-wider
Wizard Step:     text-sm font-medium
Filter Label:    text-xs text-slate-500 uppercase tracking-wider
Modal Title:     text-lg font-bold text-slate-100
```

### Animation (Framer Motion)
```
Card entrance:   { y: 20→0, opacity: 0→1, duration: 0.4s, ease: [0.22,1,0.36,1] }
Card stagger:    { staggerChildren: 0.05, delayChildren: 0.1 }
Modal overlay:   { opacity: 0→1, duration: 0.2s }
Modal content:   { x: "100%"→0, type: "spring", damping: 25, stiffness: 200 }
Wizard step:     { x: direction*300→0, type: "spring", damping: 25, stiffness: 200 }
Vote tap:        { scale: 0.85 }
Vote success:    { scale: [1, 1.3, 1], duration: 0.3s }
Filter collapse: { height: 0→auto, opacity: 0→1, duration: 0.2s }
Toast enter:     { y: -100→0, opacity: 0→1, type: "spring", damping: 20 }
Toast exit:      { opacity: 0, x: 100, duration: 0.2s }
Success check:   { scale: 0→1, rotate: -180→0, type: "spring", damping: 10 }
```

### Responsive Breakpoints
```
Mobile (<640px):   1 col, full-width cards, bottom sheet modals, hamburger filters
Tablet (640-1024): 2 col grid, slide-in drawers, smaller cards
Desktop (>1024px): 3 col layout (filters | content | sidebar), side modals
```

---

## Innovation Points (Thesis Impressiveness)

1. **Crowd-sourced Intelligence** - Dữ liệu từ cộng đồng bổ sung cho AI prediction
2. **Trust Score Algorithm** - Công thức toán học: BaseScore × VoteWeight × TimeDecay × ReporterBonus
3. **Multi-step Wizard UX** - 6 bước với validation, auto-save, animated transitions
4. **Offline-first Architecture** - localStorage + draft auto-save + sync indicator
5. **Real-time Simulation** - Mock data generation mỗi 30 giây
6. **Client-side Photo Processing** - Canvas API compression + thumbnail generation
7. **Community Verification** - Upvote/downvote + badge system + trust gauge
8. **Map + Feed Dual View** - Toggle với shared state + AnimatePresence
9. **AI-assisted Severity** - Keyword analysis gợi ý mức độ
10. **API-ready Architecture** - Mock localStorage nhưng code structure ready cho REST API

---

## Scope Boundaries

**INCLUDED:**
- Report submission wizard (6 steps with validation)
- Real-time report feed with infinite scroll + filters + search + sort
- Report map view with severity-colored markers
- Report detail modal with photo lightbox + mini map + timeline
- Community verification (upvote/downvote/trust score/badge)
- Report statistics (6 animated stat cards)
- My reports panel with personal stats
- Mock data (80+ reports with Vietnamese content)
- localStorage persistence
- Offline draft saving
- Photo upload with Canvas API compression
- Toast notification system
- Responsive dark-themed UI

**EXCLUDED:**
- Real backend / database / API
- User authentication (anonymous UUID)
- Push notifications (only in-app toast)
- Video upload
- Report editing after submission
- Admin moderation panel
- Email/SMS alerts
- Real-time WebSocket (simulated with setInterval)
- Leaflet.markercluster (custom implementation instead)

---

## Execution Order

```
Phase 3A: Task 1 → 2 → 3 → 4 (Types, Config, Mock Data, Validation)
Phase 3B: Task 5 → 6 → 7 (Context, API, Hooks)
Phase 3C: Task 8 → 9 → 10 → 11 → 12 (Core UI)
Phase 3D: Task 13 → 14 → 15 (Supporting UI)
Phase 3E: Task 16 → 17 → 18 (Page Assembly + Verify)
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage limit (~5MB) | Can't store many photos | Compress to <200KB each, max 5 photos per report, max 200 reports in storage |
| Too many DOM nodes in feed | Slow render | Pagination (20 per page), virtual scroll if needed |
| Leaflet SSR error | Build fails | `next/dynamic` with `ssr: false` for all map components |
| Photo upload on mobile | Bad UX | Camera capture API (`accept="image/*" capture="environment"`), auto-compress |
| Mock data feels fake | Low thesis value | Real Vietnamese descriptions, real coordinates, realistic timestamps |
| Form state lost on navigate | User frustration | Auto-save draft every 5 seconds to localStorage |
| Vote spam | Fake verification | One vote per user ID per report, stored in localStorage |
| Wizard step validation | Confusing errors | Per-step validation with clear Vietnamese error messages |
| Large base64 photos in state | Memory bloat | Store thumbnails in state, full photos in IndexedDB |

---

## Verification Checklist (Final - 25 Items)

1. [ ] `npm run build` - zero errors across all 9 routes
2. [ ] `/report` page loads with 80+ mock reports
3. [ ] Feed view: cards render with stagger animation
4. [ ] Feed view: infinite scroll loads more (20 per page)
5. [ ] Feed view: search filters results (debounced 300ms)
6. [ ] Feed view: sort changes order (6 sort options)
7. [ ] Map view: markers show correct positions (15 provinces)
8. [ ] Map view: marker size/color reflects severity
9. [ ] Map view: click marker → popup with summary
10. [ ] Map view: filter markers by type/severity
11. [ ] Detail modal: shows full report info
12. [ ] Detail modal: photo gallery with lightbox
13. [ ] Detail modal: mini map shows location
14. [ ] Detail modal: vote up/down updates trust score
15. [ ] Detail modal: trust gauge animates
16. [ ] Submit wizard: all 6 steps work sequentially
17. [ ] Submit wizard: GPS location detection works
18. [ ] Submit wizard: photo upload with compression
19. [ ] Submit wizard: validation prevents empty submit
20. [ ] Submit wizard: submit → report appears in feed
21. [ ] My Reports: shows user's submitted reports
22. [ ] Stats bar: animated counters match data
23. [ ] Filters: all filter types work correctly
24. [ ] localStorage: data persists after page refresh
25. [ ] Responsive: mobile (375px) to desktop (1920px)
