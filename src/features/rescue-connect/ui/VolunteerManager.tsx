"use client";

// =============================================================================
// VOLUNTEER MANAGER - Volunteer Lifecycle Management (IFRC Inspired)
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - Volunteer list with cards
//   - Skills matching search
//   - Status filter (available/deployed/off_duty/unavailable)
//   - Type filter (registered/spontaneous/professional)
//   - Skill badges
//   - Experience & rating display
//   - Assign/Release actions
//   - Stats summary
//   - Animated entrance with stagger
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HandHeart,
  Search,
  Star,
  MapPin,
  Phone,
  Clock,
  Award,
  Shield,
  CheckCircle2,
  Users,
  Filter,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import type { Volunteer, VolunteerType, VolunteerStatus, VolunteerSkill, VolunteerManagerProps } from "../lib/types";
import {
  VOLUNTEER_TYPE_CONFIG,
  VOLUNTEER_STATUS_CONFIG,
  VOLUNTEER_SKILL_CONFIG,
} from "../config/rescue-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// =============================================================================
// SKILL BADGES
// =============================================================================

function SkillBadges({ skills }: { skills: VolunteerSkill[] }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {skills.slice(0, 5).map((skill) => {
        const config = VOLUNTEER_SKILL_CONFIG[skill];
        if (!config) return null;
        return (
          <span
            key={skill}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
          >
            {config.icon} {config.labelVi}
          </span>
        );
      })}
      {skills.length > 5 && (
        <span className="text-[8px] text-slate-600 px-1 py-0.5">+{skills.length - 5}</span>
      )}
    </div>
  );
}

// =============================================================================
// RATING STARS
// =============================================================================

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={clsx("w-3 h-3", i < rating ? "text-amber-400 fill-amber-400" : "text-slate-700")}
        />
      ))}
    </div>
  );
}

// =============================================================================
// VOLUNTEER CARD
// =============================================================================

function VolunteerCard({
  volunteer,
  incidents,
  onAssign,
  onRelease,
}: {
  volunteer: Volunteer;
  incidents: VolunteerManagerProps["incidents"];
  onAssign: (volunteerId: string, incidentId: string) => void;
  onRelease: (volunteerId: string) => void;
}) {
  const typeConfig = VOLUNTEER_TYPE_CONFIG[volunteer.type];
  const statusConfig = VOLUNTEER_STATUS_CONFIG[volunteer.status];
  const canAssign = volunteer.status === "available";
  const canRelease = volunteer.status === "deployed";

  const assignedIncident = volunteer.assignedIncidentId
    ? incidents.find((i) => i.id === volunteer.assignedIncidentId)
    : null;

  return (
    <motion.div
      variants={cardVariants}
      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            backgroundColor: `${statusConfig.color}15`,
            color: statusConfig.color,
            border: `2px solid ${statusConfig.color}30`,
          }}
        >
          {volunteer.name.charAt(0)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-xs font-semibold text-slate-800 truncate">{volunteer.name}</h4>
            {volunteer.isVerified && (
              <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color }}
            >
              {statusConfig.labelVi}
            </span>
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
            >
              {typeConfig.labelVi}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {volunteer.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {volunteer.location.province}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {volunteer.experience} lần
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {volunteer.totalHours}h
            </span>
            <RatingStars rating={volunteer.rating} />
          </div>

          {/* Skills */}
          <SkillBadges skills={volunteer.skills} />

          {/* Certifications */}
          {volunteer.certifications.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Award className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] text-amber-400">{volunteer.certifications.join(", ")}</span>
            </div>
          )}

          {/* Assigned incident */}
          {assignedIncident && (
            <div className="mt-1.5 p-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
              <p className="text-[10px] text-blue-400">🤝 {assignedIncident.title}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
            {canAssign && (
              <button
                onClick={() => {
                  const activeIncident = incidents.find((i) => i.status === "active");
                  if (activeIncident) onAssign(volunteer.id, activeIncident.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-medium hover:bg-purple-500/25 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Phân công
              </button>
            )}
            {canRelease && (
              <button
                onClick={() => onRelease(volunteer.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-medium hover:bg-green-500/25 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Nghỉ
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function VolunteerManagerComponent({
  volunteers,
  incidents,
  tasks,
  onVolunteerAdd,
  onVolunteerUpdate,
  onVolunteerAssign,
  onVolunteerRelease,
  className,
}: VolunteerManagerProps) {
  const [statusFilter, setStatusFilter] = useState<VolunteerStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<VolunteerType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<VolunteerSkill | "all">("all");

  const filteredVolunteers = useMemo(() => {
    let filtered = [...volunteers];

    if (statusFilter !== "all") filtered = filtered.filter((v) => v.status === statusFilter);
    if (typeFilter !== "all") filtered = filtered.filter((v) => v.type === typeFilter);
    if (skillFilter !== "all") filtered = filtered.filter((v) => v.skills.includes(skillFilter));
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.phone.includes(query) ||
          v.location.province.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [volunteers, statusFilter, typeFilter, skillFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: volunteers.length,
    available: volunteers.filter((v) => v.status === "available").length,
    deployed: volunteers.filter((v) => v.status === "deployed").length,
    verified: volunteers.filter((v) => v.isVerified).length,
  }), [volunteers]);

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Tổng", value: stats.total, color: "#3B82F6" },
          { label: "Sẵn sàng", value: stats.available, color: "#22C55E" },
          { label: "Đang làm", value: stats.deployed, color: "#F59E0B" },
          { label: "Xác minh", value: stats.verified, color: "#8B5CF6" },
        ].map((stat) => (
          <div key={stat.label} className="p-2 rounded-xl bg-white border border-slate-200 text-center">
            <span className="text-lg font-bold block" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-[9px] text-slate-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên, SĐT, tỉnh..."
          className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="space-y-1.5">
        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {[{ id: "all" as const, label: "Tất cả", icon: "📋" },
            ...Object.entries(VOLUNTEER_STATUS_CONFIG).map(([id, config]) => ({
              id: id as VolunteerStatus,
              label: config.labelVi,
              icon: config.icon,
            })),
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={clsx(
                "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium",
                "transition-all duration-200 border whitespace-nowrap",
                statusFilter === filter.id
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Skill filter */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {[{ id: "all" as const, label: "Tất cả kỹ năng", icon: "🔧" },
            ...Object.entries(VOLUNTEER_SKILL_CONFIG).map(([id, config]) => ({
              id: id as VolunteerSkill,
              label: config.labelVi,
              icon: config.icon,
            })),
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSkillFilter(filter.id)}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium",
                "transition-all duration-200 border whitespace-nowrap",
                skillFilter === filter.id
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-400"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Volunteer list */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
      >
        {filteredVolunteers.length === 0 ? (
          <div className="md:col-span-2 flex flex-col items-center justify-center py-12 text-center">
            <HandHeart className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">Không tìm thấy tình nguyện viên</p>
          </div>
        ) : (
          filteredVolunteers.map((vol) => (
            <VolunteerCard
              key={vol.id}
              volunteer={vol}
              incidents={incidents}
              onAssign={onVolunteerAssign}
              onRelease={onVolunteerRelease}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}

export const VolunteerManager = memo(VolunteerManagerComponent);
