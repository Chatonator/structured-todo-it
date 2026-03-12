import React from 'react';
import { CalendarDays, CheckSquare, FolderKanban, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewSection } from '@/components/layout/view';
import { useHomeViewData } from '@/hooks/view-data';
import { useApp } from '@/contexts/AppContext';

const DailyOverviewWidget: React.FC = () => {
  const { data } = useHomeViewData();
  const { setCurrentView, setIsModalOpen } = useApp();

  const tiles = [
    { label: 'Taches actives', value: data.stats.totalTasks, tone: 'text-foreground' },
    { label: 'Taches prioritaires', value: data.topPriorityTasks.length, tone: 'text-task' },
    { label: 'Habitudes du jour', value: data.todayHabits.length, tone: 'text-habit' },
    { label: 'Projet actif', value: data.activeProject ? 1 : 0, tone: 'text-project' },
  ];

  return (
    <ViewSection
      title="Vue du jour"
      subtitle="Votre cockpit personnel pour lancer la bonne action rapidement"
      icon={<CalendarDays className="w-5 h-5" />}
      variant="card"
      actions={
        <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nouvelle tache
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {tile.label}
              </p>
              <p className={`mt-2 text-2xl font-semibold ${tile.tone}`}>{tile.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">
            {data.activeProject
              ? `Projet a garder en ligne de mire : ${data.activeProject.name}`
              : 'Aucun projet actif pour le moment.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.todayHabits.length > 0
              ? `Vous avez ${data.todayHabits.length} habitude${data.todayHabits.length > 1 ? 's' : ''} a entretenir aujourd’hui.`
              : 'Ajoutez des habitudes ou planifiez votre journee pour enrichir ce tableau de bord.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start gap-2" onClick={() => setCurrentView('tasks')}>
            <CheckSquare className="w-4 h-4" />
            Taches
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => setCurrentView('timeline')}>
            <CalendarDays className="w-4 h-4" />
            Timeline
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => setCurrentView('projects')}>
            <FolderKanban className="w-4 h-4" />
            Projets
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => setCurrentView('habits')}>
            <Heart className="w-4 h-4" />
            Habitudes
          </Button>
        </div>
      </div>
    </ViewSection>
  );
};

export default DailyOverviewWidget;
