"use client";

import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

export default function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  const roundedMap = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  return (
    <div
      className={clsx("animate-skeleton", roundedMap[rounded], className)}
      style={{ width, height }}
    />
  );
}

// Preset skeleton components

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={clsx("glass-card p-5 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton width="40px" height="40px" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="14px" />
          <Skeleton width="40%" height="10px" />
        </div>
      </div>
      <Skeleton width="100%" height="10px" />
      <Skeleton width="80%" height="10px" />
    </div>
  );
}

export function SkeletonStatBar({ count = 6 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${count} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-2">
          <Skeleton width="24px" height="24px" rounded="lg" />
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="10px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20">
          <Skeleton width="32px" height="32px" rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton width="70%" height="12px" />
            <Skeleton width="40%" height="10px" />
          </div>
          <Skeleton width="60px" height="24px" rounded="lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMap({ height = "400px" }: { height?: string }) {
  return (
    <div
      className="glass-card flex items-center justify-center animate-pulse"
      style={{ minHeight: height }}
    >
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-600">Đang tải bản đồ...</p>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}