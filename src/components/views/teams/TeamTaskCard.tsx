import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MoreHorizontal, HelpCircle, Heart, UserCircle, Clock, UserPlus, AlertTriangle, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/formatters';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
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

export const TeamTaskCard: React.FC<TeamTaskCardProps> = ({
  task, members, currentUserId,
  onToggleComplete, onAssign, onRequestHelp, onEncourage
}) => {
  const assignedMember = members.find(m => m.user_id === task.assigned_to);
  const isAssignedToMe = task.assigned_to === currentUserId;
  const isAssignedToOther = !!task.assigned_to && !isAssignedToMe;

  return (
    <div className={cn(
      "group flex items-center gap-2 p-2 rounded-lg border bg-card transition-all hover:shadow-sm",
      task.isCompleted && "opacity-50"
    )}>
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <p className={cn(
          "text-sm font-medium truncate",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </p>
      </div>

      {/* Assigned avatar indicator (read-only) */}
      {assignedMember ? (
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarFallback className={cn(
            "text-[9px]",
            isAssignedToMe ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {getInitials(assignedMember.profiles?.display_name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <UserCircle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
      )}

      {/* Deadline badge */}
      {task.scheduledDate && !task.isCompleted && (() => {
        const scheduled = new Date(task.scheduledDate + 'T00:00:00');
        const overdue = isBefore(scheduled, startOfDay(new Date()));
        const today = isToday(scheduled);
        if (overdue) {
          return (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              En retard
            </Badge>
          );
        }
        if (today) {
          return (
            <Badge className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 gap-0.5 bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/20">
              <CalendarClock className="w-3 h-3" />
              Aujourd'hui
            </Badge>
          );
        }
        return (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
            <CalendarClock className="w-3 h-3" />
            {format(scheduled, 'd MMM', { locale: fr })}
          </span>
        );
      })()}

      {/* Duration */}
      {task.estimatedTime > 0 && (
        <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
          <Clock className="w-3 h-3" />
          {formatDuration(task.estimatedTime)}
        </span>
      )}

      {/* Unified context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent flex-shrink-0">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="w-4 h-4 mr-2 text-muted-foreground" />
              Assigner à…
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
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
                  <Avatar className="h-4 w-4 mr-2">
                    <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                      {getInitials(m.profiles?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {m.profiles?.display_name || 'Membre'}
                  {m.user_id === currentUserId && <span className="ml-1 text-xs text-muted-foreground">(moi)</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {(isAssignedToMe || !task.assigned_to) && !task.isCompleted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRequestHelp(task)}>
                <HelpCircle className="w-4 h-4 mr-2 text-amber-500" />
                Demander de l'aide
              </DropdownMenuItem>
            </>
          )}

          {isAssignedToOther && !task.isCompleted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEncourage(task)}>
                <Heart className="w-4 h-4 mr-2 text-pink-500" />
                Encourager
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TeamTaskCard;
