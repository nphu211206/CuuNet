"use client";

// =============================================================================
// ALERT & SOS HOOKS - React Hooks for Alert-SOS Module
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Provides high-level React hooks that wrap the context, engines, and data:
//   - useAlerts: Alert feed, filtering, sorting, acknowledgment
//   - useSOS: SOS submission, status tracking, history
//   - useDirectory: Emergency contacts, search, quick-dial
//   - useChecklist: Checklist progress, filtering, printing
//   - useGeolocation: GPS position, watch, accuracy
//   - useOfflineQueue: Offline SOS queue, sync, retry
//   - useEscalation: Multi-channel escalation monitoring
//
// All hooks use the AlertSOSContext for state management.
// Hooks are designed to be used in any component within AlertSOSProvider.
// =============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import type {
  Alert,
  AlertFilters,
  AlertSortOption,
  AlertStats,
  AlertViewMode,
  SOSRequest,
  SOSSituation,
  SOSLocation,
  SOSContact,
  SOSStatus,
  SOSSummary,
  EmergencyContact,
  EmergencyContactType,
  ChecklistItem,
  ChecklistProgress,
  ChecklistSeason,
  UseAlertsReturn,
  UseSOSReturn,
  UseChecklistReturn,
  UseEmergencyReturn,
  UseOfflineQueueReturn,
  UseGeolocationReturn,
  OfflineQueueItem,
  EscalationState,
} from "./types";

import type { DisasterType } from "@/lib/types";

import { useAlertSOS } from "./alert-sos-context";

import {
  calculateRelevance,
  calculateBatchRelevance,
  sortSOSByPriority,
  isQuietHours,
} from "./relevance-engine";

import {
  EscalationEngine,
  buildEscalationTimeline,
  getTimeToNextEscalation,
  formatTimeToNextEscalation,
  getEscalationStatusDescription,
} from "./escalation-engine";

import {
  OfflineQueue,
  isDeviceOnline,
  getQueueStats,
} from "./offline-queue";

import {
  searchContacts,
  findNearestProvince,
  getNearbyContacts,
  callContact,
  categorizeContacts,
  getQuickSOSNumbers,
  EmergencyDirectory,
} from "./emergency-directory";

import {
  filterChecklistItems,
  calculateChecklistStats,
  getReadinessLevel,
  ChecklistManager,
  getCurrentSeason,
  getSeasonForProvince,
  getSeasonalTips,
  getChecklistCategories,
  printChecklist,
} from "./checklist-data";

import {
  ALERT_CONFIG,
  ALERT_SEVERITY_CONFIG,
  DEFAULT_ALERT_FILTERS,
} from "../config/alert-config";

// =============================================================================
// HOOK 1: useAlerts
// =============================================================================

/**
 * Hook quản lý cảnh báo.
 * Cung cấp danh sách cảnh báo, lọc, sắp xếp, xác nhận.
 */
