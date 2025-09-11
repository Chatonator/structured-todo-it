
import React from 'react';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface AppNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
}

/**
 * Composant de navigation horizontale
 * Gère le changement de vue
 */
const AppNavigation: React.FC<AppNavigationProps> = ({
  currentView,
  onViewChange,
  navigationItems
}) => {
  return (
    <nav className="px-6 pb-3">
      <div className="flex space-x-1">
        {navigationItems.map((item) => (
          <Button
            key={item.key}
            variant={currentView === item.key ? "default" : "ghost"}
            onClick={() => onViewChange(item.key)}
            className="flex items-center space-x-2"
          >
            <span>{item.title}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default AppNavigation;
