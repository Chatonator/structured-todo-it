import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Calendar } from 'lucide-react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { formatDuration } from '@/lib/formatters';

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

  const categoryConfig = CATEGORY_CONFIG[task.category];
  const priorityConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-3 rounded-lg border bg-card transition-all cursor-pointer",
        categoryConfig.borderPattern,
        isDragging && "opacity-50 shadow-lg z-50",
        "hover:shadow-md hover:border-primary/30"
      )}
      onClick={onClick}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.name}</p>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Duration */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(task.estimatedTime)}</span>
            </div>

            {/* Priority badge */}
            {priorityConfig && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                priorityConfig.color
              )}>
                {task.subCategory === 'Le plus important' ? 'Crucial' : 
                 task.subCategory === 'Important' ? 'Important' :
                 task.subCategory === 'Peut attendre' ? 'Normal' : 'Optionnel'}
              </span>
            )}

            {/* Context badge */}
            <span className="text-[10px] text-muted-foreground">
              {task.context === 'Pro' ? '💼' : '🏠'}
            </span>
          </div>
        </div>

        {/* Quick schedule icon */}
        <button
          className="p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default DraggableTask;
