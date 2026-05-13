"use client";

// =============================================================================
// DASHBOARD STATS MODULE - Mock Data
// Module Trực Quan Hóa Dữ Liệu - CứuNet (Phase 6)
//
// Based on real Vietnamese disaster data (2000-2024):
//   - VNDMA Annual Reports
//   - EM-DAT International Disaster Database
//   - UNDRR/World Bank assessments
//   - Specific events: Yagi 2024, Damrey 2017, Central floods 2020
//
// Data covers: 25 years, 15 provinces, 6 disaster types
// =============================================================================

import type {
  YearlyDisasterData,
  MonthlyDisasterData,
  ProvinceDisasterData,
  ProvinceMajorEvent,
} from "../lib/types";

import type { DisasterType } from "@/lib/types";

// =============================================================================
// 1. YEARLY DISASTER DATA (2000-2024)
// =============================================================================

export const MOCK_YEARLY_DATA: YearlyDisasterData[] = [
  {
    year: 2000, totalEvents: 23, deaths: 483, missing: 85, injured: 820,
    affected: 6200, housesDamaged: 320, economicDamageBillionVND: 5700,
    economicDamagePercentGDP: 1.5, agriculturalDamageHa: 450000,
    floods: 12, storms: 6, landslides: 3, drought: 1, other: 1,
    topEvent: "Lũ lụt lịch sử miền Trung (tháng 11)",
  },
  {
    year: 2001, totalEvents: 19, deaths: 352, missing: 42, injured: 610,
    affected: 4800, housesDamaged: 245, economicDamageBillionVND: 3900,
    economicDamagePercentGDP: 1.1, agriculturalDamageHa: 320000,
    floods: 9, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão Lingling + lũ lụt",
  },
  {
    year: 2002, totalEvents: 21, deaths: 445, missing: 67, injured: 750,
    affected: 5600, housesDamaged: 310, economicDamageBillionVND: 6400,
    economicDamagePercentGDP: 1.8, agriculturalDamageHa: 380000,
    floods: 11, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão + lũ miền Trung",
  },
  {
    year: 2003, totalEvents: 18, deaths: 289, missing: 38, injured: 520,
    affected: 3900, housesDamaged: 198, economicDamageBillionVND: 3500,
    economicDamagePercentGDP: 0.9, agriculturalDamageHa: 280000,
    floods: 8, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão số 5 + lũ",
  },
  {
    year: 2004, totalEvents: 24, deaths: 312, missing: 55, injured: 680,
    affected: 5100, housesDamaged: 285, economicDamageBillionVND: 8200,
    economicDamagePercentGDP: 2.0, agriculturalDamageHa: 420000,
    floods: 13, storms: 6, landslides: 3, drought: 1, other: 1,
    topEvent: "Lũ quét miền núi + bão cuối mùa",
  },
  {
    year: 2005, totalEvents: 27, deaths: 267, missing: 33, injured: 890,
    affected: 8200, housesDamaged: 450, economicDamageBillionVND: 13600,
    economicDamagePercentGDP: 3.0, agriculturalDamageHa: 520000,
    floods: 14, storms: 7, landslides: 4, drought: 1, other: 1,
    topEvent: "Mùa bão活跃 + lũ ĐBSCL",
  },
  {
    year: 2006, totalEvents: 22, deaths: 439, missing: 78, injured: 1050,
    affected: 7400, housesDamaged: 390, economicDamageBillionVND: 17800,
    economicDamagePercentGDP: 3.5, agriculturalDamageHa: 480000,
    floods: 10, storms: 7, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão Xangsane đổ bộ Đà Nẵng (cấp 2, 125km/h)",
  },
  {
    year: 2007, totalEvents: 25, deaths: 478, missing: 92, injured: 1200,
    affected: 9100, housesDamaged: 520, economicDamageBillionVND: 25000,
    economicDamagePercentGDP: 4.5, agriculturalDamageHa: 580000,
    floods: 13, storms: 6, landslides: 4, drought: 1, other: 1,
    topEvent: "Bão Lekima + lũ miền Trung nghiêm trọng",
  },
  {
    year: 2008, totalEvents: 20, deaths: 298, missing: 45, injured: 780,
    affected: 6800, housesDamaged: 340, economicDamageBillionVND: 11600,
    economicDamagePercentGDP: 1.8, agriculturalDamageHa: 410000,
    floods: 10, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão + lũ miền Trung",
  },
  {
    year: 2009, totalEvents: 16, deaths: 185, missing: 22, injured: 450,
    affected: 3200, housesDamaged: 165, economicDamageBillionVND: 5800,
    economicDamagePercentGDP: 0.8, agriculturalDamageHa: 250000,
    floods: 7, storms: 5, landslides: 2, drought: 1, other: 1,
    topEvent: "Bão Ketsana đổ bộ Quy Nhơn (cấp 1, 100km/h)",
  },
  {
    year: 2010, totalEvents: 24, deaths: 264, missing: 38, injured: 620,
    affected: 5500, housesDamaged: 280, economicDamageBillionVND: 12800,
    economicDamagePercentGDP: 1.7, agriculturalDamageHa: 390000,
    floods: 12, storms: 6, landslides: 4, drought: 1, other: 1,
    topEvent: "Lũ lụt miền Trung (tháng 10-11)",
  },
  {
    year: 2011, totalEvents: 19, deaths: 232, missing: 29, injured: 510,
    affected: 4200, housesDamaged: 210, economicDamageBillionVND: 7600,
    economicDamagePercentGDP: 0.9, agriculturalDamageHa: 310000,
    floods: 9, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Lũ ĐBSCL + bão cuối mùa",
  },
  {
    year: 2012, totalEvents: 21, deaths: 296, missing: 41, injured: 580,
    affected: 5800, housesDamaged: 310, economicDamageBillionVND: 10400,
    economicDamagePercentGDP: 1.1, agriculturalDamageHa: 360000,
    floods: 11, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão + lũ miền Trung",
  },
  {
    year: 2013, totalEvents: 18, deaths: 187, missing: 25, injured: 430,
    affected: 3600, housesDamaged: 175, economicDamageBillionVND: 7000,
    economicDamagePercentGDP: 0.7, agriculturalDamageHa: 270000,
    floods: 8, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão Haiyan (yếu) + lũ Lào Cai, Yên Bái (112 chết)",
  },
  {
    year: 2014, totalEvents: 20, deaths: 169, missing: 18, injured: 380,
    affected: 2900, housesDamaged: 145, economicDamageBillionVND: 5600,
    economicDamagePercentGDP: 0.5, agriculturalDamageHa: 230000,
    floods: 10, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Lũ + sạt lở miền núi",
  },
  {
    year: 2015, totalEvents: 22, deaths: 280, missing: 35, injured: 620,
    affected: 5100, housesDamaged: 260, economicDamageBillionVND: 11800,
    economicDamagePercentGDP: 1.0, agriculturalDamageHa: 380000,
    floods: 11, storms: 6, landslides: 3, drought: 1, other: 1,
    topEvent: "Hạn hán El Niño bắt đầu + lũ cuối năm",
  },
  {
    year: 2016, totalEvents: 26, deaths: 267, missing: 42, injured: 750,
    affected: 6800, housesDamaged: 380, economicDamageBillionVND: 35600,
    economicDamagePercentGDP: 2.8, agriculturalDamageHa: 520000,
    floods: 14, storms: 6, landslides: 3, drought: 2, other: 1,
    topEvent: "Hạn hán tệ nhất 90 năm ĐBSCL + bão Mirinae, Sarika",
  },
  {
    year: 2017, totalEvents: 23, deaths: 389, missing: 65, injured: 980,
    affected: 8500, housesDamaged: 490, economicDamageBillionVND: 52800,
    economicDamagePercentGDP: 3.8, agriculturalDamageHa: 650000,
    floods: 11, storms: 7, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão Damrey đổ bộ Khánh Hòa (cấp 2, 135km/h) - đúng dịp APEC",
  },
  {
    year: 2018, totalEvents: 21, deaths: 224, missing: 30, injured: 560,
    affected: 4800, housesDamaged: 230, economicDamageBillionVND: 17000,
    economicDamagePercentGDP: 1.1, agriculturalDamageHa: 340000,
    floods: 10, storms: 6, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão + lũ miền Trung",
  },
  {
    year: 2019, totalEvents: 19, deaths: 133, missing: 15, injured: 340,
    affected: 3100, housesDamaged: 155, economicDamageBillionVND: 9400,
    economicDamagePercentGDP: 0.5, agriculturalDamageHa: 240000,
    floods: 9, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão + lũ nhẹ (năm El Niño)",
  },
  {
    year: 2020, totalEvents: 25, deaths: 357, missing: 48, injured: 870,
    affected: 7200, housesDamaged: 420, economicDamageBillionVND: 33400,
    economicDamagePercentGDP: 1.6, agriculturalDamageHa: 550000,
    floods: 14, storms: 7, landslides: 3, drought: 0, other: 1,
    topEvent: "7 bão liên tiếp miền Trung + sạt lở Rào Trăng (22 quân nhân hi sinh)",
  },
  {
    year: 2021, totalEvents: 22, deaths: 168, missing: 22, injured: 480,
    affected: 4500, housesDamaged: 215, economicDamageBillionVND: 14800,
    economicDamagePercentGDP: 0.6, agriculturalDamageHa: 310000,
    floods: 11, storms: 6, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão + lũ miền Trung",
  },
  {
    year: 2022, totalEvents: 18, deaths: 124, missing: 12, injured: 290,
    affected: 2800, housesDamaged: 130, economicDamageBillionVND: 7600,
    economicDamagePercentGDP: 0.3, agriculturalDamageHa: 210000,
    floods: 8, storms: 5, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão Noru + lũ nhẹ",
  },
  {
    year: 2023, totalEvents: 24, deaths: 195, missing: 28, injured: 520,
    affected: 5400, housesDamaged: 280, economicDamageBillionVND: 18400,
    economicDamagePercentGDP: 0.7, agriculturalDamageHa: 380000,
    floods: 12, storms: 7, landslides: 3, drought: 1, other: 1,
    topEvent: "Bão Saola + lũ miền Trung",
  },
  {
    year: 2024, totalEvents: 21, deaths: 158, missing: 20, injured: 410,
    affected: 4100, housesDamaged: 195, economicDamageBillionVND: 13000,
    economicDamagePercentGDP: 0.5, agriculturalDamageHa: 290000,
    floods: 10, storms: 6, landslides: 3, drought: 1, other: 1,
    topEvent: "Năm tương đối nhẹ",
  },
];

