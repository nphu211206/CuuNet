"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Clock, ChevronUp, ChevronDown } from "lucide-react";
import type { DisasterEvent } from "@/lib/types";
import { SEVERITY_COLORS } from "../config/map-config";
import { cn } from "@/lib/utils";

interface TimelineSliderProps {
  disasters: DisasterEvent[];
  onTimeChange?: (timestamp: string) => void;
  onFilterByTime?: (disasters: DisasterEvent[]) => void;
}

export default function TimelineSlider({
  disasters,
  onTimeChange,
  onFilterByTime,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sortedDisasters = useMemo(
    () =>
      [...disasters].sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
    [disasters]
  );

  const timeRange = useMemo(() => {
    if (sortedDisasters.length === 0) return { start: 0, end: 0 };
    const start = new Date(sortedDisasters[0].startDate).getTime();
    const end = new Date(
      sortedDisasters[sortedDisasters.length - 1].startDate
    ).getTime();
    return { start, end };
  }, [sortedDisasters]);

  const filteredDisasters = useMemo(() => {
    if (sortedDisasters.length === 0) return [];
    const currentDisaster = sortedDisasters[currentIndex];
    if (!currentDisaster) return [];
    const currentTime = new Date(currentDisaster.startDate).getTime();
    return sortedDisasters.filter(
      (d) => new Date(d.startDate).getTime() <= currentTime
    );
  }, [sortedDisasters, currentIndex]);

  useEffect(() => {
    onFilterByTime?.(filteredDisasters);
  }, [filteredDisasters, onFilterByTime]);

  useEffect(() => {
    const currentDisaster = sortedDisasters[currentIndex];
    if (currentDisaster) {
      onTimeChange?.(currentDisaster.startDate);
    }
  }, [currentIndex, sortedDisasters, onTimeChange]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= sortedDisasters.length - 1) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  }, [sortedDisasters.length]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleReset = useCallback(() => {
    handlePause();
    setCurrentIndex(0);
  }, [handlePause]);

  const handleEnd = useCallback(() => {
    handlePause();
    setCurrentIndex(sortedDisasters.length - 1);
  }, [handlePause, sortedDisasters.length]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || sortedDisasters.length === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const index = Math.round(percent * (sortedDisasters.length - 1));
      setCurrentIndex(index);
    },
    [sortedDisasters.length]
  );

  const handleDrag = useCallback(
    (_: any, info: { point: { x: number } }) => {
      if (!trackRef.current || sortedDisasters.length === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = info.point.x - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const index = Math.round(percent * (sortedDisasters.length - 1));
      setCurrentIndex(index);
    },
    [sortedDisasters.length]
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentDisaster = sortedDisasters[currentIndex];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[1000] bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 transition-all",
        isExpanded ? "h-40" : "h-20"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 border border-slate-200 rounded-t-lg text-slate-500 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-500 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleEnd}
              className="p-1.5 text-slate-500 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Track */}
          <div className="flex-1 relative">
            <div
              ref={trackRef}
              className="relative h-2 rounded-full overflow-hidden bg-slate-100 cursor-pointer"
              onClick={handleTrackClick}
            >
              {/* Severity segments */}
              {sortedDisasters.map((disaster, i) => {
                const width =
                  100 / Math.max(1, sortedDisasters.length);
                return (
                  <div
                    key={disaster.id}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${(i / sortedDisasters.length) * 100}%`,
                      width: `${width}%`,
                      backgroundColor: SEVERITY_COLORS[disaster.severity],
                      opacity: i <= currentIndex ? 0.6 : 0.15,
                    }}
                  />
                );
              })}

              {/* Playback head */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${sortedDisasters.length > 0 ? (currentIndex / sortedDisasters.length) * 100 : 0}%`,
                  boxShadow: "0 0 12px rgba(59, 130, 246, 0.6)",
                }}
                drag="x"
                dragConstraints={trackRef}
                dragElastic={0}
                dragMomentum={false}
                onDrag={handleDrag}
              />
            </div>
          </div>

          {/* Time info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {currentDisaster
                ? new Date(currentDisaster.startDate).toLocaleDateString(
                    "vi-VN",
                    { day: "2-digit", month: "2-digit" }
                  )
                : "--/--"}
            </span>
          </div>
        </div>

        {/* Expanded info */}
        <AnimatePresence>
          {isExpanded && currentDisaster && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        SEVERITY_COLORS[currentDisaster.severity],
                    }}
                  />
                  <span className="text-white font-medium">
                    {currentDisaster.title}
                  </span>
                </div>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500">
                  {currentDisaster.location.province}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500">
                  {currentDisaster.affectedPeople.toLocaleString("vi-VN")} người
                  ảnh hưởng
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {currentDisaster.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
