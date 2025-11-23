import React from 'react';
import { LogOut, Settings, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = () => {
    if (profile?.displayName) {
      return profile.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Utilisateur';
  const email = user?.email || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/50 transition-all"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile?.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
              {loading ? '...' : getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-card border-border">
        <DropdownMenuLabel className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/30">
              <AvatarImage src={profile?.avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
                {loading ? '...' : getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={() => navigate('/settings')}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2 py-2"
        >
          <Settings className="h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => navigate('/teams')}
          className="text-foreground hover:bg-accent cursor-pointer flex items-center gap-2 py-2"
        >
          <Users className="h-4 w-4" />
          <span>Mes équipes</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer flex items-center gap-2 py-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
