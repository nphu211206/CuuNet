"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Shield,
  User,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Share2,
  Flag,
  ExternalLink,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type { CommunityReport, VoteType, ReportDetailModalProps } from "../lib/types";
import {
  DISASTER_CONFIG,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
  TRUST_SCORE_COLORS,
  VERIFICATION_CONFIG,
} from "../config/report-config";

// ============================================================
// REPORT DETAIL MODAL COMPONENT
// ============================================================
// Modal chi tiết báo cáo (slide-in từ phải)
// - DetailHeader: close + type icon + title + severity + status
// - PhotoGallery: horizontal scroll + fullscreen lightbox
// - DetailLocation: address + mini map link
// - DetailDescription: full text
// - VerificationSection: vote buttons + trust gauge + badge
// - TrustGauge: SVG circular gauge
// - TimelineSection: timeline events
// - ActionButtons: verify + dispute + flag + share
// ============================================================

// === ANIMATION VARIANTS ===

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, damping: 25, stiffness: 200 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

// === MAIN COMPONENT ===

function ReportDetailModalComponent({
  report,
  isOpen,
  onClose,
  onVote,
}: ReportDetailModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Guard: nếu report null (khi đóng modal), chỉ render AnimatePresence rỗng
  if (!report) {
    return <AnimatePresence />;
  }

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onClose();
        }
      }
      // Arrow keys for lightbox navigation
      if (lightboxIndex !== null) {
        if (e.key === "ArrowLeft") {
          setLightboxIndex((prev) =>
            prev !== null ? Math.max(0, prev - 1) : null
          );
        }
        if (e.key === "ArrowRight") {
          setLightboxIndex((prev) =>
            prev !== null
              ? Math.min(report.photos.length - 1, prev + 1)
              : null
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, lightboxIndex, report.photos.length]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Config lookups with fallback for corrupted data
  const disasterConfig = useMemo(
    () => DISASTER_CONFIG[report.type] ?? { icon: "⚠️", label: report.type, color: "#6B7280" },
    [report.type]
  );
  const severityConfig = useMemo(
    () => SEVERITY_CONFIG[report.severity] ?? { label: report.severity, color: "#6B7280", bgColor: "bg-gray-500/10" },
    [report.severity]
  );
  const statusConfig = useMemo(
    () => STATUS_CONFIG[report.status] ?? { label: report.status, color: "#6B7280", icon: "❓" },
    [report.status]
  );

  // Handle vote
  const handleVote = useCallback(
    (voteType: VoteType) => {
      onVote?.(report.id, voteType);
    },
    [onVote, report.id]
  );

  // Handle share
  const handleShare = useCallback(async () => {
    const shareData = {
      title: report.title,
      text: `${report.title} - ${report.location.province}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
      }
    } catch {
      // User cancelled share
    }
  }, [report]);

  // Trust score color
  const trustScoreColor = useMemo(() => {
    const score = report.verification.trustScore;
    if (score >= TRUST_SCORE_COLORS.high.min)
      return TRUST_SCORE_COLORS.high.color;
    if (score >= TRUST_SCORE_COLORS.good.min)
      return TRUST_SCORE_COLORS.good.color;
    if (score >= TRUST_SCORE_COLORS.medium.min)
      return TRUST_SCORE_COLORS.medium.color;
    return TRUST_SCORE_COLORS.low.color;
  }, [report.verification.trustScore]);

  // Formatted date
  const formattedDate = useMemo(() => {
    return new Date(report.createdAt).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [report.createdAt]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl shadow-black/10 overflow-y-auto"
          >
            {/* === HEADER === */}
            <motion.div
              custom={0}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4"
            >
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <span
                  className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${disasterConfig.color}15` }}
                >
                  {disasterConfig.icon}
                </span>

                {/* Title + badges */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-slate-800 leading-tight mb-1.5">
                    {report.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                      style={{
                        color: severityConfig.color,
                        backgroundColor: `${severityConfig.color}10`,
                        borderColor: `${severityConfig.color}30`,
                      }}
                    >
                      {severityConfig.label}
                    </span>
                    {/* Status */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                      style={{
                        color: statusConfig.color,
                        backgroundColor: `${statusConfig.color}10`,
                        borderColor: `${statusConfig.color}30`,
                      }}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                    {/* Report number */}
                    <span className="text-xs text-slate-500">
                      #{report.reportNumber}
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* === CONTENT === */}
            <div className="p-4 space-y-6">
              {/* Photo Gallery */}
              {report.photos.length > 0 && (
                <motion.div
                  custom={1}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <PhotoGallery
                    photos={report.photos}
                    onPhotoClick={(index) => setLightboxIndex(index)}
                  />
                </motion.div>
              )}

              {/* Location */}
              <motion.div
                custom={2}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <DetailLocation location={report.location} />
              </motion.div>

              {/* Description */}
              <motion.div
                custom={3}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <DetailDescription
                  description={report.description}
                  createdAt={formattedDate}
                />
              </motion.div>

              {/* Verification Section */}
              <motion.div
                custom={4}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <VerificationSection
                  verification={report.verification}
                  trustScoreColor={trustScoreColor}
                  onVote={handleVote}
                  isVoting={false}
                />
              </motion.div>

              {/* Reporter Info */}
              <motion.div
                custom={5}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <ReporterSection reporter={report.reporter} />
              </motion.div>

              {/* Timeline */}
              <motion.div
                custom={6}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <TimelineSection report={report} />
              </motion.div>
            </div>

            {/* === ACTION BUTTONS === */}
            <motion.div
              custom={7}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4"
            >
              <ActionButtons
                onVerify={() => handleVote("up")}
                onDispute={() => handleVote("down")}
                onShare={handleShare}
                isVoting={false}
              />
            </motion.div>
          </motion.div>

          {/* Photo Lightbox */}
          <AnimatePresence>
            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={report.photos}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onPrev={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? Math.max(0, prev - 1) : null
                  )
                }
                onNext={() =>
                  setLightboxIndex((prev) =>
                    prev !== null
                      ? Math.min(report.photos.length - 1, prev + 1)
                      : null
                  )
                }
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// === SUB-COMPONENTS ===

/**
 * Photo Gallery: Horizontal scroll thumbnails
 */
function PhotoGallery({
  photos,
  onPhotoClick,
}: {
  photos: CommunityReport["photos"];
  onPhotoClick: (index: number) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
        <Camera className="w-4 h-4" />
        Ảnh chụp ({photos.length})
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => onPhotoClick(index)}
            className="flex-shrink-0 relative group rounded-lg overflow-hidden bg-slate-200 hover:ring-2 hover:ring-blue-500/50 transition-all"
          >
            <img
              src={photo.thumbnail}
              alt={photo.caption || `Ảnh ${index + 1}`}
              className="w-24 h-24 object-cover"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Caption */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-black/60 text-[10px] text-white truncate">
                {photo.caption}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Photo Lightbox: Fullscreen image viewer
 */
function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  photos: CommunityReport["photos"];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <motion.img
        key={photo.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        src={photo.data}
        alt={photo.caption || `Ảnh ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Caption + counter */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-white/80 mb-1">
          {photo.caption || `Ảnh ${currentIndex + 1} / ${photos.length}`}
        </p>
        <p className="text-xs text-white/50">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Detail Location: Address + mini map link
 */
function DetailLocation({
  location,
}: {
  location: CommunityReport["location"];
}) {
  const mapUrl = useMemo(
    () =>
      `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`,
    [location.lat, location.lng]
  );

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
        <MapPin className="w-4 h-4" />
        Vị trí
      </h3>
      <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
        <p className="text-sm text-slate-700 mb-1">{location.address}</p>
        <p className="text-xs text-slate-500 mb-2">
          {location.district}, {location.province}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">
            {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
          </span>
          {location.accuracy && (
            <span className="text-xs text-slate-600">
              · Độ chính xác: {location.accuracy}m
            </span>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            Xem trên bản đồ
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Detail Description: Full text
 */
function DetailDescription({
  description,
  createdAt,
}: {
  description: string;
  createdAt: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2">
        Mô tả chi tiết
      </h3>
      <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {createdAt}
        </div>
      </div>
    </div>
  );
}

/**
 * Verification Section: Vote buttons + Trust gauge + Badge
 */
function VerificationSection({
  verification,
  trustScoreColor,
  onVote,
  isVoting,
}: {
  verification: CommunityReport["verification"];
  trustScoreColor: string;
  onVote: (type: VoteType) => void;
  isVoting: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
        <Shield className="w-4 h-4" />
        Xác minh cộng đồng
      </h3>
      <div className="rounded-lg bg-slate-100 border border-slate-200 p-4">
        <div className="flex items-center gap-6">
          {/* Trust Gauge */}
          <TrustGauge
            score={verification.trustScore}
            color={trustScoreColor}
            badge={verification.badge}
          />

          {/* Vote stats */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4">
              {/* Upvotes */}
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-slate-700">
                  {verification.upvotes}
                </span>
                <span className="text-xs text-slate-500">xác nhận</span>
              </div>
              {/* Downvotes */}
              <div className="flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-slate-700">
                  {verification.downvotes}
                </span>
                <span className="text-xs text-slate-500">phản đối</span>
              </div>
            </div>

            {/* Trust score text */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Độ tin cậy:</span>
              <span
                className="text-sm font-semibold"
                style={{ color: trustScoreColor }}
              >
                {Math.round(verification.trustScore * 100)}%
              </span>
            </div>

            {/* Badge */}
            {verification.badge && (
              <div className="flex items-center gap-1.5">
                {verification.badge === "verified" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle className="w-3 h-3" />
                    Đã xác minh
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />
                    Tranh cãi
                  </span>
                )}
              </div>
            )}

            {/* Last vote time */}
            {verification.lastVoteAt && (
              <p className="text-[10px] text-slate-600">
                Bình chọn gần nhất:{" "}
                {new Date(verification.lastVoteAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Trust Gauge: SVG Circular gauge (270° arc)
 */
function TrustGauge({
  score,
  color,
  badge,
}: {
  score: number;
  color: string;
  badge: "verified" | "disputed" | null;
}) {
  const size = 72;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270°
  const filledLength = arcLength * score;

  return (
    <div className="relative flex-shrink-0">
      <svg width={size} height={size} className="-rotate-[135deg]">
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${circumference}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${filledLength} ${circumference}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-base font-bold"
          style={{ color }}
        >
          {Math.round(score * 100)}
        </span>
        {badge === "verified" && (
          <CheckCircle className="w-3 h-3 text-green-400 -mt-0.5" />
        )}
      </div>
    </div>
  );
}

/**
 * Reporter Section: Reporter info
 */
function ReporterSection({
  reporter,
}: {
  reporter: CommunityReport["reporter"];
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1.5">
        <User className="w-4 h-4" />
        Người báo cáo
      </h3>
      <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          {/* Info */}
          <div>
            <p className="text-sm font-medium text-slate-700">
              {reporter.isAnonymous ? "Ẩn danh" : reporter.name}
            </p>
            <p className="text-xs text-slate-500">
              {reporter.reportCount} báo cáo · Tham gia{" "}
              {new Date(reporter.joinedAt).toLocaleDateString("vi-VN", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline Section: Vertical timeline events
 */
function TimelineSection({
  report,
}: {
  report: CommunityReport;
}) {
  const events = useMemo(() => {
    const items = [
      {
        time: report.createdAt,
        label: "Tạo báo cáo",
        icon: "📝",
        color: "#3B82F6",
      },
    ];

    if (report.verification.lastVoteAt) {
      items.push({
        time: report.verification.lastVoteAt,
        label: `Bình chọn (${report.verification.upvotes + report.verification.downvotes} phiếu)`,
        icon: "🗳️",
        color: "#8B5CF6",
      });
    }

    if (report.verification.verifiedAt) {
      items.push({
        time: report.verification.verifiedAt,
        label: "Đã xác minh",
        icon: "✅",
        color: "#22C55E",
      });
    }

    if (report.status === "resolved") {
      items.push({
        time: report.updatedAt,
        label: "Đã giải quyết",
        icon: "🟢",
        color: "#3B82F6",
      });
    }

    if (report.status === "rejected") {
      items.push({
        time: report.updatedAt,
        label: "Bị từ chối",
        icon: "❌",
        color: "#EF4444",
      });
    }

    return items.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [report]);

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-500 mb-2">
        Lịch sử
      </h3>
      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-700/50" />

        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative mb-3 last:mb-0"
          >
            {/* Dot */}
            <div
              className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: event.color,
                borderColor: `${event.color}40`,
              }}
            />
            {/* Content */}
            <div className="text-xs">
              <span className="text-slate-500">{event.label}</span>
              <span className="text-slate-600 ml-2">
                {new Date(event.time).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Action Buttons: Verify + Dispute + Share
 */
function ActionButtons({
  onVerify,
  onDispute,
  onShare,
  isVoting,
}: {
  onVerify: () => void;
  onDispute: () => void;
  onShare: () => void;
  isVoting: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Verify */}
      <button
        onClick={onVerify}
        disabled={isVoting}
        className={clsx(
          "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "bg-green-500/10 border border-green-500/20 text-green-400",
          "hover:bg-green-500/20 disabled:opacity-50"
        )}
      >
        <ThumbsUp className="w-4 h-4" />
        Xác nhận
      </button>

      {/* Dispute */}
      <button
        onClick={onDispute}
        disabled={isVoting}
        className={clsx(
          "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "bg-red-500/10 border border-red-500/20 text-red-400",
          "hover:bg-red-500/20 disabled:opacity-50"
        )}
      >
        <ThumbsDown className="w-4 h-4" />
        Phản đối
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className={clsx(
          "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors",
          "bg-slate-700/50 border border-slate-600/30 text-slate-500",
          "hover:bg-slate-600/50 hover:text-slate-700"
        )}
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Export memoized component
export const ReportDetailModal = memo(ReportDetailModalComponent);
