// ============= Project Tasks Hook (unified items wrapper) =============
// This hook provides project-specific task operations using the unified 'items' table
// Project tasks use parent_id to reference their project (not metadata.projectId)

import { useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { TaskProjectStatus } from '@/types/project';
import { itemToTask } from '@/utils/itemConverters';

export const useProjectTasks = (projectId: string | null) => {
  const { 
    items, 
    loading, 
    updateItem, 
    reload 
  } = useItems({ 
    contextTypes: ['project_task'] 
  });

  // Filter items for this project using parent_id (not metadata.projectId)
  const projectItems = useMemo(() => 
    items.filter(item => item.parentId === projectId),
    [items, projectId]
  );

  // Convert to tasks
  const tasks = useMemo(() => projectItems.map(itemToTask), [projectItems]);

  // Update task status (kanban)
  const updateTaskStatus = useCallback(async (
    taskId: string,
    newStatus: TaskProjectStatus
  ): Promise<boolean> => {
    const item = projectItems.find(i => i.id === taskId);
    if (!item) return false;

    const isCompleted = newStatus === 'done';
    
    try {
      await updateItem(taskId, {
        isCompleted,
        metadata: { ...item.metadata, projectStatus: newStatus }
      });
      return true;
    } catch {
      return false;
    }
  }, [projectItems, updateItem]);

  // Tasks grouped by status for Kanban board
  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(t => !t.projectStatus || t.projectStatus === 'todo'),
    inProgress: tasks.filter(t => t.projectStatus === 'in-progress'),
    done: tasks.filter(t => t.projectStatus === 'done')
  }), [tasks]);

  return {
    tasks,
    loading,
    tasksByStatus,
    updateTaskStatus,
    reloadTasks: reload
  };
};
