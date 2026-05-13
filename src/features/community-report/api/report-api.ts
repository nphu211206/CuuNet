import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  CommunityReport,
  ReportFilters,
  ReportStats,
  WizardFormData,
  PaginatedReports,
  VoteType,
  ReportStatus,
} from "../lib/types";
import {
  REPORT_CONFIG,
  STORAGE_KEYS,
  VERIFICATION_CONFIG,
} from "../config/report-config";
import { generateMockReports } from "../lib/mock-data";
import {
  sanitizeReport,
  sanitizeWizardData,
  validateFullReport,
} from "../lib/validation";

// ============================================================
// REPORT API — localStorage CRUD Operations
// ============================================================
// Module này xử lý tất cả thao tác đọc/ghi dữ liệu báo cáo
// Không có backend → tất cả dữ liệu lưu trong localStorage
// Bao gồm: CRUD reports, draft management, user management,
//          search, pagination, statistics
// ============================================================

// === INTERNAL HELPERS ===

/**
 * Tạo timestamp hiện tại dạng ISO string
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Tạo report ID unique
 * Format: rpt-{base36timestamp}-{random6chars}
 */
function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `rpt-${timestamp}-${random}`;
}

/**
 * Tạo report number (số thứ tự tăng dần)
 * Đọc max reportNumber hiện tại và +1
 */
function generateReportNumber(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!stored) return 1;
    const reports = JSON.parse(stored) as CommunityReport[];
    if (!Array.isArray(reports) || reports.length === 0) return 1;
    const maxNumber = Math.max(...reports.map((r) => r.reportNumber || 0));
    return maxNumber + 1;
  } catch {
    return 1;
  }
}

/**
 * Đọc tất cả reports từ localStorage
 */
function readAllReports(): CommunityReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as CommunityReport[];
  } catch (error) {
    console.error("[ReportAPI] Lỗi đọc reports:", error);
    return [];
  }
}

/**
 * Ghi tất cả reports vào localStorage
 * Có cleanup khi vượt ngưỡng MAX_REPORTS_IN_STORAGE
 */
function writeAllReports(reports: CommunityReport[]): void {
  try {
    // Sanitize trước khi lưu
    const sanitized = reports.map(sanitizeReport);

    // Giới hạn số lượng
    const toSave =
      sanitized.length > REPORT_CONFIG.MAX_REPORTS_IN_STORAGE
        ? sanitized.slice(0, REPORT_CONFIG.MAX_REPORTS_IN_STORAGE)
        : sanitized;

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(toSave));
  } catch (error) {
    console.error("[ReportAPI] Lỗi ghi reports:", error);
    // Thử cleanup và ghi lại
    try {
      const reduced = reports.slice(0, REPORT_CONFIG.CLEANUP_THRESHOLD);
      localStorage.setItem(
        STORAGE_KEYS.REPORTS,
        JSON.stringify(reduced.map(sanitizeReport))
      );
    } catch (innerError) {
      console.error("[ReportAPI] Vẫn không thể ghi sau cleanup:", innerError);
      throw new Error("Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy.");
    }
  }
}

// === FETCH REPORTS (with filters, pagination, sort) ===

/**
 * Lấy danh sách báo cáo đã lọc, phân trang, sắp xếp
 *
 * @param filters - Bộ lọc (type, severity, province, status, date range)
 * @param page - Số trang (bắt đầu từ 1)
 * @param limit - Số report mỗi trang
 * @param searchQuery - Từ khóa tìm kiếm (tùy chọn)
 * @returns PaginatedReports object
 */
