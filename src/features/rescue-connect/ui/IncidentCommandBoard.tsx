"use client";

// =============================================================================
// INCIDENT COMMAND BOARD - ICS Org Chart Visualization
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// ICS (Incident Command System) organizational chart:
//   - Incident Commander (top)
//   - Command Staff (PIO, Safety, Liaison)
//   - General Staff (Operations, Planning, Logistics, Finance)
//   - Click to see details
//   - Transfer of command workflow
//   - Animated tree structure
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  User,
  Phone,
  Building2,
  Radio,
  HardHat,
  Handshake,
  BarChart3,
  ClipboardList,
  Truck,
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import type { Incident, ICSCommandStructure, IncidentCommandBoardProps } from "../lib/types";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

// =============================================================================
// ICS POSITION NODE
// =============================================================================

function ICSPositionNode({
  title,
  titleVi,
  icon,
  person,
  color,
  isCenter = false,
}: {
  title: string;
  titleVi: string;
  icon: React.ReactNode;
  person: ICSCommandStructure[keyof ICSCommandStructure];
  color: string;
  isCenter?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      variants={nodeVariants}
      className={clsx(
        "relative p-3 rounded-xl border transition-all duration-200 cursor-pointer",
        isCenter
          ? "bg-slate-100 border-slate-600/50 min-w-[200px]"
          : "bg-white border-slate-200 hover:border-slate-300 min-w-[160px]"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        <div>
          <h4 className="text-[10px] font-semibold text-slate-800">{titleVi}</h4>
          <p className="text-[8px] text-slate-500">{title}</p>
        </div>
      </div>

      {/* Person info */}
      {person ? (
        <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-800">{person.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">{person.organization}</span>
          </div>
          {person.phone && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500">{person.phone}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
          <span className="text-[10px] text-slate-600">Chưa phân công</span>
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function IncidentCommandBoardComponent({
  incident,
  onCommandUpdate,
  onTransferCommand,
  className,
}: IncidentCommandBoardProps) {
  const structure = incident.commandStructure;

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Sơ đồ chỉ huy ICS</h3>
            <p className="text-[10px] text-slate-500">{incident.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Incident Command System</span>
        </div>
      </div>

      {/* Org Chart */}
      <div className="flex flex-col items-center gap-3">
        {/* Incident Commander (top) */}
        <ICSPositionNode
          title="Incident Commander"
          titleVi="Chỉ huy trưởng"
          icon={<Shield className="w-4 h-4 text-amber-400" />}
          person={structure.incidentCommander}
          color="#F59E0B"
          isCenter
        />

        {/* Connector line */}
        <div className="w-0.5 h-4 bg-slate-700" />

        {/* Command Staff */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <ICSPositionNode
            title="Public Information Officer"
            titleVi="Sĩ quan thông tin"
            icon={<Radio className="w-4 h-4 text-blue-400" />}
            person={structure.publicInfoOfficer}
            color="#3B82F6"
          />
          <ICSPositionNode
            title="Safety Officer"
            titleVi="Sĩ quan an toàn"
            icon={<HardHat className="w-4 h-4 text-red-400" />}
            person={structure.safetyOfficer}
            color="#EF4444"
          />
          <ICSPositionNode
            title="Liaison Officer"
            titleVi="Sĩ quan liên lạc"
            icon={<Handshake className="w-4 h-4 text-purple-400" />}
            person={structure.liaisonOfficer}
            color="#8B5CF6"
          />
        </div>

        {/* Connector line */}
        <div className="w-0.5 h-4 bg-slate-700" />

        {/* Horizontal line */}
        <div className="w-3/4 h-0.5 bg-slate-700 mx-auto" />

        {/* General Staff (4 sections) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <ICSPositionNode
            title="Operations Section"
            titleVi="Ban thao tác"
            icon={<BarChart3 className="w-4 h-4 text-green-400" />}
            person={structure.operationsSectionChief}
            color="#22C55E"
          />
          <ICSPositionNode
            title="Planning Section"
            titleVi="Ban kế hoạch"
            icon={<ClipboardList className="w-4 h-4 text-cyan-400" />}
            person={structure.planningSectionChief}
            color="#06B6D4"
          />
          <ICSPositionNode
            title="Logistics Section"
            titleVi="Ban hậu cần"
            icon={<Truck className="w-4 h-4 text-orange-400" />}
            person={structure.logisticsSectionChief}
            color="#F97316"
          />
          <ICSPositionNode
            title="Finance/Admin"
            titleVi="Ban tài chính"
            icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
            person={structure.financeAdminChief}
            color="#10B981"
          />
        </div>
      </div>

      {/* Transfer Command */}
      <div className="p-3 rounded-xl bg-white border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-blue-400" />
          Chuyển quyền chỉ huy
        </h4>
        <p className="text-[10px] text-slate-500 mb-2">
          Theo ICS, chuyển quyền chỉ huy cần: thông báo cho tất cả section chiefs,
          brief IC mới bằng ICS 201, và radio announcement.
        </p>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-medium hover:bg-amber-500/25 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Chuyển quyền chỉ huy
        </button>
      </div>

      {/* IAP Status */}
      {incident.incidentActionPlan && (
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <h4 className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Kế hoạch hành động (IAP)
          </h4>
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-500">
              <span className="text-slate-500">Thời gian:</span>{" "}
              {new Date(incident.incidentActionPlan.operationalPeriod.start).toLocaleDateString("vi-VN")} -{" "}
              {new Date(incident.incidentActionPlan.operationalPeriod.end).toLocaleDateString("vi-VN")}
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Mục tiêu:</span>
              <ul className="mt-0.5 space-y-0.5">
                {incident.incidentActionPlan.objectives.map((obj, i) => (
                  <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] text-slate-500">
              <span className="text-slate-500">An toàn:</span>{" "}
              {incident.incidentActionPlan.safetyMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const IncidentCommandBoard = memo(IncidentCommandBoardComponent);
