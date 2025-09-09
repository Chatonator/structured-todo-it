
import React from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';
import { RecurringTaskBadge } from '@/components/RecurringTaskBadge';
import { Clock } from 'lucide-react';

interface TaskItemContentProps {
  task: Task;
  subTasks: Task[];
  totalTime: number;
  isExtended: boolean;
}

const TaskItemContent: React.FC<TaskItemContentProps> = ({
  task,
  subTasks,
  totalTime,
  isExtended
}) => {
  const subCategoryConfig = task.subCategory ? SUB_CATEGORY_CONFIG[task.subCategory] : null;
  const contextConfig = CONTEXT_CONFIG[task.context];
  const hasSubTasks = subTasks.length > 0;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="flex-1 min-w-0 space-y-1">
      {/* Titre de la tâche - limité à 3 lignes */}
      <div className="flex items-start gap-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight flex-1 min-w-0 line-clamp-3 break-words">
          {task.name}
        </h3>
        {task.isRecurring && task.recurrenceInterval && (
          <RecurringTaskBadge recurrenceInterval={task.recurrenceInterval} />
        )}
      </div>
      
      {/* Informations détaillées - en mode étendu ou hover */}
      {isExtended && (
        <div className={`flex items-center justify-between transition-opacity duration-200 ${
          isExtended ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:delay-200'
        }`}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(totalTime)}</span>
            </div>
            {hasSubTasks && (
              <span className="bg-accent text-foreground px-1.5 py-0.5 rounded border border-border">
                {subTasks.length} tâche{subTasks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Badges - plus compacts avec couleurs harmonisées */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Badge contexte */}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${
              task.context === 'Pro' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-green-500/10 border-green-500 text-green-500'
            }`}>
              {task.context}
            </span>
            {/* Badge priorité */}
            {subCategoryConfig && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${
                subCategoryConfig.priority > 3 
                  ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                  : subCategoryConfig.priority > 2 
                    ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                    : subCategoryConfig.priority > 1 
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                      : 'bg-gray-500/10 border-gray-500 text-gray-500'
              }`}>
                {subCategoryConfig.priority}★
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItemContent;
