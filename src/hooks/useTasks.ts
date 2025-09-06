
import { Task } from '@/types/task';
import { useTasksData } from './useTasksData';
import { useTasksOperations } from './useTasksOperations';
import { useTasksUtils } from './useTasksUtils';

import { useActionHistory } from './useActionHistory';

export const useTasks = () => {
  const { tasks, setTasks, pinnedTasks, setPinnedTasks, saveTask, completeTask, deleteTask } = useTasksData();
  const { undo, redo, canUndo, canRedo } = useActionHistory();
  
  const { addTask, removeTask, scheduleTask } = useTasksOperations(
    tasks,
    setTasks,  
    setPinnedTasks,
    saveTask,
    { deleteTask }
  );

  // Use database-aware completion function for recurring tasks
  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.isRecurring && !task.isCompleted) {
      // For recurring tasks, use the database completion method
      await completeTask(taskId);
    } else {
      // For non-recurring tasks, update locally and save to database
      const updatedTask = { ...task, isCompleted: !task.isCompleted };
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? updatedTask : t
        )
      );
      // Save to database
      await saveTask(updatedTask);
    }
  };

  const {
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    mainTasks,
    totalProjectTime,
    completedTasks,
    completionRate
  } = useTasksUtils(tasks, pinnedTasks);

  

  const toggleTaskExpansion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, isExpanded: !task.isExpanded };
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? updatedTask : t
      )
    );
    // Save to database
    await saveTask(updatedTask);
  };

  const togglePinTask = (taskId: string) => {
    const currentPinned = Array.isArray(pinnedTasks) ? pinnedTasks : [];
    const isPinned = currentPinned.includes(taskId);
    
    const newPinnedTasks = isPinned 
      ? currentPinned.filter(id => id !== taskId)
      : [taskId, ...currentPinned];
    
    setPinnedTasks(newPinnedTasks);
    console.log('Tâche épinglage togglee:', taskId, 'Nouvelles tâches épinglées:', newPinnedTasks);
  };

  const reorderTasks = async (startIndex: number, endIndex: number) => {
    const mainTasksOnly = tasks.filter(t => t.level === 0);
    const otherTasks = tasks.filter(t => t.level > 0);
    
    const result = Array.from(mainTasksOnly);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    const newTasks = [...result, ...otherTasks];
    setTasks(newTasks);
    
    // Save all reordered main tasks to database
    const savePromises = result.map(task => saveTask(task));
    await Promise.all(savePromises);
    
    console.log('Tâches réorganisées');
  };

  const sortTasks = async (sortBy: 'name' | 'duration' | 'category') => {
    const mainTasksOnly = tasks.filter(t => t.level === 0);
    const otherTasks = tasks.filter(t => t.level > 0);
    
    const sorted = [...mainTasksOnly].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'duration':
          return calculateTotalTime(a) - calculateTotalTime(b);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    
    const newTasks = [...sorted, ...otherTasks];
    setTasks(newTasks);
    
    // Save all sorted main tasks to database
    const savePromises = sorted.map(task => saveTask(task));
    await Promise.all(savePromises);
    
    console.log('Tâches triées par:', sortBy);
  };

  const unscheduleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, scheduledDate: undefined, scheduledTime: undefined };
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? updatedTask : t
      )
    );
    // Save to database
    await saveTask(updatedTask);
    console.log('Tâche déprogrammée:', taskId);
  };

  const updateTaskDuration = async (taskId: string, duration: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, duration };
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? updatedTask : t
      )
    );
    // Save to database
    await saveTask(updatedTask);
  };

  const restoreTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, isCompleted: false };
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? updatedTask : t
      )
    );
    // Save to database
    await saveTask(updatedTask);
    console.log('Tâche restaurée:', taskId);
  };

  const scheduleTaskWithTime = async (taskId: string, startTime: Date, duration: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = { ...task, startTime, duration };
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? updatedTask : t
        )
      );
      // Save to database
      await saveTask(updatedTask);
      console.log('Tâche planifiée avec horaire:', taskId, startTime, duration);
    } catch (error) {
      console.warn('Erreur planification tâche:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      let updatedTask: Task | null = null;
      setTasks(prevTasks => {
        let changed = false;
        const next = prevTasks.map(t => {
          if (t.id !== taskId) return t;
          const merged = { ...t, ...updates };
          const taskHasChanged = Object.entries(updates).some(
            ([key, value]) => t[key as keyof Task] !== value
          );
          if (taskHasChanged) {
            changed = true;
            updatedTask = merged;
          }
          return taskHasChanged ? merged : t;
        });
        // Ne remplace l'état que s'il y a vraiment eu un changement
        return changed ? next : prevTasks;
      });
      
      // Save to database if there was a change
      if (updatedTask) {
        await saveTask(updatedTask);
      }
      console.log('Tâche mise à jour:', taskId, updates);
    } catch (error) {
      console.warn('Erreur mise à jour tâche:', error);
      throw error;
    }
  };


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
    undo,
    redo,
    canUndo,
    canRedo,
    scheduleTask,
    unscheduleTask,
    updateTaskDuration,
    restoreTask,
    scheduleTaskWithTime,
    updateTask,
    
  };
};
