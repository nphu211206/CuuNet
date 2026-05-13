"use client";

import type { DisasterType, SeverityLevel } from "@/lib/types";

// =============================================================================
// ALERT & SOS MODULE - TypeScript Types
// Module Cảnh Báo & SOS Thiên Tai
// Inspired by: OASIS CAP v1.2, FEMA IPAWS, 3GPP Cell Broadcast
// =============================================================================

// ---------------------------------------------------------------------------
// 1. CAP-INSPIRED ALERT TYPES (Common Alerting Protocol v1.2)
// ---------------------------------------------------------------------------

/** Trạng thái cảnh báo theo CAP */
export type AlertStatus = "actual" | "exercise" | "test" | "draft";

/** Loại tin nhắn cảnh báo theo CAP */
export type AlertMsgType = "alert" | "update" | "cancel" | "ack" | "error";

/** Phạm vi cảnh báo theo CAP */
export type AlertScope = "public" | "restricted" | "private";

/** Nhóm danh mục cảnh báo theo CAP */
export type AlertCategory = "geo" | "met" | "safety" | "security" | "rescue" | "health" | "infra";

/** Mức độ khẩn cấp theo CAP */
export type AlertUrgency = "immediate" | "expected" | "future" | "past";

/** Mức độ chắc chắn theo CAP */
export type AlertCertainty = "observed" | "likely" | "possible" | "unlikely";

/** Mức độ nghiêm trọng mở rộng (theo CAP + mở rộng cho VN) */
export type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";

/** Loại phản hồi khuyến nghị theo CAP */
export type AlertResponseType = "shelter" | "evacuate" | "prepare" | "avoid" | "monitor" | "allclear";

/** Nguồn gửi cảnh báo */
export type AlertSender = "vndma" | "cnet-ai" | "community" | "international";

/** Kênh phát cảnh báo */
export type DeliveryChannel = "push" | "sms" | "zalo" | "loudspeaker" | "email";

/** Trạng thái xác nhận của người dùng */
export type AckStatus = "pending" | "acknowledged" | "dismissed" | "expired";

// ---------------------------------------------------------------------------
// 2. ALERT CORE INTERFACES (CAP-Inspired Structure)
// ---------------------------------------------------------------------------

/** Vùng địa lý bị ảnh hưởng (CAP area) */
export interface AlertArea {
  areaDesc: string;
  provinces: string[];
  polygon?: GeoJSONPolygon;
  circle?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
  geocode?: Record<string, string>;
}

/** Tọa độ GeoJSON Polygon */
export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

/** Thông tin chi tiết cảnh báo (CAP info) */
export interface AlertInfo {
  language: "vi" | "en";
  category: AlertCategory;
  event: string;
  responseType: AlertResponseType;
  urgency: AlertUrgency;
  severity: AlertSeverity;
  certainty: AlertCertainty;
  headline: string;
  description: string;
  instruction: string;
  area: AlertArea;
  effective: string;
  expires: string;
  senderName: string;
  web?: string;
  contact?: string;
}

/** Thông tin phát cảnh báo */
export interface AlertDelivery {
  channels: DeliveryChannel[];
  deliveredCount: number;
  acknowledgedCount: number;
  failedCount: number;
  escalatedAt?: string;
  escalationLevel: number;
}

