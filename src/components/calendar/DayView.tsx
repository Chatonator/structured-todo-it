
import React, { useState, useRef } from 'react';
import { CalendarEvent, CALENDAR_HOURS } from '@/types/task';
import { CalendarEventComponent } from './CalendarEvent';
import { DayHeader } from './day/DayHeader';
import { HourLabel } from './day/HourLabel';
import { TimeSlot } from './day/TimeSlot';
import { isSameDay } from 'date-fns';

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
    
    // Nouvelle base 1440 minutes (24h)
    const topPercentage = ((startHour * 60) + startMinute) / 1440 * 100;
    const heightPercentage = durationMinutes / 1440 * 100;
    
    return {
      top: `${Math.max(0, topPercentage)}%`,
      height: `${Math.min(heightPercentage, 100 - topPercentage)}%`
    };
  };

  // Détecter les événements qui se chevauchent
  const getOverlappingEvents = (targetEvent: CalendarEvent) => {
    return dayEvents.filter(event => {
      if (event.id === targetEvent.id) return false;
      
      const targetStart = targetEvent.startTime.getTime();
      const targetEnd = targetEvent.endTime.getTime();
      const eventStart = event.startTime.getTime();
      const eventEnd = event.endTime.getTime();
      
      return (targetStart < eventEnd && targetEnd > eventStart);
    });
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
    <div className="flex flex-col h-full bg-theme-background">
      <DayHeader currentDate={currentDate} eventsCount={dayEvents.length} />

      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="grid grid-cols-[80px_1fr] h-full min-h-[1200px]">
          {/* Colonne des heures - largeur réduite */}
          <div className="border-r border-theme-border">
            {CALENDAR_HOURS.map(hour => (
              <HourLabel key={hour} hour={hour} />
            ))}
          </div>

          {/* Colonne des créneaux - plus d'espace */}
          <div className="relative">
            {CALENDAR_HOURS.map(hour => (
              <TimeSlot
                key={hour}
                hour={hour}
                isDropZone={dragOverSlot === `${hour}:00`}
                onSlotClick={handleSlotClick}
                onDragOver={handleSlotDragOver}
                onDragLeave={handleSlotDragLeave}
                onDrop={handleSlotDrop}
              />
            ))}

            {/* Événements avec gestion des chevauchements */}
            {dayEvents.map((event, index) => {
              const position = getEventPosition(event);
              const overlappingEvents = getOverlappingEvents(event);
              const overlappingCount = overlappingEvents.length + 1;
              const eventIndex = overlappingEvents.filter(e => e.startTime <= event.startTime).length;
              
              // Calcul de la largeur et position horizontale pour éviter les chevauchements
              const width = overlappingCount > 1 ? `${95 / overlappingCount}%` : '95%';
              const left = overlappingCount > 1 ? `${(eventIndex * 95) / overlappingCount + 2}%` : '2%';
              
              return (
                <div
                  key={event.id}
                  className="absolute z-10"
                  style={{
                    ...position,
                    width,
                    left,
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
        </div>
      </div>
    </div>
  );
};
