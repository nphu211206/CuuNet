import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  WizardFormData,
  WizardStep,
  CommunityReport,
  ReportPhoto,
} from "./types";

// ============================================================
// VALIDATION RESULT INTERFACE
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}
import {
  REPORT_CONFIG,
  PHOTO_CONFIG,
  VERIFICATION_CONFIG,
  VIETNAM_BOUNDS,
} from "../config/report-config";

// ============================================================
// VALIDATION ENGINE — Community Report Module
// ============================================================
// Comprehensive per-step wizard validation + full report validation
// + XSS sanitization + photo validation
// All error messages in Vietnamese for end-user clarity
// ============================================================

// === VALIDATION RESULT HELPERS ===

/**
 * Tạo ValidationResult hợp lệ (không lỗi)
 */
function validResult(): ValidationResult {
  return { isValid: true, errors: {}, warnings: {} };
}

/**
 * Tạo ValidationResult không hợp lệ với errors
 */
function invalidResult(errors: Record<string, string>): ValidationResult {
  return { isValid: false, errors, warnings: {} };
}

/**
 * Merge nhiều ValidationResult thành một
 */
function mergeResults(...results: ValidationResult[]): ValidationResult {
  const merged: ValidationResult = {
    isValid: true,
    errors: {},
    warnings: {},
  };

  for (const result of results) {
    if (!result.isValid) {
      merged.isValid = false;
    }
    Object.assign(merged.errors, result.errors);
    Object.assign(merged.warnings, result.warnings);
  }

  return merged;
}

// ============================================================
// STEP 1: DISASTER TYPE VALIDATION
// ============================================================
// Kiểm tra người dùng đã chọn loại thiên tai chưa
// DisasterType = "flood" | "storm" | "landslide" | "drought" | "earthquake" | "tsunami"
// ============================================================

const VALID_DISASTER_TYPES: DisasterType[] = [
  "flood",
  "storm",
  "landslide",
  "drought",
  "earthquake",
  "tsunami",
];

export function validateStep1(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Kiểm tra đã chọn loại thiên tai
  if (!data.type) {
    errors.type = "Vui lòng chọn loại thiên tai";
    return invalidResult(errors);
  }

  // Kiểm tra loại thiên tai hợp lệ
  if (!VALID_DISASTER_TYPES.includes(data.type)) {
    errors.type = "Loại thiên tai không hợp lệ. Vui lòng chọn lại.";
    return invalidResult(errors);
  }

  // Cảnh báo nếu chọn template (không phải lỗi)
  if (data.templateId) {
    warnings.template = "Bạn đang sử dụng mẫu báo cáo nhanh. Thông tin đã được điền sẵn, bạn có thể chỉnh sửa ở các bước sau.";
  }

  return { isValid: true, errors, warnings };
}

// ============================================================
// STEP 2: LOCATION VALIDATION
// ============================================================
// Kiểm tra tọa độ GPS, tỉnh/thành phố, quận/huyện, địa chỉ
// Validate tọa độ nằm trong lãnh thổ Việt Nam
// ============================================================

