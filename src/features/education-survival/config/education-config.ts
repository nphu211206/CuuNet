import type {
  CourseLevel,
  CourseTopic,
  ScenarioType,
  ScenarioComplexity,
  BloomLevel,
  QuestionType,
  BadgeCategory,
  KitCategory,
  FirstAidTopic,
  EducationTab,
  LevelConfig,
} from "../lib/types";

// =============================================================================
// EDUCATION & SURVIVAL MODULE - Configuration
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. GENERAL CONFIG
// ---------------------------------------------------------------------------

export const EDUCATION_CONFIG = {
  // XP
  XP_PER_LESSON: 50,
  XP_PER_QUIZ_CORRECT: 20,
  XP_PER_SCENARIO: 150,
  XP_PER_BADGE: 100,
  XP_PER_STREAK_DAY: 10,
  XP_BONUS_PERFECT_QUIZ: 50,
  XP_BONUS_SPEED: 25,

  // Quiz
  QUIZ_QUESTIONS_PER_SESSION: 10,
  QUIZ_TIME_LIMIT_MS: 30_000, // 30 giây mỗi câu
  QUIZ_ADAPTIVE_THRESHOLD_UP: 85, // >85% đúng → tăng độ khó
  QUIZ_ADAPTIVE_THRESHOLD_DOWN: 60, // <60% đúng → giảm độ khó

  // SM-2 Spaced Repetition
  SM2_INITIAL_EF: 2.5,
  SM2_MIN_EF: 1.3,
  SM2_INITIAL_INTERVAL: 1, // ngày
  SM2_SECOND_INTERVAL: 6, // ngày

  // Streak
  STREAK_FREEZE_MAX: 3, // số lần freeze tối đa
  STREAK_DECAY_DAYS: 2, // mất streak sau 2 ngày không học

  // UI
  TOAST_DURATION: 4_000,
  LEVEL_UP_TOAST_DURATION: 6_000,
  BADGE_TOAST_DURATION: 5_000,
  LESSON_ANIMATION_DURATION: 300,
  QUIZ_FEEDBACK_DURATION: 1_500,

  // Session
  AUTO_SAVE_INTERVAL: 30_000,
  MAX_QUIZ_HISTORY: 100,
  MAX_SCENARIO_HISTORY: 50,
} as const;

// ---------------------------------------------------------------------------
// 2. STORAGE KEYS
// ---------------------------------------------------------------------------

export const EDUCATION_STORAGE_KEYS = {
  PROGRESS: "cuunet-education-progress",
  ACTIVE_TAB: "cuunet-education-tab",
  QUIZ_SESSION: "cuunet-education-quiz",
  SCENARIO_STATE: "cuunet-education-scenario",
  KIT_PROGRESS: "cuunet-education-kit",
  EVACUATION_PLAN: "cuunet-education-evacuation",
  SR_CARDS: "cuunet-education-sr-cards",
  PREFERENCES: "cuunet-education-preferences",
} as const;

// ---------------------------------------------------------------------------
// 3. LEVEL CONFIG (5 Levels)
// ---------------------------------------------------------------------------

export const LEVEL_CONFIG: LevelConfig[] = [
  {
    level: 1,
    name: "Newcomer",
    nameVi: "Người mới",
    xpRequired: 500,
    xpCumulative: 0,
    icon: "🌱",
    color: "#94A3B8",
    perks: ["Truy cập khóa cơ bản", "Quiz cơ bản"],
  },
  {
    level: 2,
    name: "Student",
    nameVi: "Học viên",
    xpRequired: 1000,
    xpCumulative: 500,
    icon: "📚",
    color: "#3B82F6",
    perks: ["Mở khóa kịch bản", "Bảng xếp hạng"],
  },
  {
    level: 3,
    name: "Member",
    nameVi: "Thành viên",
    xpRequired: 2000,
    xpCumulative: 1500,
    icon: "⭐",
    color: "#22C55E",
    perks: ["Mở khóa nâng cao", "Thử thách cộng đồng"],
  },
  {
    level: 4,
    name: "Trainer",
    nameVi: "Huấn luyện viên",
    xpRequired: 3500,
    xpCumulative: 3500,
    icon: "🏆",
    color: "#F59E0B",
    perks: ["Tạo nội dung", "Mentor system"],
  },
  {
    level: 5,
    name: "Expert",
    nameVi: "Chuyên gia",
    xpRequired: 0, // max level
    xpCumulative: 7000,
    icon: "💎",
    color: "#A855F7",
    perks: ["Toàn quyền", "Đại sứ DRR"],
  },
];

