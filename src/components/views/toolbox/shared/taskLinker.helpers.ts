import type { Task, TaskCategory, TaskContext, SubTaskCategory } from '../../../../types/task';
import type { TaskLinkerFilters, TaskLinkerGroup, TaskLinkerGroupBy, TaskLinkerSort } from './useTaskLinker';

const PRIORITY_ORDER: Record<SubTaskCategory, number> = {
  'Le plus important': 0,
  Important: 1,
  'Peut attendre': 2,
  "Si j'ai le temps": 3,
};

const CATEGORY_GROUP_LABELS: Record<TaskCategory, string> = {
  Obligation: 'Cruciales',
  Quotidien: 'Regulieres',
  Envie: 'Envies',
  Autres: 'Optionnelles',
};

const CONTEXT_GROUP_LABELS: Record<TaskContext, string> = {
  Pro: 'Pro',
  Perso: 'Perso',
};

const SCOPE_GROUP_LABELS = {
  free: 'Taches libres',
  project: 'Projet',
} as const;

export function compareTaskLinkerTasks(left: Task, right: Task, sort: TaskLinkerSort): number {
  switch (sort) {
    case 'name':
      return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    case 'time':
      return (right.estimatedTime || 0) - (left.estimatedTime || 0)
        || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    case 'priority': {
      const leftRank = left.subCategory ? PRIORITY_ORDER[left.subCategory] : 99;
      const rightRank = right.subCategory ? PRIORITY_ORDER[right.subCategory] : 99;
      return leftRank - rightRank
        || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    }
    case 'none':
    default:
      return 0;
  }
}

export function inferTaskLinkerGroupBy(filters: TaskLinkerFilters): TaskLinkerGroupBy {
  if (filters.scope === 'all') {
    return 'mixed';
  }

  if (filters.scope === 'project') {
    return 'project';
  }

  if (filters.priority !== 'all') {
    return 'none';
  }

  if (filters.context === 'all') {
    return 'context';
  }

  if (filters.category === 'all') {
    return 'category';
  }

  return 'none';
}

function getProjectLabel(task: Task, projectLabels: Map<string, string>): string {
  if (!task.projectId) {
    return SCOPE_GROUP_LABELS.free;
  }

  return projectLabels.get(task.projectId) || 'Projet inconnu';
}

function getGroupLabel(groupBy: TaskLinkerGroupBy, task: Task, projectLabels: Map<string, string>): string {
  if (groupBy === 'mixed' || groupBy === 'project') {
    return getProjectLabel(task, projectLabels);
  }

  if (groupBy === 'context') {
    return CONTEXT_GROUP_LABELS[task.context];
  }

  if (groupBy === 'category') {
    return CATEGORY_GROUP_LABELS[task.category];
  }

  return 'Taches';
}

function getGroupId(groupBy: TaskLinkerGroupBy, task: Task): string {
  if (groupBy === 'mixed' || groupBy === 'project') {
    return task.projectId ? `project:${task.projectId}` : 'scope:free';
  }

  if (groupBy === 'context') {
    return `context:${task.context}`;
  }

  if (groupBy === 'category') {
    return `category:${task.category}`;
  }

  return 'all';
}

function sortGroups(groups: TaskLinkerGroup[]): TaskLinkerGroup[] {
  return [...groups].sort((left, right) => {
    if (left.id === 'scope:free') return -1;
    if (right.id === 'scope:free') return 1;
    return left.label.localeCompare(right.label, 'fr', { sensitivity: 'base' });
  });
}

export function buildTaskLinkerGroups(
  tasks: Task[],
  groupBy: TaskLinkerGroupBy,
  projectLabels: Map<string, string> = new Map()
): TaskLinkerGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', label: 'Taches', count: tasks.length, tasks }];
  }

  const grouped = new Map<string, TaskLinkerGroup>();

  tasks.forEach((task) => {
    const id = getGroupId(groupBy, task);
    const existing = grouped.get(id);
    if (existing) {
      existing.tasks.push(task);
      existing.count += 1;
      return;
    }

    grouped.set(id, {
      id,
      label: getGroupLabel(groupBy, task, projectLabels),
      count: 1,
      tasks: [task],
    });
  });

  return sortGroups(Array.from(grouped.values()));
}

