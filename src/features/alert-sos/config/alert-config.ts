import type {
  DisasterType,
  SeverityLevel,
} from "@/lib/types";
import type {
  AlertSeverity,
  AlertCategory,
  AlertUrgency,
  AlertCertainty,
  AlertResponseType,
  AlertSender,
  DeliveryChannel,
  SOSType,
  SOSEmergencyLevel,
  SOSStatus,
  EmergencyContactType,
  ChecklistCategory,
  ChecklistPriority,
  ChecklistSeason,
  ChecklistRegion,
  AlertViewMode,
  AlertSortOption,
  SeverityThreshold,
  EscalationStep,
  AlertFilters,
  AlertUserPreferences,
} from "../lib/types";

// =============================================================================
// ALERT & SOS MODULE - Configuration
// =============================================================================

// ---------------------------------------------------------------------------
// 1. GENERAL CONFIG
// ---------------------------------------------------------------------------

export const ALERT_CONFIG = {
  PAGE_SIZE: 20,
  AUTO_REFRESH_INTERVAL: 30_000,
  MAX_ALERTS_DISPLAY: 100,
  DEBOUNCE_SEARCH: 300,
  TOAST_DURATION: 5_000,
  SOS_TOAST_DURATION: 10_000,
  MAP_FLY_DURATION: 1.5,
  STATS_ANIMATION_DURATION: 2_000,
  ESCALATION_CHECK_INTERVAL: 60_000,
  OFFLINE_SYNC_INTERVAL: 30_000,
  MAX_RETRY_COUNT: 10,
  RETRY_BASE_DELAY: 1_000,
  GPS_TIMEOUT: 10_000,
  GPS_MAX_AGE: 60_000,
  MAX_SOS_PHOTOS: 3,
  MAX_SOS_PHOTO_SIZE: 3 * 1024 * 1024,
  ALERT_SOUND_DURATION: 3_000,
  QUIET_HOURS_DEFAULT_START: "22:00",
  QUIET_HOURS_DEFAULT_END: "06:00",
  MAX_ALERTS_PER_DAY_DEFAULT: 50,
  RELEVANCE_CALC_TIMEOUT: 50,
} as const;

// ---------------------------------------------------------------------------
// 2. STORAGE KEYS
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  ALERTS: "cuunet-alerts",
  SOS_REQUESTS: "cuunet-sos-requests",
  USER_ID: "cuunet-alert-user-id",
  USER_VOTES: "cuunet-alert-user-votes",
  USER_LOCATION: "cuunet-user-location",
  USER_PREFERENCES: "cuunet-alert-preferences",
  CHECKLIST_PROGRESS: "cuunet-checklist-progress",
  CHECKLIST_PROVINCE: "cuunet-checklist-province",
  OFFLINE_QUEUE: "cuunet-offline-queue",
  LAST_SYNC: "cuunet-alert-last-sync",
  ESCALATION_STATES: "cuunet-escalation-states",
  DISMISSED_ALERTS: "cuunet-dismissed-alerts",
  ACKNOWLEDGED_ALERTS: "cuunet-acknowledged-alerts",
} as const;

// ---------------------------------------------------------------------------
// 3. IndexedDB CONFIG
// ---------------------------------------------------------------------------

export const DB_CONFIG = {
  NAME: "cuunet-alert-sos",
  VERSION: 1,
  STORES: {
    SOS_QUEUE: "sos-queue",
    PHOTOS: "sos-photos",
    ALERT_CACHE: "alert-cache",
  },
} as const;

// ---------------------------------------------------------------------------
// 4. ALERT SEVERITY CONFIG (CAP-Inspired)
// ---------------------------------------------------------------------------

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    label: string;
    labelVi: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    icon: string;
    soundEnabled: boolean;
    vibrationPattern: number[];
    priority: number;
  }
