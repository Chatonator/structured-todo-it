// ============= Project Tasks Hook (unified items wrapper) =============
// This hook provides project-specific task operations using the unified 'items' table
// Project tasks use parent_id to reference their project (not metadata.projectId)

import { useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { itemToTask } from '@/utils/itemConverters';
import { KanbanColumnConfig } from '@/types/item';
import { Task } from '@/types/task';

// Default columns for backward compatibility
const DEFAULT_COLUMN_IDS = ['todo', 'in-progress', 'done'];

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

  // Update task status (kanban) - SECURED: Validates item exists and parent matches
  const updateTaskStatus = useCallback(async (
    taskId: string,
    newStatus: string
  ): Promise<boolean> => {
    const item = projectItems.find(i => i.id === taskId);
    if (!item) {
      console.error('updateTaskStatus: Item not found', { taskId, projectId });
      return false;
    }

    // GUARD: Verify task still belongs to this project
    if (item.parentId !== projectId) {
      console.error('updateTaskStatus: Task no longer belongs to project', { 
        taskId, 
        expectedProject: projectId, 
        actualProject: item.parentId 
      });
      return false;
    }

    // Consider task completed if status is 'done' (default) or any custom "done-like" column
    // For custom columns, we keep isCompleted logic simple: only 'done' marks it complete
    const isCompleted = newStatus === 'done';
    
    try {
      await updateItem(taskId, {
        isCompleted,
        metadata: { ...item.metadata, projectStatus: newStatus }
      });
      return true;
    } catch (error) {
      console.error('updateTaskStatus error:', error);
      return false;
    }
  }, [projectItems, projectId, updateItem]);

  // Tasks grouped by status for Kanban board (supports dynamic columns)
  const getTasksByColumns = useCallback((columns?: KanbanColumnConfig[]): Record<string, Task[]> => {
    const columnIds = columns?.map(c => c.id) || DEFAULT_COLUMN_IDS;
    
    const result: Record<string, Task[]> = {};
    columnIds.forEach(id => {
      result[id] = [];
    });

    tasks.forEach(task => {
      const status = task.projectStatus || 'todo';
      // If status matches a column, add it there; otherwise default to first column
      if (result[status]) {
        result[status].push(task);
      } else {
        // Fallback to first column if status doesn't match any column
        const firstColumn = columnIds[0] || 'todo';
        result[firstColumn]?.push(task);
      }
    });

    return result;
  }, [tasks]);

  // Legacy tasksByStatus for backward compatibility (3 default columns)
  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(t => !t.projectStatus || t.projectStatus === 'todo'),
    inProgress: tasks.filter(t => t.projectStatus === 'in-progress'),
    done: tasks.filter(t => t.projectStatus === 'done')
  }), [tasks]);

  return {
    tasks,
    loading,
    tasksByStatus,
    getTasksByColumns,
    updateTaskStatus,
    reloadTasks: reload
  };
};
