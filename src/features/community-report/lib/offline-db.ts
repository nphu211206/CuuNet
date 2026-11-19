/**
 * IndexedDB Store-and-Forward Queue for Crowdsourced VGI Reports
 *
 * Implements Tier 2 client-side offline persistence described in manuscript §3.6 & §5.1.
 * Reports submitted during telecom blackouts are queued locally in browser IndexedDB
 * and automatically synchronised with consensus verification upon opportunistic reconnection.
 */

import type { CommunityReport } from "./types";

const DB_NAME = "CuuNetOfflineDB";
const DB_VERSION = 1;
const STORE_NAME = "offline_reports_queue";

let dbInstance: IDBDatabase | null = null;

/**
 * Open or initialise the IndexedDB database.
 */
export async function openReportDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("syncStatus", "syncStatus", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("disasterType", "disasterType", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.warn("[IndexedDB] Failed to open offline store:", request.error);
      resolve(null);
    };
  });
}

/**
 * Enqueue a crowdsourced report into the offline IndexedDB store.
 */
export async function enqueueReportOffline(report: CommunityReport): Promise<boolean> {
  try {
    const db = await openReportDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const queueItem = {
        ...report,
        syncStatus: "pending",
        queuedAt: new Date().toISOString(),
      };
      const req = store.put(queueItem);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (error) {
    console.warn("[IndexedDB] Enqueue error:", error);
    return false;
  }
}

/**
 * Retrieve all reports currently pending synchronisation in IndexedDB.
 */
export async function getPendingReportsFromDB(): Promise<CommunityReport[]> {
  try {
    const db = await openReportDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("syncStatus");
      const req = index.getAll("pending");

      req.onsuccess = () => resolve(req.result as CommunityReport[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Mark a batch of report IDs as synchronised in IndexedDB.
 */
export async function markReportsSyncedInDB(ids: string[]): Promise<void> {
  try {
    const db = await openReportDB();
    if (!db || ids.length === 0) return;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const id of ids) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = {
            ...getReq.result,
            syncStatus: "synced",
            syncedAt: new Date().toISOString(),
            isOffline: false,
          };
          store.put(updated);
        }
      };
    }
  } catch (err) {
    console.warn("[IndexedDB] Mark synced error:", err);
  }
}

/**
 * Retrieve all reports stored in the local IndexedDB.
 */
export async function getAllStoredReports(): Promise<CommunityReport[]> {
  try {
    const db = await openReportDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result as CommunityReport[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