> = {
  extreme: {
    label: "Extreme",
    labelVi: "Cực kỳ nghiêm trọng",
    color: "#DC2626",
    bgColor: "rgba(220, 38, 38, 0.15)",
    borderColor: "rgba(220, 38, 38, 0.5)",
    glowColor: "rgba(220, 38, 38, 0.3)",
    icon: "🔴",
    soundEnabled: true,
    vibrationPattern: [200, 100, 200, 100, 200],
    priority: 4,
  },
  severe: {
    label: "Severe",
    labelVi: "Nghiêm trọng",
    color: "#EA580C",
    bgColor: "rgba(234, 88, 12, 0.15)",
    borderColor: "rgba(234, 88, 12, 0.5)",
    glowColor: "rgba(234, 88, 12, 0.3)",
    icon: "🟠",
    soundEnabled: true,
    vibrationPattern: [200, 100, 200],
    priority: 3,
  },
  moderate: {
    label: "Moderate",
    labelVi: "Trung bình",
    color: "#CA8A04",
    bgColor: "rgba(202, 138, 4, 0.15)",
    borderColor: "rgba(202, 138, 4, 0.5)",
    glowColor: "rgba(202, 138, 4, 0.3)",
    icon: "🟡",
    soundEnabled: false,
    vibrationPattern: [300],
    priority: 2,
  },
  minor: {
    label: "Minor",
    labelVi: "Nhẹ",
    color: "#16A34A",
    bgColor: "rgba(22, 163, 74, 0.15)",
    borderColor: "rgba(22, 163, 74, 0.5)",
    glowColor: "rgba(22, 163, 74, 0.3)",
    icon: "🟢",
    soundEnabled: false,
    vibrationPattern: [],
    priority: 1,
  },
};

// ---------------------------------------------------------------------------
// 5. ALERT CATEGORY CONFIG
// ---------------------------------------------------------------------------

export const ALERT_CATEGORY_CONFIG: Record<
  AlertCategory,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  geo: { label: "Geological", labelVi: "Địa chất", icon: "⛰️", color: "#A855F7" },
  met: { label: "Meteorological", labelVi: "Khí tượng", icon: "🌦️", color: "#3B82F6" },
  safety: { label: "Safety", labelVi: "An toàn", icon: "⚠️", color: "#F59E0B" },
  security: { label: "Security", labelVi: "An ninh", icon: "🛡️", color: "#EF4444" },
  rescue: { label: "Rescue", labelVi: "Cứu nạn", icon: "🚁", color: "#06B6D4" },
  health: { label: "Health", labelVi: "Sức khỏe", icon: "🏥", color: "#22C55E" },
  infra: { label: "Infrastructure", labelVi: "Hạ tầng", icon: "🏗️", color: "#6B7280" },
};

// ---------------------------------------------------------------------------
// 6. ALERT URGENCY & CERTAINTY CONFIG
// ---------------------------------------------------------------------------

export const ALERT_URGENCY_CONFIG: Record<
  AlertUrgency,
  { label: string; labelVi: string; color: string; icon: string }
> = {
  immediate: { label: "Immediate", labelVi: "Ngay lập tức", color: "#EF4444", icon: "⚡" },
  expected: { label: "Expected", labelVi: "Dự kiến", color: "#F97316", icon: "📅" },
  future: { label: "Future", labelVi: "Tương lai", color: "#EAB308", icon: "🔮" },
  past: { label: "Past", labelVi: "Đã qua", color: "#6B7280", icon: "⏪" },
};

export const ALERT_CERTAINTY_CONFIG: Record<
  AlertCertainty,
  { label: string; labelVi: string; color: string; percentage: number }
> = {
  observed: { label: "Observed", labelVi: "Đã quan sát", color: "#22C55E", percentage: 100 },
  likely: { label: "Likely", labelVi: "Khả năng cao", color: "#3B82F6", percentage: 75 },
  possible: { label: "Possible", labelVi: "Có thể", color: "#EAB308", percentage: 50 },
  unlikely: { label: "Unlikely", labelVi: "Không chắc", color: "#6B7280", percentage: 25 },
};

export const ALERT_RESPONSE_TYPE_CONFIG: Record<
  AlertResponseType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  shelter: { label: "Shelter", labelVi: "Nương náu tại chỗ", icon: "🏠", color: "#3B82F6" },
  evacuate: { label: "Evacuate", labelVi: "Sơ tán ngay", icon: "🏃", color: "#EF4444" },
  prepare: { label: "Prepare", labelVi: "Chuẩn bị", icon: "📦", color: "#F59E0B" },
  avoid: { label: "Avoid", labelVi: "Tránh xa", icon: "🚫", color: "#DC2626" },
  monitor: { label: "Monitor", labelVi: "Theo dõi", icon: "👁️", color: "#6B7280" },
  allclear: { label: "All Clear", labelVi: "An toàn", icon: "✅", color: "#22C55E" },
};

