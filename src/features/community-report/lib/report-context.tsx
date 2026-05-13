"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  CommunityReport,
  ReportStatus,
  ReportFilters,
  ReportStats,
  ReportState,
  ReportAction,
  WizardFormData,
  Toast,
  ToastType,
  VoteType,
  SortOption,
  DatePreset,
} from "./types";
import {
  REPORT_CONFIG,
  VERIFICATION_CONFIG,
  STORAGE_KEYS,
  SEVERITY_WEIGHTS,
  TOAST_CONFIG,
  DATE_PRESET_CONFIG,
} from "../config/report-config";
import { generateMockReports } from "./mock-data";
import { sanitizeReport } from "./validation";

// ============================================================
// REPORT CONTEXT — State Management Layer
// ============================================================
// React Context + useReducer pattern cho toàn bộ Community Report module
// - ReportProvider: wrap component tree, cung cấp state + dispatch
// - useReport(): hook để truy cập state + helper functions
// - reportReducer: xử lý 26 action types
// - calculateStats: tính toán ReportStats từ danh sách reports
// - applyFilters: lọc + sort + search reports
// - localStorage persistence: tự động lưu/đọc từ localStorage
// ============================================================

// === INITIAL STATE ===

function createInitialFilters(): ReportFilters {
  return {
    types: [],
    severities: [],
    provinces: [],
    statuses: [],
    verifiedOnly: false,
    dateRange: {
      preset: "all",
      start: null,
      end: null,
    },
    sortBy: "newest",
  };
}

function createInitialStats(): ReportStats {
  return {
    total: 0,
    verified: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
    todayCount: 0,
    thisWeekCount: 0,
    avgTrustScore: 0,
    byType: {
      flood: 0,
      storm: 0,
      landslide: 0,
      drought: 0,
      earthquake: 0,
      tsunami: 0,
    },
    byProvince: {},
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    byStatus: { pending: 0, verified: 0, resolved: 0, rejected: 0 },
    topProvince: { name: "", count: 0 },
    topType: { type: "flood", count: 0 },
    recentTrend: "stable",
  };
}

function createInitialState(): ReportState {
  return {
    reports: [],
    myReports: [],
    selectedReport: null,
    filters: createInitialFilters(),
    searchQuery: "",
    viewMode: "feed",
    isSubmitWizardOpen: false,
    wizardState: {
      currentStep: 1,
      direction: 1,
      data: {
        type: null,
        location: {
          lat: null,
          lng: null,
          province: "",
          district: "",
          address: "",
          useGPS: false,
        },
        title: "",
        description: "",
        severity: "medium",
        photos: [],
        reporter: {
          isAnonymous: true,
          name: "",
          phone: "",
        },
        confirmed: false,
      },
      errors: {},
      warnings: {},
      isDirty: false,
      isSubmitting: false,
      submitProgress: 0,
    },
    isDetailModalOpen: false,
    isMobileFilterOpen: false,
    stats: createInitialStats(),
    page: 1,
    hasMore: true,
    toasts: [],
    error: null,
    isLoading: false,
  };
}

// === STATS CALCULATION ===

/**
 * Tính toán ReportStats từ danh sách reports
 * Bao gồm: tổng hợp theo type, severity, status, province
 * Tính trust score trung bình, xu hướng gần đây
 */
