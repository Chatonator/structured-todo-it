import { useState, useMemo, useCallback } from 'react';
import { Task, TaskCategory, TaskContext } from '@/types/task';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export type ContextFilter = 'Pro' | 'Perso' | 'all';
export type SortOption = 'name' | 'duration' | 'category';

/**
 * Hook centralisant la gestion de l'état de l'application
 * - Navigation entre les vues
 * - Filtres globaux (contexte, catégorie, recherche)
 * - Gestion des éléments de navigation
 */
export const useAppState = () => {
  const { preferences } = useUserPreferences();
  
  // États de navigation
  const [currentView, setCurrentView] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [isTaskListCollapsed, setIsTaskListCollapsed] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // États des filtres globaux
  const [contextFilter, setContextFilter] = useState<ContextFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Configuration de la navigation
  const allNavigationItems = [
    { key: 'home', title: 'Home', icon: '🏠' },
    { key: 'tasks', title: 'Tâches', icon: '📝' },
    { key: 'eisenhower', title: 'Eisenhower', icon: '🧭' },
    { key: 'timeline', title: 'Timeline', icon: '⏱️' },
    { key: 'projects', title: 'Projets', icon: '💼' },
    { key: 'habits', title: 'Habitudes', icon: '💪' },
    { key: 'rewards', title: 'Récompenses', icon: '🏆' },
    { key: 'completed', title: 'Terminées', icon: '✅' }
  ];

  // Filtrer et ordonner selon les préférences utilisateur
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

  // Gestion de la sélection sécurisée
  const handleToggleSelection = useCallback((taskId: string) => {
    if (!taskId || typeof taskId !== 'string') {
      console.warn('handleToggleSelection appelé avec un taskId invalide:', taskId);
      return;
    }
    
    setSelectedTasks(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(taskId) 
        ? safePrev.filter(id => id !== taskId)
        : [...safePrev, taskId];
    });
  }, []);

  // Fonction pour appliquer les filtres globaux
  const applyFilters = useCallback((taskList: Task[]) => {
    let filtered = taskList;
    
    if (contextFilter !== 'all') {
      filtered = filtered.filter(task => task.context === contextFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [contextFilter, categoryFilter, searchQuery]);

  // Fonction pour filtrer selon la vue courante
  const getFilteredTasks = useCallback((tasks: Task[]) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    let filtered = currentView === 'completed' 
      ? safeTasks.filter(task => task && task.isCompleted)
      : safeTasks.filter(task => task && !task.isCompleted);
    
    return applyFilters(filtered);
  }, [currentView, applyFilters]);

  return {
    // Navigation
    currentView,
    setCurrentView,
    navigationItems,
    
    // Modal et drawer
    isModalOpen,
    setIsModalOpen,
    isTaskListOpen,
    setIsTaskListOpen,
    isTaskListCollapsed,
    setIsTaskListCollapsed,
    
    // Sélection
    selectedTasks,
    handleToggleSelection,
    
    // Filtres
    contextFilter,
    setContextFilter,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    
    // Fonctions de filtrage
    applyFilters,
    getFilteredTasks,
    
    // Préférences
    preferences
  };
};
