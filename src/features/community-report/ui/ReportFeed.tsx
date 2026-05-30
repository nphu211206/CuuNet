"use client";

import {
  memo,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Inbox,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import type { CommunityReport, SortOption, ReportFeedProps } from "../lib/types";
import { REPORT_CONFIG, SORT_OPTIONS } from "../config/report-config";
import { ReportCard } from "./ReportCard";

// ============================================================
// REPORT FEED COMPONENT
// ============================================================
// Hiển thị danh sách báo cáo với infinite scroll
// - Header: count + sort dropdown + view toggle
// - Grid: responsive grid container
// - Skeleton: loading skeleton cards
// - Empty: illustration + reset filters CTA
// - Infinite scroll: IntersectionObserver sentinel
// ============================================================

// === INFINITE SCROLL HOOK ===

function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            callback();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "200px",
        }
      );

      observerRef.current.observe(node);
    },
    [callback, hasMore]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return sentinelRef;
}

// === ANIMATION VARIANTS ===

const feedContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const feedItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const sortDropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// === MAIN COMPONENT ===

function ReportFeedComponent({
  reports,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReportClick,
  onVote,
  className,
}: ReportFeedProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>("newest");

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      onLoadMore?.();
    }, [onLoadMore]),
    hasMore
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setCurrentSort(sort);
      setShowSortDropdown(false);
    },
    []
  );

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return;

    const handleClickOutside = () => setShowSortDropdown(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSortDropdown]);

  // Sort reports locally (client-side sort for current page)
  const sortedReports = useMemo(() => {
    const sorted = [...reports];
    switch (currentSort) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "mostSevere":
        sorted.sort((a, b) => {
          const weights: Record<string, number> = {
            critical: 4, high: 3, medium: 2, low: 1,
          };
          return (weights[b.severity] || 0) - (weights[a.severity] || 0);
        });
        break;
      case "mostVerified":
        sorted.sort((a, b) => {
          const order: Record<string, number> = {
            verified: 4, pending: 3, resolved: 2, rejected: 1,
          };
          return (order[b.status] || 0) - (order[a.status] || 0);
        });
        break;
      case "mostVotes":
        sorted.sort(
          (a, b) =>
            b.verification.upvotes +
            b.verification.downvotes -
            (a.verification.upvotes + a.verification.downvotes)
        );
        break;
    }
    return sorted;
  }, [reports, currentSort]);

  return (
    <div className={clsx("flex flex-col", className)}>
      {/* === FEED HEADER === */}
      <ReportFeedHeader
        count={reports.length}
        currentSort={currentSort}
        showSortDropdown={showSortDropdown}
        onToggleSort={() => setShowSortDropdown((prev) => !prev)}
        onSortChange={handleSortChange}
      />

      {/* === FEED CONTENT === */}
      {isLoading && reports.length === 0 ? (
        <ReportFeedSkeleton />
      ) : reports.length === 0 ? (
        <ReportFeedEmpty />
      ) : (
        <>
          {/* Report grid */}
          <motion.div
            variants={feedContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {sortedReports.map((report) => (
                <motion.div
                  key={report.id}
                  variants={feedItemVariants}
                  layout
                >
                  <ReportCard
                    report={report}
                    onClick={onReportClick}
                    onVote={onVote}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="py-8">
              <ReportFeedLoadMore isLoading={isLoading} />
            </div>
          )}

          {/* No more reports */}
          {!hasMore && reports.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">
                Đã hiển thị tất cả {reports.length} báo cáo
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// === SUB-COMPONENTS ===

/**
 * Feed Header: Count + Sort dropdown + View toggle
 */
function ReportFeedHeader({
  count,
  currentSort,
  showSortDropdown,
  onToggleSort,
  onSortChange,
}: {
  count: number;
  currentSort: SortOption;
  showSortDropdown: boolean;
  onToggleSort: () => void;
  onSortChange: (sort: SortOption) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Count */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-slate-700">
          Báo cáo cộng đồng
        </h2>
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-500">
          {count}
        </span>
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={onToggleSort}
          className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs",
            "bg-slate-100 border border-slate-200 text-slate-500",
            "hover:bg-slate-200 hover:text-slate-700 transition-colors"
          )}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {SORT_OPTIONS[currentSort]?.label || "Sắp xếp"}
          <ChevronDown
            className={clsx(
              "w-3 h-3 transition-transform",
              showSortDropdown && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {showSortDropdown && (
            <motion.div
              variants={sortDropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-full mt-1 z-50 w-48 py-1 rounded-lg bg-slate-200 border border-slate-200 shadow-xl shadow-black/30"
            >
              {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                <button
                  key={key}
                  onClick={() => onSortChange(key as SortOption)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                    currentSort === key
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  )}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                  {currentSort === key && (
                    <span className="ml-auto text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Skeleton: Loading skeleton cards with pulse animation
 */
function ReportFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: REPORT_CONFIG.SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse"
        >
          {/* Header skeleton */}
          <div className="flex items-start gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50" />
            <div className="flex-1">
              <div className="h-4 w-3/4 rounded bg-slate-700/50 mb-2" />
              <div className="flex gap-1.5">
                <div className="h-4 w-16 rounded bg-slate-700/30" />
                <div className="h-4 w-20 rounded bg-slate-700/30" />
              </div>
            </div>
          </div>

          {/* Body skeleton */}
          <div className="space-y-2 mb-3">
            <div className="h-3 w-1/2 rounded bg-slate-700/30" />
            <div className="h-3 w-1/3 rounded bg-slate-700/20" />
            <div className="h-3 w-full rounded bg-slate-700/20" />
            <div className="h-3 w-2/3 rounded bg-slate-700/20" />
          </div>

          {/* Meta skeleton */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex gap-3">
              <div className="h-3 w-8 rounded bg-slate-700/30" />
              <div className="h-3 w-16 rounded bg-slate-700/30" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-12 rounded bg-slate-700/30" />
              <div className="h-6 w-12 rounded bg-slate-700/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty: No reports found
 */
function ReportFeedEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Illustration */}
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        <Inbox className="w-10 h-10 text-slate-600" />
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-slate-500 mb-2">
        Chưa có báo cáo nào
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">
        Không tìm thấy báo cáo phù hợp với bộ lọc hiện tại. Hãy thử thay đổi
        bộ lọc hoặc tạo báo cáo mới.
      </p>

      {/* Reset filters CTA */}
      <button
        onClick={() => window.location.reload()}
        className={clsx(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
          "bg-slate-100 border border-slate-200 text-slate-500",
          "hover:bg-slate-200 hover:text-slate-700 transition-colors"
        )}
      >
        <RefreshCw className="w-4 h-4" />
        Tải lại trang
      </button>
    </motion.div>
  );
}

/**
 * Load More: Loading indicator for infinite scroll
 */
function ReportFeedLoadMore({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {isLoading ? (
        <>
          <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin" />
          <span className="text-xs text-slate-500">Đang tải thêm...</span>
        </>
      ) : (
        <span className="text-xs text-slate-600">Kéo xuống để xem thêm</span>
      )}
    </div>
  );
}

// Export memoized component
export const ReportFeed = memo(ReportFeedComponent);
