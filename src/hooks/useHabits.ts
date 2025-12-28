// ============= Habits Hook (unified items wrapper) =============
// This hook wraps useItems to provide backward-compatible Habit operations
// All data is now stored in the unified 'items' table

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useItems } from './useItems';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useGamification } from './useGamification';
import { useAchievements } from './useAchievements';
import { useTimeEventSync } from './useTimeEventSync';
import { Habit, HabitStreak } from '@/types/habit';
import { Item, ItemMetadata } from '@/types/item';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

// Convert Item to Habit for backward compatibility
function itemToHabit(item: Item): Habit {
  const meta = item.metadata || {};
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    category: (meta.category as Habit['category']) || 'Quotidien',
    context: (meta.context as Habit['context']) || 'Perso',
    estimatedTime: (meta.estimatedTime as number) || 15,
    description: meta.description as string | undefined,
    deckId: item.parentId || (meta.deckId as string) || '',
    frequency: (meta.frequency as Habit['frequency']) || 'daily',
    timesPerWeek: meta.timesPerWeek as number | undefined,
    timesPerMonth: meta.timesPerMonth as number | undefined,
    targetDays: meta.targetDays as number[] | undefined,
    isActive: (meta.isActive as boolean) ?? true,
    order: item.orderIndex,
    icon: meta.icon as string | undefined,
    color: meta.color as string | undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  isChallenge: meta.isChallenge as boolean | undefined,
    challengeStartDate: meta.challengeStartDate ? new Date(meta.challengeStartDate as unknown as string) : undefined,
    challengeEndDate: meta.challengeEndDate ? new Date(meta.challengeEndDate as unknown as string) : undefined,
    challengeDurationDays: meta.challengeDurationDays as number | undefined,
    challengeEndAction: meta.challengeEndAction as Habit['challengeEndAction'],
    isLocked: meta.isLocked as boolean | undefined,
    unlockCondition: meta.unlockCondition as Habit['unlockCondition'],
  };
}

// Convert Habit to Item metadata
function habitToItemMetadata(habit: Partial<Habit>): Partial<ItemMetadata> {
  return {
    category: habit.category || 'Quotidien',
    context: habit.context || 'Perso',
    estimatedTime: habit.estimatedTime || 15,
    description: habit.description,
    frequency: habit.frequency,
    timesPerWeek: habit.timesPerWeek,
    timesPerMonth: habit.timesPerMonth,
    targetDays: habit.targetDays,
    isActive: habit.isActive,
    icon: habit.icon,
    color: habit.color,
    isChallenge: habit.isChallenge,
    challengeStartDate: habit.challengeStartDate,
    challengeEndDate: habit.challengeEndDate,
    challengeDurationDays: habit.challengeDurationDays,
    challengeEndAction: habit.challengeEndAction,
    isLocked: habit.isLocked,
    unlockCondition: habit.unlockCondition,
  };
}

