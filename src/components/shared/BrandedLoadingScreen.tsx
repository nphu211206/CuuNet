"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BrandedLoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsLoading(false), 300);
                    return 100;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 100);
        return () => clearInterval(timer);
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, #0A1628 0%, #0E2A4A 25%, #163D6B 50%, #1E5294 75%, #2563EB 100%)",
                    }}
                >
                    {/* Animated particles background */}
                    <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: Math.random() * 4 + 2,
                                    height: Math.random() * 4 + 2,
                                    backgroundColor: `rgba(0, 102, 255, ${Math.random() * 0.3 + 0.1})`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -200, 0],
                                    opacity: [0, 0.8, 0],
                                    scale: [0, 1, 0],
                                }}
                                transition={{
                                    duration: Math.random() * 3 + 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>

                    {/* Gradient orbs */}
                    <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[200px] top-1/4 left-1/4" />
                    <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[150px] bottom-1/4 right-1/4" />

                    {/* Logo animation */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 mb-8"
                    >
                        {/* Shield icon */}
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] flex items-center justify-center shadow-2xl shadow-blue-500/30 mx-auto"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </motion.div>

                        {/* Pulse rings */}
                        <motion.div
                            animate={{ scale: [1, 2, 3], opacity: [0.3, 0.1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inset-0 rounded-2xl border-2 border-blue-400/30"
                        />
                        <motion.div
                            animate={{ scale: [1, 2, 3], opacity: [0.3, 0.1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                            className="absolute inset-0 rounded-2xl border-2 border-cyan-400/20"
                        />
                    </motion.div>

                    {/* Brand name */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="relative z-10 text-center"
                    >
                        <h1
                            className="text-5xl font-black text-white mb-2 tracking-tighter"
                            style={{ fontFamily: "var(--font-heading, inherit)" }}
                        >
                            Cứu
                            <span className="text-gradient-flow">Net</span>
                        </h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm text-blue-200/70 tracking-widest uppercase"
                        >
                            Nền tảng Quản lý Thiên tai Thông minh
                        </motion.p>
                    </motion.div>

                    {/* Progress bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="relative z-10 mt-10 w-64"
                    >
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C9A7]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-blue-300/50">Đang tải...</span>
                            <span className="text-[10px] text-blue-300/50 font-mono">
                                {Math.min(Math.round(progress), 100)}%
                            </span>
                        </div>
                    </motion.div>

                    {/* Loading text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="relative z-10 mt-6 flex items-center gap-2"
                    >
                        <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-[#00C9A7]"
                        />
                        <span className="text-[11px] text-blue-300/50">
                            {progress < 30
                                ? "Khởi tạo hệ thống..."
                                : progress < 60
                                    ? "Tải dữ liệu thiên tai..."
                                    : progress < 90
                                        ? "Kết nối AI..."
                                        : "Sẵn sàng!"}
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}