"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X } from "lucide-react";
import { TILE_OPTIONS, type TileMode } from "../config/map-config";

interface TileToggleProps {
  currentMode: TileMode;
  onModeChange: (mode: TileMode) => void;
}

export default function TileToggle({ currentMode, onModeChange }: TileToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const modes: TileMode[] = ["light", "dark", "satellite"];

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-all shadow-lg"
        title="Chế độ bản đồ"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-12 right-0 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
          >
            <div className="p-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold px-2 py-1.5">
                Chế độ bản đồ
              </p>
              {modes.map((mode) => {
                const option = TILE_OPTIONS[mode];
                const isActive = currentMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      onModeChange(mode);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span className="font-medium text-xs">{option.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="tile-active"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}