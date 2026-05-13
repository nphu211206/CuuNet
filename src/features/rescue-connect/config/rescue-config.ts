import type {
  IncidentStatus,
  IncidentPriority,
  IncidentType,
  ResourceType,
  ResourceStatus,
  ResourceCapability,
  VolunteerType,
  VolunteerStatus,
  VolunteerSkill,
  ShelterType,
  ShelterStatus,
  ShelterNeed,
  OrganizationType,
  HumanitarianCluster,
  ActivityStatus,
  TaskStatus,
  TaskPriority,
  TriageColor,
  TriageMethod,
  RescueSOSStatus,
  SOSEmergencyLevel,
  ChannelType,
  MessageType,
  BroadcastPriority,
  TimelineEventType,
  CheckInStatus,
  DispatchReason,
  ResponsePhase,
  RescueTab,
  MapLayerConfig,
  IncidentFilter,
} from "../lib/types";

// =============================================================================
// RESCUE COORDINATION MODULE - Configuration
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. GENERAL CONFIG
// ---------------------------------------------------------------------------

export const RESCUE_CONFIG = {
  PAGE_SIZE: 20,
  AUTO_REFRESH_INTERVAL: 30_000,
  MAX_INCIDENTS_DISPLAY: 100,
  DEBOUNCE_SEARCH: 300,
  TOAST_DURATION: 5_000,
  SOS_TOAST_DURATION: 10_000,
  MAP_FLY_DURATION: 1.5,
  STATS_ANIMATION_DURATION: 2_000,
  TRIAGE_CALC_TIMEOUT: 50,
  DISPATCH_CALC_TIMEOUT: 100,
  MAP_RENDER_TIMEOUT: 500,
  GPS_TIMEOUT: 10_000,
  GPS_MAX_AGE: 60_000,
  MAX_MESSAGES_PER_CHANNEL: 500,
  MAX_TIMELINE_EVENTS: 1000,
  MAX_CHECK_INS: 5000,
  KANBAN_COLUMN_MIN_HEIGHT: 200,
  SHELTER_OCCUPANCY_WARNING: 0.8,
  SHELTER_OCCUPANCY_CRITICAL: 0.95,
  TRIAGE_SCORE_P1: 80,
  TRIAGE_SCORE_P2: 60,
  TRIAGE_SCORE_P3: 40,
  DISPATCH_TOP_N: 3,
  MAP_MARKER_CLUSTER_RADIUS: 50,
  MAP_MAX_MARKERS_WITHOUT_CLUSTER: 100,
  SANKEY_MIN_FLOW_VALUE: 1,
  VOLUNTEER_MATCH_THRESHOLD: 30,
  OPERATIONAL_PERIOD_HOURS: 12,
} as const;

// ---------------------------------------------------------------------------
// 2. STORAGE KEYS
// ---------------------------------------------------------------------------

export const RESCUE_STORAGE_KEYS = {
  INCIDENTS: "cuunet-rescue-incidents",
  SOS_REQUESTS: "cuunet-rescue-sos",
  TASKS: "cuunet-rescue-tasks",
  RESOURCES: "cuunet-rescue-resources",
  VOLUNTEERS: "cuunet-rescue-volunteers",
  SHELTERS: "cuunet-rescue-shelters",
  ORGANIZATIONS: "cuunet-rescue-orgs",
  THREE_W_ENTRIES: "cuunet-rescue-3w",
  CHANNELS: "cuunet-rescue-channels",
  MESSAGES: "cuunet-rescue-messages",
  BROADCASTS: "cuunet-rescue-broadcasts",
  TIMELINE: "cuunet-rescue-timeline",
  CHECK_INS: "cuunet-rescue-checkins",
  DISPATCH_RESULTS: "cuunet-rescue-dispatch",
  USER_PREFERENCES: "cuunet-rescue-preferences",
  ACTIVE_TAB: "cuunet-rescue-active-tab",
  MAP_LAYERS: "cuunet-rescue-map-layers",
} as const;

// ---------------------------------------------------------------------------
// 3. INCIDENT CONFIG
// ---------------------------------------------------------------------------

export const INCIDENT_STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; labelVi: string; icon: string; color: string; bgColor: string; order: number }
> = {
  new: {
    label: "New",
    labelVi: "Mới",
    icon: "🆕",
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.15)",
    order: 0,
  },
  active: {
    label: "Active",
    labelVi: "Đang xử lý",
    icon: "🔴",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.15)",
    order: 1,
  },
  escalated: {
    label: "Escalated",
    labelVi: "Caoescalation",
    icon: "⚠️",
    color: "#F97316",
    bgColor: "rgba(249,115,22,0.15)",
    order: 2,
  },
  resolved: {
    label: "Resolved",
    labelVi: "Đã giải quyết",
    icon: "✅",
    color: "#22C55E",
    bgColor: "rgba(34,197,94,0.15)",
    order: 3,
  },
  closed: {
    label: "Closed",
    labelVi: "Đã đóng",
    icon: "📁",
    color: "#6B7280",
    bgColor: "rgba(107,114,128,0.15)",
    order: 4,
  },
};

export const INCIDENT_PRIORITY_CONFIG: Record<
  IncidentPriority,
  { label: string; labelVi: string; color: string; bgColor: string; score: number; order: number }
