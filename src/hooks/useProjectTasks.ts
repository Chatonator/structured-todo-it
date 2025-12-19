import { useState, useEffect, useCallback } from 'react';
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
        .select('*')
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

    try {
      // Synchroniser isCompleted avec le statut du projet
      const isCompleted = newStatus === 'done';
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          project_status: newStatus,
          isCompleted: isCompleted,
          lastCompletedAt: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      await loadTasks();
      return true;
    } catch (error: any) {
      logger.error('Failed to update task status', { error: error.message });
      return false;
    }
  }, [user, loadTasks]);

  const tasksByStatus = useCallback(() => {
    return {
      todo: tasks.filter(t => t.level === 0 && (!t.projectStatus || t.projectStatus === 'todo')),
      inProgress: tasks.filter(t => t.level === 0 && t.projectStatus === 'in-progress'),
      done: tasks.filter(t => t.level === 0 && t.projectStatus === 'done')
    };
  }, [tasks]);

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
