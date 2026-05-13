"use client";

// =============================================================================
// ESCALATION ENGINE - Multi-Channel Alert Escalation System
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Implements a FEMA IPAWS-inspired multi-channel escalation system:
//   Push → SMS → Zalo OA → Loudspeaker
//
// Each severity level has its own escalation chain with time-based rules.
// The engine tracks escalation state per alert and determines when/how
// to escalate to the next channel if the user hasn't acknowledged.
//
// Design Philosophy:
//   - Life-threatening alerts (extreme) escalate aggressively (2min → 5min → 10min)
//   - Severe alerts escalate moderately (10min → 30min)
//   - Moderate alerts escalate slowly (60min)
//   - Minor alerts only use push (no escalation)
//   - Each channel has reliability + cost trade-offs
//   - Supports offline queuing via Background Sync API
// =============================================================================

import type {
  Alert,
  AlertSeverity,
  AlertDelivery,
  DeliveryChannel,
  EscalationStep,
  EscalationState,
  AckStatus,
  AlertUserPreferences,
} from "./types";

import {
  ALERT_SEVERITY_CONFIG,
  ESCALATION_STEPS,
  DELIVERY_CHANNEL_CONFIG,
  ALERT_CONFIG,
  STORAGE_KEYS,
} from "../config/alert-config";

// =============================================================================
// SECTION 1: ESCALATION STATE MANAGEMENT
// =============================================================================

/**
 * Tạo trạng thái ban đầu cho chuỗi leo thang của một cảnh báo.
 * Được gọi khi cảnh báo mới được tạo hoặc khi bắt đầu gửi.
 */
export function createEscalationState(alertId: string, severity: AlertSeverity): EscalationState {
  const steps = ESCALATION_STEPS[severity];
  const now = new Date().toISOString();

  // Tính thời gian leo thang tiếp theo (nếu có bước tiếp theo)
  const nextStep = steps.length > 1 ? steps[1] : null;
  const nextEscalationAt = nextStep
    ? new Date(Date.now() + nextStep.delayMinutes * 60 * 1000).toISOString()
    : undefined;

  return {
    alertId,
    currentLevel: 1,
    steps: [...steps],
    startedAt: now,
    lastEscalatedAt: now,
    nextEscalationAt,
    isComplete: false,
    outcome: null,
  };
}

/**
 * Kiểm tra xem có cần leo thang tiếp không.
 * Trả về true nếu đã đến lúc leo thang và cảnh báo chưa được xác nhận.
 */
export function shouldEscalate(
  escalation: EscalationState,
  delivery: AlertDelivery,
  ackStatus: AckStatus,
  currentTime: Date = new Date()
): boolean {
  // Nếu đã hoàn thành hoặc đã được xác nhận
  if (escalation.isComplete) return false;
  if (ackStatus === "acknowledged" || ackStatus === "dismissed") return false;

  // Nếu đã đạt cấp tối đa
  if (escalation.currentLevel >= escalation.steps.length) return false;

  // Kiểm tra thời gian
  if (!escalation.nextEscalationAt) return false;

  const nextTime = new Date(escalation.nextEscalationAt);
  return currentTime >= nextTime;
}

/**
 * Thực hiện leo thang lên cấp tiếp theo.
 * Trả về EscalationState đã cập nhật + thông tin kênh mới.
 */
export function performEscalation(
  escalation: EscalationState,
  currentTime: Date = new Date()
): {
  updatedState: EscalationState;
  newChannel: DeliveryChannel;
  newLevel: number;
  action: EscalationStep["action"];
} | null {
  if (escalation.isComplete) return null;
  if (escalation.currentLevel >= escalation.steps.length) return null;

  const nextLevelIndex = escalation.currentLevel; // 0-indexed, currentLevel is 1-indexed
  const nextStep = escalation.steps[nextLevelIndex];

  if (!nextStep) return null;

  const now = currentTime.toISOString();
  const followingStep = escalation.steps[nextLevelIndex + 1];

  const updatedState: EscalationState = {
    ...escalation,
    currentLevel: nextStep.level,
    lastEscalatedAt: now,
    nextEscalationAt: followingStep
      ? new Date(currentTime.getTime() + followingStep.delayMinutes * 60 * 1000).toISOString()
      : undefined,
    isComplete: !followingStep, // Hoàn thành nếu không còn bước nào
    outcome: !followingStep ? "max_level_reached" : null,
  };

  return {
    updatedState,
    newChannel: nextStep.channel,
    newLevel: nextStep.level,
    action: nextStep.action,
  };
}

/**
 * Đánh dấu leo thang hoàn thành do người dùng xác nhận.
 */
export function acknowledgeEscalation(
  escalation: EscalationState,
  currentTime: Date = new Date()
): EscalationState {
  return {
    ...escalation,
    isComplete: true,
    outcome: "acknowledged",
    lastEscalatedAt: currentTime.toISOString(),
  };
}

/**
 * Đánh dấu leo thang hết hạn (cảnh báo đã hết hạn).
 */
