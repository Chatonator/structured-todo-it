/**
 * useDayPlanning - Hook for managing daily planning quotas
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';
import { DayPlanningConfig } from '@/lib/time/types';
import { logger } from '@/lib/logger';
import { format, startOfWeek, addDays } from 'date-fns';

interface DayPlanningRow {
  id: string;
  user_id: string;
  date: string;
  quota_minutes: number;
  created_at: string;
  updated_at: string;
}

export const useDayPlanning = () => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [configs, setConfigs] = useState<Map<string, DayPlanningConfig>>(new Map());
  const [loading, setLoading] = useState(false);

  // Use user preference as default, fallback to 240 (4h)
  const defaultQuota = preferences.timelineDefaultQuota || 240;

  // Load configs for a date range
  const loadConfigs = useCallback(async (startDate: Date, endDate: Date) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('day_planning_config')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const newConfigs = new Map<string, DayPlanningConfig>();
      (data || []).forEach((row: DayPlanningRow) => {
        const dateKey = row.date;
        newConfigs.set(dateKey, {
          id: row.id,
          userId: row.user_id,
          date: new Date(row.date),
          quotaMinutes: row.quota_minutes,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        });
      });

      setConfigs(newConfigs);
    } catch (error: any) {
      logger.error('Failed to load day planning configs', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get quota for a specific date
  const getQuotaForDate = useCallback((date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const config = configs.get(dateKey);
    return config?.quotaMinutes ?? defaultQuota;
  }, [configs]);

  // Set quota for a specific date
  const setQuotaForDate = useCallback(async (date: Date, minutes: number): Promise<boolean> => {
    if (!user) return false;

    const dateKey = format(date, 'yyyy-MM-dd');
    const existingConfig = configs.get(dateKey);

    try {
      if (existingConfig) {
        // Update existing
        const { error } = await supabase
          .from('day_planning_config')
          .update({ quota_minutes: minutes })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('day_planning_config')
          .insert({
            user_id: user.id,
            date: dateKey,
            quota_minutes: minutes
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state
        if (data) {
          const row = data as DayPlanningRow;
          setConfigs(prev => {
            const newConfigs = new Map(prev);
            newConfigs.set(dateKey, {
              id: row.id,
              userId: row.user_id,
              date: new Date(row.date),
              quotaMinutes: row.quota_minutes,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at)
            });
            return newConfigs;
          });
        }
      }

      // Update local state for existing config
      if (existingConfig) {
        setConfigs(prev => {
          const newConfigs = new Map(prev);
          newConfigs.set(dateKey, { ...existingConfig, quotaMinutes: minutes });
          return newConfigs;
        });
      }

      logger.debug('Quota updated', { date: dateKey, minutes });
      return true;
    } catch (error: any) {
      logger.error('Failed to set quota', { error: error.message, date: dateKey });
      return false;
    }
  }, [user, configs]);

  // Get weekly quotas (for week view)
  const getWeeklyQuotas = useCallback((startDate: Date): number[] => {
    const quotas: number[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      quotas.push(getQuotaForDate(day));
    }
    return quotas;
  }, [getQuotaForDate]);

  // Calculate total quota for a date range
  const getTotalQuota = useCallback((dates: Date[]): number => {
    return dates.reduce((sum, date) => sum + getQuotaForDate(date), 0);
  }, [getQuotaForDate]);

  return {
    loading,
    getQuotaForDate,
    setQuotaForDate,
    getWeeklyQuotas,
    getTotalQuota,
    loadConfigs,
    defaultQuota
  };
};
