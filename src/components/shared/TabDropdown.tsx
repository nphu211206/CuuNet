"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import clsx from "clsx";

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
}

interface TabDropdownProps<T extends string> {
  primaryTabs: TabItem<T>[];
  secondaryTabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export default function TabDropdown<T extends string>({
  primaryTabs,
  secondaryTabs,
  activeTab,
  onTabChange,
}: TabDropdownProps<T>) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if active tab is in secondary
  const isSecondaryActive = secondaryTabs.some((t) => t.key === activeTab);
  const activeSecondaryTab = secondaryTabs.find((t) => t.key === activeTab);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
      {/* Primary tabs */}
      {primaryTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium",
              "transition-all duration-200 border whitespace-nowrap",
              isActive
                ? "border-opacity-40 text-opacity-100"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50 hover:text-slate-300"
            )}
            style={
              isActive
                ? {
                    backgroundColor: `${tab.color}15`,
                    borderColor: `${tab.color}40`,
                    color: tab.color,
                  }
                : undefined
            }
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span
                className="text-[9px] px-1 rounded-full"
                style={{
                  backgroundColor: `${tab.color}25`,
                  color: tab.color,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* More dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={clsx(
            "flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium",
            "transition-all duration-200 border whitespace-nowrap",
            isSecondaryActive
              ? "border-opacity-40"
              : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:border-slate-600/50 hover:text-slate-300"
          )}
          style={
            isSecondaryActive && activeSecondaryTab
              ? {
                  backgroundColor: `${activeSecondaryTab.color}15`,
                  borderColor: `${activeSecondaryTab.color}40`,
                  color: activeSecondaryTab.color,
                }
              : undefined
          }
        >
          {isSecondaryActive && activeSecondaryTab ? (
            <>
              {activeSecondaryTab.icon}
              <span className="hidden sm:inline">{activeSecondaryTab.label}</span>
            </>
          ) : (
            <>
              <MoreHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm</span>
            </>
          )}
          <ChevronDown
            className={clsx(
              "w-3 h-3 transition-transform",
              isDropdownOpen && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full right-0 mt-1 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
            >
              <div className="p-1.5">
                {secondaryTabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        onTabChange(tab.key);
                        setIsDropdownOpen(false);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium",
                        "transition-all duration-200",
                        isActive
                          ? "border"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor: `${tab.color}15`,
                              borderColor: `${tab.color}30`,
                              color: tab.color,
                            }
                          : undefined
                      }
                    >
                      {tab.icon}
                      <span className="flex-1 text-left">{tab.label}</span>
                      {isActive && (
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tab.color }}
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
    </div>
  );
}