> = {
  P1: {
    label: "Critical",
    labelVi: "Khẩn cấp",
    color: "#DC2626",
    bgColor: "rgba(220,38,38,0.15)",
    score: 100,
    order: 0,
  },
  P2: {
    label: "High",
    labelVi: "Gấp",
    color: "#EA580C",
    bgColor: "rgba(234,88,12,0.15)",
    score: 75,
    order: 1,
  },
  P3: {
    label: "Medium",
    labelVi: "Tiêu chuẩn",
    color: "#CA8A04",
    bgColor: "rgba(202,138,4,0.15)",
    score: 50,
    order: 2,
  },
  P4: {
    label: "Low",
    labelVi: "Thấp",
    color: "#16A34A",
    bgColor: "rgba(22,163,74,0.15)",
    score: 25,
    order: 3,
  },
};

export const INCIDENT_TYPE_CONFIG: Record<
  IncidentType,
  { label: string; labelVi: string; icon: string; color: string; requiredCapabilities: ResourceCapability[] }
> = {
  flood: {
    label: "Flood",
    labelVi: "Lũ lụt",
    icon: "🌊",
    color: "#3B82F6",
    requiredCapabilities: ["water_rescue", "supply_delivery"],
  },
  storm: {
    label: "Storm",
    labelVi: "Bão",
    icon: "🌪️",
    color: "#6366F1",
    requiredCapabilities: ["heavy_equipment", "search_rescue"],
  },
  landslide: {
    label: "Landslide",
    labelVi: "Sạt lở đất",
    icon: "⛰️",
    color: "#92400E",
    requiredCapabilities: ["heavy_equipment", "search_rescue", "medical"],
  },
  earthquake: {
    label: "Earthquake",
    labelVi: "Động đất",
    icon: "🏔️",
    color: "#B45309",
    requiredCapabilities: ["search_rescue", "heavy_equipment", "medical"],
  },
  tsunami: {
    label: "Tsunami",
    labelVi: "Sóng thần",
    icon: "🌊",
    color: "#0EA5E9",
    requiredCapabilities: ["water_rescue", "supply_delivery", "medical"],
  },
  drought: {
    label: "Drought",
    labelVi: "Hạn hán",
    icon: "☀️",
    color: "#F59E0B",
    requiredCapabilities: ["supply_delivery"],
  },
  fire: {
    label: "Fire",
    labelVi: "Cháy",
    icon: "🔥",
    color: "#EF4444",
    requiredCapabilities: ["search_rescue", "medical"],
  },
  infrastructure: {
    label: "Infrastructure",
    labelVi: "Sự cố hạ tầng",
    icon: "🏗️",
    color: "#78716C",
    requiredCapabilities: ["heavy_equipment", "communication"],
  },
  industrial: {
    label: "Industrial",
    labelVi: "Sự cố công nghiệp",
    icon: "🏭",
    color: "#71717A",
    requiredCapabilities: ["search_rescue", "medical", "communication"],
  },
  other: {
    label: "Other",
    labelVi: "Khác",
    icon: "❓",
    color: "#6B7280",
    requiredCapabilities: ["search_rescue"],
  },
};

export const RESPONSE_PHASE_CONFIG: Record<
  ResponsePhase,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  preparedness: {
    label: "Preparedness",
    labelVi: "Chuẩn bị",
    icon: "🛡️",
    color: "#3B82F6",
  },
  response: {
    label: "Response",
    labelVi: "Phản ứng",
    icon: "🚨",
    color: "#EF4444",
  },
  recovery: {
    label: "Recovery",
    labelVi: "Phục hồi",
    icon: "🔄",
    color: "#22C55E",
  },
  mitigation: {
    label: "Mitigation",
    labelVi: "Giảm thiểu",
    icon: "🛡️",
    color: "#8B5CF6",
  },
};

// ---------------------------------------------------------------------------
// 4. SOS CONFIG
// ---------------------------------------------------------------------------

export const TRIAGE_COLOR_CONFIG: Record<
  TriageColor,
  { label: string; labelVi: string; color: string; bgColor: string; priority: number }
> = {
  red: {
    label: "Immediate",
    labelVi: "Ngay lập tức",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.15)",
    priority: 1,
  },
  yellow: {
    label: "Delayed",
    labelVi: "Trì hoãn",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.15)",
    priority: 2,
  },
  green: {
    label: "Minor",
    labelVi: "Nhẹ",
    color: "#22C55E",
    bgColor: "rgba(34,197,94,0.15)",
    priority: 3,
  },
  black: {
    label: "Expectant",
    labelVi: "Không thể cứu",
    color: "#1F2937",
    bgColor: "rgba(31,41,55,0.15)",
    priority: 4,
  },
};

export const TRIAGE_METHOD_CONFIG: Record<
  TriageMethod,
  { label: string; labelVi: string; description: string }
> = {
  start: {
    label: "START Triage",
    labelVi: "Phân loại START",
    description: "Simple Triage and Rapid Treatment - phân loại nhanh 60 giây/bệnh nhân",
  },
  salt: {
    label: "SALT Triage",
    labelVi: "Phân loại SALT",
    description: "Sort, Assess, Lifesaving interventions, Treatment/Transport",
  },
  custom: {
    label: "Custom Scoring",
    labelVi: "Điểm tùy chỉnh",
    description: "Weighted scoring: Severity + Population + Accessibility + Urgency",
  },
};

export const RESCUE_SOS_STATUS_CONFIG: Record<
  RescueSOSStatus,
  { label: string; labelVi: string; icon: string; color: string; order: number }
