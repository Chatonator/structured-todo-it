import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TimeEvent, TIME_BLOCKS } from '@/lib/time/types';
import { ScheduledEventCard } from '../ScheduledEventCard';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface ScheduledEventsListProps {
  events: TimeEvent[];
  onEventClick?: (event: TimeEvent) => void;
  onUnschedule?: (eventId: string) => void;
  onComplete?: (eventId: string) => void;
  className?: string;
}

/**
 * Liste des événements planifiés groupés par date
 * Permet de visualiser et gérer les tâches déjà planifiées
 */
export const ScheduledEventsList: React.FC<ScheduledEventsListProps> = ({
  events,
  onEventClick,
  onUnschedule,
  onComplete,
  className
}) => {
  // Grouper par date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, TimeEvent[]>();
    
    // Trier les événements par date puis par bloc
    const sortedEvents = [...events].sort((a, b) => {
      const dateCompare = a.startsAt.getTime() - b.startsAt.getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Trier par bloc au sein d'une même date
      const blockOrder = { morning: 0, afternoon: 1, evening: 2 };
      const aBlock = a.timeBlock ? blockOrder[a.timeBlock] : 0;
      const bBlock = b.timeBlock ? blockOrder[b.timeBlock] : 0;
      return aBlock - bBlock;
    });

    sortedEvents.forEach(event => {
      const dateKey = format(event.startsAt, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(event);
    });

    return grouped;
  }, [events]);

  // Stats
  const completedCount = events.filter(e => e.status === 'completed').length;
  const totalTime = events.reduce((sum, e) => sum + e.duration, 0);
  const overdueCount = events.filter(e => 
    isPast(e.startsAt) && 
    e.status !== 'completed' &&
    !isToday(e.startsAt)
  ).length;

  const getDateLabel = (dateKey: string): string => {
    const date = new Date(dateKey);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return 'Demain';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  const isDateOverdue = (dateKey: string): boolean => {
    const date = new Date(dateKey);
    return isPast(date) && !isToday(date);
  };

  if (events.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">Aucune tâche planifiée</p>
        <p className="text-xs mt-1">Glissez des tâches pour les planifier</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stats header */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {completedCount}/{events.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(totalTime)}
          </span>
        </div>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="w-3 h-3" />
            {overdueCount} en retard
          </span>
        )}
      </div>

      {/* Events grouped by date */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4 pr-2">
          {Array.from(eventsByDate.entries()).map(([dateKey, dayEvents]) => {
            const overdue = isDateOverdue(dateKey);
            
            return (
              <div key={dateKey}>
                <div className={cn(
                  "flex items-center gap-2 mb-2 px-1",
                  overdue && "text-destructive"
                )}>
                  <Calendar className="w-3 h-3" />
                  <p className="text-xs font-medium capitalize">
                    {getDateLabel(dateKey)}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    ({dayEvents.length})
                  </span>
                  {overdue && (
                    <AlertTriangle className="w-3 h-3 ml-auto" />
                  )}
                </div>
                
                <div className="space-y-1.5">
                  {dayEvents.map(event => (
                    <ScheduledEventCard
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick?.(event)}
                      onRemove={() => onUnschedule?.(event.id)}
                      onComplete={() => onComplete?.(event.id)}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ScheduledEventsList;