export const useHabits = (deckId: string | null) => {
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, HabitStreak>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { rewardHabitCompletion, rewardStreak } = useGamification();
  const { checkAndUnlockAchievement } = useAchievements();
  const { syncHabitEvent, deleteEntityEvent, toggleHabitCompletion, isHabitCompletedToday } = useTimeEventSync();

  const { 
    items, 
    loading, 
    createItem, 
    updateItem, 
    deleteItem,
    reload 
  } = useItems({ 
    contextTypes: ['habit'],
    parentId: deckId || undefined,
  });

  // Convert items to habits
  const habits = useMemo(() => items.map(itemToHabit), [items]);

  // Load today's completions from time_occurrences
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

  // Calculate streaks from time_occurrences
  const calculateStreaks = useCallback(async () => {
    if (!user || habits.length === 0) return;

    const streaksData: Record<string, HabitStreak> = {};

    for (const habit of habits) {
      try {
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

  // Toggle completion via time_occurrences
  const toggleCompletion = useCallback(async (habitId: string) => {
    if (!user) return false;

    const wasCompleted = completions[habitId];

    try {
      const success = await toggleHabitCompletion(habitId);
      
      if (!success) {
        throw new Error('Failed to toggle completion');
      }

      setCompletions(prev => ({
        ...prev,
        [habitId]: !wasCompleted
      }));

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

  // Create habit
  const createHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    // Use deckId from hook parameter, fallback to habit.deckId
    const targetDeckId = deckId || habit.deckId;
    
    if (!user) {
      logger.error('Failed to create habit', { error: 'User not authenticated' });
      return null;
    }
    
    if (!targetDeckId) {
      logger.error('Failed to create habit', { error: 'No deck selected' });
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un deck",
        variant: "destructive"
      });
      return null;
    }

    try {
      const newItem = await createItem({
        name: habit.name,
        contextType: 'habit',
        parentId: targetDeckId,
        metadata: habitToItemMetadata(habit),
        orderIndex: habit.order ?? habits.length,
      });

      // Sync with time_events
      const newHabit = itemToHabit(newItem);
      await syncHabitEvent(newHabit);

      toast({
        title: "Habitude créée",
        description: `${habit.name} a été ajoutée`,
      });

      return newItem.id;
    } catch (error: any) {
      logger.error('Failed to create habit', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de créer l'habitude",
        variant: "destructive"
      });
      return null;
    }
  }, [user, deckId, createItem, habits.length, toast, syncHabitEvent]);

  // Update habit
  const updateHabit = useCallback(async (habitId: string, updates: Partial<Habit>) => {
    if (!user) return false;

    try {
      const item = items.find(i => i.id === habitId);
      if (!item) return false;

      await updateItem(habitId, {
        name: updates.name ?? item.name,
        orderIndex: updates.order ?? item.orderIndex,
        metadata: { ...item.metadata, ...habitToItemMetadata(updates) },
      });

      // Sync with time_events
      const updatedHabit = { ...itemToHabit(item), ...updates };
      await syncHabitEvent(updatedHabit);

      return true;
    } catch (error: any) {
      logger.error('Failed to update habit', { error: error.message });
      return false;
    }
  }, [user, items, updateItem, syncHabitEvent]);

  // Delete habit
  const deleteHabit = useCallback(async (habitId: string) => {
    if (!user) return false;

    try {
      await deleteItem(habitId);
      await deleteEntityEvent('habit', habitId);
      return true;
    } catch (error: any) {
      logger.error('Failed to delete habit', { error: error.message });
      return false;
    }
  }, [user, deleteItem, deleteEntityEvent]);

  // Is completed today
  const isCompletedToday = useCallback((habitId: string) => {
    return completions[habitId] || false;
  }, [completions]);

  // Is habit applicable today
  const isHabitApplicableToday = useCallback((habit: Habit) => {
    if (habit.isLocked) return false;
    
    if (habit.isChallenge && habit.challengeEndDate) {
      if (new Date() > new Date(habit.challengeEndDate)) {
        return false;
      }
    }
    
    if (habit.frequency === 'daily' || habit.frequency === 'x-times-per-week' || habit.frequency === 'x-times-per-month') {
      return true;
    }
    
    if ((habit.frequency === 'weekly' || habit.frequency === 'custom') && habit.targetDays) {
      const today = new Date().getDay();
      const adjustedDay = today === 0 ? 6 : today - 1;
      return habit.targetDays.includes(adjustedDay);
    }
    
    if (habit.frequency === 'monthly' && habit.targetDays) {
      const todayDate = new Date().getDate();
      return habit.targetDays.includes(todayDate);
    }
    
    return true;
  }, []);

  // Get habits for today
  const getHabitsForToday = useCallback(() => {
    return habits.filter(h => h.isActive && isHabitApplicableToday(h));
  }, [habits, isHabitApplicableToday]);

  // Get today completion rate
  const getTodayCompletionRate = useCallback(() => {
    const todayHabits = getHabitsForToday();
    if (todayHabits.length === 0) return 0;
    const completed = todayHabits.filter(h => isCompletedToday(h.id)).length;
    return Math.round((completed / todayHabits.length) * 100);
  }, [getHabitsForToday, isCompletedToday]);

  // Load completions and streaks when habits change
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
    reloadHabits: reload
  };
};
