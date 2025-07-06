
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { validateTaskList, repairTaskList, sanitizeTask } from '@/utils/taskValidation';

const STORAGE_KEY = 'todo-it-tasks';
const PINNED_TASKS_KEY = 'todo-it-pinned-tasks';

/**
 * Hook pour la gestion des données des tâches (localStorage, validation)
 */
export const useTasksData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);

  // Charger les tâches depuis localStorage au démarrage avec validation
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      const savedPinnedTasks = localStorage.getItem(PINNED_TASKS_KEY);
      
      if (savedTasks) {
        let parsedTasks = JSON.parse(savedTasks);
        
        // Normaliser les tâches avec valeurs par défaut
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          level: task.level ?? 0,
          isExpanded: task.isExpanded ?? true,
          isCompleted: task.isCompleted ?? false,
          context: task.context || 'Perso'
        }));

        // Valider et réparer les données si nécessaire
        const validationErrors = validateTaskList(tasksWithDates);
        if (validationErrors.length > 0) {
          console.warn('Problèmes de données détectés:', validationErrors);
          const repairedTasks = repairTaskList(tasksWithDates);
          setTasks(repairedTasks);
          console.log('Données réparées automatiquement');
        } else {
          setTasks(tasksWithDates);
        }
        
        console.log('Tâches chargées depuis localStorage:', tasksWithDates.length);
      }
      
      if (savedPinnedTasks) {
        setPinnedTasks(JSON.parse(savedPinnedTasks));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      setTasks([]);
      setPinnedTasks([]);
    }
  }, []);

  // Sauvegarder dans localStorage à chaque modification avec validation
  useEffect(() => {
    try {
      const validationErrors = validateTaskList(tasks);
      if (validationErrors.length > 0) {
        console.error('Tentative de sauvegarde de données invalides:', validationErrors);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(PINNED_TASKS_KEY, JSON.stringify(pinnedTasks));
      console.log('Tâches sauvegardées:', tasks.length);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [tasks, pinnedTasks]);

  return {
    tasks,
    setTasks,
    pinnedTasks,
    setPinnedTasks
  };
};
