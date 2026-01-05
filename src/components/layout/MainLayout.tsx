import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/shared/use-mobile';
import NewAppHeader from '@/components/layout/NewAppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import BottomNavigation from '@/components/layout/BottomNavigation';
import { Task, TaskContext } from '@/types/task';
import { Habit, HabitStreak } from '@/types/habit';
import { Project } from '@/types/project';

interface ProjectTaskForSidebar {
  task: Task;
  projectName: string;
  projectIcon?: string;
}

interface TeamTask {
  id: string;
  name: string;
  isCompleted: boolean;
  category: string;
  estimatedTime: number;
}

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  // Navigation
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
  // Modal
  onOpenModal: () => void;
  // Context filter
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
  // Mobile drawer
  isTaskListOpen: boolean;
  setIsTaskListOpen: (open: boolean) => void;
  // Tasks
  tasks: Task[];
  mainTasks: Task[];
  pinnedTasks: string[];
  selectedTasks: string[];
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  onToggleSelection: (taskId: string) => void;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onTogglePinTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onAddTask: (task: any) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  // Habits
  sidebarShowHabits: boolean;
  todayHabits: Habit[];
  habitCompletions: Record<string, boolean>;
  habitStreaks: Record<string, HabitStreak>;
  onToggleHabit: (habitId: string) => Promise<boolean | void>;
  // Projects
  sidebarShowProjects: boolean;
  projects: Project[];
  projectTasks: ProjectTaskForSidebar[];
  onToggleProjectTask: (taskId: string) => void;
  // Team
  sidebarShowTeamTasks: boolean;
  teamTasks: TeamTask[];
  onToggleTeamTask: (taskId: string) => void;
}

/**
 * Layout principal de l'application
 * Gère la structure avec SidebarProvider, header et contenu
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  navigationItems,
  onOpenModal,
  contextFilter,
  onContextFilterChange,
  isTaskListOpen,
  setIsTaskListOpen,
  tasks,
  mainTasks,
  pinnedTasks,
  selectedTasks,
  getSubTasks,
  calculateTotalTime,
  canHaveSubTasks,
  onToggleSelection,
  onToggleExpansion,
  onToggleCompletion,
  onTogglePinTask,
  onRemoveTask,
  onAddTask,
  onUpdateTask,
  sidebarShowHabits,
  todayHabits,
  habitCompletions,
  habitStreaks,
  onToggleHabit,
  sidebarShowProjects,
  projects,
  projectTasks,
  onToggleProjectTask,
  sidebarShowTeamTasks,
  teamTasks,
  onToggleTeamTask
}) => {
  const isMobile = useIsMobile();

  const sidebarProps = {
    tasks,
    mainTasks,
    pinnedTasks,
    selectedTasks,
    getSubTasks,
    calculateTotalTime,
    canHaveSubTasks,
    onToggleSelection,
    onToggleExpansion,
    onToggleCompletion,
    onTogglePinTask,
    onRemoveTask,
    onAddTask,
    onUpdateTask,
    sidebarShowHabits,
    todayHabits,
    habitCompletions,
    habitStreaks,
    onToggleHabit,
    sidebarShowProjects,
    projects,
    projectTasks,
    onToggleProjectTask,
    sidebarShowTeamTasks,
    teamTasks,
    onToggleTeamTask
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className={`min-h-screen flex w-full bg-background ${isMobile ? 'pb-16' : ''}`}>
        {/* Sidebar - Desktop */}
        {!isMobile && <AppSidebar {...sidebarProps} />}
        
        {/* Sidebar - Mobile (Sheet) */}
        {isMobile && (
          <Sheet open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
            <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 overflow-hidden">
              <div className="h-full flex flex-col bg-sidebar">
                <AppSidebar {...sidebarProps} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Zone principale */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          {/* Header */}
          <NewAppHeader
            onOpenModal={onOpenModal}
            onOpenTaskList={() => setIsTaskListOpen(true)}
            isMobile={isMobile}
            contextFilter={contextFilter}
            onContextFilterChange={onContextFilterChange}
            currentView={currentView}
            onViewChange={onViewChange}
            navigationItems={navigationItems}
          />

          {/* Contenu */}
          <main className="flex-1 overflow-y-auto p-3 md:p-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6 min-h-full">
              {children}
            </div>
          </main>
        </div>

        {/* Navigation mobile */}
        {isMobile && (
          <BottomNavigation
            currentView={currentView}
            onViewChange={onViewChange}
            navigationItems={navigationItems}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
