import { Button } from '@/components/ui/button';
import React, { useEffect, useMemo } from 'react';
import TaskModal from '@/components/task/TaskModal';
import HomeView from '@/components/views/HomeView';
import TasksView from '@/components/views/TasksView';
import EisenhowerView from '@/components/views/EisenhowerView';
import CompletedTasksView from '@/components/views/CompletedTasksView';
import HabitsView from '@/components/habits/HabitsView';
import RewardsView from '@/components/rewards/RewardsView';
import { ProjectsView } from '@/components/projects/ProjectsView';
import TimelineView from '@/components/timeline/TimelineView';
import MainLayout from '@/components/layout/MainLayout';
import { useAppState } from '@/hooks/useAppState';
import { useUnifiedTasks } from '@/hooks/useUnifiedTasks';
import { useTheme } from '@/hooks/useTheme';
import { useProjects } from '@/hooks/useProjects';
import { useAllProjectTasks } from '@/hooks/useAllProjectTasks';
import { useHabits } from '@/hooks/useHabits';
import { useDecks } from '@/hooks/useDecks';

/**
 * Page principale de l'application
 * Refactorisé pour utiliser le nouveau MainLayout
 */
const Index = () => {
  const { theme } = useTheme();
  
  // Hook centralisé pour l'état de l'application
  const {
    currentView,
    setCurrentView,
    navigationItems,
    isModalOpen,
    setIsModalOpen,
    isTaskListOpen,
    setIsTaskListOpen,
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
    toggleTaskExpansion,
    toggleTaskCompletion,
    togglePinTask,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
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
  
  // Habitudes applicables aujourd'hui
  const todayHabits = getHabitsForToday();
  
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

  return (
    <>
      <MainLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        navigationItems={navigationItems}
        onOpenModal={() => setIsModalOpen(true)}
        contextFilter={contextFilter}
        onContextFilterChange={setContextFilter}
        isTaskListOpen={isTaskListOpen}
        setIsTaskListOpen={setIsTaskListOpen}
        // Tasks
        tasks={filteredTasks}
        mainTasks={filteredMainTasks}
        pinnedTasks={pinnedTasks}
        selectedTasks={selectedTasks}
        getSubTasks={getSubTasks}
        calculateTotalTime={calculateTotalTime}
        canHaveSubTasks={canHaveSubTasks}
        onToggleSelection={handleToggleSelection}
        onToggleExpansion={toggleTaskExpansion}
        onToggleCompletion={toggleTaskCompletion}
        onTogglePinTask={togglePinTask}
        onRemoveTask={removeTask}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        // Habits
        sidebarShowHabits={preferences.sidebarShowHabits}
        todayHabits={todayHabits}
        habitCompletions={habitCompletions}
        habitStreaks={habitStreaks}
        onToggleHabit={toggleHabitCompletion}
        // Projects
        sidebarShowProjects={preferences.sidebarShowProjects}
        projects={projects}
        projectTasks={projectTasks}
        onToggleProjectTask={toggleProjectTaskCompletion}
        // Team
        sidebarShowTeamTasks={preferences.sidebarShowTeamTasks}
        teamTasks={teamTasks}
        onToggleTeamTask={onToggleTeamTask}
      >
        {renderCurrentView()}
      </MainLayout>

      {/* Modal création tâche */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={addTask}
      />
    </>
  );
};

export default Index;
