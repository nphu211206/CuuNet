"use client";

// =============================================================================
// EMERGENCY NUMBERS - Vietnamese Emergency Contacts
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Features:
//   - 4 main emergency numbers (112, 113, 114, 115)
//   - Quick call buttons
//   - Description of when to call each
//   - Additional useful numbers
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo } from "react";
import { motion } from "framer-motion";
import { Phone, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";
import type { EmergencyNumbersProps } from "../lib/types";
import { EMERGENCY_NUMBERS } from "../config/education-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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
// MAIN COMPONENT
// =============================================================================

function EmergencyNumbersComponent({ className }: EmergencyNumbersProps) {
  const additionalNumbers = [
    { number: "111", label: "Tổng đài trẻ em", labelEn: "Child Helpline", icon: "👶", color: "#EC4899", description: "Hỗ trợ trẻ em gặp nguy hiểm" },
    { number: "18001567", label: "Tổng đài sức khỏe tâm thần", labelEn: "Mental Health Hotline", icon: "💚", color: "#22C55E", description: "Hỗ trợ tâm lý miễn phí" },
    { number: "19009095", label: "Đường dây nóng PCTT", labelEn: "Disaster Hotline", icon: "🌪️", color: "#F59E0B", description: "Thông tin phòng chống thiên tai" },
  ];

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-bold text-red-400">Số điện thoại khẩn cấp Việt Nam</h3>
        </div>
        <p className="text-[11px] text-red-300/70">
          Nhớ 4 số này. Trong tình huống khẩn cấp, mỗi giây đều quan trọng.
        </p>
      </div>

      {/* Main emergency numbers */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {EMERGENCY_NUMBERS.map((num) => (
          <motion.a
            key={num.number}
            variants={cardVariants}
            href={`tel:${num.number}`}
            whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.97 }}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/30 hover:border-slate-600/50 transition-colors cursor-pointer block"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${num.color}20`, border: `1px solid ${num.color}30` }}
              >
                {num.icon}
              </div>
              <div>
                <span className="text-2xl font-black tabular-nums block" style={{ color: num.color }}>
                  {num.number}
                </span>
                <span className="text-[10px] text-slate-400">{num.label}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">{num.description}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium" style={{ color: num.color }}>
              <Phone className="w-3 h-3" />
              Nhấn để gọi
            </div>
          </motion.a>
        ))}
      </motion.div>

      {/* How to call effectively */}
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h4 className="text-[10px] font-semibold text-blue-400 mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Cách gọi hiệu quả
        </h4>
        <ul className="space-y-1.5">
          <li className="text-[11px] text-blue-300/70 flex items-start gap-1.5">
            <span className="text-blue-400 mt-0.5">1.</span>
            <span>Nói rõ: <strong>Họ tên, địa chỉ chi tiết</strong> (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)</span>
          </li>
          <li className="text-[11px] text-blue-300/70 flex items-start gap-1.5">
            <span className="text-blue-400 mt-0.5">2.</span>
            <span>Mô tả tình huống: <strong>số người bị thương, tình trạng, yếu tố nguy hiểm</strong></span>
          </li>
          <li className="text-[11px] text-blue-300/70 flex items-start gap-1.5">
            <span className="text-blue-400 mt-0.5">3.</span>
            <span><strong>Giữ điện thoại</strong>, không gập máy trước khi được hướng dẫn</span>
          </li>
          <li className="text-[11px] text-blue-300/70 flex items-start gap-1.5">
            <span className="text-blue-400 mt-0.5">4.</span>
            <span>Làm theo hướng dẫn của tổng đài viên</span>
          </li>
        </ul>
      </div>

      {/* Additional numbers */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2">📞 Số hữu ích khác</h4>
        <div className="space-y-1.5">
          {additionalNumbers.map((num) => (
            <a
              key={num.number}
              href={`tel:${num.number}`}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors cursor-pointer block"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ backgroundColor: `${num.color}15` }}
              >
                {num.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">{num.number}</span>
                  <span className="text-[10px] text-slate-400">{num.label}</span>
                </div>
                <p className="text-[9px] text-slate-500">{num.description}</p>
              </div>
              <Phone className="w-3.5 h-3.5 text-slate-600" />
            </a>
          ))}
        </div>
      </div>

      {/* Offline tip */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-[10px] text-amber-400">
          💡 <strong>Mẹo:</strong> Lưu 4 số này vào danh bạ điện thoại ngay. Khi mất sóng, bạn vẫn có thể gọi cấp cứu bằng cách quay số trực tiếp.
        </p>
      </div>
    </div>
  );
}

export const EmergencyNumbers = memo(EmergencyNumbersComponent);
