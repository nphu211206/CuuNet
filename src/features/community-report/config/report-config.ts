import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  ReportStatus,
  ReportTemplate,
  BadgeType,
  DatePreset,
  ToastType,
} from "../lib/types";

// === REPORT CONFIG ===

export const REPORT_CONFIG = {
  /** Reports per page for infinite scroll */
  PAGE_SIZE: 20,

  /** Auto-refresh interval in milliseconds */
  AUTO_REFRESH_INTERVAL: 30_000,

  /** Maximum photos per report */
  MAX_PHOTOS: 5,

  /** Maximum photo file size in bytes (5MB) */
  MAX_PHOTO_SIZE: 5 * 1024 * 1024,

  /** Maximum title length */
  MAX_TITLE_LENGTH: 100,

  /** Minimum title length */
  MIN_TITLE_LENGTH: 10,

  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,

  /** Minimum description length */
  MIN_DESCRIPTION_LENGTH: 50,

  /** Auto-save draft interval in milliseconds */
  AUTO_SAVE_INTERVAL: 5_000,

  /** Search debounce delay in milliseconds */
  DEBOUNCE_SEARCH: 300,

  /** Number of skeleton cards during loading */
  SKELETON_COUNT: 3,

  /** Toast notification duration in milliseconds */
  TOAST_DURATION: 5_000,

  /** Maximum reports stored in localStorage */
  MAX_REPORTS_IN_STORAGE: 200,

  /** Cleanup threshold - remove oldest when exceeding */
  CLEANUP_THRESHOLD: 180,

  /** Simulated new report interval in milliseconds */
  SIMULATED_REPORT_INTERVAL: 45_000,

  /** Maximum reports to generate for mock data */
  MOCK_REPORT_COUNT: 80,
};

// === PHOTO CONFIG ===

export const PHOTO_CONFIG = {
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
  QUALITY: 0.7,
  THUMBNAIL_SIZE: 200,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_PHOTOS: 5,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
};

// === VERIFICATION CONFIG ===

export const VERIFICATION_CONFIG = {
  /** Number of upvotes needed for "verified" badge */
  UPVOTE_THRESHOLD: 5,

  /** Minimum trust score for badge */
  MIN_TRUST_FOR_BADGE: 0.6,

  /** "Disputed" badge if downvotes ratio exceeds this */
  DISPUTE_RATIO: 0.6,

  /** Maximum votes per user per report */
  MAX_VOTES_PER_USER: 1,

  /** Vote weight decay over 7 days (hours) */
  VOTE_DECAY_HOURS: 168,

  /** Reporter history bonus multiplier minimum */
  REPORTER_BONUS_MIN: 0.8,

  /** Reporter history bonus multiplier maximum */
  REPORTER_BONUS_MAX: 1.2,

  /** Default trust score when no votes */
  DEFAULT_TRUST_SCORE: 0.5,

  /** Hours since last vote before decay starts */
  DECAY_START_HOURS: 24,
};

// === STORAGE KEYS ===

export const STORAGE_KEYS = {
  REPORTS: "cuunet-reports",
  MY_REPORTS: "cuunet-my-reports",
  USER_ID: "cuunet-user-id",
  USER_VOTES: "cuunet-user-votes",
  DRAFT: "cuunet-report-draft",
  FILTERS: "cuunet-report-filters",
  LAST_SYNC: "cuunet-last-sync",
  MOCKS_INITIALIZED: "cuunet-mocks-initialized",
} as const;

// === INDEXEDDB CONFIG ===

export const DB_CONFIG = {
  NAME: "cuunet-community-report",
  VERSION: 1,
  PHOTO_STORE: "photos",
} as const;

// === DISASTER TYPE CONFIG ===

export const DISASTER_CONFIG: Record<
  DisasterType,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  flood: {
    label: "Lũ lụt",
    icon: "🌊",
    color: "#3B82F6",
    bgColor: "bg-blue-500/10",
  },
  storm: {
    label: "Bão",
    icon: "🌪️",
    color: "#F59E0B",
    bgColor: "bg-amber-500/10",
  },
  landslide: {
    label: "Sạt lở",
    icon: "⛰️",
    color: "#A855F7",
    bgColor: "bg-purple-500/10",
  },
  drought: {
    label: "Hạn hán",
    icon: "☀️",
    color: "#F97316",
    bgColor: "bg-orange-500/10",
  },
  earthquake: {
    label: "Động đất",
    icon: "🔴",
    color: "#EF4444",
    bgColor: "bg-red-500/10",
  },
  tsunami: {
    label: "Sóng thần",
    icon: "🌊",
    color: "#06B6D4",
    bgColor: "bg-cyan-500/10",
  },
};

// === SEVERITY CONFIG ===

