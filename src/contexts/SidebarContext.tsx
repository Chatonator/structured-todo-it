import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useViewDataContext } from '@/contexts/ViewDataContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { Project } from '@/types/project';

/**
 * Interface pour les données de la sidebar
 * Types flexibles pour supporter les différents modes
 */
export interface SidebarData {
  // Tâches actives
  tasks: Task[];
  mainTasks: Task[];
  pinnedTasks: string[];
  
  // Récurrence
  recurringTaskIds: string[];
  taskSchedules: Record<string, any>;
  
  // Actions tâches
  onRemoveTask: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onToggleCompletion: (id: string) => void;
  onTogglePinTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onSetRecurring: (taskId: string, taskName: string, estimatedTime: number, frequency: string, interval: number) => Promise<void>;
  onRemoveRecurring: (taskId: string) => void;
  onScheduleTask: (taskId: string, date: Date, time: string) => Promise<void>;
  getSubTasks: (parentId: string) => Task[];
  calculateTotalTime: (task: Task) => number;
  canHaveSubTasks: (task: Task) => boolean;
  
  // Sélection
  selectedTasks: string[];
  onToggleSelection: (id: string) => void;
  
  // Préférences d'affichage
  sidebarShowHabits: boolean;
  sidebarShowProjects: boolean;
  sidebarShowTeamTasks: boolean;
  
  // Habitudes
  todayHabits: Habit[];
  habitCompletions: Record<string, boolean>;
  habitStreaks: Record<string, any>;
  onToggleHabit: (habitId: string) => Promise<boolean>;
  
  // Projets
  projects: Project[];
  projectTasks: any;
  onToggleProjectTask: (projectId: string, taskId: string) => Promise<void>;
  
  // Équipe
  teamTasks: any[];
  onToggleTeamTask: (taskId: string) => void;
}

const SidebarContext = createContext<SidebarData | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * Provider pour les données de la sidebar
 * Élimine le prop drilling massif dans Index.tsx
 */
export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const viewData = useViewDataContext();
  const { preferences } = useUserPreferences();
  const { selectedItems, toggleSelection } = useApp();

  const sidebarData = useMemo<SidebarData>(() => ({
    // Tâches filtrées (actives uniquement)
    tasks: viewData.tasks.filter(t => !t.isCompleted),
    mainTasks: viewData.mainTasks.filter(t => !t.isCompleted),
    pinnedTasks: viewData.pinnedTasks as string[],
    
    // Récurrence
    recurringTaskIds: viewData.recurringTaskIds as string[],
    taskSchedules: viewData.taskSchedules,
    
    // Actions tâches
    onRemoveTask: viewData.removeTask,
    onToggleExpansion: viewData.toggleTaskExpansion,
    onToggleCompletion: viewData.toggleTaskCompletion,
    onTogglePinTask: viewData.togglePinTask,
    onAddTask: viewData.addTask as any,
    onUpdateTask: viewData.updateTask as any,
    onSetRecurring: viewData.handleSetRecurring,
    onRemoveRecurring: viewData.handleRemoveRecurring,
    onScheduleTask: viewData.handleScheduleTask,
    getSubTasks: viewData.getSubTasks,
    calculateTotalTime: viewData.calculateTotalTime,
    canHaveSubTasks: viewData.canHaveSubTasks,
    
    // Sélection
    selectedTasks: Array.from(selectedItems),
    onToggleSelection: toggleSelection,
    
    // Préférences d'affichage
    sidebarShowHabits: preferences.sidebarShowHabits,
    sidebarShowProjects: preferences.sidebarShowProjects,
    sidebarShowTeamTasks: preferences.sidebarShowTeamTasks,
    
    // Habitudes
    todayHabits: viewData.todayHabits,
    habitCompletions: viewData.habitCompletions as any,
    habitStreaks: viewData.habitStreaks as any,
    onToggleHabit: viewData.toggleHabitCompletion,
    
    // Projets
    projects: viewData.projects,
    projectTasks: viewData.projectTasks,
    onToggleProjectTask: viewData.toggleProjectTaskCompletion,
    
    // Équipe
    teamTasks: viewData.teamTasks as any,
    onToggleTeamTask: viewData.onToggleTeamTask
  }), [
    viewData,
    preferences.sidebarShowHabits,
    preferences.sidebarShowProjects,
    preferences.sidebarShowTeamTasks,
    selectedItems,
    toggleSelection
  ]);

  return (
    <SidebarContext.Provider value={sidebarData}>
      {children}
    </SidebarContext.Provider>
  );
};

/**
 * Hook pour accéder aux données de la sidebar
 * @throws Error si utilisé en dehors du SidebarProvider
 */
export const useSidebarContext = (): SidebarData => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};

export default SidebarContext;
