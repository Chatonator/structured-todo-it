
import React from 'react';

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
          <button
            key={item.key}
            onClick={() => onViewChange(item.key)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${currentView === item.key 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            `}
          >
            <span className="text-base">{item.title}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default AppNavigation;
