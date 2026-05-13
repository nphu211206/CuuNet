"use client";

// =============================================================================
// RESCUE HOOKS - Custom React Hooks
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// 14 hooks for rescue coordination:
//   1. useIncidents - Incident CRUD + filtering
//   2. useSOS - SOS request management + triage
//   3. useTasks - Kanban task management
//   4. useResources - Resource registry + deployment
//   5. useVolunteers - Volunteer lifecycle
//   6. useShelters - Shelter management
//   7. useThreeW - 3W/5W data management
//   8. useCommunication - Messaging + broadcast
//   9. useTimeline - Incident timeline
//   10. useCheckIn - Safety check-in
//   11. useDispatch - Dispatch recommendations
//   12. useRescueStats - Aggregated statistics
//   13. useRescueMap - Map layer management
//   14. useRescueToast - Toast notifications
// =============================================================================

import { useCallback, useMemo } from "react";
import { useRescue } from "./rescue-context";
import { triageSOS, batchTriage, getPriorityFromScore } from "./triage-engine";
import {
  findBestFitResources,
  generateDispatchResult,
  calculateDistance,
  analyzeResourceUtilization,
  analyzeCoverageGaps,
} from "./dispatch-engine";
import {
  filterThreeWEntries,
  aggregateByProvince,
  aggregateByCluster,
  calculateGapAnalysis,
  generateThreeWSummary,
} from "./three-w";

import type {
  Incident,
  IncidentFilter,
  IncidentStatus,
  IncidentType,
  IncidentPriority,
  RescueSOSRequest,
  RescueTask,
  TaskStatus,
  RescueResource,
  ResourceType,
  Volunteer,
  Shelter,
  Organization,
  ThreeWEntry,
  FiveWGapAnalysis,
  CommChannel,
  CommMessage,
  Broadcast,
  TimelineEvent,
  TimelineEventType,
  CheckIn,
  CheckInStats,
  DispatchResult,
  DispatchRecommendation,
  RescueTab,
  RescueToast,
  TriageMethod,
  RescueStats,
  MapLayerConfig,
} from "./types";

import {
  RESCUE_CONFIG,
  DEFAULT_INCIDENT_FILTER,
  INCIDENT_STATUS_CONFIG,
  INCIDENT_TYPE_CONFIG,
  RESCUE_SOS_STATUS_CONFIG,
  TASK_STATUS_CONFIG,
  RESOURCE_STATUS_CONFIG,
  SHELTER_OCCUPANCY_THRESHOLDS,
} from "../config/rescue-config";

// =============================================================================
// 1. useIncidents
// =============================================================================

/**
 * Hook for incident management
 * Provides CRUD operations, filtering, and computed data
 */