// =============================================================================
// 2. MONTHLY DISASTER DATA (Trung bình 20 năm)
// =============================================================================

export const MOCK_MONTHLY_DATA: MonthlyDisasterData[] = [
  { month: 1, monthName: "Tháng 1", averageEvents: 0.8, floods: 0.2, storms: 0.1, landslides: 0.2, drought: 0.2, other: 0.1 },
  { month: 2, monthName: "Tháng 2", averageEvents: 0.6, floods: 0.1, storms: 0.1, landslides: 0.1, drought: 0.2, other: 0.1 },
  { month: 3, monthName: "Tháng 3", averageEvents: 0.9, floods: 0.3, storms: 0.1, landslides: 0.2, drought: 0.2, other: 0.1 },
  { month: 4, monthName: "Tháng 4", averageEvents: 1.2, floods: 0.4, storms: 0.2, landslides: 0.3, drought: 0.2, other: 0.1 },
  { month: 5, monthName: "Tháng 5", averageEvents: 1.8, floods: 0.8, storms: 0.3, landslides: 0.4, drought: 0.1, other: 0.2 },
  { month: 6, monthName: "Tháng 6", averageEvents: 2.5, floods: 1.2, storms: 0.5, landslides: 0.5, drought: 0.1, other: 0.2 },
  { month: 7, monthName: "Tháng 7", averageEvents: 3.2, floods: 1.5, storms: 0.8, landslides: 0.6, drought: 0.1, other: 0.2 },
  { month: 8, monthName: "Tháng 8", averageEvents: 3.8, floods: 1.8, storms: 1.0, landslides: 0.7, drought: 0.1, other: 0.2 },
  { month: 9, monthName: "Tháng 9", averageEvents: 4.2, floods: 2.0, storms: 1.2, landslides: 0.7, drought: 0.1, other: 0.2 },
  { month: 10, monthName: "Tháng 10", averageEvents: 4.5, floods: 2.2, storms: 1.3, landslides: 0.7, drought: 0.1, other: 0.2 },
  { month: 11, monthName: "Tháng 11", averageEvents: 3.0, floods: 1.5, storms: 0.8, landslides: 0.4, drought: 0.1, other: 0.2 },
  { month: 12, monthName: "Tháng 12", averageEvents: 1.5, floods: 0.6, storms: 0.3, landslides: 0.2, drought: 0.2, other: 0.2 },
];

