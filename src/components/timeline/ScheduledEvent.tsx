import React from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { CheckCircle, GripVertical, Clock } from 'lucide-react';
import { TimeEvent } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';

interface ScheduledEventProps {
  event: TimeEvent;
  topOffset: number; // Position from top in pixels
  height: number; // Height in pixels
  onComplete?: () => void;
  onClick?: () => void;
}

export const ScheduledEvent: React.FC<ScheduledEventProps> = ({
  event,
  topOffset,
  height,
  onComplete,
  onClick
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
    top: `${topOffset}px`,
    height: `${Math.max(height, 24)}px`,
  };

  const isCompleted = event.status === 'completed';
  const priorityColors: Record<number, string> = {
    4: 'bg-priority-highest/20 border-l-priority-highest',
    3: 'bg-priority-high/20 border-l-priority-high',
    2: 'bg-priority-medium/20 border-l-priority-medium',
    1: 'bg-priority-low/20 border-l-priority-low',
  };

  const colorClass = event.priority 
    ? priorityColors[event.priority] || 'bg-primary/20 border-l-primary'
    : 'bg-primary/20 border-l-primary';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute left-0 right-0 mx-1 rounded-md border-l-4 px-2 py-1 cursor-pointer transition-all overflow-hidden",
        colorClass,
        isDragging && "opacity-50 z-50 shadow-lg",
        isCompleted && "opacity-60"
      )}
      onClick={onClick}
      {...attributes}
    >
      <div className="flex items-start gap-1">
        <button
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xs font-medium truncate",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {event.title}
            </span>
            {isCompleted && (
              <CheckCircle className="w-3 h-3 text-system-success flex-shrink-0" />
            )}
          </div>
          
          {height >= 40 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>{format(event.startsAt, 'HH:mm')}</span>
              <span>·</span>
              <span>{formatDuration(event.duration)}</span>
            </div>
          )}
        </div>
        
        {onComplete && !isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="p-0.5 rounded hover:bg-system-success/20 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-system-success" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduledEvent;
