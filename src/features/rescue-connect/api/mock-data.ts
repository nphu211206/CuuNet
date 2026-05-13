"use client";

// =============================================================================
// RESCUE COORDINATION MODULE - Mock Data
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Based on real Vietnamese disaster scenarios:
//   - Bão Yagi (September 2024): Quảng Ninh, Hải Phòng, Hà Nội flooding
//   - Bão Damrey (November 2017): Khánh Hòa landfall
//   - Lũ miền Trung (October 2020): 6 consecutive storms
//
// Data covers: 15 incidents, 40 resources, 50 volunteers, 20 shelters,
//              10 organizations, 30 SOS requests, 25 tasks
// =============================================================================

import type {
  Incident,
  IncidentLocation,
  IncidentType,
  IncidentPriority,
  IncidentStatus,
  RescueSOSRequest,
  RescueTask,
  TaskStatus,
  TaskPriority,
  RescueResource,
  ResourceType,
  ResourceStatus,
  Volunteer,
  VolunteerType,
  VolunteerStatus,
  Shelter,
  ShelterType,
  ShelterStatus,
  Organization,
  OrganizationType,
  ThreeWEntry,
  CommChannel,
  CommMessage,
  Broadcast,
  TimelineEvent,
  TimelineEventType,
  CheckIn,
  CheckInStatus,
  DispatchResult,
  ResourceFlowData,
  SubTask,
  ICSCommandStructure,
  IncidentActionPlan,
  ActivityStatus,
  HumanitarianCluster,
} from "../lib/types";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter++;
  return `${prefix}-${String(idCounter).padStart(4, "0")}`;
}

