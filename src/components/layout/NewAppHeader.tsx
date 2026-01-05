import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Menu, PanelLeft } from 'lucide-react';
import { TaskContext } from '@/types/task';
import UnifiedContextSelector from '@/components/layout/UnifiedContextSelector';
import UserProfileBlock from '@/components/layout/UserProfileBlock';
import ViewTabs from '@/components/layout/ViewTabs';
import { useSidebar } from '@/components/ui/sidebar';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface NewAppHeaderProps {
  onOpenModal: () => void;
  onOpenTaskList?: () => void;
  isMobile?: boolean;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
}

/**
 * Nouveau header avec navigation des vues intégrée
 * Design moderne avec effet glass subtil
 */
const NewAppHeader: React.FC<NewAppHeaderProps> = ({
  onOpenModal,
  onOpenTaskList,
  isMobile = false,
  contextFilter,
  onContextFilterChange,
  currentView,
  onViewChange,
  navigationItems
}) => {
  const { toggleSidebar, state } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Gauche: Toggle sidebar + Logo */}
          <div className="flex items-center gap-3">
            {/* Toggle sidebar - desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 shrink-0"
                title={state === 'expanded' ? 'Réduire la sidebar' : 'Étendre la sidebar'}
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            
            {/* Menu mobile */}
            {isMobile && onOpenTaskList && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTaskList}
                className="h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                <CheckSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground whitespace-nowrap hidden sm:block">TO-DO-IT</h1>
            </div>
          </div>
          
          {/* Centre: Navigation des vues (desktop) */}
          {!isMobile && (
            <div className="flex-1 flex justify-center">
              <ViewTabs
                currentView={currentView}
                onViewChange={onViewChange}
                navigationItems={navigationItems}
              />
            </div>
          )}
          
          {/* Droite: Contexte + Actions + Profil */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Sélecteur de contexte (desktop) */}
            {!isMobile && (
              <UnifiedContextSelector
                contextFilter={contextFilter}
                onContextFilterChange={onContextFilterChange}
              />
            )}
            
            {/* Bouton nouvelle tâche */}
            <Button
              onClick={onOpenModal}
              size={isMobile ? "icon" : "default"}
              className="shadow-sm hover:shadow-md transition-shadow bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Nouvelle tâche</span>}
            </Button>
            
            {/* Profil utilisateur */}
            {!isMobile && <UserProfileBlock />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NewAppHeader;
