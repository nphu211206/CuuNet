"use client";

// =============================================================================
// CHECKLIST DATA - Disaster Preparedness Checklist System
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Comprehensive disaster preparedness checklist:
//   - 18 items across 6 categories (supplies, documents, home, comm, evac, health)
//   - Smart filtering by season, region, disaster type, priority
//   - Progress tracking with localStorage persistence
//   - Printable HTML generation for offline reference
//   - Completion statistics and recommendations
//
// Design Principles (NDMA Vietnam Guidelines):
//   - Items prioritized: essential > recommended > optional
//   - Season-aware: monsoon items show in May-Oct, typhoon in Jun-Nov
//   - Region-aware: coastal items differ from mountainous
//   - Cost estimates in VND for budget planning
// =============================================================================

import type { DisasterType } from "@/lib/types";
import type {
  ChecklistItem,
  ChecklistProgress,
  ChecklistState,
  ChecklistCategory,
  ChecklistPriority,
  ChecklistSeason,
  ChecklistRegion,
} from "./types";

import {
  CHECKLIST_CATEGORY_CONFIG,
  CHECKLIST_PRIORITY_CONFIG,
  CHECKLIST_SEASON_CONFIG,
  CHECKLIST_REGION_CONFIG,
  PROVINCES_WITH_REGIONS,
  STORAGE_KEYS,
} from "../config/alert-config";

import { MOCK_CHECKLIST_ITEMS } from "../api/mock-data";

// =============================================================================
// SECTION 1: CHECKLIST DATA ACCESS
// =============================================================================

/**
 * Lấy tất cả mục checklist từ mock data.
 */
export function getAllChecklistItems(): ChecklistItem[] {
  return [...MOCK_CHECKLIST_ITEMS];
}

/**
 * Lấy mục checklist theo ID.
 */
export function getChecklistItemById(id: string): ChecklistItem | undefined {
  return MOCK_CHECKLIST_ITEMS.find((item) => item.id === id);
}

/**
 * Lấy mục theo danh mục.
 */
export function getItemsByCategory(category: ChecklistCategory): ChecklistItem[] {
  return MOCK_CHECKLIST_ITEMS.filter((item) => item.category === category);
}

/**
 * Lấy mục theo mức ưu tiên.
 */
export function getItemsByPriority(priority: ChecklistPriority): ChecklistItem[] {
  return MOCK_CHECKLIST_ITEMS.filter((item) => item.priority === priority);
}

/**
 * Lấy mục theo loại thiên tai.
 */
export function getItemsByDisasterType(disasterType: DisasterType): ChecklistItem[] {
  return MOCK_CHECKLIST_ITEMS.filter((item) =>
    item.disasterTypes.includes(disasterType)
  );
}

// =============================================================================
// SECTION 2: SMART FILTERING
// =============================================================================

/** Bộ lọc checklist */
export interface ChecklistFilter {
  season?: ChecklistSeason;
  region?: ChecklistRegion;
  province?: string;
  disasterTypes?: DisasterType[];
  categories?: ChecklistCategory[];
  priorities?: ChecklistPriority[];
  searchQuery?: string;
}

/**
 * Xác định mùa hiện tại dựa trên tháng.
 */
export function getCurrentSeason(): ChecklistSeason {
  const month = new Date().getMonth() + 1; // 1-12

  if (month >= 6 && month <= 11) return "typhoon";
  if (month >= 5 && month <= 10) return "monsoon";
  return "dry";
}

/**
 * Xác định mùa dựa trên tỉnh.
 * Vùng ven biển ưu tiên mùa bão, vùng ngập ưu tiên mùa mưa.
 */
export function getSeasonForProvince(province: string): ChecklistSeason {
  const regions = PROVINCES_WITH_REGIONS[province] || [];

  if (regions.includes("coastal")) return "typhoon";
  if (regions.includes("flood_prone")) return "monsoon";
  return getCurrentSeason();
}

/**
 * Lấy khu vực của tỉnh.
 */
export function getRegionsForProvince(province: string): ChecklistRegion[] {
  return PROVINCES_WITH_REGIONS[province] || ["all"];
}

/**
 * Kiểm tra mục có áp dụng cho mùa không.
 */
function isItemMatchingSeason(item: ChecklistItem, season: ChecklistSeason): boolean {
  if (item.season === "all") return true;
  if (season === "all") return true;
  return item.season === season;
}

