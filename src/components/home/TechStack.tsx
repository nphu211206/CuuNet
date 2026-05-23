"use client";

import { motion } from "framer-motion";

const TECH_STACK = [
  { name: "Next.js", color: "#ffffff", icon: "▲" },
  { name: "React 19", color: "#61DAFB", icon: "⚛" },
  { name: "TypeScript", color: "#3178C6", icon: "TS" },
  { name: "TensorFlow.js", color: "#FF6F00", icon: "🧠" },
  { name: "Leaflet", color: "#199900", icon: "🗺" },
  { name: "Tailwind CSS", color: "#06B6D4", icon: "🎨" },
  { name: "Framer Motion", color: "#FF0055", icon: "✨" },
  { name: "Recharts", color: "#22C55E", icon: "📊" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
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

export default function TechStack() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080f] via-slate-900/20 to-[#06080f]" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Được xây dựng với
          </span>
          <h3 className="text-xl font-bold text-slate-300 mt-2">
            Công nghệ hàng đầu
          </h3>
        </motion.div>

        {/* Tech grid */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {TECH_STACK.map((tech, i) => (
            <motion.div
              key={tech.name}
              variants={fadeUp}
              custom={i}
              className="group flex items-center gap-3 px-5 py-4 rounded-xl bg-slate-900/40 border border-slate-700/20 hover:border-slate-600/40 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/30 cursor-default"
            >
              <span
                className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              >
                {tech.icon}
              </span>
              <div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {tech.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
