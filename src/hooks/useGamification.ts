import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProgress, XP_CONFIG } from '@/types/gamification';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const useGamification = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatProgress = (data: any): UserProgress => ({
    id: data.id,
    userId: data.user_id,
    totalXp: data.total_xp,
    currentLevel: data.current_level,
    xpForNextLevel: data.xp_for_next_level,
    lifetimePoints: data.lifetime_points,
    currentPoints: data.current_points,
    tasksCompleted: data.tasks_completed,
    habitsCompleted: data.habits_completed,
    currentTaskStreak: data.current_task_streak,
    longestTaskStreak: data.longest_task_streak,
    currentHabitStreak: data.current_habit_streak,
    longestHabitStreak: data.longest_habit_streak,
    dailyChallengeStreak: data.daily_challenge_streak,
    weeklyChallengesCompleted: data.weekly_challenges_completed,
    lastActivityDate: data.last_activity_date,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  });

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

  const calculateXpForLevel = (level: number): number => {
    return Math.floor(XP_CONFIG.LEVEL_BASE_XP * Math.pow(level, XP_CONFIG.LEVEL_XP_MULTIPLIER));
  };

  const addXp = useCallback(async (
    xpAmount: number,
    pointsAmount: number,
    sourceType: string,
    sourceId?: string,
    description?: string
  ) => {
    if (!user || !progress) return false;

    try {
      const newTotalXp = progress.totalXp + xpAmount;
      let newLevel = progress.currentLevel;
      let xpForNext = progress.xpForNextLevel;
      let leveledUp = false;

      while (newTotalXp >= xpForNext) {
        newLevel++;
        xpForNext = calculateXpForLevel(newLevel + 1);
        leveledUp = true;
      }

      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          total_xp: newTotalXp,
          current_level: newLevel,
          xp_for_next_level: xpForNext,
          lifetime_points: progress.lifetimePoints + pointsAmount,
          current_points: progress.currentPoints + pointsAmount,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await supabase
        .from('xp_transactions')
        .insert({
          user_id: user.id,
          source_type: sourceType,
          source_id: sourceId,
          xp_gained: xpAmount,
          points_gained: pointsAmount,
          description
        });

      await loadProgress();

      if (leveledUp) {
        setLevelUpAnimation(true);
        toast({
          title: `🎉 Niveau ${newLevel} !`,
          description: `Vous avez atteint le niveau ${newLevel} !`,
          duration: 5000
        });
        setTimeout(() => setLevelUpAnimation(false), 3000);
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to add XP', { error: error.message });
      return false;
    }
  }, [user, progress, loadProgress, toast]);

  const rewardTaskCompletion = useCallback(async (task: any) => {
    if (!progress) return;

    const xp = XP_CONFIG.TASK_XP[task.category] || 10;
    const points = Math.ceil(xp / 5);

    await addXp(xp, points, 'task', task.id, `Tâche complétée: ${task.name}`);

    await supabase
      .from('user_progress')
      .update({
        tasks_completed: progress.tasksCompleted + 1
      })
      .eq('user_id', user!.id);

    await loadProgress();
  }, [progress, user, addXp, loadProgress]);

  const rewardHabitCompletion = useCallback(async (habitId: string, habitName: string) => {
    if (!progress) return;

    const xp = XP_CONFIG.HABIT_XP;
    const points = Math.ceil(xp / 5);

    await addXp(xp, points, 'habit', habitId, `Habitude complétée: ${habitName}`);

    await supabase
      .from('user_progress')
      .update({
        habits_completed: progress.habitsCompleted + 1
      })
      .eq('user_id', user!.id);

    await loadProgress();
  }, [progress, user, addXp, loadProgress]);

  const rewardStreak = useCallback(async (streakCount: number, type: 'task' | 'habit') => {
    if (!progress) return;

    const bonus = XP_CONFIG.STREAK_BONUS[streakCount];
    if (!bonus) return;

    await addXp(
      bonus.xp,
      bonus.points,
      'streak_bonus',
      undefined,
      `Bonus de série: ${streakCount} jours (${type})`
    );

    toast({
      title: `🔥 Série de ${streakCount} jours !`,
      description: `+${bonus.xp} XP et +${bonus.points} points`,
      duration: 5000
    });
  }, [progress, addXp, toast]);

  const claimDailyBonus = useCallback(async () => {
    if (!progress || !user) return false;

    const today = new Date().toISOString().split('T')[0];
    
    if (progress.lastActivityDate === today) {
      toast({
        title: "Déjà réclamé",
        description: "Revenez demain pour votre bonus quotidien !",
        variant: "destructive"
      });
      return false;
    }

    await addXp(
      XP_CONFIG.DAILY_BONUS.xp,
      XP_CONFIG.DAILY_BONUS.points,
      'daily_bonus',
      undefined,
      'Bonus quotidien'
    );

    toast({
      title: "✨ Bonus quotidien réclamé !",
      description: `+${XP_CONFIG.DAILY_BONUS.xp} XP et +${XP_CONFIG.DAILY_BONUS.points} points`,
      duration: 3000
    });

    return true;
  }, [progress, user, addXp, toast]);

  const getProgressPercentage = useCallback(() => {
    if (!progress) return 0;
    const currentLevelXp = calculateXpForLevel(progress.currentLevel);
    const nextLevelXp = progress.xpForNextLevel;
    const xpInCurrentLevel = progress.totalXp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    return (xpInCurrentLevel / xpNeededForLevel) * 100;
  }, [progress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    levelUpAnimation,
    rewardTaskCompletion,
    rewardHabitCompletion,
    rewardStreak,
    claimDailyBonus,
    getProgressPercentage,
    reloadProgress: loadProgress
  };
};
