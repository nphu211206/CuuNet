"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  Map,
  LayoutGrid,
  Filter,
  X,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import clsx from "clsx";
import { ReportProvider, useReport, getUserId } from "@/features/community-report/lib/report-context";
import type { WizardFormData, CommunityReport, ReportFilters as ReportFiltersType } from "@/features/community-report/lib/types";
import { ReportStatsBar } from "@/features/community-report/ui/ReportStatsBar";
import { ReportFilters } from "@/features/community-report/ui/ReportFilters";
import { ReportFeed } from "@/features/community-report/ui/ReportFeed";
import { ReportDetailModal } from "@/features/community-report/ui/ReportDetailModal";
import { SubmitWizard } from "@/features/community-report/ui/SubmitWizard";
import { MyReportsPanel } from "@/features/community-report/ui/MyReportsPanel";
import dynamic from "next/dynamic";

// Dynamic import ReportMap (Leaflet requires window)
const ReportMap = dynamic(
  () =>
    import("@/features/community-report/ui/ReportMap").then(
      (mod) => mod.ReportMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] rounded-xl bg-slate-900/60 border border-slate-700/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm text-slate-400">Đang tải bản đồ...</p>
        </div>
      </div>
    ),
  }
);

// ============================================================
// REPORT PAGE — Phase 3E: Full Assembly
// ============================================================
// Trang chính module Báo cáo Cộng đồng
// - ReportProvider: bọc toàn bộ page, cung cấp state + dispatch
// - ReportPageContent: nội dung chính (dùng useReport hook)
// - Layout: Header → StatsBar → Main (Sidebar + Feed/Map)
// - Modals: DetailModal, SubmitWizard
// - Toast notifications
// - Mobile filter drawer
// - Loading / Error states
// ============================================================

// === ANIMATION VARIANTS ===

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const mobileDrawerVariants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.2 },
  },
};

const toastVariants = {
  initial: { opacity: 0, x: 50, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// === TOAST COLORS ===

const TOAST_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "text-green-400",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
  },
};

// === MAIN PAGE COMPONENT ===

export default function ReportPage() {
  return (
    <ReportProvider>
      <ReportPageContent />
    </ReportProvider>
  );
}

// === PAGE CONTENT (uses useReport hook) ===

