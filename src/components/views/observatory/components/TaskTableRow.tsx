import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Trash2, 
  RotateCcw,
  Ghost,
  Pin,
  FolderKanban
} from 'lucide-react';
import { EnrichedTask } from '@/hooks/view-data/useObservatoryViewData';
import { CATEGORY_DISPLAY_NAMES, CONTEXT_CONFIG } from '@/types/task';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TaskTableRowProps {
  task: EnrichedTask;
  isSelected: boolean;
  showRestore: boolean;
  onToggleSelection: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onRestore: (taskId: string) => void;
}

const getCategoryBadgeClass = (category: string): string => {
  switch (category) {
    case 'Obligation':
      return 'bg-category-obligation/10 text-category-obligation border-category-obligation/30';
    case 'Quotidien':
      return 'bg-category-quotidien/10 text-category-quotidien border-category-quotidien/30';
    case 'Envie':
      return 'bg-category-envie/10 text-category-envie border-category-envie/30';
    default:
      return 'bg-category-autres/10 text-category-autres border-category-autres/30';
  }
};

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  isSelected,
  showRestore,
  onToggleSelection,
  onComplete,
  onDelete,
  onRestore,
}) => {
  return (
    <div 
      className={cn(
        "grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-muted/50 transition-colors group",
        task.isZombie && !task.isCompleted && "bg-destructive/5",
        task.isCompleted && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <div className="col-span-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(task.id)}
        />
      </div>

      {/* Name */}
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        {task.isZombie && !task.isCompleted && (
          <Ghost className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
        )}
        <span className={cn(
          "truncate text-sm",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </span>
      </div>

      {/* Category */}
      <div className="col-span-2 hidden sm:block">
        <Badge 
          variant="outline" 
          className={cn("text-[10px] px-1.5 py-0", getCategoryBadgeClass(task.category))}
        >
          {CATEGORY_DISPLAY_NAMES[task.category]}
        </Badge>
      </div>

      {/* Context */}
      <div className="col-span-1 hidden md:block">
        <span className="text-xs">
          {task.context === 'Pro' ? '💼' : '🏠'}
        </span>
      </div>

      {/* Age */}
      <div className="col-span-1">
        <span className={cn(
          "text-xs",
          task.isZombie && !task.isCompleted ? "text-destructive font-medium" : "text-muted-foreground"
        )}>
          {task.ageLabel}
        </span>
      </div>

      {/* Duration */}
      <div className="col-span-1 hidden lg:block">
        <span className="text-xs text-muted-foreground">
          {formatDuration(task.estimatedTime)}
        </span>
      </div>

      {/* Project */}
      <div className="col-span-2 hidden lg:block">
        {task.projectName ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FolderKanban className="w-3 h-3" />
            <span className="truncate">{task.projectName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showRestore ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRestore(task.id)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        ) : (
          !task.isCompleted && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-green-600 hover:text-green-700"
              onClick={() => onComplete(task.id)}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default TaskTableRow;
