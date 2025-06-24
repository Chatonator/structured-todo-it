
import React, { useState, useRef } from 'react';
import { CalendarEvent, CALENDAR_HOURS } from '@/types/task';
import { CalendarEventComponent } from './CalendarEvent';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onTaskDrop?: (taskId: string, date: Date, time: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  onTaskDrop
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter(event => isSameDay(event.startTime, currentDate));
  
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

  const handleSlotDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverSlot(`${hour}:00`);
  };

  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleSlotDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, currentDate, `${hour}:00`);
    }
    setDragOverSlot(null);
  };

  const handleSlotClick = (hour: number) => {
    onTimeSlotClick?.(currentDate, `${hour}:00`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* En-tête du jour */}
      <div className="p-4 border-b border-theme-border bg-theme-background">
        <h2 className="text-xl font-semibold text-theme-foreground">
          {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </h2>
        <p className="text-sm text-theme-muted mt-1">
          {dayEvents.length} événement{dayEvents.length !== 1 ? 's' : ''} planifié{dayEvents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grille horaire */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="grid grid-cols-2 h-full min-h-[800px]">
          {/* Colonne des heures */}
          <div className="border-r border-theme-border">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className="h-20 flex items-start justify-end pr-4 pt-2 text-sm font-medium text-theme-muted border-b border-theme-border"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Colonne des créneaux */}
          <div className="relative">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className={`
                  h-20 border-b border-theme-border cursor-pointer transition-all duration-200
                  ${dragOverSlot === `${hour}:00` 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 drop-zone-active' 
                    : 'hover:bg-theme-accent'
                  }
                `}
                onClick={() => handleSlotClick(hour)}
                onDragOver={(e) => handleSlotDragOver(e, hour)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, hour)}
              >
                {/* Indicateur de drop zone */}
                {dragOverSlot === `${hour}:00` && (
                  <div className="h-full flex items-center justify-center">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
                      📅 Planifier ici
                    </div>
                  </div>
                )}
                
                {/* Ligne de demi-heure */}
                <div className="absolute inset-x-0 top-10 h-px bg-theme-border opacity-30" />
              </div>
            ))}

            {/* Événements */}
            {dayEvents.map(event => {
              const position = getEventPosition(event);
              return (
                <div
                  key={event.id}
                  className="absolute left-2 right-2 z-10"
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
        </div>
      </div>
    </div>
  );
};
