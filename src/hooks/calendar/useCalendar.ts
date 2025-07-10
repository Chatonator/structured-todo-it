
import { useState, useMemo } from 'react';
import { Task, CalendarView, CalendarEvent, CALENDAR_VIEWS } from '@/types/task';
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
  parseISO,
  setHours,
  setMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Hook pour la gestion du calendrier
 */
export const useCalendar = (tasks: Task[]) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>(CALENDAR_VIEWS.WEEK);

  // Navigation dans le calendrier
  const navigatePrevious = () => {
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
    }
  };

  const navigateNext = () => {
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
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

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
      default:
        return {
          start: startOfWeek(currentDate, { locale: fr }),
          end: endOfWeek(currentDate, { locale: fr })
        };
    }
  }, [currentDate, currentView]);

  // Conversion des tâches planifiées en événements calendrier
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return tasks
      .filter(task => task.scheduledDate && task.scheduledTime && !task.isCompleted)
      .map(task => {
        const scheduledDate = task.scheduledDate!;
        const [hours, minutes] = task.scheduledTime!.split(':').map(Number);
        
        const startTime = setMinutes(setHours(scheduledDate, hours), minutes);
        const duration = task.duration || task.estimatedTime;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        return {
          id: task.id,
          task,
          startTime,
          endTime,
          duration
        };
      })
      .filter(event => 
        event.startTime >= visibleDateRange.start && 
        event.startTime <= visibleDateRange.end
      );
  }, [tasks, visibleDateRange]);

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
      default:
        return '';
    }
  }, [currentDate, currentView]);

  // Vérifier si une tâche peut être planifiée à un moment donné
  const canScheduleTask = (task: Task, date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const proposedStart = setMinutes(setHours(date, hours), minutes);
    const proposedEnd = new Date(proposedStart.getTime() + task.estimatedTime * 60000);

    // Vérifier les conflits avec les événements existants
    return !calendarEvents.some(event => 
      isSameDay(event.startTime, date) &&
      ((proposedStart >= event.startTime && proposedStart < event.endTime) ||
       (proposedEnd > event.startTime && proposedEnd <= event.endTime) ||
       (proposedStart <= event.startTime && proposedEnd >= event.endTime))
    );
  };

  return {
    currentDate,
    currentView,
    setCurrentView,
    navigatePrevious,
    navigateNext,
    navigateToday,
    visibleDateRange,
    calendarEvents,
    viewTitle,
    canScheduleTask
  };
};
