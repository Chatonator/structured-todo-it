import { useState, useEffect } from 'react';
import { Task } from '@/types/task';

const STORAGE_KEY = 'todo-it-tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Charger les tâches depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          level: task.level ?? 0,
          isExpanded: task.isExpanded ?? true,
          isCompleted: task.isCompleted ?? false
        }));
        setTasks(tasksWithDates);
        console.log('Tâches chargées depuis localStorage:', tasksWithDates.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    }
  }, []);

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      console.log('Tâches sauvegardées:', tasks.length);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [tasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isCompleted: false
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
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
      return prevTasks.filter(task => !idsToRemove.includes(task.id));
    });
    console.log('Tâche supprimée:', taskId);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      )
    );
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

  // Obtenir les tâches principales (niveau 0)
  const mainTasks = tasks.filter(task => task.level === 0);
  
  // Calculer le temps total du projet
  const totalProjectTime = mainTasks.reduce((total, task) => total + calculateTotalTime(task), 0);

  // Statistiques de completion
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return {
    tasks,
    mainTasks,
    addTask,
    removeTask,
    reorderTasks,
    sortTasks,
    toggleTaskExpansion,
    toggleTaskCompletion,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    tasksCount: tasks.length,
    totalProjectTime,
    completedTasks,
    completionRate
  };
};
