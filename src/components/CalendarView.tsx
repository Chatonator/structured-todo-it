
import React from 'react';
import { Task } from '@/types/task';
import { useCalendar } from '@/hooks/useCalendar';
import { useTasks } from '@/hooks/useTasks';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';

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

  // Tâches non planifiées pour la vue jour
  const unscheduledTasks = tasks.filter(task => 
    !task.isCompleted && 
    !task.scheduledDate && 
    task.level === 0 // Seulement les tâches principales
  );

  const handleTimeSlotClick = (date: Date, time: string) => {
    console.log('Clic sur le créneau:', date, time);
    // TODO: Ouvrir modal de sélection de tâche
  };

  const handleEventClick = (event: any) => {
    console.log('Clic sur l\'événement:', event);
    // TODO: Ouvrir modal d'édition de l'événement
  };

  const handleScheduleTask = (taskId: string, date: Date, time: string) => {
    scheduleTask(taskId, date,);
    console.log('Tâche planifiée:', taskId, 'à', time, 'le', date);
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

        {currentView === 'day' && (
          <DayView
            currentDate={currentDate}
            events={calendarEvents}
            unscheduledTasks={unscheduledTasks}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleTask={handleScheduleTask}
          />
        )}
        
        {!['week', 'day'].includes(currentView) && (
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
