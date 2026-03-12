import React, { useEffect, useMemo, useState } from 'react';
import { CalendarSync, RefreshCcw, Link2Off, ExternalLink, Clock3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsSection } from '../common/SettingsSection';
import { useExternalCalendars, type ExternalProviderCalendar } from '@/hooks/useExternalCalendars';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ExternalCalendarSettings: React.FC = () => {
  const {
    status,
    loading,
    busyAction,
    connectOutlook,
    listCalendars,
    saveTargetCalendar,
    disconnectProvider,
    resyncProvider,
  } = useExternalCalendars();
  const [outlookCalendars, setOutlookCalendars] = useState<ExternalProviderCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const outlook = status?.providers.outlook;

  useEffect(() => {
    if (!outlook?.connected) {
      setOutlookCalendars([]);
      setSelectedCalendarId('');
      return;
    }

    void (async () => {
      try {
        const calendars = await listCalendars('outlook');
        setOutlookCalendars(calendars);
        setSelectedCalendarId(outlook.targetCalendarId || calendars[0]?.id || '');
      } catch {
        setOutlookCalendars([]);
      }
    })();
  }, [listCalendars, outlook?.connected, outlook?.targetCalendarId]);

  const selectedCalendar = useMemo(
    () => outlookCalendars.find((calendar) => calendar.id === selectedCalendarId) || null,
    [outlookCalendars, selectedCalendarId],
  );

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Agendas externes"
        description="Synchronisez vos événements planifiés vers un vrai agenda. Outlook est actif maintenant, Google est prêt pour la suite."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarSync className="h-5 w-5 text-primary" />
                Outlook
              </CardTitle>
              <CardDescription>
                {outlook?.connected
                  ? 'Vos time_events planifiés partent vers le calendrier Outlook choisi.'
                  : 'Connectez votre compte Microsoft pour envoyer la Timeline vers Outlook.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement du statut…</p>
              ) : (
                <>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">Statut</span>
                      <span className={outlook?.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                        {outlook?.connected ? 'Connecté' : 'Non connecté'}
                      </span>
                    </div>
                    {outlook?.accountEmail && <p className="mt-2 text-muted-foreground">Compte : {outlook.accountEmail}</p>}
                    {outlook?.targetCalendarName && <p className="mt-1 text-muted-foreground">Calendrier cible : {outlook.targetCalendarName}</p>}
                    {outlook?.lastSyncedAt && (
                      <p className="mt-1 text-muted-foreground">
                        Dernière synchro {formatDistanceToNow(new Date(outlook.lastSyncedAt), { addSuffix: true, locale: fr })}
                      </p>
                    )}
                    {outlook?.lastSyncError && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="text-sm">{outlook.lastSyncError}</span>
                      </div>
                    )}
                  </div>

                  {outlook?.connected ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Calendrier Outlook cible</label>
                        <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un calendrier" />
                          </SelectTrigger>
                          <SelectContent>
                            {outlookCalendars.map((calendar) => (
                              <SelectItem key={calendar.id} value={calendar.id}>
                                {calendar.name}{calendar.isDefault ? ' • Principal' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => selectedCalendar && saveTargetCalendar('outlook', selectedCalendar)}
                          disabled={!selectedCalendar || busyAction === 'save-outlook'}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Choisir ce calendrier
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => resyncProvider('outlook')}
                          disabled={busyAction === 'resync-outlook'}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Resynchroniser
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => disconnectProvider('outlook')}
                          disabled={busyAction === 'disconnect-outlook'}
                        >
                          <Link2Off className="mr-2 h-4 w-4" />
                          Déconnecter
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={connectOutlook} disabled={busyAction === 'connect-outlook'}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Connecter Outlook
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed border-border/70 opacity-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock3 className="h-5 w-5 text-muted-foreground" />
                Google Calendar
              </CardTitle>
              <CardDescription>
                Le socle est prêt, mais le connecteur Google n est pas encore activé dans cette version.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                La structure backend est déjà pensée pour accueillir Google plus tard, sans refaire toute l intégration.
              </div>
            </CardContent>
          </Card>
        </div>
      </SettingsSection>
    </div>
  );
};
