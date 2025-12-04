/**
 * useCalendar - Hook unifié pour la gestion du calendrier
 * Utilise time_events comme source de vérité unique
 */

import { useState, useMemo, useCallback } from 'react';
import { CalendarView, CalendarEvent, CALENDAR_VIEWS } from '@/types/task';
import { useTimeHub } from '@/hooks/useTimeHub';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
  isSameDay,
  setHours,
  setMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { TimeEvent } from '@/lib/time/types';

/**
 * Hook pour la gestion du calendrier basé sur time_events
 */
export const useCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>(CALENDAR_VIEWS.WEEK);

  // Calcul des dates visibles selon la vue
  const visibleDateRange = useMemo(() => {
    switch (currentView) {
      case CALENDAR_VIEWS.DAY:
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      case CALENDAR_VIEWS.WEEK:
        return {
          start: startOfWeek(currentDate, { locale: fr }),
          end: endOfWeek(currentDate, { locale: fr })
        };
      case CALENDAR_VIEWS.MONTH:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        };
      case CALENDAR_VIEWS.THREE_MONTHS:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(addMonths(currentDate, 2))
        };
      case CALENDAR_VIEWS.SIX_MONTHS:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(addMonths(currentDate, 5))
        };
      default:
        return {
          start: startOfWeek(currentDate, { locale: fr }),
          end: endOfWeek(currentDate, { locale: fr })
        };
    }
  }, [currentDate, currentView]);

  // Utiliser useTimeHub avec le range visible
  const { 
    events, 
    occurrences, 
    loading, 
    checkConflicts,
    updateEvent,
    completeEvent 
  } = useTimeHub(visibleDateRange);

  // Navigation dans le calendrier
  const navigatePrevious = useCallback(() => {
    switch (currentView) {
      case CALENDAR_VIEWS.DAY:
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case CALENDAR_VIEWS.WEEK:
        setCurrentDate(prev => addWeeks(prev, -1));
        break;
      case CALENDAR_VIEWS.MONTH:
        setCurrentDate(prev => addMonths(prev, -1));
        break;
      case CALENDAR_VIEWS.THREE_MONTHS:
        setCurrentDate(prev => addMonths(prev, -3));
        break;
      case CALENDAR_VIEWS.SIX_MONTHS:
        setCurrentDate(prev => addMonths(prev, -6));
        break;
    }
  }, [currentView]);

  const navigateNext = useCallback(() => {
    switch (currentView) {
      case CALENDAR_VIEWS.DAY:
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case CALENDAR_VIEWS.WEEK:
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case CALENDAR_VIEWS.MONTH:
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case CALENDAR_VIEWS.THREE_MONTHS:
        setCurrentDate(prev => addMonths(prev, 3));
        break;
      case CALENDAR_VIEWS.SIX_MONTHS:
        setCurrentDate(prev => addMonths(prev, 6));
        break;
    }
  }, [currentView]);

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Conversion des time_events en CalendarEvent pour compatibilité
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return events
      .filter(event => event.status !== 'completed' && event.status !== 'cancelled')
      .map(event => {
        const startTime = event.startsAt;
        const duration = event.duration || 30;
        const endTime = event.endsAt || new Date(startTime.getTime() + duration * 60000);

        return {
          id: event.id,
          task: {
            id: event.entityId,
            name: event.title,
            category: 'Autres' as any,
            context: 'Pro' as any,
            estimatedTime: duration,
            createdAt: event.createdAt,
            level: 0 as const,
            isExpanded: true,
            isCompleted: event.status === 'completed',
            scheduledDate: startTime,
            scheduledTime: format(startTime, 'HH:mm'),
            duration,
            startTime: startTime
          },
          startTime,
          endTime,
          duration,
          // Infos supplémentaires du TimeEvent
          entityType: event.entityType,
          color: event.color,
          isAllDay: event.isAllDay
        };
      });
  }, [events]);

  // Formatage du titre selon la vue
  const viewTitle = useMemo(() => {
    switch (currentView) {
      case CALENDAR_VIEWS.DAY:
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr });
      case CALENDAR_VIEWS.WEEK:
        const weekStart = startOfWeek(currentDate, { locale: fr });
        const weekEnd = endOfWeek(currentDate, { locale: fr });
        return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
      case CALENDAR_VIEWS.MONTH:
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      case CALENDAR_VIEWS.THREE_MONTHS:
        const end3Months = addMonths(currentDate, 2);
        return `${format(currentDate, 'MMM', { locale: fr })} - ${format(end3Months, 'MMM yyyy', { locale: fr })}`;
      case CALENDAR_VIEWS.SIX_MONTHS:
        const end6Months = addMonths(currentDate, 5);
        return `${format(currentDate, 'MMM', { locale: fr })} - ${format(end6Months, 'MMM yyyy', { locale: fr })}`;
      default:
        return '';
    }
  }, [currentDate, currentView]);

  // Vérifier si un événement peut être planifié à un moment donné
  const canScheduleEvent = useCallback((duration: number, date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const proposedStart = setMinutes(setHours(date, hours), minutes);
    const proposedEnd = new Date(proposedStart.getTime() + duration * 60000);

    // Créer un événement temporaire pour vérifier les conflits
    const tempEvent: TimeEvent = {
      id: 'temp',
      entityType: 'task',
      entityId: 'temp',
      userId: '',
      startsAt: proposedStart,
      endsAt: proposedEnd,
      duration,
      isAllDay: false,
      title: 'Temp',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const conflicts = checkConflicts(tempEvent);
    return conflicts.length === 0;
  }, [checkConflicts]);

  // Replanifier un événement (pour drag & drop)
  const rescheduleEvent = useCallback(async (eventId: string, newDate: Date, newTime?: string): Promise<boolean> => {
    const newStartsAt = newTime 
      ? setMinutes(setHours(newDate, parseInt(newTime.split(':')[0])), parseInt(newTime.split(':')[1]))
      : newDate;
    
    return await updateEvent(eventId, { startsAt: newStartsAt });
  }, [updateEvent]);

  return {
    // State
    currentDate,
    currentView,
    visibleDateRange,
    loading,
    
    // Navigation
    setCurrentView,
    setCurrentDate,
    navigatePrevious,
    navigateNext,
    navigateToday,
    
    // Data
    events,
    calendarEvents,
    occurrences,
    viewTitle,
    
    // Actions
    canScheduleEvent,
    rescheduleEvent,
    completeEvent,
    checkConflicts
  };
};
