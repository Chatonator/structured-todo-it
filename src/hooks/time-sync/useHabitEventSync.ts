/**
 * useHabitEventSync - Sync habits with time_events / time_occurrences
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Habit } from '@/types/habit';
import { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { mapHabitRecurrence } from './helpers';

export const useHabitEventSync = () => {
  const { user } = useAuth();

  /** Create or update a time_event for a habit */
  const syncHabitEvent = useCallback(async (habit: Habit): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: existingEvents } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'habit')
        .eq('entity_id', habit.id)
        .eq('user_id', user.id);

      const existingEventId = existingEvents?.[0]?.id;

      if (!habit.isActive) {
        if (existingEventId) {
          await supabase.from('time_events').delete().eq('id', existingEventId);
          logger.debug('TimeEvent supprimé pour habitude inactive', { habitId: habit.id });
        }
        return true;
      }

      const today = new Date();
      today.setHours(9, 0, 0, 0);
      const habitRecurrence = mapHabitRecurrence(habit);

      const eventData = {
        user_id: user.id,
        entity_type: 'habit',
        entity_id: habit.id,
        title: habit.name,
        description: habit.description || null,
        starts_at: today.toISOString(),
        duration: 15,
        is_all_day: true,
        status: 'scheduled',
        color: habit.color || null,
        recurrence: habitRecurrence as unknown as Json
      };

      if (existingEventId) {
        const { error } = await supabase.from('time_events').update(eventData).eq('id', existingEventId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('time_events').insert(eventData);
        if (error) throw error;
      }

      return true;
    } catch (error: any) {
      logger.error('Erreur sync time_event pour habitude', { error: error.message, habitId: habit.id });
      return false;
    }
  }, [user]);

  /** Check if habit is completed today via time_occurrences */
  const isHabitCompletedToday = useCallback(async (habitId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: event } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'habit')
        .eq('entity_id', habitId)
        .eq('user_id', user.id)
        .single();

      if (!event) return false;

      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: occurrence } = await supabase
        .from('time_occurrences')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('starts_at', startOfDay.toISOString())
        .lte('starts_at', endOfDay.toISOString());

      return (occurrence && occurrence.length > 0) || false;
    } catch {
      return false;
    }
  }, [user]);

  /** Toggle habit completion for today via time_occurrences */
  const toggleHabitCompletion = useCallback(async (habitId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: event } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'habit')
        .eq('entity_id', habitId)
        .eq('user_id', user.id)
        .single();

      if (!event) {
        logger.warn('Pas de time_event trouvé pour habitude', { habitId });
        return false;
      }

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const startOfDay = new Date(dateStr);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from('time_occurrences')
        .select('id, status')
        .eq('event_id', event.id)
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
        event_id: event.id,
        user_id: user.id,
        starts_at: today.toISOString(),
        ends_at: new Date(today.getTime() + 15 * 60000).toISOString(),
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      logger.error('Erreur toggle habit completion', { error: error.message, habitId });
      return false;
    }
  }, [user]);

  return { syncHabitEvent, isHabitCompletedToday, toggleHabitCompletion };
};
