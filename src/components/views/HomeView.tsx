import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Clock, 
  Briefcase, 
  ArrowRight,
  Target,
  Home
} from 'lucide-react';
import HomeHabitsSection from './HomeHabitsSection';
import { ViewLayout } from '@/components/layout/view';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { useApp } from '@/contexts/AppContext';

interface HomeViewProps {
  className?: string;
}

const HomeView: React.FC<HomeViewProps> = ({ className }) => {
  const { setCurrentView } = useApp();
  const {
    tasks,
    projects,
    todayHabits,
    habitCompletions,
    habitStreaks,
    habitsLoading,
    toggleHabitCompletion,
    calculateTotalTime
  } = useViewDataContext();

  // Tâches actives seulement
  const activeTasks = tasks.filter(t => !t.isCompleted);
  
  // Sélectionner les 6 tâches les plus importantes
  const topTasks = activeTasks
    .filter(t => t.level === 1)
    .sort((a, b) => {
      const aPriority = a.subCategory ? 5 - (parseInt(a.subCategory.slice(-1)) || 0) : 0;
      const bPriority = b.subCategory ? 5 - (parseInt(b.subCategory.slice(-1)) || 0) : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  // Projet actif avec le plus de progression
  const activeProject = projects
    .filter(p => p.status === 'in-progress')
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  const completedHabitsCount = todayHabits.filter(h => habitCompletions[h.id]).length;
  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const activeProjectsCount = projects.filter(p => p.status === 'in-progress').length;

  return (
    <ViewLayout
      header={{
        title: "Tableau de bord",
        subtitle: "Vue d'ensemble de votre journée",
        icon: <Home className="w-5 h-5" />
      }}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-project">{activeProjectsCount}</div>
              <div className="text-xs text-muted-foreground">Projets en cours</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-habit">{completedHabitsCount}/{todayHabits.length}</div>
              <div className="text-xs text-muted-foreground">Habitudes du jour</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-system-success">{completedTasksCount}</div>
              <div className="text-xs text-muted-foreground">Terminées</div>
            </CardContent>
          </Card>
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
              {topTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucune tâche prioritaire
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {topTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              task.category?.toLowerCase() === 'obligation' ? 'bg-category-obligation/10 border-category-obligation text-category-obligation' :
                              task.category?.toLowerCase() === 'quotidien' ? 'bg-category-quotidien/10 border-category-quotidien text-category-quotidien' :
                              task.category?.toLowerCase() === 'envie' ? 'bg-category-envie/10 border-category-envie text-category-envie' :
                              'bg-category-autres/10 border-category-autres text-category-autres'
                            }`}
                          >
                            {task.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(calculateTotalTime(task))}
                          </span>
                        </div>
                      </div>
                    </div>
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