export function useIncidents() {
  const { state, dispatch, filteredIncidents, rescueStats, showToast } = useRescue();

  const incidents = state.incidents;
  const selectedIncident = state.selectedIncident;
  const incidentFilter = state.incidentFilter;

  // CRUD
  const addIncident = useCallback(
    (incident: Incident) => {
      dispatch({ type: "ADD_INCIDENT", payload: incident });
      showToast({
        type: "info",
        title: "Tạo sự cố mới",
        message: incident.title,
        duration: 3000,
      });
    },
    [dispatch, showToast]
  );

  const updateIncident = useCallback(
    (incident: Incident) => {
      dispatch({ type: "UPDATE_INCIDENT", payload: incident });
    },
    [dispatch]
  );

  const deleteIncident = useCallback(
    (id: string) => {
      dispatch({ type: "DELETE_INCIDENT", payload: id });
    },
    [dispatch]
  );

  const selectIncident = useCallback(
    (incident: Incident | null) => {
      dispatch({ type: "SELECT_INCIDENT", payload: incident });
    },
    [dispatch]
  );

  // Filtering
  const setFilter = useCallback(
    (filter: Partial<IncidentFilter>) => {
      dispatch({ type: "SET_INCIDENT_FILTER", payload: filter });
    },
    [dispatch]
  );

  const resetFilter = useCallback(() => {
    dispatch({ type: "SET_INCIDENT_FILTER", payload: DEFAULT_INCIDENT_FILTER });
  }, [dispatch]);

  // Computed
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status === "active" || i.status === "escalated"),
    [incidents]
  );

  const resolvedIncidents = useMemo(
    () => incidents.filter((i) => i.status === "resolved" || i.status === "closed"),
    [incidents]
  );

  const incidentsByPriority = useMemo(() => {
    const groups: Record<IncidentPriority, Incident[]> = { P1: [], P2: [], P3: [], P4: [] };
    for (const inc of activeIncidents) {
      groups[inc.priority].push(inc);
    }
    return groups;
  }, [activeIncidents]);

  const incidentsByType = useMemo(() => {
    const groups = new Map<IncidentType, Incident[]>();
    for (const inc of incidents) {
      const existing = groups.get(inc.type) || [];
      existing.push(inc);
      groups.set(inc.type, existing);
    }
    return groups;
  }, [incidents]);

  const incidentsByProvince = useMemo(() => {
    const groups = new Map<string, Incident[]>();
    for (const inc of incidents) {
      const existing = groups.get(inc.location.province) || [];
      existing.push(inc);
      groups.set(inc.location.province, existing);
    }
    return groups;
  }, [incidents]);

  const totalPeopleAtRisk = useMemo(
    () => activeIncidents.reduce((sum, i) => sum + i.peopleAtRisk, 0),
    [activeIncidents]
  );

  return {
    incidents,
    filteredIncidents,
    selectedIncident,
    incidentFilter,
    activeIncidents,
    resolvedIncidents,
    incidentsByPriority,
    incidentsByType,
    incidentsByProvince,
    totalPeopleAtRisk,
    addIncident,
    updateIncident,
    deleteIncident,
    selectIncident,
    setFilter,
    resetFilter,
  };
}

// =============================================================================
// 2. useSOS
// =============================================================================

/**
 * Hook for SOS request management
 * Provides triage, dispatch, and status management
 */
