/**
 * Utilitaires de styling centralisés
 * Retourne les classes Tailwind appropriées pour chaque type d'élément
 */

import { TaskCategory, TaskContext, SubTaskCategory } from '@/types/task';

// ===== CATÉGORIES =====

export type CategoryStyleVariant = 'badge' | 'border' | 'background' | 'text';

interface CategoryStyles {
  badge: string;
  border: string;
  background: string;
  text: string;
}

const CATEGORY_STYLES: Record<TaskCategory, CategoryStyles> = {
  'Obligation': {
    badge: 'bg-category-obligation/10 border-category-obligation text-category-obligation',
    border: 'border-l-category-obligation',
    background: 'bg-category-obligation-light',
    text: 'text-category-obligation'
  },
  'Quotidien': {
    badge: 'bg-category-quotidien/10 border-category-quotidien text-category-quotidien',
    border: 'border-l-category-quotidien',
    background: 'bg-category-quotidien-light',
    text: 'text-category-quotidien'
  },
  'Envie': {
    badge: 'bg-category-envie/10 border-category-envie text-category-envie',
    border: 'border-l-category-envie',
    background: 'bg-category-envie-light',
    text: 'text-category-envie'
  },
  'Autres': {
    badge: 'bg-category-autres/10 border-category-autres text-category-autres',
    border: 'border-l-category-autres',
    background: 'bg-category-autres-light',
    text: 'text-category-autres'
  }
};

/**
 * Retourne les classes CSS pour une catégorie
 */
export function getCategoryClasses(
  category: TaskCategory, 
  variant: CategoryStyleVariant = 'badge'
): string {
  return CATEGORY_STYLES[category]?.[variant] ?? CATEGORY_STYLES['Autres'][variant];
}

// ===== PRIORITÉS =====

export type PriorityStyleVariant = 'badge' | 'text' | 'background';

interface PriorityStyles {
  badge: string;
  text: string;
  background: string;
}

const PRIORITY_STYLES: Record<SubTaskCategory, PriorityStyles> = {
  'Le plus important': {
    badge: 'bg-priority-highest/10 border-priority-highest text-priority-highest',
    text: 'text-priority-highest',
    background: 'bg-priority-highest-light'
  },
  'Important': {
    badge: 'bg-priority-high/10 border-priority-high text-priority-high',
    text: 'text-priority-high',
    background: 'bg-priority-high-light'
  },
  'Peut attendre': {
    badge: 'bg-priority-medium/10 border-priority-medium text-priority-medium',
    text: 'text-priority-medium',
    background: 'bg-priority-medium-light'
  },
  "Si j'ai le temps": {
    badge: 'bg-priority-low/10 border-priority-low text-priority-low',
    text: 'text-priority-low',
    background: 'bg-priority-low-light'
  }
};

/**
 * Retourne les classes CSS pour une priorité
 */
export function getPriorityClasses(
  priority: SubTaskCategory | undefined,
  variant: PriorityStyleVariant = 'badge'
): string {
  if (!priority) return 'bg-muted text-muted-foreground';
  return PRIORITY_STYLES[priority]?.[variant] ?? 'bg-muted text-muted-foreground';
}

/**
 * Convertit une priorité en niveau numérique (4 = plus important, 1 = moins)
 */
export function getPriorityLevel(priority: SubTaskCategory | undefined): number {
  const levels: Record<SubTaskCategory, number> = {
    'Le plus important': 4,
    'Important': 3,
    'Peut attendre': 2,
    "Si j'ai le temps": 1
  };
  return priority ? levels[priority] ?? 0 : 0;
}

// ===== CONTEXTES =====

export type ContextStyleVariant = 'badge' | 'text' | 'icon';

interface ContextStyles {
  badge: string;
  text: string;
  icon: string;
}

const CONTEXT_STYLES: Record<TaskContext, ContextStyles> = {
  'Pro': {
    badge: 'bg-context-pro/10 border-context-pro text-context-pro',
    text: 'text-context-pro',
    icon: '💼'
  },
  'Perso': {
    badge: 'bg-context-perso/10 border-context-perso text-context-perso',
    text: 'text-context-perso',
    icon: '🏠'
  }
};

/**
 * Retourne les classes CSS pour un contexte
 */
export function getContextClasses(
  context: TaskContext,
  variant: ContextStyleVariant = 'badge'
): string {
  return CONTEXT_STYLES[context]?.[variant] ?? '';
}

/**
 * Retourne l'icône emoji pour un contexte
 */
export function getContextIcon(context: TaskContext): string {
  return CONTEXT_STYLES[context]?.icon ?? '';
}

// ===== STATUTS =====

export type StatusType = 'completed' | 'pending' | 'in-progress' | 'todo' | 'done';
export type StatusStyleVariant = 'badge' | 'text' | 'background';

interface StatusStyles {
  badge: string;
  text: string;
  background: string;
}

const STATUS_STYLES: Record<StatusType, StatusStyles> = {
  'completed': {
    badge: 'bg-system-success/10 border-system-success text-system-success',
    text: 'text-system-success',
    background: 'bg-system-success/10'
  },
  'done': {
    badge: 'bg-system-success/10 border-system-success text-system-success',
    text: 'text-system-success',
    background: 'bg-system-success/10'
  },
  'in-progress': {
    badge: 'bg-system-info/10 border-system-info text-system-info',
    text: 'text-system-info',
    background: 'bg-system-info/10'
  },
  'pending': {
    badge: 'bg-system-warning/10 border-system-warning text-system-warning',
    text: 'text-system-warning',
    background: 'bg-system-warning/10'
  },
  'todo': {
    badge: 'bg-muted border-border text-muted-foreground',
    text: 'text-muted-foreground',
    background: 'bg-muted'
  }
};

/**
 * Retourne les classes CSS pour un statut
 */
export function getStatusClasses(
  status: StatusType,
  variant: StatusStyleVariant = 'badge'
): string {
  return STATUS_STYLES[status]?.[variant] ?? STATUS_STYLES['todo'][variant];
}

/**
 * Retourne le label d'affichage pour un statut
 */
export function getStatusLabel(status: StatusType): string {
  const labels: Record<StatusType, string> = {
    'completed': 'Terminé',
    'done': 'Terminé',
    'in-progress': 'En cours',
    'pending': 'En attente',
    'todo': 'À faire'
  };
  return labels[status] ?? status;
}
