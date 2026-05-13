"use client";

// =============================================================================
// EMERGENCY DIRECTORY - National & Provincial Emergency Contacts
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Comprehensive emergency contact directory system:
//   - National emergency numbers (113, 114, 115, 116)
//   - Provincial PCTT, Rescue, Red Cross, Hospital contacts
//   - Smart search with Vietnamese text normalization
//   - Quick-dial integration
//   - Geolocation-based nearest contact finder
//   - Offline-first contact caching
//
// Design Principles:
//   - Every contact must be reachable in ≤2 taps
//   - Contacts sorted by relevance to user's location
//   - Supports Vietnamese diacritical search
//   - Caches contacts for offline access
// =============================================================================

import type {
  EmergencyContact,
  EmergencyContactType,
  ProvinceEmergencyDirectory,
} from "./types";

import {
  EMERGENCY_CONTACT_TYPE_CONFIG,
  NATIONAL_EMERGENCY_NUMBERS,
  PROVINCES_WITH_REGIONS,
} from "../config/alert-config";

import {
  MOCK_NATIONAL_CONTACTS,
  MOCK_PROVINCE_CONTACTS,
} from "../api/mock-data";

// =============================================================================
// SECTION 1: CONTACT DATABASE ACCESS
// =============================================================================

/**
 * Lấy tất cả liên hệ khẩn cấp quốc gia.
 * Bao gồm: 113 (Cảnh sát), 114 (Cứu hỏa), 115 (Cấp cứu), 116 (Biên phòng)
 */
export function getNationalContacts(): EmergencyContact[] {
  return [...MOCK_NATIONAL_CONTACTS];
}

/**
 * Lấy liên hệ khẩn cấp theo tỉnh.
 * Bao gồm: PCTT, Cứu nạn, Chữ thập đỏ, Bệnh viện, Biên phòng (nếu ven biển)
 */
export function getProvinceContacts(province: string): EmergencyContact[] {
  return MOCK_PROVINCE_CONTACTS[province] || [];
}

/**
 * Lấy tất cả liên hệ (quốc gia + tỉnh).
 */
export function getAllContacts(province?: string): EmergencyContact[] {
  const national = getNationalContacts();
  const local = province ? getProvinceContacts(province) : [];
  return [...national, ...local];
}

/**
 * Lấy danh mục đầy đủ cho một tỉnh.
 */
