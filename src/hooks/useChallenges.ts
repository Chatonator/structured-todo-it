import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserChallenge } from '@/types/gamification';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useTimeEventSync } from './useTimeEventSync';

export const useChallenges = () => {
  const [dailyChallenges, setDailyChallenges] = useState<UserChallenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { syncChallengeEvent, updateEventStatus, deleteEntityEvent } = useTimeEventSync();

  const formatUserChallenge = (data: any): UserChallenge => ({
    id: data.id,
    userId: data.user_id,
    challengeId: data.challenge_id,
    challenge: data.challenge ? {
      id: data.challenge.id,
      type: data.challenge.type as any,
      category: data.challenge.category as any,
      name: data.challenge.name,
      description: data.challenge.description,
      icon: data.challenge.icon,
      targetType: data.challenge.target_type,
      targetValue: data.challenge.target_value,
      xpReward: data.challenge.xp_reward,
      pointsReward: data.challenge.points_reward,
      requiredLevel: data.challenge.required_level,
      weight: data.challenge.weight,
      createdAt: new Date(data.challenge.created_at)
    } : undefined,
    currentProgress: data.current_progress,
    isCompleted: data.is_completed,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    assignedDate: data.assigned_date,
    expiresAt: data.expires_at,
    createdAt: new Date(data.created_at)
  });

  const loadChallenges = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:challenges(*)
        `)
        .eq('user_id', user.id)
        .gte('expires_at', today)
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(formatUserChallenge);
      
      setDailyChallenges(formatted.filter(c => c.challenge?.type === 'daily'));
      setWeeklyChallenges(formatted.filter(c => c.challenge?.type === 'weekly'));
    } catch (error: any) {
      logger.error('Failed to load challenges', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateChallengeProgress = useCallback(async (
    challengeId: string,
    progressIncrement: number = 1
  ) => {
    if (!user) return false;

    try {
      const challenge = [...dailyChallenges, ...weeklyChallenges].find(c => c.challengeId === challengeId);
      if (!challenge) return false;

      const newProgress = challenge.currentProgress + progressIncrement;
      const isCompleted = newProgress >= (challenge.challenge?.targetValue || 0);

      await supabase
        .from('user_challenges')
        .update({
          current_progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', challenge.id);

      // Mettre à jour le time_event associé
      if (isCompleted) {
        await updateEventStatus('challenge', challenge.id, 'completed');
        
        toast({
          title: `✅ Défi complété !`,
          description: challenge.challenge?.name,
          duration: 4000
        });

        await supabase
          .from('xp_transactions')
          .insert({
            user_id: user.id,
            source_type: 'challenge',
            source_id: challenge.challengeId,
            xp_gained: challenge.challenge?.xpReward || 0,
            points_gained: challenge.challenge?.pointsReward || 0,
            description: `Défi complété: ${challenge.challenge?.name}`
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
              total_xp: progress.total_xp + (challenge.challenge?.xpReward || 0),
              current_points: progress.current_points + (challenge.challenge?.pointsReward || 0),
              lifetime_points: progress.lifetime_points + (challenge.challenge?.pointsReward || 0)
            })
            .eq('user_id', user.id);
        }
      }

      await loadChallenges();
      return true;
    } catch (error: any) {
      logger.error('Failed to update challenge progress', { error: error.message });
      return false;
    }
  }, [user, dailyChallenges, weeklyChallenges, loadChallenges, toast, updateEventStatus]);

  const assignDailyChallenges = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: existing } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('assigned_date', today);

      if (existing && existing.length > 0) return;

      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('current_level')
        .eq('user_id', user.id)
        .single();

      const userLevel = userProgress?.current_level || 1;

      const { data: availableChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('type', 'daily')
        .lte('required_level', userLevel);

      if (!availableChallenges || availableChallenges.length === 0) return;

      const selected = selectRandomChallenges(availableChallenges, 2);

      const assignments = selected.map(c => ({
        user_id: user.id,
        challenge_id: c.id,
        assigned_date: today,
        expires_at: today
      }));

      const { data: insertedChallenges } = await supabase
        .from('user_challenges')
        .insert(assignments)
        .select();

      // Créer des time_events pour chaque défi assigné
      if (insertedChallenges) {
        for (const inserted of insertedChallenges) {
          const challengeInfo = selected.find(c => c.id === inserted.challenge_id);
          if (challengeInfo) {
            await syncChallengeEvent({
              id: inserted.id,
              name: challengeInfo.name,
              description: challengeInfo.description,
              type: challengeInfo.type,
              assignedDate: inserted.assigned_date,
              expiresAt: inserted.expires_at
            });
          }
        }
      }

      await loadChallenges();
    } catch (error: any) {
      logger.error('Failed to assign daily challenges', { error: error.message });
    }
  }, [user, loadChallenges, syncChallengeEvent]);

  const selectRandomChallenges = (challenges: any[], count: number) => {
    const selected: any[] = [];
    const remaining = [...challenges];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      const currentTotal = remaining.reduce((sum, c) => sum + c.weight, 0);
      let random = Math.random() * currentTotal;
      let chosenIndex = 0;

      for (let j = 0; j < remaining.length; j++) {
        random -= remaining[j].weight;
        if (random <= 0) {
          chosenIndex = j;
          break;
        }
      }

      selected.push(remaining[chosenIndex]);
      remaining.splice(chosenIndex, 1);
    }

    return selected;
  };

  useEffect(() => {
    loadChallenges();
    assignDailyChallenges();
  }, [loadChallenges, assignDailyChallenges]);

  return {
    dailyChallenges,
    weeklyChallenges,
    loading,
    updateChallengeProgress,
    reloadChallenges: loadChallenges
  };
};
