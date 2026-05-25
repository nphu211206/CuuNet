"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CompactPageHeaderProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
    accentColor?: string;
    actions?: ReactNode;
}

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.06,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};

export default function CompactPageHeader({
    icon,
    title,
    subtitle,
    accentColor = "#0066FF",
    actions,
}: CompactPageHeaderProps) {
    return (
        <div className="mb-6 pt-2">
            <motion.div
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
            >
                <div>
                    <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2.5 mb-2">
                        <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: accentColor }}
                        >
                            {icon}
                        </span>
                        <h1
                            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
                            style={{ fontFamily: "var(--font-heading, inherit)" }}
                        >
                            {title}
                        </h1>
                    </motion.div>
                    <motion.p variants={fadeUp} custom={1} className="text-sm text-slate-500 max-w-xl leading-relaxed">
                        {subtitle}
                    </motion.p>
                </div>
                {actions && (
                    <motion.div variants={fadeUp} custom={2} className="flex items-center gap-2 shrink-0">
                        {actions}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}