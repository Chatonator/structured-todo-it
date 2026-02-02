import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TimeEvent } from '@/lib/time/types';
import { formatDuration } from '@/lib/formatters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Calendar, Clock, RotateCcw, Trash2 } from 'lucide-react';

interface OverdueTasksAlertProps {
  events: TimeEvent[];
  onReschedule?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
  onRescheduleAll?: () => void;
  className?: string;
}

export const OverdueTasksAlert: React.FC<OverdueTasksAlertProps> = ({
  events,
  onReschedule,
  onCancel,
  onRescheduleAll,
  className
}) => {
  if (events.length === 0) return null;

  const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);

  return (
    <Alert 
      variant="destructive" 
      className={cn("border-system-warning/50 bg-system-warning/10", className)}
    >
      <AlertTriangle className="h-4 w-4 text-system-warning" />
      <AlertTitle className="text-system-warning flex items-center gap-2">
        Tâches en retard
        <span className="text-xs font-normal text-muted-foreground">
          ({events.length} tâche{events.length > 1 ? 's' : ''} • {formatDuration(totalDuration)})
        </span>
      </AlertTitle>
      
      <AlertDescription className="mt-2 space-y-2">
        {/* Task list */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {events.slice(0, 5).map(event => (
            <div 
              key={event.id}
              className="flex items-center justify-between gap-2 p-1.5 rounded bg-background/50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{event.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {format(event.startsAt, 'dd/MM', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDuration(event.duration)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onReschedule?.(event.id)}
                  title="Replanifier"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => onCancel?.(event.id)}
                  title="Annuler"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
          
          {events.length > 5 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              ... et {events.length - 5} autre{events.length - 5 > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Bulk action */}
        {events.length > 1 && onRescheduleAll && (
          <div className="flex justify-end pt-1 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onRescheduleAll}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Tout replanifier
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default OverdueTasksAlert;
