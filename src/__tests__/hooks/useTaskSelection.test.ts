
import { renderHook, act } from '@testing-library/react';
import { useTaskSelection } from '@/hooks/useTaskSelection';

describe('useTaskSelection', () => {
  it('should toggle task selection', () => {
    const { result } = renderHook(() => useTaskSelection());
    
    act(() => {
      result.current.toggleSelection('task1');
    });
    
    expect(result.current.selectedTasks).toContain('task1');
    expect(result.current.isSelected('task1')).toBe(true);
    
    act(() => {
      result.current.toggleSelection('task1');
    });
    
    expect(result.current.selectedTasks).not.toContain('task1');
    expect(result.current.isSelected('task1')).toBe(false);
  });

  it('should select all tasks', () => {
    const { result } = renderHook(() => useTaskSelection());
    const taskIds = ['task1', 'task2', 'task3'];
    
    act(() => {
      result.current.selectAll(taskIds);
    });
    
    expect(result.current.selectedTasks).toEqual(taskIds);
    expect(result.current.selectionCount).toBe(3);
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useTaskSelection());
    
    act(() => {
      result.current.toggleSelection('task1');
      result.current.toggleSelection('task2');
    });
    
    expect(result.current.hasSelection).toBe(true);
    
    act(() => {
      result.current.clearSelection();
    });
    
    expect(result.current.selectedTasks).toHaveLength(0);
    expect(result.current.hasSelection).toBe(false);
  });
});
