import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { computeSkillLevel, computeAllSkills } from '@/lib/rewards';
import type { WeeklySummary, RawSkillItem } from '@/lib/rewards';
import type { DailyStreakInfo, Reward, ClaimHistoryEntry, SkillData, UnrefinedTask } from '@/types/gamification';
import { startOfWeek } from 'date-fns';

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

    // Fetch all needed data in parallel
    const [itemsResult, projectsResult, habitsResult, habitCompletionsResult] = await Promise.all([
      supabase
        .from('items')
        .select('id, parent_id, is_completed, is_important, is_urgent, created_at, updated_at, metadata, postpone_count')
        .eq('user_id', user.id)
        .eq('item_type', 'task'),
      supabase
        .from('items')
        .select('id, is_completed, metadata')
        .eq('user_id', user.id)
        .eq('item_type', 'project'),
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('habit_completions')
        .select('habit_id, date')
        .eq('user_id', user.id)
        .gte('date', (() => {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          return d.toISOString().split('T')[0];
        })()),
    ]);

    const items: RawSkillItem[] = (itemsResult.data || []).map((i: any) => ({
      id: i.id,
      parent_id: i.parent_id,
      is_completed: i.is_completed,
      is_important: i.is_important,
      is_urgent: i.is_urgent,
      created_at: i.created_at,
      updated_at: i.updated_at,
      project_id: i.metadata?.projectId || null,
      postpone_count: i.postpone_count || 0,
      metadata: i.metadata,
    }));

    const projects = projectsResult.data || [];
    const completedProjectCount = projects.filter((p: any) => p.metadata?.status === 'completed').length;
    const totalProjectCount = projects.length;

    // Compute habit weekly rate
    const activeHabitIds = new Set((habitsResult.data || []).map((h: any) => h.id));
    const completionsThisWeek = (habitCompletionsResult.data || []);
    const uniqueHabitsCompletedThisWeek = new Set(completionsThisWeek.map((c: any) => c.habit_id));
    const habitWeeklyRate = activeHabitIds.size > 0
      ? uniqueHabitsCompletedThisWeek.size / activeHabitIds.size
      : 0;

    const currentStreak = gamification.progress?.currentTaskStreak ?? 0;

    const { skills } = computeAllSkills({
      items,
      currentStreak,
      habitWeeklyRate,
      completedProjectCount,
      totalProjectCount,
    });

    return skills;
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
      minutesAvailable: gamification.progress?.minutesAvailable ?? 0,
      totalMinutesEarned: gamification.progress?.totalMinutesEarned ?? 0,
      totalMinutesSpent: gamification.progress?.totalMinutesSpent ?? 0,
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
