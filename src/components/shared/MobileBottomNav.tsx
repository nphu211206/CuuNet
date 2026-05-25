"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Map, Bell, Siren, BookOpen, LayoutGrid } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/map", icon: Map, label: "Bản đồ" },
  { href: "/alerts", icon: Bell, label: "Cảnh báo" },
  { href: "/report", icon: Siren, label: "SOS" },
  { href: "/dashboard", icon: LayoutGrid, label: "Thống kê" },
  { href: "/education", icon: BookOpen, label: "Giáo dục" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-sm"
      aria-label="Điều hướng di động"
    >
      <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
                className={clsx(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-all duration-200",
                isActive
                  ? "text-[#0066FF]"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0066FF]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[9px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}