import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { KanbanColumn, DEFAULT_COLUMNS } from './KanbanBoard';

interface KanbanColumnManagerProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const COLUMN_COLORS = [
  'bg-muted',
  'bg-project/10',
  'bg-green-50 dark:bg-green-900/20',
  'bg-blue-50 dark:bg-blue-900/20',
  'bg-orange-50 dark:bg-orange-900/20',
  'bg-purple-50 dark:bg-purple-900/20',
];

export const KanbanColumnManager: React.FC<KanbanColumnManagerProps> = ({
  columns,
  onColumnsChange,
  isOpen,
  onClose,
}) => {
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>(columns);
  const [newColumnName, setNewColumnName] = useState('');

  const handleAddColumn = () => {
    if (!newColumnName.trim() || localColumns.length >= 6) return;
    
    const newColumn: KanbanColumn = {
      id: `custom-${Date.now()}`,
      name: newColumnName.trim(),
      color: COLUMN_COLORS[localColumns.length % COLUMN_COLORS.length],
      order: localColumns.length,
    };
    
    setLocalColumns([...localColumns, newColumn]);
    setNewColumnName('');
  };

  const handleRemoveColumn = (columnId: string) => {
    if (localColumns.length <= 2) return; // Minimum 2 colonnes
    setLocalColumns(localColumns.filter(c => c.id !== columnId));
  };

  const handleRenameColumn = (columnId: string, newName: string) => {
    setLocalColumns(localColumns.map(c => 
      c.id === columnId ? { ...c, name: newName } : c
    ));
  };

  const handleSave = () => {
    // Reorder columns based on their position
    const reorderedColumns = localColumns.map((col, index) => ({
      ...col,
      order: index
    }));
    onColumnsChange(reorderedColumns);
    onClose();
  };

  const handleReset = () => {
    setLocalColumns(DEFAULT_COLUMNS);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les colonnes Kanban</DialogTitle>
          <DialogDescription>
            Personnalisez les colonnes de votre tableau Kanban. Maximum 6 colonnes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Liste des colonnes existantes */}
          <div className="space-y-2">
            {localColumns.map((column, index) => (
              <div 
                key={column.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-card"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                <div className={`w-4 h-4 rounded ${column.color}`} />
                <Input
                  value={column.name}
                  onChange={(e) => handleRenameColumn(column.id, e.target.value)}
                  className="flex-1 h-8"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveColumn(column.id)}
                  disabled={localColumns.length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Ajouter une nouvelle colonne */}
          {localColumns.length < 6 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="new-column">Nouvelle colonne</Label>
                <Input
                  id="new-column"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Nom de la colonne"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                />
              </div>
              <Button onClick={handleAddColumn} disabled={!newColumnName.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KanbanColumnManager;