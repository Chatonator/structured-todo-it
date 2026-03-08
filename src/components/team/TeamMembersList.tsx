import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Users, MoreVertical, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TeamMember, TeamRole } from '@/hooks/useTeams';

// ─── Shared helpers ───

export const getDisplayName = (member: TeamMember): string =>
  member.profiles?.display_name || 'Membre';

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
  onUpdateRole?: (userId: string, role: TeamRole) => void;
  onRemove?: (userId: string) => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, onUpdateRole, onRemove }) => {
  const displayName = getDisplayName(member);
  const initials = getMemberInitials(displayName);

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
                  <DropdownMenuItem onClick={() => onRemove(member.user_id)} className="text-destructive focus:text-destructive">
                    Retirer de l'équipe
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

// ─── TeamMembersList ───

interface TeamMembersListProps {
  members: TeamMember[];
  onUpdateRole?: (userId: string, role: TeamRole) => void;
  onRemove?: (userId: string) => void;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({ members, onUpdateRole, onRemove }) => (
  <div className="space-y-3">
    {members.map((member) => (
      <MemberRow
        key={member.id}
        member={member}
        onUpdateRole={onUpdateRole}
        onRemove={onRemove}
      />
    ))}
  </div>
);

export default TeamMembersList;
