
import { Task } from '@/types/task';
import { sanitizeTask } from '@/utils/taskValidation';
import { useActionHistory } from './useActionHistory';

/**
 * Hook pour les opérations sur les tâches (CRUD)
 */
export const useTasksOperations = (
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setPinnedTasks: React.Dispatch<React.SetStateAction<string[]>>,
  saveTask: (task: Task) => Promise<boolean>,
  dbOperations: { deleteTask: (taskId: string) => Promise<boolean> }
) => {
  const { addAction } = useActionHistory();

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
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
    
    // Save to database
    await saveTask(newTask);
    
    console.log('Nouvelle tâche ajoutée:', newTask);
    return newTask;
  };

  const removeTask = async (taskId: string) => {
    console.log('🗑️ Tentative de suppression de la tâche:', taskId);
    
    const taskToRemove = tasks.find(t => t.id === taskId);
    if (!taskToRemove) {
      console.warn('❌ Tâche introuvable pour suppression:', taskId);
      return;
    }

    const removeTaskAndChildren = (id: string): string[] => {
      const children = tasks.filter(t => t.parentId === id);
      const childrenIds = children.flatMap(child => removeTaskAndChildren(child.id));
      return [id, ...childrenIds];
    };

    const idsToRemove = removeTaskAndChildren(taskId);
    const removedTasks = tasks.filter(task => idsToRemove.includes(task.id));
    
    console.log('🗑️ IDs à supprimer:', idsToRemove);
    console.log('🗑️ Tâches à supprimer:', removedTasks.map(t => t.name));
    
    // Delete from database first
    try {
      console.log('🗑️ Suppression de la base de données...');
      const deletePromises = idsToRemove.map(async (id) => {
        console.log('🗑️ Suppression DB pour ID:', id);
        const result = await dbOperations.deleteTask(id);
        console.log('🗑️ Résultat suppression DB pour', id, ':', result);
        return result;
      });
      
      const results = await Promise.all(deletePromises);
      console.log('🗑️ Résultats de toutes les suppressions DB:', results);
      
      // Check if all deletions were successful
      const allSuccessful = results.every(result => result === true);
      if (!allSuccessful) {
        console.error('❌ Certaines suppressions de base de données ont échoué:', results);
        throw new Error('Database deletion failed for some tasks');
      }
      
      console.log('✅ Suppression de la base de données réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la base de données:', error);
      // Don't update local state if database deletion failed
      return;
    }
    
    // Only update local state if database deletion was successful
    setTasks(prevTasks => {
      const newTasks = prevTasks.filter(task => !idsToRemove.includes(task.id));
      console.log('🗑️ État local mis à jour, nouvelles tâches:', newTasks.length);
      
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
    
    setPinnedTasks(prev => {
      const newPinned = prev.filter(id => !idsToRemove.includes(id));
      console.log('🗑️ Tâches épinglées mises à jour:', newPinned);
      return newPinned;
    });
    
    console.log('✅ Tâche supprimée avec succès:', taskId);
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

  const scheduleTask = async (taskId: string, date: Date, time: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, scheduledDate: date, scheduledTime: time };
    
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(t => 
        t.id === taskId ? updatedTask : t
      );
      
      addAction({
        type: 'update',
        data: { taskId, field: 'scheduled', value: { date, time } },
        reverseAction: () => {
          // La planification est gérée via time_events
        },
        forwardAction: () => {
          // La planification est gérée via time_events
        }
      });
      
      return newTasks;
    });
    
    // Save to database
    await saveTask(updatedTask);
    
    console.log('Tâche planifiée:', taskId, date, time);
  };

  return {
    addTask,
    removeTask,
    toggleTaskCompletion,
    scheduleTask
  };
};
