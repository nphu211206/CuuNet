"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type {
  Alert,
  AlertFilters,
  AlertSortOption,
  AlertViewMode,
  AlertStats,
  AlertToast,
  AlertUserPreferences,
  SOSRequest,
  SOSStatus,
  EmergencyContact,
  ChecklistItem,
  ChecklistProgress,
  ChecklistSeason,
  OfflineQueueItem,
  EscalationState,
  AlertSOSState,
  AlertSOSAction,
  AlertSeverity,
} from "./types";

import { MOCK_ALERTS, MOCK_SOS_REQUESTS, MOCK_NATIONAL_CONTACTS, MOCK_PROVINCE_CONTACTS, MOCK_CHECKLIST_ITEMS, MOCK_ALERT_STATS } from "../api/mock-data";
import {
  DEFAULT_ALERT_FILTERS,
  DEFAULT_USER_PREFERENCES,
  STORAGE_KEYS,
  ALERT_CONFIG,
  RELEVANCE_CONFIG,
  ALERT_SEVERITY_CONFIG,
  PROVINCES_WITH_REGIONS,
} from "../config/alert-config";

// =============================================================================
// ALERT & SOS CONTEXT
// React Context + useReducer pattern (consistent with community-report)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. INITIAL STATE FACTORY
// ---------------------------------------------------------------------------

function createInitialState(): AlertSOSState {
  return {
    // Alert state
    alerts: [],
    selectedAlert: null,
    alertFilters: { ...DEFAULT_ALERT_FILTERS },
    alertSort: "newest",
    isAlertDetailOpen: false,

    // SOS state
    sosRequests: [],
    selectedSOS: null,
    isSOSFormOpen: false,
    sosFormStep: 0,

    // Emergency directory
    emergencyContacts: [],
    selectedProvince: "all",

    // Checklist
    checklistItems: [],
    checklistProgress: [],
    checklistProvince: "all",
    checklistSeason: "all",

    // Offline queue
    offlineQueue: [],
    isOnline: true,
    isSyncing: false,

    // Escalation
    escalationStates: [],

    // UI state
    viewMode: "dashboard",
    isLoading: false,
    error: null,

    // Toast
    toasts: [],

    // Stats
    stats: { ...MOCK_ALERT_STATS },

    // User
    userId: "",
    userLocation: null,
    userPreferences: { ...DEFAULT_USER_PREFERENCES },
  };
}

// ---------------------------------------------------------------------------
// 2. REDUCER
// ---------------------------------------------------------------------------

