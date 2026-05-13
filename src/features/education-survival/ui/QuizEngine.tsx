"use client";

// =============================================================================
// QUIZ ENGINE - Adaptive Quiz with SM-2
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - Multiple question types (MC, T/F, matching, drag-drop, image)
//   - Adaptive difficulty (IRT-inspired)
//   - Timer per question
//   - Immediate feedback with explanation
//   - Bloom's Taxonomy indicators
//   - Score summary with breakdown
//   - Animated transitions
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Brain,
  ArrowRight,
  RotateCcw,
  Trophy,
  Star,
  Target,
} from "lucide-react";
import clsx from "clsx";
import type { QuizQuestion, QuizSession, QuizResult, QuizEngineProps, BloomLevel } from "../lib/types";
import { BLOOM_LEVEL_CONFIG, QUESTION_TYPE_CONFIG, EDUCATION_ANIMATION, EDUCATION_CONFIG } from "../config/education-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const questionVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: EDUCATION_ANIMATION.ease },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

const optionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.25 },
  }),
};

const feedbackVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

// =============================================================================
// TIMER HOOK
// =============================================================================

function useQuizTimer(timeLimitMs: number, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);
  const [isExpired, setIsExpired] = useState(false);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!isActive) return;
    startTime.current = Date.now();
    setTimeLeft(timeLimitMs);
    setIsExpired(false);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeLimitMs, isActive]);

  const getTimeSpent = useCallback(() => {
    return Date.now() - startTime.current;
  }, []);

  return { timeLeft, isExpired, getTimeSpent };
}

// =============================================================================
// TIMER DISPLAY
// =============================================================================

function TimerDisplay({ timeLeft, timeLimit }: { timeLeft: number; timeLimit: number }) {
  const seconds = Math.ceil(timeLeft / 1000);
  const percent = (timeLeft / timeLimit) * 100;
  const isLow = seconds <= 10;
  const isCritical = seconds <= 5;

  return (
    <div className="flex items-center gap-2">
      <Clock className={clsx("w-4 h-4", isCritical ? "text-red-400 animate-pulse" : isLow ? "text-amber-400" : "text-slate-400")} />
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
          className={clsx(
            "h-full rounded-full",
            isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-blue-500"
          )}
        />
      </div>
      <span className={clsx(
        "text-xs font-bold tabular-nums w-8 text-right",
        isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-slate-400"
      )}>
        {seconds}s
      </span>
    </div>
  );
}

// =============================================================================
// BLOOM LEVEL BADGE
// =============================================================================

function BloomBadge({ level }: { level: BloomLevel }) {
  const config = BLOOM_LEVEL_CONFIG[level];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium"
      style={{ backgroundColor: `${config.color}15`, color: config.color }}
    >
      {config.icon} {config.labelVi}
    </span>
  );
}

// =============================================================================
// QUESTION DISPLAY
// =============================================================================

