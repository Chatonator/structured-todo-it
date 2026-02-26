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
  // v2.0 fields
  pointsAvailable: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface XpTransaction {
  id: string;
  userId: string;
  sourceType: TransactionSource;
  sourceId?: string;
  xpGained: number;
  pointsGained: number;
  description?: string;
  metadata?: TransactionMetadata | any;
  createdAt: Date;
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
  costPoints: number;
  orderIndex: number;
  createdAt: Date;
}

export interface ClaimHistoryEntry {
  id: string;
  userId: string;
  rewardName: string;
  costPoints: number;
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
}
