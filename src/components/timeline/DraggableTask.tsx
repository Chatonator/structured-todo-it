import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock } from 'lucide-react';
import { Task, SUB_CATEGORY_CONFIG } from '@/types/task';
import { formatDuration } from '@/lib/formatters';
import { 
  getCategoryIndicatorColor, 
  getPriorityClasses, 
  getPriorityShortLabel,
  getContextIcon 
} from '@/lib/styling';

interface DraggableTaskProps {
  task: Task;
  onClick?: () => void;
}

export const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  onClick
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'unscheduled-task',
      task
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const priorityConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
  const categoryColor = getCategoryIndicatorColor(task.category);
  const priorityBadgeClasses = getPriorityClasses(task.subCategory, 'badge');
  const priorityLabel = getPriorityShortLabel(task.subCategory);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-2.5 rounded-lg border bg-card transition-all cursor-pointer",
        isDragging && "opacity-50 shadow-lg z-50",
        "hover:shadow-md hover:border-primary/30"
      )}
      onClick={onClick}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        {/* Barre catégorie plus épaisse */}
        <div className={cn("w-1.5 self-stretch rounded-full shrink-0", categoryColor)} />

        <button
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2 leading-tight">{task.name}</p>
          
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Priority badge - symbole seulement */}
            {priorityConfig && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                priorityBadgeClasses
              )}>
                {priorityLabel}
              </span>
            )}

            {/* Duration */}
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              <span>{formatDuration(task.estimatedTime)}</span>
            </div>

            {/* Context emoji only */}
            <span className="text-[10px]">
              {getContextIcon(task.context)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableTask;
