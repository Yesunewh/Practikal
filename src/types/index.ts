export type UserRole = 'user' | 'admin' | 'superadmin';

/** Shape returned by `/api/gamification/*` for server-side gamification fields */
export interface GamificationApiUser {
  gamification_xp: number;
  gamification_level: string;
  gamification_xp_to_next: number;
  gamification_reputation: number;
  gamification_streak: number;
  gamification_longest_streak?: number;
  gamification_last_activity?: string | null;
}

/** Row from GET /api/gamification/leaderboard */
export interface GamificationLeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  level: string;
  reputation: number;
  orgId: string | null;
  organizationName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  streak: number;
  challengesCompleted: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  organization: string;
  level: string;
  xp: number;
  xpToNextLevel: number;
  reputation: number;
  achievements: Achievement[];
  completedChallenges: string[];
  streak: number;
  rank: {
    current: Rank;
    next: Rank;
    progress: number;
    nextRankPoints: number;
  };
  role: UserRole;
  orgId?: string;
  deptId?: string;
  /** Assigned organizational unit for UNIT_ADMIN (branch scope). */
  unitId?: string;
  user_type?: string;
  permissions?: string[];
  progress?: UserProgress;
  activityLog?: ActivityLogEntry[];
}

export type Rank = 'beginner' | 'medior' | 'senior' | 'professional' | 'specialist' | 'master' | 'legend';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'scenario' | 'password' | 'simulation' | 'sequential' | 'verification';
  xpReward: number;
  reputationReward: number;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'phishing' | 'malware' | 'password' | 'general' | 'social-engineering' | 'incident-response';
  steps: ChallengeStep[];
  completed?: boolean;
  orgId?: string | null;
  deptId?: string | null;
  /** Present for admin / exam-bank API responses */
  isActive?: boolean;
  attemptCount?: number;
  updatedAt?: string | null;
  /** From gamification API: tier gating within category (beginner → intermediate → advanced). */
  progressionLocked?: boolean;
  progressionLockReason?: string | null;
}

export interface ChallengeStep {
  id: string;
  type:
    | 'question'
    | 'information'
    | 'password-create'
    | 'scenario'
    | 'sequential'
    | 'image-verification'
    | 'simulation'
    | 'phishing-inbox'
    | 'video-check'
    | 'policy-attestation';
  content:
    | QuestionContent
    | InformationContent
    | PasswordRequirements
    | ScenarioContent
    | SequentialContent
    | ImageVerificationContent
    | SimulationContent
    | PhishingInboxContent
    | VideoCheckContent
    | PolicyAttestationContent;
  explanation?: string;
}

export interface PhishingInboxEmail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  isPhishing: boolean;
}

export interface PhishingInboxContent {
  instructions: string;
  emails: PhishingInboxEmail[];
}

/** Short video + knowledge check (same option shape as quiz) */
export interface VideoCheckContent {
  title: string;
  videoUrl: string;
  question: string;
  options: QuestionOption[];
  multipleAnswers: boolean;
}

/** Scroll + attest to an acceptable-use or policy document */
export interface PolicyAttestationContent {
  policyId: string;
  documentTitle: string;
  documentBody: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  stepChallengeIds: string[];
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  campaignId: string;
  userId: string;
  challengeId: string;
  title: string;
  dueDate: string;
}

/** How a quiz-style step is authored and shown to learners */
export type QuestionKind = 'multiple_choice' | 'true_false' | 'binary_verdict';

/** Optional chrome for `binary_verdict` (mock inbox / message) */
export interface QuestionVerdictContext {
  clientBrand?: string;
  fromLine?: string;
  subjectLine?: string;
}

export interface QuestionContent {
  question: string;
  options: QuestionOption[];
  multipleAnswers: boolean;
  /** Defaults to `multiple_choice` when omitted (existing challenges). */
  questionKind?: QuestionKind;
  /** Main message body for `binary_verdict` (plain text). */
  scenarioBody?: string;
  verdictContext?: QuestionVerdictContext;
}

export interface InformationContent {
  title: string;
  description: string;
  image?: string;
}

export interface PasswordRequirements {
  minLength: number;
  requireCapital: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export interface ScenarioContent {
  situation: string;
  options: ScenarioOption[];
}

export interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  consequence: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface SequentialContent {
  question: string;
  steps: SequentialStep[];
}

export interface SequentialStep {
  id: string;
  text: string;
  correctPosition: number;
}

export interface ImageVerificationContent {
  question: string;
  images: ImageItem[];
  multipleAnswers: boolean;
}

export interface ImageItem {
  id: string;
  imageUrl: string;
  caption?: string;
  isReal: boolean;
  explanation?: string;
}

export interface SimulationContent {
  simulationType: 'email' | 'terminal' | 'firewall';
  title: string;
  instructions: string;
  tasks: SimulationTask[];
}

export interface SimulationTask {
  id: string;
  description: string;
  correctAction: string;
  points: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** From gamification API: user earned this achievement */
  completed?: boolean;
  /** ISO timestamp from API when completed */
  completedAt?: string | null;
  unlockedAt?: Date;
  progress?: number;
  total?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  organization?: string;
  department?: string;
  xp: number;
  level: string;
  position: number;
  change?: number;
}

export interface AdminStats {
  participationRate: number;
  averageScore: number;
  challengeCompletionRates: {
    challengeId: string;
    title: string;
    completionRate: number;
  }[];
  departmentPerformance: {
    department: string;
    averageScore: number;
  }[];
  topPerformers: LeaderboardEntry[];
}

export interface UserProgress {
  totalChallengesCompleted: number;
  totalChallengesAvailable: number;
  completionRate: number;
  averageScore: number;
  totalTimeSpent: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  lastActive: Date;
  categoryProgress: CategoryProgress[];
  weeklyActivity: WeeklyActivity[];
  milestones: Milestone[];
  recentAchievements: Achievement[];
}

export interface CategoryProgress {
  category: 'phishing' | 'malware' | 'password' | 'general' | 'social-engineering' | 'incident-response';
  completed: number;
  total: number;
  averageScore: number;
  timeSpent: number;
}

export interface WeeklyActivity {
  week: string;
  challengesCompleted: number;
  xpEarned: number;
  timeSpent: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  completedAt?: Date;
  reward: {
    xp: number;
    reputation: number;
  };
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  type:
    | 'challenge_started'
    | 'challenge_completed'
    | 'achievement_unlocked'
    | 'level_up'
    | 'streak_milestone'
    | 'login'
    | 'policy_attested';
  /** ISO 8601 — kept serializable for Redux / persistence */
  timestamp: string;
  details: {
    challengeId?: string;
    challengeTitle?: string;
    score?: number;
    timeSpent?: number;
    xpEarned?: number;
    achievementId?: string;
    achievementTitle?: string;
    newLevel?: string;
    streakCount?: number;
    policyId?: string;
    policyTitle?: string;
  };
}

export interface ChallengeAttempt {
  id: string;
  userId: string;
  challengeId: string;
  /** ISO 8601 — kept serializable for Redux / persistence */
  startedAt: string;
  completedAt?: string;
  timeSpent: number; // in seconds
  score: number;
  passed: boolean;
  answers: ChallengeAnswer[];
}

export interface ChallengeAnswer {
  stepId: string;
  answer: string | string[];
  correct: boolean;
  timeSpent: number;
}

/** Emitted when a challenge step is finished (submit + continue) */
export interface StepCompleteDetail {
  stepId: string;
  correct: boolean;
  answer: string | string[];
}