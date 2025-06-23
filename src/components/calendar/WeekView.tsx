
import React from 'react';
import { CalendarEvent, CALENDAR_HOURS } from '@/types/task';
import { CalendarEventComponent } from './CalendarEvent';
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick
}) => {
  const weekStart = startOfWeek(currentDate, { locale: fr });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date));
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const durationMinutes = event.duration;
    
    const topPercentage = ((startHour - 8) * 60 + startMinute) / (12 * 60) * 100;
    const heightPercentage = (durationMinutes / (12 * 60)) * 100;
    
    return {
      top: `${Math.max(0, topPercentage)}%`,
      height: `${Math.min(heightPercentage, 100 - topPercentage)}%`
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* En-tête des jours */}
      <div className="grid grid-cols-8 border-b border-theme-border">
        <div className="p-3 text-sm font-medium text-theme-muted">
          Heures
        </div>
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-3 text-center border-l border-theme-border">
            <div className="text-sm font-medium text-theme-foreground">
              {format(day, 'EEE', { locale: fr })}
            </div>
            <div className="text-lg font-semibold text-theme-foreground">
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Grille horaire */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 h-full min-h-[600px]">
          {/* Colonne des heures */}
          <div className="border-r border-theme-border">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className="h-16 flex items-start justify-end pr-2 pt-1 text-xs text-theme-muted border-b border-theme-border"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            
            return (
              <div key={day.toISOString()} className="relative border-l border-theme-border">
                {/* Slots horaires */}
                {CALENDAR_HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-16 border-b border-theme-border hover:bg-theme-accent cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick?.(day, `${hour}:00`)}
                  />
                ))}

                {/* Événements */}
                {dayEvents.map(event => {
                  const position = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 z-10"
                      style={position}
                    >
                      <CalendarEventComponent
                        event={event}
                        onClick={onEventClick}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