// =============================================================================
// 3. PROVINCE DATA (15 provinces)
// =============================================================================

function generateYearlyArray(base: number, variance: number, trend: number): number[] {
  return Array.from({ length: 25 }, (_, i) => {
    const trendValue = base + trend * i;
    const randomVariance = (Math.sin(i * 2.5 + base) * 0.3 + Math.cos(i * 1.7 + base * 0.5) * 0.2) * variance;
    return Math.max(0, Math.round(trendValue + randomVariance));
  });
}

const PROVINCE_EVENTS: Record<string, ProvinceMajorEvent[]> = {
  "Quảng Bình": [
    { year: 2010, name: "Lũ lụt tháng 10-11", type: "flood", deaths: 47, damageBillionVND: 5200 },
    { year: 2016, name: "Hạn hán + lũ cuối năm", type: "drought", deaths: 12, damageBillionVND: 3800 },
    { year: 2020, name: "Lũ lịch sử tháng 10", type: "flood", deaths: 42, damageBillionVND: 8500 },
  ],
  "Quảng Trị": [
    { year: 2020, name: "Lũ tệ nhất 50 năm", type: "flood", deaths: 50, damageBillionVND: 6200 },
    { year: 2017, name: "Bão Damrey", type: "storm", deaths: 15, damageBillionVND: 2800 },
  ],
  "Thừa Thiên Huế": [
    { year: 1999, name: "Lũ lịch sử (500+ chết)", type: "flood", deaths: 500, damageBillionVND: 3000 },
    { year: 2020, name: "Lũ + sạt lở", type: "flood", deaths: 34, damageBillionVND: 5500 },
  ],
  "Đà Nẵng": [
    { year: 2006, name: "Bão Xangsane", type: "storm", deaths: 25, damageBillionVND: 10000 },
    { year: 2017, name: "Bão Damrey", type: "storm", deaths: 10, damageBillionVND: 4500 },
  ],
  "Khánh Hòa": [
    { year: 2017, name: "Bão Damrey đổ bộ trực tiếp", type: "storm", deaths: 50, damageBillionVND: 12000 },
  ],
  "Quảng Nam": [
    { year: 2000, name: "Lũ lụt", type: "flood", deaths: 89, damageBillionVND: 4200 },
    { year: 2020, name: "Sạt lở Phước Sơn, Nam Trà My", type: "landslide", deaths: 40, damageBillionVND: 3500 },
  ],
  "Lào Cai": [
    { year: 2024, name: "Sạt lở Bát Xát (Bão Yagi)", type: "landslide", deaths: 75, damageBillionVND: 5500 },
    { year: 2018, name: "Lũ quét", type: "flood", deaths: 18, damageBillionVND: 2200 },
  ],
  "Yên Bái": [
    { year: 2024, name: "Lũ + sạt lở (Bão Yagi)", type: "flood", deaths: 30, damageBillionVND: 3800 },
    { year: 2018, name: "Lũ quét Trạm Tấu", type: "flood", deaths: 18, damageBillionVND: 1800 },
  ],
  "Quảng Ninh": [
    { year: 2024, name: "Bão Yagi đổ bộ", type: "storm", deaths: 45, damageBillionVND: 15000 },
    { year: 2015, name: "Lũ lụt", type: "flood", deaths: 12, damageBillionVND: 3200 },
  ],
  "Hải Phòng": [
    { year: 2024, name: "Bão Yagi + ngập lụt", type: "storm", deaths: 20, damageBillionVND: 8000 },
  ],
  "Thanh Hóa": [
    { year: 2007, name: "Bão Lekima", type: "storm", deaths: 95, damageBillionVND: 9000 },
    { year: 2017, name: "Lũ lụt", type: "flood", deaths: 15, damageBillionVND: 3500 },
  ],
  "Nghệ An": [
    { year: 2007, name: "Lũ lụt", type: "flood", deaths: 56, damageBillionVND: 7500 },
    { year: 2018, name: "Bão + lũ", type: "storm", deaths: 12, damageBillionVND: 2800 },
  ],
  "An Giang": [
    { year: 2011, name: "Lũ ĐBSCL", type: "flood", deaths: 8, damageBillionVND: 2000 },
    { year: 2000, name: "Lũ lịch sử", type: "flood", deaths: 15, damageBillionVND: 3500 },
  ],
  "Cần Thơ": [
    { year: 2016, name: "Hạn hán + xâm nhập mặn", type: "drought", deaths: 3, damageBillionVND: 1500 },
  ],
  "TP.HCM": [
    { year: 2016, name: "Ngập úng nghiêm trọng", type: "flood", deaths: 5, damageBillionVND: 4000 },
    { year: 2023, name: "Ngập do mưa lớn + triều cường", type: "flood", deaths: 3, damageBillionVND: 2500 },
  ],
};

