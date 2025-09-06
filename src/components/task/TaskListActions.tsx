
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload, Download, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskListActionsProps {
  backups: Array<{
    id: string;
    name: string;
    createdAt: Date;
    tasks: any[];
  }>;
  onSaveBackup: (name: string) => void;
  onLoadBackup: (backupId: string) => void;
  onDeleteBackup: (backupId: string) => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => Promise<void>;
}

export const TaskListActions: React.FC<TaskListActionsProps> = ({
  backups,
  onSaveBackup,
  onLoadBackup,
  onDeleteBackup,
  onExportCSV,
  onImportCSV
}) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [selectedBackup, setSelectedBackup] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (backupName.trim()) {
      onSaveBackup(backupName.trim());
      setBackupName('');
      setIsSaveDialogOpen(false);
    }
  };

  const handleLoad = () => {
    if (selectedBackup) {
      onLoadBackup(selectedBackup);
      setIsLoadDialogOpen(false);
      setSelectedBackup('');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      onImportCSV(file).catch(console.error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-theme-border bg-theme-background">
      {/* Sauvegarde */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            Sauvegarder
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder la liste de tâches</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-name">Nom de la sauvegarde</Label>
              <Input
                id="backup-name"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="Ex: Projet en cours..."
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!backupName.trim()}>
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chargement */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={backups.length === 0}>
            <Upload className="w-4 h-4" />
            Charger
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Charger une sauvegarde</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sélectionner une sauvegarde</Label>
              <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une sauvegarde..." />
                </SelectTrigger>
                <SelectContent>
                  {backups.map(backup => (
                    <SelectItem key={backup.id} value={backup.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{backup.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{backup.tasks.length} tâches</span>
                          <span>{format(backup.createdAt, 'dd/MM/yyyy', { locale: fr })}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBackup(backup.id);
                            }}
                            className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLoad} disabled={!selectedBackup}>
                Charger
              </Button>
              <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export CSV */}
      <Button variant="outline" size="sm" className="gap-2" onClick={onExportCSV}>
        <Download className="w-4 h-4" />
        Export CSV
      </Button>

      {/* Import CSV */}
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className="w-4 h-4" />
        Import CSV
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
};
