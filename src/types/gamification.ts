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
  
  // Formule niveau
  LEVEL_XP_MULTIPLIER: 1.5,
  LEVEL_BASE_XP: 100
};