export async function fetchReports(
  filters: ReportFilters,
  page: number = 1,
  limit: number = REPORT_CONFIG.PAGE_SIZE,
  searchQuery: string = ""
): Promise<PaginatedReports> {
  // Giả lập độ trễ network (50-150ms)
  await simulateDelay(50, 150);

  const allReports = readAllReports();

  // Áp dụng filters
  let filtered = [...allReports];

  // Filter by disaster types
  if (filters.types.length > 0) {
    filtered = filtered.filter((r) => filters.types.includes(r.type));
  }

  // Filter by severities
  if (filters.severities.length > 0) {
    filtered = filtered.filter((r) => filters.severities.includes(r.severity));
  }

  // Filter by provinces
  if (filters.provinces.length > 0) {
    filtered = filtered.filter((r) =>
      filters.provinces.includes(r.location.province)
    );
  }

  // Filter by statuses
  if (filters.statuses.length > 0) {
    filtered = filtered.filter((r) => filters.statuses.includes(r.status));
  }

  // Filter verified only
  if (filters.verifiedOnly) {
    filtered = filtered.filter((r) => r.status === "verified");
  }

  // Filter by date range preset
  if (filters.dateRange.preset !== "all") {
    const hours = getDatePresetHours(filters.dateRange.preset);
    if (hours !== null) {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      filtered = filtered.filter((r) => new Date(r.createdAt) >= cutoff);
    }
  }

  // Search
  if (searchQuery && searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.location.province.toLowerCase().includes(query) ||
        r.location.district.toLowerCase().includes(query)
    );
  }

  // Sort
  filtered = applySorting(filtered, filters.sortBy);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const reports = filtered.slice(startIndex, endIndex);

  return {
    reports,
    total,
    page,
    pageSize: limit,
    hasMore: page < totalPages,
    totalPages,
  };
}

/**
 * Lấy một báo cáo theo ID
 */
export async function fetchReportById(
  id: string
): Promise<CommunityReport | null> {
  await simulateDelay(30, 80);

  const reports = readAllReports();
  return reports.find((r) => r.id === id) || null;
}

// === SUBMIT REPORT ===

/**
 * Gửi báo cáo mới
 * - Validate dữ liệu
 * - Sanitize input
 * - Tạo CommunityReport object
 * - Lưu vào localStorage
 *
 * @param data - WizardFormData từ SubmitWizard
 * @returns CommunityReport đã tạo
 * @throws Error nếu validation fail
 */
export async function submitReport(
  data: WizardFormData
): Promise<CommunityReport> {
  // Giả lập thời gian xử lý (300-800ms)
  await simulateDelay(300, 800);

  // Validate toàn bộ dữ liệu
  const validation = validateFullReport(data);
  if (!validation.isValid) {
    const errorMessages = Object.values(validation.errors).join("; ");
    throw new Error(`Dữ liệu không hợp lệ: ${errorMessages}`);
  }

  // Sanitize dữ liệu đầu vào
  const sanitizedData = sanitizeWizardData(data);

  // Lấy thông tin user hiện tại
  const userId = getUserId();
  const reportNumber = generateReportNumber();
  const timestamp = now();

  // Tạo CommunityReport object
  const report: CommunityReport = {
    id: generateReportId(),
    type: sanitizedData.type!,
    severity: sanitizedData.severity,
    status: "pending",
    location: {
      lat: sanitizedData.location.lat!,
      lng: sanitizedData.location.lng!,
      province: sanitizedData.location.province,
      district: sanitizedData.location.district,
      address: sanitizedData.location.address,
      accuracy: sanitizedData.location.useGPS ? 10 : undefined,
    },
    title: sanitizedData.title,
    description: sanitizedData.description,
    photos: sanitizedData.photos,
    reporter: {
      id: userId,
      name: sanitizedData.reporter.isAnonymous
        ? "Ẩn danh"
        : sanitizedData.reporter.name,
      phone: sanitizedData.reporter.phone,
      isAnonymous: sanitizedData.reporter.isAnonymous,
      reportCount: getUserReportCount(userId) + 1,
      avgTrustScore: VERIFICATION_CONFIG.DEFAULT_TRUST_SCORE,
      joinedAt: getUserJoinedAt(userId),
    },
    verification: {
      upvotes: 0,
      downvotes: 0,
      trustScore: VERIFICATION_CONFIG.DEFAULT_TRUST_SCORE,
      voterIds: [],
      badge: null,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    templateId: sanitizedData.templateId,
    isOffline: !navigator.onLine,
    syncStatus: navigator.onLine ? "synced" : "pending",
    reportNumber,
  };

  // Lưu vào localStorage
  const allReports = readAllReports();
  const updatedReports = [report, ...allReports];
  writeAllReports(updatedReports);

  // Lưu ID vào myReports
  addMyReportId(report.id);

  // Xóa draft sau khi submit thành công
  clearDraft();

  return report;
}

// === UPDATE REPORT ===

/**
 * Cập nhật báo cáo hiện có
 *
 * @param id - Report ID
 * @param updates - Partial updates
 * @returns CommunityReport đã cập nhật
 * @throws Error nếu report không tồn tại
 */
export async function updateReport(
  id: string,
  updates: Partial<CommunityReport>
): Promise<CommunityReport> {
  await simulateDelay(100, 300);

  const allReports = readAllReports();
  const index = allReports.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error(`Không tìm thấy báo cáo với ID: ${id}`);
  }

  // Merge updates (không cho phép thay đổi id, createdAt, reportNumber)
  const updatedReport: CommunityReport = {
    ...allReports[index],
    ...updates,
    id: allReports[index].id, // Giữ nguyên ID
    createdAt: allReports[index].createdAt, // Giữ nguyên thời gian tạo
    reportNumber: allReports[index].reportNumber, // Giữ nguyên số thứ tự
    updatedAt: now(), // Cập nhật thời gian sửa
  };

  // Sanitize
  const sanitized = sanitizeReport(updatedReport);

  allReports[index] = sanitized;
  writeAllReports(allReports);

  return sanitized;
}

