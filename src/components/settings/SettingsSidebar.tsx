import React from 'react';
import {
  Palette,
  Bell,
  User,
  Layout,
  Heart,
  Award,
  Focus,
  RotateCcw,
  CalendarDays,
  CalendarSync,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SettingsSection =
  | 'appearance'
  | 'notifications'
  | 'rules'
  | 'calendar'
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
  compact?: boolean;
}

const sections = [
  { id: 'appearance' as const, label: 'Apparence', icon: Palette },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'rules' as const, label: 'Règles & alertes', icon: TriangleAlert },
  { id: 'calendar' as const, label: 'Agendas externes', icon: CalendarSync },
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
  onSectionChange,
  compact = false,
}) => {
  return (
    <nav className={cn(compact ? 'flex gap-2 overflow-x-auto pb-1' : 'w-64 space-y-1 border-r border-border pr-4')}>
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Button
            key={section.id}
            variant={currentSection === section.id ? 'secondary' : 'ghost'}
            className={cn(compact ? 'shrink-0 rounded-full' : 'w-full justify-start')}
            onClick={() => onSectionChange(section.id)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {section.label}
          </Button>
        );
      })}
    </nav>
  );
};
