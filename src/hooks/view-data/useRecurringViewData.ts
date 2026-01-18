import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { Task } from '@/types/task';

interface TaskSchedule {
  date: Date;
  time: string;
}

/**
 * Hook spécialisé pour les données de récurrence et planification
 * Extrait de useViewData pour améliorer la maintenabilité
 */
export const useRecurringViewData = (tasks: Task[]) => {
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

  // Handler pour définir une récurrence
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

  // Handler pour supprimer une récurrence
  const handleRemoveRecurring = useCallback(async (taskId: string) => {
    await deleteEntityEvent('task', taskId);
    setRecurringTaskIds(prev => prev.filter(id => id !== taskId));
  }, [deleteEntityEvent]);

  // Handler pour planifier une tâche
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

  // Vérifie si une tâche est récurrente
  const isTaskRecurring = useCallback((taskId: string) => {
    return recurringTaskIds.includes(taskId);
  }, [recurringTaskIds]);

  // Récupère le planning d'une tâche
  const getTaskSchedule = useCallback((taskId: string) => {
    return taskSchedules[taskId] || null;
  }, [taskSchedules]);

  return {
    // Données
    recurringTaskIds,
    taskSchedules,
    
    // Actions
    handleSetRecurring,
    handleRemoveRecurring,
    handleScheduleTask,
    
    // Utilitaires
    isTaskRecurring,
    getTaskSchedule
  };
};

export type RecurringViewDataReturn = ReturnType<typeof useRecurringViewData>;
