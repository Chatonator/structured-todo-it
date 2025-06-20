
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
        // Convertir les dates string en objets Date et ajouter les nouveaux champs
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

  // Ajouter une nouvelle tâche
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

  // Supprimer une tâche et toutes ses sous-tâches
  const removeTask = (taskId: string) => {
    setTasks(prevTasks => {
      const taskToRemove = prevTasks.find(t => t.id === taskId);
      if (!taskToRemove) return prevTasks;

      // Supprimer la tâche et toutes ses sous-tâches récursivement
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

  // Basculer l'état de completion d'une tâche
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      )
    );
  };

  // Basculer l'état d'expansion d'une tâche
  const toggleTaskExpansion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isExpanded: !task.isExpanded }
          : task
      )
    );
  };

  // Obtenir les sous-tâches d'une tâche donnée
  const getSubTasks = (parentId: string) => {
    return tasks.filter(task => task.parentId === parentId);
  };

  // Calculer le temps total d'une tâche (incluant ses sous-tâches)
  const calculateTotalTime = (task: Task): number => {
    const subTasks = getSubTasks(task.id);
    if (subTasks.length === 0) {
      return task.estimatedTime;
    }
    return subTasks.reduce((total, subTask) => total + calculateTotalTime(subTask), 0);
  };

  // Vérifier si une tâche peut avoir des sous-tâches (max 3 par niveau)
  const canHaveSubTasks = (task: Task) => {
    if (task.level >= 2) return false; // Pas de sous-sous-sous-tâches
    const subTasks = getSubTasks(task.id);
    return subTasks.length < 3;
  };

  // Réorganiser les tâches (glisser-déposer)
  const reorderTasks = (startIndex: number, endIndex: number) => {
    setTasks(prevTasks => {
      const result = Array.from(prevTasks);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      console.log('Tâches réorganisées');
      return result;
    });
  };

  // Trier les tâches
  const sortTasks = (sortBy: 'name' | 'duration' | 'category') => {
    setTasks(prevTasks => {
      const sorted = [...prevTasks].sort((a, b) => {
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
      return sorted;
    });
  };

  // Filtrer les tâches par catégorie
  const filterTasksByCategory = (category: string) => {
    if (category === 'all') return tasks;
    return tasks.filter(task => task.category === category);
  };

  // Rechercher des tâches
  const searchTasks = (query: string) => {
    if (!query.trim()) return tasks;
    return tasks.filter(task => 
      task.name.toLowerCase().includes(query.toLowerCase())
    );
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
    filterTasksByCategory,
    searchTasks,
    tasksCount: tasks.length,
    totalProjectTime,
    completedTasks,
    completionRate
  };
};
