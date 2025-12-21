import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Habit, HabitStreak } from '@/types/habit';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { useAchievements } from '@/hooks/useAchievements';
import { useTimeEventSync } from './useTimeEventSync';

export const useHabits = (deckId: string | null) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, HabitStreak>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { rewardHabitCompletion, rewardStreak } = useGamification();
  const { checkAndUnlockAchievement } = useAchievements();
  const { syncHabitEvent, deleteEntityEvent, toggleHabitCompletion, isHabitCompletedToday } = useTimeEventSync();

  const loadHabits = useCallback(async () => {
    if (!user || !deckId) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', user.id)
        .order('order', { ascending: true });

      if (error) throw error;

const formattedHabits: Habit[] = (data || []).map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        deckId: h.deck_id,
        frequency: h.frequency as Habit['frequency'],
        timesPerWeek: h.times_per_week,
        timesPerMonth: h.times_per_month,
        targetDays: h.target_days,
        isActive: h.is_active,
        order: h.order,
        icon: h.icon,
        color: h.color,
        createdAt: new Date(h.created_at),
        isChallenge: h.is_challenge,
        challengeStartDate: h.challenge_start_date ? new Date(h.challenge_start_date) : undefined,
        challengeEndDate: h.challenge_end_date ? new Date(h.challenge_end_date) : undefined,
        challengeDurationDays: h.challenge_duration_days,
        challengeEndAction: h.challenge_end_action,
        isLocked: h.is_locked,
        unlockCondition: h.unlock_condition
      }));

      setHabits(formattedHabits);
    } catch (error: any) {
      logger.error('Failed to load habits', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, deckId]);

  // Charger les complétions d'aujourd'hui depuis time_occurrences
  const loadTodayCompletions = useCallback(async () => {
    if (!user || habits.length === 0) return;

    try {
      const completionsMap: Record<string, boolean> = {};
      
      for (const habit of habits) {
        const isCompleted = await isHabitCompletedToday(habit.id);
        completionsMap[habit.id] = isCompleted;
      }
      
      setCompletions(completionsMap);
    } catch (error: any) {
      logger.error('Failed to load completions', { error: error.message });
    }
  }, [user, habits, isHabitCompletedToday]);

  // Calculer les streaks depuis time_occurrences
  const calculateStreaks = useCallback(async () => {
    if (!user || habits.length === 0) return;

    const streaksData: Record<string, HabitStreak> = {};

    for (const habit of habits) {
      try {
        // Récupérer l'event_id de l'habitude
        const { data: event } = await supabase
          .from('time_events')
          .select('id')
          .eq('entity_type', 'habit')
          .eq('entity_id', habit.id)
          .eq('user_id', user.id)
          .single();

        if (!event) {
          streaksData[habit.id] = { habitId: habit.id, currentStreak: 0, longestStreak: 0, lastCompletedDate: '' };
          continue;
        }

        // Récupérer les occurrences complétées
        const { data: occurrences, error } = await supabase
          .from('time_occurrences')
          .select('starts_at')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('starts_at', { ascending: false });

        if (error) throw error;

        const dates = (occurrences || []).map(o => o.starts_at.split('T')[0]);
        
        let currentStreak = 0;
        const today = new Date();
        
        for (let i = 0; i < dates.length; i++) {
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (dates[i] === expectedDate.toISOString().split('T')[0]) {
            currentStreak++;
          } else {
            break;
          }
        }

        let longestStreak = 0;
        let tempStreak = 0;
        
        for (let i = 0; i < dates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const d1 = new Date(dates[i]);
            const d2 = new Date(dates[i-1]);
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        }

        streaksData[habit.id] = {
          habitId: habit.id,
          currentStreak,
          longestStreak,
          lastCompletedDate: dates[0] || ''
        };
      } catch (error: any) {
        logger.error('Failed to calculate streak', { habitId: habit.id, error: error.message });
        streaksData[habit.id] = { habitId: habit.id, currentStreak: 0, longestStreak: 0, lastCompletedDate: '' };
      }
    }

    setStreaks(streaksData);
  }, [user, habits]);

  // Toggle via time_occurrences
  const toggleCompletion = useCallback(async (habitId: string) => {
    if (!user) return false;

    const wasCompleted = completions[habitId];

    try {
      const success = await toggleHabitCompletion(habitId);
      
      if (!success) {
        throw new Error('Failed to toggle completion');
      }

      // Mettre à jour l'état local
      setCompletions(prev => ({
        ...prev,
        [habitId]: !wasCompleted
      }));

      // Si on vient de compléter (pas de décocher)
      if (!wasCompleted) {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          await rewardHabitCompletion(habitId, habit.name);
          await checkAndUnlockAchievement('habits_30', habits.length);
          
          const streak = streaks[habitId];
          if (streak && [7, 14, 30, 60, 100, 365].includes(streak.currentStreak + 1)) {
            await rewardStreak(streak.currentStreak + 1, 'habit');
          }
        }
      }

      // Recalculer les streaks
      await calculateStreaks();
      
      return true;
    } catch (error: any) {
      logger.error('Failed to toggle completion', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'habitude",
        variant: "destructive"
      });
      return false;
    }
  }, [user, completions, habits, streaks, toggleHabitCompletion, calculateStreaks, rewardHabitCompletion, checkAndUnlockAchievement, rewardStreak, toast]);

  const createHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (!user || !deckId) return null;

    try {
const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          deck_id: deckId,
          name: habit.name,
          description: habit.description,
          frequency: habit.frequency,
          times_per_week: habit.timesPerWeek,
          times_per_month: habit.timesPerMonth,
          target_days: habit.targetDays,
          is_active: habit.isActive,
          order: habit.order,
          icon: habit.icon,
          color: habit.color,
          is_challenge: habit.isChallenge,
          challenge_start_date: habit.challengeStartDate?.toISOString(),
          challenge_end_date: habit.challengeEndDate?.toISOString(),
          challenge_duration_days: habit.challengeDurationDays,
          challenge_end_action: habit.challengeEndAction,
          is_locked: habit.isLocked,
          unlock_condition: habit.unlockCondition
        })
        .select()
        .single();

      if (error) throw error;

      // Créer le time_event associé
      const newHabit: Habit = {
        id: data.id,
        name: data.name,
        description: data.description,
        deckId: data.deck_id,
        frequency: data.frequency as Habit['frequency'],
        timesPerWeek: data.times_per_week,
        targetDays: data.target_days,
        isActive: data.is_active ?? true,
        order: data.order,
        icon: data.icon,
        color: data.color,
        createdAt: new Date(data.created_at)
      };
      await syncHabitEvent(newHabit);

      await loadHabits();
      return data.id;
    } catch (error: any) {
      logger.error('Failed to create habit', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de créer l'habitude",
        variant: "destructive"
      });
      return null;
    }
  }, [user, deckId, loadHabits, toast, syncHabitEvent]);

  const updateHabit = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    if (!user) return false;

    try {
const { error } = await supabase
        .from('habits')
        .update({
          name: updates.name,
          description: updates.description,
          frequency: updates.frequency,
          times_per_week: updates.timesPerWeek,
          times_per_month: updates.timesPerMonth,
          target_days: updates.targetDays,
          is_active: updates.isActive,
          order: updates.order,
          icon: updates.icon,
          color: updates.color,
          is_challenge: updates.isChallenge,
          challenge_start_date: updates.challengeStartDate?.toISOString(),
          challenge_end_date: updates.challengeEndDate?.toISOString(),
          challenge_duration_days: updates.challengeDurationDays,
          challenge_end_action: updates.challengeEndAction,
          is_locked: updates.isLocked,
          unlock_condition: updates.unlockCondition
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Synchroniser le time_event
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const updatedHabit = { ...habit, ...updates };
        await syncHabitEvent(updatedHabit);
      }

      await loadHabits();
      return true;
    } catch (error: any) {
      logger.error('Failed to update habit', { error: error.message });
      return false;
    }
  }, [user, habits, loadHabits, syncHabitEvent]);

  const deleteHabit = useCallback(async (habitId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Supprimer le time_event associé
      await deleteEntityEvent('habit', habitId);

      await loadHabits();
      return true;
    } catch (error: any) {
      logger.error('Failed to delete habit', { error: error.message });
      return false;
    }
  }, [user, loadHabits, deleteEntityEvent]);

  const isCompletedToday = useCallback((habitId: string) => {
    return completions[habitId] || false;
  }, [completions]);

