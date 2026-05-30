"use client";

// =============================================================================
// SHELTER MANAGER - Shelter Management with Occupancy Gauges
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - Shelter cards with SVG occupancy gauges
//   - Capacity tracking (max/current/reserved)
//   - Needs assessment badges
//   - Special needs tracking (elderly/children/disabled/pregnant)
//   - Check-in/Check-out actions
//   - Status filter (open/full/closed/preparing)
//   - Type filter (evacuation/temporary/transitional/permanent/medical)
//   - Animated entrance with stagger
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  MapPin,
  Phone,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Utensils,
  Shirt,
  Bed,
  Zap,
  Wifi,
  Heart,
} from "lucide-react";
import clsx from "clsx";
import type { Shelter, ShelterType, ShelterStatus, ShelterNeed, ShelterManagerProps } from "../lib/types";
import {
  SHELTER_TYPE_CONFIG,
  SHELTER_STATUS_CONFIG,
  SHELTER_NEED_CONFIG,
  SHELTER_OCCUPANCY_THRESHOLDS,
} from "../config/rescue-config";

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
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// =============================================================================
// OCCUPANCY GAUGE (SVG Circular)
// =============================================================================

function OccupancyGauge({ current, max }: { current: number; max: number }) {
  const percent = max > 0 ? Math.round((current / max) * 100) : 0;
  const radius = 28;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  let color: string = SHELTER_OCCUPANCY_THRESHOLDS.low.color;
  if (percent >= 95) color = SHELTER_OCCUPANCY_THRESHOLDS.critical.color;
  else if (percent >= 80) color = SHELTER_OCCUPANCY_THRESHOLDS.high.color;
  else if (percent >= 50) color = SHELTER_OCCUPANCY_THRESHOLDS.medium.color;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={64} height={64} className="-rotate-90">
        <circle cx={32} cy={32} r={radius} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={4} />
        <motion.circle
          cx={32} cy={32} r={radius}
          fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black tabular-nums" style={{ color }}>{percent}%</span>
        <span className="text-[7px] text-slate-600">{current}/{max}</span>
      </div>
    </div>
  );
}

// =============================================================================
// NEEDS BADGES
// =============================================================================

function NeedsBadges({ needs }: { needs: ShelterNeed[] }) {
  if (needs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {needs.map((need) => {
        const config = SHELTER_NEED_CONFIG[need];
        return (
          <span
            key={need}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
          >
            {config.icon} {config.labelVi}
          </span>
        );
      })}
    </div>
  );
}

// =============================================================================
// SPECIAL NEEDS DISPLAY
// =============================================================================

