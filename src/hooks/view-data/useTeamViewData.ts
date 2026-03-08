import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { ViewState } from '@/components/layout/view/ViewLayout';
import type { TeamRole } from '@/hooks/useTeams';

export const useTeamViewData = () => {
  const { currentTeam, teamMembers, updateMemberRole, removeMember, leaveTeam, teams, setCurrentTeam } = useTeamContext();
  const { setCurrentView, setIsModalOpen } = useApp();
  const { user } = useAuth();
  const { tasks, loading: tasksLoading } = useTeamTasks(currentTeam?.id ?? null);
  const { projects, loading: projectsLoading } = useTeamProjects(currentTeam?.id ?? null);
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  const currentUserId = user?.id ?? null;

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const activeProjects = projects.filter(p => p.status !== 'archived' && p.status !== 'completed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return {
      totalTasks, completedTasks, completionRate,
      activeProjects, completedProjects, totalProjects: projects.length,
    };
  }, [tasks, projects]);

  // Per-member task stats
  const memberStats = useMemo(() => {
    const map = new Map<string, { assigned: number; completed: number }>();
    for (const t of tasks) {
      if (!t.assigned_to) continue;
      const entry = map.get(t.assigned_to) || { assigned: 0, completed: 0 };
      entry.assigned++;
      if (t.isCompleted) entry.completed++;
      map.set(t.assigned_to, entry);
    }
    return map;
  }, [tasks]);

  // Auto-select team when entering view with no team selected
  useEffect(() => {
    if (!currentTeam && teams.length > 0) {
      setCurrentTeam(teams[0]);
    }
  }, [currentTeam, teams, setCurrentTeam]);

  const isLoading = tasksLoading || projectsLoading;
  const hasTeam = !!currentTeam;
  const isEmpty = stats.totalTasks === 0 && stats.totalProjects === 0;
  const viewState: ViewState = !hasTeam ? 'empty' : isLoading ? 'loading' : 'success';

  const handleCopyInviteCode = useCallback(() => {
    if (currentTeam?.invite_code) {
      navigator.clipboard.writeText(currentTeam.invite_code);
      setCopiedCode(true);
      toast({
        title: "Code copié !",
        description: "Le code d'invitation a été copié dans le presse-papier.",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [currentTeam?.invite_code, toast]);

  const handleGoToTasks = useCallback(() => setCurrentView('tasks'), [setCurrentView]);
  const handleGoToProjects = useCallback(() => setCurrentView('projects'), [setCurrentView]);
  const handleCreateTask = useCallback(() => setIsModalOpen(true), [setIsModalOpen]);

  const handleUpdateRole = useCallback((memberId: string, role: TeamRole) => {
    if (currentTeam) updateMemberRole(currentTeam.id, memberId, role);
  }, [currentTeam, updateMemberRole]);

  const handleRemoveMember = useCallback((memberId: string) => {
    if (currentTeam) removeMember(currentTeam.id, memberId);
  }, [currentTeam, removeMember]);

  const handleLeaveTeam = useCallback(() => {
    if (currentTeam) leaveTeam(currentTeam.id);
  }, [currentTeam, leaveTeam]);

  const handleSwitchTeam = useCallback((team: typeof currentTeam) => {
    setCurrentTeam(team);
  }, [setCurrentTeam]);

  return {
    data: {
      currentTeam,
      teamMembers,
      stats,
      copiedCode,
      currentUserId,
      memberStats,
      teams,
    },
    state: {
      viewState,
      isLoading,
      hasTeam,
      isEmpty,
    },
    actions: {
      handleCopyInviteCode,
      handleGoToTasks,
      handleGoToProjects,
      handleCreateTask,
      handleUpdateRole,
      handleRemoveMember,
      handleLeaveTeam,
      handleSwitchTeam,
    },
  };
};

export type TeamViewDataReturn = ReturnType<typeof useTeamViewData>;
