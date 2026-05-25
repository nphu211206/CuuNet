"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, Command, ArrowRight } from "lucide-react";
import Link from "next/link";

const SHORTCUTS = [
    { keys: ["Ctrl", "K"], description: "Mở Command Palette", category: "Điều hướng" },
    { keys: ["?"], description: "Hiện hướng dẫn phím tắt", category: "Điều hướng" },
    { keys: ["1"], description: "Chuyển đến Bản đồ", category: "Trang", href: "/map" },
    { keys: ["2"], description: "Chuyển đến AI Dự đoán", category: "Trang", href: "/predict" },
    { keys: ["3"], description: "Chuyển đến Báo cáo", category: "Trang", href: "/report" },
    { keys: ["4"], description: "Chuyển đến Cảnh báo", category: "Trang", href: "/alerts" },
    { keys: ["5"], description: "Chuyển đến Cứu trợ", category: "Trang", href: "/rescue" },
    { keys: ["6"], description: "Chuyển đến Dashboard", category: "Trang", href: "/dashboard" },
    { keys: ["7"], description: "Chuyển đến Giáo dục", category: "Trang", href: "/education" },
    { keys: ["Esc"], description: "Đóng modal/palette", category: "Chung" },
];

export default function KeyboardShortcutsGuide() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const grouped = SHORTCUTS.reduce<Record<string, typeof SHORTCUTS>>((acc, s) => {
        if (!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(s);
        return acc;
    }, {});

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Keyboard className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Phím tắt</h3>
                                        <p className="text-[10px] text-slate-400">Nhấn ? bất kỳ lúc nào để mở</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                                {Object.entries(grouped).map(([category, shortcuts]) => (
                                    <div key={category}>
                                        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            {category}
                                        </h4>
                                        <div className="space-y-1.5">
                                            {shortcuts.map((s, i) => (
                                                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <span className="text-xs text-slate-600">{s.description}</span>
                                                    <div className="flex items-center gap-1">
                                                        {s.keys.map((k, j) => (
                                                            <kbd
                                                                key={j}
                                                                className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium text-slate-500"
                                                            >
                                                                {k}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                                <p className="text-[10px] text-slate-400 text-center">
                                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono">Esc</kbd> để đóng
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}