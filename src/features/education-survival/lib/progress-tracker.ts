"use client";

// =============================================================================
// PROGRESS TRACKER - XP, Levels, Badges, Streaks
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Implements:
//   - XP calculation and level progression
//   - Badge award system (20 badges)
//   - Streak tracking with freeze support
//   - Competency mapping
//   - Learning analytics
// =============================================================================

import type {
  LearningProgress,
  LevelConfig,
  Badge,
  UserLevel,
  Course,
  Lesson,
  Scenario,
  QuizSession,
} from "./types";

import {
  LEVEL_CONFIG,
  EDUCATION_CONFIG,
} from "../config/education-config";

import { MOCK_BADGES } from "../api/mock-data";

// =============================================================================
// 1. XP CALCULATION
// =============================================================================

/**
 * Calculate XP earned for completing a lesson
 */
export function calculateXPForLesson(lesson: Lesson, isPerfectQuiz: boolean = false): number {
  let xp = lesson.xpReward || EDUCATION_CONFIG.XP_PER_LESSON;
  if (isPerfectQuiz) {
    xp += EDUCATION_CONFIG.XP_BONUS_PERFECT_QUIZ;
  }
  return xp;
}

/**
 * Calculate XP earned for completing a course
 */
export function calculateXPForCourse(course: Course): number {
  return course.totalXP || course.lessons.reduce((sum, l) => sum + (l.xpReward || EDUCATION_CONFIG.XP_PER_LESSON), 0);
}

/**
 * Calculate XP earned for completing a scenario
 */
export function calculateXPForScenario(scenario: Scenario, score: number): number {
  const baseXP = scenario.xpReward || EDUCATION_CONFIG.XP_PER_SCENARIO;
  // Bonus for high scores
  const scoreMultiplier = score >= 90 ? 1.5 : score >= 70 ? 1.2 : score >= 50 ? 1.0 : 0.8;
  return Math.round(baseXP * scoreMultiplier);
}

/**
 * Calculate XP earned for quiz performance
 */
export function calculateXPForQuiz(correctAnswers: number, totalQuestions: number, averageTimeMs: number): number {
  let xp = correctAnswers * EDUCATION_CONFIG.XP_PER_QUIZ_CORRECT;
  // Perfect score bonus
  if (correctAnswers === totalQuestions) {
    xp += EDUCATION_CONFIG.XP_BONUS_PERFECT_QUIZ;
  }
  // Speed bonus (if average time < 50% of limit)
  if (averageTimeMs < EDUCATION_CONFIG.QUIZ_TIME_LIMIT_MS * 0.5) {
    xp += EDUCATION_CONFIG.XP_BONUS_SPEED;
  }
  return xp;
}

/**
 * Calculate XP for daily streak
 */
export function calculateXPForStreak(streakDays: number): number {
  return streakDays * EDUCATION_CONFIG.XP_PER_STREAK_DAY;
}

// =============================================================================
// 2. LEVEL SYSTEM
// =============================================================================

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): LevelConfig {
  // Find the highest level where XP >= xpCumulative
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_CONFIG[i].xpCumulative) {
      return LEVEL_CONFIG[i];
    }
  }
  return LEVEL_CONFIG[0];
}

/**
 * Get XP needed for next level
 */
