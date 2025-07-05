
import { useTasksData } from './useTasksData';
import { useTasksOperations } from './useTasksOperations';
import { useTasksUtils } from './useTasksUtils';
import { useTasksSaveLoad } from './useTasksSaveLoad';
import { useActionHistory } from './useActionHistory';

/**
 * Hook principal pour la gestion des tâches
 * Refactorisé en modules plus petits et spécialisés
 */
export const useTasks = () => {
  const { tasks, setTasks, pinnedTasks, setPinnedTasks } = useTasksData();
  const { undo, redo, canUndo, canRedo } = useActionHistory();
  
  const { addTask, removeTask, toggleTaskCompletion, scheduleTask } = useTasksOperations(
    tasks,
    setTasks,  
    setPinnedTasks
  );

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
    setPinnedTasks(prev => {
      const isPinned = prev.includes(taskId);
      if (isPinned) {
        return prev.filter(id => id !== taskId);
      } else {
        return [taskId, ...prev];
      }
    });
    console.log('Tâche épinglage togglee:', taskId);
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

  // Nouvelle fonction pour restaurer une tâche terminée
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

  // Nouvelle fonction pour planifier une tâche avec startTime et duration
  const scheduleTaskWithTime = (taskId: string, startTime: Date, duration: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, startTime, duration }
          : task
      )
    );
    console.log('Tâche planifiée avec horaire:', taskId, startTime, duration);
  };

  // Nouvelle fonction pour mettre à jour une tâche existante
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      )
    );
    console.log('Tâche mise à jour:', taskId, updates);
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
    // Historique
    undo,
    redo,
    canUndo,
    canRedo,
    scheduleTask,
    unscheduleTask,
    updateTaskDuration,
    // Nouvelles fonctions
    restoreTask,
    scheduleTaskWithTime,
    updateTask,
    // Sauvegarde et export
    backups,
    saveBackup,
    loadBackup,
    deleteBackup,
    exportToCSV,
    importFromCSV
  };
};
