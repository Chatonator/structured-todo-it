
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
    
    // Nouvelle base 1440 minutes (24h)
    const topPercentage = ((startHour * 60) + startMinute) / 1440 * 100;
    const heightPercentage = durationMinutes / 1440 * 100;
    
    return {
      top: `${Math.max(0, topPercentage)}%`,
      height: `${Math.min(heightPercentage, 100 - topPercentage)}%`
    };
  };

  // Détecter les événements qui se chevauchent pour un jour donné
  const getOverlappingEventsForDay = (dayEvents: CalendarEvent[], targetEvent: CalendarEvent) => {
    return dayEvents.filter(event => {
      if (event.id === targetEvent.id) return false;
      
      const targetStart = targetEvent.startTime.getTime();
      const targetEnd = targetEvent.endTime.getTime();
      const eventStart = event.startTime.getTime();
      const eventEnd = event.endTime.getTime();
      
      return (targetStart < eventEnd && targetEnd > eventStart);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* En-tête des jours */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-theme-border">
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
        <div className="grid grid-cols-[80px_repeat(7,1fr)] h-full min-h-[1200px]">
          {/* Colonne des heures - largeur réduite */}
          <div className="border-r border-theme-border">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className="h-12 flex items-start justify-end pr-2 pt-1 text-xs text-theme-muted border-b border-theme-border"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours - plus d'espace */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            
            return (
              <div key={day.toISOString()} className="relative border-l border-theme-border">
                {/* Slots horaires */}
                {CALENDAR_HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-12 border-b border-theme-border hover:bg-theme-accent cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick?.(day, `${hour}:00`)}
                  />
                ))}

                {/* Événements avec gestion des chevauchements */}
                {dayEvents.map(event => {
                  const position = getEventPosition(event);
                  const overlappingEvents = getOverlappingEventsForDay(dayEvents, event);
                  const overlappingCount = overlappingEvents.length + 1;
                  const eventIndex = overlappingEvents.filter(e => e.startTime <= event.startTime).length;
                  
                  // Calcul de la largeur et position horizontale pour éviter les chevauchements
                  const widthPercent = overlappingCount > 1 ? 95 / overlappingCount : 95;
                  const leftPercent = overlappingCount > 1 ? (eventIndex * 95) / overlappingCount + 2 : 2;
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute z-10"
                      style={{
                        ...position,
                        width: `${widthPercent}%`,
                        left: `${leftPercent}%`,
                        minHeight: '24px' // Hauteur minimale pour la visibilité
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