function randomDate(daysAgo: number, daysRange: number = 0): string {
  const now = Date.now();
  const offset = (daysAgo + Math.random() * daysRange) * 24 * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================================================
// LOCATION DATA - Vietnamese provinces affected by real disasters
// =============================================================================

const VIETNAM_LOCATIONS: IncidentLocation[] = [
  { lat: 21.0, lng: 107.3, province: "Quảng Ninh", district: "Hạ Long", commune: "Bãi Cháy", address: "Khu vực Bãi Cháy" },
  { lat: 20.86, lng: 106.68, province: "Hải Phòng", district: "Ngô Quyền", commune: "Máy Tơ", address: "Phố Máy Tơ" },
  { lat: 20.85, lng: 106.66, province: "Hải Phòng", district: "Lê Chân", commune: "An Biên", address: "Khu vực cảng Hải Phòng" },
  { lat: 21.03, lng: 105.85, province: "Hà Nội", district: "Long Biên", commune: "Ngọc Thụy", address: "Khu vực đê sông Hồng" },
  { lat: 20.95, lng: 105.84, province: "Hà Nội", district: "Hoàn Kiếm", commune: "Hàng Bạc", address: "Phố cổ Hà Nội" },
  { lat: 20.42, lng: 106.17, province: "Thái Bình", district: "Thái Thụy", commune: "Thụy Trường", address: "Khu vực ven biển" },
  { lat: 20.43, lng: 106.18, province: "Nam Định", district: "Giao Thủy", commune: "Giao Hải", address: "Bãi biển Giao Hải" },
  { lat: 22.33, lng: 103.5, province: "Lào Cai", district: "Bát Xát", commune: "A Mú Sung", address: "Bản A Mú Sung" },
  { lat: 21.72, lng: 104.51, province: "Yên Bái", district: "Trạm Tấu", commune: "Hát Lừu", address: "Bản Hát Lừu" },
  { lat: 22.67, lng: 106.26, province: "Cao Bằng", district: "Trùng Khánh", commune: "Đoài Khôn", address: "Khu vực đèo" },
  { lat: 21.85, lng: 106.76, province: "Lạng Sơn", district: "Văn Quan", commune: "Yên Phúc", address: "Quốc lộ 4C" },
  { lat: 17.48, lng: 106.6, province: "Quảng Bình", district: "Minh Hóa", commune: "Dân Hóa", address: "Bản Dân Hóa" },
  { lat: 16.74, lng: 107.18, province: "Quảng Trị", district: "Hướng Hóa", commune: "Tà Rụt", address: "Bản Tà Rụt" },
  { lat: 16.46, lng: 107.6, province: "Thừa Thiên Huế", district: "Phong Điền", commune: "Phong Xuân", address: "Khu vực Rào Trăng" },
  { lat: 12.25, lng: 109.19, province: "Khánh Hòa", district: "Ninh Hòa", commune: "Ninh Hải", address: "Bãi biển Ninh Hải" },
];

// =============================================================================
// MOCK INCIDENTS (15 incidents based on real disasters)
// =============================================================================

function generateICSCommand(commanderName: string, orgName: string): ICSCommandStructure {
  return {
    incidentCommander: {
      id: nextId("ics"),
      name: commanderName,
      title: "Chỉ huy trưởng",
      organization: orgName,
      phone: `091${randomInt(1000000, 9999999)}`,
      assignedAt: randomDate(5),
    },
    operationsSectionChief: {
      id: nextId("ics"),
      name: "Trần Văn Hùng",
      title: "Trưởng ban Thao tác",
      organization: "Quân khu 3",
      phone: `090${randomInt(1000000, 9999999)}`,
      assignedAt: randomDate(4),
    },
    planningSectionChief: {
      id: nextId("ics"),
      name: "Lê Thị Mai",
      title: "Trưởng ban Kế hoạch",
      organization: "VNDMA",
      phone: `098${randomInt(1000000, 9999999)}`,
      assignedAt: randomDate(4),
    },
    logisticsSectionChief: {
      id: nextId("ics"),
      name: "Phạm Văn Đức",
      title: "Trưởng ban Hậu cần",
      organization: "VNRC",
      phone: `097${randomInt(1000000, 9999999)}`,
      assignedAt: randomDate(4),
    },
    financeAdminChief: null,
    publicInfoOfficer: {
      id: nextId("ics"),
      name: "Nguyễn Thị Lan",
      title: "Sĩ quan Thông tin",
      organization: "UBND Tỉnh",
      phone: `096${randomInt(1000000, 9999999)}`,
      assignedAt: randomDate(3),
    },
    safetyOfficer: {
      id: nextId("ics"),
      name: "Hoàng Văn Nam",
      title: "Sĩ quan An toàn",
      organization: "Công an",
      phone: `094${randomInt(1000000, 9999999)}`,
      assignedAt: randomDate(3),
    },
    liaisonOfficer: null,
  };
}

function generateIAP(incidentId: string): IncidentActionPlan {
  return {
    id: nextId("iap"),
    incidentId,
    operationalPeriod: {
      start: randomDate(3),
      end: randomDate(2),
    },
    objectives: [
      "Tìm kiếm và cứu nạn tất cả người mất tích",
      "Sơ tán người dân ra khỏi vùng nguy hiểm",
      "Cung cấp nhu yếu phẩm cho người bị ảnh hưởng",
      "Khôi phục hạ tầng giao thông",
    ],
    weatherForecast: "Mưa lớn tiếp tục, gió cấp 6-7, biển động mạnh",
    safetyMessage: "Đội cứu hộ phải mặc áo phao khi hoạt động gần nước. Không hoạt động đơn lẻ.",
    createdAt: randomDate(3),
    createdBy: "Trần Văn Hùng",
  };
}

export const MOCK_INCIDENTS: Incident[] = [
  // --- Bão Yagi 2024 Incidents ---
  {
    id: "INC-0001",
    title: "Lũ lụt nghiêm trọng - Bãi Cháy, Quảng Ninh",
    type: "flood",
    severity: "critical",
    priority: "P1",
    status: "active",
    description: "Mực nước dâng cao 2.5m, hàng nghìn nhà dân bị ngập. Nhiều người mắc kẹt trên mái nhà. Cần cứu hộ khẩn cấp bằng ca nô.",
    location: VIETNAM_LOCATIONS[0],
    peopleAtRisk: 2500,
    affectedAreaKm2: 15.5,
    commanderId: "ics-0001",
    commandStructure: generateICSCommand("Nguyễn Văn An", "Quân khu 3"),
    incidentActionPlan: generateIAP("INC-0001"),
    responsePhase: "response",
    relatedAlerts: ["ALT-YAGI-001"],
    relatedSOS: ["SOS-0001", "SOS-0002", "SOS-0003"],
    assignedResources: ["RES-0001", "RES-0002", "RES-0003"],
    assignedVolunteers: ["VOL-0001", "VOL-0002", "VOL-0003"],
    createdAt: randomDate(5),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0002",
    title: "Ngập úng diện rộng - Ngô Quyền, Hải Phòng",
    type: "flood",
    severity: "high",
    priority: "P1",
    status: "active",
    description: "Khu vực cảng Hải Phòng bị ngập nặng, nước lên nhanh do triều cường kết hợp mưa lớn. Nhiều xe tải mắc kẹt.",
    location: VIETNAM_LOCATIONS[1],
    peopleAtRisk: 1800,
    affectedAreaKm2: 8.2,
    commanderId: "ics-0002",
    commandStructure: generateICSCommand("Lê Minh Tuấn", "Công an Hải Phòng"),
    incidentActionPlan: generateIAP("INC-0002"),
    responsePhase: "response",
    relatedAlerts: ["ALT-YAGI-002"],
    relatedSOS: ["SOS-0004", "SOS-0005"],
    assignedResources: ["RES-0004", "RES-0005"],
    assignedVolunteers: ["VOL-0004", "VOL-0005"],
    createdAt: randomDate(5),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0003",
    title: "Sạt lở đất - Trạm Tấu, Yên Bái",
    type: "landslide",
    severity: "critical",
    priority: "P1",
    status: "active",
    description: "Sạt lở đất lớn vùi lấp 3 nhà dân và 1 trạm y tế. Đường vào bản bị cắt đứt. Cần trực thăng cứu hộ.",
    location: VIETNAM_LOCATIONS[8],
    peopleAtRisk: 350,
    affectedAreaKm2: 2.8,
    commanderId: "ics-0003",
    commandStructure: generateICSCommand("Vàng A Sùng", "UBND huyện Trạm Tấu"),
    incidentActionPlan: generateIAP("INC-0003"),
    responsePhase: "response",
    relatedAlerts: ["ALT-YAGI-003"],
    relatedSOS: ["SOS-0006", "SOS-0007"],
    assignedResources: ["RES-0006", "RES-0007"],
    assignedVolunteers: ["VOL-0006", "VOL-0007"],
    createdAt: randomDate(4),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0004",
    title: "Lũ quét - A Mú Sung, Lào Cai",
    type: "flood",
    severity: "high",
    priority: "P2",
    status: "active",
    description: "Lũ quét bất ngờ lúc 2h sáng, cuốn trôi nhiều nhà sàn. Hàng chục người mất tích.",
    location: VIETNAM_LOCATIONS[7],
    peopleAtRisk: 500,
    affectedAreaKm2: 5.0,
    commanderId: "ics-0004",
    commandStructure: generateICSCommand("Lý Seo Chải", "UBND huyện Bát Xát"),
    incidentActionPlan: generateIAP("INC-0004"),
    responsePhase: "response",
    relatedAlerts: ["ALT-YAGI-004"],
    relatedSOS: ["SOS-0008", "SOS-0009"],
    assignedResources: ["RES-0008", "RES-0009"],
    assignedVolunteers: ["VOL-0008", "VOL-0009"],
    createdAt: randomDate(4),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0005",
    title: "Cầu Phong Chùa sập - Phú Thọ",
    type: "infrastructure",
    severity: "high",
    priority: "P2",
    status: "active",
    description: "Cầu Phong Chùa bị nước lũ cuốn sập, cô lập hàng nghìn người dân hai bên bờ sông. Cần thiết lập cầu phao.",
    location: { lat: 21.32, lng: 105.23, province: "Phú Thọ", district: "Phù Ninh", commune: "Phong Chùa", address: "Cầu Phong Chùa" },
    peopleAtRisk: 3000,
    affectedAreaKm2: 25.0,
    commanderId: "ics-0005",
    commandStructure: generateICSCommand("Hoàng Văn Dũng", "Quân khu 2"),
    incidentActionPlan: generateIAP("INC-0005"),
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: ["SOS-0010"],
    assignedResources: ["RES-0010"],
    assignedVolunteers: ["VOL-0010"],
    createdAt: randomDate(4),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  // --- Bão Damrey 2017 Scenario ---
  {
    id: "INC-0006",
    title: "Bão đổ bộ - Ninh Hòa, Khánh Hòa",
    type: "storm",
    severity: "critical",
    priority: "P1",
    status: "resolved",
    description: "Bão cấp 12 đổ bộ trực tiếp, tốc mái hàng nghìn nhà. Mưa to gây ngập lụt cục bộ.",
    location: VIETNAM_LOCATIONS[14],
    peopleAtRisk: 5000,
    affectedAreaKm2: 45.0,
    commanderId: "ics-0006",
    commandStructure: generateICSCommand("Nguyễn Văn Cường", "Quân khu 5"),
    incidentActionPlan: generateIAP("INC-0006"),
    responsePhase: "recovery",
    relatedAlerts: [],
    relatedSOS: [],
    assignedResources: [],
    assignedVolunteers: [],
    createdAt: randomDate(30),
    updatedAt: randomDate(15),
    resolvedAt: randomDate(15),
    closedAt: randomDate(10),
  },
  // --- Lũ miền Trung 2020 Scenarios ---
  {
    id: "INC-0007",
    title: "Lũ chồng lũ - Quảng Bình",
    type: "flood",
    severity: "critical",
    priority: "P1",
    status: "closed",
    description: "Mưa lớn 500mm/24h, sông Gianh lên mức lịch sử. Hàng nghìn nhà chìm trong biển nước.",
    location: VIETNAM_LOCATIONS[11],
    peopleAtRisk: 15000,
    affectedAreaKm2: 120.0,
    commanderId: "ics-0007",
    commandStructure: generateICSCommand("Trần Văn Phú", "Quân khu 4"),
    incidentActionPlan: generateIAP("INC-0007"),
    responsePhase: "recovery",
    relatedAlerts: [],
    relatedSOS: [],
    assignedResources: [],
    assignedVolunteers: [],
    createdAt: randomDate(60),
    updatedAt: randomDate(30),
    resolvedAt: randomDate(30),
    closedAt: randomDate(25),
  },
  {
    id: "INC-0008",
    title: "Sạt lở đất Rào Trăng - Thừa Thiên Huế",
    type: "landslide",
    severity: "critical",
    priority: "P1",
    status: "closed",
    description: "Sạt lở đất vùi lấp trạm kiểm lâm, 13 quân nhân hi sinh trong lúc cứu hộ. Thảm họa kép.",
    location: VIETNAM_LOCATIONS[13],
    peopleAtRisk: 50,
    affectedAreaKm2: 1.5,
    commanderId: "ics-0008",
    commandStructure: generateICSCommand("Nguyễn Bá Quốc", "Quân khu 4"),
    incidentActionPlan: generateIAP("INC-0008"),
    responsePhase: "recovery",
    relatedAlerts: [],
    relatedSOS: [],
    assignedResources: [],
    assignedVolunteers: [],
    createdAt: randomDate(60),
    updatedAt: randomDate(25),
    resolvedAt: randomDate(25),
    closedAt: randomDate(20),
  },
  // --- Active smaller incidents ---
  {
    id: "INC-0009",
    title: "Ngập úng - Long Biên, Hà Nội",
    type: "flood",
    severity: "medium",
    priority: "P3",
    status: "active",
    description: "Sông Hồng lên cao, đê Ngọc Thụy bị rò rỉ. Cần gia cố khẩn cấp.",
    location: VIETNAM_LOCATIONS[3],
    peopleAtRisk: 800,
    affectedAreaKm2: 3.5,
    commanderId: "ics-0009",
    commandStructure: generateICSCommand("Phạm Văn Khánh", "UBND quận Long Biên"),
    incidentActionPlan: null,
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: ["SOS-0011"],
    assignedResources: ["RES-0011"],
    assignedVolunteers: ["VOL-0011"],
    createdAt: randomDate(3),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0010",
    title: "Nguy cơ sạt lở - Văn Quan, Lạng Sơn",
    type: "landslide",
    severity: "medium",
    priority: "P3",
    status: "active",
    description: "Mưa kéo dài 3 ngày, đất đá trên núi có dấu hiệu nứt. Cần sơ tán 200 hộ dân.",
    location: VIETNAM_LOCATIONS[10],
    peopleAtRisk: 600,
    affectedAreaKm2: 4.0,
    commanderId: "ics-0010",
    commandStructure: generateICSCommand("Lý Văn Phúc", "UBND huyện Văn Quan"),
    incidentActionPlan: null,
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: ["SOS-0012"],
    assignedResources: ["RES-0012"],
    assignedVolunteers: ["VOL-0012"],
    createdAt: randomDate(3),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0011",
    title: "Ngập lụt - Thái Thụy, Thái Bình",
    type: "flood",
    severity: "high",
    priority: "P2",
    status: "active",
    description: "Biển dâng kết hợp mưa lớn, nhiều xã ven biển bị ngập. Cần di dời 1500 hộ.",
    location: VIETNAM_LOCATIONS[5],
    peopleAtRisk: 4500,
    affectedAreaKm2: 20.0,
    commanderId: "ics-0011",
    commandStructure: generateICSCommand("Đỗ Văn Hải", "UBND tỉnh Thái Bình"),
    incidentActionPlan: generateIAP("INC-0011"),
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: ["SOS-0013", "SOS-0014"],
    assignedResources: ["RES-0013", "RES-0014"],
    assignedVolunteers: ["VOL-0013", "VOL-0014"],
    createdAt: randomDate(4),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0012",
    title: "Lũ quét - Hướng Hóa, Quảng Trị",
    type: "flood",
    severity: "high",
    priority: "P2",
    status: "active",
    description: "Lũ quét từ thượng nguồn đổ về, cô lập bản Tà Rụt. Nhiều người mất liên lạc.",
    location: VIETNAM_LOCATIONS[12],
    peopleAtRisk: 400,
    affectedAreaKm2: 6.0,
    commanderId: "ics-0012",
    commandStructure: generateICSCommand("Hồ Văn Pả", "UBND huyện Hướng Hóa"),
    incidentActionPlan: generateIAP("INC-0012"),
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: ["SOS-0015"],
    assignedResources: ["RES-0015"],
    assignedVolunteers: ["VOL-0015"],
    createdAt: randomDate(4),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0013",
    title: "Nguy cơ ngập - Giao Thủy, Nam Định",
    type: "flood",
    severity: "medium",
    priority: "P3",
    status: "active",
    description: "Đê biển Giao Thủy bị sóng đánh hư hỏng, cần gia cố trước khi triều cường.",
    location: VIETNAM_LOCATIONS[6],
    peopleAtRisk: 1200,
    affectedAreaKm2: 8.0,
    commanderId: "ics-0013",
    commandStructure: generateICSCommand("Bùi Văn Thắng", "UBND huyện Giao Thủy"),
    incidentActionPlan: null,
    responsePhase: "preparedness",
    relatedAlerts: [],
    relatedSOS: [],
    assignedResources: ["RES-0016"],
    assignedVolunteers: ["VOL-0016"],
    createdAt: randomDate(2),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0014",
    title: "Sạt lở - Cao Bằng",
    type: "landslide",
    severity: "high",
    priority: "P2",
    status: "active",
    description: "Quốc lộ 4C bị sạt lở, giao thông tê liệt. Hàng trăm phương tiện mắc kẹt.",
    location: VIETNAM_LOCATIONS[9],
    peopleAtRisk: 300,
    affectedAreaKm2: 1.2,
    commanderId: "ics-0014",
    commandStructure: generateICSCommand("Nông Văn Mạnh", "UBND tỉnh Cao Bằng"),
    incidentActionPlan: null,
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: ["SOS-0016"],
    assignedResources: ["RES-0017"],
    assignedVolunteers: ["VOL-0017"],
    createdAt: randomDate(3),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: "INC-0015",
    title: "Ngập phố cổ - Hoàn Kiếm, Hà Nội",
    type: "flood",
    severity: "low",
    priority: "P4",
    status: "active",
    description: "Phố cổ Hà Nội ngập nhẹ do mưa lớn, nước rút chậm. Cần hỗ trợ bơm nước.",
    location: VIETNAM_LOCATIONS[4],
    peopleAtRisk: 200,
    affectedAreaKm2: 0.5,
    commanderId: "ics-0015",
    commandStructure: generateICSCommand("Trần Thị Hương", "UBND quận Hoàn Kiếm"),
    incidentActionPlan: null,
    responsePhase: "response",
    relatedAlerts: [],
    relatedSOS: [],
    assignedResources: ["RES-0018"],
    assignedVolunteers: [],
    createdAt: randomDate(2),
    updatedAt: randomDate(0, 1),
    resolvedAt: null,
    closedAt: null,
  },
];

// =============================================================================
// MOCK SOS REQUESTS (30 requests)
// =============================================================================

export const MOCK_SOS_REQUESTS: RescueSOSRequest[] = [
  {
    id: "SOS-0001",
    alertSOSId: "alert-sos-001",
    incidentId: "INC-0001",
    location: { ...VIETNAM_LOCATIONS[0], commune: "Bãi Cháy" },
    situation: {
      type: "flood",
      severity: "life_threatening",
      peopleCount: 15,
      description: "Gia đình 15 người mắc kẹt trên mái nhà, nước đang dâng. Có 3 trẻ em và 2 người già.",
      hasChildren: true,
      hasElderly: true,
      hasDisabled: false,
      isTrapped: true,
      needsMedical: true,
    },
    triage: {
      method: "custom",
      color: "red",
      score: 95,
      breakdown: {
        severityScore: 100,
        severityWeight: 0.4,
        populationScore: 40,
        populationWeight: 0.3,
        accessibilityScore: 15,
        accessibilityWeight: 0.2,
        urgencyScore: 80,
        urgencyWeight: 0.1,
        totalScore: 95,
      },
      explanation: "Ưu tiên P1 (Khẩn cấp): Nguy hiểm tính mạng, 15 người có nguy cơ (có trẻ em và người già), khu vực bị cô lập bởi lũ, thời gian chờ đợi >3 giờ.",
      assessedAt: randomDate(0, 1),
      assessedBy: "system",
    },
    dispatch: {
      status: "on_scene",
      assignedUnitId: "RES-0001",
      assignedAt: randomDate(0, 1),
      etaMinutes: 15,
      arrivedAt: randomDate(0, 0.5),
      resolvedAt: null,
    },
    contact: {
      name: "Nguyễn Văn Bình",
      phone: "0912345678",
      relationship: "Chủ hộ",
    },
    timeline: [
      { status: "pending", timestamp: randomDate(1), note: "Nhận tín hiệu SOS" },
      { status: "triaged", timestamp: randomDate(0.9), note: "Phân loại: Đỏ - Khẩn cấp" },
      { status: "dispatched", timestamp: randomDate(0.8), note: "Triển khai ca nô CN-001" },
      { status: "en_route", timestamp: randomDate(0.5), note: "Đang di chuyển, ETA 15 phút" },
      { status: "on_scene", timestamp: randomDate(0.3), note: "Đã đến hiện trường, đang cứu hộ" },
    ],
    isOffline: false,
    createdAt: randomDate(1),
    updatedAt: randomDate(0.3),
  },
  {
    id: "SOS-0002",
    alertSOSId: "alert-sos-002",
    incidentId: "INC-0001",
    location: { ...VIETNAM_LOCATIONS[0], district: "Cẩm Phả", commune: "Cửa Ông" },
    situation: {
      type: "flood",
      severity: "urgent",
      peopleCount: 8,
      description: "8 người trong hẻm bị ngập sâu 1.5m, không thể tự thoát. Có 1 người khuyết tật.",
      hasChildren: false,
      hasElderly: true,
      hasDisabled: true,
      isTrapped: true,
      needsMedical: false,
    },
    triage: {
      method: "custom",
      color: "red",
      score: 88,
      breakdown: {
        severityScore: 75,
        severityWeight: 0.4,
        populationScore: 30,
        populationWeight: 0.3,
        accessibilityScore: 15,
        accessibilityWeight: 0.2,
        urgencyScore: 60,
        urgencyWeight: 0.1,
        totalScore: 88,
      },
      explanation: "Ưu tiên P1 (Khẩn cấp): Mức độ nghiêm trọng cao, 8 người mắc kẹt (có người khuyết tật), khu vực khó tiếp cận.",
      assessedAt: randomDate(0.9),
      assessedBy: "system",
    },
    dispatch: {
      status: "dispatched",
      assignedUnitId: "RES-0002",
      assignedAt: randomDate(0.8),
      etaMinutes: 25,
      arrivedAt: null,
      resolvedAt: null,
    },
    contact: {
      name: "Trần Thị Hoa",
      phone: "0923456789",
      relationship: "Con gái",
    },
    timeline: [
      { status: "pending", timestamp: randomDate(1), note: "Nhận tín hiệu SOS" },
      { status: "triaged", timestamp: randomDate(0.9), note: "Phân loại: Đỏ" },
      { status: "dispatched", timestamp: randomDate(0.8), note: "Triển khai đội cứu hộ" },
    ],
    isOffline: false,
    createdAt: randomDate(1),
    updatedAt: randomDate(0.8),
  },
  {
    id: "SOS-0003",
    alertSOSId: "alert-sos-003",
    incidentId: "INC-0001",
    location: { ...VIETNAM_LOCATIONS[0], district: "Hạ Long", commune: "Hồng Hà" },
    situation: {
      type: "flood",
      severity: "need_help",
      peopleCount: 5,
      description: "Gia đình cần sơ tán, nước đã vào nhà nhưng chưa ngập. Có thể tự di chuyển nếu có thuyền.",
      hasChildren: true,
      hasElderly: false,
      hasDisabled: false,
      isTrapped: false,
      needsMedical: false,
    },
    triage: {
      method: "custom",
      color: "yellow",
      score: 52,
      breakdown: {
        severityScore: 50,
        severityWeight: 0.4,
        populationScore: 25,
        populationWeight: 0.3,
        accessibilityScore: 60,
        accessibilityWeight: 0.2,
        urgencyScore: 30,
        urgencyWeight: 0.1,
        totalScore: 52,
      },
      explanation: "Ưu tiên P3 (Tiêu chuẩn): Cần giúp đỡ nhưng không nguy hiểm tính mạng, 5 người, khu vực có thể tiếp cận.",
      assessedAt: randomDate(0.8),
      assessedBy: "system",
    },
    dispatch: {
      status: "triaged",
      assignedUnitId: null,
      assignedAt: null,
      etaMinutes: null,
      arrivedAt: null,
      resolvedAt: null,
    },
    contact: {
      name: "Lê Văn Đạt",
      phone: "0934567890",
    },
    timeline: [
      { status: "pending", timestamp: randomDate(1), note: "Nhận tín hiệu SOS" },
      { status: "triaged", timestamp: randomDate(0.8), note: "Phân loại: Vàng - Tiêu chuẩn" },
    ],
    isOffline: false,
    createdAt: randomDate(1),
    updatedAt: randomDate(0.8),
  },
  // SOS for landslide incidents
  {
    id: "SOS-0006",
    incidentId: "INC-0003",
    location: VIETNAM_LOCATIONS[8],
    situation: {
      type: "landslide",
      severity: "life_threatening",
      peopleCount: 22,
      description: "22 người bị vùi lấp dưới đất đá, nghe thấy tiếng kêu cứu. Cần thiết bị đào bới chuyên dụng.",
      hasChildren: true,
      hasElderly: true,
      hasDisabled: false,
      isTrapped: true,
      needsMedical: true,
    },
    triage: {
      method: "start",
      color: "red",
      score: 100,
      breakdown: {
        severityScore: 100,
        severityWeight: 0.4,
        populationScore: 70,
        populationWeight: 0.3,
        accessibilityScore: 35,
        accessibilityWeight: 0.2,
        urgencyScore: 100,
        urgencyWeight: 0.1,
        totalScore: 100,
      },
      explanation: "Ưu tiên P1 (Cực kỳ khẩn cấp): 22 người bị vùi lấp, nguy hiểm tính mạng cao nhất, khu vực miền núi khó tiếp cận.",
      assessedAt: randomDate(0.5),
      assessedBy: "system",
    },
    dispatch: {
      status: "en_route",
      assignedUnitId: "RES-0006",
      assignedAt: randomDate(0.4),
      etaMinutes: 45,
      arrivedAt: null,
      resolvedAt: null,
    },
    contact: {
      name: "Vàng A Sử",
      phone: "0945678901",
      relationship: "Trưởng bản",
    },
    timeline: [
      { status: "pending", timestamp: randomDate(0.6), note: "Nhận tín hiệu SOS từ trưởng bản" },
      { status: "triaged", timestamp: randomDate(0.5), note: "Phân loại: Đỏ - Cực kỳ khẩn cấp" },
      { status: "dispatched", timestamp: randomDate(0.4), note: "Triển khai đội SAR + trực thăng" },
      { status: "en_route", timestamp: randomDate(0.3), note: "Đội đang di chuyển bằng đường bộ + đường không" },
    ],
    isOffline: true,
    createdAt: randomDate(0.6),
    updatedAt: randomDate(0.3),
  },
  // Additional SOS requests for other incidents
  ...Array.from({ length: 25 }, (_, i) => {
    const idx = i + 7;
    const locIdx = i % VIETNAM_LOCATIONS.length;
    const incidentIdx = i % MOCK_INCIDENTS.length;
    const types: Array<"flood" | "storm" | "landslide"> = ["flood", "storm", "landslide"];
    const severities: Array<"life_threatening" | "urgent" | "need_help"> = ["life_threatening", "urgent", "need_help"];
    const colors: Array<"red" | "yellow" | "green"> = ["red", "yellow", "green"];
    const statuses: Array<"pending" | "triaged" | "dispatched" | "en_route" | "on_scene" | "resolved"> = ["pending", "triaged", "dispatched", "en_route", "on_scene", "resolved"];

    const severity = severities[i % 3];
    const triageColor = severity === "life_threatening" ? "red" : severity === "urgent" ? "yellow" : "green";
    const score = severity === "life_threatening" ? 85 + randomInt(0, 15) : severity === "urgent" ? 60 + randomInt(0, 20) : 30 + randomInt(0, 25);

    return {
      id: `SOS-${String(idx).padStart(4, "0")}`,
      incidentId: MOCK_INCIDENTS[incidentIdx].id,
      location: VIETNAM_LOCATIONS[locIdx],
      situation: {
        type: types[i % 3],
        severity,
        peopleCount: randomInt(1, 30),
        description: `Tình huống cứu hộ #${idx} - ${types[i % 3] === "flood" ? "Ngập lụt" : types[i % 3] === "storm" ? "Bão" : "Sạt lở"}`,
        hasChildren: i % 3 === 0,
        hasElderly: i % 4 === 0,
        hasDisabled: i % 5 === 0,
        isTrapped: i % 3 === 0,
        needsMedical: i % 4 === 0,
      },
      triage: {
        method: "custom",
        color: triageColor,
        score,
        breakdown: {
          severityScore: severity === "life_threatening" ? 100 : severity === "urgent" ? 75 : 50,
          severityWeight: 0.4,
          populationScore: randomInt(10, 80),
          populationWeight: 0.3,
          accessibilityScore: randomInt(15, 95),
          accessibilityWeight: 0.2,
          urgencyScore: randomInt(0, 100),
          urgencyWeight: 0.1,
          totalScore: score,
        },
        explanation: `Ưu tiên ${triageColor === "red" ? "P1" : triageColor === "yellow" ? "P2" : "P3"}: Tình huống ${severity === "life_threatening" ? "nguy hiểm tính mạng" : severity === "urgent" ? "khẩn cấp" : "cần hỗ trợ"}.`,
        assessedAt: randomDate(0, 1),
        assessedBy: "system",
      },
      dispatch: {
        status: statuses[i % 6],
        assignedUnitId: i % 6 > 0 ? `RES-${String(i % 20 + 1).padStart(4, "0")}` : null,
        assignedAt: i % 6 > 0 ? randomDate(0, 1) : null,
        etaMinutes: i % 6 > 0 ? randomInt(10, 60) : null,
        arrivedAt: i % 6 > 3 ? randomDate(0, 0.5) : null,
        resolvedAt: i % 6 === 5 ? randomDate(0, 0.3) : null,
      },
      contact: {
        name: `Người gọi #${idx}`,
        phone: `09${randomInt(10000000, 99999999)}`,
      },
      timeline: [
        { status: "pending", timestamp: randomDate(1), note: "Nhận tín hiệu SOS" },
        { status: "triaged", timestamp: randomDate(0.9), note: "Đã phân loại" },
      ],
      isOffline: i % 7 === 0,
      createdAt: randomDate(1),
      updatedAt: randomDate(0, 1),
    } as RescueSOSRequest;
  }),
];

// =============================================================================
// MOCK RESOURCES (40 resources)
// =============================================================================

export const MOCK_RESOURCES: RescueResource[] = [
  // Boats (8)
  { id: "RES-0001", name: "Ca nô CN-001", type: "boat", status: "deployed", capabilities: ["water_rescue", "supply_delivery"], capacity: 10, speed: 35, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: "TSK-0001", deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Nguyễn Hải", contactPhone: "0911111111", notes: "Ca nô cứu hộ chuyên dụng, hoạt động tốt", createdAt: randomDate(10), updatedAt: randomDate(0.5) },
  { id: "RES-0002", name: "Ca nô CN-002", type: "boat", status: "deployed", capabilities: ["water_rescue"], capacity: 8, speed: 30, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Trần Bình", contactPhone: "0912222222", notes: "Ca nô dân sự huy động", createdAt: randomDate(10), updatedAt: randomDate(0.4) },
  { id: "RES-0003", name: "Thuyền kayak KY-001", type: "boat", status: "available", capabilities: ["water_rescue"], capacity: 2, speed: 10, location: VIETNAM_LOCATIONS[0], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Lê Dũng", contactPhone: "0913333333", notes: "Thuyền nhẹ, phù hợp hẻm nhỏ", createdAt: randomDate(10), updatedAt: randomDate(5) },
  { id: "RES-0004", name: "Ca nô CN-003", type: "boat", status: "deployed", capabilities: ["water_rescue", "supply_delivery"], capacity: 12, speed: 40, location: VIETNAM_LOCATIONS[1], assignedIncidentId: "INC-0002", assignedTaskId: null, deployedAt: randomDate(0.6), estimatedReturnAt: randomDate(-1), contactName: "Phạm Tuấn", contactPhone: "0914444444", notes: "Ca nô quân đội", createdAt: randomDate(10), updatedAt: randomDate(0.6) },
  { id: "RES-0005", name: "Ca nô CN-004", type: "boat", status: "available", capabilities: ["water_rescue"], capacity: 6, speed: 25, location: VIETNAM_LOCATIONS[1], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Hoàng Long", contactPhone: "0915555555", notes: "Ca nô cứu hộ dự phòng", createdAt: randomDate(10), updatedAt: randomDate(3) },
  { id: "RES-0006", name: "Ca nô CN-005", type: "boat", status: "deployed", capabilities: ["water_rescue", "supply_delivery"], capacity: 10, speed: 35, location: VIETNAM_LOCATIONS[8], assignedIncidentId: "INC-0003", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "Vàng Văn Sùng", contactPhone: "0916666666", notes: "Huy động từ Yên Bái", createdAt: randomDate(10), updatedAt: randomDate(0.3) },
  { id: "RES-0007", name: "Ca nô CN-006", type: "boat", status: "available", capabilities: ["water_rescue"], capacity: 8, speed: 30, location: VIETNAM_LOCATIONS[11], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Đỗ Văn Thịnh", contactPhone: "0917777777", notes: "Ca nô Quảng Bình", createdAt: randomDate(10), updatedAt: randomDate(5) },
  { id: "RES-0008", name: "Ca nô CN-007", type: "boat", status: "deployed", capabilities: ["water_rescue"], capacity: 6, speed: 25, location: VIETNAM_LOCATIONS[7], assignedIncidentId: "INC-0004", assignedTaskId: null, deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Lý Seo Phìn", contactPhone: "0918888888", notes: "Ca nô Lào Cai", createdAt: randomDate(10), updatedAt: randomDate(0.5) },

  // Helicopters (3)
  { id: "RES-0009", name: "Trực thăng Mi-171 HT-001", type: "helicopter", status: "deployed", capabilities: ["aerial_survey", "medical_evacuation", "search_rescue"], capacity: 15, speed: 220, location: VIETNAM_LOCATIONS[8], assignedIncidentId: "INC-0003", assignedTaskId: "TSK-0003", deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Đại úy Nguyễn Văn Khánh", contactPhone: "0919999999", notes: "Trực thăng Quân khu 2, đang cứu hộ sạt lở", createdAt: randomDate(10), updatedAt: randomDate(0.4) },
  { id: "RES-0010", name: "Trực thăng EC-225 HT-002", type: "helicopter", status: "available", capabilities: ["aerial_survey", "medical_evacuation"], capacity: 20, speed: 250, location: { lat: 21.0, lng: 105.8, province: "Hà Nội", district: "Sóc Sơn", commune: "Phù Linh", address: "Sân bay Gia Lâm" }, assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Thiếu tá Trần Văn Hùng", contactPhone: "0920000000", notes: "Trực thăng Cảnh sát biển, sẵn sàng điều động", createdAt: randomDate(10), updatedAt: randomDate(2) },
  { id: "RES-0011", name: "Trực thăng Bell-412 HT-003", type: "helicopter", status: "maintenance", capabilities: ["aerial_survey", "medical_evacuation"], capacity: 10, speed: 230, location: { lat: 16.0, lng: 108.2, province: "Đà Nẵng", district: "Hải Châu", commune: "Thanh Bình", address: "Sân bay Đà Nẵng" }, assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Đại úy Lê Minh Đức", contactPhone: "0921111111", notes: "Đang bảo trì định kỳ, dự kiến sẵn sàng trong 6h", createdAt: randomDate(10), updatedAt: randomDate(1) },

  // Ambulances (6)
  { id: "RES-0012", name: "Xe cứu thương AM-001", type: "ambulance", status: "deployed", capabilities: ["medical", "medical_evacuation"], capacity: 2, speed: 80, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "Bs. Nguyễn Thị Mai", contactPhone: "0922222222", notes: "Xe cấp cứu Bệnh viện Bãi Cháy", createdAt: randomDate(10), updatedAt: randomDate(0.3) },
  { id: "RES-0013", name: "Xe cứu thương AM-002", type: "ambulance", status: "available", capabilities: ["medical", "medical_evacuation"], capacity: 2, speed: 80, location: VIETNAM_LOCATIONS[1], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Bs. Trần Văn Nam", contactPhone: "0923333333", notes: "Xe cấp cứu Bệnh viện Việt Tiệp", createdAt: randomDate(10), updatedAt: randomDate(3) },
  { id: "RES-0014", name: "Xe cứu thương AM-003", type: "ambulance", status: "deployed", capabilities: ["medical"], capacity: 2, speed: 70, location: VIETNAM_LOCATIONS[8], assignedIncidentId: "INC-0003", assignedTaskId: null, deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Bs. Lý Văn Phúc", contactPhone: "0924444444", notes: "Xe cấp cứu Trạm Tấu", createdAt: randomDate(10), updatedAt: randomDate(0.5) },
  { id: "RES-0015", name: "Xe cứu thương AM-004", type: "ambulance", status: "available", capabilities: ["medical", "medical_evacuation"], capacity: 2, speed: 80, location: VIETNAM_LOCATIONS[3], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Bs. Phạm Thị Lan", contactPhone: "0925555555", notes: "Xe cấp cứu BVĐK Long Biên", createdAt: randomDate(10), updatedAt: randomDate(2) },
  { id: "RES-0016", name: "Xe cứu thương AM-005", type: "ambulance", status: "deployed", capabilities: ["medical"], capacity: 2, speed: 75, location: VIETNAM_LOCATIONS[5], assignedIncidentId: "INC-0011", assignedTaskId: null, deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Bs. Đỗ Văn Hải", contactPhone: "0926666666", notes: "Xe cấp cứu Thái Bình", createdAt: randomDate(10), updatedAt: randomDate(0.4) },
  { id: "RES-0017", name: "Xe cứu thương AM-006", type: "ambulance", status: "available", capabilities: ["medical", "medical_evacuation"], capacity: 2, speed: 80, location: VIETNAM_LOCATIONS[6], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Bs. Bùi Văn Thắng", contactPhone: "0927777777", notes: "Xe cấp cứu Nam Định", createdAt: randomDate(10), updatedAt: randomDate(3) },

  // Fire Trucks (4)
  { id: "RES-0018", name: "Xe cứu hỏa FT-001", type: "fire_truck", status: "deployed", capabilities: ["heavy_equipment", "water_pump", "search_rescue"], capacity: 8, speed: 60, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Đại úy PCCC Hoàng Văn Nam", contactPhone: "0928888888", notes: "Xe cứu hỏa chuyên dụng, có máy bơm công suất lớn", createdAt: randomDate(10), updatedAt: randomDate(0.5) },
  { id: "RES-0019", name: "Xe cứu hỏa FT-002", type: "fire_truck", status: "available", capabilities: ["heavy_equipment", "water_pump"], capacity: 6, speed: 55, location: VIETNAM_LOCATIONS[1], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Đại úy PCCC Lê Văn Tuấn", contactPhone: "0929999999", notes: "Xe cứu hỏa Hải Phòng", createdAt: randomDate(10), updatedAt: randomDate(3) },
  { id: "RES-0020", name: "Xe cứu hỏa FT-003", type: "fire_truck", status: "deployed", capabilities: ["heavy_equipment", "search_rescue"], capacity: 8, speed: 60, location: VIETNAM_LOCATIONS[9], assignedIncidentId: "INC-0014", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "Đại úy PCCC Nông Văn Mạnh", contactPhone: "0930000000", notes: "Xe cứu hỏa Cao Bằng, đang thông đường", createdAt: randomDate(10), updatedAt: randomDate(0.3) },
  { id: "RES-0021", name: "Xe cứu hỏa FT-004", type: "fire_truck", status: "available", capabilities: ["heavy_equipment", "water_pump"], capacity: 6, speed: 55, location: VIETNAM_LOCATIONS[4], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Đại úy PCCC Trần Thị Hương", contactPhone: "0931111111", notes: "Xe cứu hỏa Hà Nội", createdAt: randomDate(10), updatedAt: randomDate(2) },

  // Rescue Teams (6)
  { id: "RES-0022", name: "Đội SAR QK3-01", type: "rescue_team", status: "deployed", capabilities: ["search_rescue", "water_rescue", "first_aid"], capacity: 12, speed: 15, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: "TSK-0001", deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Trung tá Nguyễn Văn An", contactPhone: "0932222222", notes: "Đội SAR Quân khu 3, 12 người, trang bị đầy đủ", createdAt: randomDate(10), updatedAt: randomDate(0.5) },
  { id: "RES-0023", name: "Đội Cứu hộ CNCH-01", type: "rescue_team", status: "deployed", capabilities: ["search_rescue", "heavy_equipment", "first_aid"], capacity: 15, speed: 12, location: VIETNAM_LOCATIONS[8], assignedIncidentId: "INC-0003", assignedTaskId: "TSK-0003", deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Thượng úy Trần Văn Hùng", contactPhone: "0933333333", notes: "Đội CNCH Công an Yên Bái", createdAt: randomDate(10), updatedAt: randomDate(0.4) },
  { id: "RES-0024", name: "Đội TNV Chữ thập đỏ-01", type: "rescue_team", status: "deployed", capabilities: ["first_aid", "supply_delivery", "communication"], capacity: 20, speed: 10, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "Chị Nguyễn Thị Lan", contactPhone: "0934444444", notes: "Đội TNV VNRC Quảng Ninh, phát nhu yếu phẩm", createdAt: randomDate(10), updatedAt: randomDate(0.3) },
  { id: "RES-0025", name: "Đội SAR QK2-01", type: "rescue_team", status: "deployed", capabilities: ["search_rescue", "heavy_equipment"], capacity: 10, speed: 12, location: VIETNAM_LOCATIONS[7], assignedIncidentId: "INC-0004", assignedTaskId: null, deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Trung tá Lý Văn Phúc", contactPhone: "0935555555", notes: "Đội SAR Quân khu 2, tìm kiếm người mất tích", createdAt: randomDate(10), updatedAt: randomDate(0.5) },
  { id: "RES-0026", name: "Đội TNV Thanh niên-01", type: "rescue_team", status: "available", capabilities: ["supply_delivery", "communication"], capacity: 25, speed: 10, location: VIETNAM_LOCATIONS[3], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Anh Phạm Văn Đức", contactPhone: "0936666666", notes: "Đội TNV Thành đoàn Hà Nội, sẵn sàng điều động", createdAt: randomDate(10), updatedAt: randomDate(2) },
  { id: "RES-0027", name: "Đội Y tế lưu động-01", type: "rescue_team", status: "deployed", capabilities: ["medical", "triage", "first_aid"], capacity: 8, speed: 15, location: VIETNAM_LOCATIONS[1], assignedIncidentId: "INC-0002", assignedTaskId: null, deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Bs. CKII Lê Thị Mai", contactPhone: "0937777777", notes: "Đội y tế lưu động BV Việt Tiệp", createdAt: randomDate(10), updatedAt: randomDate(0.4) },

  // Medical Teams (3)
  { id: "RES-0028", name: "Đội phẫu thuật dã chiến MT-001", type: "medical_team", status: "deployed", capabilities: ["medical", "triage"], capacity: 6, speed: 20, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "PGS.TS Nguyễn Văn Khánh", contactPhone: "0938888888", notes: "Đội phẫu thuật dã chiến BV Bãi Cháy", createdAt: randomDate(10), updatedAt: randomDate(0.3) },
  { id: "RES-0029", name: "Đội y tế MT-002", type: "medical_team", status: "available", capabilities: ["medical", "first_aid"], capacity: 4, speed: 18, location: VIETNAM_LOCATIONS[4], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Bs. Trần Thị Hương", contactPhone: "0939999999", notes: "Đội y tế BV Bạch Mai, sẵn sàng", createdAt: randomDate(10), updatedAt: randomDate(2) },
  { id: "RES-0030", name: "Đội tâm lý MT-003", type: "medical_team", status: "deployed", capabilities: ["medical"], capacity: 3, speed: 15, location: VIETNAM_LOCATIONS[8], assignedIncidentId: "INC-0003", assignedTaskId: null, deployedAt: randomDate(0.2), estimatedReturnAt: randomDate(-1), contactName: "ThS. Hoàng Thị Lan", contactPhone: "0940000000", notes: "Đội hỗ trợ tâm lý cho nạn nhân", createdAt: randomDate(10), updatedAt: randomDate(0.2) },

  // Supply Trucks (5)
  { id: "RES-0031", name: "Xe tải tiếp tế ST-001", type: "supply_truck", status: "deployed", capabilities: ["supply_delivery"], capacity: 60, speed: 55, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Anh Phạm Văn Đức", contactPhone: "0941111111", notes: "Xe tải 5 tấn, chở lương thực + nước uống", createdAt: randomDate(10), updatedAt: randomDate(0.4) },
  { id: "RES-0032", name: "Xe tải tiếp tế ST-002", type: "supply_truck", status: "available", capabilities: ["supply_delivery"], capacity: 50, speed: 50, location: VIETNAM_LOCATIONS[1], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Anh Lê Văn Đạt", contactPhone: "0942222222", notes: "Xe tải Hải Phòng, sẵn sàng", createdAt: randomDate(10), updatedAt: randomDate(3) },
  { id: "RES-0033", name: "Xe tải tiếp tế ST-003", type: "supply_truck", status: "deployed", capabilities: ["supply_delivery"], capacity: 40, speed: 50, location: VIETNAM_LOCATIONS[5], assignedIncidentId: "INC-0011", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "Anh Đỗ Văn Hải", contactPhone: "0943333333", notes: "Xe tải Thái Bình, chở chăn màn", createdAt: randomDate(10), updatedAt: randomDate(0.3) },
  { id: "RES-0034", name: "Xe tải tiếp tế ST-004", type: "supply_truck", status: "available", capabilities: ["supply_delivery"], capacity: 55, speed: 55, location: VIETNAM_LOCATIONS[3], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Anh Trần Văn Nam", contactPhone: "0944444444", notes: "Xe tải Hà Nội", createdAt: randomDate(10), updatedAt: randomDate(2) },
  { id: "RES-0035", name: "Xe tải tiếp tế ST-005", type: "supply_truck", status: "deployed", capabilities: ["supply_delivery"], capacity: 45, speed: 50, location: VIETNAM_LOCATIONS[7], assignedIncidentId: "INC-0004", assignedTaskId: null, deployedAt: randomDate(0.5), estimatedReturnAt: randomDate(-1), contactName: "Anh Lý Seo Phìn", contactPhone: "0945555555", notes: "Xe tải Lào Cai, đường khó đi", createdAt: randomDate(10), updatedAt: randomDate(0.5) },

  // Generators (3)
  { id: "RES-0036", name: "Máy phát điện GE-001", type: "generator", status: "deployed", capabilities: ["power_generation"], capacity: 1, speed: 40, location: VIETNAM_LOCATIONS[0], assignedIncidentId: "INC-0001", assignedTaskId: null, deployedAt: randomDate(0.4), estimatedReturnAt: randomDate(-1), contactName: "Anh Nguyễn Hải", contactPhone: "0946666666", notes: "Máy phát 50kVA, phục vụ trung tâm cứu hộ", createdAt: randomDate(10), updatedAt: randomDate(0.4) },
  { id: "RES-0037", name: "Máy phát điện GE-002", type: "generator", status: "available", capabilities: ["power_generation"], capacity: 1, speed: 35, location: VIETNAM_LOCATIONS[4], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Anh Trần Bình", contactPhone: "0947777777", notes: "Máy phát 30kVA", createdAt: randomDate(10), updatedAt: randomDate(3) },
  { id: "RES-0038", name: "Máy phát điện GE-003", type: "generator", status: "deployed", capabilities: ["power_generation"], capacity: 1, speed: 40, location: VIETNAM_LOCATIONS[8], assignedIncidentId: "INC-0003", assignedTaskId: null, deployedAt: randomDate(0.3), estimatedReturnAt: randomDate(-1), contactName: "Anh Vàng A Sử", contactPhone: "0948888888", notes: "Máy phát cho bản bị cắt điện", createdAt: randomDate(10), updatedAt: randomDate(0.3) },

  // Water Pumps (2)
  { id: "RES-0039", name: "Máy bơm WP-001", type: "water_pump", status: "deployed", capabilities: ["water_pump"], capacity: 1, speed: 30, location: VIETNAM_LOCATIONS[4], assignedIncidentId: "INC-0015", assignedTaskId: null, deployedAt: randomDate(0.2), estimatedReturnAt: randomDate(-1), contactName: "Anh Trần Văn Khánh", contactPhone: "0949999999", notes: "Máy bơm công suất lớn, hút nước phố cổ", createdAt: randomDate(10), updatedAt: randomDate(0.2) },
  { id: "RES-0040", name: "Máy bơm WP-002", type: "water_pump", status: "available", capabilities: ["water_pump"], capacity: 1, speed: 25, location: VIETNAM_LOCATIONS[1], assignedIncidentId: null, assignedTaskId: null, deployedAt: null, estimatedReturnAt: null, contactName: "Anh Lê Minh Tuấn", contactPhone: "0950000000", notes: "Máy bơm dự phòng", createdAt: randomDate(10), updatedAt: randomDate(3) },
];

// =============================================================================
// MOCK VOLUNTEERS (50 volunteers)
// =============================================================================

const VOLUNTEER_NAMES = [
  "Nguyễn Văn An", "Trần Thị Bình", "Lê Văn Cường", "Phạm Thị Dung", "Hoàng Văn Đức",
  "Vũ Thị Em", "Đặng Văn Phúc", "Bùi Thị Giang", "Đỗ Văn Hùng", "Ngô Thị Iris",
  "Lý Văn Khánh", "Mai Thị Lan", "Trịnh Văn Minh", "Tạ Thị Nga", "Phan Văn Oai",
  "Võ Thị Phương", "Đinh Văn Quốc", "Lưu Thị Rainbow", "Hồ Văn Sơn", "Dương Thị Trang",
  "Tô Văn Uyên", "Châu Thị Vân", "Lại Văn Xuân", "Kiều Thị Yến", "Từ Văn Zũng",
  "Vàng A Sùng", "Lý Seo Chải", "Hồ Văn Pả", "Nông Văn Mạnh", "Lý Văn Phúc",
  "Hà Thị Quyên", "Cà Văn Rin", "Giàng A Tủa", "Sùng A Vàng", "Thào B Xua",
  "Lò Văn Yêu", "Quàng Thị Zin", "Bàn Văn Khanh", "Cầm Thị Linh", "Đinh Văn Múi",
  "Hờ A Nùng", "Lường Văn Ơn", "Mạc Thị Phượng", "Nông Văn Quế", "Phùng Văn Rinh",
  "Sầm Thị Sương", "Tống Văn Tính", "Tráng Thị Uyên", "Vương Văn Vinh", "Xa Thị Yến",
];

const VOLUNTEER_SKILLS_SETS: Array<Array<"search_rescue" | "first_aid" | "water_rescue" | "heavy_equipment" | "communication" | "logistics" | "translation" | "counseling" | "medical" | "cooking" | "driving" | "construction">> = [
  ["search_rescue", "first_aid", "water_rescue"],
  ["medical", "triage", "first_aid"],
  ["heavy_equipment", "driving", "construction"],
  ["communication", "logistics"],
  ["first_aid", "counseling"],
  ["search_rescue", "heavy_equipment"],
  ["water_rescue", "first_aid"],
  ["cooking", "logistics"],
  ["translation", "communication"],
  ["driving", "supply_delivery" as any],
];

export const MOCK_VOLUNTEERS: Volunteer[] = VOLUNTEER_NAMES.map((name, i) => {
  const locIdx = i % VIETNAM_LOCATIONS.length;
  const skillIdx = i % VOLUNTEER_SKILLS_SETS.length;
  const typeIdx = i % 3;
  const types: VolunteerType[] = ["registered", "spontaneous", "professional"];
  const statuses: VolunteerStatus[] = ["available", "deployed", "off_duty", "unavailable"];
  const statusIdx = i < 15 ? 1 : i < 35 ? 0 : i < 45 ? 2 : 3;
  const incidentIdx = i % MOCK_INCIDENTS.length;

  return {
    id: `VOL-${String(i + 1).padStart(4, "0")}`,
    name,
    phone: `09${randomInt(10000000, 99999999)}`,
    email: i % 3 === 0 ? `${name.toLowerCase().replace(/\s/g, ".")}@email.com` : undefined,
    type: types[typeIdx],
    status: statuses[statusIdx],
    skills: VOLUNTEER_SKILLS_SETS[skillIdx],
    experience: randomInt(0, 50),
    location: VIETNAM_LOCATIONS[locIdx],
    assignedIncidentId: statusIdx === 1 ? MOCK_INCIDENTS[incidentIdx].id : null,
    assignedTaskId: statusIdx === 1 ? `TSK-${String(randomInt(1, 25)).padStart(4, "0")}` : null,
    totalHours: randomInt(0, 500),
    rating: 3 + randomInt(0, 2),
    certifications: i % 4 === 0 ? ["Sơ cấp cứu", "Cứu hộ đường thủy"] : i % 3 === 0 ? ["Y tế dự phòng"] : [],
    isVerified: i % 3 !== 1,
    registeredAt: randomDate(30, 60),
    lastActiveAt: randomDate(0, 5),
    updatedAt: randomDate(0, 2),
  };
});

// =============================================================================
// MOCK SHELTERS (20 shelters)
// =============================================================================

export const MOCK_SHELTERS: Shelter[] = [
  {
    id: "SHL-0001", name: "Trường THPT Bãi Cháy", type: "evacuation", status: "open",
    location: VIETNAM_LOCATIONS[0],
    capacity: { max: 500, current: 380, reserved: 50 },
    facilities: ["Nhà vệ sinh", "Bếp ăn", "Nguồn điện", "Nước sạch"],
    needs: ["blankets", "clothing"],
    specialNeeds: { elderly: 45, children: 120, disabled: 12, pregnant: 8 },
    contactName: "Thầy Nguyễn Văn Khánh", contactPhone: "0951111111",
    managedBy: "UBND TP Hạ Long",
    openedAt: randomDate(4), closedAt: null, notes: "Trường học được trưng dụng làm nơi sơ tán",
    createdAt: randomDate(5), updatedAt: randomDate(0, 1),
  },
  {
    id: "SHL-0002", name: "Nhà văn hóa Ngô Quyền", type: "temporary", status: "open",
    location: VIETNAM_LOCATIONS[1],
    capacity: { max: 300, current: 250, reserved: 30 },
    facilities: ["Nhà vệ sinh", "Bếp ăn", "Nguồn điện"],
    needs: ["water", "food"],
    specialNeeds: { elderly: 30, children: 80, disabled: 5, pregnant: 3 },
    contactName: "Chị Trần Thị Mai", contactPhone: "0952222222",
    managedBy: "VNRC Hải Phòng",
    openedAt: randomDate(4), closedAt: null, notes: "Nơi trú ẩn tạm thời cho người dân Ngô Quyền",
    createdAt: randomDate(5), updatedAt: randomDate(0, 1),
  },
  {
    id: "SHL-0003", name: "Trung tâm Y tế Trạm Tấu", type: "medical", status: "open",
    location: VIETNAM_LOCATIONS[8],
    capacity: { max: 100, current: 85, reserved: 15 },
    facilities: ["Phòng cấp cứu", "Bệnh viện dã chiến", "Nguồn điện dự phòng"],
    needs: ["medical", "water"],
    specialNeeds: { elderly: 20, children: 15, disabled: 8, pregnant: 5 },
    contactName: "Bs. Lý Văn Phúc", contactPhone: "0953333333",
    managedBy: "Sở Y tế Yên Bái",
    openedAt: randomDate(3), closedAt: null, notes: "Bệnh viện dã chiến cho nạn nhân sạt lở",
    createdAt: randomDate(4), updatedAt: randomDate(0, 1),
  },
  {
    id: "SHL-0004", name: "Trường mầm non A Mú Sung", type: "evacuation", status: "open",
    location: VIETNAM_LOCATIONS[7],
    capacity: { max: 150, current: 120, reserved: 20 },
    facilities: ["Nhà vệ sinh", "Bếp ăn"],
    needs: ["food", "blankets", "clothing"],
    specialNeeds: { elderly: 15, children: 60, disabled: 3, pregnant: 2 },
    contactName: "Cô Lý Thị Phượng", contactPhone: "0954444444",
    managedBy: "UBND huyện Bát Xát",
    openedAt: randomDate(3), closedAt: null, notes: "Điểm sơ tán cho bản A Mú Sung",
    createdAt: randomDate(4), updatedAt: randomDate(0, 1),
  },
  {
    id: "SHL-0005", name: "Sân vận động Long Biên", type: "evacuation", status: "preparing",
    location: VIETNAM_LOCATIONS[3],
    capacity: { max: 2000, current: 0, reserved: 500 },
    facilities: ["Nhà vệ sinh", "Bếp ăn", "Nguồn điện", "Nước sạch", "Wifi"],
    needs: ["blankets", "sanitation"],
    specialNeeds: { elderly: 0, children: 0, disabled: 0, pregnant: 0 },
    contactName: "Anh Phạm Văn Khánh", contactPhone: "0955555555",
    managedBy: "UBND quận Long Biên",
    openedAt: null, closedAt: null, notes: "Đang chuẩn bị, dự kiến đón 2000 người",
    createdAt: randomDate(2), updatedAt: randomDate(0, 1),
  },
  // 15 more shelters
  ...Array.from({ length: 15 }, (_, i) => {
    const idx = i + 6;
    const locIdx = i % VIETNAM_LOCATIONS.length;
    const types: ShelterType[] = ["evacuation", "temporary", "transitional", "permanent", "medical"];
    const statuses: ShelterStatus[] = ["open", "full", "closed", "preparing"];
    const maxCap = randomInt(100, 1000);
    const current = randomInt(0, maxCap);

    return {
      id: `SHL-${String(idx).padStart(4, "0")}`,
      name: `Nơi trú ẩn #${idx}`,
      type: types[i % 5],
      status: statuses[i % 4],
      location: VIETNAM_LOCATIONS[locIdx],
      capacity: { max: maxCap, current, reserved: randomInt(0, 50) },
      facilities: ["Nhà vệ sinh", "Bếp ăn"],
      needs: ["food", "water", "blankets"] as any[],
      specialNeeds: {
        elderly: randomInt(0, 30),
        children: randomInt(0, 50),
        disabled: randomInt(0, 10),
        pregnant: randomInt(0, 5),
      },
      contactName: `Người quản lý #${idx}`,
      contactPhone: `09${randomInt(10000000, 99999999)}`,
      managedBy: "UBND Địa phương",
      openedAt: current > 0 ? randomDate(5) : null,
      closedAt: null,
      notes: `Nơi trú ẩn dự phòng #${idx}`,
      createdAt: randomDate(10),
      updatedAt: randomDate(0, 2),
    } as Shelter;
  }),
];

// =============================================================================
// MOCK ORGANIZATIONS (10 organizations)
// =============================================================================

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "ORG-0001", name: "Quân khu 3", acronym: "QK3", type: "military",
    sectors: ["shelter", "logistics", "emergency_telecommunications"],
    contactInfo: { name: "Trung tướng Nguyễn Văn An", phone: "0961111111" },
    capacity: 5000, location: VIETNAM_LOCATIONS[0],
  },
  {
    id: "ORG-0002", name: "Hội Chữ thập đỏ Quảng Ninh", acronym: "VNRC-QN", type: "vnrc",
    sectors: ["shelter", "food_security", "health"],
    contactInfo: { name: "Chị Nguyễn Thị Lan", phone: "0962222222" },
    capacity: 500, location: VIETNAM_LOCATIONS[0],
  },
  {
    id: "ORG-0003", name: "UBND TP Hạ Long", acronym: "UBND-HL", type: "local_govt",
    sectors: ["shelter", "logistics"],
    contactInfo: { name: "Ông Trần Văn Hùng", phone: "0963333333" },
    capacity: 1000, location: VIETNAM_LOCATIONS[0],
  },
  {
    id: "ORG-0004", name: "Đội TNV Trẻ Quảng Ninh", acronym: "TNV-QN", type: "volunteer",
    sectors: ["food_security", "logistics"],
    contactInfo: { name: "Anh Phạm Văn Đức", phone: "0964444444" },
    capacity: 200, location: VIETNAM_LOCATIONS[0],
  },
  {
    id: "ORG-0005", name: "UNDP Việt Nam", acronym: "UNDP", type: "un",
    sectors: ["early_recovery", "shelter", "protection"],
    contactInfo: { name: "Ms. Sarah Johnson", phone: "0965555555" },
    capacity: 50, location: VIETNAM_LOCATIONS[4],
  },
  {
    id: "ORG-0006", name: "Oxfam Việt Nam", acronym: "Oxfam", type: "ngo",
    sectors: ["wash", "food_security"],
    contactInfo: { name: "Mr. James Smith", phone: "0966666666" },
    capacity: 80, location: VIETNAM_LOCATIONS[4],
  },
  {
    id: "ORG-0007", name: "Công an PCCC Hải Phòng", acronym: "PCCC-HP", type: "government",
    sectors: ["emergency_telecommunications", "logistics"],
    contactInfo: { name: "Đại tá Lê Minh Tuấn", phone: "0967777777" },
    capacity: 300, location: VIETNAM_LOCATIONS[1],
  },
  {
    id: "ORG-0008", name: "Viettel Quảng Ninh", acronym: "Viettel-QN", type: "private",
    sectors: ["emergency_telecommunications"],
    contactInfo: { name: "Anh Nguyễn Văn Bình", phone: "0968888888" },
    capacity: 100, location: VIETNAM_LOCATIONS[0],
  },
  {
    id: "ORG-0009", name: "Quân khu 2", acronym: "QK2", type: "military",
    sectors: ["shelter", "logistics"],
    contactInfo: { name: "Thiếu tướng Hoàng Văn Dũng", phone: "0969999999" },
    capacity: 3000, location: VIETNAM_LOCATIONS[8],
  },
  {
    id: "ORG-0010", name: "Bệnh viện Bạch Mai", acronym: "BVBM", type: "government",
    sectors: ["health"],
    contactInfo: { name: "PGS.TS Nguyễn Văn Khánh", phone: "0970000000" },
    capacity: 200, location: VIETNAM_LOCATIONS[4],
  },
];

// =============================================================================
// MOCK 3W ENTRIES
// =============================================================================

export const MOCK_3W_ENTRIES: ThreeWEntry[] = [
  {
    id: "3W-0001",
    who: MOCK_ORGANIZATIONS[0],
    what: {
      id: "ACT-0001", organizationId: "ORG-0001", incidentId: "INC-0001",
      cluster: "logistics", activityType: "Search & Rescue",
      activityDescription: "Triển khai 5 ca nô cứu hộ tại Bãi Cháy",
      location: VIETNAM_LOCATIONS[0],
      targetBeneficiaries: 2500, actualBeneficiaries: 800,
      status: "active", startDate: randomDate(4), endDate: null,
      deliveryMechanism: "service",
    },
    where: VIETNAM_LOCATIONS[0],
    when: { started: randomDate(4), estimatedEnd: null },
    status: "active",
  },
  {
    id: "3W-0002",
    who: MOCK_ORGANIZATIONS[1],
    what: {
      id: "ACT-0002", organizationId: "ORG-0002", incidentId: "INC-0001",
      cluster: "food_security", activityType: "Food distribution",
      activityDescription: "Phát 500 suất ăn/ngày cho người dân bị ảnh hưởng",
      location: VIETNAM_LOCATIONS[0],
      targetBeneficiaries: 1000, actualBeneficiaries: 500,
      status: "active", startDate: randomDate(3), endDate: null,
      deliveryMechanism: "in_kind",
    },
    where: VIETNAM_LOCATIONS[0],
    when: { started: randomDate(3), estimatedEnd: null },
    status: "active",
  },
  {
    id: "3W-0003",
    who: MOCK_ORGANIZATIONS[4],
    what: {
      id: "ACT-0003", organizationId: "ORG-0005", incidentId: "INC-0001",
      cluster: "early_recovery", activityType: "Needs assessment",
      activityDescription: "Đánh giá thiệt hại và nhu cầu phục hồi",
      location: VIETNAM_LOCATIONS[0],
      targetBeneficiaries: 5000, actualBeneficiaries: 2000,
      status: "active", startDate: randomDate(2), endDate: null,
      deliveryMechanism: "service",
    },
    where: VIETNAM_LOCATIONS[0],
    when: { started: randomDate(2), estimatedEnd: null },
    status: "active",
  },
  // More 3W entries for other incidents
  ...Array.from({ length: 17 }, (_, i) => {
    const idx = i + 4;
    const orgIdx = i % MOCK_ORGANIZATIONS.length;
    const incIdx = i % MOCK_INCIDENTS.length;
    const locIdx = i % VIETNAM_LOCATIONS.length;
    const clusters: HumanitarianCluster[] = ["shelter", "health", "wash", "food_security", "protection", "logistics"];
    const statuses: ActivityStatus[] = ["planned", "active", "completed"];

    return {
      id: `3W-${String(idx).padStart(4, "0")}`,
      who: MOCK_ORGANIZATIONS[orgIdx],
      what: {
        id: `ACT-${String(idx).padStart(4, "0")}`,
        organizationId: MOCK_ORGANIZATIONS[orgIdx].id,
        incidentId: MOCK_INCIDENTS[incIdx].id,
        cluster: clusters[i % 6],
        activityType: `Hoạt động #${idx}`,
        activityDescription: `Mô tả hoạt động cứu trợ #${idx}`,
        location: VIETNAM_LOCATIONS[locIdx],
        targetBeneficiaries: randomInt(100, 5000),
        actualBeneficiaries: randomInt(50, 3000),
        status: statuses[i % 3],
        startDate: randomDate(10),
        endDate: i % 3 === 2 ? randomDate(2) : null,
        deliveryMechanism: (["in_kind", "cash", "service"] as const)[i % 3],
      },
      where: VIETNAM_LOCATIONS[locIdx],
      when: { started: randomDate(10), estimatedEnd: null },
      status: statuses[i % 3],
    } as ThreeWEntry;
  }),
];

// =============================================================================
// MOCK TASKS (25 tasks)
// =============================================================================

export const MOCK_TASKS: RescueTask[] = [
  {
    id: "TSK-0001", title: "Cứu hộ người mắc kẹt - Bãi Cháy", description: "Sử dụng ca nô tiếp cận 15 người dân mắc kẹt trên mái nhà tại khu vực Bãi Cháy",
    incidentId: "INC-0001", assigneeId: "RES-0022", assigneeType: "team", priority: "P1", status: "in_progress",
    requiredCapabilities: ["water_rescue", "search_rescue"],
    location: VIETNAM_LOCATIONS[0], dueTime: randomDate(-1), completedAt: null,
    subtasks: [
      { id: "SUB-001", title: "Tiếp cận bằng ca nô", completed: true, completedAt: randomDate(0.3) },
      { id: "SUB-002", title: "Đưa người già và trẻ em lên thuyền trước", completed: false, completedAt: null },
      { id: "SUB-003", title: "Vận chuyển đến nơi an toàn", completed: false, completedAt: null },
    ],
    notes: ["Ưu tiên trẻ em và người già", "Mang theo áo phao"],
    createdAt: randomDate(1), updatedAt: randomDate(0.3),
  },
  {
    id: "TSK-0002", title: "Phát nhu yếu phẩm - Ngô Quyền", description: "Phát 200 suất lương thực và nước uống cho người dân tại Ngô Quyền",
    incidentId: "INC-0002", assigneeId: "VOL-0004", assigneeType: "volunteer", priority: "P2", status: "assigned",
    requiredCapabilities: ["supply_delivery", "logistics"],
    location: VIETNAM_LOCATIONS[1], dueTime: randomDate(-1), completedAt: null,
    subtasks: [
      { id: "SUB-004", title: "Kiểm tra kho hàng", completed: true, completedAt: randomDate(0.5) },
      { id: "SUB-005", title: "Đóng gói 200 suất", completed: false, completedAt: null },
      { id: "SUB-006", title: "Vận chuyển đến điểm phát", completed: false, completedAt: null },
    ],
    notes: ["Phát cho hộ nghèo trước"],
    createdAt: randomDate(1), updatedAt: randomDate(0.5),
  },
  {
    id: "TSK-0003", title: "Tìm kiếm người mất tích - Trạm Tấu", description: "Tìm kiếm 22 người bị vùi lấp do sạt lở đất tại bản Hát Lừu",
    incidentId: "INC-0003", assigneeId: "RES-0009", assigneeType: "team", priority: "P1", status: "in_progress",
    requiredCapabilities: ["search_rescue", "heavy_equipment"],
    location: VIETNAM_LOCATIONS[8], dueTime: randomDate(-1), completedAt: null,
    subtasks: [
      { id: "SUB-007", title: "Khảo sát khu vực sạt lở", completed: true, completedAt: randomDate(0.2) },
      { id: "SUB-008", title: "Dùng thiết bị dò tìm", completed: true, completedAt: randomDate(0.15) },
      { id: "SUB-009", title: "Đào bới cứu nạn", completed: false, completedAt: null },
    ],
    notes: ["Trực thăng đang trên đường", "Cần máy đào chuyên dụng"],
    createdAt: randomDate(0.6), updatedAt: randomDate(0.15),
  },
  // 22 more tasks
  ...Array.from({ length: 22 }, (_, i) => {
    const idx = i + 4;
    const incIdx = i % MOCK_INCIDENTS.length;
    const locIdx = i % VIETNAM_LOCATIONS.length;
    const priorities: TaskPriority[] = ["P1", "P2", "P3", "P4"];
    const statuses: TaskStatus[] = ["new", "assigned", "in_progress", "done"];
    const taskTitles = [
      "Sơ tán người dân", "Gia cố đê điều", "Thiết lập cầu phao", "Cấp cứu nạn nhân",
      "Phát chăn màn", "Khảo sát thiệt hại", "Thông đường giao thông", "Thiết lập liên lạc",
      "Cung cấp nước sạch", "Dọn dẹp hiện trường", "Hỗ trợ tâm lý", "Vận chuyển hàng hóa",
      "Thiết lập trung tâm cứu hộ", "Kiểm tra đê", "Sơ tán trường học", "Cấp phát thuốc",
      "Thiết lập bếp ăn", "Vệ sinh môi trường", "Phòng chống dịch", "Khảo sát an toàn",
      "Hỗ trợ di dời", "Ghi nhận thiệt hại",
    ];

    return {
      id: `TSK-${String(idx).padStart(4, "0")}`,
      title: taskTitles[i % taskTitles.length],
      description: `Mô tả nhiệm vụ #${idx} cho sự cố ${MOCK_INCIDENTS[incIdx].title}`,
      incidentId: MOCK_INCIDENTS[incIdx].id,
      assigneeId: i % 4 > 0 ? `VOL-${String(randomInt(1, 50)).padStart(4, "0")}` : null,
      assigneeType: i % 4 > 0 ? (i % 2 === 0 ? "volunteer" : "team") : null,
      priority: priorities[i % 4],
      status: statuses[i % 4],
      requiredCapabilities: ["supply_delivery", "first_aid"],
      location: VIETNAM_LOCATIONS[locIdx],
      dueTime: randomDate(-2, 3),
      completedAt: i % 4 === 3 ? randomDate(0, 2) : null,
      subtasks: [
        { id: `SUB-${idx * 3 + 1}`, title: "Chuẩn bị", completed: i % 4 > 0, completedAt: i % 4 > 0 ? randomDate(1) : null },
        { id: `SUB-${idx * 3 + 2}`, title: "Thực hiện", completed: i % 4 > 2, completedAt: i % 4 > 2 ? randomDate(0.5) : null },
        { id: `SUB-${idx * 3 + 3}`, title: "Báo cáo", completed: i % 4 > 2, completedAt: i % 4 > 2 ? randomDate(0.3) : null },
      ],
      notes: [`Ghi chú nhiệm vụ #${idx}`],
      createdAt: randomDate(5),
      updatedAt: randomDate(0, 2),
    } as RescueTask;
  }),
];

// =============================================================================
// MOCK COMMUNICATION DATA
// =============================================================================

export const MOCK_CHANNELS: CommChannel[] = [
  {
    id: "CH-0001", name: "Chỉ huy - Bão Yagi", type: "command", incidentId: "INC-0001",
    participants: ["ics-0001", "ics-0002", "ics-0003"],
    unreadCount: 5, lastMessageAt: randomDate(0, 0.5), createdAt: randomDate(5),
  },
  {
    id: "CH-0002", name: "Cứu hộ - Quảng Ninh", type: "incident", incidentId: "INC-0001",
    participants: ["VOL-0001", "VOL-0002", "VOL-0003", "RES-0001"],
    unreadCount: 12, lastMessageAt: randomDate(0, 0.3), createdAt: randomDate(4),
  },
  {
    id: "CH-0003", name: "Hậu cần", type: "logistics", incidentId: null,
    participants: ["VOL-0010", "VOL-0011", "VOL-0012"],
    unreadCount: 3, lastMessageAt: randomDate(0, 1), createdAt: randomDate(5),
  },
  {
    id: "CH-0004", name: "Y tế", type: "medical", incidentId: null,
    participants: ["VOL-0020", "VOL-0021"],
    unreadCount: 1, lastMessageAt: randomDate(0, 2), createdAt: randomDate(4),
  },
  {
    id: "CH-0005", name: "Chung", type: "general", incidentId: null,
    participants: ["VOL-0001", "VOL-0002", "VOL-0003", "VOL-0004", "VOL-0005"],
    unreadCount: 8, lastMessageAt: randomDate(0, 0.5), createdAt: randomDate(6),
  },
];

export const MOCK_MESSAGES: CommMessage[] = [
  {
    id: "MSG-0001", channelId: "CH-0001", senderId: "ics-0001", senderName: "Nguyễn Văn An",
    type: "text", content: "Tình hình Bãi Cháy rất nghiêm trọng. Cần thêm 2 ca nô từ Hải Phòng.",
    priority: "urgent", isSystem: false, createdAt: randomDate(0.5),
  },
  {
    id: "MSG-0002", channelId: "CH-0001", senderId: "ics-0002", senderName: "Lê Minh Tuấn",
    type: "text", content: "Đã điều động ca nô CN-003 từ Hải Phòng. ETA 45 phút.",
    priority: "normal", isSystem: false, createdAt: randomDate(0.45),
  },
  {
    id: "MSG-0003", channelId: "CH-0002", senderId: "system", senderName: "Hệ thống",
    type: "status_update", content: "SOS-0001 đã được cứu hộ thành công. 15 người an toàn.",
    priority: "normal", isSystem: true, createdAt: randomDate(0.3),
  },
  {
    id: "MSG-0004", channelId: "CH-0002", senderId: "VOL-0001", senderName: "Nguyễn Văn An",
    type: "text", content: "Khu vực Bãi Cháy ngập sâu 2m. Cần áo phao thêm.",
    priority: "urgent", isSystem: false, createdAt: randomDate(0.25),
  },
  {
    id: "MSG-0005", channelId: "CH-0003", senderId: "VOL-0010", senderName: "Lý Văn Khánh",
    type: "resource_request", content: "Yêu cầu 500 chăn và 200 áo phao cho Quảng Ninh.",
    priority: "urgent", isSystem: false, createdAt: randomDate(0.4),
  },
  // More messages
  ...Array.from({ length: 15 }, (_, i) => {
    const idx = i + 6;
    const chIdx = i % MOCK_CHANNELS.length;
    const volIdx = i % MOCK_VOLUNTEERS.length;
    const msgTypes: CommMessage["type"][] = ["text", "status_update", "resource_request", "location_share", "system"];

    return {
      id: `MSG-${String(idx).padStart(4, "0")}`,
      channelId: MOCK_CHANNELS[chIdx].id,
      senderId: MOCK_VOLUNTEERS[volIdx].id,
      senderName: MOCK_VOLUNTEERS[volIdx].name,
      type: msgTypes[i % 5],
      content: `Tin nhắn #${idx}: ${i % 5 === 0 ? "Cập nhật tình hình" : i % 5 === 1 ? "Trạng thái đã thay đổi" : i % 5 === 2 ? "Yêu cầu thêm tài nguyên" : i % 5 === 3 ? "Chia sẻ vị trí hiện tại" : "Thông báo hệ thống"}`,
      priority: i % 4 === 0 ? "urgent" : "normal",
      isSystem: i % 5 === 4,
      createdAt: randomDate(0, 1),
    } as CommMessage;
  }),
];

export const MOCK_BROADCASTS: Broadcast[] = [
  {
    id: "BC-0001", title: "Cảnh báo lũ quét", content: "Lũ quét có thể xảy ra trong 2h tới tại Quảng Ninh. Tất cả di dời lên cao.",
    target: "all", priority: "critical", sentBy: "ics-0001", sentAt: randomDate(0.5), acknowledgedBy: ["VOL-0001", "VOL-0002"],
  },
  {
    id: "BC-0002", title: "Kêu gọi tình nguyện viên", content: "Cần 50 tình nguyện viên hỗ trợ phát quà tại Bãi Cháy. Đăng ký tại đây.",
    target: "volunteers", priority: "normal", sentBy: "ics-0001", sentAt: randomDate(0.3), acknowledgedBy: ["VOL-0003"],
  },
];

// =============================================================================
// MOCK TIMELINE EVENTS
// =============================================================================

export const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  ...MOCK_INCIDENTS.flatMap((inc) => {
    const events: TimelineEvent[] = [
      {
        id: nextId("tl"), incidentId: inc.id, type: "incident_created",
        title: `Tạo sự cố: ${inc.title}`, description: inc.description.substring(0, 100),
        actorId: inc.commanderId || "system", actorName: inc.commandStructure.incidentCommander?.name || "Hệ thống",
        timestamp: inc.createdAt,
      },
    ];

    if (inc.incidentActionPlan) {
      events.push({
        id: nextId("tl"), incidentId: inc.id, type: "iap_created",
        title: "Tạo kế hoạch hành động", description: "IAP cho operational period mới",
        actorId: inc.commanderId || "system", actorName: inc.commandStructure.incidentCommander?.name || "Hệ thống",
        timestamp: inc.incidentActionPlan.createdAt,
      });
    }

    if (inc.resolvedAt) {
      events.push({
        id: nextId("tl"), incidentId: inc.id, type: "incident_resolved",
        title: "Giải quyết sự cố", description: "Sự cố đã được giải quyết",
        actorId: inc.commanderId || "system", actorName: inc.commandStructure.incidentCommander?.name || "Hệ thống",
        timestamp: inc.resolvedAt,
      });
    }

    return events;
  }),
  ...MOCK_SOS_REQUESTS.slice(0, 10).flatMap((sos) => {
    return sos.timeline.map((entry) => ({
      id: nextId("tl"), incidentId: sos.incidentId || "unknown",
      type: `sos_${entry.status}` as TimelineEventType,
      title: `SOS ${sos.id}: ${entry.status}`,
      description: entry.note || `Trạng thái SOS thay đổi thành ${entry.status}`,
      actorId: "system", actorName: "Hệ thống",
      relatedEntityId: sos.id, relatedEntityType: "sos" as const,
      timestamp: entry.timestamp,
    }));
  }),
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// =============================================================================
// MOCK CHECK-INS
// =============================================================================

export const MOCK_CHECK_INS: CheckIn[] = [
  ...Array.from({ length: 50 }, (_, i) => {
    const locIdx = i % VIETNAM_LOCATIONS.length;
    const incIdx = i % MOCK_INCIDENTS.length;
    const statuses: CheckInStatus[] = ["safe", "safe", "safe", "need_help", "missing", "evacuated", "hospitalized"];

    return {
      id: `CHK-${String(i + 1).padStart(4, "0")}`,
      personName: `Người dân #${i + 1}`,
      phone: `09${randomInt(10000000, 99999999)}`,
      status: statuses[i % 7],
      location: i % 5 === 0 ? null : VIETNAM_LOCATIONS[locIdx],
      incidentId: MOCK_INCIDENTS[incIdx].id,
      familyMembers: randomInt(1, 6),
      notes: i % 10 === 0 ? "Cần hỗ trợ y tế" : undefined,
      checkedInAt: randomDate(0, 3),
      checkedInBy: i % 3 === 0 ? "self" : `VOL-${String(randomInt(1, 50)).padStart(4, "0")}`,
    } as CheckIn;
  }),
];

// =============================================================================
// MOCK DISPATCH RESULTS
// =============================================================================

export const MOCK_DISPATCH_RESULTS: DispatchResult[] = [
  {
    incidentId: "INC-0001", sosId: "SOS-0001",
    recommendations: [
      { unitId: "RES-0001", unitName: "Ca nô CN-001", unitType: "boat", matchScore: 95, etaMinutes: 15, distanceKm: 2.5, reasons: ["nearest", "best_capability"], capabilities: ["water_rescue", "supply_delivery"] },
      { unitId: "RES-0022", unitName: "Đội SAR QK3-01", unitType: "rescue_team", matchScore: 88, etaMinutes: 20, distanceKm: 3.0, reasons: ["best_capability", "highest_capacity"], capabilities: ["search_rescue", "water_rescue", "first_aid"] },
      { unitId: "RES-0002", unitName: "Ca nô CN-002", unitType: "boat", matchScore: 75, etaMinutes: 25, distanceKm: 4.0, reasons: ["nearest"], capabilities: ["water_rescue"] },
    ],
    calculatedAt: randomDate(0.5),
    algorithm: "best_fit",
    factors: { distanceWeight: 0.35, capabilityWeight: 0.3, availabilityWeight: 0.2, capacityWeight: 0.1, speedWeight: 0.05 },
  },
];

// =============================================================================
// MOCK RESOURCE FLOW DATA (Sankey)
// =============================================================================

export const MOCK_RESOURCE_FLOW: ResourceFlowData = {
  nodes: [
    { id: "src-military", name: "Quân đội", type: "source", value: 15 },
    { id: "src-vnrc", name: "Chữ thập đỏ", type: "source", value: 10 },
    { id: "src-volunteer", name: "Tình nguyện", type: "source", value: 20 },
    { id: "src-govt", name: "Chính quyền", type: "source", value: 8 },
    { id: "inc-001", name: "Quảng Ninh", type: "incident", value: 25 },
    { id: "inc-002", name: "Hải Phòng", type: "incident", value: 15 },
    { id: "inc-003", name: "Yên Bái", type: "incident", value: 8 },
    { id: "out-rescued", name: "Cứu hộ", type: "outcome", value: 30 },
    { id: "out-supplied", name: "Tiếp tế", type: "outcome", value: 15 },
    { id: "out-medical", name: "Y tế", type: "outcome", value: 8 },
  ],
  links: [
    { source: "src-military", target: "inc-001", value: 8, resourceType: "rescue_team" },
    { source: "src-military", target: "inc-003", value: 5, resourceType: "rescue_team" },
    { source: "src-vnrc", target: "inc-001", value: 6, resourceType: "supply_truck" },
    { source: "src-vnrc", target: "inc-002", value: 4, resourceType: "supply_truck" },
    { source: "src-volunteer", target: "inc-001", value: 10, resourceType: "rescue_team" },
    { source: "src-volunteer", target: "inc-002", value: 5, resourceType: "rescue_team" },
    { source: "src-volunteer", target: "inc-003", value: 3, resourceType: "rescue_team" },
    { source: "src-govt", target: "inc-001", value: 4, resourceType: "supply_truck" },
    { source: "src-govt", target: "inc-002", value: 3, resourceType: "supply_truck" },
    { source: "inc-001", target: "out-rescued", value: 15, resourceType: "boat" },
    { source: "inc-001", target: "out-supplied", value: 8, resourceType: "supply_truck" },
    { source: "inc-002", target: "out-rescued", value: 10, resourceType: "boat" },
    { source: "inc-002", target: "out-medical", value: 5, resourceType: "ambulance" },
    { source: "inc-003", target: "out-rescued", value: 5, resourceType: "helicopter" },
    { source: "inc-003", target: "out-medical", value: 3, resourceType: "ambulance" },
  ],
};
