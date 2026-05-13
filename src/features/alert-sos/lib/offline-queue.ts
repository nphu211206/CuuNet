"use client";

// =============================================================================
// OFFLINE QUEUE - Offline-First Queue System
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Implements an offline-first architecture for SOS requests:
//   - IndexedDB for persistent storage (survives app restart)
//   - Background Sync API for automatic sync when online
//   - Exponential backoff retry logic
//   - Queue prioritization (life-threatening SOS first)
//   - Conflict resolution for stale data
//
// Design Philosophy (FEMA IPAWS-inspired):
//   - SOS requests MUST never be lost, even offline
//   - Higher priority items sync first
//   - Failed items retry up to MAX_RETRY_COUNT times
//   - User gets clear feedback on sync status
// =============================================================================

import type {
  SOSRequest,
  OfflineQueueItem,
  OfflineQueueState,
  AlertAckPayload,
  VotePayload,
  SOSStatus,
} from "./types";

import { ALERT_CONFIG, DB_CONFIG, STORAGE_KEYS } from "../config/alert-config";

// =============================================================================
// SECTION 1: IndexedDB DATABASE LAYER
// =============================================================================

/**
 * Mở hoặc tạo IndexedDB database.
 * Sử dụng singleton pattern để tránh mở nhiều kết nối.
 */
let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);

    request.onerror = () => {
      console.error("[OfflineQueue] Failed to open IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Xử lý khi database bị đóng bất ngờ
      dbInstance.onclose = () => {
        dbInstance = null;
        console.warn("[OfflineQueue] IndexedDB connection closed unexpectedly");
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Tạo object store cho SOS queue
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SOS_QUEUE)) {
        const sosStore = db.createObjectStore(DB_CONFIG.STORES.SOS_QUEUE, { keyPath: "id" });
        sosStore.createIndex("status", "status", { unique: false });
        sosStore.createIndex("priority", "priorityScore", { unique: false });
        sosStore.createIndex("createdAt", "createdAt", { unique: false });
        sosStore.createIndex("type", "type", { unique: false });
      }

      // Tạo object store cho ảnh SOS
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.PHOTOS)) {
        const photoStore = db.createObjectStore(DB_CONFIG.STORES.PHOTOS, { keyPath: "id" });
        photoStore.createIndex("sosId", "sosId", { unique: false });
      }

      // Tạo object store cho cache cảnh báo
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.ALERT_CACHE)) {
        const alertStore = db.createObjectStore(DB_CONFIG.STORES.ALERT_CACHE, { keyPath: "id" });
        alertStore.createIndex("severity", "severity", { unique: false });
        alertStore.createIndex("expires", "expires", { unique: false });
      }
    };
  });
}

/**
 * Đóng kết nối database.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Thực hiện transaction trên một object store.
 */
async function performTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Thêm mục vào object store.
 */
async function addToStore<T>(storeName: string, item: T): Promise<void> {
  await performTransaction(storeName, "readwrite", (store) => store.put(item));
}

/**
 * Lấy mục từ object store theo key.
 */
async function getFromStore<T>(storeName: string, key: string): Promise<T | undefined> {
  return performTransaction(storeName, "readonly", (store) => store.get(key));
}

/**
 * Lấy tất cả mục từ object store.
 */
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return performTransaction(storeName, "readonly", (store) => store.getAll());
}

/**
 * Xóa mục khỏi object store.
 */
async function deleteFromStore(storeName: string, key: string): Promise<void> {
  await performTransaction(storeName, "readwrite", (store) => store.delete(key));
}

/**
 * Xóa tất cả mục khỏi object store.
 */
async function clearStore(storeName: string): Promise<void> {
  await performTransaction(storeName, "readwrite", (store) => store.clear());
}

/**
 * Đếm số mục trong object store.
 */
async function countInStore(storeName: string): Promise<number> {
  return performTransaction(storeName, "readonly", (store) => store.count());
}

// =============================================================================
// SECTION 2: QUEUE ITEM MANAGEMENT
// =============================================================================

/**
 * Tạo ID duy nhất cho queue item.
 */
function generateQueueId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `q_${timestamp}_${random}`;
}

/**
 * Tạo OfflineQueueItem từ SOSRequest.
 */
export function createSOSQueueItem(sosRequest: SOSRequest): OfflineQueueItem {
  const now = new Date().toISOString();

  return {
    id: generateQueueId(),
    type: "sos",
    payload: sosRequest,
    createdAt: now,
    retryCount: 0,
    maxRetries: ALERT_CONFIG.MAX_RETRY_COUNT,
    nextRetryAt: now, // Có thể gửi ngay
    status: "pending",
  };
}

