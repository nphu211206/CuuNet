"use client";

// =============================================================================
// BADGE COLLECTION - Badge Display + Leaderboard
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - Badge grid with rarity colors
//   - Lock/unlock status
//   - Progress bars for unearned badges
//   - Category filter
//   - Leaderboard with rankings
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Lock, Medal, Crown, Award, Users } from "lucide-react";
import clsx from "clsx";
import type { Badge, BadgeCollectionProps, LeaderboardProps, LeaderboardEntry, UserLevel } from "../lib/types";
import {
  BADGE_CATEGORY_CONFIG,
  LEVEL_CONFIG,
} from "../config/education-config";
import { getBadgeProgress, getRarityColor, getBadgesByCategory } from "../lib/progress-tracker";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 15 },
  },
};

// =============================================================================
// BADGE CARD
// =============================================================================

function BadgeCard({
  badge,
  isEarned,
  progress,
}: {
  badge: Badge;
  isEarned: boolean;
  progress: { current: number; target: number; percent: number };
}) {
  const rarityColor = getRarityColor(badge.rarity);

  return (
    <motion.div
      variants={badgeVariants}
      whileHover={isEarned ? { scale: 1.05, transition: { duration: 0.15 } } : undefined}
      className={clsx(
        "relative p-3 rounded-xl border transition-all duration-200",
        isEarned
          ? "bg-slate-900/60 border-slate-700/40"
          : "bg-slate-900/20 border-slate-800/30 opacity-60"
      )}
    >
      {/* Rarity glow */}
      {isEarned && (
        <div
          className="absolute inset-0 opacity-10 rounded-xl"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${rarityColor}40 0%, transparent 70%)` }}
        />
      )}

      <div className="relative z-10 text-center">
        {/* Icon */}
        <div
          className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl mb-2"
          style={{
            backgroundColor: isEarned ? `${badge.color}20` : "rgba(100,116,139,0.1)",
            border: `1px solid ${isEarned ? `${badge.color}30` : "rgba(100,116,139,0.2)"}`,
          }}
        >
          {isEarned ? badge.icon : <Lock className="w-5 h-5 text-slate-600" />}
        </div>

        {/* Name */}
        <h4 className={clsx("text-[11px] font-semibold", isEarned ? "text-slate-200" : "text-slate-600")}>
          {badge.nameVi}
        </h4>

        {/* Rarity */}
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block"
          style={{
            backgroundColor: `${rarityColor}15`,
            color: rarityColor,
          }}
        >
          {badge.rarity.toUpperCase()}
        </span>

        {/* XP reward */}
        {isEarned && (
          <span className="text-[9px] text-amber-400 block mt-1">+{badge.xpReward} XP</span>
        )}

        {/* Progress bar for unearned */}
        {!isEarned && progress.target > 0 && (
          <div className="mt-2">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-600"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-600 mt-0.5 block">
              {progress.current}/{progress.target}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// BADGE COLLECTION COMPONENT
// =============================================================================

function BadgeCollectionComponent({ progress, badges, className }: BadgeCollectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const earnedBadgeIds = useMemo(() => new Set(progress.badges), [progress.badges]);

  const filteredBadges = useMemo(() => {
    if (categoryFilter === "all") return badges;
    return badges.filter((b) => b.category === categoryFilter);
  }, [badges, categoryFilter]);

  const earnedCount = badges.filter((b) => earnedBadgeIds.has(b.id)).length;

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">Bộ sưu tập huy hiệu</h3>
        </div>
        <span className="text-[10px] text-slate-500">
          {earnedCount}/{badges.length} đã đạt
        </span>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setCategoryFilter("all")}
          className={clsx(
            "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors whitespace-nowrap",
            categoryFilter === "all"
              ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
              : "bg-slate-800/30 border-slate-700/30 text-slate-500"
          )}
        >
          Tất cả
        </button>
        {Object.entries(BADGE_CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors whitespace-nowrap",
              categoryFilter === key
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500"
            )}
          >
            {config.icon} {config.labelVi}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2"
      >
        {filteredBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const progressData = getBadgeProgress(badge, progress);
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              isEarned={isEarned}
              progress={progressData}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

export const BadgeCollection = memo(BadgeCollectionComponent);

// =============================================================================
// LEADERBOARD COMPONENT
// =============================================================================

function LeaderboardComponent({ entries, currentUserId, className }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-slate-500 w-4 text-center">{rank}</span>;
  };

  const getLevelConfig = (level: UserLevel) => {
    return LEVEL_CONFIG.find((l) => l.level === level) || LEVEL_CONFIG[0];
  };

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200">Bảng xếp hạng</h3>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3 py-4">
          {/* 2nd place */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-slate-300/10 border-2 border-slate-300/30 flex items-center justify-center text-lg mb-1">
              {entries[1].displayName.charAt(0)}
            </div>
            <span className="text-[10px] text-slate-400 block">{entries[1].displayName}</span>
            <span className="text-xs font-bold text-slate-300">{entries[1].xp.toLocaleString()} XP</span>
            <div className="w-16 h-12 bg-slate-300/10 rounded-t-lg mt-1 flex items-center justify-center">
              <span className="text-lg">🥈</span>
            </div>
          </div>

          {/* 1st place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 border-2 border-yellow-400/30 flex items-center justify-center text-xl mb-1">
              {entries[0].displayName.charAt(0)}
            </div>
            <span className="text-[10px] text-yellow-400 block">{entries[0].displayName}</span>
            <span className="text-sm font-bold text-yellow-400">{entries[0].xp.toLocaleString()} XP</span>
            <div className="w-16 h-16 bg-yellow-400/10 rounded-t-lg mt-1 flex items-center justify-center">
              <span className="text-xl">🥇</span>
            </div>
          </div>

          {/* 3rd place */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-600/10 border-2 border-amber-600/30 flex items-center justify-center mb-1">
              {entries[2].displayName.charAt(0)}
            </div>
            <span className="text-[10px] text-slate-400 block">{entries[2].displayName}</span>
            <span className="text-xs font-bold text-amber-600">{entries[2].xp.toLocaleString()} XP</span>
            <div className="w-16 h-10 bg-amber-600/10 rounded-t-lg mt-1 flex items-center justify-center">
              <span className="text-base">🥉</span>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="space-y-1">
        {entries.map((entry, i) => {
          const isCurrentUser = entry.userId === currentUserId;
          const levelConfig = getLevelConfig(entry.level);

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={clsx(
                "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                isCurrentUser
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "bg-slate-900/30 border border-slate-700/20"
              )}
            >
              {/* Rank */}
              <div className="w-6 flex justify-center">{getRankIcon(entry.rank)}</div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `${levelConfig.color}20`,
                  color: levelConfig.color,
                }}
              >
                {entry.displayName.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {entry.displayName}
                  </span>
                  <span className="text-[9px]">{levelConfig.icon}</span>
                  {isCurrentUser && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      Bạn
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>🏅 {entry.badges} huy hiệu</span>
                  <span>🔥 {entry.streak} ngày</span>
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <span className="text-sm font-bold text-amber-400">{entry.xp.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 block">XP</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export const Leaderboard = memo(LeaderboardComponent);
