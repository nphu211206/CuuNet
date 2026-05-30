"use client";

// =============================================================================
// SOS PANEL - Emergency SOS 1-Touch Submission
// Module Cảnh Báo & SOS Thiên Tai - CứuNet
//
// Multi-step SOS wizard:
//   Step 1: Big SOS button + situation type selector (10 types)
//   Step 2: Emergency level + people count + special needs
//   Step 3: GPS capture + contact info + description
//   Step 4: Confirmation → Submit
//
// Features:
//   - Giant pulsing SOS button (32px+ diameter)
//   - GPS auto-capture with accuracy indicator
//   - People count stepper with +/- buttons
//   - Special needs toggles (children, elderly, disabled, trapped, medical)
//   - Framer Motion step transitions (directional slide)
//   - Glassmorphism dark theme
//   - Offline indicator
// =============================================================================

import { useState, useCallback, useMemo, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren,
  MapPin,
  Users,
  Phone,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Baby,
  PersonStanding,
  Accessibility,
  Link2,
  Heart,
  FileText,
  Wifi,
  WifiOff,
  Shield,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import type {
  SOSPanelProps,
  SOSType,
  SOSEmergencyLevel,
  SOSLocation,
  SOSContact,
  SOSSituation,
} from "../lib/types";
import {
  SOS_TYPE_CONFIG,
  SOS_EMERGENCY_LEVEL_CONFIG,
} from "../config/alert-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 200,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

const sosButtonVariants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
  tap: { scale: 0.95 },
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

// =============================================================================
// STEP INDICATOR SUB-COMPONENT
// =============================================================================

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const stepLabels = ["Tình huống", "Chi tiết", "Vị trí", "Xác nhận"];

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: i === currentStep ? 1.1 : 1,
              backgroundColor:
                i < currentStep
                  ? "#22C55E"
                  : i === currentStep
                    ? "#DC2626"
                    : "rgba(100,116,139,0.3)",
            }}
            className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "text-xs font-bold transition-colors",
              i <= currentStep ? "text-white" : "text-slate-500"
            )}
          >
            {i < currentStep ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              i + 1
            )}
          </motion.div>
          {i < totalSteps - 1 && (
            <div
              className={clsx(
                "w-8 h-0.5 rounded-full transition-colors",
                i < currentStep ? "bg-green-500" : "bg-slate-700"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// GPS INDICATOR SUB-COMPONENT
// =============================================================================

function GPSIndicator({
  location,
  isCapturing,
  onCapture,
}: {
  location: SOSLocation | null;
  isCapturing: boolean;
  onCapture: () => void;
}) {
  const accuracyColor = useMemo(() => {
    if (!location) return "#6B7280";
    if (location.accuracy <= 10) return "#22C55E";
    if (location.accuracy <= 50) return "#F59E0B";
    return "#EF4444";
  }, [location]);

  const accuracyLabel = useMemo(() => {
    if (!location) return "Chưa có";
    if (location.accuracy <= 10) return "Rất chính xác";
    if (location.accuracy <= 50) return "Chính xác";
    return "Tương đối";
  }, [location]);

  return (
    <div
      className={clsx(
        "rounded-xl p-4 border",
        location
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-slate-100 border-slate-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isCapturing && "animate-pulse"
            )}
            style={{
              backgroundColor: location ? `${accuracyColor}20` : "rgba(100,116,139,0.15)",
              color: location ? accuracyColor : "#6B7280",
            }}
          >
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              {location ? "GPS đã xác định" : "Đang lấy vị trí..."}
            </p>
            {location && (
              <p className="text-xs text-slate-500 mt-0.5">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                <span className="ml-2" style={{ color: accuracyColor }}>
                  ±{Math.round(location.accuracy)}m
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {location && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${accuracyColor}20`,
                color: accuracyColor,
              }}
            >
              {accuracyLabel}
            </span>
          )}
          <button
            onClick={onCapture}
            disabled={isCapturing}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              "transition-all duration-200",
              location
                ? "bg-slate-700/50 text-slate-700 hover:bg-slate-700/70"
                : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
              "disabled:opacity-50"
            )}
          >
            {isCapturing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : location ? (
              "Lấy lại"
            ) : (
              "Lấy GPS"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PEOPLE COUNT STEPPER
// =============================================================================

function PeopleCountStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-slate-100 border border-slate-200",
          "text-slate-700 hover:bg-slate-200 hover:text-white",
          "transition-all duration-200",
          "disabled:opacity-30"
        )}
        disabled={value <= 1}
      >
        -
      </button>
      <div className="text-center">
        <span className="text-3xl font-black text-white tabular-nums">{value}</span>
        <p className="text-[10px] text-slate-500 mt-0.5">người</p>
      </div>
      <button
        onClick={() => onChange(Math.min(50, value + 1))}
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-slate-100 border border-slate-200",
          "text-slate-700 hover:bg-slate-200 hover:text-white",
          "transition-all duration-200",
          "disabled:opacity-30"
        )}
        disabled={value >= 50}
      >
        +
      </button>
    </div>
  );
}

// =============================================================================
// TOGGLE CHIP SUB-COMPONENT
// =============================================================================

function ToggleChip({
  icon,
  label,
  active,
  onToggle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "border transition-all duration-200",
        active
          ? "border-opacity-50"
          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
      )}
      style={
        active
          ? {
              backgroundColor: `${color}15`,
              borderColor: `${color}50`,
              color: color,
            }
          : undefined
      }
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SOSPanelComponent({ onSubmit, isSubmitting, className }: SOSPanelProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const totalSteps = 4;

  // Form state
  const [sosType, setSosType] = useState<SOSType | null>(null);
  const [emergencyLevel, setEmergencyLevel] = useState<SOSEmergencyLevel>("urgent");
  const [peopleCount, setPeopleCount] = useState(1);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElderly, setHasElderly] = useState(false);
  const [hasDisabled, setHasDisabled] = useState(false);
  const [isTrapped, setIsTrapped] = useState(false);
  const [needsMedical, setNeedsMedical] = useState(false);
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState<SOSLocation | null>(null);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Detect online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-capture GPS on mount
  useEffect(() => {
    captureGPS();
  }, []);

  const captureGPS = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    setIsCapturingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
        });
        setIsCapturingGPS(false);
      },
      () => {
        setIsCapturingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return sosType !== null;
      case 1:
        return true;
      case 2:
        return location !== null;
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, sosType, location]);

  const handleSubmit = useCallback(() => {
    if (!sosType || !location) return;

    const situation: SOSSituation = {
      type: sosType,
      severity: emergencyLevel,
      peopleCount,
      description: description || undefined,
      hasChildren,
      hasElderly,
      hasDisabled,
      isTrapped,
      needsMedical,
    };

    const contact: SOSContact = {
      name: contactName || undefined,
      phone: contactPhone || undefined,
    };

    onSubmit({ ...situation, location, contact });
  }, [
    sosType,
    emergencyLevel,
    peopleCount,
    description,
    hasChildren,
    hasElderly,
    hasDisabled,
    isTrapped,
    needsMedical,
    contactName,
    contactPhone,
    location,
    onSubmit,
  ]);

  const sosTypes = useMemo(() => {
    return (Object.entries(SOS_TYPE_CONFIG) as [SOSType, typeof SOS_TYPE_CONFIG[SOSType]][]).filter(
      ([key]) => key !== "other"
    );
  }, []);

  const emergencyLevels = useMemo(() => {
    return Object.entries(SOS_EMERGENCY_LEVEL_CONFIG) as [
      SOSEmergencyLevel,
      (typeof SOS_EMERGENCY_LEVEL_CONFIG)[SOSEmergencyLevel]
    ][];
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={clsx("space-y-4", className)}
    >
      {/* Offline warning */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl",
            "bg-amber-500/10 border border-amber-500/30"
          )}
        >
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-300">
            Offline - SOS sẽ được lưu vào hàng đợi và gửi khi có mạng
          </span>
        </motion.div>
      )}

      {/* Step indicator */}
      <StepIndicator currentStep={step} totalSteps={totalSteps} />

      {/* Step content */}
      <div className="relative overflow-hidden" style={{ minHeight: "380px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 0: Situation Type */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Bạn đang gặp tình huống gì?</h3>
                <p className="text-xs text-slate-500 mt-1">Chọn loại tình huống khẩn cấp</p>
              </div>

              {/* SOS Types Grid */}
              <div className="grid grid-cols-2 gap-2">
                {sosTypes.map(([type, config], index) => (
                  <motion.button
                    key={type}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSosType(type);
                      setEmergencyLevel(config.defaultSeverity);
                    }}
                    className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl",
                      "border transition-all duration-200",
                      sosType === type
                        ? "border-opacity-60 shadow-lg"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                    style={
                      sosType === type
                        ? {
                            backgroundColor: `${config.color}15`,
                            borderColor: `${config.color}60`,
                            boxShadow: `0 0 20px ${config.color}20`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-2xl">{config.icon}</span>
                    <div className="text-left">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: sosType === type ? config.color : "#e2e8f0" }}
                      >
                        {config.labelVi}
                      </p>
                      <p className="text-[10px] text-slate-500">{config.label}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Other option */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSosType("other");
                  setEmergencyLevel("need_help");
                }}
                className={clsx(
                  "w-full flex items-center gap-3 p-3 rounded-xl",
                  "border transition-all duration-200",
                  sosType === "other"
                    ? "bg-slate-600/15 border-slate-500/60"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <span className="text-2xl">❓</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">Tình huống khác</p>
                  <p className="text-[10px] text-slate-500">Other</p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* STEP 1: Emergency Level + People Count */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Mức độ nghiêm trọng</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {sosType && SOS_TYPE_CONFIG[sosType].icon} {sosType && SOS_TYPE_CONFIG[sosType].labelVi}
                </p>
              </div>

              {/* Emergency Level */}
              <div className="space-y-2">
                {emergencyLevels.map(([level, config]) => (
                  <motion.button
                    key={level}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEmergencyLevel(level)}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl",
                      "border transition-all duration-200",
                      emergencyLevel === level
                        ? "shadow-lg"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                    style={
                      emergencyLevel === level
                        ? {
                            backgroundColor: `${config.color}15`,
                            borderColor: `${config.color}50`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-xl">{config.icon}</span>
                    <div className="text-left flex-1">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: emergencyLevel === level ? config.color : "#e2e8f0" }}
                      >
                        {config.labelVi}
                      </p>
                      <p className="text-[10px] text-slate-500">{config.label}</p>
                    </div>
                    {emergencyLevel === level && (
                      <CheckCircle2 className="w-5 h-5" style={{ color: config.color }} />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* People Count */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Số người cần cứu</p>
                    <p className="text-[10px] text-slate-500">Bao gồm cả bạn</p>
                  </div>
                </div>
                <PeopleCountStepper value={peopleCount} onChange={setPeopleCount} />
              </div>

              {/* Special Needs */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">Tình trạng đặc biệt:</p>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip
                    icon={<Baby className="w-3.5 h-3.5" />}
                    label="Có trẻ em"
                    active={hasChildren}
                    onToggle={() => setHasChildren(!hasChildren)}
                    color="#F59E0B"
                  />
                  <ToggleChip
                    icon={<PersonStanding className="w-3.5 h-3.5" />}
                    label="Có người già"
                    active={hasElderly}
                    onToggle={() => setHasElderly(!hasElderly)}
                    color="#8B5CF6"
                  />
                  <ToggleChip
                    icon={<Accessibility className="w-3.5 h-3.5" />}
                    label="Có người khuyết tật"
                    active={hasDisabled}
                    onToggle={() => setHasDisabled(!hasDisabled)}
                    color="#06B6D4"
                  />
                  <ToggleChip
                    icon={<Link2 className="w-3.5 h-3.5" />}
                    label="Mắc kẹt"
                    active={isTrapped}
                    onToggle={() => setIsTrapped(!isTrapped)}
                    color="#EF4444"
                  />
                  <ToggleChip
                    icon={<Heart className="w-3.5 h-3.5" />}
                    label="Cần cấp cứu"
                    active={needsMedical}
                    onToggle={() => setNeedsMedical(!needsMedical)}
                    color="#22C55E"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: GPS + Contact + Description */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Vị trí & Liên hệ</h3>
                <p className="text-xs text-slate-500 mt-1">Xác định vị trí và thông tin liên hệ</p>
              </div>

              {/* GPS */}
              <GPSIndicator
                location={location}
                isCapturing={isCapturingGPS}
                onCapture={captureGPS}
              />

              {/* Contact Info */}
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Thông tin liên hệ (tùy chọn)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Họ tên"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className={clsx(
                      "px-3 py-2.5 rounded-xl text-sm",
                      "bg-slate-100 border border-slate-200",
                      "text-slate-800 placeholder-slate-600",
                      "focus:outline-none focus:border-blue-500/50",
                      "transition-colors"
                    )}
                  />
                  <input
                    type="tel"
                    placeholder="Số điện thoại"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={clsx(
                      "px-3 py-2.5 rounded-xl text-sm",
                      "bg-slate-100 border border-slate-200",
                      "text-slate-800 placeholder-slate-600",
                      "focus:outline-none focus:border-blue-500/50",
                      "transition-colors"
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Mô tả tình huống (tùy chọn)
                </p>
                <textarea
                  placeholder="Mô tả ngắn gọn tình huống của bạn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={clsx(
                    "w-full px-3 py-2.5 rounded-xl text-sm resize-none",
                    "bg-slate-100 border border-slate-200",
                    "text-slate-800 placeholder-slate-600",
                    "focus:outline-none focus:border-blue-500/50",
                    "transition-colors"
                  )}
                />
                <p className="text-[10px] text-slate-600 text-right">
                  {description.length}/500
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Xác nhận gửi SOS</h3>
                <p className="text-xs text-slate-500 mt-1">Kiểm tra thông tin trước khi gửi</p>
              </div>

              {/* Summary Card */}
              <div className="rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                {/* Type Header */}
                {sosType && (
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ backgroundColor: `${SOS_TYPE_CONFIG[sosType].color}15` }}
                  >
                    <span className="text-2xl">{SOS_TYPE_CONFIG[sosType].icon}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: SOS_TYPE_CONFIG[sosType].color }}>
                        {SOS_TYPE_CONFIG[sosType].labelVi}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {SOS_EMERGENCY_LEVEL_CONFIG[emergencyLevel].labelVi}
                      </p>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Số người</span>
                    <span className="text-xs font-medium text-slate-800">{peopleCount} người</span>
                  </div>

                  {location && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Vị trí GPS</span>
                      <span className="text-xs font-medium text-slate-800">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {(hasChildren || hasElderly || hasDisabled || isTrapped || needsMedical) && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-slate-500">Đặc biệt</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {hasChildren && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Trẻ em
                          </span>
                        )}
                        {hasElderly && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                            Người già
                          </span>
                        )}
                        {hasDisabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                            Khuyết tật
                          </span>
                        )}
                        {isTrapped && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                            Mắc kẹt
                          </span>
                        )}
                        {needsMedical && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                            Cấp cứu
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {contactName && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Liên hệ</span>
                      <span className="text-xs font-medium text-slate-800">
                        {contactName} {contactPhone && `• ${contactPhone}`}
                      </span>
                    </div>
                  )}

                  {description && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500">{description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-300/80">
                  SOS sẽ được gửi đến đội cứu hộ. Chỉ sử dụng khi thực sự cần thiết.
                  {!isOnline && " Thiết bị đang offline - SOS sẽ được gửi khi có mạng."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {step > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goPrev}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 rounded-xl",
              "bg-slate-100 border border-slate-200",
              "text-slate-700 hover:text-white hover:border-slate-600/70",
              "transition-all duration-200"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Quay lại</span>
          </motion.button>
        )}

        {step < totalSteps - 1 ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={goNext}
            disabled={!canProceed}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "font-medium transition-all duration-200",
              canProceed
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-slate-100 text-slate-500 cursor-not-allowed"
            )}
          >
            <span className="text-sm">Tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        ) : (
          /* SOS SUBMIT BUTTON */
          <motion.button
            variants={sosButtonVariants}
            animate={isSubmitting ? "idle" : "pulse"}
            whileTap="tap"
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed}
            className={clsx(
              "flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
              "bg-red-600 text-white font-bold",
              "shadow-xl shadow-red-500/30",
              "hover:bg-red-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base">Đang gửi...</span>
              </>
            ) : (
              <>
                <Siren className="w-6 h-6" />
                <span className="text-lg tracking-wide">GỬI SOS</span>
                {!isOnline && <WifiOff className="w-4 h-4 opacity-70" />}
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export const SOSPanel = memo(SOSPanelComponent);
