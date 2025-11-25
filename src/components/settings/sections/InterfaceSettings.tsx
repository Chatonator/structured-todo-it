import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { SettingsColorPicker } from '../common/SettingsColorPicker';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const InterfaceSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  const moveCategoryUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...preferences.categoryOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    newOrder.forEach((cat, idx) => cat.order = idx);
    updatePreferences({ categoryOrder: newOrder });
  };

  const moveCategoryDown = (index: number) => {
    if (index === preferences.categoryOrder.length - 1) return;
    const newOrder = [...preferences.categoryOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    newOrder.forEach((cat, idx) => cat.order = idx);
    updatePreferences({ categoryOrder: newOrder });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Modules visibles"
        description="Choisissez quels modules afficher dans l'application"
      >
        <SettingsToggle
          id="showHabits"
          label="Afficher les Habitudes"
          description="Module de suivi des habitudes quotidiennes"
          checked={preferences.showHabits}
          onCheckedChange={(checked) => updatePreferences({ showHabits: checked })}
        />
        <SettingsToggle
          id="showGamification"
          label="Afficher la Gamification"
          description="Système de récompenses, niveaux et défis"
          checked={preferences.showGamification}
          onCheckedChange={(checked) => updatePreferences({ showGamification: checked })}
        />
        <SettingsToggle
          id="showTeams"
          label="Afficher les Équipes"
          description="Collaboration et tâches d'équipe"
          checked={preferences.showTeams}
          onCheckedChange={(checked) => updatePreferences({ showTeams: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title="Ordre des catégories"
        description="Réorganisez l'ordre des vues dans la navigation"
      >
        <div className="space-y-1">
          {preferences.categoryOrder.map((category, index) => (
            <div 
              key={category.id}
              className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
            >
              <span className="text-sm font-medium">{category.label}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveCategoryUp(index)}
                  disabled={index === 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveCategoryDown(index)}
                  disabled={index === preferences.categoryOrder.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Couleurs des catégories"
        description="Personnalisez les couleurs de vos catégories de tâches"
      >
        <SettingsColorPicker
          id="colorObligation"
          label="Obligation"
          value={preferences.categoryColors.Obligation}
          onChange={(color) => updatePreferences({
            categoryColors: { ...preferences.categoryColors, Obligation: color }
          })}
        />
        <SettingsColorPicker
          id="colorQuotidien"
          label="Quotidien"
          value={preferences.categoryColors.Quotidien}
          onChange={(color) => updatePreferences({
            categoryColors: { ...preferences.categoryColors, Quotidien: color }
          })}
        />
        <SettingsColorPicker
          id="colorEnvie"
          label="Envie"
          value={preferences.categoryColors.Envie}
          onChange={(color) => updatePreferences({
            categoryColors: { ...preferences.categoryColors, Envie: color }
          })}
        />
        <SettingsColorPicker
          id="colorAutres"
          label="Autres"
          value={preferences.categoryColors.Autres}
          onChange={(color) => updatePreferences({
            categoryColors: { ...preferences.categoryColors, Autres: color }
          })}
        />
      </SettingsSection>
    </div>
  );
};
