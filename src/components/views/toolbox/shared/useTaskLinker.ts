import { useState, useCallback, useMemo } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task, TaskContext, TaskCategory, SubTaskCategory } from '@/types/task';
import { loadDailyStorage, saveDailyStorage } from '@/lib/storage';

export type TaskLinkerMode = 'single' | 'multi';
export type TaskLinkerSort = 'none' | 'name' | 'time' | 'priority';
export type TaskLinkerScope = 'all' | 'free' | 'project';
export type TaskLinkerGroupBy = 'none' | 'scope' | 'context' | 'category';

export interface UseTaskLinkerOptions {
  mode: TaskLinkerMode;
  maxSelection?: number;
  storageKey?: string;
  excludeIds?: string[];
  initialScope?: TaskLinkerScope;
}

export interface TaskLinkerFilters {
  search: string;
  scope: TaskLinkerScope;
  context: TaskContext | 'all';
  category: TaskCategory | 'all';
  priority: SubTaskCategory | 'all' | 'none';
}

export interface TaskLinkerGroup {
  id: string;
  label: string;
  count: number;
  tasks: Task[];
}

export interface UseTaskLinkerReturn {
  selectedIds: string[];
  selectedTasks: Task[];
  filters: TaskLinkerFilters;
  sort: TaskLinkerSort;
  groupBy: TaskLinkerGroupBy;
  filteredAvailableTasks: Task[];
  groupedAvailableTasks: TaskLinkerGroup[];
  filteredCount: number;
  totalCount: number;

  select: (id: string) => void;
  deselect: (id: string) => void;
  clear: () => void;
  setSearch: (search: string) => void;
  setScopeFilter: (scope: TaskLinkerScope) => void;
  setContextFilter: (context: TaskContext | 'all') => void;
  setCategoryFilter: (category: TaskCategory | 'all') => void;
  setPriorityFilter: (priority: SubTaskCategory | 'all' | 'none') => void;
  setSort: (sort: TaskLinkerSort) => void;

  canSelectMore: boolean;
  mode: TaskLinkerMode;
}

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

const SCOPE_GROUP_LABELS: Record<Exclude<TaskLinkerScope, 'all'>, string> = {
  free: 'Taches libres',
  project: 'Projet',
};

function compareTasks(left: Task, right: Task, sort: TaskLinkerSort): number {
  switch (sort) {
    case 'name':
      return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    case 'time':
      return (right.estimatedTime || 0) - (left.estimatedTime || 0) || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    case 'priority': {
      const leftRank = left.subCategory ? PRIORITY_ORDER[left.subCategory] : 99;
      const rightRank = right.subCategory ? PRIORITY_ORDER[right.subCategory] : 99;
      return leftRank - rightRank || left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
    }
    case 'none':
    default:
      return 0;
  }
}

function inferGroupBy(filters: TaskLinkerFilters): TaskLinkerGroupBy {
  if (filters.scope === 'all') {
    return 'scope';
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

function getGroupLabel(groupBy: TaskLinkerGroupBy, task: Task): string {
  if (groupBy === 'scope') {
    return task.projectId ? SCOPE_GROUP_LABELS.project : SCOPE_GROUP_LABELS.free;
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
  if (groupBy === 'scope') {
    return task.projectId ? 'scope:project' : 'scope:free';
  }

  if (groupBy === 'context') {
    return `context:${task.context}`;
  }

  if (groupBy === 'category') {
    return `category:${task.category}`;
  }

  return 'all';
}

function buildGroups(tasks: Task[], groupBy: TaskLinkerGroupBy): TaskLinkerGroup[] {
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
      label: getGroupLabel(groupBy, task),
      count: 1,
      tasks: [task],
    });
  });

  return Array.from(grouped.values());
}

export function useTaskLinker(options: UseTaskLinkerOptions): UseTaskLinkerReturn {
  const { mode, maxSelection, storageKey, excludeIds = [], initialScope = 'all' } = options;
  const effectiveMax = mode === 'single' ? 1 : (maxSelection ?? Infinity);

  const { tasks } = useViewDataContext();

  const fullKey = storageKey ? `taskLinker:${storageKey}` : undefined;

  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => fullKey ? loadDailyStorage<string[]>(fullKey, []) : []
  );
  const [filters, setFilters] = useState<TaskLinkerFilters>({
    search: '', scope: initialScope, context: 'all', category: 'all', priority: 'all',
  });
  const [sort, setSort] = useState<TaskLinkerSort>('none');

  const persistIds = useCallback((ids: string[]) => {
    if (fullKey) saveDailyStorage(fullKey, ids);
  }, [fullKey]);

  const select = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev;
      const next = mode === 'single' ? [id] : [...prev, id].slice(0, effectiveMax);
      persistIds(next);
      return next;
    });
  }, [mode, effectiveMax, persistIds]);

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id);
      persistIds(next);
      return next;
    });
  }, [persistIds]);

  const clear = useCallback(() => {
    setSelectedIds([]);
    persistIds([]);
  }, [persistIds]);

  const setSearch = useCallback((search: string) => setFilters(f => ({ ...f, search })), []);
  const setScopeFilter = useCallback((scope: TaskLinkerScope) => setFilters(f => ({ ...f, scope })), []);
  const setContextFilter = useCallback((context: TaskContext | 'all') => setFilters(f => ({ ...f, context })), []);
  const setCategoryFilter = useCallback((category: TaskCategory | 'all') => setFilters(f => ({ ...f, category })), []);
  const setPriorityFilter = useCallback((priority: SubTaskCategory | 'all' | 'none') => setFilters(f => ({ ...f, priority })), []);

  const excludeSet = useMemo(() => new Set([...excludeIds, ...selectedIds]), [excludeIds, selectedIds]);

  const baseAvailable = useMemo(() => tasks.filter(t => !t.isCompleted && !excludeSet.has(t.id)), [tasks, excludeSet]);

  const filteredTasks = useMemo(() => {
    let result = baseAvailable;

    if (filters.scope === 'free') result = result.filter(t => !t.projectId);
    if (filters.scope === 'project') result = result.filter(t => !!t.projectId);
    if (filters.context !== 'all') result = result.filter(t => t.context === filters.context);
    if (filters.category !== 'all') result = result.filter(t => t.category === filters.category);
    if (filters.priority === 'none') {
      result = result.filter(t => !t.subCategory);
    } else if (filters.priority !== 'all') {
      result = result.filter(t => t.subCategory === filters.priority);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }

    return [...result].sort((left, right) => compareTasks(left, right, sort));
  }, [baseAvailable, filters, sort]);

  const filteredAvailableTasks = useMemo(() => filteredTasks.slice(0, 50), [filteredTasks]);
  const groupBy = useMemo(() => inferGroupBy(filters), [filters]);
  const groupedAvailableTasks = useMemo(() => buildGroups(filteredAvailableTasks, groupBy), [filteredAvailableTasks, groupBy]);

  const selectedTasks = useMemo(
    () => selectedIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[],
    [selectedIds, tasks]
  );

  const canSelectMore = selectedIds.length < effectiveMax;

  return {
    selectedIds,
    selectedTasks,
    filters,
    sort,
    groupBy,
    filteredAvailableTasks,
    groupedAvailableTasks,
    filteredCount: filteredTasks.length,
    totalCount: baseAvailable.length,
    select,
    deselect,
    clear,
    setSearch,
    setScopeFilter,
    setContextFilter,
    setCategoryFilter,
    setPriorityFilter,
    setSort,
    canSelectMore,
    mode,
  };
}