/**
 * Tạo OfflineQueueItem cho Alert Acknowledgment.
 */
export function createAckQueueItem(
  alertId: string,
  userId: string,
  ackStatus: AlertAckPayload["status"]
): OfflineQueueItem {
  const now = new Date().toISOString();

  const payload: AlertAckPayload = {
    alertId,
    userId,
    status: ackStatus,
    timestamp: now,
  };

  return {
    id: generateQueueId(),
    type: "alert_ack",
    payload,
    createdAt: now,
    retryCount: 0,
    maxRetries: 5, // Ack ít retry hơn SOS
    nextRetryAt: now,
    status: "pending",
  };
}

/**
 * Tạo OfflineQueueItem cho Vote.
 */
export function createVoteQueueItem(
  reportId: string,
  userId: string,
  voteType: "up" | "down"
): OfflineQueueItem {
  const now = new Date().toISOString();

  const payload: VotePayload = {
    reportId,
    userId,
    voteType,
    timestamp: now,
  };

  return {
    id: generateQueueId(),
    type: "vote",
    payload,
    createdAt: now,
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: now,
    status: "pending",
  };
}

/**
 * Tính thời gian retry tiếp theo với exponential backoff.
 */
function calculateNextRetryTime(retryCount: number): string {
  const delay = Math.min(
    ALERT_CONFIG.RETRY_BASE_DELAY * Math.pow(2, retryCount),
    60_000 // Max 1 phút giữa các lần retry
  );
  // Thêm jitter ±10% để tránh thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return new Date(Date.now() + delay + jitter).toISOString();
}

/**
 * Kiểm tra xem queue item có sẵn sàng để retry không.
 */
function isReadyForRetry(item: OfflineQueueItem): boolean {
  if (item.status !== "pending" && item.status !== "failed") return false;
  if (item.retryCount >= item.maxRetries) return false;

  const nextRetry = new Date(item.nextRetryAt).getTime();
  return Date.now() >= nextRetry;
}

/**
 * So sánh ưu tiên giữa hai queue item.
 * SOS life-threatening > SOS urgent > SOS need_help > alert_ack > vote.
 */
