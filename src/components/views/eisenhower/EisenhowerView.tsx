import React from 'react';
import { ViewLayout } from '@/components/layout/view';
import { ViewStats } from '@/components/layout/view/ViewStats';
import { useEisenhowerViewData, QUADRANT_CONFIGS, EisenhowerQuadrant } from '@/hooks/view-data';
import { QuadrantCard } from '@/components/primitives/cards';
import { TaskCard } from '@/components/primitives/cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, AlertTriangle, Clock, Zap, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface EisenhowerViewProps {
  className?: string;
}

const QUADRANT_ICONS: Record<EisenhowerQuadrant, React.ReactNode> = {
  'urgent-important': <AlertTriangle className="w-4 h-4" />,
  'not-urgent-important': <Clock className="w-4 h-4" />,
  'urgent-not-important': <Zap className="w-4 h-4" />,
  'not-urgent-not-important': <Trash2 className="w-4 h-4" />
};

const QUADRANT_COLORS: Record<EisenhowerQuadrant, { bg: string; border: string }> = {
  'urgent-important': { bg: 'bg-system-error', border: 'border-system-error' },
  'not-urgent-important': { bg: 'bg-system-warning', border: 'border-system-warning' },
  'urgent-not-important': { bg: 'bg-system-info', border: 'border-system-info' },
  'not-urgent-not-important': { bg: 'bg-muted-foreground', border: 'border-muted' }
};

const EisenhowerView: React.FC<EisenhowerViewProps> = ({ className }) => {
  const { data, state, actions } = useEisenhowerViewData();

  const stats = [
    {
      id: 'urgent-important',
      label: 'Urgent & Important',
      value: data.stats.urgentImportant,
      icon: <AlertTriangle className="w-4 h-4" />,
      subtitle: formatDuration(data.quadrantTimes['urgent-important'])
    },
    {
      id: 'important',
      label: 'Important',
      value: data.stats.important,
      icon: <Clock className="w-4 h-4" />,
      subtitle: formatDuration(data.quadrantTimes['not-urgent-important'])
    },
    {
      id: 'urgent',
      label: 'Urgent',
      value: data.stats.urgent,
      icon: <Zap className="w-4 h-4" />,
      subtitle: formatDuration(data.quadrantTimes['urgent-not-important'])
    },
    {
      id: 'neither',
      label: 'Ni l\'un ni l\'autre',
      value: data.stats.neither,
      icon: <Trash2 className="w-4 h-4" />,
      subtitle: formatDuration(data.quadrantTimes['not-urgent-not-important'])
    }
  ];

  const quadrantOrder: EisenhowerQuadrant[] = [
    'urgent-important',
    'not-urgent-important',
    'urgent-not-important',
    'not-urgent-not-important'
  ];

  return (
    <ViewLayout
      header={{
        title: "Matrice Eisenhower",
        subtitle: "Priorisez par importance et urgence",
        icon: <Grid3X3 className="w-5 h-5" />
      }}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        <ViewStats stats={stats} columns={4} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrantOrder.map(quadrantKey => {
            const config = QUADRANT_CONFIGS[quadrantKey];
            const tasks = data.quadrants[quadrantKey];
            const colors = QUADRANT_COLORS[quadrantKey];
            
            return (
              <Card 
                key={quadrantKey}
                className={cn("border-2", colors.border)}
              >
                <CardHeader className={cn("py-3 rounded-t-lg text-white", colors.bg)}>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {QUADRANT_ICONS[quadrantKey]}
                      <div>
                        <div className="font-bold text-white">{config.title}</div>
                        <div className="text-xs font-normal opacity-80 text-white">
                          {config.description}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-white/20 text-white border-white/30"
                    >
                      {tasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Aucune tâche
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {tasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          totalTime={task.estimatedTime}
                          variant="minimal"
                          onClick={() => actions.toggleTaskCompletion(task.id)}
                        />
                      ))}
                    </div>
                  )}
                  {tasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
                      <span>{tasks.length} tâche{tasks.length > 1 ? 's' : ''}</span>
                      <span>{formatDuration(data.quadrantTimes[quadrantKey])}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ViewLayout>
  );
};

export default EisenhowerView;
