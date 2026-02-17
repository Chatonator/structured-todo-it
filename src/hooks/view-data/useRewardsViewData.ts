import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import type { WeeklySummary } from '@/lib/rewards';
import type { DailyStreakInfo } from '@/types/gamification';

/**
 * Hook spécialisé pour les données de la RewardsView
 */
export const useRewardsViewData = () => {
  const { user } = useAuth();
  const gamification = useGamification();

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [streakInfo, setStreakInfo] = useState<DailyStreakInfo | null>(null);
  const [dailyMicroCount, setDailyMicroCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  // Load async data
  const loadAsyncData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [summary, streak, microCount] = await Promise.all([
        gamification.getWeeklySummary(),
        gamification.getStreakInfo(),
        gamification.getDailyMicroTaskCount(),
      ]);
      setWeeklySummary(summary);
      setStreakInfo(streak);
      setDailyMicroCount(microCount);
    } catch {
      // silent
    } finally {
      setDataLoading(false);
    }
  }, [user, gamification.getWeeklySummary, gamification.getStreakInfo, gamification.getDailyMicroTaskCount]);

  useEffect(() => {
    loadAsyncData();
  }, [loadAsyncData]);

  const loading = gamification.loading || dataLoading;

  return {
    data: {
      progress: gamification.progress,
      userId: user?.id,
      weeklySummary,
      streakInfo,
      dailyMicroCount,
      totalPoints: gamification.progress?.totalXp ?? 0,
      tasksCompleted: gamification.progress?.tasksCompleted ?? 0,
    },
    state: {
      loading,
      isAuthenticated: !!user,
      hasProgress: !!gamification.progress,
    },
    actions: {
      reloadProgress: gamification.reloadProgress,
      reloadData: loadAsyncData,
    },
  };
};

export type RewardsViewDataReturn = ReturnType<typeof useRewardsViewData>;
