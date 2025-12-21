export type HabitFrequency = 'daily' | 'weekly' | 'x-times-per-week' | 'monthly' | 'x-times-per-month' | 'custom';

export type UnlockConditionType = 'streak' | 'total_completions' | 'manual';

export type ChallengeEndAction = 'archive' | 'delete' | 'convert';

export interface UnlockCondition {
  type: UnlockConditionType;
  value?: number; // Nombre de jours streak ou nombre total de complétions
  prerequisiteHabitId?: string; // L'habitude qui doit être complétée
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  deckId: string;
  frequency: HabitFrequency;
  timesPerWeek?: number;
  timesPerMonth?: number;
  targetDays?: number[]; // Jours de la semaine (0-6) ou jours du mois (1-31)
  isActive: boolean;
  createdAt: Date;
  order: number;
  icon?: string;
  color?: string;
  
  // Mode Challenge / Durée limitée
  isChallenge?: boolean;
  challengeStartDate?: Date;
  challengeEndDate?: Date;
  challengeDurationDays?: number;
  challengeEndAction?: ChallengeEndAction;
  
  // Système de déverrouillage
  isLocked?: boolean;
  unlockCondition?: UnlockCondition;
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
  
  // Mode progression (habitudes déverrouillables)
  isProgressionDeck?: boolean;
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
  { value: 'daily' as const, label: 'Quotidien', icon: '📅', description: 'Chaque jour' },
  { value: 'weekly' as const, label: 'Hebdomadaire', icon: '📆', description: 'Certains jours de la semaine' },
  { value: 'x-times-per-week' as const, label: 'X fois par semaine', icon: '🔢', description: 'Ex: 3 fois par semaine' },
  { value: 'monthly' as const, label: 'Mensuel', icon: '🗓️', description: 'Certains jours du mois' },
  { value: 'x-times-per-month' as const, label: 'X fois par mois', icon: '📊', description: 'Ex: 4 fois par mois' },
  { value: 'custom' as const, label: 'Personnalisé', icon: '⚙️', description: 'Configuration avancée' }
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Lun', short: 'L', full: 'Lundi' },
  { value: 1, label: 'Mar', short: 'M', full: 'Mardi' },
  { value: 2, label: 'Mer', short: 'M', full: 'Mercredi' },
  { value: 3, label: 'Jeu', short: 'J', full: 'Jeudi' },
  { value: 4, label: 'Ven', short: 'V', full: 'Vendredi' },
  { value: 5, label: 'Sam', short: 'S', full: 'Samedi' },
  { value: 6, label: 'Dim', short: 'D', full: 'Dimanche' }
];

export const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
  short: `${i + 1}`
}));

export const UNLOCK_CONDITION_OPTIONS = [
  { value: 'streak' as const, label: 'Streak minimum', icon: '🔥', description: 'Débloquer après X jours consécutifs' },
  { value: 'total_completions' as const, label: 'Complétion totale', icon: '✅', description: 'Débloquer après Y complétions au total' },
  { value: 'manual' as const, label: 'Manuel', icon: '🔓', description: 'Débloquer manuellement' }
];

export const CHALLENGE_END_OPTIONS = [
  { value: 'archive' as const, label: 'Archiver', icon: '📦', description: 'Désactiver mais garder l\'historique' },
  { value: 'delete' as const, label: 'Supprimer', icon: '🗑️', description: 'Supprimer automatiquement' },
  { value: 'convert' as const, label: 'Convertir', icon: '🔄', description: 'Proposer de convertir en habitude permanente' }
];

export const CHALLENGE_DURATION_PRESETS = [
  { value: 7, label: '1 semaine' },
  { value: 14, label: '2 semaines' },
  { value: 21, label: '21 jours' },
  { value: 30, label: '1 mois' },
  { value: 60, label: '2 mois' },
  { value: 90, label: '3 mois' },
  { value: 0, label: 'Personnalisé' }
];
