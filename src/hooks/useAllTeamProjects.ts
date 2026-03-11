import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeamContext } from '@/contexts/TeamContext';
import { logger } from '@/lib/logger';

interface LightweightTeamProject {
  id: string;
  teamId: string;
  name: string;
}

interface TeamProjectRow {
  id: string;
  team_id: string;
  name: string;
}

/**
 * Charge les projets de toutes les equipes de l'utilisateur.
 * Sert a resoudre les noms de projet dans les vues transverses.
 */
export const useAllTeamProjects = (enabled = true) => {
  const { teams } = useTeamContext();
  const [projects, setProjects] = useState<LightweightTeamProject[]>([]);
  const [loading, setLoading] = useState(false);

  const teamIds = useMemo(() => teams.map((team) => team.id), [teams]);

  useEffect(() => {
    if (!enabled || teamIds.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const loadAllTeamProjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('team_projects')
          .select('id, team_id, name')
          .in('team_id', teamIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProjects(
          ((data || []) as TeamProjectRow[]).map((row) => ({
            id: row.id,
            teamId: row.team_id,
            name: row.name,
          }))
        );
      } catch (error) {
        logger.error('Error loading all team projects', { error });
      } finally {
        setLoading(false);
      }
    };

    loadAllTeamProjects();
  }, [enabled, teamIds]);

  return {
    allTeamProjects: projects,
    allTeamProjectsLoading: loading,
  };
};

