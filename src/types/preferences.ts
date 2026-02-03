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
  // Apparence
  theme: Theme;
  textSize: TextSize;
  highContrast: boolean;
  reducedAnimations: boolean;

  // Notifications
  pushNotifications: boolean;
  soundEffects: boolean;
  vibrations: boolean;
  soundType: SoundType;

  // Interface
  showHabits: boolean;
  showGamification: boolean;
  showTeams: boolean;
  categoryOrder: CategoryOrder[];
  categoryColors: CategoryColors;

  // Barre latérale
  sidebarShowHabits: boolean;
  sidebarShowProjects: boolean;
  sidebarShowTeamTasks: boolean;

  // Habitudes
  habitDailyReminders: boolean;
  habitReminderTime: string;
  habitDefaultFrequency: 'daily' | 'weekly';
  habitStrictMode: boolean;

  // Gamification
  levelNotifications: boolean;
  showXpInHeader: boolean;
  autoDailyChallenges: boolean;
  showStreaks: boolean;

  // Mode Focus
  focusModeEnabled: boolean;
  focusDuration: FocusDuration;
  focusHideNotifications: boolean;
  focusHideGamification: boolean;
  focusHideOtherViews: boolean;

  // Timeline
  timelineDefaultQuota: number; // en minutes (défaut: 240 = 4h)
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  // Apparence
  theme: 'system',
  textSize: 'normal',
  highContrast: false,
  reducedAnimations: false,

  // Notifications
  pushNotifications: true,
  soundEffects: true,
  vibrations: true,
  soundType: 'normal',

  // Interface
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
    Obligation: 'hsl(var(--destructive))',
    Quotidien: 'hsl(var(--primary))',
    Envie: 'hsl(var(--accent))',
    Autres: 'hsl(var(--muted))',
  },

  // Barre latérale
  sidebarShowHabits: false,
  sidebarShowProjects: false,
  sidebarShowTeamTasks: false,

  // Habitudes
  habitDailyReminders: true,
  habitReminderTime: '09:00',
  habitDefaultFrequency: 'daily',
  habitStrictMode: false,

  // Gamification
  levelNotifications: true,
  showXpInHeader: true,
  autoDailyChallenges: true,
  showStreaks: true,

  // Mode Focus
  focusModeEnabled: false,
  focusDuration: 25,
  focusHideNotifications: true,
  focusHideGamification: true,
  focusHideOtherViews: false,

  // Timeline
  timelineDefaultQuota: 240,
};
