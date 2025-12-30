import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Bouton flottant pour replier/déplier la sidebar
 */
const SidebarCollapseButton: React.FC<SidebarCollapseButtonProps> = ({
  isCollapsed,
  onToggle
}) => {
  return (
    <Button
      onClick={onToggle}
      className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
      title={isCollapsed ? "Déplier la liste des tâches" : "Replier la liste des tâches"}
    >
      {isCollapsed ? (
        <ChevronRight className="w-6 h-6" />
      ) : (
        <ChevronLeft className="w-6 h-6" />
      )}
    </Button>
  );
};

export default SidebarCollapseButton;
