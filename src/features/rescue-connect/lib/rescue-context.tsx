"use client";

// =============================================================================
// RESCUE COORDINATION CONTEXT
// React Context + useReducer pattern (consistent with alert-sos & community-report)
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
// =============================================================================

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
  RescueState,
  RescueAction,
  RescueContextType,
  RescueTab,
  RescueToast,
  Incident,
  IncidentFilter,
  RescueSOSRequest,
  RescueTask,
  RescueResource,
  Volunteer,
  Shelter,
  Organization,
  ThreeWEntry,
  CommChannel,
  CommMessage,
  Broadcast,
  TimelineEvent,
  CheckIn,
  CheckInStats,
  DispatchResult,
  ResourceFlowData,
  MapLayerConfig,
} from "./types";

import {
  MOCK_INCIDENTS,
  MOCK_SOS_REQUESTS,
  MOCK_TASKS,
  MOCK_RESOURCES,
  MOCK_VOLUNTEERS,
  MOCK_SHELTERS,
  MOCK_ORGANIZATIONS,
  MOCK_3W_ENTRIES,
  MOCK_CHANNELS,
  MOCK_MESSAGES,
  MOCK_BROADCASTS,
  MOCK_TIMELINE_EVENTS,
  MOCK_CHECK_INS,
  MOCK_DISPATCH_RESULTS,
  MOCK_RESOURCE_FLOW,
} from "../api/mock-data";

import {
  RESCUE_STORAGE_KEYS,
  RESCUE_CONFIG,
  DEFAULT_INCIDENT_FILTER,
  DEFAULT_MAP_LAYERS,
} from "../config/rescue-config";

// =============================================================================
// HELPER FUNCTIONS (outside component)
// =============================================================================

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

let toastIdCounter = 0;
function nextToastId(): string {
  toastIdCounter++;
  return `toast-${Date.now()}-${toastIdCounter}`;
}

// =============================================================================
// 1. INITIAL STATE FACTORY
// =============================================================================

function createInitialState(): RescueState {
  return {
    // Incidents
    incidents: [],
    selectedIncident: null,
    incidentFilter: { ...DEFAULT_INCIDENT_FILTER },

    // SOS
    sosRequests: [],
    selectedSOS: null,

    // Tasks
    tasks: [],

    // Resources
    resources: [],

    // Volunteers
    volunteers: [],

    // Shelters
    shelters: [],

    // 3W
    organizations: [],
    threeWEntries: [],

    // Communication
    channels: [],
    messages: [],
    broadcasts: [],

    // Timeline
    timelineEvents: [],

    // Check-in
    checkIns: [],

    // Dispatch
    dispatchResults: [],

    // Resource Flow
    resourceFlowData: null,

    // UI State
    activeTab: "dashboard",
    isMobileDrawerOpen: false,
    selectedMapLayer: [...DEFAULT_MAP_LAYERS],
    isOnline: true,

    // Toast
    toasts: [],
  };
}

// =============================================================================
// 2. STATS CALCULATOR
// =============================================================================

function calculateRescueStats(state: RescueState) {
  const { incidents, sosRequests, resources, volunteers, shelters, checkIns } = state;

  const activeIncidents = incidents.filter((i) => i.status === "active" || i.status === "escalated");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved" || i.status === "closed");

  const pendingSOS = sosRequests.filter((s) => s.dispatch.status === "pending" || s.dispatch.status === "triaged");
  const dispatchedSOS = sosRequests.filter(
    (s) => s.dispatch.status === "dispatched" || s.dispatch.status === "en_route" || s.dispatch.status === "on_scene"
  );
  const resolvedSOS = sosRequests.filter((s) => s.dispatch.status === "resolved");

  const availableResources = resources.filter((r) => r.status === "available");
  const deployedResources = resources.filter((r) => r.status === "deployed");

  const activeVolunteers = volunteers.filter((v) => v.status === "deployed");

  const openShelters = shelters.filter((s) => s.status === "open");

  const safeCheckIns = checkIns.filter((c) => c.status === "safe");
  const missingPersons = checkIns.filter((c) => c.status === "missing");

  const peopleAtRisk = incidents.reduce((sum, i) => sum + i.peopleAtRisk, 0);
  const peopleRescued = resolvedSOS.reduce((sum, s) => sum + s.situation.peopleCount, 0);

  return {
    totalIncidents: incidents.length,
    activeIncidents: activeIncidents.length,
    resolvedIncidents: resolvedIncidents.length,
    totalSOS: sosRequests.length,
    pendingSOS: pendingSOS.length,
    dispatchedSOS: dispatchedSOS.length,
    resolvedSOS: resolvedSOS.length,
    totalResources: resources.length,
    availableResources: availableResources.length,
    deployedResources: deployedResources.length,
    totalVolunteers: volunteers.length,
    activeVolunteers: activeVolunteers.length,
    totalShelters: shelters.length,
    openShelters: openShelters.length,
    totalCheckIns: checkIns.length,
    safeCheckIns: safeCheckIns.length,
    missingPersons: missingPersons.length,
    peopleAtRisk,
    peopleRescued,
  };
}