export function calculateStats(reports: CommunityReport[]): ReportStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Khởi tạo counters
  const byType: Record<DisasterType, number> = {
    flood: 0,
    storm: 0,
    landslide: 0,
    drought: 0,
    earthquake: 0,
    tsunami: 0,
  };
  const bySeverity: Record<SeverityLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const byStatus: Record<ReportStatus, number> = {
    pending: 0,
    verified: 0,
    resolved: 0,
    rejected: 0,
  };
  const byProvince: Record<string, number> = {};

  let verified = 0;
  let pending = 0;
  let resolved = 0;
  let rejected = 0;
  let todayCount = 0;
  let thisWeekCount = 0;
  let totalTrustScore = 0;
  let trustScoreCount = 0;

  // Đếm trong 30 ngày gần nhất để tính trend
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  let recentFirstHalf = 0;
  let recentSecondHalf = 0;

  for (const report of reports) {
    // Đếm theo type
    byType[report.type]++;

    // Đếm theo severity
    bySeverity[report.severity]++;

    // Đếm theo status
    byStatus[report.status]++;
    switch (report.status) {
      case "verified":
        verified++;
        break;
      case "pending":
        pending++;
        break;
      case "resolved":
        resolved++;
        break;
      case "rejected":
        rejected++;
        break;
    }

    // Đếm theo province
    const province = report.location.province;
    if (province) {
      byProvince[province] = (byProvince[province] || 0) + 1;
    }

    // Đếm hôm nay
    const reportDate = new Date(report.createdAt);
    if (reportDate >= todayStart) {
      todayCount++;
    }

    // Đếm tuần này
    if (reportDate >= weekStart) {
      thisWeekCount++;
    }

    // Tính trust score trung bình
    if (report.verification.trustScore > 0) {
      totalTrustScore += report.verification.trustScore;
      trustScoreCount++;
    }

    // Tính trend (so sánh 2 nửa của 30 ngày gần nhất)
    if (reportDate >= thirtyDaysAgo) {
      if (reportDate >= fifteenDaysAgo) {
        recentSecondHalf++;
      } else {
        recentFirstHalf++;
      }
    }
  }

  // Tìm province có nhiều reports nhất
  let topProvince = { name: "", count: 0 };
  for (const [name, count] of Object.entries(byProvince)) {
    if (count > topProvince.count) {
      topProvince = { name, count };
    }
  }

  // Tìm type có nhiều reports nhất
  let topType: { type: DisasterType; count: number } = {
    type: "flood",
    count: 0,
  };
  for (const [type, count] of Object.entries(byType)) {
    if (count > topType.count) {
      topType = { type: type as DisasterType, count };
    }
  }

  // Xác định trend
  let recentTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (recentSecondHalf > recentFirstHalf * 1.3) {
    recentTrend = "increasing";
  } else if (recentSecondHalf < recentFirstHalf * 0.7) {
    recentTrend = "decreasing";
  }

  return {
    total: reports.length,
    verified,
    pending,
    resolved,
    rejected,
    todayCount,
    thisWeekCount,
    avgTrustScore:
      trustScoreCount > 0
        ? Math.round((totalTrustScore / trustScoreCount) * 100) / 100
        : 0,
    byType,
    byProvince,
    bySeverity,
    byStatus,
    topProvince,
    topType,
    recentTrend,
  };
}

// === FILTER & SORT ENGINE ===

/**
 * Áp dụng filters + search + sort lên danh sách reports
 * Hỗ trợ: multi-select type/severity/province/status,
 * verifiedOnly, dateRange preset, search text, sort options
 */
export function applyFilters(
  reports: CommunityReport[],
  filters: ReportFilters,
  searchQuery: string
): CommunityReport[] {
  let filtered = [...reports];

  // 1. Filter by disaster types
  if (filters.types.length > 0) {
    filtered = filtered.filter((r) => filters.types.includes(r.type));
  }

  // 2. Filter by severities
  if (filters.severities.length > 0) {
    filtered = filtered.filter((r) => filters.severities.includes(r.severity));
  }

  // 3. Filter by provinces
  if (filters.provinces.length > 0) {
    filtered = filtered.filter((r) =>
      filters.provinces.includes(r.location.province)
    );
  }

  // 4. Filter by statuses
  if (filters.statuses.length > 0) {
    filtered = filtered.filter((r) => filters.statuses.includes(r.status));
  }

  // 5. Filter verified only
  if (filters.verifiedOnly) {
    filtered = filtered.filter((r) => r.status === "verified");
  }

  // 6. Filter by date range
  if (filters.dateRange.preset !== "all") {
    const presetConfig = DATE_PRESET_CONFIG[filters.dateRange.preset];
    if (presetConfig.hours !== null) {
      const cutoff = new Date(
        Date.now() - presetConfig.hours * 60 * 60 * 1000
      );
      filtered = filtered.filter(
        (r) => new Date(r.createdAt) >= cutoff
      );
    }
  } else if (filters.dateRange.start || filters.dateRange.end) {
    // Custom date range
    const start = filters.dateRange.start
      ? new Date(filters.dateRange.start)
      : null;
    const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

    filtered = filtered.filter((r) => {
      const reportDate = new Date(r.createdAt);
      if (start && reportDate < start) return false;
      if (end && reportDate > end) return false;
      return true;
    });
  }

  // 7. Search by text query
  if (searchQuery && searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.location.province.toLowerCase().includes(query) ||
        r.location.district.toLowerCase().includes(query) ||
        r.location.address.toLowerCase().includes(query) ||
        r.reporter.name.toLowerCase().includes(query)
    );
  }

  // 8. Sort
  filtered = sortReports(filtered, filters.sortBy);

  return filtered;
}

