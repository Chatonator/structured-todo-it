/**
 * TimelineSyncButton - Bouton pour synchroniser les données vers time_events
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export const TimelineSyncButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      logger.info('Starting time-sync edge function');
      
      const { data, error } = await supabase.functions.invoke('time-sync', {
        method: 'POST'
      });

      if (error) throw error;

      logger.info('Time sync completed', { result: data });
      
      toast({
        title: "Synchronisation réussie",
        description: `${data.syncedTasks || 0} tâches et ${data.syncedHabits || 0} habitudes synchronisées.`,
        duration: 5000,
      });
    } catch (error: any) {
      logger.error('Time sync failed', { error: error.message });
      
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser les données.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {syncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Synchronisation...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          Synchroniser
        </>
      )}
    </Button>
  );
};