export function useSOS() {
  const { state, dispatch, showToast } = useRescue();

  const sosRequests = state.sosRequests;
  const selectedSOS = state.selectedSOS;

  // CRUD
  const addSOS = useCallback(
    (sos: RescueSOSRequest) => {
      dispatch({ type: "ADD_SOS_REQUEST", payload: sos });
      showToast({
        type: "sos",
        title: "SOS mới",
        message: `${sos.situation.peopleCount} người cần cứu hộ tại ${sos.location.district}`,
        duration: RESCUE_CONFIG.SOS_TOAST_DURATION,
      });
    },
    [dispatch, showToast]
  );

  const updateSOS = useCallback(
    (sos: RescueSOSRequest) => {
      dispatch({ type: "UPDATE_SOS_REQUEST", payload: sos });
    },
    [dispatch]
  );

  const selectSOS = useCallback(
    (sos: RescueSOSRequest | null) => {
      dispatch({ type: "SELECT_SOS", payload: sos });
    },
    [dispatch]
  );

  // Triage
  const triageRequest = useCallback(
    (sosId: string, method: TriageMethod = "custom") => {
      const sos = sosRequests.find((s) => s.id === sosId);
      if (!sos) return;

      const result = triageSOS(sos, method, 1);
      const priority = getPriorityFromScore(result.score);

      const updatedSOS: RescueSOSRequest = {
        ...sos,
        triage: {
          method: result.method,
          color: result.color,
          score: result.score,
          breakdown: result.breakdown,
          explanation: result.explanation,
          assessedAt: new Date().toISOString(),
          assessedBy: "system",
        },
        dispatch: {
          ...sos.dispatch,
          status: "triaged",
        },
        timeline: [
          ...sos.timeline,
          {
            status: "triaged",
            timestamp: new Date().toISOString(),
            note: `Phân loại: ${result.color.toUpperCase()} - ${priority}`,
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "UPDATE_SOS_REQUEST", payload: updatedSOS });
      showToast({
        type: result.color === "red" ? "sos" : "info",
        title: `Phân loại SOS: ${priority}`,
        message: result.explanation.substring(0, 100),
        duration: 5000,
      });
    },
    [sosRequests, dispatch, showToast]
  );

  // Batch triage
  const batchTriageRequests = useCallback(
    (method: TriageMethod = "custom") => {
      const pending = sosRequests.filter(
        (s) => s.dispatch.status === "pending"
      );
      const triaged = batchTriage(pending, method);

      for (const sos of triaged) {
        dispatch({ type: "UPDATE_SOS_REQUEST", payload: sos });
      }

      showToast({
        type: "info",
        title: "Phân loại hàng loạt",
        message: `Đã phân loại ${triaged.length} yêu cầu SOS`,
        duration: 3000,
      });
    },
    [sosRequests, dispatch, showToast]
  );

  // Status management
  const resolveSOS = useCallback(
    (sosId: string) => {
      const sos = sosRequests.find((s) => s.id === sosId);
      if (!sos) return;

      const updatedSOS: RescueSOSRequest = {
        ...sos,
        dispatch: {
          ...sos.dispatch,
          status: "resolved",
          resolvedAt: new Date().toISOString(),
        },
        timeline: [
          ...sos.timeline,
          {
            status: "resolved",
            timestamp: new Date().toISOString(),
            note: "Cứu hộ thành công",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "UPDATE_SOS_REQUEST", payload: updatedSOS });
      showToast({
        type: "success",
        title: "Cứu hộ thành công",
        message: `SOS ${sosId} đã được giải quyết`,
        duration: 5000,
      });
    },
    [sosRequests, dispatch, showToast]
  );

  // Computed
  const pendingSOS = useMemo(
    () => sosRequests.filter((s) => s.dispatch.status === "pending"),
    [sosRequests]
  );

  const triagedSOS = useMemo(
    () => sosRequests.filter((s) => s.dispatch.status === "triaged"),
    [sosRequests]
  );

  const dispatchedSOS = useMemo(
    () =>
      sosRequests.filter(
        (s) =>
          s.dispatch.status === "dispatched" ||
          s.dispatch.status === "en_route" ||
          s.dispatch.status === "on_scene"
      ),
    [sosRequests]
  );

  const resolvedSOS = useMemo(
    () => sosRequests.filter((s) => s.dispatch.status === "resolved"),
    [sosRequests]
  );

  const criticalSOS = useMemo(
    () => sosRequests.filter((s) => s.triage.color === "red" && s.dispatch.status !== "resolved"),
    [sosRequests]
  );

  return {
    sosRequests,
    selectedSOS,
    pendingSOS,
    triagedSOS,
    dispatchedSOS,
    resolvedSOS,
    criticalSOS,
    addSOS,
    updateSOS,
    selectSOS,
    triageRequest,
    batchTriageRequests,
    resolveSOS,
  };
}

// =============================================================================
// 3. useTasks
// =============================================================================

/**
 * Hook for Kanban task management
 * Provides CRUD, status transitions, and drag-drop support
 */
export function useTasks() {
  const { state, dispatch, showToast } = useRescue();

  const tasks = state.tasks;

  // CRUD
  const addTask = useCallback(
    (task: RescueTask) => {
      dispatch({ type: "ADD_TASK", payload: task });
    },
    [dispatch]
  );

  const updateTask = useCallback(
    (task: RescueTask) => {
      dispatch({ type: "UPDATE_TASK", payload: task });
    },
    [dispatch]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      dispatch({ type: "DELETE_TASK", payload: taskId });
    },
    [dispatch]
  );

  // Status transitions (Kanban drag-drop)
  const moveTask = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      dispatch({ type: "MOVE_TASK", payload: { taskId, newStatus } });
      showToast({
        type: "info",
        title: "Di chuyển nhiệm vụ",
        message: `Chuyển sang: ${TASK_STATUS_CONFIG[newStatus].labelVi}`,
        duration: 2000,
      });
    },
    [dispatch, showToast]
  );

  // Computed - Kanban columns
  const tasksByStatus = useMemo(() => {
    const columns: Record<TaskStatus, RescueTask[]> = {
      new: [],
      assigned: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) {
      columns[task.status].push(task);
    }
    // Sort each column by priority
    const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
    for (const status of Object.keys(columns) as TaskStatus[]) {
      columns[status].sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    }
    return columns;
  }, [tasks]);

  const tasksByIncident = useMemo(() => {
    const groups = new Map<string, RescueTask[]>();
    for (const task of tasks) {
      const existing = groups.get(task.incidentId) || [];
      existing.push(task);
      groups.set(task.incidentId, existing);
    }
    return groups;
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.dueTime &&
        new Date(t.dueTime) < now
    );
  }, [tasks]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    new: tasksByStatus.new.length,
    assigned: tasksByStatus.assigned.length,
    inProgress: tasksByStatus.in_progress.length,
    done: tasksByStatus.done.length,
    overdue: overdueTasks.length,
  }), [tasks, tasksByStatus, overdueTasks]);

  return {
    tasks,
    tasksByStatus,
    tasksByIncident,
    overdueTasks,
    taskStats,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  };
}

