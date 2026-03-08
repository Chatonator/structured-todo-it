import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Users, MoreVertical, Crown, Shield, CheckCircle2, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamMember, TeamRole } from '@/hooks/useTeams';

// ─── Shared helpers ───

export const getDisplayName = (member: TeamMember): string =>
  member.profiles?.display_name || member.profiles?.email?.split('@')[0] || 'Membre';

export const getMemberInitials = (name?: string): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// ─── RoleBadge ───

export const RoleBadge = ({ role }: { role: TeamRole }) => {
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

// ─── MemberRow ───

interface MemberRowProps {
  member: TeamMember;
  isCurrentUser?: boolean;
  memberStats?: { assigned: number; completed: number };
  onUpdateRole?: (userId: string, role: TeamRole) => void;
  onRemove?: (userId: string) => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, isCurrentUser, memberStats, onUpdateRole, onRemove }) => {
  const displayName = getDisplayName(member);
  const initials = getMemberInitials(displayName);
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <>
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors",
        isCurrentUser && "ring-1 ring-primary/20 bg-primary/5"
      )}>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className={cn(
              "font-medium",
              isCurrentUser ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
            )}>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{displayName}</p>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Vous</Badge>
              )}
            </div>
            {member.profiles?.email && member.profiles.email !== displayName && (
              <p className="text-xs text-muted-foreground">{member.profiles.email}</p>
            )}
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground/70">
                Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
              </p>
              {memberStats && memberStats.assigned > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <ListTodo className="w-3 h-3" />
                    {memberStats.assigned}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {memberStats.completed}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={member.role} />
          {member.role !== 'owner' && (onUpdateRole || onRemove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onUpdateRole && member.role !== 'admin' && (
                  <DropdownMenuItem onClick={() => onUpdateRole(member.user_id, 'admin')}>
                    <Shield className="w-4 h-4 mr-2" />
                    Promouvoir admin
                  </DropdownMenuItem>
                )}
                {onUpdateRole && member.role === 'admin' && (
                  <DropdownMenuItem onClick={() => onUpdateRole(member.user_id, 'member')}>
                    <Users className="w-4 h-4 mr-2" />
                    Rétrograder en membre
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setConfirmRemove(true)} className="text-destructive focus:text-destructive">
                      Retirer de l'équipe
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {displayName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette personne perdra l'accès à l'équipe, ses tâches et ses projets. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRemove?.(member.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─── TeamMembersList ───

interface TeamMembersListProps {
  members: TeamMember[];
  currentUserId?: string | null;
  memberStats?: Map<string, { assigned: number; completed: number }>;
  onUpdateRole?: (userId: string, role: TeamRole) => void;
  onRemove?: (userId: string) => void;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({ members, currentUserId, memberStats, onUpdateRole, onRemove }) => (
  <div className="space-y-3">
    {members.map((member) => (
      <MemberRow
        key={member.id}
        member={member}
        isCurrentUser={currentUserId === member.user_id}
        memberStats={memberStats?.get(member.user_id)}
        onUpdateRole={onUpdateRole}
        onRemove={onRemove}
      />
    ))}
  </div>
);

export default TeamMembersList;