/**
 * Kiểm tra mục có áp dụng cho khu vực không.
 */
function isItemMatchingRegion(item: ChecklistItem, region: ChecklistRegion): boolean {
  if (item.regions.includes("all")) return true;
  if (region === "all") return true;
  return item.regions.includes(region);
}

/**
 * Kiểm tra mục có áp dụng cho tỉnh không.
 */
function isItemMatchingProvince(item: ChecklistItem, province: string): boolean {
  if (item.regions.includes("all")) return true;

  const provinceRegions = PROVINCES_WITH_REGIONS[province] || [];
  return item.regions.some((region) => provinceRegions.includes(region));
}

/**
 * Lọc mục theo nhiều tiêu chí.
 * Trả về mục đã lọc + sắp xếp theo ưu tiên.
 */
export function filterChecklistItems(
  filter: ChecklistFilter
): ChecklistItem[] {
  let items = [...MOCK_CHECKLIST_ITEMS];

  // Lọc theo mùa
  if (filter.season && filter.season !== "all") {
    items = items.filter((item) => isItemMatchingSeason(item, filter.season!));
  }

  // Lọc theo khu vực
  if (filter.region && filter.region !== "all") {
    items = items.filter((item) => isItemMatchingRegion(item, filter.region!));
  }

  // Lọc theo tỉnh
  if (filter.province) {
    items = items.filter((item) => isItemMatchingProvince(item, filter.province!));
  }

  // Lọc theo loại thiên tai
  if (filter.disasterTypes && filter.disasterTypes.length > 0) {
    items = items.filter((item) =>
      filter.disasterTypes!.some((type) => item.disasterTypes.includes(type))
    );
  }

  // Lọc theo danh mục
  if (filter.categories && filter.categories.length > 0) {
    items = items.filter((item) => filter.categories!.includes(item.category));
  }

  // Lọc theo ưu tiên
  if (filter.priorities && filter.priorities.length > 0) {
    items = items.filter((item) => filter.priorities!.includes(item.priority));
  }

  // Tìm kiếm
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.tips && item.tips.toLowerCase().includes(query))
    );
  }

  // Sắp xếp: essential > recommended > optional, sau đó theo category order
  items.sort((a, b) => {
    const priorityDiff =
      CHECKLIST_PRIORITY_CONFIG[a.priority].order -
      CHECKLIST_PRIORITY_CONFIG[b.priority].order;
    if (priorityDiff !== 0) return priorityDiff;

    return (
      CHECKLIST_CATEGORY_CONFIG[a.category].order -
      CHECKLIST_CATEGORY_CONFIG[b.category].order
    );
  });

  return items;
}

/**
 * Lấy mục đề xuất cho mùa hiện tại.
 */
export function getSeasonalRecommendations(province?: string): ChecklistItem[] {
  const season = province ? getSeasonForProvince(province) : getCurrentSeason();

  return filterChecklistItems({
    season,
    province,
    priorities: ["essential"],
  });
}

// =============================================================================
// SECTION 3: PROGRESS TRACKING
// =============================================================================

/**
 * Tải tiến độ từ localStorage.
 */