// ---------------------------------------------------------------------------
// 4. COURSE TOPIC CONFIG
// ---------------------------------------------------------------------------

export const COURSE_TOPIC_CONFIG: Record<
  CourseTopic,
  { label: string; labelVi: string; icon: string; color: string; description: string }
> = {
  flood: {
    label: "Flood Safety",
    labelVi: "An toàn lũ lụt",
    icon: "🌊",
    color: "#3B82F6",
    description: "Kỹ năng sống sót và chuẩn bị khi có lũ lụt",
  },
  storm: {
    label: "Storm Safety",
    labelVi: "An toàn bão",
    icon: "🌪️",
    color: "#8B5CF6",
    description: "Chuẩn bị và ứng phó khi có bão",
  },
  landslide: {
    label: "Landslide Safety",
    labelVi: "An toàn sạt lở",
    icon: "⛰️",
    color: "#92400E",
    description: "Nhận biết dấu hiệu và sơ tán khi sạt lở",
  },
  earthquake: {
    label: "Earthquake Safety",
    labelVi: "An toàn động đất",
    icon: "🏔️",
    color: "#B45309",
    description: "Kỹ năng sinh tồn khi động đất",
  },
  tsunami: {
    label: "Tsunami Safety",
    labelVi: "An toàn sóng thần",
    icon: "🌊",
    color: "#0EA5E9",
    description: "Dấu hiệu sóng thần và cách thoát hiểm",
  },
  drought: {
    label: "Drought Preparedness",
    labelVi: "Chuẩn bị hạn hán",
    icon: "☀️",
    color: "#F59E0B",
    description: "Tiết kiệm nước và bảo vệ mùa màng",
  },
  first_aid: {
    label: "First Aid",
    labelVi: "Sơ cấp cứu",
    icon: "🩹",
    color: "#EF4444",
    description: "Kỹ năng sơ cấp cứu cơ bản",
  },
  family_plan: {
    label: "Family Plan",
    labelVi: "Kế hoạch gia đình",
    icon: "👨‍👩‍👧‍👦",
    color: "#EC4899",
    description: "Xây dựng kế hoạch phòng chống thiên tai gia đình",
  },
  community: {
    label: "Community DRR",
    labelVi: "Vai trò cộng đồng",
    icon: "🏘️",
    color: "#14B8A6",
    description: "Vai trò của cộng đồng trong PCTT",
  },
  health: {
    label: "Post-Disaster Health",
    labelVi: "Sức khỏe sau thiên tai",
    icon: "🏥",
    color: "#F97316",
    description: "Phòng bệnh và sức khỏe tâm lý sau thiên tai",
  },
  emergency_numbers: {
    label: "Emergency Numbers",
    labelVi: "Số khẩn cấp",
    icon: "📞",
    color: "#DC2626",
    description: "Danh bạ khẩn cấp Việt Nam",
  },
  culture: {
    label: "Culture & DRR",
    labelVi: "Văn hóa & PCTT",
    icon: "🇻🇳",
    color: "#22C55E",
    description: "Giá trị văn hóa Việt Nam trong phòng chống thiên tai",
  },
};

// ---------------------------------------------------------------------------
// 5. SCENARIO TYPE CONFIG
// ---------------------------------------------------------------------------

export const SCENARIO_TYPE_CONFIG: Record<
  ScenarioType,
  { label: string; labelVi: string; icon: string; color: string; region: string }
