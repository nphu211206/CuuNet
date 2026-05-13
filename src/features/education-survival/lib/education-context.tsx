"use client";

// =============================================================================
// EDUCATION CONTEXT - React Context + useReducer
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Architecture: Context + useReducer (consistent with alert-sos, rescue, dashboard)
// Features:
//   - Course progress tracking
//   - Scenario state management
//   - Quiz session management
//   - Badge/XP/Level system
//   - localStorage persistence
//   - Toast management
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
  EducationState,
  EducationAction,
  EducationContextType,
  EducationTab,
  EducationToast,
  Course,
  Lesson,
  Scenario,
  ScenarioNode,
  ScenarioResult,
  QuizSession,
  QuizResponse,
  QuizResult,
  FirstAidGuide,
  KitItem,
  KitProgress,
  EvacuationPlan,
  LearningProgress,
  LevelConfig,
  Badge,
  SRCard,
} from "./types";

import {
  MOCK_COURSES,
  MOCK_SCENARIOS,
  MOCK_QUIZ_QUESTIONS,
  MOCK_FIRST_AID_GUIDES,
  MOCK_KIT_ITEMS,
  MOCK_BADGES,
  MOCK_LEADERBOARD,
} from "../api/mock-data";

import {
  EDUCATION_STORAGE_KEYS,
  EDUCATION_CONFIG,
  LEVEL_CONFIG,
  DEFAULT_PROGRESS,
} from "../config/education-config";

import { calculateQuizScore, calculateSM2NextReview, generateQuizSession } from "./quiz-engine";
import { calculateLevel, checkBadgeAwards, calculateXPForLesson } from "./progress-tracker";

// =============================================================================
// HELPER FUNCTIONS
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
  return `edu-toast-${Date.now()}-${toastIdCounter}`;
}

// =============================================================================
// 1. INITIAL STATE
// =============================================================================

function createInitialState(): EducationState {
  return {
    courses: [],
    selectedCourse: null,
    selectedLesson: null,
    scenarios: [],
    activeScenario: null,
    activeScenarioNode: null,
    scenarioResult: null,
    activeQuizSession: null,
    quizResult: null,
    selectedFirstAidTopic: null,
    kitItems: [],
    kitProgress: { checkedItems: [], totalItems: 0, completionPercent: 0, lastUpdated: new Date().toISOString() },
    evacuationPlan: null,
    progress: { ...DEFAULT_PROGRESS },
    leaderboard: [],
    activeTab: "courses",
    isMobileDrawerOpen: false,
    toasts: [],
    isOnline: true,
  };
}

// =============================================================================
// 2. REDUCER
// =============================================================================

