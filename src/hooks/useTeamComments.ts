import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface TeamComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const useTeamComments = (teamId: string | null) => {
  const [comments, setComments] = useState<TeamComment[]>([]);
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load comment counts for all team tasks
  const loadCommentCounts = useCallback(async () => {
    if (!teamId) { setCommentCounts(new Map()); return; }
    try {
      const { data: tasks } = await supabase
        .from('team_tasks')
        .select('id')
        .eq('team_id', teamId);
      if (!tasks?.length) { setCommentCounts(new Map()); return; }

      const taskIds = tasks.map(t => t.id);
      const { data, error } = await supabase
        .from('team_task_comments')
        .select('task_id')
        .in('task_id', taskIds);
      if (error) throw error;

      const counts = new Map<string, number>();
      (data || []).forEach(c => {
        counts.set(c.task_id, (counts.get(c.task_id) || 0) + 1);
      });
      setCommentCounts(counts);
    } catch (e) {
      logger.error('Error loading comment counts', { error: e });
    }
  }, [teamId]);

  useEffect(() => { loadCommentCounts(); }, [loadCommentCounts]);

  // Load comments for a specific task
  const loadTaskComments = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments((data || []) as TeamComment[]);
    } catch (e) {
      logger.error('Error loading comments', { error: e });
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(async (taskId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('team_task_comments')
        .insert({ task_id: taskId, user_id: user.id, content });
      if (error) throw error;
      await Promise.all([loadTaskComments(taskId), loadCommentCounts()]);
      return true;
    } catch (e) {
      logger.error('Error adding comment', { error: e });
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter le commentaire', variant: 'destructive' });
      return false;
    }
  }, [loadTaskComments, loadCommentCounts, toast]);

  const deleteComment = useCallback(async (commentId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('team_task_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      await Promise.all([loadTaskComments(taskId), loadCommentCounts()]);
    } catch (e) {
      logger.error('Error deleting comment', { error: e });
      toast({ title: 'Erreur', description: 'Impossible de supprimer le commentaire', variant: 'destructive' });
    }
  }, [loadTaskComments, loadCommentCounts, toast]);

  const getCommentCount = useCallback((taskId: string) => {
    return commentCounts.get(taskId) || 0;
  }, [commentCounts]);

  // Realtime subscription for comments
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`team-comments-${teamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_task_comments',
      }, () => {
        loadCommentCounts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teamId, loadCommentCounts]);

  return {
    comments, loading,
    loadTaskComments, addComment, deleteComment,
    getCommentCount,
  };
};
