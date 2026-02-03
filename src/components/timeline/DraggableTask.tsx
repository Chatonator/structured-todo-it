import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Folder, User, Users } from 'lucide-react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG } from '@/types/task';
import { formatDuration } from '@/lib/formatters';

interface DraggableTaskProps {
  task: Task;
  projectName?: string;
  onClick?: () => void;
}

export const DraggableTask: React.FC<DraggableTaskProps> = ({
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

  const categoryConfig = CATEGORY_CONFIG[task.category];
  const priorityConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;

  // Determine source type
  const isProjectTask = !!task.projectId;
  const isTeamTask = !!(task as any).teamId;
  const isFreeTask = !isProjectTask && !isTeamTask;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-2.5 rounded-lg border bg-card transition-all cursor-pointer",
        categoryConfig?.borderPattern,
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
          <p className="text-sm font-medium line-clamp-2 leading-tight">{task.name}</p>
          
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Source badge - NEW */}
            {isProjectTask && projectName && (
              <span className="flex items-center gap-0.5 text-[10px] bg-project/10 text-project px-1.5 py-0.5 rounded-full">
                <Folder className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{projectName}</span>
              </span>
            )}
            {isTeamTask && (
              <span className="flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                <Users className="w-2.5 h-2.5" />
                Équipe
              </span>
            )}
            {isFreeTask && (
              <span className="flex items-center gap-0.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                <User className="w-2.5 h-2.5" />
                Perso
              </span>
            )}

            {/* Duration */}
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              <span>{formatDuration(task.estimatedTime)}</span>
            </div>

            {/* Priority badge */}
            {priorityConfig && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                priorityConfig.color
              )}>
                {task.subCategory === 'Le plus important' ? '!!!' : 
                 task.subCategory === 'Important' ? '!!' :
                 task.subCategory === 'Peut attendre' ? '!' : '○'}
              </span>
            )}

            {/* Context badge */}
            <span className="text-[10px] text-muted-foreground">
              {task.context === 'Pro' ? '💼' : '🏠'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableTask;
