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
  const { updateEventStatus } = useTimeEventSync();

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

  // Completed tasks
  const completedTasks = useMemo(() => 
    tasks.filter(t => t.isCompleted),
    [tasks]
  );

  // Completion rate
  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  }, [tasks, completedTasks]);

  // Total time
  const totalProjectTime = useMemo(() => 
    tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0),
    [tasks]
  );

  // Add task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    // For project tasks, use projectId as parentId (project tasks are children of projects)
    const isProjectTask = !!taskData.projectId;
    const contextType = taskData.level === 0 
      ? (isProjectTask ? 'project_task' : 'task') 
      : 'subtask';
    
    // For project tasks, parentId should be projectId
    // For subtasks, parentId is the parent task
    const parentId = isProjectTask && taskData.level === 0 
      ? taskData.projectId 
      : (taskData.parentId || null);
    
    await createItem({
      name: taskData.name,
      contextType,
      parentId,
      metadata: taskToItemMetadata(taskData),
    });
  }, [createItem]);

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

  // Update task
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;

    const newMetadata = { ...item.metadata, ...taskToItemMetadata(updates) };
    
    await updateItem(taskId, {
      name: updates.name ?? item.name,
      isCompleted: updates.isCompleted ?? item.isCompleted,
      parentId: updates.parentId ?? item.parentId,
      metadata: newMetadata,
    });
  }, [items, updateItem]);

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
