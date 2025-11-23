import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profil n'existe pas, le créer
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (createError) throw createError;
          
          setProfile({
            id: newProfile.id,
            userId: newProfile.user_id,
            displayName: newProfile.display_name,
            avatarUrl: null, // Pas encore dans la DB
            createdAt: new Date(newProfile.created_at),
            updatedAt: new Date(newProfile.updated_at)
          });
        } else {
          throw error;
        }
      } else {
        setProfile({
          id: data.id,
          userId: data.user_id,
          displayName: data.display_name,
          avatarUrl: null, // Pas encore dans la DB
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        });
      }
    } catch (error: any) {
      logger.error('Failed to load profile', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: { displayName?: string; avatarUrl?: string }) => {
    if (!user || !profile) return false;

    try {
      const dbUpdates: any = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      // avatarUrl sera géré plus tard avec la migration

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadProfile();
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to update profile', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, profile, loadProfile, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    updateProfile,
    reloadProfile: loadProfile
  };
};