/**
 * Sort reports theo nhiều tiêu chí
 */
function sortReports(
  reports: CommunityReport[],
  sortBy: SortOption
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
        const weightA = SEVERITY_WEIGHTS[a.severity];
        const weightB = SEVERITY_WEIGHTS[b.severity];
        if (weightB !== weightA) return weightB - weightA;
        // Nếu cùng severity, sort theo newest
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      break;

    case "mostVerified":
      sorted.sort((a, b) => {
        // Ưu tiên verified > pending > resolved > rejected
        const statusOrder: Record<ReportStatus, number> = {
          verified: 4,
          pending: 3,
          resolved: 2,
          rejected: 1,
        };
        const orderA = statusOrder[a.status];
        const orderB = statusOrder[b.status];
        if (orderB !== orderA) return orderB - orderA;
        // Nếu cùng status, sort theo trust score
        return b.verification.trustScore - a.verification.trustScore;
      });
      break;

    case "mostVotes":
      sorted.sort((a, b) => {
        const totalA =
          a.verification.upvotes + a.verification.downvotes;
        const totalB =
          b.verification.upvotes + b.verification.downvotes;
        if (totalB !== totalA) return totalB - totalA;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      break;

    case "nearest":
      // Sort theo reportNumber (gần đây nhất = số lớn nhất)
      sorted.sort((a, b) => b.reportNumber - a.reportNumber);
      break;
  }

  return sorted;
}

// === VOTE LOGIC ===

/**
 * Áp dụng vote lên verification data
 * Xử lý: upvote mới, downvote mới, đổi vote, hủy vote
 * Cập nhật trust score dựa trên VERIFICATION_CONFIG
 */
function applyVote(
  verification: CommunityReport["verification"],
  voteType: VoteType,
  userId: string
): CommunityReport["verification"] {
  const { upvotes, downvotes, voterIds, trustScore } = verification;
  const now = new Date().toISOString();

  // Kiểm tra user đã vote chưa
  const existingVoteIndex = voterIds.indexOf(userId);
  let newUpvotes = upvotes;
  let newDownvotes = downvotes;
  let newVoterIds = [...voterIds];

  if (existingVoteIndex >= 0) {
    // User đã vote trước đó → cần xem vote cũ là gì
    // Giả sử voterIds chỉ lưu userId, không lưu loại vote
    // Để đơn giản, ta sẽ toggle: nếu vote cùng loại → hủy, khác loại → đổi
    // Tuy nhiên vì voterIds không lưu loại vote, ta sẽ dùng approach khác:
    // Nếu user vote up lần nữa → không làm gì (giới hạn 1 vote)
    // Nếu user vote down → đổi vote
    // Ở đây đơn giản hóa: cho phép đổi vote
    return verification; // Đã vote rồi, không cho vote lại
  }

  // Vote mới
  if (voteType === "up") {
    newUpvotes++;
  } else {
    newDownvotes++;
  }
  newVoterIds.push(userId);

  // Tính lại trust score
  const total = newUpvotes + newDownvotes;
  let newTrustScore: number;

  if (total === 0) {
    newTrustScore = VERIFICATION_CONFIG.DEFAULT_TRUST_SCORE;
  } else {
    // Công thức: tỷ lệ upvote × weight + reporter bonus
    const upvoteRatio = newUpvotes / total;
    const baseScore = upvoteRatio;

    // Áp dụng vote weight decay (votes gần đây có trọng số cao hơn)
    // Vì không lưu thời gian vote từng vote, dùng simplified formula
    const voteWeight = Math.min(
      total / VERIFICATION_CONFIG.UPVOTE_THRESHOLD,
      1.0
    );

    // Trust score = base × weight, clamp [0, 1]
    newTrustScore = Math.max(0, Math.min(1, baseScore * voteWeight));
  }

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

  return {
    upvotes: newUpvotes,
    downvotes: newDownvotes,
    trustScore: Math.round(newTrustScore * 100) / 100,
    voterIds: newVoterIds,
    badge,
    verifiedAt:
      badge === "verified" && !verification.verifiedAt
        ? now
        : verification.verifiedAt,
    lastVoteAt: now,
  };
}

// === LOCALSTORAGE PERSISTENCE ===

/**
 * Lưu reports vào localStorage
 * Giới hạn MAX_REPORTS_IN_STORAGE, cleanup khi vượt ngưỡng
 */
function saveReportsToStorage(reports: CommunityReport[]): void {
  try {
    // Lưu trực tiếp không sanitize lại (data đã được sanitize khi nhập)
    // Tránh double HTML-encoding khi load-save lặp lại
    const toSave =
      reports.length > REPORT_CONFIG.MAX_REPORTS_IN_STORAGE
        ? reports.slice(0, REPORT_CONFIG.MAX_REPORTS_IN_STORAGE)
        : reports;

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(toSave));
  } catch (error) {
    console.warn("[ReportContext] Không thể lưu reports vào localStorage:", error);
    // Nếu storage đầy, thử cleanup và lưu lại
    try {
      cleanupStorage();
      const reduced = reports.slice(0, REPORT_CONFIG.CLEANUP_THRESHOLD);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reduced));
    } catch {
      console.error("[ReportContext] Vẫn không thể lưu sau khi cleanup");
    }
  }
}

