import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

/**
 * Détecte les nouvelles app_updates non vues par l'utilisateur,
 * les injecte comme notifications de type "update", puis les marque comme vues.
 * Appelé une seule fois au montage.
 */
export const useAppUpdates = () => {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    const syncUpdates = async () => {
      try {
        // 1. Get IDs already seen by this user
        const { data: seenRows } = await supabase
          .from('user_seen_updates')
          .select('update_id')
          .eq('user_id', user.id);

        const seenIds = (seenRows ?? []).map(r => (r as any).update_id as string);

        // 2. Fetch all app updates
        const { data: allUpdates } = await supabase
          .from('app_updates')
          .select('*')
          .order('created_at', { ascending: false });

        if (!allUpdates || allUpdates.length === 0) return;

        // 3. Filter unseen
        const unseen = (allUpdates as any[]).filter(u => !seenIds.includes(u.id));
        if (unseen.length === 0) return;

        logger.info('New app updates detected', { count: unseen.length });

        // 4. For each unseen: insert notification + mark seen
        for (const update of unseen) {
          const typeEmoji = update.update_type === 'fix' ? '🔧' : update.update_type === 'improvement' ? '⚡' : '✨';

          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'update',
            title: `${typeEmoji} ${update.title}`,
            message: update.message ?? null,
            metadata: { updateId: update.id, version: update.version, updateType: update.update_type },
          });

          await supabase.from('user_seen_updates').insert({
            user_id: user.id,
            update_id: update.id,
          } as any);
        }
      } catch (err) {
        logger.error('Failed to sync app updates', {}, err as Error);
      }
    };

    syncUpdates();
  }, [user]);
};
