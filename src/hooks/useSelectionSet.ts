import { useCallback, useState } from 'react';

export function useSelectionSet<T>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const replaceAll = useCallback((ids: Iterable<T>) => {
    setSelectedIds(new Set(ids));
  }, []);

  const toggleAll = useCallback((ids: T[]) => {
    setSelectedIds(previous => {
      if (ids.length > 0 && previous.size === ids.length && ids.every(id => previous.has(id))) {
        return new Set();
      }
      return new Set(ids);
    });
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    toggle,
    clear,
    replaceAll,
    toggleAll,
  };
}
