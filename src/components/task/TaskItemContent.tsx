
import React from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';
import { Clock } from 'lucide-react';
import { cssVarRGB } from '@/utils/colors';

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
        <h3 className="font-semibold text-theme-foreground text-sm leading-tight flex-1 min-w-0 line-clamp-3 break-words">
          {task.name}
        </h3>
      </div>
      
      {/* Informations détaillées - en mode étendu ou hover */}
      {isExtended && (
        <div className={`flex items-center justify-between transition-opacity duration-200 ${
          isExtended ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:delay-200'
        }`}>
          <div className="flex items-center gap-3 text-xs text-theme-muted">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(totalTime)}</span>
            </div>
            {hasSubTasks && (
              <span className="bg-theme-accent px-1.5 py-0.5 rounded">
                {subTasks.length} tâche{subTasks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Badges - plus compacts */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Badge contexte */}
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border"
              style={{
                backgroundColor: `${cssVarRGB(`--color-context-${task.context.toLowerCase()}`).replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
                borderColor: cssVarRGB(`--color-context-${task.context.toLowerCase()}`),
                color: cssVarRGB(`--color-context-${task.context.toLowerCase()}`)
              }}
            >
              {task.context}
            </span>
            {/* Badge priorité */}
            {subCategoryConfig && (
              <span 
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border"
                style={{
                  backgroundColor: `${cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`).replace('rgb(', 'rgba(').replace(')', ', 0.1)')}`,
                  borderColor: cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`),
                  color: cssVarRGB(`--color-priority-${subCategoryConfig.priority > 3 ? 'highest' : subCategoryConfig.priority > 2 ? 'high' : subCategoryConfig.priority > 1 ? 'medium' : 'low'}`)
                }}
              >
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
