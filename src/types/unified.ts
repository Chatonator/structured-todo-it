
/**
 * Types unifiés - Refactoring des types existants
 * Consolidation et amélioration de la sécurité des types
 */

// Import des types existants
import { Task } from './task';
import { FilterParams } from '../lib/types/common';

// Re-export des types existants pour compatibilité
export * from './task';
export * from '../lib/types/common';

// Types étendus avec métadonnées
export interface TaskWithMetadata extends Task {
  metadata: {
    createdAt: Date;
    updatedAt?: Date;
    version: number;
    lastModifiedBy?: string;
  };
}

// Types pour les événements du système
export interface TaskEvent {
  type: 'created' | 'updated' | 'deleted' | 'completed' | 'scheduled';
  taskId: string;
  timestamp: Date;
  data?: Record<string, any>;
}

// Types pour les hooks de données
export interface DataHookResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Types pour les opérations CRUD  
export interface CrudOperations<T> {
  create: (data: Omit<T, 'id'>) => Promise<T>;
  read: (id: string) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  list: (filters?: FilterParams) => Promise<T[]>;
}

// Types pour la gestion d'état
export interface StateManager<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  reset: () => void;
  subscribe: (callback: (state: T) => void) => () => void;
}
