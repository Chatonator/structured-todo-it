/**
 * useTimeEventSync - Hook centralisé pour synchroniser les entités avec time_events
 * Source de vérité unique pour toutes les données temporelles
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Task, RecurrenceInterval } from '@/types/task';
import { Habit } from '@/types/habit';
import { TimeEvent, RecurrenceConfig, RecurrenceFrequency } from '@/lib/time/types';
import { logger } from '@/lib/logger';
import { Json } from '@/integrations/supabase/types';

// Interface pour les infos de planification
interface ScheduleInfo {
  date?: Date;
  time?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
}

// Map task recurrence to TimeEvent recurrence
const mapTaskRecurrence = (interval: string): RecurrenceConfig => {
  const frequencyMap: Record<string, RecurrenceFrequency> = {
    'daily': 'daily',
    'weekly': 'weekly',
    'bi-monthly': 'bi-weekly',
    'monthly': 'monthly'
  };

  return {
    frequency: frequencyMap[interval] || 'daily',
    interval: 1
  };
};

// Map habit frequency to TimeEvent recurrence
const mapHabitRecurrence = (habit: Habit): RecurrenceConfig => {
  switch (habit.frequency) {
    case 'daily':
      return { frequency: 'daily', interval: 1 };
    case 'weekly':
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: habit.targetDays || undefined
      };
    case 'x-times-per-week':
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: habit.targetDays || undefined
      };
    case 'monthly':
      return {
        frequency: 'monthly',
        interval: 1,
        daysOfMonth: habit.targetDays || undefined
      };
    case 'x-times-per-month':
      return {
        frequency: 'monthly',
        interval: 1
      };
    case 'custom':
      return {
        frequency: 'custom',
        interval: 1,
        daysOfWeek: habit.targetDays || undefined
      };
    default:
      return { frequency: 'daily', interval: 1 };
  }
};

// Map subCategory to priority
const getPriorityFromSubCategory = (subCategory: string): number => {
  const priorityMap: Record<string, number> = {
    'Le plus important': 4,
    'Important': 3,
    'Peut attendre': 2,
    "Si j'ai le temps": 1
  };
  return priorityMap[subCategory] || 0;
};

interface ChallengeInfo {
  id: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly';
  assignedDate: string;
  expiresAt: string;
}

export const useTimeEventSync = () => {
  const { user } = useAuth();

  /**
   * Crée ou met à jour un time_event pour une tâche avec des infos de planification séparées
   */
  const syncTaskEventWithSchedule = useCallback(async (
    task: Task, 
    scheduleInfo?: ScheduleInfo
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Chercher un événement existant pour cette tâche
      const { data: existingEvents } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .eq('user_id', user.id);

      const existingEventId = existingEvents?.[0]?.id;

      // Vérifier si on a une planification
      const hasSchedule = scheduleInfo?.date && scheduleInfo?.time;

      // Si pas de planification, supprimer l'événement existant s'il y en a un
      if (!hasSchedule) {
        if (existingEventId) {
          await supabase
            .from('time_events')
            .delete()
            .eq('id', existingEventId);
          logger.debug('TimeEvent supprimé pour tâche sans planification', { taskId: task.id });
        }
        return true;
      }

      // Calculer les dates à partir des infos de planification
      const dateStr = scheduleInfo.date!.toISOString().split('T')[0];
      const startsAt = new Date(`${dateStr}T${scheduleInfo.time}:00`);
      
      const duration = task.duration || task.estimatedTime || 30;
      const endsAt = new Date(startsAt.getTime() + duration * 60000);

      // Préparer la récurrence
      const recurrence = scheduleInfo.isRecurring && scheduleInfo.recurrenceInterval 
        ? mapTaskRecurrence(scheduleInfo.recurrenceInterval) 
        : null;
        
      const eventData = {
        user_id: user.id,
        entity_type: 'task',
        entity_id: task.id,
        title: task.name,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration,
        is_all_day: false,
        status: task.isCompleted ? 'completed' : 'scheduled',
        completed_at: task.isCompleted ? new Date().toISOString() : null,
        recurrence: recurrence as unknown as Json,
        priority: task.subCategory ? getPriorityFromSubCategory(task.subCategory) : null
      };

      if (existingEventId) {
        // Mettre à jour l'événement existant
        const { error } = await supabase
          .from('time_events')
          .update(eventData)
          .eq('id', existingEventId);

        if (error) throw error;
        logger.debug('TimeEvent mis à jour pour tâche', { taskId: task.id });
      } else {
        // Créer un nouvel événement
        const { error } = await supabase
          .from('time_events')
          .insert(eventData);

        if (error) throw error;
        logger.debug('TimeEvent créé pour tâche', { taskId: task.id });
      }

      return true;
    } catch (error: any) {
      logger.error('Erreur sync time_event pour tâche', { error: error.message, taskId: task.id });
      return false;
    }
  }, [user]);

  /**
   * Crée ou met à jour un time_event pour une habitude
   */
  const syncHabitEvent = useCallback(async (habit: Habit): Promise<boolean> => {
    if (!user) return false;

    try {
      // Chercher un événement existant
      const { data: existingEvents } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'habit')
        .eq('entity_id', habit.id)
        .eq('user_id', user.id);

      const existingEventId = existingEvents?.[0]?.id;

      // Si habitude inactive, supprimer l'événement
      if (!habit.isActive) {
        if (existingEventId) {
          await supabase
            .from('time_events')
            .delete()
            .eq('id', existingEventId);
          logger.debug('TimeEvent supprimé pour habitude inactive', { habitId: habit.id });
        }
        return true;
      }

      // Préparer les dates (par défaut 9h du matin)
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
        duration: 15, // 15 min par défaut pour les habitudes
        is_all_day: true,
        status: 'scheduled',
        color: habit.color || null,
        recurrence: habitRecurrence as unknown as Json
      };

      if (existingEventId) {
        const { error } = await supabase
          .from('time_events')
          .update(eventData)
          .eq('id', existingEventId);

        if (error) throw error;
        logger.debug('TimeEvent mis à jour pour habitude', { habitId: habit.id });
      } else {
        const { error } = await supabase
          .from('time_events')
          .insert(eventData);

        if (error) throw error;
        logger.debug('TimeEvent créé pour habitude', { habitId: habit.id });
      }

      return true;
    } catch (error: any) {
      logger.error('Erreur sync time_event pour habitude', { error: error.message, habitId: habit.id });
      return false;
    }
  }, [user]);

  /**
   * Crée ou met à jour un time_event pour un défi
   */
  const syncChallengeEvent = useCallback(async (challenge: ChallengeInfo): Promise<boolean> => {
    if (!user) return false;

    try {
      // Chercher un événement existant
      const { data: existingEvents } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'challenge')
        .eq('entity_id', challenge.id)
        .eq('user_id', user.id);

      const existingEventId = existingEvents?.[0]?.id;

      // Calculer les dates
      const startsAt = new Date(challenge.assignedDate);
      startsAt.setHours(0, 0, 0, 0);
      
      const endsAt = new Date(challenge.expiresAt);
      endsAt.setHours(23, 59, 59, 999);

      // Durée en minutes (pour les défis, c'est la durée totale de validité)
      const duration = challenge.type === 'daily' ? 24 * 60 : 7 * 24 * 60;

      const eventData = {
        user_id: user.id,
        entity_type: 'challenge',
        entity_id: challenge.id,
        title: challenge.name,
        description: challenge.description || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration,
        is_all_day: true,
        status: 'scheduled',
        recurrence: null
      };

      if (existingEventId) {
        const { error } = await supabase
          .from('time_events')
          .update(eventData)
          .eq('id', existingEventId);

        if (error) throw error;
        logger.debug('TimeEvent mis à jour pour défi', { challengeId: challenge.id });
      } else {
        const { error } = await supabase
          .from('time_events')
          .insert(eventData);

        if (error) throw error;
        logger.debug('TimeEvent créé pour défi', { challengeId: challenge.id });
      }

      return true;
    } catch (error: any) {
      logger.error('Erreur sync time_event pour défi', { error: error.message, challengeId: challenge.id });
      return false;
    }
  }, [user]);

  /**
   * Supprime le time_event associé à une entité
   */
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
      return true;
    } catch (error: any) {
      logger.error('Erreur suppression time_event', { error: error.message, entityType, entityId });
      return false;
    }
  }, [user]);

  /**
   * Marque une occurrence comme complétée (pour récurrence/habitudes)
   */
  const completeOccurrence = useCallback(async (
    eventId: string,
    date: Date
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Vérifier si une occurrence existe déjà pour cette date
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
        // Toggle: si déjà complété, supprimer
        if (existing[0].status === 'completed') {
          await supabase
            .from('time_occurrences')
            .delete()
            .eq('id', existing[0].id);
          return true;
        } else {
          // Mettre à jour le statut
          await supabase
            .from('time_occurrences')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString() 
            })
            .eq('id', existing[0].id);
          return true;
        }
      }

      // Créer une nouvelle occurrence complétée
      const { error } = await supabase
        .from('time_occurrences')
        .insert({
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

  /**
   * Met à jour le statut d'un événement (pour tâches non-récurrentes)
   */
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
      return true;
    } catch (error: any) {
      logger.error('Erreur update statut time_event', { error: error.message });
      return false;
    }
  }, [user]);

  /**
   * Récupère l'événement associé à une entité
   */
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

  /**
   * Vérifie si une habitude est complétée aujourd'hui via time_occurrences
   */
  const isHabitCompletedToday = useCallback(async (habitId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // D'abord récupérer l'event_id
      const { data: event } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'habit')
        .eq('entity_id', habitId)
        .eq('user_id', user.id)
        .single();

      if (!event) return false;

      // Vérifier s'il y a une occurrence complétée aujourd'hui
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
    } catch (error) {
      return false;
    }
  }, [user]);

  /**
   * Toggle la complétion d'une habitude via time_occurrences
   */
  const toggleHabitCompletion = useCallback(async (habitId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Récupérer l'event_id de l'habitude
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
      return await completeOccurrence(event.id, today);
    } catch (error: any) {
      logger.error('Erreur toggle habit completion', { error: error.message, habitId });
      return false;
    }
  }, [user, completeOccurrence]);

  return {
    syncTaskEventWithSchedule,
    syncHabitEvent,
    syncChallengeEvent,
    deleteEntityEvent,
    completeOccurrence,
    updateEventStatus,
    getEntityEvent,
    isHabitCompletedToday,
    toggleHabitCompletion
  };
};
