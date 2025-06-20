
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
        // Convertir les dates string en objets Date
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
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
      createdAt: new Date()
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
    console.log('Nouvelle tâche ajoutée:', newTask);
    return newTask;
  };

  // Supprimer une tâche (pour évolution future)
  const removeTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    console.log('Tâche supprimée:', taskId);
  };

  return {
    tasks,
    addTask,
    removeTask,
    tasksCount: tasks.length
  };
};