function alertSOSReducer(state: AlertSOSState, action: AlertSOSAction): AlertSOSState {
  switch (action.type) {
    // === ALERT ACTIONS ===
    case "SET_ALERTS":
      return { ...state, alerts: action.payload };

    case "ADD_ALERT":
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
        stats: calculateStats([action.payload, ...state.alerts], state.sosRequests, state.checklistProgress),
      };

    case "UPDATE_ALERT": {
      const updated = state.alerts.map((a) =>
        a.id === action.payload.id ? { ...a, ...action.payload.updates, updatedAt: new Date().toISOString() } : a
      );
      return { ...state, alerts: updated };
    }

    case "REMOVE_ALERT": {
      const filtered = state.alerts.filter((a) => a.id !== action.payload);
      return {
        ...state,
        alerts: filtered,
        selectedAlert: state.selectedAlert?.id === action.payload ? null : state.selectedAlert,
        stats: calculateStats(filtered, state.sosRequests, state.checklistProgress),
      };
    }

    case "SELECT_ALERT":
      return {
        ...state,
        selectedAlert: action.payload,
        isAlertDetailOpen: action.payload !== null,
      };

    case "SET_ALERT_FILTERS":
      return {
        ...state,
        alertFilters: { ...state.alertFilters, ...action.payload },
      };

    case "RESET_ALERT_FILTERS":
      return { ...state, alertFilters: { ...DEFAULT_ALERT_FILTERS } };

    case "SET_ALERT_SORT":
      return { ...state, alertSort: action.payload };

    case "TOGGLE_ALERT_DETAIL":
      return {
        ...state,
        isAlertDetailOpen: action.payload,
        selectedAlert: action.payload ? state.selectedAlert : null,
      };

    case "ACKNOWLEDGE_ALERT": {
      const ackedAlerts = state.alerts.map((a) => {
        if (a.id !== action.payload.alertId) return a;
        return {
          ...a,
          delivery: {
            ...a.delivery,
            acknowledgedCount: a.delivery.acknowledgedCount + 1,
          },
          updatedAt: new Date().toISOString(),
        };
      });
      const ackedIds = loadFromStorage<string[]>(STORAGE_KEYS.ACKNOWLEDGED_ALERTS, []);
      saveToStorage(STORAGE_KEYS.ACKNOWLEDGED_ALERTS, [...ackedIds, action.payload.alertId]);
      return { ...state, alerts: ackedAlerts };
    }

    case "DISMISS_ALERT": {
      const dismissedIds = loadFromStorage<string[]>(STORAGE_KEYS.DISMISSED_ALERTS, []);
      saveToStorage(STORAGE_KEYS.DISMISSED_ALERTS, [...dismissedIds, action.payload.alertId]);
      return { ...state };
    }

    // === SOS ACTIONS ===
    case "SET_SOS_REQUESTS":
      return {
        ...state,
        sosRequests: action.payload,
        stats: calculateStats(state.alerts, action.payload, state.checklistProgress),
      };

    case "ADD_SOS_REQUEST": {
      const newReqs = [action.payload, ...state.sosRequests];
      return {
        ...state,
        sosRequests: newReqs,
        stats: calculateStats(state.alerts, newReqs, state.checklistProgress),
      };
    }

    case "UPDATE_SOS_STATUS": {
      const now = new Date().toISOString();
      const updatedSOS = state.sosRequests.map((s) => {
        if (s.id !== action.payload.id) return s;
        const timeline = [
          ...s.timeline,
          {
            status: action.payload.status,
            timestamp: now,
            note: action.payload.note,
          },
        ];
        const updates: Partial<SOSRequest> = {
          status: action.payload.status,
          timeline,
        };
        if (action.payload.status === "delivered") updates.deliveredAt = now;
        if (action.payload.status === "acknowledged") updates.acknowledgedAt = now;
        if (action.payload.status === "dispatched") updates.dispatchedAt = now;
        if (action.payload.status === "resolved") updates.resolvedAt = now;
        return { ...s, ...updates };
      });
      return {
        ...state,
        sosRequests: updatedSOS,
        stats: calculateStats(state.alerts, updatedSOS, state.checklistProgress),
      };
    }

    case "SELECT_SOS":
      return { ...state, selectedSOS: action.payload };

    case "TOGGLE_SOS_FORM":
      return {
        ...state,
        isSOSFormOpen: action.payload,
        sosFormStep: action.payload ? 1 : 0,
      };

    case "SET_SOS_FORM_STEP":
      return { ...state, sosFormStep: action.payload };

    // === EMERGENCY DIRECTORY ACTIONS ===
    case "SET_EMERGENCY_CONTACTS":
      return { ...state, emergencyContacts: action.payload };

    case "SET_SELECTED_PROVINCE":
      return { ...state, selectedProvince: action.payload };

    // === CHECKLIST ACTIONS ===
    case "SET_CHECKLIST_ITEMS":
      return { ...state, checklistItems: action.payload };

    case "TOGGLE_CHECKLIST_ITEM": {
      const existing = state.checklistProgress.find((p) => p.itemId === action.payload);
      let newProgress: ChecklistProgress[];
      if (existing) {
        newProgress = state.checklistProgress.map((p) =>
          p.itemId === action.payload
            ? { ...p, completed: !p.completed, completedAt: !p.completed ? new Date().toISOString() : undefined }
            : p
        );
      } else {
        newProgress = [
          ...state.checklistProgress,
          { itemId: action.payload, completed: true, completedAt: new Date().toISOString() },
        ];
      }
      saveToStorage(STORAGE_KEYS.CHECKLIST_PROGRESS, newProgress);
      return {
        ...state,
        checklistProgress: newProgress,
        stats: {
          ...state.stats,
          checklistCompletionAvg: calculateChecklistCompletion(newProgress, state.checklistItems),
        },
      };
    }

    case "SET_CHECKLIST_PROVINCE":
      saveToStorage(STORAGE_KEYS.CHECKLIST_PROVINCE, action.payload);
      return { ...state, checklistProvince: action.payload };

    case "SET_CHECKLIST_SEASON":
      return { ...state, checklistSeason: action.payload };

    case "RESET_CHECKLIST_PROGRESS":
      saveToStorage(STORAGE_KEYS.CHECKLIST_PROGRESS, []);
      return {
        ...state,
        checklistProgress: [],
        stats: { ...state.stats, checklistCompletionAvg: 0 },
      };

    // === OFFLINE QUEUE ACTIONS ===
    case "ADD_TO_OFFLINE_QUEUE": {
      const newQueue = [...state.offlineQueue, action.payload];
      saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, newQueue);
      return { ...state, offlineQueue: newQueue };
    }

    case "REMOVE_FROM_OFFLINE_QUEUE": {
      const filteredQueue = state.offlineQueue.filter((i) => i.id !== action.payload);
      saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, filteredQueue);
      return { ...state, offlineQueue: filteredQueue };
    }

    case "UPDATE_QUEUE_ITEM_STATUS": {
      const updatedQueue = state.offlineQueue.map((i) =>
        i.id === action.payload.id
          ? { ...i, status: action.payload.status, error: action.payload.error }
          : i
      );
      saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, updatedQueue);
      return { ...state, offlineQueue: updatedQueue };
    }

    case "SET_ONLINE_STATUS":
      return { ...state, isOnline: action.payload };

    case "SET_SYNCING":
      return { ...state, isSyncing: action.payload };

    case "CLEAR_SENT_QUEUE_ITEMS": {
      const pendingQueue = state.offlineQueue.filter((i) => i.status !== "sent");
      saveToStorage(STORAGE_KEYS.OFFLINE_QUEUE, pendingQueue);
      return { ...state, offlineQueue: pendingQueue };
    }

    // === ESCALATION ACTIONS ===
    case "START_ESCALATION":
      return { ...state, escalationStates: [...state.escalationStates, action.payload] };

    case "UPDATE_ESCALATION": {
      const updatedEsc = state.escalationStates.map((e) =>
        e.alertId === action.payload.alertId ? { ...e, ...action.payload.updates } : e
      );
      return { ...state, escalationStates: updatedEsc };
    }

    case "STOP_ESCALATION": {
      const remaining = state.escalationStates.filter((e) => e.alertId !== action.payload);
      return { ...state, escalationStates: remaining };
    }

    // === UI ACTIONS ===
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    // === TOAST ACTIONS ===
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.payload] };

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case "CLEAR_TOASTS":
      return { ...state, toasts: [] };

    // === STATS ===
    case "SET_STATS":
      return { ...state, stats: action.payload };

    // === USER ===
    case "SET_USER_LOCATION":
      return { ...state, userLocation: action.payload };

    case "UPDATE_USER_PREFERENCES": {
      const newPrefs = { ...state.userPreferences, ...action.payload };
      saveToStorage(STORAGE_KEYS.USER_PREFERENCES, newPrefs);
      return { ...state, userPreferences: newPrefs };
    }

    // === INITIALIZATION ===
    case "INITIALIZE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// 3. HELPER FUNCTIONS
