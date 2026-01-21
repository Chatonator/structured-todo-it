import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  ArrowRight,
  Target,
  Home
} from 'lucide-react';
import HomeHabitsSection from './HomeHabitsSection';
import { ViewLayout } from '@/components/layout/view';
import { useHomeViewData } from '@/hooks/view-data';
import { useApp } from '@/contexts/AppContext';
import { StatCard, TaskCard } from '@/components/primitives';
import { useViewDataContext } from '@/contexts/ViewDataContext';

interface HomeViewProps {
  className?: string;
}

const HomeView: React.FC<HomeViewProps> = ({ className }) => {
  const { setCurrentView } = useApp();
  const { data, state } = useHomeViewData();
  const { habitCompletions, habitStreaks, toggleHabitCompletion, habitsLoading, calculateTotalTime } = useViewDataContext();

  const { topPriorityTasks, activeProject, todayHabits, stats } = data;

  return (
    <ViewLayout
      header={{
        title: "Tableau de bord",
        subtitle: "Vue d'ensemble de votre journée",
        icon: <Home className="w-5 h-5" />
      }}
      state={state.loading ? 'loading' : 'success'}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            value={data.projects.filter(p => p.status === 'in-progress').length}
            label="Projets en cours"
            valueClassName="text-project"
          />
          <StatCard
            value={`${Object.values(habitCompletions).filter(Boolean).length}/${todayHabits.length}`}
            label="Habitudes du jour"
            valueClassName="text-habit"
          />
          <StatCard
            value={stats.completedToday}
            label="Terminées"
            valueClassName="text-system-success"
          />
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tâches prioritaires */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Tâches prioritaires
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('tasks')}
                  className="text-xs"
                >
                  Voir tout
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {topPriorityTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucune tâche prioritaire
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {topPriorityTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      totalTime={calculateTotalTime(task)}
                      variant="compact"
                      showCategory={true}
                      showDuration={true}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projet du moment */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-project" />
                  Projet en cours
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('projects')}
                  className="text-xs"
                >
                  Tous les projets
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!activeProject ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun projet actif
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: activeProject.color + '20' }}>
                      {activeProject.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{activeProject.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{activeProject.description}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-semibold text-project">{activeProject.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-project transition-all duration-500"
                        style={{ width: `${activeProject.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Habitudes du jour */}
          <HomeHabitsSection
            habits={todayHabits}
            completions={habitCompletions}
            streaks={habitStreaks}
            onToggle={(habitId) => toggleHabitCompletion(habitId)}
            onViewAll={() => setCurrentView('habits')}
            loading={habitsLoading}
          />
        </div>
      </div>
    </ViewLayout>
  );
};

export default HomeView;
