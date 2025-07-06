
import { useMemo } from 'react';
import { Task } from '@/types/task';

/**
 * Hook utilitaire pour les calculs sur les tâches
 * Toutes les fonctions sont sécurisées contre les données null/undefined
 */
export const useTasksUtils = (tasks: Task[] = [], pinnedTasks: string[] = []) => {
  // Sécurisation des paramètres d'entrée
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safePinnedTasks = Array.isArray(pinnedTasks) ? pinnedTasks : [];

  // Filtrer les sous-tâches d'une tâche parent de manière sécurisée
  const getSubTasks = (parentId: string): Task[] => {
    if (!parentId || typeof parentId !== 'string') {
      console.warn('getSubTasks appelé avec un parentId invalide:', parentId);
      return [];
    }
    
    return safeTasks.filter(task => 
      task && 
      typeof task === 'object' && 
      task.parentId === parentId
    );
  };

  // Calculer le temps total d'une tâche avec ses sous-tâches
  const calculateTotalTime = (task: Task): number => {
    if (!task || typeof task !== 'object') {
      console.warn('calculateTotalTime appelé avec une tâche invalide:', task);
      return 0;
    }

    const baseTime = Number(task.estimatedTime) || 0;
    const subTasks = getSubTasks(task.id || '');
    const subTasksTime = subTasks.reduce((sum, subTask) => {
      const subTaskTime = Number(subTask?.estimatedTime) || 0;
      return sum + subTaskTime;
    }, 0);
    
    return baseTime + subTasksTime;
  };

  // Vérifier si une tâche peut avoir des sous-tâches
  const canHaveSubTasks = (task: Task): boolean => {
    if (!task || typeof task !== 'object') {
      return false;
    }
    const level = Number(task.level) || 0;
    return level < 2; // Niveau 0 et 1 peuvent avoir des sous-tâches
  };

  // Mémoisation sécurisée des tâches principales
  const mainTasks = useMemo(() => {
    return safeTasks.filter(task => 
      task && 
      typeof task === 'object' && 
      (Number(task.level) || 0) === 0
    );
  }, [safeTasks]);

  // Calcul sécurisé du temps total du projet
  const totalProjectTime = useMemo(() => {
    return mainTasks.reduce((total, task) => {
      const taskTime = calculateTotalTime(task);
      return total + (Number(taskTime) || 0);
    }, 0);
  }, [mainTasks]);

  // Comptage sécurisé des tâches terminées
  const completedTasks = useMemo(() => {
    return safeTasks.filter(task => 
      task && 
      typeof task === 'object' && 
      Boolean(task.isCompleted)
    ).length;
  }, [safeTasks]);

  // Calcul sécurisé du taux de complétion
  const completionRate = useMemo(() => {
    const totalTasks = safeTasks.length;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [safeTasks.length, completedTasks]);

  return {
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    mainTasks,
    totalProjectTime,
    completedTasks,
    completionRate
  };
};
