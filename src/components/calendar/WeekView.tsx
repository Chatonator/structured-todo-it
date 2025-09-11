
import React from 'react';
import { CalendarEvent } from '@/types/task';
import { CalendarEventComponent } from './CalendarEvent';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

const CALENDAR_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0h à 23h

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
    try {
      const startHour = event.startTime.getHours();
      const startMinute = event.startTime.getMinutes();
      const durationMinutes = event.duration;

      // Alignement exact avec la hauteur des lignes horaires (h-12 = 48px)
      const HOUR_ROW_PX = 48;
      const pxPerMinute = HOUR_ROW_PX / 60; // 0.8px par minute

      const startMinutes = startHour * 60 + startMinute;
      const topPx = startMinutes * pxPerMinute;
      const heightPx = Math.max(24, durationMinutes * pxPerMinute); // min 24px pour visibilité

      return {
        top: `${topPx}px`,
        height: `${heightPx}px`
      };
    } catch (error) {
      console.warn('Erreur calcul position événement:', error, event);
      return { top: '0px', height: '24px' };
    }
  };

  const getOverlappingEvents = (dayEvents: CalendarEvent[], targetEvent: CalendarEvent) => {
    return dayEvents.filter(event => {
      if (event.id === targetEvent.id) return false;
      
      const targetStart = targetEvent.startTime.getHours() * 60 + targetEvent.startTime.getMinutes();
      const targetEnd = targetStart + targetEvent.duration;
      const eventStart = event.startTime.getHours() * 60 + event.startTime.getMinutes();
      const eventEnd = eventStart + event.duration;
      
      return (targetStart < eventEnd && targetEnd > eventStart);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* En-tête des jours */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
        <div className="p-3 text-sm font-medium text-muted-foreground">
          Heures
        </div>
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-3 text-center border-l border-border">
            <div className="text-sm font-medium text-foreground">
              {format(day, 'EEE', { locale: fr })}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Grille horaire */}
      <div className="flex-1 overflow-auto">
        <div className="grid h-full h-[1152px] grid-cols-[80px_repeat(7,1fr)]">
          {/* Colonne des heures */}
          <div className="border-r border-border">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className="h-12 flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground border-b border-border"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            
            return (
              <div key={day.toISOString()} className="relative border-l border-border">
                {/* Slots horaires */}
                {CALENDAR_HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-12 border-b border-border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick?.(day, `${hour.toString().padStart(2, '0')}:00`)}
                  />
                ))}

                {/* Événements */}
                {dayEvents.map((event, eventIndex) => {
                  const position = getEventPosition(event);
                  const overlapping = getOverlappingEvents(dayEvents, event);
                  const totalColumns = overlapping.length + 1;
                  const columnIndex = overlapping.filter(e => e.id < event.id).length;
                  
                  const width = totalColumns > 1 ? `${95 / totalColumns}%` : '95%';
                  const left = totalColumns > 1 ? `${columnIndex * 95 / totalColumns + 2}%` : '2%';
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute z-10"
                      style={{
                        ...position,
                        width,
                        left,
                        minHeight: '24px'
                      }}
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
