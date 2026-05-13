"use client";

// =============================================================================
// QUIZ ENGINE - SM-2 Adaptive Quiz + Spaced Repetition
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Implements:
//   - SM-2 Spaced Repetition Algorithm (Piotr Wozniak, SuperMemo)
//   - Adaptive difficulty (IRT-inspired)
//   - Bloom's Taxonomy alignment
//   - Quiz session management
//   - Score calculation
// =============================================================================

import type {
  QuizQuestion,
  QuizSession,
  QuizResponse,
  QuizResult,
  SRCard,
  BloomLevel,
} from "./types";

import { MOCK_QUIZ_QUESTIONS } from "../api/mock-data";
import { EDUCATION_CONFIG } from "../config/education-config";

// =============================================================================
// 1. SM-2 SPACED REPETITION ALGORITHM
// =============================================================================

/**
 * SM-2 Algorithm (Piotr Wozniak, SuperMemo 2, 1987)
 *
 * After each review:
 *   quality = user_rating (0-5, where 0=complete blackout, 5=perfect recall)
 *
 * If quality >= 3 (correct):
 *   if repetitions == 0: interval = 1
 *   if repetitions == 1: interval = 6
 *   if repetitions > 1: interval = round(interval * EF)
 *   repetitions += 1
 *
 * If quality < 3 (incorrect):
 *   repetitions = 0
 *   interval = 1
 *
 * Update easiness_factor:
 *   EF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
 *   if EF < 1.3: EF = 1.3
 */
export function calculateSM2NextReview(
  card: SRCard,
  quality: number // 0-5
): SRCard {
  let { easinessFactor, interval, repetitions } = card;

  // Ensure quality is in range
  quality = Math.max(0, Math.min(5, quality));

  if (quality >= 3) {
    // Correct answer
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect answer
    repetitions = 0;
    interval = 1;
  }

  // Update easiness factor
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easinessFactor < EDUCATION_CONFIG.SM2_MIN_EF) {
    easinessFactor = EDUCATION_CONFIG.SM2_MIN_EF;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ...card,
    easinessFactor: Math.round(easinessFactor * 100) / 100,
    interval,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString().split("T")[0],
    lastReviewDate: new Date().toISOString().split("T")[0],
    lastQuality: quality,
  };
}

/**
 * Create a new SR card for a question
 */
export function createSRCard(questionId: string): SRCard {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + EDUCATION_CONFIG.SM2_INITIAL_INTERVAL);

  return {
    questionId,
    easinessFactor: EDUCATION_CONFIG.SM2_INITIAL_EF,
    interval: EDUCATION_CONFIG.SM2_INITIAL_INTERVAL,
    repetitions: 0,
    nextReviewDate: nextReviewDate.toISOString().split("T")[0],
    lastReviewDate: new Date().toISOString().split("T")[0],
    lastQuality: 0,
  };
}

/**
 * Get quality rating from response correctness and time
 * quality 0-5 where:
 *   5 = perfect response, fast
 *   4 = correct response, normal speed
 *   3 = correct response, slow
 *   2 = incorrect but close
 *   1 = incorrect
 *   0 = complete blackout
 */
export function calculateQuality(isCorrect: boolean, timeSpentMs: number, difficulty: number): number {
  const timeThreshold = EDUCATION_CONFIG.QUIZ_TIME_LIMIT_MS;

  if (isCorrect) {
    if (timeSpentMs < timeThreshold * 0.3) return 5; // Fast and correct
    if (timeSpentMs < timeThreshold * 0.6) return 4; // Normal speed
    return 3; // Correct but slow
  } else {
    if (timeSpentMs < timeThreshold * 0.3) return 2; // Fast but wrong (maybe careless)
    return 1; // Wrong
  }
}

// =============================================================================
// 2. ADAPTIVE DIFFICULTY (IRT-Inspired)
// =============================================================================

/**
 * Calculate probability of correct answer using IRT 3PL model
 * P(theta) = c + (1-c) / (1 + e^(-a(theta - b)))
 *
 * Simplified for CứuNet:
 *   theta = user ability
 *   b = question difficulty
 *   a = discrimination (fixed at 1.0)
 *   c = guessing parameter (0.25 for 4-choice MC)
 */