/** Cảnh báo chính - mô hình dữ liệu CAP-inspired */
export interface Alert {
  id: string;
  identifier: string;
  sender: AlertSender;
  sent: string;
  status: AlertStatus;
  msgType: AlertMsgType;
  scope: AlertScope;
  info: AlertInfo;
  delivery: AlertDelivery;
  relatedAlerts?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Cảnh báo tóm tắt cho danh sách */
export interface AlertSummary {
  id: string;
  headline: string;
  severity: AlertSeverity;
  type: DisasterType;
  category: AlertCategory;
  urgency: AlertUrgency;
  provinces: string[];
  effective: string;
  expires: string;
  isActive: boolean;
  senderName: string;
  acknowledgmentStatus: AckStatus;
}

// ---------------------------------------------------------------------------
// 3. SOS REQUEST TYPES
// ---------------------------------------------------------------------------

/** Loại tình huống SOS */
export type SOSType =
  | "flood"
  | "storm"
  | "landslide"
  | "earthquake"
  | "tsunami"
  | "fire"
  | "medical"
  | "trapped"
  | "stranded"
  | "other";

/** Mức độ khẩn cấp SOS */
export type SOSEmergencyLevel = "life_threatening" | "urgent" | "need_help";

/** Trạng thái SOS */
export type SOSStatus = "queued" | "sent" | "delivered" | "acknowledged" | "dispatched" | "resolved" | "failed";

/** Vị trí GPS của SOS */
export interface SOSLocation {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  what3words?: string;
  address?: string;
  province?: string;
  district?: string;
}

/** Tình huống SOS */
export interface SOSSituation {
  type: SOSType;
  severity: SOSEmergencyLevel;
  peopleCount: number;
  description?: string;
  photos?: string[];
  hasChildren: boolean;
  hasElderly: boolean;
  hasDisabled: boolean;
  isTrapped: boolean;
  needsMedical: boolean;
}

/** Thông tin liên hệ SOS */
export interface SOSContact {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  relationship?: string;
}

/** Dòng thời gian SOS */
export interface SOSTimeline {
  status: SOSStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

/** Yêu cầu SOS chính */
export interface SOSRequest {
  id: string;
  userId: string;
  location: SOSLocation;
  situation: SOSSituation;
  contact: SOSContact;
  status: SOSStatus;
  timeline: SOSTimeline[];
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
  dispatchedAt?: string;
  resolvedAt?: string;
  isOffline: boolean;
  retryCount: number;
  maxRetries: number;
  priorityScore: number;
  estimatedResponseTime?: number;
  assignedTeam?: string;
  notes?: string;
}

/** SOS tóm tắt cho danh sách */
export interface SOSSummary {
  id: string;
  type: SOSType;
  severity: SOSEmergencyLevel;
  status: SOSStatus;
  province: string;
  peopleCount: number;
  createdAt: string;
  isOffline: boolean;
  priorityScore: number;
}

// ---------------------------------------------------------------------------
// 4. EMERGENCY CONTACT TYPES
// ---------------------------------------------------------------------------

/** Loại liên hệ khẩn cấp */
export type EmergencyContactType =
  | "police"
  | "fire"
  | "ambulance"
  | "coast_guard"
  | "disaster"
  | "rescue"
  | "military"
  | "red_cross"
  | "hospital"
  | "electricity"
  | "water";

/** Liên hệ khẩn cấp */
export interface EmergencyContact {
  id: string;
  name: string;
  nameVi: string;
  number: string;
  type: EmergencyContactType;
  icon: string;
  color: string;
  available24_7: boolean;
  description: string;
  province?: string;
  district?: string;
  address?: string;
  isNational: boolean;
  priority: number;
}

/** Nhóm liên hệ theo tỉnh */
export interface ProvinceEmergencyDirectory {
  province: string;
  nationalContacts: EmergencyContact[];
  localContacts: EmergencyContact[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// 5. CHECKLIST TYPES
// ---------------------------------------------------------------------------

/** Nhóm checklist */
export type ChecklistCategory =
  | "supplies"
  | "documents"
  | "home"
  | "communication"
  | "evacuation"
  | "health";

/** Mức ưu tiên checklist */
export type ChecklistPriority = "essential" | "recommended" | "optional";

/** Mùa áp dụng */
export type ChecklistSeason = "all" | "monsoon" | "dry" | "typhoon";

/** Khu vực áp dụng */
export type ChecklistRegion = "all" | "coastal" | "flood_prone" | "mountainous" | "delta" | "urban";

/** Mục checklist */
export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string;
  priority: ChecklistPriority;
  icon: string;
  disasterTypes: DisasterType[];
  regions: ChecklistRegion[];
  season: ChecklistSeason;
  estimatedCost?: string;
  tips?: string;
  externalLink?: string;
}

/** Trạng thái hoàn thành checklist của người dùng */
export interface ChecklistProgress {
  itemId: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

/** Checklist tổng hợp */
export interface ChecklistState {
  items: ChecklistItem[];
  progress: ChecklistProgress[];
  selectedProvince: string;
  selectedSeason: ChecklistSeason;
  completionPercentage: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// 6. AI RELEVANCE FILTERING TYPES
// ---------------------------------------------------------------------------

/** Các yếu tố tính điểm liên quan */
export interface RelevanceFactors {
  distanceScore: number;
  severityScore: number;
  vulnerabilityScore: number;
  preferenceScore: number;
  urgencyScore: number;
}

/** Kết quả tính điểm liên quan */
export interface RelevanceResult {
  totalScore: number;
  factors: RelevanceFactors;
  shouldNotify: boolean;
  reason: string;
  deduplicationKey?: string;
}

/** Ngưỡng gửi theo mức độ */
export interface SeverityThreshold {
  severity: AlertSeverity;
  minScore: number;
  channels: DeliveryChannel[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoEscalate: boolean;
}

// ---------------------------------------------------------------------------
// 7. ESCALATION ENGINE TYPES
// ---------------------------------------------------------------------------

/** Bước trong chuỗi leo thang */
export interface EscalationStep {
  level: number;
  channel: DeliveryChannel;
  delayMinutes: number;
  condition: "no_ack" | "no_response" | "still_active";
  action: "send" | "retry" | "escalate";
}

/** Trạng thái leo thang */
export interface EscalationState {
  alertId: string;
  currentLevel: number;
  steps: EscalationStep[];
  startedAt: string;
  lastEscalatedAt?: string;
  nextEscalationAt?: string;
  isComplete: boolean;
  outcome: "acknowledged" | "max_level_reached" | "expired" | null;
}

// ---------------------------------------------------------------------------
// 8. OFFLINE QUEUE TYPES
// ---------------------------------------------------------------------------

/** Mục trong hàng đợi offline */
export interface OfflineQueueItem {
  id: string;
  type: "sos" | "alert_ack" | "vote";
  payload: SOSRequest | AlertAckPayload | VotePayload;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  status: "pending" | "sending" | "failed" | "sent";
  error?: string;
}

/** Payload xác nhận cảnh báo */
export interface AlertAckPayload {
  alertId: string;
  userId: string;
  status: AckStatus;
  timestamp: string;
}

/** Payload bình chọn */
export interface VotePayload {
  reportId: string;
  userId: string;
  voteType: "up" | "down";
  timestamp: string;
}

/** Trạng thái hàng đợi offline */
export interface OfflineQueueState {
  items: OfflineQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: string;
  failedCount: number;
  pendingCount: number;
}

// ---------------------------------------------------------------------------
// 9. ALERT FILTER & SORT TYPES
// ---------------------------------------------------------------------------

/** Bộ lọc cảnh báo */
export interface AlertFilters {
  severities: AlertSeverity[];
  types: DisasterType[];
  categories: AlertCategory[];
  provinces: string[];
  urgencies: AlertUrgency[];
  dateRange: {
    preset: "1h" | "6h" | "24h" | "7d" | "30d" | "all";
    start: string | null;
    end: string | null;
  };
  showExpired: boolean;
  showCancelled: boolean;
  senderFilter: AlertSender[];
}

/** Tùy chọn sắp xếp */
export type AlertSortOption =
  | "newest"
  | "oldest"
  | "mostSevere"
  | "mostUrgent"
  | "nearestExpiry"
  | "mostRelevant";

/** Chế độ xem */
export type AlertViewMode = "dashboard" | "feed" | "map" | "sos" | "directory" | "checklist" | "history";

// ---------------------------------------------------------------------------
// 10. STATISTICS TYPES
// ---------------------------------------------------------------------------

/** Thống kê cảnh báo */
export interface AlertStats {
  totalActive: number;
  extremeCount: number;
  severeCount: number;
  moderateCount: number;
  minorCount: number;
  pendingSOS: number;
  resolvedTodaySOS: number;
  totalAlertsThisWeek: number;
  checklistCompletionAvg: number;
  topDisasterType: DisasterType;
  topProvince: string;
  alertsByType: Record<DisasterType, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByProvince: Record<string, number>;
  sosByStatus: Record<SOSStatus, number>;
  sosByType: Record<SOSType, number>;
  recentTrend: "increasing" | "stable" | "decreasing";
  averageResponseTime: number;
  onlineUserCount: number;
}

// ---------------------------------------------------------------------------
// 11. CONTEXT STATE & ACTIONS
// ---------------------------------------------------------------------------

/** Trạng thái tổng thể của module Alert & SOS */
export interface AlertSOSState {
  // Alert state
  alerts: Alert[];
  selectedAlert: Alert | null;
  alertFilters: AlertFilters;
  alertSort: AlertSortOption;
  isAlertDetailOpen: boolean;

