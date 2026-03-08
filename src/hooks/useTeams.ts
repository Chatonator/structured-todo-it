import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  invite_code: string;
  permissions_config?: Record<string, any>;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  team_name?: string;
  inviter_name?: string;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const { toast } = useToast();

  // Load user's teams
  const loadTeams = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTeams([]);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setTeams([]);
        return;
      }

      const teamIds = memberData.map(m => m.team_id);

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      setTeams(teamsData || []);
      logger.info('Teams loaded', { count: teamsData?.length });
    } catch (error) {
      logger.error('Error loading teams', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les équipes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load team members
  const loadTeamMembers = async (teamId: string) => {
    try {
      setMembersLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const membersWithProfiles = data.map(member => ({
          ...member,
          profiles: profilesMap.get(member.user_id) || { display_name: null, email: null },
        }));

        setTeamMembers(membersWithProfiles);
      } else {
        setTeamMembers([]);
      }
      logger.info('Team members loaded', { teamId, count: data?.length });
    } catch (error) {
      logger.error('Error loading team members', { error, teamId });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les membres',
        variant: 'destructive',
      });
    } finally {
      setMembersLoading(false);
    }
  };

  // Load pending invitations for the current user
  const loadPendingInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Enrich with team names and inviter names
        const teamIds = [...new Set(data.map(i => i.team_id))];
        const inviterIds = [...new Set(data.map(i => i.invited_by))];

        const [teamsRes, profilesRes] = await Promise.all([
          supabase.from('teams').select('id, name').in('id', teamIds),
          supabase.from('profiles').select('user_id, display_name').in('user_id', inviterIds),
        ]);

        const teamsMap = new Map((teamsRes.data || []).map(t => [t.id, t.name]));
        const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.display_name]));

        const enriched: TeamInvitation[] = data.map(inv => ({
          ...inv,
          status: inv.status as 'pending' | 'accepted' | 'declined',
          team_name: teamsMap.get(inv.team_id) || 'Équipe inconnue',
          inviter_name: profilesMap.get(inv.invited_by) || 'Quelqu\'un',
        }));

        setPendingInvitations(enriched);
      } else {
        setPendingInvitations([]);
      }
    } catch (error) {
      logger.error('Error loading invitations', { error });
    }
  };

  // Invite by email
  const inviteByEmail = async (teamId: string, email: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('invite-to-team', {
        body: { teamId, email },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Invitation envoyée !',
        description: `Une invitation a été envoyée à ${email}`,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d\'envoyer l\'invitation';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Respond to invitation
  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const { data, error } = await supabase.functions.invoke('respond-to-invitation', {
        body: { invitationId, accept },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: accept ? 'Invitation acceptée !' : 'Invitation refusée',
        description: accept ? 'Vous avez rejoint l\'équipe' : 'L\'invitation a été déclinée',
      });

      // Refresh data
      await Promise.all([loadTeams(), loadPendingInvitations()]);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la réponse';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Create a new team
  const createTeam = async (name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('create-team', {
        body: { name },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      logger.info('Team created', { teamId: data.team.id });
      toast({ title: 'Équipe créée !', description: `L'équipe "${name}" a été créée avec succès` });

      await loadTeams();
      return data.team;
    } catch (error) {
      logger.error('Error creating team', { error });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer l\'équipe',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Join a team with invite code
  const joinTeam = async (inviteCode: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('join-team', {
        body: { inviteCode },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      logger.info('Joined team', { teamId: data.team.id });
      toast({ title: 'Bienvenue !', description: `Vous avez rejoint ${data.team.name}` });

      await loadTeams();
      return data.team;
    } catch (error) {
      logger.error('Error joining team', { error });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de rejoindre l\'équipe',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Leave a team
  const leaveTeam = async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      logger.info('Left team', { teamId });
      toast({ title: 'Équipe quittée', description: 'Vous avez quitté l\'équipe' });

      if (currentTeam?.id === teamId) setCurrentTeam(null);
      await loadTeams();
    } catch (error) {
      logger.error('Error leaving team', { error, teamId });
      toast({ title: 'Erreur', description: 'Impossible de quitter l\'équipe', variant: 'destructive' });
    }
  };

  // Update member role
  const updateMemberRole = async (teamId: string, targetUserId: string, newRole: TeamRole) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: { action: 'update_role', teamId, targetUserId, newRole },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      logger.info('Member role updated', { teamId, targetUserId, newRole });
      toast({ title: 'Rôle mis à jour', description: 'Le rôle du membre a été modifié' });

      await loadTeamMembers(teamId);
    } catch (error) {
      logger.error('Error updating member role', { error, teamId, targetUserId });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de modifier le rôle',
        variant: 'destructive',
      });
    }
  };

  // Remove member from team
  const removeMember = async (teamId: string, targetUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: { action: 'remove_member', teamId, targetUserId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      logger.info('Member removed', { teamId, targetUserId });
      toast({ title: 'Membre retiré', description: 'Le membre a été retiré de l\'équipe' });

      await loadTeamMembers(teamId);
    } catch (error) {
      logger.error('Error removing member', { error, teamId, targetUserId });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de retirer le membre',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadTeams();
    loadPendingInvitations();

    const channel = supabase
      .channel('teams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => loadTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => loadTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, () => loadPendingInvitations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);


  // Load members when current team changes
  useEffect(() => {
    if (currentTeam) {
      loadTeamMembers(currentTeam.id);
    } else {
      setTeamMembers([]);
    }
  }, [currentTeam?.id]);

  return {
    teams,
    currentTeam,
    setCurrentTeam,
    teamMembers,
    pendingInvitations,
    loading,
    membersLoading,
    createTeam,
    joinTeam,
    leaveTeam,
    updateMemberRole,
    removeMember,
    inviteByEmail,
    respondToInvitation,
    refreshTeams: loadTeams,
    refreshMembers: (teamId: string) => loadTeamMembers(teamId),
    refreshInvitations: loadPendingInvitations,
  };
};
