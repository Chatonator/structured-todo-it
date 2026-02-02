import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical } from 'lucide-react';
import { Task, SUB_CATEGORY_CONFIG } from '@/types/task';
import { formatDuration } from '@/lib/formatters';

interface TaskDeckItemProps {
  task: Task;
  onClick?: () => void;
}

/**
 * Item de tâche simplifié pour les decks
 * - Bordure gauche colorée selon priorité
 * - Affichage compact avec durée
 * - Expansion au hover
 */
export const TaskDeckItem: React.FC<TaskDeckItemProps> = ({
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

  // Couleur de bordure selon priorité
  const priorityConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
  const priorityBorder = priorityConfig?.pattern || 'border-l-4 border-l-muted';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-2 rounded-md bg-card border transition-all cursor-pointer",
        priorityBorder,
        isDragging && "opacity-50 shadow-lg z-50",
        "hover:shadow-sm hover:bg-accent/50"
      )}
      onClick={onClick}
      {...attributes}
    >
      {/* Drag handle - visible on hover */}
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{task.name}</p>
      </div>

      {/* Duration - always visible */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Clock className="w-3 h-3" />
        <span>{formatDuration(task.estimatedTime)}</span>
      </div>

      {/* Context emoji */}
      <span className="text-xs shrink-0">
        {task.context === 'Pro' ? '💼' : '🏠'}
      </span>
    </div>
  );
};

export default TaskDeckItem;
