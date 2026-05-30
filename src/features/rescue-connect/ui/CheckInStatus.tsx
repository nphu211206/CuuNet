"use client";

// =============================================================================
// CHECK-IN STATUS - Safety Check-in System (Safe & Well / ARC Inspired)
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - Donut chart showing check-in distribution
//   - Missing persons list (auto-generated)
//   - Check-in form (self + assisted)
//   - Status badges (safe/need_help/missing/evacuated/hospitalized)
//   - Family members tracking
//   - Stats summary cards
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Heart,
  Hospital,
  Users,
  UserPlus,
  Search,
  MapPin,
  Phone,
  Clock,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import type { CheckIn, CheckInStatus as CheckInStatusType, CheckInStatusProps } from "../lib/types";
import { CHECK_IN_STATUS_CONFIG } from "../config/rescue-config";

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
// DONUT CHART
// =============================================================================

function DonutChart({ stats }: { stats: CheckInStatusProps["stats"] }) {
  const total = stats.safe + stats.needHelp + stats.missing + stats.evacuated + stats.hospitalized;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
          <Shield className="w-10 h-10 text-slate-700" />
        </div>
        <p className="text-xs text-slate-500 mt-2">Chưa có check-in</p>
      </div>
    );
  }

  const segments = [
    { label: "An toàn", value: stats.safe, color: "#22C55E" },
    { label: "Cần giúp đỡ", value: stats.needHelp, color: "#F59E0B" },
    { label: "Mất tích", value: stats.missing, color: "#EF4444" },
    { label: "Đã sơ tán", value: stats.evacuated, color: "#3B82F6" },
    { label: "Nhập viện", value: stats.hospitalized, color: "#EC4899" },
  ].filter((s) => s.value > 0);

  const radius = 40;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-6">
      {/* SVG Donut */}
      <div className="relative">
        <svg width={100} height={100} className="-rotate-90">
          {segments.map((segment) => {
            const percent = (segment.value / total) * 100;
            const dashArray = (percent / 100) * circumference;
            const dashOffset = circumference - (cumulativePercent / 100) * circumference;
            cumulativePercent += percent;

            return (
              <motion.circle
                key={segment.label}
                cx={50}
                cy={50}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{total}</span>
          <span className="text-[9px] text-slate-500">tổng</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-[10px] text-slate-500 flex-1">{segment.label}</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: segment.color }}>
              {segment.value}
            </span>
            <span className="text-[9px] text-slate-600">
              ({Math.round((segment.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MISSING PERSONS LIST
// =============================================================================

function MissingPersonsList({ checkIns }: { checkIns: CheckIn[] }) {
  const missingPersons = useMemo(
    () => checkIns.filter((c) => c.status === "missing"),
    [checkIns]
  );

  const needHelpPersons = useMemo(
    () => checkIns.filter((c) => c.status === "need_help"),
    [checkIns]
  );

  if (missingPersons.length === 0 && needHelpPersons.length === 0) {
    return (
      <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400 font-medium">Không có người mất tích hoặc cần giúp đỡ</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Missing */}
      {missingPersons.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">
              Người mất tích ({missingPersons.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {missingPersons.slice(0, 5).map((person) => (
              <div key={person.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-400">
                  {person.personName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-slate-700 truncate block">{person.personName}</span>
                  <span className="text-[9px] text-slate-500">
                    {person.familyMembers} người thân • {person.phone || "Không có SĐT"}
                  </span>
                </div>
                <span className="text-[9px] text-red-400">Mất tích</span>
              </div>
            ))}
            {missingPersons.length > 5 && (
              <span className="text-[10px] text-red-400/70">+{missingPersons.length - 5} người nữa</span>
            )}
          </div>
        </div>
      )}

      {/* Need help */}
      {needHelpPersons.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">
              Cần giúp đỡ ({needHelpPersons.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {needHelpPersons.slice(0, 5).map((person) => (
              <div key={person.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
                  {person.personName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-slate-700 truncate block">{person.personName}</span>
                  {person.notes && <span className="text-[9px] text-slate-500">{person.notes}</span>}
                </div>
                <span className="text-[9px] text-amber-400">Cần giúp</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CHECK-IN FORM
// =============================================================================

function CheckInForm({
  incidents,
  onSubmit,
}: {
  incidents: CheckInStatusProps["incidents"];
  onSubmit: (checkIn: Omit<CheckIn, "id" | "checkedInAt">) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<CheckInStatusType>("safe");
  const [familyMembers, setFamilyMembers] = useState(0);
  const [notes, setNotes] = useState("");
  const [incidentId, setIncidentId] = useState(incidents.length > 0 ? incidents[0].id : "");

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onSubmit({
      personName: name.trim(),
      phone: phone.trim() || undefined,
      status,
      location: null,
      incidentId,
      familyMembers,
      notes: notes.trim() || undefined,
      checkedInBy: "self",
    });
    setName("");
    setPhone("");
    setStatus("safe");
    setFamilyMembers(0);
    setNotes("");
  }, [name, phone, status, incidentId, familyMembers, notes, onSubmit]);

  return (
    <div className="p-3 rounded-xl bg-white border border-slate-200">
      <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-blue-400" />
        Check-in mới
      </h4>

      <div className="space-y-2">
        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Họ tên *"
          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />

        {/* Phone */}
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Số điện thoại"
          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />

        {/* Status */}
        <div className="flex gap-1 flex-wrap">
          {(["safe", "need_help", "evacuated", "hospitalized"] as CheckInStatusType[]).map((s) => {
            const config = CHECK_IN_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors",
                  status === s
                    ? "border-blue-500/40 bg-blue-500/15 text-blue-400"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                )}
              >
                {config.icon} {config.labelVi}
              </button>
            );
          })}
        </div>

        {/* Family members */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Người thân đi cùng:</span>
          <button
            onClick={() => setFamilyMembers(Math.max(0, familyMembers - 1))}
            className="w-6 h-6 rounded bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
          >
            -
          </button>
          <span className="text-sm font-bold text-white w-6 text-center">{familyMembers}</span>
          <button
            onClick={() => setFamilyMembers(familyMembers + 1)}
            className="w-6 h-6 rounded bg-slate-200 text-slate-500 flex items-center justify-center text-xs"
          >
            +
          </button>
        </div>

        {/* Notes */}
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú (tình trạng sức khỏe, nhu cầu...)"
          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={clsx(
            "w-full py-2 rounded-lg text-xs font-semibold transition-colors",
            name.trim()
              ? "bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30"
              : "bg-slate-50 border border-slate-200 text-slate-600 cursor-not-allowed"
          )}
        >
          Check-in
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// CHECK-IN LIST
// =============================================================================

function CheckInList({ checkIns }: { checkIns: CheckIn[] }) {
  const recentCheckIns = useMemo(
    () => [...checkIns].sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()).slice(0, 20),
    [checkIns]
  );

  if (recentCheckIns.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-slate-700">Check-in gần đây</h4>
      {recentCheckIns.map((checkIn) => {
        const config = CHECK_IN_STATUS_CONFIG[checkIn.status];
        return (
          <div key={checkIn.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: `${config.color}15`, color: config.color }}
            >
              {checkIn.personName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-slate-700 truncate block">{checkIn.personName}</span>
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <span>{config.icon} {config.labelVi}</span>
                {checkIn.familyMembers > 0 && <span>• {checkIn.familyMembers} người thân</span>}
                <span>• {new Date(checkIn.checkedInAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function CheckInStatusComponent({
  checkIns,
  incidents,
  stats,
  onCheckInAdd,
  onCheckInUpdate,
  className,
}: CheckInStatusProps) {
  return (
    <div className={clsx("space-y-4", className)}>
      {/* Donut chart */}
      <div className="p-4 rounded-xl bg-white border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Tình trạng an toàn
        </h3>
        <DonutChart stats={stats} />
      </div>

      {/* Separated families */}
      {stats.separatedFamilies > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              {stats.separatedFamilies} gia đình bị ly tán
            </span>
          </div>
        </div>
      )}

      {/* Missing persons */}
      <MissingPersonsList checkIns={checkIns} />

      {/* Check-in form */}
      <CheckInForm incidents={incidents} onSubmit={onCheckInAdd} />

      {/* Recent check-ins */}
      <CheckInList checkIns={checkIns} />
    </div>
  );
}

export const CheckInStatus = memo(CheckInStatusComponent);
