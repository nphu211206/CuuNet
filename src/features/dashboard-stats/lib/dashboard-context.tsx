"use client";

// =============================================================================
// DASHBOARD CONTEXT - React Context + useReducer
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Architecture: Context + useReducer (consistent with alert-sos, rescue-connect)
// Features:
//   - 4 dashboard views (executive/operational/analytical/strategic)
//   - Global filters (time range, region, type, province)
//   - Data aggregation engine
//   - localStorage persistence
//   - Toast management
//   - Export helpers
// =============================================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type {
  DashboardState,
  DashboardAction,
  DashboardContextType,
  DashboardView,
  DashboardToast,
  DashboardFilter,
  TimeRange,
  VietnamRegion,
  YearlyDisasterData,
  MonthlyDisasterData,
  ProvinceDisasterData,
  AggregatedStats,
  DisasterTypeDistribution,
  RegionDistribution,
  KPIData,
} from "./types";

import type { DisasterType } from "@/lib/types";

import {
  MOCK_YEARLY_DATA,
  MOCK_MONTHLY_DATA,
  MOCK_PROVINCE_DATA,
} from "../api/mock-data";

import {
  DASHBOARD_STORAGE_KEYS,
  DASHBOARD_CONFIG,
  DEFAULT_DASHBOARD_FILTER,
  TIME_RANGE_CONFIG,
  DISASTER_TYPE_DASHBOARD_CONFIG,
  DEFAULT_TYPE_DISTRIBUTION,
  DEFAULT_REGION_DISTRIBUTION,
  KPI_CONFIG,
} from "../config/dashboard-config";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

let toastIdCounter = 0;
function nextToastId(): string {
  toastIdCounter++;
  return `dash-toast-${Date.now()}-${toastIdCounter}`;
}

// =============================================================================
// 1. AGGREGATION ENGINE
// =============================================================================

function aggregateStats(data: YearlyDisasterData[]): AggregatedStats {
  if (data.length === 0) {
    return {
      totalEvents: 0, totalDeaths: 0, totalMissing: 0, totalInjured: 0,
      totalAffected: 0, totalHousesDamaged: 0, totalDamageBillionVND: 0,
      averageDamagePerYear: 0, averageDeathsPerYear: 0,
      mostDeadlyYear: { year: 2000, deaths: 0 },
      mostDamagingYear: { year: 2000, damage: 0 },
      mostAffectedProvince: { province: "N/A", affected: 0 },
      mostCommonType: "flood",
      trendDirection: "stable",
      trendPercent: 0,
    };
  }

  const totalEvents = data.reduce((s, d) => s + d.totalEvents, 0);
  const totalDeaths = data.reduce((s, d) => s + d.deaths, 0);
  const totalMissing = data.reduce((s, d) => s + d.missing, 0);
  const totalInjured = data.reduce((s, d) => s + d.injured, 0);
  const totalAffected = data.reduce((s, d) => s + d.affected, 0);
  const totalHousesDamaged = data.reduce((s, d) => s + d.housesDamaged, 0);
  const totalDamageBillionVND = data.reduce((s, d) => s + d.economicDamageBillionVND, 0);

  const years = data.length;
  const averageDamagePerYear = Math.round(totalDamageBillionVND / years);
  const averageDeathsPerYear = Math.round(totalDeaths / years);

  const mostDeadlyYear = data.reduce((max, d) => d.deaths > max.deaths ? d : max, data[0]);
  const mostDamagingYear = data.reduce((max, d) => d.economicDamageBillionVND > max.economicDamageBillionVND ? d : max, data[0]);

  // Most common type
  const typeTotals = {
    flood: data.reduce((s, d) => s + d.floods, 0),
    storm: data.reduce((s, d) => s + d.storms, 0),
    landslide: data.reduce((s, d) => s + d.landslides, 0),
    drought: data.reduce((s, d) => s + d.drought, 0),
    earthquake: data.reduce((s, d) => s + d.other, 0),
    tsunami: 0,
  };
  const mostCommonType = Object.entries(typeTotals).reduce((a, b) => b[1] > a[1] ? b : a, ["flood", 0])[0] as DisasterType;

  // Trend (last 5 years vs previous 5 years)
  const last5 = data.slice(-5);
  const prev5 = data.slice(-10, -5);
  const last5Avg = last5.reduce((s, d) => s + d.deaths, 0) / Math.min(5, last5.length);
  const prev5Avg = prev5.length > 0 ? prev5.reduce((s, d) => s + d.deaths, 0) / prev5.length : last5Avg;
  const trendPercent = prev5Avg > 0 ? Math.round(((last5Avg - prev5Avg) / prev5Avg) * 100) : 0;
  const trendDirection = trendPercent > 5 ? "increasing" : trendPercent < -5 ? "decreasing" : "stable";

  return {
    totalEvents, totalDeaths, totalMissing, totalInjured,
    totalAffected, totalHousesDamaged, totalDamageBillionVND,
    averageDamagePerYear, averageDeathsPerYear,
    mostDeadlyYear: { year: mostDeadlyYear.year, deaths: mostDeadlyYear.deaths },
    mostDamagingYear: { year: mostDamagingYear.year, damage: mostDamagingYear.economicDamageBillionVND },
    mostAffectedProvince: { province: "Quảng Bình", affected: 4500000 },
    mostCommonType,
    trendDirection,
    trendPercent,
  };
}

