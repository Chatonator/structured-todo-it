/**
 * useRecurringTasks - Hook pour gérer les tâches récurrentes
 * Gère la réactivation des tâches récurrentes complétées
 */

import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { addDays, addWeeks, addMonths, startOfDay, isAfter, isBefore, format } from 'date-fns';

interface RecurrenceConfig {
  frequency: string;
  interval?: number;
  daysOfWeek?: number[];
}

interface TimeEventWithRecurrence {
  id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  starts_at: string;
  duration: number;
  status: string;
  recurrence: RecurrenceConfig | null;
  completed_at: string | null;
}

export const useRecurringTasks = () => {
  const { user } = useAuth();

  /**
   * Calcule la prochaine date d'occurrence selon la configuration de récurrence
   */
  const getNextOccurrenceDate = useCallback((
    currentDate: Date,
    recurrence: RecurrenceConfig
  ): Date => {
    const interval = recurrence.interval || 1;

    switch (recurrence.frequency) {
      case 'daily':
        return addDays(currentDate, interval);
      case 'weekly':
        return addWeeks(currentDate, interval);
      case 'bi-weekly':
        return addWeeks(currentDate, 2);
      case 'monthly':
        return addMonths(currentDate, interval);
      case 'yearly':
        return addMonths(currentDate, 12 * interval);
      default:
        return addDays(currentDate, 1);
    }
  }, []);

  /**
   * Vérifie et réactive les tâches récurrentes qui doivent réapparaître
   */
  const processRecurringTasks = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      const today = startOfDay(new Date());
      
      // Récupérer tous les time_events avec récurrence et status 'completed'
      const { data: completedEvents, error } = await supabase
        .from('time_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'task')
        .eq('status', 'completed')
        .not('recurrence', 'is', null);

      if (error) {
        logger.error('Erreur chargement tâches récurrentes', { error: error.message });
        return 0;
      }

      if (!completedEvents || completedEvents.length === 0) {
        logger.debug('Aucune tâche récurrente complétée à traiter');
        return 0;
      }

      let reactivatedCount = 0;

      for (const event of completedEvents) {
        const recurrence = event.recurrence as unknown as RecurrenceConfig | null;
        if (!recurrence || !event.completed_at) continue;

        const completedDate = new Date(event.completed_at);
        const nextOccurrence = getNextOccurrenceDate(completedDate, recurrence);

        // Si la prochaine occurrence est aujourd'hui ou dans le passé, réactiver
        if (isBefore(nextOccurrence, today) || format(nextOccurrence, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          // Mettre à jour le time_event pour la prochaine occurrence
          const { error: updateError } = await supabase
            .from('time_events')
            .update({
              starts_at: nextOccurrence.toISOString(),
              ends_at: new Date(nextOccurrence.getTime() + event.duration * 60000).toISOString(),
              status: 'scheduled',
              completed_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', event.id);

          if (updateError) {
            logger.error('Erreur réactivation tâche récurrente', { 
              eventId: event.id, 
              error: updateError.message 
            });
            continue;
          }

          // Réactiver la tâche associée
          const { error: taskError } = await supabase
            .from('tasks')
            .update({ isCompleted: false })
            .eq('id', event.entity_id)
            .eq('user_id', user.id);

          if (taskError) {
            logger.error('Erreur réactivation tâche', { 
              taskId: event.entity_id, 
              error: taskError.message 
            });
            continue;
          }

          reactivatedCount++;
          logger.info('Tâche récurrente réactivée', { 
            taskId: event.entity_id, 
            title: event.title,
            nextOccurrence: format(nextOccurrence, 'yyyy-MM-dd')
          });
        }
      }

      return reactivatedCount;
    } catch (error: any) {
      logger.error('Erreur traitement tâches récurrentes', { error: error.message });
      return 0;
    }
  }, [user, getNextOccurrenceDate]);

  /**
   * Crée un time_event pour une tâche récurrente si elle n'en a pas
   */
  const ensureRecurringTaskHasEvent = useCallback(async (
    taskId: string,
    taskName: string,
    recurrenceInterval: string,
    estimatedTime: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Vérifier si un event existe déjà
      const { data: existing } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .eq('user_id', user.id);

      if (existing && existing.length > 0) {
        return true; // Event existe déjà
      }

      // Créer l'event avec récurrence
      const today = startOfDay(new Date());
      today.setHours(9, 0, 0, 0); // Par défaut à 9h

      const recurrence: RecurrenceConfig = {
        frequency: recurrenceInterval === 'bi-monthly' ? 'bi-weekly' : recurrenceInterval,
        interval: 1
      };

      const { error } = await supabase
        .from('time_events')
        .insert({
          user_id: user.id,
          entity_type: 'task',
          entity_id: taskId,
          title: taskName,
          starts_at: today.toISOString(),
          ends_at: new Date(today.getTime() + estimatedTime * 60000).toISOString(),
          duration: estimatedTime,
          is_all_day: false,
          status: 'scheduled',
          recurrence: recurrence as any
        });

      if (error) {
        logger.error('Erreur création time_event pour tâche récurrente', { 
          taskId, 
          error: error.message 
        });
        return false;
      }

      logger.info('Time_event créé pour tâche récurrente', { taskId, taskName });
      return true;
    } catch (error: any) {
      logger.error('Erreur ensureRecurringTaskHasEvent', { error: error.message });
      return false;
    }
  }, [user]);

  /**
   * Récupère les infos de récurrence d'une tâche depuis time_events
   */
  const getTaskRecurrenceInfo = useCallback(async (taskId: string): Promise<{
    isRecurring: boolean;
    recurrenceInterval?: string;
    scheduledDate?: Date;
    scheduledTime?: string;
  } | null> => {
    if (!user) return null;

    try {
      const { data } = await supabase
        .from('time_events')
        .select('starts_at, recurrence')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return { isRecurring: false };

      const recurrence = data.recurrence as unknown as RecurrenceConfig | null;
      const startsAt = data.starts_at ? new Date(data.starts_at) : undefined;

      return {
        isRecurring: !!recurrence,
        recurrenceInterval: recurrence?.frequency,
        scheduledDate: startsAt,
        scheduledTime: startsAt ? format(startsAt, 'HH:mm') : undefined
      };
    } catch (error: any) {
      logger.error('Erreur getTaskRecurrenceInfo', { error: error.message, taskId });
      return null;
    }
  }, [user]);

  return {
    processRecurringTasks,
    ensureRecurringTaskHasEvent,
    getTaskRecurrenceInfo,
    getNextOccurrenceDate
  };
};
