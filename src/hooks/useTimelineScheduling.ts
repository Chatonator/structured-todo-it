/**
 * useTimelineScheduling - Hook for scheduling tasks in the timeline
 * Handles drag-drop scheduling, event management, and conflict detection
 * Includes automatic cleanup of overdue events
 * Includes automatic recovery breaks after task scheduling
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useTimeHub } from '@/hooks/useTimeHub';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { Task } from '@/types/task';
import { TimeEvent, DateRange, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { getSuggestionForDuration, buildBreakTitle, computeBlockBreaks } from '@/lib/time/RecoveryEngine';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast, isToday, startOfDay } from 'date-fns';

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

// Get middle hour of a time block
const getBlockStartHour = (block: TimeBlock): number => {
  return TIME_BLOCKS[block].startHour;
};

export const useTimelineScheduling = (dateRange: DateRange) => {
  const { user } = useAuth();
  const { tasks, updateTask, toggleTaskCompletion } = useTasks();
  const { events, loadEvents, checkConflicts, completeEvent } = useTimeHub(dateRange);
  const { syncTaskEventWithSchedule, deleteEntityEvent, updateEventStatus } = useTimeEventSync();
  
  // Track if cleanup has been run to avoid duplicate calls
  const cleanupRunRef = useRef(false);

  // Get unscheduled tasks (tasks without a time_event)
  // Includes both regular tasks AND project tasks (level 0)
  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(
      events
        .filter(e => e.entityType === 'task')
        .map(e => e.entityId)
    );
    
    // Filter: not completed, not scheduled, main tasks only (level 0)
    return tasks.filter(t => 
      !t.isCompleted && 
      !scheduledTaskIds.has(t.id) &&
      t.level === 0
    );
  }, [tasks, events]);

  // Get scheduled events for the date range (non-cancelled, exclude recovery from drag sources)
  const scheduledEvents = useMemo(() => 
    events.filter(e => e.status !== 'cancelled'),
    [events]
  );

  // Helper: get block events for accumulation check
  const getBlockEvents = useCallback((date: Date, block?: TimeBlock): TimeEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => {
      const eventDate = format(e.startsAt, 'yyyy-MM-dd');
      if (eventDate !== dateStr) return false;
      if (e.status === 'cancelled') return false;
      if (block && e.timeBlock !== block) return false;
      return true;
    });
  }, [events]);

  /**
   * Recalculate all recovery breaks for a given date (and optionally block).
   * Deletes all existing recovery breaks, then computes new ones based on task order.
   */
  const recalculateBreaks = useCallback(async (date: Date, block?: TimeBlock): Promise<void> => {
    if (!user) return;

    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      // 1. Delete all existing recovery breaks for this date (and block if specified)
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

      // 2. Fetch fresh task events directly from DB (not stale React state)
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

      // 3. Convert DB rows to TimeEvent objects for computeBlockBreaks
      const freshEvents: TimeEvent[] = (freshRows || []).map(row => ({
        id: row.id,
        entityType: row.entity_type as TimeEvent['entityType'],
        entityId: row.entity_id,
        userId: row.user_id,
        startsAt: new Date(row.starts_at),
        endsAt: row.ends_at ? new Date(row.ends_at) : new Date(new Date(row.starts_at).getTime() + row.duration * 60 * 1000),
        duration: row.duration,
        isAllDay: row.is_all_day || false,
        title: row.title,
        description: row.description || undefined,
        color: row.color || undefined,
        status: row.status as TimeEvent['status'],
        timeBlock: (row.time_block as TimeBlock) || undefined,
        createdAt: new Date(row.created_at || ''),
        updatedAt: new Date(row.updated_at || ''),
      }));

      // 4. Compute where breaks should go
      const taskInfos = tasks.map(t => ({ id: t.id, isImportant: t.isImportant }));
      const plannedBreaks = computeBlockBreaks(freshEvents, taskInfos);

      // 5. Create all breaks
      for (const pb of plannedBreaks) {
        const suggestion = getSuggestionForDuration(pb.breakDuration);
        const title = buildBreakTitle(suggestion, pb.breakDuration);
        const endsAt = new Date(pb.afterTaskEndsAt.getTime() + pb.breakDuration * 60 * 1000);

        await supabase
          .from('time_events')
          .insert({
            user_id: user.id,
            entity_type: 'recovery',
            entity_id: pb.afterTaskId,
            starts_at: pb.afterTaskEndsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            duration: pb.breakDuration,
            is_all_day: false,
            title,
            description: `recovery:${pb.afterTaskId}`,
            color: '#86efac',
            status: 'scheduled',
            time_block: pb.block || block || null,
          });
      }

      logger.debug('Recalculated breaks', { date: dateStr, block, count: plannedBreaks.length });
    } catch (error: any) {
      logger.warn('Failed to recalculate breaks', { error: error.message });
    }
  }, [user, tasks]);
  // Get overdue events (past, not completed, not cancelled)
  const overdueEvents = useMemo(() => {
    return events.filter(e => 
      isPast(e.startsAt) && 
      !isToday(e.startsAt) &&
      e.status !== 'completed' && 
      e.status !== 'cancelled' &&
      e.entityType === 'task' // Only tasks, not habits
    );
  }, [events]);

  /**
   * Cleanup overdue events - automatically unschedule past tasks
   * This makes them reappear in the "To Schedule" panel
   */
  const cleanupOverdueEvents = useCallback(async () => {
    if (!user || overdueEvents.length === 0) return;
    
    logger.debug('Cleaning up overdue events', { count: overdueEvents.length });
    
    for (const event of overdueEvents) {
      try {
        // Delete the time_event - task will reappear as unscheduled
        await deleteEntityEvent('task', event.entityId);
        logger.debug('Auto-unscheduled overdue task', { 
          taskId: event.entityId,
          taskTitle: event.title,
          originalDate: format(event.startsAt, 'yyyy-MM-dd')
        });
      } catch (error: any) {
        logger.warn('Failed to cleanup overdue event', { 
          eventId: event.id, 
          error: error.message 
        });
      }
    }
    
    // Reload events after cleanup
    await loadEvents();
  }, [user, overdueEvents, deleteEntityEvent, loadEvents]);

  // Run cleanup on mount and when overdueEvents change
  useEffect(() => {
    // Only run once per component lifecycle and when there are overdue events
    if (overdueEvents.length > 0 && !cleanupRunRef.current) {
      cleanupRunRef.current = true;
      cleanupOverdueEvents();
    }
  }, [overdueEvents.length, cleanupOverdueEvents]);

  /**
   * Schedule a task at a specific time (legacy - for precise time slots)
   * SECURED: Validates task exists and is not already scheduled
   */
  const scheduleTask = useCallback(async ({
    taskId,
    date,
    hour,
    minute,
    duration
  }: ScheduleTaskParams): Promise<boolean> => {
    if (!user) return false;

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      logger.warn('Task not found for scheduling', { taskId });
      return false;
    }

    // GUARD: Check if task is already completed
    if (task.isCompleted) {
      logger.warn('Cannot schedule completed task', { taskId });
      return false;
    }

    // GUARD: Check if already scheduled (prevent duplicates)
    const existingEvent = events.find(e => 
      e.entityType === 'task' && 
      e.entityId === taskId &&
      e.status !== 'cancelled'
    );
    
    if (existingEvent) {
      logger.debug('Task already scheduled, will reschedule', { taskId, existingEventId: existingEvent.id });
    }

    try {
      // Create the time string
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      // Use provided duration or task's estimated time
      const taskWithDuration = duration 
        ? { ...task, duration: duration, estimatedTime: duration }
        : task;
      
      // Sync with time_events
      const success = await syncTaskEventWithSchedule(taskWithDuration, {
        date,
        time,
        isRecurring: false
      });

      if (success) {
        // Recalculate all breaks for this date
        await recalculateBreaks(date);
        await loadEvents();
        logger.debug('Task scheduled', { taskId, date, time });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to schedule task', { error: error.message, taskId });
      return false;
    }
  }, [user, tasks, events, syncTaskEventWithSchedule, loadEvents, recalculateBreaks]);

  /**
   * Schedule a task to a time block (new block-based scheduling)
   * SECURED: Same guards as scheduleTask
   */
  const scheduleTaskToBlock = useCallback(async ({
    taskId,
    date,
    block,
    duration
  }: ScheduleTaskToBlockParams): Promise<boolean> => {
    if (!user) return false;

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      logger.warn('Task not found for scheduling', { taskId });
      return false;
    }

    // GUARD: Check if task is already completed
    if (task.isCompleted) {
      logger.warn('Cannot schedule completed task', { taskId });
      return false;
    }

    try {
      const hour = getBlockStartHour(block);
      const time = `${String(hour).padStart(2, '0')}:00`;
      
      const taskWithDuration = duration 
        ? { ...task, duration: duration, estimatedTime: duration }
        : task;
      
      // Sync with time_events
      const success = await syncTaskEventWithSchedule(taskWithDuration, {
        date,
        time,
        isRecurring: false
      });

      if (success) {
        // Update the time_block field
        await supabase
          .from('time_events')
          .update({ time_block: block })
          .eq('entity_type', 'task')
          .eq('entity_id', taskId)
          .eq('user_id', user.id);

        // Recalculate all breaks for this block
        await recalculateBreaks(date, block);

        await loadEvents();
        logger.debug('Task scheduled to block', { taskId, date: format(date, 'yyyy-MM-dd'), block });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to schedule task to block', { error: error.message, taskId });
      return false;
    }
  }, [user, tasks, syncTaskEventWithSchedule, loadEvents, recalculateBreaks]);

  /**
   * Reschedule an existing event to a new time
   */
  const rescheduleEvent = useCallback(async (
    eventId: string,
    date: Date,
    hour: number,
    minute: number
  ): Promise<boolean> => {
    if (!user) return false;

    const event = events.find(e => e.id === eventId);
    if (!event) {
      logger.warn('Event not found for rescheduling', { eventId });
      return false;
    }

    // Increment postpone_count for task events
    if (event.entityType === 'task') {
      try {
        const { data: item } = await supabase
          .from('items')
          .select('postpone_count')
          .eq('id', event.entityId)
          .single();
        if (item) {
          await supabase
            .from('items')
            .update({ postpone_count: (item.postpone_count ?? 0) + 1 })
            .eq('id', event.entityId);
        }
      } catch (e: any) {
        logger.warn('Failed to increment postpone_count', { error: e.message });
      }

      const task = tasks.find(t => t.id === event.entityId);
      if (task) {
        return await scheduleTask({
          taskId: task.id,
          date,
          hour,
          minute,
          duration: event.duration,
        });
      }
    }

    return false;
  }, [user, events, tasks, scheduleTask]);

  /**
   * Reschedule an existing event to a new block
   */
  const rescheduleEventToBlock = useCallback(async (
    eventId: string,
    date: Date,
    block: TimeBlock
  ): Promise<boolean> => {
    if (!user) return false;

    const event = events.find(e => e.id === eventId);
    if (!event) {
      logger.warn('Event not found for rescheduling', { eventId });
      return false;
    }

    // Increment postpone_count for task events
    if (event.entityType === 'task') {
      try {
        const { data: item } = await supabase
          .from('items')
          .select('postpone_count')
          .eq('id', event.entityId)
          .single();
        if (item) {
          await supabase
            .from('items')
            .update({ postpone_count: (item.postpone_count ?? 0) + 1 })
            .eq('id', event.entityId);
        }
      } catch (e: any) {
        logger.warn('Failed to increment postpone_count', { error: e.message });
      }
    }

    try {
      const hour = getBlockStartHour(block);
      const dateStr = format(date, 'yyyy-MM-dd');
      const startsAt = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`);
      const endsAt = new Date(startsAt.getTime() + event.duration * 60 * 1000);

      const { error } = await supabase
        .from('time_events')
        .update({
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          time_block: block,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEvents();
      logger.debug('Event rescheduled to block', { eventId, date: dateStr, block });
      return true;
    } catch (error: any) {
      logger.error('Failed to reschedule event to block', { error: error.message, eventId });
      return false;
    }
  }, [user, events, loadEvents]);

  /**
   * Resize an event (change duration)
   */
  const resizeEvent = useCallback(async (
    eventId: string,
    newDuration: number
  ): Promise<boolean> => {
    if (!user) return false;

    const event = events.find(e => e.id === eventId);
    if (!event) {
      logger.warn('Event not found for resizing', { eventId });
      return false;
    }

    try {
      // Calculate new end time
      const newEndsAt = new Date(event.startsAt.getTime() + newDuration * 60 * 1000);

      // Update the event in database
      const { error } = await supabase
        .from('time_events')
        .update({
          duration: newDuration,
          ends_at: newEndsAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadEvents();
      logger.debug('Event resized', { eventId, newDuration });
      return true;
    } catch (error: any) {
      logger.error('Failed to resize event', { error: error.message, eventId });
      return false;
    }
  }, [user, events, loadEvents]);

  /**
   * Unschedule an event (remove from timeline)
   */
  const unscheduleEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user) return false;

    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    try {
      // If it's a recovery event, just delete it directly
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
        // Recalculate breaks for the date (removing unscheduled task may change break layout)
        const eventDate = new Date(event.startsAt);
        const block = event.timeBlock as TimeBlock | undefined;
        await recalculateBreaks(eventDate, block);
        await loadEvents();
        logger.debug('Event unscheduled', { eventId });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to unschedule event', { error: error.message, eventId });
      return false;
    }
  }, [user, events, deleteEntityEvent, loadEvents, recalculateBreaks]);

  /**
   * Complete an event
   */
  const handleCompleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    // Toggle completion status
    const newStatus = event.status === 'completed' ? 'scheduled' : 'completed';
    
    const success = await updateEventStatus(
      event.entityType as 'task' | 'habit' | 'challenge',
      event.entityId,
      newStatus
    );
    
    if (success) {
      // Also update the task's completion status (use toggleTaskCompletion to trigger rewards)
      if (event.entityType === 'task') {
        const task = tasks.find(t => t.id === event.entityId);
        if (task) {
          await toggleTaskCompletion(task.id);
        }
      }
      await loadEvents();
    }
    
    return success;
  }, [events, tasks, updateEventStatus, toggleTaskCompletion, loadEvents]);

  /**
   * Check if a time slot has conflicts
   */
  const hasConflict = useCallback((
    date: Date,
    hour: number,
    minute: number,
    duration: number
  ): boolean => {
    const startsAt = new Date(date);
    startsAt.setHours(hour, minute, 0, 0);
    
    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

    const testEvent: TimeEvent = {
      id: 'test',
      entityType: 'task',
      entityId: 'test',
      userId: user?.id || '',
      startsAt,
      endsAt,
      duration,
      isAllDay: false,
      title: 'Test',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const conflicts = checkConflicts(testEvent);
    return conflicts.length > 0;
  }, [user, checkConflicts]);

  /**
   * Get task by ID
   */
  const getTaskById = useCallback((taskId: string): Task | undefined => {
    return tasks.find(t => t.id === taskId);
  }, [tasks]);

  /**
   * Get event by ID
   */
  const getEventById = useCallback((eventId: string): TimeEvent | undefined => {
    return events.find(e => e.id === eventId);
  }, [events]);

  return {
    // Data
    unscheduledTasks,
    scheduledEvents,
    overdueEvents,
    
    // Actions - legacy
    scheduleTask,
    rescheduleEvent,
    resizeEvent,
    
    // Actions - block-based
    scheduleTaskToBlock,
    rescheduleEventToBlock,
    
    // Common actions
    unscheduleEvent,
    completeEvent: handleCompleteEvent,
    
    // Helpers
    hasConflict,
    getTaskById,
    getEventById,
    
    // Refresh
    reload: loadEvents
  };
};

export type TimelineSchedulingReturn = ReturnType<typeof useTimelineScheduling>;
