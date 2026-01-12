import { Button } from '@/components/ui/button';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AppSidebar from '@/components/sidebar/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import TaskModal from '@/components/task/TaskModal';
import HomeView from '@/components/views/HomeView';
import TasksView from '@/components/views/TasksView';
import EisenhowerView from '@/components/views/EisenhowerView';
import CompletedTasksView from '@/components/views/CompletedTasksView';
import HabitsView from '@/components/habits/HabitsView';
import RewardsView from '@/components/rewards/RewardsView';
import { ProjectsView } from '@/components/projects/ProjectsView';
import TimelineView from '@/components/timeline/TimelineView';
import HeaderBar from '@/components/layout/HeaderBar';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { useAppState } from '@/hooks/useAppState';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { useProjects } from '@/hooks/useProjects';
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks';
import { useHabits } from '@/hooks/useHabits';
import { useDecks } from '@/hooks/useDecks';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { useTimeEventSync } from '@/hooks/useTimeEventSync';

/**
 * Page principale de l'application
 * Refactorisé pour utiliser les hooks useAppState et useUnifiedTasks
 */
const Index = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  // Hook centralisé pour l'état de l'application
  const {
    currentView,
    setCurrentView,
    navigationItems,
    isModalOpen,
    setIsModalOpen,
    isTaskListOpen,
    setIsTaskListOpen,
    isTaskListCollapsed,
    setIsTaskListCollapsed,
    selectedTasks,
    handleToggleSelection,
    contextFilter,
    setContextFilter,
    applyFilters,
    getFilteredTasks,
    preferences
  } = useAppState();
  
  // Hook unifié pour les tâches (perso/équipe)
  const {
    tasks,
    mainTasks,
    pinnedTasks,
    addTask,
    removeTask,
    reorderTasks,
    sortTasks,
    toggleTaskExpansion,
    toggleTaskCompletion,
    togglePinTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    canUndo,
    canRedo,
    undo,
    redo,
    restoreTask,
    updateTask,
    teamTasks,
    onToggleTeamTask
  } = useUnifiedTasks();
  
  // Hooks pour projets et habitudes
  const { projects } = useProjects();
  const { projectTasks, toggleProjectTaskCompletion } = useAllProjectTasks(projects);
  const { defaultDeckId } = useDecks();
  const { 
    completions: habitCompletions, 
    streaks: habitStreaks, 
    loading: habitsLoading,
    toggleCompletion: toggleHabitCompletion,
    getHabitsForToday
  } = useHabits(defaultDeckId);
  const { ensureRecurringTaskHasEvent, processRecurringTasks } = useRecurringTasks();
  const { deleteEntityEvent, updateEventStatus, syncTaskEventWithSchedule, getEntityEvent } = useTimeEventSync();
  
  // État pour les IDs des tâches récurrentes et les planifications
  const [recurringTaskIds, setRecurringTaskIds] = useState<string[]>([]);
  const [taskSchedules, setTaskSchedules] = useState<Record<string, { date: Date; time: string }>>({});

  // Charger les IDs des tâches récurrentes et les planifications au montage
  useEffect(() => {
    const initRecurringTasks = async () => {
      // Traiter les tâches récurrentes qui doivent être réactivées
      const reactivatedCount = await processRecurringTasks();
      if (reactivatedCount > 0) {
        console.log(`${reactivatedCount} tâche(s) récurrente(s) réactivée(s)`);
      }
      
      // Charger les événements de tâches
      const { data } = await supabase
        .from('time_events')
        .select('entity_id, recurrence, starts_at')
        .eq('entity_type', 'task');
      
      if (data) {
        // Récurrence IDs
        const recurringIds = data
          .filter(e => e.recurrence !== null)
          .map(e => e.entity_id);
        setRecurringTaskIds(recurringIds);
        
        // Planifications
        const schedules: Record<string, { date: Date; time: string }> = {};
        data.forEach(e => {
          if (e.starts_at) {
            const startsAt = new Date(e.starts_at);
            schedules[e.entity_id] = {
              date: startsAt,
              time: startsAt.toTimeString().slice(0, 5)
            };
          }
        });
        setTaskSchedules(schedules);
      }
    };
    initRecurringTasks();
  }, [processRecurringTasks]);
  
  // Habitudes applicables aujourd'hui
  const todayHabits = getHabitsForToday();

  // Handler pour ajouter la récurrence à une tâche
  const handleSetRecurring = useCallback(async (
    taskId: string, 
    taskName: string, 
    estimatedTime: number, 
    frequency: string, 
    interval: number
  ) => {
    await ensureRecurringTaskHasEvent(taskId, taskName, frequency, estimatedTime, interval);
    setRecurringTaskIds(prev => [...prev, taskId]);
  }, [ensureRecurringTaskHasEvent]);

  // Handler pour supprimer la récurrence d'une tâche
  const handleRemoveRecurring = useCallback(async (taskId: string) => {
    await deleteEntityEvent('task', taskId);
    setRecurringTaskIds(prev => prev.filter(id => id !== taskId));
  }, [deleteEntityEvent]);
  
  // Handler pour planifier une tâche
  const handleScheduleTask = useCallback(async (taskId: string, date: Date, time: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    await syncTaskEventWithSchedule(task, {
      date,
      time,
      isRecurring: recurringTaskIds.includes(taskId)
    });
    
    setTaskSchedules(prev => ({
      ...prev,
      [taskId]: { date, time }
    }));
  }, [tasks, syncTaskEventWithSchedule, recurringTaskIds]);
  
  // Filtrage des tâches
  const filteredTasks = useMemo(() => getFilteredTasks(tasks), [getFilteredTasks, tasks]);
  const filteredMainTasks = useMemo(() => 
    applyFilters(mainTasks.filter(task => task && !task.isCompleted)),
    [applyFilters, mainTasks]
  );
  const allFilteredTasks = useMemo(() => applyFilters(tasks), [applyFilters, tasks]);

  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  // Rendu de la vue courante
  const renderCurrentView = () => {
    try {
      switch (currentView) {
        case 'home':
          return (
            <HomeView 
              tasks={allFilteredTasks}
              projects={projects}
              habits={todayHabits}
              habitCompletions={habitCompletions}
              habitStreaks={habitStreaks}
              habitsLoading={habitsLoading}
              onToggleHabit={toggleHabitCompletion}
              onViewChange={setCurrentView}
              calculateTotalTime={calculateTotalTime}
            />
          );
        case 'tasks':
          return (
            <TasksView 
              tasks={allFilteredTasks}
              mainTasks={filteredMainTasks}
              getSubTasks={getSubTasks}
              calculateTotalTime={calculateTotalTime}
              onUpdateTask={updateTask}
            />
          );
        case 'eisenhower':
          return <EisenhowerView tasks={allFilteredTasks.filter(t => !t.isCompleted)} />;
        case 'timeline':
          return <TimelineView />;
        case 'projects':
          return <ProjectsView />;
        case 'habits':
          return <HabitsView />;
        case 'rewards':
          return <RewardsView />;
        case 'completed':
          const completedTasksList = applyFilters(tasks.filter(t => t && t.isCompleted));
          return (
            <CompletedTasksView 
              tasks={completedTasksList} 
              onRestoreTask={restoreTask}
              onRemoveTask={removeTask}
            />
          );
        default:
          return <div className="text-center text-muted-foreground">Vue non trouvée</div>;
      }
    } catch (error) {
      console.error('Erreur lors du rendu de la vue:', error);
      return (
        <div className="text-center text-destructive p-8">
          <h3 className="text-lg font-medium mb-2">Erreur de rendu</h3>
          <p className="text-sm">Une erreur s'est produite lors de l'affichage de cette vue.</p>
          <Button onClick={() => setCurrentView('tasks')}>
            Retour aux tâches
          </Button>
        </div>
      );
    }
  };

  // Props communes pour AppSidebar
  const sidebarProps = {
    tasks: filteredTasks,
    mainTasks: filteredMainTasks,
    pinnedTasks,
    recurringTaskIds,
    taskSchedules,
    onRemoveTask: removeTask,
    onToggleExpansion: toggleTaskExpansion,
    onToggleCompletion: toggleTaskCompletion,
    onTogglePinTask: togglePinTask,
    onAddTask: addTask,
    onUpdateTask: updateTask,
    onSetRecurring: handleSetRecurring,
    onRemoveRecurring: handleRemoveRecurring,
    onScheduleTask: handleScheduleTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    selectedTasks,
    onToggleSelection: handleToggleSelection,
    sidebarShowHabits: preferences.sidebarShowHabits,
    sidebarShowProjects: preferences.sidebarShowProjects,
    sidebarShowTeamTasks: preferences.sidebarShowTeamTasks,
    todayHabits,
    habitCompletions,
    habitStreaks,
    onToggleHabit: toggleHabitCompletion,
    projects,
    projectTasks,
    onToggleProjectTask: toggleProjectTaskCompletion,
    teamTasks,
    onToggleTeamTask
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full bg-background ${isMobile ? 'pb-16' : ''}`}>
        {/* Desktop: AppSidebar */}
        {!isMobile && <AppSidebar {...sidebarProps} />}

        {/* Mobile: Sidebar en drawer */}
        {isMobile && (
          <Sheet open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
            <SheetContent side="left" className="w-full sm:w-[400px] p-0">
              <div className="h-full min-h-0">
                <AppSidebar {...sidebarProps} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Contenu principal */}
        <SidebarInset className="flex flex-col">
          {/* Header bicouche */}
          <HeaderBar
            onOpenModal={() => setIsModalOpen(true)}
            onOpenTaskList={() => setIsTaskListOpen(true)}
            isMobile={isMobile}
            contextFilter={contextFilter}
            onContextFilterChange={setContextFilter}
            currentView={currentView}
            onViewChange={setCurrentView}
            navigationItems={navigationItems}
          />

          {/* Vue courante */}
          <main className="flex-1 p-3 md:p-6 overflow-y-auto">
            <div className="bg-card rounded-lg shadow-sm border border-border p-3 md:p-6 h-full">
              {renderCurrentView()}
            </div>
          </main>
        </SidebarInset>

        {/* Navigation mobile */}
        {isMobile && (
          <BottomNavigation
            currentView={currentView}
            onViewChange={setCurrentView}
            navigationItems={navigationItems}
          />
        )}

        {/* Modal création tâche */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={addTask}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
