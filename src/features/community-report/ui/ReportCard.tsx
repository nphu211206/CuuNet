"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Camera,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  CommunityReport,
  ReportStatus,
  VoteType,
  ReportCardProps,
} from "../lib/types";
import {
  DISASTER_CONFIG,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
  TRUST_SCORE_COLORS,
  VERIFICATION_CONFIG,
} from "../config/report-config";

// ============================================================
// REPORT CARD COMPONENT
// ============================================================
// Card hiển thị thông tin tóm tắt một báo cáo thiên tai
// - Header: icon loại thiên tai + tiêu đề + badges
// - Body: vị trí + thời gian + mô tả rút gọn
// - Meta: ảnh + vote buttons + trust score + reporter
// - Animation: Framer Motion entrance + vote tap
// ============================================================

// === ANIMATION VARIANTS ===

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

const voteButtonVariants = {
  tap: { scale: 0.85 },
  voted: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3 },
  },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// === MAIN COMPONENT ===

function ReportCardComponent({
  report,
  onClick,
  onVote,
  isCompact = false,
  className,
}: ReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize config lookups with fallback for corrupted data
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

  // Handle card click
  const handleCardClick = useCallback(() => {
    onClick?.(report);
  }, [onClick, report]);

  // Handle vote click (stop propagation để không trigger card click)
  const handleVote = useCallback(
    (voteType: VoteType) => (e: React.MouseEvent) => {
      e.stopPropagation();
      onVote?.(report.id, voteType);
    },
    [onVote, report.id]
  );

  // Handle expand toggle
  const handleExpandToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded((prev) => !prev);
    },
    []
  );

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

  // Trust score label
  const trustScoreLabel = useMemo(() => {
    const score = report.verification.trustScore;
    if (score >= TRUST_SCORE_COLORS.high.min)
      return TRUST_SCORE_COLORS.high.label;
    if (score >= TRUST_SCORE_COLORS.good.min)
      return TRUST_SCORE_COLORS.good.label;
    if (score >= TRUST_SCORE_COLORS.medium.min)
      return TRUST_SCORE_COLORS.medium.label;
    return TRUST_SCORE_COLORS.low.label;
  }, [report.verification.trustScore]);

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      onClick={handleCardClick}
      className={clsx(
        "group relative rounded-xl border transition-all duration-200",
        "bg-slate-900/60 backdrop-blur-sm",
        "border-slate-700/50 hover:border-slate-600/70",
        "hover:shadow-lg hover:shadow-black/20",
        "cursor-pointer overflow-hidden",
        isCompact ? "p-3" : "p-4",
        className
      )}
    >
      {/* Severity indicator bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ backgroundColor: severityConfig.color }}
      />

      {/* === HEADER === */}
      <ReportCardHeader
        type={report.type}
        title={report.title}
        severity={report.severity}
        status={report.status}
        disasterConfig={disasterConfig}
        severityConfig={severityConfig}
        statusConfig={statusConfig}
        isCompact={isCompact}
      />

      {/* === BODY === */}
      {!isCompact && (
        <ReportCardBody
          location={report.location}
          createdAt={report.createdAt}
          description={report.description}
        />
      )}

      {/* === META === */}
      <ReportCardMeta
        report={report}
        disasterConfig={disasterConfig}
        severityConfig={severityConfig}
        statusConfig={statusConfig}
        trustScoreColor={trustScoreColor}
        trustScoreLabel={trustScoreLabel}
        onVote={onVote}
        handleVote={handleVote}
        isCompact={isCompact}
        isExpanded={isExpanded}
        onExpandToggle={handleExpandToggle}
      />

      {/* === EXPANDED CONTENT === */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <ExpandedContent report={report} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline indicator */}
      {report.isOffline && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Offline
          </span>
        </div>
      )}
    </motion.article>
  );
}

// === SUB-COMPONENTS ===

/**
 * Header: Type icon + Title + Severity badge + Status badge
 */
