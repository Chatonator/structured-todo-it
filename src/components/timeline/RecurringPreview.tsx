import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import { TimeEvent, RecurrenceConfig } from '@/lib/time/types';

interface RecurringPreviewProps {
  event: TimeEvent;
  completedDates?: Date[];
  maxOccurrences?: number;
  className?: string;
}

/**
 * Calcule les prochaines occurrences d'un événement récurrent
 */
const getNextOccurrences = (
  event: TimeEvent, 
  count: number = 5
): Date[] => {
  if (!event.recurrence) return [];

  const occurrences: Date[] = [];
  let currentDate = new Date(event.startsAt);
  const { frequency, interval, daysOfWeek, daysOfMonth } = event.recurrence;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today if event started in the past
  if (currentDate < today) {
    currentDate = new Date(today);
  }

  let attempts = 0;
  const maxAttempts = 365; // Prevent infinite loops

  while (occurrences.length < count && attempts < maxAttempts) {
    attempts++;

    // Check if current date matches the recurrence pattern
    let isMatch = false;

    switch (frequency) {
      case 'daily':
        isMatch = true;
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          isMatch = daysOfWeek.includes(currentDate.getDay());
        } else {
          isMatch = currentDate.getDay() === event.startsAt.getDay();
        }
        break;
      case 'bi-weekly':
        // Every 2 weeks on the same day
        const weeksDiff = Math.floor((currentDate.getTime() - event.startsAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
        isMatch = weeksDiff % 2 === 0 && currentDate.getDay() === event.startsAt.getDay();
        break;
      case 'monthly':
        if (daysOfMonth && daysOfMonth.length > 0) {
          isMatch = daysOfMonth.includes(currentDate.getDate());
        } else {
          isMatch = currentDate.getDate() === event.startsAt.getDate();
        }
        break;
      default:
        isMatch = true;
    }

    if (isMatch && currentDate >= today) {
      occurrences.push(new Date(currentDate));
    }

    // Move to next potential date
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval || 1);
        break;
      case 'weekly':
      case 'bi-weekly':
        currentDate = addDays(currentDate, 1);
        break;
      case 'monthly':
        currentDate = addDays(currentDate, 1);
        break;
      default:
        currentDate = addDays(currentDate, 1);
    }
  }

  return occurrences;
};

export const RecurringPreview: React.FC<RecurringPreviewProps> = ({
  event,
  completedDates = [],
  maxOccurrences = 5,
  className
}) => {
  const nextOccurrences = useMemo(() => 
    getNextOccurrences(event, maxOccurrences),
    [event, maxOccurrences]
  );

  const isDateCompleted = (date: Date): boolean => {
    return completedDates.some(d => isSameDay(d, date));
  };

  if (!event.recurrence || nextOccurrences.length === 0) {
    return null;
  }

  const frequencyLabels: Record<string, string> = {
    'daily': 'Quotidien',
    'weekly': 'Hebdomadaire',
    'bi-weekly': 'Bi-mensuel',
    'monthly': 'Mensuel',
    'yearly': 'Annuel',
    'custom': 'Personnalisé'
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm">
        <RefreshCw className="w-4 h-4 text-system-info" />
        <span className="font-medium">
          {frequencyLabels[event.recurrence.frequency] || 'Récurrent'}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground mb-2">
          Prochaines {maxOccurrences} occurrences:
        </p>
        
        <div className="grid gap-1">
          {nextOccurrences.map((date, index) => {
            const isCompleted = isDateCompleted(date);
            const isFirst = index === 0;
            
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded text-xs",
                  isFirst && "bg-primary/10 font-medium",
                  isCompleted && "bg-system-success/10"
                )}
              >
                <Calendar className={cn(
                  "w-3.5 h-3.5",
                  isFirst ? "text-primary" : "text-muted-foreground",
                  isCompleted && "text-system-success"
                )} />
                
                <span className={cn(
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                </span>
                
                {isCompleted && (
                  <CheckCircle className="w-3.5 h-3.5 text-system-success ml-auto" />
                )}
                
                {isFirst && !isCompleted && (
                  <span className="ml-auto text-[10px] text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                    Prochaine
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecurringPreview;
