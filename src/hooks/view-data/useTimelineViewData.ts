import { useMemo, useState, useCallback } from 'react';
import { useTimeHub } from '@/hooks/useTimeHub';
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
    occurrences, 
    events, 
    loading, 
    completeEvent, 
    totalBusyTime, 
    totalFreeTime 
  } = useTimeHub(dateRange);

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
