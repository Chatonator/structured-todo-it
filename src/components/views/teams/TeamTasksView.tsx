import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ViewLayout } from '@/components/layout/view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Users, Plus, FolderKanban, ArrowRight, LogIn, ChevronDown, Rocket, Tag, Trash2 } from 'lucide-react';
import { useTeamViewData } from '@/hooks/view-data';
import { useTeamContext } from '@/contexts/TeamContext';
import { PendingInvitationsCard } from '@/components/team/PendingInvitationsCard';
import { TeamPermissionsPanel } from '@/components/team/TeamPermissionsPanel';
import { TeamTaskCard } from './TeamTaskCard';
import { TeamActivityFeed } from './TeamActivityFeed';
import { TeamWorkloadCard } from './TeamWorkloadCard';
import { TeamCommentThread } from './TeamCommentThread';
import {
  TeamAccessPanel,
  TeamCreateJoinDialog,
  TeamLeaveButton,
  TeamMembersSection,
  TeamProjectsShortcut,
  TeamStatsOverview,
  TeamTasksPanel,
} from './TeamTasksSections';
import type { TeamTask } from '@/hooks/useTeamTasks';

interface TeamTasksViewProps {
  className?: string;
}

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
      header={{ title: 'Équipe', subtitle: 'Collaborez avec votre équipe', icon: <Users className="w-5 h-5" /> }}
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

