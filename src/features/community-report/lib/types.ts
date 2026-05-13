import type { DisasterType, SeverityLevel } from "@/lib/types";

// === REPORT STATUS ===

export type ReportStatus = "pending" | "verified" | "resolved" | "rejected";

export type SyncStatus = "synced" | "pending";

export type SortOption =
  | "newest"
  | "oldest"
  | "mostSevere"
  | "mostVerified"
  | "mostVotes"
  | "nearest";

export type ViewMode = "feed" | "map";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type VoteType = "up" | "down";

export type BadgeType = "verified" | "disputed";

export type ToastType = "success" | "error" | "info" | "warning";

export type DatePreset = "1h" | "6h" | "24h" | "7d" | "30d" | "all";

// === CORE REPORT ===

export interface CommunityReport {
  id: string;
  type: DisasterType;
  severity: SeverityLevel;
  status: ReportStatus;

  // Location
  location: ReportLocation;

  // Content
  title: string;
  description: string;
  photos: ReportPhoto[];

  // Reporter
  reporter: ReporterInfo;

  // Verification
  verification: VerificationData;

  // Metadata
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  isOffline: boolean;
  syncStatus: SyncStatus;
  reportNumber: number;
}

export interface ReportLocation {
  lat: number;
  lng: number;
  province: string;
  district: string;
  address: string;
  accuracy?: number;
}

export interface ReportPhoto {
  id: string;
  data: string;
  thumbnail: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  caption: string;
  uploadedAt: string;
}

export interface ReporterInfo {
  id: string;
  name: string;
  phone: string;
  isAnonymous: boolean;
  reportCount: number;
  avgTrustScore: number;
  joinedAt: string;
}

export interface VerificationData {
  upvotes: number;
  downvotes: number;
  trustScore: number;
  voterIds: string[];
  badge: BadgeType | null;
  verifiedAt?: string;
  lastVoteAt?: string;
}

// === FILTERS & SORTING ===

export interface ReportFilters {
  types: DisasterType[];
  severities: SeverityLevel[];
  provinces: string[];
  statuses: ReportStatus[];
  verifiedOnly: boolean;
  dateRange: DateRangeFilter;
  sortBy: SortOption;
}

export interface DateRangeFilter {
  preset: DatePreset;
  start: string | null;
  end: string | null;
}

// === STATS ===

export interface ReportStats {
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

export interface ReportTemplate {
  id: string;
  type: DisasterType;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  titleTemplate: string;
  descriptionTemplate: string;
  severityHint: SeverityLevel;
  tags: string[];
  usageCount: number;
}

// === WIZARD STATE ===

export interface WizardState {
  currentStep: WizardStep;
  direction: 1 | -1;
  data: WizardFormData;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  submitProgress: number;
}

export interface WizardFormData {
  type: DisasterType | null;
  location: WizardLocation;
  title: string;
  description: string;
  severity: SeverityLevel;
  photos: ReportPhoto[];
  reporter: WizardReporter;
  confirmed: boolean;
  templateId?: string;
}

export interface WizardLocation {
  lat: number | null;
  lng: number | null;
  province: string;
  district: string;
  address: string;
  useGPS: boolean;
}

export interface WizardReporter {
  isAnonymous: boolean;
  name: string;
  phone: string;
}

// === PAGINATION ===

export interface PaginatedReports {
  reports: CommunityReport[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

// === TOAST ===

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  createdAt: string;
}

// === REPORT STATE (Context) ===

export interface ReportState {
  // Data
  reports: CommunityReport[];
  myReports: CommunityReport[];
  selectedReport: CommunityReport | null;

  // Filters
  filters: ReportFilters;
  searchQuery: string;

  // UI state
  viewMode: ViewMode;
  isSubmitWizardOpen: boolean;
  wizardState: WizardState;
  isDetailModalOpen: boolean;
  isMobileFilterOpen: boolean;

  // Stats
  stats: ReportStats;

  // Pagination
  page: number;
  hasMore: boolean;

  // Toasts
  toasts: Toast[];

  // Error
  error: string | null;
  isLoading: boolean;
}

// === ACTIONS ===

export type ReportAction =
  | { type: "SET_REPORTS"; payload: CommunityReport[] }
  | { type: "ADD_REPORT"; payload: CommunityReport }
  | { type: "UPDATE_REPORT"; payload: CommunityReport }
  | { type: "DELETE_REPORT"; payload: string }
  | { type: "SELECT_REPORT"; payload: CommunityReport | null }
  | { type: "SET_FILTERS"; payload: Partial<ReportFilters> }
  | { type: "RESET_FILTERS" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "TOGGLE_WIZARD"; payload: boolean }
  | { type: "SET_WIZARD_STEP"; payload: WizardStep }
  | { type: "SET_WIZARD_DATA"; payload: Partial<WizardFormData> }
  | { type: "SET_WIZARD_ERRORS"; payload: Record<string, string> }
  | { type: "SET_WIZARD_WARNINGS"; payload: Record<string, string> }
  | { type: "RESET_WIZARD" }
  | { type: "SET_WIZARD_SUBMITTING"; payload: boolean }
  | { type: "SET_WIZARD_PROGRESS"; payload: number }
  | { type: "TOGGLE_DETAIL_MODAL"; payload: boolean }
  | { type: "TOGGLE_MOBILE_FILTER"; payload: boolean }
  | { type: "SET_STATS"; payload: ReportStats }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_TOAST"; payload: Toast }
  | { type: "REMOVE_TOAST"; payload: string }
  | {
      type: "VOTE_REPORT";
      payload: { reportId: string; voteType: VoteType; userId: string };
    }
  | { type: "SET_MY_REPORTS"; payload: CommunityReport[] };

// === COMPONENT PROPS ===

export interface ReportCardProps {
  report: CommunityReport;
  onClick?: (report: CommunityReport) => void;
  onVote?: (reportId: string, voteType: VoteType) => void;
  isCompact?: boolean;
  className?: string;
}

export interface ReportFeedProps {
  reports: CommunityReport[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReportClick?: (report: CommunityReport) => void;
  onVote?: (reportId: string, voteType: VoteType) => void;
  className?: string;
}

export interface ReportDetailModalProps {
  report: CommunityReport | null;
  isOpen: boolean;
  onClose: () => void;
  onVote?: (reportId: string, voteType: VoteType) => void;
}

export interface SubmitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WizardFormData) => Promise<void>;
}

export interface ReportMapProps {
  reports: CommunityReport[];
  onReportClick?: (report: CommunityReport) => void;
  selectedProvince?: string | null;
  className?: string;
}

export interface ReportFiltersProps {
  filters: ReportFilters;
  stats: ReportStats;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
  onReset: () => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export interface ReportStatsBarProps {
  stats: ReportStats;
  onStatClick?: (stat: string) => void;
  className?: string;
}

export interface MyReportsPanelProps {
  reports: CommunityReport[];
  stats: ReportStats;
  onReportClick?: (report: CommunityReport) => void;
  onNewReport?: () => void;
  className?: string;
}