// ---------------------------------------------------------------------------
// 7. ALERT SENDER CONFIG
// ---------------------------------------------------------------------------

export const ALERT_SENDER_CONFIG: Record<
  AlertSender,
  { label: string; labelVi: string; icon: string; color: string; trustLevel: number }
> = {
  vndma: { label: "VNDMA", labelVi: "Ban Chỉ đạo TW về PCTT", icon: "🏛️", color: "#3B82F6", trustLevel: 1.0 },
  "cnet-ai": { label: "CuuNet AI", labelVi: "AI CuuNet", icon: "🤖", color: "#8B5CF6", trustLevel: 0.85 },
  community: { label: "Community", labelVi: "Cộng đồng", icon: "👥", color: "#22C55E", trustLevel: 0.6 },
  international: { label: "International", labelVi: "Quốc tế", icon: "🌍", color: "#06B6D4", trustLevel: 0.9 },
};

// ---------------------------------------------------------------------------
// 8. SOS CONFIG
// ---------------------------------------------------------------------------

export const SOS_TYPE_CONFIG: Record<
  SOSType,
  { label: string; labelVi: string; icon: string; color: string; defaultSeverity: SOSEmergencyLevel }
> = {
  flood: { label: "Flood", labelVi: "Lũ lụt", icon: "🌊", color: "#3B82F6", defaultSeverity: "urgent" },
  storm: { label: "Storm", labelVi: "Bão", icon: "🌪️", color: "#F59E0B", defaultSeverity: "urgent" },
  landslide: { label: "Landslide", labelVi: "Sạt lở", icon: "⛰️", color: "#A855F7", defaultSeverity: "life_threatening" },
  earthquake: { label: "Earthquake", labelVi: "Động đất", icon: "🏚️", color: "#EF4444", defaultSeverity: "life_threatening" },
  tsunami: { label: "Tsunami", labelVi: "Sóng thần", icon: "🌊", color: "#06B6D4", defaultSeverity: "life_threatening" },
  fire: { label: "Fire", labelVi: "Cháy", icon: "🔥", color: "#DC2626", defaultSeverity: "life_threatening" },
  medical: { label: "Medical", labelVi: "Cấp cứu y tế", icon: "🏥", color: "#22C55E", defaultSeverity: "life_threatening" },
  trapped: { label: "Trapped", labelVi: "Mắc kẹt", icon: "🪢", color: "#F97316", defaultSeverity: "urgent" },
  stranded: { label: "Stranded", labelVi: "Cần cứu hộ", icon: "🚤", color: "#0EA5E9", defaultSeverity: "urgent" },
  other: { label: "Other", labelVi: "Khác", icon: "❓", color: "#6B7280", defaultSeverity: "need_help" },
};

export const SOS_EMERGENCY_LEVEL_CONFIG: Record<
  SOSEmergencyLevel,
  { label: string; labelVi: string; color: string; bgColor: string; priority: number; icon: string }
> = {
  life_threatening: {
    label: "Life-threatening",
    labelVi: "Nguy hiểm tính mạng",
    color: "#DC2626",
    bgColor: "rgba(220, 38, 38, 0.15)",
    priority: 3,
    icon: "💀",
  },
  urgent: {
    label: "Urgent",
    labelVi: "Gấp",
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
    priority: 2,
    icon: "⚡",
  },
  need_help: {
    label: "Need Help",
    labelVi: "Cần giúp đỡ",
    color: "#EAB308",
    bgColor: "rgba(234, 179, 8, 0.15)",
    priority: 1,
    icon: "🆘",
  },
};

export const SOS_STATUS_CONFIG: Record<
  SOSStatus,
  { label: string; labelVi: string; color: string; bgColor: string; icon: string; description: string }
