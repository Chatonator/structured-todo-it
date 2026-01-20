import React, { useMemo } from 'react';
import { Task, CATEGORY_CONFIG } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Target, Calendar, Archive, Grid3X3 } from 'lucide-react';
import { ViewLayout, ViewStats } from '@/components/layout/view';
import { QuadrantCard, QuadrantConfig, EisenhowerQuadrant } from '@/components/primitives';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { formatDuration } from '@/lib/formatters';

interface EisenhowerViewProps {
  className?: string;
}

// Mappage des catégories vers les quadrants d'Eisenhower
const getCategoryQuadrant = (category: string): EisenhowerQuadrant => {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  return config ? config.eisenhowerQuadrant : 'not-urgent-not-important';
};

// Configuration des quadrants
const QUADRANT_CONFIGS: Record<EisenhowerQuadrant, QuadrantConfig> = {
  'urgent-important': {
    title: 'Urgent & Important',
    subtitle: 'À FAIRE MAINTENANT',
    icon: <AlertTriangle className="w-5 h-5 text-white" />,
    description: 'Crises, urgences, problèmes pressants',
    bgColor: 'bg-category-obligation',
    borderColor: 'border-category-obligation',
  },
  'important-not-urgent': {
    title: 'Important & Non Urgent',
    subtitle: 'À PLANIFIER',
    icon: <Target className="w-5 h-5 text-white" />,
    description: 'Prévention, amélioration, développement',
    bgColor: 'bg-category-envie',
    borderColor: 'border-category-envie',
  },
  'urgent-not-important': {
    title: 'Urgent & Non Important',
    subtitle: 'À DÉLÉGUER',
    icon: <Calendar className="w-5 h-5 text-white" />,
    description: 'Interruptions, certains appels, emails',
    bgColor: 'bg-category-quotidien',
    borderColor: 'border-category-quotidien',
  },
  'not-urgent-not-important': {
    title: 'Non Urgent & Non Important',
    subtitle: 'À ÉLIMINER',
    icon: <Archive className="w-5 h-5 text-white" />,
    description: 'Distractions, certaines activités',
    bgColor: 'bg-category-autres',
    borderColor: 'border-category-autres',
  },
};

const EisenhowerView: React.FC<EisenhowerViewProps> = ({ className }) => {
  const { tasks } = useViewDataContext();

  // Filtrer les tâches actives
  const activeTasks = tasks.filter(t => !t.isCompleted);

  // Organisation des tâches par quadrant
  const quadrants = useMemo(() => {
    const result: Record<EisenhowerQuadrant, Task[]> = {
      'urgent-important': [],
      'important-not-urgent': [],
      'urgent-not-important': [],
      'not-urgent-not-important': [],
    };

    activeTasks.forEach(task => {
      const quadrant = getCategoryQuadrant(task.category);
      result[quadrant].push(task);
    });

    return result;
  }, [activeTasks]);

  const getTotalTime = (taskList: Task[]): number => {
    return taskList.reduce((total, task) => total + (task.estimatedTime || 0), 0);
  };

  // Stats pour ViewStats
  const stats = Object.entries(quadrants).map(([key, taskList]) => {
    const config = QUADRANT_CONFIGS[key as EisenhowerQuadrant];
    return {
      id: key,
      label: 'tâches',
      value: taskList.length,
      icon: config.icon,
      subtitle: formatDuration(getTotalTime(taskList)),
    };
  });

  const isEmpty = activeTasks.length === 0;

  return (
    <ViewLayout
      header={{
        title: "Matrice d'Eisenhower",
        subtitle: "Organisez vos tâches selon leur urgence et leur importance",
        icon: <Grid3X3 className="w-5 h-5" />
      }}
      variant="grid"
      state={isEmpty ? 'empty' : 'success'}
      emptyProps={{
        title: "Aucune tâche à organiser",
        message: "Créez des tâches pour voir la matrice d'Eisenhower",
        icon: <Target className="w-12 h-12" />
      }}
      className={className}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Statistiques globales */}
        <ViewStats stats={stats} columns={4} variant="compact" />

        {/* Matrice 2x2 avec QuadrantCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {(Object.keys(quadrants) as EisenhowerQuadrant[]).map((quadrantKey) => (
            <QuadrantCard
              key={quadrantKey}
              quadrant={quadrantKey}
              config={QUADRANT_CONFIGS[quadrantKey]}
              tasks={quadrants[quadrantKey]}
              maxVisibleTasks={6}
              showTotalTime
            />
          ))}
        </div>

        {/* Conseils d'action */}
        <Card className="bg-accent border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">💡 Conseils d'action</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-1 text-category-obligation">🔥 Urgent & Important</h4>
                <p className="text-xs text-muted-foreground">Traitez immédiatement ces tâches. Elles ne peuvent pas attendre.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-category-envie">🎯 Important & Non Urgent</h4>
                <p className="text-xs text-muted-foreground">Planifiez du temps dédié. C'est ici que vous devez investir le plus.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-category-quotidien">⚡ Urgent & Non Important</h4>
                <p className="text-xs text-muted-foreground">Déléguez si possible, ou traitez rapidement.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-category-autres">🗑️ Non Urgent & Non Important</h4>
                <p className="text-xs text-muted-foreground">Éliminez ou minimisez ces activités.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ViewLayout>
  );
};

export default EisenhowerView;
