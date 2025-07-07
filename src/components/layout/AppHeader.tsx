
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Undo, Redo, Save, FolderOpen, Cloud, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import UserOptionsMenu from '@/components/UserOptionsMenu';

interface AppHeaderProps {
  tasksCount: number;
  completedTasks: number;
  completionRate: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenModal: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  tasksCount,
  completedTasks,
  completionRate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenModal
}) => {
  const { toast } = useToast();
  const { exportToCSV, importFromCSV } = useTasks();

  const handleExportCSV = async () => {
    try {
      await exportToCSV();
      toast({
        title: "Export réussi",
        description: "Les tâches ont été exportées en CSV",
      });
    } catch (error) {
      console.warn('Erreur export CSV:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les tâches",
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            await importFromCSV(file);
            toast({
              title: "Import réussi",
              description: "Les tâches ont été importées depuis le CSV",
            });
          } catch (error) {
            console.warn('Erreur import CSV:', error);
            toast({
              title: "Erreur d'import",
              description: "Impossible d'importer les tâches",
              variant: "destructive",
            });
          }
        }
      };
      input.click();
    } catch (error) {
      console.warn('Erreur sélection fichier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner le fichier",
        variant: "destructive",
      });
    }
  };

  const handleSaveToSupabase = async () => {
    try {
      // TODO: Implémenter saveTasksToSupabase
      toast({
        title: "Fonctionnalité en développement",
        description: "La sauvegarde cloud sera disponible prochainement",
      });
    } catch (error) {
      console.warn('Erreur sauvegarde Supabase:', error);
      toast({
        title: "Erreur réseau",
        description: "Impossible de sauvegarder sur le cloud",
        variant: "destructive",
      });
    }
  };

  const handleLoadFromSupabase = async () => {
    try {
      const confirmed = confirm("Cette action remplacera vos tâches actuelles. Continuer ?");
      if (confirmed) {
        // TODO: Implémenter loadTasksFromSupabase
        toast({
          title: "Fonctionnalité en développement",
          description: "Le chargement cloud sera disponible prochainement",
        });
      }
    } catch (error) {
      console.warn('Erreur chargement Supabase:', error);
      toast({
        title: "Erreur réseau",
        description: "Impossible de charger depuis le cloud",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TO-DO-IT</h1>
              <p className="text-xs text-muted-foreground">Gestion mentale simplifiée</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Historique */}
            <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg border border-border">
              <span className="text-xs text-muted-foreground font-medium">Historique:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary disabled:opacity-50"
                title="Annuler (Ctrl+Z)"
              >
                <Undo className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary disabled:opacity-50"
                title="Refaire (Ctrl+Y)"
              >
                <Redo className="w-3 h-3" />
              </Button>
            </div>

            {/* Export/Import CSV */}
            <div className="flex items-center gap-1 px-3 py-1 bg-accent rounded-lg border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                title="Exporter en CSV"
              >
                💾
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportCSV}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                title="Importer CSV"
              >
                📂
              </Button>
            </div>

            {/* Cloud Supabase */}
            <div className="flex items-center gap-1 px-3 py-1 bg-accent rounded-lg border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveToSupabase}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                title="Sauvegarder sur le cloud"
              >
                ☁️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadFromSupabase}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                title="Charger depuis le cloud"
              >
                📥
              </Button>
            </div>

            {/* Statistiques */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{tasksCount} actives</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{completedTasks} terminées</span>
              </span>
              <span>{completionRate}% complet</span>
            </div>
            
            <Button
              onClick={onOpenModal}
              className="bg-primary hover:opacity-90 text-primary-foreground transition-opacity"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle tâche
            </Button>
            
            <UserOptionsMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
