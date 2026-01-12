import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Menu, Search } from 'lucide-react';
import { TaskContext } from '@/types/task';
import ContextPills from '@/components/layout/ContextPills';
import ViewNavigation from '@/components/layout/ViewNavigation';
import UserProfileBlock from '@/components/layout/UserProfileBlock';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface HeaderBarProps {
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
 * HeaderBar - Composant de header bicouche
 * Niveau 1: Logo, recherche, actions
 * Niveau 2: Contextes et navigation des vues
 */
const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenModal,
  onOpenTaskList,
  isMobile = false,
  contextFilter,
  onContextFilterChange,
  currentView,
  onViewChange,
  navigationItems
}) => {
  return (
    <header className="bg-background border-b border-border">
      {/* Niveau 1 - Barre principale */}
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo et titre */}
          <div className="flex items-center gap-2 md:gap-3">
            {isMobile && onOpenTaskList && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTaskList}
                className="h-9 w-9 p-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-sm">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">TO-DO-IT</h1>
          </div>
          
          {/* Barre de recherche (desktop, optionnel pour future implémentation) */}
          {!isMobile && (
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full h-9 pl-10 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          )}
          
          {/* Actions rapides + Profil */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={onOpenModal}
              size={isMobile ? "sm" : "default"}
              className="shadow-sm hover:shadow-md transition-all duration-200 gap-2"
            >
              <Plus className="w-4 h-4" />
              {!isMobile && <span>Nouvelle tâche</span>}
            </Button>
            
            {!isMobile && <UserProfileBlock />}
          </div>
        </div>
      </div>

      {/* Niveau 2 - Barre contextuelle (desktop seulement) */}
      {!isMobile && (
        <div className="px-4 md:px-6 py-2 bg-muted/20 border-t border-border/30">
          <div className="flex items-center justify-between gap-4">
            {/* Sélecteur de contexte */}
            <ContextPills
              contextFilter={contextFilter}
              onContextFilterChange={onContextFilterChange}
            />
            
            {/* Navigation des vues */}
            <div className="flex-1 flex justify-end">
              <ViewNavigation
                currentView={currentView}
                onViewChange={onViewChange}
                navigationItems={navigationItems}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderBar;