> = {
  queued: {
    label: "Queued",
    labelVi: "Đang chờ gửi",
    color: "#6B7280",
    bgColor: "rgba(107, 114, 128, 0.15)",
    icon: "📥",
    description: "SOS đang chờ kết nối mạng để gửi",
  },
  sent: {
    label: "Sent",
    labelVi: "Đã gửi",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.15)",
    icon: "📤",
    description: "SOS đã được gửi đến hệ thống",
  },
  delivered: {
    label: "Delivered",
    labelVi: "Đã nhận",
    color: "#A855F7",
    bgColor: "rgba(168, 85, 247, 0.15)",
    icon: "📨",
    description: "SOS đã được hệ thống tiếp nhận",
  },
  acknowledged: {
    label: "Acknowledged",
    labelVi: "Đã xác nhận",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.15)",
    icon: "👁️",
    description: "Đội cứu hộ đã xác nhận yêu cầu",
  },
  dispatched: {
    label: "Dispatched",
    labelVi: "Đang cứu hộ",
    color: "#22C55E",
    bgColor: "rgba(34, 197, 94, 0.15)",
    icon: "🚁",
    description: "Đội cứu hộ đang trên đường đến",
  },
  resolved: {
    label: "Resolved",
    labelVi: "Đã giải quyết",
    color: "#16A34A",
    bgColor: "rgba(22, 163, 74, 0.15)",
    icon: "✅",
    description: "Tình huống đã được giải quyết",
  },
  failed: {
    label: "Failed",
    labelVi: "Gửi thất bại",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
    icon: "❌",
    description: "Không thể gửi SOS. Sẽ thử lại khi có mạng",
  },
};

// ---------------------------------------------------------------------------
// 9. EMERGENCY CONTACT CONFIG
// ---------------------------------------------------------------------------

export const EMERGENCY_CONTACT_TYPE_CONFIG: Record<
  EmergencyContactType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  police: { label: "Police", labelVi: "Cảnh sát", icon: "🚔", color: "#3B82F6" },
  fire: { label: "Fire Department", labelVi: "Cứu hỏa", icon: "🚒", color: "#EF4444" },
  ambulance: { label: "Ambulance", labelVi: "Cấp cứu", icon: "🚑", color: "#22C55E" },
  coast_guard: { label: "Coast Guard", labelVi: "Biên phòng", icon: "⚓", color: "#06B6D4" },
  disaster: { label: "Disaster Management", labelVi: "Ban PCTT", icon: "🏛️", color: "#F59E0B" },
  rescue: { label: "Rescue Team", labelVi: "Đội cứu nạn", icon: "🚁", color: "#F97316" },
  military: { label: "Military", labelVi: "Quân đội", icon: "🎖️", color: "#4B5563" },
  red_cross: { label: "Red Cross", labelVi: "Chữ thập đỏ", icon: "➕", color: "#DC2626" },
  hospital: { label: "Hospital", labelVi: "Bệnh viện", icon: "🏥", color: "#22C55E" },
  electricity: { label: "Electricity", labelVi: "Điện lực", icon: "⚡", color: "#EAB308" },
  water: { label: "Water Supply", labelVi: "Cấp nước", icon: "💧", color: "#3B82F6" },
};

export const NATIONAL_EMERGENCY_NUMBERS = [
  { number: "113", type: "police" as EmergencyContactType, name: "Cảnh sát", nameVi: "Cảnh sát - An ninh trật tự", description: "Gọi khi có vấn đề về an ninh, trật tự" },
  { number: "114", type: "fire" as EmergencyContactType, name: "Fire Department", nameVi: "Cứu hỏa - Cứu nạn", description: "Gọi khi có cháy, cứu nạn" },
  { number: "115", type: "ambulance" as EmergencyContactType, name: "Ambulance", nameVi: "Cấp cứu y tế", description: "Gọi khi cần cấp cứu y tế" },
  { number: "116", type: "coast_guard" as EmergencyContactType, name: "Coast Guard", nameVi: "Biên phòng - Cứu hộ biển", description: "Gọi khi cần cứu hộ trên biển" },
] as const;

// ---------------------------------------------------------------------------
// 10. CHECKLIST CONFIG
// ---------------------------------------------------------------------------

export const CHECKLIST_CATEGORY_CONFIG: Record<
  ChecklistCategory,
  { label: string; labelVi: string; icon: string; color: string; order: number }