export function validateStep2(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  const { location } = data;

  // Kiểm tra tọa độ GPS
  if (!location.lat || !location.lng) {
    errors.location = "Vui lòng chọn vị trí trên bản đồ hoặc sử dụng GPS";
  } else {
    // Kiểm tra tọa độ có phải số hợp lệ
    if (typeof location.lat !== "number" || isNaN(location.lat)) {
      errors.location = "Tọa độ vĩ độ không hợp lệ";
    }
    if (typeof location.lng !== "number" || isNaN(location.lng)) {
      errors.location = "Tọa độ kinh độ không hợp lệ";
    }

    // Kiểm tra tọa độ nằm trong lãnh thổ Việt Nam
    if (location.lat < VIETNAM_BOUNDS.lat.min || location.lat > VIETNAM_BOUNDS.lat.max) {
      errors.location = `Vĩ độ phải từ ${VIETNAM_BOUNDS.lat.min}°N đến ${VIETNAM_BOUNDS.lat.max}°N (lãnh thổ Việt Nam)`;
    }
    if (location.lng < VIETNAM_BOUNDS.lng.min || location.lng > VIETNAM_BOUNDS.lng.max) {
      errors.location = `Kinh độ phải từ ${VIETNAM_BOUNDS.lng.min}°E đến ${VIETNAM_BOUNDS.lng.max}°E (lãnh thổ Việt Nam)`;
    }

    // Cảnh báo nếu vị trí gần biên giới
    if (
      location.lat < VIETNAM_BOUNDS.lat.min + 1 ||
      location.lat > VIETNAM_BOUNDS.lat.max - 1
    ) {
      warnings.location = "Vị trí gần biên giới lãnh thổ, vui lòng xác nhận lại";
    }
    if (
      location.lng < VIETNAM_BOUNDS.lng.min + 1 ||
      location.lng > VIETNAM_BOUNDS.lng.max - 1
    ) {
      warnings.location = "Vị trí gần biên giới lãnh thổ, vui lòng xác nhận lại";
    }
  }

  // Kiểm tra tỉnh/thành phố
  if (!location.province || location.province.trim().length === 0) {
    errors.province = "Vui lòng chọn tỉnh/thành phố";
  } else if (location.province.trim().length < 2) {
    errors.province = "Tên tỉnh/thành phố không hợp lệ";
  }

  // Kiểm tra quận/huyện
  if (!location.district || location.district.trim().length === 0) {
    errors.district = "Vui lòng chọn quận/huyện";
  } else if (location.district.trim().length < 2) {
    errors.district = "Tên quận/huyện không hợp lệ";
  }

  // Kiểm tra địa chỉ chi tiết
  if (!location.address || location.address.trim().length === 0) {
    errors.address = "Vui lòng nhập địa chỉ chi tiết";
  } else if (location.address.trim().length < 5) {
    errors.address = "Địa chỉ quá ngắn, tối thiểu 5 ký tự";
  } else if (location.address.trim().length > 500) {
    errors.address = "Địa chỉ quá dài, tối đa 500 ký tự";
  }

  // Cảnh báo nếu dùng GPS nhưng không có địa chỉ
  if (location.useGPS && (!location.address || location.address.trim().length < 10)) {
    warnings.address = "Bạn đang dùng GPS. Hãy bổ sung địa chỉ chi tiết để dễ xác minh.";
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// ============================================================
// STEP 3: DETAILS VALIDATION
// ============================================================
// Kiểm tra tiêu đề, mô tả, mức độ nghiêm trọng
// Title: 10-100 ký tự, Description: 50-2000 ký tự
// ============================================================

export function validateStep3(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // --- Tiêu đề ---
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Vui lòng nhập tiêu đề báo cáo";
  } else {
    const titleLen = data.title.trim().length;

    if (titleLen < REPORT_CONFIG.MIN_TITLE_LENGTH) {
      errors.title = `Tiêu đề quá ngắn, tối thiểu ${REPORT_CONFIG.MIN_TITLE_LENGTH} ký tự (hiện tại: ${titleLen})`;
    } else if (titleLen > REPORT_CONFIG.MAX_TITLE_LENGTH) {
      errors.title = `Tiêu đề quá dài, tối đa ${REPORT_CONFIG.MAX_TITLE_LENGTH} ký tự (hiện tại: ${titleLen})`;
    }

    // Cảnh báo nếu tiêu đề quá ngắn (nhưng hợp lệ)
    if (titleLen >= REPORT_CONFIG.MIN_TITLE_LENGTH && titleLen < 20) {
      warnings.title = "Tiêu đề chi tiết hơn sẽ giúp người khác hiểu rõ tình hình";
    }

    // Kiểm tra tiêu đề có chứa thông tin có ý nghĩa
    if (titleLen > 0 && /^[^a-zA-ZÀ-ỹa-zA-Z0-9]/.test(data.title.trim())) {
      warnings.title = "Tiêu đề nên bắt đầu bằng chữ hoặc số";
    }

    // Kiểm tra tiêu đề có toàn chữ hoa
    if (data.title === data.title.toUpperCase() && titleLen > 5) {
      warnings.title = "Tiêu đề không nên viết toàn chữ hoa";
    }
  }

  // --- Mô tả ---
  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Vui lòng nhập mô tả chi tiết";
  } else {
    const descLen = data.description.trim().length;

    if (descLen < REPORT_CONFIG.MIN_DESCRIPTION_LENGTH) {
      errors.description = `Mô tả quá ngắn, tối thiểu ${REPORT_CONFIG.MIN_DESCRIPTION_LENGTH} ký tự (hiện tại: ${descLen})`;
    } else if (descLen > REPORT_CONFIG.MAX_DESCRIPTION_LENGTH) {
      errors.description = `Mô tả quá dài, tối đa ${REPORT_CONFIG.MAX_DESCRIPTION_LENGTH} ký tự (hiện tại: ${descLen})`;
    }

    // Cảnh báo nếu mô tả ngắn (nhưng hợp lệ)
    if (descLen >= REPORT_CONFIG.MIN_DESCRIPTION_LENGTH && descLen < 100) {
      warnings.description = "Mô tả chi tiết hơn sẽ giúp cộng đồng xác minh nhanh hơn";
    }

    // Cảnh báo nếu mô tả quá dài
    if (descLen > 1500) {
      warnings.description = "Mô tả rất dài. Hãy đảm bảo nội dung liên quan đến thiên tai.";
    }

    // Kiểm tra mô tả có chứa ký tự lặp lại quá nhiều
    const repeatedChars = /(.)\1{9,}/g;
    if (repeatedChars.test(data.description)) {
      warnings.description = "Mô tả có vẻ chứa ký tự lặp lại quá nhiều";
    }

    // Kiểm tra mô tả có nội dung spam
    const spamPatterns = [
      /(http[s]?:\/\/[^\s]+){3,}/gi, // Quá nhiều URL
      /[!@#$%^&*()]{5,}/g,           // Quá nhiều ký tự đặc biệt
    ];
    for (const pattern of spamPatterns) {
      if (pattern.test(data.description)) {
        warnings.description = "Mô tả có vẻ chứa nội dung không liên quan";
        break;
      }
    }
  }

  // --- Mức độ nghiêm trọng ---
  const VALID_SEVERITIES: SeverityLevel[] = ["critical", "high", "medium", "low"];
  if (!data.severity) {
    errors.severity = "Vui lòng chọn mức độ nghiêm trọng";
  } else if (!VALID_SEVERITIES.includes(data.severity)) {
    errors.severity = "Mức độ nghiêm trọng không hợp lệ";
  }

  // Cảnh báo nếu chọn mức critical nhưng mô tả ngắn
  if (data.severity === "critical" && data.description && data.description.trim().length < 100) {
    warnings.severity = "Mức 'Nghiêm trọng' cần mô tả chi tiết hơn để cộng đồng hiểu rõ tình hình";
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// ============================================================
// STEP 4: PHOTOS VALIDATION
// ============================================================
// Kiểm tra số lượng ảnh, kích thước file, định dạng
// Photos là optional nhưng recommended
// ============================================================

export function validateStep4(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  const { photos } = data;

  // Cảnh báo nếu không có ảnh (không phải lỗi)
  if (photos.length === 0) {
    warnings.photos = "Thêm ảnh sẽ tăng độ tin cậy của báo cáo. Ảnh giúp cộng đồng xác minh nhanh hơn.";
  }

  // Kiểm tra số lượng ảnh tối đa
  if (photos.length > PHOTO_CONFIG.MAX_PHOTOS) {
    errors.photos = `Tối đa ${PHOTO_CONFIG.MAX_PHOTOS} ảnh. Bạn đã chọn ${photos.length} ảnh.`;
  }

  // Kiểm tra từng ảnh
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const photoResult = validateSinglePhoto(photo, i);
    if (!photoResult.isValid) {
      Object.assign(errors, photoResult.errors);
    }
    Object.assign(warnings, photoResult.warnings);
  }

  // Cảnh báo nếu có quá nhiều ảnh lớn
  const largePhotos = photos.filter(
    (p) => p.originalSize > PHOTO_CONFIG.MAX_FILE_SIZE * 0.8
  );
  if (largePhotos.length > 2) {
    warnings.photos = "Nhiều ảnh có kích thước lớn. Ảnh đã được tự động nén để tối ưu.";
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

/**
 * Kiểm tra một ảnh đơn lẻ
 */
function validateSinglePhoto(
  photo: ReportPhoto,
  index: number
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const photoLabel = `Ảnh ${index + 1}`;

  // Kiểm tra ID
  if (!photo.id || photo.id.trim().length === 0) {
    errors[`photo_${index}_id`] = `${photoLabel}: ID ảnh không hợp lệ`;
  }

  // Kiểm tra dữ liệu ảnh (base64)
  if (!photo.data || photo.data.trim().length === 0) {
    errors[`photo_${index}_data`] = `${photoLabel}: Dữ liệu ảnh trống`;
  } else {
    // Kiểm tra định dạng base64
    if (!photo.data.startsWith("data:image/")) {
      errors[`photo_${index}_data`] = `${photoLabel}: Định dạng ảnh không hợp lệ`;
    }
  }

  // Kiểm tra thumbnail
  if (!photo.thumbnail || photo.thumbnail.trim().length === 0) {
    warnings[`photo_${index}_thumb`] = `${photoLabel}: Thiếu ảnh thumbnail`;
  }

  // Kiểm tra kích thước
  if (photo.originalSize <= 0) {
    errors[`photo_${index}_size`] = `${photoLabel}: Kích thước file không hợp lệ`;
  }
  if (photo.originalSize > PHOTO_CONFIG.MAX_FILE_SIZE) {
    errors[`photo_${index}_size`] = `${photoLabel}: Kích thước vượt quá ${formatFileSize(PHOTO_CONFIG.MAX_FILE_SIZE)}`;
  }

  // Kiểm tra kích thước ảnh (width/height)
  if (photo.width <= 0 || photo.height <= 0) {
    errors[`photo_${index}_dim`] = `${photoLabel}: Kích thước ảnh không hợp lệ`;
  }

  // Cảnh báo ảnh quá nhỏ
  if (photo.width < 100 || photo.height < 100) {
    warnings[`photo_${index}_dim`] = `${photoLabel}: Ảnh quá nhỏ, có thể không rõ ràng`;
  }

  // Cảnh báo ảnh quá lớn (trước khi nén)
  if (photo.width > 4000 || photo.height > 4000) {
    warnings[`photo_${index}_dim`] = `${photoLabel}: Ảnh rất lớn, đã được tự động nén`;
  }

  // Kiểm tra caption (optional nhưng recommended)
  if (!photo.caption || photo.caption.trim().length === 0) {
    warnings[`photo_${index}_caption`] = `${photoLabel}: Nên thêm mô tả ngắn cho ảnh`;
  } else if (photo.caption.trim().length > 200) {
    errors[`photo_${index}_caption`] = `${photoLabel}: Mô tả ảnh tối đa 200 ký tự`;
  }

  // Kiểm tra thời gian upload
  if (!photo.uploadedAt) {
    warnings[`photo_${index}_time`] = `${photoLabel}: Thiếu thời gian upload`;
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

/**
 * Kiểm tra file ảnh trước khi upload (dùng trong usePhotoUpload hook)
 */
export function validatePhotoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Kiểm tra định dạng file
  const allowedTypes = [...PHOTO_CONFIG.ALLOWED_TYPES];
  if (!allowedTypes.includes(file.type as (typeof PHOTO_CONFIG.ALLOWED_TYPES)[number])) {
    return {
      valid: false,
      error: `Định dạng không hỗ trợ. Chỉ chấp nhận: ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`,
    };
  }

  // Kiểm tra kích thước file
  if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Kích thước file vượt quá ${formatFileSize(PHOTO_CONFIG.MAX_FILE_SIZE)}. File hiện tại: ${formatFileSize(file.size)}`,
    };
  }

  // Kiểm tra file rỗng
  if (file.size === 0) {
    return {
      valid: false,
      error: "File ảnh rỗng",
    };
  }

  // Kiểm tra tên file
  if (!file.name || file.name.trim().length === 0) {
    return {
      valid: false,
      error: "Tên file không hợp lệ",
    };
  }

  return { valid: true };
}

/**
 * Kiểm tra nhiều file ảnh cùng lúc
 */
export function validatePhotoFiles(
  files: FileList | File[],
  existingCount: number = 0
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileArray = Array.from(files);

  // Kiểm tra tổng số ảnh
  const totalAfterAdd = existingCount + fileArray.length;
  if (totalAfterAdd > PHOTO_CONFIG.MAX_PHOTOS) {
    errors.push(
      `Tối đa ${PHOTO_CONFIG.MAX_PHOTOS} ảnh. Hiện tại: ${existingCount}, chọn thêm: ${fileArray.length}`
    );
  }

  // Kiểm tra từng file
  for (let i = 0; i < fileArray.length; i++) {
    const result = validatePhotoFile(fileArray[i]);
    if (!result.valid && result.error) {
      errors.push(`File "${fileArray[i].name}": ${result.error}`);
    }
  }

  // Cảnh báo nếu tổng kích thước quá lớn
  const totalSize = fileArray.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > 10 * 1024 * 1024) {
    warnings.push(
      `Tổng kích thước ${formatFileSize(totalSize)}. Quá trình upload có thể mất thời gian.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================
// STEP 5: CONTACT VALIDATION
// ============================================================
// Kiểm tra thông tin người báo cáo
// Có thể ẩn danh hoặc cung cấp tên + SĐT
// ============================================================

export function validateStep5(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  const { reporter } = data;

  if (reporter.isAnonymous) {
    // Nếu ẩn danh, không cần kiểm tra thêm
    // Nhưng cảnh báo rằng ẩn danh sẽ giảm độ tin cậy
    warnings.anonymous = "Báo cáo ẩn danh sẽ có độ tin cậy thấp hơn. Cung cấp thông tin giúp xác minh nhanh hơn.";
  } else {
    // Kiểm tra tên
    if (!reporter.name || reporter.name.trim().length === 0) {
      errors.name = "Vui lòng nhập tên hoặc chọn ẩn danh";
    } else if (reporter.name.trim().length < 2) {
      errors.name = "Tên quá ngắn, tối thiểu 2 ký tự";
    } else if (reporter.name.trim().length > 100) {
      errors.name = "Tên quá dài, tối đa 100 ký tự";
    } else {
      // Kiểm tra tên có chứa ký tự hợp lệ
      const namePattern = /^[a-zA-ZÀ-ỹa-zA-Z\s'.-]+$/;
      if (!namePattern.test(reporter.name.trim())) {
        errors.name = "Tên chỉ được chứa chữ cái, khoảng trắng và dấu";
      }
    }

    // Kiểm tra số điện thoại (optional nhưng nếu nhập phải hợp lệ)
    if (reporter.phone && reporter.phone.trim().length > 0) {
      const phoneClean = reporter.phone.replace(/[\s.-]/g, "");
      // Định dạng Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx
      const vnPhonePattern = /^(0|\+84)[0-9]{9}$/;
      if (!vnPhonePattern.test(phoneClean)) {
        errors.phone = "Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx";
      }
    } else {
      // Cảnh báo nếu không nhập SĐT
      warnings.phone = "Cung cấp số điện thoại giúp cơ quan chức năng liên hệ khi cần";
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// ============================================================
// STEP 6: CONFIRMATION VALIDATION
// ============================================================
// Kiểm tra người dùng đã xác nhận thông tin trước khi gửi
// ============================================================

export function validateStep6(data: WizardFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Kiểm tra đã xác nhận
  if (!data.confirmed) {
    errors.confirmed = "Vui lòng xác nhận thông tin trước khi gửi báo cáo";
  }

  // Chạy lại validation tất cả các bước trước đó
  const step1 = validateStep1(data);
  const step2 = validateStep2(data);
  const step3 = validateStep3(data);
  const step4 = validateStep4(data);
  const step5 = validateStep5(data);

  const allPrevious = mergeResults(step1, step2, step3, step4, step5);

  if (!allPrevious.isValid) {
    errors.previous = "Có lỗi ở các bước trước. Vui lòng quay lại kiểm tra.";
    // Merge errors từ các bước trước (chỉ lấy errors, không lấy warnings)
    for (const [key, msg] of Object.entries(allPrevious.errors)) {
      errors[`prev_${key}`] = msg;
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors, warnings };
}

// ============================================================
// VALIDATE THEO STEP SỐ
// ============================================================
// Wrapper function để gọi validation theo step number
// Hữu ích khi dùng dynamic trong SubmitWizard
// ============================================================

export function validateStep(
  step: WizardStep,
  data: WizardFormData
): ValidationResult {
  switch (step) {
    case 1:
      return validateStep1(data);
    case 2:
      return validateStep2(data);
    case 3:
      return validateStep3(data);
    case 4:
      return validateStep4(data);
    case 5:
      return validateStep5(data);
    case 6:
      return validateStep6(data);
    default:
      return invalidResult({ step: "Bước không hợp lệ" });
  }
}

// ============================================================
// FULL REPORT VALIDATION
// ============================================================
// Validate toàn bộ báo cáo trước khi submit
// Chạy tất cả 6 bước và merge kết quả
// ============================================================

export function validateFullReport(data: WizardFormData): ValidationResult {
  const results: ValidationResult[] = [];

  // Chạy từng bước
  for (let step = 1; step <= 6; step++) {
    results.push(validateStep(step as WizardStep, data));
  }

  // Merge tất cả kết quả
  const merged = mergeResults(...results);

  // Thêm validation bổ sung cho full report
  const extraErrors: Record<string, string> = {};
  const extraWarnings: Record<string, string> = {};

  // Kiểm tra tính nhất quán giữa severity và description
  if (data.severity === "critical" && data.description && data.description.length < 100) {
    extraWarnings.consistency = "Báo cáo mức 'Nghiêm trọng' nên có mô tả chi tiết hơn";
  }

  // Kiểm tra tính nhất quán giữa type và location
  if (data.type === "tsunami" && data.location.province) {
    const coastalProvinces = [
      "Đà Nẵng", "Nha Trang", "Quảng Bình", "Quảng Nam",
      "Huế", "Hải Phòng", "Bến Tre", "Trà Vinh",
    ];
    if (!coastalProvinces.includes(data.location.province)) {
      extraWarnings.typeLocation = `Tỉnh "${data.location.province}" không phải tỉnh ven biển. Báo cáo sóng thần có vẻ không phù hợp.`;
    }
  }

  // Kiểm tra landslide ở đồng bằng
  if (data.type === "landslide" && data.location.province) {
    const deltaProvinces = ["Cần Thơ", "An Giang", "Bến Tre", "Trà Vinh", "Hồ Chí Minh"];
    if (deltaProvinces.includes(data.location.province)) {
      extraWarnings.typeLocation = `Tỉnh "${data.location.province}" là vùng đồng bằng. Báo cáo sạt lở có vẻ không phù hợp.`;
    }
  }

  // Kiểm tra drought ở miền núi
  if (data.type === "drought" && data.location.province) {
    const mountainProvinces = ["Lào Cai", "Yên Bái", "Đà Lạt"];
    if (mountainProvinces.includes(data.location.province)) {
      extraWarnings.typeLocation = `Tỉnh "${data.location.province}" là vùng núi. Báo cáo hạn hán có thể ít phổ biến hơn.`;
    }
  }

  return mergeResults(merged, {
    isValid: Object.keys(extraErrors).length === 0,
    errors: extraErrors,
    warnings: extraWarnings,
  });
}

// ============================================================
// VALIDATE COMMUNITY REPORT (đã submit)
// ============================================================
// Kiểm tra report object đã lưu trữ có hợp lệ không
// Dùng khi load từ localStorage hoặc merge mock data
// ============================================================

export function validateReport(report: CommunityReport): boolean {
  // Kiểm tra các trường bắt buộc
  if (!report.id || typeof report.id !== "string") return false;
  if (!VALID_DISASTER_TYPES.includes(report.type)) return false;
  if (!report.severity) return false;
  if (!report.status) return false;
  if (!report.title || report.title.length < 5) return false;
  if (!report.description || report.description.length < 10) return false;
  if (!report.createdAt) return false;
  if (!report.updatedAt) return false;

  // Kiểm tra location
  if (!report.location) return false;
  if (typeof report.location.lat !== "number") return false;
  if (typeof report.location.lng !== "number") return false;
  if (!report.location.province) return false;

  // Kiểm tra reporter
  if (!report.reporter) return false;
  if (!report.reporter.id) return false;
  if (!report.reporter.name) return false;

  // Kiểm tra verification
  if (!report.verification) return false;
  if (typeof report.verification.upvotes !== "number") return false;
  if (typeof report.verification.downvotes !== "number") return false;
  if (typeof report.verification.trustScore !== "number") return false;

  // Kiểm tra reportNumber
  if (typeof report.reportNumber !== "number" || report.reportNumber < 1) return false;

  return true;
}

// ============================================================
// XSS SANITIZATION
// ============================================================
// Ngăn chặn XSS attacks bằng cách escape HTML entities
// Áp dụng cho tất cả user-generated text
// ============================================================

/**
 * Escape HTML entities để ngăn XSS
 * Chuyển đổi: & < > " ' / → HTML entities
 */
export function sanitizeInput(text: string): string {
  if (typeof text !== "string") return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize toàn bộ CommunityReport object
 * Áp dụng sanitizeInput cho tất cả text fields
 */
export function sanitizeReport(report: CommunityReport): CommunityReport {
  return {
    ...report,
    // Sanitize content fields
    title: sanitizeInput(report.title),
    description: sanitizeInput(report.description),

    // Sanitize location
    location: {
      ...report.location,
      address: sanitizeInput(report.location.address),
      district: sanitizeInput(report.location.district),
      province: sanitizeInput(report.location.province),
    },

    // Sanitize reporter info
    reporter: {
      ...report.reporter,
      name: sanitizeInput(report.reporter.name),
      phone: sanitizeInput(report.reporter.phone),
    },

    // Sanitize photo captions
    photos: report.photos.map((photo) => ({
      ...photo,
      caption: sanitizeInput(photo.caption),
    })),
  };
}

/**
 * Sanitize WizardFormData trước khi submit
 */
export function sanitizeWizardData(data: WizardFormData): WizardFormData {
  return {
    ...data,
    title: sanitizeInput(data.title),
    description: sanitizeInput(data.description),
    location: {
      ...data.location,
      address: sanitizeInput(data.location.address),
      district: sanitizeInput(data.location.district),
      province: sanitizeInput(data.location.province),
    },
    reporter: {
      ...data.reporter,
      name: sanitizeInput(data.reporter.name),
      phone: sanitizeInput(data.reporter.phone),
    },
    photos: data.photos.map((photo) => ({
      ...photo,
      caption: sanitizeInput(photo.caption),
    })),
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format kích thước file thành dạng đọc được
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Kiểm tra chuỗi có chứa HTML/Script tags không
 * Dùng để detect potential XSS attempts
 */
export function containsHtmlTags(text: string): boolean {
  if (typeof text !== "string") return false;
  const htmlPattern = /<[^>]*>/g;
  return htmlPattern.test(text);
}

/**
 * Kiểm tra chuỗi có chứa script injection không
 */
export function containsScriptInjection(text: string): boolean {
  if (typeof text !== "string") return false;
  const scriptPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,     // onclick=, onerror=, etc.
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];
  return scriptPatterns.some((pattern) => pattern.test(text));
}

/**
 * Deep sanitize - loại bỏ tất cả HTML tags và script injection
 * Sử dụng khi cần đảm bảo text hoàn toàn sạch
 */
export function deepSanitize(text: string): string {
  if (typeof text !== "string") return "";

  // Loại bỏ HTML tags
  let clean = text.replace(/<[^>]*>/g, "");
  // Loại bỏ script patterns
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  // Escape remaining special chars
  clean = sanitizeInput(clean);

  return clean;
}

/**
 * Kiểm tra text có hợp lệ để hiển thị không
 * Trả về null nếu hợp lệ, error message nếu không
 */
export function validateDisplayText(
  text: string,
  fieldName: string,
  maxLength: number = 2000
): string | null {
  if (typeof text !== "string") {
    return `${fieldName}: Dữ liệu không hợp lệ`;
  }

  if (text.length > maxLength) {
    return `${fieldName}: Vượt quá ${maxLength} ký tự`;
  }

  if (containsScriptInjection(text)) {
    return `${fieldName}: Phát hiện nội dung không an toàn`;
  }

  return null;
}
