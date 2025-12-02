/**
 * TimelineView - Vue unifiée de tous les événements temporels
 * Affiche tasks, habits, et autres événements dans une timeline
 */

import React, { useState, useMemo } from 'react';
import { useTimeHub } from '@/hooks/useTimeHub';
import { format, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeOccurrence } from '@/lib/time/types';

const TimelineView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Calculer le range selon le mode
  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      return {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate)
      };
    } else {
      return {
        start: startOfDay(selectedDate),
        end: endOfDay(addDays(selectedDate, 6))
      };
    }
  }, [selectedDate, viewMode]);

  const { occurrences, events, loading, completeEvent, totalBusyTime, totalFreeTime } = useTimeHub(dateRange);

  // Grouper les occurrences par jour
  const occurrencesByDay = useMemo(() => {
    const grouped = new Map<string, TimeOccurrence[]>();
    
    occurrences.forEach(occ => {
      const dayKey = format(occ.startsAt, 'yyyy-MM-dd');
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(occ);
    });

    // Trier par heure dans chaque jour
    grouped.forEach((occs, day) => {
      occs.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });

    return grouped;
  }, [occurrences]);

  const handlePrevious = () => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? -1 : -7));
  };

  const handleNext = () => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? 1 : 7));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📝';
      case 'habit': return '💪';
      case 'challenge': return '🏆';
      default: return '📌';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'pending': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'skipped': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'missed': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const renderOccurrence = (occurrence: TimeOccurrence) => {
    const event = events.find(e => e.id === occurrence.eventId);
    if (!event) return null;

    const isCompleted = occurrence.status === 'completed';
    const duration = Math.round((occurrence.endsAt.getTime() - occurrence.startsAt.getTime()) / 60000);

    return (
      <Card
        key={occurrence.id}
        className={cn(
          "p-4 mb-2 border-l-4 hover:shadow-md transition-all cursor-pointer",
          event.color || "border-l-primary"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getEventTypeIcon(event.entityType)}</span>
              <h3 className={cn(
                "font-medium",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {event.title}
              </h3>
              <Badge variant="outline" className={getStatusColor(occurrence.status)}>
                {occurrence.status}
              </Badge>
            </div>
            
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(occurrence.startsAt, 'HH:mm', { locale: fr })}</span>
                <span>-</span>
                <span>{format(occurrence.endsAt, 'HH:mm', { locale: fr })}</span>
              </div>
              <span>•</span>
              <span>{duration} min</span>
              {event.priority && (
                <>
                  <span>•</span>
                  <span>Priorité {event.priority}</span>
                </>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant={isCompleted ? "outline" : "default"}
            onClick={async () => {
              if (!isCompleted) {
                await completeEvent(occurrence.eventId);
              }
            }}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Complété
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 mr-1" />
                Compléter
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  };

  const renderDayColumn = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const dayOccurrences = occurrencesByDay.get(dayKey) || [];
    const isToday = isSameDay(date, new Date());

    return (
      <div key={dayKey} className="flex-1 min-w-0">
        <div className={cn(
          "sticky top-0 bg-background z-10 pb-3 border-b mb-4",
          isToday && "border-primary"
        )}>
          <h3 className={cn(
            "font-semibold text-lg capitalize",
            isToday && "text-primary"
          )}>
            {format(date, 'EEEE d MMMM', { locale: fr })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dayOccurrences.length} événement{dayOccurrences.length !== 1 ? 's' : ''}
          </p>
        </div>

        {dayOccurrences.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aucun événement</p>
          </div>
        ) : (
          <div>
            {dayOccurrences.map(renderOccurrence)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de la timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header avec navigation */}
      <div className="bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-2xl font-bold">
            {viewMode === 'day'
              ? format(selectedDate, 'd MMMM yyyy', { locale: fr })
              : `Semaine du ${format(selectedDate, 'd MMMM', { locale: fr })}`
            }
          </h2>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Jour
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semaine
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">{occurrences.length}</span>
            <span className="text-muted-foreground">événements</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{Math.round(totalBusyTime / 60)}h</span>
            <span className="text-muted-foreground">occupé</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{Math.round(totalFreeTime / 60)}h</span>
            <span className="text-muted-foreground">libre</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {occurrences.filter(o => o.status === 'completed').length}
            </span>
            <span className="text-muted-foreground">complétés</span>
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'day' ? (
          renderDayColumn(selectedDate)
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
            {Array.from({ length: 7 }, (_, i) => renderDayColumn(addDays(selectedDate, i)))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
