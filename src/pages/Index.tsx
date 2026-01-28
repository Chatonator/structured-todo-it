import React, { useEffect, useCallback } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AppSidebar from '@/components/sidebar/AppSidebar';
import TaskModal from '@/components/task/TaskModal';
import HeaderBar from '@/components/layout/HeaderBar';
import BottomNavigation from '@/components/layout/BottomNavigation';
import MainContent from '@/components/layout/MainContent';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { ViewDataProvider, useViewDataContext } from '@/contexts/ViewDataContext';
import { SidebarProvider as AppSidebarProvider } from '@/contexts/SidebarContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTeamTasks } from '@/hooks/useTeamTasks';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import type { Task } from '@/types/task';

/**
 * Contenu principal de l'application
 * Utilise les contextes pour éviter le prop drilling
 */
const IndexContent: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  const {
    currentView,
    setCurrentView,
    navigationItems,
    isModalOpen,
    setIsModalOpen,
    isTaskListOpen,
    setIsTaskListOpen,
    contextFilter,
    setContextFilter
  } = useApp();
  
  const viewData = useViewDataContext();
  
  // Team context integration
  const { currentTeam } = useTeamContext();
  const teamTasks = useTeamTasks(currentTeam?.id ?? null);

  // Dynamic task creation handler
  const handleAddTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (currentTeam) {
      // Create team task
      await teamTasks.createTask({
        name: task.name,
        category: task.category,
        subCategory: task.subCategory,
        context: task.context,
        estimatedTime: task.estimatedTime,
        isCompleted: false,
        level: task.level,
        parentId: task.parentId,
      });
    } else {
      // Create personal task
      viewData.addTask(task);
    }
  }, [currentTeam, teamTasks, viewData]);

  // Auto-switch to team view when team is selected
  useEffect(() => {
    if (currentTeam && currentView !== 'team') {
      setCurrentView('team');
    }
  }, [currentTeam?.id]);

  // Switch back when deselecting team
  useEffect(() => {
    if (!currentTeam && currentView === 'team') {
      setCurrentView('home');
    }
  }, [currentTeam, currentView, setCurrentView]);

  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full bg-background ${isMobile ? 'pb-16' : ''}`}>
        {/* Desktop: AppSidebar - zéro props grâce au contexte */}
        {!isMobile && <AppSidebar />}

        {/* Mobile: Sidebar en drawer */}
        {isMobile && (
          <Sheet open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
            <SheetContent side="left" className="w-full sm:w-[400px] p-0">
              <div className="h-full min-h-0">
                <AppSidebar />
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
            currentTeam={currentTeam}
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
          onAddTask={handleAddTask}
          taskType={currentTeam ? 'team' : 'personal'}
        />
      </div>
    </SidebarProvider>
  );
};

/**
 * Page principale - Wrapper avec providers
 * Ordre: AppProvider > ViewDataProvider > SidebarProvider > IndexContent
 */
const Index: React.FC = () => {
  return (
    <AppProvider defaultView="home">
      <ViewDataProvider>
        <AppSidebarProvider>
          <IndexContent />
        </AppSidebarProvider>
      </ViewDataProvider>
    </AppProvider>
  );
};

export default Index;