> = {
  flood: {
    label: "Flood",
    labelVi: "Lũ lụt",
    icon: "🌊",
    color: "#3B82F6",
    region: "ĐBSCL, Miền Trung",
  },
  storm: {
    label: "Storm",
    labelVi: "Bão",
    icon: "🌪️",
    color: "#8B5CF6",
    region: "Miền Trung, Miền Bắc",
  },
  landslide: {
    label: "Landslide",
    labelVi: "Sạt lở",
    icon: "⛰️",
    color: "#92400E",
    region: "Miền núi",
  },
  earthquake: {
    label: "Earthquake",
    labelVi: "Động đất",
    icon: "🏔️",
    color: "#B45309",
    region: "Toàn quốc",
  },
  tsunami: {
    label: "Tsunami",
    labelVi: "Sóng thần",
    icon: "🌊",
    color: "#0EA5E9",
    region: "Ven biển",
  },
  drought: {
    label: "Drought",
    labelVi: "Hạn hán",
    icon: "☀️",
    color: "#F59E0B",
    region: "Nam Trung Bộ, ĐBSCL",
  },
};

// ---------------------------------------------------------------------------
// 6. BLOOM'S TAXONOMY CONFIG
// ---------------------------------------------------------------------------

export const BLOOM_LEVEL_CONFIG: Record<
  BloomLevel,
  { label: string; labelVi: string; icon: string; color: string; targetPercent: number }
> = {
  remember: {
    label: "Remember",
    labelVi: "Nhớ",
    icon: "🧠",
    color: "#3B82F6",
    targetPercent: 20,
  },
  understand: {
    label: "Understand",
    labelVi: "Hiểu",
    icon: "💡",
    color: "#8B5CF6",
    targetPercent: 25,
  },
  apply: {
    label: "Apply",
    labelVi: "Áp dụng",
    icon: "🔧",
    color: "#22C55E",
    targetPercent: 25,
  },
  analyze: {
    label: "Analyze",
    labelVi: "Phân tích",
    icon: "🔍",
    color: "#F59E0B",
    targetPercent: 15,
  },
  evaluate: {
    label: "Evaluate",
    labelVi: "Đánh giá",
    icon: "⚖️",
    color: "#F97316",
    targetPercent: 10,
  },
  create: {
    label: "Create",
    labelVi: "Sáng tạo",
    icon: "🎨",
    color: "#EC4899",
    targetPercent: 5,
  },
};

// ---------------------------------------------------------------------------
// 7. QUESTION TYPE CONFIG
// ---------------------------------------------------------------------------

export const QUESTION_TYPE_CONFIG: Record<
  QuestionType,
  { label: string; labelVi: string; icon: string }
> = {
  multiple_choice: {
    label: "Multiple Choice",
    labelVi: "Trắc nghiệm",
    icon: "☑️",
  },
  true_false: {
    label: "True/False",
    labelVi: "Đúng/Sai",
    icon: "✅",
  },
  matching: {
    label: "Matching",
    labelVi: "Ghép đôi",
    icon: "🔗",
  },
  drag_drop: {
    label: "Drag & Drop",
    labelVi: "Kéo thả",
    icon: "✋",
  },
  image_select: {
    label: "Image Select",
    labelVi: "Chọn hình",
    icon: "🖼️",
  },
};

// ---------------------------------------------------------------------------
// 8. BADGE CONFIG
// ---------------------------------------------------------------------------

export const BADGE_CATEGORY_CONFIG: Record<
  BadgeCategory,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  knowledge: {
    label: "Knowledge",
    labelVi: "Kiến thức",
    icon: "📚",
    color: "#3B82F6",
  },
  skill: {
    label: "Skill",
    labelVi: "Kỹ năng",
    icon: "💪",
    color: "#22C55E",
  },
  effort: {
    label: "Effort",
    labelVi: "Nỗ lực",
    icon: "🔥",
    color: "#F97316",
  },
  social: {
    label: "Social",
    labelVi: "Cộng đồng",
    icon: "🤝",
    color: "#8B5CF6",
  },
  rare: {
    label: "Rare",
    labelVi: "Hiếm",
    icon: "💎",
    color: "#EC4899",
  },
};

