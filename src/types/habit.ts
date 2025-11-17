export type HabitFrequency = 'daily' | 'weekly' | 'x-times-per-week' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  deckId: string;
  frequency: HabitFrequency;
  timesPerWeek?: number;
  targetDays?: number[];
  isActive: boolean;
  createdAt: Date;
  order: number;
  icon?: string;
  color?: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  userId: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  date: string;
  notes?: string;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

export const HABIT_FREQUENCY_OPTIONS = [
  { value: 'daily' as const, label: 'Quotidien', icon: '📅' },
  { value: 'weekly' as const, label: 'Hebdomadaire', icon: '📆' },
  { value: 'x-times-per-week' as const, label: 'X fois par semaine', icon: '🔢' },
  { value: 'custom' as const, label: 'Personnalisé', icon: '⚙️' }
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Lun', short: 'L' },
  { value: 1, label: 'Mar', short: 'M' },
  { value: 2, label: 'Mer', short: 'M' },
  { value: 3, label: 'Jeu', short: 'J' },
  { value: 4, label: 'Ven', short: 'V' },
  { value: 5, label: 'Sam', short: 'S' },
  { value: 6, label: 'Dim', short: 'D' }
];
