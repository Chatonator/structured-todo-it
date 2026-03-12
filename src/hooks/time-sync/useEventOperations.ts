/**
 * useEventOperations - Generic CRUD operations on time_events
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TimeEvent, RecurrenceConfig } from '@/lib/time/types';
import { logger } from '@/lib/logger';
import { requestCalendarSyncProcessing } from '@/lib/calendar/requestCalendarSync';

export const useEventOperations = () => {
  const { user } = useAuth();

  /** Delete the time_event for an entity */
  const deleteEntityEvent = useCallback(async (
    entityType: 'task' | 'habit' | 'challenge',
    entityId: string
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('time_events')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id);
      if (error) throw error;
      logger.debug('TimeEvent supprimé', { entityType, entityId });
      void requestCalendarSyncProcessing('delete-entity-event');
      return true;
    } catch (error: any) {
      logger.error('Erreur suppression time_event', { error: error.message, entityType, entityId });
      return false;
    }
  }, [user]);

  /** Update event status */
  const updateEventStatus = useCallback(async (
    entityType: 'task' | 'habit' | 'challenge',
    entityId: string,
    status: 'scheduled' | 'completed' | 'cancelled' | 'missed'
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('time_events')
        .update(updates)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id);
      if (error) throw error;
      logger.debug('Statut time_event mis à jour', { entityType, entityId, status });
      void requestCalendarSyncProcessing('update-event-status');
      return true;
    } catch (error: any) {
      logger.error('Erreur update statut time_event', { error: error.message });
      return false;
    }
  }, [user]);

  /** Complete an occurrence (for recurring events) */
  const completeOccurrence = useCallback(async (
    eventId: string,
    date: Date
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = new Date(dateStr);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from('time_occurrences')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .gte('starts_at', startOfDay.toISOString())
        .lte('starts_at', endOfDay.toISOString());

      if (existing && existing.length > 0) {
        if (existing[0].status === 'completed') {
          await supabase.from('time_occurrences').delete().eq('id', existing[0].id);
        } else {
          await supabase.from('time_occurrences')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', existing[0].id);
        }
        return true;
      }

      const { error } = await supabase.from('time_occurrences').insert({
        event_id: eventId,
        user_id: user.id,
        starts_at: date.toISOString(),
        ends_at: new Date(date.getTime() + 15 * 60000).toISOString(),
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (error) throw error;
      logger.debug('Occurrence complétée', { eventId, date: dateStr });
      return true;
    } catch (error: any) {
      logger.error('Erreur completion occurrence', { error: error.message, eventId });
      return false;
    }
  }, [user]);

  /** Get the time_event for an entity */
  const getEntityEvent = useCallback(async (
    entityType: 'task' | 'habit' | 'challenge',
    entityId: string
  ): Promise<TimeEvent | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('time_events')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Erreur récupération time_event', { error: error.message });
        return null;
      }
      if (!data) return null;

      return {
        id: data.id,
        entityType: data.entity_type as TimeEvent['entityType'],
        entityId: data.entity_id,
        userId: data.user_id,
        startsAt: new Date(data.starts_at),
        endsAt: data.ends_at ? new Date(data.ends_at) : undefined,
        duration: data.duration,
        isAllDay: data.is_all_day || false,
        timezone: data.timezone || undefined,
        recurrence: data.recurrence as unknown as RecurrenceConfig | undefined,
        title: data.title,
        description: data.description || undefined,
        color: data.color || undefined,
        priority: data.priority || undefined,
        status: data.status as TimeEvent['status'],
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error: any) {
      logger.error('Erreur récupération time_event', { error: error.message });
      return null;
    }
  }, [user]);

  return {
    deleteEntityEvent,
    updateEventStatus,
    completeOccurrence,
    getEntityEvent
  };
};
