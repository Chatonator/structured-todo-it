import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, subDays, format, getDay, getDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Habit, HabitFrequency } from '@/types/habit';

export interface DailyTrend {
  date: string;
  day: string;
  completions: number;
  total: number;
  rate: number;
}

export interface MonthlyDay {
  date: string;
  count: number;
  total: number;
  rate: number;
}

export interface HabitStats {
  bestCurrentStreak: number;
  longestStreak: number;
  weeklyCompletions: number;
  overallCompletionRate: number;
  totalHabits: number;
  dailyTrends: DailyTrend[];
  monthlyData: MonthlyDay[];
  loading: boolean;
}

export const useHabitStats = () => {
  const [stats, setStats] = useState<HabitStats>({
    bestCurrentStreak: 0,
    longestStreak: 0,
    weeklyCompletions: 0,
    overallCompletionRate: 0,
    totalHabits: 0,
    dailyTrends: [],
    monthlyData: [],
    loading: true
  });
  const { user } = useAuth();

  // Helper pour vérifier si une habitude est applicable un jour donné
  const isHabitApplicableOnDate = useCallback((habit: {
    frequency: HabitFrequency;
    targetDays?: number[];
    isLocked?: boolean;
    isChallenge?: boolean;
    challengeEndDate?: Date;
  }, date: Date): boolean => {
    if (habit.isLocked) return false;
    
    if (habit.isChallenge && habit.challengeEndDate) {
      if (date > new Date(habit.challengeEndDate)) return false;
    }
    
    if (habit.frequency === 'daily' || habit.frequency === 'x-times-per-week' || habit.frequency === 'x-times-per-month') {
      return true;
    }
    
    if ((habit.frequency === 'weekly' || habit.frequency === 'custom') && habit.targetDays) {
      const dayOfWeek = getDay(date);
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return habit.targetDays.includes(adjustedDay);
    }
    
    if (habit.frequency === 'monthly' && habit.targetDays) {
      const dayOfMonth = getDate(date);
      return habit.targetDays.includes(dayOfMonth);
    }
    
    return true;
  }, []);

  const calculateStats = useCallback(async () => {
    if (!user) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Récupérer tous les events de type habit avec leurs détails
      const { data: habitEvents, error: eventsError } = await supabase
        .from('time_events')
        .select('id, entity_id, recurrence')
        .eq('entity_type', 'habit')
        .eq('user_id', user.id);

      if (eventsError) throw eventsError;

      if (!habitEvents || habitEvents.length === 0) {
        setStats({
          bestCurrentStreak: 0,
          longestStreak: 0,
          weeklyCompletions: 0,
          overallCompletionRate: 0,
          totalHabits: 0,
          dailyTrends: [],
          monthlyData: [],
          loading: false
        });
        return;
      }

      // Récupérer les données complètes des habitudes depuis la table habits
      const { data: habitsData } = await supabase
        .from('habits')
        .select('id, frequency, target_days, is_active')
        .eq('user_id', user.id);

      // Créer une map des habitudes pour accès rapide
      const habitsMap = new Map<string, Habit>();
      (habitsData || []).forEach(h => {
        habitsMap.set(h.id, {
          id: h.id,
          frequency: h.frequency as HabitFrequency,
          targetDays: h.target_days,
          isActive: h.is_active ?? true
        } as Habit);
      });

      const eventIds = habitEvents.map(e => e.id);
      const today = new Date();
      const thirtyFiveDaysAgo = subDays(today, 35);
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });

      // Récupérer toutes les occurrences complétées
      const { data: occurrences, error: occError } = await supabase
        .from('time_occurrences')
        .select('event_id, starts_at, status')
        .in('event_id', eventIds)
        .eq('user_id', user.id)
        .gte('starts_at', thirtyFiveDaysAgo.toISOString())
        .order('starts_at', { ascending: false });

      if (occError) throw occError;

      // Comptage des complétions cette semaine
      const weeklyCompletions = (occurrences || []).filter(o => 
        o.status === 'completed' && new Date(o.starts_at) >= weekStart
      ).length;

      // Calcul du taux de réussite sur 30 jours en tenant compte de la récurrence réelle
      let expectedCompletions = 0;
      for (let i = 0; i < 30; i++) {
        const date = subDays(today, i);
        for (const event of habitEvents) {
          const habit = habitsMap.get(event.entity_id);
          if (habit && habit.isActive && isHabitApplicableOnDate(habit, date)) {
            expectedCompletions++;
          }
        }
      }

      const completedCount = (occurrences || []).filter(o => o.status === 'completed').length;
      const overallCompletionRate = expectedCompletions > 0 
        ? Math.min(100, Math.round((completedCount / expectedCompletions) * 100))
        : 0;

      // Calcul des streaks par habitude
      let bestCurrentStreak = 0;
      let longestStreak = 0;

      for (const event of habitEvents) {
        const habitOccurrences = (occurrences || [])
          .filter(o => o.event_id === event.id && o.status === 'completed')
          .map(o => format(new Date(o.starts_at), 'yyyy-MM-dd'))
          .sort((a, b) => b.localeCompare(a));

        // Streak actuel
        let currentStreak = 0;
        for (let i = 0; i < habitOccurrences.length; i++) {
          const expectedDate = format(subDays(today, i), 'yyyy-MM-dd');
          if (habitOccurrences[i] === expectedDate) {
            currentStreak++;
          } else {
            break;
          }
        }

        // Streak le plus long
        let tempStreak = 0;
        let maxStreak = 0;
        const sortedDates = [...habitOccurrences].sort();
        
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffTime = currDate.getTime() - prevDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          maxStreak = Math.max(maxStreak, tempStreak);
        }

        bestCurrentStreak = Math.max(bestCurrentStreak, currentStreak);
        longestStreak = Math.max(longestStreak, maxStreak);
      }

      // Calcul des tendances quotidiennes sur 7 jours avec récurrence correcte
      const dailyTrends: DailyTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'EEE', { locale: fr });
        
        const dayCompletions = (occurrences || []).filter(o => 
          o.status === 'completed' && format(new Date(o.starts_at), 'yyyy-MM-dd') === dateStr
        ).length;
        
        // Compter combien d'habitudes étaient applicables ce jour
        let applicableCount = 0;
        for (const event of habitEvents) {
          const habit = habitsMap.get(event.entity_id);
          if (habit && habit.isActive && isHabitApplicableOnDate(habit, date)) {
            applicableCount++;
          }
        }
        
        const rate = applicableCount > 0 
          ? Math.round((dayCompletions / applicableCount) * 100) 
          : 0;
        
        dailyTrends.push({
          date: dateStr,
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          completions: dayCompletions,
          total: applicableCount,
          rate
        });
      }

      // Calcul des données mensuelles pour le heatmap (35 jours) avec récurrence correcte
      const monthlyData: MonthlyDay[] = [];
      for (let i = 34; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const dayCompletions = (occurrences || []).filter(o => 
          o.status === 'completed' && format(new Date(o.starts_at), 'yyyy-MM-dd') === dateStr
        ).length;
        
        // Compter combien d'habitudes étaient applicables ce jour
        let applicableCount = 0;
        for (const event of habitEvents) {
          const habit = habitsMap.get(event.entity_id);
          if (habit && habit.isActive && isHabitApplicableOnDate(habit, date)) {
            applicableCount++;
          }
        }
        
        const rate = applicableCount > 0 
          ? Math.round((dayCompletions / applicableCount) * 100) 
          : 0;
        
        monthlyData.push({
          date: dateStr,
          count: dayCompletions,
          total: applicableCount,
          rate
        });
      }

      setStats({
        bestCurrentStreak,
        longestStreak,
        weeklyCompletions,
        overallCompletionRate,
        totalHabits: habitEvents.length,
        dailyTrends,
        monthlyData,
        loading: false
      });
    } catch (error) {
      console.error('Error calculating habit stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [user, isHabitApplicableOnDate]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return { ...stats, refresh: calculateStats };
};
