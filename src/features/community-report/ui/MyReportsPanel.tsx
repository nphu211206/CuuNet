"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  Trash2,
  Eye,
  TrendingUp,
  MapPin,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import type { CommunityReport, ReportStatus, MyReportsPanelProps } from "../lib/types";
import {
  DISASTER_CONFIG,
  SEVERITY_CONFIG,
  STATUS_CONFIG,
  TRUST_SCORE_COLORS,
} from "../config/report-config";

// ============================================================
// MY REPORTS PANEL COMPONENT
// ============================================================
// Panel hiển thị báo cáo của user hiện tại
// - MyReportsHeader: title + count + "Gửi mới" button
// - MyReportCard: compact card (type + title + status + date)
// - MyStatsSection: personal stats
// - MyReportsEmpty: empty state với CTA
// ============================================================

// === ANIMATION VARIANTS ===

const panelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

// === MAIN COMPONENT ===

function MyReportsPanelComponent({
  reports,
  stats,
  onReportClick,
  onNewReport,
  className,
}: MyReportsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Personal stats
  const personalStats = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter((r) => r.status === "verified").length;
    const verifiedPercent = total > 0 ? Math.round((verified / total) * 100) : 0;
    const avgTrust =
      total > 0
        ? Math.round(
            (reports.reduce((sum, r) => sum + r.verification.trustScore, 0) /
              total) *
              100
          ) / 100
        : 0;

    // Top province
    const provinceCounts: Record<string, number> = {};
    for (const report of reports) {
      const province = report.location.province;
      provinceCounts[province] = (provinceCounts[province] || 0) + 1;
    }
    let topProvince = { name: "", count: 0 };
    for (const [name, count] of Object.entries(provinceCounts)) {
      if (count > topProvince.count) topProvince = { name, count };
    }

    return { total, verified, verifiedPercent, avgTrust, topProvince };
  }, [reports]);

  // Display reports (show 5 or all)
  const displayReports = useMemo(() => {
    const sorted = [...reports].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return showAll ? sorted : sorted.slice(0, 5);
  }, [reports, showAll]);

  // Handle menu toggle
  const toggleMenu = useCallback((id: string) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handleClick = () => setActiveMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeMenu]);

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 overflow-hidden",
        className
      )}
    >
      {/* === HEADER === */}
      <MyReportsHeader
        count={reports.length}
        onNewReport={onNewReport}
      />

      {/* === PERSONAL STATS === */}
      <MyStatsSection stats={personalStats} />

      {/* === REPORT LIST === */}
      {reports.length === 0 ? (
        <MyReportsEmpty onNewReport={onNewReport} />
      ) : (
        <>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-slate-700/30"
          >
            {displayReports.map((report) => (
              <MyReportCard
                key={report.id}
                report={report}
                onClick={onReportClick}
                isMenuOpen={activeMenu === report.id}
                onToggleMenu={() => toggleMenu(report.id)}
              />
            ))}
          </motion.div>

          {/* Show more/less */}
          {reports.length > 5 && (
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="w-full flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 transition-colors"
            >
              {showAll ? (
                <>
                  Thu gọn
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </>
              ) : (
                <>
                  Xem thêm {reports.length - 5} báo cáo
                  <ChevronRight className="w-3 h-3 -rotate-90" />
                </>
              )}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

/**
 * My Reports Header: Title + count + "Gửi mới" button
 */
function MyReportsHeader({
  count,
  onNewReport,
}: {
  count: number;
  onNewReport?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-300">Báo cáo của tôi</h3>
        {count > 0 && (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-400">
            {count}
          </span>
        )}
      </div>
      {onNewReport && (
        <button
          onClick={onNewReport}
          className={clsx(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
            "bg-blue-500/10 border border-blue-500/20 text-blue-400",
            "hover:bg-blue-500/20"
          )}
        >
          <Plus className="w-3 h-3" />
          Gửi mới
        </button>
      )}
    </div>
  );
}

/**
 * My Stats Section: Personal statistics
 */
function MyStatsSection({
  stats,
}: {
  stats: {
    total: number;
    verified: number;
    verifiedPercent: number;
    avgTrust: number;
    topProvince: { name: string; count: number };
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3 border-b border-slate-700/30">
      {/* Total */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30">
        <FileText className="w-3.5 h-3.5 text-blue-400" />
        <div>
          <p className="text-xs font-semibold text-slate-300">{stats.total}</p>
          <p className="text-[10px] text-slate-500">Tổng cộng</p>
        </div>
      </div>

      {/* Verified % */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30">
        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
        <div>
          <p className="text-xs font-semibold text-slate-300">
            {stats.verifiedPercent}%
          </p>
          <p className="text-[10px] text-slate-500">Xác minh</p>
        </div>
      </div>

      {/* Avg Trust */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30">
        <Shield className="w-3.5 h-3.5 text-amber-400" />
        <div>
          <p className="text-xs font-semibold text-slate-300">
            {Math.round(stats.avgTrust * 100)}%
          </p>
          <p className="text-[10px] text-slate-500">TB tin cậy</p>
        </div>
      </div>

      {/* Top Province */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30">
        <MapPin className="w-3.5 h-3.5 text-red-400" />
        <div>
          <p className="text-xs font-semibold text-slate-300 truncate">
            {stats.topProvince.name || "—"}
          </p>
          <p className="text-[10px] text-slate-500">Tỉnh nhiều nhất</p>
        </div>
      </div>
    </div>
  );
}

/**
 * My Report Card: Compact card
 */
function MyReportCard({
  report,
  onClick,
  isMenuOpen,
  onToggleMenu,
}: {
  report: CommunityReport;
  onClick?: (report: CommunityReport) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const disasterConfig = DISASTER_CONFIG[report.type] ?? { icon: "⚠️", label: report.type, color: "#6B7280" };
  const statusConfig = STATUS_CONFIG[report.status] ?? { label: report.status, color: "#6B7280", icon: "❓" };

  // Time ago - cập nhật mỗi 60 giây
  const calculateTimeAgo = useCallback(() => {
    const now = Date.now();
    const then = new Date(report.createdAt).getTime();
    const diffMs = now - then;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Vừa xong";
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays < 7) return `${diffDays}d trước`;
    return new Date(report.createdAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }, [report.createdAt]);

  const [timeAgo, setTimeAgo] = useState(calculateTimeAgo);

  useEffect(() => {
    const interval = setInterval(() => setTimeAgo(calculateTimeAgo()), 60_000);
    return () => clearInterval(interval);
  }, [calculateTimeAgo]);

  // Trust score color
  const trustColor = useMemo(() => {
    const score = report.verification.trustScore;
    if (score >= 0.85) return "#22C55E";
    if (score >= 0.6) return "#84CC16";
    if (score >= 0.3) return "#EAB308";
    return "#EF4444";
  }, [report.verification.trustScore]);

  return (
    <motion.div
      variants={itemVariants}
      className="relative group"
    >
      <button
        onClick={() => onClick?.(report)}
        className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left"
      >
        {/* Type icon */}
        <span
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: `${disasterConfig.color}15` }}
        >
          {disasterConfig.icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-xs font-medium text-slate-300 truncate leading-tight">
            {report.title}
          </h4>

          {/* Status + time */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-medium"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.icon} {statusConfig.label}
            </span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">{timeAgo}</span>
          </div>
        </div>

        {/* Trust score */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: trustColor }}
          >
            {Math.round(report.verification.trustScore * 100)}%
          </span>
        </div>
      </button>

      {/* Menu button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
        >
          <MoreVertical className="w-3 h-3" />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 z-10 w-32 py-1 rounded-lg bg-slate-800 border border-slate-700/50 shadow-xl"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(report);
                  onToggleMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 transition-colors"
              >
                <Eye className="w-3 h-3" />
                Xem chi tiết
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * My Reports Empty: Empty state with CTA
 */
function MyReportsEmpty({
  onNewReport,
}: {
  onNewReport?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
        <FileText className="w-6 h-6 text-slate-600" />
      </div>
      <p className="text-sm text-slate-400 mb-1">Chưa có báo cáo nào</p>
      <p className="text-xs text-slate-500 text-center mb-4">
        Gửi báo cáo thiên tai để giúp cộng đồng
      </p>
      {onNewReport && (
        <button
          onClick={onNewReport}
          className={clsx(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors",
            "bg-blue-500/10 border border-blue-500/20 text-blue-400",
            "hover:bg-blue-500/20"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Gửi báo cáo đầu tiên
        </button>
      )}
    </div>
  );
}

// Export memoized component
export const MyReportsPanel = memo(MyReportsPanelComponent);
