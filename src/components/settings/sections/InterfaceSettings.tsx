import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { SettingsToggle } from '../common/SettingsToggle';
import { SettingsColorPicker } from '../common/SettingsColorPicker';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTeamContext } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';

export const InterfaceSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  const { teams } = useTeamContext();

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

  const toggleCategoryVisibility = (index: number) => {
    const newOrder = [...preferences.categoryOrder];
    newOrder[index] = { ...newOrder[index], visible: !newOrder[index].visible };
    updatePreferences({ categoryOrder: newOrder });
  };

  const toggleTeamInAllFilter = (teamId: string) => {
    const current = preferences.allFilterTeamIds;
    const updated = current.includes(teamId)
      ? current.filter(id => id !== teamId)
      : [...current, teamId];
    updatePreferences({ allFilterTeamIds: updated });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Filtres contextuels"
        description="Personnalisez les filtres de contexte visibles dans l'application"
      >
        <SettingsToggle
          id="showProContext"
          label="Afficher le contexte Pro"
          description="Désactivez si vous utilisez l'app uniquement pour le perso"
          checked={preferences.showProContext}
          onCheckedChange={(checked) => updatePreferences({ showProContext: checked })}
        />
        <SettingsToggle
          id="allFilterIncludeTeams"
          label="Inclure les équipes dans « Toutes »"
          description="Le filtre global « Toutes » affichera aussi les tâches d'équipe"
          checked={preferences.allFilterIncludeTeams}
          onCheckedChange={(checked) => updatePreferences({ allFilterIncludeTeams: checked })}
        />
        {preferences.allFilterIncludeTeams && teams.length > 0 && (
          <div className="ml-4 space-y-2 pt-1">
            <p className="text-sm text-muted-foreground">Équipes incluses dans « Toutes » :</p>
            {teams.map((team) => {
              const isIncluded = preferences.allFilterTeamIds.length === 0 || preferences.allFilterTeamIds.includes(team.id);
              return (
                <div key={team.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`team-filter-${team.id}`}
                    checked={isIncluded}
                    onCheckedChange={() => {
                      if (preferences.allFilterTeamIds.length === 0) {
                        // Passer de "toutes" à "toutes sauf celle-ci"
                        const allExceptThis = teams.filter(t => t.id !== team.id).map(t => t.id);
                        updatePreferences({ allFilterTeamIds: allExceptThis });
                      } else {
                        toggleTeamInAllFilter(team.id);
                      }
                    }}
                  />
                  <Label htmlFor={`team-filter-${team.id}`} className="text-sm cursor-pointer">
                    {team.name}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </SettingsSection>

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
        title="Contenu de la barre latérale"
        description="Choisissez quels éléments afficher dans la barre latérale des tâches"
      >
        <SettingsToggle
          id="sidebarShowHabits"
          label="Afficher les habitudes du jour"
          description="Voir et cocher vos habitudes directement depuis la sidebar"
          checked={preferences.sidebarShowHabits}
          onCheckedChange={(checked) => updatePreferences({ sidebarShowHabits: checked })}
        />
        <SettingsToggle
          id="sidebarShowProjects"
          label="Afficher les projets en cours"
          description="Voir la progression de vos projets actifs"
          checked={preferences.sidebarShowProjects}
          onCheckedChange={(checked) => updatePreferences({ sidebarShowProjects: checked })}
        />
        <SettingsToggle
          id="sidebarShowTeamTasks"
          label="Afficher les tâches d'équipe"
          description="Voir les tâches de votre équipe actuelle"
          checked={preferences.sidebarShowTeamTasks}
          onCheckedChange={(checked) => updatePreferences({ sidebarShowTeamTasks: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title="Ordre et visibilité des catégories"
        description="Réorganisez l'ordre des vues et masquez celles que vous n'utilisez pas"
      >
        <div className="space-y-1">
          {preferences.categoryOrder.map((category, index) => (
            <div 
              key={category.id}
              className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
            >
              <span className={`text-sm font-medium ${!category.visible ? 'opacity-50 line-through' : ''}`}>
                {category.label}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategoryVisibility(index)}
                  className="h-7 w-7 p-0"
                  title={category.visible ? 'Masquer' : 'Afficher'}
                >
                  {category.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
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
