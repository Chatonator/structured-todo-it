import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from '@/hooks/useTheme';
import { Theme, TextSize } from '@/types/preferences';

export const AppearanceSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  const { theme, setTheme } = useTheme();

  const textSizeMap: Record<TextSize, number> = {
    small: 0,
    normal: 1,
    large: 2,
    xlarge: 3,
  };

  const textSizeLabels: Record<TextSize, string> = {
    small: 'Petit',
    normal: 'Normal',
    large: 'Grand',
    xlarge: 'Très grand',
  };

  const handleTextSizeChange = (value: number[]) => {
    const sizes: TextSize[] = ['small', 'normal', 'large', 'xlarge'];
    updatePreferences({ textSize: sizes[value[0]] });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Thème"
        description="Choisissez l'apparence de l'application"
      >
        <div className="space-y-2">
          <Label>Mode d'affichage</Label>
          <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Taille du texte"
        description="Ajustez la taille du texte pour plus de confort"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {textSizeLabels[preferences.textSize]}
            </span>
          </div>
          <Slider
            value={[textSizeMap[preferences.textSize]]}
            onValueChange={handleTextSizeChange}
            min={0}
            max={3}
            step={1}
            className="w-full"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Accessibilité"
        description="Options pour améliorer l'accessibilité"
      >
        <SettingsToggle
          id="highContrast"
          label="Contraste élevé"
          description="Augmente le contraste pour une meilleure lisibilité"
          checked={preferences.highContrast}
          onCheckedChange={(checked) => updatePreferences({ highContrast: checked })}
        />
        <SettingsToggle
          id="reducedAnimations"
          label="Animations réduites"
          description="Réduit les animations pour plus de confort"
          checked={preferences.reducedAnimations}
          onCheckedChange={(checked) => updatePreferences({ reducedAnimations: checked })}
        />
      </SettingsSection>
    </div>
  );
};
