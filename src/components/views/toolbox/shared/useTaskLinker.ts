import { useState, useCallback, useMemo } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task, TaskContext } from '@/types/task';

export type TaskLinkerMode = 'single' | 'multi';

export interface UseTaskLinkerOptions {
  mode: TaskLinkerMode;
  maxSelection?: number;
  storageKey?: string;
  excludeIds?: string[];
}

export interface TaskLinkerFilters {
  search: string;
  context: TaskContext | 'all';
}

export interface UseTaskLinkerReturn {
  // State
  selectedIds: string[];
  selectedTasks: Task[];
  filters: TaskLinkerFilters;
  filteredAvailableTasks: Task[];
  
  // Actions
  select: (id: string) => void;
  deselect: (id: string) => void;
  clear: () => void;
  setSearch: (search: string) => void;
  setContextFilter: (context: TaskContext | 'all') => void;
  
  // Meta
  canSelectMore: boolean;
  mode: TaskLinkerMode;
}

function loadPersistedIds(storageKey?: string): string[] {
  if (!storageKey) return [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(`taskLinker:${storageKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) return [];
    return parsed.ids ?? [];
  } catch {
    return [];
  }
}

function persistIds(storageKey: string | undefined, ids: string[]) {
  if (!storageKey) return;
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(`taskLinker:${storageKey}`, JSON.stringify({ date: today, ids }));
}

export function useTaskLinker(options: UseTaskLinkerOptions): UseTaskLinkerReturn {
  const { mode, maxSelection, storageKey, excludeIds = [] } = options;
  const effectiveMax = mode === 'single' ? 1 : (maxSelection ?? Infinity);

  const { tasks } = useViewDataContext();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => loadPersistedIds(storageKey));
  const [filters, setFilters] = useState<TaskLinkerFilters>({ search: '', context: 'all' });

  const updateIds = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    persistIds(storageKey, ids);
  }, [storageKey]);

  const select = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev;
      const next = mode === 'single' ? [id] : [...prev, id].slice(0, effectiveMax);
      persistIds(storageKey, next);
      return next;
    });
  }, [mode, effectiveMax, storageKey]);

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id);
      persistIds(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const clear = useCallback(() => updateIds([]), [updateIds]);

  const setSearch = useCallback((search: string) => {
    setFilters(f => ({ ...f, search }));
  }, []);

  const setContextFilter = useCallback((context: TaskContext | 'all') => {
    setFilters(f => ({ ...f, context }));
  }, []);

  const excludeSet = useMemo(() => new Set([...excludeIds, ...selectedIds]), [excludeIds, selectedIds]);

  const filteredAvailableTasks = useMemo(() => {
    let result = tasks.filter(t => !t.isCompleted && !excludeSet.has(t.id));
    
    if (filters.context !== 'all') {
      result = result.filter(t => t.context === filters.context);
    }
    
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }
    
    return result.slice(0, 50);
  }, [tasks, excludeSet, filters]);

  const selectedTasks = useMemo(
    () => selectedIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[],
    [selectedIds, tasks]
  );

  const canSelectMore = selectedIds.length < effectiveMax;

  return {
    selectedIds,
    selectedTasks,
    filters,
    filteredAvailableTasks,
    select,
    deselect,
    clear,
    setSearch,
    setContextFilter,
    canSelectMore,
    mode,
  };
}
