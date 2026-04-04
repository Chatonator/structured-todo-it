/**
 * Utilitaires de styling centralisés
 * Retourne les classes Tailwind appropriées pour chaque type d'élément
 */
import { TaskCategory, TaskContext, SubTaskCategory } from '@/types/task';

// ===== CATÉGORIES =====

export type CategoryStyleVariant = 'badge' | 'border' | 'background' | 'text';

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  critical: 'hsl(var(--category-critical))',
  urgent: 'hsl(var(--category-urgent))',
  important: 'hsl(var(--category-important))',
  low_priority: 'hsl(var(--category-low-priority))',
};

const CATEGORY_SURFACES: Record<TaskCategory, string> = {
  critical: 'hsl(var(--category-critical-light))',
  urgent: 'hsl(var(--category-urgent-light))',
  important: 'hsl(var(--category-important-light))',
  low_priority: 'hsl(var(--category-low-priority-light))',
};

export function getCategoryColorValue(category: TaskCategory): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.low_priority;
}

export function getCategorySurfaceValue(category: TaskCategory): string {
  return CATEGORY_SURFACES[category] ?? CATEGORY_SURFACES.low_priority;
}

export function getCategoryTintValue(category: TaskCategory, alpha = 0.16): string {
  switch (category) {
    case 'critical':
      return `hsl(var(--category-critical) / ${alpha})`;
    case 'urgent':
      return `hsl(var(--category-urgent) / ${alpha})`;
    case 'important':
      return `hsl(var(--category-important) / ${alpha})`;
    case 'low_priority':
    default:
      return `hsl(var(--category-low-priority) / ${alpha})`;
  }
}

export function getCategoryBorderTintValue(category: TaskCategory, alpha = 0.3): string {
  switch (category) {
    case 'critical':
      return `hsl(var(--category-critical) / ${alpha})`;
    case 'urgent':
      return `hsl(var(--category-urgent) / ${alpha})`;
    case 'important':
      return `hsl(var(--category-important) / ${alpha})`;
    case 'low_priority':
    default:
      return `hsl(var(--category-low-priority) / ${alpha})`;
  }
}

export interface SidebarExpandedTaskStyles {
  backgroundColor: string;
  borderColor: string;
  boxShadow: string;
  accentColor: string;
}

export function getSidebarExpandedTaskStyles(category: TaskCategory): SidebarExpandedTaskStyles {
  const borderColor = getCategoryBorderTintValue(category, 0.34);
  const accentColor = getCategoryColorValue(category);

  return {
    backgroundColor: getCategoryTintValue(category, 0.18),
    borderColor,
    boxShadow: `inset 0 0 0 1px ${borderColor}`,
    accentColor,
  };
}

interface CategoryStyles {
  badge: string;
  border: string;
  background: string;
  text: string;
}

const CATEGORY_STYLES: Record<TaskCategory, CategoryStyles> = {
  critical: {
    badge: 'bg-category-critical/10 border-category-critical text-category-critical',
    border: 'border-l-category-critical',
    background: 'bg-category-critical-light',
    text: 'text-category-critical'
  },
  urgent: {
    badge: 'bg-category-urgent/10 border-category-urgent text-category-urgent',
    border: 'border-l-category-urgent',
    background: 'bg-category-urgent-light',
    text: 'text-category-urgent'
  },
  important: {
    badge: 'bg-category-important/10 border-category-important text-category-important',
    border: 'border-l-category-important',
    background: 'bg-category-important-light',
    text: 'text-category-important'
  },
  low_priority: {
    badge: 'bg-category-low-priority/10 border-category-low-priority text-category-low-priority',
    border: 'border-l-category-low-priority',
    background: 'bg-category-low-priority-light',
    text: 'text-category-low-priority'
  }
};