// === DELETE REPORT ===

/**
 * Xóa báo cáo
 *
 * @param id - Report ID cần xóa
 * @returns true nếu xóa thành công
 * @throws Error nếu report không tồn tại
 */
export async function deleteReport(id: string): Promise<boolean> {
  await simulateDelay(100, 200);

  const allReports = readAllReports();
  const index = allReports.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error(`Không tìm thấy báo cáo với ID: ${id}`);
  }

  allReports.splice(index, 1);
  writeAllReports(allReports);

  // Xóa khỏi myReports
  removeMyReportId(id);

  return true;
}

// === VOTE REPORT ===

/**
 * Bình chọn cho báo cáo
 * - Kiểm tra user đã vote report này chưa
 * - Áp dụng vote (up/down)
 * - Cập nhật trust score
 * - Xác định badge (verified/disputed)
 *
 * @param reportId - Report ID
 * @param voteType - "up" hoặc "down"
 * @returns CommunityReport đã cập nhật
 */
export async function voteReport(
  reportId: string,
  voteType: VoteType
): Promise<CommunityReport> {
  await simulateDelay(50, 150);

  const userId = getUserId();
  const allReports = readAllReports();
  const index = allReports.findIndex((r) => r.id === reportId);

  if (index === -1) {
    throw new Error(`Không tìm thấy báo cáo với ID: ${reportId}`);
  }

  const report = allReports[index];

  // Kiểm tra user đã vote chưa
  const userVotes = getUserVotes();
  if (userVotes[reportId]) {
    throw new Error("Bạn đã bình chọn cho báo cáo này rồi");
  }

  // Áp dụng vote
  let newUpvotes = report.verification.upvotes;
  let newDownvotes = report.verification.downvotes;

  if (voteType === "up") {
    newUpvotes++;
  } else {
    newDownvotes++;
  }

  const total = newUpvotes + newDownvotes;
  const upvoteRatio = total > 0 ? newUpvotes / total : 0.5;
  const voteWeight = Math.min(
    total / VERIFICATION_CONFIG.UPVOTE_THRESHOLD,
    1.0
  );
  const newTrustScore = Math.max(
    0,
    Math.min(1, upvoteRatio * voteWeight)
  );

  // Xác định badge
  let badge: CommunityReport["verification"]["badge"] = null;
  if (
    newUpvotes >= VERIFICATION_CONFIG.UPVOTE_THRESHOLD &&
    newTrustScore >= VERIFICATION_CONFIG.MIN_TRUST_FOR_BADGE
  ) {
    badge = "verified";
  } else if (
    total > 0 &&
    newDownvotes / total >= VERIFICATION_CONFIG.DISPUTE_RATIO
  ) {
    badge = "disputed";
  }

  // Cập nhật verification
  const updatedReport: CommunityReport = {
    ...report,
    verification: {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      trustScore: Math.round(newTrustScore * 100) / 100,
      voterIds: [...report.verification.voterIds, userId],
      badge,
      verifiedAt:
        badge === "verified" && !report.verification.verifiedAt
          ? now()
          : report.verification.verifiedAt,
      lastVoteAt: now(),
    },
    // Nếu đạt verified badge → cập nhật status
    status:
      badge === "verified" && report.status === "pending"
        ? "verified"
        : report.status,
    updatedAt: now(),
  };

  allReports[index] = updatedReport;
  writeAllReports(allReports);

  // Lưu vote của user
  saveUserVote(reportId, voteType);

  return updatedReport;
}