> = {
  pending: {
    label: "Pending",
    labelVi: "Chờ xử lý",
    icon: "⏳",
    color: "#F59E0B",
    order: 0,
  },
  triaged: {
    label: "Triaged",
    labelVi: "Đã phân loại",
    icon: "🏷️",
    color: "#8B5CF6",
    order: 1,
  },
  dispatched: {
    label: "Dispatched",
    labelVi: "Đã triển khai",
    icon: "🚁",
    color: "#3B82F6",
    order: 2,
  },
  en_route: {
    label: "En Route",
    labelVi: "Đang di chuyển",
    icon: "🚗",
    color: "#0EA5E9",
    order: 3,
  },
  on_scene: {
    label: "On Scene",
    labelVi: "Đã đến hiện trường",
    icon: "📍",
    color: "#10B981",
    order: 4,
  },
  resolved: {
    label: "Resolved",
    labelVi: "Đã cứu",
    icon: "✅",
    color: "#22C55E",
    order: 5,
  },
  cancelled: {
    label: "Cancelled",
    labelVi: "Đã hủy",
    icon: "❌",
    color: "#6B7280",
    order: 6,
  },
};

export const SOS_EMERGENCY_LEVEL_CONFIG: Record<
  SOSEmergencyLevel,
  { label: string; labelVi: string; icon: string; color: string; score: number }
> = {
  life_threatening: {
    label: "Life Threatening",
    labelVi: "Nguy hiểm tính mạng",
    icon: "💀",
    color: "#DC2626",
    score: 100,
  },
  urgent: {
    label: "Urgent",
    labelVi: "Khẩn cấp",
    icon: "🚨",
    color: "#EA580C",
    score: 75,
  },
  need_help: {
    label: "Need Help",
    labelVi: "Cần giúp đỡ",
    icon: "🆘",
    color: "#F59E0B",
    score: 50,
  },
};

// ---------------------------------------------------------------------------
// 5. TRIAGE SCORING WEIGHTS
// ---------------------------------------------------------------------------

export const TRIAGE_WEIGHTS = {
  severity: 0.4,
  population: 0.3,
  accessibility: 0.2,
  urgency: 0.1,
} as const;

export const ACCESSIBILITY_SCORES: Record<string, number> = {
  urban: 95,
  suburban: 80,
  rural: 60,
  mountainous: 35,
  flood_zone: 15,
  island: 10,
};

export const POPULATION_LOG_SCALE: Array<{ threshold: number; score: number }> = [
  { threshold: 1, score: 10 },
  { threshold: 5, score: 25 },
  { threshold: 10, score: 40 },
  { threshold: 50, score: 60 },
  { threshold: 100, score: 70 },
  { threshold: 500, score: 85 },
  { threshold: 1000, score: 100 },
];

export const URGENCY_TIME_SCALE: Array<{ hours: number; score: number }> = [
  { hours: 0, score: 0 },
  { hours: 1, score: 30 },
  { hours: 3, score: 60 },
  { hours: 6, score: 80 },
  { hours: 12, score: 100 },
];

// ---------------------------------------------------------------------------
// 6. DISPATCH SCORING WEIGHTS
// ---------------------------------------------------------------------------

export const DISPATCH_WEIGHTS = {
  distance: 0.35,
  capability: 0.3,
  availability: 0.2,
  capacity: 0.1,
  speed: 0.05,
} as const;

export const AVAILABILITY_SCORES: Record<ResourceStatus, number> = {
  available: 100,
  returning: 50,
  deployed: 0,
  maintenance: 0,
};

// ---------------------------------------------------------------------------
// 7. RESOURCE CONFIG
// ---------------------------------------------------------------------------

export const RESOURCE_TYPE_CONFIG: Record<
  ResourceType,
  { label: string; labelVi: string; icon: string; color: string; defaultCapacity: number; defaultSpeed: number }
> = {
  boat: {
    label: "Boat",
    labelVi: "Ca nô",
    icon: "🚤",
    color: "#3B82F6",
    defaultCapacity: 8,
    defaultSpeed: 30,
  },
  helicopter: {
    label: "Helicopter",
    labelVi: "Trực thăng",
    icon: "🚁",
    color: "#8B5CF6",
    defaultCapacity: 12,
    defaultSpeed: 200,
  },
  ambulance: {
    label: "Ambulance",
    labelVi: "Xe cứu thương",
    icon: "🚑",
    color: "#EF4444",
    defaultCapacity: 2,
    defaultSpeed: 80,
  },
  fire_truck: {
    label: "Fire Truck",
    labelVi: "Xe cứu hỏa",
    icon: "🚒",
    color: "#F97316",
    defaultCapacity: 6,
    defaultSpeed: 60,
  },
  rescue_team: {
    label: "Rescue Team",
    labelVi: "Đội cứu hộ",
    icon: "👥",
    color: "#22C55E",
    defaultCapacity: 10,
    defaultSpeed: 15,
  },
  medical_team: {
    label: "Medical Team",
    labelVi: "Đội y tế",
    icon: "🏥",
    color: "#EC4899",
    defaultCapacity: 5,
    defaultSpeed: 20,
  },
  supply_truck: {
    label: "Supply Truck",
    labelVi: "Xe vận chuyển",
    icon: "📦",
    color: "#F59E0B",
    defaultCapacity: 50,
    defaultSpeed: 60,
  },
  generator: {
    label: "Generator",
    labelVi: "Máy phát điện",
    icon: "⚡",
    color: "#EAB308",
    defaultCapacity: 1,
    defaultSpeed: 40,
  },
  water_pump: {
    label: "Water Pump",
    labelVi: "Máy bơm nước",
    icon: "💧",
    color: "#06B6D4",
    defaultCapacity: 1,
    defaultSpeed: 30,
  },
  communication_unit: {
    label: "Communication Unit",
    labelVi: "Đơn vị truyền thông",
    icon: "📡",
    color: "#14B8A6",
    defaultCapacity: 1,
    defaultSpeed: 50,
  },
};

