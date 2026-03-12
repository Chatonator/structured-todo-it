/**
 * useTaskEventSync - Sync tasks with time_events table
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { requestCalendarSyncProcessing } from '@/lib/calendar/requestCalendarSync';
import {
  ScheduleInfo,
  toLocalDateString,
  getTimeBlockFromTime,
  mapTaskRecurrence,
  getPriorityFromSubCategory
} from './helpers';

export const useTaskEventSync = () => {
  const { user } = useAuth();

  /** Create or update a time_event for a task with separate schedule info */
  const syncTaskEventWithSchedule = useCallback(async (
    task: Task,
    scheduleInfo?: ScheduleInfo
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: existingEvents } = await supabase
        .from('time_events')
        .select('id')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .eq('user_id', user.id);

      const existingEventId = existingEvents?.[0]?.id;
      const hasSchedule = scheduleInfo?.date && scheduleInfo?.time;

      // No schedule → delete existing event if any
      if (!hasSchedule) {
        if (existingEventId) {
          await supabase
            .from('time_events')
            .delete()
            .eq('id', existingEventId);
          logger.debug('TimeEvent supprimé pour tâche sans planification', { taskId: task.id });
          void requestCalendarSyncProcessing('task-event-delete');
        }
        return true;
      }

      // Compute dates in local timezone
      const dateStr = toLocalDateString(scheduleInfo.date!);
      const startsAt = new Date(`${dateStr}T${scheduleInfo.time}:00`);
      if (Number.isNaN(startsAt.getTime())) {
        throw new Error(`Invalid schedule date/time: ${dateStr} ${scheduleInfo.time}`);
      }
      const duration = task.duration || task.estimatedTime || 30;
      const endsAt = new Date(startsAt.getTime() + duration * 60000);

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
        priority: task.subCategory ? getPriorityFromSubCategory(task.subCategory) : null,
        time_block: getTimeBlockFromTime(scheduleInfo.time!)
      };

      if (existingEventId) {
        const { error } = await supabase
          .from('time_events')
          .update(eventData)
          .eq('id', existingEventId);
        if (error) throw error;
        logger.debug('TimeEvent mis à jour pour tâche', { taskId: task.id });
      } else {
        const { error } = await supabase
          .from('time_events')
          .insert(eventData);
        if (error) throw error;
        logger.debug('TimeEvent créé pour tâche', { taskId: task.id });
      }

      void requestCalendarSyncProcessing('task-event-upsert');
      return true;
    } catch (error: any) {
      logger.error('Erreur sync time_event pour tâche', { error: error.message, taskId: task.id });
      return false;
    }
  }, [user]);

  return { syncTaskEventWithSchedule };
};
