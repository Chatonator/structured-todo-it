import React from 'react';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEvent } from '@/lib/time/types';
import { CompactDayColumn } from './CompactDayColumn';

interface WeekPlanningViewProps {
  startDate: Date;
  eventsByDay: Map<string, TimeEvent[]>;
  quotaByDay?: Map<string, number>;
  defaultQuota?: number;
  onEventClick?: (event: TimeEvent) => void;
  onCompleteEvent?: (eventId: string) => void;
}

/**
 * Vue semaine épurée
 * - 7 colonnes compactes
 * - Pas de blocs matin/midi/soir
 * - Affichage liste condensée
 */
export const WeekPlanningView: React.FC<WeekPlanningViewProps> = ({
  startDate,
  eventsByDay,
  quotaByDay,
  defaultQuota = 240, // 4 hours default
  onEventClick,
  onCompleteEvent
}) => {
  // Generate 7 days starting from startDate
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  // Get week number
  const weekNumber = format(startDate, 'w');

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-semibold">
          Semaine {weekNumber}
        </h3>
        <p className="text-sm text-muted-foreground">
          {format(startDate, 'd MMM', { locale: fr })} - {format(addDays(startDate, 6), 'd MMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(dayKey) || [];
          const dayQuota = quotaByDay?.get(dayKey) ?? defaultQuota;

          return (
            <CompactDayColumn
              key={dayKey}
              date={day}
              events={dayEvents}
              quota={dayQuota}
              onEventClick={onEventClick}
              onCompleteEvent={onCompleteEvent}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WeekPlanningView;
