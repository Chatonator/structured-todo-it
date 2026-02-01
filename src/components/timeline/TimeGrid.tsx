import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, isSameDay, startOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEvent } from '@/lib/time/types';
import { TimeSlot } from './TimeSlot';
import { ScheduledEvent } from './ScheduledEvent';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

interface TimeGridProps {
  selectedDate: Date;
  viewMode: 'day' | 'week';
  events: TimeEvent[];
  onCompleteEvent?: (eventId: string) => void;
  onEventClick?: (event: TimeEvent) => void;
  onSlotClick?: (date: Date, hour: number, minute: number) => void;
  className?: string;
}

const START_HOUR = 6;
const END_HOUR = 22;
const PIXELS_PER_MINUTE = 1; // 1px per minute = 60px per hour
const SLOT_INTERVAL = 15; // 15 minute slots

export const TimeGrid: React.FC<TimeGridProps> = ({
  selectedDate,
  viewMode,
  events,
  onCompleteEvent,
  onEventClick,
  onSlotClick,
  className
}) => {
  // Generate hours array
  const hours = useMemo(() => {
    const h = [];
    for (let i = START_HOUR; i < END_HOUR; i++) {
      h.push(i);
    }
    return h;
  }, []);

  // Generate days array for week view
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [startOfDay(selectedDate)];
    }
    const d = [];
    const start = startOfDay(selectedDate);
    for (let i = 0; i < 7; i++) {
      d.push(addDays(start, i));
    }
    return d;
  }, [selectedDate, viewMode]);

  // Calculate event position and height
  const getEventStyle = (event: TimeEvent) => {
    const eventHour = event.startsAt.getHours();
    const eventMinute = event.startsAt.getMinutes();
    const minutesFromStart = (eventHour - START_HOUR) * 60 + eventMinute;
    const topOffset = minutesFromStart * PIXELS_PER_MINUTE;
    const height = event.duration * PIXELS_PER_MINUTE;
    return { topOffset, height };
  };

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, TimeEvent[]>();
    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped.set(dayKey, events.filter(e => isSameDay(e.startsAt, day)));
    });
    return grouped;
  }, [events, days]);

  const gridHeight = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE;

  return (
    <div className={cn("flex flex-col border rounded-lg bg-card overflow-hidden", className)}>
      {/* Day headers for week view */}
      {viewMode === 'week' && (
        <div className="flex border-b bg-muted/30">
          <div className="w-14 flex-shrink-0" /> {/* Gutter spacer */}
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 py-2 px-1 text-center border-l",
                isSameDay(day, new Date()) && "bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div className={cn(
                "text-sm font-medium",
                isSameDay(day, new Date()) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid content */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Time gutter */}
        <div className="w-14 flex-shrink-0 bg-muted/20">
          {hours.map(hour => (
            <div
              key={hour}
              className="h-[60px] flex items-start justify-end pr-2 pt-0"
              style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}
            >
              <span className="text-xs text-muted-foreground -mt-2">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className={cn(
          "flex-1 flex",
          viewMode === 'week' && "divide-x"
        )}>
          {days.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(dayKey) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={cn(
                  "flex-1 relative",
                  isToday && "bg-primary/5"
                )}
                style={{ height: `${gridHeight}px` }}
              >
                {/* Time slots */}
                {hours.map(hour => (
                  <div key={hour} className="relative" style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}>
                    {[0, 15, 30, 45].map(minute => (
                      <TimeSlot
                        key={`${hour}-${minute}`}
                        hour={hour}
                        minute={minute}
                        date={day}
                        onClick={() => onSlotClick?.(day, hour, minute)}
                      />
                    ))}
                  </div>
                ))}

                {/* Scheduled events */}
                {dayEvents.map(event => {
                  const { topOffset, height } = getEventStyle(event);
                  return (
                    <ScheduledEvent
                      key={event.id}
                      event={event}
                      topOffset={topOffset}
                      height={height}
                      onComplete={() => onCompleteEvent?.(event.id)}
                      onClick={() => onEventClick?.(event)}
                    />
                  );
                })}

                {/* Current time indicator */}
                {isToday && (
                  <CurrentTimeIndicator
                    startHour={START_HOUR}
                    pixelsPerMinute={PIXELS_PER_MINUTE}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeGrid;
