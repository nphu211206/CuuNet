"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

    return (
        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={toggleTheme}
            className="relative w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0066FF] dark:hover:text-[#00C9A7] hover:border-[#0066FF]/30 dark:hover:border-[#00C9A7]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            title={resolvedTheme === "light" ? "Chế độ tối" : "Chế độ sáng"}
            aria-label={resolvedTheme === "light" ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
        >
            <motion.div
                initial={false}
                animate={{ rotate: resolvedTheme === "dark" ? 180 : 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
                {resolvedTheme === "light" ? (
                    <Moon className="w-4 h-4" />
                ) : (
                    <Sun className="w-4 h-4" />
                )}
            </motion.div>
        </motion.button>
    );
}