export function expireEscalation(
  escalation: EscalationState,
  currentTime: Date = new Date()
): EscalationState {
  return {
    ...escalation,
    isComplete: true,
    outcome: "expired",
    lastEscalatedAt: currentTime.toISOString(),
  };
}

// =============================================================================
// SECTION 2: CHANNEL DELIVERY SIMULATION
// =============================================================================

/** Kết quả gửi qua kênh */
export interface ChannelDeliveryResult {
  channel: DeliveryChannel;
  success: boolean;
  deliveredAt: string;
  recipientCount: number;
  failedCount: number;
  error?: string;
  estimatedReadTime?: string;
}

/** Cấu hình kênh gửi */
interface ChannelSendConfig {
  channel: DeliveryChannel;
  alertId: string;
  headline: string;
  severity: AlertSeverity;
  targetProvinces: string[];
  recipientCount: number;
}

/**
 * Mô phỏng gửi cảnh báo qua một kênh cụ thể.
 * Trong production, đây sẽ gọi API thực (Firebase FCM, VNPT SMS Gateway, Zalo OA API, v.v.)
 *
 * @returns ChannelDeliveryResult với thông tin kết quả gửi
 */
export async function simulateChannelDelivery(
  config: ChannelSendConfig
): Promise<ChannelDeliveryResult> {
  const channelConfig = DELIVERY_CHANNEL_CONFIG[config.channel];
  const severityConfig = ALERT_SEVERITY_CONFIG[config.severity];

  // Mô phỏng độ trễ mạng theo kênh
  const latencyMs = getChannelLatency(config.channel);
  await sleep(latencyMs);

  // Mô phỏng tỷ lệ thành công theo reliability của kênh
  const baseSuccessRate = channelConfig.reliability;
  const severityBoost = config.severity === "extreme" ? 0.05 : 0; // Extreme alerts get priority routing
  const effectiveSuccessRate = Math.min(baseSuccessRate + severityBoost, 1.0);

  const isSuccess = Math.random() < effectiveSuccessRate;

  if (isSuccess) {
    const deliveredCount = Math.floor(config.recipientCount * effectiveSuccessRate);
    const failedCount = config.recipientCount - deliveredCount;

    return {
      channel: config.channel,
      success: true,
      deliveredAt: new Date().toISOString(),
      recipientCount: deliveredCount,
      failedCount,
      estimatedReadTime: estimateReadTime(config.channel, config.severity),
    };
  }

  return {
    channel: config.channel,
    success: false,
    deliveredAt: new Date().toISOString(),
    recipientCount: 0,
    failedCount: config.recipientCount,
    error: getChannelErrorMessage(config.channel),
  };
}

/**
 * Gửi cảnh báo qua tất cả các kênh trong bước hiện tại.
 * Hỗ trợ gửi đa kênh đồng thời (parallel) hoặc tuần tự (sequential).
 */
export async function sendAlertToChannels(
  alert: Alert,
  channels: DeliveryChannel[],
  recipientCount: number,
  mode: "parallel" | "sequential" = "parallel"
): Promise<ChannelDeliveryResult[]> {
  const configs: ChannelSendConfig[] = channels.map((channel) => ({
    channel,
    alertId: alert.id,
    headline: alert.info.headline,
    severity: alert.info.severity,
    targetProvinces: alert.info.area.provinces,
    recipientCount,
  }));

  if (mode === "parallel") {
    return Promise.all(configs.map((config) => simulateChannelDelivery(config)));
  }

  // Sequential mode: gửi lần lượt, dừng nếu có lỗi nghiêm trọng
  const results: ChannelDeliveryResult[] = [];
  for (const config of configs) {
    const result = await simulateChannelDelivery(config);
    results.push(result);

    // Nếu kênh critical (push/sms) thất bại, vẫn tiếp tục với kênh khác
    // nhưng ghi nhận lỗi
    if (!result.success && (config.channel === "push" || config.channel === "sms")) {
      console.warn(
        `[EscalationEngine] Channel ${config.channel} failed for alert ${alert.id}. ` +
        `Continuing with next channel.`
      );
    }
  }

  return results;
}

// =============================================================================
// SECTION 3: ESCALATION ORCHESTRATOR
// =============================================================================

/** Context cho quá trình leo thang */
export interface EscalationContext {
  alert: Alert;
  escalationState: EscalationState;
  ackStatus: AckStatus;
  userPreferences: AlertUserPreferences;
  isOnline: boolean;
  currentTime?: Date;
}

/** Kết quả xử lý leo thang */
export interface EscalationProcessResult {
  shouldEscalate: boolean;
  escalated: boolean;
  newState: EscalationState;
  deliveryResults: ChannelDeliveryResult[];
  channelUsed: DeliveryChannel;
  message: string;
}

/**
 * Xử lý chính cho chuỗi leo thang.
 * Được gọi định kỳ (mỗi 60s) để kiểm tra và thực hiện leo thang.
 *
 * Flow:
 * 1. Kiểm tra có cần leo thang không (shouldEscalate)
 * 2. Nếu cần → thực hiện leo thang (performEscalation)
 * 3. Gửi qua kênh mới (simulateChannelDelivery)
 * 4. Cập nhật trạng thái
 * 5. Nếu offline → đưa vào hàng đợi
 */
