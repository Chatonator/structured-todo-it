
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { useActionHistory } from './useActionHistory';

const STORAGE_KEY = 'todo-it-tasks';
const PINNED_TASKS_KEY = 'todo-it-pinned-tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);
  const { addAction, undo, redo, canUndo, canRedo } = useActionHistory();

  // Charger les tâches depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      const savedPinnedTasks = localStorage.getItem(PINNED_TASKS_KEY);
      
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          level: task.level ?? 0,
          isExpanded: task.isExpanded ?? true,
          isCompleted: task.isCompleted ?? false,
          context: task.context || 'Perso' // Valeur par défaut
        }));
        setTasks(tasksWithDates);
        console.log('Tâches chargées depuis localStorage:', tasksWithDates.length);
      }
      
      if (savedPinnedTasks) {
        setPinnedTasks(JSON.parse(savedPinnedTasks));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    }
  }, []);

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(PINNED_TASKS_KEY, JSON.stringify(pinnedTasks));
      console.log('Tâches sauvegardées:', tasks.length);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [tasks, pinnedTasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isCompleted: false
    };
    
    setTasks(prevTasks => {
      const newTasks = [newTask, ...prevTasks];
      
      // Ajouter à l'historique
      addAction({
        type: 'add',
        data: newTask,
        reverseAction: () => removeTask(newTask.id)
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
      const newTasks = prevTasks.filter(task => !idsToRemove.includes(task.id));
      
      // Ajouter à l'historique
      addAction({
        type: 'remove',
        data: { removedTasks: prevTasks.filter(task => idsToRemove.includes(task.id)) },
        reverseAction: () => {
          // Logique de restauration simplifiée
          console.log('Action suppression annulée');
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
      const newTasks = prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      );
      
      const task = prevTasks.find(t => t.id === taskId);
      if (task) {
        addAction({
          type: 'update',
          data: { taskId, field: 'isCompleted', value: !task.isCompleted },
          reverseAction: () => toggleTaskCompletion(taskId)
        });
      }
      
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
    canRedo
  };
};
