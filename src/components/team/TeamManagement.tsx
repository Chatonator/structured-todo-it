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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, UserPlus, LogOut, Copy, Trash2, Crown, Shield, User, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TeamRole } from '@/hooks/useTeams';

export function TeamManagement() {
  const {
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
  } = useTeamContext();

  const { toast } = useToast();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom d\'équipe',
        variant: 'destructive',
      });
      return;
    }

    await createTeam(newTeamName);
    setNewTeamName('');
    setIsCreateDialogOpen(false);
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un code d\'invitation',
        variant: 'destructive',
      });
      return;
    }

    await joinTeam(inviteCode);
    setInviteCode('');
    setIsJoinDialogOpen(false);
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
      toast({
        title: 'Copié !',
        description: 'Code d\'invitation copié dans le presse-papier',
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    if (!currentTeam) return;
    await updateMemberRole(currentTeam.id, memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!currentTeam) return;
    
    if (confirm(`Êtes-vous sûr de vouloir retirer ${memberName} de l'équipe ?`)) {
      await removeMember(currentTeam.id, memberId);
    }
  };

  const getRoleBadge = (role: TeamRole) => {
    const roleConfig = {
      owner: {
        icon: Crown,
        label: 'Propriétaire',
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
      },
      admin: {
        icon: Shield,
        label: 'Admin',
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400'
      },
      member: {
        icon: User,
        label: 'Membre',
        className: 'bg-muted text-muted-foreground border-border'
      }
    };

    const config = roleConfig[role];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.className} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Gestion des équipes</h1>
            <p className="text-muted-foreground mt-1">Créez et gérez vos équipes de collaboration</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Créer une équipe
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle équipe</DialogTitle>
                  <DialogDescription>
                    Créez une équipe et invitez d'autres personnes à collaborer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Nom de l'équipe</Label>
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Mon équipe"
                      className="mt-1.5"
                    />
                  </div>
                  <Button onClick={handleCreateTeam} className="w-full">
                    Créer l'équipe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Rejoindre
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Rejoindre une équipe</DialogTitle>
                  <DialogDescription>
                    Entrez un code d'invitation pour rejoindre une équipe existante
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invite-code">Code d'invitation</Label>
                    <Input
                      id="invite-code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="ABC123XYZ"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <Button onClick={handleJoinTeam} className="w-full">
                    Rejoindre l'équipe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {teams.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune équipe</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Vous n'êtes membre d'aucune équipe pour le moment. Créez une nouvelle équipe ou rejoignez-en une existante.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Créer une équipe
                  </Button>
                  <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Rejoindre une équipe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {team.name}
                        </div>
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
                        <CardDescription>
                          Partagez le code d'invitation pour ajouter des membres
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {teamMembers.length} {teamMembers.length === 1 ? 'membre' : 'membres'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          Code d'invitation
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={currentTeam.invite_code}
                            readOnly
                            className="font-mono text-lg font-semibold bg-muted/50"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button onClick={handleCopyInviteCode} variant="outline" size="icon">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copier le code</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleLeaveTeam}
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Quitter l'équipe
                    </Button>
                  </CardContent>
                </Card>

                {/* Liste des membres */}
                <Card>
                  <CardHeader>
                    <CardTitle>Membres de l'équipe</CardTitle>
                    <CardDescription>
                      Gérez les rôles et retirez des membres
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <TooltipProvider>
                          {teamMembers.map((member) => (
                            <Card key={member.user_id} className="overflow-hidden border-border/50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  {/* Avatar */}
                                  <Avatar className="h-12 w-12 border-2 border-border">
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                                      {getInitials(member.profiles?.display_name)}
                                    </AvatarFallback>
                                  </Avatar>

                                  {/* Informations du membre */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-foreground truncate">
                                        {member.profiles?.display_name || 'Utilisateur inconnu'}
                                      </p>
                                      {getRoleBadge(member.role)}
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      Membre depuis {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  {member.role !== 'owner' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Select
                                        value={member.role}
                                        onValueChange={(value) =>
                                          handleRoleChange(member.user_id, value as TeamRole)
                                        }
                                      >
                                        <SelectTrigger className="w-32 h-9">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background">
                                          <SelectItem value="member">
                                            <div className="flex items-center gap-2">
                                              <User className="w-3 h-3" />
                                              Membre
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                              <Shield className="w-3 h-3" />
                                              Admin
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="owner">
                                            <div className="flex items-center gap-2">
                                              <Crown className="w-3 h-3" />
                                              Propriétaire
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            onClick={() => handleRemoveMember(
                                              member.user_id,
                                              member.profiles?.display_name || 'ce membre'
                                            )}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Retirer de l'équipe</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TooltipProvider>
                      </div>
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
