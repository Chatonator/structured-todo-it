import { useState, useMemo, useCallback } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import type { ViewState } from '@/components/layout/view/ViewLayout';
import type { TeamRole } from '@/hooks/useTeams';

/**
 * Hook complet pour la vue Équipe
 * Suit le pattern { data, state, actions }
 */
export const useTeamViewData = () => {
  const { currentTeam, teamMembers, updateMemberRole, removeMember } = useTeamContext();
  const { setCurrentView, setIsModalOpen } = useApp();
  const { tasks, loading: tasksLoading } = useTeamTasks(currentTeam?.id ?? null);
  const { projects, loading: projectsLoading } = useTeamProjects(currentTeam?.id ?? null);
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

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

  const isLoading = tasksLoading || projectsLoading;
  const hasTeam = !!currentTeam;
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

  return {
    data: {
      currentTeam,
      teamMembers,
      stats,
      copiedCode,
    },
    state: {
      viewState,
      isLoading,
      hasTeam,
    },
    actions: {
      handleCopyInviteCode,
      handleGoToTasks,
      handleGoToProjects,
      handleCreateTask,
      handleUpdateRole,
      handleRemoveMember,
    },
  };
};

export type TeamViewDataReturn = ReturnType<typeof useTeamViewData>;
