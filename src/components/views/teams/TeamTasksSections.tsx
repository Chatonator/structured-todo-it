import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import type { TeamTask } from '@/hooks/useTeamTasks';
import { AlertTriangle, ArrowRight, Check, ChevronDown, Copy, FolderKanban, KeyRound, Link2, ListTodo, LogOut, Mail, Plus, RefreshCw, Send, UserCircle, Users } from 'lucide-react';

interface TeamStatsOverviewProps {
  stats: {
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    unassignedTasks: number;
    activeProjects: number;
    completedProjects: number;
    overdueTasks: number;
  };
  memberCount: number;
}

export const TeamStatsOverview: React.FC<TeamStatsOverviewProps> = ({ stats, memberCount }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tâches</p>
            <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
          </div>
          <ListTodo className="w-8 h-8 text-primary/20" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={stats.completionRate} className="h-1 flex-1" />
          {stats.unassignedTasks > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.unassignedTasks} non assignées
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Projets actifs</p>
            <p className="text-2xl font-bold">{stats.activeProjects}</p>
          </div>
          <FolderKanban className="w-8 h-8 text-primary/20" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{stats.completedProjects} terminés</p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Membres</p>
            <p className="text-2xl font-bold">{memberCount}</p>
          </div>
          <Users className="w-8 h-8 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>

    {stats.overdueTasks > 0 && (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En retard</p>
              <p className="text-2xl font-bold text-destructive">{stats.overdueTasks}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive/20" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">tâche{stats.overdueTasks > 1 ? 's' : ''} en retard</p>
        </CardContent>
      </Card>
    )}
  </div>
);

interface TeamAccessPanelProps {
  canManageMembers: boolean;
  canViewInviteCode: boolean;
  inviteEmail: string;
  onInviteEmailChange: (value: string) => void;
  inviteLoading: boolean;
  isInviteDialogOpen: boolean;
  onInviteDialogOpenChange: (open: boolean) => void;
  onInviteByEmail: () => void;
  currentTeam: {
    invite_link_enabled?: boolean | null;
    code_join_role?: string | null;
    invite_code?: string | null;
  } | null | undefined;
  copiedCode: boolean;
  onCopyInviteLink: () => void;
  onToggleInviteLink: (checked: boolean) => void;
  onCopyInviteCode: () => void;
  onRegenerateCode: () => void;
  onSetCodeJoinRole: (value: string) => void;
}

