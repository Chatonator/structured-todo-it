
import React, { useState } from 'react';
import { Task, CATEGORY_CONFIG, CATEGORY_CSS_NAMES } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Target, Calendar, Archive } from 'lucide-react';

interface EisenhowerViewProps {
  tasks: Task[];
}

// Mappage des catégories vers les quadrants d'Eisenhower
const getCategoryQuadrant = (category: string): 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important' => {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  return config ? config.eisenhowerQuadrant : 'not-urgent-not-important';
};

const EisenhowerView: React.FC<EisenhowerViewProps> = ({ tasks }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  // Organisation des tâches par quadrant avec couleurs thématiques
  const quadrants = React.useMemo(() => ({
    'urgent-important': {
      title: 'Urgent & Important',
      subtitle: 'À FAIRE MAINTENANT',
      cssColorVar: '--color-obligation',
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      description: 'Crises, urgences, problèmes pressants',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'urgent-important')
    },
    'important-not-urgent': {
      title: 'Important & Non Urgent',
      subtitle: 'À PLANIFIER',
      cssColorVar: '--color-envie',
      icon: <Target className="w-5 h-5 text-white" />,
      description: 'Prévention, amélioration, développement',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'important-not-urgent')
    },
    'urgent-not-important': {
      title: 'Urgent & Non Important',
      subtitle: 'À DÉLÉGUER',
      cssColorVar: '--color-quotidien',
      icon: <Calendar className="w-5 h-5 text-white" />,
      description: 'Interruptions, certains appels, emails',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'urgent-not-important')
    },
    'not-urgent-not-important': {
      title: 'Non Urgent & Non Important',
      subtitle: 'À ÉLIMINER',
      cssColorVar: '--color-autres',
      icon: <Archive className="w-5 h-5 text-white" />,
      description: 'Distractions, certaines activités',
      tasks: tasks.filter(task => getCategoryQuadrant(task.category) === 'not-urgent-not-important')
    }
  }), [tasks]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getTotalTime = (quadrantTasks: Task[]): number => {
    return quadrantTasks.reduce((total, task) => total + task.estimatedTime, 0);
  };

  const renderTaskCard = (task: Task) => {
    const categoryConfig = CATEGORY_CONFIG[task.category];
    const cssName = CATEGORY_CSS_NAMES[task.category];
    
    // Couleur résolue mémorisée
    const resolvedCategoryColor = React.useMemo(() => 
      cssVarRGB(`--color-${cssName}`), 
      [cssName]
    );
    
    return (
      <div
        key={task.id}
        className={`
          p-3 border rounded-lg hover:shadow-sm transition-all
          ${task.isCompleted ? 'opacity-60 bg-muted' : 'bg-card'}
          ${categoryConfig.borderPattern}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className={`text-sm font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.name}
          </h4>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: resolvedCategoryColor }}
          />
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-theme-muted">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(task.estimatedTime)}</span>
          {task.isCompleted && (
            <Badge variant="outline" className="text-xs bg-system-success/10 text-system-success">
              Terminée
            </Badge>
          )}
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Aucune tâche à organiser</h3>
        <p className="text-sm text-muted-foreground">Créez des tâches pour voir la matrice d'Eisenhower</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-theme-foreground mb-2">Matrice d'Eisenhower</h2>
        <p className="text-sm text-theme-muted mb-4">
          Organisez vos tâches selon leur urgence et leur importance
        </p>
        
        {/* Statistiques globales */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(quadrants).map(([key, quadrant]) => {
            // Mémoriser la couleur résolue pour chaque quadrant
            const resolvedIconColor = React.useMemo(() => {
              if (quadrant.tasks.length > 0) {
                const firstTaskCategory = quadrant.tasks[0].category;
                const cssName = CATEGORY_CSS_NAMES[firstTaskCategory];
                return cssVarRGB(`--color-${cssName}`);
              }
              return 'currentColor';
            }, [quadrant.tasks]);

            return (
              <div key={key} className="text-center p-3 bg-theme-background border border-theme-border rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  {React.cloneElement(quadrant.icon, { 
                    className: "w-5 h-5", 
                    style: { color: resolvedIconColor } 
                  })}
                </div>
                <div className="text-lg font-bold text-theme-foreground">{quadrant.tasks.length}</div>
                <div className="text-xs text-theme-muted">tâches</div>
                <div className="text-xs text-theme-muted">{formatDuration(getTotalTime(quadrant.tasks))}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matrice 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(quadrants).map(([key, quadrant]) => {
          const resolvedColor = cssVarRGB(quadrant.cssColorVar);
          return (
          <Card 
            key={key} 
            className="cursor-pointer transition-all hover:shadow-md border-2"
            style={{
              backgroundColor: `${resolvedColor.replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
              borderColor: resolvedColor
            }}
            onClick={() => setSelectedQuadrant(selectedQuadrant === key ? null : key)}
          >
            <CardHeader 
              className="py-3 rounded-t-lg text-white"
              style={{ backgroundColor: resolvedColor }}
            >
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {quadrant.icon}
                  <div>
                    <div className="font-bold text-white">{quadrant.title}</div>
                    <div className="text-xs font-normal opacity-80 text-white">{quadrant.subtitle}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                  {quadrant.tasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4">
              <p className="text-xs text-theme-muted mb-3 italic">
                {quadrant.description}
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {quadrant.tasks.length > 0 ? (
                  quadrant.tasks.map(task => renderTaskCard(task))
                ) : (
                  <div className="text-center py-4 text-theme-muted">
                    <div className="text-xs">Aucune tâche dans ce quadrant</div>
                  </div>
                )}
              </div>
              
              {quadrant.tasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-theme-border">
                  <div className="flex items-center justify-between text-xs text-theme-muted">
                    <span>Total: {quadrant.tasks.length} tâche{quadrant.tasks.length > 1 ? 's' : ''}</span>
                    <span>{formatDuration(getTotalTime(quadrant.tasks))}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Conseils d'action */}
      <Card className="bg-theme-accent border-theme-border">
        <CardHeader>
          <CardTitle className="text-lg text-theme-foreground">💡 Conseils d'action</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-theme-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1" style={{ color: cssVarRGB('--color-obligation') }}>🔥 Urgent & Important</h4>
              <p className="text-xs text-theme-muted">Traitez immédiatement ces tâches. Elles ne peuvent pas attendre.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: cssVarRGB('--color-envie') }}>🎯 Important & Non Urgent</h4>
              <p className="text-xs text-theme-muted">Planifiez du temps dédié. C'est ici que vous devez investir le plus.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: cssVarRGB('--color-quotidien') }}>⚡ Urgent & Non Important</h4>
              <p className="text-xs text-theme-muted">Déléguez si possible, ou traitez rapidement.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1" style={{ color: cssVarRGB('--color-autres') }}>🗑️ Non Urgent & Non Important</h4>
              <p className="text-xs text-theme-muted">Éliminez ou minimisez ces activités.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EisenhowerView;
