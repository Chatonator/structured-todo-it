import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeamContext } from '@/contexts/TeamContext';
import { mapDbRowToTeamTask } from '@/utils/teamTaskMapper';
import { Task } from '@/types/task';
import { logger } from '@/lib/logger';

/**
 * Hook qui charge les tâches de TOUTES les équipes de l'utilisateur.
 * Utilisé pour le filtre "Toutes" afin d'inclure les tâches d'équipe.
 */
export const useAllTeamTasks = () => {
  const { teams } = useTeamContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const teamIds = useMemo(() => teams.map(t => t.id), [teams]);

  useEffect(() => {
    if (teamIds.length === 0) {
      setTasks([]);
      return;
    }

    const loadAllTeamTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('team_tasks')
          .select('*')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map(row => ({
          ...mapDbRowToTeamTask(row),
          _isTeamTask: true,
          _teamId: row.team_id,
        })) as unknown as Task[];

        setTasks(mapped);
      } catch (error) {
        logger.error('Error loading all team tasks', { error });
      } finally {
        setLoading(false);
      }
    };

    loadAllTeamTasks();
  }, [teamIds]);

  return { allTeamTasks: tasks, allTeamTasksLoading: loading };
};
