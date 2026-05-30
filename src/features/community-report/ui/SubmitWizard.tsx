"use client";

import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  MapPin,
  Loader2,
  CheckCircle,
  Camera,
  User,
  AlertTriangle,
  Waves,
  Wind,
  Mountain,
  Sun,
  CircleDot,
  Navigation,
} from "lucide-react";
import clsx from "clsx";
import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  WizardFormData,
  WizardStep,
  SubmitWizardProps,
} from "../lib/types";
import {
  DISASTER_CONFIG,
  SEVERITY_CONFIG,
  WIZARD_STEPS,
  PROVINCE_LIST,
  REPORT_TEMPLATES,
  REPORT_CONFIG,
} from "../config/report-config";
import { validateStep } from "../lib/validation";
import { useReportSubmit, useGeolocation, usePhotoUpload, useAutoSave } from "../lib/use-report-hooks";

// ============================================================
// SUBMIT WIZARD COMPONENT
// ============================================================
// Wizard 6 bước gửi báo cáo thiên tai
// Step 1: Chọn loại thiên tai (6 loại)
// Step 2: Vị trí (GPS + province + district + address)
// Step 3: Chi tiết (title + severity + description)
// Step 4: Ảnh chụp (drag & drop + preview)
// Step 5: Liên hệ (anonymous toggle + name + phone)
// Step 6: Xác nhận (summary + checkbox)
// ============================================================

// === ANIMATION VARIANTS ===

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const wizardVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, damping: 25, stiffness: 200 },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, damping: 25, stiffness: 200 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, damping: 15, stiffness: 200 },
  },
};

// === DEFAULT WIZARD DATA ===

function createDefaultData(): WizardFormData {
  return {
    type: null,
    location: {
      lat: null,
      lng: null,
      province: "",
      district: "",
      address: "",
      useGPS: false,
    },
    title: "",
    description: "",
    severity: "medium",
    photos: [],
    reporter: {
      isAnonymous: true,
      name: "",
      phone: "",
    },
    confirmed: false,
  };
}

// === MAIN COMPONENT ===

