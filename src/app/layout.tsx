import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import MobileBottomNav from "@/components/shared/MobileBottomNav";
import CursorGlow from "@/components/shared/CursorGlow";
import ScrollProgress from "@/components/shared/ScrollProgress";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "CứuNet - Nền tảng Quản lý Thiên tai Thông minh",
  description: "Hệ thống quản lý thiên tai sử dụng AI & Machine Learning - Khóa luận Tốt nghiệp 2025",
  manifest: "/manifest.json",
  themeColor: "#0369a1",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CứuNet",
  },
  openGraph: {
    title: "CứuNet - Nền tảng Quản lý Thiên tai",
    description: "AI & Machine Learning giám sát, dự đoán và ứng phó với thiên tai",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} ${spaceGrotesk.variable} flex flex-col min-h-screen antialiased`}>
        <Navbar />
        <main className="flex-1 pt-16 pb-16 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <CursorGlow />
        <ScrollProgress />
      </body>
    </html>
  );
}