import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const useTasksDatabase = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load tasks from database
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTasks([]);
      setPinnedTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        throw tasksError;
      }

      // Convert database format to app format
      const formattedTasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        name: task.name,
        category: task.category as Task['category'],
        subCategory: task.subCategory as Task['subCategory'],
        context: task.context as Task['context'],
        estimatedTime: task.estimatedTime,
        duration: task.duration || undefined,
        level: task.level as Task['level'],
        parentId: task.parentId || undefined,
        isCompleted: task.isCompleted,
        isExpanded: task.isExpanded,
        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
        startTime: task.startTime ? new Date(task.startTime) : undefined,
        scheduledTime: task.scheduledTime || undefined,
        isRecurring: task.isRecurring || false,
        recurrenceInterval: task.recurrenceInterval as Task['recurrenceInterval'],
        lastCompletedAt: task.lastCompletedAt ? new Date(task.lastCompletedAt) : undefined,
        createdAt: new Date(task.created_at),
      }));

      setTasks(formattedTasks);

      // Load pinned tasks from user profile or a separate table if needed
      // For now, we'll store pinned tasks in localStorage as a fallback
      const storedPinned = localStorage.getItem(`pinnedTasks_${user.id}`);
      if (storedPinned) {
        setPinnedTasks(JSON.parse(storedPinned));
      } else {
        setPinnedTasks([]);
      }

      logger.info('Tasks loaded successfully', { taskCount: formattedTasks.length });
    } catch (error: any) {
      logger.error('Failed to load tasks', { error: error.message });
      setError('Failed to load tasks. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load tasks. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, toast]);

  // Save task to database
  const saveTask = useCallback(async (task: Task): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      const taskData = {
        id: task.id,
        name: task.name,
        category: task.category,
        subCategory: task.subCategory,
        context: task.context,
        estimatedTime: task.estimatedTime,
        duration: task.duration,
        level: task.level,
        parentId: task.parentId,
        isCompleted: task.isCompleted,
        isExpanded: task.isExpanded,
        scheduledDate: task.scheduledDate?.toISOString().split('T')[0],
        startTime: task.startTime?.toISOString(),
        scheduledTime: task.scheduledTime,
        isRecurring: task.isRecurring || false,
        recurrenceInterval: task.recurrenceInterval,
        lastCompletedAt: task.lastCompletedAt?.toISOString(),
        user_id: user.id,
      };

      const { error } = await supabase
        .from('tasks')
        .upsert(taskData, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      logger.debug('Task saved successfully', { taskId: task.id });
      return true;
    } catch (error: any) {
      logger.error('Failed to save task', { error: error.message, taskId: task.id });
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isAuthenticated, user, toast]);

  // Update tasks in database
  const updateTasks = useCallback(async (newTasks: Task[]): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      // Save all tasks
      const savePromises = newTasks.map(task => saveTask(task));
      const results = await Promise.all(savePromises);
      
      // Check if all saves were successful
      const allSuccessful = results.every(result => result);
      
      if (allSuccessful) {
        setTasks(newTasks);
        return true;
      } else {
        throw new Error('Some tasks failed to save');
      }
    } catch (error: any) {
      logger.error('Failed to update tasks', { error: error.message });
      return false;
    }
  }, [isAuthenticated, user, saveTask]);

  // Delete task from database (robuste avec RLS)
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      console.error('🔐 Suppression impossible - utilisateur non authentifié');
      return false;
    }

    console.log('🗑️ DB: Tentative de suppression pour taskId:', taskId);
    console.log('🔐 User ID actuel:', user.id);

    // DIAGNOSTIC: Vérifier à qui appartient la tâche
    try {
      const { data: taskOwner } = await supabase
        .from('tasks')
        .select('user_id, name')
        .eq('id', taskId)
        .single();
      
      console.log('📋 Tâche à supprimer:', taskOwner);
      console.log(`🔍 MATCH user_id ? ${user.id} === ${taskOwner?.user_id} = ${user.id === taskOwner?.user_id}`);
      
      if (taskOwner?.user_id !== user.id) {
        console.error('❌ PROBLÈME IDENTIFIÉ: User ID mismatch !');
        toast({
          title: '🚨 Problème d\'authentification détecté',
          description: `User connecté: ${user.id.slice(0,8)}... vs Tâche: ${taskOwner?.user_id?.slice(0,8)}...`,
          variant: 'destructive',
          duration: 8000,
        });
      }
    } catch (err) {
      console.error('❌ Impossible de vérifier le propriétaire de la tâche:', err);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select(); // renvoie les lignes supprimées

      console.log('🗑️ DB: Réponse Supabase:', { data, error });

      if (error) {
        console.error('🗑️ DB: Erreur Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('🗑️ DB: Aucune ligne supprimée - RLS/permission problem');
        // Aucune ligne supprimée ⇒ RLS/permissions/données incohérentes
        throw new Error('No task was deleted (RLS/permission mismatch).');
      }

      console.log('✅ DB: Suppression réussie, lignes supprimées:', data.length);
      // Succès : purge du state local
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      logger.debug('Task deleted', { taskId });
      return true;
    } catch (err: any) {
      console.error('❌ DB: Échec de suppression:', err);
      logger.error('Delete failed', { taskId, error: err?.message });
      
      // Toast d'erreur plus visible
      toast({
        title: '❌ Suppression échouée',
        description: `Erreur: ${err?.message || 'Vérifiez vos permissions'}`,
        variant: 'destructive',
        duration: 5000, // 5 secondes
      });
      return false;
    }
  }, [isAuthenticated, user, toast]);

  // Complete task with recurring logic
  const completeTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      return false;
    }

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return false;

      const updates: any = { isCompleted: true };
      
      // If it's a recurring task, record when it was completed
      if (task.isRecurring) {
        updates.lastCompletedAt = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, isCompleted: true, lastCompletedAt: task.isRecurring ? new Date() : t.lastCompletedAt }
          : t
      ));

      logger.debug('Task completed successfully', { taskId, isRecurring: task.isRecurring });
      return true;
    } catch (error: any) {
      logger.error('Failed to complete task', { error: error.message, taskId });
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [isAuthenticated, user, tasks, toast]);

  // Save pinned tasks
  const savePinnedTasks = useCallback((newPinnedTasks: string[]) => {
    if (!user) return;
    
    setPinnedTasks(newPinnedTasks);
    localStorage.setItem(`pinnedTasks_${user.id}`, JSON.stringify(newPinnedTasks));
  }, [user]);

  // Load tasks when auth state changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    pinnedTasks,
    loading,
    error,
    setTasks: updateTasks,
    setPinnedTasks: savePinnedTasks,
    saveTask,
    deleteTask,
    completeTask,
    reloadTasks: loadTasks,
  };
};