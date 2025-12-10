import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { logger } from '@/lib/logger';

interface ProjectTaskWithInfo {
  task: Task;
  projectName: string;
  projectIcon?: string;
}

export const useAllProjectTasks = (projects: Project[]) => {
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadAllProjectTasks = useCallback(async () => {
    if (!user || projects.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const projectIds = projects.map(p => p.id);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', projectIds)
        .in('project_status', ['todo', 'in-progress'])
        .eq('isCompleted', false)
        .eq('level', 0)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((t: any): Task => ({
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
        duration: t.duration,
        projectId: t.project_id,
        projectStatus: t.project_status
      }));

      setProjectTasks(formatted);
    } catch (error: any) {
      logger.error('Failed to load project tasks', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, projects]);

  // Mapper les tâches avec les infos du projet
  const projectTasksWithInfo = useMemo((): ProjectTaskWithInfo[] => {
    return projectTasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      return {
        task,
        projectName: project?.name || 'Projet',
        projectIcon: project?.icon
      };
    });
  }, [projectTasks, projects]);

  const toggleProjectTaskCompletion = useCallback(async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ isCompleted: true })
        .eq('id', taskId);

      if (error) throw error;

      // Recharger les tâches
      await loadAllProjectTasks();
    } catch (error: any) {
      logger.error('Failed to toggle project task', { error: error.message });
    }
  }, [user, loadAllProjectTasks]);

  useEffect(() => {
    loadAllProjectTasks();
  }, [loadAllProjectTasks]);

  return {
    projectTasks: projectTasksWithInfo,
    loading,
    toggleProjectTaskCompletion,
    reloadProjectTasks: loadAllProjectTasks
  };
};
