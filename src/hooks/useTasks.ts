
import { Task } from '@/types/task';
import { useTasksData } from './useTasksData';
import { useTasksOperations } from './useTasksOperations';
import { useTasksUtils } from './useTasksUtils';
import { useTasksSaveLoad } from './useTasksSaveLoad';
import { useActionHistory } from './useActionHistory';

export const useTasks = () => {
  const { tasks, setTasks, pinnedTasks, setPinnedTasks, saveTask, completeTask } = useTasksData();
  const { undo, redo, canUndo, canRedo } = useActionHistory();
  
  const { addTask, removeTask, scheduleTask } = useTasksOperations(
    tasks,
    setTasks,  
    setPinnedTasks
  );

  // Use database-aware completion function for recurring tasks
  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.isRecurring && !task.isCompleted) {
      // For recurring tasks, use the database completion method
      await completeTask(taskId);
    } else {
      // For non-recurring tasks, use the regular toggle
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        )
      );
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

  const {
    backups,
    saveBackup,
    loadBackup,
    deleteBackup,
    exportToCSV,
    importFromCSV
  } = useTasksSaveLoad(tasks, pinnedTasks, setTasks, setPinnedTasks);

  const toggleTaskExpansion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isExpanded: !task.isExpanded }
          : task
      )
    );
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

  const reorderTasks = (startIndex: number, endIndex: number) => {
    setTasks(prevTasks => {
      const mainTasksOnly = prevTasks.filter(t => t.level === 0);
      const otherTasks = prevTasks.filter(t => t.level > 0);
      
      const result = Array.from(mainTasksOnly);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      console.log('Tâches réorganisées');
      return [...result, ...otherTasks];
    });
  };

  const sortTasks = (sortBy: 'name' | 'duration' | 'category') => {
    setTasks(prevTasks => {
      const mainTasksOnly = prevTasks.filter(t => t.level === 0);
      const otherTasks = prevTasks.filter(t => t.level > 0);
      
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
      console.log('Tâches triées par:', sortBy);
      return [...sorted, ...otherTasks];
    });
  };

  const unscheduleTask = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, scheduledDate: undefined, scheduledTime: undefined }
          : task
      )
    );
    console.log('Tâche déprogrammée:', taskId);
  };

  const updateTaskDuration = (taskId: string, duration: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, duration }
          : task
      )
    );
  };

  const restoreTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, isCompleted: false }
          : task
      )
    );
    console.log('Tâche restaurée:', taskId);
  };

  const scheduleTaskWithTime = (taskId: string, startTime: Date, duration: number) => {
    try {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, startTime, duration }
            : task
        )
      );
      console.log('Tâche planifiée avec horaire:', taskId, startTime, duration);
    } catch (error) {
      console.warn('Erreur planification tâche:', error);
      throw error;
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
  try {
    setTasks(prevTasks => {
      let changed = false;
      const next = prevTasks.map(task => {
        if (task.id !== taskId) return task;
        const merged = { ...task, ...updates };
        const taskHasChanged = Object.entries(updates).some(
          ([key, value]) => task[key as keyof Task] !== value
        );
        if (taskHasChanged) changed = true;
        return taskHasChanged ? merged : task;
      });
      // Ne remplace l'état que s'il y a vraiment eu un changement
      return changed ? next : prevTasks;
    });
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
    backups,
    saveBackup,
    loadBackup,
    deleteBackup,
    exportToCSV,
    importFromCSV
  };
};
