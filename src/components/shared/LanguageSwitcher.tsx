"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();

    const toggle = () => {
        setLocale(locale === "vi" ? "en" : "vi");
    };

    return (
        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={toggle}
            className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0066FF] hover:border-[#0066FF]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            title={locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
        >
            <span className="text-[11px] font-bold">
                {locale === "vi" ? "EN" : "VI"}
            </span>
        </motion.button>
    );
}