  // SOS state
  sosRequests: SOSRequest[];
  selectedSOS: SOSRequest | null;
  isSOSFormOpen: boolean;
  sosFormStep: number;

  // Emergency directory
  emergencyContacts: EmergencyContact[];
  selectedProvince: string;

  // Checklist
  checklistItems: ChecklistItem[];
  checklistProgress: ChecklistProgress[];
  checklistProvince: string;
  checklistSeason: ChecklistSeason;

  // Offline queue
  offlineQueue: OfflineQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;

  // Escalation
  escalationStates: EscalationState[];

  // UI state
  viewMode: AlertViewMode;
  isLoading: boolean;
  error: string | null;

  // Toast notifications
  toasts: AlertToast[];

  // Stats
  stats: AlertStats;

  // User
  userId: string;
  userLocation: { lat: number; lng: number } | null;
  userPreferences: AlertUserPreferences;
}

/** Toast notification */
export interface AlertToast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "sos";
  title: string;
  message: string;
  duration: number;
  createdAt: string;
  action?: {
    label: string;
    onClick: string;
  };
}

/** Tùy chọn người dùng cho cảnh báo */
export interface AlertUserPreferences {
  subscribedTypes: DisasterType[];
  subscribedProvinces: string[];
  quietHoursStart: string;
  quietHoursEnd: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  maxAlertsPerDay: number;
  preferredLanguage: "vi" | "en";
}

/** Action types cho Reducer */
export type AlertSOSAction =
  // Alert actions
  | { type: "SET_ALERTS"; payload: Alert[] }
  | { type: "ADD_ALERT"; payload: Alert }
  | { type: "UPDATE_ALERT"; payload: { id: string; updates: Partial<Alert> } }
  | { type: "REMOVE_ALERT"; payload: string }
  | { type: "SELECT_ALERT"; payload: Alert | null }
  | { type: "SET_ALERT_FILTERS"; payload: Partial<AlertFilters> }
  | { type: "RESET_ALERT_FILTERS" }
  | { type: "SET_ALERT_SORT"; payload: AlertSortOption }
  | { type: "TOGGLE_ALERT_DETAIL"; payload: boolean }
  | { type: "ACKNOWLEDGE_ALERT"; payload: { alertId: string; userId: string } }
  | { type: "DISMISS_ALERT"; payload: { alertId: string; userId: string } }

