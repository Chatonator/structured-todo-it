import React, { useState } from 'react';
import MainContent from '@/components/layout/MainContent';
import { MobileBottomNavigation } from '@/components/layout/mobile/MobileBottomNavigation';
import { MobileMoreSheet } from '@/components/layout/mobile/MobileMoreSheet';
import { MobileHeader } from '@/components/layout/mobile/MobileHeader';
import { MobileTaskFab } from '@/components/layout/mobile/MobileTaskFab';
import { MobileTaskHubSheet } from '@/components/layout/mobile/MobileTaskHubSheet';
import type { TaskContext } from '@/types/task';
import type { Team } from '@/hooks/useTeams';

interface MobileShellProps {
  currentView: string;
  onViewChange: (viewId: string) => void;
  contextFilter: TaskContext | 'all';
  onContextFilterChange: (value: TaskContext | 'all') => void;
  currentTeam?: Team | null;
  onOpenTaskModal: () => void;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  currentView,
  onViewChange,
  contextFilter,
  onContextFilterChange,
  currentTeam,
  onOpenTaskModal,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isTaskHubOpen, setIsTaskHubOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <MobileHeader
        currentView={currentView}
        contextFilter={contextFilter}
        onContextFilterChange={onContextFilterChange}
        currentTeam={currentTeam}
        onOpenTaskHub={() => setIsTaskHubOpen(true)}
      />

      <div className="flex-1 min-h-0">
        <MainContent className="pb-32" />
      </div>

      <MobileTaskFab onClick={onOpenTaskModal} />
      <MobileBottomNavigation currentView={currentView} onViewChange={onViewChange} onOpenMore={() => setIsMoreOpen(true)} />
      <MobileTaskHubSheet open={isTaskHubOpen} onOpenChange={setIsTaskHubOpen} />
      <MobileMoreSheet open={isMoreOpen} onOpenChange={setIsMoreOpen} currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
};

export default MobileShell;