export function loadChecklistProgress(): ChecklistProgress[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHECKLIST_PROGRESS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Lưu tiến độ vào localStorage.
 */
export function saveChecklistProgress(progress: ChecklistProgress[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error("[ChecklistData] Failed to save progress:", error);
  }
}

/**
 * Đánh dấu hoàn thành / bỏ hoàn thành một mục.
 */
export function toggleChecklistItem(
  progress: ChecklistProgress[],
  itemId: string
): ChecklistProgress[] {
  const existing = progress.find((p) => p.itemId === itemId);

  if (existing) {
    // Toggle
    return progress.map((p) =>
      p.itemId === itemId
        ? {
            ...p,
            completed: !p.completed,
            completedAt: !p.completed ? new Date().toISOString() : undefined,
          }
        : p
    );
  }

  // Thêm mới
  return [
    ...progress,
    {
      itemId,
      completed: true,
      completedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Thêm ghi chú cho mục.
 */
export function addChecklistNote(
  progress: ChecklistProgress[],
  itemId: string,
  note: string
): ChecklistProgress[] {
  const existing = progress.find((p) => p.itemId === itemId);

  if (existing) {
    return progress.map((p) =>
      p.itemId === itemId ? { ...p, note } : p
    );
  }

  return [
    ...progress,
    {
      itemId,
      completed: false,
      note,
    },
  ];
}

/**
 * Xóa tất cả tiến độ.
 */
export function resetChecklistProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.CHECKLIST_PROGRESS);
}

/**
 * Lấy trạng thái hoàn thành của một mục.
 */
export function getItemProgress(
  progress: ChecklistProgress[],
  itemId: string
): ChecklistProgress | undefined {
  return progress.find((p) => p.itemId === itemId);
}

/**
 * Kiểm tra mục đã hoàn thành chưa.
 */
export function isItemCompleted(
  progress: ChecklistProgress[],
  itemId: string
): boolean {
  const item = getItemProgress(progress, itemId);
  return item?.completed ?? false;
}

// =============================================================================
// SECTION 4: COMPLETION STATISTICS
// =============================================================================

/** Thống kê checklist */
export interface ChecklistStats {
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  byCategory: Record<ChecklistCategory, { total: number; completed: number; percentage: number }>;
  byPriority: Record<ChecklistPriority, { total: number; completed: number; percentage: number }>;
  essentialRemaining: number;
  estimatedCostRemaining: string;
  recommendedNext: ChecklistItem[];
}

/**
 * Tính toán thống kê checklist.
 */
export function calculateChecklistStats(
  items: ChecklistItem[],
  progress: ChecklistProgress[]
): ChecklistStats {
  const totalItems = items.length;
  const completedItems = items.filter((item) =>
    isItemCompleted(progress, item.id)
  ).length;

  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Thống kê theo danh mục
  const byCategory: Record<ChecklistCategory, { total: number; completed: number; percentage: number }> = {
    supplies: { total: 0, completed: 0, percentage: 0 },
    documents: { total: 0, completed: 0, percentage: 0 },
    home: { total: 0, completed: 0, percentage: 0 },
    communication: { total: 0, completed: 0, percentage: 0 },
    evacuation: { total: 0, completed: 0, percentage: 0 },
    health: { total: 0, completed: 0, percentage: 0 },
  };

  for (const item of items) {
    byCategory[item.category].total++;
    if (isItemCompleted(progress, item.id)) {
      byCategory[item.category].completed++;
    }
  }

  for (const cat of Object.keys(byCategory) as ChecklistCategory[]) {
    const data = byCategory[cat];
    data.percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
  }

  // Thống kê theo ưu tiên
  const byPriority: Record<ChecklistPriority, { total: number; completed: number; percentage: number }> = {
    essential: { total: 0, completed: 0, percentage: 0 },
    recommended: { total: 0, completed: 0, percentage: 0 },
    optional: { total: 0, completed: 0, percentage: 0 },
  };

  for (const item of items) {
    byPriority[item.priority].total++;
    if (isItemCompleted(progress, item.id)) {
      byPriority[item.priority].completed++;
    }
  }

  for (const pri of Object.keys(byPriority) as ChecklistPriority[]) {
    const data = byPriority[pri];
    data.percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
  }

  // Số mục essential còn lại
  const essentialRemaining = items.filter(
    (item) => item.priority === "essential" && !isItemCompleted(progress, item.id)
  ).length;

  // Ước tính chi phí còn lại
  const uncompletedWithCost = items.filter(
    (item) => !isItemCompleted(progress, item.id) && item.estimatedCost
  );
  const estimatedCostRemaining =
    uncompletedWithCost.length > 0
      ? `${uncompletedWithCost.length} mục có chi phí ước tính`
      : "Không có chi phí ước tính";

  // Đề xuất mục tiếp theo (essential chưa hoàn thành)
  const recommendedNext = items
    .filter((item) => item.priority === "essential" && !isItemCompleted(progress, item.id))
    .slice(0, 3);

  return {
    totalItems,
    completedItems,
    completionPercentage,
    byCategory,
    byPriority,
    essentialRemaining,
    estimatedCostRemaining,
    recommendedNext,
  };
}

/**
 * Lấy mức độ sẵn sàng dựa trên phần trăm hoàn thành.
 */
export function getReadinessLevel(percentage: number): {
  level: "critical" | "low" | "moderate" | "good" | "excellent";
  label: string;
  labelVi: string;
  color: string;
  icon: string;
  message: string;
} {
  if (percentage >= 90) {
    return {
      level: "excellent",
      label: "Excellent",
      labelVi: "Xuất sắc",
      color: "#22C55E",
      icon: "🌟",
      message: "Bạn đã chuẩn bị rất tốt! Hãy kiểm tra định kỳ để duy trì.",
    };
  }
  if (percentage >= 70) {
    return {
      level: "good",
      label: "Good",
      labelVi: "Tốt",
      color: "#3B82F6",
      icon: "✅",
      message: "Khá tốt! Hoàn thành các mục essential còn lại để sẵn sàng hơn.",
    };
  }
  if (percentage >= 50) {
    return {
      level: "moderate",
      label: "Moderate",
      labelVi: "Trung bình",
      color: "#F59E0B",
      icon: "⚠️",
      message: "Bạn đã chuẩn bị được một nửa. Ưu tiên các mục essential trước.",
    };
  }
  if (percentage >= 25) {
    return {
      level: "low",
      label: "Low",
      labelVi: "Thấp",
      color: "#F97316",
      icon: "🔶",
      message: "Mức chuẩn bị thấp. Bắt đầu với nước uống, thực phẩm, đèn pin.",
    };
  }
  return {
    level: "critical",
    label: "Critical",
    labelVi: "Cần cải thiện",
    color: "#EF4444",
    icon: "🔴",
    message: "Bạn chưa chuẩn bị đủ. Hãy bắt đầu ngay với các mục thiết yếu!",
  };
}

// =============================================================================
// SECTION 5: PRINTABLE HTML GENERATION
// =============================================================================

/**
 * Tạo HTML để in checklist.
 * Hỗ trợ in ra giấy khi mất điện, mất mạng.
 */
export function generatePrintableHTML(
  items: ChecklistItem[],
  progress: ChecklistProgress[],
  province?: string
): string {
  const stats = calculateChecklistStats(items, progress);
  const now = new Date().toLocaleDateString("vi-VN");

  // Nhóm theo danh mục
  const grouped = new Map<ChecklistCategory, ChecklistItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.category) || [];
    existing.push(item);
    grouped.set(item.category, existing);
  }

  let categoryHTML = "";
  for (const [category, catItems] of grouped) {
    const config = CHECKLIST_CATEGORY_CONFIG[category];
    const catStats = stats.byCategory[category];

    categoryHTML += `
      <div class="category">
        <h2>${config.icon} ${config.labelVi} (${catStats.completed}/${catStats.total})</h2>
        <div class="items">
          ${catItems
            .map((item) => {
              const completed = isItemCompleted(progress, item.id);
              const priorityConfig = CHECKLIST_PRIORITY_CONFIG[item.priority];

              return `
              <div class="item ${completed ? "completed" : ""}">
                <div class="checkbox">${completed ? "☑" : "☐"}</div>
                <div class="content">
                  <div class="title">
                    ${item.icon} ${item.title}
                    <span class="priority" style="color: ${priorityConfig.color}">[${priorityConfig.labelVi}]</span>
                  </div>
                  <div class="description">${item.description}</div>
                  ${item.estimatedCost ? `<div class="cost">💰 ${item.estimatedCost}</div>` : ""}
                  ${item.tips ? `<div class="tips">💡 ${item.tips}</div>` : ""}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Checklist Chuẩn Bị Thiên Tai - CứuNet</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3B82F6;
    }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .stat { text-align: center; }
    .stat .number { font-size: 24px; font-weight: bold; color: #3B82F6; }
    .stat .label { font-size: 12px; color: #666; }
    .category {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .category h2 {
      font-size: 18px;
      margin-bottom: 10px;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    .item {
      display: flex;
      padding: 10px;
      border-bottom: 1px solid #eee;
      align-items: flex-start;
    }
    .item.completed { opacity: 0.6; }
    .item.completed .title { text-decoration: line-through; }
    .checkbox { font-size: 18px; margin-right: 10px; min-width: 24px; }
    .content { flex: 1; }
    .title { font-weight: 600; margin-bottom: 4px; }
    .priority { font-size: 11px; font-weight: normal; }
    .description { font-size: 13px; color: #666; margin-bottom: 4px; }
    .cost { font-size: 12px; color: #059669; }
    .tips { font-size: 12px; color: #8B5CF6; font-style: italic; }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body { padding: 10px; }
      .stats { background: #fff; border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏠 Checklist Chuẩn Bị Thiên Tai</h1>
    <div class="subtitle">
      CứuNet - ${province ? `Tỉnh: ${province}` : "Toàn quốc"} | Ngày tạo: ${now}
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="number">${stats.completionPercentage}%</div>
      <div class="label">Hoàn thành</div>
    </div>
    <div class="stat">
      <div class="number">${stats.completedItems}/${stats.totalItems}</div>
      <div class="label">Mục đã xong</div>
    </div>
    <div class="stat">
      <div class="number">${stats.essentialRemaining}</div>
      <div class="label">Essential còn lại</div>
    </div>
  </div>

  ${categoryHTML}

  <div class="footer">
    <p>CứuNet - Hệ thống Cảnh Báo & SOS Thiên Tai</p>
    <p>In ngày: ${now} | Cập nhật checklist tại cuunet.vn</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Mở cửa sổ in checklist.
 */
export function printChecklist(
  items: ChecklistItem[],
  progress: ChecklistProgress[],
  province?: string
): void {
  const html = generatePrintableHTML(items, progress, province);
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

// =============================================================================
// SECTION 6: CHECKLIST STATE MANAGEMENT
// =============================================================================

/**
 * Tạo trạng thái ban đầu cho checklist.
 */
export function createInitialChecklistState(province?: string): ChecklistState {
  const items = getAllChecklistItems();
  const progress = loadChecklistProgress();
  const selectedProvince = province || localStorage.getItem(STORAGE_KEYS.CHECKLIST_PROVINCE) || "";
  const selectedSeason = selectedProvince
    ? getSeasonForProvince(selectedProvince)
    : getCurrentSeason();

  const filteredItems = filterChecklistItems({
    season: selectedSeason,
    province: selectedProvince || undefined,
  });

  const stats = calculateChecklistStats(filteredItems, progress);

  return {
    items,
    progress,
    selectedProvince,
    selectedSeason,
    completionPercentage: stats.completionPercentage,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Lưu trạng thái checklist.
 */
export function saveChecklistState(state: ChecklistState): void {
  saveChecklistProgress(state.progress);

  if (state.selectedProvince) {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_PROVINCE, state.selectedProvince);
  }
}

// =============================================================================
// SECTION 7: CHECKLIST CLASS (Unified Interface)
// =============================================================================

/**
 * ChecklistManager - Class chính quản lý checklist.
 *
 * Usage:
 *   const manager = new ChecklistManager("Đà Nẵng");
 *   manager.toggleItem("CHK-xxx");
 *   const stats = manager.getStats();
 */
export class ChecklistManager {
  private items: ChecklistItem[];
  private progress: ChecklistProgress[];
  private province: string;
  private season: ChecklistSeason;
  private listeners: Set<() => void> = new Set();

  constructor(province?: string) {
    this.items = getAllChecklistItems();
    this.progress = loadChecklistProgress();
    this.province = province || localStorage.getItem(STORAGE_KEYS.CHECKLIST_PROVINCE) || "";
    this.season = this.province
      ? getSeasonForProvince(this.province)
      : getCurrentSeason();
  }

  /** Lấy mục đã lọc */
  getFilteredItems(): ChecklistItem[] {
    return filterChecklistItems({
      season: this.season,
      province: this.province || undefined,
    });
  }

  /** Lấy tất cả mục */
  getAllItems(): ChecklistItem[] {
    return [...this.items];
  }

  /** Lấy tiến độ */
  getProgress(): ChecklistProgress[] {
    return [...this.progress];
  }

  /** Toggle hoàn thành */
  toggleItem(itemId: string): void {
    this.progress = toggleChecklistItem(this.progress, itemId);
    saveChecklistProgress(this.progress);
    this.notifyListeners();
  }

  /** Thêm ghi chú */
  addNote(itemId: string, note: string): void {
    this.progress = addChecklistNote(this.progress, itemId, note);
    saveChecklistProgress(this.progress);
    this.notifyListeners();
  }

  /** Đặt tỉnh */
  setProvince(province: string): void {
    this.province = province;
    this.season = getSeasonForProvince(province);
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_PROVINCE, province);
    this.notifyListeners();
  }

  /** Đặt mùa */
  setSeason(season: ChecklistSeason): void {
    this.season = season;
    this.notifyListeners();
  }

  /** Lấy tỉnh hiện tại */
  getProvince(): string {
    return this.province;
  }

  /** Lấy mùa hiện tại */
  getSeason(): ChecklistSeason {
    return this.season;
  }

  /** Tính thống kê */
  getStats(): ChecklistStats {
    return calculateChecklistStats(this.getFilteredItems(), this.progress);
  }

  /** Lấy mức sẵn sàng */
  getReadiness() {
    const stats = this.getStats();
    return getReadinessLevel(stats.completionPercentage);
  }

  /** In checklist */
  print(): void {
    printChecklist(this.getFilteredItems(), this.progress, this.province);
  }

  /** Tạo HTML */
  toHTML(): string {
    return generatePrintableHTML(this.getFilteredItems(), this.progress, this.province);
  }

  /** Reset tiến độ */
  reset(): void {
    this.progress = [];
    resetChecklistProgress();
    this.notifyListeners();
  }

  /** Lấy mục đề xuất */
  getRecommendations(): ChecklistItem[] {
    return getSeasonalRecommendations(this.province || undefined);
  }

  /** Kiểm tra mục đã hoàn thành */
  isCompleted(itemId: string): boolean {
    return isItemCompleted(this.progress, itemId);
  }

  /** Đăng ký listener */
  onUpdate(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Thông báo listeners */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /** Cleanup */
  destroy(): void {
    this.listeners.clear();
  }
}

// =============================================================================
// SECTION 8: QUICK ACCESS HELPERS
// =============================================================================

/**
 * Lấy danh mục checklist cho UI grouping.
 */
export function getChecklistCategories(): Array<{
  category: ChecklistCategory;
  label: string;
  labelVi: string;
  icon: string;
  color: string;
  order: number;
}> {
  return Object.entries(CHECKLIST_CATEGORY_CONFIG).map(([key, config]) => ({
    category: key as ChecklistCategory,
    ...config,
  }));
}

/**
 * Lấy mô tả mùa cho UI.
 */
export function getSeasonDescription(season: ChecklistSeason): string {
  return CHECKLIST_SEASON_CONFIG[season].description;
}

/**
 * Lấy icon mùa.
 */
export function getSeasonIcon(season: ChecklistSeason): string {
  return CHECKLIST_SEASON_CONFIG[season].icon;
}

/**
 * Kiểm tra mùa hiện tại có phải mùa thiên tai không.
 */
export function isDisasterSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return month >= 5 && month <= 11; // Tháng 5-11
}

/**
 * Lấy mẹo chuẩn bị theo mùa.
 */
export function getSeasonalTips(season: ChecklistSeason): string[] {
  const tips: Record<ChecklistSeason, string[]> = {
    all: [
      "Luôn có sẵn nước uống dự trữ cho 3 ngày",
      "Kiểm tra pin đèn pin và sạc dự phòng mỗi tháng",
      "Lưu số điện thoại khẩn cấp trong điện thoại và giấy",
    ],
    monsoon: [
      "Kiểm tra hệ thống thoát nước quanh nhà",
      "Dự trữ bao cát nếu sống vùng thấp",
      "Di chuyển đồ có giá trị lên tầng cao",
      "Theo dõi bản tin thời tiết hàng ngày",
    ],
    dry: [
      "Dự trữ nước uống thêm cho mùa khô",
      "Kiểm tra hệ thống PCCC tại nhà",
      "Trồng cây xanh quanh nhà để giảm nhiệt",
    ],
    typhoon: [
      "Gia cố mái nhà, cửa sổ trước mùa bão",
      "Cắt bỏ cành cây gần nhà",
      "Dự trữ thực phẩm cho 5-7 ngày",
      "Chuẩn bị áo phao cho cả gia đình",
      "Biết đường sơ tán gần nhất",
    ],
  };

  return tips[season] || tips.all;
}

/**
 * Tính tổng chi phí ước tính cho các mục chưa hoàn thành.
 */
export function estimateTotalCost(items: ChecklistItem[]): {
  min: number;
  max: number;
  formatted: string;
} {
  let min = 0;
  let max = 0;

  for (const item of items) {
    if (item.estimatedCost) {
      const match = item.estimatedCost.match(/([\d,]+)\s*-\s*([\d,]+)/);
      if (match) {
        min += parseInt(match[1].replace(/,/g, ""));
        max += parseInt(match[2].replace(/,/g, ""));
      }
    }
  }

  return {
    min,
    max,
    formatted: `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} VNĐ`,
  };
}
