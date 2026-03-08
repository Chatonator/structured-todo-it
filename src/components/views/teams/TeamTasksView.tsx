import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ViewLayout } from '@/components/layout/view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Users, Plus, FolderKanban, ListTodo,
  ArrowRight, Copy, Check, Mail, Send, LogIn,
  ChevronDown, LogOut, Sparkles, Rocket, UserCircle
} from 'lucide-react';
import { useTeamViewData } from '@/hooks/view-data';
import { useTeamContext } from '@/contexts/TeamContext';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { PendingInvitationsCard } from '@/components/team/PendingInvitationsCard';
import { TeamTaskCard } from './TeamTaskCard';

interface TeamTasksViewProps {
  className?: string;
}

// ─── No-team state: Create / Join ───
const NoTeamView: React.FC<{
  teams: any[];
  pendingInvitations: any[];
  onSelectTeam: (team: any) => void;
  onRespond: (id: string, accept: boolean) => Promise<boolean>;
  createTeam: (name: string) => Promise<any>;
  joinTeam: (code: string) => Promise<any>;
  className?: string;
}> = ({ teams, pendingInvitations, onSelectTeam, onRespond, createTeam, joinTeam, className }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    await createTeam(newTeamName.trim());
    setNewTeamName('');
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    await joinTeam(joinCode.trim());
    setJoinCode('');
    setJoining(false);
  };

  return (
    <ViewLayout
      header={{ title: "Équipe", subtitle: "Collaborez avec votre équipe", icon: <Users className="w-5 h-5" /> }}
      state="success"
      className={className}
    >
      <div className="space-y-6">
        {pendingInvitations.length > 0 && (
          <PendingInvitationsCard invitations={pendingInvitations} onRespond={onRespond} />
        )}

        {teams.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vos équipes</CardTitle>
              <CardDescription>Sélectionnez une équipe pour accéder à son tableau de bord</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.map(team => (
                <Button
                  key={team.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => onSelectTeam(team)}
                >
                  <Users className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{team.name}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="p-3 rounded-xl bg-primary/10 w-fit">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Créer une équipe</CardTitle>
              <CardDescription>Démarrez un nouveau groupe de travail collaboratif</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Nom de l'équipe"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} className="w-full gap-2" disabled={creating || !newTeamName.trim()}>
                <Plus className="w-4 h-4" />
                {creating ? 'Création...' : "Créer l'équipe"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-3 rounded-xl bg-accent w-fit">
                <LogIn className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-lg">Rejoindre une équipe</CardTitle>
              <CardDescription>Utilisez un code d'invitation pour rejoindre une équipe existante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Code d'invitation"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                className="font-mono"
              />
              <Button onClick={handleJoin} variant="secondary" className="w-full gap-2" disabled={joining || !joinCode.trim()}>
                <LogIn className="w-4 h-4" />
                {joining ? 'Connexion...' : 'Rejoindre'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ViewLayout>
  );
};

// ─── Empty onboarding when stats are zero ───
const EmptyOnboarding: React.FC<{ onCreateTask: () => void; onGoToProjects: () => void }> = ({ onCreateTask, onGoToProjects }) => (
  <Card className="border-dashed">
    <CardContent className="pt-6 flex flex-col items-center text-center gap-4 py-10">
      <div className="p-4 rounded-full bg-primary/10">
        <Rocket className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Votre équipe est prête !</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Commencez par créer votre première tâche ou votre premier projet d'équipe.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onCreateTask} className="gap-2">
          <Plus className="w-4 h-4" />
          Créer une tâche
        </Button>
        <Button onClick={onGoToProjects} variant="outline" className="gap-2">
          <FolderKanban className="w-4 h-4" />
          Créer un projet
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ─── Main view ───
const TeamTasksView: React.FC<TeamTasksViewProps> = ({ className }) => {
  const { data, state, actions } = useTeamViewData();
  const { teams, createTeam, joinTeam, inviteByEmail, pendingInvitations, respondToInvitation, setCurrentTeam } = useTeamContext();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateJoinOpen, setIsCreateJoinOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !data.currentTeam) return;
    setInviteLoading(true);
    const success = await inviteByEmail(data.currentTeam.id, inviteEmail.trim());
    if (success) {
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    }
    setInviteLoading(false);
  };

  if (!state.hasTeam) {
    return (
      <NoTeamView
        teams={teams}
        pendingInvitations={pendingInvitations}
        onSelectTeam={setCurrentTeam}
        onRespond={respondToInvitation}
        createTeam={createTeam}
        joinTeam={joinTeam}
        className={className}
      />
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Team switcher dropdown */}
      {data.teams.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronDown className="w-4 h-4" />
              Changer
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {data.teams.filter(t => t.id !== data.currentTeam?.id).map(team => (
              <DropdownMenuItem key={team.id} onClick={() => actions.handleSwitchTeam(team)}>
                <Users className="w-4 h-4 mr-2" />
                {team.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button onClick={actions.handleCreateTask} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Nouvelle tâche
      </Button>
    </div>
  );

  return (
    <ViewLayout
      header={{
        title: data.currentTeam!.name,
        subtitle: `${data.teamMembers.length} membre${data.teamMembers.length > 1 ? 's' : ''} • Tableau de bord`,
        icon: <Users className="w-5 h-5" />,
        actions: headerActions,
      }}
      state={state.viewState}
      loadingProps={{ variant: 'list' }}
      className={className}
    >
      <div className="space-y-6">
        {pendingInvitations.length > 0 && (
          <PendingInvitationsCard invitations={pendingInvitations} onRespond={respondToInvitation} />
        )}

        {/* Empty onboarding state */}
        {state.isEmpty && !state.isLoading && (
          <EmptyOnboarding onCreateTask={actions.handleCreateTask} onGoToProjects={actions.handleGoToProjects} />
        )}

        {/* Stats Overview — only when there's data */}
        {!state.isEmpty && (
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
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={data.stats.completionRate} className="h-1 flex-1" />
                  {data.stats.unassignedTasks > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {data.stats.unassignedTasks} non assignées
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
                    <p className="text-2xl font-bold">{data.stats.activeProjects}</p>
                  </div>
                  <FolderKanban className="w-8 h-8 text-primary/20" />
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
        )}

        {/* Team Tasks List */}
        {!state.isEmpty && data.filteredTasks.total > 0 && (
          <Collapsible>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-lg">Tâches de l'équipe</CardTitle>
                        <CardDescription>
                          {data.filteredTasks.total} tâche{data.filteredTasks.total > 1 ? 's' : ''} en cours
                        </CardDescription>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={state.memberFilter || 'all'}
                        onValueChange={(v) => actions.setMemberFilter(v === 'all' ? null : v)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <UserCircle className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filtrer par membre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les membres</SelectItem>
                          <SelectItem value="unassigned">Non assignées</SelectItem>
                          {data.teamMembers.map(m => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                              {m.profiles?.display_name || 'Membre'}
                              {m.user_id === data.currentUserId ? ' (moi)' : ''}
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
                  {/* My tasks */}
                  {data.filteredTasks.myTasks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mes tâches</p>
                      {data.filteredTasks.myTasks.map(task => (
                        <TeamTaskCard
                          key={task.id}
                          task={task}
                          members={data.teamMembers}
                          currentUserId={data.currentUserId}
                          onToggleComplete={actions.handleToggleComplete}
                          onAssign={actions.handleAssignTask}
                          onRequestHelp={actions.handleRequestHelp}
                          onEncourage={actions.handleEncourage}
                        />
                      ))}
                    </div>
                  )}

                  {/* Unassigned */}
                  {data.filteredTasks.unassigned.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Non assignées</p>
                      {data.filteredTasks.unassigned.map(task => (
                        <TeamTaskCard
                          key={task.id}
                          task={task}
                          members={data.teamMembers}
                          currentUserId={data.currentUserId}
                          onToggleComplete={actions.handleToggleComplete}
                          onAssign={actions.handleAssignTask}
                          onRequestHelp={actions.handleRequestHelp}
                          onEncourage={actions.handleEncourage}
                        />
                      ))}
                    </div>
                  )}

                  {/* Other members */}
                  {data.filteredTasks.otherTasks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Autres membres</p>
                      {data.filteredTasks.otherTasks.map(task => (
                        <TeamTaskCard
                          key={task.id}
                          task={task}
                          members={data.teamMembers}
                          currentUserId={data.currentUserId}
                          onToggleComplete={actions.handleToggleComplete}
                          onAssign={actions.handleAssignTask}
                          onRequestHelp={actions.handleRequestHelp}
                          onEncourage={actions.handleEncourage}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Quick Actions */}
        {!state.isEmpty && (
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
        )}

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
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Inviter par email
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background">
                  <DialogHeader>
                    <DialogTitle>Inviter un membre</DialogTitle>
                    <DialogDescription>
                      Entrez l'adresse email d'un utilisateur inscrit pour l'inviter à rejoindre l'équipe.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invite-email">Adresse email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="membre@email.com"
                        className="mt-1.5"
                        onKeyDown={(e) => e.key === 'Enter' && handleInviteByEmail()}
                      />
                    </div>
                    <Button onClick={handleInviteByEmail} className="w-full gap-2" disabled={inviteLoading || !inviteEmail.trim()}>
                      <Send className="w-4 h-4" />
                      {inviteLoading ? 'Envoi...' : "Envoyer l'invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <TeamMembersList
              members={data.teamMembers}
              currentUserId={data.currentUserId}
              memberStats={data.memberStats}
              onUpdateRole={actions.handleUpdateRole}
              onRemove={actions.handleRemoveMember}
            />
          </CardContent>
        </Card>

        {/* Footer actions: Create/Join another team + Leave */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          {/* Create/Join another team */}
          <Dialog open={isCreateJoinOpen} onOpenChange={setIsCreateJoinOpen}>
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
                      onChange={e => setNewTeamName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTeamName.trim()) {
                          setCreating(true);
                          createTeam(newTeamName.trim()).then(() => {
                            setNewTeamName('');
                            setCreating(false);
                            setIsCreateJoinOpen(false);
                          });
                        }
                      }}
                    />
                    <Button
                      disabled={creating || !newTeamName.trim()}
                      onClick={() => {
                        setCreating(true);
                        createTeam(newTeamName.trim()).then(() => {
                          setNewTeamName('');
                          setCreating(false);
                          setIsCreateJoinOpen(false);
                        });
                      }}
                    >
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
                      onChange={e => setJoinCode(e.target.value)}
                      className="font-mono"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && joinCode.trim()) {
                          setJoining(true);
                          joinTeam(joinCode.trim()).then(() => {
                            setJoinCode('');
                            setJoining(false);
                            setIsCreateJoinOpen(false);
                          });
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      disabled={joining || !joinCode.trim()}
                      onClick={() => {
                        setJoining(true);
                        joinTeam(joinCode.trim()).then(() => {
                          setJoinCode('');
                          setJoining(false);
                          setIsCreateJoinOpen(false);
                        });
                      }}
                    >
                      {joining ? '...' : 'Rejoindre'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Leave team with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
                Quitter l'équipe
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Quitter {data.currentTeam!.name} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous perdrez l'accès aux tâches et projets de cette équipe. Vous pourrez la rejoindre à nouveau avec un code d'invitation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={actions.handleLeaveTeam}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Quitter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </ViewLayout>
  );
};

export default TeamTasksView;
