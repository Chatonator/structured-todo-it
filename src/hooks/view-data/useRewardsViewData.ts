import { useMemo } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook spécialisé pour les données de la RewardsView
 */
export const useRewardsViewData = () => {
  const { user } = useAuth();
  const gamification = useGamification();

  // Statistiques de progression
  const progressStats = useMemo(() => {
    if (!gamification.progress) {
      return {
        level: 1,
        currentXp: 0,
        xpToNextLevel: 100,
        progressPercent: 0,
        totalPoints: 0,
        streak: 0
      };
    }

    const { 
      currentLevel, 
      totalXp, 
      xpForNextLevel, 
      currentPoints, 
      currentTaskStreak 
    } = gamification.progress;
    
    const progressPercent = gamification.getProgressPercentage();

    return {
      level: currentLevel,
      currentXp: totalXp,
      xpToNextLevel: xpForNextLevel,
      progressPercent,
      totalPoints: currentPoints,
      streak: currentTaskStreak
    };
  }, [gamification.progress, gamification.getProgressPercentage]);

  // État de chargement
  const loading = gamification.loading;

  return {
    data: {
      progress: gamification.progress,
      progressStats,
      userId: user?.id,
      levelUpAnimation: gamification.levelUpAnimation
    },
    state: {
      loading,
      isAuthenticated: !!user,
      hasProgress: !!gamification.progress
    },
    actions: {
      reloadProgress: gamification.reloadProgress
    }
  };
};

export type RewardsViewDataReturn = ReturnType<typeof useRewardsViewData>;
