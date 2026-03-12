/**
 * useRepairSync - One-time repair for tasks that were scheduled before
 * the time_event sync was properly implemented.
 * Scans items with schedule metadata but no corresponding time_event and creates them.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { requestCalendarSyncProcessing } from '@/lib/calendar/requestCalendarSync';
import { toLocalDateString, getTimeBlockFromTime } from './helpers';

const REPAIR_DONE_KEY = 'time_sync_repair_v1';

export const useRepairSync = () => {
  const { user } = useAuth();

  /**
   * Repair old tasks that have schedule metadata but no time_event.
   * Runs once per user (tracked in localStorage).
   */
  const repairUnsyncedTasks = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    const repairKey = `${REPAIR_DONE_KEY}_${user.id}`;
    if (localStorage.getItem(repairKey)) return 0;

    try {
      const { data: existingEvents } = await supabase
        .from('time_events')
        .select('entity_id')
        .eq('entity_type', 'task')
        .eq('user_id', user.id);

      const syncedTaskIds = new Set((existingEvents || []).map((event) => event.entity_id));

      const { data: items } = await supabase
        .from('items')
        .select('id, name, metadata, is_completed')
        .eq('user_id', user.id)
        .in('item_type', ['task', 'project_task']);

      if (!items) {
        localStorage.setItem(repairKey, 'done');
        return 0;
      }

      let repairedCount = 0;

      for (const item of items) {
        if (syncedTaskIds.has(item.id)) continue;

        const metadata = item.metadata as Record<string, any> | null;
        if (!metadata) continue;

        const scheduledDate = metadata.scheduledDate || metadata.scheduled_date;
        const scheduledTime = metadata.scheduledTime || metadata.scheduled_time;
        if (!scheduledDate) continue;

        try {
          const date = new Date(scheduledDate);
          if (Number.isNaN(date.getTime())) continue;

          const time = scheduledTime || '09:00';
          const dateStr = toLocalDateString(date);
          const startsAt = new Date(`${dateStr}T${time}:00`);
          if (Number.isNaN(startsAt.getTime())) continue;

          const duration = metadata.duration || metadata.estimatedTime || 30;
          const endsAt = new Date(startsAt.getTime() + duration * 60000);

          const { error } = await supabase.from('time_events').insert({
            user_id: user.id,
            entity_type: 'task',
            entity_id: item.id,
            title: item.name,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            duration,
            is_all_day: false,
            status: item.is_completed ? 'completed' : 'scheduled',
            completed_at: item.is_completed ? new Date().toISOString() : null,
            time_block: getTimeBlockFromTime(time),
          });

          if (!error) {
            repairedCount += 1;
            logger.info('Repaired unsynced task', { taskId: item.id, name: item.name });
          }
        } catch (caughtError: any) {
          logger.warn('Failed to repair task', { taskId: item.id, error: caughtError.message });
        }
      }

      localStorage.setItem(repairKey, 'done');
      if (repairedCount > 0) {
        void requestCalendarSyncProcessing('repair-sync');
      }
      logger.info(`Repair sync completed: ${repairedCount} tasks repaired`);
      return repairedCount;
    } catch (error: any) {
      logger.error('Repair sync failed', { error: error.message });
      localStorage.setItem(repairKey, 'done');
      return 0;
    }
  }, [user]);

  return { repairUnsyncedTasks };
};
