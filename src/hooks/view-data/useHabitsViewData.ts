import { useDecks } from '@/hooks/useDecks';
import { useHabits } from '@/hooks/useHabits';

/**
 * Hook spécialisé pour les données des habitudes
 * Extrait de useViewData pour améliorer la maintenabilité
 */
export const useHabitsViewData = () => {
  const { defaultDeckId } = useDecks();
  
  const { 
    completions: habitCompletions, 
    streaks: habitStreaks, 
    loading: habitsLoading,
    toggleCompletion: toggleHabitCompletion,
    getHabitsForToday,
    habits,
    createHabit,
    updateHabit,
    deleteHabit,
    isCompletedToday,
    getTodayCompletionRate
  } = useHabits(defaultDeckId);

  // Habitudes du jour
  const todayHabits = getHabitsForToday();

  return {
    // Données
    habits,
    todayHabits,
    habitCompletions,
    habitStreaks,
    habitsLoading,
    defaultDeckId,
    
    // Actions
    toggleHabitCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    
    // Utilitaires
    getHabitsForToday,
    isCompletedToday,
    getTodayCompletionRate
  };
};

export type HabitsViewDataReturn = ReturnType<typeof useHabitsViewData>;
