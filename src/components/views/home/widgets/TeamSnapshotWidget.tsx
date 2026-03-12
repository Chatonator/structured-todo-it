import React, { useMemo } from 'react';
import { Users, ArrowRight, FolderKanban } from 'lucide-react';
import { ViewSection } from '@/components/layout/view';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTeamProjects } from '@/hooks/useTeamProjects';

const TeamSnapshotWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const { currentTeam, teamMembers } = useTeamContext();
  const { tasks, loading: tasksLoading } = useTeamTasks(currentTeam?.id ?? null);
  const { projects, loading: projectsLoading } = useTeamProjects(currentTeam?.id ?? null);

  const stats = useMemo(() => ({
    activeTasks: tasks.filter((task) => !task.isCompleted).length,
    unassignedTasks: tasks.filter((task) => !task.isCompleted && !task.assigned_to).length,
    activeProjects: projects.filter((project) => project.status !== 'completed' && project.status !== 'archived').length,
  }), [projects, tasks]);

  return (
    <ViewSection
      title="Equipe"
      subtitle="Le point rapide sur votre espace collaboratif"
      icon={<Users className="w-5 h-5" />}
      variant="card"
      actions={
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('team')}>
          Ouvrir
        </Button>
      }
    >
      {!currentTeam ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-center">
          <p className="text-sm font-medium text-foreground">Aucune equipe active</p>
          <p className="mt-1 text-sm text-muted-foreground">Creer ou rejoindre une equipe pour afficher ce widget.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setCurrentView('team')}>
            Aller a la vue equipe
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : tasksLoading || projectsLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Chargement de l’equipe...</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-background/70 p-4">
            <p className="text-sm font-semibold text-foreground">{currentTeam.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Actives</p>
              <p className="mt-2 text-xl font-semibold">{stats.activeTasks}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Sans owner</p>
              <p className="mt-2 text-xl font-semibold">{stats.unassignedTasks}</p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Projets</p>
              <p className="mt-2 text-xl font-semibold">{stats.activeProjects}</p>
            </div>
          </div>

          <Button variant="outline" className="w-full justify-between" onClick={() => setCurrentView('team')}>
            Ouvrir l’espace equipe
            <FolderKanban className="w-4 h-4" />
          </Button>
        </div>
      )}
    </ViewSection>
  );
};

export default TeamSnapshotWidget;
