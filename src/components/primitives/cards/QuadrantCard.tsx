import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types/task';
import { formatDuration } from '@/lib/formatters';

export type EisenhowerQuadrant = 
  | 'urgent-important'
  | 'important-not-urgent'
  | 'urgent-not-important'
  | 'not-urgent-not-important';

export interface QuadrantConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  description: string;
  bgColor: string;
  borderColor: string;
}

export interface QuadrantCardProps {
  quadrant: EisenhowerQuadrant;
  config: QuadrantConfig;
  tasks: Task[];
  
  // Callbacks
  onClick?: () => void;
  onTaskClick?: (task: Task) => void;
  
  // Options
  maxVisibleTasks?: number;
  showTotalTime?: boolean;
  isSelected?: boolean;
  
  // Styling
  className?: string;
}

/**
 * QuadrantCard - Carte pour un quadrant de la matrice d'Eisenhower
 * 
 * @example
 * <QuadrantCard
 *   quadrant="urgent-important"
 *   config={urgentImportantConfig}
 *   tasks={urgentTasks}
 *   onTaskClick={handleTaskClick}
 * />
 */
export const QuadrantCard: React.FC<QuadrantCardProps> = ({
  quadrant,
  config,
  tasks,
  onClick,
  onTaskClick,
  maxVisibleTasks = 5,
  showTotalTime = true,
  isSelected = false,
  className,
}) => {
  const totalTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  const visibleTasks = tasks.slice(0, maxVisibleTasks);
  const hiddenCount = Math.max(0, tasks.length - maxVisibleTasks);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all border-2 bg-card",
        onClick && "cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        config.borderColor,
        className
      )}
    >
      <CardHeader className={cn("py-3 rounded-t-lg text-white", config.bgColor)}>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {config.icon}
            <div>
              <div className="font-bold text-white">{config.title}</div>
              <div className="text-xs font-normal opacity-80 text-white">
                {config.subtitle}
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
        <p className="text-xs text-muted-foreground mb-3 italic">
          {config.description}
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.length > 0 ? (
            <>
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    if (onTaskClick) {
                      e.stopPropagation();
                      onTaskClick(task);
                    }
                  }}
                  className={cn(
                    "p-3 border rounded-lg transition-all",
                    task.isCompleted ? "opacity-60 bg-muted" : "bg-card hover:shadow-sm",
                    onTaskClick && "cursor-pointer"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={cn(
                      "text-sm font-medium",
                      task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {task.name}
                    </h4>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(task.estimatedTime)}
                  </div>
                </div>
              ))}
              
              {hiddenCount > 0 && (
                <div className="text-center py-2 text-xs text-muted-foreground">
                  +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''} tâche{hiddenCount > 1 ? 's' : ''}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <div className="text-xs">Aucune tâche dans ce quadrant</div>
            </div>
          )}
        </div>

        {tasks.length > 0 && showTotalTime && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Total: {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
              </span>
              <span>{formatDuration(totalTime)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuadrantCard;
