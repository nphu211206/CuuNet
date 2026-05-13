"use client";

// =============================================================================
// RESCUE COORDINATION MODULE - TypeScript Types
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Inspired by:
//   - ICS (Incident Command System) - FEMA/NIMS
//   - UN OCHA 3W/5W Dashboard
//   - START/SALT Triage Systems
//   - IFRC Volunteer Management Toolkit
//   - IASC Shelter Cluster Guidelines
//   - AVL (Automatic Vehicle Location) - FEMA
//   - HXL (Humanitarian Exchange Language)
// =============================================================================

import type { DisasterType, SeverityLevel } from "@/lib/types";

// ---------------------------------------------------------------------------
// 1. INCIDENT TYPES (ICS-Based)
// ---------------------------------------------------------------------------

/** Trạng thái sự cố theo ICS lifecycle */
export type IncidentStatus = "new" | "active" | "resolved" | "closed" | "escalated";

/** Mức độ ưu tiên sự cố */
export type IncidentPriority = "P1" | "P2" | "P3" | "P4";

/** Loại sự cố thiên tai */
export type IncidentType = DisasterType | "fire" | "infrastructure" | "industrial" | "other";

/** Giai đoạn phản hồi */
export type ResponsePhase = "preparedness" | "response" | "recovery" | "mitigation";

/** Cấu trúc chỉ huy ICS */
export interface ICSCommandStructure {
  incidentCommander: ICSPerson | null;
  operationsSectionChief: ICSPerson | null;
  planningSectionChief: ICSPerson | null;
  logisticsSectionChief: ICSPerson | null;
  financeAdminChief: ICSPerson | null;
  publicInfoOfficer: ICSPerson | null;
  safetyOfficer: ICSPerson | null;
  liaisonOfficer: ICSPerson | null;
}

/** Người trong cấu trúc ICS */
export interface ICSPerson {
  id: string;
  name: string;
  title: string;
  organization: string;
  phone?: string;
  assignedAt: string;
}

/** Kế hoạch hành động sự cố (IAP) */
export interface IncidentActionPlan {
  id: string;
  incidentId: string;
  operationalPeriod: {
    start: string;
    end: string;
  };
  objectives: string[];
  weatherForecast: string;
  safetyMessage: string;
  createdAt: string;
  createdBy: string;
}

/** Sự cố chính */
export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: SeverityLevel;
  priority: IncidentPriority;
  status: IncidentStatus;
  description: string;
  location: IncidentLocation;
  peopleAtRisk: number;
  affectedAreaKm2: number;
  commanderId: string | null;
  commandStructure: ICSCommandStructure;
  incidentActionPlan: IncidentActionPlan | null;
  responsePhase: ResponsePhase;
  relatedAlerts: string[];
  relatedSOS: string[];
  assignedResources: string[];
  assignedVolunteers: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

/** Vị trí sự cố */
export interface IncidentLocation {
  lat: number;
  lng: number;
  province: string;
  district: string;
  commune?: string;
  address?: string;
  zone?: string;
}

// ---------------------------------------------------------------------------
// 2. SOS REQUEST TYPES (Extended from Phase 4)
// ---------------------------------------------------------------------------

/** Phương pháp phân loại theo START/SALT */
export type TriageMethod = "start" | "salt" | "custom";

/** Màu phân loại triage */
export type TriageColor = "red" | "yellow" | "green" | "black";

/** Trạng thái SOS mở rộng */
export type RescueSOSStatus =
  | "pending"
  | "triaged"
  | "dispatched"
  | "en_route"
  | "on_scene"
  | "resolved"
  | "cancelled";

/** Đánh giá START Triage */
export interface STARTAssessment {
  canWalk: boolean;
  isBreathing: boolean;
  breathingRate?: number; // nhịp/phút
  hasRadialPulse: boolean;
  capillaryRefillSeconds?: number;
  followsCommands: boolean;
}

/** Đánh giá SALT Triage */
export interface SALTAssessment {
  massiveHemorrhage: boolean;
  isBreathing: boolean;
  hasPulse: boolean;
  followsCommands: boolean;
  purposefulMovements: boolean;
}

