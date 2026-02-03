import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Clock, CalendarDays } from 'lucide-react';

export const TimelineSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  };

  return (
    <SettingsSection
      title="Planification journalière"
      description="Configurez vos préférences pour la vue Timeline"
    >
      <div className="space-y-6">
        {/* Quota par défaut */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Quota journalier par défaut
            </Label>
            <span className="text-xl font-bold text-primary">
              {formatHours(preferences.timelineDefaultQuota)}
            </span>
          </div>
          
          <Slider
            value={[preferences.timelineDefaultQuota]}
            onValueChange={([value]) => updatePreferences({ timelineDefaultQuota: value })}
            min={30}
            max={600}
            step={30}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30min</span>
            <span>10h</span>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nombre d'heures de travail prévues par jour par défaut. 
            Vous pouvez ajuster ce quota individuellement pour chaque jour dans la vue Timeline.
          </p>
        </div>

        {/* Tips */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="w-4 h-4 text-primary" />
            Astuce
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Un quota réaliste aide à maintenir un équilibre travail-vie personnelle. 
            Commencez par un quota modeste et ajustez-le selon votre rythme.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
};