export async function processEscalation(
  context: EscalationContext
): Promise<EscalationProcessResult> {
  const { alert, escalationState, ackStatus, userPreferences, isOnline, currentTime } = context;
  const now = currentTime || new Date();

  // Kiểm tra có cần leo thang không
  const needsEscalation = shouldEscalate(escalationState, alert.delivery, ackStatus, now);

  if (!needsEscalation) {
    return {
      shouldEscalate: false,
      escalated: false,
      newState: escalationState,
      deliveryResults: [],
      channelUsed: escalationState.steps[escalationState.currentLevel - 1]?.channel || "push",
      message: escalationState.isComplete
        ? "Chuỗi leo thang đã hoàn thành"
        : ackStatus === "acknowledged"
          ? "Cảnh báo đã được xác nhận"
          : `Chờ đến ${escalationState.nextEscalationAt || "N/A"} để leo thang tiếp`,
    };
  }

  // Thực hiện leo thang
  const escalationResult = performEscalation(escalationState, now);

  if (!escalationResult) {
    return {
      shouldEscalate: true,
      escalated: false,
      newState: escalationState,
      deliveryResults: [],
      channelUsed: "push",
      message: "Không thể leo thang: đã đạt cấp tối đa",
    };
  }

  const { updatedState, newChannel, newLevel } = escalationResult;

  // Kiểm tra quiet hours cho kênh không khẩn cấp
  if (isQuietHours(userPreferences) && !isCriticalSeverity(alert.info.severity)) {
    return {
      shouldEscalate: true,
      escalated: false,
      newState: updatedState,
      deliveryResults: [],
      channelUsed: newChannel,
      message: `Đang trong giờ yên lặng (${userPreferences.quietHoursStart}-${userPreferences.quietHoursEnd}). Chờ đến sáng để gửi qua ${DELIVERY_CHANNEL_CONFIG[newChannel].labelVi}`,
    };
  }

  // Nếu offline → không gửi nhưng vẫn cập nhật state
  if (!isOnline) {
    return {
      shouldEscalate: true,
      escalated: false,
      newState: updatedState,
      deliveryResults: [],
      channelUsed: newChannel,
      message: `Offline. Leo thang cấp ${newLevel} (${DELIVERY_CHANNEL_CONFIG[newChannel].labelVi}) sẽ được gửi khi có mạng`,
    };
  }

  // Gửi qua kênh mới
  const recipientCount = estimateRecipientCount(alert, newChannel);
  const deliveryResult = await simulateChannelDelivery({
    channel: newChannel,
    alertId: alert.id,
    headline: alert.info.headline,
    severity: alert.info.severity,
    targetProvinces: alert.info.area.provinces,
    recipientCount,
  });

  return {
    shouldEscalate: true,
    escalated: deliveryResult.success,
    newState: updatedState,
    deliveryResults: [deliveryResult],
    channelUsed: newChannel,
    message: deliveryResult.success
      ? `Đã leo thang cấp ${newLevel}: Gửi qua ${DELIVERY_CHANNEL_CONFIG[newChannel].labelVi} đến ${deliveryResult.recipientCount} người`
      : `Leo thang cấp ${newLevel} thất bại: ${deliveryResult.error}. Sẽ thử lại.`,
  };
}

/**
 * Xử lý hàng loạt các trạng thái leo thang.
 * Được gọi bởi interval timer trong AlertSOSProvider.
 */
export async function processBatchEscalations(
  alerts: Alert[],
  escalationStates: EscalationState[],
  ackMap: Map<string, AckStatus>,
  userPreferences: AlertUserPreferences,
  isOnline: boolean,
  currentTime: Date = new Date()
): Promise<Map<string, EscalationProcessResult>> {
  const results = new Map<string, EscalationProcessResult>();

  for (const alert of alerts) {
    const escalationState = escalationStates.find((e) => e.alertId === alert.id);
    if (!escalationState) continue;

    const ackStatus = ackMap.get(alert.id) || "pending";

    const result = await processEscalation({
      alert,
      escalationState,
      ackStatus,
      userPreferences,
      isOnline,
      currentTime,
    });

    results.set(alert.id, result);
  }

  return results;
}

// =============================================================================
// SECTION 4: ESCALATION TIMELINE & VISUALIZATION
// =============================================================================

/** Mục trên timeline leo thang */
export interface EscalationTimelineEntry {
  level: number;
  channel: DeliveryChannel;
  channelLabel: string;
  channelLabelVi: string;
  channelIcon: string;
  channelColor: string;
  delayMinutes: number;
  scheduledAt: string;
  status: "pending" | "active" | "completed" | "skipped" | "failed";
  deliveredAt?: string;
  recipientCount?: number;
  error?: string;
}

/**
 * Tạo timeline trực quan cho chuỗi leo thang.
 * Dùng để render UI timeline component.
 */
