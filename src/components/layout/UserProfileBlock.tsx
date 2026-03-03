import React, { useState } from 'react';
import { User, LogOut, Users, Settings, Bug, Inbox, MessageSquarePlus } from 'lucide-react';
import MyReportsPanel from '@/components/bugs/MyReportsPanel';
import BugReportModal from '@/components/bugs/BugReportModal';

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
  const [isMyReportsOpen, setIsMyReportsOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

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
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors group">
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
              <span className="text-xs text-muted-foreground">
                {progress?.totalXp || 0} XP
              </span>
            </div>
            <Progress 
              value={xpPercentage} 
              className="h-1.5 w-full bg-muted"
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

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={() => setIsBugReportOpen(true)}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Signaler / Suggérer
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setIsMyReportsOpen(true)}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2"
        >
          <Inbox className="h-4 w-4" />
          Mes réclamations
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
    <MyReportsPanel open={isMyReportsOpen} onOpenChange={setIsMyReportsOpen} />
    <BugReportModal open={isBugReportOpen} onOpenChange={setIsBugReportOpen} />
    </>
  );
};

export default UserProfileBlock;