// === SEARCH REPORTS ===

/**
 * Tìm kiếm báo cáo theo từ khóa
 *
 * @param query - Từ khóa tìm kiếm
 * @param filters - Bộ lọc bổ sung (tùy chọn)
 * @returns Danh sách báo cáo phù hợp
 */
export async function searchReports(
  query: string,
  filters?: Partial<ReportFilters>
): Promise<CommunityReport[]> {
  await simulateDelay(50, 100);

  if (!query || query.trim().length === 0) return [];

  const allReports = readAllReports();
  const searchQuery = query.toLowerCase().trim();

  let results = allReports.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery) ||
      r.description.toLowerCase().includes(searchQuery) ||
      r.location.province.toLowerCase().includes(searchQuery) ||
      r.location.district.toLowerCase().includes(searchQuery) ||
      r.location.address.toLowerCase().includes(searchQuery) ||
      r.reporter.name.toLowerCase().includes(searchQuery)
  );

  // Áp dụng filters nếu có
  if (filters) {
    if (filters.types && filters.types.length > 0) {
      results = results.filter((r) => filters.types!.includes(r.type));
    }
    if (filters.severities && filters.severities.length > 0) {
      results = results.filter((r) =>
        filters.severities!.includes(r.severity)
      );
    }
    if (filters.statuses && filters.statuses.length > 0) {
      results = results.filter((r) =>
        filters.statuses!.includes(r.status)
      );
    }
  }

  return results;
}

// === GET REPORT STATS ===

/**
 * Tính toán thống kê từ tất cả báo cáo
 */