export const RESOURCE_STATUS_CONFIG: Record<
  ResourceStatus,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  available: {
    label: "Available",
    labelVi: "Sẵn sàng",
    icon: "🟢",
    color: "#22C55E",
  },
  deployed: {
    label: "Deployed",
    labelVi: "Đã triển khai",
    icon: "🔵",
    color: "#3B82F6",
  },
  returning: {
    label: "Returning",
    labelVi: "Đang trở về",
    icon: "🟡",
    color: "#F59E0B",
  },
  maintenance: {
    label: "Maintenance",
    labelVi: "Bảo trì",
    icon: "⚫",
    color: "#6B7280",
  },
};

export const RESOURCE_CAPABILITY_CONFIG: Record<
  ResourceCapability,
  { label: string; labelVi: string; icon: string }
> = {
  water_rescue: { label: "Water Rescue", labelVi: "Cứu hộ đường thủy", icon: "🌊" },
  search_rescue: { label: "Search & Rescue", labelVi: "Tìm kiếm cứu nạn", icon: "🔍" },
  medical: { label: "Medical", labelVi: "Y tế", icon: "🏥" },
  heavy_equipment: { label: "Heavy Equipment", labelVi: "Thiết bị nặng", icon: "🏗️" },
  supply_delivery: { label: "Supply Delivery", labelVi: "Vận chuyển hàng", icon: "📦" },
  aerial_survey: { label: "Aerial Survey", labelVi: "Khảo sát đường không", icon: "🚁" },
  medical_evacuation: { label: "Medical Evacuation", labelVi: "Sơ tán y tế", icon: "🚑" },
  first_aid: { label: "First Aid", labelVi: "Sơ cứu", icon: "🩹" },
  triage: { label: "Triage", labelVi: "Phân loại", icon: "🏷️" },
  communication: { label: "Communication", labelVi: "Truyền thông", icon: "📡" },
  water_pump: { label: "Water Pump", labelVi: "Bơm nước", icon: "💧" },
  power_generation: { label: "Power Generation", labelVi: "Phát điện", icon: "⚡" },
};

// ---------------------------------------------------------------------------
// 8. TASK CONFIG
// ---------------------------------------------------------------------------

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; labelVi: string; color: string; bgColor: string; order: number }
> = {
  new: {
    label: "New",
    labelVi: "Mới",
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.15)",
    order: 0,
  },
  assigned: {
    label: "Assigned",
    labelVi: "Được giao",
    color: "#A855F7",
    bgColor: "rgba(168,85,247,0.15)",
    order: 1,
  },
  in_progress: {
    label: "In Progress",
    labelVi: "Đang thực hiện",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.15)",
    order: 2,
  },
  done: {
    label: "Done",
    labelVi: "Hoàn thành",
    color: "#22C55E",
    bgColor: "rgba(34,197,94,0.15)",
    order: 3,
  },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; labelVi: string; color: string; bgColor: string }
> = {
  P1: { label: "Critical", labelVi: "Khẩn cấp", color: "#DC2626", bgColor: "rgba(220,38,38,0.15)" },
  P2: { label: "High", labelVi: "Gấp", color: "#EA580C", bgColor: "rgba(234,88,12,0.15)" },
  P3: { label: "Medium", labelVi: "Tiêu chuẩn", color: "#CA8A04", bgColor: "rgba(202,138,4,0.15)" },
  P4: { label: "Low", labelVi: "Thấp", color: "#16A34A", bgColor: "rgba(22,163,74,0.15)" },
};

// ---------------------------------------------------------------------------
// 9. VOLUNTEER CONFIG
// ---------------------------------------------------------------------------

export const VOLUNTEER_TYPE_CONFIG: Record<
  VolunteerType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  registered: {
    label: "Registered",
    labelVi: "Đã đăng ký",
    icon: "✅",
    color: "#22C55E",
  },
  spontaneous: {
    label: "Spontaneous",
    labelVi: "Tự phát",
    icon: "⚡",
    color: "#F59E0B",
  },
  professional: {
    label: "Professional",
    labelVi: "Chuyên nghiệp",
    icon: "⭐",
    color: "#8B5CF6",
  },
};

export const VOLUNTEER_STATUS_CONFIG: Record<
  VolunteerStatus,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  available: {
    label: "Available",
    labelVi: "Sẵn sàng",
    icon: "🟢",
    color: "#22C55E",
  },
  deployed: {
    label: "Deployed",
    labelVi: "Đã triển khai",
    icon: "🔵",
    color: "#3B82F6",
  },
  off_duty: {
    label: "Off Duty",
    labelVi: "Nghỉ",
    icon: "⚪",
    color: "#6B7280",
  },
  unavailable: {
    label: "Unavailable",
    labelVi: "Không sẵn sàng",
    icon: "🔴",
    color: "#EF4444",
  },
};

export const VOLUNTEER_SKILL_CONFIG: Record<
  VolunteerSkill,
  { label: string; labelVi: string; icon: string; category: string }
