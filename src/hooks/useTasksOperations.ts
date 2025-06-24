
import { Task } from '@/types/task';
import { sanitizeTask } from '@/utils/taskValidation';
import { useActionHistory } from './useActionHistory';

/**
 * Hook pour les opérations sur les tâches (CRUD)
 */
export const useTasksOperations = (
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setPinnedTasks: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const { addAction } = useActionHistory();

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

  return {
    addTask,
    removeTask,
    toggleTaskCompletion,
    scheduleTask
  };
};
