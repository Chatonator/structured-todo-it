import { useMemo, useState, useCallback } from 'react';
import { useTimeHub } from '@/hooks/useTimeHub';
import { useProjects } from '@/hooks/useProjects';
import { startOfDay, endOfDay, addDays, format, isSameDay } from 'date-fns';
import { TimeOccurrence, TimeEvent } from '@/lib/time/types';

export type ViewMode = 'day' | 'week';

/**
 * Hook spécialisé pour les données de la TimelineView
 */
export const useTimelineViewData = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

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

  const { 
    occurrences: timeOccurrences, 
    events: timeEvents, 
    loading, 
    completeEvent, 
    totalBusyTime, 
    totalFreeTime 
  } = useTimeHub(dateRange);

  // Inject project deadlines as synthetic events/occurrences
  const { projects } = useProjects();

  const projectDeadlineEvents = useMemo<TimeEvent[]>(() => {
    return projects
      .filter(p => p.targetDate && p.status !== 'archived' && p.status !== 'completed')
      .map(p => ({
        id: `project-deadline-${p.id}`,
        entityType: 'reminder' as const,
        entityId: p.id,
        userId: p.userId,
        startsAt: startOfDay(p.targetDate!),
        endsAt: endOfDay(p.targetDate!),
        duration: 0,
        isAllDay: true,
        title: `📌 Deadline : ${p.name}`,
        description: p.description,
        color: p.color,
        status: 'scheduled' as const,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
  }, [projects]);

  const projectDeadlineOccurrences = useMemo<TimeOccurrence[]>(() => {
    return projectDeadlineEvents
      .filter(e => e.startsAt >= dateRange.start && e.startsAt <= dateRange.end)
      .map(e => ({
        id: `occ-${e.id}`,
        eventId: e.id,
        userId: e.userId,
        startsAt: e.startsAt,
        endsAt: e.endsAt!,
        status: 'pending' as const,
        createdAt: e.createdAt,
      }));
  }, [projectDeadlineEvents, dateRange]);

  // Merge
  const events = useMemo(() => [...timeEvents, ...projectDeadlineEvents], [timeEvents, projectDeadlineEvents]);
  const occurrences = useMemo(() => [...timeOccurrences, ...projectDeadlineOccurrences], [timeOccurrences, projectDeadlineOccurrences]);

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
    grouped.forEach((occs) => {
      occs.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    });

    return grouped;
  }, [occurrences]);

  // Statistiques
  const stats = useMemo(() => ({
    totalEvents: occurrences.length,
    completedEvents: occurrences.filter(o => o.status === 'completed').length,
    busyHours: Math.round(totalBusyTime / 60),
    freeHours: Math.round(totalFreeTime / 60)
  }), [occurrences, totalBusyTime, totalFreeTime]);

  // Navigation
  const handlePrevious = useCallback(() => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? -1 : -7));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setSelectedDate(prev => addDays(prev, viewMode === 'day' ? 1 : 7));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Helper pour obtenir un événement par ID
  const getEventById = useCallback((eventId: string): TimeEvent | undefined => {
    return events.find(e => e.id === eventId);
  }, [events]);

  return {
    data: {
      occurrences,
      occurrencesByDay,
      events,
      stats,
      selectedDate,
      dateRange
    },
    state: {
      loading,
      isEmpty: occurrences.length === 0,
      viewMode
    },
    actions: {
      completeEvent,
      handlePrevious,
      handleNext,
      handleToday,
      setViewMode: handleViewModeChange,
      getEventById
    }
  };
};

export type TimelineViewDataReturn = ReturnType<typeof useTimelineViewData>;
