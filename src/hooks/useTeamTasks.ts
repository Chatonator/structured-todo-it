import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Task } from '@/types/task';

export interface TeamTask extends Omit<Task, 'user_id'> {
  team_id: string;
  assigned_to: string | null;
  created_by: string;
}

export const useTeamTasks = (teamId: string | null) => {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load team tasks
  const loadTasks = async () => {
    if (!teamId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_tasks')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database columns to Task interface
      const mappedTasks = (data || []).map(task => ({
        ...task,
        estimatedTime: task.estimatedtime,
        isCompleted: task.iscompleted,
        isExpanded: task.isexpanded,
        isRecurring: task.isrecurring,
        parentId: task.parentid,
        scheduledDate: task.scheduleddate ? new Date(task.scheduleddate) : undefined,
        startTime: task.starttime ? new Date(task.starttime) : undefined,
        lastCompletedAt: task.lastcompletedat ? new Date(task.lastcompletedat) : undefined,
        recurrenceInterval: task.recurrenceinterval,
        scheduledTime: task.scheduledtime,
        subCategory: task.subcategory,
        createdAt: new Date(task.created_at),
      })) as TeamTask[];

      setTasks(mappedTasks);
      logger.info('Team tasks loaded', { teamId, count: data?.length });
    } catch (error) {
      logger.error('Error loading team tasks', { error, teamId });
      toast({
        title: 'Error',
        description: 'Failed to load team tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new team task
  const createTask = async (taskData: Partial<TeamTask>) => {
    if (!teamId) {
      toast({
        title: 'Error',
        description: 'No team selected',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Map Task interface to database columns (obsolete temporal fields removed)
      const newTask = {
        team_id: teamId,
        created_by: user.id,
        name: taskData.name || '',
        category: taskData.category || '',
        subcategory: taskData.subCategory || null,
        context: taskData.context || '',
        estimatedtime: taskData.estimatedTime ?? 0,
        duration: taskData.duration ?? null,
        iscompleted: taskData.isCompleted ?? false,
        isexpanded: taskData.isExpanded ?? true,
        parentid: taskData.parentId ?? null,
        level: taskData.level ?? 0,
        assigned_to: taskData.assigned_to ?? null,
      };

      const { data, error } = await supabase
        .from('team_tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      logger.info('Team task created', { teamId, taskId: data.id });
      
      toast({
        title: 'Success',
        description: 'Task created',
      });

      await loadTasks();
      return data;
    } catch (error) {
      logger.error('Error creating team task', { error, teamId });
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update a team task
  const updateTask = async (taskId: string, updates: Partial<TeamTask>) => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      logger.info('Team task updated', { taskId, teamId });
      
      await loadTasks();
    } catch (error) {
      logger.error('Error updating team task', { error, taskId, teamId });
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  // Delete a team task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      logger.info('Team task deleted', { taskId, teamId });
      
      toast({
        title: 'Success',
        description: 'Task deleted',
      });

      await loadTasks();
    } catch (error) {
      logger.error('Error deleting team task', { error, taskId, teamId });
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  // Toggle task completion
  const toggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const updates: any = {
        iscompleted: isCompleted,
      };

      if (isCompleted) {
        updates.lastcompletedat = new Date().toISOString();
      }

      const { error } = await supabase
        .from('team_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      logger.info('Team task completion toggled', { taskId, isCompleted, teamId });
      
      await loadTasks();
    } catch (error) {
      logger.error('Error toggling team task completion', { error, taskId, teamId });
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  // Assign task to a team member
  const assignTask = async (taskId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId);

      if (error) throw error;

      logger.info('Team task assigned', { taskId, userId, teamId });
      
      toast({
        title: 'Success',
        description: userId ? 'Task assigned' : 'Task unassigned',
      });

      await loadTasks();
    } catch (error) {
      logger.error('Error assigning team task', { error, taskId, teamId });
      toast({
        title: 'Error',
        description: 'Failed to assign task',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadTasks();

    if (!teamId) return;

    // Subscribe to team task changes
    const channel = supabase
      .channel(`team-tasks-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_tasks',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    assignTask,
    refreshTasks: loadTasks,
  };
};
