/**
 * TimelineView - Vue de planification refactorisée
 * Utilise les nouveaux composants TaskDeckPanel et planning views
 */

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin
} from '@dnd-kit/core';
import { ViewLayout } from '@/components/layout/view';
import { ViewStats } from '@/components/layout/view/ViewStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle,
  ListTodo,
  CalendarDays,
  Plus
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  DraggableTask,
  RecurringPreview,
  OverdueTasksAlert
} from '@/components/timeline';
import { TaskDeckPanel } from '@/components/timeline/panels';
import { DayPlanningView, WeekPlanningView } from '@/components/timeline/planning';
import { useTimelineScheduling } from '@/hooks/useTimelineScheduling';
import { useDayPlanning } from '@/hooks/useDayPlanning';
import { useProjects } from '@/hooks/useProjects';
import { Task } from '@/types/task';
import { TimeEvent, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';
import TaskModal from '@/components/task/TaskModal';

interface TimelineViewProps {
  className?: string;
}

type ViewMode = 'day' | 'week';

const TimelineView: React.FC<TimelineViewProps> = ({ className }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [draggedItem, setDraggedItem] = useState<Task | TimeEvent | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  
  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<TimeEvent | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return { start: startOfDay(weekStart), end: endOfDay(addDays(weekStart, 6)) };
  }, [selectedDate, viewMode]);

  // Generate days array
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [startOfDay(selectedDate)];
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate, viewMode]);

  const {
    unscheduledTasks,
    scheduledEvents,
    overdueEvents,
    scheduleTaskToBlock,
    rescheduleEventToBlock,
    unscheduleEvent,
    completeEvent,
    getTaskById,
    reload
  } = useTimelineScheduling(dateRange);

  const { 
    getQuotaForDate, 
    setQuotaForDate, 
    loadConfigs 
  } = useDayPlanning();

  const { projects } = useProjects();

  // Load planning configs when date range changes
  useEffect(() => {
    loadConfigs(dateRange.start, dateRange.end);
  }, [dateRange, loadConfigs]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

    // Check if dropped on a time block
    if (overData?.type === 'time-block') {
      const block = overData.block as TimeBlock;
      const date = new Date(overData.date);

      if (activeData?.type === 'unscheduled-task') {
        const task = activeData.task as Task;
        // Optimistic UI: hide immediately from deck
        setPendingTaskIds(prev => new Set(prev).add(task.id));
        try {
          await scheduleTaskToBlock({
            taskId: task.id,
            date,
            block,
            duration: task.duration || task.estimatedTime || 30
          });
        } finally {
          setPendingTaskIds(prev => { const next = new Set(prev); next.delete(task.id); return next; });
        }
      } else if (activeData?.type === 'scheduled-event') {
        const evt = activeData.event as TimeEvent;
        await rescheduleEventToBlock(evt.id, date, block);
      }
    }

    // Handle day column drop (for week view)
    if (overData?.type === 'day-column') {
      const date = new Date(overData.date);
      const block: TimeBlock = 'morning';

      if (activeData?.type === 'unscheduled-task') {
        const task = activeData.task as Task;
        setPendingTaskIds(prev => new Set(prev).add(task.id));
        try {
          await scheduleTaskToBlock({
            taskId: task.id,
            date,
            block,
            duration: task.duration || task.estimatedTime || 30
          });
        } finally {
          setPendingTaskIds(prev => { const next = new Set(prev); next.delete(task.id); return next; });
        }
      } else if (activeData?.type === 'scheduled-event') {
        const evt = activeData.event as TimeEvent;
        await rescheduleEventToBlock(evt.id, date, block);
      }
    }
  }, [scheduleTaskToBlock, rescheduleEventToBlock]);

  // Event handlers
  const handleCompleteEvent = useCallback(async (eventId: string) => {
    await completeEvent(eventId);
  }, [completeEvent]);

  const handleUnscheduleEvent = useCallback(async (eventId: string) => {
    await unscheduleEvent(eventId);
  }, [unscheduleEvent]);

  const handleEventClick = useCallback((event: TimeEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
    setIsTaskModalOpen(false);
  }, []);

  const handleRescheduleOverdue = useCallback(async (eventId: string) => {
    await rescheduleEventToBlock(eventId, new Date(), 'morning');
  }, [rescheduleEventToBlock]);

  const handleCancelOverdue = useCallback(async (eventId: string) => {
    await unscheduleEvent(eventId);
  }, [unscheduleEvent]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, TimeEvent[]>();
    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayEvents = scheduledEvents.filter(e => 
        format(e.startsAt, 'yyyy-MM-dd') === dayKey
      );
      grouped.set(dayKey, dayEvents);
    });
    return grouped;
  }, [scheduledEvents, days]);

  // Quota by day for week view
  const quotaByDay = useMemo(() => {
    const quotas = new Map<string, number>();
    days.forEach(day => {
      quotas.set(format(day, 'yyyy-MM-dd'), getQuotaForDate(day));
    });
    return quotas;
  }, [days, getQuotaForDate]);

  // Stats calculation
  const totalScheduledTime = scheduledEvents.reduce((sum, e) => sum + e.duration, 0);
  const completedEvents = scheduledEvents.filter(e => e.status === 'completed').length;
  const totalUnscheduledTime = unscheduledTasks.reduce((sum, t) => sum + t.estimatedTime, 0);
  const totalQuota = days.reduce((sum, d) => sum + getQuotaForDate(d), 0);

  const stats = [
    {
      id: 'scheduled',
      label: 'Planifié',
      value: `${formatDuration(totalScheduledTime)} / ${formatDuration(totalQuota)}`,
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

  const recurringEvent = selectedEvent?.recurrence ? selectedEvent : null;
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

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
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
         <div className="flex flex-col gap-4 flex-1 min-h-0 h-full">

          {/* Overdue tasks alert */}
          {overdueEvents.length > 0 && (
            <OverdueTasksAlert
              events={overdueEvents}
              onReschedule={handleRescheduleOverdue}
              onCancel={handleCancelOverdue}
            />
          )}

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
              
              <Button variant="ghost" size="sm" onClick={handleToday} className="min-w-[180px]">
                {format(selectedDate, viewMode === 'day' ? 'EEEE d MMMM' : "'Sem.' w - MMMM yyyy", { locale: fr })}
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main content: TaskDeckPanel + Planning views */}
           <div className="flex gap-4 flex-1 min-h-0">
            {/* Task deck panel with scheduled events toggle */}
            <TaskDeckPanel
              tasks={unscheduledTasks.filter(t => !pendingTaskIds.has(t.id))}
              scheduledEvents={scheduledEvents}
              projects={projects}
              onTaskClick={(task) => {
                console.log('Task clicked', task);
              }}
              onEventClick={handleEventClick}
              onUnscheduleEvent={handleUnscheduleEvent}
              onCompleteEvent={handleCompleteEvent}
            />

            {/* Planning area */}
            <div className="flex-1 min-w-0">
              {/* Day view */}
              {viewMode === 'day' && (
                <DayPlanningView
                  date={selectedDate}
                  events={eventsByDay.get(format(selectedDate, 'yyyy-MM-dd')) || []}
                  quota={getQuotaForDate(selectedDate)}
                  onQuotaChange={(minutes) => setQuotaForDate(selectedDate, minutes)}
                  onCompleteEvent={handleCompleteEvent}
                  onRemoveEvent={handleUnscheduleEvent}
                  onEventClick={handleEventClick}
                />
              )}

              {/* Week view */}
              {viewMode === 'week' && (
                <WeekPlanningView
                  startDate={weekStart}
                  eventsByDay={eventsByDay}
                  quotaByDay={quotaByDay}
                  defaultQuota={240}
                  onEventClick={handleEventClick}
                  onCompleteEvent={handleCompleteEvent}
                />
              )}
            </div>
          </div>

          {/* Selected event details panel */}
          {selectedEvent && (
            <Card className="animate-in slide-in-from-bottom-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedEvent.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(selectedEvent.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(selectedEvent.startsAt, 'PPP', { locale: fr })}
                  </div>
                  {selectedEvent.timeBlock && (
                    <span className="text-xs">
                      {TIME_BLOCKS[selectedEvent.timeBlock].icon} {TIME_BLOCKS[selectedEvent.timeBlock].label}
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground border-t pt-2 space-y-1">
                  <p>Créé le {format(selectedEvent.createdAt, 'PPP', { locale: fr })}</p>
                  {selectedEvent.completedAt && (
                    <p className="text-system-success">
                      Terminé le {format(selectedEvent.completedAt, 'PPP', { locale: fr })}
                    </p>
                  )}
                </div>

                {recurringEvent && (
                  <div className="border-t pt-3">
                    <RecurringPreview event={recurringEvent} maxOccurrences={5} />
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant={selectedEvent.status === 'completed' ? 'outline' : 'default'}
                    onClick={() => handleCompleteEvent(selectedEvent.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {selectedEvent.status === 'completed' ? 'Rouvrir' : 'Terminer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnscheduleEvent(selectedEvent.id)}
                  >
                    Dé-planifier
                  </Button>
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

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </ViewLayout>
  );
};

export default TimelineView;
