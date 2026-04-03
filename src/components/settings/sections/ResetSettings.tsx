import React, { useEffect, useMemo, useState } from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ResetSettingsProps {
  onResetHistory?: () => Promise<void> | void;
  isResetHistoryLoading?: boolean;
}

const getLocalToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const ResetSettings: React.FC<ResetSettingsProps> = ({
  onResetHistory,
  isResetHistoryLoading = false,
}) => {
  const { resetPreferences, resetInterfacePreferences } = useUserPreferences();
  const { toast } = useToast();
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyConfirmation, setHistoryConfirmation] = useState('');
  const [internalResetLoading, setInternalResetLoading] = useState(false);

  const normalizedConfirmation = useMemo(
    () => historyConfirmation.trim().toUpperCase(),
    [historyConfirmation]
  );
  const canConfirmHistoryReset = normalizedConfirmation === 'REPARTIR';
  const historyResetLoading = isResetHistoryLoading || internalResetLoading;

  useEffect(() => {
    if (!historyDialogOpen) {
      setHistoryConfirmation('');
    }
  }, [historyDialogOpen]);

  const handleResetAll = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.')) {
      resetPreferences();
      toast({
        title: "Paramètres réinitialisés",
        description: "Tous vos paramètres ont été restaurés aux valeurs par défaut.",
      });
    }
  };

  const handleResetInterface = () => {
    if (confirm('Réinitialiser uniquement les paramètres d\'interface ?')) {
      resetInterfacePreferences();
      toast({
        title: "Interface réinitialisée",
        description: "Les paramètres d'interface ont été restaurés.",
      });
    }
  };

  const handleResetHistory = async () => {
    if (!canConfirmHistoryReset || historyResetLoading) return;

    try {
      setInternalResetLoading(true);
      if (onResetHistory) {
        await onResetHistory();
      } else {
        const { data, error } = await supabase.rpc('reset_account_history', {
          p_user_today: getLocalToday(),
        });

        if (error) {
          throw error;
        }

        await supabase.functions.invoke('calendar-resync', {
          body: { provider: 'outlook' },
        }).catch(() => undefined);

        const summary = (data ?? {}) as Record<string, unknown>;
        const deletedCompletedItems = Number(summary.deleted_completed_items ?? 0);
        const reopenedRecurringTasks = Number(summary.reopened_recurring_tasks ?? 0);

        toast({
          title: 'Historique réinitialisé',
          description: `${deletedCompletedItems} élément(s) passés effacés, ${reopenedRecurringTasks} tâche(s) récurrente(s) relancée(s).`,
        });

        window.setTimeout(() => {
          window.location.reload();
        }, 900);
      }

      setHistoryDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de réinitialiser l’historique.';
      toast({
        title: 'Échec de la réinitialisation',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setInternalResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Réinitialisation partielle"
        description="Réinitialisez uniquement certaines parties de vos paramètres"
      >
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleResetInterface}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser l'interface
        </Button>
      </SettingsSection>

      <SettingsSection
        title="Réinitialiser mon historique"
        description="Repartir aujourd’hui avec un historique personnel propre, sans supprimer les éléments encore actifs"
      >
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Action destructive
              </p>
              <p className="text-sm text-muted-foreground">
                Cette remise à zéro efface les traces du passé pour vos données personnelles, tout en conservant vos tâches, projets et habitudes encore actifs.
              </p>
            </div>
          </div>

          <AlertDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <RotateCcw className="mr-2 h-4 w-4" />
                Réinitialiser mon historique
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser l’historique du compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action repart de zéro pour votre historique personnel, comme si aujourd’hui était un nouveau départ.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3">
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground">
                  <p className="font-medium text-destructive">Effacé</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>XP, points, streaks et historique de récompenses</li>
                    <li>Tâches, projets et complétions déjà passés</li>
                    <li>Occurrences d’habitudes et anciens rappels</li>
                    <li>Notifications et traces visibles du passé</li>
                  </ul>
                </div>
                <div className="space-y-2 rounded-md border border-border bg-background p-3 text-sm text-foreground">
                  <p className="font-medium">Conservé</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Tâches, projets et habitudes encore actifs</li>
                    <li>Organisation actuelle et éléments en cours</li>
                    <li>Tâches récurrentes terminées, relancées pour aujourd’hui</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="history-reset-confirmation" className="text-sm font-medium">
                  Tapez <span className="font-mono text-destructive">REPARTIR</span> pour confirmer
                </label>
                <Input
                  id="history-reset-confirmation"
                  value={historyConfirmation}
                  onChange={(event) => setHistoryConfirmation(event.target.value)}
                  placeholder="REPARTIR"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={historyResetLoading}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    if (!canConfirmHistoryReset) {
                      event.preventDefault();
                      return;
                    }

                    event.preventDefault();
                    void handleResetHistory();
                  }}
                  disabled={!canConfirmHistoryReset || historyResetLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {historyResetLoading ? 'Réinitialisation...' : 'Réinitialiser maintenant'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Réinitialisation complète"
        description="Restaurez tous les paramètres aux valeurs par défaut"
      >
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Attention : Cette action est irréversible
              </p>
              <p className="text-sm text-muted-foreground">
                Tous vos paramètres personnalisés seront perdus et restaurés aux valeurs par défaut.
              </p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleResetAll}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser tous les paramètres
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
};
