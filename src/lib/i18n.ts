"use client";

import { createContext, useContext, useState, useCallback, useMemo, createElement, type ReactNode } from "react";

type Locale = "vi" | "en";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}

const translations: Record<Locale, Record<string, string>> = {
    vi: {
        "nav.home": "Trang chủ",
        "nav.map": "Bản đồ",
        "nav.predict": "AI Dự đoán",
        "nav.report": "Cộng đồng",
        "nav.alerts": "Cảnh báo",
        "nav.rescue": "Cứu trợ",
        "nav.dashboard": "Thống kê",
        "nav.education": "Giáo dục",
        "hero.badge": "Đang giám sát 63 tỉnh thành",
        "hero.title": "Nền tảng Quản lý Thiên tai Thông minh",
        "hero.subtitle": "AI & Machine Learning giám sát, dự đoán và ứng phó với thiên tai trên toàn lãnh thổ Việt Nam.",
        "hero.cta.map": "Xem Bản đồ",
        "hero.cta.sos": "SOS Khẩn cấp",
        "hero.cta.report": "Gửi Báo cáo",
        "common.loading": "Đang tải...",
        "common.search": "Tìm kiếm...",
        "common.view_all": "Xem tất cả",
        "alerts.critical": "KHẨN CẤP",
        "alerts.high": "NGUY HIỂM",
        "alerts.medium": "CẢNH BÁO",
        "alerts.low": "THEO DÕI",
        "ai.placeholder": "Hỏi về thiên tai, phòng chống...",
    },
    en: {
        "nav.home": "Home",
        "nav.map": "Map",
        "nav.predict": "AI Predict",
        "nav.report": "Community",
        "nav.alerts": "Alerts",
        "nav.rescue": "Rescue",
        "nav.dashboard": "Dashboard",
        "nav.education": "Education",
        "hero.badge": "Monitoring 63 provinces",
        "hero.title": "Smart Disaster Management Platform",
        "hero.subtitle": "AI & Machine Learning monitors, predicts, and responds to disasters across Vietnam.",
        "hero.cta.map": "View Map",
        "hero.cta.sos": "Emergency SOS",
        "hero.cta.report": "Submit Report",
        "common.loading": "Loading...",
        "common.search": "Search...",
        "common.view_all": "View all",
        "alerts.critical": "CRITICAL",
        "alerts.high": "DANGER",
        "alerts.medium": "WARNING",
        "alerts.low": "MONITORING",
        "ai.placeholder": "Ask about disasters, preparedness...",
    },
};

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === "undefined") return "vi";
        const stored = localStorage.getItem("cuunet-locale") as Locale | null;
        return stored || "vi";
    });

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("cuunet-locale", newLocale);
        document.documentElement.lang = newLocale;
    }, []);

    const t = useCallback(
        (key: string): string => {
            return translations[locale]?.[key] || translations.vi[key] || key;
        },
        [locale]
    );

    const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

    return createElement(I18nContext.Provider, { value }, children);
}