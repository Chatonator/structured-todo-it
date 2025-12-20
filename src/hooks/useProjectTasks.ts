import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { TaskProjectStatus } from '@/types/project';
import { logger } from '@/lib/logger';

export const useProjectTasks = (projectId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTasks = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, category, subCategory, context, estimatedTime, created_at, parentId, level, isExpanded, isCompleted, scheduledDate, scheduledTime, duration, startTime, isRecurring, recurrenceInterval, lastCompletedAt, project_status')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        subCategory: t.subCategory,
        context: t.context,
        estimatedTime: t.estimatedTime,
        createdAt: new Date(t.created_at),
        parentId: t.parentId,
        level: t.level,
        isExpanded: t.isExpanded,
        isCompleted: t.isCompleted,
        scheduledDate: t.scheduledDate ? new Date(t.scheduledDate) : undefined,
        scheduledTime: t.scheduledTime,
        duration: t.duration,
        startTime: t.startTime ? new Date(t.startTime) : undefined,
        isRecurring: t.isRecurring,
        recurrenceInterval: t.recurrenceInterval,
        lastCompletedAt: t.lastCompletedAt ? new Date(t.lastCompletedAt) : undefined,
        projectStatus: t.project_status
      }));

      setTasks(formatted);
    } catch (error: any) {
      logger.error('Failed to load project tasks', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  const updateTaskStatus = useCallback(async (
    taskId: string,
    newStatus: TaskProjectStatus
  ) => {
    if (!user) return false;

    // Optimistic update - mettre à jour l'UI immédiatement
    const isCompleted = newStatus === 'done';
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, projectStatus: newStatus, isCompleted } 
          : task
      )
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          project_status: newStatus,
          isCompleted: isCompleted
        })
        .eq('id', taskId);

      if (error) {
        // Rollback en cas d'erreur - recharger les données
        await loadTasks();
        throw error;
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to update task status', { error: error.message });
      return false;
    }
  }, [user, loadTasks]);

  // Memoized tasksByStatus - calculé une seule fois quand tasks change
  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(t => t.level === 0 && (!t.projectStatus || t.projectStatus === 'todo')),
    inProgress: tasks.filter(t => t.level === 0 && t.projectStatus === 'in-progress'),
    done: tasks.filter(t => t.level === 0 && t.projectStatus === 'done')
  }), [tasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    tasksByStatus,
    updateTaskStatus,
    reloadTasks: loadTasks
  };
};
