"use client";

import Link from "next/link";
import { recentDisasters, sosAlerts } from "@/data/disaster-data";

const MODULES = [
  {
    href: "/map",
    icon: "🗺️",
    title: "Bản đồ Thiên tai",
    description: "Hiển thị thiên tai real-time trên bản đồ tương tác với heatmap",
    color: "from-blue-500 to-cyan-500",
  },
  {
    href: "/predict",
    icon: "🧠",
    title: "AI Dự đoán",
    description: "Mô hình Machine Learning dự đoán rủi ro thiên tai theo khu vực",
    color: "from-purple-500 to-pink-500",
  },
  {
    href: "/report",
    icon: "👥",
    title: "Báo cáo Cộng đồng",
    description: "Crowd-sourced báo cáo thiên tai từ người dân địa phương",
    color: "from-green-500 to-emerald-500",
  },
  {
    href: "/alerts",
    icon: "🚨",
    title: "Cảnh báo & SOS",
    description: "Hệ thống cảnh báo khẩn cấp và nút SOS cứu nạn",
    color: "from-red-500 to-orange-500",
  },
  {
    href: "/rescue",
    icon: "🤝",
    title: "Phối hợp Cứu trợ",
    description: "Điều phối cứu hộ ICS, 3W Dashboard, Kanban tasks, triage SOS",
    color: "from-yellow-500 to-amber-500",
  },
  {
    href: "/dashboard",
    icon: "📊",
    title: "Dashboard Thống kê",
    description: "Thống kê thiên tai toàn quốc với biểu đồ trực quan",
    color: "from-indigo-500 to-blue-500",
  },
  {
    href: "/education",
    icon: "📚",
    title: "Giáo dục Sinh tồn",
    description: "Hướng dẫn kỹ năng sinh tồn và checklist khẩn cấp",
    color: "from-teal-500 to-cyan-500",
  },
];

export default function Home() {
  const activeSOS = sosAlerts.filter((s) => s.status === "active").length;
  const recentCount = recentDisasters.filter((d) => d.status === "monitoring").length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6 animate-float">🛡️</div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">CứuNet</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4">
            Nền tảng Quản lý Thiên tai Thông minh
          </p>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Sử dụng AI & Machine Learning để dự đoán, giám sát và ứng phó với thiên tai
            trên toàn lãnh thổ Việt Nam. Cứu sống con người bằng công nghệ.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="glass rounded-2xl px-8 py-4 text-center">
              <div className="text-3xl font-bold text-red-400">{activeSOS}</div>
              <div className="text-sm text-slate-400">SOS Đang hoạt động</div>
            </div>
            <div className="glass rounded-2xl px-8 py-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{recentCount}</div>
              <div className="text-sm text-slate-400">Thiên tai đang theo dõi</div>
            </div>
            <div className="glass rounded-2xl px-8 py-4 text-center">
              <div className="text-3xl font-bold text-blue-400">63</div>
              <div className="text-sm text-slate-400">Tỉnh thành được giám sát</div>
            </div>
            <div className="glass rounded-2xl px-8 py-4 text-center">
              <div className="text-3xl font-bold text-green-400">AI</div>
              <div className="text-sm text-slate-400">Dự đoán thông minh</div>
            </div>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
          >
            🗺️ Xem Bản đồ Thiên tai
          </Link>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">7 Module Chức năng</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group card-hover rounded-2xl p-6 bg-slate-900/50"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {module.title}
                </h3>
                <p className="text-slate-400 text-sm">{module.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8 text-slate-300">Công nghệ sử dụng</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Next.js 16", "TypeScript", "Tailwind CSS", "TensorFlow.js", "Leaflet", "Recharts", "Framer Motion"].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 rounded-full border border-slate-700 text-slate-400 text-sm hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}