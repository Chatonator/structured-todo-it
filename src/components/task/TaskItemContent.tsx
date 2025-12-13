import React, { useEffect, useState } from 'react';
import { Task, CATEGORY_CONFIG, SUB_CATEGORY_CONFIG, CONTEXT_CONFIG } from '@/types/task';
import { RecurringTaskBadge } from '@/components/RecurringTaskBadge';
import { Clock, Calendar } from 'lucide-react';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';
import { TimeEvent } from '@/lib/time/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const hasSubTasks = subTasks.length > 0;
  const { getEntityEvent } = useTimeEventSync();
  const [timeEvent, setTimeEvent] = useState<TimeEvent | null>(null);

  // Charger l'événement temporel associé
  useEffect(() => {
    const loadTimeEvent = async () => {
      const event = await getEntityEvent('task', task.id);
      setTimeEvent(event);
    };
    loadTimeEvent();
  }, [task.id, getEntityEvent]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  // Utiliser les données de time_event uniquement
  const isScheduled = !!timeEvent?.startsAt;
  const isRecurring = !!timeEvent?.recurrence;

  return (
    <div className="flex-1 min-w-0 space-y-1">
      {/* Titre de la tâche + badge récurrent */}
      <div className="flex items-start gap-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight flex-1 min-w-0 line-clamp-3 break-words">
          {task.name}
        </h3>
        {isRecurring && timeEvent?.recurrence?.frequency && (
          <RecurringTaskBadge 
            recurrenceInterval={timeEvent.recurrence.frequency as any} 
            className="flex-shrink-0"
          />
        )}
      </div>
      
      {/* Informations détaillées */}
      {isExtended && (
        <div className={`flex items-center justify-between transition-opacity duration-200 ${
          isExtended ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:delay-200'
        }`}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(totalTime)}</span>
            </div>
            {isScheduled && timeEvent && (
              <div className="flex items-center gap-1 text-primary">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(timeEvent.startsAt, 'd MMM', { locale: fr })}
                  {!timeEvent.isAllDay && (
                    <> à {format(timeEvent.startsAt, 'HH:mm')}</>
                  )}
                </span>
              </div>
            )}
            {hasSubTasks && (
              <span className="bg-accent text-foreground px-1.5 py-0.5 rounded border border-border">
                {subTasks.length} tâche{subTasks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Badge contexte */}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${
              task.context === 'Pro' ? 'bg-context-pro/10 border-context-pro text-context-pro' : 'bg-context-perso/10 border-context-perso text-context-perso'
            }`}>
              {task.context}
            </span>
            {/* Badge priorité */}
            {subCategoryConfig && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${
                subCategoryConfig.priority > 3 
                  ? 'bg-priority-highest/10 border-priority-highest text-priority-highest'
                  : subCategoryConfig.priority > 2 
                    ? 'bg-priority-high/10 border-priority-high text-priority-high'
                    : subCategoryConfig.priority > 1 
                      ? 'bg-priority-medium/10 border-priority-medium text-priority-medium'
                      : 'bg-priority-low/10 border-priority-low text-priority-low'
              }`}>
                {subCategoryConfig.priority}★
              </span>
            )}
            {/* Badge statut time_event */}
            {timeEvent && timeEvent.status === 'completed' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border bg-green-500/10 border-green-500 text-green-600">
                ✓
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItemContent;
