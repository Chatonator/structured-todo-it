
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
    <div className="flex flex-col h-full bg-theme-background">
      <DayHeader currentDate={currentDate} eventsCount={dayEvents.length} />

      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="grid grid-cols-2 h-full min-h-[800px]">
          {/* Colonne des heures */}
          <div className="border-r border-theme-border">
            {CALENDAR_HOURS.map(hour => (
              <HourLabel key={hour} hour={hour} />
            ))}
          </div>

          {/* Colonne des créneaux */}
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