function SpecialNeedsDisplay({ specialNeeds }: { specialNeeds: Shelter["specialNeeds"] }) {
  const items = [
    { label: "Người già", count: specialNeeds.elderly, icon: "👴", color: "#8B5CF6" },
    { label: "Trẻ em", count: specialNeeds.children, icon: "👶", color: "#F59E0B" },
    { label: "Khuyết tật", count: specialNeeds.disabled, icon: "♿", color: "#3B82F6" },
    { label: "Thai phụ", count: specialNeeds.pregnant, icon: "🤰", color: "#EC4899" },
  ].filter((item) => item.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200"
        >
          <span className="text-xs">{item.icon}</span>
          <span className="text-[9px] text-slate-500 flex-1">{item.label}</span>
          <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SHELTER CARD
// =============================================================================

function ShelterCard({
  shelter,
  onCheckIn,
  onCheckOut,
}: {
  shelter: Shelter;
  onCheckIn: (id: string, count: number) => void;
  onCheckOut: (id: string, count: number) => void;
}) {
  const typeConfig = SHELTER_TYPE_CONFIG[shelter.type];
  const statusConfig = SHELTER_STATUS_CONFIG[shelter.status];
  const available = shelter.capacity.max - shelter.capacity.current;
  const canCheckIn = shelter.status === "open" && available > 0;
  const canCheckOut = shelter.capacity.current > 0;

  return (
    <motion.div
      variants={cardVariants}
      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Occupancy gauge */}
        <OccupancyGauge current={shelter.capacity.current} max={shelter.capacity.max} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm">{typeConfig.icon}</span>
            <h4 className="text-xs font-semibold text-slate-800 truncate">{shelter.name}</h4>
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

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {shelter.location.district}, {shelter.location.province}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {shelter.contactPhone}
            </span>
          </div>

          {/* Capacity bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-500">Sức chứa</span>
              <span className="text-[9px] font-medium text-slate-500">
                {shelter.capacity.current}/{shelter.capacity.max}
                {shelter.capacity.reserved > 0 && (
                  <span className="text-slate-600"> (+{shelter.capacity.reserved} dự trữ)</span>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${shelter.capacity.max > 0 ? (shelter.capacity.current / shelter.capacity.max) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: shelter.capacity.current / shelter.capacity.max >= 0.95
                    ? "#EF4444"
                    : shelter.capacity.current / shelter.capacity.max >= 0.8
                      ? "#F97316"
                      : "#22C55E",
                }}
              />
            </div>
          </div>

          {/* Needs */}
          <NeedsBadges needs={shelter.needs} />

          {/* Special needs */}
          <SpecialNeedsDisplay specialNeeds={shelter.specialNeeds} />

          {/* Check-in/out buttons */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
            {canCheckIn && (
              <button
                onClick={() => onCheckIn(shelter.id, 1)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-medium hover:bg-green-500/25 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Check-in (+1)
              </button>
            )}
            {canCheckOut && (
              <button
                onClick={() => onCheckOut(shelter.id, 1)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/15 border border-slate-500/30 text-slate-500 text-[10px] font-medium hover:bg-slate-500/25 transition-colors"
              >
                <Minus className="w-3 h-3" />
                Check-out (-1)
              </button>
            )}
            <span className="text-[9px] text-slate-600 ml-auto">
              {shelter.managedBy}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ShelterManagerComponent({
  shelters,
  incidents,
  onShelterAdd,
  onShelterUpdate,
  onCheckIn,
  onCheckOut,
  className,
}: ShelterManagerProps) {
  const [statusFilter, setStatusFilter] = useState<ShelterStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ShelterType | "all">("all");

  const filteredShelters = useMemo(() => {
    let filtered = [...shelters];
    if (statusFilter !== "all") filtered = filtered.filter((s) => s.status === statusFilter);
    if (typeFilter !== "all") filtered = filtered.filter((s) => s.type === typeFilter);
    return filtered;
  }, [shelters, statusFilter, typeFilter]);

  // Stats
  const totalCapacity = useMemo(() => shelters.reduce((sum, s) => sum + s.capacity.max, 0), [shelters]);
  const totalOccupied = useMemo(() => shelters.reduce((sum, s) => sum + s.capacity.current, 0), [shelters]);
  const openCount = useMemo(() => shelters.filter((s) => s.status === "open").length, [shelters]);

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
          <span className="text-lg font-bold text-cyan-400 block">{openCount}</span>
          <span className="text-[9px] text-slate-500">Đang mở</span>
        </div>
        <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
          <span className="text-lg font-bold text-white block">{totalOccupied.toLocaleString()}</span>
          <span className="text-[9px] text-slate-500">Đang ở</span>
        </div>
        <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
          <span className="text-lg font-bold text-green-400 block">{totalCapacity.toLocaleString()}</span>
          <span className="text-[9px] text-slate-500">Sức chứa</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {[{ id: "all" as const, label: "Tất cả", icon: "📋" },
          ...Object.entries(SHELTER_STATUS_CONFIG).map(([id, config]) => ({
            id: id as ShelterStatus,
            label: config.labelVi,
            icon: config.icon,
          })),
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium",
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

      {/* Shelter grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
      >
        {filteredShelters.map((shelter) => (
          <ShelterCard
            key={shelter.id}
            shelter={shelter}
            onCheckIn={onCheckIn}
            onCheckOut={onCheckOut}
          />
        ))}
      </motion.div>
    </div>
  );
}

export const ShelterManager = memo(ShelterManagerComponent);
