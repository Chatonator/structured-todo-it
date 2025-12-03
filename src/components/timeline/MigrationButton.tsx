import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const MigrationButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrated, setIsMigrated] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Vérifier si la migration a déjà été effectuée
  useEffect(() => {
    const checkMigration = async () => {
      if (!user) return;
      
      // Vérifier si des time_events existent déjà
      const { count } = await supabase
        .from('time_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (count && count > 0) {
        setIsMigrated(true);
      }
    };
    
    checkMigration();
  }, [user]);

  const handleMigration = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer la migration",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Session non trouvée');
      }

      const response = await supabase.functions.invoke('migrate-to-unified-time', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      
      if (result.success) {
        setIsMigrated(true);
        toast({
          title: "Migration réussie",
          description: `${result.migrated.tasks} tâches, ${result.migrated.habits} habitudes, ${result.migrated.completions} complétions migrées`,
        });
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "Erreur de migration",
        description: error.message || "Une erreur est survenue lors de la migration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isMigrated) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span>Données synchronisées</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMigration}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      Migrer les données
    </Button>
  );
};
