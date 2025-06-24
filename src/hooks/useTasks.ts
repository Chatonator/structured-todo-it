
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { useActionHistory } from './useActionHistory';
import { validateTaskList, repairTaskList, sanitizeTask } from '@/utils/taskValidation';

const STORAGE_KEY = 'todo-it-tasks';
const PINNED_TASKS_KEY = 'todo-it-pinned-tasks';

/**
 * Hook principal pour la gestion des tâches
 * Refactorisé avec validation et réparation automatique des données
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);
  const { addAction, undo, redo, canUndo, canRedo } = useActionHistory();

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
          context: task.context || 'Perso' // Valeur par défaut sécurisée
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
      // En cas d'erreur, initialiser avec un état propre
      setTasks([]);
      setPinnedTasks([]);
    }
  }, []);

  // Sauvegarder dans localStorage à chaque modification avec validation
  useEffect(() => {
    try {
      // Valider avant de sauvegarder
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

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    // Nettoyer et valider les données d'entrée
    const sanitizedData = sanitizeTask(taskData);
    
    const newTask: Task = {
      ...sanitizedData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isCompleted: false
    } as Task;
    
    setTasks(prevTasks => {
      const newTasks = [newTask, ...prevTasks];
      
      // Ajouter à l'historique avec reverseAction et forwardAction
      addAction({
        type: 'add',
        data: newTask,
        reverseAction: () => removeTask(newTask.id),
        forwardAction: () => {
          setTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)]);
        }
      });
      
      return newTasks;
    });
    
    console.log('Nouvelle tâche ajoutée:', newTask);
    return newTask;
  };

  const removeTask = (taskId: string) => {
    setTasks(prevTasks => {
      const taskToRemove = prevTasks.find(t => t.id === taskId);
      if (!taskToRemove) return prevTasks;

      const removeTaskAndChildren = (id: string): string[] => {
        const children = prevTasks.filter(t => t.parentId === id);
        const childrenIds = children.flatMap(child => removeTaskAndChildren(child.id));
        return [id, ...childrenIds];
      };

      const idsToRemove = removeTaskAndChildren(taskId);
      const removedTasks = prevTasks.filter(task => idsToRemove.includes(task.id));
      const newTasks = prevTasks.filter(task => !idsToRemove.includes(task.id));
      
      // Ajouter à l'historique avec reverseAction et forwardAction
      addAction({
        type: 'remove',
        data: { removedTasks },
        reverseAction: () => {
          setTasks(prev => [...removedTasks, ...prev]);
        },
        forwardAction: () => {
          setTasks(prev => prev.filter(task => !idsToRemove.includes(task.id)));
        }
      });
      
      return newTasks;
    });
    
    // Retirer des épinglés si nécessaire
    setPinnedTasks(prev => prev.filter(id => id !== taskId));
    console.log('Tâche supprimée:', taskId);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task) return prevTasks;

      const newTasks = prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, isCompleted: !t.isCompleted }
          : t
      );
      
      addAction({
        type: 'update',
        data: { taskId, field: 'isCompleted', value: !task.isCompleted },
        reverseAction: () => {
          setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, isCompleted: task.isCompleted } : t
          ));
        },
        forwardAction: () => {
          setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, isCompleted: !task.isCompleted } : t
          ));
        }
      });
      
      return newTasks;
    });
    console.log('Tâche completion togglee:', taskId);
  };

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

  const scheduleTask = (taskId: string, date: Date, time: string) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task) return prevTasks;

      const newTasks = prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, scheduledDate: date, scheduledTime: time }
          : t
      );
      
      addAction({
        type: 'update',
        data: { taskId, field: 'scheduled', value: { date, time } },
        reverseAction: () => {
          setTasks(prev => prev.map(t => 
            t.id === taskId 
              ? { ...t, scheduledDate: task.scheduledDate, scheduledTime: task.scheduledTime }
              : t
          ));
        },
        forwardAction: () => {
          setTasks(prev => prev.map(t => 
            t.id === taskId 
              ? { ...t, scheduledDate: date, scheduledTime: time }
              : t
          ));
        }
      });
      
      return newTasks;
    });
    console.log('Tâche planifiée:', taskId, date, time);
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

  return {
    tasks,
    mainTasks: sortedMainTasks,
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
    updateTaskDuration
  };
};