// =============================================================================
// 4. useResources
// =============================================================================

/**
 * Hook for resource registry management
 * Provides CRUD, deployment, and utilization tracking
 */
export function useResources() {
  const { state, dispatch, showToast } = useRescue();

  const resources = state.resources;

  // CRUD
  const addResource = useCallback(
    (resource: RescueResource) => {
      dispatch({ type: "ADD_RESOURCE", payload: resource });
    },
    [dispatch]
  );

  const updateResource = useCallback(
    (resource: RescueResource) => {
      dispatch({ type: "UPDATE_RESOURCE", payload: resource });
    },
    [dispatch]
  );

  const deleteResource = useCallback(
    (resourceId: string) => {
      dispatch({ type: "DELETE_RESOURCE", payload: resourceId });
    },
    [dispatch]
  );

  // Deployment
  const deployResource = useCallback(
    (resourceId: string, incidentId: string) => {
      dispatch({ type: "DEPLOY_RESOURCE", payload: { resourceId, incidentId } });
      const resource = resources.find((r) => r.id === resourceId);
      showToast({
        type: "info",
        title: "Triển khai tài nguyên",
        message: `${resource?.name || resourceId} đã được triển khai`,
        duration: 3000,
      });
    },
    [resources, dispatch, showToast]
  );

  const returnResource = useCallback(
    (resourceId: string) => {
      dispatch({ type: "RETURN_RESOURCE", payload: resourceId });
      const resource = resources.find((r) => r.id === resourceId);
      showToast({
        type: "success",
        title: "Tài nguyên trở về",
        message: `${resource?.name || resourceId} đã sẵn sàng`,
        duration: 3000,
      });
    },
    [resources, dispatch, showToast]
  );

  // Computed
  const resourcesByStatus = useMemo(() => {
    const groups: Record<string, RescueResource[]> = {};
    for (const status of Object.keys(RESOURCE_STATUS_CONFIG)) {
      groups[status] = resources.filter((r) => r.status === status);
    }
    return groups;
  }, [resources]);

  const resourcesByType = useMemo(() => {
    const groups = new Map<ResourceType, RescueResource[]>();
    for (const resource of resources) {
      const existing = groups.get(resource.type) || [];
      existing.push(resource);
      groups.set(resource.type, existing);
    }
    return groups;
  }, [resources]);

  const utilization = useMemo(
    () => analyzeResourceUtilization(resources),
    [resources]
  );

  const availableResources = useMemo(
    () => resources.filter((r) => r.status === "available"),
    [resources]
  );

  return {
    resources,
    resourcesByStatus,
    resourcesByType,
    utilization,
    availableResources,
    addResource,
    updateResource,
    deleteResource,
    deployResource,
    returnResource,
  };
}