export function getXPToNextLevel(currentXP: number, currentLevel: UserLevel): number {
  const nextLevel = LEVEL_CONFIG.find((l) => l.level === currentLevel + 1);
  if (!nextLevel) return 0; // Max level
  return nextLevel.xpCumulative - currentXP;
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgressPercent(currentXP: number, currentLevel: UserLevel): number {
  const currentLevelConfig = LEVEL_CONFIG.find((l) => l.level === currentLevel);
  const nextLevelConfig = LEVEL_CONFIG.find((l) => l.level === currentLevel + 1);
  if (!currentLevelConfig || !nextLevelConfig) return 100;
  const xpInLevel = currentXP - currentLevelConfig.xpCumulative;
  const xpNeeded = nextLevelConfig.xpCumulative - currentLevelConfig.xpCumulative;
  return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
}

/**
 * Check if level up occurred
 */
export function checkLevelUp(oldXP: number, newXP: number): { leveledUp: boolean; newLevel: LevelConfig | null } {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  return {
    leveledUp: newLevel.level > oldLevel.level,
    newLevel: newLevel.level > oldLevel.level ? newLevel : null,
  };
}

// =============================================================================
// 3. BADGE SYSTEM
// =============================================================================

/**
 * Check which badges should be awarded based on current progress
 */
export function checkBadgeAwards(
  progress: LearningProgress,
  courses: Course[]
): Badge[] {
  const newBadges: Badge[] = [];
  const earnedBadgeIds = new Set(progress.badges);

  for (const badge of MOCK_BADGES) {
    // Skip already earned badges
    if (earnedBadgeIds.has(badge.id)) continue;

    // Check all requirements
    const allRequirementsMet = badge.requirements.every((req) => {
      switch (req.type) {
        case "complete_course":
          return progress.completedCourses.includes(req.value as string);

        case "pass_quiz":
          // Check if any quiz achieved the required score
          return progress.quizHistory.some((session) => {
            const correct = session.responses.filter((r) => r.isCorrect).length;
            const total = session.responses.length;
            const score = total > 0 ? Math.round((correct / total) * 100) : 0;
            return score >= (req.value as number);
          });

        case "complete_scenario":
          return progress.completedScenarios.includes(req.value as string);

        case "streak_days":
          return progress.streak.longest >= (req.value as number);

        case "total_xp":
          return progress.xp >= (req.value as number);

        case "help_others":
          // Simplified: check if user has social engagement
          return progress.xp >= 1000; // Approximation

        default:
          return false;
      }
    });

    if (allRequirementsMet) {
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Get badge progress for a specific badge
 */
export function getBadgeProgress(
  badge: Badge,
  progress: LearningProgress
): { current: number; target: number; percent: number } {
  const req = badge.requirements[0]; // Primary requirement
  if (!req) return { current: 0, target: 1, percent: 0 };

  let current = 0;
  let target = 1;

  switch (req.type) {
    case "complete_course":
      current = progress.completedCourses.length;
      target = 1;
      break;
    case "pass_quiz":
      current = progress.quizHistory.some((s) => {
        const correct = s.responses.filter((r) => r.isCorrect).length;
        return (correct / s.responses.length) * 100 >= (req.value as number);
      }) ? 1 : 0;
      target = 1;
      break;
    case "streak_days":
      current = progress.streak.longest;
      target = req.value as number;
      break;
    case "total_xp":
      current = progress.xp;
      target = req.value as number;
      break;
    default:
      current = 0;
      target = 1;
  }

  return {
    current,
    target,
    percent: Math.min(100, Math.round((current / target) * 100)),
  };
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(badges: Badge[]): Map<string, Badge[]> {
  const categories = new Map<string, Badge[]>();
  for (const badge of badges) {
    const existing = categories.get(badge.category) || [];
    existing.push(badge);
    categories.set(badge.category, existing);
  }
  return categories;
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "common": return "#94A3B8";
    case "uncommon": return "#22C55E";
    case "rare": return "#3B82F6";
    case "epic": return "#A855F7";
    case "legendary": return "#FFD700";
    default: return "#94A3B8";
  }
}

// =============================================================================
// 4. STREAK TRACKING
// =============================================================================

/**
 * Update streak based on activity
 */
export function updateStreak(progress: LearningProgress): LearningProgress["streak"] {
  const today = new Date().toISOString().split("T")[0];
  const lastActive = progress.streak.lastActiveDate;

  // Already active today
  if (lastActive === today) {
    return progress.streak;
  }

  // Check if consecutive (within 48 hours to account for timezone)
  const lastDate = new Date(lastActive);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 1) {
    // Consecutive day
    const newCurrent = progress.streak.current + 1;
    return {
      ...progress.streak,
      current: newCurrent,
      longest: Math.max(newCurrent, progress.streak.longest),
      lastActiveDate: today,
    };
  } else if (diffDays <= 2 && progress.streak.freezeCount < EDUCATION_CONFIG.STREAK_FREEZE_MAX) {
    // Streak freeze used
    return {
      ...progress.streak,
      freezeCount: progress.streak.freezeCount + 1,
      lastActiveDate: today,
    };
  } else {
    // Streak broken
    return {
      current: 1,
      longest: progress.streak.longest,
      lastActiveDate: today,
      freezeCount: progress.streak.freezeCount,
    };
  }
}

/**
 * Get streak status message
 */
export function getStreakMessage(streak: LearningProgress["streak"]): string {
  if (streak.current === 0) return "Bắt đầu chuỗi học tập!";
  if (streak.current === 1) return "Ngày đầu tiên! Tiếp tục nào!";
  if (streak.current < 7) return `${streak.current} ngày liên tiếp! Tuyệt vời!`;
  if (streak.current < 30) return `${streak.current} ngày! Bạn đang trên đà!`;
  return `${streak.current} ngày! Bạn là ngôi sao! ⭐`;
}

// =============================================================================
// 5. COMPETENCY MAPPING
// =============================================================================

/**
 * Calculate competency score for a topic
 */
export function calculateCompetency(
  topic: string,
  completedLessons: string[],
  quizHistory: QuizSession[],
  courses: Course[]
): number {
  // Find lessons for this topic
  const topicLessons = courses
    .filter((c) => c.topic === topic)
    .flatMap((c) => c.lessons);

  if (topicLessons.length === 0) return 0;

  // Lesson completion score (40% weight)
  const completedCount = topicLessons.filter((l) => completedLessons.includes(l.id)).length;
  const lessonScore = (completedCount / topicLessons.length) * 40;

  // Quiz performance score (60% weight)
  const topicQuestions = quizHistory.flatMap((s) =>
    s.responses.filter((r) => {
      const q = s.questions.find((q) => q.id === r.questionId);
      return q?.topicTag === topic;
    })
  );

  let quizScore = 0;
  if (topicQuestions.length > 0) {
    const correctCount = topicQuestions.filter((r) => r.isCorrect).length;
    quizScore = (correctCount / topicQuestions.length) * 60;
  }

  return Math.min(100, Math.round(lessonScore + quizScore));
}

/**
 * Get competency level description
 */
export function getCompetencyLevel(score: number): { label: string; labelVi: string; color: string } {
  if (score >= 90) return { label: "Expert", labelVi: "Chuyên gia", color: "#22C55E" };
  if (score >= 70) return { label: "Advanced", labelVi: "Nâng cao", color: "#3B82F6" };
  if (score >= 50) return { label: "Intermediate", labelVi: "Trung cấp", color: "#F59E0B" };
  if (score >= 25) return { label: "Beginner", labelVi: "Sơ cấp", color: "#F97316" };
  return { label: "Novice", labelVi: "Mới bắt đầu", color: "#94A3B8" };
}

// =============================================================================
// 6. LEARNING ANALYTICS
// =============================================================================

/**
 * Calculate learning velocity (XP per day)
 */
export function calculateLearningVelocity(progress: LearningProgress): number {
  const joinDate = new Date(progress.joinDate);
  const now = new Date();
  const daysSinceJoin = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / (24 * 60 * 60 * 1000)));
  return Math.round(progress.xp / daysSinceJoin);
}

/**
 * Estimate time to next level
 */
export function estimateTimeToNextLevel(
  progress: LearningProgress,
  velocity: number
): { days: number; estimate: string } {
  const xpNeeded = getXPToNextLevel(progress.xp, progress.level);
  if (xpNeeded <= 0) return { days: 0, estimate: "Đã đạt cấp tối đa!" };
  if (velocity <= 0) return { days: Infinity, estimate: "Bắt đầu học để lên cấp!" };

  const days = Math.ceil(xpNeeded / velocity);
  if (days <= 1) return { days, estimate: "Hôm nay!" };
  if (days <= 7) return { days, estimate: `${days} ngày nữa` };
  if (days <= 30) return { days, estimate: `${Math.ceil(days / 7)} tuần nữa` };
  return { days, estimate: `${Math.ceil(days / 30)} tháng nữa` };
}

/**
 * Get learning summary
 */
export function getLearningSummary(progress: LearningProgress): {
  totalLessons: number;
  totalCourses: number;
  totalScenarios: number;
  totalQuizzes: number;
  averageQuizScore: number;
  strongestTopic: string;
  weakestTopic: string;
} {
  const totalLessons = progress.completedLessons.length;
  const totalCourses = progress.completedCourses.length;
  const totalScenarios = progress.completedScenarios.length;
  const totalQuizzes = progress.quizHistory.length;

  // Average quiz score
  const quizScores = progress.quizHistory.map((s) => {
    const correct = s.responses.filter((r) => r.isCorrect).length;
    return s.responses.length > 0 ? (correct / s.responses.length) * 100 : 0;
  });
  const averageQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0;

  // Strongest/weakest topic
  const competencies = Object.entries(progress.competencies);
  const strongestTopic = competencies.length > 0
    ? competencies.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : "N/A";
  const weakestTopic = competencies.length > 0
    ? competencies.reduce((a, b) => (a[1] < b[1] ? a : b))[0]
    : "N/A";

  return {
    totalLessons,
    totalCourses,
    totalScenarios,
    totalQuizzes,
    averageQuizScore,
    strongestTopic,
    weakestTopic,
  };
}

// =============================================================================
// 7. PROGRESS PERSISTENCE
// =============================================================================

/**
 * Merge progress from localStorage with default values
 */
export function mergeProgress(saved: Partial<LearningProgress>, defaults: LearningProgress): LearningProgress {
  return {
    ...defaults,
    ...saved,
    streak: { ...defaults.streak, ...saved.streak },
    completedLessons: saved.completedLessons || defaults.completedLessons,
    completedCourses: saved.completedCourses || defaults.completedCourses,
    completedScenarios: saved.completedScenarios || defaults.completedScenarios,
    quizHistory: saved.quizHistory || defaults.quizHistory,
    srCards: saved.srCards || defaults.srCards,
    competencies: saved.competencies || defaults.competencies,
  };
}

/**
 * Export progress as JSON for backup
 */
export function exportProgress(progress: LearningProgress): string {
  return JSON.stringify(progress, null, 2);
}

/**
 * Import progress from JSON
 */
export function importProgress(json: string): LearningProgress | null {
  try {
    const data = JSON.parse(json);
    // Basic validation
    if (typeof data.xp !== "number" || typeof data.level !== "number") {
      return null;
    }
    return data as LearningProgress;
  } catch {
    return null;
  }
}
