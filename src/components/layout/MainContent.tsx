import React from 'react';
import { ViewRouter } from '@/components/routing/ViewRouter';
import { useApp } from '@/contexts/AppContext';
import { useViewport } from '@/contexts/ViewportContext';
import { cn } from '@/lib/utils';

interface MainContentProps {
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ className }) => {
  const { currentView } = useApp();
  const { isPhone, isTabletCompact } = useViewport();

  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto',
        isPhone ? 'px-0 py-0' : isTabletCompact ? 'p-4' : 'p-2 md:p-4',
        className
      )}
    >
      <div
        className={cn(
          'h-full overflow-hidden',
          isPhone
            ? 'bg-transparent border-0 rounded-none shadow-none'
            : isTabletCompact
              ? 'bg-card border border-border rounded-[24px] shadow-sm'
              : 'bg-card border border-border rounded-lg shadow-sm'
        )}
      >
        <ViewRouter currentView={currentView} />
      </div>
    </main>
  );
};

export default MainContent;