function comparePriority(a: OfflineQueueItem, b: OfflineQueueItem): number {
  // SOS có ưu tiên cao nhất
  if (a.type === "sos" && b.type !== "sos") return -1;
  if (a.type !== "sos" && b.type === "sos") return 1;

  // alert_ack > vote
  if (a.type === "alert_ack" && b.type === "vote") return -1;
  if (a.type === "vote" && b.type === "alert_ack") return 1;

  // Trong cùng type, ưu tiên theo priority score
  if (a.type === "sos" && b.type === "sos") {
    const sosA = a.payload as SOSRequest;
    const sosB = b.payload as SOSRequest;
    return sosB.priorityScore - sosA.priorityScore;
  }

  // Mặc định: FIFO
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

// =============================================================================
// SECTION 3: QUEUE OPERATIONS
// =============================================================================

/**
 * Thêm mục vào hàng đợi offline.
 * Tự động lưu vào IndexedDB + localStorage (fallback).
 */
export async function enqueue(item: OfflineQueueItem): Promise<void> {
  try {
    // Lưu vào IndexedDB
    await addToStore(DB_CONFIG.STORES.SOS_QUEUE, item);
  } catch (error) {
    console.error("[OfflineQueue] Failed to save to IndexedDB, using localStorage:", error);
    // Fallback: lưu vào localStorage
    saveToLocalStorage(item);
  }
}

/**
 * Lấy tất cả mục trong hàng đợi, sắp xếp theo ưu tiên.
 */
export async function getQueue(): Promise<OfflineQueueItem[]> {
  try {
    const items = await getAllFromStore<OfflineQueueItem>(DB_CONFIG.STORES.SOS_QUEUE);
    return items.sort(comparePriority);
  } catch (error) {
    console.error("[OfflineQueue] Failed to read from IndexedDB, using localStorage:", error);
    return getFromLocalStorage().sort(comparePriority);
  }
}

/**
 * Lấy các mục sẵn sàng để gửi.
 */
export async function getReadyItems(): Promise<OfflineQueueItem[]> {
  const items = await getQueue();
  return items.filter(isReadyForRetry);
}

/**
 * Cập nhật trạng thái mục trong hàng đợi.
 */
export async function updateQueueItem(
  id: string,
  updates: Partial<OfflineQueueItem>
): Promise<void> {
  try {
    const existing = await getFromStore<OfflineQueueItem>(DB_CONFIG.STORES.SOS_QUEUE, id);
    if (!existing) {
      console.warn(`[OfflineQueue] Item ${id} not found`);
      return;
    }

    const updated = { ...existing, ...updates, id }; // Preserve ID
    await addToStore(DB_CONFIG.STORES.SOS_QUEUE, updated);
  } catch (error) {
    console.error("[OfflineQueue] Failed to update item:", error);
  }
}

/**
 * Đánh dấu mục đã gửi thành công.
 */
export async function markAsSent(id: string): Promise<void> {
  await updateQueueItem(id, {
    status: "sent",
  });
}

/**
 * Đánh dấu mục gửi thất bại và tính thời gian retry.
 */
export async function markAsFailed(id: string, error: string): Promise<void> {
  const item = await getFromStore<OfflineQueueItem>(DB_CONFIG.STORES.SOS_QUEUE, id);
  if (!item) return;

  const newRetryCount = item.retryCount + 1;

  if (newRetryCount >= item.maxRetries) {
    // Đã hết số lần retry
    await updateQueueItem(id, {
      status: "failed",
      retryCount: newRetryCount,
      error,
    });
  } else {
    // Còn cơ hội retry
    await updateQueueItem(id, {
      status: "pending",
      retryCount: newRetryCount,
      nextRetryAt: calculateNextRetryTime(newRetryCount),
      error,
    });
  }
}

/**
 * Xóa mục khỏi hàng đợi.
 */
export async function dequeue(id: string): Promise<void> {
  try {
    await deleteFromStore(DB_CONFIG.STORES.SOS_QUEUE, id);
  } catch (error) {
    console.error("[OfflineQueue] Failed to delete item:", error);
  }
}

/**
 * Xóa tất cả mục đã gửi thành công.
 */
export async function clearSentItems(): Promise<number> {
  const items = await getQueue();
  const sentItems = items.filter((item) => item.status === "sent");

  for (const item of sentItems) {
    await dequeue(item.id);
  }

  return sentItems.length;
}

/**
 * Xóa toàn bộ hàng đợi.
 */
export async function clearQueue(): Promise<void> {
  try {
    await clearStore(DB_CONFIG.STORES.SOS_QUEUE);
  } catch (error) {
    console.error("[OfflineQueue] Failed to clear queue:", error);
  }
}

/**
 * Đếm số mục trong hàng đợi.
 */
export async function getQueueCount(): Promise<number> {
  try {
    return await countInStore(DB_CONFIG.STORES.SOS_QUEUE);
  } catch (error) {
    console.error("[OfflineQueue] Failed to count items:", error);
    return 0;
  }
}

// =============================================================================
// SECTION 4: SYNC ENGINE
// =============================================================================

/** Trạng thái đồng bộ */
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncedCount: number;
  failedCount: number;
  pendingCount: number;
  errors: string[];
}

/** Callback khi sync hoàn thành */
export type SyncCallback = (status: SyncStatus) => void;

/**
 * Mô phỏng gửi SOS request lên server.
 * Trong production, đây sẽ gọi API thực.
 */
async function simulateSendSOS(sosRequest: SOSRequest): Promise<boolean> {
  // Mô phỏng độ trễ mạng
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  // Mô phỏng tỷ lệ thành công (95% cho SOS - ưu tiên cao)
  return Math.random() < 0.95;
}

/**
 * Mô phỏng gửi Alert Ack lên server.
 */
async function simulateSendAck(payload: AlertAckPayload): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 500));
  return Math.random() < 0.98;
}

/**
 * Mô phỏng gửi Vote lên server.
 */
async function simulateSendVote(payload: VotePayload): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 300));
  return Math.random() < 0.97;
}

/**
 * Gửi một queue item lên server.
 */
async function sendQueueItem(item: OfflineQueueItem): Promise<boolean> {
  switch (item.type) {
    case "sos":
      return simulateSendSOS(item.payload as SOSRequest);
    case "alert_ack":
      return simulateSendAck(item.payload as AlertAckPayload);
    case "vote":
      return simulateSendVote(item.payload as VotePayload);
    default:
      console.error(`[OfflineQueue] Unknown item type: ${item.type}`);
      return false;
  }
}

