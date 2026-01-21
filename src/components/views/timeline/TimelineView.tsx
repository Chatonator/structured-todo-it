import React from 'react';
import { ViewLayout } from '@/components/layout/view';
import { ViewStats } from '@/components/layout/view/ViewStats';
import { useTimelineViewData } from '@/hooks/view-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatDuration } from '@/lib/formatters';
import { getTimelineStatusClasses } from '@/lib/styling';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  className?: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ className }) => {
  const { data, state, actions } = useTimelineViewData();

  const stats = [
    {
      id: 'events',
      label: 'Événements',
      value: data.stats.totalEvents,
      icon: <Calendar className="w-4 h-4" />
    },
    {
      id: 'completed',
      label: 'Terminés',
      value: data.stats.completedEvents,
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'busy',
      label: 'Heures occupées',
      value: `${data.stats.busyHours}h`,
      icon: <Clock className="w-4 h-4" />
    }
  ];

  return (
    <ViewLayout
      header={{
        title: "Timeline",
        subtitle: "Visualisez votre planning",
        icon: <Calendar className="w-5 h-5" />
      }}
      state={state.loading ? 'loading' : 'success'}
      className={className}
    >
      <div className="space-y-6 pb-20 md:pb-6">
        <ViewStats stats={stats} columns={3} />
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={actions.handlePrevious}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {state.viewMode === 'day' ? 'Jour précédent' : 'Semaine précédente'}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={actions.handleToday}>
              Aujourd'hui
            </Button>
            <span className="font-medium">
              {format(data.selectedDate, state.viewMode === 'day' ? 'EEEE d MMMM' : "'Semaine du' d MMMM", { locale: fr })}
            </span>
          </div>
          
          <Button variant="outline" size="sm" onClick={actions.handleNext}>
            {state.viewMode === 'day' ? 'Jour suivant' : 'Semaine suivante'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2">
          <Button 
            variant={state.viewMode === 'day' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => actions.setViewMode('day')}
          >
            Jour
          </Button>
          <Button 
            variant={state.viewMode === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => actions.setViewMode('week')}
          >
            Semaine
          </Button>
        </div>

        {/* Timeline content */}
        {state.isEmpty ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Aucun événement prévu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(data.occurrencesByDay.entries()).map(([dayKey, occurrences]) => (
              <Card key={dayKey}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {format(new Date(dayKey), 'EEEE d MMMM', { locale: fr })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {occurrences.map(occ => {
                    const event = actions.getEventById(occ.eventId);
                    const duration = occ.endsAt ? differenceInMinutes(occ.endsAt, occ.startsAt) : 0;
                    
                    return (
                      <div 
                        key={occ.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          getTimelineStatusClasses(occ.status as any)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">
                            {format(occ.startsAt, 'HH:mm')}
                            {occ.endsAt && ` - ${format(occ.endsAt, 'HH:mm')}`}
                          </div>
                          <div>
                            <p className="font-medium">{event?.title || 'Événement'}</p>
                            {duration > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(duration)}
                              </p>
                            )}
                          </div>
                        </div>
                        {occ.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-system-success" />
                        ) : occ.status === 'missed' ? (
                          <XCircle className="w-5 h-5 text-system-error" />
                        ) : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ViewLayout>
  );
};

export default TimelineView;