// ---------------------------------------------------------------------------
// 9. KIT CATEGORY CONFIG
// ---------------------------------------------------------------------------

export const KIT_CATEGORY_CONFIG: Record<
  KitCategory,
  { label: string; labelVi: string; icon: string; color: string }
> = {
  water_food: {
    label: "Water & Food",
    labelVi: "Nước & Thức ăn",
    icon: "💧",
    color: "#3B82F6",
  },
  medical: {
    label: "Medical",
    labelVi: "Y tế",
    icon: "🩹",
    color: "#EF4444",
  },
  tools: {
    label: "Tools",
    labelVi: "Dụng cụ",
    icon: "🔧",
    color: "#F59E0B",
  },
  documents: {
    label: "Documents",
    labelVi: "Giấy tờ",
    icon: "📄",
    color: "#8B5CF6",
  },
  personal: {
    label: "Personal",
    labelVi: "Cá nhân",
    icon: "👤",
    color: "#06B6D4",
  },
};

// ---------------------------------------------------------------------------
// 10. FIRST AID TOPIC CONFIG
// ---------------------------------------------------------------------------

export const FIRST_AID_TOPIC_CONFIG: Record<
  FirstAidTopic,
  { label: string; labelVi: string; icon: string; color: string; urgency: string }
> = {
  cpr: {
    label: "CPR",
    labelVi: "Hồi sinh tim phổi",
    icon: "❤️",
    color: "#EF4444",
    urgency: "immediate",
  },
  bleeding: {
    label: "Bleeding Control",
    labelVi: "Cầm máu",
    icon: "🩸",
    color: "#DC2626",
    urgency: "immediate",
  },
  burns: {
    label: "Burns",
    labelVi: "Bỏng",
    icon: "🔥",
    color: "#F97316",
    urgency: "urgent",
  },
  fractures: {
    label: "Fractures",
    labelVi: "Gãy xương",
    icon: "🦴",
    color: "#F59E0B",
    urgency: "urgent",
  },
  drowning: {
    label: "Drowning",
    labelVi: "Đuối nước",
    icon: "🌊",
    color: "#0EA5E9",
    urgency: "immediate",
  },
  snakebite: {
    label: "Snakebite",
    labelVi: "Rắn cắn",
    icon: "🐍",
    color: "#8B5CF6",
    urgency: "urgent",
  },
  heatstroke: {
    label: "Heatstroke",
    labelVi: "Say nắng",
    icon: "☀️",
    color: "#F59E0B",
    urgency: "urgent",
  },
};

// ---------------------------------------------------------------------------
// 11. EDUCATION TAB CONFIG
// ---------------------------------------------------------------------------

export const EDUCATION_TAB_CONFIG: Array<{
  id: EducationTab;
  label: string;
  labelVi: string;
  icon: string;
  color: string;
}> = [
  { id: "courses", label: "Courses", labelVi: "Khóa học", icon: "📚", color: "#3B82F6" },
  { id: "scenarios", label: "Scenarios", labelVi: "Tình huống", icon: "🎮", color: "#22C55E" },
  { id: "quiz", label: "Quiz", labelVi: "Kiểm tra", icon: "❓", color: "#8B5CF6" },
  { id: "practice", label: "Practice", labelVi: "Thực hành", icon: "🩹", color: "#EF4444" },
  { id: "community", label: "Community", labelVi: "Cộng đồng", icon: "🤝", color: "#F59E0B" },
  { id: "info", label: "Info", labelVi: "Thông tin", icon: "📞", color: "#06B6D4" },
];

// ---------------------------------------------------------------------------
// 12. EMERGENCY NUMBERS (Vietnam)
// ---------------------------------------------------------------------------

