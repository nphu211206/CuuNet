"use client";

// =============================================================================
// EDUCATION PAGE - Main Page Assembly
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Layout:
//   - Header with 6 view tabs + XP/streak display
//   - Tab-based content: Courses, Scenarios, Quiz, Practice, Community, Info
//   - Toast notifications (xp, badge, level_up, success, error, info)
//   - Course detail view (lesson viewer)
//   - Scenario detail view (simulator)
//   - Quiz detail view (engine)
//
// Architecture:
//   - EducationProvider wraps entire page
//   - EducationPageContent uses useEducation hook
//   - All state management via context + reducer
// =============================================================================

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  BookOpen,
  Gamepad2,
  Brain,
  Stethoscope,
  Users,
  Info,
  Zap,
  Award,
  Flame,
} from "lucide-react";
import clsx from "clsx";

import { EducationProvider, useEducation } from "@/features/education-survival/lib/education-context";
import type { EducationTab, EducationToast, Course, Lesson } from "@/features/education-survival/lib/types";

// UI Components
import { EducationHeader } from "@/features/education-survival/ui/EducationHeader";
import { CourseBrowser, LessonViewer } from "@/features/education-survival/ui/CourseBrowser";
import { ScenarioSimulator } from "@/features/education-survival/ui/ScenarioSimulator";
import { QuizEngine } from "@/features/education-survival/ui/QuizEngine";
import { FirstAidGuide } from "@/features/education-survival/ui/FirstAidGuide";
import { EmergencyKitBuilder } from "@/features/education-survival/ui/EmergencyKitBuilder";
import { EvacuationPlanner } from "@/features/education-survival/ui/EvacuationPlanner";
import { EmergencyNumbers } from "@/features/education-survival/ui/EmergencyNumbers";
import { ProgressDashboard } from "@/features/education-survival/ui/ProgressDashboard";
import { BadgeCollection, Leaderboard } from "@/features/education-survival/ui/BadgeCollection";

// Utilities
import { calculateXPForLesson, calculateXPForCourse, checkBadgeAwards } from "@/features/education-survival/lib/progress-tracker";
import { MOCK_BADGES } from "@/features/education-survival/api/mock-data";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

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
  success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "text-green-400", iconSymbol: "✅" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400", iconSymbol: "❌" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400", iconSymbol: "ℹ️" },
  xp: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "text-amber-400", iconSymbol: "⚡" },
  badge: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "text-purple-400", iconSymbol: "🏆" },
  level_up: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "text-green-400", iconSymbol: "🎉" },
};

// =============================================================================
// TOAST CONTAINER
// =============================================================================

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: EducationToast[];
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
                  {toast.xpAmount && (
                    <span className="text-[10px] font-bold text-amber-400">+{toast.xpAmount} XP</span>
                  )}
                  {toast.badgeIcon && (
                    <span className="text-[10px] ml-1">{toast.badgeIcon} Huy hiệu mới!</span>
                  )}
                  {toast.levelUpTo && (
                    <span className="text-[10px] font-bold text-green-400">Level {toast.levelUpTo}!</span>
                  )}
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
// COURSES VIEW
// =============================================================================

