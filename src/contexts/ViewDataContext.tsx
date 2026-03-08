import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useViewData, ViewDataReturn } from '@/hooks/useViewData';
import { useApp } from '@/contexts/AppContext';
import { useAllTeamTasks } from '@/hooks/useAllTeamTasks';

const ViewDataContext = createContext<ViewDataReturn | undefined>(undefined);

interface ViewDataProviderProps {
  children: ReactNode;
}

/**
 * Provider pour les données partagées entre les vues
 * Filtre automatiquement les tâches selon le contextFilter global
 */
export const ViewDataProvider: React.FC<ViewDataProviderProps> = ({ children }) => {
  const viewData = useViewData();
  const { contextFilter } = useApp();
  const { allTeamTasks } = useAllTeamTasks();

  // Filtrer les tâches selon le contexte global
  const filteredViewData = useMemo<ViewDataReturn>(() => {
    if (contextFilter === 'all') {
      // Fusionner tâches personnelles + tâches d'équipe, en évitant les doublons
      const personalTaskIds = new Set(viewData.tasks.map(t => t.id));
      const uniqueTeamTasks = allTeamTasks.filter(t => !personalTaskIds.has(t.id));
      const mergedTasks = [...viewData.tasks, ...uniqueTeamTasks];
      const mergedMainTasks = [...viewData.mainTasks, ...uniqueTeamTasks.filter(t => t.level === 0)];

      return {
        ...viewData,
        tasks: mergedTasks,
        mainTasks: mergedMainTasks,
        getFilteredTasks: (additionalFilter = 'all') => {
          const activeTasks = mergedTasks.filter(t => !t.isCompleted);
          if (additionalFilter === 'all') return activeTasks;
          return activeTasks.filter(t => t.context === additionalFilter);
        },
        getCompletedTasks: (additionalFilter = 'all') => {
          const completedTasks = mergedTasks.filter(t => t.isCompleted);
          if (additionalFilter === 'all') return completedTasks;
          return completedTasks.filter(t => t.context === additionalFilter);
        }
      };
    }

    // Appliquer le filtre de contexte aux tâches
    const filteredTasks = viewData.tasks.filter(t => t.context === contextFilter);
    const filteredMainTasks = viewData.mainTasks.filter(t => t.context === contextFilter);

    return {
      ...viewData,
      tasks: filteredTasks,
      mainTasks: filteredMainTasks,
      pinnedTasks: viewData.pinnedTasks.filter(id => 
        filteredTasks.some(t => t.id === id)
      ),
      getFilteredTasks: (additionalFilter = 'all') => {
        const activeTasks = filteredTasks.filter(t => !t.isCompleted);
        if (additionalFilter === 'all') return activeTasks;
        return activeTasks.filter(t => t.context === additionalFilter);
      },
      getCompletedTasks: (additionalFilter = 'all') => {
        const completedTasks = filteredTasks.filter(t => t.isCompleted);
        if (additionalFilter === 'all') return completedTasks;
        return completedTasks.filter(t => t.context === additionalFilter);
      }
    };
  }, [viewData, contextFilter, allTeamTasks]);
  
  return (
    <ViewDataContext.Provider value={filteredViewData}>
      {children}
    </ViewDataContext.Provider>
  );
};

/**
 * Hook pour accéder aux données des vues
 * @throws Error si utilisé en dehors du ViewDataProvider
 */
export const useViewDataContext = (): ViewDataReturn => {
  const context = useContext(ViewDataContext);
  if (!context) {
    throw new Error('useViewDataContext must be used within a ViewDataProvider');
  }
  return context;
};

export default ViewDataContext;
