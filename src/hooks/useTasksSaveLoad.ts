import { useState } from 'react';
import { Task, TaskCategory, SubTaskCategory, TaskContext } from '@/types/task';

interface TaskBackup {
  id: string;
  name: string;
  tasks: Task[];
  pinnedTasks: string[];
  createdAt: Date;
}

/**
 * Hook pour la sauvegarde/chargement et import/export CSV
 */
export const useTasksSaveLoad = (
  tasks: Task[],
  pinnedTasks: string[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setPinnedTasks: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const [backups, setBackups] = useState<TaskBackup[]>(() => {
    try {
      const saved = localStorage.getItem('todo-it-backups');
      return saved ? JSON.parse(saved).map((backup: any) => ({
        ...backup,
        createdAt: new Date(backup.createdAt),
        tasks: backup.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined
        }))
      })) : [];
    } catch {
      return [];
    }
  });

  // Sauvegarder la liste actuelle
  const saveBackup = (name: string) => {
    const backup: TaskBackup = {
      id: crypto.randomUUID(),
      name,
      tasks,
      pinnedTasks,
      createdAt: new Date()
    };

    const newBackups = [backup, ...backups].slice(0, 10); // Garder max 10 sauvegardes
    setBackups(newBackups);
    localStorage.setItem('todo-it-backups', JSON.stringify(newBackups));
    console.log('Sauvegarde créée:', name);
  };

  // Charger une sauvegarde
  const loadBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (backup) {
      setTasks(backup.tasks);
      setPinnedTasks(backup.pinnedTasks);
      console.log('Sauvegarde chargée:', backup.name);
    }
  };

  // Supprimer une sauvegarde
  const deleteBackup = (backupId: string) => {
    const newBackups = backups.filter(b => b.id !== backupId);
    setBackups(newBackups);
    localStorage.setItem('todo-it-backups', JSON.stringify(newBackups));
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Nom', 'Catégorie', 'Sous-catégorie', 'Contexte', 'Temps estimé', 'Niveau', 'Parent ID', 'Terminé', 'Date planifiée', 'Heure planifiée'];
    
    const csvContent = [
      headers.join(','),
      ...tasks.map(task => [
        `"${task.name.replace(/"/g, '""')}"`,
        task.category,
        task.subCategory || '',
        task.context,
        task.estimatedTime,
        task.level,
        task.parentId || '',
        task.isCompleted ? 'Oui' : 'Non',
        task.scheduledDate ? task.scheduledDate.toISOString().split('T')[0] : '',
        task.scheduledTime || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taches_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Fonctions de validation pour l'import
  const isValidCategory = (value: string): value is TaskCategory => {
    return ['Obligation', 'Quotidien', 'Envie', 'Autres'].includes(value);
  };

  const isValidSubCategory = (value: string): value is SubTaskCategory => {
    return ['Le plus important', 'Important', 'Peut attendre', 'Si j\'ai le temps'].includes(value);
  };

  const isValidContext = (value: string): value is TaskContext => {
    return ['Pro', 'Perso'].includes(value);
  };

  const isValidLevel = (value: string): boolean => {
    const num = parseInt(value);
    return [0, 1, 2].includes(num);
  };

  // Import CSV avec validation des types
  const importFromCSV = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          
          const importedTasks: Task[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',');
            if (values.length < headers.length) continue;
            
            // Validation et nettoyage des données
            const category = isValidCategory(values[1]) ? values[1] : 'Autres';
            const subCategory = values[2] && isValidSubCategory(values[2]) ? values[2] : undefined;
            const context = isValidContext(values[3]) ? values[3] : 'Perso';
            const level = isValidLevel(values[5]) ? parseInt(values[5]) as 0 | 1 | 2 : 0;
            
            const task: Task = {
              id: crypto.randomUUID(),
              name: values[0].replace(/^"|"$/g, '').replace(/""/g, '"'),
              category,
              subCategory,
              context,
              estimatedTime: parseInt(values[4]) || 30,
              level,
              parentId: values[6] || undefined,
              isCompleted: values[7] === 'Oui',
              isExpanded: true,
              createdAt: new Date(),
              scheduledDate: values[8] ? new Date(values[8]) : undefined,
              scheduledTime: values[9] || undefined
            };
            
            importedTasks.push(task);
          }
          
          setTasks(importedTasks);
          setPinnedTasks([]);
          console.log('Import CSV réussi:', importedTasks.length, 'tâches');
          resolve();
        } catch (error) {
          console.error('Erreur import CSV:', error);
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  return {
    backups,
    saveBackup,
    loadBackup,
    deleteBackup,
    exportToCSV,
    importFromCSV
  };
};
