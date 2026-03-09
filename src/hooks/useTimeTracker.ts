import { useState, useEffect, useCallback, useRef } from 'react';
import { loadStorage, saveStorage } from '@/lib/storage';
import { useItems } from './useItems';
import { useToast } from './use-toast';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'time_tracker_active';
const MAX_SECONDS = 7200; // 2 hours

interface TimerState {
  taskId: string;
  startedAt: number; // Date.now() timestamp
}

export function useTimeTracker() {
  const [timerState, setTimerState] = useState<TimerState | null>(() => loadStorage<TimerState | null>(STORAGE_KEY, null));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { items, updateItem } = useItems({ contextTypes: ['task', 'subtask', 'project_task'] });
  const { toast } = useToast();

  // Compute elapsed from stored startedAt
  const computeElapsed = useCallback(() => {
    if (!timerState) return 0;
    return Math.floor((Date.now() - timerState.startedAt) / 1000);
  }, [timerState]);

  // Stop timer and save actualTime
  const stopTimer = useCallback(async (showToast = true) => {
    if (!timerState) return;

    const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const taskId = timerState.taskId;

    // Find item and accumulate actualTime
    const item = items.find(i => i.id === taskId);
    if (item) {
      const prevActual = (item.metadata?.actualTime as number) || 0;
      await updateItem(taskId, {
        metadata: { ...item.metadata, actualTime: prevActual + minutes }
      });
      logger.info('Timer stopped', { taskId, addedMinutes: minutes, totalActual: prevActual + minutes });
    }

    // Clear state
    setTimerState(null);
    setElapsedSeconds(0);
    saveStorage(STORAGE_KEY, null);

    if (showToast) {
      toast({
        title: '⏱ Chrono arrêté',
        description: `${minutes} min enregistrées`,
      });
    }
  }, [timerState, items, updateItem, toast]);

  // Start timer (auto-stops previous if any)
  const startTimer = useCallback(async (taskId: string) => {
    if (timerState) {
      await stopTimer(false);
    }
    const newState: TimerState = { taskId, startedAt: Date.now() };
    setTimerState(newState);
    setElapsedSeconds(0);
    saveStorage(STORAGE_KEY, newState);
    logger.info('Timer started', { taskId });
  }, [timerState, stopTimer]);

  // Reset actualTime for a task
  const resetActualTime = useCallback(async (taskId: string) => {
    const item = items.find(i => i.id === taskId);
    if (!item) return;
    const { actualTime, ...restMeta } = item.metadata as any;
    await updateItem(taskId, { metadata: restMeta });
    toast({ title: 'Temps réel supprimé' });
  }, [items, updateItem, toast]);

  // Auto-stop on task completion
  const stopIfActive = useCallback(async (taskId: string) => {
    if (timerState?.taskId === taskId) {
      await stopTimer(true);
    }
  }, [timerState, stopTimer]);

  // Tick interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (timerState) {
      setElapsedSeconds(computeElapsed());
      intervalRef.current = setInterval(() => {
        const e = Math.floor((Date.now() - timerState.startedAt) / 1000);
        setElapsedSeconds(e);

        // Auto-stop at max
        if (e >= MAX_SECONDS) {
          stopTimer(true);
          toast({
            title: '⏱ Chrono auto-arrêté',
            description: 'Limite de 2h atteinte',
            variant: 'destructive',
          });
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    activeTaskId: timerState?.taskId ?? null,
    elapsedSeconds,
    startTimer,
    stopTimer,
    resetActualTime,
    stopIfActive,
    isRunning: !!timerState,
  };
}
