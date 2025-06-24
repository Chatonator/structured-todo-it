
import React, { useState, useRef } from 'react';
import { CalendarEvent, CALENDAR_HOURS, Task } from '@/types/task';
import { CalendarEventComponent } from './CalendarEvent';
import { format, isSameDay, setHours, setMinutes, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  unscheduledTasks: Task[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onScheduleTask?: (taskId: string, date: Date, time: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  unscheduledTasks,
  onEventClick,
  onTimeSlotClick,
  onScheduleTask
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
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

  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Image de drag personnalisée
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `📅 ${task.name}`;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.background = '#3b82f6';
    dragImage.style.color = 'white';
    dragImage.style.padding = '8px 16px';
    dragImage.style.borderRadius = '8px';
    dragImage.style.fontSize = '14px';
    dragImage.style.fontWeight = '500';
    dragImage.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
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
    if (draggedTask && onScheduleTask) {
      onScheduleTask(draggedTask.id, currentDate, `${hour}:00`);
    }
    setDraggedTask(null);
    setDragOverSlot(null);
  };

  const handleSlotClick = (hour: number) => {
    onTimeSlotClick?.(currentDate, `${hour}:00`);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar des tâches non planifiées */}
      <div className="w-80 bg-theme-background border-r border-theme-border p-4 overflow-y-auto">
        <h3 className="font-semibold text-theme-foreground mb-4 flex items-center gap-2">
          📋 Tâches à planifier
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {unscheduledTasks.length}
          </span>
        </h3>
        
        <div className="space-y-2">
          {unscheduledTasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleTaskDragStart(e, task)}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-theme-border hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md"
            >
              <div className="font-medium text-sm text-theme-foreground mb-1">
                {task.name}
              </div>
              <div className="text-xs text-theme-muted flex items-center gap-2">
                <span className="bg-theme-accent px-2 py-1 rounded">
                  {task.category}
                </span>
                <span>{task.estimatedTime}min</span>
              </div>
            </div>
          ))}
          
          {unscheduledTasks.length === 0 && (
            <div className="text-center py-8 text-theme-muted">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm">Toutes les tâches sont planifiées !</p>
            </div>
          )}
        </div>
      </div>

      {/* Vue du jour */}
      <div className="flex-1 flex flex-col">
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
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' 
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
    </div>
  );
};