export function useAlerts(): UseAlertsReturn {
  const { state, dispatch } = useAlertSOS();

  const filteredAlerts = useMemo(() => {
    let result = [...state.alerts];

    // Lọc theo severity
    if (state.alertFilters.severities.length > 0) {
      result = result.filter((a) =>
        state.alertFilters.severities.includes(a.info.severity)
      );
    }

    // Lọc theo type (disaster type)
    if (state.alertFilters.types.length > 0) {
      result = result.filter((a) =>
        state.alertFilters.types.includes(a.info.category as DisasterType)
      );
    }

    // Lọc theo category
    if (state.alertFilters.categories.length > 0) {
      result = result.filter((a) =>
        state.alertFilters.categories.includes(a.info.category)
      );
    }

    // Lọc theo provinces
    if (state.alertFilters.provinces.length > 0) {
      result = result.filter((a) =>
        a.info.area.provinces.some((p) =>
          state.alertFilters.provinces.includes(p)
        )
      );
    }

    // Lọc theo urgency
    if (state.alertFilters.urgencies.length > 0) {
      result = result.filter((a) =>
        state.alertFilters.urgencies.includes(a.info.urgency)
      );
    }

    // Lọc theo sender
    if (state.alertFilters.senderFilter.length > 0) {
      result = result.filter((a) =>
        state.alertFilters.senderFilter.includes(a.sender)
      );
    }

    // Lọc expired
    if (!state.alertFilters.showExpired) {
      const now = new Date();
      result = result.filter((a) => new Date(a.info.expires) > now);
    }

    // Lọc cancelled
    if (!state.alertFilters.showCancelled) {
      result = result.filter((a) => a.msgType !== "cancel");
    }

    // Sắp xếp
    switch (state.alertSort) {
      case "newest":
        result.sort((a, b) => new Date(b.sent).getTime() - new Date(a.sent).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.sent).getTime() - new Date(b.sent).getTime());
        break;
      case "mostSevere": {
        const severityOrder = { extreme: 4, severe: 3, moderate: 2, minor: 1 };
        result.sort((a, b) => severityOrder[b.info.severity] - severityOrder[a.info.severity]);
        break;
      }
      case "mostUrgent": {
        const urgencyOrder = { immediate: 4, expected: 3, future: 2, past: 1 };
        result.sort((a, b) => urgencyOrder[b.info.urgency] - urgencyOrder[a.info.urgency]);
        break;
      }
      case "nearestExpiry":
        result.sort((a, b) => new Date(a.info.expires).getTime() - new Date(b.info.expires).getTime());
        break;
      case "mostRelevant":
        if (state.userLocation) {
          const scored = calculateBatchRelevance(
            result,
            state.userLocation.lat,
            state.userLocation.lng,
            state.selectedProvince || "",
            state.userPreferences
          );
          result = scored.map((s) => s.alert);
        }
        break;
    }

    return result;
  }, [state.alerts, state.alertFilters, state.alertSort, state.userLocation, state.userPreferences]);

  const setFilter = useCallback(
    (key: keyof AlertFilters, value: unknown) => {
      dispatch({ type: "SET_ALERT_FILTERS", payload: { [key]: value } });
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_ALERT_FILTERS" });
  }, [dispatch]);

  const setSort = useCallback(
    (sort: AlertSortOption) => {
      dispatch({ type: "SET_ALERT_SORT", payload: sort });
    },
    [dispatch]
  );

  const acknowledgeAlert = useCallback(
    (alertId: string) => {
      dispatch({ type: "ACKNOWLEDGE_ALERT", payload: { alertId, userId: state.userId } });
    },
    [dispatch, state.userId]
  );

  const dismissAlert = useCallback(
    (alertId: string) => {
      dispatch({ type: "DISMISS_ALERT", payload: { alertId, userId: state.userId } });
    },
    [dispatch, state.userId]
  );

  const getAlertById = useCallback(
    (id: string) => state.alerts.find((a) => a.id === id),
    [state.alerts]
  );

  return {
    alerts: state.alerts,
    filteredAlerts,
    stats: state.stats,
    filters: state.alertFilters,
    sort: state.alertSort,
    isLoading: state.isLoading,
    error: state.error,
    setFilter,
    resetFilters,
    setSort,
    acknowledgeAlert,
    dismissAlert,
    getAlertById,
  };
}

// =============================================================================
// HOOK 2: useSOS
// =============================================================================

/**
 * Hook quản lý SOS.
 * Cung cấp gửi SOS, theo dõi trạng thái, lịch sử.
 */
