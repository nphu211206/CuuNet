"use client";

import { WifiOff, RefreshCw, Map, Siren } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-aurora">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Bạn đang offline
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Không có kết nối mạng. Một số tính năng có thể không khả dụng. SOS đã lưu sẽ tự động gửi khi có mạng.
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-all active:scale-95 mb-8"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>

        {/* Available offline features */}
        <div className="space-y-3 text-left">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Tính năng offline
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Map className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-200 font-medium">Xem bản đồ đã lưu</p>
              <p className="text-[10px] text-slate-500">Dữ liệu bản đồ cache</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Siren className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-200 font-medium">Gửi SOS offline</p>
              <p className="text-[10px] text-slate-500">Tự động gửi khi có mạng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}