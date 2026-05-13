"use client";

// =============================================================================
// ALERT & SOS PAGE - Main Page Assembly
// Module Cảnh Báo & SOS Thiên Tai - CứuNet (Phase 4)
//
// Layout:
//   - Header with view mode tabs + SOS button
//   - StatsBar at top
//   - Tab-based content: Dashboard, Alerts, SOS, Directory, Checklist, History
//   - Dynamic import for Leaflet-based AlertMap
//   - Toast notifications
//   - Online/offline banner
//   - Alert detail modal
//
// Architecture:
//   - AlertSOSProvider wraps entire page
//   - AlertPageContent uses useAlertSOS hook
//   - All state management via context + reducer
// =============================================================================

import { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Map,
  Filter,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Siren,
  Bell,
  Phone,
  ClipboardCheck,
  History,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import dynamic from "next/dynamic";

import {
  AlertSOSProvider,
  useAlertSOS,
} from "@/features/alert-sos/lib/alert-sos-context";
import type {
  Alert,
  AlertViewMode,
  ChecklistSeason,
} from "@/features/alert-sos/lib/types";

// UI Components
import { AlertStatsBar } from "@/features/alert-sos/ui/AlertStatsBar";
import { AlertFeed } from "@/features/alert-sos/ui/AlertFeed";
import { AlertDetailModal } from "@/features/alert-sos/ui/AlertDetailModal";
import { SOSPanel } from "@/features/alert-sos/ui/SOSPanel";
import { SOSHistoryPanel } from "@/features/alert-sos/ui/SOSHistoryPanel";
import { EmergencyDirectory } from "@/features/alert-sos/ui/EmergencyDirectory";
import { ChecklistManager } from "@/features/alert-sos/ui/ChecklistManager";

// Dynamic import AlertMap (Leaflet requires window)
const AlertMap = dynamic(
  () => import("@/features/alert-sos/ui/AlertMap"),
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

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -12,
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

// =============================================================================
// TOAST STYLES
// =============================================================================

const TOAST_STYLES: Record<
  string,
  { bg: string; border: string; icon: string; iconSymbol: string }
> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "text-green-400",
    iconSymbol: "✅",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
    iconSymbol: "❌",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    iconSymbol: "⚠️",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    iconSymbol: "ℹ️",
  },
  sos: {
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    icon: "text-red-400",
    iconSymbol: "🆘",
  },
};

// =============================================================================
// VIEW MODE TAB CONFIG
// =============================================================================

const VIEW_TABS: {
  key: AlertViewMode;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "dashboard", label: "Tổng quan", icon: <BarChart3 className="w-4 h-4" />, color: "#3B82F6" },
  { key: "feed", label: "Cảnh báo", icon: <Bell className="w-4 h-4" />, color: "#F59E0B" },
  { key: "map", label: "Bản đồ", icon: <Map className="w-4 h-4" />, color: "#22C55E" },
  { key: "sos", label: "SOS", icon: <Siren className="w-4 h-4" />, color: "#EF4444" },
  { key: "directory", label: "Danh bạ", icon: <Phone className="w-4 h-4" />, color: "#8B5CF6" },
  { key: "checklist", label: "Checklist", icon: <ClipboardCheck className="w-4 h-4" />, color: "#06B6D4" },
  { key: "history", label: "Lịch sử", icon: <History className="w-4 h-4" />, color: "#EC4899" },
];

// Default toast duration
const TOAST_DURATION = 5000;
const SOS_TOAST_DURATION = 10000;