export const EMERGENCY_NUMBERS = [
  {
    number: "112",
    label: "Tìm kiếm cứu nạn",
    labelEn: "Search & Rescue",
    icon: "🆘",
    color: "#DC2626",
    description: "Ban Chỉ đạo PCTT Trung ương - cứu hộ thiên tai",
  },
  {
    number: "113",
    label: "Công an",
    labelEn: "Police",
    icon: "👮",
    color: "#3B82F6",
    description: "An ninh trật tự, cứu hộ cộng đồng",
  },
  {
    number: "114",
    label: "Phòng cháy chữa cháy",
    labelEn: "Fire Department",
    icon: "🚒",
    color: "#F97316",
    description: "Cứu hỏa, cứu nạn cháy nổ",
  },
  {
    number: "115",
    label: "Cấp cứu y tế",
    labelEn: "Ambulance",
    icon: "🚑",
    color: "#22C55E",
    description: "Cấp cứu y tế, vận chuyển bệnh nhân",
  },
] as const;

// ---------------------------------------------------------------------------
// 13. ANIMATION CONFIG
// ---------------------------------------------------------------------------

export const EDUCATION_ANIMATION = {
  stagger: 0.05,
  delayChildren: 0.1,
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    lesson: 0.4,
    quiz_feedback: 1.5,
    badge_reveal: 0.8,
    level_up: 1.5,
    progress_fill: 1.0,
  },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  spring: {
    gentle: { type: "spring" as const, stiffness: 100, damping: 15 },
    bouncy: { type: "spring" as const, stiffness: 300, damping: 25 },
    badge: { type: "spring" as const, stiffness: 200, damping: 15 },
    levelUp: { type: "spring" as const, stiffness: 150, damping: 12 },
  },
} as const;

// ---------------------------------------------------------------------------
// 14. DEFAULT PROGRESS
// ---------------------------------------------------------------------------

export const DEFAULT_PROGRESS = {
  userId: "default",
  xp: 0,
  level: 1 as const,
  coins: 0,
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: new Date().toISOString().split("T")[0],
    freezeCount: 0,
  },
  badges: [],
  completedLessons: [],
  completedCourses: [],
  completedScenarios: [],
  quizHistory: [],
  srCards: [],
  competencies: {},
  totalTimeSpentMinutes: 0,
  lastLoginDate: new Date().toISOString().split("T")[0],
  joinDate: new Date().toISOString().split("T")[0],
};

// ---------------------------------------------------------------------------
// 15. VIETNAMESE SURVIVAL PHRASES
// ---------------------------------------------------------------------------

export const SURVIVAL_PHRASES = {
  flood: [
    "Di chuyển đến nơi cao ngay lập tức",
    "Không đi qua vùng nước chảy xiết",
    "Nếu bị cuốn: nằm ngửa, chân hướng xuống hạ lưu",
    "Tìm vật nổi: bình nhựa, thùng, cây cối",
  ],
  storm: [
    "Ở trong nhà, đóng kín cửa",
    "Tránh xa cửa sổ",
    "Chuẩn bị đèn pin, radio, nước uống",
    "Gia cố mái nhà trước bão",
  ],
  landslide: [
    "Nhận biết dấu hiệu: đất nứt, nước đục, tiếng động lạ",
    "Sơ tán ngay khi có dấu hiệu",
    "Đi lên trên, không đi chân dốc",
    "Nếu bị vùi: che đầu, tiết kiệm oxy",
  ],
  earthquake: [
    "DROP - COVER - HOLD ON",
    "Úp xuống, núp dưới bàn, bám chặt",
    "Tránh cửa sổ, tủ kệ",
    "Sau khi rung: di chuyển theo cầu thang thoát hiểm",
  ],
  tsunami: [
    "Nước biển rút nhanh = sóng thần sắp đến",
    "Chạy lên nơi cao ít nhất 30m",
    "Đi bộ, không lái xe",
    "Không quay lại biển sau đợt sóng đầu tiên",
  ],
  emergency: [
    "Gọi 112: Tìm kiếm cứu nạn",
    "Gọi 113: Công an",
    "Gọi 114: Phòng cháy chữa cháy",
    "Gọi 115: Cấp cứu y tế",
  ],
} as const;
