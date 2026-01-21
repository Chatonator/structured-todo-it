import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useViewData, ViewDataReturn } from '@/hooks/useViewData';
import { useApp } from '@/contexts/AppContext';

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

  // Filtrer les tâches selon le contexte global
  const filteredViewData = useMemo<ViewDataReturn>(() => {
    if (contextFilter === 'all') {
      return viewData;
    }

    // Appliquer le filtre de contexte aux tâches
    const filteredTasks = viewData.tasks.filter(t => t.context === contextFilter);
    const filteredMainTasks = viewData.mainTasks.filter(t => t.context === contextFilter);

    return {
      ...viewData,
      tasks: filteredTasks,
      mainTasks: filteredMainTasks,
      // Garder les pinnedTasks qui correspondent aux tâches filtrées
      pinnedTasks: viewData.pinnedTasks.filter(id => 
        filteredTasks.some(t => t.id === id)
      ),
      // Mettre à jour getFilteredTasks pour respecter le filtre global
      getFilteredTasks: (additionalFilter = 'all') => {
        const activeTasks = filteredTasks.filter(t => !t.isCompleted);
        if (additionalFilter === 'all') return activeTasks;
        return activeTasks.filter(t => t.context === additionalFilter);
      },
      // Mettre à jour getCompletedTasks pour respecter le filtre global
      getCompletedTasks: (additionalFilter = 'all') => {
        const completedTasks = filteredTasks.filter(t => t.isCompleted);
        if (additionalFilter === 'all') return completedTasks;
        return completedTasks.filter(t => t.context === additionalFilter);
      }
    };
  }, [viewData, contextFilter]);
  
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