function ReportCardHeader({
  type,
  title,
  severity,
  status,
  disasterConfig,
  severityConfig,
  statusConfig,
  isCompact,
}: {
  type: DisasterType;
  title: string;
  severity: SeverityLevel;
  status: ReportStatus;
  disasterConfig: { icon: string; label: string; color: string };
  severityConfig: { label: string; color: string };
  statusConfig: { icon: string; label: string; color: string };
  isCompact: boolean;
}) {
  return (
    <div className="flex items-start gap-2 mb-2">
      {/* Type icon */}
      <span
        className={clsx(
          "flex-shrink-0 flex items-center justify-center rounded-lg",
          isCompact ? "w-8 h-8 text-base" : "w-10 h-10 text-lg"
        )}
        style={{ backgroundColor: `${disasterConfig.color}15` }}
        title={disasterConfig.label}
      >
        {disasterConfig.icon}
      </span>

      {/* Title + badges */}
      <div className="flex-1 min-w-0">
        <h3
          className={clsx(
            "font-semibold text-slate-200 leading-tight truncate",
            isCompact ? "text-sm" : "text-base"
          )}
        >
          {title}
        </h3>

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {/* Severity badge */}
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
            style={{
              color: severityConfig.color,
              backgroundColor: `${severityConfig.color}10`,
              borderColor: `${severityConfig.color}30`,
            }}
          >
            {severityConfig.label}
          </span>

          {/* Status badge */}
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
            style={{
              color: statusConfig.color,
              backgroundColor: `${statusConfig.color}10`,
              borderColor: `${statusConfig.color}30`,
            }}
          >
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Body: Location + Time + Truncated description
 */
function ReportCardBody({
  location,
  createdAt,
  description,
}: {
  location: CommunityReport["location"];
  createdAt: string;
  description: string;
}) {
  return (
    <div className="mb-3">
      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <MapPin className="w-3 h-3 flex-shrink-0 text-slate-500" />
        <span className="truncate">
          {location.district}, {location.province}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <TimeAgo dateString={createdAt} />
      </div>

      {/* Description (truncated) */}
      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * Meta: Photo count + Vote buttons + Trust score + Reporter
 */
function ReportCardMeta({
  report,
  disasterConfig,
  severityConfig,
  statusConfig,
  trustScoreColor,
  trustScoreLabel,
  onVote,
  handleVote,
  isCompact,
  isExpanded,
  onExpandToggle,
}: {
  report: CommunityReport;
  disasterConfig: { icon: string; label: string; color: string };
  severityConfig: { label: string; color: string };
  statusConfig: { icon: string; label: string; color: string };
  trustScoreColor: string;
  trustScoreLabel: string;
  onVote?: (reportId: string, voteType: VoteType) => void;
  handleVote: (
    voteType: VoteType
  ) => (e: React.MouseEvent) => void;
  isCompact: boolean;
  isExpanded: boolean;
  onExpandToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-700/30">
      {/* Left: Photo count + Reporter */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {/* Photo count */}
        {report.photos.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Camera className="w-3 h-3" />
            {report.photos.length}
          </span>
        )}

        {/* Reporter */}
        <span className="inline-flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[80px]">
            {report.reporter.isAnonymous ? "Ẩn danh" : report.reporter.name}
          </span>
        </span>
      </div>

      {/* Right: Vote buttons + Trust score + Expand */}
      <div className="flex items-center gap-2">
        {/* Vote buttons */}
        {onVote && (
          <div className="flex items-center gap-1">
            {/* Upvote */}
            <motion.button
              variants={voteButtonVariants}
              whileTap="tap"
              onClick={handleVote("up")}
              className={clsx(
                "inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-xs transition-colors",
                "hover:bg-green-500/10 hover:text-green-400",
                "text-slate-500"
              )}
              title="Xác nhận báo cáo"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{report.verification.upvotes}</span>
            </motion.button>

            {/* Downvote */}
            <motion.button
              variants={voteButtonVariants}
              whileTap="tap"
              onClick={handleVote("down")}
              className={clsx(
                "inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-xs transition-colors",
                "hover:bg-red-500/10 hover:text-red-400",
                "text-slate-500"
              )}
              title="Báo cáo không chính xác"
            >
              <ThumbsDown className="w-3 h-3" />
              <span>{report.verification.downvotes}</span>
            </motion.button>
          </div>
        )}

        {/* Trust score */}
        <TrustScoreBar
          score={report.verification.trustScore}
          color={trustScoreColor}
          label={trustScoreLabel}
          badge={report.verification.badge}
          isCompact={isCompact}
        />

        {/* Expand button */}
        <button
          onClick={onExpandToggle}
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
          title={isExpanded ? "Thu gọn" : "Xem thêm"}
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Trust Score Bar: Animated progress bar with color
 */
function TrustScoreBar({
  score,
  color,
  label,
  badge,
  isCompact,
}: {
  score: number;
  color: string;
  label: string;
  badge: "verified" | "disputed" | null;
  isCompact: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${Math.round(score * 100)}%`}>
      {/* Badge icon */}
      {badge === "verified" && (
        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
      )}
      {badge === "disputed" && (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      )}

      {/* Progress bar */}
      {!isCompact && (
        <div className="w-12 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      )}

      {/* Score text */}
      <span
        className="text-[10px] font-medium tabular-nums"
        style={{ color }}
      >
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

/**
 * TimeAgo: Hiển thị thời gian tương đối
 * "2 giờ trước", "3 ngày trước", "Vừa xong"
 */
function TimeAgo({ dateString }: { dateString: string }) {
  const calculateTimeAgo = useCallback(() => {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
    if (diffMonths < 12) return `${diffMonths} tháng trước`;

    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [dateString]);

  const [timeAgoText, setTimeAgoText] = useState(calculateTimeAgo);

  // Cập nhật mỗi 60 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgoText(calculateTimeAgo());
    }, 60_000);
    return () => clearInterval(interval);
  }, [calculateTimeAgo]);

  return <span>{timeAgoText}</span>;
}

/**
 * Expanded Content: Hiển thị thêm chi tiết khi expand
 */
function ExpandedContent({ report }: { report: CommunityReport }) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-3">
      {/* Full description */}
      <div>
        <h4 className="text-xs font-medium text-slate-400 mb-1">
          Mô tả chi tiết
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          {report.description}
        </p>
      </div>

      {/* Photos preview */}
      {report.photos.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-1.5">
            Ảnh đính kèm ({report.photos.length})
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {report.photos.slice(0, 3).map((photo) => (
              <div
                key={photo.id}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-800"
              >
                <img
                  src={photo.thumbnail}
                  alt={photo.caption || "Ảnh báo cáo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {report.photos.length > 3 && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                +{report.photos.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification details */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Tin cậy: {Math.round(report.verification.trustScore * 100)}%
        </span>
        <span>
          {report.verification.upvotes} xác nhận · {report.verification.downvotes} phản đối
        </span>
      </div>

      {/* Reporter info */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <User className="w-3 h-3" />
        <span>
          {report.reporter.isAnonymous
            ? "Ẩn danh"
            : report.reporter.name}
        </span>
        {!report.reporter.isAnonymous && (
          <span className="text-slate-600">
            · {report.reporter.reportCount} báo cáo
          </span>
        )}
      </div>
    </div>
  );
}

// Export memoized component
export const ReportCard = memo(ReportCardComponent);
