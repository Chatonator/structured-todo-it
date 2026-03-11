import React, { useCallback } from 'react';
import AppFrame from '@/components/layout/AppFrame';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { ViewDataProvider, useViewDataContext } from '@/contexts/ViewDataContext';
import { SidebarProvider as AppSidebarProvider } from '@/contexts/SidebarContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import type { Task } from '@/types/task';

const IndexContent: React.FC = () => {
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
    setContextFilter,
  } = useApp();

  const viewData = useViewDataContext();
  const { currentTeam } = useTeamContext();

  const handleAddTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    await viewData.addTask(task);
  }, [viewData]);

  return (
    <AppFrame
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
