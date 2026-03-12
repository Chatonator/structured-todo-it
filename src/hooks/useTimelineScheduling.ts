/**
 * useTimelineScheduling - Hook for scheduling tasks in the timeline.
 * Keeps hook-level orchestration here and delegates date/event shaping helpers.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { requestCalendarSyncProcessing } from '@/lib/calendar/requestCalendarSync';
import { getSuggestionForDuration, buildBreakTitle, computeBlockBreaks } from '@/lib/time/RecoveryEngine';
import { DateRange, TimeBlock, TimeEvent } from '@/lib/time/types';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { useTimeHub } from '@/hooks/useTimeHub';
import { Task } from '@/types/task';
import {
  buildBlockEventRange,
  buildClockTime,
  createConflictTestEvent,
  formatTimelineDate,
  getBlockStartHour,
  isOverdueTaskEvent,
  mapTimeEventRow,
  TimeEventRow,
  withScheduledDuration,
} from './timeline/useTimelineScheduling.helpers';

interface ScheduleTaskParams {
  taskId: string;
  date: Date;
  hour: number;
  minute: number;
  duration?: number;
}

interface ScheduleTaskToBlockParams {
  taskId: string;
  date: Date;
  block: TimeBlock;
  duration?: number;
}

export const useTimelineScheduling = (dateRange: DateRange) => {
  const { user } = useAuth();
  const { tasks, toggleTaskCompletion } = useTasks();
  const { events, loadEvents, checkConflicts } = useTimeHub(dateRange);
  const { syncTaskEventWithSchedule, deleteEntityEvent, updateEventStatus } = useTimeEventSync();
  const cleanupRunRef = useRef(false);

  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(
      events
        .filter((event) => event.entityType === 'task')
        .map((event) => event.entityId)
    );

    return tasks.filter((task) => !task.isCompleted && !scheduledTaskIds.has(task.id) && task.level === 0);
  }, [tasks, events]);

  const scheduledEvents = useMemo(() => {
    return events.filter((event) => event.status !== 'cancelled');
  }, [events]);

  const recalculateBreaks = useCallback(async (date: Date, block?: TimeBlock): Promise<void> => {
    if (!user) return;

    const dateStr = formatTimelineDate(date);

    try {
      let deleteQuery = supabase
        .from('time_events')
        .delete()
        .eq('entity_type', 'recovery')
        .eq('user_id', user.id)
        .gte('starts_at', `${dateStr}T00:00:00`)
        .lt('starts_at', `${dateStr}T23:59:59`);

      if (block) {
        deleteQuery = deleteQuery.eq('time_block', block);
      }
      await deleteQuery;

      let fetchQuery = supabase
        .from('time_events')
        .select('*')
        .eq('user_id', user.id)
        .neq('entity_type', 'recovery')
        .neq('status', 'cancelled')
        .gte('starts_at', `${dateStr}T00:00:00`)
        .lt('starts_at', `${dateStr}T23:59:59`);

      if (block) {
        fetchQuery = fetchQuery.eq('time_block', block);
      }

      const { data: freshRows, error: fetchError } = await fetchQuery;
      if (fetchError) throw fetchError;

      const freshEvents = (freshRows || []).map((row) => mapTimeEventRow(row as TimeEventRow));
      const taskInfos = tasks.map((task) => ({ id: task.id, isImportant: task.isImportant }));
      const plannedBreaks = computeBlockBreaks(freshEvents, taskInfos);

      for (const plannedBreak of plannedBreaks) {
        const suggestion = getSuggestionForDuration(plannedBreak.breakDuration);
        const title = buildBreakTitle(suggestion, plannedBreak.breakDuration);
        const endsAt = new Date(plannedBreak.afterTaskEndsAt.getTime() + plannedBreak.breakDuration * 60 * 1000);

        await supabase
          .from('time_events')
          .insert({
            user_id: user.id,
            entity_type: 'recovery',
            entity_id: plannedBreak.afterTaskId,
            starts_at: plannedBreak.afterTaskEndsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            duration: plannedBreak.breakDuration,
            is_all_day: false,
            title,
            description: `recovery:${plannedBreak.afterTaskId}`,
            color: '#86efac',
            status: 'scheduled',
            time_block: plannedBreak.block || block || null,
          });
      }

      logger.debug('Recalculated breaks', { date: dateStr, block, count: plannedBreaks.length });
    } catch (error: any) {
      logger.warn('Failed to recalculate breaks', { error: error.message });
    }
  }, [user, tasks]);

  const overdueEvents = useMemo(() => {
    return events.filter(isOverdueTaskEvent);
  }, [events]);

  const cleanupOverdueEvents = useCallback(async () => {
    if (!user || overdueEvents.length === 0) return;

    logger.debug('Cleaning up overdue events', { count: overdueEvents.length });

    for (const event of overdueEvents) {
      try {
        await deleteEntityEvent('task', event.entityId);
        logger.debug('Auto-unscheduled overdue task', {
          taskId: event.entityId,
          taskTitle: event.title,
          originalDate: formatTimelineDate(event.startsAt),
        });
      } catch (error: any) {
        logger.warn('Failed to cleanup overdue event', {
          eventId: event.id,
          error: error.message,
        });
      }
    }

    await loadEvents();
  }, [user, overdueEvents, deleteEntityEvent, loadEvents]);

  useEffect(() => {
    if (overdueEvents.length > 0 && !cleanupRunRef.current) {
      cleanupRunRef.current = true;
      cleanupOverdueEvents();
    }
  }, [overdueEvents.length, cleanupOverdueEvents]);

  const scheduleTask = useCallback(async ({ taskId, date, hour, minute, duration }: ScheduleTaskParams): Promise<boolean> => {
    if (!user) return false;

    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) {
      logger.warn('Task not found for scheduling', { taskId });
      return false;
    }

    if (task.isCompleted) {
      logger.warn('Cannot schedule completed task', { taskId });
      return false;
    }

    const existingEvent = events.find((event) => (
      event.entityType === 'task' && event.entityId === taskId && event.status !== 'cancelled'
    ));

    if (existingEvent) {
      logger.debug('Task already scheduled, will reschedule', { taskId, existingEventId: existingEvent.id });
    }

    try {
      const success = await syncTaskEventWithSchedule(withScheduledDuration(task, duration), {
        date,
        time: buildClockTime(hour, minute),
        isRecurring: false,
      });

      if (success) {
        await recalculateBreaks(date);
        await loadEvents();
        logger.debug('Task scheduled', { taskId, date, time: buildClockTime(hour, minute) });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to schedule task', { error: error.message, taskId });
      return false;
    }
  }, [user, tasks, events, syncTaskEventWithSchedule, recalculateBreaks, loadEvents]);

  const scheduleTaskToBlock = useCallback(async ({ taskId, date, block, duration }: ScheduleTaskToBlockParams): Promise<boolean> => {
    if (!user) return false;

    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) {
      logger.warn('Task not found for scheduling', { taskId });
      return false;
    }

    if (task.isCompleted) {
      logger.warn('Cannot schedule completed task', { taskId });
      return false;
    }

    try {
      const hour = getBlockStartHour(block);
      const success = await syncTaskEventWithSchedule(withScheduledDuration(task, duration), {
        date,
        time: buildClockTime(hour),
        isRecurring: false,
      });

      if (success) {
        await supabase
          .from('time_events')
          .update({ time_block: block })
          .eq('entity_type', 'task')
          .eq('entity_id', taskId)
          .eq('user_id', user.id);

        void requestCalendarSyncProcessing('timeline-block-update');
        await recalculateBreaks(date, block);
        await loadEvents();
        logger.debug('Task scheduled to block', { taskId, date: formatTimelineDate(date), block });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to schedule task to block', { error: error.message, taskId });
      return false;
    }
  }, [user, tasks, syncTaskEventWithSchedule, recalculateBreaks, loadEvents]);

  const incrementPostponeCount = useCallback(async (entityId: string) => {
    try {
      const { data: item } = await supabase
        .from('items')
        .select('postpone_count')
        .eq('id', entityId)
        .single();

      if (item) {
        await supabase
          .from('items')
          .update({ postpone_count: (item.postpone_count ?? 0) + 1 })
          .eq('id', entityId);
      }
    } catch (error: any) {
      logger.warn('Failed to increment postpone_count', { error: error.message });
    }
  }, []);

  const rescheduleEvent = useCallback(async (eventId: string, date: Date, hour: number, minute: number): Promise<boolean> => {
    if (!user) return false;

    const event = events.find((entry) => entry.id === eventId);
    if (!event) {
      logger.warn('Event not found for rescheduling', { eventId });
      return false;
    }

    if (event.entityType === 'task') {
      await incrementPostponeCount(event.entityId);
      const task = tasks.find((entry) => entry.id === event.entityId);
      if (task) {
        return scheduleTask({
          taskId: task.id,
          date,
          hour,
          minute,
          duration: event.duration,
        });
      }
    }

    return false;
  }, [user, events, tasks, incrementPostponeCount, scheduleTask]);

  const rescheduleEventToBlock = useCallback(async (eventId: string, date: Date, block: TimeBlock): Promise<boolean> => {
    if (!user) return false;

    const event = events.find((entry) => entry.id === eventId);
    if (!event) {
      logger.warn('Event not found for rescheduling', { eventId });
      return false;
    }

    if (event.entityType === 'task') {
      await incrementPostponeCount(event.entityId);
    }

    try {
      const { startsAt, endsAt } = buildBlockEventRange(date, block, event.duration);
      const { error } = await supabase
        .from('time_events')
        .update({
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          time_block: block,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      void requestCalendarSyncProcessing('timeline-reschedule-block');
      await loadEvents();
      logger.debug('Event rescheduled to block', { eventId, date: formatTimelineDate(date), block });
      return true;
    } catch (error: any) {
      logger.error('Failed to reschedule event to block', { error: error.message, eventId });
      return false;
    }
  }, [user, events, incrementPostponeCount, loadEvents]);

  const resizeEvent = useCallback(async (eventId: string, newDuration: number): Promise<boolean> => {
    if (!user) return false;

    const event = events.find((entry) => entry.id === eventId);
    if (!event) {
      logger.warn('Event not found for resizing', { eventId });
      return false;
    }

    try {
      const endsAt = new Date(event.startsAt.getTime() + newDuration * 60 * 1000);
      const { error } = await supabase
        .from('time_events')
        .update({
          duration: newDuration,
          ends_at: endsAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      void requestCalendarSyncProcessing('timeline-resize-event');
      await loadEvents();
      logger.debug('Event resized', { eventId, newDuration });
      return true;
    } catch (error: any) {
      logger.error('Failed to resize event', { error: error.message, eventId });
      return false;
    }
  }, [user, events, loadEvents]);

  const unscheduleEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user) return false;

    const event = events.find((entry) => entry.id === eventId);
    if (!event) return false;

    try {
      if (event.entityType === 'recovery') {
        const { error } = await supabase
          .from('time_events')
          .delete()
          .eq('id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;
        await loadEvents();
        return true;
      }

      const success = await deleteEntityEvent(
        event.entityType as 'task' | 'habit' | 'challenge',
        event.entityId
      );

      if (success) {
        await recalculateBreaks(new Date(event.startsAt), event.timeBlock as TimeBlock | undefined);
        await loadEvents();
        logger.debug('Event unscheduled', { eventId });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to unschedule event', { error: error.message, eventId });
      return false;
    }
  }, [user, events, deleteEntityEvent, recalculateBreaks, loadEvents]);

  const handleCompleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) return false;

    const newStatus = event.status === 'completed' ? 'scheduled' : 'completed';
    const success = await updateEventStatus(
      event.entityType as 'task' | 'habit' | 'challenge',
      event.entityId,
      newStatus
    );

    if (success) {
      if (event.entityType === 'task') {
        const task = tasks.find((entry) => entry.id === event.entityId);
        if (task) {
          await toggleTaskCompletion(task.id);
        }
      }
      await loadEvents();
    }

    return success;
  }, [events, tasks, updateEventStatus, toggleTaskCompletion, loadEvents]);

  const hasConflict = useCallback((date: Date, hour: number, minute: number, duration: number): boolean => {
    const testEvent = createConflictTestEvent(user?.id || '', date, hour, minute, duration);
    return checkConflicts(testEvent).length > 0;
  }, [user, checkConflicts]);

  const getTaskById = useCallback((taskId: string): Task | undefined => {
    return tasks.find((task) => task.id === taskId);
  }, [tasks]);

  const getEventById = useCallback((eventId: string): TimeEvent | undefined => {
    return events.find((event) => event.id === eventId);
  }, [events]);

  return {
    unscheduledTasks,
    scheduledEvents,
    overdueEvents,
    scheduleTask,
    rescheduleEvent,
    resizeEvent,
    scheduleTaskToBlock,
    rescheduleEventToBlock,
    unscheduleEvent,
    completeEvent: handleCompleteEvent,
    hasConflict,
    getTaskById,
    getEventById,
    reload: loadEvents,
  };
};

export type TimelineSchedulingReturn = ReturnType<typeof useTimelineScheduling>;


