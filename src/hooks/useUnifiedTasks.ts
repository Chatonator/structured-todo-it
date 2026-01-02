import { useMemo, useCallback } from 'react';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamContext } from '@/contexts/TeamContext';

/**
 * Hook unifiant les tâches personnelles et d'équipe
 * Fournit une interface cohérente quel que soit le mode actif
 */
export const useUnifiedTasks = () => {
  const { currentTeam } = useTeamContext();
  const personalTasks = useTasks();
  const teamTasks = useTeamTasks(currentTeam?.id || null);
  
  const isTeamMode = !!currentTeam;

  // Wrapper pour les tâches d'équipe vers l'interface Task
  const teamTasksAdapter = useMemo(() => ({
    tasks: teamTasks.tasks as unknown as Task[],
    mainTasks: teamTasks.tasks.filter(t => t.level === 0) as unknown as Task[],
    pinnedTasks: [] as string[],
    
    addTask: async (task: any) => {
      await teamTasks.createTask(task);
    },
    
    removeTask: async (taskId: string) => {
      await teamTasks.deleteTask(taskId);
    },
    
    reorderTasks: async () => {},
    sortTasks: async () => {},
    
    toggleTaskExpansion: async (taskId: string) => {
      const task = teamTasks.tasks.find(t => t.id === taskId);
      if (task) {
        await teamTasks.updateTask(taskId, { isexpanded: !task.isExpanded } as any);
      }
    },
    
    toggleTaskCompletion: async (taskId: string) => {
      const task = teamTasks.tasks.find(t => t.id === taskId);
      if (task) {
        await teamTasks.toggleComplete(taskId, !task.isCompleted);
      }
    },
    
    togglePinTask: () => {},
    
    getSubTasks: (parentId: string) => 
      teamTasks.tasks.filter(t => t.parentId === parentId) as unknown as Task[],
    
    calculateTotalTime: (task: any) => {
      const subTasks = teamTasks.tasks.filter(t => t.parentId === task.id);
      return task.estimatedTime + subTasks.reduce((sum, sub) => sum + sub.estimatedTime, 0);
    },
    
    canHaveSubTasks: (task: any) => task.level < 2,
    
    tasksCount: teamTasks.tasks.length,
    totalProjectTime: teamTasks.tasks.reduce((sum, t) => sum + t.estimatedTime, 0),
    completedTasks: teamTasks.tasks.filter(t => t.isCompleted).length,
    completionRate: teamTasks.tasks.length > 0 
      ? (teamTasks.tasks.filter(t => t.isCompleted).length / teamTasks.tasks.length) * 100 
      : 0,
    
    undo: () => {},
    redo: () => {},
    canUndo: false,
    canRedo: false,
    
    restoreTask: async (taskId: string) => {
      await teamTasks.toggleComplete(taskId, false);
    },
    
    updateTask: async (taskId: string, updates: any) => {
      const mappedUpdates: any = {};
      if (updates.estimatedTime !== undefined) mappedUpdates.estimatedtime = updates.estimatedTime;
      if (updates.scheduledDate !== undefined) mappedUpdates.scheduleddate = updates.scheduledDate ? updates.scheduledDate.toISOString().split('T')[0] : null;
      if (updates.scheduledTime !== undefined) mappedUpdates.scheduledtime = updates.scheduledTime;
      if (updates.startTime !== undefined) mappedUpdates.starttime = updates.startTime ? updates.startTime.toISOString() : null;
      if (updates.isCompleted !== undefined) mappedUpdates.iscompleted = updates.isCompleted;
      if (updates.isExpanded !== undefined) mappedUpdates.isexpanded = updates.isExpanded;
      if (updates.isRecurring !== undefined) mappedUpdates.isrecurring = updates.isRecurring;
      if (updates.recurrenceInterval !== undefined) mappedUpdates.recurrenceinterval = updates.recurrenceInterval;
      if (updates.lastCompletedAt !== undefined) mappedUpdates.lastcompletedat = updates.lastCompletedAt ? updates.lastCompletedAt.toISOString() : null;
      if (updates.parentId !== undefined) mappedUpdates.parentid = updates.parentId;
      if (updates.subCategory !== undefined) mappedUpdates.subcategory = updates.subCategory;
      
      ['name', 'category', 'context', 'duration', 'level'].forEach(key => {
        if (updates[key] !== undefined) mappedUpdates[key] = updates[key];
      });
      
      await teamTasks.updateTask(taskId, mappedUpdates);
    },
  }), [teamTasks]);

  // Sélectionner le bon hook selon le mode
  const hookResult = isTeamMode ? teamTasksAdapter : personalTasks;
  
  // Destructuration avec valeurs par défaut
  const { 
    tasks = [], 
    mainTasks = [],
    pinnedTasks = [],
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
    tasksCount = 0,
    totalProjectTime = 0,
    completedTasks = 0,
    completionRate = 0,
    undo,
    redo,
    canUndo = false,
    canRedo = false,
    restoreTask,
    updateTask
  } = hookResult || {};

  // Fonctions sécurisées
  const safeAddTask = addTask || (() => {});
  const safeRemoveTask = removeTask || (() => {});
  const safeReorderTasks = reorderTasks || (() => {});
  const safeSortTasks = sortTasks || (() => {});
  const safeToggleTaskExpansion = toggleTaskExpansion || (() => {});
  const safeToggleTaskCompletion = toggleTaskCompletion || (() => {});
  const safeTogglePinTask = togglePinTask || (() => {});
  const safeGetSubTasks = getSubTasks || (() => []);
  const safeCalculateTotalTime = calculateTotalTime || (() => 0);
  const safeCanHaveSubTasks = canHaveSubTasks || (() => false);
  const safeUndo = undo || (() => {});
  const safeRedo = redo || (() => {});
  const safeRestoreTask = restoreTask || (() => {});
  const safeUpdateTask = updateTask || (() => {});

  // Mapper les tâches d'équipe pour le format simple
  const formattedTeamTasks = useMemo(() => 
    teamTasks.tasks.map(t => ({
      id: t.id,
      name: t.name,
      isCompleted: t.isCompleted,
      category: t.category,
      estimatedTime: t.estimatedTime
    })),
    [teamTasks.tasks]
  );

  const handleToggleTeamTask = useCallback((taskId: string) => {
    const task = teamTasks.tasks.find(t => t.id === taskId);
    if (task) {
      teamTasks.toggleComplete(taskId, !task.isCompleted);
    }
  }, [teamTasks]);

  return {
    // Mode
    isTeamMode,
    
    // Données
    tasks: tasks as Task[],
    mainTasks: mainTasks as Task[],
    pinnedTasks: pinnedTasks as string[],
    
    // Actions
    addTask: safeAddTask,
    removeTask: safeRemoveTask,
    reorderTasks: safeReorderTasks,
    sortTasks: safeSortTasks,
    toggleTaskExpansion: safeToggleTaskExpansion,
    toggleTaskCompletion: safeToggleTaskCompletion,
    togglePinTask: safeTogglePinTask,
    getSubTasks: safeGetSubTasks,
    calculateTotalTime: safeCalculateTotalTime,
    canHaveSubTasks: safeCanHaveSubTasks,
    undo: safeUndo,
    redo: safeRedo,
    canUndo,
    canRedo,
    restoreTask: safeRestoreTask,
    updateTask: safeUpdateTask,
    
    // Stats
    tasksCount,
    totalProjectTime,
    completedTasks,
    completionRate,
    
    // Team-specific
    teamTasks: formattedTeamTasks,
    onToggleTeamTask: handleToggleTeamTask,
  };
};
