import React from 'react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { TimeEvent, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { ScheduledEventCard } from '../ScheduledEventCard';

interface TimeBlockRowProps {
  date: Date;
  events: TimeEvent[];
  onCompleteEvent?: (eventId: string) => void;
  onRemoveEvent?: (eventId: string) => void;
  onEventClick?: (event: TimeEvent) => void;
  disabled?: boolean;
}

/**
 * Blocs temporels en disposition horizontale pour la vue jour
 * Layout en 3 colonnes : Matin | Après-midi | Soir
 */
export const TimeBlockRow: React.FC<TimeBlockRowProps> = ({
  date,
  events,
  onCompleteEvent,
  onRemoveEvent,
  onEventClick,
  disabled = false
}) => {
  // Group events by time block
  const eventsByBlock = React.useMemo(() => {
    const grouped: Record<TimeBlock, TimeEvent[]> = {
      morning: [],
      afternoon: [],
      evening: []
    };

    events.forEach(event => {
      let block: TimeBlock = 'morning';
      
      if (event.timeBlock) {
        block = event.timeBlock;
      } else {
        const hour = event.startsAt.getHours();
        if (hour >= TIME_BLOCKS.evening.startHour) {
          block = 'evening';
        } else if (hour >= TIME_BLOCKS.afternoon.startHour) {
          block = 'afternoon';
        }
      }
      
      grouped[block].push(event);
    });

    // Sort by time within each block
    Object.values(grouped).forEach(blockEvents => {
      blockEvents.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });

    return grouped;
  }, [events]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {(['morning', 'afternoon', 'evening'] as TimeBlock[]).map(block => (
        <TimeBlockColumn
          key={block}
          block={block}
          date={date}
          events={eventsByBlock[block]}
          onCompleteEvent={onCompleteEvent}
          onRemoveEvent={onRemoveEvent}
          onEventClick={onEventClick}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

interface TimeBlockColumnProps {
  block: TimeBlock;
  date: Date;
  events: TimeEvent[];
  onCompleteEvent?: (eventId: string) => void;
  onRemoveEvent?: (eventId: string) => void;
  onEventClick?: (event: TimeEvent) => void;
  disabled?: boolean;
}

const TimeBlockColumn: React.FC<TimeBlockColumnProps> = ({
  block,
  date,
  events,
  onCompleteEvent,
  onRemoveEvent,
  onEventClick,
  disabled
}) => {
  const blockConfig = TIME_BLOCKS[block];
  const droppableId = `block-${date.toISOString().split('T')[0]}-${block}`;

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
        "flex flex-col rounded-xl border-2 border-dashed transition-all min-h-[200px]",
        isOver && !disabled && "border-primary bg-primary/5",
        disabled ? "bg-muted/20 border-muted" : "border-border hover:border-muted-foreground/40"
      )}
    >
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">{blockConfig.icon}</span>
          <div>
            <span className="font-semibold text-sm">{blockConfig.label}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {blockConfig.startHour}h - {blockConfig.endHour}h
            </span>
          </div>
        </div>
        {events.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {completedCount}/{events.length} • {Math.round(totalDuration / 60)}h
          </span>
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 p-3 space-y-2">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground/50 text-center">
              {disabled ? '—' : 'Glissez une tâche ici'}
            </p>
          </div>
        ) : (
          events.map(event => (
            <ScheduledEventCard
              key={event.id}
              event={event}
              onComplete={() => onCompleteEvent?.(event.id)}
              onRemove={() => onRemoveEvent?.(event.id)}
              onClick={() => onEventClick?.(event)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TimeBlockRow;