export async function getReportStats(): Promise<ReportStats> {
  await simulateDelay(30, 80);

  const reports = readAllReports();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const byType: Record<DisasterType, number> = {
    flood: 0, storm: 0, landslide: 0, drought: 0, earthquake: 0, tsunami: 0,
  };
  const bySeverity: Record<SeverityLevel, number> = {
    critical: 0, high: 0, medium: 0, low: 0,
  };
  const byStatus: Record<ReportStatus, number> = {
    pending: 0, verified: 0, resolved: 0, rejected: 0,
  };
  const byProvince: Record<string, number> = {};

  let verified = 0, pending = 0, resolved = 0, rejected = 0;
  let todayCount = 0, thisWeekCount = 0;
  let totalTrustScore = 0, trustScoreCount = 0;

  for (const report of reports) {
    byType[report.type]++;
    bySeverity[report.severity]++;
    byStatus[report.status]++;

    switch (report.status) {
      case "verified": verified++; break;
      case "pending": pending++; break;
      case "resolved": resolved++; break;
      case "rejected": rejected++; break;
    }

    const province = report.location.province;
    if (province) {
      byProvince[province] = (byProvince[province] || 0) + 1;
    }

    const reportDate = new Date(report.createdAt);
    if (reportDate >= todayStart) todayCount++;
    if (reportDate >= weekStart) thisWeekCount++;

    if (report.verification.trustScore > 0) {
      totalTrustScore += report.verification.trustScore;
      trustScoreCount++;
    }
  }

  let topProvince = { name: "", count: 0 };
  for (const [name, count] of Object.entries(byProvince)) {
    if (count > topProvince.count) topProvince = { name, count };
  }

  let topType: { type: DisasterType; count: number } = {
    type: "flood", count: 0,
  };
  for (const [type, count] of Object.entries(byType)) {
    if (count > topType.count) topType = { type: type as DisasterType, count };
  }

  return {
    total: reports.length,
    verified, pending, resolved, rejected,
    todayCount, thisWeekCount,
    avgTrustScore:
      trustScoreCount > 0
        ? Math.round((totalTrustScore / trustScoreCount) * 100) / 100
        : 0,
    byType, byProvince, bySeverity, byStatus,
    topProvince, topType,
    recentTrend: "stable",
  };
}

// === MY REPORTS ===

/**
 * Lấy danh sách báo cáo của user hiện tại
 */
export async function getMyReports(): Promise<CommunityReport[]> {
  await simulateDelay(30, 80);

  const myReportIds = getMyReportIds();
  if (myReportIds.length === 0) return [];

  const allReports = readAllReports();
  return allReports.filter((r) => myReportIds.includes(r.id));
}

// === DRAFT MANAGEMENT ===

/**
 * Lưu draft (nháp) vào localStorage
 * Tự động lưu mỗi 5 giây khi wizard đang mở
 */
export function saveDraft(draft: WizardFormData): void {
  try {
    const sanitized = sanitizeWizardData(draft);
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(sanitized));
  } catch (error) {
    console.warn("[ReportAPI] Không thể lưu draft:", error);
  }
}

/**
 * Đọc draft từ localStorage
 * @returns WizardFormData hoặc null nếu không có draft
 */
export function loadDraft(): WizardFormData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DRAFT);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as WizardFormData;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Xóa draft khỏi localStorage
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  } catch (error) {
    console.warn("[ReportAPI] Không thể xóa draft:", error);
  }
}

/**
 * Kiểm tra có draft đang lưu không
 */
export function hasDraft(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return stored !== null && stored.length > 10;
  } catch {
    return false;
  }
}

// === USER MANAGEMENT ===

/**
 * Lấy hoặc tạo userId
 * Lưu trong localStorage, tạo mới nếu chưa có
 */
