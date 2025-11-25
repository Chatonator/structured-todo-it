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
import { AccountSettings } from './sections/AccountSettings';
import { InterfaceSettings } from './sections/InterfaceSettings';
import { HabitsSettings } from './sections/HabitsSettings';
import { GamificationSettings } from './sections/GamificationSettings';
import { FocusModeSettings } from './sections/FocusModeSettings';
import { ResetSettings } from './sections/ResetSettings';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [currentSection, setCurrentSection] = useState<SettingsSection>('appearance');

  const renderSection = () => {
    switch (currentSection) {
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'account':
        return <AccountSettings />;
      case 'interface':
        return <InterfaceSettings />;
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
      <DialogContent className="max-w-5xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5" />
            Paramètres
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(85vh-80px)]">
          <div className="p-6">
            <SettingsSidebar 
              currentSection={currentSection} 
              onSectionChange={setCurrentSection} 
            />
          </div>
          
          <ScrollArea className="flex-1 px-6 py-6">
            {renderSection()}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
