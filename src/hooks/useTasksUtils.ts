
import { Task } from '@/types/task';

/**
 * Hook pour les utilitaires de tâches (calculs, filtres, tri)
 */
export const useTasksUtils = (tasks: Task[] = [], pinnedTasks: string[] = []) => {
  // Assurer que tasks et pinnedTasks sont des tableaux valides
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safePinnedTasks = Array.isArray(pinnedTasks) ? pinnedTasks : [];

  const getSubTasks = (parentId: string) => {
    if (!parentId || !safeTasks.length) return [];
    return safeTasks.filter(task => task && task.parentId === parentId);
  };

  const calculateTotalTime = (task: Task): number => {
    if (!task) return 0;
    
    const subTasks = getSubTasks(task.id);
    if (subTasks.length === 0) {
      return task.estimatedTime || 0;
    }
    return subTasks.reduce((total, subTask) => {
      if (!subTask) return total;
      return total + calculateTotalTime(subTask);
    }, 0);
  };

  const canHaveSubTasks = (task: Task) => {
    if (!task || task.level >= 2) return false;
    const subTasks = getSubTasks(task.id);
    return subTasks.length < 3;
  };

  // Obtenir les tâches principales triées (épinglées en premier)
  const mainTasks = safeTasks.filter(task => task && task.level === 0);
  const sortedMainTasks = [
    ...mainTasks.filter(task => task && safePinnedTasks.includes(task.id)),
    ...mainTasks.filter(task => task && !safePinnedTasks.includes(task.id))
  ];
  
  // Calculer le temps total du projet
  const totalProjectTime = mainTasks.reduce((total, task) => {
    if (!task) return total;
    return total + calculateTotalTime(task);
  }, 0);

  // Statistiques de completion
  const completedTasks = safeTasks.filter(task => task && task.isCompleted).length;
  const completionRate = safeTasks.length > 0 ? Math.round((completedTasks / safeTasks.length) * 100) : 0;

  return {
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    mainTasks: sortedMainTasks,
    totalProjectTime,
    completedTasks,
    completionRate
  };
};
