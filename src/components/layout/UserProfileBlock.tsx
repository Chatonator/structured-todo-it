import React, { useState } from 'react';
import { User, LogOut, Users, Settings, Bug } from 'lucide-react';
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
import { ProfileSurface } from '@/components/primitives/visual';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const ADMIN_USER_ID = 'a72dc5ca-c281-46c0-a16c-139676705564';

const UserProfileBlock: React.FC = () => {
  const { user, signOut } = useAuth();
  const { progress, getProgressPercentage } = useGamification();
  const { preferences } = useUserPreferences();
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
          <button type="button" className="group text-left">
            <ProfileSurface className="transition-colors hover:bg-card">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-[120px] flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className="type-filter-label">Niveau {progress?.currentLevel || 1}</span>
                  {preferences.showXpInHeader && (
                    <span className="type-meta tracking-tight">{progress?.totalXp || 0} XP</span>
                  )}
                </div>
                {preferences.showXpInHeader && (
                  <Progress value={xpPercentage} className="h-1.5 w-full bg-muted/80" />
                )}
              </div>
            </ProfileSurface>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 border-border bg-background">
          <DropdownMenuLabel className="text-foreground">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="truncate">{user?.email || 'Utilisateur'}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Niveau {progress?.currentLevel || 1}</span>
                <span>{progress?.totalXp || 0} / {progress?.xpForNextLevel || 100} XP</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="flex cursor-pointer items-center gap-2 text-foreground hover:bg-accent">
            <Settings className="h-4 w-4" />
            Paramètres
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate('/teams')} className="flex cursor-pointer items-center gap-2 text-foreground hover:bg-accent">
            <Users className="h-4 w-4" />
            Mes équipes
          </DropdownMenuItem>
          {user?.id === ADMIN_USER_ID && (
            <DropdownMenuItem onClick={() => navigate('/admin/bugs')} className="flex cursor-pointer items-center gap-2 text-foreground hover:bg-accent">
              <Bug className="h-4 w-4" />
              Admin — Bug Reports
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem onClick={handleSignOut} className="flex cursor-pointer items-center gap-2 text-foreground hover:bg-accent">
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

