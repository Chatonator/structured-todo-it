export type TaskCategory = 'Obligation' | 'Quotidien' | 'Envie' | 'Autres';
export type SubTaskCategory = 'Le plus important' | 'Important' | 'Peut attendre' | 'Si j\'ai le temps';
export type TaskContext = 'Pro' | 'Perso';
export type RecurrenceInterval = 'daily' | 'weekly' | 'bi-monthly' | 'monthly';

// ============= Eisenhower System =============
// The new primary classification: two independent boolean flags
export interface EisenhowerFlags {
  isImportant: boolean;
  isUrgent: boolean;
}

export type EisenhowerQuadrant = 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';

/**
 * Derive quadrant from boolean flags
 */
export function getQuadrant(flags: EisenhowerFlags): EisenhowerQuadrant {
  if (flags.isImportant && flags.isUrgent) return 'urgent-important';
  if (flags.isImportant && !flags.isUrgent) return 'important-not-urgent';
  if (!flags.isImportant && flags.isUrgent) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

/**
 * Derive the legacy TaskCategory from Eisenhower flags.
 * This keeps the entire existing UI working without changes.
 */
export function categoryFromEisenhower(flags: EisenhowerFlags): TaskCategory {
  if (flags.isImportant && flags.isUrgent) return 'Obligation';
  if (!flags.isImportant && flags.isUrgent) return 'Quotidien';
  if (flags.isImportant && !flags.isUrgent) return 'Envie';
  return 'Autres';
}

/**
 * Derive Eisenhower flags from a legacy TaskCategory
 */
export function eisenhowerFromCategory(category: TaskCategory): EisenhowerFlags {
  switch (category) {
    case 'Obligation': return { isImportant: true, isUrgent: true };
    case 'Quotidien': return { isImportant: false, isUrgent: true };
    case 'Envie': return { isImportant: true, isUrgent: false };
    case 'Autres': return { isImportant: false, isUrgent: false };
  }
}

export const QUADRANT_LABELS: Record<EisenhowerQuadrant, string> = {
  'urgent-important': 'Cruciales',
  'important-not-urgent': 'Envies',
  'urgent-not-important': 'Régulières',
  'not-urgent-not-important': 'Optionnelles',
};

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  subCategory?: SubTaskCategory;
  context: TaskContext;
  estimatedTime: number;
  createdAt: Date;
  parentId?: string;
  level: 0 | 1 | 2;
  isExpanded: boolean;
  isCompleted: boolean;
  duration?: number;
  projectId?: string;
  projectStatus?: 'todo' | 'in-progress' | 'done';
  // Eisenhower flags (source of truth for category)
  isImportant?: boolean;
  isUrgent?: boolean;
  // Note: Les champs temporels (scheduledDate, scheduledTime, startTime, isRecurring, recurrenceInterval, lastCompletedAt)
  // sont désormais gérés exclusivement via time_events
}

// Mapping technique pour les classes CSS (sans accents, minuscules)
export const CATEGORY_CSS_NAMES = {
  'Obligation': 'obligation',
  'Quotidien': 'quotidien', 
  'Envie': 'envie',
  'Autres': 'autres'
} as const;

export const CATEGORY_CONFIG = {
  'Obligation': {
    cssName: 'obligation',
    color: 'bg-category-obligation-light text-category-obligation border-category-obligation',
    borderPattern: 'border-l-4 border-l-category-obligation',
    eisenhowerQuadrant: 'urgent-important' as const
  },
  'Quotidien': {
    cssName: 'quotidien',
    color: 'bg-category-quotidien-light text-category-quotidien border-category-quotidien',
    borderPattern: 'border-l-4 border-l-category-quotidien',
    eisenhowerQuadrant: 'urgent-not-important' as const
  },
  'Envie': {
    cssName: 'envie',
    color: 'bg-category-envie-light text-category-envie border-category-envie',
    borderPattern: 'border-l-4 border-l-category-envie',
    eisenhowerQuadrant: 'important-not-urgent' as const
  },
  'Autres': {
    cssName: 'autres',
    color: 'bg-category-autres-light text-category-autres border-category-autres',
    borderPattern: 'border-l-4 border-l-category-autres',
    eisenhowerQuadrant: 'not-urgent-not-important' as const
  }
} as const;

export const SUB_CATEGORY_CONFIG = {
  'Le plus important': {
    color: 'bg-priority-highest-light text-priority-highest border-priority-highest',
    colorDark: 'bg-priority-highest-dark text-white',
    pattern: 'border-l-4 border-l-priority-highest',
    priority: 4
  },
  'Important': {
    color: 'bg-priority-high-light text-priority-high border-priority-high',
    colorDark: 'bg-priority-high-dark text-white',
    pattern: 'border-l-4 border-l-priority-high',
    priority: 3
  },
  'Peut attendre': {
    color: 'bg-priority-medium-light text-priority-medium border-priority-medium',
    colorDark: 'bg-priority-medium-dark text-white',
    pattern: 'border-l-4 border-l-priority-medium',
    priority: 2
  },
  'Si j\'ai le temps': {
    color: 'bg-priority-low-light text-priority-low border-priority-low',
    colorDark: 'bg-priority-low-dark text-white',
    pattern: 'border-l-4 border-l-priority-low',
    priority: 1
  }
} as const;

export const CONTEXT_CONFIG = {
  'Pro': {
    label: '💼 Pro',
    color: 'bg-context-pro-light text-context-pro border-context-pro',
    colorDark: 'bg-context-pro-dark text-white'
  },
  'Perso': {
    label: '🏠 Perso',
    color: 'bg-context-perso-light text-context-perso border-context-perso',
    colorDark: 'bg-context-perso-dark text-white'
  }
} as const;

export const TASK_LEVELS = {
  0: { symbol: '●', bgColor: 'bg-white', textSize: 'text-sm' },
  1: { symbol: '◦', bgColor: 'bg-muted', textSize: 'text-xs' },
  2: { symbol: '▫', bgColor: 'bg-muted/50', textSize: 'text-xs' }
} as const;

export const TIME_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
  { value: 300, label: '5h' },
  { value: 360, label: '6h' },
  { value: 480, label: '8h' }
];

export const RECURRENCE_OPTIONS = [
  { value: 'daily' as RecurrenceInterval, label: 'Quotidien' },
  { value: 'weekly' as RecurrenceInterval, label: 'Hebdomadaire' },
  { value: 'bi-monthly' as RecurrenceInterval, label: 'Bi-mensuel (15 jours)' },
  { value: 'monthly' as RecurrenceInterval, label: 'Mensuel' }
];

// Mapping des noms de catégories internes vers noms d'affichage
export const CATEGORY_DISPLAY_NAMES: Record<TaskCategory, string> = {
  'Obligation': 'Cruciales',
  'Quotidien': 'Régulières',
  'Envie': 'Envies',
  'Autres': 'Optionnelles'
};

/**
 * Obtenir le nom d'affichage d'une catégorie
 */
export function getCategoryDisplayName(category: TaskCategory): string {
  return CATEGORY_DISPLAY_NAMES[category];
}