export function useSOS(): UseSOSReturn {
  const { state, dispatch } = useAlertSOS();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const offlineQueue = useRef<OfflineQueue | null>(null);

  useEffect(() => {
    offlineQueue.current = new OfflineQueue();
    return () => offlineQueue.current?.destroy();
  }, []);

  const submitSOS = useCallback(
    async (data: SOSSituation & { location: SOSLocation; contact: SOSContact }): Promise<boolean> => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const now = new Date().toISOString();
        const sosRequest: SOSRequest = {
          id: `sos-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          userId: state.userId,
          location: data.location,
          situation: {
            type: data.type,
            severity: data.severity,
            peopleCount: data.peopleCount,
            description: data.description,
            hasChildren: data.hasChildren,
            hasElderly: data.hasElderly,
            hasDisabled: data.hasDisabled,
            isTrapped: data.isTrapped,
            needsMedical: data.needsMedical,
          },
          contact: data.contact,
          status: "queued",
          timeline: [
            {
              status: "queued",
              timestamp: now,
              note: "SOS created",
            },
          ],
          createdAt: now,
          isOffline: !isDeviceOnline(),
          retryCount: 0,
          maxRetries: ALERT_CONFIG.MAX_RETRY_COUNT,
          priorityScore: 0,
        };

        // Nếu offline → thêm vào queue
        if (!isDeviceOnline()) {
          await offlineQueue.current?.addSOS(sosRequest);
          sosRequest.status = "queued";
        } else {
          // Mô phỏng gửi online
          await new Promise((resolve) => setTimeout(resolve, 1000));
          sosRequest.status = "sent";
          sosRequest.sentAt = new Date().toISOString();
        }

        dispatch({ type: "ADD_SOS_REQUEST", payload: sosRequest });
        setIsSubmitting(false);
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Không thể gửi SOS";
        setSubmitError(errorMsg);
        setIsSubmitting(false);
        return false;
      }
    },
    [dispatch, state.userId]
  );

  const updateStatus = useCallback(
    (id: string, status: SOSStatus, note?: string) => {
      dispatch({ type: "UPDATE_SOS_STATUS", payload: { id, status, note } });
    },
    [dispatch]
  );

  const getSOSSummary = useCallback((): SOSSummary[] => {
    return state.sosRequests.map((sos) => ({
      id: sos.id,
      type: sos.situation.type,
      severity: sos.situation.severity,
      status: sos.status,
      province: sos.location.province || "Không xác định",
      peopleCount: sos.situation.peopleCount,
      createdAt: sos.createdAt,
      isOffline: sos.isOffline,
      priorityScore: sos.priorityScore,
    }));
  }, [state.sosRequests]);

  const pendingCount = useMemo(
    () => state.sosRequests.filter((s) => ["queued", "sent", "delivered"].includes(s.status)).length,
    [state.sosRequests]
  );

  const resolvedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return state.sosRequests.filter(
      (s) => s.status === "resolved" && s.resolvedAt && new Date(s.resolvedAt).toDateString() === today
    ).length;
  }, [state.sosRequests]);

  return {
    sosRequests: state.sosRequests,
    pendingCount,
    resolvedTodayCount,
    isSubmitting,
    submitError,
    submitSOS,
    updateStatus,
    getSOSSummary,
  };
}

// =============================================================================
// HOOK 3: useDirectory
// =============================================================================

/**
 * Hook quản lý danh bạ khẩn cấp.
 */
export function useEmergencyDirectory(): UseEmergencyReturn {
  const { state, dispatch } = useAlertSOS();

  const nationalContacts = useMemo(
    () => state.emergencyContacts.filter((c) => c.isNational),
    [state.emergencyContacts]
  );

  const localContacts = useMemo(
    () => state.emergencyContacts.filter((c) => !c.isNational),
    [state.emergencyContacts]
  );

  const setProvince = useCallback(
    (province: string) => {
      dispatch({ type: "SET_SELECTED_PROVINCE", payload: province });
    },
    [dispatch]
  );

  const callContactHandler = useCallback((number: string) => {
    callContact(number);
  }, []);

  const searchContactsHandler = useCallback(
    (query: string): EmergencyContact[] => {
      return searchContacts(query, state.selectedProvince);
    },
    [state.selectedProvince]
  );

  return {
    contacts: state.emergencyContacts,
    nationalContacts,
    localContacts,
    selectedProvince: state.selectedProvince,
    setProvince,
    callContact: callContactHandler,
    searchContacts: searchContactsHandler,
  };
}

// =============================================================================
// HOOK 4: useChecklist
// =============================================================================

/**
 * Hook quản lý checklist chuẩn bị thiên tai.
 */
export function useChecklist(): UseChecklistReturn {
  const { state, dispatch } = useAlertSOS();

  const filteredItems = useMemo(
    () =>
      filterChecklistItems({
        season: state.checklistSeason,
        province: state.checklistProvince || undefined,
      }),
    [state.checklistSeason, state.checklistProvince]
  );

  const stats = useMemo(
    () => calculateChecklistStats(filteredItems, state.checklistProgress),
    [filteredItems, state.checklistProgress]
  );

  const toggleItem = useCallback(
    (itemId: string) => {
      dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: itemId });
    },
    [dispatch]
  );

  const setProvince = useCallback(
    (province: string) => {
      dispatch({ type: "SET_CHECKLIST_PROVINCE", payload: province });
    },
    [dispatch]
  );

  const setSeason = useCallback(
    (season: ChecklistSeason) => {
      dispatch({ type: "SET_CHECKLIST_SEASON", payload: season });
    },
    [dispatch]
  );

  const resetProgress = useCallback(() => {
    dispatch({ type: "RESET_CHECKLIST_PROGRESS" });
  }, [dispatch]);

  const printableHTML = useMemo(
    () => {
      const htmlParts: string[] = [];
      htmlParts.push("<h1>Checklist Chuẩn Bị Thiên Tai - CứuNet</h1>");
      htmlParts.push(`<p>Tỉnh: ${state.checklistProvince || "Toàn quốc"}</p>`);
      htmlParts.push(`<p>Hoàn thành: ${stats.completionPercentage}%</p>`);
      htmlParts.push("<ul>");
      for (const item of filteredItems) {
        const completed = state.checklistProgress.some(
          (p) => p.itemId === item.id && p.completed
        );
        htmlParts.push(`<li>${completed ? "☑" : "☐"} ${item.icon} ${item.title}</li>`);
      }
      htmlParts.push("</ul>");
      return htmlParts.join("\n");
    },
    [filteredItems, state.checklistProgress, state.checklistProvince, stats.completionPercentage]
  );

  return {
    items: state.checklistItems,
    progress: state.checklistProgress,
    completionPercentage: stats.completionPercentage,
    filteredItems,
    toggleItem,
    setProvince,
    setSeason,
    resetProgress,
    printableHTML,
  };
}

// =============================================================================
// HOOK 5: useGeolocation
// =============================================================================

/**
 * Hook lấy vị trí GPS của người dùng.
 * Hỗ trợ watch position và accuracy tracking.
 */
export function useGeolocation(): UseGeolocationReturn {
  const { dispatch } = useAlertSOS();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const getCurrentPosition = useCallback(async (): Promise<void> => {
    if (!("geolocation" in navigator)) {
      setError("Trình duyệt không hỗ trợ GPS");
      return;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);
          setAccuracy(pos.coords.accuracy);
          dispatch({ type: "SET_USER_LOCATION", payload: newPos });
          setIsLoading(false);
          resolve();
        },
        (err) => {
          let errorMsg = "Không thể lấy vị trí";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = "Bạn đã từ chối quyền truy cập vị trí";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = "Không thể xác định vị trí";
              break;
            case err.TIMEOUT:
              errorMsg = "Hết thời gian chờ lấy vị trí";
              break;
          }
          setError(errorMsg);
          setIsLoading(false);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: ALERT_CONFIG.GPS_TIMEOUT,
          maximumAge: ALERT_CONFIG.GPS_MAX_AGE,
        }
      );
    });
  }, [dispatch]);

  const watchPosition = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Trình duyệt không hỗ trợ GPS");
      return;
    }

    if (watchIdRef.current !== null) return; // Already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(newPos);
        setAccuracy(pos.coords.accuracy);
        dispatch({ type: "SET_USER_LOCATION", payload: newPos });
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: ALERT_CONFIG.GPS_TIMEOUT,
        maximumAge: ALERT_CONFIG.GPS_MAX_AGE,
      }
    );
  }, [dispatch]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    accuracy,
    isLoading,
    error,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
}

// =============================================================================
// HOOK 6: useOfflineQueue
// =============================================================================

/**
 * Hook quản lý hàng đợi offline.
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(isDeviceOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const offlineQueueRef = useRef<OfflineQueue | null>(null);

  useEffect(() => {
    offlineQueueRef.current = new OfflineQueue();

    // Listen for state changes
    const unsub = offlineQueueRef.current.onStateChange((state) => {
      setQueue(state.items);
      setIsOnline(state.isOnline);
      setIsSyncing(state.isSyncing);
    });

    // Start auto sync
    offlineQueueRef.current.startAutoSync();

    // Load initial state
    getQueueStats().then((stats) => {
      setQueue([]); // Will be populated by state change listener
    });

    return () => {
      unsub();
      offlineQueueRef.current?.destroy();
    };
  }, []);

  const addToQueue = useCallback(
    (item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status">) => {
      const fullItem: OfflineQueueItem = {
        ...item,
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: "pending",
      };
      offlineQueueRef.current?.addSOS(fullItem.payload as any);
    },
    []
  );

  const syncQueue = useCallback(async () => {
    setIsSyncing(true);
    try {
      await offlineQueueRef.current?.sync();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineQueueRef.current?.clearAll();
  }, []);

  const retryFailed = useCallback(async () => {
    await offlineQueueRef.current?.retryFailed();
  }, []);

  const pendingCount = useMemo(
    () => queue.filter((i) => i.status === "pending").length,
    [queue]
  );

  const failedCount = useMemo(
    () => queue.filter((i) => i.status === "failed").length,
    [queue]
  );

  return {
    queue,
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    addToQueue,
    syncQueue,
    clearQueue,
    retryFailed,
  };
}

// =============================================================================
// HOOK 7: useEscalation
// =============================================================================

/** Return type for useEscalation */
interface UseEscalationReturn {
  escalationStates: EscalationState[];
  startEscalation: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  getTimeToNext: (alertId: string) => number;
  formatTimeToNext: (alertId: string) => string;
  getStatusDescription: (alertId: string) => string;
  needsEscalation: (alertId: string) => boolean;
  getCurrentLevel: (alertId: string) => number;
}

/**
 * Hook theo dõi trạng thái leo thang đa kênh.
 */
export function useEscalation(): UseEscalationReturn {
  const [states, setStates] = useState<EscalationState[]>([]);
  const engineRef = useRef<EscalationEngine | null>(null);

  useEffect(() => {
    engineRef.current = new EscalationEngine();

    const unsub = engineRef.current.onStateChange((newStates) => {
      setStates([...newStates]);
    });

    engineRef.current.startPeriodicCheck();

    // Load initial states
    setStates(engineRef.current.getAllStates());

    return () => {
      unsub();
      engineRef.current?.destroy();
    };
  }, []);

  const startEscalation = useCallback((alert: Alert) => {
    engineRef.current?.startEscalation(alert);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    engineRef.current?.acknowledge(alertId);
  }, []);

  const getTimeToNext = useCallback((alertId: string): number => {
    const state = engineRef.current?.getState(alertId);
    if (!state) return -1;
    return getTimeToNextEscalation(state);
  }, []);

  const formatTimeToNext = useCallback((alertId: string): string => {
    const seconds = getTimeToNext(alertId);
    return formatTimeToNextEscalation(seconds);
  }, [getTimeToNext]);

  const getStatusDescription = useCallback((alertId: string): string => {
    const state = engineRef.current?.getState(alertId);
    if (!state) return "Chưa bắt đầu";
    return getEscalationStatusDescription(state);
  }, []);

  const needsEscalationCheck = useCallback((alertId: string): boolean => {
    const state = engineRef.current?.getState(alertId);
    if (!state) return false;
    return !state.isComplete && state.currentLevel < state.steps.length;
  }, []);

  const getCurrentLevel = useCallback((alertId: string): number => {
    return engineRef.current?.getState(alertId)?.currentLevel || 0;
  }, []);

  return {
    escalationStates: states,
    startEscalation,
    acknowledgeAlert,
    getTimeToNext,
    formatTimeToNext,
    getStatusDescription,
    needsEscalation: needsEscalationCheck,
    getCurrentLevel,
  };
}

// =============================================================================
// HOOK 8: useAlertStats
// =============================================================================

/** Return type for useAlertStats */
interface UseAlertStatsReturn {
  stats: AlertStats;
  topDisasterType: DisasterType;
  topProvince: string;
  trend: "increasing" | "stable" | "decreasing";
  severityDistribution: Array<{ severity: string; count: number; color: string }>;
  typeDistribution: Array<{ type: string; count: number }>;
}

/**
 * Hook thống kê cảnh báo.
 */
export function useAlertStats(): UseAlertStatsReturn {
  const { state } = useAlertSOS();

  const severityDistribution = useMemo(() => {
    const dist = [
      { severity: "extreme", count: state.stats.extremeCount, color: "#DC2626" },
      { severity: "severe", count: state.stats.severeCount, color: "#EA580C" },
      { severity: "moderate", count: state.stats.moderateCount, color: "#CA8A04" },
      { severity: "minor", count: state.stats.minorCount, color: "#16A34A" },
    ];
    return dist;
  }, [state.stats]);

  const typeDistribution = useMemo(() => {
    return Object.entries(state.stats.alertsByType)
      .map(([type, count]) => ({ type, count }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [state.stats.alertsByType]);

  return {
    stats: state.stats,
    topDisasterType: state.stats.topDisasterType,
    topProvince: state.stats.topProvince,
    trend: state.stats.recentTrend,
    severityDistribution,
    typeDistribution,
  };
}

// =============================================================================
// HOOK 9: useViewMode
// =============================================================================

/** Return type for useViewMode */
interface UseViewModeReturn {
  viewMode: AlertViewMode;
  setViewMode: (mode: AlertViewMode) => void;
  isDashboard: boolean;
  isFeed: boolean;
  isMap: boolean;
  isSOS: boolean;
  isDirectory: boolean;
  isChecklist: boolean;
  isHistory: boolean;
}

/**
 * Hook quản lý chế độ xem.
 */
export function useViewMode(): UseViewModeReturn {
  const { state, dispatch } = useAlertSOS();

  const setViewMode = useCallback(
    (mode: AlertViewMode) => {
      dispatch({ type: "SET_VIEW_MODE", payload: mode });
    },
    [dispatch]
  );

  return {
    viewMode: state.viewMode,
    setViewMode,
    isDashboard: state.viewMode === "dashboard",
    isFeed: state.viewMode === "feed",
    isMap: state.viewMode === "map",
    isSOS: state.viewMode === "sos",
    isDirectory: state.viewMode === "directory",
    isChecklist: state.viewMode === "checklist",
    isHistory: state.viewMode === "history",
  };
}

// =============================================================================
// HOOK 10: useQuietHours
// =============================================================================

/** Return type for useQuietHours */
interface UseQuietHoursReturn {
  isQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  canShowAlert: (severity: AlertSeverity) => boolean;
  setQuietHours: (start: string, end: string) => void;
}

import type { AlertSeverity } from "./types";

/**
 * Hook quản lý giờ yên lặng.
 */
export function useQuietHours(): UseQuietHoursReturn {
  const { state, dispatch } = useAlertSOS();

  const isCurrentlyQuietHours = useMemo(() => {
    return isQuietHours(state.userPreferences.quietHoursStart, state.userPreferences.quietHoursEnd);
  }, [state.userPreferences.quietHoursStart, state.userPreferences.quietHoursEnd]);

  const canShowAlert = useCallback(
    (severity: AlertSeverity): boolean => {
      if (!isCurrentlyQuietHours) return true;
      // Extreme và severe luôn hiển thị
      return severity === "extreme" || severity === "severe";
    },
    [isCurrentlyQuietHours]
  );

  const setQuietHours = useCallback(
    (start: string, end: string) => {
      dispatch({
        type: "UPDATE_USER_PREFERENCES",
        payload: { quietHoursStart: start, quietHoursEnd: end },
      });
    },
    [dispatch]
  );

  return {
    isQuietHours: isCurrentlyQuietHours,
    quietHoursStart: state.userPreferences.quietHoursStart,
    quietHoursEnd: state.userPreferences.quietHoursEnd,
    canShowAlert,
    setQuietHours,
  };
}
