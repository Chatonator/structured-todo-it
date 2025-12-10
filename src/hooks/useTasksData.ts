import { useEffect, useCallback, useRef } from 'react';
import { useTasksDatabase } from '@/hooks/useTasksDatabase';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { Task } from '@/types/task';
import { logger } from '@/lib/logger';

/**
 * Hook for task data management using Supabase database
 * Replaces localStorage with secure database operations
 * Handles recurring tasks processing on load
 */
export const useTasksData = () => {
  const {
    tasks,
    pinnedTasks,
    loading,
    error,
    setTasks,
    setPinnedTasks,
    saveTask,
    deleteTask,
    completeTask,
    reloadTasks,
  } = useTasksDatabase();

  const { processRecurringTasks } = useRecurringTasks();
  const hasProcessedRecurring = useRef(false);

  // Traiter les tâches récurrentes au chargement
  useEffect(() => {
    const processRecurring = async () => {
      if (!loading && tasks.length > 0 && !hasProcessedRecurring.current) {
        hasProcessedRecurring.current = true;
        const count = await processRecurringTasks();
        if (count > 0) {
          logger.info('Tâches récurrentes réactivées', { count });
          // Recharger les tâches pour voir les changements
          await reloadTasks();
        }
      }
    };
    
    processRecurring();
  }, [loading, tasks.length, processRecurringTasks, reloadTasks]);

  // For compatibility with existing code, map the database hook interface
  const safeSetTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => {
    if (typeof updater === 'function') {
      const newTasks = updater(Array.isArray(tasks) ? tasks : []);
      setTasks(Array.isArray(newTasks) ? newTasks : []);
    } else {
      setTasks(Array.isArray(updater) ? updater : []);
    }
  };

  const safeSetPinnedTasks = (updater: string[] | ((prev: string[]) => string[])) => {
    if (typeof updater === 'function') {
      const newPinned = updater(Array.isArray(pinnedTasks) ? pinnedTasks : []);
      setPinnedTasks(Array.isArray(newPinned) ? newPinned : []);
    } else {
      setPinnedTasks(Array.isArray(updater) ? updater : []);
    }
  };

  return {
    tasks: Array.isArray(tasks) ? tasks : [],
    setTasks: safeSetTasks,
    pinnedTasks: Array.isArray(pinnedTasks) ? pinnedTasks : [],
    setPinnedTasks: safeSetPinnedTasks,
    isLoaded: !loading,
    loadError: error,
    // Additional database-specific methods
    saveTask,
    deleteTask,
    completeTask,
    reloadTasks,
  };
};