// =============================================================================
// 5. useVolunteers
// =============================================================================

/**
 * Hook for volunteer lifecycle management
 * Provides CRUD, assignment, and skills matching
 */
export function useVolunteers() {
  const { state, dispatch, showToast } = useRescue();

  const volunteers = state.volunteers;

  // CRUD
  const addVolunteer = useCallback(
    (volunteer: Volunteer) => {
      dispatch({ type: "ADD_VOLUNTEER", payload: volunteer });
    },
    [dispatch]
  );

  const updateVolunteer = useCallback(
    (volunteer: Volunteer) => {
      dispatch({ type: "UPDATE_VOLUNTEER", payload: volunteer });
    },
    [dispatch]
  );

  // Assignment
  const assignVolunteer = useCallback(
    (volunteerId: string, incidentId: string, taskId?: string) => {
      dispatch({
        type: "ASSIGN_VOLUNTEER",
        payload: { volunteerId, incidentId, taskId },
      });
      const vol = volunteers.find((v) => v.id === volunteerId);
      showToast({
        type: "info",
        title: "Phân công tình nguyện viên",
        message: `${vol?.name || volunteerId} đã được phân công`,
        duration: 3000,
      });
    },
    [volunteers, dispatch, showToast]
  );

  const releaseVolunteer = useCallback(
    (volunteerId: string) => {
      dispatch({ type: "RELEASE_VOLUNTEER", payload: volunteerId });
    },
    [dispatch]
  );

  // Skills matching
  const findVolunteersBySkills = useCallback(
    (requiredSkills: string[]) => {
      return volunteers
        .filter((v) => v.status === "available")
        .map((v) => {
          const matchedSkills = v.skills.filter((s) => requiredSkills.includes(s));
          const matchScore = requiredSkills.length > 0
            ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
            : 0;
          return { volunteer: v, matchScore, matchedSkills };
        })
        .filter((result) => result.matchScore >= RESCUE_CONFIG.VOLUNTEER_MATCH_THRESHOLD)
        .sort((a, b) => b.matchScore - a.matchScore);
    },
    [volunteers]
  );

  // Computed
  const volunteersByStatus = useMemo(() => {
    const groups: Record<string, Volunteer[]> = {};
    for (const vol of volunteers) {
      const existing = groups[vol.status] || [];
      existing.push(vol);
      groups[vol.status] = existing;
    }
    return groups;
  }, [volunteers]);

  const volunteersByType = useMemo(() => {
    const groups: Record<string, Volunteer[]> = {};
    for (const vol of volunteers) {
      const existing = groups[vol.type] || [];
      existing.push(vol);
      groups[vol.type] = existing;
    }
    return groups;
  }, [volunteers]);

  const availableVolunteers = useMemo(
    () => volunteers.filter((v) => v.status === "available"),
    [volunteers]
  );

  const deployedVolunteers = useMemo(
    () => volunteers.filter((v) => v.status === "deployed"),
    [volunteers]
  );

  return {
    volunteers,
    volunteersByStatus,
    volunteersByType,
    availableVolunteers,
    deployedVolunteers,
    addVolunteer,
    updateVolunteer,
    assignVolunteer,
    releaseVolunteer,
    findVolunteersBySkills,
  };
}

// =============================================================================
// 6. useShelters
// =============================================================================

/**
 * Hook for shelter management
 * Provides CRUD, occupancy tracking, and check-in/out
 */
