import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Task } from '@/types/task';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// Types
export type ContextFilter = 'Pro' | 'Perso' | 'all';

export interface NavigationItem {
  key: string;
  title: string;
  icon: string;
}

// App context interface
export interface AppContextValue {
  // Navigation
  currentView: string;
  setCurrentView: (view: string) => void;
  navigationItems: NavigationItem[];
  
  // UI State
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isTaskListOpen: boolean;
  setIsTaskListOpen: (open: boolean) => void;
  
  // Selection
  selectedItems: string[];
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Filters
  contextFilter: ContextFilter;
  setContextFilter: (filter: ContextFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Task Modal
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  openTaskModal: (task?: Task) => void;
  closeTaskModal: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export interface AppProviderProps {
  children: ReactNode;
  defaultView?: string;
}

// Configuration de la navigation
const allNavigationItems: NavigationItem[] = [
  { key: 'home', title: 'Home', icon: '🏠' },
  { key: 'observatory', title: 'Observatoire', icon: '🔭' },
  { key: 'toolbox', title: 'Boîte à outils', icon: '🧰' },
  { key: 'timeline', title: 'Timeline', icon: '⏱️' },
  { key: 'projects', title: 'Projets', icon: '💼' },
  { key: 'habits', title: 'Habitudes', icon: '💪' },
  { key: 'rewards', title: 'Récompenses', icon: '🏆' },
];

export const AppProvider: React.FC<AppProviderProps> = ({ 
  children, 
  defaultView = 'home' 
}) => {
  const { preferences } = useUserPreferences();
  
  // Navigation state
  const [currentView, setCurrentView] = useState(defaultView);
  
  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Filter state
  const [contextFilter, setContextFilter] = useState<ContextFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Navigation items filtrées et ordonnées
  const navigationItems = useMemo(() => {
    const orderMap = new Map(
      preferences.categoryOrder.map(cat => [cat.id, { order: cat.order, visible: cat.visible }])
    );

    return allNavigationItems
      .filter(item => {
        const pref = orderMap.get(item.key);
        return pref ? pref.visible : true;
      })
      .sort((a, b) => {
        const orderA = orderMap.get(a.key)?.order ?? 999;
        const orderB = orderMap.get(b.key)?.order ?? 999;
        return orderA - orderB;
      });
  }, [preferences.categoryOrder]);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    if (!id) return;
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Modal actions
  const openTaskModal = useCallback((task?: Task) => {
    setEditingTask(task || null);
    setIsModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  // Memoize context value
  const contextValue = useMemo<AppContextValue>(() => ({
    // Navigation
    currentView,
    setCurrentView,
    navigationItems,
    
    // UI State
    isModalOpen,
    setIsModalOpen,
    isTaskListOpen,
    setIsTaskListOpen,
    
    // Selection
    selectedItems,
    toggleSelection,
    clearSelection,
    
    // Filters
    contextFilter,
    setContextFilter,
    searchQuery,
    setSearchQuery,
    
    // Task Modal
    editingTask,
    setEditingTask,
    openTaskModal,
    closeTaskModal,
  }), [
    currentView,
    navigationItems,
    isModalOpen,
    isTaskListOpen,
    selectedItems,
    toggleSelection,
    clearSelection,
    contextFilter,
    searchQuery,
    editingTask,
    openTaskModal,
    closeTaskModal,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook principal
export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Hooks spécialisés
export const useAppNavigation = () => {
  const { currentView, setCurrentView, navigationItems } = useApp();
  return { currentView, setCurrentView, navigationItems };
};

export const useAppFilters = () => {
  const { contextFilter, setContextFilter, searchQuery, setSearchQuery } = useApp();
  return { contextFilter, setContextFilter, searchQuery, setSearchQuery };
};

export const useTaskModal = () => {
  const { isModalOpen, editingTask, openTaskModal, closeTaskModal, setIsModalOpen, setEditingTask } = useApp();
  return { isModalOpen, editingTask, openTaskModal, closeTaskModal, setIsModalOpen, setEditingTask };
};

export default AppContext;
