
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les tâches depuis localStorage au démarrage avec validation
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        const savedPinnedTasks = localStorage.getItem(PINNED_TASKS_KEY);
        
        if (savedTasks) {
          let parsedTasks = JSON.parse(savedTasks);
          
          // Vérifier que parsedTasks est un tableau
          if (!Array.isArray(parsedTasks)) {
            console.warn('Données de tâches invalides, initialisation avec tableau vide');
            parsedTasks = [];
          }
          
          // Normaliser les tâches avec valeurs par défaut
          const tasksWithDates = parsedTasks.map((task: any) => ({
            ...task,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            level: task.level ?? 0,
            isExpanded: task.isExpanded ?? true,
            isCompleted: task.isCompleted ?? false,
            context: task.context || 'Perso',
            category: task.category || 'Travail',
            estimatedTime: task.estimatedTime || 30
          }));

          // Valider et réparer les données si nécessaire
          const validationErrors = validateTaskList(tasksWithDates);
          if (validationErrors.length > 0) {
            console.warn('Problèmes de données détectés:', validationErrors);
            const repairedTasks = repairTaskList(tasksWithDates);
            setTasks(repairedTasks || []);
            console.log('Données réparées automatiquement');
          } else {
            setTasks(tasksWithDates || []);
          }
          
          console.log('Tâches chargées depuis localStorage:', tasksWithDates.length);
        } else {
          // Aucune donnée sauvegardée, initialiser avec tableau vide
          setTasks([]);
        }
        
        if (savedPinnedTasks) {
          const parsedPinnedTasks = JSON.parse(savedPinnedTasks);
          setPinnedTasks(Array.isArray(parsedPinnedTasks) ? parsedPinnedTasks : []);
        } else {
          setPinnedTasks([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        setLoadError('Erreur lors du chargement des données');
        // Toujours initialiser avec des valeurs par défaut en cas d'erreur
        setTasks([]);
        setPinnedTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Sauvegarder dans localStorage à chaque modification avec validation
  useEffect(() => {
    // Ne pas sauvegarder si on est encore en train de charger
    if (isLoading) return;
    
    try {
      // Vérifier que tasks est bien un tableau avant validation
      if (!Array.isArray(tasks)) {
        console.error('Tentative de sauvegarde avec des tâches non-tableau:', tasks);
        return;
      }

      const validationErrors = validateTaskList(tasks);
      if (validationErrors.length > 0) {
        console.error('Tentative de sauvegarde de données invalides:', validationErrors);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(PINNED_TASKS_KEY, JSON.stringify(pinnedTasks || []));
      console.log('Tâches sauvegardées:', tasks.length);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setLoadError('Erreur lors de la sauvegarde des données');
    }
  }, [tasks, pinnedTasks, isLoading]);

  return {
    tasks: tasks || [],
    setTasks,
    pinnedTasks: pinnedTasks || [],
    setPinnedTasks,
    loadError,
    isLoading
  };
};
