import React from 'react';
import { AlertTriangle, BellRing, Pin, Sparkles } from 'lucide-react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StaleTaskRuleSettings, TaskRuleAutoAction } from '@/types/taskRules';
import { getTaskRuleAutoActionLabel } from '@/lib/task-rules/engine';

const AUTO_ACTION_OPTIONS: Array<{ value: TaskRuleAutoAction; label: string }> = [
  { value: 'none', label: 'Aucune action automatique' },
  { value: 'pin', label: 'Épingler la tâche' },
  { value: 'mark-important', label: 'La marquer importante' },
  { value: 'mark-urgent', label: 'La marquer urgente' },
  { value: 'make-obligation', label: 'La faire passer en obligation' },
];

const clampNumber = (value: number, fallback: number, max: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.round(value)));
};

export const TaskRulesSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  const staleTask = preferences.taskRules.staleTask;

  const updateStaleTaskRule = (updates: Partial<StaleTaskRuleSettings>) => {
    updatePreferences({
      taskRules: {
        ...preferences.taskRules,
        staleTask: {
          ...staleTask,
          ...updates,
        },
      },
    });
  };

  const handleNumberChange = (
    field: keyof Pick<StaleTaskRuleSettings, 'firstAlertAfterDays' | 'repeatEveryDays' | 'autoActionAfterAlerts'>,
    value: string,
  ) => {
    const fallback = staleTask[field] as number;
    const nextValue = clampNumber(Number(value), fallback, field === 'autoActionAfterAlerts' ? 20 : 365);
    updateStaleTaskRule({ [field]: nextValue });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Règles automatiques"
        description="Déclenchez des alertes quand une tâche reste ouverte trop longtemps, puis appliquez une action automatique si besoin."
      >
        <SettingsToggle
          id="staleTaskRuleEnabled"
          label="Surveiller les tâches non complétées"
          description="Les tâches personnelles, sous-tâches et tâches de projet peuvent déclencher une alerte après un certain délai."
          checked={staleTask.enabled}
          onCheckedChange={(checked) => updateStaleTaskRule({ enabled: checked })}
        />

        {staleTask.enabled && (
          <div className="space-y-5 rounded-xl border border-border/70 bg-card/70 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstAlertAfterDays">Première alerte après</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="firstAlertAfterDays"
                    type="number"
                    min={1}
                    max={365}
                    value={staleTask.firstAlertAfterDays}
                    onChange={(event) => handleNumberChange('firstAlertAfterDays', event.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeatEveryDays">Relancer tous les</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="repeatEveryDays"
                    type="number"
                    min={1}
                    max={365}
                    value={staleTask.repeatEveryDays}
                    onChange={(event) => handleNumberChange('repeatEveryDays', event.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoActionAfterAlerts">Action automatique après</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="autoActionAfterAlerts"
                    type="number"
                    min={1}
                    max={20}
                    value={staleTask.autoActionAfterAlerts}
                    onChange={(event) => handleNumberChange('autoActionAfterAlerts', event.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">alertes</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Action automatique</Label>
                <Select
                  value={staleTask.autoAction}
                  onValueChange={(value) => updateStaleTaskRule({ autoAction: value as TaskRuleAutoAction })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTO_ACTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium">Exemple de fonctionnement</p>
                  <p>
                    Une tâche non terminée déclenchera une première alerte après <strong>{staleTask.firstAlertAfterDays} jours</strong>,
                    puis une nouvelle alerte tous les <strong>{staleTask.repeatEveryDays} jours</strong>.
                  </p>
                  <p>
                    À la <strong>{staleTask.autoActionAfterAlerts}e alerte</strong>, le système pourra <strong>{getTaskRuleAutoActionLabel(staleTask.autoAction)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Conseils"
        description="Une base simple pour commencer, puis vous pourrez ajouter d autres règles ensuite."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Premier rappel
            </div>
            <p className="text-sm text-muted-foreground">7 jours est un bon point de départ pour les tâches qui traînent sans être oubliées trop vite.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Pin className="h-4 w-4 text-primary" />
              Action prudente
            </div>
            <p className="text-sm text-muted-foreground">Épingler la tâche est l action automatique la plus sûre pour une première version.</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Évolution future
            </div>
            <p className="text-sm text-muted-foreground">La base est prévue pour accueillir plus tard d autres règles, comme la replanification ou l escalade.</p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};
