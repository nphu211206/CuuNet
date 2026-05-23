"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GuideStep {
  icon: ReactNode;
  text: string;
}

interface IntroSectionProps {
  moduleNumber: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  guideSteps: GuideStep[];
  accentColor?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function IntroSection({
  moduleNumber,
  icon,
  title,
  subtitle,
  guideSteps,
  accentColor = "#3B82F6",
}: IntroSectionProps) {
  return (
    <section className="relative py-14 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accentColor}, transparent 60%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0} className="mb-5">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{
                backgroundColor: `${accentColor}10`,
                borderColor: `${accentColor}25`,
                color: accentColor,
              }}
            >
              <span className="scale-90">{icon}</span>
              Module {moduleNumber}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-heading, inherit)" }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-base md:text-lg text-slate-400 mb-8 max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Guide steps */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap gap-3"
          >
            {guideSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3 + i * 0.08,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60 transition-all duration-300 group cursor-default"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                  }}
                >
                  {step.icon}
                </span>
                <span className="text-xs text-slate-300 font-medium group-hover:text-slate-200 transition-colors">
                  {step.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}