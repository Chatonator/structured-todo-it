import React, { useState } from 'react';
import { User, LogOut, Users, Settings, Bug } from 'lucide-react';

const ADMIN_USER_ID = 'a72dc5ca-c281-46c0-a16c-139676705564';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '@/components/settings/SettingsModal';

const UserProfileBlock: React.FC = () => {
  const { user, signOut } = useAuth();
  const { progress, getProgressPercentage } = useGamification();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const xpPercentage = getProgressPercentage();

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-3 rounded-lg border border-border/70 bg-background/82 px-3 py-2 shadow-md backdrop-blur transition-colors hover:bg-background/92">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start gap-1 min-w-[120px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Niveau {progress?.currentLevel || 1}
              </span>
              <span className="text-xs font-semibold text-foreground/88">
                {progress?.totalXp || 0} XP
              </span>
            </div>
            <Progress 
              value={xpPercentage} 
              className="h-1.5 w-full bg-background/88"
            />
          </div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 bg-background border-border">
        <DropdownMenuLabel className="text-foreground">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate">{user?.email || 'Utilisateur'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Niveau {progress?.currentLevel || 1}</span>
              <span>{progress?.totalXp || 0} / {progress?.xpForNextLevel || 100} XP</span>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={() => setIsSettingsOpen(true)}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/teams')}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Mes équipes
        </DropdownMenuItem>
        {user?.id === ADMIN_USER_ID && (
          <DropdownMenuItem 
            onClick={() => navigate('/admin/bugs')}
            className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Admin — Bug Reports
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default UserProfileBlock;
