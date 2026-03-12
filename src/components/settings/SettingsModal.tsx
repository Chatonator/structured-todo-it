import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { SettingsSidebar, SettingsSection } from './SettingsSidebar';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { NotificationSettings } from './sections/NotificationSettings';
import { TaskRulesSettings } from './sections/TaskRulesSettings';
import { ExternalCalendarSettings } from './sections/ExternalCalendarSettings';
import { AccountSettings } from './sections/AccountSettings';
import { InterfaceSettings } from './sections/InterfaceSettings';
import { HabitsSettings } from './sections/HabitsSettings';
import { GamificationSettings } from './sections/GamificationSettings';
import { FocusModeSettings } from './sections/FocusModeSettings';
import { TimelineSettings } from './sections/TimelineSettings';
import { ResetSettings } from './sections/ResetSettings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useViewport } from '@/contexts/ViewportContext';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { isPhone } = useViewport();
  const [currentSection, setCurrentSection] = useState<SettingsSection>('appearance');

  const renderSection = () => {
    switch (currentSection) {
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'rules':
        return <TaskRulesSettings />;
      case 'calendar':
        return <ExternalCalendarSettings />;
      case 'account':
        return <AccountSettings />;
      case 'interface':
        return <InterfaceSettings />;
      case 'timeline':
        return <TimelineSettings />;
      case 'habits':
        return <HabitsSettings />;
      case 'gamification':
        return <GamificationSettings />;
      case 'focus':
        return <FocusModeSettings />;
      case 'reset':
        return <ResetSettings />;
      default:
        return <AppearanceSettings />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'overflow-hidden p-0',
          isPhone ? 'h-[100dvh] max-w-none rounded-none border-0' : 'max-w-5xl max-h-[85vh]'
        )}
      >
        <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Paramètres
          </DialogTitle>
        </DialogHeader>

        <div className={cn('flex', isPhone ? 'h-[calc(100dvh-88px)] flex-col' : 'h-[calc(85vh-80px)]')}>
          <div className={cn(isPhone ? 'border-b border-border px-4 py-4' : 'p-6')}>
            <SettingsSidebar currentSection={currentSection} onSectionChange={setCurrentSection} compact={isPhone} />
          </div>

          <ScrollArea className={cn('flex-1', isPhone ? 'px-4 py-4' : 'px-6 py-6')}>
            {renderSection()}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
