import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface Watcher {
  id: string;
  task_id: string;
  user_id: string;
}

export const useTaskWatchers = (teamId: string | null, currentUserId: string | null) => {
  const [watchers, setWatchers] = useState<Watcher[]>([]);

  const loadWatchers = useCallback(async () => {
    if (!teamId || !currentUserId) return;
    try {
      // Load watchers for all tasks in this team by joining through team_tasks
      const { data, error } = await supabase
        .from('team_task_watchers' as any)
        .select('id, task_id, user_id')
        .eq('user_id', currentUserId);

      if (error) throw error;
      setWatchers((data || []) as unknown as Watcher[]);
    } catch (err) {
      logger.error('Error loading watchers', { err });
    }
  }, [teamId, currentUserId]);

  useEffect(() => {
    loadWatchers();
  }, [loadWatchers]);

  const isWatching = useCallback((taskId: string) => {
    return watchers.some(w => w.task_id === taskId);
  }, [watchers]);

  const watchTask = useCallback(async (taskId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('team_task_watchers' as any)
        .insert({ task_id: taskId, user_id: currentUserId });
      if (error) throw error;
      await loadWatchers();
    } catch (err) {
      logger.error('Error watching task', { err });
    }
  }, [currentUserId, loadWatchers]);

  const unwatchTask = useCallback(async (taskId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('team_task_watchers' as any)
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', currentUserId);
      if (error) throw error;
      await loadWatchers();
    } catch (err) {
      logger.error('Error unwatching task', { err });
    }
  }, [currentUserId, loadWatchers]);

  const toggleWatch = useCallback(async (taskId: string) => {
    if (isWatching(taskId)) {
      await unwatchTask(taskId);
    } else {
      await watchTask(taskId);
    }
  }, [isWatching, watchTask, unwatchTask]);

  return { isWatching, toggleWatch, watchTask, unwatchTask };
};
