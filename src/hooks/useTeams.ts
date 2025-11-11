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
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profiles?: {
    display_name: string | null;
  };
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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

      // Get teams where user is a member
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

      // Get team details
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
        title: 'Error',
        description: 'Failed to load teams',
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

      // Load profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const membersWithProfiles = data.map(member => ({
          ...member,
          profiles: profilesMap.get(member.user_id) || { display_name: null },
        }));

        setTeamMembers(membersWithProfiles);
      } else {
        setTeamMembers([]);
      }
      logger.info('Team members loaded', { teamId, count: data?.length });
    } catch (error) {
      logger.error('Error loading team members', { error, teamId });
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setMembersLoading(false);
    }
  };

  // Create a new team
  const createTeam = async (name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-team', {
        body: { name },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      logger.info('Team created', { teamId: data.team.id });
      
      toast({
        title: 'Success',
        description: 'Team created successfully',
      });

      await loadTeams();
      return data.team;
    } catch (error) {
      logger.error('Error creating team', { error });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Join a team with invite code
  const joinTeam = async (inviteCode: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('join-team', {
        body: { inviteCode },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      logger.info('Joined team', { teamId: data.team.id });
      
      toast({
        title: 'Success',
        description: `You joined ${data.team.name}`,
      });

      await loadTeams();
      return data.team;
    } catch (error) {
      logger.error('Error joining team', { error });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join team',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Leave a team
  const leaveTeam = async (teamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      logger.info('Left team', { teamId });
      
      toast({
        title: 'Success',
        description: 'You left the team',
      });

      if (currentTeam?.id === teamId) {
        setCurrentTeam(null);
      }

      await loadTeams();
    } catch (error) {
      logger.error('Error leaving team', { error, teamId });
      toast({
        title: 'Error',
        description: 'Failed to leave team',
        variant: 'destructive',
      });
    }
  };

  // Update member role
  const updateMemberRole = async (teamId: string, targetUserId: string, newRole: TeamRole) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: {
          action: 'update_role',
          teamId,
          targetUserId,
          newRole,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      logger.info('Member role updated', { teamId, targetUserId, newRole });
      
      toast({
        title: 'Success',
        description: 'Member role updated',
      });

      await loadTeamMembers(teamId);
    } catch (error) {
      logger.error('Error updating member role', { error, teamId, targetUserId });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  // Remove member from team
  const removeMember = async (teamId: string, targetUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('manage-team-member', {
        body: {
          action: 'remove_member',
          teamId,
          targetUserId,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      logger.info('Member removed', { teamId, targetUserId });
      
      toast({
        title: 'Success',
        description: 'Member removed from team',
      });

      await loadTeamMembers(teamId);
    } catch (error) {
      logger.error('Error removing member', { error, teamId, targetUserId });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadTeams();

    // Subscribe to team changes
    const channel = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        () => {
          loadTeams();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    loading,
    membersLoading,
    createTeam,
    joinTeam,
    leaveTeam,
    updateMemberRole,
    removeMember,
    refreshTeams: loadTeams,
    refreshMembers: (teamId: string) => loadTeamMembers(teamId),
  };
};