> = {
  search_rescue: { label: "Search & Rescue", labelVi: "Tìm kiếm cứu nạn", icon: "🔍", category: "rescue" },
  first_aid: { label: "First Aid", labelVi: "Sơ cứu", icon: "🩹", category: "medical" },
  water_rescue: { label: "Water Rescue", labelVi: "Cứu hộ đường thủy", icon: "🌊", category: "rescue" },
  heavy_equipment: { label: "Heavy Equipment", labelVi: "Thiết bị nặng", icon: "🏗️", category: "technical" },
  communication: { label: "Communication", labelVi: "Truyền thông", icon: "📡", category: "support" },
  logistics: { label: "Logistics", labelVi: "Hậu cần", icon: "📦", category: "support" },
  translation: { label: "Translation", labelVi: "Phiên dịch", icon: "🗣️", category: "support" },
  counseling: { label: "Counseling", labelVi: "Tư vấn tâm lý", icon: "💚", category: "medical" },
  medical: { label: "Medical", labelVi: "Y tế", icon: "🏥", category: "medical" },
  cooking: { label: "Cooking", labelVi: "Nấu ăn", icon: "🍳", category: "support" },
  driving: { label: "Driving", labelVi: "Lái xe", icon: "🚗", category: "technical" },
  construction: { label: "Construction", labelVi: "Xây dựng", icon: "🔨", category: "technical" },
};

// ---------------------------------------------------------------------------
// 10. SHELTER CONFIG
// ---------------------------------------------------------------------------

export const SHELTER_TYPE_CONFIG: Record<
  ShelterType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  evacuation: {
    label: "Evacuation Point",
    labelVi: "Điểm sơ tán",
    icon: "🏃",
    color: "#3B82F6",
  },
  temporary: {
    label: "Temporary Shelter",
    labelVi: "Nơi trú ẩn tạm thời",
    icon: "⛺",
    color: "#F59E0B",
  },
  transitional: {
    label: "Transitional Shelter",
    labelVi: "Nơi trú ẩn chuyển tiếp",
    icon: "🏠",
    color: "#8B5CF6",
  },
  permanent: {
    label: "Permanent Shelter",
    labelVi: "Nơi trú ẩn cố định",
    icon: "🏢",
    color: "#22C55E",
  },
  medical: {
    label: "Medical Facility",
    labelVi: "Cơ sở y tế",
    icon: "🏥",
    color: "#EC4899",
  },
};

export const SHELTER_STATUS_CONFIG: Record<
  ShelterStatus,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  open: { label: "Open", labelVi: "Đang mở", icon: "🟢", color: "#22C55E" },
  full: { label: "Full", labelVi: "Đã đầy", icon: "🔴", color: "#EF4444" },
  closed: { label: "Closed", labelVi: "Đã đóng", icon: "⚫", color: "#6B7280" },
  preparing: { label: "Preparing", labelVi: "Đang chuẩn bị", icon: "🟡", color: "#F59E0B" },
};

export const SHELTER_NEED_CONFIG: Record<
  ShelterNeed,
  { label: string; labelVi: string; icon: string; urgency: number }
> = {
  food: { label: "Food", labelVi: "Thực phẩm", icon: "🍚", urgency: 1 },
  water: { label: "Water", labelVi: "Nước uống", icon: "💧", urgency: 1 },
  medical: { label: "Medical", labelVi: "Y tế", icon: "🏥", urgency: 1 },
  clothing: { label: "Clothing", labelVi: "Quần áo", icon: "👕", urgency: 3 },
  blankets: { label: "Blankets", labelVi: "Chăn", icon: "🛏️", urgency: 2 },
  sanitation: { label: "Sanitation", labelVi: "Vệ sinh", icon: "🚽", urgency: 2 },
  power: { label: "Power", labelVi: "Điện", icon: "⚡", urgency: 2 },
  communication: { label: "Communication", labelVi: "Truyền thông", icon: "📡", urgency: 3 },
};

export const SHELTER_OCCUPANCY_THRESHOLDS = {
  low: { max: 0.5, color: "#22C55E", label: "Còn nhiều chỗ" },
  medium: { max: 0.8, color: "#EAB308", label: "Sắp đầy" },
  high: { max: 0.95, color: "#F97316", label: "Gần đầy" },
  critical: { max: 1.0, color: "#EF4444", label: "Đã đầy" },
} as const;

// ---------------------------------------------------------------------------
// 11. 3W / ORGANIZATION CONFIG
// ---------------------------------------------------------------------------

export const ORGANIZATION_TYPE_CONFIG: Record<
  OrganizationType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  military: { label: "Military", labelVi: "Quân đội", icon: "🎖️", color: "#EF4444" },
  vnrc: { label: "VNRC", labelVi: "Chữ thập đỏ", icon: "➕", color: "#DC2626" },
  local_govt: { label: "Local Government", labelVi: "Chính quyền địa phương", icon: "🏛️", color: "#3B82F6" },
  volunteer: { label: "Volunteer Group", labelVi: "Nhóm tình nguyện", icon: "🤝", color: "#22C55E" },
  ngo: { label: "NGO", labelVi: "Tổ chức phi chính phủ", icon: "🌐", color: "#A855F7" },
  private: { label: "Private Sector", labelVi: "Tư nhân", icon: "🏢", color: "#F59E0B" },
  un: { label: "UN Agency", labelVi: "Cơ quan LHQ", icon: "🇺🇳", color: "#0EA5E9" },
  government: { label: "Government", labelVi: "Chính phủ", icon: "🇻🇳", color: "#DC2626" },
};