  // SOS actions
  | { type: "SET_SOS_REQUESTS"; payload: SOSRequest[] }
  | { type: "ADD_SOS_REQUEST"; payload: SOSRequest }
  | { type: "UPDATE_SOS_STATUS"; payload: { id: string; status: SOSStatus; note?: string } }
  | { type: "SELECT_SOS"; payload: SOSRequest | null }
  | { type: "TOGGLE_SOS_FORM"; payload: boolean }
  | { type: "SET_SOS_FORM_STEP"; payload: number }

  // Emergency directory actions
  | { type: "SET_EMERGENCY_CONTACTS"; payload: EmergencyContact[] }
  | { type: "SET_SELECTED_PROVINCE"; payload: string }

  // Checklist actions
  | { type: "SET_CHECKLIST_ITEMS"; payload: ChecklistItem[] }
  | { type: "TOGGLE_CHECKLIST_ITEM"; payload: string }
  | { type: "SET_CHECKLIST_PROVINCE"; payload: string }
  | { type: "SET_CHECKLIST_SEASON"; payload: ChecklistSeason }
  | { type: "RESET_CHECKLIST_PROGRESS" }

  // Offline queue actions
  | { type: "ADD_TO_OFFLINE_QUEUE"; payload: OfflineQueueItem }
  | { type: "REMOVE_FROM_OFFLINE_QUEUE"; payload: string }
  | { type: "UPDATE_QUEUE_ITEM_STATUS"; payload: { id: string; status: OfflineQueueItem["status"]; error?: string } }
  | { type: "SET_ONLINE_STATUS"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean }
  | { type: "CLEAR_SENT_QUEUE_ITEMS" }

  // Escalation actions
  | { type: "START_ESCALATION"; payload: EscalationState }
  | { type: "UPDATE_ESCALATION"; payload: { alertId: string; updates: Partial<EscalationState> } }
  | { type: "STOP_ESCALATION"; payload: string }

  // UI actions
  | { type: "SET_VIEW_MODE"; payload: AlertViewMode }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }

  // Toast actions
  | { type: "ADD_TOAST"; payload: AlertToast }
  | { type: "REMOVE_TOAST"; payload: string }
  | { type: "CLEAR_TOASTS" }

  // Stats
  | { type: "SET_STATS"; payload: AlertStats }

  // User
  | { type: "SET_USER_LOCATION"; payload: { lat: number; lng: number } | null }
  | { type: "UPDATE_USER_PREFERENCES"; payload: Partial<AlertUserPreferences> }

