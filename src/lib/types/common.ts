
/**
 * Types communs et utilitaires
 * Types génériques réutilisables dans toute l'application
 */

// Types utilitaires génériques
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Types pour les états de chargement
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// Types pour les résultats d'API
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Types pour la pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les filtres
export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Types pour les actions utilisateur
export interface UserAction {
  type: string;
  payload?: any;
  timestamp: Date;
  userId?: string;
}

// Types pour la gestion d'erreurs
export interface ErrorInfo {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
}

// Types pour les événements
export interface AppEvent<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  source: string;
}

// Types pour les préférences utilisateur
export interface UserPreferences {
  theme: 'light' | 'dark' | 'high-contrast' | 'colorblind';
  language: 'fr' | 'en';
  notifications: boolean;
  autoSave: boolean;
  defaultView: string;
}

// Types pour la validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Types pour les métadonnées
export interface EntityMetadata {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  version: number;
  createdBy?: string;
  updatedBy?: string;
}

// Types pour les configurations
export interface ConfigOption<T = any> {
  key: string;
  value: T;
  label: string;
  description?: string;
  category?: string;
}