/**
 * Đọc reports từ localStorage
 */
function loadReportsFromStorage(): CommunityReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as CommunityReport[];
  } catch (error) {
    console.warn("[ReportContext] Không thể đọc reports từ localStorage:", error);
    return [];
  }
}

/**
 * Lưu myReports (IDs) vào localStorage
 */
function saveMyReportsToStorage(reportIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MY_REPORTS, JSON.stringify(reportIds));
  } catch (error) {
    console.warn("[ReportContext] Không thể lưu myReports:", error);
  }
}

/**
 * Đọc myReports IDs từ localStorage
 */
function loadMyReportsFromStorage(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MY_REPORTS);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}

/**
 * Cleanup localStorage khi vượt ngưỡng
 * Xóa reports cũ nhất để giảm kích thước
 */
function cleanupStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!stored) return;

    const reports = JSON.parse(stored) as CommunityReport[];
    if (reports.length <= REPORT_CONFIG.CLEANUP_THRESHOLD) return;

    // Giữ lại CLEANUP_THRESHOLD reports gần nhất
    const sorted = [...reports].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const cleaned = sorted.slice(0, REPORT_CONFIG.CLEANUP_THRESHOLD);

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(cleaned));
    console.log(
      `[ReportContext] Cleanup: ${reports.length} → ${cleaned.length} reports`
    );
  } catch {
    console.error("[ReportContext] Lỗi cleanup storage");
  }
}

// === REPORT ID GENERATOR ===

/**
 * Tạo report ID unique
 * Format: rpt-{timestamp}-{random}
 */
function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `rpt-${timestamp}-${random}`;
}

// === REPORT REDUCER ===

/**
 * Reducer chính xử lý 26 action types
 * Mỗi action trả về state mới (immutable update)
 */
function reportReducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    // --- DATA ACTIONS ---

    case "SET_REPORTS": {
      const reports = action.payload;
      return {
        ...state,
        reports,
        stats: calculateStats(reports),
        isLoading: false,
        error: null,
      };
    }

    case "ADD_REPORT": {
      const newReport = action.payload;
      const updatedReports = [newReport, ...state.reports];
      // Tự động thêm vào myReports (tránh stale closure)
      const updatedMyReports = [newReport, ...state.myReports];
      return {
        ...state,
        reports: updatedReports,
        myReports: updatedMyReports,
        stats: calculateStats(updatedReports),
      };
    }

    case "UPDATE_REPORT": {
      const updated = action.payload;
      const updatedReports = state.reports.map((r) =>
        r.id === updated.id ? updated : r
      );
      // Cũng update myReports nếu có
      const updatedMyReports = state.myReports.map((r) =>
        r.id === updated.id ? updated : r
      );
      // Cũng update selectedReport nếu đang xem
      const updatedSelected =
        state.selectedReport?.id === updated.id
          ? updated
          : state.selectedReport;

      return {
        ...state,
        reports: updatedReports,
        myReports: updatedMyReports,
        selectedReport: updatedSelected,
        stats: calculateStats(updatedReports),
      };
    }

    case "DELETE_REPORT": {
      const reportId = action.payload;
      const updatedReports = state.reports.filter((r) => r.id !== reportId);
      const updatedMyReports = state.myReports.filter(
        (r) => r.id !== reportId
      );
      return {
        ...state,
        reports: updatedReports,
        myReports: updatedMyReports,
        selectedReport:
          state.selectedReport?.id === reportId
            ? null
            : state.selectedReport,
        stats: calculateStats(updatedReports),
      };
    }

    case "SELECT_REPORT": {
      return {
        ...state,
        selectedReport: action.payload,
        isDetailModalOpen: action.payload !== null,
      };
    }

    // --- FILTER ACTIONS ---

    case "SET_FILTERS": {
      const newFilters = { ...state.filters, ...action.payload };
      return {
        ...state,
        filters: newFilters,
        page: 1, // Reset page khi thay đổi filter
      };
    }

    case "RESET_FILTERS": {
      return {
        ...state,
        filters: createInitialFilters(),
        searchQuery: "",
        page: 1,
      };
    }

    case "SET_SEARCH": {
      return {
        ...state,
        searchQuery: action.payload,
        page: 1, // Reset page khi search
      };
    }

    // --- UI STATE ACTIONS ---

    case "SET_VIEW_MODE": {
      return { ...state, viewMode: action.payload };
    }

    case "TOGGLE_WIZARD": {
      return {
        ...state,
        isSubmitWizardOpen: action.payload,
        // Reset wizard state khi đóng
        wizardState: action.payload
          ? state.wizardState
          : {
              ...createInitialState().wizardState,
              data: {
                ...createInitialState().wizardState.data,
                // Giữ draft nếu có
              },
            },
      };
    }

    case "SET_WIZARD_STEP": {
      return {
        ...state,
        wizardState: {
          ...state.wizardState,
          currentStep: action.payload,
        },
      };
    }

    case "SET_WIZARD_DATA": {
      return {
        ...state,
        wizardState: {
          ...state.wizardState,
          data: { ...state.wizardState.data, ...action.payload },
          isDirty: true,
        },
      };
    }

    case "SET_WIZARD_ERRORS": {
      return {
        ...state,
        wizardState: {
          ...state.wizardState,
          errors: action.payload,
        },
      };
    }

    case "SET_WIZARD_WARNINGS": {
      return {
        ...state,
        wizardState: {
          ...state.wizardState,
          warnings: action.payload,
        },
      };
    }

    case "RESET_WIZARD": {
      return {
        ...state,
        wizardState: createInitialState().wizardState,
        isSubmitWizardOpen: false,
      };
    }

    case "SET_WIZARD_SUBMITTING": {
      return {
        ...state,
        wizardState: {
          ...state.wizardState,
          isSubmitting: action.payload,
        },
      };
    }

    case "SET_WIZARD_PROGRESS": {
      return {
        ...state,
        wizardState: {
          ...state.wizardState,
          submitProgress: action.payload,
        },
      };
    }

    case "TOGGLE_DETAIL_MODAL": {
      return {
        ...state,
        isDetailModalOpen: action.payload,
        // Clear selected report khi đóng modal
        selectedReport: action.payload ? state.selectedReport : null,
      };
    }

    case "TOGGLE_MOBILE_FILTER": {
      return { ...state, isMobileFilterOpen: action.payload };
    }

    // --- STATS ACTIONS ---

    case "SET_STATS": {
      return { ...state, stats: action.payload };
    }

    // --- PAGINATION ACTIONS ---

    case "SET_PAGE": {
      return { ...state, page: action.payload };
    }

    case "SET_LOADING": {
      return { ...state, isLoading: action.payload };
    }

    case "SET_ERROR": {
      return { ...state, error: action.payload, isLoading: false };
    }

    // --- TOAST ACTIONS ---

    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    }

    case "REMOVE_TOAST": {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    }

    // --- VOTE ACTION ---

    case "VOTE_REPORT": {
      const { reportId, voteType, userId } = action.payload;

      const updatedReports = state.reports.map((report) => {
        if (report.id !== reportId) return report;

        const newVerification = applyVote(
          report.verification,
          voteType,
          userId
        );

        return {
          ...report,
          verification: newVerification,
          updatedAt: new Date().toISOString(),
          // Nếu đạt verified badge → cập nhật status
          status:
            newVerification.badge === "verified" &&
            report.status === "pending"
              ? ("verified" as ReportStatus)
              : report.status,
        };
      });

      // Cập nhật myReports và selectedReport tương ứng
      const updatedMyReports = state.myReports.map((report) => {
        if (report.id !== reportId) return report;
        return updatedReports.find((r) => r.id === reportId) || report;
      });

      const updatedSelected =
        state.selectedReport?.id === reportId
          ? updatedReports.find((r) => r.id === reportId) || null
          : state.selectedReport;

      return {
        ...state,
        reports: updatedReports,
        myReports: updatedMyReports,
        selectedReport: updatedSelected,
        stats: calculateStats(updatedReports),
      };
    }

    // --- MY REPORTS ---

    case "SET_MY_REPORTS": {
      return { ...state, myReports: action.payload };
    }

    default:
      return state;
  }
}

