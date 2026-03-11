import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMobilePrimaryViews, isPrimaryMobileView } from '@/components/routing/viewRegistry';
import { cn } from '@/lib/utils';

interface MobileBottomNavigationProps {
  currentView: string;
  onViewChange: (viewId: string) => void;
  onOpenMore: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  currentView,
  onViewChange,
  onOpenMore,
}) => {
  const primaryViews = getMobilePrimaryViews();
  const isMoreActive = !isPrimaryMobileView(currentView);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="grid grid-cols-5 gap-1 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2">
        {primaryViews.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;

          return (
            <Button
              key={view.id}
              variant="ghost"
              onClick={() => onViewChange(view.id)}
              className={cn(
                'h-14 rounded-2xl px-2 py-2 text-xs',
                'flex flex-col items-center justify-center gap-1',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{view.title}</span>
            </Button>
          );
        })}

        <Button
          variant="ghost"
          onClick={onOpenMore}
          className={cn(
            'h-14 rounded-2xl px-2 py-2 text-xs',
            'flex flex-col items-center justify-center gap-1',
            isMoreActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>Plus</span>
        </Button>
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;
