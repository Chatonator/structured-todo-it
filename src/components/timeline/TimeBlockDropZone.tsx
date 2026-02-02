import React from 'react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { TimeEvent, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { ScheduledEventCard } from './ScheduledEventCard';
import { format } from 'date-fns';

interface TimeBlockDropZoneProps {
  block: TimeBlock;
  date: Date;
  events: TimeEvent[];
  onDrop?: (taskId: string) => void;
  onRemoveEvent?: (eventId: string) => void;
  onCompleteEvent?: (eventId: string) => void;
  onEventClick?: (event: TimeEvent) => void;
  compact?: boolean;
  disabled?: boolean;
}

export const TimeBlockDropZone: React.FC<TimeBlockDropZoneProps> = ({
  block,
  date,
  events,
  onDrop,
  onRemoveEvent,
  onCompleteEvent,
  onEventClick,
  compact = false,
  disabled = false
}) => {
  const blockConfig = TIME_BLOCKS[block];
  const droppableId = `block-${format(date, 'yyyy-MM-dd')}-${block}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      type: 'time-block',
      block,
      date: date.toISOString()
    },
    disabled
  });

  const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);
  const completedCount = events.filter(e => e.status === 'completed').length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border transition-all",
        isOver && !disabled && "border-primary bg-primary/10",
        disabled ? "bg-muted/30 cursor-not-allowed" : "bg-card hover:border-muted-foreground/30",
        compact ? "p-1.5" : "p-2"
      )}
    >
      {/* Block header */}
      <div className={cn(
        "flex items-center justify-between mb-1",
        compact && "text-[10px]"
      )}>
        <div className="flex items-center gap-1">
          <span>{blockConfig.icon}</span>
          <span className={cn(
            "font-medium text-muted-foreground",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {blockConfig.label}
          </span>
        </div>
        {events.length > 0 && (
          <span className={cn(
            "text-muted-foreground",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {completedCount}/{events.length} • {Math.round(totalDuration / 60)}h
          </span>
        )}
      </div>

      {/* Events list */}
      <div className={cn("space-y-1", compact && "space-y-0.5")}>
        {events.length === 0 ? (
          <div className={cn(
            "border border-dashed rounded text-center text-muted-foreground/50",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            compact ? "py-2 text-[9px]" : "py-3 text-xs"
          )}>
            {disabled ? "—" : "Glissez une tâche ici"}
          </div>
        ) : (
          events.map(event => (
            <ScheduledEventCard
              key={event.id}
              event={event}
              onComplete={() => onCompleteEvent?.(event.id)}
              onRemove={() => onRemoveEvent?.(event.id)}
              onClick={() => onEventClick?.(event)}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TimeBlockDropZone;
