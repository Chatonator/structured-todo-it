import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TaskContext } from '@/types/task';
import UnifiedContextSelector from '@/components/layout/UnifiedContextSelector';
import UserProfileBlock from '@/components/layout/UserProfileBlock';
import { useIsMobile } from '@/hooks/shared/use-mobile';

interface NewAppHeaderProps {
  onOpenModal: () => void;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (context: TaskContext | 'all') => void;
}

/**
 * Nouveau header simplifié pour TO-DO-IT 2.0
 * Plus compact, avec effet glass et meilleure intégration avec la sidebar
 */
const NewAppHeader: React.FC<NewAppHeaderProps> = ({
  onOpenModal,
  contextFilter,
  onContextFilterChange
}) => {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 gap-4">
        {/* Gauche: Trigger sidebar (mobile) */}
        <div className="flex items-center gap-3">
          {isMobile && <SidebarTrigger />}
        </div>

        {/* Centre: Sélecteur de contexte */}
        <div className="flex-1 flex justify-center">
          <UnifiedContextSelector
            contextFilter={contextFilter}
            onContextFilterChange={onContextFilterChange}
          />
        </div>

        {/* Droite: Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onOpenModal}
            size="sm"
            className="shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Nouvelle tâche</span>}
          </Button>
          
          {!isMobile && <UserProfileBlock />}
        </div>
      </div>
    </header>
  );
};

export default NewAppHeader;