export function getProvinceDirectory(province: string): ProvinceEmergencyDirectory {
  return {
    province,
    nationalContacts: getNationalContacts(),
    localContacts: getProvinceContacts(province),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Lấy tất cả tỉnh có trong danh bạ.
 */
export function getAvailableProvinces(): string[] {
  return Object.keys(MOCK_PROVINCE_CONTACTS);
}

/**
 * Lấy liên hệ theo loại.
 */
export function getContactsByType(
  type: EmergencyContactType,
  province?: string
): EmergencyContact[] {
  const all = getAllContacts(province);
  return all.filter((c) => c.type === type);
}

/**
 * Lấy liên hệ theo nhiều loại.
 */
export function getContactsByTypes(
  types: EmergencyContactType[],
  province?: string
): EmergencyContact[] {
  const all = getAllContacts(province);
  return all.filter((c) => types.includes(c.type));
}

// =============================================================================
// SECTION 2: SMART SEARCH
// =============================================================================

/**
 * Chuẩn hóa tiếng Việt cho tìm kiếm.
 * Loại bỏ dấu, chuyển về lowercase.
 */
function normalizeVietnamese(text: string): string {
  const vietnameseMap: Record<string, string> = {
    à: "a", á: "a", ả: "a", ã: "a", ạ: "a",
    ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a",
    â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a",
    đ: "d",
    è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
    ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e", ệ: "e",
    ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
    ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
    ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o",
    ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
    ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
    ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
    ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
  };

  return text
    .toLowerCase()
    .split("")
    .map((char) => vietnameseMap[char] || char)
    .join("");
}

/**
 * Tìm kiếm liên hệ theo từ khóa.
 * Hỗ trợ tìm kiếm tiếng Việt có dấu và không dấu.
 *
 * @param query - Từ khóa tìm kiếm
 * @param province - Giới hạn trong tỉnh (optional)
 * @returns Danh sách liên hệ phù hợp, sắp xếp theo relevance
 */
export function searchContacts(
  query: string,
  province?: string
): EmergencyContact[] {
  if (!query.trim()) return getAllContacts(province);

  const normalizedQuery = normalizeVietnamese(query.trim());
  const allContacts = getAllContacts(province);

  const results: Array<{ contact: EmergencyContact; score: number }> = [];

  for (const contact of allContacts) {
    let score = 0;

    // Tìm trong tên
    const normalizedName = normalizeVietnamese(contact.name);
    const normalizedNameVi = normalizeVietnamese(contact.nameVi);

    if (normalizedName.includes(normalizedQuery) || normalizedNameVi.includes(normalizedQuery)) {
      score += 10;
    }

    // Tìm trong mô tả
    const normalizedDesc = normalizeVietnamese(contact.description);
    if (normalizedDesc.includes(normalizedQuery)) {
      score += 5;
    }

    // Tìm trong số điện thoại
    if (contact.number.includes(query.trim())) {
      score += 8;
    }

    // Tìm trong type label
    const typeConfig = EMERGENCY_CONTACT_TYPE_CONFIG[contact.type];
    const normalizedTypeLabel = normalizeVietnamese(typeConfig.labelVi);
    if (normalizedTypeLabel.includes(normalizedQuery)) {
      score += 7;
    }

    // Tìm trong quận/huyện
    if (contact.district) {
      const normalizedDistrict = normalizeVietnamese(contact.district);
      if (normalizedDistrict.includes(normalizedQuery)) {
        score += 3;
      }
    }

    // Tìm trong địa chỉ
    if (contact.address) {
      const normalizedAddress = normalizeVietnamese(contact.address);
      if (normalizedAddress.includes(normalizedQuery)) {
        score += 2;
      }
    }

    // Tìm theo từ khóa đặc biệt
    const specialKeywords: Record<string, EmergencyContactType[]> = {
      "cứu hỏa": ["fire"],
      "cháy": ["fire"],
      "cấp cứu": ["ambulance"],
      "bệnh viện": ["hospital"],
      "cảnh sát": ["police"],
      "công an": ["police"],
      "biên phòng": ["coast_guard"],
      "cứu nạn": ["rescue", "disaster"],
      "cứu hộ": ["rescue"],
      "quân đội": ["military"],
      "chữ thập đỏ": ["red_cross"],
      "điện lực": ["electricity"],
      "mất điện": ["electricity"],
      "nước": ["water"],
      "mất nước": ["water"],
    };

    for (const [keyword, types] of Object.entries(specialKeywords)) {
      if (normalizedQuery.includes(normalizeVietnamese(keyword)) && types.includes(contact.type)) {
        score += 6;
      }
    }

    if (score > 0) {
      results.push({ contact, score });
    }
  }

  // Sắp xếp theo điểm, ưu tiên liên hệ quốc gia
  results.sort((a, b) => {
    // Quốc gia ưu tiên hơn
    if (a.contact.isNational && !b.contact.isNational) return -1;
    if (!a.contact.isNational && b.contact.isNational) return 1;
    // Sau đó theo điểm
    return b.score - a.score;
  });

  return results.map((r) => r.contact);
}

// =============================================================================
// SECTION 3: GEOLOCATION-BASED FINDER
// =============================================================================

/** Tọa độ tỉnh thành Việt Nam */
const PROVINCE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Hồ Chí Minh": { lat: 10.8231, lng: 106.6297 },
  "Đà Nẵng": { lat: 16.0748, lng: 108.223 },
  "Huế": { lat: 16.4637, lng: 107.5909 },
  "Cần Thơ": { lat: 10.0452, lng: 105.7469 },
  "Hải Phòng": { lat: 20.8449, lng: 106.6881 },
  "Nha Trang": { lat: 12.2388, lng: 109.1967 },
  "Đà Lạt": { lat: 11.9404, lng: 108.4583 },
  "Quảng Bình": { lat: 17.4689, lng: 106.6223 },
  "Quảng Nam": { lat: 15.8794, lng: 108.335 },
  "Bến Tre": { lat: 10.2415, lng: 106.3756 },
  "Trà Vinh": { lat: 9.9347, lng: 106.3453 },
  "Lào Cai": { lat: 22.4856, lng: 103.9707 },
  "Yên Bái": { lat: 21.7229, lng: 104.8984 },
  "An Giang": { lat: 10.5216, lng: 105.1259 },
};

/**
 * Tính khoảng cách giữa hai tọa độ (Haversine formula).
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Tìm tỉnh gần nhất với vị trí hiện tại.
 */
export function findNearestProvince(
  userLat: number,
  userLng: number
): { province: string; distance: number } | null {
  let nearest: string | null = null;
  let minDistance = Infinity;

  for (const [province, coords] of Object.entries(PROVINCE_COORDINATES)) {
    const distance = haversineDistance(userLat, userLng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = province;
    }
  }

  if (!nearest) return null;

  return {
    province: nearest,
    distance: Math.round(minDistance * 10) / 10,
  };
}

/**
 * Lấy liên hệ gần nhất theo loại và vị trí.
 */
export function findNearestContact(
  type: EmergencyContactType,
  userLat: number,
  userLng: number
): EmergencyContact | null {
  const nearest = findNearestProvince(userLat, userLng);
  if (!nearest) return getNationalContacts().find((c) => c.type === type) || null;

  const provinceContacts = getProvinceContacts(nearest.province);
  const typeContacts = provinceContacts.filter((c) => c.type === type);

  if (typeContacts.length > 0) {
    // Ưu tiên liên hệ 24/7
    const always = typeContacts.find((c) => c.available24_7);
    return always || typeContacts[0];
  }

  // Fallback: liên hệ quốc gia
  return getNationalContacts().find((c) => c.type === type) || null;
}

/**
 * Lấy tất cả liên hệ gần vị trí hiện tại, sắp xếp theo khoảng cách.
 */
export function getNearbyContacts(
  userLat: number,
  userLng: number,
  maxDistance: number = 100 // km
): Array<{ contact: EmergencyContact; province: string; distance: number }> {
  const results: Array<{ contact: EmergencyContact; province: string; distance: number }> = [];

  for (const [province, coords] of Object.entries(PROVINCE_COORDINATES)) {
    const distance = haversineDistance(userLat, userLng, coords.lat, coords.lng);

    if (distance <= maxDistance) {
      const contacts = getProvinceContacts(province);
      for (const contact of contacts) {
        results.push({ contact, province, distance: Math.round(distance * 10) / 10 });
      }
    }
  }

  // Thêm liên hệ quốc gia (luôn luôn hiển thị)
  const national = getNationalContacts();
  for (const contact of national) {
    results.push({ contact, province: "Toàn quốc", distance: 0 });
  }

  // Sắp xếp: quốc gia trước, sau đó theo khoảng cách
  results.sort((a, b) => {
    if (a.contact.isNational && !b.contact.isNational) return -1;
    if (!a.contact.isNational && b.contact.isNational) return 1;
    return a.distance - b.distance;
  });

  return results;
}

// =============================================================================
// SECTION 4: QUICK DIAL
// =============================================================================

/**
 * Tạo URL để gọi điện thoại.
 * Hỗ trợ tel: protocol cho mobile.
 */
export function createCallUrl(number: string): string {
  // Loại bỏ khoảng trắng và ký tự đặc biệt
  const cleanNumber = number.replace(/[\s\-()]/g, "");
  return `tel:${cleanNumber}`;
}

/**
 * Tạo URL để gửi SMS.
 */
export function createSmsUrl(number: string, message?: string): string {
  const cleanNumber = number.replace(/[\s\-()]/g, "");
  if (message) {
    return `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  }
  return `sms:${cleanNumber}`;
}

/**
 * Mở ứng dụng gọi điện.
 * Nếu không thể gọi (desktop), hiển thị alert với số điện thoại.
 */
export function callContact(number: string): void {
  const url = createCallUrl(number);

  // Kiểm tra có phải mobile không
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    window.location.href = url;
  } else {
    // Trên desktop, copy số vào clipboard
    navigator.clipboard.writeText(number).then(() => {
      alert(`Đã copy số ${number} vào clipboard. Vui lòng gọi từ điện thoại.`);
    }).catch(() => {
      alert(`Số điện thoại: ${number}\nVui lòng gọi từ điện thoại.`);
    });
  }
}

/**
 * Gửi SMS SOS nhanh.
 * Tạo tin nhắn SOS chuẩn và mở ứng dụng SMS.
 */
export function sendSosSms(
  number: string,
  data: {
    name?: string;
    location?: string;
    situation?: string;
    peopleCount?: number;
  }
): void {
  const message = [
    "SOS CứuNet",
    data.name ? `Tên: ${data.name}` : "",
    data.location ? `Vị trí: ${data.location}` : "",
    data.situation ? `Tình huống: ${data.situation}` : "",
    data.peopleCount ? `Số người: ${data.peopleCount}` : "",
    `Thời gian: ${new Date().toLocaleString("vi-VN")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const url = createSmsUrl(number, message);
  window.location.href = url;
}

// =============================================================================
// SECTION 5: CONTACT CATEGORIZATION
// =============================================================================

/** Nhóm liên hệ theo loại */
export interface ContactCategory {
  type: EmergencyContactType;
  label: string;
  labelVi: string;
  icon: string;
  color: string;
  contacts: EmergencyContact[];
  count: number;
}

/**
 * Nhóm liên hệ theo loại cho UI.
 */
export function categorizeContacts(
  contacts: EmergencyContact[]
): ContactCategory[] {
  const categoryMap = new Map<EmergencyContactType, EmergencyContact[]>();

  for (const contact of contacts) {
    const existing = categoryMap.get(contact.type) || [];
    existing.push(contact);
    categoryMap.set(contact.type, existing);
  }

  const categories: ContactCategory[] = [];

  for (const [type, typeContacts] of categoryMap) {
    const config = EMERGENCY_CONTACT_TYPE_CONFIG[type];
    categories.push({
      type,
      label: config.label,
      labelVi: config.labelVi,
      icon: config.icon,
      color: config.color,
      contacts: typeContacts.sort((a, b) => a.priority - b.priority),
      count: typeContacts.length,
    });
  }

  // Sắp xếp: ưu tiên theo thứ tự quan trọng
  const typePriority: Record<EmergencyContactType, number> = {
    police: 1,
    fire: 2,
    ambulance: 3,
    coast_guard: 4,
    disaster: 5,
    rescue: 6,
    military: 7,
    red_cross: 8,
    hospital: 9,
    electricity: 10,
    water: 11,
  };

  categories.sort((a, b) => (typePriority[a.type] || 99) - (typePriority[b.type] || 99));

  return categories;
}

/**
 * Lấy mô tả cho loại liên hệ.
 */
export function getContactTypeDescription(type: EmergencyContactType): string {
  const descriptions: Record<EmergencyContactType, string> = {
    police: "Gọi khi có vấn đề về an ninh, trật tự, tai nạn giao thông",
    fire: "Gọi khi có cháy, cứu nạn, cứu hộ",
    ambulance: "Gọi khi cần cấp cứu y tế, xe cứu thương",
    coast_guard: "Gọi khi cần cứu hộ trên biển, hải đảo",
    disaster: "Liên hệ Ban Chỉ đạo Phòng chống thiên tai",
    rescue: "Gọi khi cần đội cứu nạn chuyên nghiệp",
    military: "Liên hệ quân đội trong tình huống khẩn cấp quốc gia",
    red_cross: "Liên hệ Hội Chữ thập đỏ để được hỗ trợ nhân đạo",
    hospital: "Gọi bệnh viện gần nhất để được cấp cứu",
    electricity: "Gọi khi có sự cố điện, mất điện kéo dài",
    water: "Gọi khi có sự cố cấp nước, mất nước",
  };

  return descriptions[type] || "Liên hệ khẩn cấp";
}

// =============================================================================
// SECTION 6: CONTACT FILTERING & SORTING
// =============================================================================

/** Bộ lọc liên hệ */
export interface ContactFilter {
  types?: EmergencyContactType[];
  province?: string;
  available24_7?: boolean;
  isNational?: boolean;
  query?: string;
}

/**
 * Lọc liên hệ theo nhiều tiêu chí.
 */
export function filterContacts(
  contacts: EmergencyContact[],
  filter: ContactFilter
): EmergencyContact[] {
  let result = [...contacts];

  if (filter.types && filter.types.length > 0) {
    result = result.filter((c) => filter.types!.includes(c.type));
  }

  if (filter.province) {
    result = result.filter(
      (c) => c.province === filter.province || c.isNational
    );
  }

  if (filter.available24_7 !== undefined) {
    result = result.filter((c) => c.available24_7 === filter.available24_7);
  }

  if (filter.isNational !== undefined) {
    result = result.filter((c) => c.isNational === filter.isNational);
  }

  if (filter.query) {
    result = searchContacts(filter.query, filter.province);
  }

  return result;
}

/**
 * Sắp xếp liên hệ theo tiêu chí.
 */
export function sortContacts(
  contacts: EmergencyContact[],
  sortBy: "priority" | "name" | "type" | "availability" = "priority"
): EmergencyContact[] {
  const sorted = [...contacts];

  switch (sortBy) {
    case "priority":
      sorted.sort((a, b) => a.priority - b.priority);
      break;
    case "name":
      sorted.sort((a, b) => a.nameVi.localeCompare(b.nameVi, "vi"));
      break;
    case "type":
      sorted.sort((a, b) => a.type.localeCompare(b.type));
      break;
    case "availability":
      sorted.sort((a, b) => {
        if (a.available24_7 && !b.available24_7) return -1;
        if (!a.available24_7 && b.available24_7) return 1;
        return a.priority - b.priority;
      });
      break;
  }

  return sorted;
}

// =============================================================================
// SECTION 7: CONTACT CACHING
// =============================================================================

/**
 * Lưu danh bạ vào localStorage để dùng offline.
 */
export function cacheContacts(province: string): void {
  try {
    const directory = getProvinceDirectory(province);
    const cacheKey = `cuunet-contacts-${province}`;
    localStorage.setItem(cacheKey, JSON.stringify(directory));
  } catch (error) {
    console.error("[EmergencyDirectory] Failed to cache contacts:", error);
  }
}

/**
 * Đọc danh bạ từ cache.
 */
export function getCachedContacts(province: string): ProvinceEmergencyDirectory | null {
  try {
    const cacheKey = `cuunet-contacts-${province}`;
    const data = localStorage.getItem(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra cache có còn hợp lệ không (quá 24h = stale).
 */
export function isCacheValid(province: string): boolean {
  const cached = getCachedContacts(province);
  if (!cached) return false;

  const lastUpdated = new Date(cached.lastUpdated).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - lastUpdated < maxAge;
}

// =============================================================================
// SECTION 8: EMERGENCY DIRECTORY CLASS
// =============================================================================

/**
 * EmergencyDirectory - Class chính quản lý danh bạ khẩn cấp.
 *
 * Usage:
 *   const directory = new EmergencyDirectory();
 *   directory.setProvince("Đà Nẵng");
 *   const contacts = directory.getContacts();
 */
export class EmergencyDirectory {
  private province: string = "";
  private contacts: EmergencyContact[] = [];
  private categories: ContactCategory[] = [];
  private listeners: Set<(contacts: EmergencyContact[]) => void> = new Set();

  constructor(initialProvince?: string) {
    if (initialProvince) {
      this.setProvince(initialProvince);
    }
  }

  /** Đặt tỉnh hiện tại */
  setProvince(province: string): void {
    this.province = province;
    this.contacts = getAllContacts(province);
    this.categories = categorizeContacts(this.contacts);

    // Cache cho offline
    cacheContacts(province);

    this.notifyListeners();
  }

  /** Lấy tỉnh hiện tại */
  getProvince(): string {
    return this.province;
  }

  /** Lấy tất cả liên hệ */
  getContacts(): EmergencyContact[] {
    return [...this.contacts];
  }

  /** Lấy liên hệ quốc gia */
  getNationalContacts(): EmergencyContact[] {
    return this.contacts.filter((c) => c.isNational);
  }

  /** Lấy liên hệ địa phương */
  getLocalContacts(): EmergencyContact[] {
    return this.contacts.filter((c) => !c.isNational);
  }

  /** Lấy danh mục */
  getCategories(): ContactCategory[] {
    return [...this.categories];
  }

  /** Tìm kiếm */
  search(query: string): EmergencyContact[] {
    return searchContacts(query, this.province);
  }

  /** Lấy theo loại */
  getByType(type: EmergencyContactType): EmergencyContact[] {
    return this.contacts.filter((c) => c.type === type);
  }

  /** Lấy liên hệ 24/7 */
  get24_7Contacts(): EmergencyContact[] {
    return this.contacts.filter((c) => c.available24_7);
  }

  /** Gọi liên hệ */
  call(contact: EmergencyContact): void {
    callContact(contact.number);
  }

  /** Đăng ký listener */
  onContactsChange(listener: (contacts: EmergencyContact[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Thông báo listeners */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.contacts);
    }
  }

  /** Cleanup */
  destroy(): void {
    this.listeners.clear();
  }
}

// =============================================================================
// SECTION 9: QUICK ACCESS HELPERS
// =============================================================================

/**
 * Lấy số điện thoại SOS nhanh theo tình huống.
 */
export function getQuickSOSNumbers(situation: {
  hasFire?: boolean;
  hasMedical?: boolean;
  hasFlood?: boolean;
  hasCrime?: boolean;
}): Array<{ number: string; label: string; labelVi: string; icon: string }> {
  const numbers: Array<{ number: string; label: string; labelVi: string; icon: string }> = [];

  if (situation.hasFire) {
    numbers.push({
      number: "114",
      label: "Fire Department",
      labelVi: "Cứu hỏa - Cứu nạn",
      icon: "🚒",
    });
  }

  if (situation.hasMedical) {
    numbers.push({
      number: "115",
      label: "Ambulance",
      labelVi: "Cấp cứu y tế",
      icon: "🚑",
    });
  }

  if (situation.hasCrime) {
    numbers.push({
      number: "113",
      label: "Police",
      labelVi: "Cảnh sát",
      icon: "🚔",
    });
  }

  if (situation.hasFlood) {
    numbers.push({
      number: "114",
      label: "Rescue",
      labelVi: "Cứu nạn cứu hộ",
      icon: "🚁",
    });
  }

  // Nếu không có tình huống cụ thể, hiển thị tất cả số quốc gia
  if (numbers.length === 0) {
    numbers.push(
      { number: "113", label: "Police", labelVi: "Cảnh sát", icon: "🚔" },
      { number: "114", label: "Fire", labelVi: "Cứu hỏa", icon: "🚒" },
      { number: "115", label: "Ambulance", labelVi: "Cấp cứu", icon: "🚑" },
      { number: "116", label: "Coast Guard", labelVi: "Biên phòng", icon: "⚓" }
    );
  }

  return numbers;
}

/**
 * Format số điện thoại Việt Nam.
 */
export function formatPhoneNumber(number: string): string {
  // Loại bỏ ký tự không phải số
  const cleaned = number.replace(/\D/g, "");

  // Số ngắn (đường dây nóng)
  if (cleaned.length <= 4) return cleaned;

  // Số di động: 0xxx xxx xxx
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // Số bàn: 0xx xxxx xxx
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }

  return number;
}

/**
 * Kiểm tra số điện thoại có hợp lệ không.
 */
export function isValidPhoneNumber(number: string): boolean {
  const cleaned = number.replace(/\D/g, "");

  // Số ngắn (113, 114, 115, 116)
  if (cleaned.length === 3 && ["113", "114", "115", "116"].includes(cleaned)) {
    return true;
  }

  // Số di động Việt Nam: 0xx xxx xxx (10 chữ số)
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return true;
  }

  // Số có mã quốc gia: +84 xx xxx xxx
  if (cleaned.length === 11 && cleaned.startsWith("84")) {
    return true;
  }

  return false;
}

/**
 * Chuyển số có mã quốc gia về dạng nội địa.
 */
export function normalizePhoneNumber(number: string): string {
  const cleaned = number.replace(/\D/g, "");

  if (cleaned.startsWith("84") && cleaned.length === 11) {
    return "0" + cleaned.slice(2);
  }

  return cleaned;
}
