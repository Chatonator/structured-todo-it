import React, { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AppSidebar from '@/components/sidebar/AppSidebar';
import TaskModal from '@/components/task/TaskModal';
import HeaderBar from '@/components/layout/HeaderBar';
import BottomNavigation from '@/components/layout/BottomNavigation';
import MainContent from '@/components/layout/MainContent';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { ViewDataProvider, useViewDataContext } from '@/contexts/ViewDataContext';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { useUserPreferences } from '@/hooks/useUserPreferences';

/**
 * Contenu principal de l'application
 * Séparé pour pouvoir utiliser les contextes
 */
const IndexContent: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { preferences } = useUserPreferences();
  
  const {
    currentView,
    setCurrentView,
    navigationItems,
    isModalOpen,
    setIsModalOpen,
    isTaskListOpen,
    setIsTaskListOpen,
    contextFilter,
    setContextFilter,
    selectedItems,
    toggleSelection
  } = useApp();
  
  const viewData = useViewDataContext();

  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  // Props pour la sidebar
  const sidebarProps = {
    tasks: viewData.tasks.filter(t => !t.isCompleted),
    mainTasks: viewData.mainTasks.filter(t => !t.isCompleted),
    pinnedTasks: viewData.pinnedTasks,
    recurringTaskIds: viewData.recurringTaskIds,
    taskSchedules: viewData.taskSchedules,
    onRemoveTask: viewData.removeTask,
    onToggleExpansion: viewData.toggleTaskExpansion,
    onToggleCompletion: viewData.toggleTaskCompletion,
    onTogglePinTask: viewData.togglePinTask,
    onAddTask: viewData.addTask,
    onUpdateTask: viewData.updateTask,
    onSetRecurring: viewData.handleSetRecurring,
    onRemoveRecurring: viewData.handleRemoveRecurring,
    onScheduleTask: viewData.handleScheduleTask,
    getSubTasks: viewData.getSubTasks,
    calculateTotalTime: viewData.calculateTotalTime,
    canHaveSubTasks: viewData.canHaveSubTasks,
    selectedTasks: selectedItems,
    onToggleSelection: toggleSelection,
    sidebarShowHabits: preferences.sidebarShowHabits,
    sidebarShowProjects: preferences.sidebarShowProjects,
    sidebarShowTeamTasks: preferences.sidebarShowTeamTasks,
    todayHabits: viewData.todayHabits,
    habitCompletions: viewData.habitCompletions,
    habitStreaks: viewData.habitStreaks,
    onToggleHabit: viewData.toggleHabitCompletion,
    projects: viewData.projects,
    projectTasks: viewData.projectTasks,
    onToggleProjectTask: viewData.toggleProjectTaskCompletion,
    teamTasks: viewData.teamTasks,
    onToggleTeamTask: viewData.onToggleTeamTask
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

          <MainContent />
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
          onAddTask={viewData.addTask}
        />
      </div>
    </SidebarProvider>
  );
};

/**
 * Page principale - Wrapper avec providers
 */
const Index: React.FC = () => {
  return (
    <AppProvider defaultView="home">
      <ViewDataProvider>
        <IndexContent />
      </ViewDataProvider>
    </AppProvider>
  );
};

export default Index;
