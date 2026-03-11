import React, { useRef, useState, useEffect } from 'react';
import { MoreHorizontal, Home, Telescope, Wrench, Calendar, FolderKanban, Repeat, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { HeaderSurface, NavPill, navPillVariants } from '@/components/primitives/visual';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface ViewNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
}

const iconMap: Record<string, React.ElementType> = {
  home: Home,
  observatory: Telescope,
  toolbox: Wrench,
  timeline: Calendar,
  projects: FolderKanban,
  habits: Repeat,
  rewards: Trophy,
  team: Users,
};

const ViewNavigation: React.FC<ViewNavigationProps> = ({
  currentView,
  onViewChange,
  navigationItems,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showOverflow, setShowOverflow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(navigationItems.length);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth;
        const maxVisible = Math.floor((containerWidth - 60) / 110);
        const shouldOverflow = navigationItems.length > maxVisible;
        setShowOverflow(shouldOverflow);
        setVisibleCount(shouldOverflow ? Math.max(3, maxVisible) : navigationItems.length);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [navigationItems.length]);

  const visibleItems = navigationItems.slice(0, visibleCount);
  const overflowItems = navigationItems.slice(visibleCount);

  const renderNavButton = (item: NavigationItem, inDropdown = false) => {
    const Icon = iconMap[item.key] || Telescope;
    const isActive = currentView === item.key;

    if (inDropdown) {
      return (
        <DropdownMenuItem
          key={item.key}
          onClick={() => onViewChange(item.key)}
          className={cn('gap-2 cursor-pointer', isActive && 'bg-accent font-medium')}
        >
          <Icon className="h-4 w-4" />
          <span>{item.title}</span>
        </DropdownMenuItem>
      );
    }

    return (
      <NavPill
        key={item.key}
        state={isActive ? 'active' : 'inactive'}
        density="desktop"
        onClick={() => onViewChange(item.key)}
        className="gap-2"
      >
        <Icon className="h-4 w-4" />
        <span>{item.title}</span>
      </NavPill>
    );
  };

  return (
    <nav className="pb-3">
      <HeaderSurface className="flex items-center gap-1 overflow-hidden rounded-2xl p-2">
        <div ref={scrollRef} className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
          {visibleItems.map((item) => renderNavButton(item))}
        </div>

        {showOverflow && overflowItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  navPillVariants({ state: overflowItems.some((item) => item.key === currentView) ? 'active' : 'inactive' }),
                  'h-9 w-9 shrink-0 p-0'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {overflowItems.map((item) => renderNavButton(item, true))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </HeaderSurface>
    </nav>
  );
};

export default ViewNavigation;
