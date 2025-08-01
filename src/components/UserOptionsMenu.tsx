
import React from 'react';
import { Cog, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTheme, Theme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

const UserOptionsMenu = () => {
  const { theme, changeTheme } = useTheme();
  const { user, signOut } = useAuth();

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: 'light', label: 'Clair', description: 'Thème classique' },
    { value: 'dark', label: 'Sombre', description: 'Thème sombre' },
    { value: 'colorblind', label: 'Daltonien', description: 'Adapté aux daltoniens' },
    { value: 'high-contrast', label: 'Contraste élevé', description: 'Contraste renforcé' }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-accent transition-colors"
        >
          <Cog className="h-4 w-4 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background border-border">
        <DropdownMenuLabel className="text-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          {user?.email || 'Utilisateur'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuLabel className="text-foreground">
          Options d'apparence
        </DropdownMenuLabel>
        
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Thème</div>
          <div className="space-y-1">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => changeTheme(themeOption.value)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                  hover:bg-accent
                  ${theme === themeOption.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground'
                  }
                `}
              >
                <div className="font-medium">{themeOption.label}</div>
                <div className="text-xs opacity-70">{themeOption.description}</div>
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserOptionsMenu;