function calculateTypeDistribution(data: YearlyDisasterData[]): DisasterTypeDistribution[] {
  const totals = {
    flood: data.reduce((s, d) => s + d.floods, 0),
    storm: data.reduce((s, d) => s + d.storms, 0),
    landslide: data.reduce((s, d) => s + d.landslides, 0),
    drought: data.reduce((s, d) => s + d.drought, 0),
    earthquake: data.reduce((s, d) => s + d.other, 0),
    tsunami: 0,
  };
  const total = Object.values(totals).reduce((s, v) => s + v, 0);

  return DEFAULT_TYPE_DISTRIBUTION.map((item) => {
    const count = totals[item.type] || 0;
    return {
      ...item,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      totalDeaths: Math.round(data.reduce((s, d) => s + d.deaths, 0) * (count / Math.max(total, 1))),
      totalDamageBillionVND: Math.round(data.reduce((s, d) => s + d.economicDamageBillionVND, 0) * (count / Math.max(total, 1))),
    };
  });
}

function calculateRegionDistribution(provinces: ProvinceDisasterData[]): RegionDistribution[] {
  return DEFAULT_REGION_DISTRIBUTION.map((item) => {
    const regionProvinces = provinces.filter((p) => p.region === item.region);
    const totalEvents = regionProvinces.reduce((s, p) => s + p.totalEvents, 0);
    const totalDeaths = regionProvinces.reduce((s, p) => s + p.totalDeaths, 0);
    const totalDamage = regionProvinces.reduce((s, p) => s + p.totalDamageBillionVND, 0);
    return {
      ...item,
      totalEvents,
      totalDeaths,
      totalDamageBillionVND: totalDamage,
      provinces: regionProvinces.map((p) => p.province),
    };
  });
}

function filterYearlyData(data: YearlyDisasterData[], filter: DashboardFilter): YearlyDisasterData[] {
  const range = TIME_RANGE_CONFIG[filter.timeRange];
  if (filter.timeRange === "custom" && filter.customStart && filter.customEnd) {
    return data.filter((d) => d.year >= filter.customStart! && d.year <= filter.customEnd!);
  }
  return data.filter((d) => d.year >= range.startYear);
}

function filterProvinceData(provinces: ProvinceDisasterData[], filter: DashboardFilter): ProvinceDisasterData[] {
  let filtered = [...provinces];
  if (filter.region !== "all") {
    filtered = filtered.filter((p) => p.region === filter.region);
  }
  if (filter.province !== "all") {
    filtered = filtered.filter((p) => p.province === filter.province);
  }
  return filtered;
}

