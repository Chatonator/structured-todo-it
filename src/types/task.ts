export type TaskCategory = 'critical' | 'urgent' | 'important' | 'low_priority';
export type LegacyTaskCategory =
  | 'Obligation'
  | 'Quotidien'
  | 'Envie'
  | 'Autres'
  | 'Cruciales'
  | 'Regulieres'
  | 'Regulières'
  | 'Envies'
  | 'Optionnelles';
export type AnyTaskCategory = TaskCategory | LegacyTaskCategory | string;
export type SubTaskCategory = 'Le plus important' | 'Important' | 'Peut attendre' | 'Si j\'ai le temps';
export type TaskContext = 'Pro' | 'Perso';
export type RecurrenceInterval = 'daily' | 'weekly' | 'bi-monthly' | 'monthly';

export const TASK_CATEGORY_VALUES = ['critical', 'urgent', 'important', 'low_priority'] as const satisfies readonly TaskCategory[];

const LEGACY_CATEGORY_NORMALIZATION: Record<string, TaskCategory> = {
  obligation: 'critical',
  quotidien: 'urgent',
  envie: 'important',
  autres: 'low_priority',
  cruciales: 'critical',
  regulieres: 'urgent',
  'régulières': 'urgent',
  envies: 'important',
  optionnelles: 'low_priority',
  critical: 'critical',
  urgent: 'urgent',
  important: 'important',
  low_priority: 'low_priority',
  'low-priority': 'low_priority',
  lowpriority: 'low_priority',
};

export function normalizeTaskCategory(category: AnyTaskCategory | null | undefined): TaskCategory {
  if (typeof category !== 'string') {
    return 'low_priority';
  }

  const normalized = LEGACY_CATEGORY_NORMALIZATION[category.trim().toLowerCase()];
  return normalized ?? 'low_priority';
}

// ============= Eisenhower System =============
export interface EisenhowerFlags {
  isImportant: boolean;
  isUrgent: boolean;
}

export type EisenhowerQuadrant =
  | 'urgent-important'
  | 'important-not-urgent'
  | 'urgent-not-important'
  | 'not-urgent-not-important';

export function getQuadrant(flags: EisenhowerFlags): EisenhowerQuadrant {
  if (flags.isImportant && flags.isUrgent) return 'urgent-important';
  if (flags.isImportant && !flags.isUrgent) return 'important-not-urgent';
  if (!flags.isImportant && flags.isUrgent) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

export function categoryFromEisenhower(flags: EisenhowerFlags): TaskCategory {
  if (flags.isImportant && flags.isUrgent) return 'critical';
  if (!flags.isImportant && flags.isUrgent) return 'urgent';
  if (flags.isImportant && !flags.isUrgent) return 'important';
  return 'low_priority';
}

export function eisenhowerFromCategory(category: AnyTaskCategory): EisenhowerFlags {
  switch (normalizeTaskCategory(category)) {
    case 'critical':
      return { isImportant: true, isUrgent: true };
    case 'urgent':
      return { isImportant: false, isUrgent: true };
    case 'important':
      return { isImportant: true, isUrgent: false };
    case 'low_priority':
    default:
      return { isImportant: false, isUrgent: false };
  }
}

export const QUADRANT_LABELS: Record<EisenhowerQuadrant, string> = {
  'urgent-important': 'Critique',
  'important-not-urgent': 'Important',
  'urgent-not-important': 'Urgent',
  'not-urgent-not-important': 'Faible priorité',
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
  isImportant?: boolean;
  isUrgent?: boolean;
  actualTime?: number;
}

export const CATEGORY_CSS_NAMES: Record<TaskCategory, string> = {
  critical: 'critical',
  urgent: 'urgent',
  important: 'important',
  low_priority: 'low-priority',
};

export const CATEGORY_CONFIG = {
  critical: {
    cssName: 'critical',
    color: 'bg-category-critical-light text-category-critical border-category-critical',
    borderPattern: 'border-l-4 border-l-category-critical',
    eisenhowerQuadrant: 'urgent-important' as const,
  },
  urgent: {
    cssName: 'urgent',
    color: 'bg-category-urgent-light text-category-urgent border-category-urgent',
    borderPattern: 'border-l-4 border-l-category-urgent',
    eisenhowerQuadrant: 'urgent-not-important' as const,
  },
  important: {
    cssName: 'important',
    color: 'bg-category-important-light text-category-important border-category-important',
    borderPattern: 'border-l-4 border-l-category-important',
    eisenhowerQuadrant: 'important-not-urgent' as const,
  },
  low_priority: {
    cssName: 'low-priority',
    color: 'bg-category-low-priority-light text-category-low-priority border-category-low-priority',
    borderPattern: 'border-l-4 border-l-category-low-priority',
    eisenhowerQuadrant: 'not-urgent-not-important' as const,
  },
} as const satisfies Record<TaskCategory, {
  cssName: string;
  color: string;
  borderPattern: string;
  eisenhowerQuadrant: EisenhowerQuadrant;
}>;

export const SUB_CATEGORY_CONFIG = {
  'Le plus important': {
    color: 'bg-priority-highest-light text-priority-highest border-priority-highest',
    colorDark: 'bg-priority-highest-dark text-white',
    pattern: 'border-l-4 border-l-priority-highest',
    priority: 4,
  },
  Important: {
    color: 'bg-priority-high-light text-priority-high border-priority-high',
    colorDark: 'bg-priority-high-dark text-white',
    pattern: 'border-l-4 border-l-priority-high',
    priority: 3,
  },
  'Peut attendre': {
    color: 'bg-priority-medium-light text-priority-medium border-priority-medium',
    colorDark: 'bg-priority-medium-dark text-white',
    pattern: 'border-l-4 border-l-priority-medium',
    priority: 2,
  },
  'Si j\'ai le temps': {
    color: 'bg-priority-low-light text-priority-low border-priority-low',
    colorDark: 'bg-priority-low-dark text-white',
    pattern: 'border-l-4 border-l-priority-low',
    priority: 1,
  },
} as const;

export const CONTEXT_CONFIG = {
  Pro: {
    label: '💼 Pro',
    color: 'bg-context-pro-light text-context-pro border-context-pro',
    colorDark: 'bg-context-pro-dark text-white',
  },
  Perso: {
    label: '🏠 Perso',
    color: 'bg-context-perso-light text-context-perso border-context-perso',
    colorDark: 'bg-context-perso-dark text-white',
  },
} as const;

export const TASK_LEVELS = {
  0: { symbol: '●', bgColor: 'bg-white', textSize: 'text-sm' },
  1: { symbol: '◦', bgColor: 'bg-muted', textSize: 'text-xs' },
  2: { symbol: '▫', bgColor: 'bg-muted/50', textSize: 'text-xs' },
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
  { value: 480, label: '8h' },
];

export const RECURRENCE_OPTIONS = [
  { value: 'daily' as RecurrenceInterval, label: 'Quotidien' },
  { value: 'weekly' as RecurrenceInterval, label: 'Hebdomadaire' },
  { value: 'bi-monthly' as RecurrenceInterval, label: 'Bi-mensuel (15 jours)' },
  { value: 'monthly' as RecurrenceInterval, label: 'Mensuel' },
];

export const CATEGORY_DISPLAY_NAMES: Record<TaskCategory, string> = {
  critical: 'Critique',
  urgent: 'Urgent',
  important: 'Important',
  low_priority: 'Faible priorité',
};

export function getCategoryDisplayName(category: AnyTaskCategory): string {
  return CATEGORY_DISPLAY_NAMES[normalizeTaskCategory(category)];
}