function educationReducer(state: EducationState, action: EducationAction): EducationState {
  switch (action.type) {
    // === COURSES ===
    case "SET_COURSES":
      return { ...state, courses: action.payload };

    case "SELECT_COURSE":
      return { ...state, selectedCourse: action.payload, selectedLesson: null };

    case "SELECT_LESSON":
      return { ...state, selectedLesson: action.payload };

    case "COMPLETE_LESSON": {
      const { lessonId, xpEarned } = action.payload;
      const newCompletedLessons = [...state.progress.completedLessons, lessonId];
      const newXP = state.progress.xp + xpEarned;
      const newLevel = calculateLevel(newXP);
      const updatedProgress = {
        ...state.progress,
        completedLessons: newCompletedLessons,
        xp: newXP,
        level: newLevel.level as 1 | 2 | 3 | 4 | 5,
        lastLoginDate: new Date().toISOString().split("T")[0],
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, progress: updatedProgress };
    }

    case "COMPLETE_COURSE": {
      const { courseId, xpEarned } = action.payload;
      const newCompletedCourses = [...state.progress.completedCourses, courseId];
      const newXP = state.progress.xp + xpEarned;
      const newLevel = calculateLevel(newXP);
      const updatedProgress = {
        ...state.progress,
        completedCourses: newCompletedCourses,
        xp: newXP,
        level: newLevel.level as 1 | 2 | 3 | 4 | 5,
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, progress: updatedProgress };
    }

    // === SCENARIOS ===
    case "SET_SCENARIOS":
      return { ...state, scenarios: action.payload };

    case "START_SCENARIO": {
      const scenario = action.payload;
      const entryNode = scenario.nodes.find((n) => n.id === scenario.entryNodeId);
      return {
        ...state,
        activeScenario: scenario,
        activeScenarioNode: entryNode || null,
        scenarioResult: null,
      };
    }

    case "ADVANCE_SCENARIO": {
      const { choiceId, nextNodeId } = action.payload;
      if (!state.activeScenario) return state;
      const nextNode = state.activeScenario.nodes.find((n) => n.id === nextNodeId);
      return { ...state, activeScenarioNode: nextNode || null };
    }

    case "COMPLETE_SCENARIO": {
      const result = action.payload;
      const newXP = state.progress.xp + result.xpEarned;
      const newLevel = calculateLevel(newXP);
      const newCompletedScenarios = [...state.progress.completedScenarios, result.scenarioId];
      const updatedProgress = {
        ...state.progress,
        xp: newXP,
        level: newLevel.level as 1 | 2 | 3 | 4 | 5,
        completedScenarios: newCompletedScenarios,
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, scenarioResult: result, progress: updatedProgress };
    }

    case "RESET_SCENARIO":
      return { ...state, activeScenario: null, activeScenarioNode: null, scenarioResult: null };

    // === QUIZ ===
    case "START_QUIZ":
      return { ...state, activeQuizSession: action.payload, quizResult: null };

    case "ANSWER_QUESTION": {
      if (!state.activeQuizSession) return state;
      const newResponses = [...state.activeQuizSession.responses, action.payload];
      const nextIndex = state.activeQuizSession.currentIndex + 1;
      const isComplete = nextIndex >= state.activeQuizSession.questions.length;
      return {
        ...state,
        activeQuizSession: {
          ...state.activeQuizSession,
          responses: newResponses,
          currentIndex: nextIndex,
          status: isComplete ? "completed" : "active",
          completedAt: isComplete ? new Date().toISOString() : null,
        },
      };
    }

    case "COMPLETE_QUIZ": {
      const result = action.payload;
      const newXP = state.progress.xp + result.xpEarned;
      const newLevel = calculateLevel(newXP);
      const updatedProgress = {
        ...state.progress,
        xp: newXP,
        level: newLevel.level as 1 | 2 | 3 | 4 | 5,
        quizHistory: [...state.progress.quizHistory, state.activeQuizSession!].slice(-EDUCATION_CONFIG.MAX_QUIZ_HISTORY),
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, quizResult: result, progress: updatedProgress };
    }

    case "RESET_QUIZ":
      return { ...state, activeQuizSession: null, quizResult: null };

    // === FIRST AID ===
    case "SELECT_FIRST_AID":
      return { ...state, selectedFirstAidTopic: action.payload };

    // === KIT ===
    case "SET_KIT_ITEMS":
      return { ...state, kitItems: action.payload };

    case "TOGGLE_KIT_ITEM": {
      const itemId = action.payload;
      const newChecked = state.kitProgress.checkedItems.includes(itemId)
        ? state.kitProgress.checkedItems.filter((id) => id !== itemId)
        : [...state.kitProgress.checkedItems, itemId];
      const newProgress: KitProgress = {
        ...state.kitProgress,
        checkedItems: newChecked,
        completionPercent: Math.round((newChecked.length / state.kitProgress.totalItems) * 100),
        lastUpdated: new Date().toISOString(),
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.KIT_PROGRESS, newProgress);
      return { ...state, kitProgress: newProgress };
    }

    case "RESET_KIT": {
      const resetProgress: KitProgress = {
        checkedItems: [],
        totalItems: state.kitItems.length,
        completionPercent: 0,
        lastUpdated: new Date().toISOString(),
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.KIT_PROGRESS, resetProgress);
      return { ...state, kitProgress: resetProgress };
    }

    // === EVACUATION ===
    case "SET_EVACUATION_PLAN":
      saveToStorage(EDUCATION_STORAGE_KEYS.EVACUATION_PLAN, action.payload);
      return { ...state, evacuationPlan: action.payload };

    case "UPDATE_EVACUATION_PLAN": {
      const updated = state.evacuationPlan
        ? { ...state.evacuationPlan, ...action.payload, lastReviewed: new Date().toISOString() }
        : null;
      if (updated) saveToStorage(EDUCATION_STORAGE_KEYS.EVACUATION_PLAN, updated);
      return { ...state, evacuationPlan: updated };
    }

    // === PROGRESS ===
    case "SET_PROGRESS":
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, action.payload);
      return { ...state, progress: action.payload };

    case "ADD_XP": {
      const newXP = state.progress.xp + action.payload;
      const newLevel = calculateLevel(newXP);
      const updatedProgress = { ...state.progress, xp: newXP, level: newLevel.level as 1 | 2 | 3 | 4 | 5 };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, progress: updatedProgress };
    }

    case "ADD_BADGE": {
      if (state.progress.badges.includes(action.payload)) return state;
      const newBadges = [...state.progress.badges, action.payload];
      const updatedProgress = { ...state.progress, badges: newBadges };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, progress: updatedProgress };
    }

    case "UPDATE_STREAK": {
      const today = new Date().toISOString().split("T")[0];
      const lastActive = state.progress.streak.lastActiveDate;
      const isConsecutive = lastActive === today ||
        (new Date(today).getTime() - new Date(lastActive).getTime() <= 24 * 60 * 60 * 1000);
      const newCurrent = isConsecutive ? state.progress.streak.current + 1 : 1;
      const updatedProgress = {
        ...state.progress,
        streak: {
          ...state.progress.streak,
          current: newCurrent,
          longest: Math.max(newCurrent, state.progress.streak.longest),
          lastActiveDate: today,
        },
      };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, progress: updatedProgress };
    }

    case "UPDATE_COMPETENCY": {
      const { topic, score } = action.payload;
      const newCompetencies = { ...state.progress.competencies, [topic]: score };
      const updatedProgress = { ...state.progress, competencies: newCompetencies };
      saveToStorage(EDUCATION_STORAGE_KEYS.PROGRESS, updatedProgress);
      return { ...state, progress: updatedProgress };
    }

    // === LEADERBOARD ===
    case "SET_LEADERBOARD":
      return { ...state, leaderboard: action.payload };

    // === UI ===
    case "SET_ACTIVE_TAB":
      saveToStorage(EDUCATION_STORAGE_KEYS.ACTIVE_TAB, action.payload);
      return { ...state, activeTab: action.payload };

    case "TOGGLE_MOBILE_DRAWER":
      return { ...state, isMobileDrawerOpen: !state.isMobileDrawerOpen };

    case "ADD_TOAST":
      return { ...state, toasts: [action.payload, ...state.toasts].slice(0, 5) };

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case "SET_ONLINE":
      return { ...state, isOnline: action.payload };

    // === RESET ===
    case "RESET_STATE":
      return createInitialState();

    default:
      return state;
  }
}

