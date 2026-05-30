"use client";

// =============================================================================
// ALERT DETAIL MODAL - Full Alert Detail View
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Full-screen modal showing:
//   - Severity banner (full-width colored)
//   - Headline + description + instructions
//   - Affected area (province list)
//   - Validity period (effective → expires)
//   - Source + sender info
//   - Action buttons: Acknowledge / Dismiss / Share
//   - CAP-inspired metadata display
// =============================================================================

import { memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  Share2,
  ExternalLink,
  AlertTriangle,
  Calendar,
  Users,
  Zap,
  Info,
  Eye,
} from "lucide-react";
import clsx from "clsx";
import type { AlertDetailModalProps, AlertSeverity } from "../lib/types";
import {
  ALERT_SEVERITY_CONFIG,
  ALERT_URGENCY_CONFIG,
  ALERT_CERTAINTY_CONFIG,
  ALERT_RESPONSE_TYPE_CONFIG,
  ALERT_CATEGORY_CONFIG,
  ALERT_SENDER_CONFIG,
  DELIVERY_CHANNEL_CONFIG,
} from "../config/alert-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 200,
    },
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.3 },
  }),
};

// =============================================================================
// TIME FORMATTERS
// =============================================================================

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeRemaining(expiresStr: string): string {
  const now = Date.now();
  const expires = new Date(expiresStr).getTime();
  const diff = expires - now;

  if (diff <= 0) return "Đã hết hạn";
  if (diff < 3600_000) return `Còn ${Math.ceil(diff / 60_000)} phút`;
  if (diff < 86400_000) return `Còn ${Math.ceil(diff / 3600_000)} giờ`;
  return `Còn ${Math.ceil(diff / 86400_000)} ngày`;
}

// =============================================================================
// METADATA ROW SUB-COMPONENT
// =============================================================================

function MetaRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium" style={{ color: color || "#e2e8f0" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function AlertDetailModalComponent({
  alert,
  onClose,
  onAcknowledge,
  onDismiss,
  onShare,
}: AlertDetailModalProps) {
  const severityConfig = ALERT_SEVERITY_CONFIG[alert.info.severity];
  const urgencyConfig = ALERT_URGENCY_CONFIG[alert.info.urgency];
  const certaintyConfig = ALERT_CERTAINTY_CONFIG[alert.info.certainty];
  const responseTypeConfig = ALERT_RESPONSE_TYPE_CONFIG[alert.info.responseType];
  const categoryConfig = ALERT_CATEGORY_CONFIG[alert.info.category];
  const senderConfig = ALERT_SENDER_CONFIG[alert.sender];

  const isExpired = new Date(alert.info.expires).getTime() < Date.now();
  const isCancelled = alert.msgType === "cancel";

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: alert.info.headline,
        text: alert.info.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(
        `${alert.info.headline}\n${alert.info.description}`
      );
    }
    onShare(alert.id);
  }, [alert, onShare]);

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            "relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl",
            "bg-white border border-slate-200",
            "shadow-2xl shadow-black/10"
          )}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={clsx(
              "absolute top-3 right-3 z-10 w-8 h-8 rounded-full",
              "bg-black/40 backdrop-blur-sm flex items-center justify-center",
              "text-slate-500 hover:text-white transition-colors"
            )}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Severity Banner */}
          <div
            className="relative px-5 pt-5 pb-4"
            style={{
              background: `linear-gradient(135deg, ${severityConfig.color}25, ${severityConfig.color}08)`,
            }}
          >
            {/* Glow */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: severityConfig.color }}
            />

            <div className="relative">
              {/* Severity badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: `${severityConfig.color}25`,
                    color: severityConfig.color,
                    border: `1px solid ${severityConfig.color}40`,
                  }}
                >
                  {severityConfig.icon} {severityConfig.labelVi}
                </span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${urgencyConfig.color}20`,
                    color: urgencyConfig.color,
                  }}
                >
                  {urgencyConfig.icon} {urgencyConfig.labelVi}
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-xl font-bold text-white leading-tight">
                {alert.info.headline}
              </h2>

              {/* Sender + time */}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  {senderConfig.icon} {senderConfig.labelVi}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(alert.sent)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-5">
            {/* Description */}
            <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
              <p className="text-sm text-slate-700 leading-relaxed">
                {alert.info.description}
              </p>
            </motion.div>

            {/* Instructions */}
            {alert.info.instruction && (
              <motion.div
                custom={1}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25"
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-400 mb-1">Hướng dẫn</p>
                    <p className="text-sm text-blue-200/80">{alert.info.instruction}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Affected Area */}
            <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
              <MetaRow
                icon={<MapPin className="w-4 h-4" />}
                label="Vùng ảnh hưởng"
                value={alert.info.area.provinces.join(", ")}
              />
              {alert.info.area.areaDesc && (
                <p className="text-xs text-slate-500 ml-11 mt-1">
                  {alert.info.area.areaDesc}
                </p>
              )}
            </motion.div>

            {/* Validity */}
            <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
              <div className="grid grid-cols-2 gap-3">
                <MetaRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Có hiệu lực"
                  value={formatDateTime(alert.info.effective)}
                />
                <MetaRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Hết hạn"
                  value={formatTimeRemaining(alert.info.expires)}
                  color={isExpired ? "#EF4444" : undefined}
                />
              </div>
            </motion.div>

            {/* CAP Metadata */}
            <motion.div
              custom={4}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              <MetaRow
                icon={<AlertTriangle className="w-4 h-4" />}
                label="Danh mục"
                value={`${categoryConfig.icon} ${categoryConfig.labelVi}`}
              />
              <MetaRow
                icon={<Eye className="w-4 h-4" />}
                label="Mức chắc chắn"
                value={`${certaintyConfig.labelVi} (${certaintyConfig.percentage}%)`}
                color={certaintyConfig.color}
              />
              <MetaRow
                icon={<Zap className="w-4 h-4" />}
                label="Phản hồi"
                value={`${responseTypeConfig.icon} ${responseTypeConfig.labelVi}`}
                color={responseTypeConfig.color}
              />
              <MetaRow
                icon={<Shield className="w-4 h-4" />}
                label="Phạm vi"
                value={alert.scope === "public" ? "Công khai" : alert.scope === "restricted" ? "Hạn chế" : "Riêng tư"}
              />
            </motion.div>

            {/* Delivery Stats */}
            <motion.div
              custom={5}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="p-3.5 rounded-xl bg-slate-100 border border-slate-200"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                Thống kê phát sóng
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-400">
                    {alert.delivery.deliveredCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Đã gửi</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">
                    {alert.delivery.acknowledgedCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Xác nhận</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">
                    {alert.delivery.failedCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">Thất bại</p>
                </div>
              </div>

              {/* Channels */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {alert.delivery.channels.map((channel) => {
                  const config = DELIVERY_CHANNEL_CONFIG[channel];
                  return (
                    <span
                      key={channel}
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${config.color}18`,
                        color: config.color,
                      }}
                    >
                      {config.icon} {config.labelVi}
                    </span>
                  );
                })}
              </div>
            </motion.div>

            {/* Related Alerts */}
            {alert.relatedAlerts && alert.relatedAlerts.length > 0 && (
              <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">
                  Cảnh báo liên quan
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {alert.relatedAlerts.map((relatedId) => (
                    <span
                      key={relatedId}
                      className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200"
                    >
                      {relatedId}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-slate-200">
            {!isExpired && !isCancelled && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAcknowledge(alert.id)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                    "bg-green-600 text-white font-medium",
                    "hover:bg-green-500 shadow-lg shadow-green-500/20",
                    "transition-all duration-200"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Xác nhận</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDismiss(alert.id)}
                  className={clsx(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                    "bg-slate-100 text-slate-700 font-medium",
                    "border border-slate-200 hover:border-slate-600/70",
                    "transition-all duration-200"
                  )}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Bỏ qua</span>
                </motion.button>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className={clsx(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "bg-slate-100 text-slate-700 font-medium",
                "border border-slate-200 hover:border-slate-600/70",
                "transition-all duration-200"
              )}
            >
              <Share2 className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const AlertDetailModal = memo(AlertDetailModalComponent);