// =============================================================================
// 3. FILTER FUNCTION
// =============================================================================

function applyIncidentFilter(incidents: Incident[], filter: IncidentFilter): Incident[] {
  let filtered = [...incidents];

  if (filter.status.length > 0) {
    filtered = filtered.filter((i) => filter.status.includes(i.status));
  }

  if (filter.type.length > 0) {
    filtered = filtered.filter((i) => filter.type.includes(i.type));
  }

  if (filter.priority.length > 0) {
    filtered = filtered.filter((i) => filter.priority.includes(i.priority));
  }

  if (filter.province !== "all") {
    filtered = filtered.filter((i) => i.location.province === filter.province);
  }

  if (filter.dateRange.start) {
    filtered = filtered.filter((i) => i.createdAt >= filter.dateRange.start!);
  }

  if (filter.dateRange.end) {
    filtered = filtered.filter((i) => i.createdAt <= filter.dateRange.end!);
  }

  return filtered;
}

// =============================================================================
// 4. CHECK-IN STATS CALCULATOR
// =============================================================================

function calculateCheckInStats(checkIns: CheckIn[], incidentId: string): CheckInStats {
  const incidentCheckIns = checkIns.filter((c) => c.incidentId === incidentId);

  return {
    totalExpected: incidentCheckIns.reduce((sum, c) => sum + c.familyMembers + 1, 0),
    safe: incidentCheckIns.filter((c) => c.status === "safe").length,
    needHelp: incidentCheckIns.filter((c) => c.status === "need_help").length,
    missing: incidentCheckIns.filter((c) => c.status === "missing").length,
    evacuated: incidentCheckIns.filter((c) => c.status === "evacuated").length,
    hospitalized: incidentCheckIns.filter((c) => c.status === "hospitalized").length,
    separatedFamilies: incidentCheckIns.filter((c) => c.familyMembers > 0 && c.status !== "safe").length,
  };
}

// =============================================================================
// 5. REDUCER
// =============================================================================