export function buildEscalationTimeline(
  escalation: EscalationState,
  deliveryHistory: Map<number, ChannelDeliveryResult>,
  currentTime: Date = new Date()
): EscalationTimelineEntry[] {
  const startTime = new Date(escalation.startedAt).getTime();

  return escalation.steps.map((step, index) => {
    const channelConfig = DELIVERY_CHANNEL_CONFIG[step.channel];
    const scheduledTime = new Date(startTime + step.delayMinutes * 60 * 1000);
    const deliveryResult = deliveryHistory.get(step.level);

    let status: EscalationTimelineEntry["status"];
    if (escalation.isComplete && step.level < escalation.currentLevel) {
      status = "completed";
    } else if (step.level === escalation.currentLevel) {
      if (escalation.isComplete) {
        status = escalation.outcome === "acknowledged" ? "completed" : "completed";
      } else if (deliveryResult && !deliveryResult.success) {
        status = "failed";
      } else {
        status = "active";
      }
    } else if (step.level > escalation.currentLevel) {
      status = "pending";
    } else {
      status = "completed";
    }

    // Nếu có acknowledgment, đánh dấu các bước sau là skipped
    if (escalation.outcome === "acknowledged" && step.level > escalation.currentLevel) {
      status = "skipped";
    }

    return {
      level: step.level,
      channel: step.channel,
      channelLabel: channelConfig.label,
      channelLabelVi: channelConfig.labelVi,
      channelIcon: channelConfig.icon,
      channelColor: channelConfig.color,
      delayMinutes: step.delayMinutes,
      scheduledAt: scheduledTime.toISOString(),
      status,
      deliveredAt: deliveryResult?.deliveredAt,
      recipientCount: deliveryResult?.recipientCount,
      error: deliveryResult?.error,
    };
  });
}

/**
 * Tính phần trăm hoàn thành của chuỗi leo thang.
 */
export function getEscalationProgress(escalation: EscalationState): number {
  if (escalation.steps.length === 0) return 0;
  if (escalation.outcome === "acknowledged") return 100;
  if (escalation.outcome === "expired") return 0;

  return Math.round(((escalation.currentLevel - 1) / escalation.steps.length) * 100);
}

/**
 * Lấy mô tả tiếng Việt cho trạng thái leo thang.
 */
export function getEscalationStatusDescription(escalation: EscalationState): string {
  if (escalation.outcome === "acknowledged") {
    return "Đã được xác nhận - Dừng leo thang";
  }
  if (escalation.outcome === "expired") {
    return "Cảnh báo đã hết hạn";
  }
  if (escalation.outcome === "max_level_reached") {
    return "Đã đạt cấp phát cao nhất";
  }

  const currentStep = escalation.steps[escalation.currentLevel - 1];
  if (!currentStep) return "Chưa bắt đầu";

  const channelConfig = DELIVERY_CHANNEL_CONFIG[currentStep.channel];
  const remainingSteps = escalation.steps.length - escalation.currentLevel;

  if (remainingSteps === 0) {
    return `Đang gửi qua ${channelConfig.labelVi} - Cấp cuối cùng`;
  }

  return `Cấp ${escalation.currentLevel}/${escalation.steps.length}: ${channelConfig.labelVi} - Còn ${remainingSteps} cấp`;
}

/**
 * Tính thời gian còn lại trước khi leo thang tiếp theo.
 * Trả về số giây, hoặc -1 nếu không có bước tiếp.
 */
export function getTimeToNextEscalation(
  escalation: EscalationState,
  currentTime: Date = new Date()
): number {
  if (escalation.isComplete || !escalation.nextEscalationAt) return -1;

  const nextTime = new Date(escalation.nextEscalationAt).getTime();
  const remaining = Math.max(0, nextTime - currentTime.getTime());

  return Math.ceil(remaining / 1000);
}

/**
 * Format thời gian còn lại thành chuỗi dễ đọc.
 */
