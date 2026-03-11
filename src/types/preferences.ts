export type Theme = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'normal' | 'large' | 'xlarge';
export type SoundType = 'discrete' | 'normal' | 'fun';
export type FocusDuration = 25 | 45 | 60 | number;

export interface CategoryOrder {
  id: string;
  label: string;
  order: number;
  visible: boolean;
}

export interface CategoryColors {
  Obligation: string;
  Quotidien: string;
  Envie: string;
  Autres: string;
}

export interface UserPreferences {
  theme: Theme;
  textSize: TextSize;
  highContrast: boolean;
  reducedAnimations: boolean;
  pushNotifications: boolean;
  soundEffects: boolean;
  vibrations: boolean;
  soundType: SoundType;
  showHabits: boolean;
  showGamification: boolean;
  showTeams: boolean;
  categoryOrder: CategoryOrder[];
  categoryColors: CategoryColors;
  categoryPaletteVersion: number;
  sidebarShowHabits: boolean;
  sidebarShowProjects: boolean;
  sidebarShowTeamTasks: boolean;
  habitDailyReminders: boolean;
  habitReminderTime: string;
  habitDefaultFrequency: 'daily' | 'weekly';
  habitStrictMode: boolean;
  levelNotifications: boolean;
  showXpInHeader: boolean;
  autoDailyChallenges: boolean;
  showStreaks: boolean;
  focusModeEnabled: boolean;
  focusDuration: FocusDuration;
  focusHideNotifications: boolean;
  focusHideGamification: boolean;
  focusHideOtherViews: boolean;
  timelineDefaultQuota: number;
  showProContext: boolean;
  allFilterIncludeTeams: boolean;
  allFilterTeamIds: string[];
}

export const CATEGORY_PALETTE_VERSION = 2;

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  textSize: 'normal',
  highContrast: false,
  reducedAnimations: false,
  pushNotifications: true,
  soundEffects: true,
  vibrations: true,
  soundType: 'normal',
  showHabits: true,
  showGamification: true,
  showTeams: true,
  categoryOrder: [
    { id: 'home', label: 'Home', order: 0, visible: true },
    { id: 'tasks', label: 'Tâches', order: 1, visible: true },
    { id: 'eisenhower', label: 'Eisenhower', order: 2, visible: true },
    { id: 'timeline', label: 'Timeline', order: 3, visible: true },
    { id: 'projects', label: 'Projets', order: 4, visible: true },
    { id: 'habits', label: 'Habitudes', order: 5, visible: true },
    { id: 'rewards', label: 'Récompenses', order: 6, visible: true },
    { id: 'completed', label: 'Terminées', order: 7, visible: true },
  ],
  categoryColors: {
    Obligation: '#ef4444',
    Quotidien: '#eab308',
    Envie: '#22c55e',
    Autres: '#3b82f6',
  },
  categoryPaletteVersion: CATEGORY_PALETTE_VERSION,
  sidebarShowHabits: false,
  sidebarShowProjects: false,
  sidebarShowTeamTasks: false,
  habitDailyReminders: true,
  habitReminderTime: '09:00',
  habitDefaultFrequency: 'daily',
  habitStrictMode: false,
  levelNotifications: true,
  showXpInHeader: true,
  autoDailyChallenges: true,
  showStreaks: true,
  focusModeEnabled: false,
  focusDuration: 25,
  focusHideNotifications: true,
  focusHideGamification: true,
  focusHideOtherViews: false,
  timelineDefaultQuota: 240,
  showProContext: true,
  allFilterIncludeTeams: true,
  allFilterTeamIds: [],
};