export const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; color: string; bgColor: string; weight: number }
> = {
  critical: {
    label: "Nghiêm trọng",
    color: "#EF4444",
    bgColor: "bg-red-500/10",
    weight: 4,
  },
  high: {
    label: "Cao",
    color: "#F97316",
    bgColor: "bg-orange-500/10",
    weight: 3,
  },
  medium: {
    label: "Trung bình",
    color: "#EAB308",
    bgColor: "bg-yellow-500/10",
    weight: 2,
  },
  low: {
    label: "Thấp",
    color: "#22C55E",
    bgColor: "bg-green-500/10",
    weight: 1,
  },
};

// === STATUS CONFIG ===

export const STATUS_CONFIG: Record<
  ReportStatus,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  pending: {
    label: "Chờ xác minh",
    icon: "⏳",
    color: "#F59E0B",
    bgColor: "bg-amber-500/10",
    description: "Báo cáo đang chờ cộng đồng xác nhận",
  },
  verified: {
    label: "Đã xác minh",
    icon: "✅",
    color: "#22C55E",
    bgColor: "bg-green-500/10",
    description: "Báo cáo đã được cộng đồng xác nhận",
  },
  resolved: {
    label: "Đã giải quyết",
    icon: "🟢",
    color: "#3B82F6",
    bgColor: "bg-blue-500/10",
    description: "Thiên tai đã được xử lý",
  },
  rejected: {
    label: "Bị từ chối",
    icon: "❌",
    color: "#EF4444",
    bgColor: "bg-red-500/10",
    description: "Báo cáo bị cộng đồng bác bỏ",
  },
};

// === BADGE CONFIG ===

export const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  verified: {
    label: "Đã xác minh",
    icon: "✅",
    color: "#22C55E",
    bgColor: "bg-green-500/10",
  },
  disputed: {
    label: "Tranh cãi",
    icon: "⚠️",
    color: "#F59E0B",
    bgColor: "bg-amber-500/10",
  },
};

// === TRUST SCORE COLORS ===

export const TRUST_SCORE_COLORS = {
  high: { min: 0.85, color: "#22C55E", label: "Rất tin cậy" },
  good: { min: 0.6, color: "#84CC16", label: "Tin cậy" },
  medium: { min: 0.3, color: "#EAB308", label: "Trung bình" },
  low: { min: 0, color: "#EF4444", label: "Thấp" },
};

// === TOAST CONFIG ===

export const TOAST_CONFIG: Record<
  ToastType,
  { icon: string; color: string; bgColor: string }