export function useShelters() {
  const { state, dispatch, showToast } = useRescue();

  const shelters = state.shelters;

  // CRUD
  const addShelter = useCallback(
    (shelter: Shelter) => {
      dispatch({ type: "ADD_SHELTER", payload: shelter });
    },
    [dispatch]
  );

  const updateShelter = useCallback(
    (shelter: Shelter) => {
      dispatch({ type: "UPDATE_SHELTER", payload: shelter });
    },
    [dispatch]
  );

  // Check-in/out
  const checkIn = useCallback(
    (shelterId: string, count: number) => {
      dispatch({ type: "CHECK_IN_SHELTER", payload: { shelterId, count } });
      const shelter = shelters.find((s) => s.id === shelterId);
      showToast({
        type: "info",
        title: "Check-in nơi trú ẩn",
        message: `+${count} người tại ${shelter?.name || shelterId}`,
        duration: 3000,
      });
    },
    [shelters, dispatch, showToast]
  );

  const checkOut = useCallback(
    (shelterId: string, count: number) => {
      dispatch({ type: "CHECK_OUT_SHELTER", payload: { shelterId, count } });
    },
    [dispatch]
  );

  // Computed
  const openShelters = useMemo(
    () => shelters.filter((s) => s.status === "open"),
    [shelters]
  );

  const fullShelters = useMemo(
    () => shelters.filter((s) => s.status === "full"),
    [shelters]
  );

  const shelterOccupancy = useMemo(() => {
    return shelters.map((s) => {
      const ratio = s.capacity.max > 0 ? s.capacity.current / s.capacity.max : 0;
      let level: "low" | "medium" | "high" | "critical" = "low";
      let color: string = SHELTER_OCCUPANCY_THRESHOLDS.low.color;

      if (ratio >= SHELTER_OCCUPANCY_THRESHOLDS.critical.max) {
        level = "critical";
        color = SHELTER_OCCUPANCY_THRESHOLDS.critical.color;
      } else if (ratio >= SHELTER_OCCUPANCY_THRESHOLDS.high.max) {
        level = "high";
        color = SHELTER_OCCUPANCY_THRESHOLDS.high.color;
      } else if (ratio >= SHELTER_OCCUPANCY_THRESHOLDS.medium.max) {
        level = "medium";
        color = SHELTER_OCCUPANCY_THRESHOLDS.medium.color;
      }

      return {
        shelter: s,
        occupancyPercent: Math.round(ratio * 100),
        level,
        color,
        available: s.capacity.max - s.capacity.current,
      };
    });
  }, [shelters]);

  const totalCapacity = useMemo(
    () => shelters.reduce((sum, s) => sum + s.capacity.max, 0),
    [shelters]
  );

  const totalOccupied = useMemo(
    () => shelters.reduce((sum, s) => sum + s.capacity.current, 0),
    [shelters]
  );

  return {
    shelters,
    openShelters,
    fullShelters,
    shelterOccupancy,
    totalCapacity,
    totalOccupied,
    addShelter,
    updateShelter,
    checkIn,
    checkOut,
  };
}

// =============================================================================
// 7. useThreeW
// =============================================================================

/**
 * Hook for 3W/5W data management
 * Provides filtering, aggregation, and gap analysis
 */
export function useThreeW() {
  const { state } = useRescue();

  const organizations = state.organizations;
  const threeWEntries = state.threeWEntries;

  // Filtering
  const filterEntries = useCallback(
    (filters: Parameters<typeof filterThreeWEntries>[1]) => {
      return filterThreeWEntries(threeWEntries, filters);
    },
    [threeWEntries]
  );

  // Aggregation
  const byProvince = useMemo(
    () => aggregateByProvince(threeWEntries),
    [threeWEntries]
  );

  const byCluster = useMemo(
    () => aggregateByCluster(threeWEntries),
    [threeWEntries]
  );

  // Gap analysis
  const gapAnalysis = useMemo(
    () => calculateGapAnalysis(threeWEntries, state.incidents),
    [threeWEntries, state.incidents]
  );

  // Summary
  const summary = useMemo(
    () => generateThreeWSummary(threeWEntries, organizations),
    [threeWEntries, organizations]
  );

  return {
    organizations,
    threeWEntries,
    byProvince,
    byCluster,
    gapAnalysis,
    summary,
    filterEntries,
  };
}

