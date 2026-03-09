import React, { useEffect, useCallback } from 'react';
import AppFrame from '@/components/layout/AppFrame';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { ViewDataProvider, useViewDataContext } from '@/contexts/ViewDataContext';
import { SidebarProvider as AppSidebarProvider } from '@/contexts/SidebarContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import type { Task } from '@/types/task';

/**
 * Contenu principal de l'application
 * Utilise les contextes pour éviter le prop drilling
 */
const IndexContent: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  useAppUpdates();
  
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

  // Dynamic task creation handler
  const handleAddTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    await viewData.addTask(task);
  }, [viewData]);


  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  return (
    <AppFrame
      isMobile={isMobile}
      isTaskListOpen={isTaskListOpen}
      setIsTaskListOpen={setIsTaskListOpen}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      contextFilter={contextFilter}
      setContextFilter={setContextFilter}
      currentView={currentView}
      setCurrentView={setCurrentView}
      navigationItems={navigationItems}
      currentTeam={currentTeam}
      onAddTask={handleAddTask}
    />
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
