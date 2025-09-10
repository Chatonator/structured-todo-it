import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Undo, Redo } from 'lucide-react';
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
              <p className="text-xs text-muted-foreground">Gestion sécurisée des tâches</p>
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
                className="h-6 w-6 p-0 disabled:opacity-50"
                title="Annuler (Ctrl+Z)"
              >
                <Undo className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-6 w-6 p-0 disabled:opacity-50"
                title="Refaire (Ctrl+Y)"
              >
                <Redo className="w-3 h-3" />
              </Button>
            </div>

            {/* Statistiques */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{tasksCount} actives</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-system-success rounded-full"></div>
                <span>{completedTasks} terminées</span>
              </span>
              <span>{completionRate}% complet</span>
            </div>
            
            <Button
              onClick={onOpenModal}
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