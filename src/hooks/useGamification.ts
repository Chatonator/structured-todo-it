import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProgress, TransactionMetadata, DailyStreakInfo, Reward, ClaimHistoryEntry, UnrefinedTask } from '@/types/gamification';
import { computeTaskMinutes, checkMicroTaskCap, checkStreakDay, computeWeeklySummary, isStreakEligible, clampToGauge, computeCompensationBonus } from '@/lib/rewards';
import type { WeeklySummary } from '@/lib/rewards';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, startOfDay, format } from 'date-fns';
import { DECAY_RATE_PER_WEEK, MAX_DECAY_WEEKS, GAUGE_MAX_MINUTES } from '@/lib/rewards/constants';

export const useGamification = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // ---- Format DB row to UserProgress ----
  const formatProgress = (data: any): UserProgress => ({
    id: data.id,
    userId: data.user_id,
    totalXp: data.total_xp ?? 0,
    currentLevel: data.current_level ?? 1,
    xpForNextLevel: data.xp_for_next_level ?? 100,
    lifetimePoints: data.lifetime_points ?? 0,
    currentPoints: data.current_points ?? 0,
    tasksCompleted: data.tasks_completed ?? 0,
    habitsCompleted: data.habits_completed ?? 0,
    currentTaskStreak: data.current_task_streak ?? 0,
    longestTaskStreak: data.longest_task_streak ?? 0,
    currentHabitStreak: data.current_habit_streak ?? 0,
    longestHabitStreak: data.longest_habit_streak ?? 0,
    lastActivityDate: data.last_activity_date ?? '',
    lastStreakQualifiedDate: data.last_streak_qualified_date ?? null,
    minutesAvailable: data.points_available ?? 0,
    totalMinutesEarned: data.total_points_earned ?? 0,
    totalMinutesSpent: data.total_points_spent ?? 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  });

  // ---- Load / create progress ----
  const loadProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (createError) throw createError;
        setProgress(formatProgress(newProgress));
      } else {
        setProgress(formatProgress(data));
      }
    } catch (error: any) {
      logger.error('Failed to load progress', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ---- Count micro-tasks scored today ----
  const getDailyMicroTaskCount = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('xp_transactions')
      .select('metadata')
      .eq('user_id', user.id)
      .eq('source_type', 'task')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`);

    if (!data) return 0;
    return data.filter((t: any) => t.metadata?.isMicroTask && !t.metadata?.capped).length;
  }, [user]);

  // ---- Get important minutes completed today (for streak) ----
  const getImportantMinutesToday = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('xp_transactions')
      .select('metadata')
      .eq('user_id', user.id)
      .eq('source_type', 'task')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`);

    if (!data) return 0;
    return data.reduce((sum: number, t: any) => {
      const meta = t.metadata as TransactionMetadata | null;
      if (meta && meta.isImportant && meta.durationMinutes > 10) {
        return sum + meta.durationMinutes;
      }
      return sum;
    }, 0);
  }, [user]);

  // ---- Reward task completion (v3.0 — guilty-free minutes) ----
  const rewardTaskCompletion = useCallback(async (task: any) => {
    if (!user || !progress) return;

    try {
      // 0. Idempotence guard
      const { data: existingTx } = await supabase
        .from('xp_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'task')
        .eq('source_id', task.id)
        .limit(1);

      if (existingTx && existingTx.length > 0) {
        logger.debug('Task already rewarded, skipping', { taskId: task.id });
        return;
      }

      // 1. Extract task data
      const durationMinutes = task.estimatedTime || 30;
      const isImportant = task.isImportant ?? (task.category === 'Obligation' || task.category === 'Envie');
      const isUrgent = task.isUrgent ?? (task.category === 'Obligation' || task.category === 'Quotidien');

      // 2. Get postpone_count from DB
      const { data: itemData } = await supabase
        .from('items')
        .select('postpone_count')
        .eq('id', task.id)
        .single();
      const postponeCount = itemData?.postpone_count ?? 0;

      // 3. Check if deadline < 48h
      let hasUrgentDeadline = false;
      if (isImportant) {
        const { data: eventData } = await supabase
          .from('time_events')
          .select('starts_at')
          .eq('entity_type', 'task')
          .eq('entity_id', task.id)
          .eq('user_id', user.id)
          .order('starts_at', { ascending: true })
          .limit(1);
        if (eventData && eventData.length > 0) {
          const startsAt = new Date(eventData[0].starts_at);
          const hoursUntil = (startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
          hasUrgentDeadline = hoursUntil < 48 && hoursUntil > -24;
        }
      }

      // 4. Compute minutes (v3.0)
      const result = computeTaskMinutes({
        durationMinutes,
        isImportant,
        isUrgent,
        postponeCount,
        hasUrgentDeadline,
      });

      // 5. Check micro-task cap
      let finalMinutes = result.minutes;
      let capped = false;
      if (result.isMicroTask) {
        const microCount = await getDailyMicroTaskCount();
        if (!checkMicroTaskCap(microCount)) {
          finalMinutes = 0;
          capped = true;
        }
      }

      // 6. Build metadata
      const cappedFormula = capped
        ? `${result.formula} → capée (0 min)`
        : result.formula;

      const metadata: TransactionMetadata = {
        base: result.base,
        quadrantKey: result.quadrantKey,
        quadrantCoeff: result.quadrantCoeff,
        importanceWeight: result.importanceWeight,
        priorityMultiplier: result.priorityMultiplier,
        bonusType: result.bonusType,
        bonusValue: result.bonusValue,
        longTaskBonus: result.longTaskBonus,
        formula: cappedFormula,
        isMicroTask: result.isMicroTask,
        capped,
        durationMinutes,
        isImportant,
        isUrgent,
        postponeCount,
        quadrantLabel: result.quadrantLabel,
      };

      // 7. Record transaction
      const { error: insertError } = await supabase
        .from('xp_transactions')
        .insert([{
          user_id: user.id,
          source_type: 'task',
          source_id: task.id,
          xp_gained: finalMinutes,
          points_gained: finalMinutes,
          description: `Tâche complétée: ${task.name}`,
          metadata: metadata as any,
        }]);

      if (insertError) {
        if (insertError.code === '23505') {
          logger.debug('Duplicate transaction blocked by DB', { taskId: task.id });
          return;
        }
        throw insertError;
      }

      // 8. Streak logic
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const importantMinutes = await getImportantMinutesToday();
      const streakQualified = checkStreakDay(importantMinutes);

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('last_streak_qualified_date, current_task_streak, longest_task_streak, points_available, total_points_earned')
        .eq('user_id', user.id)
        .single();

      let newStreak = progressData?.current_task_streak ?? progress.currentTaskStreak;
      let newLongest = progressData?.longest_task_streak ?? progress.longestTaskStreak;
      const lastQualifiedDate = progressData?.last_streak_qualified_date as string | null;
      let updateQualifiedDate = false;

      if (streakQualified && lastQualifiedDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

        if (lastQualifiedDate === yesterdayStr) {
          newStreak = newStreak + 1;
        } else {
          newStreak = 1;
        }
        newLongest = Math.max(newLongest, newStreak);
        updateQualifiedDate = true;
      }

      // 9. Apply minutes directly to available balance (no refinement needed)
      const currentAvailable = progressData?.points_available ?? progress.minutesAvailable;
      const currentEarned = progressData?.total_points_earned ?? progress.totalMinutesEarned;

      // Compensation bonus: +10 min per 60-min tranche crossed
      const compensationBonus = computeCompensationBonus(currentAvailable, finalMinutes);
      const totalGain = finalMinutes + compensationBonus;

      // Clamp to gauge max (200)
      const newAvailable = clampToGauge(currentAvailable + totalGain);
      const actualGain = newAvailable - currentAvailable;

      const updatePayload: any = {
        total_xp: (progress.totalXp ?? 0) + finalMinutes,
        current_points: (progress.totalXp ?? 0) + finalMinutes,
        tasks_completed: progress.tasksCompleted + 1,
        current_task_streak: newStreak,
        longest_task_streak: newLongest,
        last_activity_date: todayStr,
        points_available: newAvailable,
        total_points_earned: currentEarned + actualGain,
      };
      if (updateQualifiedDate) {
        updatePayload.last_streak_qualified_date = todayStr;
      }

      await supabase
        .from('user_progress')
        .update(updatePayload)
        .eq('user_id', user.id);

      // Mark transaction as refined immediately (minutes go directly to balance)
      await supabase
        .from('xp_transactions')
        .update({ is_refined: true, refined_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('source_type', 'task')
        .eq('source_id', task.id);

      await loadProgress();

      // 10. Toast
      if (finalMinutes > 0) {
        const bonusText = compensationBonus > 0 ? ` (+${compensationBonus} bonus)` : '';
        toast({
          title: `+${finalMinutes} min guilty-free (${result.quadrantLabel})${bonusText}`,
          description: `Tâche complétée !`,
          duration: 3000,
        });
      } else if (capped) {
        toast({
          title: '0 min',
          description: `Plafond micro-tâches atteint pour aujourd'hui`,
          duration: 3000,
        });
      }
    } catch (error: any) {
      logger.error('Failed to reward task', { error: error.message });
    }
  }, [user, progress, loadProgress, getDailyMicroTaskCount, getImportantMinutesToday, toast]);

  // ---- Claim reward ----
  const claimReward = useCallback(async (reward: Reward) => {
    if (!user || !progress) return false;
    if (progress.minutesAvailable < reward.costMinutes) return false;

    try {
      const { error: claimError } = await supabase
        .from('claim_history')
        .insert({
          user_id: user.id,
          reward_name: reward.name,
          cost_points: reward.costMinutes,
        });
      if (claimError) throw claimError;

      await supabase
        .from('user_progress')
        .update({
          points_available: progress.minutesAvailable - reward.costMinutes,
          total_points_spent: progress.totalMinutesSpent + reward.costMinutes,
        })
        .eq('user_id', user.id);

      await loadProgress();

      toast({
        title: `${reward.icon} Récompense réclamée !`,
        description: `${reward.name} (-${reward.costMinutes} min)`,
        duration: 3000,
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to claim reward', { error: error.message });
      return false;
    }
  }, [user, progress, loadProgress, toast]);

  // ---- Get user rewards ----
  const getUserRewards = useCallback(async (): Promise<Reward[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index');
    return (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      icon: r.icon,
      costMinutes: r.cost_points,
      orderIndex: r.order_index,
      createdAt: new Date(r.created_at),
    }));
  }, [user]);

  // ---- Create reward ----
  const createReward = useCallback(async (name: string, costMinutes: number, icon: string = '🎁') => {
    if (!user) return;
    await supabase.from('rewards').insert({
      user_id: user.id,
      name,
      cost_points: costMinutes,
      icon,
    });
  }, [user]);

  // ---- Delete reward ----
  const deleteReward = useCallback(async (rewardId: string) => {
    if (!user) return;
    await supabase.from('rewards').delete().eq('id', rewardId).eq('user_id', user.id);
  }, [user]);

  // ---- Get claim history ----
  const getClaimHistory = useCallback(async (): Promise<ClaimHistoryEntry[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('claim_history')
      .select('*')
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false })
      .limit(50);
    return (data || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      rewardName: c.reward_name,
      costMinutes: c.cost_points,
      claimedAt: new Date(c.claimed_at),
    }));
  }, [user]);

  // ---- Habit completion (simplified — no minutes) ----
  const rewardHabitCompletion = useCallback(async (habitId: string, habitName: string) => {
    if (!progress || !user) return;
    await supabase
      .from('user_progress')
      .update({ habits_completed: progress.habitsCompleted + 1 })
      .eq('user_id', user.id);
    await loadProgress();
  }, [progress, user, loadProgress]);

  // ---- Weekly summary ----
  const getWeeklySummary = useCallback(async (): Promise<WeeklySummary> => {
    if (!user) return { pctImportantNotUrgent: 0, pctUrgent: 0, pctMaintenance: 0, alignmentScore: 0, totalMinutes: 0, totalGuiltyFreeMinutes: 0 };

    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'00:00:00");
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'23:59:59");

    const { data } = await supabase
      .from('xp_transactions')
      .select('xp_gained, metadata')
      .eq('user_id', user.id)
      .eq('source_type', 'task')
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);

    if (!data || data.length === 0) {
      return { pctImportantNotUrgent: 0, pctUrgent: 0, pctMaintenance: 0, alignmentScore: 0, totalMinutes: 0, totalGuiltyFreeMinutes: 0 };
    }

    const entries = data.map((t: any) => ({
      durationMinutes: t.metadata?.durationMinutes ?? 0,
      isImportant: t.metadata?.isImportant ?? false,
      isUrgent: t.metadata?.isUrgent ?? false,
      minutes: t.xp_gained ?? 0,
    }));

    return computeWeeklySummary(entries);
  }, [user]);

  // ---- Streak info ----
  const getStreakInfo = useCallback(async (): Promise<DailyStreakInfo> => {
    const importantMinutes = await getImportantMinutesToday();
    return {
      currentStreak: progress?.currentTaskStreak ?? 0,
      longestStreak: progress?.longestTaskStreak ?? 0,
      importantMinutesToday: importantMinutes,
      streakQualifiedToday: checkStreakDay(importantMinutes),
    };
  }, [progress, getImportantMinutesToday]);

  // ---- Get unrefined tasks ----
  const getUnrefinedTasks = useCallback(async (): Promise<UnrefinedTask[]> => {
    if (!user) return [];
    const { data: txData } = await supabase
      .from('xp_transactions')
      .select('id, source_id, points_gained, created_at, metadata')
      .eq('user_id', user.id)
      .eq('source_type', 'task')
      .eq('is_refined', false)
      .order('created_at', { ascending: false });

    if (!txData || txData.length === 0) return [];

    const sourceIds = txData.map(t => t.source_id).filter(Boolean) as string[];
    const { data: itemsData } = await supabase
      .from('items')
      .select('id, name, category')
      .in('id', sourceIds);

    const itemsMap = new Map((itemsData || []).map((i: any) => [i.id, i]));
    const now = Date.now();

    return txData.map((t: any) => {
      const item = itemsMap.get(t.source_id);
      const createdAt = new Date(t.created_at);
      const weeksElapsed = Math.floor((now - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const decayPct = Math.min(weeksElapsed * DECAY_RATE_PER_WEEK * 100, 100);
      return {
        transactionId: t.id,
        sourceId: t.source_id || '',
        taskName: item?.name || (t.metadata as any)?.description || 'Tâche',
        category: item?.category || 'Autres',
        minutesOriginal: t.points_gained ?? 0,
        createdAt,
        weeksElapsed,
        decayPct,
      };
    });
  }, [user]);

  // ---- Refine points (depreciation applies to minutes) ----
  const refinePoints = useCallback(async (transactionIds?: string[]) => {
    if (!user || !progress) return;

    try {
      let query = supabase
        .from('xp_transactions')
        .select('id, points_gained, created_at')
        .eq('user_id', user.id)
        .eq('source_type', 'task')
        .eq('is_refined', false);

      if (transactionIds && transactionIds.length > 0) {
        query = query.in('id', transactionIds);
      }

      const { data: txData } = await query;
      if (!txData || txData.length === 0) return;

      const now = Date.now();
      let refinedTotal = 0;

      for (const tx of txData) {
        const createdAt = new Date(tx.created_at!).getTime();
        const weeksElapsed = Math.floor((now - createdAt) / (7 * 24 * 60 * 60 * 1000));
        const clampedWeeks = Math.min(weeksElapsed, MAX_DECAY_WEEKS);
        const decayedValue = Math.max(0, Math.floor((tx.points_gained ?? 0) * (1 - DECAY_RATE_PER_WEEK * clampedWeeks)));
        refinedTotal += decayedValue;
      }

      // Compensation bonus on refined total
      const currentAvailable = progress.minutesAvailable;
      const compensationBonus = computeCompensationBonus(currentAvailable, refinedTotal);
      const totalGain = refinedTotal + compensationBonus;
      const newAvailable = clampToGauge(currentAvailable + totalGain);
      const actualGain = newAvailable - currentAvailable;

      // Mark as refined
      const ids = txData.map(t => t.id);
      await supabase
        .from('xp_transactions')
        .update({ is_refined: true, refined_at: new Date().toISOString() })
        .in('id', ids)
        .eq('user_id', user.id);

      await supabase
        .from('user_progress')
        .update({
          points_available: newAvailable,
          total_points_earned: progress.totalMinutesEarned + actualGain,
        })
        .eq('user_id', user.id);

      await loadProgress();

      const bonusText = compensationBonus > 0 ? ` (+${compensationBonus} bonus)` : '';
      toast({
        title: `+${refinedTotal} min raffinées${bonusText}`,
        description: `${ids.length} tâche${ids.length > 1 ? 's' : ''} raffinée${ids.length > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } catch (error: any) {
      logger.error('Failed to refine points', { error: error.message });
    }
  }, [user, progress, loadProgress, toast]);

  // ---- Kept for backward compat ----
  const rewardStreak = useCallback(async (_streakCount: number, _type: 'task' | 'habit') => {}, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    levelUpAnimation: false,
    rewardTaskCompletion,
    rewardHabitCompletion,
    rewardStreak,
    getProgressPercentage: () => 0,
    reloadProgress: loadProgress,
    getDailyMicroTaskCount,
    getWeeklySummary,
    getStreakInfo,
    claimReward,
    getUserRewards,
    createReward,
    deleteReward,
    getClaimHistory,
    getUnrefinedTasks,
    refinePoints,
  };
};
