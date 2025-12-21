
import { Task } from '@/types/task';
import { useTasksData } from './useTasksData';
import { useTasksOperations } from './useTasksOperations';
import { useTasksUtils } from './useTasksUtils';
import { useGamification } from './useGamification';
import { useAchievements } from './useAchievements';
import { useActionHistory } from './useActionHistory';

export const useTasks = () => {
  const { tasks, setTasks, pinnedTasks, setPinnedTasks, saveTask, completeTask, deleteTask, updateLocalTask, updateLocalTasks } = useTasksData();
  const { undo, redo, canUndo, canRedo } = useActionHistory();
  const { rewardTaskCompletion } = useGamification();
  const { checkAndUnlockAchievement } = useAchievements();
  
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

    if (!task.isCompleted) {
      await completeTask(taskId);
      await rewardTaskCompletion(task);
      const newCount = tasks.filter(t => t.isCompleted).length + 1;
      await checkAndUnlockAchievement('tasks_10', newCount);
    } else {
      const updatedTask = { ...task, isCompleted: !task.isCompleted };
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? updatedTask : t
        )
      );
      await saveTask(updatedTask);
      if (updatedTask.isCompleted) {
        await rewardTaskCompletion(task);
        const newCount = tasks.filter(t => t.isCompleted).length + 1;
        await checkAndUnlockAchievement('tasks_10', newCount);
      }
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

  const updateTask = async (taskId: string, updates: Partial<Task> & { _scheduleInfo?: any }) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.warn('[updateTask] Tâche non trouvée:', taskId);
        return;
      }

      // Extraire les infos de planification avant merge
      const scheduleInfo = (updates as any)._scheduleInfo;
      const { _scheduleInfo, ...cleanUpdates } = updates as any;

      // Créer la tâche mise à jour immédiatement (pour éviter problèmes de closure)
      const updatedTask = { ...task, ...cleanUpdates };
      
      console.log('[updateTask] Mise à jour tâche:', taskId, 'Updates:', cleanUpdates);
      console.log('[updateTask] projectId dans updates:', cleanUpdates.projectId);
      
      // Mise à jour optimiste du state
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? updatedTask : t)
      );
      
      // Ajouter les infos de planification pour la synchronisation time_events
      if (scheduleInfo) {
        (updatedTask as any)._scheduleInfo = scheduleInfo;
      }
      
      // Sauvegarder en DB
      console.log('[updateTask] Sauvegarde en DB avec projectId:', updatedTask.projectId);
      await saveTask(updatedTask);
      
      console.log('[updateTask] Tâche sauvegardée:', taskId, scheduleInfo ? '(avec planification)' : '');
    } catch (error) {
      console.warn('[updateTask] Erreur:', error);
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
    updateLocalTask,
    updateLocalTasks,
  };
};
