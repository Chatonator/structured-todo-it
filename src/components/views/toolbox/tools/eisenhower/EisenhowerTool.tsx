import React from 'react';
import { useEisenhowerViewData, QUADRANT_CONFIGS, EisenhowerQuadrant } from './useEisenhowerViewData';
import { TaskCard } from '@/components/primitives/cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Zap, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ToolProps } from '../types';

const QUADRANT_ICONS: Record<EisenhowerQuadrant, React.ReactNode> = {
  'urgent-important': <AlertTriangle className="w-4 h-4" />,
  'important-not-urgent': <Clock className="w-4 h-4" />,
  'urgent-not-important': <Zap className="w-4 h-4" />,
  'not-urgent-not-important': <Trash2 className="w-4 h-4" />
};

const QUADRANT_COLORS: Record<EisenhowerQuadrant, { bg: string; border: string }> = {
  'urgent-important': { bg: 'bg-system-error', border: 'border-system-error' },
  'important-not-urgent': { bg: 'bg-system-warning', border: 'border-system-warning' },
  'urgent-not-important': { bg: 'bg-system-info', border: 'border-system-info' },
  'not-urgent-not-important': { bg: 'bg-muted-foreground', border: 'border-muted' }
};

const EisenhowerTool: React.FC<ToolProps> = () => {
  const { data, actions } = useEisenhowerViewData();

  const quadrantOrder: EisenhowerQuadrant[] = [
    'urgent-important',
    'important-not-urgent',
    'urgent-not-important',
    'not-urgent-not-important'
  ];

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quadrantOrder.map(quadrantKey => {
          const config = QUADRANT_CONFIGS[quadrantKey];
          const tasks = data.quadrants[quadrantKey];
          const colors = QUADRANT_COLORS[quadrantKey];
          
          return (
            <div 
              key={quadrantKey}
              className={cn(
                "p-3 rounded-lg border",
                colors.border,
                "bg-card"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1.5 rounded", colors.bg, "text-white")}>
                  {QUADRANT_ICONS[quadrantKey]}
                </div>
                <span className="text-2xl font-bold">{tasks.length}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDuration(data.quadrantTimes[quadrantKey])}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix grid */}
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
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
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
  );
};

export default EisenhowerTool;
