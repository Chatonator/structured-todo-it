import React from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import TaskModal from '@/components/task/TaskModal';
import HeaderBar from '@/components/layout/HeaderBar';
import MainContent from '@/components/layout/MainContent';
import MobileShell from '@/components/layout/mobile/MobileShell';
import type { Task, TaskContext } from '@/types/task';
import { useViewport } from '@/contexts/ViewportContext';

interface AppFrameProps {
  isTaskListOpen: boolean;
  setIsTaskListOpen: (open: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  contextFilter: 'all' | TaskContext;
  setContextFilter: (context: 'all' | TaskContext) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  navigationItems: any[];
  currentTeam: any;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
}

const AppFrame: React.FC<AppFrameProps> = ({
  isTaskListOpen,
  setIsTaskListOpen,
  isModalOpen,
  setIsModalOpen,
  contextFilter,
  setContextFilter,
  currentView,
  setCurrentView,
  navigationItems,
  currentTeam,
  onAddTask,
}) => {
  const { isDesktop } = useViewport();

  return (
    <>
      {isDesktop ? (
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />

            <SidebarInset className="flex flex-col">
              <HeaderBar
                onOpenModal={() => setIsModalOpen(true)}
                onOpenTaskList={() => setIsTaskListOpen(true)}
                isMobile={false}
                contextFilter={contextFilter}
                onContextFilterChange={setContextFilter}
                currentView={currentView}
                onViewChange={setCurrentView}
                navigationItems={navigationItems}
                currentTeam={currentTeam}
              />

              <MainContent />
            </SidebarInset>
          </div>
        </SidebarProvider>
      ) : (
        <MobileShell
          currentView={currentView}
          onViewChange={setCurrentView}
          contextFilter={contextFilter}
          onContextFilterChange={setContextFilter}
          currentTeam={currentTeam}
          onOpenTaskModal={() => setIsModalOpen(true)}
        />
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={onAddTask}
        taskType={currentTeam ? 'team' : 'personal'}
        defaultContext={contextFilter !== 'all' ? contextFilter : undefined}
      />
    </>
  );
};

export default AppFrame;
