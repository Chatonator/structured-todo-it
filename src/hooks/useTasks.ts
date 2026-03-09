// ============= Tasks Hook (unified items wrapper) =============
// This hook wraps useItems to provide backward-compatible Task operations
// All data is now stored in the unified 'items' table

import { useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { useGamification } from './useGamification';
import { useTimeEventSync } from './useTimeEventSync';
import { Task } from '@/types/task';
import { ItemMetadata } from '@/types/item';
import { itemToTask } from '@/utils/itemConverters';
import { canAddSubTask } from '@/utils/taskValidation';
import { logger } from '@/lib/logger';
import type { ScheduleInfo } from '@/hooks/time-sync';

// Convert Task to Item metadata
function taskToItemMetadata(task: Partial<Task>): Partial<ItemMetadata> {
  return {
    category: task.category,
    subCategory: task.subCategory,
    context: task.context,
    estimatedTime: task.estimatedTime,
    duration: task.duration,
    level: task.level,
    isExpanded: task.isExpanded,
    projectId: task.projectId,
    projectStatus: task.projectStatus,
  };
}

export const useTasks = () => {
  const { 
    items, 
    loading, 
    createItem, 
    updateItem, 
    deleteItem, 
    toggleComplete,
    togglePin,
    getPinnedItems,
    reload 
  } = useItems({ 
    contextTypes: ['task', 'subtask', 'project_task'] 
  });
  
  const { rewardTaskCompletion } = useGamification();
  const { updateEventStatus, syncTaskEventWithSchedule } = useTimeEventSync();

  // Convert items to tasks
  const tasks = useMemo(() => items.map(itemToTask), [items]);
  
  // Get pinned task IDs
  const pinnedTasks = useMemo(() => 
    getPinnedItems('task').map(i => i.id), 
    [getPinnedItems]
  );

  // Main tasks (level 0, not project tasks)
  const mainTasks = useMemo(() => 
    tasks.filter(t => t.level === 0 && !t.projectId),
    [tasks]
  );

  // Completion stats
  const { completed: completedTasksCount, completionRate } = useMemo(
    () => computeCompletionStats(tasks, t => t.isCompleted),
    [tasks]
  );

  const completedTasks = useMemo(() => tasks.filter(t => t.isCompleted), [tasks]);

  // Total time
  const totalProjectTime = useMemo(() => 
    tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
    [tasks]
  );

  // Add task - SECURED: Validates no duplicate exists
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    // Extract schedule info before processing
    const scheduleInfo = (taskData as any)._scheduleInfo as ScheduleInfo | undefined;

    // GUARD: Structural limits for subtasks
    if (taskData.parentId) {
      const parentTask = tasks.find(t => t.id === taskData.parentId);
      const siblingCount = tasks.filter(t => t.parentId === taskData.parentId).length;
      const parentLevel = parentTask?.level ?? 0;
      const check = canAddSubTask(parentLevel, siblingCount);
      if (!check.allowed) {
        logger.warn('addTask: Structural limit reached', { reason: check.reason, parentId: taskData.parentId });
        return;
      }
    }
    if ((taskData.level ?? 0) > 2) {
      logger.warn('addTask: Level exceeds max depth', { level: taskData.level });
      return;
    }

    // For project tasks, use projectId as parentId (project tasks are children of projects)
    const isProjectTask = !!taskData.projectId;
    const contextType = taskData.level === 0 
      ? (isProjectTask ? 'project_task' : 'task') 
      : 'subtask';
    
    const parentId = isProjectTask && taskData.level === 0 
      ? taskData.projectId 
      : (taskData.parentId || null);
    
    // GUARD: Prevent accidental double-submit (same name+parent created in last 5s)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const existingTask = items.find(i => 
      i.name === taskData.name && 
      i.parentId === parentId &&
      !i.isCompleted &&
      i.createdAt && new Date(i.createdAt).getTime() > Date.now() - 5000
    );
    
    if (existingTask) {
      console.warn('addTask: Duplicate task detected (double-submit guard), skipping creation', { 
        name: taskData.name, parentId, existingId: existingTask.id 
      });
      return existingTask;
    }
    
    const newItem = await createItem({
      name: taskData.name,
      contextType,
      parentId,
      metadata: taskToItemMetadata(taskData),
    });

    // Sync time_event if schedule info provided
    if (newItem && scheduleInfo?.date && scheduleInfo?.time) {
      const newTask = { ...taskData, id: newItem.id, name: taskData.name } as Task;
      await syncTaskEventWithSchedule(newTask, scheduleInfo);
      logger.debug('addTask: time_event synced', { taskId: newItem.id });
    }

    return newItem;
  }, [createItem, items, tasks, syncTaskEventWithSchedule]);

  // Remove task
  const removeTask = useCallback(async (taskId: string) => {
    await deleteItem(taskId);
  }, [deleteItem]);

  // Toggle completion with gamification and time_event sync
  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const willBeCompleted = !task.isCompleted;
    
    await toggleComplete(taskId);
    
    // Sync time_event status for recurring tasks
    await updateEventStatus(
      'task', 
      taskId, 
      willBeCompleted ? 'completed' : 'scheduled'
    );
    
    // Reward if completing (not uncompleting)
    if (willBeCompleted) {
      await rewardTaskCompletion(task);
    }
  }, [tasks, toggleComplete, rewardTaskCompletion, updateEventStatus]);

  // Toggle expansion
  const toggleTaskExpansion = useCallback(async (taskId: string) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;
    
    await updateItem(taskId, {
      metadata: { ...item.metadata, isExpanded: !(item.metadata.isExpanded ?? true) }
    });
  }, [items, updateItem]);

  // Toggle pin
  const togglePinTask = useCallback(async (taskId: string) => {
    await togglePin(taskId);
  }, [togglePin]);

  // Update task - SECURED: Validates item exists and prevents orphaning
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Extract schedule info before processing
    const scheduleInfo = (updates as any)._scheduleInfo as ScheduleInfo | undefined;
    
    const item = items.find(i => i.id === taskId);
    if (!item) {
      console.error('updateTask: Item not found', { taskId });
      return;
    }

    // GUARD: Prevent removing projectId from project_task without type change
    if (item.contextType === 'project_task' && updates.projectId === null) {
      console.warn('updateTask: Preventing orphaning of project_task', { taskId });
      await updateItem(taskId, {
        name: updates.name ?? item.name,
        isCompleted: updates.isCompleted ?? item.isCompleted,
        parentId: null,
        contextType: 'task',
        metadata: { ...item.metadata, ...taskToItemMetadata(updates), projectId: undefined, projectStatus: undefined },
      });
    } else {
      const newMetadata = { ...item.metadata, ...taskToItemMetadata(updates) };
      
      await updateItem(taskId, {
        name: updates.name ?? item.name,
        isCompleted: updates.isCompleted ?? item.isCompleted,
        parentId: updates.parentId ?? item.parentId,
        metadata: newMetadata,
      });
    }

    // Sync time_event if schedule info provided
    if (scheduleInfo) {
      const task = tasks.find(t => t.id === taskId);
      const mergedTask = { ...task, ...updates, id: taskId } as Task;
      await syncTaskEventWithSchedule(mergedTask, scheduleInfo);
      logger.debug('updateTask: time_event synced', { taskId });
    }
  }, [items, tasks, updateItem, syncTaskEventWithSchedule]);

  // Get subtasks
  const getSubTasks = useCallback((parentId: string) => {
    return tasks.filter(t => t.parentId === parentId);
  }, [tasks]);

  // Calculate total time including subtasks
  const calculateTotalTime = useCallback((task: Task) => {
    const subTasks = getSubTasks(task.id);
    const subTime = subTasks.reduce((sum, st) => sum + (st.estimatedTime || 0), 0);
    return (task.estimatedTime || 0) + subTime;
  }, [getSubTasks]);

  // Can have subtasks
  const canHaveSubTasks = useCallback((task: Task) => {
    return task.level < 2;
  }, []);

  // Schedule task (placeholder - to be integrated with time_events)
  const scheduleTask = useCallback(async (taskId: string, date: Date) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;
    
    await updateItem(taskId, {
      metadata: { ...item.metadata, scheduledDate: date }
    });
  }, [items, updateItem]);

  // Unschedule task
  const unscheduleTask = useCallback(async (taskId: string) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;
    
    const { scheduledDate, scheduledTime, ...rest } = item.metadata;
    await updateItem(taskId, { metadata: rest });
  }, [items, updateItem]);

  // Reorder tasks
  const reorderTasks = useCallback(async (startIndex: number, endIndex: number) => {
    const mainTasksList = mainTasks;
    const result = [...mainTasksList];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update order indices
    for (let i = 0; i < result.length; i++) {
      const item = items.find(it => it.id === result[i].id);
      if (item) {
        await updateItem(item.id, { orderIndex: i });
      }
    }
  }, [mainTasks, items, updateItem]);

  // Sort tasks
  const sortTasks = useCallback(async (sortBy: 'name' | 'duration' | 'category') => {
    const sorted = [...mainTasks].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'duration': return calculateTotalTime(a) - calculateTotalTime(b);
        case 'category': return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    
    for (let i = 0; i < sorted.length; i++) {
      const item = items.find(it => it.id === sorted[i].id);
      if (item) {
        await updateItem(item.id, { orderIndex: i });
      }
    }
  }, [mainTasks, items, updateItem, calculateTotalTime]);

  // Restore task (un-complete)
  const restoreTask = useCallback(async (taskId: string) => {
    await updateItem(taskId, { isCompleted: false });
  }, [updateItem]);

  // Update task duration
  const updateTaskDuration = useCallback(async (taskId: string, duration: number) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;
    
    await updateItem(taskId, {
      metadata: { ...item.metadata, duration }
    });
  }, [items, updateItem]);

  // Schedule with time
  const scheduleTaskWithTime = useCallback(async (taskId: string, startTime: Date, duration: number) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;
    
    await updateItem(taskId, {
      metadata: { ...item.metadata, startTime, duration }
    });
  }, [items, updateItem]);

  // Local update helpers (for optimistic UI)
  const updateLocalTask = useCallback((taskId: string, updates: Partial<Task>) => {
    // React Query handles this automatically
  }, []);

  const updateLocalTasks = useCallback((taskIds: string[], updates: Partial<Task>) => {
    // React Query handles this automatically
  }, []);

  return {
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
    tasksCount: tasks.length,
    totalProjectTime,
    completedTasks,
    completionRate,
    undo: () => {}, // Placeholder
    redo: () => {}, // Placeholder
    canUndo: false,
    canRedo: false,
    scheduleTask,
    unscheduleTask,
    updateTaskDuration,
    restoreTask,
    scheduleTaskWithTime,
    updateTask,
    updateLocalTask,
    updateLocalTasks,
    isLoading: loading,
    reload,
  };
};