> = {
  supplies: { label: "Supplies", labelVi: "Vật tư", icon: "📦", color: "#3B82F6", order: 1 },
  documents: { label: "Documents", labelVi: "Giấy tờ", icon: "📄", color: "#8B5CF6", order: 2 },
  home: { label: "Home", labelVi: "Nhà cửa", icon: "🏠", color: "#F59E0B", order: 3 },
  communication: { label: "Communication", labelVi: "Liên lạc", icon: "📱", color: "#06B6D4", order: 4 },
  evacuation: { label: "Evacuation", labelVi: "Sơ tán", icon: "🏃", color: "#EF4444", order: 5 },
  health: { label: "Health", labelVi: "Sức khỏe", icon: "💊", color: "#22C55E", order: 6 },
};

export const CHECKLIST_PRIORITY_CONFIG: Record<
  ChecklistPriority,
  { label: string; labelVi: string; color: string; bgColor: string; order: number }
> = {
  essential: { label: "Essential", labelVi: "Thiết yếu", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.15)", order: 1 },
  recommended: { label: "Recommended", labelVi: "Khuyến nghị", color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.15)", order: 2 },
  optional: { label: "Optional", labelVi: "Tùy chọn", color: "#6B7280", bgColor: "rgba(107, 114, 128, 0.15)", order: 3 },
};

export const CHECKLIST_SEASON_CONFIG: Record<
  ChecklistSeason,
  { label: string; labelVi: string; icon: string; months: number[]; description: string }
> = {
  all: { label: "All Year", labelVi: "Quanh năm", icon: "📅", months: [1,2,3,4,5,6,7,8,9,10,11,12], description: "Luôn cần chuẩn bị" },
  monsoon: { label: "Monsoon", labelVi: "Mùa mưa", icon: "🌧️", months: [5,6,7,8,9,10], description: "Tháng 5-10: Mưa lớn, ngập lụt" },
  dry: { label: "Dry Season", labelVi: "Mùa khô", icon: "☀️", months: [11,12,1,2,3,4], description: "Tháng 11-4: Hạn hán, xâm nhập mặn" },
  typhoon: { label: "Typhoon Season", labelVi: "Mùa bão", icon: "🌪️", months: [6,7,8,9,10,11], description: "Tháng 6-11: Bão nhiệt đới" },
};

export const CHECKLIST_REGION_CONFIG: Record<
  ChecklistRegion,
  { label: string; labelVi: string; provinces: string[] }
