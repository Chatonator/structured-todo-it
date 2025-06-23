
import React from 'react';
import { Task } from '@/types/task';
import { useCalendar } from '@/hooks/useCalendar';
import { useTasks } from '@/hooks/useTasks';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { WeekView } from '@/components/calendar/WeekView';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const { scheduleTask } = useTasks();
  const {
    currentDate,
    currentView,
    setCurrentView,
    navigatePrevious,
    navigateNext,
    navigateToday,
    calendarEvents,
    viewTitle,
    canScheduleTask
  } = useCalendar(tasks);

  const handleTimeSlotClick = (date: Date, time: string) => {
    console.log('Clic sur le créneau:', date, time);
    // TODO: Implémenter la logique de planification via drag & drop
  };

  const handleEventClick = (event: any) => {
    console.log('Clic sur l\'événement:', event);
    // TODO: Ouvrir modal d'édition de l'événement
  };

  return (
    <div className="h-full flex flex-col">
      <CalendarToolbar
        currentView={currentView}
        onViewChange={setCurrentView}
        viewTitle={viewTitle}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
        onNavigateToday={navigateToday}
      />

      <div className="flex-1 bg-theme-background rounded-lg border border-theme-border overflow-hidden">
        {currentView === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={calendarEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
        
        {currentView !== 'week' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-theme-foreground mb-2">
                Vue {currentView} en développement
              </h3>
              <p className="text-theme-muted">
                Cette vue sera disponible prochainement
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