function rescueReducer(state: RescueState, action: RescueAction): RescueState {
  switch (action.type) {
    // === INCIDENTS ===
    case "SET_INCIDENTS":
      return { ...state, incidents: action.payload };

    case "ADD_INCIDENT": {
      const newIncidents = [action.payload, ...state.incidents];
      saveToStorage(RESCUE_STORAGE_KEYS.INCIDENTS, newIncidents);
      return { ...state, incidents: newIncidents };
    }

    case "UPDATE_INCIDENT": {
      const updated = state.incidents.map((i) =>
        i.id === action.payload.id ? { ...i, ...action.payload, updatedAt: new Date().toISOString() } : i
      );
      saveToStorage(RESCUE_STORAGE_KEYS.INCIDENTS, updated);
      return {
        ...state,
        incidents: updated,
        selectedIncident: state.selectedIncident?.id === action.payload.id
          ? { ...state.selectedIncident, ...action.payload }
          : state.selectedIncident,
      };
    }

    case "DELETE_INCIDENT": {
      const filtered = state.incidents.filter((i) => i.id !== action.payload);
      saveToStorage(RESCUE_STORAGE_KEYS.INCIDENTS, filtered);
      return {
        ...state,
        incidents: filtered,
        selectedIncident: state.selectedIncident?.id === action.payload ? null : state.selectedIncident,
      };
    }

    case "SELECT_INCIDENT":
      return { ...state, selectedIncident: action.payload };

    case "SET_INCIDENT_FILTER":
      return { ...state, incidentFilter: { ...state.incidentFilter, ...action.payload } };

    // === SOS ===
    case "SET_SOS_REQUESTS":
      return { ...state, sosRequests: action.payload };

    case "ADD_SOS_REQUEST": {
      const newSOS = [action.payload, ...state.sosRequests];
      saveToStorage(RESCUE_STORAGE_KEYS.SOS_REQUESTS, newSOS);
      return { ...state, sosRequests: newSOS };
    }

    case "UPDATE_SOS_REQUEST": {
      const updated = state.sosRequests.map((s) =>
        s.id === action.payload.id ? { ...s, ...action.payload, updatedAt: new Date().toISOString() } : s
      );
      saveToStorage(RESCUE_STORAGE_KEYS.SOS_REQUESTS, updated);
      return {
        ...state,
        sosRequests: updated,
        selectedSOS: state.selectedSOS?.id === action.payload.id
          ? { ...state.selectedSOS, ...action.payload }
          : state.selectedSOS,
      };
    }

    case "SELECT_SOS":
      return { ...state, selectedSOS: action.payload };

    // === TASKS ===
    case "SET_TASKS":
      return { ...state, tasks: action.payload };

    case "ADD_TASK": {
      const newTasks = [action.payload, ...state.tasks];
      saveToStorage(RESCUE_STORAGE_KEYS.TASKS, newTasks);
      return { ...state, tasks: newTasks };
    }

    case "UPDATE_TASK": {
      const updated = state.tasks.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: new Date().toISOString() } : t
      );
      saveToStorage(RESCUE_STORAGE_KEYS.TASKS, updated);
      return { ...state, tasks: updated };
    }

    case "DELETE_TASK": {
      const filtered = state.tasks.filter((t) => t.id !== action.payload);
      saveToStorage(RESCUE_STORAGE_KEYS.TASKS, filtered);
      return { ...state, tasks: filtered };
    }

    case "MOVE_TASK": {
      const { taskId, newStatus } = action.payload;
      const moved = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === "done" ? new Date().toISOString() : t.completedAt,
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.TASKS, moved);
      return { ...state, tasks: moved };
    }

    // === RESOURCES ===
    case "SET_RESOURCES":
      return { ...state, resources: action.payload };

    case "ADD_RESOURCE": {
      const newResources = [action.payload, ...state.resources];
      saveToStorage(RESCUE_STORAGE_KEYS.RESOURCES, newResources);
      return { ...state, resources: newResources };
    }

    case "UPDATE_RESOURCE": {
      const updated = state.resources.map((r) =>
        r.id === action.payload.id ? { ...r, ...action.payload, updatedAt: new Date().toISOString() } : r
      );
      saveToStorage(RESCUE_STORAGE_KEYS.RESOURCES, updated);
      return { ...state, resources: updated };
    }

    case "DELETE_RESOURCE": {
      const filtered = state.resources.filter((r) => r.id !== action.payload);
      saveToStorage(RESCUE_STORAGE_KEYS.RESOURCES, filtered);
      return { ...state, resources: filtered };
    }

    case "DEPLOY_RESOURCE": {
      const { resourceId, incidentId } = action.payload;
      const deployed = state.resources.map((r) => {
        if (r.id !== resourceId) return r;
        return {
          ...r,
          status: "deployed" as const,
          assignedIncidentId: incidentId,
          deployedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.RESOURCES, deployed);
      return { ...state, resources: deployed };
    }

    case "RETURN_RESOURCE": {
      const returned = state.resources.map((r) => {
        if (r.id !== action.payload) return r;
        return {
          ...r,
          status: "available" as const,
          assignedIncidentId: null,
          assignedTaskId: null,
          deployedAt: null,
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.RESOURCES, returned);
      return { ...state, resources: returned };
    }

    // === VOLUNTEERS ===
    case "SET_VOLUNTEERS":
      return { ...state, volunteers: action.payload };

    case "ADD_VOLUNTEER": {
      const newVolunteers = [action.payload, ...state.volunteers];
      saveToStorage(RESCUE_STORAGE_KEYS.VOLUNTEERS, newVolunteers);
      return { ...state, volunteers: newVolunteers };
    }

    case "UPDATE_VOLUNTEER": {
      const updated = state.volunteers.map((v) =>
        v.id === action.payload.id ? { ...v, ...action.payload, updatedAt: new Date().toISOString() } : v
      );
      saveToStorage(RESCUE_STORAGE_KEYS.VOLUNTEERS, updated);
      return { ...state, volunteers: updated };
    }

    case "ASSIGN_VOLUNTEER": {
      const { volunteerId, incidentId, taskId } = action.payload;
      const assigned = state.volunteers.map((v) => {
        if (v.id !== volunteerId) return v;
        return {
          ...v,
          status: "deployed" as const,
          assignedIncidentId: incidentId,
          assignedTaskId: taskId || null,
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.VOLUNTEERS, assigned);
      return { ...state, volunteers: assigned };
    }

    case "RELEASE_VOLUNTEER": {
      const released = state.volunteers.map((v) => {
        if (v.id !== action.payload) return v;
        return {
          ...v,
          status: "available" as const,
          assignedIncidentId: null,
          assignedTaskId: null,
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.VOLUNTEERS, released);
      return { ...state, volunteers: released };
    }

    // === SHELTERS ===
    case "SET_SHELTERS":
      return { ...state, shelters: action.payload };

    case "ADD_SHELTER": {
      const newShelters = [action.payload, ...state.shelters];
      saveToStorage(RESCUE_STORAGE_KEYS.SHELTERS, newShelters);
      return { ...state, shelters: newShelters };
    }

    case "UPDATE_SHELTER": {
      const updated = state.shelters.map((s) =>
        s.id === action.payload.id ? { ...s, ...action.payload, updatedAt: new Date().toISOString() } : s
      );
      saveToStorage(RESCUE_STORAGE_KEYS.SHELTERS, updated);
      return { ...state, shelters: updated };
    }

    case "CHECK_IN_SHELTER": {
      const { shelterId, count } = action.payload;
      const checkedIn = state.shelters.map((s) => {
        if (s.id !== shelterId) return s;
        const newCurrent = s.capacity.current + count;
        return {
          ...s,
          capacity: { ...s.capacity, current: newCurrent },
          status: newCurrent >= s.capacity.max ? ("full" as const) : s.status,
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.SHELTERS, checkedIn);
      return { ...state, shelters: checkedIn };
    }

    case "CHECK_OUT_SHELTER": {
      const { shelterId, count } = action.payload;
      const checkedOut = state.shelters.map((s) => {
        if (s.id !== shelterId) return s;
        const newCurrent = Math.max(0, s.capacity.current - count);
        return {
          ...s,
          capacity: { ...s.capacity, current: newCurrent },
          status: newCurrent < s.capacity.max ? ("open" as const) : s.status,
          updatedAt: new Date().toISOString(),
        };
      });
      saveToStorage(RESCUE_STORAGE_KEYS.SHELTERS, checkedOut);
      return { ...state, shelters: checkedOut };
    }

    // === 3W ===
    case "SET_ORGANIZATIONS":
      return { ...state, organizations: action.payload };

    case "SET_3W_ENTRIES":
      return { ...state, threeWEntries: action.payload };

    case "ADD_3W_ENTRY": {
      const newEntries = [action.payload, ...state.threeWEntries];
      saveToStorage(RESCUE_STORAGE_KEYS.THREE_W_ENTRIES, newEntries);
      return { ...state, threeWEntries: newEntries };
    }

    // === COMMUNICATION ===
    case "SET_CHANNELS":
      return { ...state, channels: action.payload };

    case "ADD_CHANNEL": {
      const newChannels = [action.payload, ...state.channels];
      saveToStorage(RESCUE_STORAGE_KEYS.CHANNELS, newChannels);
      return { ...state, channels: newChannels };
    }

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "ADD_MESSAGE": {
      const newMessages = [action.payload, ...state.messages];
      saveToStorage(RESCUE_STORAGE_KEYS.MESSAGES, newMessages);
      // Update channel unread count
      const updatedChannels = state.channels.map((ch) =>
        ch.id === action.payload.channelId
          ? { ...ch, unreadCount: ch.unreadCount + 1, lastMessageAt: action.payload.createdAt }
          : ch
      );
      return { ...state, messages: newMessages, channels: updatedChannels };
    }

    case "SET_BROADCASTS":
      return { ...state, broadcasts: action.payload };

    case "ADD_BROADCAST": {
      const newBroadcasts = [action.payload, ...state.broadcasts];
      saveToStorage(RESCUE_STORAGE_KEYS.BROADCASTS, newBroadcasts);
      return { ...state, broadcasts: newBroadcasts };
    }

    // === TIMELINE ===
    case "SET_TIMELINE_EVENTS":
      return { ...state, timelineEvents: action.payload };

    case "ADD_TIMELINE_EVENT": {
      const newEvents = [action.payload, ...state.timelineEvents].slice(0, RESCUE_CONFIG.MAX_TIMELINE_EVENTS);
      saveToStorage(RESCUE_STORAGE_KEYS.TIMELINE, newEvents);
      return { ...state, timelineEvents: newEvents };
    }

    // === CHECK-IN ===
    case "SET_CHECK_INS":
      return { ...state, checkIns: action.payload };

    case "ADD_CHECK_IN": {
      const newCheckIns = [action.payload, ...state.checkIns];
      saveToStorage(RESCUE_STORAGE_KEYS.CHECK_INS, newCheckIns);
      return { ...state, checkIns: newCheckIns };
    }

    case "UPDATE_CHECK_IN": {
      const updated = state.checkIns.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload } : c
      );
      saveToStorage(RESCUE_STORAGE_KEYS.CHECK_INS, updated);
      return { ...state, checkIns: updated };
    }

    // === DISPATCH ===
    case "SET_DISPATCH_RESULTS":
      return { ...state, dispatchResults: action.payload };

    case "ADD_DISPATCH_RESULT": {
      const newResults = [action.payload, ...state.dispatchResults];
      saveToStorage(RESCUE_STORAGE_KEYS.DISPATCH_RESULTS, newResults);
      return { ...state, dispatchResults: newResults };
    }

    // === RESOURCE FLOW ===
    case "SET_RESOURCE_FLOW":
      return { ...state, resourceFlowData: action.payload };

    // === UI ===
    case "SET_ACTIVE_TAB":
      saveToStorage(RESCUE_STORAGE_KEYS.ACTIVE_TAB, action.payload);
      return { ...state, activeTab: action.payload };

    case "TOGGLE_MOBILE_DRAWER":
      return { ...state, isMobileDrawerOpen: !state.isMobileDrawerOpen };

    case "TOGGLE_MAP_LAYER": {
      const toggled = state.selectedMapLayer.map((layer) =>
        layer.id === action.payload ? { ...layer, visible: !layer.visible } : layer
      );
      saveToStorage(RESCUE_STORAGE_KEYS.MAP_LAYERS, toggled);
      return { ...state, selectedMapLayer: toggled };
    }

    case "SET_ONLINE":
      return { ...state, isOnline: action.payload };

    // === TOAST ===
    case "ADD_TOAST":
      return { ...state, toasts: [action.payload, ...state.toasts].slice(0, 5) };

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    // === RESET ===
    case "RESET_STATE":
      return createInitialState();

    default:
      return state;
  }
}

// =============================================================================
// 6. CONTEXT
// =============================================================================

const RescueContext = createContext<RescueContextType | null>(null);

// =============================================================================
// 7. PROVIDER
// =============================================================================

interface RescueProviderProps {
  children: ReactNode;
}

export function RescueProvider({ children }: RescueProviderProps) {
  const [state, dispatch] = useReducer(rescueReducer, null, createInitialState);
  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // -------------------------------------------------------------------------
  // Initialize from localStorage + mock data
  // -------------------------------------------------------------------------
  useEffect(() => {
    const storedIncidents = loadFromStorage<Incident[]>(RESCUE_STORAGE_KEYS.INCIDENTS, []);
    const storedSOS = loadFromStorage<RescueSOSRequest[]>(RESCUE_STORAGE_KEYS.SOS_REQUESTS, []);
    const storedTasks = loadFromStorage<RescueTask[]>(RESCUE_STORAGE_KEYS.TASKS, []);
    const storedResources = loadFromStorage<RescueResource[]>(RESCUE_STORAGE_KEYS.RESOURCES, []);
    const storedVolunteers = loadFromStorage<Volunteer[]>(RESCUE_STORAGE_KEYS.VOLUNTEERS, []);
    const storedShelters = loadFromStorage<Shelter[]>(RESCUE_STORAGE_KEYS.SHELTERS, []);
    const storedOrgs = loadFromStorage<Organization[]>(RESCUE_STORAGE_KEYS.ORGANIZATIONS, []);
    const stored3W = loadFromStorage<ThreeWEntry[]>(RESCUE_STORAGE_KEYS.THREE_W_ENTRIES, []);
    const storedChannels = loadFromStorage<CommChannel[]>(RESCUE_STORAGE_KEYS.CHANNELS, []);
    const storedMessages = loadFromStorage<CommMessage[]>(RESCUE_STORAGE_KEYS.MESSAGES, []);
    const storedBroadcasts = loadFromStorage<Broadcast[]>(RESCUE_STORAGE_KEYS.BROADCASTS, []);
    const storedTimeline = loadFromStorage<TimelineEvent[]>(RESCUE_STORAGE_KEYS.TIMELINE, []);
    const storedCheckIns = loadFromStorage<CheckIn[]>(RESCUE_STORAGE_KEYS.CHECK_INS, []);
    const storedDispatch = loadFromStorage<DispatchResult[]>(RESCUE_STORAGE_KEYS.DISPATCH_RESULTS, []);
    const storedTab = loadFromStorage<RescueTab>(RESCUE_STORAGE_KEYS.ACTIVE_TAB, "dashboard");
    const storedLayers = loadFromStorage<MapLayerConfig[]>(RESCUE_STORAGE_KEYS.MAP_LAYERS, DEFAULT_MAP_LAYERS);

    // Use stored data if available, otherwise use mock data
    dispatch({ type: "SET_INCIDENTS", payload: storedIncidents.length > 0 ? storedIncidents : MOCK_INCIDENTS });
    dispatch({ type: "SET_SOS_REQUESTS", payload: storedSOS.length > 0 ? storedSOS : MOCK_SOS_REQUESTS });
    dispatch({ type: "SET_TASKS", payload: storedTasks.length > 0 ? storedTasks : MOCK_TASKS });
    dispatch({ type: "SET_RESOURCES", payload: storedResources.length > 0 ? storedResources : MOCK_RESOURCES });
    dispatch({ type: "SET_VOLUNTEERS", payload: storedVolunteers.length > 0 ? storedVolunteers : MOCK_VOLUNTEERS });
    dispatch({ type: "SET_SHELTERS", payload: storedShelters.length > 0 ? storedShelters : MOCK_SHELTERS });
    dispatch({ type: "SET_ORGANIZATIONS", payload: storedOrgs.length > 0 ? storedOrgs : MOCK_ORGANIZATIONS });
    dispatch({ type: "SET_3W_ENTRIES", payload: stored3W.length > 0 ? stored3W : MOCK_3W_ENTRIES });
    dispatch({ type: "SET_CHANNELS", payload: storedChannels.length > 0 ? storedChannels : MOCK_CHANNELS });
    dispatch({ type: "SET_MESSAGES", payload: storedMessages.length > 0 ? storedMessages : MOCK_MESSAGES });
    dispatch({ type: "SET_BROADCASTS", payload: storedBroadcasts.length > 0 ? storedBroadcasts : MOCK_BROADCASTS });
    dispatch({ type: "SET_TIMELINE_EVENTS", payload: storedTimeline.length > 0 ? storedTimeline : MOCK_TIMELINE_EVENTS });
    dispatch({ type: "SET_CHECK_INS", payload: storedCheckIns.length > 0 ? storedCheckIns : MOCK_CHECK_INS });
    dispatch({ type: "SET_DISPATCH_RESULTS", payload: storedDispatch.length > 0 ? storedDispatch : MOCK_DISPATCH_RESULTS });
    dispatch({ type: "SET_RESOURCE_FLOW", payload: MOCK_RESOURCE_FLOW });
    dispatch({ type: "SET_ACTIVE_TAB", payload: storedTab });
  }, []);

  // -------------------------------------------------------------------------
  // Online/offline detection
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "SET_ONLINE", payload: true });
      showToast({ type: "success", title: "Trực tuyến", message: "Kết nối đã được khôi phục", duration: 3000 });
    };
    const handleOffline = () => {
      dispatch({ type: "SET_ONLINE", payload: false });
      showToast({ type: "warning", title: "Ngoại tuyến", message: "Mất kết nối mạng. Dữ liệu sẽ được lưu cục bộ.", duration: 5000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    dispatch({ type: "SET_ONLINE", payload: navigator.onLine });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Auto-save (debounced)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (state.incidents.length === 0) return;
    const timer = setTimeout(() => {
      saveToStorage(RESCUE_STORAGE_KEYS.INCIDENTS, state.incidents);
      saveToStorage(RESCUE_STORAGE_KEYS.SOS_REQUESTS, state.sosRequests);
      saveToStorage(RESCUE_STORAGE_KEYS.TASKS, state.tasks);
      saveToStorage(RESCUE_STORAGE_KEYS.RESOURCES, state.resources);
      saveToStorage(RESCUE_STORAGE_KEYS.VOLUNTEERS, state.volunteers);
      saveToStorage(RESCUE_STORAGE_KEYS.SHELTERS, state.shelters);
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.incidents, state.sosRequests, state.tasks, state.resources, state.volunteers, state.shelters]);

  // -------------------------------------------------------------------------
  // Toast management
  // -------------------------------------------------------------------------
  const showToast = useCallback(
    (toast: Omit<RescueToast, "id" | "createdAt">) => {
      const id = nextToastId();
      const newToast: RescueToast = {
        ...toast,
        id,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TOAST", payload: newToast });

      // Auto-remove after duration
      const timer = setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", payload: id });
        toastTimers.current.delete(id);
      }, toast.duration);
      toastTimers.current.set(id, timer);
    },
    [dispatch]
  );

  // Cleanup toast timers on unmount
  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // -------------------------------------------------------------------------
  // Computed: filtered incidents
  // -------------------------------------------------------------------------
  const filteredIncidents = useMemo(
    () => applyIncidentFilter(state.incidents, state.incidentFilter),
    [state.incidents, state.incidentFilter]
  );

  // -------------------------------------------------------------------------
  // Computed: rescue stats
  // -------------------------------------------------------------------------
  const rescueStats = useMemo(() => calculateRescueStats(state), [state]);

  // -------------------------------------------------------------------------
  // Helper functions
  // -------------------------------------------------------------------------
  const getIncidentById = useCallback(
    (id: string) => state.incidents.find((i) => i.id === id),
    [state.incidents]
  );

  const getSOSById = useCallback(
    (id: string) => state.sosRequests.find((s) => s.id === id),
    [state.sosRequests]
  );

  const getResourceById = useCallback(
    (id: string) => state.resources.find((r) => r.id === id),
    [state.resources]
  );

  const getVolunteerById = useCallback(
    (id: string) => state.volunteers.find((v) => v.id === id),
    [state.volunteers]
  );

  const getShelterById = useCallback(
    (id: string) => state.shelters.find((s) => s.id === id),
    [state.shelters]
  );

  const getTasksByIncident = useCallback(
    (incidentId: string) => state.tasks.filter((t) => t.incidentId === incidentId),
    [state.tasks]
  );

  const getTimelineByIncident = useCallback(
    (incidentId: string) => state.timelineEvents.filter((e) => e.incidentId === incidentId),
    [state.timelineEvents]
  );

  const getCheckInStats = useCallback(
    (incidentId: string) => calculateCheckInStats(state.checkIns, incidentId),
    [state.checkIns]
  );

  const getThreeWByIncident = useCallback(
    (incidentId: string) => state.threeWEntries.filter((e) => e.what.incidentId === incidentId),
    [state.threeWEntries]
  );

  // -------------------------------------------------------------------------
  // Context value (memoized)
  // -------------------------------------------------------------------------
  const contextValue = useMemo<RescueContextType>(
    () => ({
      state,
      dispatch,
      filteredIncidents,
      rescueStats,
      showToast,
      getIncidentById,
      getSOSById,
      getResourceById,
      getVolunteerById,
      getShelterById,
      getTasksByIncident,
      getTimelineByIncident,
      getCheckInStats,
      getThreeWByIncident,
    }),
    [
      state,
      filteredIncidents,
      rescueStats,
      showToast,
      getIncidentById,
      getSOSById,
      getResourceById,
      getVolunteerById,
      getShelterById,
      getTasksByIncident,
      getTimelineByIncident,
      getCheckInStats,
      getThreeWByIncident,
    ]
  );

  return <RescueContext.Provider value={contextValue}>{children}</RescueContext.Provider>;
}

// =============================================================================
// 8. HOOK
// =============================================================================

export function useRescue(): RescueContextType {
  const context = useContext(RescueContext);
  if (!context) {
    throw new Error("useRescue must be used within a RescueProvider");
  }
  return context;
}
