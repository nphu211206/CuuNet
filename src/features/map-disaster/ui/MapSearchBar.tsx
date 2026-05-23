"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin } from "lucide-react";
import { VIETNAM_PROVINCES } from "../config/map-config";

interface MapSearchBarProps {
  onProvinceSelect: (province: { name: string; lat: number; lng: number }) => void;
}

export default function MapSearchBar({ onProvinceSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return VIETNAM_PROVINCES.filter((p) =>
      p.name.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (province: typeof VIETNAM_PROVINCES[0]) => {
    onProvinceSelect(province);
    setQuery(province.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm tỉnh/thành phố..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {results.map((province, i) => (
              <button
                key={province.name}
                onClick={() => handleSelect(province)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-medium">{province.name}</span>
                <span className="ml-auto text-[10px] text-slate-600">
                  {province.lat.toFixed(2)}, {province.lng.toFixed(2)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}