import { useState } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, UserPlus, LogOut, Copy, Trash2, Crown, Shield } from 'lucide-react';
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
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a team name',
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
        title: 'Error',
        description: 'Please enter an invite code',
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

    if (confirm('Are you sure you want to leave this team?')) {
      await leaveTeam(currentTeam.id);
    }
  };

  const handleCopyInviteCode = () => {
    if (currentTeam?.invite_code) {
      navigator.clipboard.writeText(currentTeam.invite_code);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    if (!currentTeam) return;
    await updateMemberRole(currentTeam.id, memberId, newRole);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentTeam) return;
    
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(currentTeam.id, memberId);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Team Management</h2>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a new team and invite others to collaborate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                  />
                </div>
                <Button onClick={handleCreateTeam} className="w-full">
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>Join Team</DialogTitle>
                <DialogDescription>
                  Enter an invite code to join an existing team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                  />
                </div>
                <Button onClick={handleJoinTeam} className="w-full">
                  Join Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You are not a member of any team yet.</p>
              <p className="text-sm">Create a new team or join an existing one to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Teams</CardTitle>
                <CardDescription>Select a team to manage</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={currentTeam?.id || ''}
                  onValueChange={(value) => {
                    const team = teams.find((t) => t.id === value);
                    setCurrentTeam(team || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {currentTeam && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{currentTeam.name}</CardTitle>
                    <CardDescription>Team invite code</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={currentTeam.invite_code}
                        readOnly
                        className="font-mono"
                      />
                      <Button onClick={handleCopyInviteCode} variant="outline" size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleLeaveTeam}
                      variant="destructive"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Team
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage roles and remove members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div
                            key={member.user_id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              {getRoleIcon(member.role)}
                              <div>
                                <p className="font-medium">
                                  {member.profiles?.display_name || 'Unknown User'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.role !== 'owner' && (
                                <>
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) =>
                                      handleRoleChange(member.user_id, value as TeamRole)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background z-50">
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="owner">Owner</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    variant="ghost"
                                    size="icon"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
