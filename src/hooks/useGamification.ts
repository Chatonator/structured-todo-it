import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProgress, TransactionMetadata, DailyStreakInfo } from '@/types/gamification';
import { computeTaskPoints, checkMicroTaskCap, checkStreakDay, computeWeeklySummary, isStreakEligible } from '@/lib/rewards';
import type { WeeklySummary } from '@/lib/rewards';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, startOfDay, format } from 'date-fns';

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

  // ---- Reward task completion (new engine) ----
  const rewardTaskCompletion = useCallback(async (task: any) => {
    if (!user || !progress) return;

    try {
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

      // 3. Get scheduled date from time_events (if exists)
      let scheduledAt: string | null = null;
      const { data: eventData } = await supabase
        .from('time_events')
        .select('created_at')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (eventData && eventData.length > 0) {
        scheduledAt = eventData[0].created_at;
      }

      const completedAt = new Date();

      // 4. Compute points
      const result = computeTaskPoints({
        durationMinutes,
        isImportant,
        isUrgent,
        postponeCount,
        scheduledAt,
        completedAt,
      });

      // 5. Check micro-task cap
      let finalPoints = result.points;
      let capped = false;
      if (result.isMicroTask) {
        const microCount = await getDailyMicroTaskCount();
        if (!checkMicroTaskCap(microCount)) {
          finalPoints = 0;
          capped = true;
        }
      }

      // 6. Build metadata
      const metadata: TransactionMetadata = {
        base: result.base,
        quadrantKey: result.quadrantKey,
        quadrantCoeff: result.quadrantCoeff,
        bonusType: result.bonusType,
        bonusValue: result.bonusValue,
        formula: result.formula,
        isMicroTask: result.isMicroTask,
        capped,
        durationMinutes,
        isImportant,
        isUrgent,
        postponeCount,
      };

      // 7. Record transaction
      await supabase
        .from('xp_transactions')
        .insert([{
          user_id: user.id,
          source_type: 'task',
          source_id: task.id,
          xp_gained: finalPoints,
          points_gained: finalPoints,
          description: `Tâche complétée: ${task.name}`,
          metadata: metadata as any,
        }]);

      // 8. Update total points and tasks_completed
      const newTotalXp = (progress.totalXp ?? 0) + finalPoints;

      // 9. Streak logic
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const importantMinutes = await getImportantMinutesToday();
      const streakQualified = checkStreakDay(importantMinutes);

      let newStreak = progress.currentTaskStreak;
      let newLongest = progress.longestTaskStreak;

      if (progress.lastActivityDate !== todayStr) {
        // First completion today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

        if (streakQualified) {
          if (progress.lastActivityDate === yesterdayStr) {
            newStreak = progress.currentTaskStreak + 1;
          } else if (!progress.lastActivityDate || progress.lastActivityDate < yesterdayStr) {
            newStreak = 1;
          }
        } else {
          // Day not qualified yet — don't break streak if we haven't missed a day
          if (progress.lastActivityDate && progress.lastActivityDate < format(yesterday, 'yyyy-MM-dd')) {
            newStreak = 0;
          }
        }
        newLongest = Math.max(newLongest, newStreak);
      } else if (streakQualified && progress.currentTaskStreak === 0) {
        // Already activity today but streak was 0 — now qualified
        newStreak = 1;
        newLongest = Math.max(newLongest, 1);
      }

      // 10. Update user_progress
      await supabase
        .from('user_progress')
        .update({
          total_xp: newTotalXp,
          current_points: newTotalXp,
          tasks_completed: progress.tasksCompleted + 1,
          current_task_streak: newStreak,
          longest_task_streak: newLongest,
          last_activity_date: todayStr,
        })
        .eq('user_id', user.id);

      await loadProgress();

      // Show toast for significant points
      if (finalPoints > 0) {
        toast({
          title: `+${finalPoints} pts`,
          description: result.formula,
          duration: 3000,
        });
      } else if (capped) {
        toast({
          title: '0 pts (plafond micro-tâches)',
          description: `Limite de 5 micro-tâches/jour atteinte`,
          duration: 3000,
        });
      }
    } catch (error: any) {
      logger.error('Failed to reward task', { error: error.message });
    }
  }, [user, progress, loadProgress, getDailyMicroTaskCount, getImportantMinutesToday, toast]);

  // ---- Habit completion (simplified — no points) ----
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
    if (!user) return { pctImportantNotUrgent: 0, pctUrgent: 0, pctMaintenance: 0, alignmentScore: 0, totalMinutes: 0, totalPoints: 0 };

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
      return { pctImportantNotUrgent: 0, pctUrgent: 0, pctMaintenance: 0, alignmentScore: 0, totalMinutes: 0, totalPoints: 0 };
    }

    const entries = data.map((t: any) => ({
      durationMinutes: t.metadata?.durationMinutes ?? 0,
      isImportant: t.metadata?.isImportant ?? false,
      isUrgent: t.metadata?.isUrgent ?? false,
      points: t.xp_gained ?? 0,
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

  // ---- Kept for backward compat (habits) ----
  const rewardStreak = useCallback(async (_streakCount: number, _type: 'task' | 'habit') => {
    // No-op in new engine — streaks are handled differently
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    levelUpAnimation: false, // Deprecated — kept for compat
    rewardTaskCompletion,
    rewardHabitCompletion,
    rewardStreak,
    getProgressPercentage: () => 0, // Deprecated
    reloadProgress: loadProgress,
    getDailyMicroTaskCount,
    getWeeklySummary,
    getStreakInfo,
  };
};