export const HUMANITARIAN_CLUSTER_CONFIG: Record<
  HumanitarianCluster,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  shelter: { label: "Shelter", labelVi: "Nơi trú ẩn", icon: "🏠", color: "#3B82F6" },
  health: { label: "Health", labelVi: "Y tế", icon: "🏥", color: "#EF4444" },
  wash: { label: "WASH", labelVi: "Nước & Vệ sinh", icon: "💧", color: "#06B6D4" },
  food_security: { label: "Food Security", labelVi: "An ninh lương thực", icon: "🍚", color: "#F59E0B" },
  protection: { label: "Protection", labelVi: "Bảo vệ", icon: "🛡️", color: "#8B5CF6" },
  education: { label: "Education", labelVi: "Giáo dục", icon: "📚", color: "#22C55E" },
  logistics: { label: "Logistics", labelVi: "Hậu cần", icon: "📦", color: "#78716C" },
  nutrition: { label: "Nutrition", labelVi: "Dinh dưỡng", icon: "🥗", color: "#10B981" },
  early_recovery: { label: "Early Recovery", labelVi: "Phục hồi sớm", icon: "🔄", color: "#14B8A6" },
  emergency_telecommunications: {
    label: "Emergency Telecom",
    labelVi: "Truyền thông khẩn cấp",
    icon: "📡",
    color: "#6366F1",
  },
  camp_management: { label: "Camp Management", labelVi: "Quản lý trại", icon: "⛺", color: "#A855F7" },
};

export const ACTIVITY_STATUS_CONFIG: Record<
  ActivityStatus,
  { label: string; labelVi: string; color: string }
> = {
  planned: { label: "Planned", labelVi: "Kế hoạch", color: "#3B82F6" },
  active: { label: "Active", labelVi: "Đang thực hiện", color: "#22C55E" },
  completed: { label: "Completed", labelVi: "Hoàn thành", color: "#6B7280" },
  suspended: { label: "Suspended", labelVi: "Tạm dừng", color: "#F59E0B" },
};

// ---------------------------------------------------------------------------
// 12. COMMUNICATION CONFIG
// ---------------------------------------------------------------------------

export const CHANNEL_TYPE_CONFIG: Record<
  ChannelType,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  incident: { label: "Incident", labelVi: "Sự cố", icon: "🚨", color: "#EF4444" },
  command: { label: "Command", labelVi: "Chỉ huy", icon: "🎖️", color: "#F59E0B" },
  logistics: { label: "Logistics", labelVi: "Hậu cần", icon: "📦", color: "#3B82F6" },
  medical: { label: "Medical", labelVi: "Y tế", icon: "🏥", color: "#EC4899" },
  general: { label: "General", labelVi: "Chung", icon: "💬", color: "#6B7280" },
};

export const MESSAGE_TYPE_CONFIG: Record<
  MessageType,
  { label: string; labelVi: string; icon: string }
> = {
  text: { label: "Text", labelVi: "Văn bản", icon: "💬" },
  status_update: { label: "Status Update", labelVi: "Cập nhật trạng thái", icon: "📊" },
  resource_request: { label: "Resource Request", labelVi: "Yêu cầu tài nguyên", icon: "📦" },
  location_share: { label: "Location Share", labelVi: "Chia sẻ vị trí", icon: "📍" },
  system: { label: "System", labelVi: "Hệ thống", icon: "🤖" },
};

export const BROADCAST_PRIORITY_CONFIG: Record<
  BroadcastPriority,
  { label: string; labelVi: string; color: string; icon: string }
> = {
  normal: { label: "Normal", labelVi: "Bình thường", color: "#6B7280", icon: "📢" },
  urgent: { label: "Urgent", labelVi: "Khẩn cấp", color: "#F97316", icon: "⚠️" },
  critical: { label: "Critical", labelVi: "Cấp bách", color: "#EF4444", icon: "🚨" },
};

// ---------------------------------------------------------------------------
// 13. TIMELINE CONFIG
// ---------------------------------------------------------------------------

export const TIMELINE_EVENT_TYPE_CONFIG: Record<
  TimelineEventType,
  { label: string; labelVi: string; icon: string; color: string; category: string }
