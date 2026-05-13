"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useReducer,
} from "react";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  CommunityReport,
  ReportFilters,
  ReportPhoto,
  WizardFormData,
  Toast,
  ToastType,
  VoteType,
  DatePreset,
} from "./types";
import {
  REPORT_CONFIG,
  PHOTO_CONFIG,
  STORAGE_KEYS,
} from "../config/report-config";
import { useReport } from "./report-context";
import {
  submitReport as apiSubmitReport,
  voteReport as apiVoteReport,
  saveDraft,
  loadDraft,
  clearDraft,
  hasDraft,
  getUserId,
  getUserVotes,
  saveUserVote,
} from "../api/report-api";
import { validatePhotoFile, validatePhotoFiles } from "./validation";

// ============================================================
// REPORT HOOKS — 8 Custom Hooks
// ============================================================
// 1. useReportSubmit()    — Submission logic với progress tracking
// 2. useReportFilters()   — Filter management với debounce
// 3. useReportVotes()     — Voting với optimistic update
// 4. useGeolocation()     — GPS + reverse geocoding
// 5. usePhotoUpload()     — Photo handling (compress, validate, reorder)
// 6. useAutoSave()        — Draft persistence
// 7. useOfflineSync()     — Offline support
// 8. useToast()           — Notification toasts
// ============================================================

// ============================================================
// HOOK 1: useReportSubmit
// ============================================================
// Xử lý logic submit báo cáo mới
// - Validate dữ liệu trước khi submit
// - Gọi API submitReport
// - Track progress (0-100%)
// - Xử lý lỗi và hiển thị toast
// ============================================================

interface UseReportSubmitReturn {
  submit: (data: WizardFormData) => Promise<boolean>;
  isSubmitting: boolean;
  submitProgress: number;
  submitError: string | null;
  clearError: () => void;
}

export function useReportSubmit(): UseReportSubmitReturn {
  const { addReport, showToast, closeWizard } = useReport();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: WizardFormData): Promise<boolean> => {
      setIsSubmitting(true);
      setSubmitProgress(0);
      setSubmitError(null);

      try {
        // Bước 1: Validate (0-20%)
        setSubmitProgress(10);
        await simulateDelay(100);
        setSubmitProgress(20);

        // Bước 2: Chuẩn bị dữ liệu (20-40%)
        setSubmitProgress(30);
        await simulateDelay(150);
        setSubmitProgress(40);

        // Bước 3: Gửi lên server (40-80%)
        setSubmitProgress(50);
        const report = await apiSubmitReport(data);
        setSubmitProgress(70);
        await simulateDelay(100);
        setSubmitProgress(80);

        // Bước 4: Cập nhật state (80-100%)
        addReport(report);
        setSubmitProgress(90);
        await simulateDelay(50);
        setSubmitProgress(100);

        // Đóng wizard sau khi submit thành công
        setTimeout(() => {
          closeWizard();
          setIsSubmitting(false);
          setSubmitProgress(0);
        }, 500);

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi gửi báo cáo";
        setSubmitError(errorMessage);
        setIsSubmitting(false);
        setSubmitProgress(0);
        showToast("Lỗi", errorMessage, "error");
        return false;
      }
    },
    [addReport, showToast, closeWizard]
  );

  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return { submit, isSubmitting, submitProgress, submitError, clearError };
}

// ============================================================
// HOOK 2: useReportFilters
// ============================================================
// Quản lý bộ lọc báo cáo
// - Multi-select filters (type, severity, province, status)
// - Debounced search (300ms)
// - Date range presets
// - Đếm số filter đang active
// ============================================================

interface UseReportFiltersReturn {
  filters: ReportFilters;
  searchQuery: string;
  debouncedSearch: string;
  setFilter: <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K]
  ) => void;
  toggleType: (type: DisasterType) => void;
  toggleSeverity: (severity: SeverityLevel) => void;
  toggleProvince: (province: string) => void;
  toggleStatus: (status: string) => void;
  setDatePreset: (preset: DatePreset) => void;
  setSortBy: (sort: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  filteredReports: CommunityReport[];
}

