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
import { SidebarProvider as AppSidebarProvider } from '@/contexts/SidebarContext';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/shared/use-mobile';

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
