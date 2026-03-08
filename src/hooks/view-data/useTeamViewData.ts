import { useState, useMemo, useCallback } from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useTeamActivity } from '@/hooks/useTeamActivity';
import { useTaskWatchers } from '@/hooks/useTaskWatchers';
import { useTeamLabels } from '@/hooks/useTeamLabels';
import { useTeamComments } from '@/hooks/useTeamComments';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ViewState } from '@/components/layout/view/ViewLayout';
import type { TeamRole } from '@/hooks/useTeams';
import type { TeamTask } from '@/hooks/useTeamTasks';

export const useTeamViewData = () => {
  const { currentTeam, teamMembers, updateMemberRole, removeMember, leaveTeam, teams, setCurrentTeam } = useTeamContext();
  const { setCurrentView, setIsModalOpen } = useApp();
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, assignTask, toggleComplete, blockTask, unblockTask } = useTeamTasks(currentTeam?.id ?? null);
  const { projects, loading: projectsLoading } = useTeamProjects(currentTeam?.id ?? null);
  const { activities, loading: activityLoading } = useTeamActivity(currentTeam?.id ?? null);
  const { isWatching, toggleWatch } = useTaskWatchers(currentTeam?.id ?? null, user?.id ?? null);
  const { labels, createLabel, updateLabel, deleteLabel, toggleTaskLabel, getTaskLabels, hasTaskLabel } = useTeamLabels(currentTeam?.id ?? null);
  const { comments, loading: commentsLoading, loadTaskComments, addComment, deleteComment, getCommentCount } = useTeamComments(currentTeam?.id ?? null);
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [memberFilter, setMemberFilter] = useState<string | null>(null);

  const currentUserId = user?.id ?? null;

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const activeProjects = projects.filter(p => p.status !== 'archived' && p.status !== 'completed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const unassignedTasks = tasks.filter(t => !t.assigned_to && !t.isCompleted).length;
    const today = startOfDay(new Date());
    const overdueTasks = tasks.filter(t =>
      !t.isCompleted && t.scheduledDate && isBefore(
        t.scheduledDate instanceof Date ? t.scheduledDate : new Date(String(t.scheduledDate) + 'T00:00:00'),
        today
      )
    ).length;

    return {
      totalTasks, completedTasks, completionRate,
      activeProjects, completedProjects, totalProjects: projects.length,
      unassignedTasks, overdueTasks,
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

  // Grouped & filtered tasks
  const filteredTasks = useMemo(() => {
    const active = tasks.filter(t => !t.isCompleted);
    const filtered = memberFilter
      ? active.filter(t => memberFilter === 'unassigned' ? !t.assigned_to : t.assigned_to === memberFilter)
      : active;

    const myTasks = filtered.filter(t => t.assigned_to === currentUserId);
    const unassigned = filtered.filter(t => !t.assigned_to);
    const otherTasks = filtered.filter(t => t.assigned_to && t.assigned_to !== currentUserId);

    return { myTasks, unassigned, otherTasks, total: filtered.length };
  }, [tasks, currentUserId, memberFilter]);


  const isLoading = tasksLoading || projectsLoading;
  const hasTeam = !!currentTeam;
  const isEmpty = stats.totalTasks === 0 && stats.totalProjects === 0;
  const viewState: ViewState = !hasTeam ? 'empty' : isLoading ? 'loading' : 'success';

  const handleCopyInviteCode = useCallback(() => {
    if (currentTeam?.invite_code) {
      navigator.clipboard.writeText(currentTeam.invite_code);
      setCopiedCode(true);
      toast({ title: "Code copié !", description: "Le code d'invitation a été copié dans le presse-papier." });
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

  const handleAssignTask = useCallback((taskId: string, userId: string | null) => {
    assignTask(taskId, userId);
  }, [assignTask]);

  const handleToggleComplete = useCallback((taskId: string, completed: boolean) => {
    toggleComplete(taskId, completed);
  }, [toggleComplete]);

  const handleUnblockTask = useCallback((taskId: string) => {
    unblockTask(taskId);
  }, [unblockTask]);

  const handleToggleWatch = useCallback((taskId: string) => {
    toggleWatch(taskId);
  }, [toggleWatch]);

  // Send team notification via DB function
  const sendTeamNotification = useCallback(async (
    type: string, title: string, message: string,
    metadata: Record<string, string> = {},
    targetUserId?: string
  ) => {
    if (!currentTeam || !currentUserId) return;
    try {
      const { error } = await supabase.rpc('send_team_notification', {
        _team_id: currentTeam.id,
        _sender_id: currentUserId,
        _type: type,
        _title: title,
        _message: message,
        _metadata: metadata,
        _target_user_id: targetUserId || null,
      });
      if (error) throw error;
    } catch (err) {
      toast({ title: 'Erreur', description: "Impossible d'envoyer la notification", variant: 'destructive' });
    }
  }, [currentTeam, currentUserId, toast]);

  const handleAssignToMe = useCallback((taskId: string) => {
    if (!currentUserId) return;
    assignTask(taskId, currentUserId);
    const senderName = teamMembers.find(m => m.user_id === currentUserId)?.profiles?.display_name || 'Un membre';
    sendTeamNotification(
      'team', `🙋 ${senderName} s'est attribué une tâche`,
      `Tâche : ${tasks.find(t => t.id === taskId)?.name || ''}`,
      { task_id: taskId, action: 'self_assign' }
    );
  }, [assignTask, currentUserId, teamMembers, sendTeamNotification, tasks]);

  const handleBlockTask = useCallback((taskId: string, reason: string) => {
    blockTask(taskId, reason);
    const senderName = teamMembers.find(m => m.user_id === currentUserId)?.profiles?.display_name || 'Un membre';
    sendTeamNotification(
      'team', `🚧 ${senderName} a signalé un blocage`,
      `Tâche : ${tasks.find(t => t.id === taskId)?.name || ''} — ${reason}`,
      { task_id: taskId, action: 'blocked', reason }
    );
  }, [blockTask, currentUserId, teamMembers, sendTeamNotification, tasks]);

  const handleRequestHelp = useCallback((task: TeamTask) => {
    const senderName = teamMembers.find(m => m.user_id === currentUserId)?.profiles?.display_name || 'Un membre';
    sendTeamNotification('team', `🆘 ${senderName} a besoin d'aide`, `Tâche : ${task.name}`, { task_id: task.id, action: 'help_request' });
    toast({ title: 'Demande envoyée', description: "Votre équipe a été notifiée" });
  }, [sendTeamNotification, currentUserId, teamMembers, toast]);

  const handleEncourage = useCallback((task: TeamTask) => {
    if (!task.assigned_to) return;
    const senderName = teamMembers.find(m => m.user_id === currentUserId)?.profiles?.display_name || 'Un membre';
    sendTeamNotification('team', `💪 ${senderName} vous encourage !`, `Courage pour : ${task.name}`, { task_id: task.id, action: 'encouragement' }, task.assigned_to);
    toast({ title: 'Encouragement envoyé !', description: "Le membre a été notifié" });
  }, [sendTeamNotification, currentUserId, teamMembers, toast]);

  // Comment with notification
  const handleAddComment = useCallback(async (taskId: string, content: string) => {
    const ok = await addComment(taskId, content);
    if (ok) {
      const senderName = teamMembers.find(m => m.user_id === currentUserId)?.profiles?.display_name || 'Un membre';
      const taskName = tasks.find(t => t.id === taskId)?.name || '';
      sendTeamNotification('team', `💬 ${senderName} a commenté`, `${taskName} : ${content.slice(0, 100)}`, { task_id: taskId, action: 'comment' });
    }
    return ok;
  }, [addComment, teamMembers, currentUserId, tasks, sendTeamNotification]);

  return {
    data: {
      currentTeam, teamMembers, stats, copiedCode, currentUserId,
      memberStats, teams, filteredTasks, tasks, activities,
      labels, comments,
    },
    state: {
      viewState, isLoading, hasTeam, isEmpty, memberFilter, commentsLoading,
    },
    actions: {
      handleCopyInviteCode, handleGoToTasks, handleGoToProjects, handleCreateTask,
      handleUpdateRole, handleRemoveMember, handleLeaveTeam, handleSwitchTeam,
      handleAssignTask, handleAssignToMe, handleToggleComplete,
      handleRequestHelp, handleEncourage, handleBlockTask, handleUnblockTask,
      handleToggleWatch, isWatching, setMemberFilter,
      // Labels
      createLabel, updateLabel, deleteLabel, toggleTaskLabel, getTaskLabels, hasTaskLabel,
      // Comments
      loadTaskComments, handleAddComment, deleteComment, getCommentCount,
    },
  };
};

export type TeamViewDataReturn = ReturnType<typeof useTeamViewData>;
