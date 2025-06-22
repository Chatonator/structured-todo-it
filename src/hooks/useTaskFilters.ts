
import { useState, useMemo } from 'react';
import { Task, TaskCategory } from '@/types/task';

/**
 * Hook personnalisé pour gérer les filtres des tâches
 * Centralise la logique de filtrage pour éviter les duplications
 */
export const useTaskFilters = (tasks: Task[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Filtrage mémorisé pour éviter les recalculs inutiles
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && task.isCompleted) ||
        (statusFilter === 'pending' && !task.isCompleted);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchQuery, categoryFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  return {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    filteredTasks,
    clearFilters,
    hasActiveFilters: searchQuery !== '' || categoryFilter !== 'all' || statusFilter !== 'all'
  };
};