export const TeamAccessPanel: React.FC<TeamAccessPanelProps> = ({
  canManageMembers,
  canViewInviteCode,
  inviteEmail,
  onInviteEmailChange,
  inviteLoading,
  isInviteDialogOpen,
  onInviteDialogOpenChange,
  onInviteByEmail,
  currentTeam,
  copiedCode,
  onCopyInviteLink,
  onToggleInviteLink,
  onCopyInviteCode,
  onRegenerateCode,
  onSetCodeJoinRole,
}) => {
  if (!canManageMembers && !canViewInviteCode) {
    return null;
  }

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Invitations & Accès</CardTitle>
                <CardDescription>Gérez les moyens de rejoindre l'équipe</CardDescription>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform [[data-state=open]_&]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {canManageMembers && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm">Invitation par email</h4>
                  <Badge variant="secondary" className="text-xs">Membre</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  L'invité rejoint en tant que <strong>Membre</strong>. Il doit avoir un compte ou en créer un.
                </p>
                <Dialog open={isInviteDialogOpen} onOpenChange={onInviteDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Send className="w-4 h-4" />
                      Inviter par email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background">
                    <DialogHeader>
                      <DialogTitle>Inviter un membre</DialogTitle>
                      <DialogDescription>
                        Entrez l'adresse email d'un utilisateur pour l'inviter. Il rejoint en tant que Membre.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="invite-email">Adresse email</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(event) => onInviteEmailChange(event.target.value)}
                          placeholder="membre@email.com"
                          className="mt-1.5"
                          onKeyDown={(event) => event.key === 'Enter' && onInviteByEmail()}
                        />
                      </div>
                      <Button onClick={onInviteByEmail} className="w-full gap-2" disabled={inviteLoading || !inviteEmail.trim()}>
                        <Send className="w-4 h-4" />
                        {inviteLoading ? 'Envoi...' : "Envoyer l'invitation"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {canViewInviteCode && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm">Lien partageable</h4>
                  <Badge variant="outline" className="text-xs">Invité</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les visiteurs peuvent consulter l'équipe sans compte. Ils devront se connecter pour être promus.
                </p>
                <Button variant="outline" size="sm" className="gap-2" onClick={onCopyInviteLink}>
                  <Link2 className="w-4 h-4" />
                  Copier le lien
                </Button>

                {canManageMembers && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Autoriser les nouvelles inscriptions via lien/code</Label>
                    <Switch
                      checked={currentTeam?.invite_link_enabled ?? true}
                      onCheckedChange={onToggleInviteLink}
                    />
                  </div>
                )}
              </div>
            )}

            {canViewInviteCode && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm">Code d'invitation</h4>
                  <Badge variant="outline" className="text-xs">
                    {currentTeam?.code_join_role === 'member' ? 'Membre' : 'Invité'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nécessite un compte. Le rôle à l'arrivée est configurable par un admin.
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-1.5 rounded font-mono text-sm font-bold tracking-wider">
                    {currentTeam?.invite_code?.replace(/(.{4})(?=.)/g, '$1-')}
                  </code>
                  <Button variant="ghost" size="sm" onClick={onCopyInviteCode}>
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {canManageMembers && (
                  <div className="flex flex-wrap items-center gap-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Régénérer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Régénérer le code ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            L'ancien code ne fonctionnera plus. Les liens partagés précédemment seront invalides.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={onRegenerateCode}>
                            Régénérer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Rôle à l'arrivée :</Label>
                      <Select
                        value={currentTeam?.code_join_role || 'guest'}
                        onValueChange={onSetCodeJoinRole}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guest">Invité (sécurisé)</SelectItem>
                          <SelectItem value="member">Membre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

interface TeamTasksPanelProps {
  total: number;
  memberFilter: string | null;
  onMemberFilterChange: (value: string | null) => void;
  teamMembers: Array<{ user_id: string; profiles?: { display_name?: string | null } | null }>;
  currentUserId: string | null | undefined;
  myTasks: TeamTask[];
  unassigned: TeamTask[];
  otherTasks: TeamTask[];
  renderTaskCard: (task: TeamTask) => React.ReactNode;
}

export const TeamTasksPanel: React.FC<TeamTasksPanelProps> = ({
  total,
  memberFilter,
  onMemberFilterChange,
  teamMembers,
  currentUserId,
  myTasks,
  unassigned,
  otherTasks,
  renderTaskCard,
}) => {
  if (total <= 0) {
    return null;
  }

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-lg">Tâches de l'équipe</CardTitle>
                  <CardDescription>
                    {total} tâche{total > 1 ? 's' : ''} en cours
                  </CardDescription>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
              </div>
              <div onClick={(event) => event.stopPropagation()}>
                <Select
                  value={memberFilter || 'all'}
                  onValueChange={(value) => onMemberFilterChange(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <UserCircle className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par membre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les membres</SelectItem>
                    <SelectItem value="unassigned">Non assignées</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profiles?.display_name || 'Membre'}
                        {member.user_id === currentUserId ? ' (moi)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {myTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mes tâches</p>
                {myTasks.map(renderTaskCard)}
              </div>
            )}
            {unassigned.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Non assignées</p>
                {unassigned.map(renderTaskCard)}
              </div>
            )}
            {otherTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Autres membres</p>
                {otherTasks.map(renderTaskCard)}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

interface TeamProjectsShortcutProps {
  activeProjects: number;
  onClick: () => void;
}

export const TeamProjectsShortcut: React.FC<TeamProjectsShortcutProps> = ({ activeProjects, onClick }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={onClick}>
    <CardContent className="pt-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-accent">
          <FolderKanban className="w-6 h-6 text-accent-foreground" />
        </div>
        <div>
          <p className="font-medium">Voir les projets</p>
          <p className="text-sm text-muted-foreground">{activeProjects} projets actifs</p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </CardContent>
  </Card>
);

interface TeamMembersSectionProps {
  teamMembers: any[];
  currentUserId: string | null | undefined;
  currentUserRole: any;
  memberStats: any;
  canManageMembers: boolean;
  onUpdateRole?: (...args: any[]) => void;
  onRemove?: (...args: any[]) => void;
}

export const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
  teamMembers,
  currentUserId,
  currentUserRole,
  memberStats,
  canManageMembers,
  onUpdateRole,
  onRemove,
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg">Membres de l'équipe</CardTitle>
          <CardDescription>
            {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <TeamMembersList
        members={teamMembers}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        memberStats={memberStats}
        onUpdateRole={canManageMembers ? onUpdateRole : undefined}
        onRemove={canManageMembers ? onRemove : undefined}
      />
    </CardContent>
  </Card>
);

interface TeamCreateJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTeamName: string;
  onNewTeamNameChange: (value: string) => void;
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  creating: boolean;
  joining: boolean;
  onCreate: () => void;
  onJoin: () => void;
}

export const TeamCreateJoinDialog: React.FC<TeamCreateJoinDialogProps> = ({
  open,
  onOpenChange,
  newTeamName,
  onNewTeamNameChange,
  joinCode,
  onJoinCodeChange,
  creating,
  joining,
  onCreate,
  onJoin,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Créer ou rejoindre une autre équipe
      </Button>
    </DialogTrigger>
    <DialogContent className="bg-background">
      <DialogHeader>
        <DialogTitle>Nouvelle équipe</DialogTitle>
        <DialogDescription>Créez une équipe ou rejoignez-en une existante.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Créer une équipe</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nom de l'équipe"
              value={newTeamName}
              onChange={(event) => onNewTeamNameChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && newTeamName.trim() && onCreate()}
            />
            <Button disabled={creating || !newTeamName.trim()} onClick={onCreate}>
              {creating ? '...' : 'Créer'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Rejoindre avec un code</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Code d'invitation"
              value={joinCode}
              onChange={(event) => onJoinCodeChange(event.target.value)}
              className="font-mono"
              onKeyDown={(event) => event.key === 'Enter' && joinCode.trim() && onJoin()}
            />
            <Button variant="secondary" disabled={joining || !joinCode.trim()} onClick={onJoin}>
              {joining ? '...' : 'Rejoindre'}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

interface TeamLeaveButtonProps {
  teamName: string;
  onLeave: () => void;
}

export const TeamLeaveButton: React.FC<TeamLeaveButtonProps> = ({ teamName, onLeave }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
        <LogOut className="w-4 h-4" />
        Quitter l'équipe
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Quitter {teamName} ?</AlertDialogTitle>
        <AlertDialogDescription>
          Vous perdrez l'accès aux tâches et projets de cette équipe. Vous pourrez la rejoindre à nouveau avec un code d'invitation.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction
          onClick={onLeave}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Quitter
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
