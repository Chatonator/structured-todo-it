// ============= Project Tasks Hook (unified items wrapper) =============
// This hook provides project-specific task operations using the unified 'items' table
// Project tasks use parent_id to reference their project (not metadata.projectId)

import { useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { Task } from '@/types/task';
import { TaskProjectStatus } from '@/types/project';
import { Item } from '@/types/item';

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
    // For project tasks, the projectId is the parent_id (not metadata.projectId)
    projectId: item.parentId || undefined,
    projectStatus: (meta.projectStatus as Task['projectStatus']) || 'todo',
  };
}

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