/**
 * Đồng bộ hóa toàn bộ hàng đợi.
 * Gửi các mục theo thứ tự ưu tiên, xử lý lỗi từng mục.
 */
export async function syncQueue(
  callback?: SyncCallback
): Promise<SyncStatus> {
  const status: SyncStatus = {
    isSyncing: true,
    lastSyncAt: null,
    syncedCount: 0,
    failedCount: 0,
    pendingCount: 0,
    errors: [],
  };

  try {
    const readyItems = await getReadyItems();
    status.pendingCount = readyItems.length;

    if (readyItems.length === 0) {
      status.isSyncing = false;
      status.lastSyncAt = new Date().toISOString();
      callback?.(status);
      return status;
    }

    // Gửi lần lượt theo ưu tiên
    for (const item of readyItems) {
      try {
        // Đánh dấu đang gửi
        await updateQueueItem(item.id, { status: "sending" });
        callback?.(status);

        const success = await sendQueueItem(item);

        if (success) {
          await markAsSent(item.id);
          status.syncedCount++;
        } else {
          await markAsFailed(item.id, "Server returned failure");
          status.failedCount++;

          if (item.retryCount >= item.maxRetries - 1) {
            status.errors.push(
              `${item.type} ${item.id}: Hết số lần retry (${item.maxRetries})`
            );
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await markAsFailed(item.id, errorMsg);
        status.failedCount++;
        status.errors.push(`${item.type} ${item.id}: ${errorMsg}`);
      }

      // Cập nhật pending count
      status.pendingCount = readyItems.length - status.syncedCount - status.failedCount;
      callback?.(status);
    }

    // Xóa các mục đã gửi thành công
    await clearSentItems();

    status.isSyncing = false;
    status.lastSyncAt = new Date().toISOString();
    callback?.(status);

    return status;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    status.errors.push(`Sync failed: ${errorMsg}`);
    status.isSyncing = false;
    status.lastSyncAt = new Date().toISOString();
    callback?.(status);

    return status;
  }
}

// =============================================================================
// SECTION 5: BACKGROUND SYNC API INTEGRATION
// =============================================================================

/**
 * Đăng ký Background Sync với Service Worker.
 * Khi thiết bị online trở lại, trình duyệt sẽ tự động gọi sync.
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    console.warn("[OfflineQueue] Background Sync API not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register("cuunet-offline-sync");
    console.log("[OfflineQueue] Background sync registered");
    return true;
  } catch (error) {
    console.error("[OfflineQueue] Failed to register background sync:", error);
    return false;
  }
}

/**
 * Kiểm tra xem Background Sync có được hỗ trợ không.
 */
export function isBackgroundSyncSupported(): boolean {
  return "serviceWorker" in navigator && "SyncManager" in window;
}

/**
 * Đăng ký periodic background sync (nếu supported).
 * Tự động kiểm tra queue mỗi 15 phút.
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PeriodicSyncManager" in window)) {
    console.warn("[OfflineQueue] Periodic Background Sync not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const status = await navigator.permissions.query({
      name: "periodic-background-sync" as PermissionName,
    });

    if (status.state === "granted") {
      await (registration as any).periodicSync.register("cuunet-periodic-sync", {
        minInterval: 15 * 60 * 1000, // 15 phút
      });
      console.log("[OfflineQueue] Periodic background sync registered");
      return true;
    }

    console.warn("[OfflineQueue] Periodic background sync permission not granted");
    return false;
  } catch (error) {
    console.error("[OfflineQueue] Failed to register periodic sync:", error);
    return false;
  }
}

// =============================================================================
// SECTION 6: ONLINE/OFFLINE DETECTION
// =============================================================================

/** Callback khi trạng thái online/offline thay đổi */
export type ConnectivityCallback = (isOnline: boolean) => void;

/**
 * Thiết lập listener cho sự kiện online/offline.
 * Tự động sync queue khi online trở lại.
 */
export function setupConnectivityListeners(
  onConnectivityChange: ConnectivityCallback,
  onAutoSync?: () => Promise<void>
): () => void {
  const handleOnline = async () => {
    console.log("[OfflineQueue] Device online - starting auto sync");
    onConnectivityChange(true);

    // Tự động sync khi online
    if (onAutoSync) {
      try {
        await onAutoSync();
      } catch (error) {
        console.error("[OfflineQueue] Auto sync failed:", error);
      }
    }
  };

  const handleOffline = () => {
    console.log("[OfflineQueue] Device offline");
    onConnectivityChange(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Trả về cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Kiểm tra trạng thái kết nối hiện tại.
 */
export function isDeviceOnline(): boolean {
  return navigator.onLine;
}

/**
 * Kiểm tra kết nối thực sự bằng cách ping server.
 * navigator.onLine có thể không chính xác trong một số trường hợp.
 */
export async function checkRealConnectivity(): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    // Thử fetch một resource nhỏ
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("/api/health", {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-cache",
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// SECTION 7: QUEUE STATE MANAGEMENT
// =============================================================================

/**
 * Tính toán trạng thái tổng thể của hàng đợi.
 */
export async function calculateQueueState(): Promise<OfflineQueueState> {
  const items = await getQueue();
  const isOnline = isDeviceOnline();

  return {
    items,
    isOnline,
    isSyncing: false, // Sẽ được cập nhật bởi sync engine
    lastSyncAt: localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || undefined,
    failedCount: items.filter((i) => i.status === "failed").length,
    pendingCount: items.filter((i) => i.status === "pending").length,
  };
}

/**
 * Lấy thống kê hàng đợi.
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  sending: number;
  failed: number;
  sent: number;
  byType: Record<string, number>;
  oldestPending: string | null;
}> {
  const items = await getQueue();

  const byType: Record<string, number> = {};
  let oldestPending: string | null = null;

  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;

    if (item.status === "pending" && (!oldestPending || item.createdAt < oldestPending)) {
      oldestPending = item.createdAt;
    }
  }

  return {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    sending: items.filter((i) => i.status === "sending").length,
    failed: items.filter((i) => i.status === "failed").length,
    sent: items.filter((i) => i.status === "sent").length,
    byType,
    oldestPending,
  };
}

// =============================================================================
// SECTION 8: localStorage FALLBACK
// =============================================================================

/**
 * Lưu queue item vào localStorage (fallback khi IndexedDB không khả dụng).
 */
function saveToLocalStorage(item: OfflineQueueItem): void {
  try {
    const existing = getFromLocalStorage();
    const updated = [...existing, item];
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updated));
  } catch (error) {
    console.error("[OfflineQueue] localStorage save failed:", error);
  }
}

/**
 * Đọc queue từ localStorage.
 */
function getFromLocalStorage(): OfflineQueueItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Lưu thời gian sync cuối cùng.
 */
export function saveLastSyncTime(): void {
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

/**
 * Lấy thời gian sync cuối cùng.
 */
export function getLastSyncTime(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

// =============================================================================
// SECTION 9: OFFLINE QUEUE CLASS (Unified Interface)
// =============================================================================

/**
 * OfflineQueue - Class chính quản lý hàng đợi offline.
 * Cung cấp interface đơn giản cho các component React.
 *
 * Usage:
 *   const queue = new OfflineQueue();
 *   await queue.addSOS(sosRequest);
 *   // ... khi online
 *   const status = await queue.sync();
 */
export class OfflineQueue {
  private listeners: Set<(state: OfflineQueueState) => void> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private currentState: OfflineQueueState | null = null;

  constructor() {
    this.setupConnectivity();
    this.loadInitialState();
  }

  /** Tải trạng thái ban đầu */
  private async loadInitialState(): Promise<void> {
    this.currentState = await calculateQueueState();
    this.notifyListeners();
  }

  /** Thiết lập listener online/offline */
  private setupConnectivity(): void {
    setupConnectivityListeners(
      (isOnline) => {
        if (this.currentState) {
          this.currentState = { ...this.currentState, isOnline };
          this.notifyListeners();
        }

        // Tự động sync khi online
        if (isOnline) {
          this.sync();
        }
      },
      async () => { await this.sync(); }
    );
  }

  /** Đăng ký listener */
  onStateChange(listener: (state: OfflineQueueState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Thông báo listeners */
  private notifyListeners(): void {
    if (this.currentState) {
      for (const listener of this.listeners) {
        listener(this.currentState);
      }
    }
  }

  /** Thêm SOS request vào queue */
  async addSOS(sosRequest: SOSRequest): Promise<string> {
    const item = createSOSQueueItem(sosRequest);
    await enqueue(item);

    // Cập nhật state
    await this.refreshState();

    // Thử đăng ký background sync
    await registerBackgroundSync();

    return item.id;
  }

  /** Thêm alert ack vào queue */
  async addAlertAck(
    alertId: string,
    userId: string,
    status: AlertAckPayload["status"]
  ): Promise<string> {
    const item = createAckQueueItem(alertId, userId, status);
    await enqueue(item);
    await this.refreshState();
    return item.id;
  }

  /** Thêm vote vào queue */
  async addVote(
    reportId: string,
    userId: string,
    voteType: "up" | "down"
  ): Promise<string> {
    const item = createVoteQueueItem(reportId, userId, voteType);
    await enqueue(item);
    await this.refreshState();
    return item.id;
  }

  /** Đồng bộ hóa queue */
  async sync(): Promise<SyncStatus> {
    if (this.currentState?.isSyncing) {
      console.warn("[OfflineQueue] Sync already in progress");
      return {
        isSyncing: true,
        lastSyncAt: null,
        syncedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        errors: [],
      };
    }

    // Cập nhật syncing state
    if (this.currentState) {
      this.currentState = { ...this.currentState, isSyncing: true };
      this.notifyListeners();
    }

    const result = await syncQueue((status) => {
      if (this.currentState) {
        this.currentState = {
          ...this.currentState,
          isSyncing: status.isSyncing,
          lastSyncAt: status.lastSyncAt || undefined,
        };
        this.notifyListeners();
      }
    });

    // Lưu thời gian sync
    saveLastSyncTime();

    // Refresh state
    await this.refreshState();

    return result;
  }

  /** Xóa mục đã gửi */
  async clearSent(): Promise<number> {
    const count = await clearSentItems();
    await this.refreshState();
    return count;
  }

  /** Retry các mục thất bại */
  async retryFailed(): Promise<void> {
    const items = await getQueue();
    const failedItems = items.filter((i) => i.status === "failed");

    for (const item of failedItems) {
      await updateQueueItem(item.id, {
        status: "pending",
        retryCount: 0,
        nextRetryAt: new Date().toISOString(),
        error: undefined,
      });
    }

    await this.refreshState();

    // Nếu online, sync ngay
    if (isDeviceOnline()) {
      await this.sync();
    }
  }

  /** Xóa toàn bộ queue */
  async clearAll(): Promise<void> {
    await clearQueue();
    await this.refreshState();
  }

  /** Lấy stats */
  async getStats() {
    return getQueueStats();
  }

  /** Refresh state từ storage */
  private async refreshState(): Promise<void> {
    this.currentState = await calculateQueueState();
    this.notifyListeners();
  }

  /** Bắt đầu auto-sync */
  startAutoSync(intervalMs: number = ALERT_CONFIG.OFFLINE_SYNC_INTERVAL): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      if (isDeviceOnline() && this.currentState && this.currentState.pendingCount > 0) {
        await this.sync();
      }
    }, intervalMs);
  }

  /** Dừng auto-sync */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /** Bắt đầu cleanup định kỳ */
  startPeriodicCleanup(intervalMs: number = 60 * 60 * 1000): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(async () => {
      await this.clearSent();
    }, intervalMs);
  }

  /** Dừng cleanup định kỳ */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /** Cleanup khi unmount */
  destroy(): void {
    this.stopAutoSync();
    this.stopPeriodicCleanup();
    this.listeners.clear();
    closeDatabase();
  }
}

// =============================================================================
// SECTION 10: QUICK ACCESS FUNCTIONS
// =============================================================================

/**
 * Kiểm tra có mục đang chờ trong queue không.
 */
export async function hasPendingItems(): Promise<boolean> {
  const items = await getQueue();
  return items.some((i) => i.status === "pending" || i.status === "failed");
}

/**
 * Lấy số mục đang chờ.
 */
export async function getPendingCount(): Promise<number> {
  const items = await getQueue();
  return items.filter((i) => i.status === "pending").length;
}

/**
 * Lấy số mục thất bại.
 */
export async function getFailedCount(): Promise<number> {
  const items = await getQueue();
  return items.filter((i) => i.status === "failed").length;
}

/**
 * Kiểm tra SOS có trong queue không.
 */
export async function isSOSInQueue(sosId: string): Promise<boolean> {
  const items = await getQueue();
  return items.some(
    (i) => i.type === "sos" && (i.payload as SOSRequest).id === sosId
  );
}

/**
 * Lấy queue item theo ID.
 */
export async function getQueueItem(id: string): Promise<OfflineQueueItem | undefined> {
  return getFromStore<OfflineQueueItem>(DB_CONFIG.STORES.SOS_QUEUE, id);
}
