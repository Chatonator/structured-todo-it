import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, CheckCircle2, ChevronDown, Clock3, Edit3, Layers3, Pin, Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task, CATEGORY_DISPLAY_NAMES } from '@/types/task';
import { formatDuration } from '@/lib/formatters';
import { getCategoryClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { useViewport } from '@/contexts/ViewportContext';

interface BacklogTaskCardProps {
  task: Task;
  totalTime: number;
  isPinned: boolean;
  subTaskCount: number;
  isTeamTask?: boolean;
  schedule?: {
    date: Date;
    time?: string;
  } | null;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTogglePin: (taskId: string) => void;
  onCreateSubTask: (task: Task) => void;
}

export const BacklogTaskCard: React.FC<BacklogTaskCardProps> = ({
  task,
  totalTime,
  isPinned,
  subTaskCount,
  isTeamTask = false,
  schedule,
  onToggleComplete,
  onEdit,
  onDelete,
  onTogglePin,
  onCreateSubTask,
}) => {
  const { isPhone } = useViewport();
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryBadgeClass = getCategoryClasses(task.category, 'badge');
  const categoryBorderClass = getCategoryClasses(task.category, 'border');

  if (isPhone) {
    return (
      <article
        className={cn(
          'rounded-2xl border border-border border-l-4 bg-card px-3 py-3 shadow-sm transition-colors',
          categoryBorderClass,
          task.isCompleted && 'opacity-60'
        )}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleComplete(task.id)}
            className={cn(
              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
              task.isCompleted
                ? 'border-system-success bg-system-success text-white'
                : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
            )}
            aria-label={task.isCompleted ? 'Rouvrir la tâche' : 'Terminer la tâche'}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="flex min-w-0 flex-1 items-start gap-2 text-left"
            aria-expanded={isExpanded}
          >
            <div className="min-w-0 flex-1">
              <h3 className={cn('text-sm font-semibold leading-5 text-foreground', task.isCompleted && 'line-through')}>
                {task.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={cn('rounded-full border px-2 py-0.5 font-medium', categoryBadgeClass)}>
                  {CATEGORY_DISPLAY_NAMES[task.category]}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDuration(totalTime)}
                </span>
                {schedule && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(schedule.date, 'd MMM', { locale: fr })}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={cn('mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-3 pl-9">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full">
                {task.context}
              </Badge>
              {isTeamTask && (
                <Badge variant="outline" className="gap-1 rounded-full">
                  <Users className="h-3 w-3" />
                  Équipe
                </Badge>
              )}
              {isPinned && (
                <Badge variant="outline" className="gap-1 rounded-full text-primary">
                  <Pin className="h-3 w-3" />
                  Épinglée
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {subTaskCount > 0 && (
                <span className="flex items-center gap-1">
                  <Layers3 className="h-3.5 w-3.5" />
                  {subTaskCount} sous-tâche{subTaskCount > 1 ? 's' : ''}
                </span>
              )}
              {schedule && (
                <span className="flex items-center gap-1 text-primary">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(schedule.date, 'd MMM', { locale: fr })}
                  {schedule.time ? ` · ${schedule.time}` : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Button variant="ghost" size="icon" className={cn('h-9 w-9 rounded-full border', isPinned && 'text-primary')} onClick={() => onTogglePin(task.id)}>
                <Pin className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full" onClick={() => onEdit(task)}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Modifier
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => onCreateSubTask(task)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Sous-tâche
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-destructive" onClick={() => onDelete(task.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      className={cn(
        'rounded-2xl border border-border border-l-4 bg-card p-4 shadow-sm transition-colors',
        categoryBorderClass,
        task.isCompleted && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => onToggleComplete(task.id)}
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                task.isCompleted
                  ? 'border-system-success bg-system-success text-white'
                  : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
              )}
              aria-label={task.isCompleted ? 'Rouvrir la tâche' : 'Terminer la tâche'}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h3 className={cn('text-sm font-semibold leading-5 text-foreground', task.isCompleted && 'line-through')}>
                {task.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={cn('rounded-full border', categoryBadgeClass)}>
                  {CATEGORY_DISPLAY_NAMES[task.category]}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {task.context}
                </Badge>
                {isTeamTask && (
                  <Badge variant="outline" className="gap-1 rounded-full">
                    <Users className="h-3 w-3" />
                    Équipe
                  </Badge>
                )}
                {isPinned && (
                  <Badge variant="outline" className="gap-1 rounded-full text-primary">
                    <Pin className="h-3 w-3" />
                    Épinglée
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatDuration(totalTime)}
            </span>
            {subTaskCount > 0 && (
              <span className="flex items-center gap-1">
                <Layers3 className="h-3.5 w-3.5" />
                {subTaskCount} sous-tâche{subTaskCount > 1 ? 's' : ''}
              </span>
            )}
            {schedule && (
              <span className="flex items-center gap-1 text-primary">
                <Calendar className="h-3.5 w-3.5" />
                {format(schedule.date, 'd MMM', { locale: fr })}
                {schedule.time ? ` · ${schedule.time}` : ''}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9 rounded-full', isPinned && 'text-primary')}
          onClick={() => onTogglePin(task.id)}
          aria-label={isPinned ? 'Retirer l\'épingle' : 'Épingler'}
        >
          <Pin className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => onEdit(task)}>
          <Edit3 className="mr-1.5 h-3.5 w-3.5" />
          Modifier
        </Button>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => onCreateSubTask(task)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Sous-tâche
        </Button>
        <Button variant="outline" size="sm" className="rounded-full text-destructive" onClick={() => onDelete(task.id)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Supprimer
        </Button>
      </div>
    </article>
  );
};

export default BacklogTaskCard;