export function formatTimeToNextEscalation(seconds: number): string {
  if (seconds <= 0) return "Sẵn sàng leo thang";
  if (seconds < 60) return `${seconds} giây nữa`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} phút nữa`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);
  return `${hours}h${mins > 0 ? ` ${mins}p` : ""} nữa`;
}

// =============================================================================
// SECTION 5: RETRY LOGIC
// =============================================================================

/** Cấu hình retry */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/** Kết quả retry */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  lastError?: string;
  totalDurationMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: ALERT_CONFIG.MAX_RETRY_COUNT,
  baseDelayMs: ALERT_CONFIG.RETRY_BASE_DELAY,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
};

/**
 * Thực hiện retry với exponential backoff.
 * Áp dụng cho việc gửi qua kênh khi gặp lỗi tạm thời.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt + 1,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < finalConfig.maxRetries) {
        const delay = Math.min(
          finalConfig.baseDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelayMs
        );
        // Thêm jitter để tránh thundering herd
        const jitter = delay * 0.1 * Math.random();
        await sleep(delay + jitter);
      }
    }
  }

  return {
    success: false,
    attempts: finalConfig.maxRetries + 1,
    lastError,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Gửi cảnh báo qua kênh với retry.
 * Tự động thử lại nếu kênh bị lỗi tạm thời.
 */
export async function sendWithRetry(
  config: ChannelSendConfig,
  retryConfig?: Partial<RetryConfig>
): Promise<RetryResult<ChannelDeliveryResult>> {
  return retryWithBackoff(
    () => simulateChannelDelivery(config),
    retryConfig
  );
}

// =============================================================================
// SECTION 6: MULTI-CHANNEL STRATEGY
// =============================================================================

/** Chiến lược gửi đa kênh */
export type ChannelStrategy = "progressive" | "parallel" | "fallback" | "optimal";

/** Kết quả chiến lược gửi */
export interface ChannelStrategyResult {
  strategy: ChannelStrategy;
  primaryChannel: DeliveryChannel;
  channels: DeliveryChannel[];
  estimatedReach: number;
  estimatedLatency: number;
  description: string;
  descriptionVi: string;
}

/**
 * Xác định chiến lược gửi tối ưu dựa trên mức độ nghiêm trọng.
 *
 * - Progressive: Gửi lần lượt Push → SMS → Zalo → Loudspeaker (mặc định)
 * - Parallel: Gửi đồng thời tất cả kênh
 * - Fallback: Thử kênh chính, nếu thất bại chuyển sang kênh dự phòng
 * - Optimal: Chọn kênh có tỷ lệ tiếp cận cao nhất cho khu vực
 */
export function determineChannelStrategy(
  severity: AlertSeverity,
  isOnline: boolean,
  recipientCount: number,
  province?: string
): ChannelStrategyResult {
  const steps = ESCALATION_STEPS[severity];
  const channels = steps.map((s) => s.channel);

  if (!isOnline) {
    return {
      strategy: "fallback",
      primaryChannel: "sms",
      channels: ["sms", "loudspeaker"],
      estimatedReach: Math.floor(recipientCount * 0.7),
      estimatedLatency: 5000,
      description: "Offline mode: SMS + Loudspeaker (no app required)",
      descriptionVi: "Chế độ offline: SMS + Loa phát thanh (không cần app)",
    };
  }

  // Extreme: Parallel để đảm bảo tiếp cận nhanh nhất
  if (severity === "extreme") {
    return {
      strategy: "parallel",
      primaryChannel: "push",
      channels: ["push", "sms", "zalo", "loudspeaker"],
      estimatedReach: Math.floor(recipientCount * 0.95),
      estimatedLatency: 2000,
      description: "Parallel broadcast: All channels simultaneously for maximum reach",
      descriptionVi: "Phát đồng thời: Tất cả kênh cùng lúc để tiếp cận tối đa",
    };
  }

  // Severe: Progressive với fallback
  if (severity === "severe") {
    return {
      strategy: "progressive",
      primaryChannel: "push",
      channels: ["push", "sms", "zalo"],
      estimatedReach: Math.floor(recipientCount * 0.85),
      estimatedLatency: 5000,
      description: "Progressive escalation: Push first, then SMS → Zalo if no ack",
      descriptionVi: "Leo thang lần lượt: Push trước, SMS → Zalo nếu không xác nhận",
    };
  }

  // Moderate: Progressive chậm hơn
  if (severity === "moderate") {
    return {
      strategy: "progressive",
      primaryChannel: "push",
      channels: ["push", "sms"],
      estimatedReach: Math.floor(recipientCount * 0.7),
      estimatedLatency: 3000,
      description: "Slow escalation: Push → SMS with 1-hour delay",
      descriptionVi: "Leo thang chậm: Push → SMS sau 1 giờ",
    };
  }

  // Minor: Chỉ push
  return {
    strategy: "optimal",
    primaryChannel: "push",
    channels: ["push"],
    estimatedReach: Math.floor(recipientCount * 0.5),
    estimatedLatency: 1000,
    description: "Push only: Low-priority notification",
    descriptionVi: "Chỉ Push: Thông báo mức thấp",
  };
}

/**
 * Tính toán kênh tối ưu cho một khu vực cụ thể.
 * Ưu tiên kênh có reliability cao nhất trong khu vực.
 */
export function getOptimalChannelForArea(
  province: string,
  availableChannels: DeliveryChannel[]
): DeliveryChannel {
  // Khu vực nông thôn: Ưu tiên SMS + loa phát thanh (không cần smartphone)
  const ruralProvinces = ["Lào Cai", "Yên Bái", "Quảng Bình", "An Giang"];
  if (ruralProvinces.includes(province)) {
    if (availableChannels.includes("sms")) return "sms";
    if (availableChannels.includes("loudspeaker")) return "loudspeaker";
  }

  // Khu vực thành thị: Ưu tiên push (smartphone penetration cao)
  const urbanProvinces = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng"];
  if (urbanProvinces.includes(province)) {
    if (availableChannels.includes("push")) return "push";
    if (availableChannels.includes("zalo")) return "zalo";
  }

  // Mặc định: Chọn kênh có reliability cao nhất
  let bestChannel: DeliveryChannel = availableChannels[0];
  let bestReliability = 0;

  for (const channel of availableChannels) {
    const reliability = DELIVERY_CHANNEL_CONFIG[channel].reliability;
    if (reliability > bestReliability) {
      bestReliability = reliability;
      bestChannel = channel;
    }
  }

  return bestChannel;
}

// =============================================================================
// SECTION 7: ESCALATION PERSISTENCE
// =============================================================================

/**
 * Lưu trạng thái leo thang vào localStorage.
 */
export function saveEscalationStates(states: EscalationState[]): void {
  try {
    const serialized = JSON.stringify(states);
    localStorage.setItem(STORAGE_KEYS.ESCALATION_STATES, serialized);
  } catch (error) {
    console.error("[EscalationEngine] Failed to save escalation states:", error);
  }
}

/**
 * Tải trạng thái leo thang từ localStorage.
 * Tự động xóa các trạng thái đã hoàn thành quá 24h.
 */
export function loadEscalationStates(): EscalationState[] {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.ESCALATION_STATES);
    if (!serialized) return [];

    const states: EscalationState[] = JSON.parse(serialized);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Lọc bỏ các trạng thái quá cũ
    return states.filter((state) => {
      if (!state.isComplete) return true;
      const completedAt = new Date(state.lastEscalatedAt || state.startedAt).getTime();
      return now - completedAt < maxAge;
    });
  } catch (error) {
    console.error("[EscalationEngine] Failed to load escalation states:", error);
    return [];
  }
}

/**
 * Xóa trạng thái leo thang của một cảnh báo cụ thể.
 */
export function removeEscalationState(alertId: string): void {
  const states = loadEscalationStates();
  const filtered = states.filter((s) => s.alertId !== alertId);
  saveEscalationStates(filtered);
}

/**
 * Dọn dẹp các trạng thái leo thang đã hoàn thành.
 */
export function cleanupCompletedEscalations(): number {
  const states = loadEscalationStates();
  const active = states.filter((s) => !s.isComplete);
  const removedCount = states.length - active.length;

  if (removedCount > 0) {
    saveEscalationStates(active);
  }

  return removedCount;
}

// =============================================================================
// SECTION 8: STATISTICS & ANALYTICS
// =============================================================================

/** Thống kê leo thang */
export interface EscalationStats {
  totalActive: number;
  totalCompleted: number;
  totalAcknowledged: number;
  totalExpired: number;
  totalMaxLevel: number;
  averageTimeToAck: number; // in seconds
  channelBreakdown: Record<DeliveryChannel, { sent: number; succeeded: number; failed: number }>;
  severityBreakdown: Record<AlertSeverity, { count: number; avgEscalationLevel: number }>;
}

/**
 * Tính toán thống kê leo thang từ lịch sử.
 */
export function calculateEscalationStats(
  escalationStates: EscalationState[],
  deliveryHistory: Map<string, ChannelDeliveryResult[]>
): EscalationStats {
  const stats: EscalationStats = {
    totalActive: 0,
    totalCompleted: 0,
    totalAcknowledged: 0,
    totalExpired: 0,
    totalMaxLevel: 0,
    averageTimeToAck: 0,
    channelBreakdown: {
      push: { sent: 0, succeeded: 0, failed: 0 },
      sms: { sent: 0, succeeded: 0, failed: 0 },
      zalo: { sent: 0, succeeded: 0, failed: 0 },
      loudspeaker: { sent: 0, succeeded: 0, failed: 0 },
      email: { sent: 0, succeeded: 0, failed: 0 },
    },
    severityBreakdown: {
      extreme: { count: 0, avgEscalationLevel: 0 },
      severe: { count: 0, avgEscalationLevel: 0 },
      moderate: { count: 0, avgEscalationLevel: 0 },
      minor: { count: 0, avgEscalationLevel: 0 },
    },
  };

  let totalAckTime = 0;
  let ackCount = 0;

  for (const state of escalationStates) {
    if (state.isComplete) {
      stats.totalCompleted++;
      if (state.outcome === "acknowledged") {
        stats.totalAcknowledged++;
        const startTime = new Date(state.startedAt).getTime();
        const endTime = new Date(state.lastEscalatedAt || state.startedAt).getTime();
        totalAckTime += (endTime - startTime) / 1000;
        ackCount++;
      } else if (state.outcome === "expired") {
        stats.totalExpired++;
      } else if (state.outcome === "max_level_reached") {
        stats.totalMaxLevel++;
      }
    } else {
      stats.totalActive++;
    }

    // Tính delivery history
    const deliveries = deliveryHistory.get(state.alertId) || [];
    for (const delivery of deliveries) {
      const channelStats = stats.channelBreakdown[delivery.channel];
      channelStats.sent += delivery.recipientCount;
      if (delivery.success) {
        channelStats.succeeded += delivery.recipientCount;
      } else {
        channelStats.failed += delivery.failedCount;
      }
    }
  }

  stats.averageTimeToAck = ackCount > 0 ? Math.round(totalAckTime / ackCount) : 0;

  return stats;
}

// =============================================================================
// SECTION 9: UTILITY FUNCTIONS
// =============================================================================

/** Kiểm tra có đang trong giờ yên lặng không */
function isQuietHours(preferences: AlertUserPreferences): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [startH, startM] = preferences.quietHoursStart.split(":").map(Number);
  const [endH, endM] = preferences.quietHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Xử lý qua đêm (ví dụ: 22:00 - 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/** Kiểm tra severity có phải mức critical không */
function isCriticalSeverity(severity: AlertSeverity): boolean {
  return severity === "extreme" || severity === "severe";
}

/** Ước tính độ trễ mạng theo kênh */
function getChannelLatency(channel: DeliveryChannel): number {
  const latencies: Record<DeliveryChannel, number> = {
    push: 200,
    sms: 500,
    zalo: 800,
    loudspeaker: 1500,
    email: 1000,
  };
  return latencies[channel] || 500;
}

/** Ước tính thời gian đọc */
function estimateReadTime(channel: DeliveryChannel, severity: AlertSeverity): string {
  const baseTimes: Record<DeliveryChannel, number> = {
    push: 3,    // 3 giây
    sms: 10,    // 10 giây
    zalo: 5,    // 5 giây
    loudspeaker: 30, // 30 giây
    email: 60,  // 60 giây
  };

  const baseTime = baseTimes[channel] || 10;
  // Extreme alerts có nội dung dài hơn
  const multiplier = severity === "extreme" ? 1.5 : severity === "severe" ? 1.2 : 1;
  const estimatedSeconds = Math.round(baseTime * multiplier);

  if (estimatedSeconds < 60) return `~${estimatedSeconds} giây`;
  return `~${Math.round(estimatedSeconds / 60)} phút`;
}

/** Thông báo lỗi theo kênh */
function getChannelErrorMessage(channel: DeliveryChannel): string {
  const messages: Record<DeliveryChannel, string> = {
    push: "Không thể gửi Push Notification. Thiết bị có thể offline hoặc chưa cài app.",
    sms: "Không thể gửi SMS. Số điện thoại không hợp lệ hoặc nhà mạng gặp sự cố.",
    zalo: "Không thể gửi qua Zalo OA. Người dùng chưa kết nối Zalo OA.",
    loudspeaker: "Không thể kích hoạt loa phát thanh. Hệ thống loa có thể bị lỗi.",
    email: "Không thể gửi email. Địa chỉ email không hợp lệ hoặc hộp thư đầy.",
  };
  return messages[channel] || "Lỗi không xác định";
}

/** Ước tính số người nhận */
function estimateRecipientCount(alert: Alert, channel: DeliveryChannel): number {
  // Số người nhận cơ bản dựa trên khu vực
  const baseCount: Record<string, number> = {
    "Hà Nội": 50000,
    "Hồ Chí Minh": 60000,
    "Đà Nẵng": 15000,
    "Hải Phòng": 12000,
    "Cần Thơ": 8000,
    "Huế": 6000,
    "Nha Trang": 5000,
    "Đà Lạt": 3000,
    "Quảng Bình": 4000,
    "Quảng Nam": 5000,
    "Bến Tre": 3000,
    "Trà Vinh": 2000,
    "Lào Cai": 2500,
    "Yên Bái": 2000,
    "An Giang": 3000,
  };

  const totalBase = alert.info.area.provinces.reduce(
    (sum, p) => sum + (baseCount[p] || 2000),
    0
  );

  // Điều chỉnh theo kênh (không phải ai cũng nhận được mọi kênh)
  const channelMultiplier: Record<DeliveryChannel, number> = {
    push: 0.3,      // 30% có cài app
    sms: 0.9,       // 90% có điện thoại
    zalo: 0.4,      // 40% dùng Zalo
    loudspeaker: 0.6, // 60% sống trong vùng loa
    email: 0.2,     // 20% có email
  };

  return Math.floor(totalBase * (channelMultiplier[channel] || 0.3));
}

/** Sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// SECTION 10: ESCALATION ENGINE CLASS (Unified Interface)
// =============================================================================

/**
 * EscalationEngine - Class chính quản lý toàn bộ chuỗi leo thang.
 * Cung cấp interface đơn giản cho các component React.
 *
 * Usage:
 *   const engine = new EscalationEngine();
 *   engine.startEscalation(alert);
 *   // ... later
 *   const result = await engine.checkAndEscalate(alertId, ackStatus);
 */
export class EscalationEngine {
  private states: Map<string, EscalationState> = new Map();
  private deliveryHistory: Map<string, ChannelDeliveryResult[]> = new Map();
  private listeners: Set<(states: EscalationState[]) => void> = new Set();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /** Tải trạng thái từ localStorage */
  private loadFromStorage(): void {
    const saved = loadEscalationStates();
    for (const state of saved) {
      this.states.set(state.alertId, state);
    }
  }

  /** Lưu trạng thái vào localStorage */
  private saveToStorage(): void {
    const states = Array.from(this.states.values());
    saveEscalationStates(states);
  }

  /** Đăng ký listener để theo dõi thay đổi trạng thái */
  onStateChange(listener: (states: EscalationState[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Thông báo cho tất cả listeners */
  private notifyListeners(): void {
    const states = Array.from(this.states.values());
    for (const listener of this.listeners) {
      listener(states);
    }
  }

  /** Bắt đầu chuỗi leo thang cho một cảnh báo */
  startEscalation(alert: Alert): EscalationState {
    const existing = this.states.get(alert.id);
    if (existing && !existing.isComplete) {
      return existing; // Đã có leo thang đang chạy
    }

    const state = createEscalationState(alert.id, alert.info.severity);
    this.states.set(alert.id, state);
    this.deliveryHistory.set(alert.id, []);
    this.saveToStorage();
    this.notifyListeners();

    return state;
  }

  /** Kiểm tra và thực hiện leo thang */
  async checkAndEscalate(
    alertId: string,
    alert: Alert,
    ackStatus: AckStatus,
    userPreferences: AlertUserPreferences,
    isOnline: boolean
  ): Promise<EscalationProcessResult> {
    const state = this.states.get(alertId);
    if (!state) {
      return {
        shouldEscalate: false,
        escalated: false,
        newState: createEscalationState(alertId, alert.info.severity),
        deliveryResults: [],
        channelUsed: "push",
        message: "Chưa bắt đầu leo thang",
      };
    }

    const result = await processEscalation({
      alert,
      escalationState: state,
      ackStatus,
      userPreferences,
      isOnline,
    });

    // Cập nhật state
    this.states.set(alertId, result.newState);

    // Lưu lịch sử delivery
    if (result.deliveryResults.length > 0) {
      const history = this.deliveryHistory.get(alertId) || [];
      history.push(...result.deliveryResults);
      this.deliveryHistory.set(alertId, history);
    }

    this.saveToStorage();
    this.notifyListeners();

    return result;
  }

  /** Xác nhận cảnh báo → dừng leo thang */
  acknowledge(alertId: string): void {
    const state = this.states.get(alertId);
    if (state && !state.isComplete) {
      this.states.set(alertId, acknowledgeEscalation(state));
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /** Lấy trạng thái leo thang */
  getState(alertId: string): EscalationState | undefined {
    return this.states.get(alertId);
  }

  /** Lấy tất cả trạng thái */
  getAllStates(): EscalationState[] {
    return Array.from(this.states.values());
  }

  /** Lấy lịch sử delivery */
  getDeliveryHistory(alertId: string): ChannelDeliveryResult[] {
    return this.deliveryHistory.get(alertId) || [];
  }

  /** Bắt đầu kiểm tra định kỳ */
  startPeriodicCheck(intervalMs: number = ALERT_CONFIG.ESCALATION_CHECK_INTERVAL): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      // Cleanup expired escalations
      cleanupCompletedEscalations();
      this.loadFromStorage();
    }, intervalMs);
  }

  /** Dừng kiểm tra định kỳ */
  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /** Lấy thống kê */
  getStats(): EscalationStats {
    const states = Array.from(this.states.values());
    return calculateEscalationStats(states, this.deliveryHistory);
  }

  /** Xóa tất cả trạng thái */
  clearAll(): void {
    this.states.clear();
    this.deliveryHistory.clear();
    localStorage.removeItem(STORAGE_KEYS.ESCALATION_STATES);
    this.notifyListeners();
  }

  /** Cleanup khi unmount */
  destroy(): void {
    this.stopPeriodicCheck();
    this.listeners.clear();
  }
}

// =============================================================================
// SECTION 11: QUICK ACCESS FUNCTIONS
// =============================================================================

/**
 * Kiểm tra xem một alert có cần leo thang không (quick check).
 * Dùng cho UI badge/indicator.
 */
export function needsEscalation(alertId: string): boolean {
  const states = loadEscalationStates();
  const state = states.find((s) => s.alertId === alertId);
  if (!state) return false;

  return !state.isComplete && state.currentLevel < state.steps.length;
}

/**
 * Lấy cấp leo thang hiện tại của một alert.
 */
export function getCurrentEscalationLevel(alertId: string): number {
  const states = loadEscalationStates();
  const state = states.find((s) => s.alertId === alertId);
  return state?.currentLevel || 0;
}

/**
 * Lấy kênh hiện tại đang sử dụng cho một alert.
 */
export function getCurrentChannel(alertId: string): DeliveryChannel | null {
  const states = loadEscalationStates();
  const state = states.find((s) => s.alertId === alertId);
  if (!state) return null;

  const currentStep = state.steps[state.currentLevel - 1];
  return currentStep?.channel || null;
}

/**
 * Tạo mô tả ngắn gọn cho UI.
 */
export function getEscalationBadge(alertId: string): {
  text: string;
  color: string;
  icon: string;
} | null {
  const states = loadEscalationStates();
  const state = states.find((s) => s.alertId === alertId);
  if (!state || state.isComplete) return null;

  const currentStep = state.steps[state.currentLevel - 1];
  if (!currentStep) return null;

  const channelConfig = DELIVERY_CHANNEL_CONFIG[currentStep.channel];

  return {
    text: `Cấp ${state.currentLevel}/${state.steps.length}`,
    color: channelConfig.color,
    icon: channelConfig.icon,
  };
}