function generateKPIs(stats: AggregatedStats, yearlyData: YearlyDisasterData[]): KPIData[] {
  if (yearlyData.length === 0) return [];
  const lastYear = yearlyData[yearlyData.length - 1];
  const prevYear = yearlyData[yearlyData.length - 2];

  const eventsChange = prevYear ? Math.round(((lastYear.totalEvents - prevYear.totalEvents) / prevYear.totalEvents) * 100) : 0;
  const deathsChange = prevYear ? Math.round(((lastYear.deaths - prevYear.deaths) / Math.max(prevYear.deaths, 1)) * 100) : 0;
  const damageChange = prevYear ? Math.round(((lastYear.economicDamageBillionVND - prevYear.economicDamageBillionVND) / Math.max(prevYear.economicDamageBillionVND, 1)) * 100) : 0;

  return [
    {
      id: "events", label: "Total Events", labelVi: "Tổng sự kiện",
      icon: "📊", value: stats.totalEvents, formattedValue: stats.totalEvents.toLocaleString("vi-VN"),
      trend: eventsChange > 5 ? "up" : eventsChange < -5 ? "down" : "stable",
      trendValue: `${eventsChange > 0 ? "+" : ""}${eventsChange}%`,
      trendPercent: eventsChange, color: "#3B82F6",
      description: `Trung bình ${stats.averageDeathsPerYear} sự kiện/năm`,
    },
    {
      id: "deaths", label: "Deaths", labelVi: "Thương vong",
      icon: "💀", value: stats.totalDeaths, formattedValue: stats.totalDeaths.toLocaleString("vi-VN"),
      trend: deathsChange > 5 ? "up" : deathsChange < -5 ? "down" : "stable",
      trendValue: `${deathsChange > 0 ? "+" : ""}${deathsChange}%`,
      trendPercent: deathsChange, color: "#EF4444",
      description: `Năm chết nhiều nhất: ${stats.mostDeadlyYear.year} (${stats.mostDeadlyYear.deaths} người)`,
    },
    {
      id: "damage", label: "Economic Damage", labelVi: "Thiệt hại kinh tế",
      icon: "💰", value: stats.totalDamageBillionVND,
      formattedValue: `${(stats.totalDamageBillionVND / 1000).toFixed(1)} nghìn tỷ`,
      suffix: "VND",
      trend: damageChange > 5 ? "up" : damageChange < -5 ? "down" : "stable",
      trendValue: `${damageChange > 0 ? "+" : ""}${damageChange}%`,
      trendPercent: damageChange, color: "#F59E0B",
      description: `TB: ${stats.averageDamagePerYear.toLocaleString("vi-VN")} tỷ/năm`,
    },
    {
      id: "affected", label: "People Affected", labelVi: "Người受影响",
      icon: "👥", value: Math.round(stats.totalAffected / 1000),
      formattedValue: `${(stats.totalAffected / 1000000).toFixed(1)} triệu`,
      suffix: "người",
      trend: "stable", trendValue: "0%", trendPercent: 0, color: "#8B5CF6",
      description: `TB: ${(stats.totalAffected / 1000 / yearlyData.length).toFixed(0)}K người/năm`,
    },
    {
      id: "houses", label: "Houses Damaged", labelVi: "Nhà thiệt hại",
      icon: "🏠", value: stats.totalHousesDamaged,
      formattedValue: `${(stats.totalHousesDamaged / 1000).toFixed(0)}K`,
      suffix: "nhà",
      trend: "stable", trendValue: "0%", trendPercent: 0, color: "#06B6D4",
      description: `TB: ${(stats.totalHousesDamaged / yearlyData.length).toFixed(0)}K nhà/năm`,
    },
    {
      id: "provinces", label: "Most Affected", labelVi: "Tỉnh受影响 nhất",
      icon: "📍", value: 0, formattedValue: stats.mostAffectedProvince.province,
      trend: "stable", trendValue: "", trendPercent: 0, color: "#EC4899",
      description: `${(stats.mostAffectedProvince.affected / 1000000).toFixed(1)} triệu người受影响`,
    },
  ];
}

