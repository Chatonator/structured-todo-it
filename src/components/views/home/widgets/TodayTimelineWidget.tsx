import React, { useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CalendarClock, ArrowRight, Clock3 } from 'lucide-react';
import { ViewSection } from '@/components/layout/view';
import { Button } from '@/components/ui/button';
import { useTimeHub } from '@/hooks/useTimeHub';
import { useApp } from '@/contexts/AppContext';
import { formatDuration } from '@/lib/formatters';

const TodayTimelineWidget: React.FC = () => {
  const { setCurrentView } = useApp();
  const todayRange = useMemo(() => ({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  }), []);

  const { events, occurrences, loading } = useTimeHub(todayRange);

  const items = useMemo(() => {
    const eventById = new Map(events.map((event) => [event.id, event]));

    return occurrences
      .map((occurrence) => ({ occurrence, event: eventById.get(occurrence.eventId) }))
      .filter(({ event }) => event && event.entityType !== 'habit' && event.entityType !== 'recovery')
      .sort((left, right) => left.occurrence.startsAt.getTime() - right.occurrence.startsAt.getTime())
      .slice(0, 6);
  }, [events, occurrences]);

  return (
    <ViewSection
      title="Planning du jour"
      subtitle="Ce qui est deja pose dans votre timeline"
      icon={<CalendarClock className="w-5 h-5" />}
      variant="card"
      showViewAll
      viewAllLabel="Ouvrir la timeline"
      onViewAll={() => setCurrentView('timeline')}
    >
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Chargement du planning...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
          <p className="text-sm font-medium text-foreground">Aucun evenement planifie aujourd’hui</p>
          <p className="mt-1 text-sm text-muted-foreground">Planifiez depuis la timeline pour remplir votre journee.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setCurrentView('timeline')}>
            Aller a la timeline
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(({ occurrence, event }) => (
            <div key={occurrence.id} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Clock3 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-foreground">{event?.title}</p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(occurrence.startsAt, 'HH:mm')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDuration(event?.duration || 0)}
                  {event?.timeBlock ? ` · ${event.timeBlock}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ViewSection>
  );
};

export default TodayTimelineWidget;
