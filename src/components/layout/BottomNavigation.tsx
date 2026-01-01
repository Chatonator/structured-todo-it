import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Grid3x3, 
  CheckCircle2,
  Heart,
  Award,
  Briefcase,
  Home,
  Clock
} from 'lucide-react';

interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

interface BottomNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  navigationItems: NavigationItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="w-5 h-5" />,
  tasks: <CheckSquare className="w-5 h-5" />,
  eisenhower: <Grid3x3 className="w-5 h-5" />,
  timeline: <Clock className="w-5 h-5" />,
  projects: <Briefcase className="w-5 h-5 text-project" />,
  habits: <Heart className="w-5 h-5 text-habit" />,
  rewards: <Award className="w-5 h-5 text-reward" />,
  completed: <CheckCircle2 className="w-5 h-5" />
};

/**
 * Navigation inférieure pour mobile
 * Affiche les principales vues avec icônes
 */
const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onViewChange,
  navigationItems
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navigationItems.map((item) => (
          <Button
            key={item.key}
            variant="ghost"
            onClick={() => onViewChange(item.key)}
            className={`flex flex-col items-center justify-center h-full flex-1 gap-1 rounded-none ${
              currentView === item.key 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground'
            }`}
          >
            {iconMap[item.key] || <CheckSquare className="w-5 h-5" />}
            <span className="text-xs font-medium">{item.title}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
