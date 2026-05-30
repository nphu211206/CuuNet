"use client";

// =============================================================================
// COURSE BROWSER - Course List with Progress
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - Course cards with progress bars
//   - Level badges
//   - Lock/unlock status
//   - Estimated time display
//   - XP reward display
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lock, Clock, Star, ChevronRight, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import type { Course, CourseBrowserProps } from "../lib/types";
import { COURSE_TOPIC_CONFIG, EDUCATION_ANIMATION, LEVEL_CONFIG } from "../config/education-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35 },
  },
};

// =============================================================================
// PROGRESS BAR
// =============================================================================

function CourseProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-slate-500">Tiến trình</span>
        <span className="text-[10px] font-bold" style={{ color }}>{percent}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// COURSE CARD
// =============================================================================

function CourseCard({
  course,
  progress,
  isUnlocked,
  onSelect,
}: {
  course: Course;
  progress: { completed: number; total: number; percent: number };
  isUnlocked: boolean;
  onSelect: (course: Course) => void;
}) {
  const topicConfig = COURSE_TOPIC_CONFIG[course.topic];
  const levelConfig = LEVEL_CONFIG.find((l) => l.level === course.level);
  const isCompleted = progress.percent === 100;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={isUnlocked ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
      whileTap={isUnlocked ? { scale: 0.98 } : undefined}
      onClick={() => isUnlocked && onSelect(course)}
      className={clsx(
        "relative overflow-hidden rounded-xl p-4 border transition-all duration-200",
        isUnlocked
          ? "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
          : "bg-white border-slate-200 opacity-60 cursor-not-allowed"
      )}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-10 rounded-xl"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${course.color}40 0%, transparent 70%)` }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: `${course.color}20`, border: `1px solid ${course.color}30` }}
          >
            {isCompleted ? "✅" : isUnlocked ? topicConfig.icon : "🔒"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{course.titleVi}</h3>
            <p className="text-[10px] text-slate-500 line-clamp-1">{course.descriptionVi}</p>
          </div>
          {isUnlocked && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {course.lessons.length} bài
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.estimatedMinutes} phút
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" style={{ color: levelConfig?.color }} />
            {levelConfig?.nameVi}
          </span>
          <span className="flex items-center gap-1">
            ⚡ {course.totalXP} XP
          </span>
        </div>

        {/* Progress */}
        {isUnlocked && <CourseProgressBar percent={progress.percent} color={course.color} />}

        {/* Lock overlay */}
        {!isUnlocked && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
            <Lock className="w-3 h-3" />
            <span>Hoàn thành khóa tiên quyết để mở khóa</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function CourseBrowserComponent({ courses, progress, onCourseSelect, className }: CourseBrowserProps) {
  const coursesWithProgress = useMemo(() => {
    return courses.map((course) => {
      const completed = course.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
      const total = course.lessons.length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { course, completed, total, percent };
    });
  }, [courses, progress.completedLessons]);

  const handleSelect = useCallback(
    (course: Course) => {
      onCourseSelect(course);
    },
    [onCourseSelect]
  );

  // Group by level
  const groupedByLevel = useMemo(() => {
    const groups = new Map<number, typeof coursesWithProgress>();
    for (const item of coursesWithProgress) {
      const level = item.course.level;
      const existing = groups.get(level) || [];
      existing.push(item);
      groups.set(level, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [coursesWithProgress]);

  return (
    <div className={clsx("space-y-4", className)}>
      {groupedByLevel.map(([level, items]) => {
        const levelConfig = LEVEL_CONFIG.find((l) => l.level === level);
        return (
          <div key={level}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{levelConfig?.icon}</span>
              <h3 className="text-sm font-semibold text-slate-800">
                {levelConfig?.nameVi} - Level {level}
              </h3>
              <span className="text-[10px] text-slate-500">
                ({items.filter((i) => i.percent === 100).length}/{items.length} hoàn thành)
              </span>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
            >
              {items.map(({ course, completed, total, percent }) => {
                const isUnlocked = course.prerequisites.length === 0 ||
                  course.prerequisites.every((p) => progress.completedCourses.includes(p));
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={{ completed, total, percent }}
                    isUnlocked={isUnlocked}
                    onSelect={handleSelect}
                  />
                );
              })}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export const CourseBrowser = memo(CourseBrowserComponent);

// =============================================================================
// LESSON VIEWER
// =============================================================================

function LessonViewerComponent({ lesson, course, isCompleted, onComplete, onBack, className }: {
  lesson: import("../lib/types").Lesson;
  course: Course;
  isCompleted: boolean;
  onComplete: (lessonId: string) => void;
  onBack: () => void;
  className?: string;
}) {
  const topicConfig = COURSE_TOPIC_CONFIG[course.topic];

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-medium hover:border-slate-300 transition-colors"
      >
        ← Quay lại {course.titleVi}
      </button>

      {/* Lesson header */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${course.color}20` }}
          >
            {topicConfig.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{lesson.titleVi}</h2>
            <p className="text-[10px] text-slate-500">Bài {lesson.order} • {lesson.estimatedMinutes} phút • ⚡ {lesson.xpReward} XP</p>
          </div>
        </div>
      </div>

      {/* Hook */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-300 italic">💡 {lesson.content.hook}</p>
      </div>

      {/* Sections */}
      {lesson.content.sections.map((section, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="p-4 rounded-xl bg-white border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-2">
            {section.icon && <span className="text-base">{section.icon}</span>}
            <h3 className="text-sm font-semibold text-slate-800">{section.titleVi}</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{section.content}</p>
          {section.tips && section.tips.length > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
              <p className="text-[10px] font-medium text-blue-400 mb-1">💡 Mẹo:</p>
              <ul className="space-y-0.5">
                {section.tips.map((tip, j) => (
                  <li key={j} className="text-[10px] text-blue-300/70">• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      ))}

      {/* Takeaway */}
      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <p className="text-xs font-medium text-green-400 mb-1">📌 Điểm ghi nhớ:</p>
        <p className="text-xs text-green-300">{lesson.content.takeaway}</p>
      </div>

      {/* Complete button */}
      {!isCompleted ? (
        <button
          onClick={() => onComplete(lesson.id)}
          className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-colors"
        >
          ✅ Hoàn thành bài học (+{lesson.xpReward} XP)
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-green-400 font-medium">Đã hoàn thành!</p>
        </div>
      )}
    </div>
  );
}

export const LessonViewer = memo(LessonViewerComponent);
