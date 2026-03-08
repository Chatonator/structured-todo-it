import React from 'react';
import { Clock, X, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/primitives/badges/CategoryBadge';
import { PriorityBadge } from '@/components/primitives/badges/PriorityBadge';
import { ContextBadge } from '@/components/primitives/badges/ContextBadge';
import { getCategoryIndicatorColor } from '@/lib/styling';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';

export type TaskRowVariant = 'default' | 'compact' | 'chip';

export interface TaskRowProps {
  task: Pick<Task, 'id' | 'name' | 'category' | 'context' | 'estimatedTime' | 'isCompleted'> & {
    subCategory?: Task['subCategory'];
  };
  variant?: TaskRowVariant;
  showCategory?: boolean;
  showPriority?: boolean;
  showContext?: boolean;
  showDuration?: boolean;
  showCategoryBar?: boolean;
  onClick?: (id: string) => void;
  onRemove?: (id: string) => void;
  actionSlot?: React.ReactNode;
  className?: string;
}

/**
 * Composant d'affichage de ligne de tâche unifié.
 * Utilisé dans TaskLinker, Rule135, Observatory, etc.
 */
export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  variant = 'default',
  showCategory = true,
  showPriority = true,
  showContext = true,
  showDuration = true,
  showCategoryBar = true,
  onClick,
  onRemove,
  actionSlot,
  className,
}) => {
  const isChip = variant === 'chip';
  const isCompact = variant === 'compact';

  if (isChip) {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2",
        className
      )}>
        {showCategoryBar && (
          <div className={cn("w-1 self-stretch rounded-full shrink-0", getCategoryIndicatorColor(task.category))} />
        )}
        <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={cn("text-sm truncate", task.isCompleted && "line-through text-muted-foreground")}>
            {task.name}
          </span>
          {showContext && <ContextBadge context={task.context} size="sm" showLabel={false} />}
          {showCategory && <CategoryBadge category={task.category} size="sm" />}
          {showPriority && task.subCategory && <PriorityBadge priority={task.subCategory} size="sm" />}
          {showDuration && task.estimatedTime > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
              <Clock className="w-3 h-3" />
              {formatDuration(task.estimatedTime)}
            </span>
          )}
        </div>
        {actionSlot}
        {onRemove && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(task.id)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }

  // default & compact
  return (
    <button
      className={cn(
        "w-full text-left rounded-md hover:bg-accent transition-colors flex items-center gap-2",
        isCompact ? "p-2" : "p-2.5",
        className
      )}
      onClick={() => onClick?.(task.id)}
      type="button"
    >
      {showCategoryBar && (
        <div className={cn(
          "self-stretch rounded-full shrink-0",
          isCompact ? "w-0.5" : "w-1",
          getCategoryIndicatorColor(task.category)
        )} />
      )}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate",
          isCompact ? "text-xs" : "text-sm",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </div>
        {showDuration && task.estimatedTime > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDuration(task.estimatedTime)}
          </div>
        )}
      </div>
      {showContext && <ContextBadge context={task.context} size="sm" showLabel={false} />}
      {showCategory && <CategoryBadge category={task.category} size="sm" />}
      {showPriority && task.subCategory && <PriorityBadge priority={task.subCategory} size="sm" />}
      {actionSlot}
    </button>
  );
};

export default TaskRow;
