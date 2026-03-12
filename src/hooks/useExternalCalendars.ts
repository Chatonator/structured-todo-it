import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExternalCalendarConnection {
  provider: 'outlook' | 'google';
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  connected: boolean;
  available: boolean;
  accountEmail: string | null;
  accountLabel: string | null;
  targetCalendarId: string | null;
  targetCalendarName: string | null;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  scopes: string[];
}

export interface ExternalProviderCalendar {
  id: string;
  name: string;
  isDefault: boolean;
  canEdit: boolean;
  color: string | null;
}

interface CalendarStatusResponse {
  providers: {
    outlook: ExternalCalendarConnection;
    google: ExternalCalendarConnection;
  };
}

function clearCalendarCallbackParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('calendar_provider');
  url.searchParams.delete('calendar_status');
  url.searchParams.delete('calendar_message');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export function useExternalCalendars() {
  const { toast } = useToast();
  const [status, setStatus] = useState<CalendarStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-status');
      if (error) throw error;
      setStatus((data as CalendarStatusResponse) || null);
    } catch (caughtError) {
      toast({
        title: 'Agendas externes',
        description: caughtError instanceof Error ? caughtError.message : 'Impossible de charger le statut agenda',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const provider = url.searchParams.get('calendar_provider');
    const callbackStatus = url.searchParams.get('calendar_status');
    const message = url.searchParams.get('calendar_message');

    if (!provider || !callbackStatus) {
      return;
    }

    if (callbackStatus === 'connected') {
      toast({
        title: `${provider === 'outlook' ? 'Outlook' : provider} connecté`,
        description: message || 'La connexion agenda est prête et la première synchronisation est lancée.',
      });
    } else {
      toast({
        title: 'Connexion agenda impossible',
        description: message || 'Le fournisseur n a pas pu finaliser la connexion.',
        variant: 'destructive',
      });
    }

    clearCalendarCallbackParams();
    void loadStatus();
  }, [loadStatus, toast]);

  const connectOutlook = useCallback(async () => {
    setBusyAction('connect-outlook');
    try {
      const { data, error } = await supabase.functions.invoke('calendar-connect-start', {
        body: {
          provider: 'outlook',
          redirectAfter: window.location.href,
        },
      });

      if (error) throw error;
      if (!data?.url) {
        throw new Error('URL de connexion Outlook manquante');
      }

      window.location.href = data.url;
    } catch (caughtError) {
      toast({
        title: 'Connexion Outlook impossible',
        description: caughtError instanceof Error ? caughtError.message : 'Erreur inconnue',
        variant: 'destructive',
      });
      setBusyAction(null);
    }
  }, [toast]);

  const listCalendars = useCallback(async (provider: 'outlook' | 'google' = 'outlook') => {
    const { data, error } = await supabase.functions.invoke('calendar-list-calendars', {
      body: { provider },
    });

    if (error) {
      throw error;
    }

    return (data?.calendars || []) as ExternalProviderCalendar[];
  }, []);

  const saveTargetCalendar = useCallback(async (provider: 'outlook' | 'google', calendar: ExternalProviderCalendar) => {
    setBusyAction(`save-${provider}`);
    try {
      const { error } = await supabase.functions.invoke('calendar-save-target', {
        body: {
          provider,
          calendarId: calendar.id,
          calendarName: calendar.name,
        },
      });
      if (error) throw error;

      const { error: resyncError } = await supabase.functions.invoke('calendar-resync', {
        body: { provider },
      });
      if (resyncError) throw resyncError;

      await loadStatus();
      toast({
        title: 'Calendrier cible mis à jour',
        description: `Les prochains événements seront envoyés vers ${calendar.name}.`,
      });
    } catch (caughtError) {
      toast({
        title: 'Impossible de changer le calendrier cible',
        description: caughtError instanceof Error ? caughtError.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }, [loadStatus, toast]);

  const disconnectProvider = useCallback(async (provider: 'outlook' | 'google' = 'outlook') => {
    setBusyAction(`disconnect-${provider}`);
    try {
      const { error } = await supabase.functions.invoke('calendar-disconnect', {
        body: { provider },
      });
      if (error) throw error;
      await loadStatus();
      toast({
        title: 'Agenda déconnecté',
        description: 'La synchronisation a été coupée.',
      });
    } catch (caughtError) {
      toast({
        title: 'Déconnexion impossible',
        description: caughtError instanceof Error ? caughtError.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }, [loadStatus, toast]);

  const resyncProvider = useCallback(async (provider: 'outlook' | 'google' = 'outlook') => {
    setBusyAction(`resync-${provider}`);
    try {
      const { error } = await supabase.functions.invoke('calendar-resync', {
        body: { provider },
      });
      if (error) throw error;
      await loadStatus();
      toast({
        title: 'Resynchronisation lancée',
        description: 'La file de synchronisation agenda a été rejouée.',
      });
    } catch (caughtError) {
      toast({
        title: 'Resynchronisation impossible',
        description: caughtError instanceof Error ? caughtError.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }, [loadStatus, toast]);

  return {
    status,
    loading,
    busyAction,
    loadStatus,
    connectOutlook,
    listCalendars,
    saveTargetCalendar,
    disconnectProvider,
    resyncProvider,
  };
}
