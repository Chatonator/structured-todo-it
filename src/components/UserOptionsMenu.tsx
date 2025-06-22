
import React from 'react';
import { Cog } from 'lucide-react';
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

const UserOptionsMenu = () => {
  const { theme, changeTheme } = useTheme();

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: 'light', label: 'Clair', description: 'Thème classique' },
    { value: 'dark', label: 'Sombre', description: 'Thème sombre' },
    { value: 'colorblind', label: 'Daltonien', description: 'Adapté aux daltoniens' },
    { value: 'high-contrast', label: 'Contraste élevé', description: 'Contraste renforcé' }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-theme-accent transition-colors"
        >
          <Cog className="h-4 w-4 text-theme-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-theme-background border-theme-border">
        <DropdownMenuLabel className="text-theme-foreground">
          Options d'apparence
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-theme-border" />
        
        <div className="p-2">
          <div className="text-xs font-medium text-theme-muted mb-2">Thème</div>
          <div className="space-y-1">
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => changeTheme(themeOption.value)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                  hover:bg-theme-accent
                  ${theme === themeOption.value 
                    ? 'bg-theme-primary text-theme-primary-foreground' 
                    : 'text-theme-foreground'
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