// === CONTEXT ===

interface ReportContextType {
  state: ReportState;
  dispatch: React.Dispatch<ReportAction>;

  // Computed values (memoized)
  filteredReports: CommunityReport[];
  paginatedReports: CommunityReport[];

  // Helper functions
  showToast: (title: string, message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  addReport: (report: CommunityReport) => void;
  deleteReport: (id: string) => void;
  voteReport: (reportId: string, voteType: VoteType) => void;
  selectReport: (report: CommunityReport | null) => void;
  setFilters: (filters: Partial<ReportFilters>) => void;
  resetFilters: () => void;
  setSearch: (query: string) => void;
  setViewMode: (mode: "feed" | "map") => void;
  openWizard: () => void;
  closeWizard: () => void;
  toggleMobileFilter: (open: boolean) => void;
  loadMore: () => void;
  refreshReports: () => void;
  getUserId: () => string;
}

const ReportContext = createContext<ReportContextType | null>(null);

// === PROVIDER ===

interface ReportProviderProps {
  children: ReactNode;
}

export function ReportProvider({ children }: ReportProviderProps) {
  const [state, dispatch] = useReducer(reportReducer, createInitialState());

  // --- Initialize: load from localStorage + merge mock data ---
  useEffect(() => {
    const storedReports = loadReportsFromStorage();
    const storedMyReportIds = loadMyReportsFromStorage();
    const mocksInitialized = localStorage.getItem(STORAGE_KEYS.MOCKS_INITIALIZED);

    let allReports: CommunityReport[];

    if (storedReports.length > 0) {
      // Đã có dữ liệu → chỉ load, KHÔNG generate lại mock data
      // Tránh bug mock data tăng vô hạn mỗi lần refresh
      allReports = storedReports.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Nếu chưa từng generate mock → generate 1 lần duy nhất
      if (!mocksInitialized) {
        const mockReports = generateMockReports(REPORT_CONFIG.MOCK_REPORT_COUNT);
        const reportMap = new Map<string, CommunityReport>();
        for (const report of allReports) {
          reportMap.set(report.id, report);
        }
        for (const report of mockReports) {
          if (!reportMap.has(report.id)) {
            reportMap.set(report.id, report);
          }
        }
        allReports = Array.from(reportMap.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        localStorage.setItem(STORAGE_KEYS.MOCKS_INITIALIZED, "true");
      }

      // Giới hạn số lượng
      if (allReports.length > REPORT_CONFIG.MAX_REPORTS_IN_STORAGE) {
        allReports = allReports.slice(
          0,
          REPORT_CONFIG.MAX_REPORTS_IN_STORAGE
        );
      }
    } else {
      // Lần đầu → tạo mock data
      allReports = generateMockReports(REPORT_CONFIG.MOCK_REPORT_COUNT);
      localStorage.setItem(STORAGE_KEYS.MOCKS_INITIALIZED, "true");
      saveReportsToStorage(allReports);
    }

    // Load my reports
    const myReports = allReports.filter((r) =>
      storedMyReportIds.includes(r.id)
    );

    dispatch({ type: "SET_REPORTS", payload: allReports });
    dispatch({ type: "SET_MY_REPORTS", payload: myReports });
  }, []);

  // --- Auto-save reports to localStorage ---
  useEffect(() => {
    if (state.reports.length > 0) {
      saveReportsToStorage(state.reports);
    }
  }, [state.reports]);

  // --- Auto-save myReport IDs ---
  useEffect(() => {
    const myReportIds = state.myReports.map((r) => r.id);
    saveMyReportsToStorage(myReportIds);
  }, [state.myReports]);

  // --- Auto-remove toasts after duration ---
  // Dùng ref để track timer riêng cho mỗi toast, tránh reset timer cũ khi thêm toast mới
  const toastTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const currentTimers = toastTimersRef.current;

    // Tạo timer mới cho mỗi toast chưa có timer
    for (const toast of state.toasts) {
      if (!currentTimers.has(toast.id)) {
        const timer = setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", payload: toast.id });
          currentTimers.delete(toast.id);
        }, toast.duration || REPORT_CONFIG.TOAST_DURATION);
        currentTimers.set(toast.id, timer);
      }
    }