function CoursesView() {
  const { state, dispatch, showToast, getCourseProgress, isCourseUnlocked } = useEducation();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const handleCourseSelect = useCallback((course: Course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
  }, []);

  const handleLessonSelect = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
  }, []);

  const handleLessonComplete = useCallback(
    (lessonId: string) => {
      if (!selectedCourse) return;
      const lesson = selectedCourse.lessons.find((l) => l.id === lessonId);
      if (!lesson) return;

      const xpEarned = calculateXPForLesson(lesson);
      dispatch({ type: "COMPLETE_LESSON", payload: { lessonId, xpEarned } });

      showToast({
        type: "xp",
        title: "Bài học hoàn thành!",
        message: lesson.titleVi,
        duration: 4000,
        xpAmount: xpEarned,
      });

      // Check if course completed
      const courseProgress = getCourseProgress(selectedCourse.id);
      if (courseProgress.completed + 1 >= courseProgress.total) {
        const courseXP = calculateXPForCourse(selectedCourse);
        dispatch({ type: "COMPLETE_COURSE", payload: { courseId: selectedCourse.id, xpEarned: courseXP } });
        showToast({
          type: "badge",
          title: "Khóa học hoàn thành!",
          message: selectedCourse.titleVi,
          duration: 5000,
          xpAmount: courseXP,
        });
      }

      // Check for new badges
      const newBadges = checkBadgeAwards(state.progress, state.courses);
      for (const badge of newBadges) {
        if (!state.progress.badges.includes(badge.id)) {
          dispatch({ type: "ADD_BADGE", payload: badge.id });
          showToast({
            type: "badge",
            title: "Huy hiệu mới!",
            message: badge.nameVi,
            duration: 5000,
            badgeIcon: badge.icon,
          });
        }
      }

      setSelectedLesson(null);
    },
    [selectedCourse, state.progress, state.courses, dispatch, showToast, getCourseProgress]
  );

  // Lesson viewer
  if (selectedCourse && selectedLesson) {
    return (
      <LessonViewer
        lesson={selectedLesson}
        course={selectedCourse}
        isCompleted={state.progress.completedLessons.includes(selectedLesson.id)}
        onComplete={handleLessonComplete}
        onBack={() => setSelectedLesson(null)}
      />
    );
  }

  // Course detail
  if (selectedCourse) {
    const courseProgress = getCourseProgress(selectedCourse.id);
    return (
      <div className="space-y-3">
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-[11px] font-medium hover:border-slate-600/50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại danh sách khóa học
        </button>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{selectedCourse.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-white">{selectedCourse.titleVi}</h2>
              <p className="text-[10px] text-slate-500">
                {selectedCourse.lessons.length} bài • {selectedCourse.estimatedMinutes} phút • ⚡ {selectedCourse.totalXP} XP
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">{selectedCourse.descriptionVi}</p>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${courseProgress.percent}%`,
                backgroundColor: selectedCourse.color,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {courseProgress.completed}/{courseProgress.total} bài hoàn thành ({courseProgress.percent}%)
          </span>
        </div>

        <div className="space-y-2">
          {selectedCourse.lessons.map((lesson, i) => {
            const isCompleted = state.progress.completedLessons.includes(lesson.id);
            const isUnlocked = lesson.prerequisites.length === 0 ||
              lesson.prerequisites.every((p) => state.progress.completedLessons.includes(p));

            return (
              <motion.button
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => isUnlocked && handleLessonSelect(lesson)}
                disabled={!isUnlocked}
                className={clsx(
                  "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                  isUnlocked
                    ? "bg-slate-900/40 border-slate-700/30 hover:border-slate-600/50 cursor-pointer"
                    : "bg-slate-900/20 border-slate-800/30 opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: isCompleted ? "#22C55E20" : isUnlocked ? `${selectedCourse.color}20` : "rgba(100,116,139,0.1)",
                    color: isCompleted ? "#22C55E" : isUnlocked ? selectedCourse.color : "#64748B",
                  }}
                >
                  {isCompleted ? "✓" : lesson.order}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={clsx("text-xs font-medium", isCompleted ? "text-slate-500 line-through" : "text-slate-200")}>
                    {lesson.titleVi}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lesson.estimatedMinutes} phút • ⚡ {lesson.xpReward} XP
                  </p>
                </div>
                {!isUnlocked && <span className="text-[10px] text-slate-600">🔒</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Course list
  return (
    <CourseBrowser
      courses={state.courses}
      progress={state.progress}
      onCourseSelect={handleCourseSelect}
    />
  );
}

// =============================================================================
// SCENARIOS VIEW
// =============================================================================

function ScenariosView() {
  const { state, dispatch, showToast } = useEducation();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const selectedScenario = selectedScenarioId
    ? state.scenarios.find((s) => s.id === selectedScenarioId)
    : null;

  const handleStartScenario = useCallback(
    (scenarioId: string) => {
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        dispatch({ type: "START_SCENARIO", payload: scenario });
        setSelectedScenarioId(scenarioId);
      }
    },
    [state.scenarios, dispatch]
  );

  const handleChoiceSelect = useCallback(
    (choiceId: string) => {
      if (!state.activeScenario || !state.activeScenarioNode) return;
      const choice = state.activeScenarioNode.choices?.find((c) => c.id === choiceId);
      if (!choice) return;

      dispatch({ type: "ADVANCE_SCENARIO", payload: { choiceId, nextNodeId: choice.nextNodeId } });

      // Check if we reached a debrief node
      const nextNode = state.activeScenario.nodes.find((n) => n.id === choice.nextNodeId);
      if (nextNode?.type === "debrief") {
        // Calculate result
        const score = 70; // Simplified
        const result = {
          scenarioId: state.activeScenario.id,
          pathTaken: [state.activeScenario.entryNodeId, choice.nextNodeId],
          choicesMade: [{ nodeId: state.activeScenarioNode.id, choiceId, timestamp: new Date().toISOString() }],
          finalMetrics: { safety: 50, resources: 30, time: 40, morale: 40 },
          score,
          xpEarned: 150,
          debrief: nextNode.narrative,
          debriefVi: nextNode.narrativeVi,
        };
        dispatch({ type: "COMPLETE_SCENARIO", payload: result });
        showToast({
          type: "xp",
          title: "Kịch bản hoàn thành!",
          message: `Điểm: ${score}/100`,
          duration: 4000,
          xpAmount: 150,
        });
      }
    },
    [state.activeScenario, state.activeScenarioNode, dispatch, showToast]
  );

  const handleRestart = useCallback(() => {
    if (state.activeScenario) {
      dispatch({ type: "START_SCENARIO", payload: state.activeScenario });
    }
  }, [state.activeScenario, dispatch]);

  const handleBack = useCallback(() => {
    dispatch({ type: "RESET_SCENARIO" });
    setSelectedScenarioId(null);
  }, [dispatch]);

  // Scenario simulator
  if (state.activeScenario) {
    return (
      <ScenarioSimulator
        scenario={state.activeScenario}
        activeNode={state.activeScenarioNode}
        result={state.scenarioResult}
        onChoiceSelect={handleChoiceSelect}
        onRestart={handleRestart}
        onBack={handleBack}
      />
    );
  }

  // Scenario list
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Chọn kịch bản</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {state.scenarios.map((scenario) => (
          <motion.button
            key={scenario.id}
            whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStartScenario(scenario.id)}
            className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${scenario.color}20` }}
              >
                {scenario.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{scenario.titleVi}</h4>
                <p className="text-[10px] text-slate-500">{scenario.region} • {scenario.estimatedMinutes} phút</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{scenario.descriptionVi}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
              <span>⚡ {scenario.xpReward} XP</span>
              <span>🎯 Độ phức tạp: {scenario.complexity}/5</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// QUIZ VIEW
// =============================================================================

function QuizView() {
  const { state, dispatch, showToast } = useEducation();

  const handleStart = useCallback(
    (topicTag: string) => {
      const session = {
        id: `quiz-${Date.now()}`,
        questions: [],
        responses: [],
        currentAbility: 0,
        standardError: 1.0,
        currentIndex: 0,
        status: "active" as const,
        startedAt: new Date().toISOString(),
        completedAt: null,
        score: 0,
        xpEarned: 0,
      };
      dispatch({ type: "START_QUIZ", payload: session });
    },
    [dispatch]
  );

  const handleAnswer = useCallback(
    (questionId: string, optionId: string, timeMs: number) => {
      const response = {
        questionId,
        selectedOptionId: optionId,
        isCorrect: Math.random() > 0.3,
        timeSpentMs: timeMs,
        quality: 4,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ANSWER_QUESTION", payload: response });
    },
    [dispatch]
  );

  const handleNext = useCallback(() => {}, []);

  const handleFinish = useCallback(() => {
    if (!state.activeQuizSession) return;
    const correct = state.activeQuizSession.responses.filter((r) => r.isCorrect).length;
    const total = state.activeQuizSession.responses.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const result = {
      sessionId: state.activeQuizSession.id,
      totalQuestions: total,
      correctAnswers: correct,
      score,
      xpEarned: correct * 20,
      bloomDistribution: { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 },
      averageTimeMs: 10000,
      badgesEarned: score === 100 ? ["badge-perfect-quiz"] : [],
    };
    dispatch({ type: "COMPLETE_QUIZ", payload: result });
    showToast({
      type: "xp",
      title: "Quiz hoàn thành!",
      message: `Điểm: ${score}%`,
      duration: 4000,
      xpAmount: result.xpEarned,
    });
  }, [state.activeQuizSession, dispatch, showToast]);

  const handleRestart = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" });
  }, [dispatch]);

  return (
    <QuizEngine
      session={state.activeQuizSession}
      result={state.quizResult}
      onStart={handleStart}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onFinish={handleFinish}
      onRestart={handleRestart}
    />
  );
}

// =============================================================================
// PRACTICE VIEW
// =============================================================================

function PracticeView() {
  const { state, dispatch, showToast } = useEducation();
  const [practiceTab, setPracticeTab] = useState<"firstaid" | "kit" | "evacuation" | "numbers">("firstaid");
  const [selectedFirstAid, setSelectedFirstAid] = useState<any>(null);

  const practiceTabs = [
    { id: "firstaid" as const, label: "Sơ cứu", icon: "🩹" },
    { id: "kit" as const, label: "Bộ đồ", icon: "🎒" },
    { id: "evacuation" as const, label: "Sơ tán", icon: "🏃" },
    { id: "numbers" as const, label: "Số khẩn cấp", icon: "📞" },
  ];

  return (
    <div className="space-y-3">
      {/* Practice tabs */}
      <div className="flex gap-1">
        {practiceTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPracticeTab(tab.id)}
            className={clsx(
              "flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium border transition-colors",
              practiceTab === tab.id
                ? "bg-red-500/15 border-red-500/40 text-red-400"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500"
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {practiceTab === "firstaid" && (
        <FirstAidGuide
          guide={selectedFirstAid}
          guides={[]}
          onTopicSelect={setSelectedFirstAid}
          onBack={() => setSelectedFirstAid(null)}
        />
      )}
      {practiceTab === "kit" && (
        <EmergencyKitBuilder
          items={state.kitItems}
          progress={state.kitProgress}
          onToggleItem={(id) => dispatch({ type: "TOGGLE_KIT_ITEM", payload: id })}
          onReset={() => dispatch({ type: "RESET_KIT" })}
        />
      )}
      {practiceTab === "evacuation" && (
        <EvacuationPlanner
          plan={state.evacuationPlan}
          onUpdate={(plan) => dispatch({ type: "UPDATE_EVACUATION_PLAN", payload: plan })}
        />
      )}
      {practiceTab === "numbers" && <EmergencyNumbers />}
    </div>
  );
}

// =============================================================================
// COMMUNITY VIEW
// =============================================================================

function CommunityView() {
  const { state } = useEducation();

  return (
    <div className="space-y-4">
      <ProgressDashboard
        progress={state.progress}
        courses={state.courses}
        badges={MOCK_BADGES}
      />
      <BadgeCollection
        progress={state.progress}
        badges={MOCK_BADGES}
      />
    </div>
  );
}

// =============================================================================
// INFO VIEW
// =============================================================================

function InfoView() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <h3 className="text-sm font-bold text-slate-200 mb-2">📖 Về Module Giáo dục</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Module Giáo dục & Nhận thức cung cấp kiến thức và kỹ năng sinh tồn cho người dân Việt Nam
          trước thiên tai. Nội dung được xây dựng dựa trên các chuẩn quốc tế: UNESCO CSS, UNICEF CC-DRR,
          IFRC, Nhật Bản Bousai Kyouiku.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h3 className="text-sm font-bold text-blue-400 mb-2">🎯 Mục tiêu học tập</h3>
        <ul className="space-y-1.5 text-xs text-blue-300/70">
          <li>• Nhận biết các loại thiên tai ở Việt Nam</li>
          <li>• Biết cách chuẩn bị và ứng phó khi có thiên tai</li>
          <li>• Có kỹ năng sơ cấp cứu cơ bản</li>
          <li>• Xây dựng kế hoạch phòng chống thiên tai gia đình</li>
          <li>• Hiết vai trò của cộng đồng trong PCTT</li>
        </ul>
      </div>

      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <h3 className="text-sm font-bold text-green-400 mb-2">📚 Nguồn tham khảo</h3>
        <ul className="space-y-1 text-xs text-green-300/70">
          <li>• UNESCO Comprehensive School Safety Framework</li>
          <li>• UNICEF Child-Centered DRR</li>
          <li>• IFRC Volunteer Training Curricula</li>
          <li>• Nhật Bản Bousai Kyouiku (防災教育)</li>
          <li>• FEMA Ready.gov</li>
          <li>• VNRC (Hội Chữ thập đỏ Việt Nam)</li>
        </ul>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <h3 className="text-sm font-bold text-slate-200 mb-2">💡 Mẹo học tập</h3>
        <ul className="space-y-1.5 text-xs text-slate-400">
          <li>• Học mỗi ngày 5 phút để duy trì chuỗi (streak)</li>
          <li>• Làm quiz sau mỗi bài học để củng cố kiến thức</li>
          <li>• Thử kịch bản để rèn luyện kỹ năng ra quyết định</li>
          <li>• Hoàn thành bộ đồ 72 giờ cho gia đình bạn</li>
          <li>• Chia sẻ kiến thức với gia đình và hàng xóm</li>
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE CONTENT
// =============================================================================

function EducationPageContent() {
  const { state, dispatch, showToast } = useEducation();

  // Toast dismiss
  const handleToastDismiss = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    },
    [dispatch]
  );

  // Tab change
  const handleTabChange = useCallback(
    (tab: EducationTab) => {
      dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
    },
    [dispatch]
  );

  // Render view
  const renderView = () => {
    switch (state.activeTab) {
      case "courses":
        return <CoursesView />;
      case "scenarios":
        return <ScenariosView />;
      case "quiz":
        return <QuizView />;
      case "practice":
        return <PracticeView />;
      case "community":
        return <CommunityView />;
      case "info":
        return <InfoView />;
      default:
        return <CoursesView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <EducationHeader
        activeTab={state.activeTab}
        onTabChange={handleTabChange}
        progress={state.progress}
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
            {renderView()}
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

export default function EducationPage() {
  return (
    <EducationProvider>
      <EducationPageContent />
    </EducationProvider>
  );
}