// =============================================================================
// TOAST CONTAINER
// =============================================================================

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; title: string; message: string; type: string }[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
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
                "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl",
                style.bg,
                "border",
                style.border,
                "shadow-xl shadow-black/20 backdrop-blur-sm"
              )}
            >
              <span className="text-base shrink-0">{style.iconSymbol}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">
                  {toast.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MAIN PAGE EXPORT
// =============================================================================

export default function AlertsPage() {
  return (
    <AlertSOSProvider>
      <AlertPageContent />
    </AlertSOSProvider>
  );
}

// =============================================================================
// PAGE CONTENT (uses useAlertSOS hook)
// =============================================================================

function AlertPageContent() {
  const {
    state,
    dispatch,
    filteredAlerts,
    setAlertFilter,
    resetAlertFilters,
    setAlertSort,
    acknowledgeAlert,
    dismissAlert,
    selectAlert,
    updateSOSStatus,
    toggleSOSForm,
    setSOSFormStep,
    setDirectoryProvince,
    getDirectoryContacts,
    toggleChecklistItem,
    setChecklistProvince,
    setChecklistSeason,
    resetChecklistProgress,
    getFilteredChecklistItems,
    addToOfflineQueue,
    syncOfflineQueue,
    setViewMode,
    showToast,
    dismissToast,
    setUserLocation,
    updatePreferences,
  } = useAlertSOS();

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast({
        title: "Đã kết nối",
        message: "Kết nối mạng đã được khôi phục",
        type: "success",
        duration: TOAST_DURATION,
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast({
        title: "Mất kết nối",
        message: "Bạn đang offline. SOS sẽ được lưu và gửi khi có mạng.",
        type: "warning",
        duration: TOAST_DURATION,
      });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showToast]);

  // Get contacts from context
  const contacts = useMemo(() => getDirectoryContacts(), [getDirectoryContacts]);

  // Get filtered checklist items
  const checklistItems = useMemo(
    () => getFilteredChecklistItems(),
    [getFilteredChecklistItems]
  );

  // === ALERT HANDLERS ===

  const handleAlertClick = useCallback(
    (alert: Alert | null) => {
      selectAlert(alert);
    },
    [selectAlert]
  );

  const handleCloseAlertDetail = useCallback(() => {
    selectAlert(null);
  }, [selectAlert]);

  const handleAcknowledgeAlert = useCallback(
    (alertId: string) => {
      acknowledgeAlert(alertId);
      showToast({
        title: "Đã xác nhận",
        message: "Bạn đã xác nhận cảnh báo này",
        type: "success",
        duration: TOAST_DURATION,
      });
    },
    [acknowledgeAlert, showToast]
  );

  const handleDismissAlert = useCallback(
    (alertId: string) => {
      dismissAlert(alertId);
      showToast({
        title: "Đã bỏ qua",
        message: "Cảnh báo sẽ không hiển thị lại",
        type: "info",
        duration: TOAST_DURATION,
      });
    },
    [dismissAlert, showToast]
  );

  const handleShareAlert = useCallback(
    (alertId: string) => {
      showToast({
        title: "Đã chia sẻ",
        message: "Đã copy nội dung cảnh báo",
        type: "success",
        duration: TOAST_DURATION,
      });
    },
    [showToast]
  );

  const handleFilterChange = useCallback(
    (filters: Partial<typeof state.alertFilters>) => {
      for (const [key, value] of Object.entries(filters)) {
        setAlertFilter(
          key as keyof typeof state.alertFilters,
          value
        );
      }
    },
    [setAlertFilter]
  );

  // === SOS HANDLERS ===

  const handleSOSSubmit = useCallback(
    async (data: any) => {
      setIsSubmitting(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const sanitize = (s: string) =>
          s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;").trim();

        const sosId = `sos-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;

        const now = new Date().toISOString();
        const sosRequest = {
          id: sosId,
          userId: state.userId || "anonymous",
          location: {
            lat: data.location.lat,
            lng: data.location.lng,
            accuracy: data.location.accuracy,
            province: state.selectedProvince || undefined,
          },
          situation: {
            type: data.type,
            severity: data.severity,
            peopleCount: data.peopleCount,
            description: data.description ? sanitize(data.description) : undefined,
            hasChildren: data.hasChildren,
            hasElderly: data.hasElderly,
            hasDisabled: data.hasDisabled,
            isTrapped: data.isTrapped,
            needsMedical: data.needsMedical,
          },
          contact: {
            name: data.contact.name ? sanitize(data.contact.name) : undefined,
            phone: data.contact.phone ? sanitize(data.contact.phone) : undefined,
          },
          createdAt: now,
          isOffline: !isOnline,
          retryCount: 0,
          maxRetries: 10,
          priorityScore: 0.8,
        };

        if (isOnline) {
          dispatch({
            type: "ADD_SOS_REQUEST",
            payload: {
              ...sosRequest,
              status: "sent",
              timeline: [
                { status: "sent", timestamp: now },
              ],
              sentAt: now,
            },
          });
          showToast({
            title: "SOS đã gửi!",
            message: "Yêu cầu cứu hộ đã được gửi đi. Đang chờ phản hồi.",
            type: "sos",
            duration: SOS_TOAST_DURATION,
          });
        } else {
          dispatch({
            type: "ADD_SOS_REQUEST",
            payload: {
              ...sosRequest,
              status: "queued",
              timeline: [
                { status: "queued", timestamp: now },
              ],
            },
          });
          addToOfflineQueue({
            type: "sos",
            payload: {
              ...sosRequest,
              status: "queued",
              timeline: [
                { status: "queued", timestamp: now },
              ],
            },
            maxRetries: 10,
            nextRetryAt: new Date(Date.now() + 30000).toISOString(),
          });
          showToast({
            title: "SOS đã lưu offline",
            message: "Sẽ tự động gửi khi có kết nối mạng",
            type: "warning",
            duration: SOS_TOAST_DURATION,
          });
        }

        toggleSOSForm(false);
      } catch {
        showToast({
          title: "Lỗi",
          message: "Không thể gửi SOS. Vui lòng thử lại.",
          type: "error",
          duration: TOAST_DURATION,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isOnline, state.userId, dispatch, addToOfflineQueue, showToast, toggleSOSForm]
  );

  // === SOS HISTORY HANDLER ===

  const handleSelectSOS = useCallback(
    (sos: any) => {
      setViewMode("map");
      showToast({
        title: "Đang xem trên bản đồ",
        message: `SOS ${sos.id.substring(0, 8)}...`,
        type: "info",
        duration: TOAST_DURATION,
      });
    },
    [setViewMode, showToast]
  );

  // === STAT CLICK HANDLER ===

  const handleStatClick = useCallback(
    (stat: string) => {
      switch (stat) {
        case "totalActive":
          setViewMode("feed");
          break;
        case "extreme":
          handleFilterChange({ severities: ["extreme"] });
          setViewMode("feed");
          break;
        case "pendingSOS":
          setViewMode("sos");
          break;
        case "resolvedToday":
          setViewMode("history");
          break;
        case "checklist":
          setViewMode("checklist");
          break;
      }
    },
    [setViewMode, handleFilterChange]
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.alertFilters.severities.length > 0) count++;
    if (state.alertFilters.urgencies.length > 0) count++;
    if (state.alertFilters.categories.length > 0) count++;
    if (state.alertFilters.provinces.length > 0) count++;
    return count;
  }, [state.alertFilters]);

  // Active SOS count
  const activeSOSCount = useMemo(
    () =>
      state.sosRequests.filter((r: any) =>
        ["queued", "sent", "delivered", "acknowledged", "dispatched"].includes(r.status)
      ).length,
    [state.sosRequests]
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen"
    >
      {/* === HEADER === */}
      <AlertPageHeader
        viewMode={state.viewMode}
        onViewModeChange={setViewMode}
        isOnline={isOnline}
        activeFilterCount={activeFilterCount}
        sosCount={activeSOSCount}
      />

      {/* === STATS BAR (only in dashboard) === */}
      {state.viewMode === "dashboard" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-6 lg:px-8 pt-4"
        >
          <AlertStatsBar stats={state.stats} />
        </motion.div>
      )}

      {/* === MAIN CONTENT === */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {/* Dashboard View */}
          {state.viewMode === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Alerts */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      Cảnh báo gần đây
                    </h2>
                    <button
                      onClick={() => setViewMode("feed")}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      Xem tất cả <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <AlertFeed
                    alerts={filteredAlerts.slice(0, 5)}
                    filters={state.alertFilters}
                    sort={state.alertSort}
                    onAlertClick={handleAlertClick}
                    onFilterChange={handleFilterChange}
                    onSortChange={setAlertSort}
                    isLoading={state.isLoading}
                  />
                </div>

                {/* Map Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Map className="w-4 h-4 text-green-400" />
                      Bản đồ cảnh báo
                    </h2>
                    <button
                      onClick={() => setViewMode("map")}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      Xem đầy đủ <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-700/30">
                    <AlertMap
                      alerts={filteredAlerts}
                      sosRequests={state.sosRequests}
                      userLocation={state.userLocation}
                      selectedAlert={state.selectedAlert}
                      onAlertSelect={handleAlertClick}
                      onSOSSelect={() => {}}
                    />
                  </div>
                </div>
              </div>

              {/* SOS Quick Access */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <Siren className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        Cần cứu hộ khẩn cấp?
                      </h3>
                      <p className="text-xs text-slate-500">
                        Gửi tín hiệu SOS ngay lập tức
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setViewMode("sos")}
                    className={clsx(
                      "px-5 py-2.5 rounded-xl font-medium text-sm",
                      "bg-red-600 text-white hover:bg-red-500",
                      "shadow-lg shadow-red-500/20",
                      "transition-all duration-200"
                    )}
                  >
                    <Siren className="w-4 h-4 inline mr-1.5" />
                    Gửi SOS
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Feed View */}
          {state.viewMode === "feed" && (
            <motion.div
              key="feed"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AlertFeed
                alerts={filteredAlerts}
                filters={state.alertFilters}
                sort={state.alertSort}
                onAlertClick={handleAlertClick}
                onFilterChange={handleFilterChange}
                onSortChange={setAlertSort}
                isLoading={state.isLoading}
              />
            </motion.div>
          )}

          {/* Map View */}
          {state.viewMode === "map" && (
            <motion.div
              key="map"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AlertMap
                alerts={filteredAlerts}
                sosRequests={state.sosRequests}
                userLocation={state.userLocation}
                selectedAlert={state.selectedAlert}
                onAlertSelect={handleAlertClick}
                onSOSSelect={() => {}}
              />
            </motion.div>
          )}

          {/* SOS View */}
          {state.viewMode === "sos" && (
            <motion.div
              key="sos"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-lg mx-auto"
            >
              <SOSPanel
                onSubmit={handleSOSSubmit}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          )}

          {/* Directory View */}
          {state.viewMode === "directory" && (
            <motion.div
              key="directory"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-2xl mx-auto"
            >
              <EmergencyDirectory
                contacts={contacts}
                selectedProvince={state.selectedProvince}
                onProvinceChange={setDirectoryProvince}
              />
            </motion.div>
          )}

          {/* Checklist View */}
          {state.viewMode === "checklist" && (
            <motion.div
              key="checklist"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-2xl mx-auto"
            >
              <ChecklistManager
                items={checklistItems}
                progress={state.checklistProgress}
                province={state.checklistProvince}
                season={state.checklistSeason}
                onToggleItem={toggleChecklistItem}
                onProvinceChange={setChecklistProvince}
                onSeasonChange={(season: ChecklistSeason) =>
                  setChecklistSeason(season)
                }
                onReset={resetChecklistProgress}
              />
            </motion.div>
          )}

          {/* History View */}
          {state.viewMode === "history" && (
            <motion.div
              key="history"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-2xl mx-auto"
            >
              <SOSHistoryPanel
                sosRequests={state.sosRequests}
                onSelectSOS={handleSelectSOS}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === ALERT DETAIL MODAL === */}
      <AnimatePresence>
        {state.isAlertDetailOpen && state.selectedAlert && (
          <AlertDetailModal
            alert={state.selectedAlert}
            onClose={handleCloseAlertDetail}
            onAcknowledge={handleAcknowledgeAlert}
            onDismiss={handleDismissAlert}
            onShare={handleShareAlert}
          />
        )}
      </AnimatePresence>

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
              <span className="text-sm text-slate-300">
                Đang tải dữ liệu...
              </span>
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
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 shadow-xl backdrop-blur-sm">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-300">
                Bạn đang offline • SOS sẽ được lưu và gửi khi có mạng
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// HEADER SUB-COMPONENT
// =============================================================================

function AlertPageHeader({
  viewMode,
  onViewModeChange,
  isOnline,
  activeFilterCount,
  sosCount,
}: {
  viewMode: AlertViewMode;
  onViewModeChange: (mode: AlertViewMode) => void;
  isOnline: boolean;
  activeFilterCount: number;
  sosCount: number;
}) {
  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-700/30"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Top row: Title + actions */}
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Cảnh Báo & SOS
              </h1>
              <p className="text-[10px] text-slate-500">
                Hệ thống cảnh báo thiên tai & cứu hộ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online status */}
            <div
              className={clsx(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium",
                isOnline
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isOnline ? "Online" : "Offline"}
            </div>

            {/* SOS count badge */}
            {sosCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold"
              >
                <Siren className="w-3 h-3" />
                {sosCount} SOS
              </motion.div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 pb-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {VIEW_TABS.map((tab) => {
            const isActive = viewMode === tab.key;
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewModeChange(tab.key)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg",
                  "text-xs font-medium whitespace-nowrap",
                  "transition-all duration-200 border",
                  isActive
                    ? "border-opacity-40 shadow-sm"
                    : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${tab.color}15`,
                        borderColor: `${tab.color}40`,
                        color: tab.color,
                      }
                    : undefined
                }
              >
                {tab.icon}
                {tab.label}
                {tab.key === "sos" && sosCount > 0 && (
                  <span
                    className="text-[9px] px-1 rounded-full"
                    style={{
                      backgroundColor: `${tab.color}25`,
                      color: tab.color,
                    }}
                  >
                    {sosCount}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
