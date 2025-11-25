import React from 'react';
import { SettingsSection } from '../common/SettingsSection';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Trash2, Key } from 'lucide-react';

export const AccountSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La suppression de compte sera bientôt disponible.",
      variant: "destructive",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La modification du mot de passe sera bientôt disponible.",
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Informations du compte"
        description="Gérez vos informations personnelles"
      >
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            className="bg-muted"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sécurité"
        description="Gérez la sécurité de votre compte"
      >
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleChangePassword}
        >
          <Key className="w-4 h-4 mr-2" />
          Modifier le mot de passe
        </Button>
      </SettingsSection>

      <SettingsSection
        title="Actions du compte"
        description="Déconnexion et suppression"
      >
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
          
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer mon compte
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
};