// =============================================================================
// 8. useCommunication
// =============================================================================

/**
 * Hook for messaging and broadcast
 */
export function useCommunication() {
  const { state, dispatch, showToast } = useRescue();

  const channels = state.channels;
  const messages = state.messages;
  const broadcasts = state.broadcasts;

  const addChannel = useCallback(
    (channel: CommChannel) => {
      dispatch({ type: "ADD_CHANNEL", payload: channel });
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    (message: CommMessage) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });
    },
    [dispatch]
  );

  const sendBroadcast = useCallback(
    (broadcast: Broadcast) => {
      dispatch({ type: "ADD_BROADCAST", payload: broadcast });
      showToast({
        type: broadcast.priority === "critical" ? "sos" : "info",
        title: "Broadcast",
        message: broadcast.title,
        duration: 5000,
      });
    },
    [dispatch, showToast]
  );

  const getMessagesByChannel = useCallback(
    (channelId: string) => messages.filter((m) => m.channelId === channelId),
    [messages]
  );

  const totalUnread = useMemo(
    () => channels.reduce((sum, ch) => sum + ch.unreadCount, 0),
    [channels]
  );

  return {
    channels,
    messages,
    broadcasts,
    totalUnread,
    addChannel,
    sendMessage,
    sendBroadcast,
    getMessagesByChannel,
  };
}

// =============================================================================
// 9. useTimeline
// =============================================================================

/**
 * Hook for incident timeline management
 */
export function useTimeline() {
  const { state, dispatch } = useRescue();

  const events = state.timelineEvents;

  const addEvent = useCallback(
    (event: TimelineEvent) => {
      dispatch({ type: "ADD_TIMELINE_EVENT", payload: event });
    },
    [dispatch]
  );

  const getByIncident = useCallback(
    (incidentId: string) => events.filter((e) => e.incidentId === incidentId),
    [events]
  );

  const getByType = useCallback(
    (type: TimelineEventType) => events.filter((e) => e.type === type),
    [events]
  );

  const recentEvents = useMemo(
    () => events.slice(0, 50),
    [events]
  );

  return {
    events,
    recentEvents,
    addEvent,
    getByIncident,
    getByType,
  };
}

// =============================================================================
// 10. useCheckIn
// =============================================================================

/**
 * Hook for safety check-in management
 */
export function useCheckIn() {
  const { state, dispatch, showToast } = useRescue();

  const checkIns = state.checkIns;

  const addCheckIn = useCallback(
    (checkIn: CheckIn) => {
      dispatch({ type: "ADD_CHECK_IN", payload: checkIn });
      showToast({
        type: checkIn.status === "safe" ? "success" : checkIn.status === "need_help" ? "warning" : "info",
        title: "Check-in mới",
        message: `${checkIn.personName}: ${checkIn.status}`,
        duration: 3000,
      });
    },
    [dispatch, showToast]
  );

  const updateCheckIn = useCallback(
    (checkIn: CheckIn) => {
      dispatch({ type: "UPDATE_CHECK_IN", payload: checkIn });
    },
    [dispatch]
  );

  const getByIncident = useCallback(
    (incidentId: string) => checkIns.filter((c) => c.incidentId === incidentId),
    [checkIns]
  );

  const getStats = useCallback(
    (incidentId: string): CheckInStats => {
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
    },
    [checkIns]
  );

  const overallStats = useMemo(() => ({
    total: checkIns.length,
    safe: checkIns.filter((c) => c.status === "safe").length,
    needHelp: checkIns.filter((c) => c.status === "need_help").length,
    missing: checkIns.filter((c) => c.status === "missing").length,
    evacuated: checkIns.filter((c) => c.status === "evacuated").length,
    hospitalized: checkIns.filter((c) => c.status === "hospitalized").length,
  }), [checkIns]);

  return {
    checkIns,
    overallStats,
    addCheckIn,
    updateCheckIn,
    getByIncident,
    getStats,
  };
}