function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
}) {
  const typeConfig = QUESTION_TYPE_CONFIG[question.type];

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          Câu {questionNumber}/{totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <BloomBadge level={question.bloomLevel} />
          <span className="text-[9px] text-slate-600">{typeConfig.icon} {typeConfig.labelVi}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full bg-blue-500"
        />
      </div>

      {/* Question text */}
      <h3 className="text-sm font-semibold text-slate-200 leading-relaxed">
        {question.questionVi}
      </h3>

      {/* Image if present */}
      {question.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-700/30">
          <img src={question.imageUrl} alt="Question" className="w-full h-auto" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// OPTION BUTTON
// =============================================================================

function OptionButton({
  option,
  index,
  isSelected,
  isCorrect,
  showFeedback,
  onClick,
}: {
  option: { id: string; textVi: string; icon?: string };
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showFeedback: boolean;
  onClick: () => void;
}) {
  const getBorderColor = () => {
    if (!showFeedback) return isSelected ? "#3B82F6" : "rgba(148,163,184,0.2)";
    if (isCorrect) return "#22C55E";
    if (isSelected && !isCorrect) return "#EF4444";
    return "rgba(148,163,184,0.2)";
  };

  const getBgColor = () => {
    if (!showFeedback) return isSelected ? "rgba(59,130,246,0.1)" : "rgba(15,23,42,0.4)";
    if (isCorrect) return "rgba(34,197,94,0.1)";
    if (isSelected && !isCorrect) return "rgba(239,68,68,0.1)";
    return "rgba(15,23,42,0.4)";
  };

  return (
    <motion.button
      custom={index}
      variants={optionVariants}
      initial="hidden"
      animate="visible"
      whileHover={!showFeedback ? { scale: 1.01, transition: { duration: 0.15 } } : undefined}
      whileTap={!showFeedback ? { scale: 0.99 } : undefined}
      onClick={!showFeedback ? onClick : undefined}
      className={clsx(
        "w-full p-3 rounded-xl border text-left transition-all duration-200",
        showFeedback && "cursor-default"
      )}
      style={{
        borderColor: getBorderColor(),
        backgroundColor: getBgColor(),
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{
            backgroundColor: showFeedback
              ? isCorrect
                ? "rgba(34,197,94,0.2)"
                : isSelected
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(100,116,139,0.1)"
              : isSelected
                ? "rgba(59,130,246,0.2)"
                : "rgba(100,116,139,0.1)",
            color: showFeedback
              ? isCorrect
                ? "#22C55E"
                : isSelected
                  ? "#EF4444"
                  : "#64748B"
              : isSelected
                ? "#3B82F6"
                : "#64748B",
          }}
        >
          {showFeedback ? (
            isCorrect ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isSelected ? (
              <XCircle className="w-4 h-4" />
            ) : (
              String.fromCharCode(65 + index)
            )
          ) : (
            String.fromCharCode(65 + index)
          )}
        </div>
        <div className="flex-1">
          <p className={clsx("text-xs", showFeedback && !isCorrect && !isSelected ? "text-slate-600" : "text-slate-200")}>
            {option.icon && <span className="mr-1">{option.icon}</span>}
            {option.textVi}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// =============================================================================
// FEEDBACK DISPLAY
// =============================================================================

function FeedbackDisplay({
  isCorrect,
  explanation,
  xpEarned,
  onNext,
  isLast,
}: {
  isCorrect: boolean;
  explanation: string;
  xpEarned: number;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <motion.div
      variants={feedbackVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "p-4 rounded-xl border",
        isCorrect ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
        <span className={clsx("text-sm font-semibold", isCorrect ? "text-green-400" : "text-red-400")}>
          {isCorrect ? "Đúng rồi!" : "Sai rồi!"}
        </span>
        {isCorrect && (
          <span className="text-[10px] font-bold text-green-400 ml-auto">+{xpEarned} XP</span>
        )}
      </div>
      <p className="text-[11px] text-slate-300">{explanation}</p>
      <button
        onClick={onNext}
        className="mt-3 w-full py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
      >
        {isLast ? "Xem kết quả" : "Câu tiếp theo →"}
      </button>
    </motion.div>
  );
}

// =============================================================================
// QUIZ RESULT SUMMARY
// =============================================================================

function QuizResultSummary({
  result,
  onRestart,
}: {
  result: QuizResult;
  onRestart: () => void;
}) {
  const scoreColor = result.score >= 80 ? "#22C55E" : result.score >= 60 ? "#F59E0B" : "#EF4444";
  const scoreLabel = result.score >= 80 ? "Xuất sắc!" : result.score >= 60 ? "Tốt!" : result.score >= 40 ? "Trung bình" : "Cần cải thiện";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="space-y-4"
    >
      {/* Score */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-700/30 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: scoreColor }} />
        <h3 className="text-3xl font-black tabular-nums" style={{ color: scoreColor }}>
          {result.score}%
        </h3>
        <p className="text-sm font-medium mt-1" style={{ color: scoreColor }}>{scoreLabel}</p>
        <p className="text-[10px] text-slate-500 mt-1">
          {result.correctAnswers}/{result.totalQuestions} câu đúng
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
          <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <span className="text-sm font-bold text-amber-400">+{result.xpEarned}</span>
          <span className="text-[9px] text-slate-500 block">XP</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <span className="text-sm font-bold text-blue-400">{Math.round(result.averageTimeMs / 1000)}s</span>
          <span className="text-[9px] text-slate-500 block">TB/câu</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
          <Target className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <span className="text-sm font-bold text-green-400">{result.correctAnswers}</span>
          <span className="text-[9px] text-slate-500 block">Đúng</span>
        </div>
      </div>

      {/* Bloom's distribution */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <h4 className="text-xs font-semibold text-slate-200 mb-2">📊 Phân bố Bloom's Taxonomy</h4>
        <div className="space-y-1.5">
          {Object.entries(result.bloomDistribution).map(([level, count]) => {
            const config = BLOOM_LEVEL_CONFIG[level as BloomLevel];
            const total = Object.values(result.bloomDistribution).reduce((s, v) => s + v, 0);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={level} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-20">{config.icon} {config.labelVi}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: config.color }}
                  />
                </div>
                <span className="text-[10px] font-bold w-8 text-right" style={{ color: config.color }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges earned */}
      {result.badgesEarned.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <h4 className="text-xs font-semibold text-amber-400 mb-2">🏆 Huy hiệu đạt được</h4>
          <div className="flex gap-2">
            {result.badgesEarned.map((badgeId) => (
              <div key={badgeId} className="px-2 py-1 rounded-lg bg-amber-500/20 text-[10px] font-medium text-amber-300">
                {badgeId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restart button */}
      <button
        onClick={onRestart}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Làm lại quiz
      </button>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function QuizEngineComponent({
  session,
  result,
  onStart,
  onAnswer,
  onNext,
  onFinish,
  onRestart,
  className,
}: QuizEngineProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState("");

  const { timeLeft, isExpired, getTimeSpent } = useQuizTimer(
    EDUCATION_CONFIG.QUIZ_TIME_LIMIT_MS,
    !!session && session.status === "active"
  );

  const currentQuestion = session?.questions[session.currentIndex];
  const isLastQuestion = session ? session.currentIndex >= session.questions.length - 1 : false;

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (showFeedback || !currentQuestion || !session) return;
      setSelectedOption(optionId);

      const timeSpent = getTimeSpent();
      const correct = optionId === currentQuestion.correctOptionId;
      setIsCorrect(correct);
      setCurrentExplanation(currentQuestion.explanationVi);
      setShowFeedback(true);

      onAnswer(currentQuestion.id, optionId, timeSpent);
    },
    [showFeedback, currentQuestion, session, getTimeSpent, onAnswer]
  );

  const handleNext = useCallback(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setCurrentExplanation("");

    if (isLastQuestion) {
      onFinish();
    } else {
      onNext();
    }
  }, [isLastQuestion, onFinish, onNext]);

  // Auto-submit on time expire
  useEffect(() => {
    if (isExpired && !showFeedback && currentQuestion) {
      handleOptionSelect(currentQuestion.options[0].id);
    }
  }, [isExpired]);

  // Start screen
  if (!session) {
    return (
      <div className={clsx("space-y-4", className)}>
        <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-700/30 text-center">
          <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Quiz thích ứng</h3>
          <p className="text-xs text-slate-400 mb-4">
            Câu hỏi điều chỉnh theo khả năng của bạn. Trả lời đúng → câu khó hơn. Sai → câu dễ hơn.
          </p>
          <button
            onClick={() => onStart("")}
            className="px-6 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 text-sm font-semibold hover:bg-purple-500/30 transition-colors"
          >
            Bắt đầu quiz
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className={className}>
        <QuizResultSummary result={result} onRestart={onRestart} />
      </div>
    );
  }

  // Quiz in progress
  if (!currentQuestion) return null;

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Timer */}
      <TimerDisplay timeLeft={timeLeft} timeLimit={EDUCATION_CONFIG.QUIZ_TIME_LIMIT_MS} />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          variants={questionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={session.currentIndex + 1}
            totalQuestions={session.questions.length}
          />

          {/* Options */}
          <div className="mt-4 space-y-2">
            {currentQuestion.options.map((option, i) => (
              <OptionButton
                key={option.id}
                option={option}
                index={i}
                isSelected={selectedOption === option.id}
                isCorrect={option.id === currentQuestion.correctOptionId}
                showFeedback={showFeedback}
                onClick={() => handleOptionSelect(option.id)}
              />
            ))}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className="mt-3">
              <FeedbackDisplay
                isCorrect={isCorrect}
                explanation={currentExplanation}
                xpEarned={isCorrect ? EDUCATION_CONFIG.XP_PER_QUIZ_CORRECT : 0}
                onNext={handleNext}
                isLast={isLastQuestion}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export const QuizEngine = memo(QuizEngineComponent);
