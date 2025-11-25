import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const GamificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Notifications"
        description="Gérez les notifications de gamification"
      >
        <SettingsToggle
          id="levelNotifications"
          label="Notifications de niveau"
          description="Recevoir une notification lors d'un passage de niveau"
          checked={preferences.levelNotifications}
          onCheckedChange={(checked) => updatePreferences({ levelNotifications: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title="Affichage"
        description="Personnalisez l'affichage des éléments de gamification"
      >
        <SettingsToggle
          id="showXpInHeader"
          label="Afficher l'XP dans l'en-tête"
          description="Afficher la barre d'XP et le niveau dans l'en-tête"
          checked={preferences.showXpInHeader}
          onCheckedChange={(checked) => updatePreferences({ showXpInHeader: checked })}
        />
        <SettingsToggle
          id="showStreaks"
          label="Afficher les séries"
          description="Afficher les compteurs de séries (streaks)"
          checked={preferences.showStreaks}
          onCheckedChange={(checked) => updatePreferences({ showStreaks: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title="Défis"
        description="Configuration des défis quotidiens"
      >
        <SettingsToggle
          id="autoDailyChallenges"
          label="Défis automatiques"
          description="Assigner automatiquement des défis quotidiens"
          checked={preferences.autoDailyChallenges}
          onCheckedChange={(checked) => updatePreferences({ autoDailyChallenges: checked })}
        />
      </SettingsSection>
    </div>
  );
};