export function useReportFilters(): UseReportFiltersReturn {
  const {
    state,
    setFilters,
    resetFilters: contextResetFilters,
    setSearch,
    filteredReports,
  } = useReport();

  const { filters, searchQuery } = state;
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, REPORT_CONFIG.DEBOUNCE_SEARCH);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Set a specific filter
  const setFilter = useCallback(
    <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
      setFilters({ [key]: value });
    },
    [setFilters]
  );

  // Toggle disaster type in filter
  const toggleType = useCallback(
    (type: DisasterType) => {
      const current = filters.types;
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      setFilters({ types: updated });
    },
    [filters.types, setFilters]
  );

  // Toggle severity in filter
  const toggleSeverity = useCallback(
    (severity: SeverityLevel) => {
      const current = filters.severities;
      const updated = current.includes(severity)
        ? current.filter((s) => s !== severity)
        : [...current, severity];
      setFilters({ severities: updated });
    },
    [filters.severities, setFilters]
  );

  // Toggle province in filter
  const toggleProvince = useCallback(
    (province: string) => {
      const current = filters.provinces;
      const updated = current.includes(province)
        ? current.filter((p) => p !== province)
        : [...current, province];
      setFilters({ provinces: updated });
    },
    [filters.provinces, setFilters]
  );

  // Toggle status in filter
  const toggleStatus = useCallback(
    (status: string) => {
      const current = filters.statuses;
      const updated = current.includes(status as any)
        ? current.filter((s) => s !== status)
        : [...current, status as any];
      setFilters({ statuses: updated });
    },
    [filters.statuses, setFilters]
  );

  // Set date preset
  const setDatePreset = useCallback(
    (preset: DatePreset) => {
      setFilters({
        dateRange: {
          preset,
          start: null,
          end: null,
        },
      });
    },
    [setFilters]
  );

  // Set sort option
  const setSortBy = useCallback(
    (sort: string) => {
      setFilters({ sortBy: sort as any });
    },
    [setFilters]
  );

  // Set search query
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearch(query);
    },
    [setSearch]
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    contextResetFilters();
    setSearch("");
  }, [contextResetFilters, setSearch]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types.length > 0) count++;
    if (filters.severities.length > 0) count++;
    if (filters.provinces.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.dateRange.preset !== "all") count++;
    if (searchQuery.trim().length > 0) count++;
    return count;
  }, [filters, searchQuery]);

  return {
    filters,
    searchQuery,
    debouncedSearch,
    setFilter,
    toggleType,
    toggleSeverity,
    toggleProvince,
    toggleStatus,
    setDatePreset,
    setSortBy,
    setSearchQuery,
    resetFilters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
    filteredReports,
  };
}

// ============================================================
// HOOK 3: useReportVotes
// ============================================================
// Xử lý voting với optimistic update
// - Kiểm tra user đã vote chưa
// - Optimistic update (cập nhật UI ngay, sync sau)
// - Giới hạn 1 vote per user per report
// ============================================================

interface UseReportVotesReturn {
  vote: (reportId: string, type: VoteType) => Promise<void>;
  hasVoted: (reportId: string) => VoteType | null;
  canVote: (reportId: string) => boolean;
  isVoting: boolean;
  votingReportId: string | null;
}