> = {
  incident_created: { label: "Incident Created", labelVi: "Tạo sự cố", icon: "🆕", color: "#3B82F6", category: "incident" },
  incident_updated: { label: "Incident Updated", labelVi: "Cập nhật sự cố", icon: "📝", color: "#3B82F6", category: "incident" },
  incident_escalated: { label: "Incident Escalated", labelVi: "Caoescalation", icon: "⬆️", color: "#F97316", category: "incident" },
  incident_resolved: { label: "Incident Resolved", labelVi: "Giải quyết sự cố", icon: "✅", color: "#22C55E", category: "incident" },
  incident_closed: { label: "Incident Closed", labelVi: "Đóng sự cố", icon: "📁", color: "#6B7280", category: "incident" },
  task_created: { label: "Task Created", labelVi: "Tạo nhiệm vụ", icon: "📋", color: "#22C55E", category: "task" },
  task_assigned: { label: "Task Assigned", labelVi: "Giao nhiệm vụ", icon: "👤", color: "#22C55E", category: "task" },
  task_started: { label: "Task Started", labelVi: "Bắt đầu nhiệm vụ", icon: "▶️", color: "#22C55E", category: "task" },
  task_completed: { label: "Task Completed", labelVi: "Hoàn thành nhiệm vụ", icon: "✅", color: "#22C55E", category: "task" },
  resource_deployed: { label: "Resource Deployed", labelVi: "Triển khai tài nguyên", icon: "🚁", color: "#F59E0B", category: "resource" },
  resource_returned: { label: "Resource Returned", labelVi: "Tài nguyên trở về", icon: "↩️", color: "#F59E0B", category: "resource" },
  volunteer_assigned: { label: "Volunteer Assigned", labelVi: "Phân công TVV", icon: "🤝", color: "#8B5CF6", category: "volunteer" },
  volunteer_released: { label: "Volunteer Released", labelVi: "TVV được nghỉ", icon: "👋", color: "#8B5CF6", category: "volunteer" },
  shelter_opened: { label: "Shelter Opened", labelVi: "Mở nơi trú ẩn", icon: "🏠", color: "#3B82F6", category: "shelter" },
  shelter_updated: { label: "Shelter Updated", labelVi: "Cập nhật nơi trú ẩn", icon: "📝", color: "#3B82F6", category: "shelter" },
  shelter_closed: { label: "Shelter Closed", labelVi: "Đóng nơi trú ẩn", icon: "🔒", color: "#6B7280", category: "shelter" },
  sos_received: { label: "SOS Received", labelVi: "Nhận SOS", icon: "🆘", color: "#EF4444", category: "sos" },
  sos_triaged: { label: "SOS Triaged", labelVi: "Phân loại SOS", icon: "🏷️", color: "#8B5CF6", category: "sos" },
  sos_dispatched: { label: "SOS Dispatched", labelVi: "Triển khai cứu hộ", icon: "🚁", color: "#3B82F6", category: "sos" },
  sos_resolved: { label: "SOS Resolved", labelVi: "Cứu hộ thành công", icon: "✅", color: "#22C55E", category: "sos" },
  status_update: { label: "Status Update", labelVi: "Cập nhật trạng thái", icon: "📊", color: "#6B7280", category: "system" },
  message_sent: { label: "Message Sent", labelVi: "Gửi tin nhắn", icon: "💬", color: "#6B7280", category: "system" },
  broadcast_sent: { label: "Broadcast Sent", labelVi: "Gửi broadcast", icon: "📢", color: "#F59E0B", category: "system" },
  check_in: { label: "Check In", labelVi: "Check-in", icon: "📍", color: "#22C55E", category: "checkin" },
  check_out: { label: "Check Out", labelVi: "Check-out", icon: "🚪", color: "#6B7280", category: "checkin" },
  note_added: { label: "Note Added", labelVi: "Thêm ghi chú", icon: "📝", color: "#6B7280", category: "system" },
  command_transferred: { label: "Command Transferred", labelVi: "Chuyển quyền chỉ huy", icon: "🔄", color: "#F59E0B", category: "incident" },
  iap_created: { label: "IAP Created", labelVi: "Tạo IAP", icon: "📋", color: "#3B82F6", category: "incident" },
  iap_updated: { label: "IAP Updated", labelVi: "Cập nhật IAP", icon: "📝", color: "#3B82F6", category: "incident" },
};

// ---------------------------------------------------------------------------
// 14. CHECK-IN CONFIG
// ---------------------------------------------------------------------------

export const CHECK_IN_STATUS_CONFIG: Record<
  CheckInStatus,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  safe: { label: "Safe", labelVi: "An toàn", icon: "✅", color: "#22C55E" },
  need_help: { label: "Need Help", labelVi: "Cần giúp đỡ", icon: "🆘", color: "#F59E0B" },
  missing: { label: "Missing", labelVi: "Mất tích", icon: "❓", color: "#EF4444" },
  evacuated: { label: "Evacuated", labelVi: "Đã sơ tán", icon: "🏃", color: "#3B82F6" },
  hospitalized: { label: "Hospitalized", labelVi: "Nhập viện", icon: "🏥", color: "#EC4899" },
};

// ---------------------------------------------------------------------------
// 15. DISPATCH CONFIG
// ---------------------------------------------------------------------------

export const DISPATCH_REASON_CONFIG: Record<
  DispatchReason,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  nearest: { label: "Nearest", labelVi: "Gần nhất", icon: "📍", color: "#3B82F6" },
  best_capability: { label: "Best Capability", labelVi: "Đủ năng lực nhất", icon: "⭐", color: "#F59E0B" },
  highest_capacity: { label: "Highest Capacity", labelVi: "Sức chứa lớn nhất", icon: "📦", color: "#22C55E" },
  fastest_response: { label: "Fastest Response", labelVi: "Nhanh nhất", icon: "⚡", color: "#EF4444" },
  most_available: { label: "Most Available", labelVi: "Sẵn sàng nhất", icon: "🟢", color: "#10B981" },
  best_overall: { label: "Best Overall", labelVi: "Tốt nhất tổng thể", icon: "🏆", color: "#8B5CF6" },
};

// ---------------------------------------------------------------------------
// 16. MAP LAYERS
// ---------------------------------------------------------------------------

