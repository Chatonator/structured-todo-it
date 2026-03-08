import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface TeamLabel {
  id: string;
  team_id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface TaskLabelAssignment {
  task_id: string;
  label_id: string;
}

export const useTeamLabels = (teamId: string | null) => {
  const [labels, setLabels] = useState<TeamLabel[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabelAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadLabels = useCallback(async () => {
    if (!teamId) { setLabels([]); return; }
    try {
      const { data, error } = await supabase
        .from('team_labels')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setLabels((data || []) as TeamLabel[]);
    } catch (e) {
      logger.error('Error loading team labels', { error: e });
    }
  }, [teamId]);

  const loadTaskLabels = useCallback(async () => {
    if (!teamId) { setTaskLabels([]); return; }
    try {
      // Get all task IDs for this team first, then load their labels
      const { data: tasks } = await supabase
        .from('team_tasks')
        .select('id')
        .eq('team_id', teamId);
      if (!tasks?.length) { setTaskLabels([]); return; }

      const taskIds = tasks.map(t => t.id);
      const { data, error } = await supabase
        .from('team_task_labels')
        .select('task_id, label_id')
        .in('task_id', taskIds);
      if (error) throw error;
      setTaskLabels((data || []) as TaskLabelAssignment[]);
    } catch (e) {
      logger.error('Error loading task labels', { error: e });
    }
  }, [teamId]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadLabels(), loadTaskLabels()]);
    setLoading(false);
  }, [loadLabels, loadTaskLabels]);

  useEffect(() => { load(); }, [load]);

  const createLabel = useCallback(async (name: string, color: string) => {
    if (!teamId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('team_labels')
        .insert({ team_id: teamId, name, color, created_by: user.id });
      if (error) throw error;
      await loadLabels();
      toast({ title: 'Label créé' });
    } catch (e) {
      logger.error('Error creating label', { error: e });
      toast({ title: 'Erreur', description: 'Impossible de créer le label', variant: 'destructive' });
    }
  }, [teamId, loadLabels, toast]);

  const updateLabel = useCallback(async (labelId: string, updates: { name?: string; color?: string }) => {
    try {
      const { error } = await supabase
        .from('team_labels')
        .update(updates)
        .eq('id', labelId);
      if (error) throw error;
      await loadLabels();
    } catch (e) {
      logger.error('Error updating label', { error: e });
      toast({ title: 'Erreur', description: 'Impossible de modifier le label', variant: 'destructive' });
    }
  }, [loadLabels, toast]);

  const deleteLabel = useCallback(async (labelId: string) => {
    try {
      const { error } = await supabase
        .from('team_labels')
        .delete()
        .eq('id', labelId);
      if (error) throw error;
      await load();
      toast({ title: 'Label supprimé' });
    } catch (e) {
      logger.error('Error deleting label', { error: e });
      toast({ title: 'Erreur', description: 'Impossible de supprimer le label', variant: 'destructive' });
    }
  }, [load, toast]);

  const toggleTaskLabel = useCallback(async (taskId: string, labelId: string) => {
    const exists = taskLabels.some(tl => tl.task_id === taskId && tl.label_id === labelId);
    try {
      if (exists) {
        const { error } = await supabase
          .from('team_task_labels')
          .delete()
          .eq('task_id', taskId)
          .eq('label_id', labelId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_task_labels')
          .insert({ task_id: taskId, label_id: labelId });
        if (error) throw error;
      }
      await loadTaskLabels();
    } catch (e) {
      logger.error('Error toggling task label', { error: e });
      toast({ title: 'Erreur', description: 'Impossible de modifier les labels', variant: 'destructive' });
    }
  }, [taskLabels, loadTaskLabels, toast]);

  const getTaskLabels = useCallback((taskId: string): TeamLabel[] => {
    const labelIds = taskLabels.filter(tl => tl.task_id === taskId).map(tl => tl.label_id);
    return labels.filter(l => labelIds.includes(l.id));
  }, [taskLabels, labels]);

  const hasTaskLabel = useCallback((taskId: string, labelId: string): boolean => {
    return taskLabels.some(tl => tl.task_id === taskId && tl.label_id === labelId);
  }, [taskLabels]);

  return {
    labels, loading,
    createLabel, updateLabel, deleteLabel,
    toggleTaskLabel, getTaskLabels, hasTaskLabel,
    refreshLabels: load,
  };
};
