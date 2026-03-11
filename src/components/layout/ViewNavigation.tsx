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

// Map des icônes par clé de vue
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
  navigationItems
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showOverflow, setShowOverflow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(navigationItems.length);

  // Calcul du nombre d'items visibles basé sur la largeur
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth;
        // Environ 120px par bouton, on garde de la marge pour le menu overflow
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
          className={cn(
            "gap-2 cursor-pointer",
            isActive && "bg-accent font-medium"
          )}
        >
          <Icon className="w-4 h-4" />
          <span>{item.title}</span>
        </DropdownMenuItem>
      );
    }

    return (
      <button
        key={item.key}
        onClick={() => onViewChange(item.key)}
        className={cn(
          "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          isActive 
            ? "bg-background/94 text-foreground shadow-md ring-1 ring-white/65 backdrop-blur" 
            : "text-foreground/92 hover:bg-background/82 hover:text-foreground"
        )}
      >
        <Icon className="w-4 h-4" />
        <span>{item.title}</span>
      </button>
    );
  };

  return (
    <nav className="pb-3">
      <div 
        ref={scrollRef}
        className="flex items-center gap-1 overflow-hidden rounded-xl border border-border/70 bg-background/72 p-1.5 shadow-md backdrop-blur"
      >
        {/* Items visibles avec scroll horizontal */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {visibleItems.map(item => renderNavButton(item))}
        </div>

        {/* Menu overflow */}
        {showOverflow && overflowItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 shrink-0",
                  overflowItems.some(item => item.key === currentView) && "bg-background/90 text-foreground shadow-sm"
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {overflowItems.map(item => renderNavButton(item, true))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};

export default ViewNavigation;
