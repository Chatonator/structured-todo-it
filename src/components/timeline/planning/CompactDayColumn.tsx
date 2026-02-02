import React from 'react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { format, isToday, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEvent } from '@/lib/time/types';
import { Progress } from '@/components/ui/progress';
import { formatDuration } from '@/lib/formatters';
import { Check, Clock } from 'lucide-react';

interface CompactDayColumnProps {
  date: Date;
  events: TimeEvent[];
  quota: number; // in minutes
  onEventClick?: (event: TimeEvent) => void;
  onCompleteEvent?: (eventId: string) => void;
}

/**
 * Colonne jour compacte pour la vue semaine
 * - En-tête minimaliste
 * - Zone de drop unique (pas de blocs matin/midi/soir)
 * - Affichage condensé des tâches
 */
export const CompactDayColumn: React.FC<CompactDayColumnProps> = ({
  date,
  events,
  quota,
  onEventClick,
  onCompleteEvent
}) => {
  const isCurrentDay = isToday(date);
  const isPastDay = isPast(date) && !isCurrentDay;
  const droppableId = `day-${format(date, 'yyyy-MM-dd')}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      type: 'day-column',
      date: date.toISOString()
    },
    disabled: isPastDay
  });

  // Calculate stats
  const totalScheduled = events.reduce((sum, e) => sum + e.duration, 0);
  const completedCount = events.filter(e => e.status === 'completed').length;
  const progressPercent = quota > 0 ? Math.min((totalScheduled / quota) * 100, 100) : 0;
  const isOverQuota = totalScheduled > quota;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border transition-all min-h-[300px]",
        isCurrentDay && "ring-2 ring-primary/40 border-primary/40",
        isPastDay && "opacity-60",
        isOver && !isPastDay && "border-primary bg-primary/5"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-3 py-2.5 border-b",
        isCurrentDay ? "bg-primary/10" : "bg-muted/30"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <div className={cn(
              "text-sm font-semibold capitalize",
              isCurrentDay && "text-primary"
            )}>
              {format(date, 'EEE', { locale: fr })}
            </div>
            <div className="text-xl font-bold">
              {format(date, 'd', { locale: fr })}
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {completedCount}/{events.length}
            </div>
            <div className={cn(
              "text-xs font-medium",
              isOverQuota ? "text-system-warning" : "text-muted-foreground"
            )}>
              {formatDuration(totalScheduled)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress 
          value={progressPercent} 
          className={cn(
            "h-1 mt-2",
            isOverQuota && "[&>div]:bg-system-warning"
          )}
        />
      </div>

      {/* Events list */}
      <div className="flex-1 p-2 space-y-1 overflow-hidden">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground/50">
              {isPastDay ? '—' : 'Glissez ici'}
            </p>
          </div>
        ) : (
          events
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
            .map(event => (
              <CompactEventItem
                key={event.id}
                event={event}
                onClick={() => onEventClick?.(event)}
                onComplete={() => onCompleteEvent?.(event.id)}
              />
            ))
        )}
      </div>
    </div>
  );
};

interface CompactEventItemProps {
  event: TimeEvent;
  onClick?: () => void;
  onComplete?: () => void;
}

const CompactEventItem: React.FC<CompactEventItemProps> = ({
  event,
  onClick,
  onComplete
}) => {
  const isCompleted = event.status === 'completed';

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 p-1.5 rounded-md border cursor-pointer transition-all",
        isCompleted 
          ? "bg-muted/50 border-muted" 
          : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
      )}
      onClick={onClick}
    >
      {/* Complete button */}
      <button
        className={cn(
          "shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
          isCompleted 
            ? "bg-system-success border-system-success text-white" 
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onComplete?.();
        }}
      >
        {isCompleted && <Check className="w-2.5 h-2.5" />}
      </button>

      {/* Title */}
      <span className={cn(
        "flex-1 text-xs truncate",
        isCompleted && "line-through text-muted-foreground"
      )}>
        {event.title}
      </span>

      {/* Duration */}
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
        <Clock className="w-2.5 h-2.5" />
        {formatDuration(event.duration)}
      </span>
    </div>
  );
};

export default CompactDayColumn;