export const DEFAULT_MAP_LAYERS: MapLayerConfig[] = [
  { id: "incidents", name: "Incidents", nameVi: "Sự cố", icon: "🔴", visible: true, color: "#EF4444" },
  { id: "sos", name: "SOS Requests", nameVi: "Yêu cầu SOS", icon: "🆘", visible: true, color: "#DC2626" },
  { id: "resources", name: "Resources", nameVi: "Tài nguyên", icon: "🚁", visible: true, color: "#3B82F6" },
  { id: "shelters", name: "Shelters", nameVi: "Nơi trú ẩn", icon: "🏠", visible: true, color: "#22C55E" },
  { id: "volunteers", name: "Volunteers", nameVi: "Tình nguyện viên", icon: "🤝", visible: false, color: "#8B5CF6" },
  { id: "organizations", name: "Organizations", nameVi: "Tổ chức", icon: "🏢", visible: false, color: "#F59E0B" },
  { id: "heatmap", name: "Incident Heatmap", nameVi: "Bản đồ nhiệt", icon: "🌡️", visible: false, color: "#F97316" },
  { id: "zones", name: "Danger Zones", nameVi: "Vùng nguy hiểm", icon: "⚠️", visible: false, color: "#EF4444" },
];

// ---------------------------------------------------------------------------
// 17. TAB CONFIG
// ---------------------------------------------------------------------------

export const RESCUE_TAB_CONFIG: Array<{
  id: RescueTab;
  label: string;
  labelVi: string;
  icon: string;
}> = [
  { id: "dashboard", label: "Dashboard", labelVi: "Tổng quan", icon: "📊" },
  { id: "operations", label: "Operations", labelVi: "Bản đồ tác chiến", icon: "🗺️" },
  { id: "sos", label: "SOS", labelVi: "SOS Cứu hộ", icon: "🆘" },
  { id: "tasks", label: "Tasks", labelVi: "Nhiệm vụ", icon: "📋" },
  { id: "resources", label: "Resources", labelVi: "Tài nguyên", icon: "🚁" },
  { id: "3w", label: "3W", labelVi: "Ai-Ở đâu-Làm gì", icon: "🌐" },
  { id: "shelters", label: "Shelters", labelVi: "Nơi trú ẩn", icon: "🏠" },
  { id: "communication", label: "Comms", labelVi: "Liên lạc", icon: "💬" },
  { id: "timeline", label: "Timeline", labelVi: "Dòng thời gian", icon: "📅" },
  { id: "volunteers", label: "Volunteers", labelVi: "Tình nguyện", icon: "🤝" },
  { id: "checkin", label: "Check-in", labelVi: "Check-in an toàn", icon: "✅" },
  { id: "dispatch", label: "Dispatch", labelVi: "Điều phối", icon: "🚁" },
  { id: "command", label: "Command", labelVi: "Chỉ huy", icon: "🎖️" },
  { id: "flow", label: "Flow", labelVi: "Dòng tài nguyên", icon: "🔄" },
];

// ---------------------------------------------------------------------------
// 18. DEFAULT VALUES
// ---------------------------------------------------------------------------

export const DEFAULT_INCIDENT_FILTER: IncidentFilter = {
  status: [],
  type: [],
  priority: [],
  province: "all",
  dateRange: {
    start: null,
    end: null,
  },
};

// ---------------------------------------------------------------------------
// 19. ANIMATION CONFIG
// ---------------------------------------------------------------------------

export const RESCUE_ANIMATION = {
  stagger: 0.04,
  delayChildren: 0.1,
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    gauge: 0.8,
    counter: 1.5,
  },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  spring: {
    gentle: { type: "spring" as const, stiffness: 100, damping: 15 },
    bouncy: { type: "spring" as const, stiffness: 300, damping: 25 },
    stiff: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
} as const;

// ---------------------------------------------------------------------------
// 20. PROVINCE DATA (Vietnam)
// ---------------------------------------------------------------------------

export const RESCUE_PROVINCES = [
  { code: "QN", name: "Quảng Ninh", region: "northeast", lat: 21.0, lng: 107.3, riskLevel: "high" },
  { code: "HP", name: "Hải Phòng", region: "red_river_delta", lat: 20.8, lng: 106.7, riskLevel: "high" },
  { code: "HD", name: "Hải Dương", region: "red_river_delta", lat: 20.9, lng: 106.3, riskLevel: "medium" },
  { code: "TB", name: "Thái Bình", region: "red_river_delta", lat: 20.4, lng: 106.3, riskLevel: "high" },
  { code: "ND", name: "Nam Định", region: "red_river_delta", lat: 20.4, lng: 106.2, riskLevel: "high" },
  { code: "HN", name: "Hà Nội", region: "red_river_delta", lat: 21.0, lng: 105.8, riskLevel: "medium" },
  { code: "LC", name: "Lào Cai", region: "northwest", lat: 22.3, lng: 103.5, riskLevel: "high" },
  { code: "YB", name: "Yên Bái", region: "northwest", lat: 21.7, lng: 104.5, riskLevel: "high" },
  { code: "CB", name: "Cao Bằng", region: "northeast", lat: 22.7, lng: 106.3, riskLevel: "high" },
  { code: "LS", name: "Lạng Sơn", region: "northeast", lat: 21.8, lng: 106.8, riskLevel: "high" },
  { code: "QB", name: "Quảng Bình", region: "north_central", lat: 17.5, lng: 106.6, riskLevel: "critical" },
  { code: "QT", name: "Quảng Trị", region: "north_central", lat: 16.7, lng: 107.2, riskLevel: "critical" },
  { code: "TTH", name: "Thừa Thiên Huế", region: "north_central", lat: 16.5, lng: 107.6, riskLevel: "critical" },
  { code: "QN2", name: "Quảng Nam", region: "south_central", lat: 15.6, lng: 108.0, riskLevel: "high" },
  { code: "DN", name: "Đà Nẵng", region: "south_central", lat: 16.0, lng: 108.2, riskLevel: "high" },
] as const;
