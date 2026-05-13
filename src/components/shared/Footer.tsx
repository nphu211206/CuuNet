import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🛡️</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CứuNet
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Nền tảng AI quản lý thiên tai & phản ứng cộng đồng thông minh.
              Sử dụng công nghệ để cứu sống con người và bảo vệ cộng đồng.
            </p>
            <div className="flex gap-3 mt-4">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                Next.js 16
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
                TensorFlow.js
              </span>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                Leaflet
              </span>
            </div>
          </div>

          {/* Modules */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-4">
              Modules
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/map"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Bản đồ Thiên tai
                </Link>
              </li>
              <li>
                <Link
                  href="/predict"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  AI Dự đoán
                </Link>
              </li>
              <li>
                <Link
                  href="/report"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Báo cáo Cộng đồng
                </Link>
              </li>
              <li>
                <Link
                  href="/alerts"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Cảnh báo & SOS
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-4">
              Nguồn dữ liệu
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Open-Meteo API
                </a>
              </li>
              <li>
                <a
                  href="https://www.openstreetmap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  OpenStreetMap
                </a>
              </li>
              <li>
                <a
                  href="https://www.emdat.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  EM-DAT
                </a>
              </li>
              <li>
                <a
                  href="https://earthdata.nasa.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                >
                  NASA EarthData
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © 2025 CứuNet - Khóa luận Tốt nghiệp. Bảo vệ cộng đồng bằng công
            nghệ.
          </p>
          <p className="text-sm text-slate-500">
            100% Miễn phí • Mã nguồn mở
          </p>
        </div>
      </div>
    </footer>
  );
}
