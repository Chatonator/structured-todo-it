import React from 'react';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEvent } from '@/lib/time/types';
import { TimeBlockRow } from './TimeBlockRow';
import { Progress } from '@/components/ui/progress';
import { formatDuration } from '@/lib/formatters';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { QuotaSelector } from '@/components/timeline/QuotaSelector';

interface DayPlanningViewProps {
  date: Date;
  events: TimeEvent[];
  quota: number;
  onQuotaChange?: (minutes: number) => void;
  onCompleteEvent?: (eventId: string) => void;
  onRemoveEvent?: (eventId: string) => void;
  onEventClick?: (event: TimeEvent) => void;
}

/**
 * Vue jour améliorée avec blocs horizontaux
 * Meilleure utilisation de l'espace
 */
export const DayPlanningView: React.FC<DayPlanningViewProps> = ({
  date,
  events,
  quota,
  onQuotaChange,
  onCompleteEvent,
  onRemoveEvent,
  onEventClick
}) => {
  const isCurrentDay = isToday(date);
  
  // Stats
  const totalScheduled = events.reduce((sum, e) => sum + e.duration, 0);
  const completedCount = events.filter(e => e.status === 'completed').length;
  const completedTime = events
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.duration, 0);
  
  const progressPercent = quota > 0 ? Math.min((totalScheduled / quota) * 100, 100) : 0;
  const completionPercent = totalScheduled > 0 ? (completedTime / totalScheduled) * 100 : 0;
  const isOverQuota = totalScheduled > quota;
  const isComplete = completedCount === events.length && events.length > 0;

  return (
     <div className="flex flex-col gap-6 h-full">
      {/* Day header with stats */}
      <div className={cn(
        "p-4 rounded-xl border-2",
        isCurrentDay ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={cn(
              "text-2xl font-bold capitalize",
              isCurrentDay && "text-primary"
            )}>
              {format(date, 'EEEE d MMMM', { locale: fr })}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {events.length} tâche{events.length !== 1 ? 's' : ''} planifiée{events.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isComplete && (
              <div className="flex items-center gap-1.5 text-system-success bg-system-success/10 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Complété</span>
              </div>
            )}
            {isOverQuota && !isComplete && (
              <div className="flex items-center gap-1.5 text-system-warning bg-system-warning/10 px-3 py-1.5 rounded-full">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Surchargé</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-2 gap-4">
          {/* Quota progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Planifié
              </span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  isOverQuota ? "text-system-warning" : "text-foreground"
                )}>
                  {formatDuration(totalScheduled)} /
                </span>
                {onQuotaChange ? (
                  <QuotaSelector value={quota} onChange={onQuotaChange} />
                ) : (
                  <span className="font-medium">{formatDuration(quota)}</span>
                )}
              </div>
            </div>
            <Progress 
              value={progressPercent} 
              className={cn(
                "h-2",
                isOverQuota && "[&>div]:bg-system-warning"
              )}
            />
          </div>

          {/* Completion progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Complété
              </span>
              <span className="font-medium">
                {completedCount} / {events.length}
              </span>
            </div>
            <Progress 
              value={completionPercent} 
              className="h-2 [&>div]:bg-system-success"
            />
          </div>
        </div>
      </div>

      {/* Time blocks row */}
       <div className="flex-1 min-h-0">
         <TimeBlockRow
           date={date}
           events={events}
           onCompleteEvent={onCompleteEvent}
           onRemoveEvent={onRemoveEvent}
           onEventClick={onEventClick}
         />
       </div>
    </div>
  );
};

export default DayPlanningView;
