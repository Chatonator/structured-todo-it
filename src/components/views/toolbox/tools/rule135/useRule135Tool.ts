import { useState, useMemo, useCallback, useEffect } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { Task } from '@/types/task';
import { loadDailyStorage, saveDailyStorage } from '@/lib/storage';
import { computeCompletionStats } from '@/lib/formatters';

export type TaskSlot = 'big' | 'medium' | 'small';

export interface Rule135Selection {
  big: string | null; // Task ID
  medium: string[]; // Task IDs (max 3)
  small: string[]; // Task IDs (max 5)
}

const STORAGE_KEY = 'rule135_selection';
const MAX_MEDIUM = 3;
const MAX_SMALL = 5;

export const useRule135Tool = () => {
  const viewData = useViewDataContext();
  const [selection, setSelection] = useState<Rule135Selection>(loadSelection);

  // Save to localStorage when selection changes
  useEffect(() => {
    saveSelection(selection);
  }, [selection]);

  // Available tasks (not completed, no parent)
  const availableTasks = useMemo(() => 
    viewData.tasks.filter(t => !t.isCompleted && !t.parentId),
    [viewData.tasks]
  );

  // Get selected task objects
  const selectedTasks = useMemo(() => {
    const findTask = (id: string | null) => 
      id ? viewData.tasks.find(t => t.id === id) : null;
    
    return {
      big: findTask(selection.big),
      medium: selection.medium.map(findTask).filter(Boolean) as Task[],
      small: selection.small.map(findTask).filter(Boolean) as Task[]
    };
  }, [selection, viewData.tasks]);

  // Tasks not yet selected
  const unselectedTasks = useMemo(() => {
    const selectedIds = new Set([
      selection.big,
      ...selection.medium,
      ...selection.small
    ].filter(Boolean));
    
    return availableTasks.filter(t => !selectedIds.has(t.id));
  }, [availableTasks, selection]);

  // Stats
  const stats = useMemo(() => {
    const allSelected = [
      selectedTasks.big,
      ...selectedTasks.medium,
      ...selectedTasks.small
    ].filter(Boolean) as Task[];

    const totalTime = allSelected.reduce((sum, t) => sum + t.estimatedTime, 0);
    const completedCount = allSelected.filter(t => t.isCompleted).length;
    const totalCount = allSelected.length;

    return {
      totalTime,
      completedCount,
      totalCount,
      progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    };
  }, [selectedTasks]);

  // Slot availability
  const slots = useMemo(() => ({
    big: {
      filled: selection.big !== null,
      max: 1,
      current: selection.big ? 1 : 0
    },
    medium: {
      filled: selection.medium.length >= MAX_MEDIUM,
      max: MAX_MEDIUM,
      current: selection.medium.length
    },
    small: {
      filled: selection.small.length >= MAX_SMALL,
      max: MAX_SMALL,
      current: selection.small.length
    }
  }), [selection]);

  // Actions
  const addTask = useCallback((taskId: string, slot: TaskSlot) => {
    setSelection(prev => {
      switch (slot) {
        case 'big':
          return { ...prev, big: taskId };
        case 'medium':
          if (prev.medium.length >= MAX_MEDIUM) return prev;
          if (prev.medium.includes(taskId)) return prev;
          return { ...prev, medium: [...prev.medium, taskId] };
        case 'small':
          if (prev.small.length >= MAX_SMALL) return prev;
          if (prev.small.includes(taskId)) return prev;
          return { ...prev, small: [...prev.small, taskId] };
        default:
          return prev;
      }
    });
  }, []);

  const removeTask = useCallback((taskId: string, slot: TaskSlot) => {
    setSelection(prev => {
      switch (slot) {
        case 'big':
          return { ...prev, big: prev.big === taskId ? null : prev.big };
        case 'medium':
          return { ...prev, medium: prev.medium.filter(id => id !== taskId) };
        case 'small':
          return { ...prev, small: prev.small.filter(id => id !== taskId) };
        default:
          return prev;
      }
    });
  }, []);

  const clearSlot = useCallback((slot: TaskSlot) => {
    setSelection(prev => {
      switch (slot) {
        case 'big':
          return { ...prev, big: null };
        case 'medium':
          return { ...prev, medium: [] };
        case 'small':
          return { ...prev, small: [] };
        default:
          return prev;
      }
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelection({ big: null, medium: [], small: [] });
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    viewData.toggleTaskCompletion(taskId);
  }, [viewData]);

  return {
    data: {
      selection,
      selectedTasks,
      unselectedTasks,
      availableTasks,
      stats,
      slots
    },
    actions: {
      addTask,
      removeTask,
      clearSlot,
      clearAll,
      toggleTaskCompletion
    }
  };
};

export type Rule135ToolReturn = ReturnType<typeof useRule135Tool>;
