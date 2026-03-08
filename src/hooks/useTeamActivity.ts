import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamActivityEntry {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  metadata: Record<string, string>;
  created_at: string;
}

export const useTeamActivity = (teamId: string | null) => {
  const [activities, setActivities] = useState<TeamActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    if (!teamId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_activity_log' as any)
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      setActivities((data || []) as unknown as TeamActivityEntry[]);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadActivities();

    if (!teamId) return;

    const channel = supabase
      .channel(`team-activity-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_activity_log',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, loadActivities]);

  return { activities, loading };
};
