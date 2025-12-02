/**
 * EventRegistry - Manage time events storage and retrieval
 */

import { supabase } from '@/integrations/supabase/client';
import { TimeEvent, TimeEventRow, DateRange } from './types';
import { EventNormalizer } from './EventNormalizer';
import { logger } from '@/lib/logger';

export class EventRegistry {
  /**
   * Fetch events for a user within a date range
   */
  static async fetchEvents(userId: string, range?: DateRange): Promise<TimeEvent[]> {
    try {
      let query = supabase
        .from('time_events')
        .select('*')
        .eq('user_id', userId);

      if (range) {
        query = query
          .gte('starts_at', range.start.toISOString())
          .lte('starts_at', range.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => EventNormalizer.rowToTimeEvent(row as TimeEventRow));
    } catch (error: any) {
      logger.error('Failed to fetch time events', { error: error.message, userId, range });
      return [];
    }
  }

  /**
   * Fetch a single event by ID
   */
  static async fetchEventById(eventId: string): Promise<TimeEvent | null> {
    try {
      const { data, error } = await supabase
        .from('time_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      return data ? EventNormalizer.rowToTimeEvent(data as TimeEventRow) : null;
    } catch (error: any) {
      logger.error('Failed to fetch event by ID', { error: error.message, eventId });
      return null;
    }
  }

  /**
   * Fetch events by entity (e.g., all events for a specific task)
   */
  static async fetchEventsByEntity(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<TimeEvent[]> {
    try {
      const { data, error } = await supabase
        .from('time_events')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;

      return (data || []).map(row => EventNormalizer.rowToTimeEvent(row as TimeEventRow));
    } catch (error: any) {
      logger.error('Failed to fetch events by entity', { 
        error: error.message, 
        userId, 
        entityType, 
        entityId 
      });
      return [];
    }
  }

  /**
   * Create a new time event
   */
  static async createEvent(event: TimeEvent): Promise<TimeEvent | null> {
    try {
      const row = EventNormalizer.timeEventToRow(event) as any;

      const { data, error } = await supabase
        .from('time_events')
        .insert([row])
        .select()
        .single();

      if (error) throw error;

      logger.info('Time event created', { eventId: data.id });
      return data ? EventNormalizer.rowToTimeEvent(data as TimeEventRow) : null;
    } catch (error: any) {
      logger.error('Failed to create time event', { error: error.message, event });
      return null;
    }
  }

  /**
   * Update an existing time event
   */
  static async updateEvent(eventId: string, updates: Partial<TimeEvent>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.startsAt) updateData.starts_at = updates.startsAt.toISOString();
      if (updates.endsAt) updateData.ends_at = updates.endsAt.toISOString();
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.isAllDay !== undefined) updateData.is_all_day = updates.isAllDay;
      if (updates.timezone) updateData.timezone = updates.timezone;
      if (updates.recurrence) updateData.recurrence = updates.recurrence;
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status) updateData.status = updates.status;
      if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();

      const { error } = await supabase
        .from('time_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      logger.info('Time event updated', { eventId });
      return true;
    } catch (error: any) {
      logger.error('Failed to update time event', { error: error.message, eventId, updates });
      return false;
    }
  }

  /**
   * Delete a time event
   */
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      logger.info('Time event deleted', { eventId });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete time event', { error: error.message, eventId });
      return false;
    }
  }

  /**
   * Delete all events for an entity
   */
  static async deleteEventsByEntity(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_events')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;

      logger.info('Events deleted for entity', { entityType, entityId });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete events for entity', { 
        error: error.message, 
        userId, 
        entityType, 
        entityId 
      });
      return false;
    }
  }

  /**
   * Update event status
   */
  static async updateEventStatus(
    eventId: string,
    status: TimeEvent['status'],
    completedAt?: Date
  ): Promise<boolean> {
    try {
      const updates: any = { status };
      if (completedAt) {
        updates.completed_at = completedAt.toISOString();
      }

      const { error } = await supabase
        .from('time_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      logger.info('Event status updated', { eventId, status });
      return true;
    } catch (error: any) {
      logger.error('Failed to update event status', { error: error.message, eventId, status });
      return false;
    }
  }
}
