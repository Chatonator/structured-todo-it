import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { HelpCircle, Heart, UserCircle, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';
import type { TeamTask } from '@/hooks/useTeamTasks';
import type { TeamMember } from '@/hooks/useTeams';

interface TeamTaskCardProps {
  task: TeamTask;
  members: TeamMember[];
  currentUserId: string | null;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAssign: (taskId: string, userId: string | null) => void;
  onRequestHelp: (task: TeamTask) => void;
  onEncourage: (task: TeamTask) => void;
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getMemberName = (userId: string | null, members: TeamMember[]): string => {
  if (!userId) return 'Non assigné';
  const member = members.find(m => m.user_id === userId);
  return member?.profiles?.display_name || 'Membre';
};

export const TeamTaskCard: React.FC<TeamTaskCardProps> = ({
  task, members, currentUserId,
  onToggleComplete, onAssign, onRequestHelp, onEncourage
}) => {
  const assignedMember = members.find(m => m.user_id === task.assigned_to);
  const isAssignedToMe = task.assigned_to === currentUserId;
  const isAssignedToOther = !!task.assigned_to && !isAssignedToMe;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all hover:shadow-sm",
      task.isCompleted && "opacity-50"
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
        className="flex-shrink-0"
      />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.estimatedTime > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(task.estimatedTime)}
            </span>
          )}
          {task.category && (
            <span className="text-xs text-muted-foreground/70">{task.category}</span>
          )}
        </div>
      </div>

      {/* Assignment dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            {assignedMember ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback className={cn(
                  "text-[10px]",
                  isAssignedToMe ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {getInitials(assignedMember.profiles?.display_name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAssign(task.id, null)}>
            <UserCircle className="w-4 h-4 mr-2 text-muted-foreground" />
            Non assigné
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {members.map(m => (
            <DropdownMenuItem
              key={m.user_id}
              onClick={() => onAssign(task.id, m.user_id)}
              className={cn(task.assigned_to === m.user_id && "bg-accent")}
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {getInitials(m.profiles?.display_name)}
                </AvatarFallback>
              </Avatar>
              {m.profiles?.display_name || 'Membre'}
              {m.user_id === currentUserId && <span className="ml-1 text-xs text-muted-foreground">(moi)</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Help button - only on my tasks or unassigned */}
        {(isAssignedToMe || !task.assigned_to) && !task.isCompleted && (
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            onClick={() => onRequestHelp(task)}
            title="Demander de l'aide"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}

        {/* Encourage button - only on other members' tasks */}
        {isAssignedToOther && !task.isCompleted && (
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30"
            onClick={() => onEncourage(task)}
            title="Encourager"
          >
            <Heart className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TeamTaskCard;
