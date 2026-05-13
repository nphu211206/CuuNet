"use client";

// =============================================================================
// EMERGENCY DIRECTORY - Province Emergency Contact Directory
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Features:
//   - Province selector dropdown
//   - National contacts always visible (113/114/115/116)
//   - Local contacts grouped by type
//   - Quick-dial button (tel: protocol)
//   - 24/7 badge
//   - Search contacts
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Search,
  ChevronDown,
  MapPin,
  Clock,
  Building2,
  Shield,
  Flame,
  Heart,
  Anchor,
  Zap,
  Droplets,
  Users,
  Stethoscope,
  BadgeCheck,
} from "lucide-react";
import clsx from "clsx";
import type { EmergencyDirectoryProps, EmergencyContact, EmergencyContactType } from "../lib/types";
import {
  EMERGENCY_CONTACT_TYPE_CONFIG,
} from "../config/alert-config";

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
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// =============================================================================
// PROVINCE SELECTOR
// =============================================================================

const PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Huế", "Cần Thơ",
  "Hải Phòng", "Nha Trang", "Đà Lạt", "Quảng Bình", "Quảng Nam",
  "Bến Tre", "Trà Vinh", "Lào Cai", "Yên Bái", "An Giang",
];

function ProvinceSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (province: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl",
          "bg-slate-800/50 border border-slate-700/40",
          "text-sm font-medium text-slate-200",
          "hover:border-slate-600/60 transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          {value || "Chọn tỉnh/thành phố"}
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={clsx(
              "absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl z-50",
              "bg-slate-900/95 backdrop-blur-xl",
              "border border-slate-700/50",
              "shadow-xl shadow-black/40"
            )}
          >
            {PROVINCES.map((province) => (
              <button
                key={province}
                onClick={() => {
                  onChange(province);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-2 px-4 py-2.5 text-left",
                  "text-sm transition-colors",
                  value === province
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-slate-300 hover:bg-slate-800/60"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                {province}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// CONTACT CARD SUB-COMPONENT
// =============================================================================

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const typeConfig = EMERGENCY_CONTACT_TYPE_CONFIG[contact.type];

  const handleCall = useCallback(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${contact.number}`;
    } else {
      navigator.clipboard.writeText(contact.number).then(() => {
        alert(`Đã copy số ${contact.number}`);
      });
    }
  }, [contact.number]);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      className={clsx(
        "flex items-center gap-3 p-3.5 rounded-xl",
        "bg-slate-900/50 backdrop-blur-sm",
        "border border-slate-700/30",
        "hover:border-slate-600/50",
        "transition-all duration-200 group"
      )}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
        style={{ backgroundColor: `${typeConfig.color}18` }}
      >
        {typeConfig.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-200 truncate">
            {contact.nameVi}
          </h4>
          {contact.available24_7 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 shrink-0">
              24/7
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {contact.description}
        </p>
        {contact.address && (
          <p className="text-[10px] text-slate-600 mt-0.5 truncate">
            📍 {contact.address}
          </p>
        )}
      </div>

      {/* Call button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCall}
        className={clsx(
          "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl shrink-0",
          "font-medium text-sm transition-all duration-200",
          "shadow-lg"
        )}
        style={{
          backgroundColor: typeConfig.color,
          color: "white",
          boxShadow: `0 4px 14px ${typeConfig.color}30`,
        }}
      >
        <Phone className="w-4 h-4" />
        {contact.number}
      </motion.button>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function EmergencyDirectoryComponent({
  contacts,
  selectedProvince,
  onProvinceChange,
  className,
}: EmergencyDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const nationalContacts = useMemo(
    () => contacts.filter((c) => c.isNational),
    [contacts]
  );

  const localContacts = useMemo(
    () => contacts.filter((c) => !c.isNational),
    [contacts]
  );

  const filteredNational = useMemo(() => {
    if (!searchQuery) return nationalContacts;
    const q = searchQuery.toLowerCase();
    return nationalContacts.filter(
      (c) =>
        c.nameVi.toLowerCase().includes(q) ||
        c.number.includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [nationalContacts, searchQuery]);

  const filteredLocal = useMemo(() => {
    if (!searchQuery) return localContacts;
    const q = searchQuery.toLowerCase();
    return localContacts.filter(
      (c) =>
        c.nameVi.toLowerCase().includes(q) ||
        c.number.includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [localContacts, searchQuery]);

  // Group local contacts by type
  const groupedLocal = useMemo(() => {
    const groups = new Map<EmergencyContactType, EmergencyContact[]>();
    for (const contact of filteredLocal) {
      const existing = groups.get(contact.type) || [];
      existing.push(contact);
      groups.set(contact.type, existing);
    }
    return Array.from(groups.entries());
  }, [filteredLocal]);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Province Selector */}
      <ProvinceSelector value={selectedProvince} onChange={onProvinceChange} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Tìm kiếm liên hệ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={clsx(
            "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm",
            "bg-slate-800/40 border border-slate-700/40",
            "text-slate-200 placeholder-slate-600",
            "focus:outline-none focus:border-blue-500/50",
            "transition-colors"
          )}
        />
      </div>

      {/* National Contacts */}
      {filteredNational.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">Số khẩn cấp quốc gia</h3>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {filteredNational.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Local Contacts by Type */}
      {groupedLocal.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Liên hệ địa phương {selectedProvince && `- ${selectedProvince}`}
            </h3>
          </div>

          {groupedLocal.map(([type, typeContacts]) => {
            const config = EMERGENCY_CONTACT_TYPE_CONFIG[type];
            return (
              <div key={type} className="mb-4">
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-xs font-medium text-slate-400">{config.labelVi}</span>
                  <span className="text-[10px] text-slate-600">({typeContacts.length})</span>
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {typeContacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {filteredNational.length === 0 && filteredLocal.length === 0 && (
        <div className="text-center py-12">
          <Phone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {searchQuery ? "Không tìm thấy liên hệ" : "Chọn tỉnh để xem danh bạ"}
          </p>
        </div>
      )}
    </div>
  );
}

export const EmergencyDirectory = memo(EmergencyDirectoryComponent);
