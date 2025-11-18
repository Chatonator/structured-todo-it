import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Achievement, UserAchievement } from '@/types/gamification';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedAnimation, setUnlockedAnimation] = useState<Achievement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatUserAchievement = (data: any): UserAchievement => ({
    id: data.id,
    userId: data.user_id,
    achievementId: data.achievement_id,
    achievement: data.achievement ? {
      id: data.achievement.id,
      key: data.achievement.key,
      name: data.achievement.name,
      description: data.achievement.description,
      icon: data.achievement.icon,
      category: data.achievement.category as any,
      targetValue: data.achievement.target_value,
      xpReward: data.achievement.xp_reward,
      pointsReward: data.achievement.points_reward,
      isSecret: data.achievement.is_secret,
      tier: data.achievement.tier as any,
      displayOrder: data.achievement.display_order,
      createdAt: new Date(data.achievement.created_at)
    } : undefined,
    currentProgress: data.current_progress,
    isUnlocked: data.is_unlocked,
    unlockedAt: data.unlocked_at ? new Date(data.unlocked_at) : undefined,
    createdAt: new Date(data.created_at)
  });

  const loadAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(formatUserAchievement);
      setAchievements(formatted);
    } catch (error: any) {
      logger.error('Failed to load achievements', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAndUnlockAchievement = useCallback(async (
    achievementKey: string,
    currentValue: number
  ) => {
    if (!user) return false;

    try {
      const { data: achievement, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .eq('key', achievementKey)
        .single();

      if (achError || !achievement) return false;

      const { data: userAch, error: userAchError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_id', achievement.id)
        .single();

      if (userAchError && userAchError.code !== 'PGRST116') throw userAchError;

      if (userAch?.is_unlocked) return false;

      const isUnlocked = currentValue >= (achievement.target_value || 0);

      if (userAch) {
        await supabase
          .from('user_achievements')
          .update({
            current_progress: currentValue,
            is_unlocked: isUnlocked,
            unlocked_at: isUnlocked ? new Date().toISOString() : null
          })
          .eq('id', userAch.id);
      } else {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            current_progress: currentValue,
            is_unlocked: isUnlocked,
            unlocked_at: isUnlocked ? new Date().toISOString() : null
          });
      }

      if (isUnlocked) {
        const formattedAch: Achievement = {
          id: achievement.id,
          key: achievement.key,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category as any,
          targetValue: achievement.target_value,
          xpReward: achievement.xp_reward,
          pointsReward: achievement.points_reward,
          isSecret: achievement.is_secret,
          tier: achievement.tier as any,
          displayOrder: achievement.display_order,
          createdAt: new Date(achievement.created_at)
        };

        setUnlockedAnimation(formattedAch);
        
        toast({
          title: `🏆 ${formattedAch.name} débloqué !`,
          description: formattedAch.description,
          duration: 5000
        });

        setTimeout(() => setUnlockedAnimation(null), 4000);

        await supabase
          .from('xp_transactions')
          .insert({
            user_id: user.id,
            source_type: 'achievement',
            source_id: achievement.id,
            xp_gained: achievement.xp_reward,
            points_gained: achievement.points_reward,
            description: `Achievement débloqué: ${achievement.name}`
          });

        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (progress) {
          await supabase
            .from('user_progress')
            .update({
              total_xp: progress.total_xp + achievement.xp_reward,
              current_points: progress.current_points + achievement.points_reward,
              lifetime_points: progress.lifetime_points + achievement.points_reward
            })
            .eq('user_id', user.id);
        }
      }

      await loadAchievements();
      return isUnlocked;
    } catch (error: any) {
      logger.error('Failed to check achievement', { error: error.message });
      return false;
    }
  }, [user, loadAchievements, toast]);

  const getUnlockedAchievements = useCallback(() => {
    return achievements.filter(a => a.isUnlocked);
  }, [achievements]);

  const getInProgressAchievements = useCallback(() => {
    return achievements.filter(a => !a.isUnlocked && a.currentProgress > 0);
  }, [achievements]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  return {
    achievements,
    loading,
    unlockedAnimation,
    checkAndUnlockAchievement,
    getUnlockedAchievements,
    getInProgressAchievements,
    reloadAchievements: loadAchievements
  };
};