// =============================================================================
// 2. INITIAL STATE
// =============================================================================

function createInitialState(): DashboardState {
  return {
    activeView: "executive",
    filter: { ...DEFAULT_DASHBOARD_FILTER },
    yearlyData: [],
    monthlyData: [],
    provinceData: [],
    aggregatedStats: null,
    typeDistribution: [],
    regionDistribution: [],
    selectedProvince: null,
    selectedYear: null,
    isExporting: false,
    toasts: [],
  };
}

// =============================================================================
// 3. REDUCER
// =============================================================================

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_ACTIVE_VIEW":
      saveToStorage(DASHBOARD_STORAGE_KEYS.ACTIVE_VIEW, action.payload);
      return { ...state, activeView: action.payload };

    case "SET_FILTER":
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case "RESET_FILTER":
      return { ...state, filter: { ...DEFAULT_DASHBOARD_FILTER } };

    case "SET_TIME_RANGE":
      return { ...state, filter: { ...state.filter, timeRange: action.payload } };

    case "SET_REGION":
      return { ...state, filter: { ...state.filter, region: action.payload } };

    case "SET_DISASTER_TYPE":
      return { ...state, filter: { ...state.filter, disasterType: action.payload } };

    case "SET_PROVINCE":
      return { ...state, filter: { ...state.filter, province: action.payload } };

    case "SET_YEARLY_DATA":
      return { ...state, yearlyData: action.payload };

    case "SET_MONTHLY_DATA":
      return { ...state, monthlyData: action.payload };

    case "SET_PROVINCE_DATA":
      return { ...state, provinceData: action.payload };

    case "SET_AGGREGATED_STATS":
      return { ...state, aggregatedStats: action.payload };

    case "SET_TYPE_DISTRIBUTION":
      return { ...state, typeDistribution: action.payload };

    case "SET_REGION_DISTRIBUTION":
      return { ...state, regionDistribution: action.payload };

    case "SELECT_PROVINCE":
      return { ...state, selectedProvince: action.payload };

    case "SELECT_YEAR":
      return { ...state, selectedYear: action.payload };

    case "SET_EXPORTING":
      return { ...state, isExporting: action.payload };

    case "ADD_TOAST":
      return { ...state, toasts: [action.payload, ...state.toasts].slice(0, 5) };

    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case "RESET_STATE":
      return createInitialState();

    default:
      return state;
  }
}

// =============================================================================
// 4. CONTEXT
// =============================================================================

const DashboardContext = createContext<DashboardContextType | null>(null);

