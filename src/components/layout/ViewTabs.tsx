import React from 'react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface ViewTabsProps {
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
}

/**
 * Navigation des vues sous forme de tabs élégants
 * Intégré dans le header
 */
const ViewTabs: React.FC<ViewTabsProps> = ({
  currentView,
  onViewChange,
  navigationItems
}) => {
  return (
    <nav className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/50">
      {navigationItems.map((item) => (
        <button
          key={item.key}
          onClick={() => onViewChange(item.key)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            currentView === item.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          {item.title}
        </button>
      ))}
    </nav>
  );
};

export default ViewTabs;
