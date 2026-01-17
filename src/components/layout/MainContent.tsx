import React from 'react';
import { ViewRouter } from '@/components/routing/ViewRouter';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface MainContentProps {
  className?: string;
}

/**
 * Composant principal pour le rendu des vues
 * Conteneur optimisé sans double padding - les vues gèrent leur propre espacement via ViewLayout
 */
export const MainContent: React.FC<MainContentProps> = ({ className }) => {
  const { currentView } = useApp();

  return (
    <main className={cn(
      "flex-1 overflow-y-auto",
      "p-2 md:p-4",
      className
    )}>
      <div className="bg-card rounded-lg shadow-sm border border-border h-full overflow-hidden">
        <ViewRouter currentView={currentView} />
      </div>
    </main>
  );
};

export default MainContent;