  // Initialization
  | { type: "INITIALIZE"; payload: Partial<AlertSOSState> };

// ---------------------------------------------------------------------------
// 12. COMPONENT PROPS TYPES
// ---------------------------------------------------------------------------

export interface AlertStatsBarProps {
  stats: AlertStats;
  className?: string;
}

export interface AlertMapProps {
  alerts: Alert[];
  sosRequests: SOSRequest[];
  userLocation: { lat: number; lng: number } | null;
  selectedAlert: Alert | null;
  onAlertSelect: (alert: Alert | null) => void;
  onSOSSelect: (sos: SOSRequest | null) => void;
  className?: string;
}

export interface SOSPanelProps {
  onSubmit: (data: SOSSituation & { location: SOSLocation; contact: SOSContact }) => void;
  isSubmitting: boolean;
  className?: string;
}

export interface AlertFeedProps {
  alerts: Alert[];
  filters: AlertFilters;
  sort: AlertSortOption;
  onAlertClick: (alert: Alert) => void;
  onFilterChange: (filters: Partial<AlertFilters>) => void;
  onSortChange: (sort: AlertSortOption) => void;
  isLoading: boolean;
  className?: string;
}

export interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onShare: (alertId: string) => void;
}

export interface EmergencyDirectoryProps {
  contacts: EmergencyContact[];
  selectedProvince: string;
  onProvinceChange: (province: string) => void;
  className?: string;
}

export interface ChecklistManagerProps {
  items: ChecklistItem[];
  progress: ChecklistProgress[];
  province: string;
  season: ChecklistSeason;
  onToggleItem: (itemId: string) => void;
  onProvinceChange: (province: string) => void;
  onSeasonChange: (season: ChecklistSeason) => void;
  onReset: () => void;
  className?: string;
}

export interface SOSHistoryPanelProps {
  sosRequests: SOSRequest[];
  onSelectSOS: (sos: SOSRequest) => void;
  className?: string;
}

export interface SOSStatusTrackerProps {
  sosRequest: SOSRequest;
  className?: string;
}

// ---------------------------------------------------------------------------
// 13. API RESPONSE TYPES
// ---------------------------------------------------------------------------

export interface PaginatedAlerts {
  alerts: Alert[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AlertAPIResponse {
  success: boolean;
  data?: Alert | Alert[];
  error?: string;
  timestamp: string;
}

export interface SOSAPIResponse {
  success: boolean;
  data?: SOSRequest;
  error?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 14. HOOK RETURN TYPES
// ---------------------------------------------------------------------------

export interface UseAlertsReturn {
  alerts: Alert[];
  filteredAlerts: Alert[];
  stats: AlertStats;
  filters: AlertFilters;
  sort: AlertSortOption;
  isLoading: boolean;
  error: string | null;
  setFilter: (key: keyof AlertFilters, value: unknown) => void;
  resetFilters: () => void;
  setSort: (sort: AlertSortOption) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  getAlertById: (id: string) => Alert | undefined;
}

export interface UseSOSReturn {
  sosRequests: SOSRequest[];
  pendingCount: number;
  resolvedTodayCount: number;
  isSubmitting: boolean;
  submitError: string | null;
  submitSOS: (data: SOSSituation & { location: SOSLocation; contact: SOSContact }) => Promise<boolean>;
  updateStatus: (id: string, status: SOSStatus, note?: string) => void;
  getSOSSummary: () => SOSSummary[];
}

export interface UseChecklistReturn {
  items: ChecklistItem[];
  progress: ChecklistProgress[];
  completionPercentage: number;
  filteredItems: ChecklistItem[];
  toggleItem: (itemId: string) => void;
  setProvince: (province: string) => void;
  setSeason: (season: ChecklistSeason) => void;
  resetProgress: () => void;
  printableHTML: string;
}

export interface UseEmergencyReturn {
  contacts: EmergencyContact[];
  nationalContacts: EmergencyContact[];
  localContacts: EmergencyContact[];
  selectedProvince: string;
  setProvince: (province: string) => void;
  callContact: (number: string) => void;
  searchContacts: (query: string) => EmergencyContact[];
}

export interface UseOfflineQueueReturn {
  queue: OfflineQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  addToQueue: (item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status">) => void;
  syncQueue: () => Promise<void>;
  clearQueue: () => void;
  retryFailed: () => void;
}

export interface UseGeolocationReturn {
  position: { lat: number; lng: number } | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<void>;
  watchPosition: () => void;
  clearWatch: () => void;
}
