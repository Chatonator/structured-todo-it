
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { validateTaskList, repairTaskList, sanitizeTask } from '@/utils/taskValidation';

const STORAGE_KEY = 'todo-it-tasks';
const PINNED_TASKS_KEY = 'todo-it-pinned-tasks';

/**
 * Hook pour la gestion des données des tâches (localStorage, validation)
 * Garantit que tasks est toujours un tableau valide
 */
export const useTasksData = () => {
  // Initialisation explicite avec des valeurs par défaut
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Charger les tâches depuis localStorage au démarrage avec validation robuste
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoadError(null);
        
        const savedTasks = localStorage.getItem(STORAGE_KEY);
        const savedPinnedTasks = localStorage.getItem(PINNED_TASKS_KEY);
        
        // Gestion robuste des tâches
        if (savedTasks) {
          let parsedTasks = JSON.parse(savedTasks);
          
          // Vérification que c'est bien un tableau
          if (!Array.isArray(parsedTasks)) {
            console.warn('Données tasks invalides (pas un tableau), initialisation avec tableau vide');
            parsedTasks = [];
          }
          
          // Normaliser les tâches avec valeurs par défaut robustes
          const tasksWithDefaults = parsedTasks.map((task: any) => {
            try {
              return {
                ...task,
                id: task.id || `task-${Date.now()}-${Math.random()}`,
                name: task.name || 'Tâche sans nom',
                category: task.category || 'Autres',
                estimatedTime: Number(task.estimatedTime) || 30,
                createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                level: Number(task.level) || 0,
                isExpanded: Boolean(task.isExpanded ?? true),
                isCompleted: Boolean(task.isCompleted ?? false),
                context: task.context || 'Perso',
                // Gestion sécurisée des dates optionnelles
                scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
                scheduledTime: task.scheduledTime || undefined,
                startTime: task.startTime ? new Date(task.startTime) : undefined,
                duration: Number(task.duration) || undefined
              };
            } catch (taskError) {
              console.warn('Erreur lors de la normalisation d\'une tâche:', taskError, task);
              return null;
            }
          }).filter(Boolean); // Éliminer les tâches null/undefined

          // Valider et réparer les données si nécessaire
          const validationErrors = validateTaskList(tasksWithDefaults);
          if (validationErrors.length > 0) {
            console.warn('Problèmes de données détectés:', validationErrors);
            const repairedTasks = repairTaskList(tasksWithDefaults);
            setTasks(repairedTasks || []);
            console.log('Données réparées automatiquement');
          } else {
            setTasks(tasksWithDefaults || []);
          }
          
          console.log('Tâches chargées depuis localStorage:', tasksWithDefaults.length);
        } else {
          console.log('Aucune tâche sauvegardée, initialisation avec tableau vide');
          setTasks([]);
        }
        
        // Gestion robuste des tâches épinglées
        if (savedPinnedTasks) {
          const parsedPinnedTasks = JSON.parse(savedPinnedTasks);
          if (Array.isArray(parsedPinnedTasks)) {
            setPinnedTasks(parsedPinnedTasks);
          } else {
            console.warn('Données pinnedTasks invalides, initialisation avec tableau vide');
            setPinnedTasks([]);
          }
        } else {
          setPinnedTasks([]);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        setLoadError(`Erreur de chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        // Garantir l'initialisation même en cas d'erreur
        setTasks([]);
        setPinnedTasks([]);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTasks();
  }, []);

  // Sauvegarder dans localStorage à chaque modification avec validation robuste
  useEffect(() => {
    // Ne sauvegarder que si les données sont chargées
    if (!isLoaded) return;
    
    try {
      // Vérifications de sécurité avant sauvegarde
      if (!Array.isArray(tasks)) {
        console.error('Tentative de sauvegarde de tasks non-tableau:', tasks);
        return;
      }
      
      if (!Array.isArray(pinnedTasks)) {
        console.error('Tentative de sauvegarde de pinnedTasks non-tableau:', pinnedTasks);
        return;
      }

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
      setLoadError(`Erreur de sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [tasks, pinnedTasks, isLoaded]);

  // Wrapper sécurisé pour setTasks
  const safeSetTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => {
    if (typeof updater === 'function') {
      setTasks(prev => {
        const newTasks = updater(Array.isArray(prev) ? prev : []);
        return Array.isArray(newTasks) ? newTasks : [];
      });
    } else {
      setTasks(Array.isArray(updater) ? updater : []);
    }
  };

  // Wrapper sécurisé pour setPinnedTasks
  const safeSetPinnedTasks = (updater: string[] | ((prev: string[]) => string[])) => {
    if (typeof updater === 'function') {
      setPinnedTasks(prev => {
        const newPinned = updater(Array.isArray(prev) ? prev : []);
        return Array.isArray(newPinned) ? newPinned : [];
      });
    } else {
      setPinnedTasks(Array.isArray(updater) ? updater : []);
    }
  };

  return {
    tasks: Array.isArray(tasks) ? tasks : [],
    setTasks: safeSetTasks,
    pinnedTasks: Array.isArray(pinnedTasks) ? pinnedTasks : [],
    setPinnedTasks: safeSetPinnedTasks,
    isLoaded,
    loadError
  };
};
