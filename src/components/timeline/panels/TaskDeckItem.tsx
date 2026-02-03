import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, Folder } from 'lucide-react';
import { Task, SUB_CATEGORY_CONFIG } from '@/types/task';
import { formatDuration } from '@/lib/formatters';
import { 
  getCategoryIndicatorColor, 
  getPriorityClasses, 
  getPriorityShortLabel,
  getContextIcon 
} from '@/lib/styling';

interface TaskDeckItemProps {
  task: Task;
  projectName?: string;
  onClick?: () => void;
}

/**
 * Item de tâche simplifié pour les decks
 * - Barre colorée selon catégorie
 * - Badge de priorité avec couleurs
 * - Affichage compact avec durée
 * - Texte justifié sur 2 lignes max
 */
export const TaskDeckItem: React.FC<TaskDeckItemProps> = ({
  task,
  projectName,
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

  // Couleurs et configs
  const categoryColor = getCategoryIndicatorColor(task.category);
  const priorityConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
  const priorityBadgeClasses = getPriorityClasses(task.subCategory, 'badge');
  const priorityLabel = getPriorityShortLabel(task.subCategory);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 p-2 rounded-md bg-card border transition-all cursor-pointer",
        isDragging && "opacity-50 shadow-lg z-50",
        "hover:shadow-sm hover:bg-accent/50"
      )}
      onClick={onClick}
      {...attributes}
    >
      {/* Barre catégorie */}
      <div className={cn("w-1 self-stretch rounded-full shrink-0", categoryColor)} />

      {/* Drag handle - visible on hover */}
      <button
        {...listeners}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">{task.name}</p>
        
        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {/* Badge priorité coloré */}
          {priorityConfig && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              priorityBadgeClasses
            )}>
              {priorityLabel} {task.subCategory}
            </span>
          )}

          {/* Projet si applicable */}
          {task.projectId && projectName && (
            <span className="flex items-center gap-0.5 text-[10px] bg-project/10 text-project px-1.5 py-0.5 rounded-full">
              <Folder className="w-2.5 h-2.5" />
              <span className="truncate max-w-[60px]">{projectName}</span>
            </span>
          )}

          {/* Durée */}
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="w-2.5 h-2.5" />
            {formatDuration(task.estimatedTime)}
          </span>

          {/* Contexte emoji */}
          <span className="text-[10px]">
            {getContextIcon(task.context)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskDeckItem;
