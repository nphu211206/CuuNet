"use client";

// =============================================================================
// EVACUATION PLANNER - Family Evacuation Plan Builder
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - Family member management
//   - 4-level meeting points
//   - Emergency contacts list
//   - Special needs tracking
//   - Plan completion checklist
//   - Printable format
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MapPin,
  Phone,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Info,
  Home,
  Building2,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import type {
  EvacuationPlan,
  EvacuationPoint,
  FamilyMember,
  EmergencyContact,
  EvacuationPlannerProps,
} from "../lib/types";

// =============================================================================
// MEETING POINTS (4 levels)
// =============================================================================

const MEETING_POINTS: EvacuationPoint[] = [
  { id: "mp-1", name: "Front of house", nameVi: "Trước nhà", level: 1, description: "Gặp nhau trước nhà khi có bão nhẹ", descriptionVi: "Gặp nhau trước nhà khi có bão nhẹ", icon: "🏠" },
  { id: "mp-2", name: "Neighbor's house", nameVi: "Nhà hàng xóm", level: 2, description: "Khi cần sơ tán ngắn", descriptionVi: "Khi cần sơ tán ngắn", icon: "🏘️" },
  { id: "mp-3", name: "School/Office", nameVi: "Trường học/Cơ quan", level: 3, description: "Khi cần sơ tán xa", descriptionVi: "Khi cần sơ tán xa", icon: "🏫" },
  { id: "mp-4", name: "Commune office", nameVi: "UBND Xã/Phường", level: 4, description: "Khi cần hỗ trợ chính quyền", descriptionVi: "Khi cần hỗ trợ chính quyền", icon: "🏛️" },
];

// =============================================================================
// FAMILY MEMBER CARD
// =============================================================================