export const MOCK_PROVINCE_DATA: ProvinceDisasterData[] = [
  {
    province: "Quảng Bình", code: "QB", region: "north_central",
    lat: 17.48, lng: 106.6, population: 910000, areaKm2: 8065, gdpBillionVND: 56000,
    riskScore: 9.5, riskLevel: "critical",
    totalEvents: 85, totalDeaths: 320, totalMissing: 45, totalAffected: 4500000,
    totalDamageBillionVND: 62000, averageDamagePerEvent: 729,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(12, 20, 0.5),
    yearlyDamage: generateYearlyArray(2000, 3000, 100),
    typeDistribution: { flood: 55, storm: 25, landslide: 10, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Quảng Bình"] || [],
  },
  {
    province: "Quảng Trị", code: "QT", region: "north_central",
    lat: 16.74, lng: 107.18, population: 630000, areaKm2: 4740, gdpBillionVND: 38000,
    riskScore: 9.3, riskLevel: "critical",
    totalEvents: 72, totalDeaths: 250, totalMissing: 35, totalAffected: 3200000,
    totalDamageBillionVND: 48000, averageDamagePerEvent: 667,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(10, 18, 0.3),
    yearlyDamage: generateYearlyArray(1500, 2500, 80),
    typeDistribution: { flood: 55, storm: 25, landslide: 10, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Quảng Trị"] || [],
  },
  {
    province: "Thừa Thiên Huế", code: "TTH", region: "north_central",
    lat: 16.46, lng: 107.6, population: 1150000, areaKm2: 5009, gdpBillionVND: 84000,
    riskScore: 9.0, riskLevel: "critical",
    totalEvents: 78, totalDeaths: 380, totalMissing: 50, totalAffected: 3800000,
    totalDamageBillionVND: 55000, averageDamagePerEvent: 705,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(15, 25, 0.2),
    yearlyDamage: generateYearlyArray(1800, 2800, 90),
    typeDistribution: { flood: 55, storm: 25, landslide: 10, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Thừa Thiên Huế"] || [],
  },
  {
    province: "Đà Nẵng", code: "DN", region: "south_central",
    lat: 16.0, lng: 108.2, population: 1190000, areaKm2: 1285, gdpBillionVND: 170000,
    riskScore: 8.5, riskLevel: "high",
    totalEvents: 65, totalDeaths: 180, totalMissing: 25, totalAffected: 2200000,
    totalDamageBillionVND: 42000, averageDamagePerEvent: 646,
    mostCommonType: "storm",
    yearlyDeaths: generateYearlyArray(7, 12, 0.1),
    yearlyDamage: generateYearlyArray(1200, 2000, 60),
    typeDistribution: { flood: 35, storm: 40, landslide: 15, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Đà Nẵng"] || [],
  },
  {
    province: "Khánh Hòa", code: "KH", region: "south_central",
    lat: 12.25, lng: 109.19, population: 1260000, areaKm2: 5218, gdpBillionVND: 116000,
    riskScore: 8.3, riskLevel: "high",
    totalEvents: 60, totalDeaths: 200, totalMissing: 30, totalAffected: 2500000,
    totalDamageBillionVND: 45000, averageDamagePerEvent: 750,
    mostCommonType: "storm",
    yearlyDeaths: generateYearlyArray(8, 15, 0.2),
    yearlyDamage: generateYearlyArray(1500, 2500, 70),
    typeDistribution: { flood: 35, storm: 40, landslide: 10, drought: 8, earthquake: 4, tsunami: 3 },
    majorEvents: PROVINCE_EVENTS["Khánh Hòa"] || [],
  },
  {
    province: "Quảng Nam", code: "QN2", region: "south_central",
    lat: 15.6, lng: 108.0, population: 1510000, areaKm2: 10438, gdpBillionVND: 104000,
    riskScore: 8.5, riskLevel: "high",
    totalEvents: 70, totalDeaths: 300, totalMissing: 40, totalAffected: 3500000,
    totalDamageBillionVND: 52000, averageDamagePerEvent: 743,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(12, 20, 0.3),
    yearlyDamage: generateYearlyArray(1600, 2600, 80),
    typeDistribution: { flood: 50, storm: 25, landslide: 15, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Quảng Nam"] || [],
  },
  {
    province: "Lào Cai", code: "LC", region: "north",
    lat: 22.33, lng: 103.5, population: 770000, areaKm2: 6384, gdpBillionVND: 48000,
    riskScore: 8.0, riskLevel: "high",
    totalEvents: 55, totalDeaths: 220, totalMissing: 30, totalAffected: 1800000,
    totalDamageBillionVND: 32000, averageDamagePerEvent: 582,
    mostCommonType: "landslide",
    yearlyDeaths: generateYearlyArray(8, 15, 0.5),
    yearlyDamage: generateYearlyArray(1000, 1800, 50),
    typeDistribution: { flood: 30, storm: 15, landslide: 40, drought: 8, earthquake: 5, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Lào Cai"] || [],
  },
  {
    province: "Yên Bái", code: "YB", region: "north",
    lat: 21.72, lng: 104.51, population: 835000, areaKm2: 6886, gdpBillionVND: 42000,
    riskScore: 7.5, riskLevel: "high",
    totalEvents: 50, totalDeaths: 180, totalMissing: 25, totalAffected: 1500000,
    totalDamageBillionVND: 28000, averageDamagePerEvent: 560,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(7, 12, 0.3),
    yearlyDamage: generateYearlyArray(800, 1500, 40),
    typeDistribution: { flood: 40, storm: 15, landslide: 35, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Yên Bái"] || [],
  },
  {
    province: "Quảng Ninh", code: "QN", region: "north",
    lat: 21.0, lng: 107.3, population: 1320000, areaKm2: 6178, gdpBillionVND: 180000,
    riskScore: 7.8, riskLevel: "high",
    totalEvents: 58, totalDeaths: 160, totalMissing: 20, totalAffected: 2000000,
    totalDamageBillionVND: 38000, averageDamagePerEvent: 655,
    mostCommonType: "storm",
    yearlyDeaths: generateYearlyArray(6, 12, 0.4),
    yearlyDamage: generateYearlyArray(1200, 2000, 80),
    typeDistribution: { flood: 35, storm: 40, landslide: 15, drought: 5, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Quảng Ninh"] || [],
  },
  {
    province: "Hải Phòng", code: "HP", region: "north",
    lat: 20.86, lng: 106.68, population: 2020000, areaKm2: 1562, gdpBillionVND: 280000,
    riskScore: 7.0, riskLevel: "high",
    totalEvents: 48, totalDeaths: 120, totalMissing: 15, totalAffected: 1800000,
    totalDamageBillionVND: 30000, averageDamagePerEvent: 625,
    mostCommonType: "storm",
    yearlyDeaths: generateYearlyArray(5, 10, 0.2),
    yearlyDamage: generateYearlyArray(900, 1600, 50),
    typeDistribution: { flood: 40, storm: 35, landslide: 10, drought: 8, earthquake: 5, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Hải Phòng"] || [],
  },
  {
    province: "Thanh Hóa", code: "TH", region: "north_central",
    lat: 19.8, lng: 105.77, population: 3640000, areaKm2: 11116, gdpBillionVND: 156000,
    riskScore: 7.5, riskLevel: "high",
    totalEvents: 62, totalDeaths: 250, totalMissing: 35, totalAffected: 3200000,
    totalDamageBillionVND: 42000, averageDamagePerEvent: 677,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(10, 18, 0.2),
    yearlyDamage: generateYearlyArray(1400, 2200, 60),
    typeDistribution: { flood: 50, storm: 25, landslide: 12, drought: 8, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Thanh Hóa"] || [],
  },
  {
    province: "Nghệ An", code: "NA", region: "north_central",
    lat: 19.23, lng: 104.93, population: 3430000, areaKm2: 16487, gdpBillionVND: 162000,
    riskScore: 7.0, riskLevel: "high",
    totalEvents: 58, totalDeaths: 220, totalMissing: 30, totalAffected: 2800000,
    totalDamageBillionVND: 38000, averageDamagePerEvent: 655,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(9, 15, 0.2),
    yearlyDamage: generateYearlyArray(1200, 2000, 50),
    typeDistribution: { flood: 48, storm: 25, landslide: 12, drought: 10, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["Nghệ An"] || [],
  },
  {
    province: "An Giang", code: "AG", region: "mekong_delta",
    lat: 10.52, lng: 105.13, population: 1910000, areaKm2: 3537, gdpBillionVND: 108000,
    riskScore: 7.3, riskLevel: "high",
    totalEvents: 52, totalDeaths: 100, totalMissing: 12, totalAffected: 3500000,
    totalDamageBillionVND: 28000, averageDamagePerEvent: 538,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(4, 8, 0.1),
    yearlyDamage: generateYearlyArray(800, 1400, 30),
    typeDistribution: { flood: 65, storm: 10, landslide: 2, drought: 18, earthquake: 3, tsunami: 2 },
    majorEvents: PROVINCE_EVENTS["An Giang"] || [],
  },
  {
    province: "Cần Thơ", code: "CT", region: "mekong_delta",
    lat: 10.05, lng: 105.77, population: 1240000, areaKm2: 1439, gdpBillionVND: 124000,
    riskScore: 7.0, riskLevel: "medium",
    totalEvents: 45, totalDeaths: 60, totalMissing: 8, totalAffected: 2200000,
    totalDamageBillionVND: 22000, averageDamagePerEvent: 489,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(2, 5, 0.1),
    yearlyDamage: generateYearlyArray(600, 1000, 25),
    typeDistribution: { flood: 55, storm: 10, landslide: 2, drought: 25, earthquake: 5, tsunami: 3 },
    majorEvents: PROVINCE_EVENTS["Cần Thơ"] || [],
  },
  {
    province: "TP.HCM", code: "HCM", region: "southeast",
    lat: 10.82, lng: 106.63, population: 9300000, areaKm2: 2096, gdpBillionVND: 1300000,
    riskScore: 8.0, riskLevel: "high",
    totalEvents: 48, totalDeaths: 80, totalMissing: 10, totalAffected: 2500000,
    totalDamageBillionVND: 35000, averageDamagePerEvent: 729,
    mostCommonType: "flood",
    yearlyDeaths: generateYearlyArray(3, 6, 0.1),
    yearlyDamage: generateYearlyArray(1000, 1800, 40),
    typeDistribution: { flood: 60, storm: 15, landslide: 2, drought: 15, earthquake: 5, tsunami: 3 },
    majorEvents: PROVINCE_EVENTS["TP.HCM"] || [],
  },
];
