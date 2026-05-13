"use client";

// =============================================================================
// EDUCATION & SURVIVAL MODULE - TypeScript Types
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Inspired by:
//   - UNESCO CSS (Comprehensive School Safety) Framework
//   - UNICEF Child-Centered DRR
//   - IFRC Volunteer Training Curricula
//   - Nhật Bản Bousai Kyouiku (防災教育)
//   - Octalysis Gamification Framework
//   - SM-2 Spaced Repetition Algorithm
//   - Bloom's Taxonomy (Anderson & Krathwohl, 2001)
//   - Fogg Behavior Model (B=MAT)
// =============================================================================

import type { DisasterType } from "@/lib/types";

// ---------------------------------------------------------------------------
// 1. COURSE TYPES
// ---------------------------------------------------------------------------

/** Cấp độ khóa học */
export type CourseLevel = 1 | 2 | 3 | 4 | 5;

/** Chủ đề khóa học */
export type CourseTopic =
  | "flood"
  | "storm"
  | "landslide"
  | "earthquake"
  | "tsunami"
  | "drought"
  | "first_aid"
  | "family_plan"
  | "community"
  | "health"
  | "emergency_numbers"
  | "culture";

/** Trạng thái bài học */
export type LessonStatus = "locked" | "available" | "in_progress" | "completed";

/** Loại nội dung bài học */
export type LessonContentType = "text" | "infographic" | "step_by_step" | "checklist" | "video_ref";

/** Khóa học */
export interface Course {
  id: string;
  topic: CourseTopic;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  color: string;
  level: CourseLevel;
  lessons: Lesson[];
  totalXP: number;
  prerequisites: string[]; // course IDs
  estimatedMinutes: number;
  disasterTypes: DisasterType[];
  region: "all" | "coastal" | "mountainous" | "delta" | "urban";
}

/** Bài học */
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  contentType: LessonContentType;
  content: LessonContent;
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  prerequisites: string[]; // lesson IDs
}

/** Nội dung bài học */
export interface LessonContent {
  /** Hook - mở đầu (30s) */
  hook: string;
  /** Các phần nội dung chính */
  sections: LessonSection[];
  /** Điểm ghi nhớ */
  takeaway: string;
  /** Quiz ID liên kết */
  quizId?: string;
}

/** Phần nội dung bài học */
export interface LessonSection {
  title: string;
  titleVi: string;
  content: string;
  icon?: string;
  image?: string;
  tips?: string[];
}

// ---------------------------------------------------------------------------
// 2. SCENARIO TYPES
// ---------------------------------------------------------------------------

/** Loại kịch bản */
export type ScenarioType = "flood" | "storm" | "landslide" | "earthquake" | "tsunami" | "drought";

/** Mức độ phức tạp kịch bản */
export type ScenarioComplexity = 1 | 2 | 3 | 4 | 5;

/** Đánh giá lựa chọn */
export type ChoiceCorrectness = "optimal" | "acceptable" | "suboptimal" | "dangerous";

/** Loại hậu quả */
export type ConsequenceType = "immediate" | "delayed" | "cascading";

/** Mức độ hậu quả */
export type ConsequenceSeverity = "minor" | "moderate" | "severe" | "critical";

/** Kịch bản tương tác */
export interface Scenario {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  type: ScenarioType;
  complexity: ScenarioComplexity;
  icon: string;
  color: string;
  region: string;
  nodes: ScenarioNode[];
  entryNodeId: string;
  learningObjectives: string[];
  estimatedMinutes: number;
  xpReward: number;
  bestPath: string[]; // node IDs của đường đi tối ưu
}

/** Node trong kịch bản */
export interface ScenarioNode {
  id: string;
  type: "decision" | "outcome" | "checkpoint" | "debrief";
  narrative: string;
  narrativeVi: string;
  image?: string;
  choices?: ScenarioChoice[];
  timeLimit?: number; // giây, 0 = không giới hạn
  metrics?: {
    safety?: number;
    resources?: number;
    time?: number;
    morale?: number;
  };
}

/** Lựa chọn trong kịch bản */
export interface ScenarioChoice {
  id: string;
  text: string;
  textVi: string;
  icon?: string;
  nextNodeId: string;
  correctness: ChoiceCorrectness;
  consequenceDelay?: number; // milliseconds
  learningNote: string;
  learningNoteVi: string;
  metricChanges?: {
    safety?: number;
    resources?: number;
    time?: number;
    morale?: number;
  };
}

