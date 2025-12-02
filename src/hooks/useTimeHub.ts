/**
 * useTimeHub - React hook for unified time management
 * Integrates TimeEngine with React components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { TimeEngine } from '@/lib/time/TimeEngine';
import { EventRegistry } from '@/lib/time/EventRegistry';
import { EventNormalizer } from '@/lib/time/EventNormalizer';
import { 
  TimeEvent, 
  TimeOccurrence, 
  DateRange, 
  ConflictResult, 
  TimeSlot 
} from '@/lib/time/types';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { logger } from '@/lib/logger';

export const useTimeHub = (initialRange?: DateRange) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>(
    initialRange || {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  );

  // Initialize TimeEngine
  const timeEngine = useMemo(() => new TimeEngine(), []);

  /**
   * Load events from database
   */
  const loadEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedEvents = await EventRegistry.fetchEvents(user.id, range);
      setEvents(fetchedEvents);
    } catch (error: any) {
      logger.error('Failed to load events in useTimeHub', { error: error.message });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user, range]);

  /**
   * Get all occurrences for loaded events
   */
  const occurrences = useMemo(() => {
    return timeEngine.getMultipleOccurrences(events, range);
  }, [events, range, timeEngine]);

  /**
   * Create event from Task
   */
  const createEventFromTask = useCallback(async (task: Task): Promise<TimeEvent | null> => {
    if (!user) return null;

    const timeEvent = EventNormalizer.taskToTimeEvent(task, user.id);
    if (!timeEvent) return null;

    const created = await EventRegistry.createEvent(timeEvent);
    if (created) {
      await loadEvents();
    }
    return created;
  }, [user, loadEvents]);

  /**
   * Create event from Habit
   */
  const createEventFromHabit = useCallback(async (habit: Habit): Promise<TimeEvent | null> => {
    if (!user) return null;

    const timeEvent = EventNormalizer.habitToTimeEvent(habit, user.id);
    const created = await EventRegistry.createEvent(timeEvent);
    if (created) {
      await loadEvents();
    }
    return created;
  }, [user, loadEvents]);

  /**
   * Update event
   */
  const updateEvent = useCallback(async (
    eventId: string, 
    updates: Partial<TimeEvent>
  ): Promise<boolean> => {
    const success = await EventRegistry.updateEvent(eventId, updates);
    if (success) {
      await loadEvents();
    }
    return success;
  }, [loadEvents]);

  /**
   * Delete event
   */
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    const success = await EventRegistry.deleteEvent(eventId);
    if (success) {
      await loadEvents();
    }
    return success;
  }, [loadEvents]);

  /**
   * Check conflicts for a new event
   */
  const checkConflicts = useCallback((newEvent: TimeEvent): ConflictResult[] => {
    return timeEngine.checkConflicts(newEvent, events);
  }, [events, timeEngine]);

  /**
   * Find free time slots
   */
  const findFreeSlots = useCallback((minDuration: number): TimeSlot[] => {
    return timeEngine.findFreeSlots(range, events, minDuration);
  }, [range, events, timeEngine]);

  /**
   * Get next occurrence of an event
   */
  const getNextOccurrence = useCallback((event: TimeEvent, after?: Date): Date | null => {
    return timeEngine.getNextOccurrence(event, after);
  }, [timeEngine]);

  /**
   * Update date range
   */
  const updateRange = useCallback((newRange: DateRange) => {
    setRange(newRange);
  }, []);

  /**
   * Mark event as completed
   */
  const completeEvent = useCallback(async (eventId: string): Promise<boolean> => {
    return await EventRegistry.updateEventStatus(eventId, 'completed', new Date());
  }, []);

  /**
   * Get events by entity
   */
  const getEventsByEntity = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<TimeEvent[]> => {
    if (!user) return [];
    return await EventRegistry.fetchEventsByEntity(user.id, entityType, entityId);
  }, [user]);

  /**
   * Get total busy time in current range
   */
  const totalBusyTime = useMemo(() => {
    return timeEngine.getTotalBusyTime(range, events);
  }, [range, events, timeEngine]);

  /**
   * Get total free time in current range
   */
  const totalFreeTime = useMemo(() => {
    return timeEngine.getTotalFreeTime(range, events);
  }, [range, events, timeEngine]);

  // Load events on mount and when range changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    // Data
    events,
    occurrences,
    loading,
    range,
    totalBusyTime,
    totalFreeTime,

    // Actions
    createEventFromTask,
    createEventFromHabit,
    updateEvent,
    deleteEvent,
    completeEvent,
    updateRange,
    loadEvents,
    getEventsByEntity,

    // Calculations
    checkConflicts,
    findFreeSlots,
    getNextOccurrence,
    
    // TimeEngine instance (for advanced usage)
    timeEngine
  };
};
