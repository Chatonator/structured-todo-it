import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { computeSkillLevel, computeAllSkills } from '@/lib/rewards';
import type { RawSkillItem } from '@/lib/rewards';
import type { DailyStreakInfo, Reward, ClaimHistoryEntry, SkillData, UnrefinedTask } from '@/types/gamification';
import { startOfDay } from 'date-fns';

export const useRewardsViewData = () => {
  const { user } = useAuth();
  const gamification = useGamification();

  const [streakInfo, setStreakInfo] = useState<DailyStreakInfo | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryEntry[]>([]);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [unrefinedTasks, setUnrefinedTasks] = useState<UnrefinedTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const computeSkills = useCallback(async (): Promise<SkillData[]> => {
    if (!user) return [];

    const [itemsResult, projectsResult, habitsResult, habitCompletionsResult, transactionsResult] = await Promise.all([
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
      // Fetch transactions to compute active days
      supabase
        .from('xp_transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('source_type', 'task'),
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
      sub_category: i.metadata?.subCategory || null,
      project_status: i.metadata?.projectStatus || null,
    }));

    const projects = projectsResult.data || [];
    const completedProjectCount = projects.filter((p: any) => p.metadata?.status === 'completed').length;
    const totalProjectCount = projects.length;

    // Compute project task counts
    const projectTaskCounts = new Map<string, { total: number; completed: number }>();
    for (const item of items) {
      if (item.project_id) {
        const entry = projectTaskCounts.get(item.project_id) || { total: 0, completed: 0 };
        entry.total++;
        if (item.is_completed) entry.completed++;
        projectTaskCounts.set(item.project_id, entry);
      }
    }

    // Compute active days from transactions
    const activeDaysSet = new Set<string>();
    for (const tx of (transactionsResult.data || [])) {
      activeDaysSet.add(startOfDay(new Date(tx.created_at)).toISOString());
    }
    const activeDaysCount = activeDaysSet.size;

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
      activeDaysCount,
      projectTaskCounts,
    });

    return skills;
  }, [user, gamification.progress?.currentTaskStreak]);

  const loadAsyncData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [streak, userRewards, history, computedSkills, unrefined] = await Promise.all([
        gamification.getStreakInfo(),
        gamification.getUserRewards(),
        gamification.getClaimHistory(),
        computeSkills(),
        gamification.getUnrefinedTasks(),
      ]);
      setStreakInfo(streak);
      setRewards(userRewards);
      setClaimHistory(history);
      setSkills(computedSkills);
      setUnrefinedTasks(unrefined);
    } catch {
      // silent
    } finally {
      setDataLoading(false);
    }
  }, [user, gamification.getStreakInfo, gamification.getUserRewards, gamification.getClaimHistory, computeSkills, gamification.getUnrefinedTasks]);

  useEffect(() => {
    loadAsyncData();
  }, [loadAsyncData]);

  const loading = gamification.loading || dataLoading;

  return {
    data: {
      progress: gamification.progress,
      userId: user?.id,
      streakInfo,
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