/** Kết quả kịch bản */
export interface ScenarioResult {
  scenarioId: string;
  pathTaken: string[]; // node IDs
  choicesMade: Array<{
    nodeId: string;
    choiceId: string;
    timestamp: string;
  }>;
  finalMetrics: {
    safety: number;
    resources: number;
    time: number;
    morale: number;
  };
  score: number; // 0-100
  xpEarned: number;
  badgeEarned?: string;
  debrief: string;
  debriefVi: string;
}

// ---------------------------------------------------------------------------
// 3. QUIZ TYPES (SM-2 Adaptive)
// ---------------------------------------------------------------------------

/** Cấp độ Bloom */
export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

/** Loại câu hỏi */
export type QuestionType = "multiple_choice" | "true_false" | "matching" | "drag_drop" | "image_select";

/** Câu hỏi quiz */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  bloomLevel: BloomLevel;
  topicTag: string;
  difficulty: number; // -3 to +3 (IRT scale)
  discrimination: number; // 0 to 2
  question: string;
  questionVi: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  explanationVi: string;
  imageUrl?: string;
  disasterType?: DisasterType;
}

/** Lựa chọn quiz */
export interface QuizOption {
  id: string;
  text: string;
  textVi: string;
  icon?: string;
}

/** Phiên quiz */
export interface QuizSession {
  id: string;
  questions: QuizQuestion[];
  responses: QuizResponse[];
  currentAbility: number; // IRT theta
  standardError: number;
  currentIndex: number;
  status: "active" | "completed";
  startedAt: string;
  completedAt: string | null;
  score: number; // 0-100
  xpEarned: number;
}

/** Câu trả lời quiz */
export interface QuizResponse {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentMs: number;
  quality: number; // 0-5 (SM-2 quality rating)
  timestamp: string;
}

/** SM-2 Spaced Repetition Card */
export interface SRCard {
  questionId: string;
  easinessFactor: number; // >= 1.3
  interval: number; // days
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string;
  lastQuality: number; // 0-5
}

/** Quiz kết quả */
export interface QuizResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  xpEarned: number;
  bloomDistribution: Record<BloomLevel, number>;
  averageTimeMs: number;
  badgesEarned: string[];
}

// ---------------------------------------------------------------------------
// 4. PROGRESS & GAMIFICATION TYPES
// ---------------------------------------------------------------------------

/** Cấp độ người dùng */
export type UserLevel = 1 | 2 | 3 | 4 | 5;

/** Loại huy hiệu */
export type BadgeCategory = "knowledge" | "skill" | "effort" | "social" | "rare";

/** Huy hiệu */
export interface Badge {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  xpReward: number;
  requirements: BadgeRequirement[];
}

/** Yêu cầu huy hiệu */
export interface BadgeRequirement {
  type: "complete_course" | "pass_quiz" | "complete_scenario" | "streak_days" | "total_xp" | "help_others";
  value: string | number;
}

/** Tiến trình học tập */
export interface LearningProgress {
  userId: string;
  xp: number;
  level: UserLevel;
  coins: number;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
    freezeCount: number; // số lần freeze streak
  };
  badges: string[]; // badge IDs đã đạt
  completedLessons: string[]; // lesson IDs
  completedCourses: string[]; // course IDs
  completedScenarios: string[]; // scenario IDs
  quizHistory: QuizSession[];
  srCards: SRCard[];
  competencies: Record<string, number>; // topic -> 0-100
  totalTimeSpentMinutes: number;
  lastLoginDate: string;
  joinDate: string;
}

/** Cấp độ config */
export interface LevelConfig {
  level: UserLevel;
  name: string;
  nameVi: string;
  xpRequired: number;
  xpCumulative: number;
  icon: string;
  color: string;
  perks: string[];
}

// ---------------------------------------------------------------------------
// 5. FIRST AID TYPES
// ---------------------------------------------------------------------------

/** Chủ đề sơ cứu */
export type FirstAidTopic = "cpr" | "bleeding" | "burns" | "fractures" | "drowning" | "snakebite" | "heatstroke";

/** Hướng dẫn sơ cứu */
export interface FirstAidGuide {
  id: string;
  topic: FirstAidTopic;
  title: string;
  titleVi: string;
  icon: string;
  color: string;
  urgency: "immediate" | "urgent" | "non_urgent";
  steps: FirstAidStep[];
  warnings: string[];
  warningsVi: string[];
  doNot: string[];
  doNotVi: string[];
}

