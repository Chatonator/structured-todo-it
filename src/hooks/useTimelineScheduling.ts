/**
 * useTimelineScheduling - Hook for scheduling tasks in the timeline
 * Handles drag-drop scheduling, event management, and conflict detection
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useTimeHub } from '@/hooks/useTimeHub';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { Task } from '@/types/task';
import { TimeEvent, DateRange } from '@/lib/time/types';
import { logger } from '@/lib/logger';

interface ScheduleTaskParams {
  taskId: string;
  date: Date;
  hour: number;
  minute: number;
}

export const useTimelineScheduling = (dateRange: DateRange) => {
  const { user } = useAuth();
  const { tasks, updateTask } = useTasks();
  const { events, loadEvents, checkConflicts, completeEvent } = useTimeHub(dateRange);
  const { syncTaskEventWithSchedule, deleteEntityEvent } = useTimeEventSync();

  // Get unscheduled tasks (tasks without a time_event)
  const unscheduledTasks = useMemo(() => {
    const scheduledTaskIds = new Set(
      events
        .filter(e => e.entityType === 'task')
        .map(e => e.entityId)
    );
    
    return tasks.filter(t => 
      !t.isCompleted && 
      !scheduledTaskIds.has(t.id) &&
      t.level === 0 // Only main tasks
    );
  }, [tasks, events]);

  // Get scheduled events for the date range
  const scheduledEvents = useMemo(() => 
    events.filter(e => e.status !== 'cancelled'),
    [events]
  );

  /**
   * Schedule a task at a specific time
   */
  const scheduleTask = useCallback(async ({
    taskId,
    date,
    hour,
    minute
  }: ScheduleTaskParams): Promise<boolean> => {
    if (!user) return false;

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      logger.warn('Task not found for scheduling', { taskId });
      return false;
    }

    try {
      // Create the time string
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      // Sync with time_events
      const success = await syncTaskEventWithSchedule(task, {
        date,
        time,
        isRecurring: false
      });

      if (success) {
        await loadEvents();
        logger.debug('Task scheduled', { taskId, date, time });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to schedule task', { error: error.message, taskId });
      return false;
    }
  }, [user, tasks, syncTaskEventWithSchedule, loadEvents]);

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

    // If it's a task event, use the task scheduling flow
    if (event.entityType === 'task') {
      const task = tasks.find(t => t.id === event.entityId);
      if (task) {
        return await scheduleTask({
          taskId: task.id,
          date,
          hour,
          minute
        });
      }
    }

    return false;
  }, [user, events, tasks, scheduleTask]);

  /**
   * Unschedule an event (remove from timeline)
   */
  const unscheduleEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user) return false;

    const event = events.find(e => e.id === eventId);
    if (!event) return false;

    try {
      const success = await deleteEntityEvent(
        event.entityType as 'task' | 'habit' | 'challenge',
        event.entityId
      );

      if (success) {
        await loadEvents();
        logger.debug('Event unscheduled', { eventId });
      }

      return success;
    } catch (error: any) {
      logger.error('Failed to unschedule event', { error: error.message, eventId });
      return false;
    }
  }, [user, events, deleteEntityEvent, loadEvents]);

  /**
   * Complete an event
   */
  const handleCompleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    const success = await completeEvent(eventId);
    if (success) {
      await loadEvents();
    }
    return success;
  }, [completeEvent, loadEvents]);

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
    
    // Actions
    scheduleTask,
    rescheduleEvent,
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
