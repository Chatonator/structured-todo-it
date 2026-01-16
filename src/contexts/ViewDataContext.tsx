import React, { createContext, useContext, ReactNode } from 'react';
import { useViewData, ViewDataReturn } from '@/hooks/useViewData';

const ViewDataContext = createContext<ViewDataReturn | undefined>(undefined);

interface ViewDataProviderProps {
  children: ReactNode;
}

/**
 * Provider pour les données partagées entre les vues
 * Permet d'éviter le prop drilling massif
 */
export const ViewDataProvider: React.FC<ViewDataProviderProps> = ({ children }) => {
  const viewData = useViewData();
  
  return (
    <ViewDataContext.Provider value={viewData}>
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
