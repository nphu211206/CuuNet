"use client";

// =============================================================================
// INCIDENT TIMELINE - Vertical Event Timeline (ICS Form 214 Inspired)
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - Vertical timeline with event cards
//   - Event type icons and colors
//   - Category filter (incident/task/resource/sos/system/checkin)
//   - Time grouping (today/yesterday/older)
//   - Actor display
//   - Related entity links
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Filter,
  ChevronDown,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Truck,
  HandHeart,
  Home,
  Siren,
  MessageSquare,
  FileText,
  Shield,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import type { TimelineEvent, TimelineEventType, IncidentTimelineProps } from "../lib/types";
import { TIMELINE_EVENT_TYPE_CONFIG } from "../config/rescue-config";

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

const eventVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

// =============================================================================
// CATEGORY FILTER
// =============================================================================

const CATEGORY_FILTERS: Array<{ id: TimelineEventType | "all"; label: string; icon: string }> = [
  { id: "all", label: "Tất cả", icon: "📋" },
  { id: "incident_created", label: "Sự cố", icon: "🔴" },
  { id: "task_created", label: "Nhiệm vụ", icon: "📋" },
  { id: "resource_deployed", label: "Tài nguyên", icon: "🚁" },
  { id: "sos_received", label: "SOS", icon: "🆘" },
  { id: "volunteer_assigned", label: "TNV", icon: "🤝" },
  { id: "shelter_opened", label: "Nơi trú ẩn", icon: "🏠" },
  { id: "status_update", label: "Hệ thống", icon: "🤖" },
  { id: "check_in", label: "Check-in", icon: "✅" },
];

// =============================================================================
// TIME GROUPING
// =============================================================================

function groupEventsByTime(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  for (const event of events) {
    const eventDate = new Date(event.timestamp);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    let label: string;
    if (eventDay.getTime() === today.getTime()) {
      label = "Hôm nay";
    } else if (eventDay.getTime() === yesterday.getTime()) {
      label = "Hôm qua";
    } else {
      label = eventDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    const existing = groups.get(label) || [];
    existing.push(event);
    groups.set(label, existing);
  }

  return groups;
}

// =============================================================================
// EVENT CARD
// =============================================================================

function EventCard({ event }: { event: TimelineEvent }) {
  const config = TIMELINE_EVENT_TYPE_CONFIG[event.type];

  return (
    <motion.div variants={eventVariants} className="flex gap-3 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2"
          style={{
            backgroundColor: `${config.color}15`,
            borderColor: `${config.color}40`,
          }}
        >
          {config.icon}
        </div>
        <div className="w-0.5 flex-1 bg-slate-800 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/30 group-hover:border-slate-600/50 transition-colors">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${config.color}15`, color: config.color }}
            >
              {config.labelVi}
            </span>
            <span className="text-[10px] text-slate-600">
              {new Date(event.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-xs font-medium text-slate-200 mb-0.5">{event.title}</h4>

          {/* Description */}
          {event.description && (
            <p className="text-[11px] text-slate-400 mb-1.5">{event.description}</p>
          )}

          {/* Actor */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <User className="w-3 h-3" />
            <span>{event.actorName}</span>
            {event.actorOrganization && (
              <>
                <span>•</span>
                <span>{event.actorOrganization}</span>
              </>
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

function IncidentTimelineComponent({
  events,
  incidents,
  filterType,
  onFilterChange,
  className,
}: IncidentTimelineProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  // Group by time
  const groupedEvents = useMemo(
    () => groupEventsByTime(filteredEvents),
    [filteredEvents]
  );

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">Dòng thời gian</h3>
          <span className="text-[10px] text-slate-500">({filteredEvents.length} sự kiện)</span>
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-[10px] font-medium hover:border-slate-600/50 transition-colors"
        >
          <Filter className="w-3 h-3" />
          Lọc
          <ChevronDown className={clsx("w-3 h-3 transition-transform", isFilterOpen && "rotate-180")} />
        </button>
      </div>

      {/* Filter row */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1 flex-wrap pb-1">
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = filterType === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={clsx(
                      "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium",
                      "transition-all duration-200 border",
                      isActive
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                        : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50"
                    )}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="w-8 h-8 text-slate-700 mb-2" />
          <p className="text-xs text-slate-500">Chưa có sự kiện nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from(groupedEvents.entries()).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[10px] font-semibold text-slate-400">{dateLabel}</span>
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[9px] text-slate-600">{dateEvents.length} sự kiện</span>
              </div>

              {/* Events */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {dateEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const IncidentTimeline = memo(IncidentTimelineComponent);