export function probabilityCorrect(ability: number, difficulty: number, discrimination: number = 1.0): number {
  const c = 0.25; // Guessing parameter for 4-choice
  const exponent = -discrimination * (ability - difficulty);
  return c + (1 - c) / (1 + Math.exp(exponent));
}

/**
 * Calculate Fisher Information for a question at given ability level
 * I(theta) = a^2 * P(theta) * (1 - P(theta))
 */
export function fisherInformation(ability: number, difficulty: number, discrimination: number = 1.0): number {
  const p = probabilityCorrect(ability, difficulty, discrimination);
  return Math.pow(discrimination, 2) * p * (1 - p);
}

/**
 * Select next question based on adaptive algorithm
 * Selects the question with maximum Fisher Information at current ability
 */
export function selectNextQuestion(
  questions: QuizQuestion[],
  answeredIds: string[],
  currentAbility: number
): QuizQuestion | null {
  const unanswered = questions.filter((q) => !answeredIds.includes(q.id));
  if (unanswered.length === 0) return null;

  // Find question with maximum information at current ability
  let bestQuestion = unanswered[0];
  let bestInfo = fisherInformation(currentAbility, bestQuestion.difficulty, bestQuestion.discrimination);

  for (let i = 1; i < unanswered.length; i++) {
    const info = fisherInformation(currentAbility, unanswered[i].difficulty, unanswered[i].discrimination);
    if (info > bestInfo) {
      bestInfo = info;
      bestQuestion = unanswered[i];
    }
  }

  return bestQuestion;
}

/**
 * Update ability estimate after answering a question
 * Simplified Newton-Raphson update
 */
export function updateAbility(
  currentAbility: number,
  questionDifficulty: number,
  questionDiscrimination: number,
  isCorrect: boolean
): number {
  const p = probabilityCorrect(currentAbility, questionDifficulty, questionDiscrimination);
  const observed = isCorrect ? 1 : 0;
  const info = fisherInformation(currentAbility, questionDifficulty, questionDiscrimination);

  // Newton-Raphson step
  const step = (observed - p) / Math.max(info, 0.01);
  const newAbility = currentAbility + step;

  // Clamp to reasonable range
  return Math.max(-3, Math.min(3, newAbility));
}

// =============================================================================
// 3. QUIZ SESSION MANAGEMENT
// =============================================================================

/**
 * Generate a new quiz session with adaptive question selection
 */
export function generateQuizSession(
  topicTag?: string,
  existingCards: SRCard[] = []
): QuizSession {
  let questions = [...MOCK_QUIZ_QUESTIONS];

  // Filter by topic if specified
  if (topicTag) {
    questions = questions.filter((q) => q.topicTag === topicTag);
  }

  // Prioritize review cards (overdue questions)
  const today = new Date().toISOString().split("T")[0];
  const overdueCardIds = existingCards
    .filter((card) => card.nextReviewDate <= today)
    .map((card) => card.questionId);

  // Separate overdue and new questions
  const overdueQuestions = questions.filter((q) => overdueCardIds.includes(q.id));
  const newQuestions = questions.filter((q) => !overdueCardIds.includes(q.id));

  // Mix: 40% overdue, 60% new (if available)
  const maxQuestions = EDUCATION_CONFIG.QUIZ_QUESTIONS_PER_SESSION;
  const overdueCount = Math.min(Math.ceil(maxQuestions * 0.4), overdueQuestions.length);
  const newCount = Math.min(maxQuestions - overdueCount, newQuestions.length);

  // Shuffle and select
  const shuffledOverdue = shuffleArray(overdueQuestions).slice(0, overdueCount);
  const shuffledNew = shuffleArray(newQuestions).slice(0, newCount);
  const selectedQuestions = shuffleArray([...shuffledOverdue, ...shuffledNew]);

  // If not enough questions, fill with any available
  if (selectedQuestions.length < maxQuestions) {
    const remaining = questions.filter((q) => !selectedQuestions.find((s) => s.id === q.id));
    const additional = shuffleArray(remaining).slice(0, maxQuestions - selectedQuestions.length);
    selectedQuestions.push(...additional);
  }

  return {
    id: `quiz-${Date.now()}`,
    questions: selectedQuestions,
    responses: [],
    currentAbility: 0, // Start at average
    standardError: 1.0,
    currentIndex: 0,
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
    score: 0,
    xpEarned: 0,
  };
}

