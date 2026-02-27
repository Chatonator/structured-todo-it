import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { computeSkillLevel } from '@/lib/rewards';
import type { WeeklySummary } from '@/lib/rewards';
import type { DailyStreakInfo, Reward, ClaimHistoryEntry, SkillData, UnrefinedTask } from '@/types/gamification';

export const useRewardsViewData = () => {
  const { user } = useAuth();
  const gamification = useGamification();

  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [streakInfo, setStreakInfo] = useState<DailyStreakInfo | null>(null);
  const [dailyMicroCount, setDailyMicroCount] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryEntry[]>([]);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [unrefinedTasks, setUnrefinedTasks] = useState<UnrefinedTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const computeSkills = useCallback(async (): Promise<SkillData[]> => {
    if (!user) return [];

    // Fetch data for skill computation
    const [txResult, itemsResult] = await Promise.all([
      supabase
        .from('xp_transactions')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('source_type', 'task'),
      supabase
        .from('items')
        .select('is_completed, is_important')
        .eq('user_id', user.id)
        .eq('item_type', 'task'),
    ]);

    const transactions = txResult.data || [];
    const items = itemsResult.data || [];

    // Discipline: sum of important minutes completed
    const disciplineXp = transactions.reduce((sum: number, t: any) => {
      const meta = t.metadata;
      if (meta?.isImportant && meta?.durationMinutes) {
        return sum + meta.durationMinutes;
      }
      return sum;
    }, 0);

    // Priorisation: % important tasks × 100
    const totalTasks = items.length;
    const importantTasks = items.filter((i: any) => i.is_important).length;
    const prioXp = totalTasks > 0 ? Math.round((importantTasks / totalTasks) * 100) : 0;

    // Constance: current streak (from progress)
    const constanceXp = (gamification.progress?.currentTaskStreak ?? 0) * 10;

    // Finalisation: completed / total × 100
    const completedTasks = items.filter((i: any) => i.is_completed).length;
    const finalisationXp = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const skillDefs = [
      { key: 'discipline', name: 'Discipline', icon: '🎯', xp: disciplineXp },
      { key: 'prioritisation', name: 'Priorisation', icon: '⭐', xp: prioXp },
      { key: 'constance', name: 'Constance', icon: '🔥', xp: constanceXp },
      { key: 'finalisation', name: 'Finalisation', icon: '✅', xp: finalisationXp },
    ];

    return skillDefs.map(s => {
      const { level, progressPct, xpForNext } = computeSkillLevel(s.xp);
      return { ...s, level, progressPct, xpForNext };
    });
  }, [user, gamification.progress?.currentTaskStreak]);

  const loadAsyncData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [summary, streak, microCount, userRewards, history, computedSkills, unrefined] = await Promise.all([
        gamification.getWeeklySummary(),
        gamification.getStreakInfo(),
        gamification.getDailyMicroTaskCount(),
        gamification.getUserRewards(),
        gamification.getClaimHistory(),
        computeSkills(),
        gamification.getUnrefinedTasks(),
      ]);
      setWeeklySummary(summary);
      setStreakInfo(streak);
      setDailyMicroCount(microCount);
      setRewards(userRewards);
      setClaimHistory(history);
      setSkills(computedSkills);
      setUnrefinedTasks(unrefined);
    } catch {
      // silent
    } finally {
      setDataLoading(false);
    }
  }, [user, gamification.getWeeklySummary, gamification.getStreakInfo, gamification.getDailyMicroTaskCount, gamification.getUserRewards, gamification.getClaimHistory, computeSkills, gamification.getUnrefinedTasks]);

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
      pointsAvailable: gamification.progress?.pointsAvailable ?? 0,
      totalPointsEarned: gamification.progress?.totalPointsEarned ?? 0,
      totalPointsSpent: gamification.progress?.totalPointsSpent ?? 0,
      tasksCompleted: gamification.progress?.tasksCompleted ?? 0,
      rewards,
      claimHistory,
      skills,
      unrefinedTasks,
    },
    state: {
      loading,
      isAuthenticated: !!user,
      hasProgress: !!gamification.progress,
    },
    actions: {
      reloadProgress: gamification.reloadProgress,
      reloadData: loadAsyncData,
      claimReward: gamification.claimReward,
      createReward: gamification.createReward,
      deleteReward: gamification.deleteReward,
      refinePoints: gamification.refinePoints,
    },
  };
};

export type RewardsViewDataReturn = ReturnType<typeof useRewardsViewData>;
