// ============= All Project Tasks Hook (unified items wrapper) =============
// This hook loads all project tasks across all projects using the unified 'items' table

import { useCallback, useMemo } from 'react';
import { useItems } from '@/hooks/useItems';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { Item } from '@/types/item';

interface ProjectTaskWithInfo {
  task: Task;
  projectName: string;
  projectIcon?: string;
}

// Convert Item to Task for backward compatibility
function itemToTask(item: Item): Task {
  const meta = item.metadata || {};
  return {
    id: item.id,
    name: item.name,
    category: (meta.category as Task['category']) || 'Autres',
    subCategory: meta.subCategory as Task['subCategory'],
    context: (meta.context as Task['context']) || 'Perso',
    estimatedTime: (meta.estimatedTime as number) || 30,
    duration: meta.duration as number | undefined,
    level: (meta.level as Task['level']) || 0,
    parentId: item.parentId || undefined,
    isCompleted: item.isCompleted,
    isExpanded: (meta.isExpanded as boolean) ?? true,
    createdAt: item.createdAt,
    // For project tasks, projectId is the parent_id
    projectId: item.parentId || undefined,
    projectStatus: (meta.projectStatus as Task['projectStatus']) || 'todo',
  };
}

export const useAllProjectTasks = (projects: Project[]) => {
  const { 
    items, 
    loading,
    updateItem,
    reload 
  } = useItems({ 
    contextTypes: ['project_task'],
    includeCompleted: false
  });

  // Filter to only include tasks for the given projects that are in todo or in-progress
  const projectTasks = useMemo(() => {
    const projectIds = new Set(projects.map(p => p.id));
    return items
      .filter(item => {
        // Filter by parent_id (project reference)
        if (!item.parentId || !projectIds.has(item.parentId)) return false;
        // Filter by status
        const status = (item.metadata?.projectStatus as string) || 'todo';
        return status === 'todo' || status === 'in-progress';
      })
      .map(itemToTask);
  }, [items, projects]);

  // Map tasks with project info
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
    const item = items.find(i => i.id === taskId);
    if (!item) return;

    await updateItem(taskId, {
      isCompleted: true,
      metadata: { ...item.metadata, projectStatus: 'done' }
    });
  }, [items, updateItem]);

  return {
    projectTasks: projectTasksWithInfo,
    loading,
    toggleProjectTaskCompletion,
    reloadProjectTasks: reload
  };
};
