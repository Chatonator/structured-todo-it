export type ProjectStatus = 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'archived';
export type TaskProjectStatus = 'todo' | 'in-progress' | 'done';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  status: ProjectStatus;
  targetDate?: Date;
  orderIndex: number;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  'planning': {
    label: 'Planification',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'in-progress': {
    label: 'En cours',
    color: 'text-project',
    bgColor: 'bg-project/10'
  },
  'on-hold': {
    label: 'En pause',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  'completed': {
    label: 'Terminé',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'archived': {
    label: 'Archivé',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
};

export const TASK_PROJECT_STATUS_CONFIG: Record<TaskProjectStatus, {
  label: string;
  kanbanColumn: string;
}> = {
  'todo': {
    label: 'À faire',
    kanbanColumn: 'À faire'
  },
  'in-progress': {
    label: 'En cours',
    kanbanColumn: 'En cours'
  },
  'done': {
    label: 'Terminé',
    kanbanColumn: 'Terminé'
  }
};

export const PROJECT_ICONS = ['📚', '🎯', '💼', '🏠', '✈️', '🎨', '💡', '🚀', '🎓', '❤️'];
