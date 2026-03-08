import { useCallback, useMemo } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, type TeamPermission, type PermissionsConfig } from '@/lib/teamPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TeamRole } from '@/hooks/useTeams';

export const useTeamPermissions = () => {
  const { currentTeam, teamMembers, refreshTeams } = useTeamContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentMember = useMemo(
    () => teamMembers.find(m => m.user_id === user?.id),
    [teamMembers, user?.id]
  );

  const myRole: TeamRole = currentMember?.role ?? 'member';

  const permissionsConfig: PermissionsConfig = useMemo(
    () => (currentTeam as any)?.permissions_config || {},
    [currentTeam]
  );

  const can = useCallback(
    (permission: TeamPermission): boolean => hasPermission(myRole, permission, permissionsConfig),
    [myRole, permissionsConfig]
  );

  const updatePermissionsConfig = useCallback(async (newConfig: PermissionsConfig) => {
    if (!currentTeam) return;
    try {
      const { error } = await supabase
        .from('teams')
        .update({ permissions_config: newConfig } as any)
        .eq('id', currentTeam.id);
      if (error) throw error;
      await refreshTeams();
      toast({ title: 'Droits mis à jour' });
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour les droits', variant: 'destructive' });
    }
  }, [currentTeam, refreshTeams, toast]);

  return { can, myRole, permissionsConfig, updatePermissionsConfig };
};
