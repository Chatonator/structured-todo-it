import React from 'react';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { Habit } from '@/types/habit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  Briefcase, 
  Heart,
  ArrowRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HomeViewProps {
  tasks: Task[];
  projects?: Project[];
  habits?: Habit[];
  onViewChange: (view: string) => void;
  calculateTotalTime?: (task: Task) => number;
}

const HomeView: React.FC<HomeViewProps> = ({
  tasks,
  projects = [],
  habits = [],
  onViewChange,
  calculateTotalTime
}) => {
  // Sélectionner les 6 tâches les plus importantes (non complétées, triées par priorité/date)
  const topTasks = tasks
    .filter(t => !t.isCompleted && t.level === 1)
    .sort((a, b) => {
      // Prioriser par sous-catégorie (si définie) puis par date de création
      const aPriority = a.subCategory ? 5 - (parseInt(a.subCategory.slice(-1)) || 0) : 0;
      const bPriority = b.subCategory ? 5 - (parseInt(b.subCategory.slice(-1)) || 0) : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  // Projet actif avec le plus de tâches
  const activeProject = projects
    .filter(p => p.status === 'in-progress')
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];

  // Habitude avec le meilleur streak (simulation)
  const topHabit = habits[0];

  // Calendrier de la semaine
  const weekStart = startOfWeek(new Date(), { locale: fr });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de l'essentiel</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{tasks.filter(t => !t.isCompleted).length}</div>
            <div className="text-xs text-muted-foreground">Tâches actives</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-project">{projects.filter(p => p.status === 'in-progress').length}</div>
            <div className="text-xs text-muted-foreground">Projets en cours</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-habit">{habits.length}</div>
            <div className="text-xs text-muted-foreground">Habitudes</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-system-success">{tasks.filter(t => t.isCompleted).length}</div>
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
                onClick={() => onViewChange('tasks')}
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
                          {formatDuration(calculateTotalTime ? calculateTotalTime(task) : task.estimatedTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendrier de la semaine */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Semaine en cours
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('calendar')}
                className="text-xs"
              >
                Calendrier complet
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const dayTasks = tasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day));
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 rounded-lg text-center ${
                      isToday ? 'bg-primary text-primary-foreground' : 'bg-accent'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(day, 'EEE', { locale: fr }).slice(0, 3)}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? '' : 'text-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {dayTasks.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              {tasks.filter(t => t.scheduledDate).length} tâches planifiées cette semaine
            </div>
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
                onClick={() => onViewChange('projects')}
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

        {/* Habitude principale */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-habit" />
                Habitude du jour
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('habits')}
                className="text-xs"
              >
                Toutes les habitudes
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!topHabit ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune habitude définie
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl bg-habit-light">
                    {topHabit.icon || '💪'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{topHabit.name}</h3>
                    <p className="text-sm text-muted-foreground">{topHabit.description || 'Continuez ainsi !'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center p-3 bg-habit-light rounded-lg">
                    <div className="text-2xl font-bold text-habit">7</div>
                    <div className="text-xs text-muted-foreground">jours de suite</div>
                  </div>
                  <div className="flex-1 text-center p-3 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="w-5 h-5 text-system-success" />
                      92%
                    </div>
                    <div className="text-xs text-muted-foreground">taux de réussite</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeView;
