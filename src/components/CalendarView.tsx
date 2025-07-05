
import React, { useState } from 'react';
import { Task } from '@/types/task';
import { useCalendar } from '@/hooks/useCalendar';
import { useTasks } from '@/hooks/useTasks';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const { scheduleTaskWithTime } = useTasks();
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  
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

  // Filtrer les tâches actives non planifiées
  const availableTasks = tasks.filter(task => 
    !task.isCompleted && 
    !task.startTime && 
    !task.duration &&
    task.level === 0 // Seulement les tâches principales
  );

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date, time });
    setIsTaskListOpen(true);
  };

  const handleEventClick = (event: any) => {
    console.log('Clic sur l\'événement:', event);
    // TODO: Ouvrir modal d'édition de l'événement
  };

  const handleTaskSelect = (task: Task) => {
    if (selectedSlot) {
      const startTime = new Date(`${selectedSlot.date.toISOString().split('T')[0]}T${selectedSlot.time}:00`);
      scheduleTaskWithTime(task.id, startTime, task.estimatedTime);
      console.log('Tâche planifiée:', task.name, 'à', selectedSlot.time, 'le', selectedSlot.date.toLocaleDateString());
    }
    setIsTaskListOpen(false);
    setSelectedSlot(null);
  };

  const handleCloseTaskList = () => {
    setIsTaskListOpen(false);
    setSelectedSlot(null);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <>
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
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
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

      {/* Modal de sélection de tâche */}
      <Dialog open={isTaskListOpen} onOpenChange={handleCloseTaskList}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Planifier une tâche
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedSlot && (
                <>
                  {selectedSlot.date.toLocaleDateString('fr-FR')} à {selectedSlot.time}
                </>
              )}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {availableTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Aucune tâche disponible à planifier
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {availableTasks.map(task => (
                    <Button
                      key={task.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleTaskSelect(task)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{task.category}</span>
                          <span>•</span>
                          <span>{formatDuration(task.estimatedTime)}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCloseTaskList}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarView;