// Vérifier si une habitude est applicable aujourd'hui
  const isHabitApplicableToday = useCallback((habit: Habit) => {
    // Vérifier si l'habitude est verrouillée
    if (habit.isLocked) {
      return false;
    }
    
    // Vérifier si le challenge est terminé
    if (habit.isChallenge && habit.challengeEndDate) {
      const now = new Date();
      if (now > new Date(habit.challengeEndDate)) {
        return false;
      }
    }
    
    // Toujours applicable si quotidien ou x-fois par semaine/mois
    if (habit.frequency === 'daily' || habit.frequency === 'x-times-per-week' || habit.frequency === 'x-times-per-month') {
      return true;
    }
    
    // Si weekly ou custom, vérifier targetDays (jours de la semaine)
    if ((habit.frequency === 'weekly' || habit.frequency === 'custom') && habit.targetDays) {
      const today = new Date().getDay();
      // Convertir Sunday=0 vers Monday=0 (notre format)
      const adjustedDay = today === 0 ? 6 : today - 1;
      return habit.targetDays.includes(adjustedDay);
    }
    
    // Si monthly, vérifier targetDays (jours du mois)
    if (habit.frequency === 'monthly' && habit.targetDays) {
      const todayDate = new Date().getDate();
      return habit.targetDays.includes(todayDate);
    }
    
    // Par défaut applicable
    return true;
  }, []);

  // Obtenir les habitudes applicables aujourd'hui
  const getHabitsForToday = useCallback(() => {
    return habits.filter(h => h.isActive && isHabitApplicableToday(h));
  }, [habits, isHabitApplicableToday]);

  const getTodayCompletionRate = useCallback(() => {
    const todayHabits = getHabitsForToday();
    if (todayHabits.length === 0) return 0;
    const completed = todayHabits.filter(h => isCompletedToday(h.id)).length;
    return Math.round((completed / todayHabits.length) * 100);
  }, [getHabitsForToday, isCompletedToday]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    if (habits.length > 0) {
      loadTodayCompletions();
      calculateStreaks();
    }
  }, [habits, loadTodayCompletions, calculateStreaks]);

  return {
    habits,
    completions,
    streaks,
    loading,
    toggleCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    isCompletedToday,
    isHabitApplicableToday,
    getHabitsForToday,
    getTodayCompletionRate,
    reloadHabits: loadHabits
  };
};
