/**
 * AssignmentSelector - Composant pour assigner une tâche à un membre d'équipe
 * Utilisé dans TaskModal quand taskType="team"
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export interface TeamMemberOption {
  user_id: string;
  display_name?: string;
}

interface AssignmentSelectorProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  members: TeamMemberOption[];
  label?: string;
}

const getDisplayName = (member: TeamMemberOption): string => {
  return member.display_name || 'Membre';
};

const getInitials = (member: TeamMemberOption): string => {
  const name = getDisplayName(member);
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const AssignmentSelector: React.FC<AssignmentSelectorProps> = ({
  value,
  onChange,
  members,
  label = 'Assigner à',
}) => {
  const selectedMember = members.find((m) => m.user_id === value);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Select
        value={value || 'unassigned'}
        onValueChange={(v) => onChange(v === 'unassigned' ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner un membre">
            {value && selectedMember ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {getInitials(selectedMember)}
                  </AvatarFallback>
                </Avatar>
                <span>{getDisplayName(selectedMember)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Non assigné</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Non assigné</span>
            </div>
          </SelectItem>
          {members.map((member) => (
            <SelectItem key={member.user_id} value={member.user_id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <span>{getDisplayName(member)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssignmentSelector;