/** Bước sơ cứu */
export interface FirstAidStep {
  stepNumber: number;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  tips?: string[];
  tipsVi?: string[];
  duration?: string;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// 6. EMERGENCY KIT TYPES
// ---------------------------------------------------------------------------

/** Nhóm đồ dùng */
export type KitCategory = "water_food" | "medical" | "tools" | "documents" | "personal";

/** Đồ dùng khẩn cấp */
export interface KitItem {
  id: string;
  name: string;
  nameVi: string;
  category: KitCategory;
  priority: "essential" | "recommended" | "optional";
  icon: string;
  description: string;
  descriptionVi: string;
  quantity: string;
  estimatedCost?: string;
  tips?: string;
  tipsVi?: string;
}

/** Tiến trình bộ đồ dùng */
export interface KitProgress {
  checkedItems: string[]; // kit item IDs
  totalItems: number;
  completionPercent: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// 7. EVACUATION PLAN TYPES
// ---------------------------------------------------------------------------

/** Điểm tập hợp */
export interface EvacuationPoint {
  id: string;
  name: string;
  nameVi: string;
  level: 1 | 2 | 3 | 4; // 1=trước nhà, 4=UBND
  description: string;
  descriptionVi: string;
  icon: string;
}

/** Kế hoạch sơ tán gia đình */
export interface EvacuationPlan {
  id: string;
  familyName: string;
  members: FamilyMember[];
  meetingPoints: EvacuationPoint[];
  contacts: EmergencyContact[];
  specialNeeds: string[];
  notes: string;
  lastReviewed: string;
}

/** Thành viên gia đình */
export interface FamilyMember {
  id: string;
  name: string;
  role: "adult" | "child" | "elderly" | "disabled";
  specialNeeds?: string;
  phone?: string;
}

/** Liên lạc khẩn cấp */
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

// ---------------------------------------------------------------------------
// 8. LEADERBOARD TYPES
// ---------------------------------------------------------------------------

/** Loại bảng xếp hạng */
export type LeaderboardType = "individual" | "family" | "neighborhood" | "province";

/** Mục bảng xếp hạng */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
  level: UserLevel;
  badges: number;
  streak: number;
  avatar?: string;
  province?: string;
}

// ---------------------------------------------------------------------------
// 9. CONTEXT & STATE TYPES
// ---------------------------------------------------------------------------

/** State của Education module */
export interface EducationState {
  // Courses
  courses: Course[];
  selectedCourse: Course | null;
  selectedLesson: Lesson | null;

  // Scenarios
  scenarios: Scenario[];
  activeScenario: Scenario | null;
  activeScenarioNode: ScenarioNode | null;
  scenarioResult: ScenarioResult | null;

  // Quiz
  activeQuizSession: QuizSession | null;
  quizResult: QuizResult | null;

  // First Aid
  selectedFirstAidTopic: FirstAidGuide | null;

  // Emergency Kit
  kitItems: KitItem[];
  kitProgress: KitProgress;

  // Evacuation Plan
  evacuationPlan: EvacuationPlan | null;

  // Progress
  progress: LearningProgress;

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // UI
  activeTab: EducationTab;
  isMobileDrawerOpen: boolean;
  toasts: EducationToast[];

