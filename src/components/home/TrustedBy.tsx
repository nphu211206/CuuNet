"use client";

import { motion } from "framer-motion";

const PARTNERS = [
  { name: "UNDP Vietnam", abbr: "UNDP", color: "#0072C6" },
  { name: "Ban Chỉ huy PCTT", abbr: "PCTT", color: "#EF4444" },
  { name: "TTTMKTTVQG", abbr: "TTTMK", color: "#22C55E" },
  { name: "NASA EarthData", abbr: "NASA", color: "#FC3D21" },
  { name: "GDACS", abbr: "GDACS", color: "#F59E0B" },
  { name: "EM-DAT", abbr: "EMDAT", color: "#8B5CF6" },
  { name: "Open-Meteo", abbr: "OMETEO", color: "#06B6D4" },
  { name: "TensorFlow", abbr: "TF", color: "#FF6F00" },
  { name: "Red Cross VN", abbr: "RCVN", color: "#DC2626" },
  { name: "VNDMA", abbr: "VNDMA", color: "#3B82F6" },
  { name: "IFRC", abbr: "IFRC", color: "#E53E3E" },
  { name: "UNDRR", abbr: "UNDRR", color: "#1D4ED8" },
];

function PartnerLogo({ name, abbr, color }: { name: string; abbr: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 shrink-0 group cursor-default">
      {/* Logo mark */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${color}cc, ${color}80)`,
          boxShadow: `0 0 0 0 ${color}00`,
        }}
      >
        {abbr.slice(0, 2)}
      </div>
      {/* Name */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors whitespace-nowrap">
          {name}
        </span>
        <span className="text-[10px] text-slate-600 uppercase tracking-wider">Đối tác</span>
      </div>
    </div>
  );
}

export default function TrustedBy() {
  const allPartners = [...PARTNERS, ...PARTNERS];

  return (
    <section className="py-16 relative overflow-hidden border-t border-b border-slate-800/20">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080f] via-slate-900/10 to-[#06080f]" />

      <div className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10 px-6"
        >
          <p className="text-[11px] text-slate-600 uppercase tracking-[0.25em] font-semibold">
            Được tin tưởng bởi các tổ chức hàng đầu
          </p>
        </motion.div>

        {/* Row 1 — scroll left */}
        <div className="relative mb-4">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#06080f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#06080f] to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <motion.div
              className="flex gap-2"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              {allPartners.map((p, i) => (
                <PartnerLogo key={`row1-${i}`} {...p} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Row 2 — scroll right (reverse) */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#06080f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#06080f] to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <motion.div
              className="flex gap-2"
              animate={{ x: ["-50%", "0%"] }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            >
              {[...PARTNERS.slice().reverse(), ...PARTNERS.slice().reverse()].map((p, i) => (
                <PartnerLogo key={`row2-${i}`} {...p} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}