/** Yêu cầu SOS cứu hộ */
export interface RescueSOSRequest {
  id: string;
  // Liên kết với Phase 4
  alertSOSId?: string;
  incidentId: string | null;
  // Vị trí
  location: IncidentLocation;
  // Tình huống
  situation: {
    type: IncidentType;
    severity: SOSEmergencyLevel;
    peopleCount: number;
    description?: string;
    hasChildren: boolean;
    hasElderly: boolean;
    hasDisabled: boolean;
    isTrapped: boolean;
    needsMedical: boolean;
  };
  // Triage
  triage: {
    method: TriageMethod;
    color: TriageColor;
    score: number; // 0-100
    breakdown: TriageBreakdown;
    explanation: string; // XAI-lite tiếng Việt
    assessedAt: string;
    assessedBy: string;
  };
  // Phân công
  dispatch: {
    status: RescueSOSStatus;
    assignedUnitId: string | null;
    assignedAt: string | null;
    etaMinutes: number | null;
    arrivedAt: string | null;
    resolvedAt: string | null;
  };
  // Liên hệ
  contact: {
    name?: string;
    phone?: string;
    alternatePhone?: string;
    relationship?: string;
  };
  // Timeline
  timeline: SOSTimelineEntry[];
  // Offline
  isOffline: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mức độ khẩn cấp SOS */
export type SOSEmergencyLevel = "life_threatening" | "urgent" | "need_help";

/** Chi tiết tính điểm triage */
export interface TriageBreakdown {
  severityScore: number;
  severityWeight: number;
  populationScore: number;
  populationWeight: number;
  accessibilityScore: number;
  accessibilityWeight: number;
  urgencyScore: number;
  urgencyWeight: number;
  totalScore: number;
}

/** Mục timeline SOS */
export interface SOSTimelineEntry {
  status: RescueSOSStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// 3. TASK TYPES (Kanban)
// ---------------------------------------------------------------------------

/** Trạng thái task */
export type TaskStatus = "new" | "assigned" | "in_progress" | "done";

/** Ưu tiên task */
export type TaskPriority = "P1" | "P2" | "P3" | "P4";

/** Task cứu hộ */
export interface RescueTask {
  id: string;
  title: string;
  description: string;
  incidentId: string;
  assigneeId: string | null; // team hoặc volunteer
  assigneeType: "team" | "volunteer" | "organization" | null;
  priority: TaskPriority;
  status: TaskStatus;
  requiredCapabilities: string[];
  location: IncidentLocation | null;
  dueTime: string | null;
  completedAt: string | null;
  subtasks: SubTask[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

/** Sub-task */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// 4. RESOURCE TYPES (NIMS Typing)
// ---------------------------------------------------------------------------

/** Loại tài nguyên */
export type ResourceType =
  | "boat"
  | "helicopter"
  | "ambulance"
  | "fire_truck"
  | "rescue_team"
  | "medical_team"
  | "supply_truck"
  | "generator"
  | "water_pump"
  | "communication_unit";

/** Trạng thái tài nguyên */
export type ResourceStatus = "available" | "deployed" | "returning" | "maintenance";

/** Năng lực tài nguyên */
export type ResourceCapability =
  | "water_rescue"
  | "search_rescue"
  | "medical"
  | "heavy_equipment"
  | "supply_delivery"
  | "aerial_survey"
  | "medical_evacuation"
  | "first_aid"
  | "triage"
  | "communication"
  | "water_pump"
  | "power_generation";

/** Tài nguyên cứu hộ */
export interface RescueResource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  capabilities: ResourceCapability[];
  capacity: number; // số người có thể vận chuyển/hỗ trợ
  speed: number; // km/h
  location: IncidentLocation;
  assignedIncidentId: string | null;
  assignedTaskId: string | null;
  deployedAt: string | null;
  estimatedReturnAt: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 5. VOLUNTEER TYPES (IFRC Lifecycle)
// ---------------------------------------------------------------------------

/** Loại tình nguyện viên */
export type VolunteerType = "registered" | "spontaneous" | "professional";

/** Trạng thái tình nguyện viên */
export type VolunteerStatus = "available" | "deployed" | "off_duty" | "unavailable";

/** Kỹ năng tình nguyện viên */
export type VolunteerSkill =
  | "search_rescue"
  | "first_aid"
  | "water_rescue"
  | "heavy_equipment"
  | "communication"
  | "logistics"
  | "translation"
  | "counseling"
  | "medical"
  | "cooking"
  | "driving"
  | "construction";

/** Tình nguyện viên */
export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: VolunteerType;
  status: VolunteerStatus;
  skills: VolunteerSkill[];
  experience: number; // số lần tham gia cứu hộ
  location: IncidentLocation;
  assignedIncidentId: string | null;
  assignedTaskId: string | null;
  totalHours: number;
  rating: number; // 1-5
  certifications: string[];
  isVerified: boolean;
  registeredAt: string;
  lastActiveAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 6. SHELTER TYPES (IASC Cluster)
// ---------------------------------------------------------------------------

/** Loại nơi trú ẩn */
export type ShelterType = "evacuation" | "temporary" | "transitional" | "permanent" | "medical";

/** Trạng thái nơi trú ẩn */
export type ShelterStatus = "open" | "full" | "closed" | "preparing";

/** Nhu cầu nơi trú ẩn */
export type ShelterNeed =
  | "food"
  | "water"
  | "medical"
  | "clothing"
  | "blankets"
  | "sanitation"
  | "power"
  | "communication";

/** Nơi trú ẩn */
export interface Shelter {
  id: string;
  name: string;
  type: ShelterType;
  status: ShelterStatus;
  location: IncidentLocation;
  capacity: {
    max: number;
    current: number;
    reserved: number;
  };
  facilities: string[];
  needs: ShelterNeed[];
  specialNeeds: {
    elderly: number;
    children: number;
    disabled: number;
    pregnant: number;
  };
  contactName: string;
  contactPhone: string;
  managedBy: string;
  openedAt: string | null;
  closedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 7. 3W TYPES (UN OCHA Who-What-Where)
// ---------------------------------------------------------------------------

/** Loại tổ chức theo OCHA */
export type OrganizationType =
  | "military"
  | "vnrc"
  | "local_govt"
  | "volunteer"
  | "ngo"
  | "private"
  | "un"
  | "government";

/** Trạng thái hoạt động */
export type ActivityStatus = "planned" | "active" | "completed" | "suspended";

/** Cluster nhân đạo (theo OCHA) */
export type HumanitarianCluster =
  | "shelter"
  | "health"
  | "wash"
  | "food_security"
  | "protection"
  | "education"
  | "logistics"
  | "nutrition"
  | "early_recovery"
  | "emergency_telecommunications"
  | "camp_management";

/** Tổ chức */
export interface Organization {
  id: string;
  name: string;
  acronym: string;
  type: OrganizationType;
  sectors: HumanitarianCluster[];
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  capacity: number; // số nhân sự có thể triển khai
  location: IncidentLocation;
}

/** Hoạt động 3W */
export interface ThreeWActivity {
  id: string;
  organizationId: string;
  incidentId: string | null;
  cluster: HumanitarianCluster;
  activityType: string;
  activityDescription: string;
  location: IncidentLocation;
  targetBeneficiaries: number;
  actualBeneficiaries: number;
  status: ActivityStatus;
  startDate: string;
  endDate: string | null;
  deliveryMechanism: "in_kind" | "cash" | "service";
}

/** Bản ghi 3W đầy đủ */
export interface ThreeWEntry {
  id: string;
  who: Organization;
  what: ThreeWActivity;
  where: IncidentLocation;
  when: {
    started: string;
    estimatedEnd: string | null;
  };
  status: ActivityStatus;
}

/** Gap Analysis (5W) */
export interface FiveWGapAnalysis {
  location: IncidentLocation;
  cluster: HumanitarianCluster;
  targetPopulation: number;
  reachedPopulation: number;
  gapPercentage: number;
  organizationsActive: number;
  needsIdentified: string[];
}

// ---------------------------------------------------------------------------
// 8. COMMUNICATION TYPES
// ---------------------------------------------------------------------------

/** Loại kênh liên lạc */
export type ChannelType = "incident" | "command" | "logistics" | "medical" | "general";

/** Loại tin nhắn */
export type MessageType = "text" | "status_update" | "resource_request" | "location_share" | "system";

/** Mức độ ưu tiên broadcast */
export type BroadcastPriority = "normal" | "urgent" | "critical";

/** Kênh liên lạc */
export interface CommChannel {
  id: string;
  name: string;
  type: ChannelType;
  incidentId: string | null;
  participants: string[];
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

/** Tin nhắn */
export interface CommMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  metadata?: {
    resourceRequestId?: string;
    locationShare?: IncidentLocation;
    statusUpdate?: string;
  };
  priority: BroadcastPriority;
  isSystem: boolean;
  createdAt: string;
}

/** Broadcast announcement */
export interface Broadcast {
  id: string;
  title: string;
  content: string;
  target: "all" | "volunteers" | "military" | "vnrc" | "specific_incident";
  targetIncidentId?: string;
  priority: BroadcastPriority;
  sentBy: string;
  sentAt: string;
  acknowledgedBy: string[];
}

// ---------------------------------------------------------------------------
// 9. INCIDENT TIMELINE TYPES
// ---------------------------------------------------------------------------

/** Loại sự kiện timeline */
export type TimelineEventType =
  | "incident_created"
  | "incident_updated"
  | "incident_escalated"
  | "incident_resolved"
  | "incident_closed"
  | "task_created"
  | "task_assigned"
  | "task_started"
  | "task_completed"
  | "resource_deployed"
  | "resource_returned"
  | "volunteer_assigned"
  | "volunteer_released"
  | "shelter_opened"
  | "shelter_updated"
  | "shelter_closed"
  | "sos_received"
  | "sos_triaged"
  | "sos_dispatched"
  | "sos_resolved"
  | "status_update"
  | "message_sent"
  | "broadcast_sent"
  | "check_in"
  | "check_out"
  | "note_added"
  | "command_transferred"
  | "iap_created"
  | "iap_updated";

/** Mục sự kiện timeline (immutable) */
export interface TimelineEvent {
  id: string;
  incidentId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  actorOrganization?: string;
  relatedEntityId?: string;
  relatedEntityType?: "task" | "resource" | "volunteer" | "shelter" | "sos" | "message";
  metadata?: Record<string, string | number | boolean>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 10. CHECK-IN / SAFETY STATUS TYPES
// ---------------------------------------------------------------------------

/** Trạng thái check-in */
export type CheckInStatus = "safe" | "need_help" | "missing" | "evacuated" | "hospitalized";

/** Check-in của người dân */
export interface CheckIn {
  id: string;
  personName: string;
  phone?: string;
  status: CheckInStatus;
  location: IncidentLocation | null;
  incidentId: string;
  familyMembers: number;
  notes?: string;
  checkedInAt: string;
  checkedInBy: string; // "self" hoặc volunteer id
}

/** Thống kê check-in */
export interface CheckInStats {
  totalExpected: number;
  safe: number;
  needHelp: number;
  missing: number;
  evacuated: number;
  hospitalized: number;
  separatedFamilies: number;
}

// ---------------------------------------------------------------------------
// 11. DISPATCH TYPES
// ---------------------------------------------------------------------------

/** Kết quả đề xuất dispatch */
export interface DispatchRecommendation {
  unitId: string;
  unitName: string;
  unitType: ResourceType;
  matchScore: number; // 0-100
  etaMinutes: number;
  distanceKm: number;
  reasons: DispatchReason[];
  capabilities: ResourceCapability[];
}

/** Lý do đề xuất */
export type DispatchReason =
  | "nearest"
  | "best_capability"
  | "highest_capacity"
  | "fastest_response"
  | "most_available"
  | "best_overall";

/** Dispatch result */
export interface DispatchResult {
  incidentId: string;
  sosId: string;
  recommendations: DispatchRecommendation[];
  calculatedAt: string;
  algorithm: "best_fit";
  factors: {
    distanceWeight: number;
    capabilityWeight: number;
    availabilityWeight: number;
    capacityWeight: number;
    speedWeight: number;
  };
}

// ---------------------------------------------------------------------------
// 12. RESOURCE FLOW TYPES
// ---------------------------------------------------------------------------

/** Nút trong Sankey diagram */
export interface ResourceFlowNode {
  id: string;
  name: string;
  type: "source" | "incident" | "outcome";
  value: number;
}

/** Liên kết trong Sankey diagram */
export interface ResourceFlowLink {
  source: string;
  target: string;
  value: number;
  resourceType: ResourceType;
}

/** Resource Flow data cho Sankey */
export interface ResourceFlowData {
  nodes: ResourceFlowNode[];
  links: ResourceFlowLink[];
}

// ---------------------------------------------------------------------------
// 13. STATISTICS TYPES
// ---------------------------------------------------------------------------

/** Thống kê tổng quan cứu hộ */
export interface RescueStats {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  totalSOS: number;
  pendingSOS: number;
  dispatchedSOS: number;
  resolvedSOS: number;
  totalResources: number;
  availableResources: number;
  deployedResources: number;
  totalVolunteers: number;
  activeVolunteers: number;
  totalShelters: number;
  openShelters: number;
  totalCheckIns: number;
  safeCheckIns: number;
  missingPersons: number;
  peopleAtRisk: number;
  peopleRescued: number;
}

// ---------------------------------------------------------------------------
// 14. CONTEXT & STATE TYPES
// ---------------------------------------------------------------------------

/** State của Rescue module */
export interface RescueState {
  // Incidents
  incidents: Incident[];
  selectedIncident: Incident | null;
  incidentFilter: IncidentFilter;

  // SOS
  sosRequests: RescueSOSRequest[];
  selectedSOS: RescueSOSRequest | null;

  // Tasks
  tasks: RescueTask[];

  // Resources
  resources: RescueResource[];

  // Volunteers
  volunteers: Volunteer[];

  // Shelters
  shelters: Shelter[];

  // 3W
  organizations: Organization[];
  threeWEntries: ThreeWEntry[];

  // Communication
  channels: CommChannel[];
  messages: CommMessage[];
  broadcasts: Broadcast[];

  // Timeline
  timelineEvents: TimelineEvent[];

  // Check-in
  checkIns: CheckIn[];

  // Dispatch
  dispatchResults: DispatchResult[];

  // Resource Flow
  resourceFlowData: ResourceFlowData | null;

  // UI State
  activeTab: RescueTab;
  isMobileDrawerOpen: boolean;
  selectedMapLayer: MapLayerConfig[];
  isOnline: boolean;

  // Toast
  toasts: RescueToast[];
}

/** Tab trong rescue page */
export type RescueTab =
  | "dashboard"
  | "operations"
  | "sos"
  | "tasks"
  | "resources"
  | "3w"
  | "shelters"
  | "communication"
  | "timeline"
  | "volunteers"
  | "checkin"
  | "dispatch"
  | "command"
  | "flow";

/** Filter sự cố */
export interface IncidentFilter {
  status: IncidentStatus[];
  type: IncidentType[];
  priority: IncidentPriority[];
  province: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

/** Cấu hình layer bản đồ */
export interface MapLayerConfig {
  id: string;
  name: string;
  nameVi: string;
  icon: string;
  visible: boolean;
  color: string;
}

/** Toast notification */
export interface RescueToast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "sos";
  title: string;
  message: string;
  duration: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 15. ACTION TYPES (Reducer)
// ---------------------------------------------------------------------------

export type RescueAction =
  // Incidents
  | { type: "SET_INCIDENTS"; payload: Incident[] }
  | { type: "ADD_INCIDENT"; payload: Incident }
  | { type: "UPDATE_INCIDENT"; payload: Incident }
  | { type: "DELETE_INCIDENT"; payload: string }
  | { type: "SELECT_INCIDENT"; payload: Incident | null }
  | { type: "SET_INCIDENT_FILTER"; payload: Partial<IncidentFilter> }
  // SOS
  | { type: "SET_SOS_REQUESTS"; payload: RescueSOSRequest[] }
  | { type: "ADD_SOS_REQUEST"; payload: RescueSOSRequest }
  | { type: "UPDATE_SOS_REQUEST"; payload: RescueSOSRequest }
  | { type: "SELECT_SOS"; payload: RescueSOSRequest | null }
  // Tasks
  | { type: "SET_TASKS"; payload: RescueTask[] }
  | { type: "ADD_TASK"; payload: RescueTask }
  | { type: "UPDATE_TASK"; payload: RescueTask }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "MOVE_TASK"; payload: { taskId: string; newStatus: TaskStatus } }
  // Resources
  | { type: "SET_RESOURCES"; payload: RescueResource[] }
  | { type: "ADD_RESOURCE"; payload: RescueResource }
  | { type: "UPDATE_RESOURCE"; payload: RescueResource }
  | { type: "DELETE_RESOURCE"; payload: string }
  | { type: "DEPLOY_RESOURCE"; payload: { resourceId: string; incidentId: string } }
  | { type: "RETURN_RESOURCE"; payload: string }
  // Volunteers
  | { type: "SET_VOLUNTEERS"; payload: Volunteer[] }
  | { type: "ADD_VOLUNTEER"; payload: Volunteer }
  | { type: "UPDATE_VOLUNTEER"; payload: Volunteer }
  | { type: "ASSIGN_VOLUNTEER"; payload: { volunteerId: string; incidentId: string; taskId?: string } }
  | { type: "RELEASE_VOLUNTEER"; payload: string }
  // Shelters
  | { type: "SET_SHELTERS"; payload: Shelter[] }
  | { type: "ADD_SHELTER"; payload: Shelter }
  | { type: "UPDATE_SHELTER"; payload: Shelter }
  | { type: "CHECK_IN_SHELTER"; payload: { shelterId: string; count: number } }
  | { type: "CHECK_OUT_SHELTER"; payload: { shelterId: string; count: number } }
  // 3W
  | { type: "SET_ORGANIZATIONS"; payload: Organization[] }
  | { type: "SET_3W_ENTRIES"; payload: ThreeWEntry[] }
  | { type: "ADD_3W_ENTRY"; payload: ThreeWEntry }
  // Communication
  | { type: "SET_CHANNELS"; payload: CommChannel[] }
  | { type: "ADD_CHANNEL"; payload: CommChannel }
  | { type: "SET_MESSAGES"; payload: CommMessage[] }
  | { type: "ADD_MESSAGE"; payload: CommMessage }
  | { type: "SET_BROADCASTS"; payload: Broadcast[] }
  | { type: "ADD_BROADCAST"; payload: Broadcast }
  // Timeline
  | { type: "SET_TIMELINE_EVENTS"; payload: TimelineEvent[] }
  | { type: "ADD_TIMELINE_EVENT"; payload: TimelineEvent }
  // Check-in
  | { type: "SET_CHECK_INS"; payload: CheckIn[] }
  | { type: "ADD_CHECK_IN"; payload: CheckIn }
  | { type: "UPDATE_CHECK_IN"; payload: CheckIn }
  // Dispatch
  | { type: "SET_DISPATCH_RESULTS"; payload: DispatchResult[] }
  | { type: "ADD_DISPATCH_RESULT"; payload: DispatchResult }
  // Resource Flow
  | { type: "SET_RESOURCE_FLOW"; payload: ResourceFlowData }
  // UI
  | { type: "SET_ACTIVE_TAB"; payload: RescueTab }
  | { type: "TOGGLE_MOBILE_DRAWER" }
  | { type: "TOGGLE_MAP_LAYER"; payload: string }
  | { type: "SET_ONLINE"; payload: boolean }
  // Toast
  | { type: "ADD_TOAST"; payload: RescueToast }
  | { type: "REMOVE_TOAST"; payload: string }
  // Bulk
  | { type: "RESET_STATE" };

// ---------------------------------------------------------------------------
// 16. CONTEXT TYPE
// ---------------------------------------------------------------------------

export interface RescueContextType {
  state: RescueState;
  dispatch: React.Dispatch<RescueAction>;
  // Computed
  filteredIncidents: Incident[];
  rescueStats: RescueStats;
  // Helpers
  showToast: (toast: Omit<RescueToast, "id" | "createdAt">) => void;
  getIncidentById: (id: string) => Incident | undefined;
  getSOSById: (id: string) => RescueSOSRequest | undefined;
  getResourceById: (id: string) => RescueResource | undefined;
  getVolunteerById: (id: string) => Volunteer | undefined;
  getShelterById: (id: string) => Shelter | undefined;
  getTasksByIncident: (incidentId: string) => RescueTask[];
  getTimelineByIncident: (incidentId: string) => TimelineEvent[];
  getCheckInStats: (incidentId: string) => CheckInStats;
  getThreeWByIncident: (incidentId: string) => ThreeWEntry[];
}

// ---------------------------------------------------------------------------
// 17. PROPS TYPES
// ---------------------------------------------------------------------------

export interface RescueStatsBarProps {
  stats: RescueStats;
  className?: string;
}

export interface OperationsMapProps {
  incidents: Incident[];
  sosRequests: RescueSOSRequest[];
  resources: RescueResource[];
  shelters: Shelter[];
  volunteers: Volunteer[];
  organizations: Organization[];
  selectedIncident: Incident | null;
  layers: MapLayerConfig[];
  onIncidentSelect: (incident: Incident | null) => void;
  onSOSClick: (sos: RescueSOSRequest) => void;
  onResourceClick: (resource: RescueResource) => void;
  onShelterClick: (shelter: Shelter) => void;
  className?: string;
}

export interface SOSPanelProps {
  sosRequests: RescueSOSRequest[];
  incidents: Incident[];
  onTriage: (sosId: string, method: TriageMethod) => void;
  onDispatch: (sosId: string, unitId: string) => void;
  onResolve: (sosId: string) => void;
  onSelect: (sos: RescueSOSRequest | null) => void;
  selectedSOS: RescueSOSRequest | null;
  className?: string;
}

export interface TaskBoardProps {
  tasks: RescueTask[];
  incidents: Incident[];
  volunteers: Volunteer[];
  resources: RescueResource[];
  onTaskCreate: (task: Omit<RescueTask, "id" | "createdAt" | "updatedAt">) => void;
  onTaskUpdate: (task: RescueTask) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
}

export interface ResourceRegistryProps {
  resources: RescueResource[];
  incidents: Incident[];
  onResourceAdd: (resource: Omit<RescueResource, "id" | "createdAt" | "updatedAt">) => void;
  onResourceUpdate: (resource: RescueResource) => void;
  onResourceDeploy: (resourceId: string, incidentId: string) => void;
  onResourceReturn: (resourceId: string) => void;
  className?: string;
}

export interface ThreeWDashboardProps {
  entries: ThreeWEntry[];
  organizations: Organization[];
  incidents: Incident[];
  gapAnalysis: FiveWGapAnalysis[];
  onOrgSelect: (org: Organization | null) => void;
  className?: string;
}

export interface ShelterManagerProps {
  shelters: Shelter[];
  incidents: Incident[];
  onShelterAdd: (shelter: Omit<Shelter, "id" | "createdAt" | "updatedAt">) => void;
  onShelterUpdate: (shelter: Shelter) => void;
  onCheckIn: (shelterId: string, count: number) => void;
  onCheckOut: (shelterId: string, count: number) => void;
  className?: string;
}

export interface CommunicationHubProps {
  channels: CommChannel[];
  messages: CommMessage[];
  broadcasts: Broadcast[];
  currentUserId: string;
  onChannelCreate: (channel: Omit<CommChannel, "id" | "createdAt">) => void;
  onMessageSend: (message: Omit<CommMessage, "id" | "createdAt">) => void;
  onBroadcast: (broadcast: Omit<Broadcast, "id" | "sentAt" | "acknowledgedBy">) => void;
  className?: string;
}

export interface IncidentTimelineProps {
  events: TimelineEvent[];
  incidents: Incident[];
  filterType: TimelineEventType | "all";
  onFilterChange: (type: TimelineEventType | "all") => void;
  className?: string;
}

export interface VolunteerManagerProps {
  volunteers: Volunteer[];
  incidents: Incident[];
  tasks: RescueTask[];
  onVolunteerAdd: (volunteer: Omit<Volunteer, "id" | "registeredAt" | "updatedAt">) => void;
  onVolunteerUpdate: (volunteer: Volunteer) => void;
  onVolunteerAssign: (volunteerId: string, incidentId: string, taskId?: string) => void;
  onVolunteerRelease: (volunteerId: string) => void;
  className?: string;
}

export interface CheckInStatusProps {
  checkIns: CheckIn[];
  incidents: Incident[];
  stats: CheckInStats;
  onCheckInAdd: (checkIn: Omit<CheckIn, "id" | "checkedInAt">) => void;
  onCheckInUpdate: (checkIn: CheckIn) => void;
  className?: string;
}

export interface DispatchAdvisorProps {
  recommendations: DispatchRecommendation[];
  incidents: Incident[];
  sosRequests: RescueSOSRequest[];
  resources: RescueResource[];
  onDispatch: (unitId: string, sosId: string) => void;
  onCalculate: (sosId: string) => void;
  className?: string;
}

export interface IncidentCommandBoardProps {
  incident: Incident;
  onCommandUpdate: (structure: ICSCommandStructure) => void;
  onTransferCommand: (fromId: string, toId: string) => void;
  className?: string;
}

export interface ResourceFlowProps {
  flowData: ResourceFlowData;
  incidents: Incident[];
  className?: string;
}

export interface RescuePageProps {
  className?: string;
}