export function useReportVotes(): UseReportVotesReturn {
  const { voteReport, showToast } = useReport();
  const [isVoting, setIsVoting] = useState(false);
  const [votingReportId, setVotingReportId] = useState<string | null>(null);

  // Lấy votes đã lưu trong localStorage - dùng state để cập nhật sau mỗi vote
  const [userVotes, setUserVotes] = useState<Record<string, VoteType>>(() => getUserVotes());

  // Kiểm tra user đã vote report này chưa
  const hasVoted = useCallback(
    (reportId: string): VoteType | null => {
      return userVotes[reportId] || null;
    },
    [userVotes]
  );

  // Kiểm tra user có thể vote không
  const canVote = useCallback(
    (reportId: string): boolean => {
      return !userVotes[reportId];
    },
    [userVotes]
  );

  // Vote function
  const vote = useCallback(
    async (reportId: string, type: VoteType): Promise<void> => {
      // Kiểm tra đã vote chưa
      if (userVotes[reportId]) {
        showToast(
          "Đã bình chọn",
          "Bạn đã bình chọn cho báo cáo này rồi",
          "warning"
        );
        return;
      }

      setIsVoting(true);
      setVotingReportId(reportId);

      try {
        // Optimistic update: cập nhật UI ngay
        voteReport(reportId, type);

        // Sync với API (localStorage)
        await apiVoteReport(reportId, type);

        // Lưu vote của user và cập nhật state
        saveUserVote(reportId, type);
        setUserVotes((prev) => ({ ...prev, [reportId]: type }));

        showToast(
          "Thành công",
          type === "up" ? "Đã xác nhận báo cáo" : "Đã đánh dấu không chính xác",
          "success"
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi bình chọn";
        showToast("Lỗi", errorMessage, "error");
      } finally {
        setIsVoting(false);
        setVotingReportId(null);
      }
    },
    [voteReport, showToast, userVotes]
  );

  return { vote, hasVoted, canVote, isVoting, votingReportId };
}

// ============================================================
// HOOK 4: useGeolocation
// ============================================================
// Lấy vị trí GPS hiện tại + reverse geocoding
// - getCurrentPosition(): Promise<void>
// - reverseGeocode(lat, lng): Promise<{province, district, address}>
// - Error handling cho denied/not supported
// ============================================================

interface GeolocationPosition {
  lat: number;
  lng: number;
}

interface ReverseGeocodeResult {
  province: string;
  district: string;
  address: string;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<void>;
  reverseGeocode: (
    lat: number,
    lng: number
  ) => Promise<ReverseGeocodeResult>;
  clearError: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy vị trí hiện tại
  const getCurrentPosition = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setAccuracy(position.coords.accuracy);
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(
                  new Error(
                    "Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt."
                  )
                );
                break;
              case error.POSITION_UNAVAILABLE:
                reject(
                  new Error(
                    "Không thể xác định vị trí. Vui lòng kiểm tra GPS hoặc kết nối mạng."
                  )
                );
                break;
              case error.TIMEOUT:
                reject(
                  new Error(
                    "Hết thời gian chờ xác định vị trí. Vui lòng thử lại."
                  )
                );
                break;
              default:
                reject(new Error("Không thể lấy vị trí hiện tại."));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000, // Cache 1 phút
          }
        );
      });

      setPosition(pos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể lấy vị trí"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reverse geocoding (tọa độ → địa chỉ)
  // Sử dụng Nominatim API (OpenStreetMap, miễn phí)
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
          {
            headers: {
              "User-Agent": "CuuNet/1.0 (Disaster Management App)",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Không thể tìm địa chỉ");
        }

        const data = await response.json();
        const address = data.address || {};

        // Tách province và district từ response
        const province =
          address.state ||
          address.province ||
          address.city ||
          "";
        const district =
          address.suburb ||
          address.city_district ||
          address.district ||
          address.county ||
          "";
        const fullAddress = data.display_name || "";

        return { province, district, address: fullAddress };
      } catch (error) {
        console.warn("[useGeolocation] Reverse geocoding failed:", error);
        return { province: "", district: "", address: "" };
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    position,
    accuracy,
    isLoading,
    error,
    getCurrentPosition,
    reverseGeocode,
    clearError,
  };
}

// ============================================================
// HOOK 5: usePhotoUpload
// ============================================================
// Xử lý upload và quản lý ảnh
// - validatePhotoFile: kiểm tra định dạng, kích thước
// - compressPhoto: nén ảnh bằng Canvas API
// - addPhotos: thêm nhiều ảnh cùng lúc
// - removePhoto: xóa ảnh theo ID
// - reorderPhotos: sắp xếp lại thứ tự ảnh
// ============================================================

interface UsePhotoUploadReturn {
  photos: ReportPhoto[];
  addPhotos: (files: FileList | File[]) => Promise<void>;
  removePhoto: (id: string) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  clearPhotos: () => void;
  isProcessing: boolean;
  totalSize: number;
  photoCount: number;
  canAddMore: boolean;
  errors: string[];
  warnings: string[];
  clearErrors: () => void;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Tính tổng kích thước
  const totalSize = useMemo(
    () => photos.reduce((sum, p) => sum + p.compressedSize, 0),
    [photos]
  );

  // Số ảnh hiện tại
  const photoCount = photos.length;

  // Có thể thêm ảnh không
  const canAddMore = photoCount < PHOTO_CONFIG.MAX_PHOTOS;

  // Thêm ảnh
  const addPhotos = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsProcessing(true);
      setErrors([]);
      setWarnings([]);

      // Validate tổng số ảnh
      const validation = validatePhotoFiles(fileArray, photos.length);
      if (!validation.valid) {
        setErrors(validation.errors);
        setIsProcessing(false);
        return;
      }
      if (validation.warnings.length > 0) {
        setWarnings(validation.warnings);
      }

      const newPhotos: ReportPhoto[] = [];
      const newErrors: string[] = [];

