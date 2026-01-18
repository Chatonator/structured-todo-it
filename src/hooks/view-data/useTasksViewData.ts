import { useCallback } from 'react';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { Task } from '@/types/task';

export type ContextFilter = 'Pro' | 'Perso' | 'all';

/**
 * Hook spécialisé pour les données et actions des tâches
 * Extrait de useViewData pour améliorer la maintenabilité
 */
export const useTasksViewData = () => {
  const {
    tasks,
    mainTasks,
    pinnedTasks,
    addTask,
    removeTask,
    reorderTasks,
    sortTasks,
    toggleTaskExpansion,
    toggleTaskCompletion,
    togglePinTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    canUndo,
    canRedo,
    undo,
    redo,
    restoreTask,
    updateTask,
    teamTasks,
    onToggleTeamTask
  } = useUnifiedTasks();

  // Fonctions de filtrage
  const applyFilters = useCallback((taskList: Task[], contextFilter: ContextFilter = 'all') => {
    if (contextFilter === 'all') return taskList;
    return taskList.filter(task => task.context === contextFilter);
  }, []);

  const getFilteredTasks = useCallback((contextFilter: ContextFilter = 'all') => {
    const activeTasks = tasks.filter(task => task && !task.isCompleted);
    return applyFilters(activeTasks, contextFilter);
  }, [tasks, applyFilters]);

  const getCompletedTasks = useCallback((contextFilter: ContextFilter = 'all') => {
    const completedTasks = tasks.filter(task => task && task.isCompleted);
    return applyFilters(completedTasks, contextFilter);
  }, [tasks, applyFilters]);

  return {
    // Données
    tasks,
    mainTasks,
    pinnedTasks,
    
    // Actions CRUD
    addTask,
    removeTask,
    updateTask,
    restoreTask,
    
    // Actions de réorganisation
    reorderTasks,
    sortTasks,
    
    // Actions de toggle
    toggleTaskExpansion,
    toggleTaskCompletion,
    togglePinTask,
    
    // Utilitaires
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    
    // Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,
    
    // Équipe
    teamTasks,
    onToggleTeamTask,
    
    // Filtrage
    applyFilters,
    getFilteredTasks,
    getCompletedTasks
  };
};

export type TasksViewDataReturn = ReturnType<typeof useTasksViewData>;
