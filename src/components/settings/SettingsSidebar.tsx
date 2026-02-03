import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Bell, 
  User, 
  Layout, 
  Heart, 
  Award, 
  Focus, 
  RotateCcw,
  CalendarDays
} from 'lucide-react';

export type SettingsSection = 
  | 'appearance' 
  | 'notifications' 
  | 'account' 
  | 'interface' 
  | 'habits' 
  | 'gamification' 
  | 'focus'
  | 'timeline'
  | 'reset';

interface SettingsSidebarProps {
  currentSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const sections = [
  { id: 'appearance' as const, label: 'Apparence', icon: Palette },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'account' as const, label: 'Compte & Sécurité', icon: User },
  { id: 'interface' as const, label: 'Interface', icon: Layout },
  { id: 'timeline' as const, label: 'Timeline', icon: CalendarDays },
  { id: 'habits' as const, label: 'Habitudes', icon: Heart },
  { id: 'gamification' as const, label: 'Gamification', icon: Award },
  { id: 'focus' as const, label: 'Mode Focus', icon: Focus },
  { id: 'reset' as const, label: 'Réinitialisation', icon: RotateCcw },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ 
  currentSection, 
  onSectionChange 
}) => {
  return (
    <nav className="w-64 border-r border-border pr-4 space-y-1">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Button
            key={section.id}
            variant={currentSection === section.id ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSectionChange(section.id)}
          >
            <Icon className="w-4 h-4 mr-2" />
            {section.label}
          </Button>
        );
      })}
    </nav>
  );
};
