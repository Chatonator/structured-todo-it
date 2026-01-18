import React from 'react';
import { Task } from '@/types/task';
import { CategoryBadge } from '@/components/primitives/badges';
import { formatDuration } from '@/lib/formatters';
import { getCategoryClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';
import { CheckSquare, Clock, Pin } from 'lucide-react';

export interface TaskCardProps {
  task: Task;
  /** Temps total (incluant sous-tâches) */
  totalTime?: number;
  /** Variante d'affichage */
  variant?: 'default' | 'compact' | 'minimal';
  /** Afficher le badge de catégorie */
  showCategory?: boolean;
  /** Afficher la durée */
  showDuration?: boolean;
  /** Afficher l'indicateur de pin */
  showPinned?: boolean;
  /** Est épinglé */
  isPinned?: boolean;
  /** Handler de clic */
  onClick?: (task: Task) => void;
  className?: string;
}

/**
 * Carte de tâche réutilisable
 * Utilisée dans HomeView, TasksView, EisenhowerView, etc.
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  totalTime,
  variant = 'default',
  showCategory = true,
  showDuration = true,
  showPinned = false,
  isPinned = false,
  onClick,
  className
}) => {
  const displayTime = totalTime ?? task.estimatedTime;
  const isClickable = !!onClick;

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors",
          isClickable && "cursor-pointer",
          task.isCompleted && "opacity-50",
          className
        )}
        onClick={() => onClick?.(task)}
      >
        <CheckSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className={cn(
          "text-sm truncate flex-1",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors",
          isClickable && "cursor-pointer",
          task.isCompleted && "opacity-60",
          className
        )}
        onClick={() => onClick?.(task)}
      >
        <CheckSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium text-foreground truncate",
            task.isCompleted && "line-through"
          )}>
            {task.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {showCategory && (
              <CategoryBadge category={task.category} size="sm" />
            )}
            {showDuration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(displayTime)}
              </span>
            )}
          </div>
        </div>
        {showPinned && isPinned && (
          <Pin className="w-3.5 h-3.5 text-pinned flex-shrink-0" />
        )}
      </div>
    );
  }

  // Default variant - full card with border
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 bg-card border rounded-lg transition-all duration-200",
        "border-l-4",
        getCategoryClasses(task.category, 'border'),
        isClickable && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        task.isCompleted && "opacity-60",
        isPinned && "ring-1 ring-pinned/30",
        className
      )}
      onClick={() => onClick?.(task)}
    >
      <CheckSquare 
        className={cn(
          "w-5 h-5 mt-0.5 flex-shrink-0",
          task.isCompleted ? "text-system-success" : "text-muted-foreground"
        )} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-medium text-foreground",
            task.isCompleted && "line-through"
          )}>
            {task.name}
          </p>
          {showPinned && isPinned && (
            <Pin className="w-4 h-4 text-pinned flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {showCategory && (
            <CategoryBadge category={task.category} size="sm" />
          )}
          {showDuration && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(displayTime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
