import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { SoundType } from '@/types/preferences';

export const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Notifications"
        description="Gérez vos préférences de notifications"
      >
        <SettingsToggle
          id="pushNotifications"
          label="Notifications push"
          description="Recevez des notifications pour les tâches importantes"
          checked={preferences.pushNotifications}
          onCheckedChange={(checked) => updatePreferences({ pushNotifications: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title="Sons et vibrations"
        description="Personnalisez les retours sonores et haptiques"
      >
        <SettingsToggle
          id="soundEffects"
          label="Sons courts"
          description="Jouer des sons lors des actions (complétion de tâche, etc.)"
          checked={preferences.soundEffects}
          onCheckedChange={(checked) => updatePreferences({ soundEffects: checked })}
        />
        
        {preferences.soundEffects && (
          <div className="space-y-2 pl-4">
            <Label>Type de son</Label>
            <Select 
              value={preferences.soundType} 
              onValueChange={(value) => updatePreferences({ soundType: value as SoundType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discrete">Discret</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="fun">Amusant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <SettingsToggle
          id="vibrations"
          label="Vibrations"
          description="Activer les vibrations sur mobile"
          checked={preferences.vibrations}
          onCheckedChange={(checked) => updatePreferences({ vibrations: checked })}
        />
      </SettingsSection>
    </div>
  );
};
