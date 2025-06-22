
import { renderHook, act } from '@testing-library/react';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { Task, TaskCategory, TaskContext } from '@/types/task';

// Mock des tâches de test
const mockTasks: Task[] = [
  {
    id: '1',
    name: 'Tâche test 1',
    category: 'Obligation' as TaskCategory,
    context: 'Pro' as TaskContext,
    estimatedTime: 60,
    createdAt: new Date(),
    level: 0,
    isExpanded: true,
    isCompleted: false
  },
  {
    id: '2',
    name: 'Tâche test 2',
    category: 'Envie' as TaskCategory,
    context: 'Perso' as TaskContext,
    estimatedTime: 30,
    createdAt: new Date(),
    level: 0,
    isExpanded: true,
    isCompleted: true
  }
];

describe('useTaskFilters', () => {
  it('should filter tasks by search query', () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks));
    
    act(() => {
      result.current.setSearchQuery('test 1');
    });
    
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].name).toBe('Tâche test 1');
  });

  it('should filter tasks by category', () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks));
    
    act(() => {
      result.current.setCategoryFilter('Obligation');
    });
    
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].category).toBe('Obligation');
  });

  it('should filter tasks by status', () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks));
    
    act(() => {
      result.current.setStatusFilter('completed');
    });
    
    expect(result.current.filteredTasks).toHaveLength(1);
    expect(result.current.filteredTasks[0].isCompleted).toBe(true);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useTaskFilters(mockTasks));
    
    act(() => {
      result.current.setSearchQuery('test');
      result.current.setCategoryFilter('Obligation');
      result.current.setStatusFilter('completed');
    });
    
    act(() => {
      result.current.clearFilters();
    });
    
    expect(result.current.searchQuery).toBe('');
    expect(result.current.categoryFilter).toBe('all');
    expect(result.current.statusFilter).toBe('all');
  });
});
