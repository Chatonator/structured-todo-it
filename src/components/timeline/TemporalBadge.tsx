import React from 'react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, History, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TemporalBadgeProps {
  createdAt?: Date;
  completedAt?: Date;
  scheduledAt?: Date;
  isRecurring?: boolean;
  nextOccurrence?: Date;
  className?: string;
  variant?: 'compact' | 'full';
}

export const TemporalBadge: React.FC<TemporalBadgeProps> = ({
  createdAt,
  completedAt,
  scheduledAt,
  isRecurring,
  nextOccurrence,
  className,
  variant = 'compact'
}) => {
  const formatRelativeDate = (date: Date): string => {
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return "Hier";
    if (isTomorrow(date)) return "Demain";
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-1", className)}>
          {createdAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" />
                  {format(createdAt, 'd MMM', { locale: fr })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Créé {formatRelativeDate(createdAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {format(createdAt, 'PPpp', { locale: fr })}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {isRecurring && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-system-info flex items-center gap-0.5">
                  <RefreshCw className="w-2.5 h-2.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tâche récurrente</p>
                {nextOccurrence && (
                  <p className="text-xs text-muted-foreground">
                    Prochaine: {format(nextOccurrence, 'PPP', { locale: fr })}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}

          {completedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-system-success flex items-center gap-0.5">
                  <History className="w-2.5 h-2.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Terminé {formatRelativeDate(completedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {format(completedAt, 'PPpp', { locale: fr })}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full variant
  return (
    <div className={cn("space-y-2 text-xs", className)}>
      {createdAt && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>Créé le {format(createdAt, 'PPP', { locale: fr })}</span>
        </div>
      )}

      {scheduledAt && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Planifié {formatRelativeDate(scheduledAt)}</span>
        </div>
      )}

      {completedAt && (
        <div className="flex items-center gap-2 text-system-success">
          <History className="w-3.5 h-3.5" />
          <span>Terminé le {format(completedAt, 'PPP', { locale: fr })}</span>
        </div>
      )}

      {isRecurring && nextOccurrence && (
        <div className="flex items-center gap-2 text-system-info">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Prochaine occurrence: {format(nextOccurrence, 'PPP', { locale: fr })}</span>
        </div>
      )}
    </div>
  );
};

export default TemporalBadge;
