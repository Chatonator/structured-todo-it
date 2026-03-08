import { useState } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, LogOut, Copy, ArrowLeft, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { PendingInvitationsCard } from '@/components/team/PendingInvitationsCard';
import type { TeamRole } from '@/hooks/useTeams';

export function TeamManagement() {
  const {
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
  } = useTeamContext();

  const { toast } = useToast();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un nom d\'équipe', variant: 'destructive' });
      return;
    }
    await createTeam(newTeamName);
    setNewTeamName('');
    setIsCreateDialogOpen(false);
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un code d\'invitation', variant: 'destructive' });
      return;
    }
    await joinTeam(inviteCode);
    setInviteCode('');
    setIsJoinDialogOpen(false);
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !currentTeam) return;
    setInviteLoading(true);
    const success = await inviteByEmail(currentTeam.id, inviteEmail.trim());
    if (success) {
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    }
    setInviteLoading(false);
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam) return;
    if (confirm('Êtes-vous sûr de vouloir quitter cette équipe ?')) {
      await leaveTeam(currentTeam.id);
    }
  };

  const handleCopyInviteCode = () => {
    if (currentTeam?.invite_code) {
      navigator.clipboard.writeText(currentTeam.invite_code);
      toast({ title: 'Copié !', description: 'Code d\'invitation copié dans le presse-papier' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: TeamRole) => {
    if (!currentTeam) return;
    await updateMemberRole(currentTeam.id, userId, newRole);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentTeam) return;
    const member = teamMembers.find(m => m.user_id === userId);
    const memberName = member?.profiles?.display_name || 'ce membre';
    if (confirm(`Êtes-vous sûr de vouloir retirer ${memberName} de l'équipe ?`)) {
      await removeMember(currentTeam.id, userId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Gestion des équipes</h1>
            <p className="text-muted-foreground mt-1">Créez et gérez vos équipes de collaboration</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button><Users className="w-4 h-4 mr-2" />Créer une équipe</Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle équipe</DialogTitle>
                  <DialogDescription>Créez une équipe et invitez d'autres personnes à collaborer</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Nom de l'équipe</Label>
                    <Input id="team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Mon équipe" className="mt-1.5" />
                  </div>
                  <Button onClick={handleCreateTeam} className="w-full">Créer l'équipe</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Rejoindre</Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Rejoindre une équipe</DialogTitle>
                  <DialogDescription>Entrez un code d'invitation pour rejoindre une équipe existante</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invite-code">Code d'invitation</Label>
                    <Input id="invite-code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="ABC123XYZ" className="mt-1.5 font-mono" />
                  </div>
                  <Button onClick={handleJoinTeam} className="w-full">Rejoindre l'équipe</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <PendingInvitationsCard invitations={pendingInvitations} onRespond={respondToInvitation} />
        )}

        {teams.length === 0 && pendingInvitations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune équipe</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Vous n'êtes membre d'aucune équipe pour le moment.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setIsCreateDialogOpen(true)}><Users className="w-4 h-4 mr-2" />Créer une équipe</Button>
                  <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Rejoindre une équipe</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : teams.length > 0 && (
          <div className="space-y-6">
            {/* Sélecteur d'équipe */}
            <Card>
              <CardHeader>
                <CardTitle>Vos équipes</CardTitle>
                <CardDescription>Sélectionnez une équipe à gérer</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={currentTeam?.id || ''}
                  onValueChange={(value) => {
                    const team = teams.find((t) => t.id === value);
                    setCurrentTeam(team || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une équipe" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2"><Users className="w-4 h-4" />{team.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {currentTeam && (
              <>
                {/* Informations de l'équipe */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{currentTeam.name}</CardTitle>
                        <CardDescription>Invitez des membres par email ou partagez le code</CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {teamMembers.length} {teamMembers.length === 1 ? 'membre' : 'membres'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Invite by email */}
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2">
                          <Mail className="w-4 h-4" />
                          Inviter par email
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background">
                        <DialogHeader>
                          <DialogTitle>Inviter un membre</DialogTitle>
                          <DialogDescription>L'utilisateur doit être inscrit sur To-Do-iT. Il recevra une notification pour accepter ou refuser.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invite-email-manage">Adresse email</Label>
                            <Input
                              id="invite-email-manage"
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
                            {inviteLoading ? 'Envoi...' : 'Envoyer l\'invitation'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Fallback: invite code */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Code d'invitation (alternatif)</Label>
                        <div className="flex gap-2">
                          <Input value={currentTeam.invite_code} readOnly className="font-mono text-lg font-semibold bg-muted/50" />
                          <Button onClick={handleCopyInviteCode} variant="outline" size="icon" title="Copier le code">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleLeaveTeam} variant="outline" className="w-full text-destructive hover:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Quitter l'équipe
                    </Button>
                  </CardContent>
                </Card>

                {/* Liste des membres */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membres de l'équipe</CardTitle>
                    <CardDescription>Gérez les rôles et retirez des membres</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <TeamMembersList members={teamMembers} onUpdateRole={handleRoleChange} onRemove={handleRemoveMember} />
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
