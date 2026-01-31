/**
 * Hook générique pour filtrer et trier les tâches
 * Utilisé par ProjectDetail (perso) et TeamProjectDetail (équipe)
 */

import { useState, useCallback, useMemo } from 'react';
import { SubTaskCategory, SUB_CATEGORY_CONFIG } from '@/types/task';
import { SortOption, PriorityFilter, TeamSortOption } from '@/config/taskFilterOptions';

export interface UseTaskFiltersOptions<T> {
  tasks: T[];
  getTaskName: (task: T) => string;
  getSubCategory: (task: T) => SubTaskCategory | undefined;
  getEstimatedTime: (task: T) => number;
  getAssignedTo?: (task: T) => string | null; // Équipe uniquement
}

export interface UseTaskFiltersResult<T> {
  // État
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: TeamSortOption;
  setSortBy: (sort: TeamSortOption) => void;
  priorityFilter: PriorityFilter;
  setPriorityFilter: (filter: PriorityFilter) => void;
  
  // Helpers
  hasActiveFilters: boolean;
  clearFilters: () => void;
  filterAndSortTasks: (tasks: T[]) => T[];
  filteredTasks: T[];
}

export function useTaskFilters<T>(
  options: UseTaskFiltersOptions<T>
): UseTaskFiltersResult<T> {
  const { tasks, getTaskName, getSubCategory, getEstimatedTime, getAssignedTo } = options;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TeamSortOption>('none');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  
  const hasActiveFilters = useMemo(() => 
    searchQuery.trim() !== '' || sortBy !== 'none' || priorityFilter !== 'all',
    [searchQuery, sortBy, priorityFilter]
  );
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSortBy('none');
    setPriorityFilter('all');
  }, []);
  
  const filterAndSortTasks = useCallback((inputTasks: T[]): T[] => {
    let filtered = [...inputTasks];
    
    // Recherche par nom
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        getTaskName(task).toLowerCase().includes(query)
      );
    }
    
    // Filtre par priorité
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'none') {
        filtered = filtered.filter(task => !getSubCategory(task));
      } else {
        filtered = filtered.filter(task => getSubCategory(task) === priorityFilter);
      }
    }
    
    // Tri
    if (sortBy !== 'none') {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'priority-high': {
            const getPriority = (task: T) => {
              const subCat = getSubCategory(task);
              if (!subCat) return 0;
              return SUB_CATEGORY_CONFIG[subCat]?.priority ?? 0;
            };
            const prioA = getPriority(a);
            const prioB = getPriority(b);
            if (prioB === prioA) return getTaskName(a).localeCompare(getTaskName(b));
            return prioB - prioA;
          }
          case 'priority-low': {
            const getPriority = (task: T) => {
              const subCat = getSubCategory(task);
              if (!subCat) return 0;
              return SUB_CATEGORY_CONFIG[subCat]?.priority ?? 0;
            };
            const prioA = getPriority(a);
            const prioB = getPriority(b);
            // Mettre les tâches sans priorité à la fin
            if (prioA === 0 && prioB !== 0) return 1;
            if (prioB === 0 && prioA !== 0) return -1;
            if (prioA === prioB) return getTaskName(a).localeCompare(getTaskName(b));
            return prioA - prioB;
          }
          case 'name':
            return getTaskName(a).localeCompare(getTaskName(b));
          case 'time':
            return getEstimatedTime(b) - getEstimatedTime(a);
          case 'assignee':
            if (!getAssignedTo) return 0;
            return (getAssignedTo(a) || 'zzz').localeCompare(getAssignedTo(b) || 'zzz');
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }, [searchQuery, sortBy, priorityFilter, getTaskName, getSubCategory, getEstimatedTime, getAssignedTo]);
  
  const filteredTasks = useMemo(() => 
    filterAndSortTasks(tasks),
    [tasks, filterAndSortTasks]
  );
  
  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priorityFilter,
    setPriorityFilter,
    hasActiveFilters,
    clearFilters,
    filterAndSortTasks,
    filteredTasks,
  };
}