export function getCategoryClasses(
  category: TaskCategory,
  variant: CategoryStyleVariant = 'badge'
): string {
  return CATEGORY_STYLES[category]?.[variant] ?? CATEGORY_STYLES.low_priority[variant];
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

export function getPriorityClasses(
  priority: SubTaskCategory | undefined,
  variant: PriorityStyleVariant = 'badge'
): string {
  if (!priority) return 'bg-muted text-muted-foreground';
  return PRIORITY_STYLES[priority]?.[variant] ?? 'bg-muted text-muted-foreground';
}

export function getPriorityLevel(priority: SubTaskCategory | undefined): number {
  const levels: Record<SubTaskCategory, number> = {
    'Le plus important': 4,
    'Important': 3,
    'Peut attendre': 2,
    "Si j'ai le temps": 1
  };
  return priority ? levels[priority] ?? 0 : 0;
}

export function getPriorityEventClasses(level: number): string {
  const classes: Record<number, string> = {
    4: 'bg-priority-highest/20 border-l-priority-highest',
    3: 'bg-priority-high/20 border-l-priority-high',
    2: 'bg-priority-medium/20 border-l-priority-medium',
    1: 'bg-priority-low/20 border-l-priority-low',
  };
  return classes[level] || 'bg-primary/20 border-l-primary';
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

export function getContextClasses(
  context: TaskContext,
  variant: ContextStyleVariant = 'badge'
): string {
  return CONTEXT_STYLES[context]?.[variant] ?? '';
}

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

export function getStatusClasses(
  status: StatusType,
  variant: StatusStyleVariant = 'badge'
): string {
  return STATUS_STYLES[status]?.[variant] ?? STATUS_STYLES['todo'][variant];
}

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

// ===== TIMELINE STATUS =====

export type TimelineStatusType = 'completed' | 'pending' | 'skipped' | 'missed';

const TIMELINE_STATUS_STYLES: Record<TimelineStatusType, string> = {
  'completed': 'bg-system-success/10 text-system-success border-system-success/20',
  'pending': 'bg-primary/10 text-primary border-primary/20',
  'skipped': 'bg-muted text-muted-foreground border-border',
  'missed': 'bg-system-error/10 text-system-error border-system-error/20'
};

export function getTimelineStatusClasses(status: TimelineStatusType): string {
  return TIMELINE_STATUS_STYLES[status] ?? TIMELINE_STATUS_STYLES['pending'];
}

// ===== ROLE STYLES =====

export type TeamRole = 'owner' | 'admin' | 'member';

const ROLE_STYLES: Record<TeamRole, string> = {
  'owner': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
  'admin': 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
  'member': 'bg-muted text-muted-foreground border-border'
};

export function getRoleClasses(role: TeamRole): string {
  return ROLE_STYLES[role] ?? ROLE_STYLES['member'];
}

export function getRoleLabel(role: TeamRole): string {
  const labels: Record<TeamRole, string> = {
    'owner': 'Propriétaire',
    'admin': 'Admin',
    'member': 'Membre'
  };
  return labels[role] ?? role;
}

// ===== TASK SOURCE =====

export type TaskSourceType = 'free' | 'project' | 'team';

export interface TaskSourceInfo {
  type: TaskSourceType;
  label: string;
  icon: string;
  colorClass: string;
}

export function getTaskSource(
  task: { projectId?: string; teamId?: string },
  projectName?: string
): TaskSourceInfo {
  if ((task as any).teamId) {
    return {
      type: 'team',
      label: 'Équipe',
      icon: '👥',
      colorClass: 'bg-primary/10 text-primary'
    };
  }

  if (task.projectId) {
    return {
      type: 'project',
      label: projectName || 'Projet',
      icon: '📁',
      colorClass: 'bg-project/10 text-project'
    };
  }

  return {
    type: 'free',
    label: 'Perso',
    icon: '📋',
    colorClass: 'bg-muted text-muted-foreground'
  };
}

export function getPriorityShortLabel(priority: SubTaskCategory | undefined): string {
  switch (priority) {
    case 'Le plus important': return '!!!';
    case 'Important': return '!!';
    case 'Peut attendre': return '!';
    case "Si j'ai le temps": return '○';
    default: return '';
  }
}

export function getCategoryIndicatorColor(category: TaskCategory): string {
  switch (category) {
    case 'critical': return 'bg-category-critical';
    case 'urgent': return 'bg-category-urgent';
    case 'important': return 'bg-category-important';
    case 'low_priority': return 'bg-category-low-priority';
    default: return 'bg-muted';
  }
}