// =============================================================================
// 5. PROVIDER
// =============================================================================

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, null, createInitialState);
  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize data
  useEffect(() => {
    dispatch({ type: "SET_YEARLY_DATA", payload: MOCK_YEARLY_DATA });
    dispatch({ type: "SET_MONTHLY_DATA", payload: MOCK_MONTHLY_DATA });
    dispatch({ type: "SET_PROVINCE_DATA", payload: MOCK_PROVINCE_DATA });

    const savedView = loadFromStorage<DashboardView>(DASHBOARD_STORAGE_KEYS.ACTIVE_VIEW, "executive");
    dispatch({ type: "SET_ACTIVE_VIEW", payload: savedView });

    const savedFilter = loadFromStorage<DashboardFilter>(DASHBOARD_STORAGE_KEYS.FILTER, DEFAULT_DASHBOARD_FILTER);
    dispatch({ type: "SET_FILTER", payload: savedFilter });
  }, []);

  // Recompute on data/filter change
  useEffect(() => {
    if (state.yearlyData.length === 0) return;

    const filteredYearly = filterYearlyData(state.yearlyData, state.filter);
    const stats = aggregateStats(filteredYearly);
    dispatch({ type: "SET_AGGREGATED_STATS", payload: stats });

    const typeDist = calculateTypeDistribution(filteredYearly);
    dispatch({ type: "SET_TYPE_DISTRIBUTION", payload: typeDist });

    const regionDist = calculateRegionDistribution(state.provinceData);
    dispatch({ type: "SET_REGION_DISTRIBUTION", payload: regionDist });
  }, [state.yearlyData, state.provinceData, state.filter]);

  // Save filter on change
  useEffect(() => {
    saveToStorage(DASHBOARD_STORAGE_KEYS.FILTER, state.filter);
  }, [state.filter]);

  // Toast management
  const showToast = useCallback(
    (toast: Omit<DashboardToast, "id" | "createdAt">) => {
      const id = nextToastId();
      const newToast: DashboardToast = {
        ...toast,
        id,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TOAST", payload: newToast });

      const timer = setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", payload: id });
        toastTimers.current.delete(id);
      }, toast.duration);
      toastTimers.current.set(id, timer);
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Computed: filtered data
  const filteredYearlyData = useMemo(
    () => filterYearlyData(state.yearlyData, state.filter),
    [state.yearlyData, state.filter]
  );

  const filteredProvinceData = useMemo(
    () => filterProvinceData(state.provinceData, state.filter),
    [state.provinceData, state.filter]
  );

  const kpis = useMemo(
    () => (state.aggregatedStats ? generateKPIs(state.aggregatedStats, filteredYearlyData) : []),
    [state.aggregatedStats, filteredYearlyData]
  );

  // Helpers
  const getProvinceByName = useCallback(
    (name: string) => state.provinceData.find((p) => p.province === name),
    [state.provinceData]
  );

  const getYearlyDataByRange = useCallback(
    (range: TimeRange) => {
      const config = TIME_RANGE_CONFIG[range];
      return state.yearlyData.filter((d) => d.year >= config.startYear);
    },
    [state.yearlyData]
  );

  const getTopProvinces = useCallback(
    (metric: "deaths" | "damage" | "events", limit: number = 10) => {
      const sorted = [...state.provinceData].sort((a, b) => {
        if (metric === "deaths") return b.totalDeaths - a.totalDeaths;
        if (metric === "damage") return b.totalDamageBillionVND - a.totalDamageBillionVND;
        return b.totalEvents - a.totalEvents;
      });
      return sorted.slice(0, limit);
    },
    [state.provinceData]
  );

  const getDisasterTypeColor = useCallback(
    (type: DisasterType) => DISASTER_TYPE_DASHBOARD_CONFIG[type]?.color || "#6B7280",
    []
  );

  const getSeverityColor = useCallback(
    (level: number) => {
      const colors: Record<number, string> = {
        1: "#22C55E", 2: "#EAB308", 3: "#F97316", 4: "#EF4444", 5: "#A855F7",
      };
      return colors[level] || "#6B7280";
    },
    []
  );

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat("vi-VN").format(value),
    []
  );

  const formatVND = useCallback(
    (value: number) => {
      if (value >= 1000) return `${(value / 1000).toFixed(1)} nghìn tỷ`;
      return `${value.toFixed(0)} tỷ`;
    },
    []
  );

  const formatPercent = useCallback(
    (value: number) => `${value > 0 ? "+" : ""}${value}%`,
    []
  );

  // Context value
  const contextValue = useMemo<DashboardContextType>(
    () => ({
      state,
      dispatch,
      filteredYearlyData,
      filteredProvinceData,
      kpis,
      showToast,
      getProvinceByName,
      getYearlyDataByRange,
      getTopProvinces,
      getDisasterTypeColor,
      getSeverityColor,
      formatNumber,
      formatVND,
      formatPercent,
    }),
    [
      state, filteredYearlyData, filteredProvinceData, kpis,
      showToast, getProvinceByName, getYearlyDataByRange, getTopProvinces,
      getDisasterTypeColor, getSeverityColor, formatNumber, formatVND, formatPercent,
    ]
  );

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>;
}

// =============================================================================
// 6. HOOK
// =============================================================================

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
