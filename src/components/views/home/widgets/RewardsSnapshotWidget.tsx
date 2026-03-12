import React from 'react';
import { Trophy, Flame, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ViewSection } from '@/components/layout/view';
import { useGamification } from '@/hooks/useGamification';
import { useApp } from '@/contexts/AppContext';

const RewardsSnapshotWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const { progress, loading } = useGamification();

  const progressPct = progress && progress.xpForNextLevel > 0
    ? Math.min(100, Math.round((progress.currentPoints / progress.xpForNextLevel) * 100))
    : 0;

  return (
    <ViewSection
      title="Recompenses"
      subtitle="Votre energie et votre progression"
      icon={<Trophy className="w-5 h-5" />}
      variant="card"
      actions={
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('rewards')}>
          Ouvrir
        </Button>
      }
    >
      {loading || !progress ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Chargement des recompenses...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-background/70 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Niveau actuel</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{progress.currentLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Minutes disponibles</p>
              <p className="mt-2 text-2xl font-semibold text-primary">{progress.minutesAvailable}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium text-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Flame className="w-4 h-4 text-warning" />
                Streak
              </p>
              <p className="mt-2 text-lg font-semibold">{progress.currentTaskStreak} jours</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Taches completees
              </p>
              <p className="mt-2 text-lg font-semibold">{progress.tasksCompleted}</p>
            </div>
          </div>
        </div>
      )}
    </ViewSection>
  );
};

export default RewardsSnapshotWidget;
