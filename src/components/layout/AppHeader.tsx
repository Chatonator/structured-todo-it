import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Menu } from 'lucide-react';
import { TaskContext } from '@/types/task';
import UnifiedContextSelector from '@/components/layout/UnifiedContextSelector';
import UserProfileBlock from '@/components/layout/UserProfileBlock';

interface AppHeaderProps {
  onOpenModal: () => void;
  onOpenTaskList?: () => void;
  isMobile?: boolean;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenModal,
  onOpenTaskList,
  isMobile = false,
  contextFilter,
  onContextFilterChange
}) => {
  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="px-3 md:px-6 py-3 md:py-4 space-y-3">
        {/* Première ligne : Logo, titre, bouton nouvelle tâche, profil gamifié */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo et titre */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Bouton menu hamburger sur mobile */}
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
            
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TO-DO-IT</h1>
              {!isMobile && (
                <p className="text-xs text-muted-foreground">Gestion sécurisée des tâches</p>
              )}
            </div>
          </div>
          
          {/* Bouton nouvelle tâche + Profil */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onOpenModal}
              size={isMobile ? "sm" : "default"}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              {!isMobile && "Nouvelle tâche"}
            </Button>
            
            {!isMobile && <UserProfileBlock />}
          </div>
        </div>

        {/* Deuxième ligne : Sélecteur unifié (contexte + équipes) */}
        {!isMobile && (
          <div className="flex items-center">
            <UnifiedContextSelector
              contextFilter={contextFilter}
              onContextFilterChange={onContextFilterChange}
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