function SubmitWizardComponent({
  isOpen,
  onClose,
  onSubmit,
}: SubmitWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [data, setData] = useState<WizardFormData>(createDefaultData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Hooks
  const { submit, isSubmitting, submitProgress, submitError } = useReportSubmit();
  const { position, isLoading: geoLoading, error: geoError, getCurrentPosition, reverseGeocode } = useGeolocation();
  const { photos, addPhotos, removePhoto, isProcessing: photoProcessing } = usePhotoUpload();
  const { lastSaved, save: saveDraft } = useAutoSave(data, isOpen);

  // Update data.photos when photos change
  useEffect(() => {
    setData((prev) => ({ ...prev, photos }));
  }, [photos]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const result = validateStep(currentStep, data);
    setErrors(result.errors);
    setWarnings(result.warnings);
    return result.isValid;
  }, [currentStep, data]);

  // Go to next step
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    if (currentStep < 6) {
      setDirection(1);
      setCurrentStep((prev) => (prev + 1) as WizardStep);
      setErrors({});
      setWarnings({});
    }
  }, [currentStep, validateCurrentStep]);

  // Go to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      setErrors({});
      setWarnings({});
    }
  }, [currentStep]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;
    const success = await submit(data);
    if (success) {
      setShowSuccess(true);
    }
  }, [data, submit, validateCurrentStep]);

  // Handle GPS
  const handleGetGPS = useCallback(async () => {
    await getCurrentPosition();
  }, [getCurrentPosition]);

  // Update position when GPS resolves
  useEffect(() => {
    if (position) {
      setData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          lat: position.lat,
          lng: position.lng,
          useGPS: true,
        },
      }));

      // Reverse geocode
      reverseGeocode(position.lat, position.lng).then((result) => {
        if (result.province || result.district) {
          setData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              province: result.province || prev.location.province,
              district: result.district || prev.location.district,
              address: result.address || prev.location.address,
            },
          }));
        }
      });
    }
  }, [position, reverseGeocode]);

  // Update data field
  const updateData = useCallback(
    (updates: Partial<WizardFormData>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Update location field
  const updateLocation = useCallback(
    (updates: Partial<WizardFormData["location"]>) => {
      setData((prev) => ({
        ...prev,
        location: { ...prev.location, ...updates },
      }));
    },
    []
  );

  // Update reporter field
  const updateReporter = useCallback(
    (updates: Partial<WizardFormData["reporter"]>) => {
      setData((prev) => ({
        ...prev,
        reporter: { ...prev.reporter, ...updates },
      }));
    },
    []
  );

  // Use template
  const useTemplate = useCallback(
    (templateId: string) => {
      const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const province = data.location.province || "Đà Nẵng";
      setData((prev) => ({
        ...prev,
        type: template.type,
        templateId: template.id,
        title: template.titleTemplate.replace("{location}", province),
        description: template.descriptionTemplate,
        severity: template.severityHint,
      }));
    },
    [data.location.province]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Wizard */}
          <motion.div
            variants={wizardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-white border-t border-slate-200 rounded-t-2xl shadow-2xl shadow-black/10 overflow-hidden flex flex-col"
          >
            {/* === WIZARD HEADER === */}
            <WizardHeader
              currentStep={currentStep}
              isSubmitting={isSubmitting}
              onClose={onClose}
            />

            {/* === WIZARD CONTENT === */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {/* Step 1: Disaster Type */}
                  {currentStep === 1 && (
                    <Step1DisasterType
                      data={data}
                      errors={errors}
                      onSelectType={(type) => updateData({ type })}
                      onUseTemplate={useTemplate}
                    />
                  )}

                  {/* Step 2: Location */}
                  {currentStep === 2 && (
                    <Step2Location
                      data={data}
                      errors={errors}
                      warnings={warnings}
                      geoLoading={geoLoading}
                      geoError={geoError}
                      onGetGPS={handleGetGPS}
                      onUpdateLocation={updateLocation}
                    />
                  )}

                  {/* Step 3: Details */}
                  {currentStep === 3 && (
                    <Step3Details
                      data={data}
                      errors={errors}
                      warnings={warnings}
                      onUpdate={updateData}
                    />
                  )}

                  {/* Step 4: Photos */}
                  {currentStep === 4 && (
                    <Step4Photos
                      photos={photos}
                      errors={errors}
                      warnings={warnings}
                      isProcessing={photoProcessing}
                      onAddPhotos={addPhotos}
                      onRemovePhoto={removePhoto}
                    />
                  )}

                  {/* Step 5: Contact */}
                  {currentStep === 5 && (
                    <Step5Contact
                      data={data}
                      errors={errors}
                      warnings={warnings}
                      onUpdateReporter={updateReporter}
                    />
                  )}

                  {/* Step 6: Review */}
                  {currentStep === 6 && (
                    <Step6Review
                      data={data}
                      errors={errors}
                      isSubmitting={isSubmitting}
                      submitProgress={submitProgress}
                      submitError={submitError}
                      onConfirm={(confirmed) => updateData({ confirmed })}
                      onSubmit={handleSubmit}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* === WIZARD NAVIGATION === */}
            {!showSuccess && (
              <WizardNavigation
                currentStep={currentStep}
                isSubmitting={isSubmitting}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
              />
            )}

            {/* === SUCCESS OVERLAY === */}
            <AnimatePresence>
              {showSuccess && (
                <SuccessOverlay reportNumber={`#${Date.now().toString(36).slice(-6).toUpperCase()}`} onClose={onClose} />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// === SUB-COMPONENTS ===

/**
 * Wizard Header: Step indicator + close button
 */
function WizardHeader({
  currentStep,
  isSubmitting,
  onClose,
}: {
  currentStep: WizardStep;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex-shrink-0 border-b border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Gửi báo cáo thiên tai
        </h2>
        <button
          onClick={isSubmitting ? undefined : onClose}
          disabled={isSubmitting}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {WIZARD_STEPS.map((step) => (
          <div key={step.step} className="flex items-center flex-1">
            {/* Step dot */}
            <div
              className={clsx(
                "flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all",
                currentStep === step.step
                  ? "bg-blue-500 text-white scale-110"
                  : currentStep > step.step
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-slate-700/50 text-slate-500 border border-slate-600/30"
              )}
            >
              {currentStep > step.step ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                step.step
              )}
            </div>
            {/* Step label (hidden on mobile) */}
            <span
              className={clsx(
                "hidden sm:inline text-[10px] ml-1.5 truncate",
                currentStep === step.step
                  ? "text-blue-400 font-medium"
                  : currentStep > step.step
                    ? "text-green-400"
                    : "text-slate-600"
              )}
            >
              {step.label}
            </span>
            {/* Progress line */}
            {step.step < 6 && (
              <div
                className={clsx(
                  "flex-1 h-0.5 mx-1 rounded-full transition-colors",
                  currentStep > step.step ? "bg-green-500/30" : "bg-slate-700/30"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Step 1: Disaster Type Selection (6 types + templates)
 */
function Step1DisasterType({
  data,
  errors,
  onSelectType,
  onUseTemplate,
}: {
  data: WizardFormData;
  errors: Record<string, string>;
  onSelectType: (type: DisasterType) => void;
  onUseTemplate: (templateId: string) => void;
}) {
  const disasterTypes: DisasterType[] = [
    "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Chọn loại thiên tai
        </h3>
        <p className="text-sm text-slate-500">
          Chọn loại thiên tai bạn muốn báo cáo
        </p>
      </div>

      {/* Error */}
      {errors.type && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {errors.type}
        </p>
      )}

      {/* 6 type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {disasterTypes.map((type) => {
          const config = DISASTER_CONFIG[type];
          const isSelected = data.type === type;

          return (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className={clsx(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                isSelected
                  ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30"
                  : "border-slate-200 bg-slate-100 hover:border-slate-600/70 hover:bg-slate-200"
              )}
            >
              <span className="text-3xl">{config.icon}</span>
              <span
                className={clsx(
                  "text-sm font-medium",
                  isSelected ? "text-blue-400" : "text-slate-700"
                )}
              >
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick templates */}
      <div>
        <h4 className="text-xs font-medium text-slate-500 mb-2">
          Hoặc sử dụng mẫu nhanh:
        </h4>
        <div className="flex flex-wrap gap-2">
          {REPORT_TEMPLATES.filter((t) => !data.type || t.type === data.type).map(
            (template) => (
              <button
                key={template.id}
                onClick={() => onUseTemplate(template.id)}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors",
                  "border-slate-200 bg-slate-100 text-slate-500",
                  "hover:border-slate-600/70 hover:text-slate-700"
                )}
              >
                <span>{template.icon}</span>
                <span>{template.name}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2: Location (GPS + Province + District + Address)
 */
function Step2Location({
  data,
  errors,
  warnings,
  geoLoading,
  geoError,
  onGetGPS,
  onUpdateLocation,
}: {
  data: WizardFormData;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  geoLoading: boolean;
  geoError: string | null;
  onGetGPS: () => void;
  onUpdateLocation: (updates: Partial<WizardFormData["location"]>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Vị trí thiên tai
        </h3>
        <p className="text-sm text-slate-500">
          Chọn vị trí trên bản đồ hoặc sử dụng GPS
        </p>
      </div>

      {/* GPS Button */}
      <button
        onClick={onGetGPS}
        disabled={geoLoading}
        className={clsx(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors",
          "border-blue-500/30 bg-blue-500/10 text-blue-400",
          "hover:bg-blue-500/20 disabled:opacity-50"
        )}
      >
        {geoLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5" />
        )}
        {geoLoading ? "Đang xác định vị trí..." : "Sử dụng GPS hiện tại"}
      </button>

      {geoError && (
        <p className="text-sm text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {geoError}
        </p>
      )}

      {/* Province select */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Tỉnh/Thành phố *
        </label>
        <select
          value={data.location.province}
          onChange={(e) =>
            onUpdateLocation({ province: e.target.value, district: "" })
          }
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
            errors.province ? "border-red-500/50" : "border-slate-200"
          )}
        >
          <option value="">Chọn tỉnh/thành phố</option>
          {PROVINCE_LIST.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
        {errors.province && (
          <p className="text-xs text-red-400 mt-1">{errors.province}</p>
        )}
      </div>

      {/* District input */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Quận/Huyện *
        </label>
        <input
          type="text"
          value={data.location.district}
          onChange={(e) => onUpdateLocation({ district: e.target.value })}
          placeholder="Nhập quận/huyện"
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800 placeholder:text-slate-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
            errors.district ? "border-red-500/50" : "border-slate-200"
          )}
        />
        {errors.district && (
          <p className="text-xs text-red-400 mt-1">{errors.district}</p>
        )}
      </div>

      {/* Address input */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Địa chỉ chi tiết *
        </label>
        <textarea
          value={data.location.address}
          onChange={(e) => onUpdateLocation({ address: e.target.value })}
          placeholder="Số nhà, tên đường, phường/xã..."
          rows={2}
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800 placeholder:text-slate-600 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
            errors.address ? "border-red-500/50" : "border-slate-200"
          )}
        />
        {errors.address && (
          <p className="text-xs text-red-400 mt-1">{errors.address}</p>
        )}
        {warnings.address && (
          <p className="text-xs text-amber-400 mt-1">{warnings.address}</p>
        )}
      </div>

      {/* Coordinates display */}
      {data.location.lat && data.location.lng && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          <span>
            {data.location.lat.toFixed(4)}°N, {data.location.lng.toFixed(4)}°E
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Step 3: Details (Title + Severity + Description)
 */
function Step3Details({
  data,
  errors,
  warnings,
  onUpdate,
}: {
  data: WizardFormData;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  onUpdate: (updates: Partial<WizardFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Chi tiết thiên tai
        </h3>
        <p className="text-sm text-slate-500">
          Mô tả tình hình thiên tai bạn đang gặp phải
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Tiêu đề *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Ví dụ: Lũ lụt nghiêm trọng tại quận Hải Châu"
          maxLength={REPORT_CONFIG.MAX_TITLE_LENGTH}
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800 placeholder:text-slate-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
            errors.title ? "border-red-500/50" : "border-slate-200"
          )}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title ? (
            <p className="text-xs text-red-400">{errors.title}</p>
          ) : warnings.title ? (
            <p className="text-xs text-amber-400">{warnings.title}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-600">
            {data.title.length}/{REPORT_CONFIG.MAX_TITLE_LENGTH}
          </span>
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Mức độ nghiêm trọng *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["low", "medium", "high", "critical"] as SeverityLevel[]).map(
            (severity) => {
              const config = SEVERITY_CONFIG[severity];
              const isSelected = data.severity === severity;

              return (
                <button
                  key={severity}
                  onClick={() => onUpdate({ severity })}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                    isSelected
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-600/70"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              );
            }
          )}
        </div>
        {errors.severity && (
          <p className="text-xs text-red-400 mt-1">{errors.severity}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Mô tả chi tiết *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Mô tả tình hình thiên tai: mức độ thiệt hại, ảnh hưởng đến người dân, tình trạng giao thông..."
          rows={5}
          maxLength={REPORT_CONFIG.MAX_DESCRIPTION_LENGTH}
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800 placeholder:text-slate-600 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
            errors.description ? "border-red-500/50" : "border-slate-200"
          )}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-400">{errors.description}</p>
          ) : warnings.description ? (
            <p className="text-xs text-amber-400">{warnings.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-600">
            {data.description.length}/{REPORT_CONFIG.MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 4: Photos (Drag & Drop + Preview)
 */
function Step4Photos({
  photos,
  errors,
  warnings,
  isProcessing,
  onAddPhotos,
  onRemovePhoto,
}: {
  photos: any[];
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isProcessing: boolean;
  onAddPhotos: (files: FileList | File[]) => Promise<void>;
  onRemovePhoto: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        onAddPhotos(e.dataTransfer.files);
      }
    },
    [onAddPhotos]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onAddPhotos(e.target.files);
      }
    },
    [onAddPhotos]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Ảnh chụp thiên tai
        </h3>
        <p className="text-sm text-slate-500">
          Thêm ảnh để tăng độ tin cậy (tối đa {REPORT_CONFIG.MAX_PHOTOS} ảnh)
        </p>
      </div>

      {/* Warnings */}
      {warnings.photos && (
        <p className="text-sm text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {warnings.photos}
        </p>
      )}
      {errors.photos && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {errors.photos}
        </p>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={clsx(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          "border-slate-200 hover:border-slate-600/70",
          "bg-slate-50"
        )}
      >
        <Camera className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500 mb-2">
          Kéo thả ảnh vào đây hoặc
        </p>
        <label
          className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors",
            "bg-slate-700/50 border border-slate-600/30 text-slate-700",
            "hover:bg-slate-600/50"
          )}
        >
          <Camera className="w-4 h-4" />
          Chọn ảnh
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        <p className="text-xs text-slate-600 mt-2">
          JPEG, PNG, WebP · Tối đa 5MB/ảnh
        </p>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang xử lý ảnh...
        </div>
      )}

      {/* Photo preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden bg-slate-200"
            >
              <img
                src={photo.thumbnail}
                alt="Preview"
                className="w-full h-24 object-cover"
              />
              {/* Remove button */}
              <button
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Size indicator */}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-black/60 text-[10px] text-white/70">
                {(photo.compressedSize / 1024).toFixed(0)}KB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Step 5: Contact (Anonymous toggle + Name + Phone)
 */
function Step5Contact({
  data,
  errors,
  warnings,
  onUpdateReporter,
}: {
  data: WizardFormData;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  onUpdateReporter: (updates: Partial<WizardFormData["reporter"]>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Thông tin liên hệ
        </h3>
        <p className="text-sm text-slate-500">
          Cung cấp thông tin để cơ quan chức năng liên hệ khi cần
        </p>
      </div>

      {/* Anonymous toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-700">Ẩn danh</p>
            <p className="text-xs text-slate-500">
              Không hiển thị tên trong báo cáo
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            onUpdateReporter({ isAnonymous: !data.reporter.isAnonymous })
          }
          className={clsx(
            "relative w-11 h-6 rounded-full transition-colors",
            data.reporter.isAnonymous ? "bg-blue-500" : "bg-slate-600"
          )}
        >
          <motion.div
            animate={{ x: data.reporter.isAnonymous ? 22 : 2 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
      </div>

      {warnings.anonymous && (
        <p className="text-xs text-amber-400">{warnings.anonymous}</p>
      )}

      {/* Name input (if not anonymous) */}
      <AnimatePresence>
        {!data.reporter.isAnonymous && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={data.reporter.name}
                  onChange={(e) => onUpdateReporter({ name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className={clsx(
                    "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800 placeholder:text-slate-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
                    errors.name ? "border-red-500/50" : "border-slate-200"
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={data.reporter.phone}
                  onChange={(e) => onUpdateReporter({ phone: e.target.value })}
                  placeholder="0912345678"
                  className={clsx(
                    "w-full px-3 py-2.5 rounded-lg bg-slate-200 border text-sm text-slate-800 placeholder:text-slate-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors",
                    errors.phone ? "border-red-500/50" : "border-slate-200"
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                )}
                {warnings.phone && (
                  <p className="text-xs text-amber-400 mt-1">{warnings.phone}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Step 6: Review (Summary + Confirm + Submit)
 */
function Step6Review({
  data,
  errors,
  isSubmitting,
  submitProgress,
  submitError,
  onConfirm,
  onSubmit,
}: {
  data: WizardFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  submitProgress: number;
  submitError: string | null;
  onConfirm: (confirmed: boolean) => void;
  onSubmit: () => void;
}) {
  const disasterConfig = data.type ? DISASTER_CONFIG[data.type] : null;
  const severityConfig = SEVERITY_CONFIG[data.severity];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Xác nhận thông tin
        </h3>
        <p className="text-sm text-slate-500">
          Kiểm tra lại thông tin trước khi gửi
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 space-y-3">
        {/* Type + Title */}
        <div className="flex items-start gap-2">
          {disasterConfig && (
            <span className="text-2xl">{disasterConfig.icon}</span>
          )}
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              {data.title || "(Chưa có tiêu đề)"}
            </h4>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1"
              style={{
                color: severityConfig.color,
                backgroundColor: `${severityConfig.color}10`,
                borderColor: `${severityConfig.color}30`,
              }}
            >
              {severityConfig.label}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3 h-3" />
          <span>
            {data.location.address}, {data.location.district},{" "}
            {data.location.province}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 line-clamp-3">
          {data.description || "(Chưa có mô tả)"}
        </p>

        {/* Photos */}
        {data.photos.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Camera className="w-3 h-3" />
            <span>{data.photos.length} ảnh đính kèm</span>
          </div>
        )}

        {/* Reporter */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span>
            {data.reporter.isAnonymous
              ? "Ẩn danh"
              : data.reporter.name || "(Chưa có tên)"}
          </span>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-100 border border-slate-200 cursor-pointer hover:bg-slate-700/30 transition-colors">
        <input
          type="checkbox"
          checked={data.confirmed}
          onChange={(e) => onConfirm(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-200 text-blue-500 focus:ring-blue-500/50"
        />
        <div>
          <p className="text-sm text-slate-700">
            Tôi xác nhận thông tin trên là chính xác
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Báo cáo sẽ được gửi đến cộng đồng để xác minh
          </p>
        </div>
      </label>
      {errors.confirmed && (
        <p className="text-xs text-red-400">{errors.confirmed}</p>
      )}

      {/* Submit progress */}
      {isSubmitting && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang gửi báo cáo...
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${submitProgress}%` }}
              className="h-full rounded-full bg-blue-500"
            />
          </div>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {submitError}
        </p>
      )}
    </div>
  );
}

/**
 * Wizard Navigation: Back + Next/Submit buttons
 */
function WizardNavigation({
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}: {
  currentStep: WizardStep;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex-shrink-0 border-t border-slate-200 p-4">
      <div className="flex items-center gap-3">
        {/* Back button */}
        {currentStep > 1 && (
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors",
              "bg-slate-700/50 border border-slate-600/30 text-slate-500",
              "hover:bg-slate-600/50 hover:text-slate-700 disabled:opacity-50"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Next / Submit button */}
        {currentStep < 6 ? (
          <button
            onClick={onNext}
            className={clsx(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            Tiếp theo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={clsx(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Success Overlay: Checkmark animation
 */
function SuccessOverlay({
  reportNumber,
  onClose,
}: {
  reportNumber: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      variants={successVariants}
      initial="hidden"
      animate="visible"
      className="absolute inset-0 z-20 bg-white/95 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring" as const, damping: 15, stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-10 h-10 text-green-400" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-semibold text-slate-800 mb-2"
      >
        Báo cáo đã gửi thành công!
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-slate-500 mb-8 text-center max-w-md"
      >
        Cảm ơn bạn đã đóng góp. Báo cáo sẽ được cộng đồng xác minh.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onClose}
        className={clsx(
          "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "bg-slate-700/50 border border-slate-600/30 text-slate-700",
          "hover:bg-slate-600/50"
        )}
      >
        Đóng
      </motion.button>
    </motion.div>
  );
}

// Export memoized component
export const SubmitWizard = memo(SubmitWizardComponent);
