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


  const getProgressPercentage = useCallback(() => {
    if (!progress) return 0;
    const currentLevelXp = calculateXpForLevel(progress.currentLevel);
    const nextLevelXp = progress.xpForNextLevel;
    const xpInCurrentLevel = progress.totalXp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    return (xpInCurrentLevel / xpNeededForLevel) * 100;
  }, [progress]);

  const checkAndUnlockAchievement = useCallback(async (achievementKey: string, currentProgress: number) => {
    if (!user) return;

    try {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('key', achievementKey)
        .single();

      if (!achievement) return;

      const { data: userAchievement } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_id', achievement.id)
        .single();

      if (userAchievement?.is_unlocked) return;

      if (userAchievement) {
        await supabase
          .from('user_achievements')
          .update({
            current_progress: currentProgress,
            is_unlocked: true,
            unlocked_at: new Date().toISOString()
          })
          .eq('id', userAchievement.id);
      } else {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            current_progress: currentProgress,
            is_unlocked: true,
            unlocked_at: new Date().toISOString()
          });
      }

      if (achievement.xp_reward || achievement.points_reward) {
        await addXp(
          achievement.xp_reward || 0,
          achievement.points_reward || 0,
          'achievement',
          achievement.id,
          `Achievement débloqué: ${achievement.name}`
        );
      }

      toast({
        title: `🏆 ${achievement.name}`,
        description: achievement.description,
        duration: 5000
      });
    } catch (error: any) {
      logger.error('Failed to unlock achievement', { error: error.message });
    }
  }, [user, addXp, toast]);

  const rewardProjectCreation = useCallback(async (projectName: string) => {
    if (!progress) return;

    const xp = 20;
    const points = 4;

    await addXp(xp, points, 'project_created', undefined, `Projet créé: ${projectName}`);

    const { count } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('item_type', 'project');

    if (count === 1) {
      await checkAndUnlockAchievement('first_project', 1);
    }
  }, [progress, addXp, user, checkAndUnlockAchievement]);

  const rewardProjectCompletion = useCallback(async (
    projectId: string,
    projectName: string,
    taskCount: number
  ) => {
    if (!progress) return;

    const baseXp = 150;
    const bonusXp = Math.min(taskCount * 5, 100);
    const totalXp = baseXp + bonusXp;
    const points = 30 + Math.floor(bonusXp / 5);

    await addXp(
      totalXp,
      points,
      'project_completed',
      projectId,
      `Projet complété: ${projectName} (${taskCount} tâches)`
    );

    const { count } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .eq('item_type', 'project')
      .contains('metadata', { status: 'completed' });

    const completedCount = count || 0;

    if (completedCount === 1) {
      await checkAndUnlockAchievement('project_completed', 1);
    }

    if (completedCount === 5) {
      await checkAndUnlockAchievement('projects_5', 5);
    }

    if (taskCount > 10) {
      await checkAndUnlockAchievement('big_project', taskCount);
    }
  }, [progress, addXp, user, checkAndUnlockAchievement]);

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
    rewardProjectCreation,
    rewardProjectCompletion,
    getProgressPercentage,
    reloadProgress: loadProgress
  };
};
