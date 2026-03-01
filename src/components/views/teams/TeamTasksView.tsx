import React from 'react';
import { ViewLayout } from '@/components/layout/view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Users, Plus, MoreVertical, FolderKanban, ListTodo,
  ArrowRight, UserPlus, Crown, Shield, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamViewData } from '@/hooks/view-data';
import type { TeamMember, TeamRole } from '@/hooks/useTeams';

interface TeamTasksViewProps {
  className?: string;
}

const getDisplayName = (member: TeamMember): string =>
  member.profiles?.display_name || 'Membre';

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
  const { data, state, actions } = useTeamViewData();

  if (!state.hasTeam) {
    return (
      <ViewLayout
        header={{ title: "Équipe", subtitle: "Gérez votre équipe", icon: <Users className="w-5 h-5" /> }}
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

  return (
    <ViewLayout
      header={{
        title: data.currentTeam!.name,
        subtitle: `${data.teamMembers.length} membre${data.teamMembers.length > 1 ? 's' : ''} • Tableau de bord`,
        icon: <Users className="w-5 h-5" />,
        actions: (
          <Button onClick={actions.handleCreateTask} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </Button>
        )
      }}
      state={state.viewState}
      loadingProps={{ variant: 'list' }}
      className={className}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tâches</p>
                  <p className="text-2xl font-bold">{data.stats.completedTasks}/{data.stats.totalTasks}</p>
                </div>
                <ListTodo className="w-8 h-8 text-primary/20" />
              </div>
              <Progress value={data.stats.completionRate} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projets actifs</p>
                  <p className="text-2xl font-bold">{data.stats.activeProjects}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-project/20" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{data.stats.completedProjects} terminés</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Membres</p>
                  <p className="text-2xl font-bold">{data.teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={actions.handleCopyInviteCode}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Code d'invitation</p>
                  <p className="text-lg font-mono font-bold truncate max-w-[120px]">
                    {data.currentTeam!.invite_code}
                  </p>
                </div>
                {data.copiedCode ? <Check className="w-6 h-6 text-primary" /> : <Copy className="w-6 h-6 text-muted-foreground/50" />}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Cliquez pour copier</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={actions.handleGoToTasks}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ListTodo className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Voir les tâches</p>
                  <p className="text-sm text-muted-foreground">
                    {data.stats.totalTasks - data.stats.completedTasks} tâches en attente
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={actions.handleGoToProjects}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent">
                  <FolderKanban className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium">Voir les projets</p>
                  <p className="text-sm text-muted-foreground">{data.stats.activeProjects} projets actifs</p>
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
                  {data.teamMembers.length} membre{data.teamMembers.length > 1 ? 's' : ''}
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
              {data.teamMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onUpdateRole={(role) => actions.handleUpdateRole(member.user_id, role)}
                  onRemove={() => actions.handleRemoveMember(member.user_id)}
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
  onUpdateRole: (role: TeamRole) => void;
  onRemove: () => void;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onUpdateRole, onRemove }) => {
  const displayName = getDisplayName(member);
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
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
              <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
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
