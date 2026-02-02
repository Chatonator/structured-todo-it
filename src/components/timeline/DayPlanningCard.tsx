import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, isSameDay, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEvent, TimeBlock, TIME_BLOCKS } from '@/lib/time/types';
import { TimeBlockDropZone } from './TimeBlockDropZone';
import { QuotaSelector } from './QuotaSelector';
import { formatDuration } from '@/lib/formatters';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DayPlanningCardProps {
  date: Date;
  quota: number; // in minutes
  events: TimeEvent[];
  onDropTask?: (taskId: string, block: TimeBlock, date: Date) => void;
  onRemoveTask?: (eventId: string) => void;
  onCompleteEvent?: (eventId: string) => void;
  onEventClick?: (event: TimeEvent) => void;
  onQuotaChange?: (minutes: number) => void;
  compact?: boolean;
  className?: string;
}

export const DayPlanningCard: React.FC<DayPlanningCardProps> = ({
  date,
  quota,
  events,
  onDropTask,
  onRemoveTask,
  onCompleteEvent,
  onEventClick,
  onQuotaChange,
  compact = false,
  className
}) => {
  const isCurrentDay = isToday(date);
  const isPastDay = isPast(date) && !isCurrentDay;

  // Group events by time block
  const eventsByBlock = useMemo(() => {
    const grouped: Record<TimeBlock, TimeEvent[]> = {
      morning: [],
      afternoon: [],
      evening: []
    };

    events.forEach(event => {
      // Use timeBlock if set, otherwise infer from startsAt hour
      let block: TimeBlock = 'morning';
      
      if (event.timeBlock) {
        block = event.timeBlock;
      } else {
        const hour = event.startsAt.getHours();
        if (hour >= TIME_BLOCKS.evening.startHour) {
          block = 'evening';
        } else if (hour >= TIME_BLOCKS.afternoon.startHour) {
          block = 'afternoon';
        }
      }
      
      grouped[block].push(event);
    });

    return grouped;
  }, [events]);

  // Calculate totals
  const totalScheduled = events.reduce((sum, e) => sum + e.duration, 0);
  const completedCount = events.filter(e => e.status === 'completed').length;
  const progressPercent = quota > 0 ? Math.min((totalScheduled / quota) * 100, 100) : 0;
  const isOverQuota = totalScheduled > quota;
  const isComplete = totalScheduled >= quota && completedCount === events.length;

  return (
    <Card className={cn(
      "transition-all",
      isCurrentDay && "ring-2 ring-primary/50",
      isPastDay && "opacity-70",
      compact && "p-2",
      className
    )}>
      <CardHeader className={cn("pb-2", compact && "p-2 pb-1")}>
        <div className="flex items-center justify-between">
          <div>
            <div className={cn(
              "font-semibold",
              compact ? "text-xs" : "text-sm",
              isCurrentDay && "text-primary"
            )}>
              {format(date, compact ? 'EEE' : 'EEEE', { locale: fr })}
            </div>
            <div className={cn(
              "text-muted-foreground",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {format(date, 'd MMMM', { locale: fr })}
            </div>
          </div>
          
          {!compact && onQuotaChange && (
            <QuotaSelector 
              value={quota} 
              onChange={onQuotaChange}
            />
          )}
        </div>

        {/* Progress indicator */}
        <div className="space-y-1 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {formatDuration(totalScheduled)} / {formatDuration(quota)}
            </span>
            {isComplete && (
              <CheckCircle className="w-4 h-4 text-system-success" />
            )}
            {isOverQuota && !isComplete && (
              <AlertTriangle className="w-4 h-4 text-system-warning" />
            )}
          </div>
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-1.5",
              isOverQuota && "[&>div]:bg-system-warning"
            )}
          />
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-2", compact && "p-2 pt-0")}>
        {(Object.keys(TIME_BLOCKS) as TimeBlock[]).map(block => (
          <TimeBlockDropZone
            key={block}
            block={block}
            date={date}
            events={eventsByBlock[block]}
            onDrop={(taskId) => onDropTask?.(taskId, block, date)}
            onRemoveEvent={onRemoveTask}
            onCompleteEvent={onCompleteEvent}
            onEventClick={onEventClick}
            compact={compact}
            disabled={isPastDay}
          />
        ))}

        {/* Empty state for past days */}
        {isPastDay && events.length === 0 && (
          <div className="text-center py-2 text-xs text-muted-foreground">
            Aucune tâche planifiée
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayPlanningCard;
