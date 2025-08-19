import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusProps {
  status: 'saving' | 'saved' | 'unsaved' | 'error';
  hasUnsavedChanges: boolean;
  canSave: boolean;
  lastSaved?: Date | null;
  lastError?: string | null;
  onManualSave?: () => Promise<boolean>;
  className?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  status,
  hasUnsavedChanges,
  canSave,
  lastSaved,
  lastError,
  onManualSave,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Sauvegarde...',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
      case 'saved':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Sauvegardé',
          variant: 'secondary' as const,
          color: 'text-system-success'
        };
      case 'unsaved':
        return {
          icon: <Save className="w-4 h-4" />,
          text: 'Non sauvegardé',
          variant: 'outline' as const,
          color: 'text-system-warning'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Erreur',
          variant: 'destructive' as const,
          color: 'text-system-error'
        };
    }
  };

  const config = getStatusConfig();

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Indicateur de statut */}
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        <span className={config.color}>{config.text}</span>
      </Badge>

      {/* Bouton de sauvegarde manuelle */}
      {canSave && onManualSave && (
        <Button
          variant="outline"
          size="sm"
          onClick={onManualSave}
          className="h-7 px-2 text-xs"
        >
          <Save className="w-3 h-3 mr-1" />
          Sauvegarder
        </Button>
      )}

      {/* Informations additionnelles */}
      <div className="text-xs text-muted-foreground">
        {lastSaved && status === 'saved' && (
          <span>{formatLastSaved(lastSaved)}</span>
        )}
        {lastError && status === 'error' && (
          <span className="text-system-error" title={lastError}>
            Échec de la sauvegarde
          </span>
        )}
      </div>
    </div>
  );
};