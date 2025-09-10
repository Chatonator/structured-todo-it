
import React, { useState, useRef } from 'react';
import { CalendarEvent } from '@/types/task';
import { CalendarEventComponent } from './CalendarEvent';
import { DayHeader } from './day/DayHeader';
import { isSameDay } from 'date-fns';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onTaskDrop?: (taskId: string, date: Date, time: string) => void;
}

const CALENDAR_HOURS = Array.from({ length: 24 }, (_, i) => i); // 0h à 23h

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
    try {
      const startHour = event.startTime.getHours();
      const startMinute = event.startTime.getMinutes();
      const durationMinutes = event.duration;

      // Calcul basé sur la variable CSS --calendar-hour-height
      const getHourRowPx = () => {
        try {
          const val = getComputedStyle(document.documentElement)
            .getPropertyValue('--calendar-hour-height')
            .trim();
          const n = parseFloat(val);
          return Number.isFinite(n) ? n : 48;
        } catch {
          return 48;
        }
      };
      const hourRowPx = getHourRowPx();
      const pxPerMinute = hourRowPx / 60;

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

  const getOverlappingEvents = (targetEvent: CalendarEvent) => {
    return dayEvents.filter(event => {
      if (event.id === targetEvent.id) return false;
      
      const targetStart = targetEvent.startTime.getHours() * 60 + targetEvent.startTime.getMinutes();
      const targetEnd = targetStart + targetEvent.duration;
      const eventStart = event.startTime.getHours() * 60 + event.startTime.getMinutes();
      const eventEnd = eventStart + event.duration;
      
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
      onTaskDrop(taskId, currentDate, `${hour.toString().padStart(2, '0')}:00`);
    }
    setDragOverSlot(null);
  };

  const handleSlotClick = (hour: number) => {
    onTimeSlotClick?.(currentDate, `${hour.toString().padStart(2, '0')}:00`);
  };

  return (
    <div className="flex flex-col h-full bg-theme-background">
      <DayHeader currentDate={currentDate} eventsCount={dayEvents.length} />

      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="grid grid-cols-[80px_1fr] h-[1152px]">
          {/* Colonne des heures */}
          <div className="border-r border-theme-border">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className="flex items-start justify-end pr-2 pt-1 text-xs text-theme-muted border-b border-theme-border h-12"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Colonne des créneaux */}
          <div className="relative">
            {CALENDAR_HOURS.map(hour => (
              <div
                key={hour}
                className={`border-b border-theme-border hover:bg-theme-accent cursor-pointer transition-colors h-12 ${dragOverSlot === `${hour}:00` ? 'bg-theme-accent' : ''}`}
                onClick={() => handleSlotClick(hour)}
                onDragOver={(e) => handleSlotDragOver(e, hour)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, hour)}
              />
            ))}

            {/* Événements */}
            {dayEvents.map((event) => {
              const position = getEventPosition(event);
              const overlapping = getOverlappingEvents(event);
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
        </div>
      </div>
    </div>
  );
};
