import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useTimeEventSync } from './useTimeEventSync';

// Interface pour les infos de planification passées depuis TaskModal
interface ScheduleInfo {
  date?: Date;
  time?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
}

export const useTasksDatabase = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { syncTaskEventWithSchedule, deleteEntityEvent, updateEventStatus } = useTimeEventSync();

  // Load tasks from database
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTasks([]);
      setPinnedTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        throw tasksError;
      }

      // Convert database format to app format - sans les champs temporels obsolètes
      const formattedTasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        name: task.name,
        category: task.category as Task['category'],
        subCategory: task.subCategory as Task['subCategory'],
        context: task.context as Task['context'],
        estimatedTime: task.estimatedTime,
        duration: task.duration || undefined,
        level: task.level as Task['level'],
        parentId: task.parentId || undefined,
        isCompleted: task.isCompleted,
        isExpanded: task.isExpanded,
        createdAt: new Date(task.created_at),
        // Champs projet
        projectId: task.project_id || undefined,
        projectStatus: task.project_status as Task['projectStatus'] || undefined,
      }));

      setTasks(formattedTasks);

      // Load pinned tasks from database
      const { data: pinnedData, error: pinnedError } = await supabase
        .from('pinned_tasks')
        .select('task_id')
        .eq('user_id', user.id);

      if (pinnedError) {
        logger.warn('Failed to load pinned tasks', { error: pinnedError.message });
        setPinnedTasks([]);
      } else {
        const pinnedTaskIds = (pinnedData || []).map(p => p.task_id);
        setPinnedTasks(pinnedTaskIds);
      }

      logger.info('Tasks loaded successfully', { taskCount: formattedTasks.length });
    } catch (error: any) {
      logger.error('Failed to load tasks', { error: error.message });
      setError('Failed to load tasks. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load tasks. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  // Save task to database - SANS les champs temporels obsolètes
  const saveTask = useCallback(async (task: Task & { _scheduleInfo?: ScheduleInfo }): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      // Extraire les infos de planification si présentes
      const scheduleInfo = (task as any)._scheduleInfo as ScheduleInfo | undefined;
      
      // Données de la tâche SANS les champs temporels
      const taskData = {
        id: task.id,
        name: task.name,
        category: task.category,
        subCategory: task.subCategory,
        context: task.context,
        estimatedTime: task.estimatedTime,
        duration: task.duration,
        level: task.level,
        parentId: task.parentId,
        isCompleted: task.isCompleted,
        isExpanded: task.isExpanded,
        user_id: user.id,
        // Champs projet
        project_id: task.projectId || null,
        project_status: task.projectStatus || null,
      };

      const { error } = await supabase
        .from('tasks')
        .upsert(taskData, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      // Synchroniser avec le système unifié time_events
      await syncTaskEventWithSchedule(task, scheduleInfo);

      logger.debug('Task saved successfully', { taskId: task.id });
      return true;
    } catch (error: any) {
      logger.error('Failed to save task', { error: error.message, taskId: task.id });
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isAuthenticated, user, toast, syncTaskEventWithSchedule]);

  // Update tasks in database
  const updateTasks = useCallback(async (newTasks: Task[]): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      // Save all tasks
      const savePromises = newTasks.map(task => saveTask(task));
      const results = await Promise.all(savePromises);
      
      // Check if all saves were successful
      const allSuccessful = results.every(result => result);
      
      if (allSuccessful) {
        setTasks(newTasks);
        return true;
      } else {
        throw new Error('Some tasks failed to save');
      }
    } catch (error: any) {
      logger.error('Failed to update tasks', { error: error.message });
      return false;
    }
  }, [isAuthenticated, user, saveTask]);

  // Delete task from database
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Task not found or permission denied');
      }

      // Supprimer le time_event associé
      await deleteEntityEvent('task', taskId);

      // Update local state
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      logger.debug('Task deleted successfully', { taskId });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete task', { error: error.message, taskId });
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isAuthenticated, user, toast, deleteEntityEvent]);

  // Complete task - met à jour le time_event associé
  const completeTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return false;

      const { error } = await supabase
        .from('tasks')
        .update({ isCompleted: true })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Mettre à jour le time_event associé
      await updateEventStatus('task', taskId, 'completed');

      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, isCompleted: true }
          : t
      ));

      logger.debug('Task completed successfully', { taskId });
      return true;
    } catch (error: any) {
      logger.error('Failed to complete task', { error: error.message, taskId });
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isAuthenticated, user, tasks, toast, updateEventStatus]);

  // Save pinned tasks to database
  const savePinnedTasks = useCallback(async (newPinnedTasks: string[]) => {
    if (!user) return;
    
    try {
      // Delete all current pinned tasks for user
      await supabase
        .from('pinned_tasks')
        .delete()
        .eq('user_id', user.id);

      // Insert new pinned tasks
      if (newPinnedTasks.length > 0) {
        const pinnedData = newPinnedTasks.map(taskId => ({
          user_id: user.id,
          task_id: taskId
        }));

        const { error } = await supabase
          .from('pinned_tasks')
          .insert(pinnedData);

        if (error) {
          throw error;
        }
      }

      setPinnedTasks(newPinnedTasks);
      logger.debug('Pinned tasks saved successfully', { count: newPinnedTasks.length });
    } catch (error: any) {
      logger.error('Failed to save pinned tasks', { error: error.message });
      toast({
        title: "Error",
        description: "Failed to save pinned tasks. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load tasks when auth state changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.debug('Realtime task update', { eventType: payload.eventType, payload });
          
          if (payload.eventType === 'INSERT') {
            const newTask = formatTaskFromDb(payload.new);
            setTasks(prev => {
              // Éviter les doublons
              if (prev.some(t => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = formatTaskFromDb(payload.new);
            setTasks(prev => prev.map(t => 
              t.id === updatedTask.id ? updatedTask : t
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setTasks(prev => prev.filter(t => t.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user]);

  // Helper to format task from database
  const formatTaskFromDb = (dbTask: any): Task => ({
    id: dbTask.id,
    name: dbTask.name,
    category: dbTask.category as Task['category'],
    subCategory: dbTask.subCategory as Task['subCategory'],
    context: dbTask.context as Task['context'],
    estimatedTime: dbTask.estimatedTime,
    duration: dbTask.duration || undefined,
    level: dbTask.level as Task['level'],
    parentId: dbTask.parentId || undefined,
    isCompleted: dbTask.isCompleted,
    isExpanded: dbTask.isExpanded,
    createdAt: new Date(dbTask.created_at),
    projectId: dbTask.project_id || undefined,
    projectStatus: dbTask.project_status as Task['projectStatus'] || undefined,
  });

  // Update local task state immediately (for optimistic UI)
  const updateLocalTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));
  }, []);

  // Update multiple tasks locally
  const updateLocalTasks = useCallback((taskIds: string[], updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      taskIds.includes(t.id) ? { ...t, ...updates } : t
    ));
  }, []);

  return {
    tasks,
    pinnedTasks,
    loading,
    error,
    setTasks: updateTasks,
    setPinnedTasks: savePinnedTasks,
    saveTask,
    deleteTask,
    completeTask,
    reloadTasks: loadTasks,
    updateLocalTask,
    updateLocalTasks,
  };
};
