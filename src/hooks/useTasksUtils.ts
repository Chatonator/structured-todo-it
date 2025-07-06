
import { Task } from '@/types/task';

/**
 * Hook pour les utilitaires de tâches (calculs, filtres, tri)
 */
export const useTasksUtils = (tasks: Task[], pinnedTasks: string[]) => {
  const getSubTasks = (parentId: string) => {
    return tasks.filter(task => task.parentId === parentId);
  };

  const calculateTotalTime = (task: Task): number => {
    const subTasks = getSubTasks(task.id);
    if (subTasks.length === 0) {
      return task.estimatedTime;
    }
    return subTasks.reduce((total, subTask) => total + calculateTotalTime(subTask), 0);
  };

  const canHaveSubTasks = (task: Task) => {
    if (task.level >= 2) return false;
    const subTasks = getSubTasks(task.id);
    return subTasks.length < 3;
  };

  // Obtenir les tâches principales triées (épinglées en premier)
  const mainTasks = tasks.filter(task => task.level === 0);
  const sortedMainTasks = [
    ...mainTasks.filter(task => pinnedTasks.includes(task.id)),
    ...mainTasks.filter(task => !pinnedTasks.includes(task.id))
  ];
  
  // Calculer le temps total du projet
  const totalProjectTime = mainTasks.reduce((total, task) => total + calculateTotalTime(task), 0);

  // Statistiques de completion
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

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
