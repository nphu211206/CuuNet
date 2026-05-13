"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Brain } from "lucide-react";

export default function PredictError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PredictPage] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Error icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>

        <h2 className="text-lg font-semibold text-slate-200 mb-2">
          Có lỗi xảy ra
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Không thể tải module AI dự đoán thiên tai. Vui lòng thử lại.
        </p>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="glass-card p-3 mb-4 text-left">
            <p className="text-xs text-red-400 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[10px] text-slate-600 mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-sm text-blue-400 hover:bg-blue-500/25 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
      </div>
    </div>
  );
}
