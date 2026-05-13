"use client";

// =============================================================================
// RESCUE PAGE - Main Page Assembly
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Layout:
//   - Header with 14 view tabs + online/offline banner
//   - RescueStatsBar at top
//   - Tab-based content: Dashboard, Operations Map, SOS, Tasks, Resources,
//     3W, Shelters, Communication, Timeline, Volunteers, Check-in,
//     Dispatch, Command, Resource Flow
//   - Dynamic import for Leaflet-based OperationsMap
//   - Toast notifications (5 styles)
//   - Mobile drawer for sidebar
//
// Architecture:
//   - RescueProvider wraps entire page
//   - RescuePageContent uses useRescue hook
//   - All state management via context + reducer
// =============================================================================

import { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Map,
  Siren,
  ClipboardList,
  Truck,
  Globe,
  Home,
  MessageSquare,
  Calendar,
  HandHeart,
  Shield,
  Target,
  ArrowRightLeft,
  Package,
  Menu,
  X,
  Wifi,
  WifiOff,
  Loader2,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import dynamic from "next/dynamic";

import { RescueProvider, useRescue } from "@/features/rescue-connect/lib/rescue-context";
import type { RescueTab, RescueToast } from "@/features/rescue-connect/lib/types";

// UI Components
import { RescueStatsBar } from "@/features/rescue-connect/ui/RescueStatsBar";
import { SOSPanel } from "@/features/rescue-connect/ui/SOSPanel";
import { TaskBoard } from "@/features/rescue-connect/ui/TaskBoard";
import { ResourceRegistry } from "@/features/rescue-connect/ui/ResourceRegistry";
import { ThreeWDashboard } from "@/features/rescue-connect/ui/ThreeWDashboard";
import { ShelterManager } from "@/features/rescue-connect/ui/ShelterManager";
import { CommunicationHub } from "@/features/rescue-connect/ui/CommunicationHub";
import { IncidentTimeline } from "@/features/rescue-connect/ui/IncidentTimeline";
import { VolunteerManager } from "@/features/rescue-connect/ui/VolunteerManager";
import { CheckInStatus } from "@/features/rescue-connect/ui/CheckInStatus";
import { DispatchAdvisor } from "@/features/rescue-connect/ui/DispatchAdvisor";
import { IncidentCommandBoard } from "@/features/rescue-connect/ui/IncidentCommandBoard";
import { ResourceFlow } from "@/features/rescue-connect/ui/ResourceFlow";

// Dynamic import OperationsMap (Leaflet requires window)
const OperationsMap = dynamic(
  () => import("@/features/rescue-connect/ui/OperationsMap").then((mod) => mod.OperationsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] rounded-xl bg-slate-900/60 border border-slate-700/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-sm text-slate-400">Đang tải bản đồ tác chiến...</p>
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

const TOAST_STYLES: Record<string, { bg: string; border: string; icon: string; iconSymbol: string }> = {
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
// TAB CONFIG
// =============================================================================

const VIEW_TABS: Array<{
  key: RescueTab;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { key: "dashboard", label: "Tổng quan", icon: <BarChart3 className="w-4 h-4" />, color: "#3B82F6" },
  { key: "operations", label: "Bản đồ", icon: <Map className="w-4 h-4" />, color: "#22C55E" },
  { key: "sos", label: "SOS", icon: <Siren className="w-4 h-4" />, color: "#EF4444" },
  { key: "tasks", label: "Nhiệm vụ", icon: <ClipboardList className="w-4 h-4" />, color: "#F59E0B" },
  { key: "resources", label: "Tài nguyên", icon: <Truck className="w-4 h-4" />, color: "#3B82F6" },
  { key: "3w", label: "3W", icon: <Globe className="w-4 h-4" />, color: "#8B5CF6" },
  { key: "shelters", label: "Nơi trú", icon: <Home className="w-4 h-4" />, color: "#06B6D4" },
  { key: "communication", label: "Liên lạc", icon: <MessageSquare className="w-4 h-4" />, color: "#EC4899" },
  { key: "timeline", label: "Timeline", icon: <Calendar className="w-4 h-4" />, color: "#F97316" },
  { key: "volunteers", label: "TNV", icon: <HandHeart className="w-4 h-4" />, color: "#8B5CF6" },
  { key: "checkin", label: "Check-in", icon: <Shield className="w-4 h-4" />, color: "#22C55E" },
  { key: "dispatch", label: "Điều phối", icon: <Target className="w-4 h-4" />, color: "#EF4444" },
  { key: "command", label: "Chỉ huy", icon: <ArrowRightLeft className="w-4 h-4" />, color: "#F59E0B" },
  { key: "flow", label: "Dòng TN", icon: <Package className="w-4 h-4" />, color: "#3B82F6" },
];

// =============================================================================
// TOAST CONTAINER
// =============================================================================

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: RescueToast[];
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
                "pointer-events-auto p-3 rounded-xl border backdrop-blur-xl shadow-lg",
                style.bg,
                style.border
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{style.iconSymbol}</span>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-xs font-semibold", style.icon)}>{toast.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{toast.message}</p>
                </div>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// PAGE HEADER
// =============================================================================

function RescuePageHeader({
  activeTab,
  onTabChange,
  isOnline,
  onToggleMobileDrawer,
}: {
  activeTab: RescueTab;
  onTabChange: (tab: RescueTab) => void;
  isOnline: boolean;
  onToggleMobileDrawer: () => void;
}) {
  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Title bar */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileDrawer}
              className="lg:hidden p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-slate-400"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                🤝 Phối hợp cứu trợ
              </h1>
              <p className="text-[10px] text-slate-500">Module 5 - Điều phối cứu hộ thiên tai</p>
            </div>
          </div>

          {/* Online status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">Trực tuyến</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] text-red-400 font-medium">Ngoại tuyến</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {VIEW_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium",
                  "transition-all duration-200 border whitespace-nowrap",
                  isActive
                    ? "border-opacity-40 text-opacity-100"
                    : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50 hover:text-slate-300"
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
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}

// =============================================================================
// DASHBOARD VIEW
// =============================================================================

function DashboardView() {
  const {
    rescueStats,
    state,
    filteredIncidents,
    dispatch: rescueDispatch,
    showToast,
  } = useRescue();

  const handleIncidentSelect = useCallback(
    (incident: (typeof state.incidents)[0] | null) => {
      rescueDispatch({ type: "SELECT_INCIDENT", payload: incident });
    },
    [rescueDispatch]
  );

  const handleSOSSelect = useCallback(
    (sos: (typeof state.sosRequests)[0] | null) => {
      rescueDispatch({ type: "SELECT_SOS", payload: sos });
    },
    [rescueDispatch]
  );

  const handleTriage = useCallback(
    (sosId: string, method: "start" | "salt" | "custom") => {
      // Handled by useSOS hook
    },
    []
  );

  const handleDispatch = useCallback(
    (sosId: string, unitId: string) => {
      // Handled by useDispatch hook
    },
    []
  );

  const handleResolve = useCallback(
    (sosId: string) => {
      // Handled by useSOS hook
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <RescueStatsBar stats={rescueStats} />

      {/* Grid: Map + SOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mini map */}
        <div className="rounded-xl overflow-hidden border border-slate-700/30" style={{ height: 350 }}>
          <OperationsMap
            incidents={state.incidents}
            sosRequests={state.sosRequests}
            resources={state.resources}
            shelters={state.shelters}
            volunteers={state.volunteers}
            organizations={state.organizations}
            selectedIncident={state.selectedIncident}
            layers={state.selectedMapLayer}
            onIncidentSelect={handleIncidentSelect}
            onSOSClick={handleSOSSelect}
            onResourceClick={() => {}}
            onShelterClick={() => {}}
          />
        </div>

        {/* SOS panel */}
        <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
          <SOSPanel
            sosRequests={state.sosRequests}
            incidents={state.incidents}
            onTriage={handleTriage}
            onDispatch={handleDispatch}
            onResolve={handleResolve}
            onSelect={handleSOSSelect}
            selectedSOS={state.selectedSOS}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE CONTENT
// =============================================================================

function RescuePageContent() {
  const {
    state,
    dispatch,
    rescueStats,
    filteredIncidents,
    showToast,
  } = useRescue();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Tab change
  const handleTabChange = useCallback(
    (tab: RescueTab) => {
      dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
    },
    [dispatch]
  );

  // Toast dismiss
  const handleToastDismiss = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    },
    [dispatch]
  );

  // Incident select
  const handleIncidentSelect = useCallback(
    (incident: (typeof state.incidents)[0] | null) => {
      dispatch({ type: "SELECT_INCIDENT", payload: incident });
    },
    [dispatch]
  );

  // SOS handlers
  const handleSOSSelect = useCallback(
    (sos: (typeof state.sosRequests)[0] | null) => {
      dispatch({ type: "SELECT_SOS", payload: sos });
    },
    [dispatch]
  );

  const handleSOSTriage = useCallback(
    (sosId: string, method: "start" | "salt" | "custom") => {
      const sos = state.sosRequests.find((s) => s.id === sosId);
      if (!sos) return;
      // Simple triage - update status
      dispatch({
        type: "UPDATE_SOS_REQUEST",
        payload: {
          ...sos,
          dispatch: { ...sos.dispatch, status: "triaged" },
          updatedAt: new Date().toISOString(),
        },
      });
      showToast({ type: "info", title: "Phân loại SOS", message: `Đã phân loại ${sosId}`, duration: 3000 });
    },
    [state.sosRequests, dispatch, showToast]
  );

  const handleSOSDispatch = useCallback(
    (sosId: string, unitId: string) => {
      const sos = state.sosRequests.find((s) => s.id === sosId);
      if (!sos) return;
      dispatch({
        type: "UPDATE_SOS_REQUEST",
        payload: {
          ...sos,
          dispatch: { ...sos.dispatch, status: "dispatched", assignedUnitId: unitId || "auto", assignedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString(),
        },
      });
      showToast({ type: "info", title: "Triển khai cứu hộ", message: `Đã triển khai cho ${sosId}`, duration: 5000 });
    },
    [state.sosRequests, dispatch, showToast]
  );

  const handleSOSResolve = useCallback(
    (sosId: string) => {
      const sos = state.sosRequests.find((s) => s.id === sosId);
      if (!sos) return;
      dispatch({
        type: "UPDATE_SOS_REQUEST",
        payload: {
          ...sos,
          dispatch: { ...sos.dispatch, status: "resolved", resolvedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString(),
        },
      });
      showToast({ type: "success", title: "Cứu hộ thành công", message: `${sosId} đã được giải quyết`, duration: 5000 });
    },
    [state.sosRequests, dispatch, showToast]
  );

  // Task handlers
  const handleTaskMove = useCallback(
    (taskId: string, newStatus: string) => {
      dispatch({ type: "MOVE_TASK", payload: { taskId, newStatus: newStatus as any } });
    },
    [dispatch]
  );

  // Resource handlers
  const handleResourceDeploy = useCallback(
    (resourceId: string, incidentId: string) => {
      dispatch({ type: "DEPLOY_RESOURCE", payload: { resourceId, incidentId } });
      showToast({ type: "info", title: "Triển khai tài nguyên", message: `Đã triển khai ${resourceId}`, duration: 3000 });
    },
    [dispatch, showToast]
  );

  const handleResourceReturn = useCallback(
    (resourceId: string) => {
      dispatch({ type: "RETURN_RESOURCE", payload: resourceId });
      showToast({ type: "success", title: "Tài nguyên trở về", message: `${resourceId} đã sẵn sàng`, duration: 3000 });
    },
    [dispatch, showToast]
  );

  // Shelter handlers
  const handleShelterCheckIn = useCallback(
    (shelterId: string, count: number) => {
      dispatch({ type: "CHECK_IN_SHELTER", payload: { shelterId, count } });
    },
    [dispatch]
  );

  const handleShelterCheckOut = useCallback(
    (shelterId: string, count: number) => {
      dispatch({ type: "CHECK_OUT_SHELTER", payload: { shelterId, count } });
    },
    [dispatch]
  );

  // Communication handlers
  const handleChannelCreate = useCallback(
    (channel: any) => {
      dispatch({ type: "ADD_CHANNEL", payload: { ...channel, id: `CH-${Date.now()}`, createdAt: new Date().toISOString() } });
    },
    [dispatch]
  );

  const handleMessageSend = useCallback(
    (message: any) => {
      dispatch({
        type: "ADD_MESSAGE",
        payload: { ...message, id: `MSG-${Date.now()}`, createdAt: new Date().toISOString() },
      });
    },
    [dispatch]
  );

  const handleBroadcast = useCallback(
    (broadcast: any) => {
      dispatch({
        type: "ADD_BROADCAST",
        payload: { ...broadcast, id: `BC-${Date.now()}`, sentAt: new Date().toISOString(), acknowledgedBy: [] },
      });
      showToast({ type: broadcast.priority === "critical" ? "sos" : "info", title: "Broadcast", message: broadcast.title, duration: 5000 });
    },
    [dispatch, showToast]
  );

  // Timeline filter
  const handleTimelineFilter = useCallback(
    (type: string) => {
      // Filter is handled within the component
    },
    []
  );

  // Volunteer handlers
  const handleVolunteerAssign = useCallback(
    (volunteerId: string, incidentId: string) => {
      dispatch({ type: "ASSIGN_VOLUNTEER", payload: { volunteerId, incidentId } });
      showToast({ type: "info", title: "Phân công TNV", message: `Đã phân công ${volunteerId}`, duration: 3000 });
    },
    [dispatch, showToast]
  );

  const handleVolunteerRelease = useCallback(
    (volunteerId: string) => {
      dispatch({ type: "RELEASE_VOLUNTEER", payload: volunteerId });
    },
    [dispatch]
  );

  // Check-in handler
  const handleCheckInAdd = useCallback(
    (checkIn: any) => {
      dispatch({
        type: "ADD_CHECK_IN",
        payload: { ...checkIn, id: `CHK-${Date.now()}`, checkedInAt: new Date().toISOString() },
      });
      showToast({
        type: checkIn.status === "safe" ? "success" : "warning",
        title: "Check-in",
        message: `${checkIn.personName}: ${checkIn.status}`,
        duration: 3000,
      });
    },
    [dispatch, showToast]
  );

  // Dispatch handlers
  const handleDispatchExecute = useCallback(
    (unitId: string, sosId: string) => {
      handleSOSDispatch(sosId, unitId);
    },
    [handleSOSDispatch]
  );

  const handleDispatchCalculate = useCallback(
    (sosId: string) => {
      showToast({ type: "info", title: "Tính toán", message: "Đang tính toán đề xuất...", duration: 2000 });
    },
    [showToast]
  );

  // Get check-in stats
  const checkInStats = useMemo(() => ({
    totalExpected: state.checkIns.reduce((sum, c) => sum + c.familyMembers + 1, 0),
    safe: state.checkIns.filter((c) => c.status === "safe").length,
    needHelp: state.checkIns.filter((c) => c.status === "need_help").length,
    missing: state.checkIns.filter((c) => c.status === "missing").length,
    evacuated: state.checkIns.filter((c) => c.status === "evacuated").length,
    hospitalized: state.checkIns.filter((c) => c.status === "hospitalized").length,
    separatedFamilies: state.checkIns.filter((c) => c.familyMembers > 0 && c.status !== "safe").length,
  }), [state.checkIns]);

  // Get first incident for command board
  const selectedIncidentForCommand = useMemo(
    () => state.selectedIncident || state.incidents.find((i) => i.status === "active") || state.incidents[0],
    [state.selectedIncident, state.incidents]
  );

  // Render tab content
  const renderTabContent = () => {
    switch (state.activeTab) {
      case "dashboard":
        return <DashboardView />;

      case "operations":
        return (
          <div className="rounded-xl overflow-hidden border border-slate-700/30" style={{ height: 600 }}>
            <OperationsMap
              incidents={state.incidents}
              sosRequests={state.sosRequests}
              resources={state.resources}
              shelters={state.shelters}
              volunteers={state.volunteers}
              organizations={state.organizations}
              selectedIncident={state.selectedIncident}
              layers={state.selectedMapLayer}
              onIncidentSelect={handleIncidentSelect}
              onSOSClick={handleSOSSelect}
              onResourceClick={() => {}}
              onShelterClick={() => {}}
            />
          </div>
        );

      case "sos":
        return (
          <SOSPanel
            sosRequests={state.sosRequests}
            incidents={state.incidents}
            onTriage={handleSOSTriage}
            onDispatch={handleSOSDispatch}
            onResolve={handleSOSResolve}
            onSelect={handleSOSSelect}
            selectedSOS={state.selectedSOS}
          />
        );

      case "tasks":
        return (
          <TaskBoard
            tasks={state.tasks}
            incidents={state.incidents}
            volunteers={state.volunteers}
            resources={state.resources}
            onTaskCreate={() => {}}
            onTaskUpdate={() => {}}
            onTaskDelete={() => {}}
            onTaskMove={handleTaskMove}
          />
        );

      case "resources":
        return (
          <ResourceRegistry
            resources={state.resources}
            incidents={state.incidents}
            onResourceAdd={() => {}}
            onResourceUpdate={() => {}}
            onResourceDeploy={handleResourceDeploy}
            onResourceReturn={handleResourceReturn}
          />
        );

      case "3w":
        return (
          <ThreeWDashboard
            entries={state.threeWEntries}
            organizations={state.organizations}
            incidents={state.incidents}
            gapAnalysis={[]}
            onOrgSelect={() => {}}
          />
        );

      case "shelters":
        return (
          <ShelterManager
            shelters={state.shelters}
            incidents={state.incidents}
            onShelterAdd={() => {}}
            onShelterUpdate={() => {}}
            onCheckIn={handleShelterCheckIn}
            onCheckOut={handleShelterCheckOut}
          />
        );

      case "communication":
        return (
          <CommunicationHub
            channels={state.channels}
            messages={state.messages}
            broadcasts={state.broadcasts}
            currentUserId="current-user"
            onChannelCreate={handleChannelCreate}
            onMessageSend={handleMessageSend}
            onBroadcast={handleBroadcast}
          />
        );

      case "timeline":
        return (
          <IncidentTimeline
            events={state.timelineEvents}
            incidents={state.incidents}
            filterType="all"
            onFilterChange={handleTimelineFilter}
          />
        );

      case "volunteers":
        return (
          <VolunteerManager
            volunteers={state.volunteers}
            incidents={state.incidents}
            tasks={state.tasks}
            onVolunteerAdd={() => {}}
            onVolunteerUpdate={() => {}}
            onVolunteerAssign={handleVolunteerAssign}
            onVolunteerRelease={handleVolunteerRelease}
          />
        );

      case "checkin":
        return (
          <CheckInStatus
            checkIns={state.checkIns}
            incidents={state.incidents}
            stats={checkInStats}
            onCheckInAdd={handleCheckInAdd}
            onCheckInUpdate={() => {}}
          />
        );

      case "dispatch":
        return (
          <DispatchAdvisor
            recommendations={[]}
            incidents={state.incidents}
            sosRequests={state.sosRequests}
            resources={state.resources}
            onDispatch={handleDispatchExecute}
            onCalculate={handleDispatchCalculate}
          />
        );

      case "command":
        return selectedIncidentForCommand ? (
          <IncidentCommandBoard
            incident={selectedIncidentForCommand}
            onCommandUpdate={() => {}}
            onTransferCommand={() => {}}
          />
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-500">
            Chọn một sự cố để xem sơ đồ chỉ huy
          </div>
        );

      case "flow":
        return state.resourceFlowData ? (
          <ResourceFlow
            flowData={state.resourceFlowData}
            incidents={state.incidents}
          />
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-500">
            Chưa có dữ liệu dòng tài nguyên
          </div>
        );

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <RescuePageHeader
        activeTab={state.activeTab}
        onTabChange={handleTabChange}
        isOnline={state.isOnline}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Main content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.activeTab}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toasts */}
      <ToastContainer toasts={state.toasts} onDismiss={handleToastDismiss} />
    </div>
  );
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function RescuePage() {
  return (
    <RescueProvider>
      <RescuePageContent />
    </RescueProvider>
  );
}
