"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Map, Brain, Users, AlertTriangle, HandHeart, BarChart3, BookOpen,
    Search, Command, ArrowRight, MapPin, Siren, Shield, Zap,
    Globe, Clock, FileText, Settings, Home, ChevronRight,
} from "lucide-react";

interface CommandItem {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
    category: string;
    color: string;
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Define all commands
    const commands: CommandItem[] = useMemo(() => [
        // Navigation
        { id: "nav-home", label: "Trang chủ", description: "Về trang chủ CứuNet", icon: <Home className="w-4 h-4" />, shortcut: "⌘H", action: () => router.push("/"), category: "Điều hướng", color: "#0066FF" },
        { id: "nav-map", label: "Bản đồ Thiên tai", description: "Xem bản đồ real-time 63 tỉnh thành", icon: <Map className="w-4 h-4" />, shortcut: "⌘1", action: () => router.push("/map"), category: "Điều hướng", color: "#3B82F6" },
        { id: "nav-predict", label: "AI Dự đoán", description: "Mô hình ML dự đoán rủi ro", icon: <Brain className="w-4 h-4" />, shortcut: "⌘2", action: () => router.push("/predict"), category: "Điều hướng", color: "#8B5CF6" },
        { id: "nav-report", label: "Báo cáo Cộng đồng", description: "Gửi và xem báo cáo thiên tai", icon: <Users className="w-4 h-4" />, shortcut: "⌘3", action: () => router.push("/report"), category: "Điều hướng", color: "#22C55E" },
        { id: "nav-alerts", label: "Cảnh báo & SOS", description: "Hệ thống cảnh báo và SOS khẩn cấp", icon: <Siren className="w-4 h-4" />, shortcut: "⌘4", action: () => router.push("/alerts"), category: "Điều hướng", color: "#EF4444" },
        { id: "nav-rescue", label: "Phối hợp Cứu trợ", description: "Điều phối cứu hộ ICS", icon: <HandHeart className="w-4 h-4" />, shortcut: "⌘5", action: () => router.push("/rescue"), category: "Điều hướng", color: "#F59E0B" },
        { id: "nav-dashboard", label: "Dashboard Thống kê", description: "Trực quan hóa dữ liệu thiên tai", icon: <BarChart3 className="w-4 h-4" />, shortcut: "⌘6", action: () => router.push("/dashboard"), category: "Điều hướng", color: "#06B6D4" },
        { id: "nav-education", label: "Giáo dục Sinh tồn", description: "Khóa học và kỹ năng sinh tồn", icon: <BookOpen className="w-4 h-4" />, shortcut: "⌘7", action: () => router.push("/education"), category: "Điều hướng", color: "#14B8A6" },
        // Quick actions
        { id: "action-sos", label: "🚨 Gửi SOS khẩn cấp", description: "Gửi tín hiệu cứu hộ ngay lập tức", icon: <Siren className="w-4 h-4" />, action: () => router.push("/alerts"), category: "Hành động nhanh", color: "#EF4444" },
        { id: "action-report", label: "📝 Gửi báo cáo mới", description: "Báo cáo thiên tai từ cộng đồng", icon: <FileText className="w-4 h-4" />, action: () => router.push("/report"), category: "Hành động nhanh", color: "#22C55E" },
        // Info
        { id: "info-about", label: "Về CứuNet", description: "Nền tảng quản lý thiên AI & ML", icon: <Shield className="w-4 h-4" />, action: () => { }, category: "Thông tin", color: "#0066FF" },
    ], [router]);

    // Filter commands
    const filtered = useMemo(() => {
        if (!query.trim()) return commands;
        const q = query.toLowerCase();
        return commands.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.category.toLowerCase().includes(q)
        );
    }, [query, commands]);

    // Group by category
    const grouped = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {};
        for (const item of filtered) {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        }
        return groups;
    }, [filtered]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
                setQuery("");
                setSelectedIndex(0);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                filtered[selectedIndex].action();
                setIsOpen(false);
            }
        },
        [filtered, selectedIndex]
    );

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    return (
        <>
            {/* Trigger button — fixed bottom-left on desktop */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => { setIsOpen(true); setQuery(""); setSelectedIndex(0); }}
                className="hidden md:flex fixed bottom-6 left-6 z-40 items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-slate-500 hover:text-[#0066FF] group"
                title="Command Palette (Ctrl+K)"
            >
                <Command className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Ctrl+K</span>
            </motion.button>

            {/* Command Palette Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Palette */}
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-xl"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                                {/* Search input */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Tìm trang, tính năng, dữ liệu..."
                                        className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                                    />
                                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-500 border border-slate-200">
                                        ESC
                                    </kbd>
                                </div>

                                {/* Results */}
                                <div className="max-h-[60vh] overflow-y-auto py-2">
                                    {Object.entries(grouped).map(([category, items]) => (
                                        <div key={category}>
                                            <div className="px-4 py-1.5">
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    {category}
                                                </span>
                                            </div>
                                            {items.map((item) => {
                                                const globalIndex = filtered.indexOf(item);
                                                const isSelected = globalIndex === selectedIndex;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            item.action();
                                                            setIsOpen(false);
                                                        }}
                                                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected
                                                                ? "bg-[#0066FF]/5"
                                                                : "hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <span
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                                            style={{ backgroundColor: `${item.color}12`, color: item.color }}
                                                        >
                                                            {item.icon}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium ${isSelected ? "text-[#0066FF]" : "text-slate-700"}`}>
                                                                {item.label}
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 truncate">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        {item.shortcut && (
                                                            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-400 border border-slate-200 shrink-0">
                                                                {item.shortcut}
                                                            </kbd>
                                                        )}
                                                        {isSelected && (
                                                            <ArrowRight className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}

                                    {filtered.length === 0 && (
                                        <div className="px-4 py-8 text-center">
                                            <p className="text-sm text-slate-400">Không tìm thấy kết quả</p>
                                            <p className="text-[11px] text-slate-300 mt-1">Thử từ khóa khác</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <kbd className="px-1 py-0.5 rounded bg-slate-100 text-[9px] border border-slate-200">↑↓</kbd>
                                            Di chuyển
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <kbd className="px-1 py-0.5 rounded bg-slate-100 text-[9px] border border-slate-200">↵</kbd>
                                            Chọn
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <kbd className="px-1 py-0.5 rounded bg-slate-100 text-[9px] border border-slate-200">esc</kbd>
                                            Đóng
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-300">CứuNet v0.1</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}