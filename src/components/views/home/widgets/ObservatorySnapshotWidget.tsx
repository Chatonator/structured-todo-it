import React, { useMemo } from 'react';
import { Telescope } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ViewSection } from '@/components/layout/view';
import { Button } from '@/components/ui/button';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { useApp } from '@/contexts/AppContext';

const ObservatorySnapshotWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const viewData = useViewDataContext();

  const snapshot = useMemo(() => {
    const now = new Date();
    const tasks = viewData.tasks;
    const activeTasks = tasks.filter((task) => !task.isCompleted);
    const completedTasks = tasks.filter((task) => task.isCompleted);
    const zombieTasks = activeTasks.filter((task) => differenceInDays(now, task.createdAt) >= 14);
    const groupedByCategory = activeTasks.reduce<Record<string, number>>((accumulator, task) => {
      accumulator[task.category] = (accumulator[task.category] || 0) + 1;
      return accumulator;
    }, {});

    const dominantCategory = Object.entries(groupedByCategory)
      .sort((left, right) => right[1] - left[1])[0];

    return {
      activeCount: activeTasks.length,
      completedCount: completedTasks.length,
      zombieCount: zombieTasks.length,
      dominantCategory: dominantCategory ? `${dominantCategory[0]} (${dominantCategory[1]})` : 'Aucune categorie dominante',
    };
  }, [viewData.tasks]);

  return (
    <ViewSection
      title="Sante du backlog"
      subtitle="Les signaux utiles sans ouvrir l’Observatoire"
      icon={<Telescope className="w-5 h-5" />}
      variant="card"
      actions={
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('observatory')}>
          Observatoire
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Actives</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{snapshot.activeCount}</p>
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Terminees</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{snapshot.completedCount}</p>
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">A surveiller</p>
            <p className="mt-2 text-xl font-semibold text-warning">{snapshot.zombieCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <p className="text-sm font-medium text-foreground">Categorie dominante</p>
          <p className="mt-1 text-sm text-muted-foreground">{snapshot.dominantCategory}</p>
        </div>
      </div>
    </ViewSection>
  );
};

export default ObservatorySnapshotWidget;
