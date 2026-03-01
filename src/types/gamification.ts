export type TransactionSource = 'task' | 'habit' | 'streak_bonus' | 'project_created' | 'project_completed';

export interface UserProgress {
  id: string;
  userId: string;
  totalXp: number;
  currentLevel: number;
  xpForNextLevel: number;
  lifetimePoints: number;
  currentPoints: number;
  tasksCompleted: number;
  habitsCompleted: number;
  currentTaskStreak: number;
  longestTaskStreak: number;
  currentHabitStreak: number;
  longestHabitStreak: number;
  lastActivityDate: string;
  lastStreakQualifiedDate: string | null;
  // v3.0 — guilty-free time (minutes stored in DB points columns)
  minutesAvailable: number;
  totalMinutesEarned: number;
  totalMinutesSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XpTransaction {
  id: string;
  userId: string;
  sourceType: TransactionSource;
  sourceId?: string;
  xpGained: number;
  minutesGained: number;
  description?: string;
  metadata?: TransactionMetadata | any;
  isRefined: boolean;
  refinedAt?: Date | null;
  createdAt: Date;
}

export interface UnrefinedTask {
  transactionId: string;
  sourceId: string;
  taskName: string;
  category: string;
  minutesOriginal: number;
  createdAt: Date;
  weeksElapsed: number;
  decayPct: number;
}

export interface TransactionMetadata {
  base: number;
  quadrantKey: string;
  quadrantCoeff: number;
  importanceWeight: number;
  priorityMultiplier: number;
  bonusType: string;
  bonusValue: number;
  longTaskBonus: number;
  formula: string;
  isMicroTask: boolean;
  capped: boolean;
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  postponeCount: number;
  quadrantLabel: string;
}

export interface DailyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  importantMinutesToday: number;
  streakQualifiedToday: boolean;
}

export interface Reward {
  id: string;
  userId: string;
  name: string;
  icon: string;
  costMinutes: number;
  orderIndex: number;
  createdAt: Date;
}

export interface ClaimHistoryEntry {
  id: string;
  userId: string;
  rewardName: string;
  costMinutes: number;
  claimedAt: Date;
}

export interface SkillData {
  key: string;
  name: string;
  icon: string;
  xp: number;
  level: number;
  progressPct: number;
  xpForNext: number;
  indicator?: string;
}
