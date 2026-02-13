import { useMemo, useState } from 'react';
import { Task } from '@/types/task';
import { TaskFilters, defaultFilters } from '../SidebarSearchFilter';
import { SortConfig, defaultSortConfig, CATEGORY_SORT_ORDER } from '../SidebarSortSelector';

/**
 * Hook encapsulating sidebar filtering, searching, and sorting logic.
 * Extracted from AppSidebar for maintainability.
 */
export const useSidebarFilters = (
  activeTasks: Task[],
  pinnedTasks: string[],
  recurringTaskIds: string[]
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSortConfig);

  // Filtrage et recherche des tâches
  const filteredTasks = useMemo(() => {
    let result = activeTasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => task.name.toLowerCase().includes(query));
    }

    if (filters.categories.length > 0) {
      result = result.filter(task => filters.categories.includes(task.category));
    }

    if (filters.contexts.length > 0) {
      result = result.filter(task => filters.contexts.includes(task.context));
    }

    if (filters.showPinned) {
      result = result.filter(task => pinnedTasks.includes(task.id));
    }

    if (filters.showRecurring) {
      result = result.filter(task => recurringTaskIds.includes(task.id));
    }

    return result;
  }, [activeTasks, searchQuery, filters, pinnedTasks, recurringTaskIds]);

  // Tri des tâches
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => {
      const aPinned = pinnedTasks.includes(a.id);
      const bPinned = pinnedTasks.includes(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      let comparison = 0;
      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'fr');
          break;
        case 'category':
          const orderA = CATEGORY_SORT_ORDER[a.category] ?? 99;
          const orderB = CATEGORY_SORT_ORDER[b.category] ?? 99;
          comparison = orderA - orderB;
          break;
        case 'estimatedTime':
          comparison = a.estimatedTime - b.estimatedTime;
          break;
        case 'createdAt':
        default:
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredTasks, pinnedTasks, sortConfig]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    sortedTasks,
  };
};
