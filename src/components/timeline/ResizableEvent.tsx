import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { CheckCircle, GripVertical, Clock, MoreVertical } from 'lucide-react';
import { TimeEvent } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';
import { EventContextMenu } from './EventContextMenu';

interface ResizableEventProps {
  event: TimeEvent;
  topOffset: number;
  height: number;
  pixelsPerMinute: number;
  onComplete?: () => void;
  onUnschedule?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onResize?: (eventId: string, newDuration: number) => void;
  onClick?: () => void;
}

const MIN_HEIGHT = 15; // 15 minutes minimum
const SNAP_INTERVAL = 15; // Snap to 15 minute intervals

export const ResizableEvent: React.FC<ResizableEventProps> = ({
  event,
  topOffset,
  height,
  pixelsPerMinute,
  onComplete,
  onUnschedule,
  onEdit,
  onDelete,
  onResize,
  onClick
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHeight, setResizeHeight] = useState(height);
  const startYRef = useRef(0);
  const startHeightRef = useRef(height);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: {
      type: 'scheduled-event',
      event
    },
    disabled: isResizing
  });

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startHeightRef.current = height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const delta = currentY - startYRef.current;
      const newHeight = Math.max(startHeightRef.current + delta, MIN_HEIGHT * pixelsPerMinute);
      
      // Snap to 15 minute intervals
      const minutes = newHeight / pixelsPerMinute;
      const snappedMinutes = Math.round(minutes / SNAP_INTERVAL) * SNAP_INTERVAL;
      setResizeHeight(Math.max(snappedMinutes * pixelsPerMinute, MIN_HEIGHT * pixelsPerMinute));
    };

    const handleEnd = () => {
      setIsResizing(false);
      const newDuration = Math.max(Math.round(resizeHeight / pixelsPerMinute), MIN_HEIGHT);
      if (newDuration !== event.duration && onResize) {
        onResize(event.id, newDuration);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [height, pixelsPerMinute, event.id, event.duration, onResize, resizeHeight]);

  const style = {
    transform: CSS.Translate.toString(transform),
    top: `${topOffset}px`,
    height: `${Math.max(isResizing ? resizeHeight : height, 24)}px`,
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

  const displayHeight = isResizing ? resizeHeight : height;
  const displayDuration = isResizing 
    ? Math.max(Math.round(resizeHeight / pixelsPerMinute), MIN_HEIGHT)
    : event.duration;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute left-0 right-0 mx-1 rounded-md border-l-4 px-2 py-1 cursor-pointer transition-shadow overflow-hidden group",
        colorClass,
        isDragging && "opacity-50 z-50 shadow-lg",
        isResizing && "z-50 shadow-lg ring-2 ring-primary",
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
          
          {displayHeight >= 40 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              <span>{format(event.startsAt, 'HH:mm')}</span>
              <span>·</span>
              <span>{formatDuration(displayDuration)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
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
          
          <EventContextMenu
            event={event}
            onComplete={onComplete}
            onUnschedule={onUnschedule}
            onEdit={onEdit}
            onDelete={onDelete}
          >
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </EventContextMenu>
        </div>
      </div>

      {/* Resize handle */}
      {onResize && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "bg-gradient-to-t from-foreground/10 to-transparent",
            "hover:from-primary/30"
          )}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
};

export default ResizableEvent;