// =============================================================================
// 11. useDispatch
// =============================================================================

/**
 * Hook for dispatch recommendations
 */
export function useDispatch() {
  const { state, dispatch, showToast } = useRescue();

  const dispatchResults = state.dispatchResults;
  const resources = state.resources;

  const calculateDispatch = useCallback(
    (sos: RescueSOSRequest): DispatchResult => {
      const result = generateDispatchResult(sos, resources);
      dispatch({ type: "ADD_DISPATCH_RESULT", payload: result });
      return result;
    },
    [resources, dispatch]
  );

  const executeDispatch = useCallback(
    (unitId: string, sosId: string) => {
      const resource = resources.find((r) => r.id === unitId);
      const sos = state.sosRequests.find((s) => s.id === sosId);

      if (resource && sos) {
        // Deploy resource
        dispatch({
          type: "DEPLOY_RESOURCE",
          payload: { resourceId: unitId, incidentId: sos.incidentId || "unknown" },
        });

        // Update SOS status
        const updatedSOS: RescueSOSRequest = {
          ...sos,
          dispatch: {
            ...sos.dispatch,
            status: "dispatched",
            assignedUnitId: unitId,
            assignedAt: new Date().toISOString(),
          },
          timeline: [
            ...sos.timeline,
            {
              status: "dispatched",
              timestamp: new Date().toISOString(),
              note: `Triển khai ${resource.name}`,
            },
          ],
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "UPDATE_SOS_REQUEST", payload: updatedSOS });

        showToast({
          type: "info",
          title: "Triển khai cứu hộ",
          message: `${resource.name} → SOS ${sosId}`,
          duration: 5000,
        });
      }
    },
    [resources, state.sosRequests, dispatch, showToast]
  );

  const getByIncident = useCallback(
    (incidentId: string) => dispatchResults.filter((d) => d.incidentId === incidentId),
    [dispatchResults]
  );

  const getBySOS = useCallback(
    (sosId: string) => dispatchResults.find((d) => d.sosId === sosId),
    [dispatchResults]
  );

  // Coverage analysis
  const coverageGaps = useMemo(
    () => analyzeCoverageGaps(state.incidents, resources),
    [state.incidents, resources]
  );

  return {
    dispatchResults,
    coverageGaps,
    calculateDispatch,
    executeDispatch,
    getByIncident,
    getBySOS,
  };
}

// =============================================================================
// 12. useRescueStats
// =============================================================================

/**
 * Hook for aggregated rescue statistics
 */
export function useRescueStats() {
  const { rescueStats } = useRescue();
  return rescueStats;
}

// =============================================================================
// 13. useRescueMap
// =============================================================================

/**
 * Hook for map layer management
 */
export function useRescueMap() {
  const { state, dispatch } = useRescue();

  const layers = state.selectedMapLayer;

  const toggleLayer = useCallback(
    (layerId: string) => {
      dispatch({ type: "TOGGLE_MAP_LAYER", payload: layerId });
    },
    [dispatch]
  );

  const visibleLayers = useMemo(
    () => layers.filter((l) => l.visible),
    [layers]
  );

  const isLayerVisible = useCallback(
    (layerId: string) => layers.find((l) => l.id === layerId)?.visible ?? false,
    [layers]
  );

  return {
    layers,
    visibleLayers,
    toggleLayer,
    isLayerVisible,
  };
}

// =============================================================================
// 14. useRescueToast
// =============================================================================

/**
 * Hook for toast notification management
 */
export function useRescueToast() {
  const { state, dispatch, showToast } = useRescue();

  const toasts = state.toasts;

  const removeToast = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    },
    [dispatch]
  );

  return {
    toasts,
    showToast,
    removeToast,
  };
}
