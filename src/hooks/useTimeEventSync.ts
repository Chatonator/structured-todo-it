/**
 * useTimeEventSync - Facade hook for time event synchronization
 * Delegates to focused sub-hooks: useTaskEventSync, useHabitEventSync, useEventOperations
 */

import { useTaskEventSync } from '@/hooks/time-sync/useTaskEventSync';
import { useHabitEventSync } from '@/hooks/time-sync/useHabitEventSync';
import { useEventOperations } from '@/hooks/time-sync/useEventOperations';

export const useTimeEventSync = () => {
  const { syncTaskEventWithSchedule } = useTaskEventSync();
  const { syncHabitEvent, isHabitCompletedToday, toggleHabitCompletion } = useHabitEventSync();
  const { deleteEntityEvent, completeOccurrence, updateEventStatus, getEntityEvent } = useEventOperations();

  return {
    syncTaskEventWithSchedule,
    syncHabitEvent,
    deleteEntityEvent,
    completeOccurrence,
    updateEventStatus,
    getEntityEvent,
    isHabitCompletedToday,
    toggleHabitCompletion
  };
};