> = {
  all: { label: "All Regions", labelVi: "Tất cả khu vực", provinces: [] },
  coastal: { label: "Coastal", labelVi: "Ven biển", provinces: ["Đà Nẵng", "Nha Trang", "Hải Phòng", "Bến Tre", "Trà Vinh"] },
  flood_prone: { label: "Flood-prone", labelVi: "Hay ngập lụt", provinces: ["Quảng Bình", "Quảng Nam", "Huế", "An Giang", "Cần Thơ"] },
  mountainous: { label: "Mountainous", labelVi: "Miền núi", provinces: ["Lào Cai", "Yên Bái", "Đà Lạt"] },
  delta: { label: "Delta", labelVi: "Đồng bằng", provinces: ["Cần Thơ", "An Giang", "Bến Tre", "Trà Vinh", "Hà Nội"] },
  urban: { label: "Urban", labelVi: "Thành thị", provinces: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng"] },
};

// ---------------------------------------------------------------------------
// 11. DELIVERY CHANNEL CONFIG
// ---------------------------------------------------------------------------

export const DELIVERY_CHANNEL_CONFIG: Record<
  DeliveryChannel,
  { label: string; labelVi: string; icon: string; color: string; reliability: number; requiresApp: boolean }
> = {
  push: { label: "Push Notification", labelVi: "Thông báo đẩy", icon: "🔔", color: "#3B82F6", reliability: 0.85, requiresApp: true },
  sms: { label: "SMS", labelVi: "Tin nhắn SMS", icon: "💬", color: "#22C55E", reliability: 0.95, requiresApp: false },
  zalo: { label: "Zalo OA", labelVi: "Zalo Official Account", icon: "💙", color: "#0068FF", reliability: 0.80, requiresApp: true },
  loudspeaker: { label: "Loudspeaker", labelVi: "Loa phát thanh", icon: "📢", color: "#F59E0B", reliability: 0.70, requiresApp: false },
  email: { label: "Email", labelVi: "Thư điện tử", icon: "📧", color: "#6B7280", reliability: 0.90, requiresApp: false },
};

// ---------------------------------------------------------------------------
// 12. RELEVANCE SCORING CONFIG
// ---------------------------------------------------------------------------

export const RELEVANCE_CONFIG = {
  WEIGHTS: {
    distance: 0.40,
    severity: 0.25,
    vulnerability: 0.20,
    preference: 0.10,
    urgency: 0.05,
  },
  DISTANCE_TIERS: {
    inside: { score: 40, label: "Trong vùng cảnh báo" },
    within20km: { score: 30, label: "Dưới 20km" },
    within50km: { score: 15, label: "Dưới 50km" },
    within100km: { score: 5, label: "Dưới 100km" },
    beyond: { score: 0, label: "Ngoài 100km" },
  },
  SEVERITY_SCORES: {
    extreme: 25,
    severe: 19,
    moderate: 13,
    minor: 6,
  },
  URGENCY_SCORES: {
    immediate: 5,
    expected: 3,
    future: 1,
    past: 0,
  },
  THRESHOLDS: {
    extreme: 20,
    severe: 40,
    moderate: 60,
    minor: 80,
  },
  DEDUP_WINDOW_HOURS: 6,
} as const;

// ---------------------------------------------------------------------------
// 13. ESCALATION CONFIG
// ---------------------------------------------------------------------------

export const ESCALATION_STEPS: Record<AlertSeverity, EscalationStep[]> = {
  extreme: [
    { level: 1, channel: "push", delayMinutes: 0, condition: "no_ack", action: "send" },
    { level: 2, channel: "sms", delayMinutes: 2, condition: "no_ack", action: "escalate" },
    { level: 3, channel: "zalo", delayMinutes: 5, condition: "no_ack", action: "escalate" },
    { level: 4, channel: "loudspeaker", delayMinutes: 10, condition: "no_ack", action: "escalate" },
  ],
  severe: [
    { level: 1, channel: "push", delayMinutes: 0, condition: "no_ack", action: "send" },
    { level: 2, channel: "sms", delayMinutes: 10, condition: "no_ack", action: "escalate" },
    { level: 3, channel: "zalo", delayMinutes: 30, condition: "no_ack", action: "escalate" },
  ],
  moderate: [
    { level: 1, channel: "push", delayMinutes: 0, condition: "no_ack", action: "send" },
    { level: 2, channel: "sms", delayMinutes: 60, condition: "no_ack", action: "escalate" },
  ],
  minor: [
    { level: 1, channel: "push", delayMinutes: 0, condition: "no_ack", action: "send" },
  ],
};

// ---------------------------------------------------------------------------
// 14. ALERT FILTERS DEFAULT
// ---------------------------------------------------------------------------

export const DEFAULT_ALERT_FILTERS: AlertFilters = {
  severities: [],
  types: [],
  categories: [],
  provinces: [],
  urgencies: [],
  dateRange: {
    preset: "all",
    start: null,
    end: null,
  },
  showExpired: false,
  showCancelled: false,
  senderFilter: [],
};

export const DEFAULT_USER_PREFERENCES: AlertUserPreferences = {
  subscribedTypes: ["flood", "storm", "landslide", "earthquake", "tsunami", "drought"],
  subscribedProvinces: [],
  quietHoursStart: "22:00",
  quietHoursEnd: "06:00",
  soundEnabled: true,
  vibrationEnabled: true,
  maxAlertsPerDay: 50,
  preferredLanguage: "vi",
};

// ---------------------------------------------------------------------------
// 15. SORT OPTIONS
// ---------------------------------------------------------------------------

export const ALERT_SORT_OPTIONS: { value: AlertSortOption; label: string; labelVi: string; icon: string }[] = [
  { value: "newest", label: "Newest", labelVi: "Mới nhất", icon: "🕐" },
  { value: "oldest", label: "Oldest", labelVi: "Cũ nhất", icon: "🕰️" },
  { value: "mostSevere", label: "Most Severe", labelVi: "Nghiêm trọng nhất", icon: "🔴" },
  { value: "mostUrgent", label: "Most Urgent", labelVi: "Khẩn cấp nhất", icon: "⚡" },
  { value: "nearestExpiry", label: "Nearest Expiry", labelVi: "Sắp hết hạn", icon: "⏰" },
  { value: "mostRelevant", label: "Most Relevant", labelVi: "Liên quan nhất", icon: "🎯" },
];

// ---------------------------------------------------------------------------
// 16. VIEW MODE CONFIG
// ---------------------------------------------------------------------------

export const ALERT_VIEW_MODE_CONFIG: Record<
  AlertViewMode,
  { label: string; labelVi: string; icon: string; description: string }
> = {
  dashboard: { label: "Dashboard", labelVi: "Tổng quan", icon: "📊", description: "Xem tổng quan cảnh báo và SOS" },
  feed: { label: "Alert Feed", labelVi: "Dòng cảnh báo", icon: "📰", description: "Danh sách cảnh báo theo thời gian" },
  map: { label: "Map", labelVi: "Bản đồ", icon: "🗺️", description: "Bản đồ cảnh báo và SOS" },
  sos: { label: "SOS", labelVi: "SOS", icon: "🆘", description: "Gửi yêu cầu cứu hộ khẩn cấp" },
  directory: { label: "Directory", labelVi: "Danh bạ", icon: "📞", description: "Danh bạ khẩn cấp theo tỉnh" },
  checklist: { label: "Checklist", labelVi: "Checklist", icon: "✅", description: "Checklist chuẩn bị thiên tai" },
  history: { label: "History", labelVi: "Lịch sử", icon: "📜", description: "Lịch sử SOS cá nhân" },
};

// ---------------------------------------------------------------------------
// 17. ANIMATION CONFIG
// ---------------------------------------------------------------------------

export const ANIMATION = {
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    sosPulse: 2,
  },
  ease: [0.22, 1, 0.36, 1] as const,
  spring: {
    stiffness: 200,
    damping: 25,
  },
} as const;