/**
 * Process a quiz answer
 */
export function processAnswer(
  session: QuizSession,
  questionId: string,
  selectedOptionId: string,
  timeSpentMs: number
): { response: QuizResponse; newAbility: number } {
  const question = session.questions.find((q) => q.id === questionId);
  if (!question) {
    throw new Error(`Question ${questionId} not found`);
  }

  const isCorrect = selectedOptionId === question.correctOptionId;
  const quality = calculateQuality(isCorrect, timeSpentMs, question.difficulty);

  const response: QuizResponse = {
    questionId,
    selectedOptionId,
    isCorrect,
    timeSpentMs,
    quality,
    timestamp: new Date().toISOString(),
  };

  const newAbility = updateAbility(
    session.currentAbility,
    question.difficulty,
    question.discrimination,
    isCorrect
  );

  return { response, newAbility };
}

/**
 * Calculate quiz result from completed session
 */
export function calculateQuizScore(session: QuizSession): QuizResult {
  const totalQuestions = session.responses.length;
  const correctAnswers = session.responses.filter((r) => r.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Calculate XP
  let xpEarned = correctAnswers * EDUCATION_CONFIG.XP_PER_QUIZ_CORRECT;
  if (score === 100) {
    xpEarned += EDUCATION_CONFIG.XP_BONUS_PERFECT_QUIZ;
  }

  // Average time
  const totalTime = session.responses.reduce((sum, r) => sum + r.timeSpentMs, 0);
  const averageTimeMs = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

  // Bloom's distribution
  const bloomDistribution: Record<BloomLevel, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };
  for (const response of session.responses) {
    const question = session.questions.find((q) => q.id === response.questionId);
    if (question) {
      bloomDistribution[question.bloomLevel]++;
    }
  }

  // Check for badge awards
  const badgesEarned: string[] = [];
  if (score === 100) badgesEarned.push("badge-perfect-quiz");
  if (score >= 80) badgesEarned.push("badge-first-aider");

  return {
    sessionId: session.id,
    totalQuestions,
    correctAnswers,
    score,
    xpEarned,
    bloomDistribution,
    averageTimeMs,
    badgesEarned,
  };
}

/**
 * Update spaced repetition cards after quiz
 */
export function updateSRCardsAfterQuiz(
  session: QuizSession,
  existingCards: SRCard[]
): SRCard[] {
  const updatedCards = [...existingCards];

  for (const response of session.responses) {
    const existingIndex = updatedCards.findIndex((c) => c.questionId === response.questionId);

    if (existingIndex >= 0) {
      // Update existing card
      updatedCards[existingIndex] = calculateSM2NextReview(
        updatedCards[existingIndex],
        response.quality
      );
    } else {
      // Create new card
      const newCard = createSRCard(response.questionId);
      updatedCards.push(calculateSM2NextReview(newCard, response.quality));
    }
  }

  return updatedCards;
}

// =============================================================================
// 4. UTILITY FUNCTIONS
// =============================================================================

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get questions due for review
 */
export function getDueQuestions(cards: SRCard[]): SRCard[] {
  const today = new Date().toISOString().split("T")[0];
  return cards.filter((card) => card.nextReviewDate <= today);
}

/**
 * Get review statistics
 */
export function getReviewStats(cards: SRCard[]): {
  total: number;
  due: number;
  mastered: number;
  learning: number;
} {
  const today = new Date().toISOString().split("T")[0];
  const due = cards.filter((c) => c.nextReviewDate <= today).length;
  const mastered = cards.filter((c) => c.repetitions >= 5).length;
  const learning = cards.filter((c) => c.repetitions > 0 && c.repetitions < 5).length;

  return {
    total: cards.length,
    due,
    mastered,
    learning,
  };
}
