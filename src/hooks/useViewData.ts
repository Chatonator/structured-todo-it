import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks';
import { useHabits } from '@/hooks/useHabits';
import { useDecks } from '@/hooks/useDecks';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { Task } from '@/types/task';

export type ContextFilter = 'Pro' | 'Perso' | 'all';

interface TaskSchedule {
  date: Date;
  time: string;
}

/**
 * Hook centralisant toutes les données nécessaires aux vues
 * Remplace le prop drilling massif de Index.tsx
 */
export const useViewData = () => {
  // Hooks de données
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

  const { projects } = useProjects();
  const { projectTasks, toggleProjectTaskCompletion } = useAllProjectTasks(projects);
  const { defaultDeckId } = useDecks();
  const { 
    completions: habitCompletions, 
    streaks: habitStreaks, 
    loading: habitsLoading,
    toggleCompletion: toggleHabitCompletion,
    getHabitsForToday
  } = useHabits(defaultDeckId);
  const { ensureRecurringTaskHasEvent, processRecurringTasks } = useRecurringTasks();
  const { deleteEntityEvent, syncTaskEventWithSchedule } = useTimeEventSync();

  // État local pour récurrence et planification
  const [recurringTaskIds, setRecurringTaskIds] = useState<string[]>([]);
  const [taskSchedules, setTaskSchedules] = useState<Record<string, TaskSchedule>>({});

  // Charger les données de récurrence au montage
  useEffect(() => {
    const initRecurringTasks = async () => {
      const reactivatedCount = await processRecurringTasks();
      if (reactivatedCount > 0) {
        console.log(`${reactivatedCount} tâche(s) récurrente(s) réactivée(s)`);
      }
      
      const { data } = await supabase
        .from('time_events')
        .select('entity_id, recurrence, starts_at')
        .eq('entity_type', 'task');
      
      if (data) {
        const recurringIds = data
          .filter(e => e.recurrence !== null)
          .map(e => e.entity_id);
        setRecurringTaskIds(recurringIds);
        
        const schedules: Record<string, TaskSchedule> = {};
        data.forEach(e => {
          if (e.starts_at) {
            const startsAt = new Date(e.starts_at);
            schedules[e.entity_id] = {
              date: startsAt,
              time: startsAt.toTimeString().slice(0, 5)
            };
          }
        });
        setTaskSchedules(schedules);
      }
    };
    initRecurringTasks();
  }, [processRecurringTasks]);

  // Habitudes du jour
  const todayHabits = getHabitsForToday();

  // Handlers pour la récurrence
  const handleSetRecurring = useCallback(async (
    taskId: string, 
    taskName: string, 
    estimatedTime: number, 
    frequency: string, 
    interval: number
  ) => {
    await ensureRecurringTaskHasEvent(taskId, taskName, frequency, estimatedTime, interval);
    setRecurringTaskIds(prev => [...prev, taskId]);
  }, [ensureRecurringTaskHasEvent]);

  const handleRemoveRecurring = useCallback(async (taskId: string) => {
    await deleteEntityEvent('task', taskId);
    setRecurringTaskIds(prev => prev.filter(id => id !== taskId));
  }, [deleteEntityEvent]);

  // Handler pour planification
  const handleScheduleTask = useCallback(async (taskId: string, date: Date, time: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await syncTaskEventWithSchedule(task, {
      date,
      time,
      isRecurring: recurringTaskIds.includes(taskId)
    });
    
    setTaskSchedules(prev => ({
      ...prev,
      [taskId]: { date, time }
    }));
  }, [tasks, syncTaskEventWithSchedule, recurringTaskIds]);

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
    // Tâches
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
    
    // Équipe
    teamTasks,
    onToggleTeamTask,
    
    // Projets
    projects,
    projectTasks,
    toggleProjectTaskCompletion,
    
    // Habitudes
    todayHabits,
    habitCompletions,
    habitStreaks,
    habitsLoading,
    toggleHabitCompletion,
    
    // Récurrence et planification
    recurringTaskIds,
    taskSchedules,
    handleSetRecurring,
    handleRemoveRecurring,
    handleScheduleTask,
    
    // Filtrage
    applyFilters,
    getFilteredTasks,
    getCompletedTasks
  };
};

export type ViewDataReturn = ReturnType<typeof useViewData>;
