/**
 * TimelineView - Vue de planification refactorisee
 * Utilise les nouveaux composants TaskDeckPanel et planning views
 */

import React, { useCallback, useState, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as DateCalendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  ListTodo,
  CalendarDays,
  Home,
  PanelBottom,
  Sunrise,
  Sun,
  Moon,
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, startOfWeek, isSameDay } from 'date-fns';
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
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskCategory } from '@/types/task';
import { TimeEvent, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';
import TaskModal from '@/components/task/TaskModal';
import { useViewport } from '@/contexts/ViewportContext';

interface TimelineViewProps {
  className?: string;
}

type ViewMode = 'day' | 'week';

const quickScheduleOptions: Array<{ block: TimeBlock; label: string; icon: typeof Sunrise }> = [
  { block: 'morning', label: 'Matin', icon: Sunrise },
  { block: 'afternoon', label: 'Après-midi', icon: Sun },
  { block: 'evening', label: 'Soir', icon: Moon },
];

const TimelineMetricCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
  </div>
);

const SelectedEventDetails: React.FC<{
  event: TimeEvent;
  recurringEvent: TimeEvent | null;
  onClose: () => void;
  onComplete: (eventId: string) => void;
  onUnschedule: (eventId: string) => void;
}> = ({ event, recurringEvent, onClose, onComplete, onUnschedule }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-foreground">{event.title}</h3>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        ✕
      </Button>
    </div>

    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {formatDuration(event.duration)}
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        {format(event.startsAt, 'PPP', { locale: fr })}
      </div>
      {event.timeBlock && (
        <span className="text-xs">
          {TIME_BLOCKS[event.timeBlock].icon} {TIME_BLOCKS[event.timeBlock].label}
        </span>
      )}
    </div>

    <div className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
      <p>Créé le {format(event.createdAt, 'PPP', { locale: fr })}</p>
      {event.completedAt && (
        <p className="text-system-success">
          Terminé le {format(event.completedAt, 'PPP', { locale: fr })}
        </p>
      )}
    </div>

    {recurringEvent && (
      <div className="border-t pt-3">
        <RecurringPreview event={recurringEvent} maxOccurrences={5} />
      </div>
    )}

    <div className="flex gap-2 border-t pt-2">
      <Button
        size="sm"
        variant={event.status === 'completed' ? 'outline' : 'default'}
        onClick={() => onComplete(event.id)}
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        {event.status === 'completed' ? 'Rouvrir' : 'Terminer'}
      </Button>
      <Button size="sm" variant="outline" onClick={() => onUnschedule(event.id)}>
        Dé-planifier
      </Button>
    </div>
  </div>
);

