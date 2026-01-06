import React, { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarInset } from '@/components/ui/sidebar';

// Layout components
import AppLayout from '@/components/layout/AppLayout';
import AppSidebar from '@/components/layout/AppSidebar';
import NewAppHeader from '@/components/layout/NewAppHeader';
import BottomNavigation from '@/components/layout/BottomNavigation';

// Views
import HomeView from '@/components/views/HomeView';
import TasksView from '@/components/views/TasksView';
import EisenhowerView from '@/components/views/EisenhowerView';
import CompletedTasksView from '@/components/views/CompletedTasksView';
import HabitsView from '@/components/habits/HabitsView';
import RewardsView from '@/components/rewards/RewardsView';
import { ProjectsView } from '@/components/projects/ProjectsView';
import TimelineView from '@/components/timeline/TimelineView';
import TaskModal from '@/components/task/TaskModal';

// Hooks
import { useAppState } from '@/hooks/useAppState';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { useProjects } from '@/hooks/useProjects';
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks';
import { useHabits } from '@/hooks/useHabits';
import { useDecks } from '@/hooks/useDecks';

/**
 * Page principale de l'application TO-DO-IT 2.0
 * Architecture refactorisée avec sidebar shadcn
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
    contextFilter,
    setContextFilter,
    applyFilters,
    getFilteredTasks,
    preferences
  } = useAppState();
  
  // Hook unifié pour les tâches
  const {
    tasks,
    mainTasks,
    addTask,
    removeTask,
    toggleTaskCompletion,
    getSubTasks,
    calculateTotalTime,
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
  
  // Habitudes du jour
  const todayHabits = getHabitsForToday();
  
  // Filtrage des tâches
  const allFilteredTasks = useMemo(() => applyFilters(tasks), [applyFilters, tasks]);
  const filteredMainTasks = useMemo(() => 
    applyFilters(mainTasks.filter(task => task && !task.isCompleted)),
    [applyFilters, mainTasks]
  );

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
          <Button onClick={() => setCurrentView('tasks')} className="mt-4">
            Retour aux tâches
          </Button>
        </div>
      );
    }
  };

  return (
    <AppLayout>
      {/* Sidebar */}
      <AppSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenModal={() => setIsModalOpen(true)}
        onAddTask={addTask}
        tasks={tasks}
        onToggleCompletion={toggleTaskCompletion}
        showHabits={preferences.sidebarShowHabits}
        todayHabits={todayHabits}
        habitCompletions={habitCompletions}
        habitStreaks={habitStreaks}
        onToggleHabit={toggleHabitCompletion}
        showProjects={preferences.sidebarShowProjects}
        projects={projects}
        projectTasks={projectTasks}
        onToggleProjectTask={toggleProjectTaskCompletion}
        showTeamTasks={preferences.sidebarShowTeamTasks}
        teamTasks={teamTasks}
        onToggleTeamTask={onToggleTeamTask}
      />

      {/* Main content area */}
      <SidebarInset className={`flex flex-col ${isMobile ? 'pb-16' : ''}`}>
        {/* Header */}
        <NewAppHeader
          onOpenModal={() => setIsModalOpen(true)}
          contextFilter={contextFilter}
          onContextFilterChange={setContextFilter}
        />

        {/* Vue courante */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6 min-h-full">
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
    </AppLayout>
  );
};

export default Index;