    // Cleanup timer cho toast đã bị xóa
    for (const [id, timer] of currentTimers) {
      if (!state.toasts.find((t) => t.id === id)) {
        clearTimeout(timer);
        currentTimers.delete(id);
      }
    }
  }, [state.toasts]);

  // --- Computed: filtered reports ---
  const filteredReports = useMemo(
    () => applyFilters(state.reports, state.filters, state.searchQuery),
    [state.reports, state.filters, state.searchQuery]
  );

  // --- Computed: paginated reports ---
  const paginatedReports = useMemo(() => {
    const endIndex = state.page * REPORT_CONFIG.PAGE_SIZE;
    return filteredReports.slice(0, endIndex);
  }, [filteredReports, state.page]);

  // --- Helper: show toast ---
  const showToast = useCallback(
    (title: string, message: string, type: ToastType = "info") => {
      const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        title,
        message,
        duration: REPORT_CONFIG.TOAST_DURATION,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TOAST", payload: toast });
    },
    []
  );

  // --- Helper: dismiss toast ---
  const dismissToast = useCallback((id: string) => {
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  // --- Helper: add report ---
  const addReport = useCallback(
    (report: CommunityReport) => {
      // ADD_REPORT reducer tự động cập nhật myReports
      dispatch({ type: "ADD_REPORT", payload: report });

      showToast(
        "Thành công",
        `Báo cáo #${report.reportNumber} đã được gửi`,
        "success"
      );
    },
    [showToast]
  );

  // --- Helper: delete report ---
  const deleteReport = useCallback(
    (id: string) => {
      dispatch({ type: "DELETE_REPORT", payload: id });
      showToast("Đã xóa", "Báo cáo đã được xóa", "info");
    },
    [showToast]
  );

  // --- Helper: vote report ---
  const voteReport = useCallback(
    (reportId: string, voteType: VoteType) => {
      const userId = getUserId();
      dispatch({
        type: "VOTE_REPORT",
        payload: { reportId, voteType, userId },
      });
    },
    []
  );

  // --- Helper: select report ---
  const selectReport = useCallback((report: CommunityReport | null) => {
    dispatch({ type: "SELECT_REPORT", payload: report });
  }, []);

  // --- Helper: set filters ---
  const setFilters = useCallback((filters: Partial<ReportFilters>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  // --- Helper: reset filters ---
  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  // --- Helper: set search ---
  const setSearch = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH", payload: query });
  }, []);

  // --- Helper: set view mode ---
  const setViewMode = useCallback((mode: "feed" | "map") => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  // --- Helper: open wizard ---
  const openWizard = useCallback(() => {
    dispatch({ type: "TOGGLE_WIZARD", payload: true });
  }, []);

  // --- Helper: close wizard ---
  const closeWizard = useCallback(() => {
    dispatch({ type: "TOGGLE_WIZARD", payload: false });
  }, []);

  // --- Helper: toggle mobile filter ---
  const toggleMobileFilter = useCallback((open: boolean) => {
    dispatch({ type: "TOGGLE_MOBILE_FILTER", payload: open });
  }, []);

  // --- Helper: load more (pagination) ---
  const loadMore = useCallback(() => {
    const totalPages = Math.ceil(
      filteredReports.length / REPORT_CONFIG.PAGE_SIZE
    );
    if (state.page < totalPages) {
      dispatch({ type: "SET_PAGE", payload: state.page + 1 });
    }
  }, [filteredReports.length, state.page]);

  // --- Helper: refresh reports ---
  const refreshReports = useCallback(() => {
    dispatch({ type: "SET_LOADING", payload: true });
    // Delay nhỏ để loading overlay hiển thị, sau đó re-calculate stats
    setTimeout(() => {
      dispatch({
        type: "SET_STATS",
        payload: calculateStats(state.reports),
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }, 300);
  }, [state.reports]);

  // --- Context value (memoized) ---
  const contextValue = useMemo<ReportContextType>(
    () => ({
      state,
      dispatch,
      filteredReports,
      paginatedReports,
      showToast,
      dismissToast,
      addReport,
      deleteReport,
      voteReport,
      selectReport,
      setFilters,
      resetFilters,
      setSearch,
      setViewMode,
      openWizard,
      closeWizard,
      toggleMobileFilter,
      loadMore,
      refreshReports,
      getUserId,
    }),
    [
      state,
      filteredReports,
      paginatedReports,
      showToast,
      dismissToast,
      addReport,
      deleteReport,
      voteReport,
      selectReport,
      setFilters,
      resetFilters,
      setSearch,
      setViewMode,
      openWizard,
      closeWizard,
      toggleMobileFilter,
      loadMore,
      refreshReports,
    ]
  );

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
}

// === HOOK ===

/**
 * useReport() - Hook để truy cập Report Context
 * Phải được sử dụng bên trong ReportProvider
 */
export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error(
      "useReport phải được sử dụng bên trong <ReportProvider>. " +
        "Bọc component cha bằng <ReportProvider> để sử dụng hook này."
    );
  }
  return context;
}

// === UTILITY: GET/GENERATE USER ID ===

/**
 * Lấy hoặc tạo userId từ localStorage
 * Format: user-{random}
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
    // Fallback nếu localStorage không khả dụng
    return `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

// === UTILITY: GET/SAVE USER VOTES ===

/**
 * Lấy danh sách vote của user từ localStorage
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
 * Lưu vote mới của user vào localStorage
 */
export function saveUserVote(reportId: string, voteType: VoteType): void {
  try {
    const votes = getUserVotes();
    votes[reportId] = voteType;
    localStorage.setItem(STORAGE_KEYS.USER_VOTES, JSON.stringify(votes));
  } catch (error) {
    console.warn("[ReportContext] Không thể lưu vote:", error);
  }
}
