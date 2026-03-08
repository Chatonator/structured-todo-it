import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MoreHorizontal, HelpCircle, Heart, UserCircle, Clock, UserPlus, AlertTriangle, CalendarClock, ShieldAlert, ShieldCheck, Eye, EyeOff, Hand, MessageCircle, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/formatters';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TeamTask } from '@/hooks/useTeamTasks';
import type { TeamMember } from '@/hooks/useTeams';
import type { TeamLabel } from '@/hooks/useTeamLabels';

interface TeamTaskCardProps {
  task: TeamTask;
  members: TeamMember[];
  currentUserId: string | null;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAssign: (taskId: string, userId: string | null) => void;
  onAssignToMe: (taskId: string) => void;
  onRequestHelp: (task: TeamTask) => void;
  onEncourage: (task: TeamTask) => void;
  onBlockTask: (taskId: string, reason: string) => void;
  onUnblockTask: (taskId: string) => void;
  onToggleWatch: (taskId: string) => void;
  watchedByMe: boolean;
  // Labels
  taskLabels: TeamLabel[];
  allLabels: TeamLabel[];
  onToggleLabel: (taskId: string, labelId: string) => void;
  hasLabel: (taskId: string, labelId: string) => boolean;
  // Comments
  commentCount: number;
  onOpenComments: (task: TeamTask) => void;
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const TeamTaskCard: React.FC<TeamTaskCardProps> = ({
  task, members, currentUserId,
  onToggleComplete, onAssign, onAssignToMe, onRequestHelp, onEncourage,
  onBlockTask, onUnblockTask, onToggleWatch, watchedByMe,
  taskLabels, allLabels, onToggleLabel, hasLabel,
  commentCount, onOpenComments, can,
}) => {
  const [blockReason, setBlockReason] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);

  const assignedMember = members.find(m => m.user_id === task.assigned_to);
  const isAssignedToMe = task.assigned_to === currentUserId;
  const isAssignedToOther = !!task.assigned_to && !isAssignedToMe;
  const isUnassigned = !task.assigned_to;

  const handleSubmitBlock = () => {
    if (blockReason.trim()) {
      onBlockTask(task.id, blockReason.trim());
      setBlockReason('');
      setShowBlockInput(false);
    }
  };

  return (
    <div className={cn(
      "group flex items-center gap-2 p-2 rounded-lg border bg-card transition-all hover:shadow-sm relative",
      task.isCompleted && "opacity-50",
      task.is_blocked && "border-destructive/40 bg-destructive/5"
    )}>
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
        className="flex-shrink-0"
      />

      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
        <p className={cn(
          "text-sm font-medium truncate",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </p>

        {/* Labels */}
        {taskLabels.map(label => (
          <span
            key={label.id}
            className="inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-semibold border"
            style={{
              backgroundColor: label.color + '20',
              color: label.color,
              borderColor: label.color + '40',
            }}
          >
            {label.name}
          </span>
        ))}

        {/* Blocked badge */}
        {task.is_blocked && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 gap-0.5">
                  <ShieldAlert className="w-3 h-3" />
                  Bloqué
                </Badge>
              </TooltipTrigger>
              {task.blocked_reason && (
                <TooltipContent>
                  <p className="text-xs">{task.blocked_reason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}

        {watchedByMe && <Eye className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />}
      </div>

      {/* Comment counter */}
      {commentCount > 0 && (
        <button
          onClick={() => onOpenComments(task)}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {commentCount}
        </button>
      )}

      {/* Self-assign button for unassigned tasks */}
      {isUnassigned && !task.isCompleted && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAssignToMe(task.id)}
                className="h-6 px-1.5 flex items-center gap-1 rounded-md text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">S'attribuer</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>S'attribuer cette tâche</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Assigned avatar */}
      {assignedMember ? (
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarFallback className={cn(
            "text-[9px]",
            isAssignedToMe ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {getInitials(assignedMember.profiles?.display_name)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      {/* Deadline badge */}
      {task.scheduledDate && !task.isCompleted && (() => {
        const scheduled = task.scheduledDate instanceof Date ? task.scheduledDate : new Date(String(task.scheduledDate) + 'T00:00:00');
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

      {/* Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent flex-shrink-0">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* Comment */}
          <DropdownMenuItem onClick={() => onOpenComments(task)}>
            <MessageCircle className="w-4 h-4 mr-2 text-muted-foreground" />
            Commentaires{commentCount > 0 ? ` (${commentCount})` : ''}
          </DropdownMenuItem>

          {/* Labels submenu */}
          {allLabels.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                Labels
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {allLabels.map(label => (
                  <DropdownMenuItem
                    key={label.id}
                    onClick={() => onToggleLabel(task.id, label.id)}
                    className="gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                    {hasLabel(task.id, label.id) && (
                      <span className="ml-auto text-primary text-xs">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />

          {/* Assign */}
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

          <DropdownMenuSeparator />

          {/* Block / Unblock */}
          {!task.is_blocked ? (
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowBlockInput(true); }}>
              <ShieldAlert className="w-4 h-4 mr-2 text-destructive" />
              Signaler un blocage
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onUnblockTask(task.id)}>
              <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
              Débloquer
            </DropdownMenuItem>
          )}

          {/* Watch */}
          <DropdownMenuItem onClick={() => onToggleWatch(task.id)}>
            {watchedByMe ? (
              <><EyeOff className="w-4 h-4 mr-2 text-muted-foreground" />Ne plus suivre</>
            ) : (
              <><Eye className="w-4 h-4 mr-2 text-primary" />Suivre cette tâche</>
            )}
          </DropdownMenuItem>

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

      {/* Block reason input */}
      {showBlockInput && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg p-3 w-64" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-medium mb-2">Raison du blocage</p>
          <Input
            autoFocus
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            placeholder="Ex: en attente du client..."
            className="text-xs h-8 mb-2"
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmitBlock();
              if (e.key === 'Escape') setShowBlockInput(false);
            }}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowBlockInput(false)}>
              Annuler
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmitBlock} disabled={!blockReason.trim()}>
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamTaskCard;
