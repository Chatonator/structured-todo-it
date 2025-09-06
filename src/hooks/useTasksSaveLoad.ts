import { Task } from '@/types/task';
import React from 'react';

/**
 * This hook has been deprecated. It previously handled local backups and CSV import/export
 * using the browser's localStorage. Since the application now relies on Supabase for persistence,
 * backups and CSV import/export are no longer supported. This stub returns default values
 * and no-op functions to avoid breaking existing imports without providing any functionality.
 */
export const useTasksSaveLoad = (
  tasks: Task[],
  pinnedTasks: string[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setPinnedTasks: React.Dispatch<React.SetStateAction<string[]>>
) => {
  // Return empty backups and no-op functions
  const saveBackup = (name: string) => {
    console.warn('saveBackup is disabled; Supabase handles persistence.');
  };
  const loadBackup = (backupId: string) => {
    console.warn('loadBackup is disabled; Supabase handles persistence.');
  };
  const deleteBackup = (backupId: string) => {
    console.warn('deleteBackup is disabled; Supabase handles persistence.');
  };
  const exportToCSV = () => {
    console.warn('exportToCSV is disabled; Supabase handles persistence.');
  };
  const importFromCSV = async (_file: File) => {
    console.warn('importFromCSV is disabled; Supabase handles persistence.');
  };

  return {
    backups: [] as any[],
    saveBackup,
    loadBackup,
    deleteBackup,
    exportToCSV,
    importFromCSV,
  };
};
