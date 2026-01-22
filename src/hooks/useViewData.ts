import { 
  useTasksViewData, 
  useHabitsViewData, 
  useRecurringViewData, 
  useProjectsViewData,
  type ContextFilter 
} from '@/hooks/view-data';

export type { ContextFilter };

/**
 * Hook centralisant toutes les données nécessaires aux vues
 * Compose les hooks spécialisés pour une meilleure maintenabilité
 */
export const useViewData = () => {
  // Hooks spécialisés
  const tasksData = useTasksViewData();
  const habitsData = useHabitsViewData();
  const projectsData = useProjectsViewData();
  const recurringData = useRecurringViewData(tasksData.tasks);

  return {
    // ===== Tâches =====
    tasks: tasksData.tasks,
    mainTasks: tasksData.mainTasks,
    pinnedTasks: tasksData.pinnedTasks,
    addTask: tasksData.addTask,
    removeTask: tasksData.removeTask,
    reorderTasks: tasksData.reorderTasks,
    sortTasks: tasksData.sortTasks,
    toggleTaskExpansion: tasksData.toggleTaskExpansion,
    toggleTaskCompletion: tasksData.toggleTaskCompletion,
    togglePinTask: tasksData.togglePinTask,
    getSubTasks: tasksData.getSubTasks,
    calculateTotalTime: tasksData.calculateTotalTime,
    canHaveSubTasks: tasksData.canHaveSubTasks,
    canUndo: tasksData.canUndo,
    canRedo: tasksData.canRedo,
    undo: tasksData.undo,
    redo: tasksData.redo,
    restoreTask: tasksData.restoreTask,
    updateTask: tasksData.updateTask,
    
    // Équipe
    teamTasks: tasksData.teamTasks,
    onToggleTeamTask: tasksData.onToggleTeamTask,
    
    // Filtrage
    applyFilters: tasksData.applyFilters,
    getFilteredTasks: tasksData.getFilteredTasks,
    getCompletedTasks: tasksData.getCompletedTasks,
    
    // ===== Projets =====
    projects: projectsData.projects,
    projectTasks: projectsData.projectTasks,
    sidebarProjects: projectsData.sidebarProjects,
    sidebarProjectTasks: projectsData.sidebarProjectTasks,
    toggleProjectTaskCompletion: projectsData.toggleProjectTaskCompletion,
    
    // ===== Habitudes =====
    todayHabits: habitsData.todayHabits,
    habitCompletions: habitsData.habitCompletions,
    habitStreaks: habitsData.habitStreaks,
    habitsLoading: habitsData.habitsLoading,
    toggleHabitCompletion: habitsData.toggleHabitCompletion,
    
    // ===== Récurrence et planification =====
    recurringTaskIds: recurringData.recurringTaskIds,
    taskSchedules: recurringData.taskSchedules,
    handleSetRecurring: recurringData.handleSetRecurring,
    handleRemoveRecurring: recurringData.handleRemoveRecurring,
    handleScheduleTask: recurringData.handleScheduleTask,
    
    // ===== Hooks spécialisés (accès direct) =====
    // Permet aux vues d'accéder aux données complètes si nécessaire
    _tasksData: tasksData,
    _habitsData: habitsData,
    _projectsData: projectsData,
    _recurringData: recurringData
  };
};

export type ViewDataReturn = ReturnType<typeof useViewData>;
