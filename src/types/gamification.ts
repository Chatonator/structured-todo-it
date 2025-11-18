export type AchievementCategory = 'tasks' | 'habits' | 'streaks' | 'milestones' | 'challenges';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ChallengeType = 'daily' | 'weekly';
export type ChallengeCategory = 'tasks' | 'habits' | 'mixed';
export type TransactionSource = 'task' | 'habit' | 'challenge' | 'achievement' | 'streak_bonus' | 'daily_bonus';

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
  dailyChallengeStreak: number;
  weeklyChallengesCompleted: number;
  lastActivityDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon?: string;
  category: AchievementCategory;
  targetValue?: number;
  xpReward: number;
  pointsReward: number;
  isSecret: boolean;
  tier: AchievementTier;
  displayOrder: number;
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement?: Achievement;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  createdAt: Date;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  category: ChallengeCategory;
  name: string;
  description: string;
  icon?: string;
  targetType: string;
  targetValue: number;
  xpReward: number;
  pointsReward: number;
  requiredLevel: number;
  weight: number;
  createdAt: Date;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  challenge?: Challenge;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  assignedDate: string;
  expiresAt: string;
  createdAt: Date;
}

export interface XpTransaction {
  id: string;
  userId: string;
  sourceType: TransactionSource;
  sourceId?: string;
  xpGained: number;
  pointsGained: number;
  description?: string;
  metadata?: any;
  createdAt: Date;
}

// Configuration pour calculs XP
export const XP_CONFIG = {
  // XP par tâche selon catégorie
  TASK_XP: {
    'Obligation': 15,
    'Quotidien': 10,
    'Envie': 12,
    'Autres': 8
  } as Record<string, number>,
  
  // XP par habitude
  HABIT_XP: 20,
  
  // Bonus de streaks
  STREAK_BONUS: {
    7: { xp: 50, points: 10 },
    14: { xp: 100, points: 25 },
    30: { xp: 250, points: 50 },
    60: { xp: 500, points: 100 },
    100: { xp: 1000, points: 200 },
    365: { xp: 5000, points: 1000 }
  } as Record<number, { xp: number; points: number }>,
  
  // Bonus quotidien
  DAILY_BONUS: { xp: 5, points: 1 },
  
  // Formule niveau
  LEVEL_XP_MULTIPLIER: 1.5,
  LEVEL_BASE_XP: 100
};

// Tiers d'achievements
export const ACHIEVEMENT_TIERS: Record<AchievementTier, { color: string; label: string }> = {
  'bronze': { color: '#cd7f32', label: 'Bronze' },
  'silver': { color: '#c0c0c0', label: 'Argent' },
  'gold': { color: '#ffd700', label: 'Or' },
  'platinum': { color: '#e5e4e2', label: 'Platine' }
};