function FamilyMemberCard({
  member,
  onRemove,
}: {
  member: FamilyMember;
  onRemove: () => void;
}) {
  const roleConfig = {
    adult: { label: "Người lớn", icon: "👤", color: "#3B82F6" },
    child: { label: "Trẻ em", icon: "👶", color: "#F59E0B" },
    elderly: { label: "Người già", icon: "👴", color: "#8B5CF6" },
    disabled: { label: "Khuyết tật", icon: "♿", color: "#EC4899" },
  }[member.role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/20"
    >
      <span className="text-lg">{roleConfig.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-200">{member.name}</span>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span style={{ color: roleConfig.color }}>{roleConfig.label}</span>
          {member.phone && <span>📞 {member.phone}</span>}
          {member.specialNeeds && <span>⚠️ {member.specialNeeds}</span>}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// =============================================================================
// EMERGENCY CONTACT CARD
// =============================================================================

function EmergencyContactCard({
  contact,
  onRemove,
}: {
  contact: EmergencyContact;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/20"
    >
      <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-400">
        {contact.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-200">{contact.name}</span>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>📞 {contact.phone}</span>
          <span>• {contact.relationship}</span>
          {contact.isPrimary && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-500/15 text-blue-400">Chính</span>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// =============================================================================
// MEETING POINT CARD
// =============================================================================

function MeetingPointCard({ point }: { point: EvacuationPoint }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm shrink-0">
        {point.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
            Level {point.level}
          </span>
          <span className="text-xs font-medium text-slate-200">{point.nameVi}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">{point.descriptionVi}</p>
      </div>
    </div>
  );
}

// =============================================================================
// ADD MEMBER FORM
// =============================================================================

function AddMemberForm({ onAdd }: { onAdd: (member: Omit<FamilyMember, "id">) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<FamilyMember["role"]>("adult");
  const [phone, setPhone] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      role,
      phone: phone.trim() || undefined,
      specialNeeds: specialNeeds.trim() || undefined,
    });
    setName("");
    setPhone("");
    setSpecialNeeds("");
  }, [name, role, phone, specialNeeds, onAdd]);

  return (
    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-2">
      <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
        <Plus className="w-3.5 h-3.5 text-blue-400" />
        Thêm thành viên
      </h4>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Họ tên *"
        className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
      />
      <div className="flex gap-1">
        {(["adult", "child", "elderly", "disabled"] as const).map((r) => {
          const config = { adult: "👤 Lớn", child: "👶 Trẻ", elderly: "👴 Già", disabled: "♿ KT" };
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={clsx(
                "flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-colors",
                role === r
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                  : "bg-slate-800/30 border-slate-700/30 text-slate-500"
              )}
            >
              {config[r]}
            </button>
          );
        })}
      </div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Số điện thoại"
        className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
      />
      <input
        type="text"
        value={specialNeeds}
        onChange={(e) => setSpecialNeeds(e.target.value)}
        placeholder="Nhu cầu đặc biệt (thuốc, xe lăn...)"
        className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
      />
      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className={clsx(
          "w-full py-2 rounded-lg text-xs font-semibold transition-colors",
          name.trim()
            ? "bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30"
            : "bg-slate-800/30 border border-slate-700/30 text-slate-600 cursor-not-allowed"
        )}
      >
        Thêm thành viên
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function EvacuationPlannerComponent({
  plan,
  onUpdate,
  className,
}: EvacuationPlannerProps) {
  const [familyName, setFamilyName] = useState(plan?.familyName || "");
  const [members, setMembers] = useState<FamilyMember[]>(plan?.members || []);
  const [contacts, setContacts] = useState<EmergencyContact[]>(plan?.contacts || []);
  const [notes, setNotes] = useState(plan?.notes || "");

  const handleAddMember = useCallback(
    (member: Omit<FamilyMember, "id">) => {
      const newMember: FamilyMember = { ...member, id: `fm-${Date.now()}` };
      setMembers((prev) => [...prev, newMember]);
    },
    []
  );

  const handleRemoveMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleAddContact = useCallback(() => {
    const newContact: EmergencyContact = {
      id: `ec-${Date.now()}`,
      name: "Liên hệ mới",
      phone: "",
      relationship: "",
      isPrimary: contacts.length === 0,
    };
    setContacts((prev) => [...prev, newContact]);
  }, [contacts.length]);

  const handleRemoveContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate({
      familyName,
      members,
      contacts,
      meetingPoints: MEETING_POINTS,
      notes,
      lastReviewed: new Date().toISOString(),
    });
  }, [familyName, members, contacts, notes, onUpdate]);

  // Checklist for plan completeness
  const checklist = [
    { label: "Đặt tên gia đình", done: !!familyName },
    { label: "Thêm thành viên", done: members.length > 0 },
    { label: "Thêm liên hệ khẩn cấp", done: contacts.length > 0 },
    { label: "Biết 4 điểm tập hợp", done: true },
    { label: "Chuẩn bị bộ đồ 72 giờ", done: false },
    { label: "Dạy trẻ em số điện thoại", done: false },
    { label: "Kiểm tra kế hoạch 2 lần/năm", done: false },
  ];

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <h3 className="text-lg font-bold text-white mb-1">📋 Kế hoạch sơ tán gia đình</h3>
        <p className="text-[10px] text-slate-500">
          Xây dựng kế hoạch để cả gia đình biết phải làm gì khi có thiên tai.
        </p>
      </div>

      {/* Family name */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <label className="text-[10px] text-slate-500 block mb-1">Tên gia đình</label>
        <input
          type="text"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="VD: Gia đình Nguyễn Văn A"
          className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Family members */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-400" />
          Thành viên gia đình ({members.length})
        </h4>
        <div className="space-y-1.5 mb-2">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onRemove={() => handleRemoveMember(member.id)}
            />
          ))}
        </div>
        <AddMemberForm onAdd={handleAddMember} />
      </div>

      {/* Meeting points */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-green-400" />
          4 điểm tập hợp
        </h4>
        <div className="space-y-1.5">
          {MEETING_POINTS.map((point) => (
            <MeetingPointCard key={point.id} point={point} />
          ))}
        </div>
      </div>

      {/* Emergency contacts */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-amber-400" />
          Liên hệ khẩn cấp ({contacts.length})
        </h4>
        <div className="space-y-1.5 mb-2">
          {contacts.map((contact) => (
            <EmergencyContactCard
              key={contact.id}
              contact={contact}
              onRemove={() => handleRemoveContact(contact.id)}
            />
          ))}
        </div>
        <button
          onClick={handleAddContact}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 text-[11px] font-medium hover:border-slate-600/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm liên hệ
        </button>
      </div>

      {/* Notes */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
        <label className="text-[10px] text-slate-500 block mb-1">Ghi chú</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú thêm về kế hoạch sơ tán..."
          rows={3}
          className="w-full bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
        />
      </div>

      {/* Checklist */}
      <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
        <h4 className="text-[10px] font-semibold text-green-400 mb-2">✅ Checklist hoàn thành</h4>
        <div className="space-y-1">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
              )}
              <span className={clsx("text-[11px]", item.done ? "text-green-400" : "text-slate-400")}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-colors"
      >
        💾 Lưu kế hoạch
      </button>
    </div>
  );
}

export const EvacuationPlanner = memo(EvacuationPlannerComponent);
