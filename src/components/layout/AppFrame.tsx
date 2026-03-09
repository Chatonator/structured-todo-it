import React from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import AppSidebar from '@/components/sidebar/AppSidebar';
import TaskModal from '@/components/task/TaskModal';
import HeaderBar from '@/components/layout/HeaderBar';
import BottomNavigation from '@/components/layout/BottomNavigation';
import MainContent from '@/components/layout/MainContent';
import type { Task, TaskContext } from '@/types/task';

interface AppFrameProps {
  isMobile: boolean;
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
  isMobile,
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
  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full bg-background ${isMobile ? 'pb-16' : ''}`}>
        {!isMobile && <AppSidebar />}

        {isMobile && (
          <Sheet open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
            <SheetContent side="left" className="w-full sm:w-[400px] p-0">
              <div className="h-full min-h-0">
                <AppSidebar />
              </div>
            </SheetContent>
          </Sheet>
        )}

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

        {isMobile && (
          <BottomNavigation
            currentView={currentView}
            onViewChange={setCurrentView}
            navigationItems={navigationItems}
          />
        )}

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={onAddTask}
          taskType={currentTeam ? 'team' : 'personal'}
          defaultContext={contextFilter !== 'all' ? contextFilter : undefined}
        />
      </div>
    </SidebarProvider>
  );
};

export default AppFrame;
