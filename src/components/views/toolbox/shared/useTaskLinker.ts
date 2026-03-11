import { useState, useCallback, useEffect, useMemo } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task, TaskContext, TaskCategory, SubTaskCategory } from '@/types/task';
import { loadDailyStorage, saveDailyStorage } from '@/lib/storage';
import { useProjects } from '@/hooks/useProjects';
import { useAllTeamProjects } from '@/hooks/useAllTeamProjects';
import { buildTaskLinkerGroups, compareTaskLinkerTasks, inferTaskLinkerGroupBy } from './taskLinker.helpers';

export type TaskLinkerMode = 'single' | 'multi';
export type TaskLinkerSort = 'none' | 'name' | 'time' | 'priority';
export type TaskLinkerScope = 'all' | 'free' | 'project';
export type TaskLinkerGroupBy = 'none' | 'mixed' | 'context' | 'category' | 'project';

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

export function useTaskLinker(options: UseTaskLinkerOptions): UseTaskLinkerReturn {
  const { mode, maxSelection, storageKey, excludeIds = [], initialScope = 'all' } = options;
  const effectiveMax = mode === 'single' ? 1 : (maxSelection ?? Infinity);

  const { tasks } = useViewDataContext();
  const { projects } = useProjects();
  const { allTeamProjects } = useAllTeamProjects();

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
  const projectLabels = useMemo(() => {
    const labels = new Map<string, string>();
    projects.forEach((project) => labels.set(project.id, project.name));
    allTeamProjects.forEach((project) => labels.set(project.id, project.name));
    return labels;
  }, [projects, allTeamProjects]);
  const availableTaskIds = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks]);
  const excludedIds = useMemo(() => new Set(excludeIds), [excludeIds]);

  useEffect(() => {
    setSelectedIds((previous) => {
      const next = previous.filter((id) => availableTaskIds.has(id) && !excludedIds.has(id));
      if (next.length === previous.length) {
        return previous;
      }
      persistIds(next);
      return next;
    });
  }, [availableTaskIds, excludedIds, persistIds]);

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

    return [...result].sort((left, right) => compareTaskLinkerTasks(left, right, sort));
  }, [baseAvailable, filters, sort]);

  const filteredAvailableTasks = useMemo(() => filteredTasks, [filteredTasks]);
  const groupBy = useMemo(() => inferTaskLinkerGroupBy(filters), [filters]);
  const groupedAvailableTasks = useMemo(
    () => buildTaskLinkerGroups(filteredAvailableTasks, groupBy, projectLabels),
    [filteredAvailableTasks, groupBy, projectLabels]
  );

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

