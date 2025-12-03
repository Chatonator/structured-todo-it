import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Habit, HabitCompletion, HabitStreak } from '@/types/habit';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { useAchievements } from '@/hooks/useAchievements';
import { useTimeEventSync } from './useTimeEventSync';

const isConsecutiveDay = (date1: string, date2: string) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

export const useHabits = (deckId: string | null) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streaks, setStreaks] = useState<Record<string, HabitStreak>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { rewardHabitCompletion, rewardStreak } = useGamification();
  const { checkAndUnlockAchievement } = useAchievements();
  const { syncHabitEvent, deleteEntityEvent } = useTimeEventSync();

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
        targetDays: h.target_days,
        isActive: h.is_active,
        order: h.order,
        icon: h.icon,
        color: h.color,
        createdAt: new Date(h.created_at)
      }));

      setHabits(formattedHabits);
    } catch (error: any) {
      logger.error('Failed to load habits', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, deckId]);

  const loadTodayCompletions = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;

      const formattedCompletions: HabitCompletion[] = (data || []).map(c => ({
        id: c.id,
        habitId: c.habit_id,
        userId: c.user_id,
        completedAt: new Date(c.completed_at),
        date: c.date,
        notes: c.notes
      }));

      setCompletions(formattedCompletions);
    } catch (error: any) {
      logger.error('Failed to load completions', { error: error.message });
    }
  }, [user]);

  const calculateStreaks = useCallback(async () => {
    if (!user || habits.length === 0) return;

    const streaksData: Record<string, HabitStreak> = {};

    for (const habit of habits) {
      try {
        const { data, error } = await supabase
          .from('habit_completions')
          .select('date')
          .eq('habit_id', habit.id)
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        const dates = (data || []).map(d => d.date);
        
        let currentStreak = 0;
        const today = new Date();
        
        for (let i = 0; i < dates.length; i++) {
          const date = new Date(dates[i]);
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
          if (i === 0 || isConsecutiveDay(dates[i], dates[i-1])) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }

        streaksData[habit.id] = {
          habitId: habit.id,
          currentStreak,
          longestStreak,
          lastCompletedDate: dates[0] || ''
        };
      } catch (error: any) {
        logger.error('Failed to calculate streak', { habitId: habit.id, error: error.message });
      }
    }

    setStreaks(streaksData);
  }, [user, habits]);

  const toggleCompletion = useCallback(async (habitId: string) => {
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const existing = completions.find(c => c.habitId === habitId && c.date === today);

    try {
      if (existing) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            date: today
          });

        if (error) throw error;

        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          await rewardHabitCompletion(habitId, habit.name);
          await checkAndUnlockAchievement('habits_30', habits.length);
          
          const streak = streaks[habitId];
          if (streak && [7, 14, 30, 60, 100, 365].includes(streak.currentStreak)) {
            await rewardStreak(streak.currentStreak, 'habit');
          }
        }
      }

      await loadTodayCompletions();
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
  }, [user, completions, loadTodayCompletions, calculateStreaks, toast]);

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
          target_days: habit.targetDays,
          is_active: habit.isActive,
          order: habit.order,
          icon: habit.icon,
          color: habit.color
        })
        .select()
        .single();

      if (error) throw error;

      // Sync avec time_events
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
          target_days: updates.targetDays,
          is_active: updates.isActive,
          order: updates.order,
          icon: updates.icon,
          color: updates.color
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadHabits();
      return true;
    } catch (error: any) {
      logger.error('Failed to update habit', { error: error.message });
      return false;
    }
  }, [user, loadHabits]);

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
    const today = new Date().toISOString().split('T')[0];
    return completions.some(c => c.habitId === habitId && c.date === today);
  }, [completions]);

  const getTodayCompletionRate = useCallback(() => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => isCompletedToday(h.id)).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits, isCompletedToday]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    loadTodayCompletions();
  }, [loadTodayCompletions]);

  useEffect(() => {
    calculateStreaks();
  }, [calculateStreaks]);

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
    getTodayCompletionRate,
    reloadHabits: loadHabits
  };
};
