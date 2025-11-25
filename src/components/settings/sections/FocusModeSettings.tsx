import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const FocusModeSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  const durationOptions = [
    { value: 25, label: '25 minutes (Pomodoro)' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '60 minutes' },
    { value: 0, label: 'Personnalisé' },
  ];

  const isCustomDuration = ![25, 45, 60].includes(preferences.focusDuration);

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Mode Focus"
        description="Configurez le mode anti-distraction"
      >
        <SettingsToggle
          id="focusModeEnabled"
          label="Activer le mode Focus"
          description="Active le mode concentration pour minimiser les distractions"
          checked={preferences.focusModeEnabled}
          onCheckedChange={(checked) => updatePreferences({ focusModeEnabled: checked })}
        />
      </SettingsSection>

      {preferences.focusModeEnabled && (
        <>
          <SettingsSection
            title="Durée"
            description="Définissez la durée des sessions de focus"
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Durée de la session</Label>
                <Select 
                  value={isCustomDuration ? '0' : preferences.focusDuration.toString()} 
                  onValueChange={(value) => {
                    const duration = parseInt(value);
                    if (duration !== 0) {
                      updatePreferences({ focusDuration: duration });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isCustomDuration && (
                <div className="space-y-2">
                  <Label>Durée personnalisée (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={preferences.focusDuration}
                    onChange={(e) => updatePreferences({ 
                      focusDuration: parseInt(e.target.value) || 25 
                    })}
                  />
                </div>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Éléments masqués"
            description="Choisissez ce qui sera masqué pendant le mode Focus"
          >
            <SettingsToggle
              id="focusHideNotifications"
              label="Masquer les notifications"
              description="Désactive les notifications pendant le mode Focus"
              checked={preferences.focusHideNotifications}
              onCheckedChange={(checked) => 
                updatePreferences({ focusHideNotifications: checked })
              }
            />
            <SettingsToggle
              id="focusHideGamification"
              label="Masquer la gamification"
              description="Cache les éléments de gamification (XP, niveaux, défis)"
              checked={preferences.focusHideGamification}
              onCheckedChange={(checked) => 
                updatePreferences({ focusHideGamification: checked })
              }
            />
            <SettingsToggle
              id="focusHideOtherViews"
              label="Masquer les autres vues"
              description="Limite l'accès aux vues autres que les tâches"
              checked={preferences.focusHideOtherViews}
              onCheckedChange={(checked) => 
                updatePreferences({ focusHideOtherViews: checked })
              }
            />
          </SettingsSection>
        </>
      )}
    </div>
  );
};
