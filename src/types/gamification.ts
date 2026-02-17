export type TransactionSource = 'task' | 'habit' | 'streak_bonus' | 'project_created' | 'project_completed';

export interface UserProgress {
  id: string;
  userId: string;
  totalXp: number;          // Now represents total points
  currentLevel: number;      // Deprecated — kept for DB compat
  xpForNextLevel: number;    // Deprecated
  lifetimePoints: number;    // Deprecated
  currentPoints: number;     // Deprecated
  tasksCompleted: number;
  habitsCompleted: number;
  currentTaskStreak: number;
  longestTaskStreak: number;
  currentHabitStreak: number;
  longestHabitStreak: number;
  lastActivityDate: string;
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

/** Metadata stored in xp_transactions.metadata for the new engine */
export interface TransactionMetadata {
  base: number;
  quadrantKey: string;
  quadrantCoeff: number;
  bonusType: string;
  bonusValue: number;
  formula: string;
  isMicroTask: boolean;
  capped: boolean;           // true if micro-task cap was hit
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  postponeCount: number;
}

export interface DailyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  importantMinutesToday: number;
  streakQualifiedToday: boolean;
}
