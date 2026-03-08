import React from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

const SidebarQuickAdd: React.FC = () => {
  const { contextFilter, setIsModalOpen } = useApp();

  return (
    <Button
      size="sm"
      className="w-full justify-start h-8 text-xs shadow-sm hover:shadow-md transition-all duration-200"
      onClick={() => setIsModalOpen(true)}
    >
      <Plus className="w-3.5 h-3.5 mr-1.5" />
      <span className="font-medium">
        {contextFilter === 'Perso' ? 'Tâche Perso'
          : contextFilter === 'Pro' ? 'Tâche Pro'
          : 'Nouvelle tâche'}
      </span>
    </Button>
  );
};

export default SidebarQuickAdd;