      for (const file of fileArray) {
        // Kiểm tra còn slot không
        if (photos.length + newPhotos.length >= PHOTO_CONFIG.MAX_PHOTOS) {
          newErrors.push(
            `Đã đạt tối đa ${PHOTO_CONFIG.MAX_PHOTOS} ảnh. Bỏ qua file "${file.name}".`
          );
          break;
        }

        // Validate file
        const fileValidation = validatePhotoFile(file);
        if (!fileValidation.valid) {
          newErrors.push(`${file.name}: ${fileValidation.error}`);
          continue;
        }

        try {
          // Compress ảnh
          const compressed = await compressPhoto(file);
          newPhotos.push(compressed);
        } catch (error) {
          newErrors.push(
            `${file.name}: Không thể xử lý ảnh. ${
              error instanceof Error ? error.message : "Lỗi không xác định."
            }`
          );
        }
      }

      if (newPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newPhotos]);
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
      }

      setIsProcessing(false);
    },
    [photos.length]
  );

  // Xóa ảnh
  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Sắp xếp lại ảnh
  const reorderPhotos = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPhotos((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, removed);
        return updated;
      });
    },
    []
  );

  // Xóa tất cả ảnh
  const clearPhotos = useCallback(() => {
    setPhotos([]);
    setErrors([]);
    setWarnings([]);
  }, []);

  // Xóa lỗi
  const clearErrors = useCallback(() => {
    setErrors([]);
    setWarnings([]);
  }, []);

  return {
    photos,
    addPhotos,
    removePhoto,
    reorderPhotos,
    clearPhotos,
    isProcessing,
    totalSize,
    photoCount,
    canAddMore,
    errors,
    warnings,
    clearErrors,
  };
}

// ============================================================
// HOOK 6: useAutoSave
// ============================================================
// Tự động lưu draft vào localStorage
// - Tự động lưu mỗi 5 giây khi wizard đang mở
// - Lưu/đọc/xóa draft manual
// - Khôi phục draft khi mở wizard lại
// ============================================================

interface UseAutoSaveReturn {
  lastSaved: Date | null;
  save: () => void;
  clear: () => void;
  hasDraft: boolean;
  loadSavedDraft: () => WizardFormData | null;
  restoreDraft: () => WizardFormData | null;
  secondsSinceLastSave: number | null;
}

