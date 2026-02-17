import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const GamificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Affichage"
        description="Personnalisez l'affichage des éléments de gamification"
      >
        <SettingsToggle
          id="showStreaks"
          label="Afficher les séries"
          description="Afficher le compteur de streak dans l'interface"
          checked={preferences.showStreaks}
          onCheckedChange={(checked) => updatePreferences({ showStreaks: checked })}
        />
      </SettingsSection>
    </div>
  );
};
