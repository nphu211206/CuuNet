import { Brain, Loader2 } from "lucide-react";

export default function PredictLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {/* Animated brain icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-blue-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center mx-auto" style={{ left: "calc(50% + 16px)", top: "calc(50% + 16px)" }}>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-200 mb-2">
          Đang tải mô hình AI
        </h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Đang tính toán rủi ro thiên tai cho 15 tỉnh/thành phố...
        </p>

        {/* Loading progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500/40 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
