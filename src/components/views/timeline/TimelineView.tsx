import React, { useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter
} from '@dnd-kit/core';
import { ViewLayout } from '@/components/layout/view';
import { ViewStats } from '@/components/layout/view/ViewStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle,
  ListTodo,
  CalendarDays
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TimeGrid, UnscheduledTasksPanel, DraggableTask, ScheduledEvent } from '@/components/timeline';
import { useTimelineScheduling } from '@/hooks/useTimelineScheduling';
import { Task } from '@/types/task';
import { TimeEvent } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';

interface TimelineViewProps {
  className?: string;
}

type ViewMode = 'day' | 'week';

const TimelineView: React.FC<TimelineViewProps> = ({ className }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [draggedItem, setDraggedItem] = useState<Task | TimeEvent | null>(null);

  // Calculate date range based on view mode
  const dateRange = viewMode === 'day'
    ? { start: startOfDay(selectedDate), end: endOfDay(selectedDate) }
    : { start: startOfDay(selectedDate), end: endOfDay(addDays(selectedDate, 6)) };

  const {
    unscheduledTasks,
    scheduledEvents,
    scheduleTask,
    rescheduleEvent,
    completeEvent,
    getTaskById
  } = useTimelineScheduling(dateRange);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? -1 : -7));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? 1 : 7));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === 'unscheduled-task') {
      setDraggedItem(data.task as Task);
    } else if (data?.type === 'scheduled-event') {
      setDraggedItem(data.event as TimeEvent);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Check if dropped on a time slot
    if (overData?.type === 'time-slot') {
      const { date, hour, minute } = overData;

      if (activeData?.type === 'unscheduled-task') {
        // Schedule unscheduled task
        const task = activeData.task as Task;
        await scheduleTask({
          taskId: task.id,
          date,
          hour,
          minute
        });
      } else if (activeData?.type === 'scheduled-event') {
        // Reschedule existing event
        const event = activeData.event as TimeEvent;
        await rescheduleEvent(event.id, date, hour, minute);
      }
    }
  }, [scheduleTask, rescheduleEvent]);

  // Stats calculation
  const totalScheduledTime = scheduledEvents.reduce((sum, e) => sum + e.duration, 0);
  const completedEvents = scheduledEvents.filter(e => e.status === 'completed').length;
  const totalUnscheduledTime = unscheduledTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  const stats = [
    {
      id: 'scheduled',
      label: 'Planifié',
      value: formatDuration(totalScheduledTime),
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 'completed',
      label: 'Terminés',
      value: `${completedEvents}/${scheduledEvents.length}`,
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'backlog',
      label: 'À planifier',
      value: `${unscheduledTasks.length} (${formatDuration(totalUnscheduledTime)})`,
      icon: <ListTodo className="w-4 h-4" />
    }
  ];

  return (
    <ViewLayout
      header={{
        title: "Planification",
        subtitle: "Organisez votre journée",
        icon: <CalendarDays className="w-5 h-5" />
      }}
      state="success"
      className={className}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4 pb-20 md:pb-6">
          <ViewStats stats={stats} columns={3} />

          {/* Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Jour
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                Semaine
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleToday}>
                {format(selectedDate, viewMode === 'day' ? 'EEEE d MMMM' : "'Sem.' w - MMMM yyyy", { locale: fr })}
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main content: Backlog + Grid */}
          <div className="flex gap-4 h-[calc(100vh-300px)] min-h-[500px]">
            {/* Unscheduled tasks panel */}
            <UnscheduledTasksPanel
              tasks={unscheduledTasks}
              onTaskClick={(task) => {
                // Could open task modal
                console.log('Task clicked', task);
              }}
            />

            {/* Time grid */}
            <TimeGrid
              selectedDate={selectedDate}
              viewMode={viewMode}
              events={scheduledEvents}
              onCompleteEvent={completeEvent}
              onEventClick={(event) => {
                console.log('Event clicked', event);
              }}
              onSlotClick={(date, hour, minute) => {
                console.log('Slot clicked', { date, hour, minute });
              }}
              className="flex-1"
            />
          </div>

          {/* Empty state hint */}
          {unscheduledTasks.length > 0 && scheduledEvents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Glissez vos tâches sur la grille horaire</p>
                  <p className="text-xs mt-1">pour planifier votre journée</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggedItem && 'name' in draggedItem ? (
            <div className="opacity-90 w-64">
              <DraggableTask task={draggedItem} />
            </div>
          ) : draggedItem && 'title' in draggedItem ? (
            <div className="opacity-90 w-48 h-12 bg-primary/20 rounded-md border-l-4 border-primary px-2 py-1">
              <span className="text-xs font-medium">{draggedItem.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </ViewLayout>
  );
};

export default TimelineView;
