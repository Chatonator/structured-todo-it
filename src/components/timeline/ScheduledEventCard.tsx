import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TimeEvent } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';
import { Check, X, GripVertical, Clock, Folder, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduledEventCardProps {
  event: TimeEvent;
  onComplete?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

export const ScheduledEventCard: React.FC<ScheduledEventCardProps> = ({
  event,
  onComplete,
  onRemove,
  onClick,
  compact = false
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: {
      type: 'scheduled-event',
      event
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const isCompleted = event.status === 'completed';

  // Extract source info from event (could be enhanced with actual project name lookup)
  const isProjectTask = event.description?.includes('project:');
  const isTeamTask = event.description?.includes('team:');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-1 rounded border transition-all cursor-pointer",
        isCompleted ? "bg-muted/50 border-muted" : "bg-card border-border hover:border-primary/30",
        isDragging && "opacity-50 shadow-lg z-50",
        compact ? "p-1" : "p-1.5"
      )}
      onClick={onClick}
      {...attributes}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        className={cn(
          "cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground",
          compact && "hidden group-hover:block"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "flex items-center gap-1",
          compact ? "text-[10px]" : "text-xs"
        )}>
          <span className={cn(
            "font-medium truncate",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {event.title}
          </span>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 text-muted-foreground",
          compact ? "text-[9px]" : "text-[10px]"
        )}>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatDuration(event.duration)}
          </span>
          
          {/* Source indicator */}
          {isProjectTask && (
            <span className="flex items-center gap-0.5 text-project">
              <Folder className="w-2.5 h-2.5" />
            </span>
          )}
          {isTeamTask && (
            <span className="flex items-center gap-0.5 text-primary">
              <Users className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "flex items-center gap-0.5",
        compact && "opacity-0 group-hover:opacity-100"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full",
            compact ? "h-5 w-5" : "h-6 w-6",
            isCompleted && "text-system-success"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
        >
          <Check className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full text-muted-foreground hover:text-destructive",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
        >
          <X className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
        </Button>
      </div>
    </div>
  );
};

export default ScheduledEventCard;
