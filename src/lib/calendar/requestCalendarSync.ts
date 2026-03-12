import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const CALENDAR_SYNC_COOLDOWN_MS = 2500;
let activeRequest: Promise<void> | null = null;
let lastRequestAt = 0;

export async function requestCalendarSyncProcessing(reason = 'time-event-change'): Promise<void> {
  const now = Date.now();
  if (activeRequest && now - lastRequestAt < CALENDAR_SYNC_COOLDOWN_MS) {
    return activeRequest;
  }

  lastRequestAt = now;
  activeRequest = (async () => {
    try {
      const { error } = await supabase.functions.invoke('calendar-process-jobs', {
        body: { provider: 'outlook', limit: 10, reason },
      });

      if (error) {
        logger.warn('Calendar sync processing request failed', { reason, error: error.message });
      }
    } catch (caughtError) {
      logger.warn('Calendar sync processing request crashed', {
        reason,
        error: caughtError instanceof Error ? caughtError.message : String(caughtError),
      });
    } finally {
      activeRequest = null;
    }
  })();

  return activeRequest;
}