// ---------------------------------------------------------------------------
// 18. MAP CONFIG
// ---------------------------------------------------------------------------

export const ALERT_MAP_CONFIG = {
  SOS_MARKER_RADIUS: 10,
  SOS_MARKER_COLOR: "#DC2626",
  SOS_MARKER_GLOW: "rgba(220, 38, 38, 0.4)",
  ALERT_ZONE_OPACITY: 0.25,
  ALERT_ZONE_BORDER_WIDTH: 2,
  USER_MARKER_RADIUS: 8,
  USER_MARKER_COLOR: "#3B82F6",
  FLY_TO_DURATION: 1.5,
  FLY_TO_ZOOM: 10,
} as const;

// ---------------------------------------------------------------------------
// 19. TOAST CONFIG
// ---------------------------------------------------------------------------

export const TOAST_CONFIG: Record<
  string,
  { icon: string; color: string; bgColor: string }
> = {
  success: { icon: "✅", color: "#22C55E", bgColor: "rgba(34, 197, 94, 0.15)" },
  error: { icon: "❌", color: "#EF4444", bgColor: "rgba(239, 68, 68, 0.15)" },
  warning: { icon: "⚠️", color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.15)" },
  info: { icon: "ℹ️", color: "#3B82F6", bgColor: "rgba(59, 130, 246, 0.15)" },
  sos: { icon: "🆘", color: "#DC2626", bgColor: "rgba(220, 38, 38, 0.15)" },
};

// ---------------------------------------------------------------------------
// 20. PROVINCE DATA (for filtering)
// ---------------------------------------------------------------------------

export const PROVINCES_WITH_REGIONS: Record<string, ChecklistRegion[]> = {
  "Hà Nội": ["delta", "urban"],
  "Hồ Chí Minh": ["urban"],
  "Đà Nẵng": ["coastal", "urban"],
  "Huế": ["flood_prone"],
  "Cần Thơ": ["delta", "flood_prone"],
  "Hải Phòng": ["coastal", "urban"],
  "Nha Trang": ["coastal"],
  "Đà Lạt": ["mountainous"],
  "Quảng Bình": ["flood_prone", "coastal"],
  "Quảng Nam": ["flood_prone", "coastal"],
  "Bến Tre": ["delta", "coastal"],
  "Trà Vinh": ["delta", "coastal"],
  "Lào Cai": ["mountainous"],
  "Yên Bái": ["mountainous"],
  "An Giang": ["delta", "flood_prone"],
};

// ---------------------------------------------------------------------------
// 21. VIETNAM BOUNDS (for location validation)
// ---------------------------------------------------------------------------

export const VIETNAM_BOUNDS = {
  lat: { min: 8.18, max: 23.39 },
  lng: { min: 102.14, max: 109.47 },
} as const;