export function getUserId(): string {
  try {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  } catch {
    return `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Lấy danh sách vote của user
 * @returns Record<reportId, voteType>
 */
export function getUserVotes(): Record<string, VoteType> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_VOTES);
    if (!stored) return {};
    return JSON.parse(stored) as Record<string, VoteType>;
  } catch {
    return {};
  }
}

/**
 * Lưu vote của user
 */
export function saveUserVote(reportId: string, voteType: VoteType): void {
  try {
    const votes = getUserVotes();
    votes[reportId] = voteType;
    localStorage.setItem(STORAGE_KEYS.USER_VOTES, JSON.stringify(votes));
  } catch (error) {
    console.warn("[ReportAPI] Không thể lưu vote:", error);
  }
}

// === INTERNAL HELPERS ===

/**
 * Giả lập độ trễ network
 */
function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Lấy số giờ từ date preset
 */
function getDatePresetHours(preset: string): number | null {
  const presets: Record<string, number | null> = {
    "1h": 1,
    "6h": 6,
    "24h": 24,
    "7d": 168,
    "30d": 720,
    all: null,
  };
  return presets[preset] ?? null;
}

/**
 * Sort reports theo tiêu chí
 */
function applySorting(
  reports: CommunityReport[],
  sortBy: string
): CommunityReport[] {
  const sorted = [...reports];

  switch (sortBy) {
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      break;
    case "mostSevere":
      sorted.sort((a, b) => {
        const weights: Record<string, number> = {
          critical: 4, high: 3, medium: 2, low: 1,
        };
        const diff = (weights[b.severity] || 0) - (weights[a.severity] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      break;
    case "mostVerified":
      sorted.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          verified: 4, pending: 3, resolved: 2, rejected: 1,
        };
        const diff = (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
        if (diff !== 0) return diff;
        return b.verification.trustScore - a.verification.trustScore;
      });
      break;
    case "mostVotes":
      sorted.sort((a, b) => {
        const totalA = a.verification.upvotes + a.verification.downvotes;
        const totalB = b.verification.upvotes + b.verification.downvotes;
        if (totalB !== totalA) return totalB - totalA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      break;
    default: // "nearest" hoặc fallback
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return sorted;
}

/**
 * Lấy myReport IDs từ localStorage
 */
function getMyReportIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MY_REPORTS);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

/**
 * Thêm report ID vào myReports
 */
function addMyReportId(id: string): void {
  try {
    const ids = getMyReportIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(STORAGE_KEYS.MY_REPORTS, JSON.stringify(ids));
    }
  } catch (error) {
    console.warn("[ReportAPI] Không thể thêm myReport ID:", error);
  }
}

/**
 * Xóa report ID khỏi myReports
 */
function removeMyReportId(id: string): void {
  try {
    const ids = getMyReportIds();
    const filtered = ids.filter((i) => i !== id);
    localStorage.setItem(STORAGE_KEYS.MY_REPORTS, JSON.stringify(filtered));
  } catch (error) {
    console.warn("[ReportAPI] Không thể xóa myReport ID:", error);
  }
}

/**
 * Đếm số báo cáo đã gửi của user
 */
function getUserReportCount(userId: string): number {
  const allReports = readAllReports();
  return allReports.filter((r) => r.reporter.id === userId).length;
}

/**
 * Lấy thời gian user tham gia (từ report đầu tiên)
 */
function getUserJoinedAt(userId: string): string {
  const allReports = readAllReports();
  const userReports = allReports
    .filter((r) => r.reporter.id === userId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  return userReports.length > 0 ? userReports[0].createdAt : now();
}

// === FILTERS PERSISTENCE ===

/**
 * Lưu filters vào localStorage
 */
export function saveFilters(filters: ReportFilters): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  } catch (error) {
    console.warn("[ReportAPI] Không thể lưu filters:", error);
  }
}

/**
 * Đọc filters từ localStorage
 */
export function loadFilters(): ReportFilters | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FILTERS);
    if (!stored) return null;
    return JSON.parse(stored) as ReportFilters;
  } catch {
    return null;
  }
}

// === BULK OPERATIONS ===

/**
 * Xóa nhiều báo cáo cùng lúc
 */
export async function deleteReports(ids: string[]): Promise<number> {
  await simulateDelay(100, 300);

  const allReports = readAllReports();
  const idSet = new Set(ids);
  const filtered = allReports.filter((r) => !idSet.has(r.id));
  const deletedCount = allReports.length - filtered.length;

  writeAllReports(filtered);

  // Xóa khỏi myReports
  for (const id of ids) {
    removeMyReportId(id);
  }

  return deletedCount;
}

/**
 * Cập nhật status cho nhiều báo cáo
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: ReportStatus
): Promise<number> {
  await simulateDelay(100, 300);

  const allReports = readAllReports();
  let updatedCount = 0;
  const timestamp = now();

  for (let i = 0; i < allReports.length; i++) {
    if (ids.includes(allReports[i].id)) {
      allReports[i] = {
        ...allReports[i],
        status,
        updatedAt: timestamp,
      };
      updatedCount++;
    }
  }

  writeAllReports(allReports);
  return updatedCount;
}
