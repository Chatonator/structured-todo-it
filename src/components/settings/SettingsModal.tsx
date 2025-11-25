import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Bell, Palette } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5" />
            Paramètres
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Apparence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Paramètres généraux</h3>
              <p className="text-sm text-muted-foreground">
                Configurez les paramètres généraux de l'application
              </p>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Profil utilisateur</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos informations personnelles
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos préférences de notifications
              </p>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Apparence</h3>
              <p className="text-sm text-muted-foreground">
                Personnalisez l'apparence de l'application
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
