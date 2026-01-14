import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Task } from '@/types/task';

// Global filter interface
export interface GlobalFilters {
  search: string;
  context: string;
  category: string;
  priority: string;
  status: 'all' | 'active' | 'completed';
}

// App context interface
export interface AppContextValue {
  // Navigation
  currentView: string;
  setCurrentView: (view: string) => void;
  navigateTo: (view: string, params?: Record<string, any>) => void;
  viewParams: Record<string, any>;
  
  // Selection
  selectedItems: string[];
  toggleSelection: (id: string) => void;
  selectItems: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Filters
  filters: GlobalFilters;
  updateFilters: (updates: Partial<GlobalFilters>) => void;
  resetFilters: () => void;
  
  // Modals & UI State
  isTaskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  
  // Actions
  openTaskModal: (task?: Task) => void;
  closeTaskModal: () => void;
}

const defaultFilters: GlobalFilters = {
  search: '',
  context: 'all',
  category: 'all',
  priority: 'all',
  status: 'all',
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export interface AppProviderProps {
  children: ReactNode;
  defaultView?: string;
}

export const AppProvider: React.FC<AppProviderProps> = ({ 
  children, 
  defaultView = 'home' 
}) => {
  // Navigation state
  const [currentView, setCurrentView] = useState(defaultView);
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);
  
  // Modal state
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Navigation handlers
  const navigateTo = useCallback((view: string, params?: Record<string, any>) => {
    setCurrentView(view);
    setViewParams(params || {});
    // Clear selection when navigating
    setSelectedItems([]);
  }, []);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  }, []);

  const selectItems = useCallback((ids: string[]) => {
    setSelectedItems(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  // Filter handlers
  const updateFilters = useCallback((updates: Partial<GlobalFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Modal actions
  const openTaskModal = useCallback((task?: Task) => {
    setEditingTask(task || null);
    setTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  // Memoize context value
  const contextValue = useMemo<AppContextValue>(() => ({
    // Navigation
    currentView,
    setCurrentView,
    navigateTo,
    viewParams,
    
    // Selection
    selectedItems,
    toggleSelection,
    selectItems,
    clearSelection,
    isSelected,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Modals
    isTaskModalOpen,
    setTaskModalOpen,
    editingTask,
    setEditingTask,
    
    // Actions
    openTaskModal,
    closeTaskModal,
  }), [
    currentView,
    viewParams,
    selectedItems,
    toggleSelection,
    selectItems,
    clearSelection,
    isSelected,
    filters,
    updateFilters,
    resetFilters,
    isTaskModalOpen,
    editingTask,
    openTaskModal,
    closeTaskModal,
    navigateTo,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the app context
export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Specialized hooks for specific functionality
export const useAppNavigation = () => {
  const { currentView, setCurrentView, navigateTo, viewParams } = useApp();
  return { currentView, setCurrentView, navigateTo, viewParams };
};

export const useAppSelection = () => {
  const { selectedItems, toggleSelection, selectItems, clearSelection, isSelected } = useApp();
  return { selectedItems, toggleSelection, selectItems, clearSelection, isSelected };
};

export const useAppFilters = () => {
  const { filters, updateFilters, resetFilters } = useApp();
  return { filters, updateFilters, resetFilters };
};

export const useTaskModal = () => {
  const { isTaskModalOpen, editingTask, openTaskModal, closeTaskModal, setTaskModalOpen, setEditingTask } = useApp();
  return { isTaskModalOpen, editingTask, openTaskModal, closeTaskModal, setTaskModalOpen, setEditingTask };
};

export default AppContext;
