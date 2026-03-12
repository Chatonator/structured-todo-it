import React from 'react';
import { ArrowRight, CalendarDays, CheckSquare, FolderKanban, Heart, Telescope, Trophy, Wrench, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewSection } from '@/components/layout/view';
import { useApp } from '@/contexts/AppContext';

const shortcuts = [
  { id: 'tasks', label: 'Taches', icon: CheckSquare },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'projects', label: 'Projets', icon: FolderKanban },
  { id: 'habits', label: 'Habitudes', icon: Heart },
  { id: 'observatory', label: 'Observatoire', icon: Telescope },
  { id: 'rewards', label: 'Recompenses', icon: Trophy },
  { id: 'toolbox', label: 'Outils', icon: Wrench },
  { id: 'team', label: 'Equipe', icon: Users },
] as const;

const QuickLinksWidget: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <ViewSection
      title="Raccourcis"
      subtitle="Retrouvez toutes les grandes vues au meme endroit"
      icon={<ArrowRight className="w-5 h-5" />}
      variant="card"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Button
              key={shortcut.id}
              variant="outline"
              className="h-auto justify-start gap-3 rounded-xl px-4 py-4 text-left"
              onClick={() => setCurrentView(shortcut.id)}
            >
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">{shortcut.label}</span>
            </Button>
          );
        })}
      </div>
    </ViewSection>
  );
};

export default QuickLinksWidget;
