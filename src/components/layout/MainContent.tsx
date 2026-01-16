import React from 'react';
import { ViewRouter } from '@/components/routing/ViewRouter';
import { useApp } from '@/contexts/AppContext';

interface MainContentProps {
  className?: string;
}

/**
 * Composant principal pour le rendu des vues
 * Les vues utilisent désormais useViewDataContext pour accéder aux données
 */
export const MainContent: React.FC<MainContentProps> = ({ className }) => {
  const { currentView } = useApp();

  return (
    <main className={`flex-1 p-3 md:p-6 overflow-y-auto ${className || ''}`}>
      <div className="bg-card rounded-lg shadow-sm border border-border p-3 md:p-6 h-full">
        <ViewRouter currentView={currentView} />
      </div>
    </main>
  );
};

export default MainContent;
