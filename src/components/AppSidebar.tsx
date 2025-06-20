
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { CheckSquare } from 'lucide-react';

// Note: Using allowed icons from the constraint
const menuItems = [
  {
    title: 'Liste des tâches',
    icon: 'list',
    key: 'tasks',
    description: 'Gérer vos tâches'
  },
  {
    title: 'Vue 1-3-5',
    icon: 'dice-6',
    key: 'priority',
    description: 'Priorisation intelligente'
  },
  {
    title: 'Dashboard',
    icon: 'layout-dashboard',
    key: 'dashboard',
    description: 'Statistiques et analyses'
  },
  {
    title: 'Vue Eisenhower',
    icon: 'compass',
    key: 'eisenhower',
    description: 'Matrice urgence/importance'
  },
  {
    title: 'Calendrier',
    icon: 'calendar',
    key: 'calendar',
    description: 'Planification temporelle'
  }
];

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ currentView, onViewChange }) => {
  // Create icon components dynamically to avoid lucide-react constraint issues
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'list': '📋',
      'dice-6': '🎲',
      'layout-dashboard': '📊',
      'compass': '🧭',
      'calendar': '📅'
    };
    return iconMap[iconName] || '📋';
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TO-DO-IT</h1>
            <p className="text-xs text-gray-600">Gestion mentale</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.key)}
                    isActive={currentView === item.key}
                    className="w-full justify-start"
                  >
                    <span className="text-lg mr-3">{getIconComponent(item.icon)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500 text-center">
          Version 2.0 - Navigation vues
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