// =============================================================================
// 3. CONTEXT
// =============================================================================

const EducationContext = createContext<EducationContextType | null>(null);

// =============================================================================
// 4. PROVIDER
// =============================================================================

interface EducationProviderProps {
  children: ReactNode;
}

export function EducationProvider({ children }: EducationProviderProps) {
  const [state, dispatch] = useReducer(educationReducer, null, createInitialState);
  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize data
  useEffect(() => {
    dispatch({ type: "SET_COURSES", payload: MOCK_COURSES });
    dispatch({ type: "SET_SCENARIOS", payload: MOCK_SCENARIOS });
    dispatch({ type: "SET_KIT_ITEMS", payload: MOCK_KIT_ITEMS });
    dispatch({ type: "SET_LEADERBOARD", payload: MOCK_LEADERBOARD });

    const savedProgress = loadFromStorage<LearningProgress>(EDUCATION_STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);
    dispatch({ type: "SET_PROGRESS", payload: savedProgress });

    const savedTab = loadFromStorage<EducationTab>(EDUCATION_STORAGE_KEYS.ACTIVE_TAB, "courses");
    dispatch({ type: "SET_ACTIVE_TAB", payload: savedTab });

    const savedKitProgress = loadFromStorage<KitProgress>(EDUCATION_STORAGE_KEYS.KIT_PROGRESS, {
      checkedItems: [],
      totalItems: MOCK_KIT_ITEMS.length,
      completionPercent: 0,
      lastUpdated: new Date().toISOString(),
    });
    dispatch({ type: "SET_KIT_ITEMS", payload: MOCK_KIT_ITEMS });

    // Update streak
    dispatch({ type: "UPDATE_STREAK" });
  }, []);

  // Toast management
  const showToast = useCallback(
    (toast: Omit<EducationToast, "id" | "createdAt">) => {
      const id = nextToastId();
      const newToast: EducationToast = {
        ...toast,
        id,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TOAST", payload: newToast });

      const timer = setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", payload: id });
        toastTimers.current.delete(id);
      }, toast.duration);
      toastTimers.current.set(id, timer);
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Computed values
  const currentLevel = useMemo(
    () => LEVEL_CONFIG.find((l) => l.level === state.progress.level) || LEVEL_CONFIG[0],
    [state.progress.level]
  );

  const nextLevel = useMemo(
    () => LEVEL_CONFIG.find((l) => l.level === state.progress.level + 1) || null,
    [state.progress.level]
  );

  const xpToNextLevel = useMemo(
    () => (nextLevel ? nextLevel.xpCumulative - state.progress.xp : 0),
    [nextLevel, state.progress.xp]
  );

  const levelProgress = useMemo(
    () => (nextLevel ? Math.round(((state.progress.xp - currentLevel.xpCumulative) / (nextLevel.xpCumulative - currentLevel.xpCumulative)) * 100) : 100),
    [state.progress.xp, currentLevel, nextLevel]
  );

  const unlockedBadges = useMemo(
    () => MOCK_BADGES.filter((b) => state.progress.badges.includes(b.id)),
    [state.progress.badges]
  );

  const pendingReviewCards = useMemo(
    () => {
      const today = new Date().toISOString().split("T")[0];
      return state.progress.srCards.filter((card) => card.nextReviewDate <= today);
    },
    [state.progress.srCards]
  );

  // Helper functions
  const getCourseProgress = useCallback(
    (courseId: string) => {
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return { completed: 0, total: 0, percent: 0 };
      const completed = course.lessons.filter((l) => state.progress.completedLessons.includes(l.id)).length;
      return { completed, total: course.lessons.length, percent: Math.round((completed / course.lessons.length) * 100) };
    },
    [state.courses, state.progress.completedLessons]
  );

  const getTopicCompetency = useCallback(
    (topic: string) => state.progress.competencies[topic] || 0,
    [state.progress.competencies]
  );

  const isLessonUnlocked = useCallback(
    (lessonId: string) => {
      for (const course of state.courses) {
        const lesson = course.lessons.find((l) => l.id === lessonId);
        if (lesson) {
          if (lesson.prerequisites.length === 0) return true;
          return lesson.prerequisites.every((p) => state.progress.completedLessons.includes(p));
        }
      }
      return false;
    },
    [state.courses, state.progress.completedLessons]
  );

  const isCourseUnlocked = useCallback(
    (courseId: string) => {
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return false;
      if (course.prerequisites.length === 0) return true;
      return course.prerequisites.every((p) => state.progress.completedCourses.includes(p));
    },
    [state.courses, state.progress.completedCourses]
  );

  const calculateQuizScoreFn = useCallback(
    (session: QuizSession) => calculateQuizScore(session),
    []
  );

  // Context value
  const contextValue = useMemo<EducationContextType>(
    () => ({
      state,
      dispatch,
      currentLevel,
      nextLevel,
      xpToNextLevel,
      levelProgress,
      unlockedBadges,
      pendingReviewCards,
      showToast,
      getCourseProgress,
      getTopicCompetency,
      isLessonUnlocked,
      isCourseUnlocked,
      calculateQuizScore: calculateQuizScoreFn,
    }),
    [
      state, currentLevel, nextLevel, xpToNextLevel, levelProgress,
      unlockedBadges, pendingReviewCards, showToast,
      getCourseProgress, getTopicCompetency, isLessonUnlocked, isCourseUnlocked, calculateQuizScoreFn,
    ]
  );

  return <EducationContext.Provider value={contextValue}>{children}</EducationContext.Provider>;
}

// =============================================================================
// 5. HOOK
// =============================================================================

export function useEducation(): EducationContextType {
  const context = useContext(EducationContext);
  if (!context) {
    throw new Error("useEducation must be used within an EducationProvider");
  }
  return context;
}
