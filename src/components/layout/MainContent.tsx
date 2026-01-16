import React, { useMemo } from 'react';
import { ViewRouter } from '@/components/routing/ViewRouter';
import { useApp } from '@/contexts/AppContext';
import { useViewDataContext } from '@/contexts/ViewDataContext';

interface MainContentProps {
  className?: string;
}

/**
 * Composant principal pour le rendu des vues
 * Utilise ViewRouter et injecte les props nécessaires depuis le contexte
 */
export const MainContent: React.FC<MainContentProps> = ({ className }) => {
  const { currentView } = useApp();
  const viewData = useViewDataContext();

  // Construire les props pour chaque vue
  const viewProps = useMemo(() => {
    const {
      tasks,
      mainTasks,
      projects,
      todayHabits,
      habitCompletions,
      habitStreaks,
      habitsLoading,
      toggleHabitCompletion,
      getSubTasks,
      calculateTotalTime,
      updateTask,
      restoreTask,
      removeTask,
      applyFilters
    } = viewData;

    // Props spécifiques selon la vue
    switch (currentView) {
      case 'home':
        return {
          tasks: tasks.filter(t => !t.isCompleted),
          projects,
          habits: todayHabits,
          habitCompletions,
          habitStreaks,
          habitsLoading,
          onToggleHabit: toggleHabitCompletion,
          calculateTotalTime
        };
      
      case 'tasks':
        return {
          tasks: tasks.filter(t => !t.isCompleted),
          mainTasks: mainTasks.filter(t => !t.isCompleted),
          getSubTasks,
          calculateTotalTime,
          onUpdateTask: updateTask
        };
      
      case 'eisenhower':
        return {
          tasks: tasks.filter(t => !t.isCompleted)
        };
      
      case 'completed':
        return {
          tasks: tasks.filter(t => t.isCompleted),
          onRestoreTask: restoreTask,
          onRemoveTask: removeTask
        };
      
      // Timeline, Projects, Habits, Rewards gèrent leurs propres données
      default:
        return {};
    }
  }, [currentView, viewData]);

  return (
    <main className={`flex-1 p-3 md:p-6 overflow-y-auto ${className || ''}`}>
      <div className="bg-card rounded-lg shadow-sm border border-border p-3 md:p-6 h-full">
        <ViewRouter 
          currentView={currentView} 
          viewProps={viewProps}
        />
      </div>
    </main>
  );
};

export default MainContent;
