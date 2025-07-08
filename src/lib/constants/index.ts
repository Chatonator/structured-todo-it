
/**
 * Constantes centralisées - Single Source of Truth
 * Regroupement de toutes les constantes métier
 */

import { TaskCategory, SubTaskCategory, TaskContext, CalendarView } from '@/types/task';

// Configuration des catégories de tâches
export const TASK_CATEGORIES: Record<TaskCategory, {
  id: TaskCategory;
  label: string;
  description: string;
  colorKey: string;
  eisenhowerQuadrant: 'urgent-important' | 'urgent-not-important' | 'important-not-urgent' | 'not-urgent-not-important';
}> = {
  'Obligation': {
    id: 'Obligation',
    label: 'Obligation',
    description: 'Tâches urgentes et importantes',
    colorKey: 'obligation',
    eisenhowerQuadrant: 'urgent-important',
  },
  'Quotidien': {
    id: 'Quotidien',
    label: 'Quotidien', 
    description: 'Tâches quotidiennes et routines',
    colorKey: 'quotidien',
    eisenhowerQuadrant: 'urgent-not-important',
  },
  'Envie': {
    id: 'Envie',
    label: 'Envie',
    description: 'Tâches importantes mais non urgentes',
    colorKey: 'envie',
    eisenhowerQuadrant: 'important-not-urgent',
  },
  'Autres': {
    id: 'Autres',
    label: 'Autres',
    description: 'Autres tâches',
    colorKey: 'autres',
    eisenhowerQuadrant: 'not-urgent-not-important',
  },
} as const;

// Configuration des sous-catégories
export const SUB_CATEGORIES: Record<SubTaskCategory, {
  id: SubTaskCategory;
  label: string;
  priority: number;
  colorKey: string;
}> = {
  'Le plus important': {
    id: 'Le plus important',
    label: 'Le plus important',
    priority: 4,
    colorKey: 'priority-highest',
  },
  'Important': {
    id: 'Important',
    label: 'Important', 
    priority: 3,
    colorKey: 'priority-high',
  },
  'Peut attendre': {
    id: 'Peut attendre',
    label: 'Peut attendre',
    priority: 2,
    colorKey: 'priority-medium',
  },
  'Si j\'ai le temps': {
    id: 'Si j\'ai le temps',
    label: 'Si j\'ai le temps',
    priority: 1,
    colorKey: 'priority-low',
  },
} as const;

// Configuration des contextes
export const TASK_CONTEXTS: Record<TaskContext, {
  id: TaskContext;
  label: string;
  icon: string;
  colorKey: string;
}> = {
  'Pro': {
    id: 'Pro',
    label: 'Professionnel',
    icon: '💼',
    colorKey: 'context-pro',
  },
  'Perso': {
    id: 'Perso',
    label: 'Personnel',
    icon: '🏠',
    colorKey: 'context-perso',
  },
} as const;

// Configuration des vues du calendrier
export const CALENDAR_VIEWS: Record<CalendarView, {
  id: CalendarView;
  label: string;
  icon: string;
}> = {
  'day': {
    id: 'day',
    label: 'Jour',
    icon: '📅',
  },
  'week': {
    id: 'week', 
    label: 'Semaine',
    icon: '📆',
  },
  'month': {
    id: 'month',
    label: 'Mois',
    icon: '🗓️',
  },
  'three-months': {
    id: 'three-months',
    label: '3 Mois',
    icon: '📊',
  },
} as const;

// Options de durée prédéfinies
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
] as const;

// Configuration des niveaux de tâches
export const TASK_LEVELS = {
  0: { symbol: '●', label: 'Tâche principale', maxChildren: 2 },
  1: { symbol: '◦', label: 'Sous-tâche', maxChildren: 1 },
  2: { symbol: '▫', label: 'Sous-sous-tâche', maxChildren: 0 },
} as const;

// Clés de stockage
export const STORAGE_KEYS = {
  TASKS: 'todo-it-tasks',
  PINNED_TASKS: 'todo-it-pinned-tasks',
  USER_PREFERENCES: 'todo-it-preferences',
  THEME: 'todo-it-theme',
} as const;

// Configuration API
export const API_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  API_TIMEOUT: 10000, // 10 secondes
} as const;

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau',
  VALIDATION_ERROR: 'Données invalides',
  NOT_FOUND: 'Élément non trouvé',
  UNAUTHORIZED: 'Accès non autorisé',
  SERVER_ERROR: 'Erreur serveur',
  UNKNOWN_ERROR: 'Erreur inconnue',
} as const;

// Types dérivés pour la sécurité TypeScript
export type TaskCategoryConfig = typeof TASK_CATEGORIES[TaskCategory];
export type SubCategoryConfig = typeof SUB_CATEGORIES[SubTaskCategory];
export type TaskContextConfig = typeof TASK_CONTEXTS[TaskContext];
export type CalendarViewConfig = typeof CALENDAR_VIEWS[CalendarView];
export type TimeOption = typeof TIME_OPTIONS[number];
export type TaskLevelConfig = typeof TASK_LEVELS[keyof typeof TASK_LEVELS];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