function ReportPageContent() {
  const {
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
  } = useReport();

  // Local state for submit handling
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle report click → open detail modal
  const handleReportClick = useCallback(
    (report: (typeof filteredReports)[0]) => {
      selectReport(report);
    },
    [selectReport]
  );

  // Handle detail modal close
  const handleCloseDetail = useCallback(() => {
    selectReport(null);
  }, [selectReport]);

  // Handle vote
  const handleVote = useCallback(
    (reportId: string, voteType: "up" | "down") => {
      voteReport(reportId, voteType);
    },
    [voteReport]
  );

  // Handle new report submit
  const handleSubmitReport = useCallback(
    async (data: WizardFormData) => {
      if (!data.type) {
        showToast("Lỗi", "Vui lòng chọn loại thiên tai", "error");
        return;
      }

      setIsSubmitting(true);

      try {
        // Simulate submission delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Sanitize input trước khi tạo report
        const sanitize = (s: string) =>
          s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;").trim();

        // Create new report from wizard data
        const newReport: CommunityReport = {
          id: `rpt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
          type: data.type,
          severity: data.severity,
          status: "pending",
          location: {
            lat: data.location.lat ?? 16.0544,
            lng: data.location.lng ?? 108.2022,
            province: sanitize(data.location.province) || "Chưa xác định",
            district: sanitize(data.location.district),
            address: sanitize(data.location.address),
          },
          title: sanitize(data.title),
          description: sanitize(data.description),
          photos: data.photos || [],
          reporter: {
            id: getUserId(),
            name: data.reporter.isAnonymous
              ? "Ẩn danh"
              : sanitize(data.reporter.name) || "Ẩn danh",
            phone: sanitize(data.reporter.phone),
            isAnonymous: data.reporter.isAnonymous,
            reportCount: 1,
            avgTrustScore: 0.5,
            joinedAt: new Date().toISOString(),
          },
          verification: {
            upvotes: 0,
            downvotes: 0,
            trustScore: 0.5,
            voterIds: [],
            badge: null,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOffline: false,
          syncStatus: "synced",
          reportNumber: Math.max(...state.reports.map((r) => r.reportNumber), 0) + 1,
        };

        addReport(newReport);
        closeWizard();
      } catch {
        showToast(
          "Lỗi",
          "Không thể gửi báo cáo. Vui lòng thử lại.",
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [addReport, closeWizard, showToast, state.reports]
  );

  // Handle stat click → filter by that stat
  const handleStatClick = useCallback(
    (stat: string) => {
      switch (stat) {
        case "verified":
          setFilters({ statuses: ["verified"] });
          break;
        case "pending":
          setFilters({ statuses: ["pending"] });
          break;
        case "today":
          setFilters({ dateRange: { preset: "24h", start: null, end: null } });
          break;
        case "topType":
          if (state.stats.topType.type) {
            setFilters({ types: [state.stats.topType.type] });
          }
          break;
        case "topProvince":
          if (state.stats.topProvince.name) {
            setFilters({ provinces: [state.stats.topProvince.name] });
          }
          break;
      }
    },
    [setFilters, state.stats]
  );

  // Online status
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen"
    >
      {/* === HEADER === */}
      <ReportHeader
        viewMode={state.viewMode}
        onViewModeChange={setViewMode}
        onNewReport={openWizard}
        onRefresh={refreshReports}
        isOnline={isOnline}
        onOpenFilter={() => toggleMobileFilter(true)}
        activeFilterCount={getActiveFilterCount(state.filters)}
      />

      {/* === STATS BAR === */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <ReportStatsBar
          stats={state.stats}
          onStatClick={handleStatClick}
        />
      </div>

      {/* === MAIN CONTENT === */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* === DESKTOP SIDEBAR === */}
          <motion.aside
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            className="hidden lg:block w-72 flex-shrink-0 space-y-4"
          >
            <ReportFilters
              filters={state.filters}
              stats={state.stats}
              onFilterChange={setFilters}
              onReset={resetFilters}
              onSearch={setSearch}
            />
            <MyReportsPanel
              reports={state.myReports}
              stats={state.stats}
              onReportClick={handleReportClick}
              onNewReport={openWizard}
            />
          </motion.aside>

          {/* === CENTER CONTENT === */}
          <div className="flex-1 min-w-0">
            {state.viewMode === "feed" ? (
              <ReportFeed
                reports={paginatedReports}
                isLoading={state.isLoading}
                hasMore={paginatedReports.length < filteredReports.length}
                onLoadMore={loadMore}
                onReportClick={handleReportClick}
                onVote={handleVote}
              />
            ) : (
              <ReportMap
                reports={filteredReports}
                onReportClick={handleReportClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* === MOBILE FILTER DRAWER === */}
      <AnimatePresence>
        {state.isMobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => toggleMobileFilter(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              variants={mobileDrawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 overflow-y-auto bg-slate-950 border-r border-slate-700/50 lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
                <h3 className="text-sm font-semibold text-slate-300">Bộ lọc</h3>
                <button
                  onClick={() => toggleMobileFilter(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <ReportFilters
                  filters={state.filters}
                  stats={state.stats}
                  onFilterChange={setFilters}
                  onReset={resetFilters}
                  onSearch={setSearch}
                />
                <MyReportsPanel
                  reports={state.myReports}
                  stats={state.stats}
                  onReportClick={(report) => {
                    handleReportClick(report);
                    toggleMobileFilter(false);
                  }}
                  onNewReport={() => {
                    openWizard();
                    toggleMobileFilter(false);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* === DETAIL MODAL === */}
      {/* Always render modal for exit animation; content guarded by isOpen + report check */}
      <ReportDetailModal
        report={state.selectedReport}
        isOpen={state.isDetailModalOpen && state.selectedReport !== null}
        onClose={handleCloseDetail}
        onVote={handleVote}
      />

      {/* === SUBMIT WIZARD === */}
      <SubmitWizard
        isOpen={state.isSubmitWizardOpen}
        onClose={closeWizard}
        onSubmit={handleSubmitReport}
      />

      {/* === TOAST NOTIFICATIONS === */}
      <ToastContainer toasts={state.toasts} onDismiss={dismissToast} />

      {/* === LOADING OVERLAY === */}
      <AnimatePresence>
        {state.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 flex items-center justify-center"
          >
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-slate-900/90 border border-slate-700/50 shadow-xl">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm text-slate-300">Đang tải dữ liệu...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === ERROR BANNER === */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 shadow-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 flex-1">{state.error}</p>
              <button
                onClick={() => refreshReports()}
                className="p-1 rounded text-red-400 hover:text-red-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === OFFLINE BANNER === */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 shadow-xl">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-300">Bạn đang offline</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Report Header: Title + view mode toggle + new report button
 */
function ReportHeader({
  viewMode,
  onViewModeChange,
  onNewReport,
  onRefresh,
  isOnline,
  onOpenFilter,
  activeFilterCount,
}: {
  viewMode: "feed" | "map";
  onViewModeChange: (mode: "feed" | "map") => void;
  onNewReport: () => void;
  onRefresh: () => void;
  isOnline: boolean;
  onOpenFilter: () => void;
  activeFilterCount: number;
}) {
  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-700/30"
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              onClick={onOpenFilter}
              className="lg:hidden relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
                <span className="gradient-text">Báo cáo Cộng đồng</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Crowd-sourced báo cáo thiên tai từ người dân
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400" />
              )}
              <span className="text-[10px] text-slate-500">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* View mode toggle */}
            <div className="flex items-center rounded-lg bg-slate-800/50 border border-slate-700/30 p-0.5">
              <button
                onClick={() => onViewModeChange("feed")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === "feed"
                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
              <button
                onClick={() => onViewModeChange("map")}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  viewMode === "map"
                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-300"
                )}
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bản đồ</span>
              </button>
            </div>

            {/* New report button */}
            <button
              onClick={onNewReport}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
                "hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-blue-500/25",
                "active:scale-95"
              )}
            >
              <span className="text-base">+</span>
              <span className="hidden sm:inline">Gửi báo cáo</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

/**
 * Toast Container: Displays toast notifications
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; type: string; title: string; message: string }[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

          return (
            <motion.div
              key={toast.id}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className={clsx(
                "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm",
                style.bg,
                style.border
              )}
            >
              {/* Icon */}
              <div className={clsx("flex-shrink-0 mt-0.5", style.icon)}>
                {toast.type === "success" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toast.type === "error" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {toast.type === "warning" && (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {toast.type === "info" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">
                  {toast.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// === UTILITY ===

function getActiveFilterCount(filters: ReportFiltersType): number {
  let count = 0;
  if (filters.types.length > 0) count++;
  if (filters.severities.length > 0) count++;
  if (filters.provinces.length > 0) count++;
  if (filters.statuses.length > 0) count++;
  if (filters.verifiedOnly) count++;
  if (filters.dateRange.preset !== "all") count++;
  return count;
}
