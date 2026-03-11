import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileTaskFabProps {
  onClick: () => void;
}

export const MobileTaskFab: React.FC<MobileTaskFabProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-4 z-40 h-14 rounded-full px-5 shadow-lg"
    >
      <Plus className="mr-2 h-5 w-5" />
      Nouvelle tâche
    </Button>
  );
};

export default MobileTaskFab;