const TimelineView: React.FC<TimelineViewProps> = ({ className }) => {
  const { isPhone } = useViewport();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [draggedItem, setDraggedItem] = useState<Task | TimeEvent | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<TimeEvent | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDeckOpen, setIsTaskDeckOpen] = useState(false);
  const [taskToQuickSchedule, setTaskToQuickSchedule] = useState<Task | null>(null);
  const [quickScheduleDate, setQuickScheduleDate] = useState(selectedDate);
  const [isQuickScheduleCalendarOpen, setIsQuickScheduleCalendarOpen] = useState(false);

  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return { start: startOfDay(weekStart), end: endOfDay(addDays(weekStart, 6)) };
  }, [selectedDate, viewMode]);

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
  } = useTimelineScheduling(dateRange);

  const {
    getQuotaForDate,
    setQuotaForDate,
    loadConfigs
  } = useDayPlanning();

  const { projects } = useProjects();
  const { tasks: allTasks } = useTasks();

  const taskCategoryMap = useMemo(() => {
    const map = new Map<string, TaskCategory>();
    allTasks.forEach(t => map.set(t.id, t.category as TaskCategory));
    return map;
  }, [allTasks]);

  const isViewingToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    loadConfigs(dateRange.start, dateRange.end);
  }, [dateRange, loadConfigs]);

  useEffect(() => {
    if (isPhone && viewMode === 'week') {
      setViewMode('day');
    }
  }, [isPhone, viewMode]);

  useEffect(() => {
    if (!taskToQuickSchedule) return;
    setQuickScheduleDate(selectedDate);
    setIsQuickScheduleCalendarOpen(false);
  }, [selectedDate, taskToQuickSchedule]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handlePrevious = useCallback(() => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? -1 : -7));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? 1 : 7));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

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

    if (overData?.type === 'time-block') {
      const block = overData.block as TimeBlock;
      const date = new Date(overData.date);

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
          setPendingTaskIds(prev => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
        }
      } else if (activeData?.type === 'scheduled-event') {
        const evt = activeData.event as TimeEvent;
        await rescheduleEventToBlock(evt.id, date, block);
      }
    }

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
          setPendingTaskIds(prev => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
        }
      } else if (activeData?.type === 'scheduled-event') {
        const evt = activeData.event as TimeEvent;
        await rescheduleEventToBlock(evt.id, date, block);
      }
    }
  }, [scheduleTaskToBlock, rescheduleEventToBlock]);

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

  const handleQuickSchedule = useCallback(async (block: TimeBlock) => {
    if (!taskToQuickSchedule) return;
    await scheduleTaskToBlock({
      taskId: taskToQuickSchedule.id,
      date: quickScheduleDate,
      block,
      duration: taskToQuickSchedule.duration || taskToQuickSchedule.estimatedTime || 30,
    });
    setSelectedDate(quickScheduleDate);
    setTaskToQuickSchedule(null);
    setIsTaskDeckOpen(false);
  }, [quickScheduleDate, scheduleTaskToBlock, taskToQuickSchedule]);

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, TimeEvent[]>();
    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayEvents = scheduledEvents.filter(e => format(e.startsAt, 'yyyy-MM-dd') === dayKey);
      grouped.set(dayKey, dayEvents);
    });
    return grouped;
  }, [scheduledEvents, days]);

  const quotaByDay = useMemo(() => {
    const quotas = new Map<string, number>();
    days.forEach(day => {
      quotas.set(format(day, 'yyyy-MM-dd'), getQuotaForDate(day));
    });
    return quotas;
  }, [days, getQuotaForDate]);

  const recurringEvent = selectedEvent?.recurrence ? selectedEvent : null;
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDay.get(selectedDayKey) || [];
  const selectedDayQuota = getQuotaForDate(selectedDate);
  const selectedDayScheduledDuration = selectedDayEvents.reduce((sum, event) => sum + event.duration, 0);
  const selectedDayCompletedCount = selectedDayEvents.filter((event) => event.status === 'completed').length;
  const quickScheduleDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(quickScheduleDate, index)),
    [quickScheduleDate]
  );

  return (
    <ViewLayout
      header={{
        title: 'Planification',
        subtitle: isPhone ? 'Une journée claire et rapide à piloter' : 'Organisez votre journée',
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
        <div className="flex h-full min-h-0 flex-col gap-4">
          {overdueEvents.length > 0 && (
            <OverdueTasksAlert
              events={overdueEvents}
              onReschedule={handleRescheduleOverdue}
              onCancel={handleCancelOverdue}
            />
          )}

          {isPhone ? (
            <>
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevious}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="min-w-0 text-center">
                      <div className="text-sm font-semibold capitalize text-foreground">
                        {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                      </div>
                      <button
                        type="button"
                        onClick={handleToday}
                        className={cn(
                          'mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors',
                          isViewingToday ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Home className="w-3.5 h-3.5" />
                        {isViewingToday ? 'Aujourd’hui' : 'Revenir à aujourd’hui'}
                      </button>
                    </div>

                    <Button variant="outline" size="icon" onClick={handleNext}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <TimelineMetricCard label="Backlog" value={unscheduledTasks.length} icon={<ListTodo className="w-3.5 h-3.5" />} />
                    <TimelineMetricCard label="Planifié" value={formatDuration(selectedDayScheduledDuration)} icon={<Clock className="w-3.5 h-3.5" />} />
                    <TimelineMetricCard label="Complété" value={`${selectedDayCompletedCount}/${selectedDayEvents.length || 0}`} icon={<CheckCircle className="w-3.5 h-3.5" />} />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-2xl" onClick={handleToday}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Aujourd’hui
                    </Button>
                    <Button className="flex-1 rounded-2xl" onClick={() => setIsTaskDeckOpen(true)}>
                      <PanelBottom className="w-4 h-4 mr-2" />
                      Backlog
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <DayPlanningView
                date={selectedDate}
                events={selectedDayEvents}
                quota={selectedDayQuota}
                onQuotaChange={(minutes) => setQuotaForDate(selectedDate, minutes)}
                onCompleteEvent={handleCompleteEvent}
                onRemoveEvent={handleUnscheduleEvent}
                onEventClick={handleEventClick}
                taskCategoryMap={taskCategoryMap}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button variant={viewMode === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('day')}>
                    <Calendar className="w-4 h-4 mr-1" />
                    Jour
                  </Button>
                  <Button variant={viewMode === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('week')}>
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Semaine
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant={isViewingToday ? 'ghost' : 'default'}
                    size="sm"
                    onClick={handleToday}
                    className={cn('min-w-[180px]', !isViewingToday && 'animate-pulse')}
                  >
                    {!isViewingToday && <Home className="w-4 h-4 mr-1" />}
                    {format(selectedDate, viewMode === 'day' ? 'EEEE d MMMM' : "'Sem.' w - MMMM yyyy", { locale: fr })}
                  </Button>

                  <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 gap-4">
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

                <div className="flex-1 min-w-0">
                  {viewMode === 'day' && (
                    <DayPlanningView
                      date={selectedDate}
                      events={selectedDayEvents}
                      quota={selectedDayQuota}
                      onQuotaChange={(minutes) => setQuotaForDate(selectedDate, minutes)}
                      onCompleteEvent={handleCompleteEvent}
                      onRemoveEvent={handleUnscheduleEvent}
                      onEventClick={handleEventClick}
                      taskCategoryMap={taskCategoryMap}
                    />
                  )}

                  {viewMode === 'week' && (
                    <WeekPlanningView
                      startDate={weekStart}
                      eventsByDay={eventsByDay}
                      quotaByDay={quotaByDay}
                      defaultQuota={240}
                      onEventClick={handleEventClick}
                      onCompleteEvent={handleCompleteEvent}
                      taskCategoryMap={taskCategoryMap}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {selectedEvent && !isPhone && (
            <Card className="animate-in slide-in-from-bottom-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Détail de l'événement</CardTitle>
              </CardHeader>
              <CardContent>
                <SelectedEventDetails
                  event={selectedEvent}
                  recurringEvent={recurringEvent}
                  onClose={() => setSelectedEvent(null)}
                  onComplete={handleCompleteEvent}
                  onUnschedule={handleUnscheduleEvent}
                />
              </CardContent>
            </Card>
          )}
        </div>

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

      <Sheet open={isTaskDeckOpen} onOpenChange={setIsTaskDeckOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-[28px] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Tâches à planifier</SheetTitle>
          </SheetHeader>
          <TaskDeckPanel
            tasks={unscheduledTasks.filter(t => !pendingTaskIds.has(t.id))}
            scheduledEvents={scheduledEvents}
            projects={projects}
            onTaskClick={(task) => {
              setQuickScheduleDate(selectedDate);
              setTaskToQuickSchedule(task);
            }}
            onEventClick={handleEventClick}
            onUnscheduleEvent={handleUnscheduleEvent}
            onCompleteEvent={handleCompleteEvent}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!taskToQuickSchedule}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToQuickSchedule(null);
            setIsQuickScheduleCalendarOpen(false);
          }
        }}
      >
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[28px] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-5">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>{taskToQuickSchedule?.name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Choisir le jour
                </p>
                <p className="text-sm text-muted-foreground">
                  Planifier le {format(quickScheduleDate, 'EEEE d MMMM', { locale: fr })}
                </p>
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {quickScheduleDays.map((day) => {
                  const isSelected = isSameDay(day, quickScheduleDate);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setQuickScheduleDate(day)}
                      className={cn(
                        'min-w-[78px] rounded-2xl border px-3 py-2 text-left transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground'
                      )}
                    >
                      <div className="text-[11px] uppercase tracking-[0.14em] opacity-80">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {format(day, 'd MMM', { locale: fr })}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setQuickScheduleDate(new Date())}
                >
                  Aujourd’hui
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setIsQuickScheduleCalendarOpen((open) => !open)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {isQuickScheduleCalendarOpen ? 'Masquer le calendrier' : 'Choisir une autre date'}
                </Button>
              </div>
            </div>

            {isQuickScheduleCalendarOpen && (
              <div className="rounded-3xl border border-border/70 bg-card/70 p-2">
                <DateCalendar
                  mode="single"
                  selected={quickScheduleDate}
                  onSelect={(date) => date && setQuickScheduleDate(date)}
                  locale={fr}
                  className="mx-auto w-fit"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Choisir le créneau</p>
              {quickScheduleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.block}
                    variant="outline"
                    className="h-12 w-full justify-start rounded-2xl"
                    onClick={() => handleQuickSchedule(option.block)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedEvent && isPhone} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="bottom" className="max-h-[80dvh] rounded-t-[28px] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-5">
          {selectedEvent && (
            <SelectedEventDetails
              event={selectedEvent}
              recurringEvent={recurringEvent}
              onClose={() => setSelectedEvent(null)}
              onComplete={handleCompleteEvent}
              onUnschedule={handleUnscheduleEvent}
            />
          )}
        </SheetContent>
      </Sheet>

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
