import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const HabitsSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Rappels"
        description="Configurez les rappels pour vos habitudes"
      >
        <SettingsToggle
          id="habitDailyReminders"
          label="Rappels quotidiens"
          description="Recevoir un rappel chaque jour pour les habitudes"
          checked={preferences.habitDailyReminders}
          onCheckedChange={(checked) => updatePreferences({ habitDailyReminders: checked })}
        />
        
        {preferences.habitDailyReminders && (
          <div className="space-y-2 pl-4">
            <Label>Heure du rappel</Label>
            <Input
              type="time"
              value={preferences.habitReminderTime}
              onChange={(e) => updatePreferences({ habitReminderTime: e.target.value })}
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Paramètres par défaut"
        description="Valeurs par défaut pour les nouvelles habitudes"
      >
        <div className="space-y-2">
          <Label>Fréquence par défaut</Label>
          <Select 
            value={preferences.habitDefaultFrequency} 
            onValueChange={(value: 'daily' | 'weekly') => 
              updatePreferences({ habitDefaultFrequency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Mode strict"
        description="Options avancées pour le suivi des habitudes"
      >
        <SettingsToggle
          id="habitStrictMode"
          label="Mode strict"
          description="Empêche de compléter une habitude en avance"
          checked={preferences.habitStrictMode}
          onCheckedChange={(checked) => updatePreferences({ habitStrictMode: checked })}
        />
      </SettingsSection>
    </div>
  );
};