const LabelManagement: React.FC<{
  labels: { id: string; name: string; color: string }[];
  onCreate: (name: string, color: string) => void;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => void;
  onDelete: (id: string) => void;
}> = ({ labels, onCreate, onUpdate, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim(), newColor);
    setNewName('');
    setNewColor('#6366f1');
  };

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Labels d'équipe</CardTitle>
                <CardDescription>{labels.length} label{labels.length > 1 ? 's' : ''}</CardDescription>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto transition-transform [[data-state=open]_&]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-center">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nouveau label…"
                className="text-sm h-8 flex-1"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <input
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <Button size="sm" className="h-8" onClick={handleCreate} disabled={!newName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {labels.map(label => (
              <div key={label.id} className="flex items-center gap-2 group">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-sm flex-1">{label.name}</span>
                <input
                  type="color"
                  value={label.color}
                  onChange={e => onUpdate(label.id, { color: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <button
                  onClick={() => onDelete(label.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

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
  const [commentTask, setCommentTask] = useState<TeamTask | null>(null);

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

  const handleCreateAnotherTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    await createTeam(newTeamName.trim());
    setNewTeamName('');
    setCreating(false);
    setIsCreateJoinOpen(false);
  };

  const handleJoinAnotherTeam = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    await joinTeam(joinCode.trim());
    setJoinCode('');
    setJoining(false);
    setIsCreateJoinOpen(false);
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

  const renderTaskCard = (task: TeamTask) => (
    <TeamTaskCard
      key={task.id}
      task={task}
      members={data.teamMembers}
      currentUserId={data.currentUserId}
      onToggleComplete={actions.handleToggleComplete}
      onAssign={actions.handleAssignTask}
      onAssignToMe={actions.handleAssignToMe}
      onRequestHelp={actions.handleRequestHelp}
      onEncourage={actions.handleEncourage}
      onBlockTask={actions.handleBlockTask}
      onUnblockTask={actions.handleUnblockTask}
      onToggleWatch={actions.handleToggleWatch}
      watchedByMe={actions.isWatching(task.id)}
      taskLabels={actions.getTaskLabels(task.id)}
      allLabels={data.labels}
      onToggleLabel={actions.toggleTaskLabel}
      hasLabel={actions.hasTaskLabel}
      commentCount={actions.getCommentCount(task.id)}
      onOpenComments={(teamTask) => setCommentTask(teamTask)}
      can={actions.can}
    />
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      {data.teams.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronDown className="w-4 h-4" />
              Changer
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {data.teams.filter(team => team.id !== data.currentTeam?.id).map(team => (
              <DropdownMenuItem key={team.id} onClick={() => actions.handleSwitchTeam(team)}>
                <Users className="w-4 h-4 mr-2" />
                {team.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {actions.can('create_tasks') && (
        <Button onClick={actions.handleCreateTask} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle tâche
        </Button>
      )}
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

        {state.isEmpty && !state.isLoading && (
          <EmptyOnboarding onCreateTask={actions.handleCreateTask} onGoToProjects={actions.handleGoToProjects} />
        )}

        {!state.isEmpty && (
          <TeamStatsOverview
            stats={data.stats}
            memberCount={data.teamMembers.length}
          />
        )}

        <TeamAccessPanel
          canManageMembers={actions.can('manage_members')}
          canViewInviteCode={actions.can('view_invite_code')}
          inviteEmail={inviteEmail}
          onInviteEmailChange={setInviteEmail}
          inviteLoading={inviteLoading}
          isInviteDialogOpen={isInviteDialogOpen}
          onInviteDialogOpenChange={setIsInviteDialogOpen}
          onInviteByEmail={handleInviteByEmail}
          currentTeam={data.currentTeam}
          copiedCode={data.copiedCode}
          onCopyInviteLink={actions.handleCopyInviteLink}
          onToggleInviteLink={actions.handleToggleInviteLink}
          onCopyInviteCode={actions.handleCopyInviteCode}
          onRegenerateCode={actions.handleRegenerateCode}
          onSetCodeJoinRole={actions.handleSetCodeJoinRole}
        />

        {!state.isEmpty && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TeamWorkloadCard
              members={data.teamMembers}
              memberStats={data.memberStats}
              currentUserId={data.currentUserId}
            />
            <TeamActivityFeed
              activities={data.activities}
              members={data.teamMembers}
              loading={state.isLoading}
            />
          </div>
        )}

        {!state.isEmpty && (
          <TeamTasksPanel
            total={data.filteredTasks.total}
            memberFilter={state.memberFilter}
            onMemberFilterChange={actions.setMemberFilter}
            teamMembers={data.teamMembers}
            currentUserId={data.currentUserId}
            myTasks={data.filteredTasks.myTasks}
            unassigned={data.filteredTasks.unassigned}
            otherTasks={data.filteredTasks.otherTasks}
            renderTaskCard={renderTaskCard}
          />
        )}

        {!state.isEmpty && actions.can('manage_labels') && (
          <LabelManagement
            labels={data.labels}
            onCreate={actions.createLabel}
            onUpdate={actions.updateLabel}
            onDelete={actions.deleteLabel}
          />
        )}

        {!state.isEmpty && (state.myRole === 'owner' || state.myRole === 'admin') && (
          <TeamPermissionsPanel
            config={data.permissionsConfig}
            onUpdate={actions.updatePermissionsConfig}
          />
        )}

        {!state.isEmpty && (
          <TeamProjectsShortcut
            activeProjects={data.stats.activeProjects}
            onClick={actions.handleGoToProjects}
          />
        )}

        <TeamMembersSection
          teamMembers={data.teamMembers}
          currentUserId={data.currentUserId}
          currentUserRole={state.myRole}
          memberStats={data.memberStats}
          canManageMembers={actions.can('manage_members')}
          onUpdateRole={actions.handleUpdateRole}
          onRemove={actions.handleRemoveMember}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <TeamCreateJoinDialog
            open={isCreateJoinOpen}
            onOpenChange={setIsCreateJoinOpen}
            newTeamName={newTeamName}
            onNewTeamNameChange={setNewTeamName}
            joinCode={joinCode}
            onJoinCodeChange={setJoinCode}
            creating={creating}
            joining={joining}
            onCreate={handleCreateAnotherTeam}
            onJoin={handleJoinAnotherTeam}
          />

          <TeamLeaveButton
            teamName={data.currentTeam!.name}
            onLeave={actions.handleLeaveTeam}
          />
        </div>
      </div>

      {commentTask && (
        <TeamCommentThread
          open={!!commentTask}
          onOpenChange={(open) => { if (!open) setCommentTask(null); }}
          taskId={commentTask.id}
          taskName={commentTask.name}
          comments={data.comments}
          loading={state.commentsLoading}
          members={data.teamMembers}
          currentUserId={data.currentUserId}
          onLoadComments={actions.loadTaskComments}
          onAddComment={actions.handleAddComment}
          onDeleteComment={actions.deleteComment}
        />
      )}
    </ViewLayout>
  );
};

export default TeamTasksView;