> = {
  success: {
    icon: "✅",
    color: "#22C55E",
    bgColor: "bg-green-500/10 border-green-500/20",
  },
  error: {
    icon: "❌",
    color: "#EF4444",
    bgColor: "bg-red-500/10 border-red-500/20",
  },
  info: {
    icon: "ℹ️",
    color: "#3B82F6",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  warning: {
    icon: "⚠️",
    color: "#F59E0B",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
};

// === DATE PRESET CONFIG ===

export const DATE_PRESET_CONFIG: Record<
  DatePreset,
  { label: string; hours: number | null }
> = {
  "1h": { label: "1 giờ", hours: 1 },
  "6h": { label: "6 giờ", hours: 6 },
  "24h": { label: "24 giờ", hours: 24 },
  "7d": { label: "7 ngày", hours: 168 },
  "30d": { label: "30 ngày", hours: 720 },
  all: { label: "Tất cả", hours: null },
};

// === SORT OPTIONS ===

export const SORT_OPTIONS: Record<string, { label: string; icon: string }> = {
  newest: { label: "Mới nhất", icon: "🕐" },
  oldest: { label: "Cũ nhất", icon: "📅" },
  mostSevere: { label: "Nghiêm trọng nhất", icon: "🔴" },
  mostVerified: { label: "Tin cậy nhất", icon: "✅" },
  mostVotes: { label: "Nhiều bình chọn", icon: "👍" },
  nearest: { label: "Gần nhất", icon: "📍" },
};

// === MAP CONFIG ===

export const REPORT_MAP_CONFIG = {
  center: [14.0583, 108.2772] as [number, number],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
  tileUrl:
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

// === SEVERITY MARKER CONFIG (for map) ===

export const SEVERITY_MARKER_CONFIG: Record<
  SeverityLevel,
  { radius: number; color: string; glow: string; borderWidth: number }
> = {
  critical: {
    radius: 14,
    color: "#EF4444",
    glow: "rgba(239, 68, 68, 0.5)",
    borderWidth: 3,
  },
  high: {
    radius: 11,
    color: "#F97316",
    glow: "rgba(249, 115, 22, 0.4)",
    borderWidth: 2,
  },
  medium: {
    radius: 9,
    color: "#EAB308",
    glow: "rgba(234, 179, 8, 0.3)",
    borderWidth: 2,
  },
  low: {
    radius: 7,
    color: "#22C55E",
    glow: "rgba(34, 197, 94, 0.3)",
    borderWidth: 1.5,
  },
};

// === REPORT TEMPLATES ===

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-flood-quick",
    type: "flood",
    name: "Lũ lụt nhanh",
    nameEn: "Quick Flood",
    icon: "🌊",
    color: "#3B82F6",
    titleTemplate: "Lũ lụt tại {location}",
    descriptionTemplate:
      "Một trận lũ lụt đang xảy ra tại khu vực này. Nước dâng cao nhanh, ảnh hưởng đến sinh hoạt và giao thông. Cần theo dõi và ứng phó kịp thời.",
    severityHint: "high",
    tags: ["flood", "quick", "urban"],
    usageCount: 0,
  },
  {
    id: "tpl-storm-quick",
    type: "storm",
    name: "Bão nhanh",
    nameEn: "Quick Storm",
    icon: "🌪️",
    color: "#F59E0B",
    titleTemplate: "Bão tại {location}",
    descriptionTemplate:
      "Cơn bão đang ảnh hưởng đến khu vực với sức gió mạnh và mưa lớn. Nhiều cây cối gãy đổ, nhà cửa hư hại. Cần trú ẩn an toàn.",
    severityHint: "high",
    tags: ["storm", "quick", "wind"],
    usageCount: 0,
  },
  {
    id: "tpl-landslide-quick",
    type: "landslide",
    name: "Sạt lở nhanh",
    nameEn: "Quick Landslide",
    icon: "⛰️",
    color: "#A855F7",
    titleTemplate: "Sạt lở tại {location}",
    descriptionTemplate:
      "Sạt lở đất xảy ra do mưa lớn kéo dài, đất đá tràn xuống đường. Giao thông bị chia cắt, có thể có người bị mắc kẹt.",
    severityHint: "critical",
    tags: ["landslide", "quick", "mountain"],
    usageCount: 0,
  },
  {
    id: "tpl-drought-quick",
    type: "drought",
    name: "Hạn hán nhanh",
    nameEn: "Quick Drought",
    icon: "☀️",
    color: "#F97316",
    titleTemplate: "Hạn hán tại {location}",
    descriptionTemplate:
      "Hạn hán kéo dài ảnh hưởng nghiêm trọng đến nông nghiệp và sinh hoạt. Thiếu nước uống, đồng ruộng khô cạn.",
    severityHint: "medium",
    tags: ["drought", "quick", "agriculture"],
    usageCount: 0,
  },
  {
    id: "tpl-earthquake-quick",
    type: "earthquake",
    name: "Động đất nhanh",
    nameEn: "Quick Earthquake",
    icon: "🔴",
    color: "#EF4444",
    titleTemplate: "Động đất tại {location}",
    descriptionTemplate:
      "Trận động đất vừa xảy ra, rung chấn cảm nhận rõ. Một số công trình có thể bị hư hại. Cần kiểm tra an toàn tòa nhà.",
    severityHint: "high",
    tags: ["earthquake", "quick", "seismic"],
    usageCount: 0,
  },
  {
    id: "tpl-tsunami-quick",
    type: "tsunami",
    name: "Sóng thần nhanh",
    nameEn: "Quick Tsunami",
    icon: "🌊",
    color: "#06B6D4",
    titleTemplate: "Sóng thần tại {location}",
    descriptionTemplate:
      "Cảnh báo sóng thần sau động đất. Người dân ven biển cần di tản ngay lập tức lên vùng cao. Sóng có thể ập đến trong vài phút.",
    severityHint: "critical",
    tags: ["tsunami", "quick", "coastal"],
    usageCount: 0,
  },
];

// === PROVINCE LIST (15 provinces) ===

export const PROVINCE_LIST = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Huế",
  "Cần Thơ",
  "Hải Phòng",
  "Nha Trang",
  "Đà Lạt",
  "Quảng Bình",
  "Quảng Nam",
  "Bến Tre",
  "Trà Vinh",
  "Lào Cai",
  "Yên Bái",
  "An Giang",
];

// === WIZARD STEP LABELS ===

export const WIZARD_STEPS = [
  { step: 1, label: "Loại thiên tai", icon: "🌊" },
  { step: 2, label: "Vị trí", icon: "📍" },
  { step: 3, label: "Chi tiết", icon: "📝" },
  { step: 4, label: "Ảnh chụp", icon: "📷" },
  { step: 5, label: "Liên hệ", icon: "👤" },
  { step: 6, label: "Xác nhận", icon: "✅" },
] as const;

// === ANIMATION CONFIG ===

export const ANIMATION = {
  card: { stagger: 0.05, duration: 0.4 },
  modal: { duration: 0.3 },
  wizard: { duration: 0.4 },
  toast: { duration: 0.5 },
  filter: { duration: 0.2 },
  vote: { duration: 0.3 },
};

// === VIETNAM BOUNDS (for location validation) ===

export const VIETNAM_BOUNDS = {
  lat: { min: 8.0, max: 23.5 },
  lng: { min: 102.0, max: 110.0 },
};

// === SEVERITY WEIGHTS (for sorting) ===

export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// === RESPONSIVE BREAKPOINTS ===

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};
