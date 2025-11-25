import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export const ResetSettings: React.FC = () => {
  const { resetPreferences, resetInterfacePreferences } = useUserPreferences();
  const { toast } = useToast();

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
