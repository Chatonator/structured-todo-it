
import React, { useState } from 'react';
import { Task } from '@/types/task';
import { useCalendar } from '@/hooks/useCalendar';
import { useTasks } from '@/hooks/useTasks';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock } from 'lucide-react';
import { CATEGORY_CONFIG } from '@/types/task';
import { cssVarRGB } from '@/utils/colors';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const { scheduleTaskWithTime } = useTasks();
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'duration' | 'category'>('duration');
  
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

  // Filtrer et trier les tâches selon les critères
  const filteredAndSortedTasks = availableTasks
    .filter(task => 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'duration') {
        return a.estimatedTime - b.estimatedTime;
      } else {
        return a.category.localeCompare(b.category);
      }
    });

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedSlot({ date, time });
    setIsTaskListOpen(true);
    setSearchTerm('');
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
    setSearchTerm('');
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

      {/* Modal de sélection de tâche améliorée */}
      <Dialog open={isTaskListOpen} onOpenChange={handleCloseTaskList}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
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

          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Contrôles de recherche et tri */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une tâche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={(value: 'duration' | 'category') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duration">Trier par durée</SelectItem>
                  <SelectItem value="category">Trier par catégorie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des tâches avec scroll */}
            {filteredAndSortedTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Aucune tâche trouvée' : 'Aucune tâche disponible à planifier'}
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-3 pr-4">
                  {filteredAndSortedTasks.map(task => {
                    const categoryConfig = CATEGORY_CONFIG[task.category];
                    const resolvedCategoryColor = cssVarRGB(`--color-${categoryConfig.cssName}`);
                    
                    return (
                      <Button
                        key={task.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-4 relative"
                        onClick={() => handleTaskSelect(task)}
                      >
                        {/* Bordure colorée à gauche */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                          style={{ backgroundColor: resolvedCategoryColor }}
                        />
                        
                        <div className="flex flex-col items-start gap-2 ml-2">
                          <div className="font-medium text-left">{task.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: resolvedCategoryColor }}
                              />
                              <span>{task.category}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(task.estimatedTime)}</span>
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end pt-3 border-t">
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
