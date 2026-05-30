"use client";

// =============================================================================
// PROGRESS DASHBOARD - Learning Progress & Skill Tree
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - XP progress bar with level display
//   - Skill tree radar chart (8 domains)
//   - Streak counter with fire animation
//   - Learning stats (lessons, courses, scenarios, quizzes)
//   - Strongest/weakest topic display
//   - Estimated time to next level
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Target,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Flame,
  Star,
  Trophy,
  Brain,
} from "lucide-react";
import clsx from "clsx";
import type { ProgressDashboardProps, LearningProgress } from "../lib/types";
import {
  LEVEL_CONFIG,
  COURSE_TOPIC_CONFIG,
  EDUCATION_ANIMATION,
} from "../config/education-config";
import {
  calculateLevel,
  getXPToNextLevel,
  getLevelProgressPercent,
  calculateLearningVelocity,
  estimateTimeToNextLevel,
  getLearningSummary,
  getCompetencyLevel,
  getStreakMessage,
} from "../lib/progress-tracker";

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
// LEVEL PROGRESS BAR
// =============================================================================

function LevelProgressBar({ progress }: { progress: LearningProgress }) {
  const currentLevel = calculateLevel(progress.xp);
  const nextLevel = LEVEL_CONFIG.find((l) => l.level === progress.level + 1);
  const xpToNext = getXPToNextLevel(progress.xp, progress.level);
  const percent = getLevelProgressPercent(progress.xp, progress.level);

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <div className="flex items-center gap-4">
        {/* Level icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            backgroundColor: `${currentLevel.color}20`,
            border: `2px solid ${currentLevel.color}40`,
          }}
        >
          {currentLevel.icon}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold" style={{ color: currentLevel.color }}>
              Level {currentLevel.level}
            </span>
            <span className="text-sm text-slate-500">- {currentLevel.nameVi}</span>
          </div>

          {/* XP bar */}
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: currentLevel.color }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">
              ⚡ {progress.xp.toLocaleString("vi-VN")} XP
            </span>
            {nextLevel && (
              <span className="text-slate-500">
                {xpToNext.toLocaleString("vi-VN")} XP đến Level {nextLevel.level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Level perks */}
      <div className="mt-3 flex flex-wrap gap-1">
        {currentLevel.perks.map((perk, i) => (
          <span
            key={i}
            className="text-[9px] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${currentLevel.color}15`,
              color: currentLevel.color,
            }}
          >
            {perk}
          </span>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// STREAK COUNTER
// =============================================================================

function StreakCounter({ streak }: { streak: LearningProgress["streak"] }) {
  const message = getStreakMessage(streak);

  return (
    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Flame className="w-8 h-8 text-orange-400" />
        </motion.div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-400">{streak.current}</span>
            <span className="text-xs text-orange-300">ngày liên tiếp</span>
          </div>
          <p className="text-[10px] text-orange-300/70">{message}</p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-[10px] text-slate-500 block">Kỷ lục</span>
          <span className="text-sm font-bold text-orange-400">{streak.longest}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SKILL TREE (SVG Radar Chart)
// =============================================================================

function SkillTree({ competencies }: { competencies: Record<string, number> }) {
  const topics = [
    { key: "flood", label: "Lũ lụt", icon: "🌊", color: "#3B82F6" },
    { key: "storm", label: "Bão", icon: "🌪️", color: "#8B5CF6" },
    { key: "landslide", label: "Sạt lở", icon: "⛰️", color: "#92400E" },
    { key: "first_aid", label: "Sơ cứu", icon: "🩹", color: "#EF4444" },
    { key: "family_plan", label: "Gia đình", icon: "👨‍👩‍👧", color: "#EC4899" },
    { key: "community", label: "Cộng đồng", icon: "🏘️", color: "#14B8A6" },
    { key: "health", label: "Sức khỏe", icon: "🏥", color: "#F97316" },
    { key: "emergency_numbers", label: "Khẩn cấp", icon: "📞", color: "#DC2626" },
  ];

  const size = 200;
  const center = size / 2;
  const maxRadius = 70;
  const angleStep = (2 * Math.PI) / topics.length;

  // Generate polygon points for user competency
  const userPoints = topics.map((topic, i) => {
    const score = competencies[topic.key] || 0;
    const radius = (score / 100) * maxRadius;
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  const userPath = userPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200">
      <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-400" />
        Cây kỹ năng
      </h4>

      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background circles */}
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <circle
              key={scale}
              cx={center}
              cy={center}
              r={maxRadius * scale}
              fill="none"
              stroke="rgba(148,163,184,0.1)"
              strokeWidth={0.5}
            />
          ))}

          {/* Axis lines */}
          {topics.map((topic, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x2 = center + maxRadius * Math.cos(angle);
            const y2 = center + maxRadius * Math.sin(angle);
            return (
              <line
                key={topic.key}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="rgba(148,163,184,0.1)"
                strokeWidth={0.5}
              />
            );
          })}

          {/* User competency polygon */}
          <motion.polygon
            points={userPath}
            fill="rgba(139,92,246,0.15)"
            stroke="#8B5CF6"
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ transformOrigin: `${center}px ${center}px` }}
          />

          {/* Data points */}
          {userPoints.map((point, i) => (
            <motion.circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={3}
              fill="#8B5CF6"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
            />
          ))}

          {/* Labels */}
          {topics.map((topic, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = maxRadius + 18;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            const score = competencies[topic.key] || 0;
            const level = getCompetencyLevel(score);

            return (
              <g key={topic.key}>
                <text
                  x={x}
                  y={y - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="#CBD5E1"
                >
                  {topic.icon}
                </text>
                <text
                  x={x}
                  y={y + 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill={level.color}
                  fontWeight={600}
                >
                  {score}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-1">
        {topics.map((topic) => {
          const score = competencies[topic.key] || 0;
          const level = getCompetencyLevel(score);
          return (
            <div key={topic.key} className="flex items-center gap-1.5 text-[10px]">
              <span>{topic.icon}</span>
              <span className="text-slate-500">{topic.label}</span>
              <span className="ml-auto font-bold" style={{ color: level.color }}>
                {level.labelVi}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// LEARNING STATS GRID
// =============================================================================

function LearningStatsGrid({ progress }: { progress: LearningProgress }) {
  const summary = getLearningSummary(progress);
  const velocity = calculateLearningVelocity(progress);
  const timeEstimate = estimateTimeToNextLevel(progress, velocity);

  const stats = [
    { label: "Bài học", value: summary.totalLessons, icon: <BookOpen className="w-4 h-4" />, color: "#3B82F6" },
    { label: "Khóa học", value: summary.totalCourses, icon: <Award className="w-4 h-4" />, color: "#22C55E" },
    { label: "Kịch bản", value: summary.totalScenarios, icon: <Target className="w-4 h-4" />, color: "#8B5CF6" },
    { label: "Quiz", value: summary.totalQuizzes, icon: <Brain className="w-4 h-4" />, color: "#F59E0B" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={cardVariants}
          className="p-3 rounded-xl bg-white border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: stat.color }}>{stat.icon}</span>
            <span className="text-[10px] text-slate-500">{stat.label}</span>
          </div>
          <span className="text-xl font-bold" style={{ color: stat.color }}>
            {stat.value}
          </span>
        </motion.div>
      ))}

      {/* Velocity */}
      <motion.div
        variants={cardVariants}
        className="p-3 rounded-xl bg-white border border-slate-200"
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] text-slate-500">Tốc độ</span>
        </div>
        <span className="text-xl font-bold text-cyan-400">{velocity}</span>
        <span className="text-[10px] text-slate-500 ml-1">XP/ngày</span>
      </motion.div>

      {/* Time to next level */}
      <motion.div
        variants={cardVariants}
        className="p-3 rounded-xl bg-white border border-slate-200"
      >
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] text-slate-500">Lên cấp tiếp</span>
        </div>
        <span className="text-sm font-bold text-amber-400">{timeEstimate.estimate}</span>
      </motion.div>
    </div>
  );
}

// =============================================================================
// STRONGEST/WEAKEST TOPIC
// =============================================================================

function TopicHighlights({ progress }: { progress: LearningProgress }) {
  const summary = getLearningSummary(progress);
  const strongestLevel = getCompetencyLevel(progress.competencies[summary.strongestTopic] || 0);
  const weakestLevel = getCompetencyLevel(progress.competencies[summary.weakestTopic] || 0);

  const getTopicLabel = (key: string) => {
    const config = COURSE_TOPIC_CONFIG[key as keyof typeof COURSE_TOPIC_CONFIG];
    return config?.labelVi || key;
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
        <span className="text-[10px] text-green-400 block mb-1">💪 Mạnh nhất</span>
        <span className="text-sm font-bold text-green-400">
          {getTopicLabel(summary.strongestTopic)}
        </span>
        <span className="text-[10px] text-green-300 block">{strongestLevel.labelVi}</span>
      </div>
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <span className="text-[10px] text-amber-400 block mb-1">📚 Cần cải thiện</span>
        <span className="text-sm font-bold text-amber-400">
          {getTopicLabel(summary.weakestTopic)}
        </span>
        <span className="text-[10px] text-amber-300 block">{weakestLevel.labelVi}</span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ProgressDashboardComponent({ progress, courses, badges, className }: ProgressDashboardProps) {
  return (
    <div className={clsx("space-y-4", className)}>
      {/* Level progress */}
      <LevelProgressBar progress={progress} />

      {/* Streak */}
      <StreakCounter streak={progress.streak} />

      {/* Learning stats */}
      <LearningStatsGrid progress={progress} />

      {/* Skill tree */}
      <SkillTree competencies={progress.competencies} />

      {/* Strongest/weakest */}
      <TopicHighlights progress={progress} />

      {/* Badge count */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
        <Trophy className="w-6 h-6 text-purple-400" />
        <div>
          <span className="text-sm font-bold text-purple-400">{progress.badges.length}</span>
          <span className="text-[10px] text-purple-300 ml-1">huy hiệu đã đạt</span>
        </div>
        <span className="text-[10px] text-slate-500 ml-auto">
          / {badges.length} tổng
        </span>
      </div>
    </div>
  );
}

export const ProgressDashboard = memo(ProgressDashboardComponent);
