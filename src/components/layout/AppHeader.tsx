
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Undo, Redo, Download, Upload, Cloud, CloudDownload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import UserOptionsMenu from '@/components/UserOptionsMenu';
import { saveTasksToSupabase, loadTasksFromSupabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  tasksCount: number;
  completedTasks: number;
  completionRate: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenModal: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => Promise<void>;
  onLoadTasks: (tasks: any[]) => void;
}

/**
 * Composant header principal de l'application
 * Contient le titre, les statistiques et les actions principales
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  tasksCount,
  completedTasks,
  completionRate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenModal,
  onExportCSV,
  onImportCSV,
  onLoadTasks
}) => {
  const [isUserIdDialogOpen, setIsUserIdDialogOpen] = useState(false);
  const [userId, setUserId] = useState(() => localStorage.getItem('todo-it-user-id') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'save' | 'load'>('save');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExportCSV = () => {
    try {
      onExportCSV();
      toast({
        title: "Export réussi",
        description: "Le fichier CSV a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export CSV.",
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onImportCSV(file);
        toast({
          title: "Import réussi",
          description: `${file.name} a été importé avec succès.`,
        });
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Une erreur est survenue lors de l'import du fichier CSV.",
          variant: "destructive",
        });
      }
      // Reset input
      event.target.value = '';
    }
  };

  const handleCloudAction = (actionType: 'save' | 'load') => {
    setAction(actionType);
    setIsUserIdDialogOpen(true);
  };

  const handleConfirmCloudAction = async () => {
    if (!userId.trim()) {
      toast({
        title: "ID utilisateur requis",
        description: "Veuillez saisir un ID utilisateur.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    localStorage.setItem('todo-it-user-id', userId);

    try {
      if (action === 'save') {
        // Récupérer les tâches depuis le localStorage
        const savedTasks = localStorage.getItem('todo-it-tasks');
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks).map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
            startTime: task.startTime ? new Date(task.startTime) : undefined
          }));
          
          await saveTasksToSupabase(tasks, userId);
          toast({
            title: "Sauvegarde réussie",
            description: "Vos tâches ont été sauvegardées dans le cloud.",
          });
        }
      } else {
        const tasks = await loadTasksFromSupabase(userId);
        onLoadTasks(tasks);
        toast({
          title: "Chargement réussi",
          description: `${tasks.length} tâches ont été chargées depuis le cloud.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur cloud",
        description: `Une erreur est survenue lors de la ${action === 'save' ? 'sauvegarde' : 'récupération'}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUserIdDialogOpen(false);
    }
  };

  return (
    <>
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
              {/* Boutons Import/Export CSV */}
              <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg border border-border">
                <span className="text-xs text-muted-foreground font-medium">Fichiers:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  title="Exporter en CSV"
                >
                  💾
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImportCSV}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  title="Importer depuis CSV"
                >
                  📂
                </Button>
              </div>

              {/* Boutons Cloud Supabase */}
              <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg border border-border">
                <span className="text-xs text-muted-foreground font-medium">Cloud:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloudAction('save')}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  title="Envoyer vers le cloud"
                >
                  ☁️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCloudAction('load')}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  title="Récupérer depuis le cloud"
                >
                  📥
                </Button>
              </div>

              {/* Historique relocalisé en haut */}
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

              {/* Statistiques en header */}
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

      {/* Input caché pour l'import de fichier */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Dialog pour l'ID utilisateur Supabase */}
      <Dialog open={isUserIdDialogOpen} onOpenChange={setIsUserIdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'save' ? 'Sauvegarder vers le cloud' : 'Récupérer depuis le cloud'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">ID Utilisateur</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Saisissez votre email ou identifiant"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cet identifiant permet de retrouver vos données dans le cloud
              </p>
            </div>
            
            {action === 'load' && tasksCount > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Attention : Cette action remplacera vos {tasksCount} tâches actuelles.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsUserIdDialogOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmCloudAction}
                disabled={isLoading || !userId.trim()}
              >
                {isLoading ? 'En cours...' : action === 'save' ? 'Sauvegarder' : 'Charger'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppHeader;
