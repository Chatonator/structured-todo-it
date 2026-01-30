/**
 * TeamTasksView - Tableau de bord d'équipe simplifié
 * 
 * Cette vue sert de dashboard pour l'équipe avec :
 * - Gestion des membres
 * - Résumé des stats (tâches, projets)
 * - Liens vers les vues unifiées (filtrage par équipe)
 * 
 * Les tâches et projets sont maintenant affichés dans TasksView et ProjectsView
 * via le filtre équipe (currentTeam dans TeamContext).
 */

import React, { useMemo } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useApp } from '@/contexts/AppContext';
import { ViewLayout } from '@/components/layout/view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  MoreVertical, 
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  ArrowRight,
  UserPlus,
  Crown,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamMember, TeamRole } from '@/hooks/useTeams';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TeamTasksViewProps {
  className?: string;
}

// Helper to get display name from TeamMember
const getDisplayName = (member: TeamMember): string => {
  return member.profiles?.display_name || 'Membre';
};

// Role badge component
const RoleBadge = ({ role }: { role: TeamRole }) => {
  const config = {
    owner: { label: 'Propriétaire', icon: Crown, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
    admin: { label: 'Admin', icon: Shield, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    member: { label: 'Membre', icon: Users, className: 'bg-muted text-muted-foreground' },
  }[role];

  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn('gap-1 text-xs', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const TeamTasksView: React.FC<TeamTasksViewProps> = ({ className }) => {
  const { currentTeam, teamMembers, updateMemberRole, removeMember } = useTeamContext();
  const { setCurrentView, setIsModalOpen } = useApp();
  const { tasks, loading: tasksLoading } = useTeamTasks(currentTeam?.id ?? null);
  const { projects, loading: projectsLoading } = useTeamProjects(currentTeam?.id ?? null);
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const activeProjects = projects.filter(p => p.status !== 'archived' && p.status !== 'completed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    return {
      totalTasks,
      completedTasks,
      completionRate,
      activeProjects,
      completedProjects,
      totalProjects: projects.length,
    };
  }, [tasks, projects]);

  // Copy invite code
  const handleCopyInviteCode = () => {
    if (currentTeam?.invite_code) {
      navigator.clipboard.writeText(currentTeam.invite_code);
      setCopiedCode(true);
      toast({
        title: "Code copié !",
        description: "Le code d'invitation a été copié dans le presse-papier.",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Navigate to unified views
  const handleGoToTasks = () => {
    setCurrentView('tasks');
  };

  const handleGoToProjects = () => {
    setCurrentView('projects');
  };

  const handleCreateTask = () => {
    setIsModalOpen(true);
  };

  // Empty state when no team selected
  if (!currentTeam) {
    return (
      <ViewLayout
        header={{
          title: "Équipe",
          subtitle: "Gérez votre équipe",
          icon: <Users className="w-5 h-5" />
        }}
        state="empty"
        emptyProps={{
          title: "Aucune équipe sélectionnée",
          description: "Sélectionnez une équipe depuis le sélecteur de contexte pour voir son tableau de bord.",
          icon: <Users className="w-12 h-12" />
        }}
        className={className}
      >
        <div />
      </ViewLayout>
    );
  }

  const isLoading = tasksLoading || projectsLoading;

  return (
    <ViewLayout
      header={{
        title: currentTeam.name,
        subtitle: `${teamMembers.length} membre${teamMembers.length > 1 ? 's' : ''} • Tableau de bord`,
        icon: <Users className="w-5 h-5" />,
        actions: (
          <Button onClick={handleCreateTask} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </Button>
        )
      }}
      state={isLoading ? 'loading' : 'success'}
      loadingProps={{ variant: 'list' }}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tâches</p>
                  <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
                </div>
                <ListTodo className="w-8 h-8 text-primary/20" />
              </div>
              <Progress value={stats.completionRate} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projets actifs</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-project/20" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.completedProjects} terminés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Membres</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleCopyInviteCode}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Code d'invitation</p>
                  <p className="text-lg font-mono font-bold truncate max-w-[120px]">
                    {currentTeam.invite_code}
                  </p>
                </div>
                {copiedCode ? (
                  <Check className="w-6 h-6 text-primary" />
                ) : (
                  <Copy className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cliquez pour copier
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={handleGoToTasks}
          >
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ListTodo className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Voir les tâches</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalTasks - stats.completedTasks} tâches en attente
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={handleGoToProjects}
          >
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent">
                  <FolderKanban className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium">Voir les projets</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.activeProjects} projets actifs
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Membres de l'équipe</CardTitle>
                <CardDescription>
                  {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Inviter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentTeamId={currentTeam.id}
                  onUpdateRole={(role) => updateMemberRole(currentTeam.id, member.user_id, role)}
                  onRemove={() => removeMember(currentTeam.id, member.user_id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ViewLayout>
  );
};

interface MemberRowProps {
  member: TeamMember;
  currentTeamId: string;
  onUpdateRole: (role: TeamRole) => void;
  onRemove: () => void;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, currentTeamId, onUpdateRole, onRemove }) => {
  const displayName = getDisplayName(member);
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <RoleBadge role={member.role} />
        
        {member.role !== 'owner' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {member.role !== 'admin' && (
                <DropdownMenuItem onClick={() => onUpdateRole('admin')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Promouvoir admin
                </DropdownMenuItem>
              )}
              {member.role === 'admin' && (
                <DropdownMenuItem onClick={() => onUpdateRole('member')}>
                  <Users className="w-4 h-4 mr-2" />
                  Rétrograder en membre
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                Retirer de l'équipe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default TeamTasksView;