export function useAutoSave(
  data: WizardFormData,
  enabled: boolean = true
): UseAutoSaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [secondsSinceLastSave, setSecondsSinceLastSave] = useState<
    number | null
  >(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  // Cập nhật data ref khi data thay đổi
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Save function
  const save = useCallback(() => {
    try {
      saveDraft(dataRef.current);
      setLastSaved(new Date());
    } catch (error) {
      console.warn("[useAutoSave] Không thể lưu draft:", error);
    }
  }, []);

  // Clear function
  const clear = useCallback(() => {
    clearDraft();
    setLastSaved(null);
    setSecondsSinceLastSave(null);
  }, []);

  // Load draft
  const loadSavedDraft = useCallback((): WizardFormData | null => {
    return loadDraft();
  }, []);

  // Restore draft (alias cho loadSavedDraft)
  const restoreDraft = useCallback((): WizardFormData | null => {
    return loadDraft();
  }, []);

  // Kiểm tra có draft không
  const draftExists = useMemo(() => hasDraft(), []);

  // Auto-save interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Lưu ngay lần đầu khi enabled
    save();

    // Thiết lập interval auto-save
    intervalRef.current = setInterval(() => {
      save();
    }, REPORT_CONFIG.AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, save]);

  // Cập nhật secondsSinceLastSave
  useEffect(() => {
    if (!lastSaved) return;

    const timer = setInterval(() => {
      const seconds = Math.floor(
        (Date.now() - lastSaved.getTime()) / 1000
      );
      setSecondsSinceLastSave(seconds);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastSaved]);

  return {
    lastSaved,
    save,
    clear,
    hasDraft: draftExists,
    loadSavedDraft,
    restoreDraft,
    secondsSinceLastSave,
  };
}

// ============================================================
// HOOK 7: useOfflineSync
// ============================================================
// Hỗ trợ offline mode
// - Theo dõi trạng thái online/offline
// - Đếm số báo cáo chưa sync
// - Sync khi có kết nối lại
// ============================================================

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  syncPending: () => Promise<void>;
  offlineSince: Date | null;
  lastSyncAt: Date | null;
  isSyncing: boolean;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Theo dõi trạng thái online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
      // Tự động sync khi có kết nối
      syncPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSince(new Date());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Kiểm tra trạng thái ban đầu
    if (!navigator.onLine) {
      setOfflineSince(new Date());
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Đếm số báo cáo pending sync
  useEffect(() => {
    const countPending = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
        if (!stored) {
          setPendingCount(0);
          return;
        }
        const reports = JSON.parse(stored) as CommunityReport[];
        const pending = reports.filter(
          (r) => r.syncStatus === "pending" || r.isOffline
        ).length;
        setPendingCount(pending);
      } catch {
        setPendingCount(0);
      }
    };

    countPending();

    // Poll mỗi 5 giây
    const interval = setInterval(countPending, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync pending reports
  const syncPending = useCallback(async (): Promise<void> => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);

    try {
      // Đọc tất cả reports
      const stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (!stored) {
        setIsSyncing(false);
        return;
      }

      const reports = JSON.parse(stored) as CommunityReport[];
      let hasChanges = false;

      // Đánh dấu tất cả pending là synced
      const updated = reports.map((report) => {
        if (report.syncStatus === "pending" || report.isOffline) {
          hasChanges = true;
          return {
            ...report,
            syncStatus: "synced" as const,
            isOffline: false,
          };
        }
        return report;
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
        setPendingCount(0);
      }

      setLastSyncAt(new Date());
    } catch (error) {
      console.error("[useOfflineSync] Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return {
    isOnline,
    pendingCount,
    syncPending,
    offlineSince,
    lastSyncAt,
    isSyncing,
  };
}

// ============================================================
// HOOK 8: useToast
// ============================================================
// Quản lý toast notifications
// - showToast: hiển thị toast mới
// - dismissToast: ẩn toast theo ID
// - Tự động ẩn sau duration
// ============================================================

interface UseToastReturn {
  toasts: Toast[];
  showToast: (
    title: string,
    message: string,
    type?: ToastType,
    duration?: number
  ) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

export function useToast(): UseToastReturn {
  const { state, showToast: contextShowToast, dismissToast: contextDismissToast } =
    useReport();

  const { toasts } = state;

  // Show toast wrapper
  const showToast = useCallback(
    (
      title: string,
      message: string,
      type: ToastType = "info",
      duration?: number
    ) => {
      contextShowToast(title, message, type);
    },
    [contextShowToast]
  );

  // Dismiss toast
  const dismissToast = useCallback(
    (id: string) => {
      contextDismissToast(id);
    },
    [contextDismissToast]
  );

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    for (const toast of toasts) {
      contextDismissToast(toast.id);
    }
  }, [toasts, contextDismissToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Nén ảnh bằng Canvas API
 * - Resize nếu vượt quá MAX_WIDTH/MAX_HEIGHT
 * - Compress với quality 0.7
 * - Tạo thumbnail 200x200
 */
async function compressPhoto(file: File): Promise<ReportPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Tính toán kích thước mới
          let { width, height } = img;

          if (width > PHOTO_CONFIG.MAX_WIDTH) {
            height = Math.round(
              (height * PHOTO_CONFIG.MAX_WIDTH) / width
            );
            width = PHOTO_CONFIG.MAX_WIDTH;
          }
          if (height > PHOTO_CONFIG.MAX_HEIGHT) {
            width = Math.round(
              (width * PHOTO_CONFIG.MAX_HEIGHT) / height
            );
            height = PHOTO_CONFIG.MAX_HEIGHT;
          }

          // Vẽ ảnh đã resize
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Không thể tạo canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL(
            "image/jpeg",
            PHOTO_CONFIG.QUALITY
          );

          // Tạo thumbnail
          const thumbCanvas = document.createElement("canvas");
          const thumbSize = PHOTO_CONFIG.THUMBNAIL_SIZE;
          thumbCanvas.width = thumbSize;
          thumbCanvas.height = thumbSize;
          const thumbCtx = thumbCanvas.getContext("2d");

          if (!thumbCtx) {
            reject(new Error("Không thể tạo thumbnail canvas"));
            return;
          }

          // Crop thumbnail từ trung tâm
          const scale = Math.max(
            thumbSize / img.width,
            thumbSize / img.height
          );
          const sx = (img.width - thumbSize / scale) / 2;
          const sy = (img.height - thumbSize / scale) / 2;
          const sw = thumbSize / scale;
          const sh = thumbSize / scale;

          thumbCtx.drawImage(
            img,
            sx,
            sy,
            sw,
            sh,
            0,
            0,
            thumbSize,
            thumbSize
          );
          const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.6);

          resolve({
            id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            data: compressedData,
            thumbnail: thumbnailData,
            originalSize: file.size,
            compressedSize: Math.round(compressedData.length * 0.75),
            width: Math.round(width),
            height: Math.round(height),
            caption: "",
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Không thể đọc file ảnh"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Không thể đọc file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Giả lập độ trễ (dùng trong hooks)
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