  // Online
  isOnline: boolean;
}

/** Tab giáo dục */
export type EducationTab =
  | "courses"
  | "scenarios"
  | "quiz"
  | "practice"
  | "community"
  | "info";

/** Toast notification */
export interface EducationToast {
  id: string;
  type: "success" | "error" | "info" | "xp" | "badge" | "level_up";
  title: string;
  message: string;
  duration: number;
  createdAt: string;
  xpAmount?: number;
  badgeIcon?: string;
  levelUpTo?: UserLevel;
}

// ---------------------------------------------------------------------------
// 10. ACTION TYPES
// ---------------------------------------------------------------------------

export type EducationAction =
  // Courses
  | { type: "SET_COURSES"; payload: Course[] }
  | { type: "SELECT_COURSE"; payload: Course | null }
  | { type: "SELECT_LESSON"; payload: Lesson | null }
  | { type: "COMPLETE_LESSON"; payload: { lessonId: string; xpEarned: number } }
  | { type: "COMPLETE_COURSE"; payload: { courseId: string; xpEarned: number } }
  // Scenarios
  | { type: "SET_SCENARIOS"; payload: Scenario[] }
  | { type: "START_SCENARIO"; payload: Scenario }
  | { type: "ADVANCE_SCENARIO"; payload: { choiceId: string; nextNodeId: string } }
  | { type: "COMPLETE_SCENARIO"; payload: ScenarioResult }
  | { type: "RESET_SCENARIO" }
  // Quiz
  | { type: "START_QUIZ"; payload: QuizSession }
  | { type: "ANSWER_QUESTION"; payload: QuizResponse }
  | { type: "COMPLETE_QUIZ"; payload: QuizResult }
  | { type: "RESET_QUIZ" }
  // First Aid
  | { type: "SELECT_FIRST_AID"; payload: FirstAidGuide | null }
  // Kit
  | { type: "SET_KIT_ITEMS"; payload: KitItem[] }
  | { type: "TOGGLE_KIT_ITEM"; payload: string }
  | { type: "RESET_KIT" }
  // Evacuation
  | { type: "SET_EVACUATION_PLAN"; payload: EvacuationPlan }
  | { type: "UPDATE_EVACUATION_PLAN"; payload: Partial<EvacuationPlan> }
  // Progress
  | { type: "SET_PROGRESS"; payload: LearningProgress }
  | { type: "ADD_XP"; payload: number }
  | { type: "ADD_BADGE"; payload: string }
  | { type: "UPDATE_STREAK" }
  | { type: "UPDATE_COMPETENCY"; payload: { topic: string; score: number } }
  // Leaderboard
  | { type: "SET_LEADERBOARD"; payload: LeaderboardEntry[] }
  // UI
  | { type: "SET_ACTIVE_TAB"; payload: EducationTab }
  | { type: "TOGGLE_MOBILE_DRAWER" }
  | { type: "ADD_TOAST"; payload: EducationToast }
  | { type: "REMOVE_TOAST"; payload: string }
  | { type: "SET_ONLINE"; payload: boolean }
  // Reset
  | { type: "RESET_STATE" };

// ---------------------------------------------------------------------------
// 11. CONTEXT TYPE
// ---------------------------------------------------------------------------

export interface EducationContextType {
  state: EducationState;
  dispatch: React.Dispatch<EducationAction>;
  // Computed
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  xpToNextLevel: number;
  levelProgress: number; // 0-100
  unlockedBadges: Badge[];
  pendingReviewCards: SRCard[];
  // Helpers
  showToast: (toast: Omit<EducationToast, "id" | "createdAt">) => void;
  getCourseProgress: (courseId: string) => { completed: number; total: number; percent: number };
  getTopicCompetency: (topic: string) => number;
  isLessonUnlocked: (lessonId: string) => boolean;
  isCourseUnlocked: (courseId: string) => boolean;
  calculateQuizScore: (session: QuizSession) => QuizResult;
}

// ---------------------------------------------------------------------------
// 12. PROPS TYPES
// ---------------------------------------------------------------------------

export interface EducationHeaderProps {
  activeTab: EducationTab;
  onTabChange: (tab: EducationTab) => void;
  progress: LearningProgress;
  className?: string;
}

export interface CourseBrowserProps {
  courses: Course[];
  progress: LearningProgress;
  onCourseSelect: (course: Course) => void;
  className?: string;
}

export interface LessonViewerProps {
  lesson: Lesson;
  course: Course;
  isCompleted: boolean;
  onComplete: (lessonId: string) => void;
  onBack: () => void;
  className?: string;
}

export interface ScenarioSimulatorProps {
  scenario: Scenario;
  activeNode: ScenarioNode | null;
  result: ScenarioResult | null;
  onChoiceSelect: (choiceId: string) => void;
  onRestart: () => void;
  onBack: () => void;
  className?: string;
}

export interface QuizEngineProps {
  session: QuizSession | null;
  result: QuizResult | null;
  onStart: (topicTag: string) => void;
  onAnswer: (questionId: string, optionId: string, timeMs: number) => void;
  onNext: () => void;
  onFinish: () => void;
  onRestart: () => void;
  className?: string;
}

export interface FirstAidGuideProps {
  guide: FirstAidGuide | null;
  guides: FirstAidGuide[];
  onTopicSelect: (guide: FirstAidGuide) => void;
  onBack: () => void;
  className?: string;
}

export interface EmergencyKitBuilderProps {
  items: KitItem[];
  progress: KitProgress;
  onToggleItem: (itemId: string) => void;
  onReset: () => void;
  className?: string;
}

export interface EvacuationPlannerProps {
  plan: EvacuationPlan | null;
  onUpdate: (plan: Partial<EvacuationPlan>) => void;
  className?: string;
}

export interface ProgressDashboardProps {
  progress: LearningProgress;
  courses: Course[];
  badges: Badge[];
  className?: string;
}

export interface BadgeCollectionProps {
  progress: LearningProgress;
  badges: Badge[];
  className?: string;
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  className?: string;
}

export interface EmergencyNumbersProps {
  className?: string;
}