// ---------------------------------------------------------------------------

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[CuuNet] Failed to save to localStorage: ${key}`);
  }
}

function getUserId(): string {
  let userId = loadFromStorage<string>(STORAGE_KEYS.USER_ID, "");
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    saveToStorage(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}

function calculateChecklistCompletion(progress: ChecklistProgress[], items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const completed = progress.filter((p) => p.completed).length;
  return Math.round((completed / items.length) * 100);
}

function calculateStats(alerts: Alert[], sosRequests: SOSRequest[], checklistProgress: ChecklistProgress[]): AlertStats {
  const activeAlerts = alerts.filter((a) => a.status === "actual");
  const now = new Date();
  const todayStr = now.toDateString();

  const pendingSOS = sosRequests.filter((s) =>
    ["queued", "sent", "delivered"].includes(s.status)
  ).length;

  const resolvedTodaySOS = sosRequests.filter(
    (s) => s.status === "resolved" && s.resolvedAt && new Date(s.resolvedAt).toDateString() === todayStr
  ).length;

  // Count by type
  const alertsByType: Record<string, number> = {};
  alerts.forEach((a) => {
    const type = getDisasterTypeFromEvent(a.info.event);
    alertsByType[type] = (alertsByType[type] || 0) + 1;
  });

  // Count by severity
  const alertsBySeverity: Record<string, number> = {};
  alerts.forEach((a) => {
    alertsBySeverity[a.info.severity] = (alertsBySeverity[a.info.severity] || 0) + 1;
  });

  // Count by province
  const alertsByProvince: Record<string, number> = {};
  alerts.forEach((a) => {
    a.info.area.provinces.forEach((p) => {
      alertsByProvince[p] = (alertsByProvince[p] || 0) + 1;
    });
  });

  // SOS by status
  const sosByStatus: Record<string, number> = {};
  sosRequests.forEach((s) => {
    sosByStatus[s.status] = (sosByStatus[s.status] || 0) + 1;
  });

  // SOS by type
  const sosByType: Record<string, number> = {};
  sosRequests.forEach((s) => {
    sosByType[s.situation.type] = (sosByType[s.situation.type] || 0) + 1;
  });

  // Top province
  const topProvince = Object.entries(alertsByProvince).sort((a, b) => b[1] - a[1])[0];

  // Top type
  const topType = Object.entries(alertsByType).sort((a, b) => b[1] - a[1])[0];

  // Average response time (from SOS data)
  const resolvedSOS = sosRequests.filter((s) => s.resolvedAt && s.createdAt);
  const avgResponseTime = resolvedSOS.length > 0
    ? resolvedSOS.reduce((sum, s) => {
        const created = new Date(s.createdAt).getTime();
        const resolved = new Date(s.resolvedAt!).getTime();
        return sum + (resolved - created) / 60000;
      }, 0) / resolvedSOS.length
    : 0;

  return {
    totalActive: activeAlerts.length,
    extremeCount: alertsBySeverity["extreme"] || 0,
    severeCount: alertsBySeverity["severe"] || 0,
    moderateCount: alertsBySeverity["moderate"] || 0,
    minorCount: alertsBySeverity["minor"] || 0,
    pendingSOS,
    resolvedTodaySOS,
    totalAlertsThisWeek: alerts.filter((a) => {
      const sent = new Date(a.sent);
      return now.getTime() - sent.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length,
    checklistCompletionAvg: calculateChecklistCompletion(checklistProgress, []),
    topDisasterType: (topType?.[0] || "flood") as any,
    topProvince: topProvince?.[0] || "N/A",
    alertsByType: alertsByType as any,
    alertsBySeverity: alertsBySeverity as any,
    alertsByProvince,
    sosByStatus: sosByStatus as any,
    sosByType: sosByType as any,
    recentTrend: activeAlerts.length > 10 ? "increasing" : activeAlerts.length > 5 ? "stable" : "decreasing",
    averageResponseTime: Math.round(avgResponseTime),
    onlineUserCount: Math.floor(Math.random() * 5000) + 10000,
  };
}

function getDisasterTypeFromEvent(event: string): string {
  const map: Record<string, string> = {
    "Bão": "storm",
    "Lũ": "flood",
    "Lũ lụt": "flood",
    "Ngập": "flood",
    "Triều cường": "flood",
    "Sạt lở": "landslide",
    "Hạn hán": "drought",
    "Xâm nhập mặn": "drought",
    "Động đất": "earthquake",
    "Sóng thần": "tsunami",
    "Mưa": "flood",
    "Giông": "storm",
    "Nắng nóng": "drought",
    "Áp thấp": "storm",
    "Sương mù": "other",
    "Lạnh": "other",
  };
  for (const [key, value] of Object.entries(map)) {
    if (event.includes(key)) return value;
  }
  return "other";
}

function applyAlertFilters(
  alerts: Alert[],
  filters: AlertFilters,
  sort: AlertSortOption
): Alert[] {
  let filtered = [...alerts];

  // Severity filter
  if (filters.severities.length > 0) {
    filtered = filtered.filter((a) => filters.severities.includes(a.info.severity));
  }

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter((a) => filters.categories.includes(a.info.category));
  }

  // Province filter
  if (filters.provinces.length > 0) {
    filtered = filtered.filter((a) =>
      a.info.area.provinces.some((p) => filters.provinces.includes(p))
    );
  }

  // Urgency filter
  if (filters.urgencies.length > 0) {
    filtered = filtered.filter((a) => filters.urgencies.includes(a.info.urgency));
  }

  // Sender filter
  if (filters.senderFilter.length > 0) {
    filtered = filtered.filter((a) => filters.senderFilter.includes(a.sender));
  }

  // Show expired
  if (!filters.showExpired) {
    const now = new Date();
    filtered = filtered.filter((a) => new Date(a.info.expires) > now);
  }

  // Show cancelled
  if (!filters.showCancelled) {
    filtered = filtered.filter((a) => a.msgType !== "cancel");
  }

  // Date range
  if (filters.dateRange.start) {
    filtered = filtered.filter((a) => new Date(a.sent) >= new Date(filters.dateRange.start!));
  }
  if (filters.dateRange.end) {
    filtered = filtered.filter((a) => new Date(a.sent) <= new Date(filters.dateRange.end!));
  }

  // Sort
  return sortAlerts(filtered, sort);
}

function sortAlerts(alerts: Alert[], sort: AlertSortOption): Alert[] {
  const sorted = [...alerts];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.sent).getTime() - new Date(a.sent).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.sent).getTime() - new Date(b.sent).getTime());
    case "mostSevere":
      return sorted.sort((a, b) => {
        const sevA = ALERT_SEVERITY_CONFIG[a.info.severity]?.priority || 0;
        const sevB = ALERT_SEVERITY_CONFIG[b.info.severity]?.priority || 0;
        return sevB - sevA;
      });
    case "mostUrgent": {
      const urgencyOrder = { immediate: 4, expected: 3, future: 2, past: 1 };
      return sorted.sort(
        (a, b) => (urgencyOrder[b.info.urgency] || 0) - (urgencyOrder[a.info.urgency] || 0)
      );
    }
    case "nearestExpiry":
      return sorted.sort(
        (a, b) => new Date(a.info.expires).getTime() - new Date(b.info.expires).getTime()
      );
    case "mostRelevant":
      return sorted.sort((a, b) => {
        const sevA = ALERT_SEVERITY_CONFIG[a.info.severity]?.priority || 0;
        const sevB = ALERT_SEVERITY_CONFIG[b.info.severity]?.priority || 0;
        const urgA = a.info.urgency === "immediate" ? 2 : a.info.urgency === "expected" ? 1 : 0;
        const urgB = b.info.urgency === "immediate" ? 2 : b.info.urgency === "expected" ? 1 : 0;
        return (sevB + urgB) - (sevA + urgA);
      });
    default:
      return sorted;
  }
}

// ---------------------------------------------------------------------------
// 4. CONTEXT DEFINITION
// ---------------------------------------------------------------------------

interface AlertSOSContextType {
  state: AlertSOSState;
  dispatch: React.Dispatch<AlertSOSAction>;

  // Alert helpers
  filteredAlerts: Alert[];
  setAlertFilter: (key: keyof AlertFilters, value: unknown) => void;
  resetAlertFilters: () => void;
  setAlertSort: (sort: AlertSortOption) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  selectAlert: (alert: Alert | null) => void;

  // SOS helpers
  updateSOSStatus: (id: string, status: SOSStatus, note?: string) => void;
  toggleSOSForm: (open: boolean) => void;
  setSOSFormStep: (step: number) => void;

  // Emergency directory helpers
  setDirectoryProvince: (province: string) => void;
  getDirectoryContacts: () => EmergencyContact[];

  // Checklist helpers
  toggleChecklistItem: (itemId: string) => void;
  setChecklistProvince: (province: string) => void;
  setChecklistSeason: (season: ChecklistSeason) => void;
  resetChecklistProgress: () => void;
  getFilteredChecklistItems: () => ChecklistItem[];

  // Offline queue helpers
  addToOfflineQueue: (item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status">) => void;
  syncOfflineQueue: () => Promise<void>;

  // UI helpers
  setViewMode: (mode: AlertViewMode) => void;
  showToast: (toast: Omit<AlertToast, "id" | "createdAt">) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // User helpers
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  updatePreferences: (prefs: Partial<AlertUserPreferences>) => void;
}

const AlertSOSContext = createContext<AlertSOSContextType | null>(null);

// ---------------------------------------------------------------------------
// 5. PROVIDER COMPONENT
// ---------------------------------------------------------------------------

interface AlertSOSProviderProps {
  children: ReactNode;
}

export function AlertSOSProvider({ children }: AlertSOSProviderProps) {
  const [state, dispatch] = useReducer(alertSOSReducer, null, createInitialState);
  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // === INITIALIZATION ===
  useEffect(() => {
    const userId = getUserId();
    const storedAlerts = loadFromStorage<Alert[]>(STORAGE_KEYS.ALERTS, []);
    const storedSOS = loadFromStorage<SOSRequest[]>(STORAGE_KEYS.SOS_REQUESTS, []);
    const storedChecklistProgress = loadFromStorage<ChecklistProgress[]>(STORAGE_KEYS.CHECKLIST_PROGRESS, []);
    const storedPreferences = loadFromStorage<AlertUserPreferences>(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_USER_PREFERENCES);
    const storedProvince = loadFromStorage<string>(STORAGE_KEYS.CHECKLIST_PROVINCE, "all");
    const storedQueue = loadFromStorage<OfflineQueueItem[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);

    // Merge mock data with stored data
    const alerts = storedAlerts.length > 0 ? storedAlerts : MOCK_ALERTS;
    const sosRequests = storedSOS.length > 0 ? storedSOS : MOCK_SOS_REQUESTS;

    // Build emergency contacts list
    const allContacts = [
      ...MOCK_NATIONAL_CONTACTS,
      ...Object.values(MOCK_PROVINCE_CONTACTS).flat(),
    ];

    dispatch({
      type: "INITIALIZE",
      payload: {
        alerts,
        sosRequests,
        emergencyContacts: allContacts,
        checklistItems: MOCK_CHECKLIST_ITEMS,
        checklistProgress: storedChecklistProgress,
        checklistProvince: storedProvince,
        offlineQueue: storedQueue,
        userId,
        userPreferences: storedPreferences,
        stats: calculateStats(alerts, sosRequests, storedChecklistProgress),
      },
    });
  }, []);

  // === ONLINE/OFFLINE DETECTION ===
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "SET_ONLINE_STATUS", payload: true });
      showToast({
        type: "success",
        title: "Đã kết nối mạng",
        message: "Đang đồng bộ dữ liệu...",
        duration: 3000,
      });
      // Auto-sync offline queue
      syncOfflineQueue();
    };

    const handleOffline = () => {
      dispatch({ type: "SET_ONLINE_STATUS", payload: false });
      showToast({
        type: "warning",
        title: "Mất kết nối mạng",
        message: "SOS sẽ được lưu và gửi khi có mạng lại",
        duration: 5000,
      });
    };

    if (typeof window !== "undefined") {
      dispatch({ type: "SET_ONLINE_STATUS", payload: navigator.onLine });
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // === AUTO-SAVE ALERTS ===
  useEffect(() => {
    if (state.alerts.length > 0) {
      saveToStorage(STORAGE_KEYS.ALERTS, state.alerts);
    }
  }, [state.alerts]);

  // === AUTO-SAVE SOS ===
  useEffect(() => {
    if (state.sosRequests.length > 0) {
      saveToStorage(STORAGE_KEYS.SOS_REQUESTS, state.sosRequests);
    }
  }, [state.sosRequests]);

  // === TOAST TIMER MANAGEMENT ===
  const showToast = useCallback((toast: Omit<AlertToast, "id" | "createdAt">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: AlertToast = {
      ...toast,
      id,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_TOAST", payload: newToast });

    const timer = setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
      toastTimers.current.delete(id);
    }, toast.duration || ALERT_CONFIG.TOAST_DURATION);

    toastTimers.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    toastTimers.current.forEach((timer) => clearTimeout(timer));
    toastTimers.current.clear();
    dispatch({ type: "CLEAR_TOASTS" });
  }, []);

  // === ALERT HELPERS ===
  const filteredAlerts = useMemo(
    () => applyAlertFilters(state.alerts, state.alertFilters, state.alertSort),
    [state.alerts, state.alertFilters, state.alertSort]
  );

  const setAlertFilter = useCallback((key: keyof AlertFilters, value: unknown) => {
    dispatch({ type: "SET_ALERT_FILTERS", payload: { [key]: value } });
  }, []);

  const resetAlertFilters = useCallback(() => {
    dispatch({ type: "RESET_ALERT_FILTERS" });
  }, []);

  const setAlertSort = useCallback((sort: AlertSortOption) => {
    dispatch({ type: "SET_ALERT_SORT", payload: sort });
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    dispatch({ type: "ACKNOWLEDGE_ALERT", payload: { alertId, userId: state.userId } });
    showToast({
      type: "success",
      title: "Đã xác nhận",
      message: "Bạn đã xác nhận nhận cảnh báo này",
      duration: 3000,
    });
  }, [state.userId, showToast]);

  const dismissAlert = useCallback((alertId: string) => {
    dispatch({ type: "DISMISS_ALERT", payload: { alertId, userId: state.userId } });
  }, [state.userId]);

  const selectAlert = useCallback((alert: Alert | null) => {
    dispatch({ type: "SELECT_ALERT", payload: alert });
  }, []);

  // === SOS HELPERS ===
  const updateSOSStatus = useCallback((id: string, status: SOSStatus, note?: string) => {
    dispatch({ type: "UPDATE_SOS_STATUS", payload: { id, status, note } });
  }, []);

  const toggleSOSForm = useCallback((open: boolean) => {
    dispatch({ type: "TOGGLE_SOS_FORM", payload: open });
  }, []);

  const setSOSFormStep = useCallback((step: number) => {
    dispatch({ type: "SET_SOS_FORM_STEP", payload: step });
  }, []);

  // === EMERGENCY DIRECTORY HELPERS ===
  const setDirectoryProvince = useCallback((province: string) => {
    dispatch({ type: "SET_SELECTED_PROVINCE", payload: province });
  }, []);

  const getDirectoryContacts = useCallback((): EmergencyContact[] => {
    const national = state.emergencyContacts.filter((c) => c.isNational);
    if (state.selectedProvince === "all") {
      return national;
    }
    const local = state.emergencyContacts.filter(
      (c) => !c.isNational && c.province === state.selectedProvince
    );
    return [...national, ...local];
  }, [state.emergencyContacts, state.selectedProvince]);

  // === CHECKLIST HELPERS ===
  const toggleChecklistItem = useCallback((itemId: string) => {
    dispatch({ type: "TOGGLE_CHECKLIST_ITEM", payload: itemId });
  }, []);

  const setChecklistProvince = useCallback((province: string) => {
    dispatch({ type: "SET_CHECKLIST_PROVINCE", payload: province });
  }, []);

  const setChecklistSeason = useCallback((season: ChecklistSeason) => {
    dispatch({ type: "SET_CHECKLIST_SEASON", payload: season });
  }, []);

  const resetChecklistProgress = useCallback(() => {
    dispatch({ type: "RESET_CHECKLIST_PROGRESS" });
  }, []);

  const getFilteredChecklistItems = useCallback((): ChecklistItem[] => {
    let items = [...state.checklistItems];

    // Filter by province region
    if (state.checklistProvince !== "all") {
      const regions = PROVINCES_WITH_REGIONS[state.checklistProvince] || [];
      items = items.filter(
        (item) =>
          item.regions.includes("all") ||
          item.regions.some((r) => regions.includes(r))
      );
    }

    // Filter by season
    if (state.checklistSeason !== "all") {
      items = items.filter(
        (item) => item.season === "all" || item.season === state.checklistSeason
      );
    }

    // Sort by priority
    const priorityOrder = { essential: 1, recommended: 2, optional: 3 };
    items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return items;
  }, [state.checklistItems, state.checklistProvince, state.checklistSeason]);

  // === OFFLINE QUEUE HELPERS ===
  const addToOfflineQueue = useCallback(
    (item: Omit<OfflineQueueItem, "id" | "createdAt" | "retryCount" | "status">) => {
      const queueItem: OfflineQueueItem = {
        ...item,
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: "pending",
      };
      dispatch({ type: "ADD_TO_OFFLINE_QUEUE", payload: queueItem });
    },
    []
  );

  const syncOfflineQueue = useCallback(async () => {
    if (!state.isOnline || state.isSyncing) return;

    dispatch({ type: "SET_SYNCING", payload: true });

    try {
      for (const item of state.offlineQueue) {
        if (item.status === "sent") continue;

        dispatch({
          type: "UPDATE_QUEUE_ITEM_STATUS",
          payload: { id: item.id, status: "sending" },
        });

        // Simulate sending (in real app, this would be an API call)
        await new Promise((resolve) => setTimeout(resolve, 500));

        dispatch({
          type: "UPDATE_QUEUE_ITEM_STATUS",
          payload: { id: item.id, status: "sent" },
        });
      }

      dispatch({ type: "CLEAR_SENT_QUEUE_ITEMS" });

      showToast({
        type: "success",
        title: "Đã đồng bộ",
        message: `Đã gửi ${state.offlineQueue.filter((i) => i.status !== "sent").length} mục đang chờ`,
        duration: 3000,
      });
    } catch {
      showToast({
        type: "error",
        title: "Lỗi đồng bộ",
        message: "Không thể đồng bộ. Sẽ thử lại sau.",
        duration: 5000,
      });
    } finally {
      dispatch({ type: "SET_SYNCING", payload: false });
    }
  }, [state.isOnline, state.isSyncing, state.offlineQueue, showToast]);

  // === UI HELPERS ===
  const setViewMode = useCallback((mode: AlertViewMode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  // === USER HELPERS ===
  const setUserLocation = useCallback((location: { lat: number; lng: number } | null) => {
    dispatch({ type: "SET_USER_LOCATION", payload: location });
    if (location) {
      saveToStorage(STORAGE_KEYS.USER_LOCATION, location);
    }
  }, []);

  const updatePreferences = useCallback((prefs: Partial<AlertUserPreferences>) => {
    dispatch({ type: "UPDATE_USER_PREFERENCES", payload: prefs });
  }, []);

  // === CONTEXT VALUE ===
  const contextValue = useMemo<AlertSOSContextType>(
    () => ({
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
      clearToasts,
      setUserLocation,
      updatePreferences,
    }),
    [
      state,
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
      clearToasts,
      setUserLocation,
      updatePreferences,
    ]
  );

  return (
    <AlertSOSContext.Provider value={contextValue}>
      {children}
    </AlertSOSContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// 6. USE HOOK
// ---------------------------------------------------------------------------

export function useAlertSOS(): AlertSOSContextType {
  const context = useContext(AlertSOSContext);
  if (!context) {
    throw new Error("useAlertSOS must be used within an AlertSOSProvider");
  }
  return context;
}
