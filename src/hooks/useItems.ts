// ============= Unified Items Hook =============
// Central hook for managing all Items with localStorage persistence
// Provides CRUD operations, filtering, and context transformation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Item, ItemContextType, createItem, ItemMetadata } from '@/types/item';
import { CONTEXT_SCHEMAS, getMissingRequiredFields, getDefaultMetadata } from '@/config/contextSchemas';
import { 
  transformItemContext, 
  TransformationResult,
  ChildTransformation,
  applyChildTransformations
} from '@/services/contextTransformation';

// ============= Storage Keys =============
const ITEMS_STORAGE_KEY = 'lovable_items';

// ============= Storage Helpers =============
function loadItemsFromStorage(): Item[] {
  try {
    const stored = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      metadata: {
        ...item.metadata,
        targetDate: item.metadata.targetDate ? new Date(item.metadata.targetDate) : undefined,
        completedAt: item.metadata.completedAt ? new Date(item.metadata.completedAt) : undefined,
        challengeStartDate: item.metadata.challengeStartDate ? new Date(item.metadata.challengeStartDate) : undefined,
        challengeEndDate: item.metadata.challengeEndDate ? new Date(item.metadata.challengeEndDate) : undefined
      }
    }));
  } catch (error) {
    console.error('Error loading items from storage:', error);
    return [];
  }
}

function saveItemsToStorage(items: Item[]): void {
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving items to storage:', error);
  }
}

// ============= Hook Definition =============
export interface UseItemsOptions {
  userId?: string;
  contextTypes?: ItemContextType[];
  parentId?: string | null;
  includeCompleted?: boolean;
}

export interface UseItemsReturn {
  // State
  items: Item[];
  loading: boolean;
  error: string | null;
  
  // CRUD Operations
  createItem: (data: CreateItemData) => Item | { missingFields: (keyof ItemMetadata)[] };
  updateItem: (id: string, updates: Partial<Item>) => boolean;
  deleteItem: (id: string, deleteChildren?: boolean) => boolean;
  
  // Bulk Operations
  updateItems: (updates: { id: string; updates: Partial<Item> }[]) => boolean;
  deleteItems: (ids: string[]) => boolean;
  
  // Context Transformation
  transformContext: (
    id: string,
    newContextType: ItemContextType,
    additionalMetadata?: Partial<ItemMetadata>
  ) => TransformationResult;
  
  // Queries
  getItem: (id: string) => Item | undefined;
  getChildren: (parentId: string) => Item[];
  getByContext: (contextType: ItemContextType) => Item[];
  getRootItems: (contextType?: ItemContextType) => Item[];
  
  // Ordering
  reorderItems: (ids: string[], startIndex: number, endIndex: number) => void;
  
  // Completion
  toggleComplete: (id: string) => boolean;
  
  // Refresh
  reload: () => void;
}

export interface CreateItemData {
  name: string;
  contextType: ItemContextType;
  userId: string;
  parentId?: string | null;
  metadata?: Partial<ItemMetadata>;
  orderIndex?: number;
}

export function useItems(options: UseItemsOptions = {}): UseItemsReturn {
  const { userId, contextTypes, parentId, includeCompleted = true } = options;
  
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load items on mount
  useEffect(() => {
    setLoading(true);
    try {
      const loaded = loadItemsFromStorage();
      setAllItems(loaded);
      setError(null);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save items whenever they change
  useEffect(() => {
    if (!loading) {
      saveItemsToStorage(allItems);
    }
  }, [allItems, loading]);

  // Filtered items based on options
  const items = useMemo(() => {
    let filtered = allItems;
    
    if (userId) {
      filtered = filtered.filter(item => item.userId === userId);
    }
    
    if (contextTypes && contextTypes.length > 0) {
      filtered = filtered.filter(item => contextTypes.includes(item.contextType));
    }
    
    if (parentId !== undefined) {
      filtered = filtered.filter(item => item.parentId === parentId);
    }
    
    if (!includeCompleted) {
      filtered = filtered.filter(item => !item.isCompleted);
    }
    
    return filtered.sort((a, b) => a.orderIndex - b.orderIndex);
  }, [allItems, userId, contextTypes, parentId, includeCompleted]);

  // ============= CRUD Operations =============
  
  const handleCreateItem = useCallback((data: CreateItemData): Item | { missingFields: (keyof ItemMetadata)[] } => {
    const schema = CONTEXT_SCHEMAS[data.contextType];
    const defaultMeta = getDefaultMetadata(data.contextType);
    const mergedMetadata = { ...defaultMeta, ...data.metadata };
    
    // Check required fields
    const missingFields = getMissingRequiredFields(data.contextType, mergedMetadata);
    if (missingFields.length > 0) {
      return { missingFields };
    }
    
    const newItem = createItem({
      name: data.name,
      contextType: data.contextType,
      userId: data.userId,
      parentId: data.parentId ?? null,
      metadata: mergedMetadata,
      orderIndex: data.orderIndex ?? allItems.filter(i => 
        i.contextType === data.contextType && 
        i.parentId === (data.parentId ?? null)
      ).length
    });
    
    setAllItems(prev => [...prev, newItem]);
    return newItem;
  }, [allItems]);

  const handleUpdateItem = useCallback((id: string, updates: Partial<Item>): boolean => {
    let found = false;
    
    setAllItems(prev => prev.map(item => {
      if (item.id === id) {
        found = true;
        return {
          ...item,
          ...updates,
          metadata: updates.metadata 
            ? { ...item.metadata, ...updates.metadata }
            : item.metadata,
          updatedAt: new Date()
        };
      }
      return item;
    }));
    
    return found;
  }, []);

  const handleDeleteItem = useCallback((id: string, deleteChildren = true): boolean => {
    let found = false;
    
    setAllItems(prev => {
      const itemToDelete = prev.find(i => i.id === id);
      if (!itemToDelete) return prev;
      
      found = true;
      
      if (deleteChildren) {
        // Recursively find all children
        const idsToDelete = new Set<string>([id]);
        let changed = true;
        
        while (changed) {
          changed = false;
          for (const item of prev) {
            if (item.parentId && idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
              idsToDelete.add(item.id);
              changed = true;
            }
          }
        }
        
        return prev.filter(item => !idsToDelete.has(item.id));
      }
      
      return prev.filter(item => item.id !== id);
    });
    
    return found;
  }, []);

  // ============= Bulk Operations =============
  
  const handleUpdateItems = useCallback((updates: { id: string; updates: Partial<Item> }[]): boolean => {
    const updateMap = new Map(updates.map(u => [u.id, u.updates]));
    
    setAllItems(prev => prev.map(item => {
      const itemUpdates = updateMap.get(item.id);
      if (itemUpdates) {
        return {
          ...item,
          ...itemUpdates,
          metadata: itemUpdates.metadata 
            ? { ...item.metadata, ...itemUpdates.metadata }
            : item.metadata,
          updatedAt: new Date()
        };
      }
      return item;
    }));
    
    return true;
  }, []);

  const handleDeleteItems = useCallback((ids: string[]): boolean => {
    const idsSet = new Set(ids);
    setAllItems(prev => prev.filter(item => !idsSet.has(item.id)));
    return true;
  }, []);

  // ============= Context Transformation =============
  
  const handleTransformContext = useCallback((
    id: string,
    newContextType: ItemContextType,
    additionalMetadata?: Partial<ItemMetadata>
  ): TransformationResult => {
    const item = allItems.find(i => i.id === id);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    const children = allItems.filter(i => i.parentId === id);
    const result = transformItemContext(item, newContextType, additionalMetadata, children);
    
    if (result.success && result.item) {
      // Apply main item transformation
      handleUpdateItem(id, {
        contextType: result.item.contextType,
        metadata: result.item.metadata,
        parentId: result.item.parentId
      });
      
      // Apply children transformations
      if (result.childrenUpdates && result.childrenUpdates.length > 0) {
        const childResults = applyChildTransformations(children, result.childrenUpdates);
        
        for (const childResult of childResults) {
          if (childResult.success && childResult.item) {
            handleUpdateItem(childResult.item.id, {
              contextType: childResult.item.contextType,
              metadata: childResult.item.metadata,
              parentId: childResult.item.parentId
            });
          }
        }
      }
    }
    
    return result;
  }, [allItems, handleUpdateItem]);

  // ============= Queries =============
  
  const getItem = useCallback((id: string): Item | undefined => {
    return allItems.find(item => item.id === id);
  }, [allItems]);

  const getChildren = useCallback((parentId: string): Item[] => {
    return allItems
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [allItems]);

  const getByContext = useCallback((contextType: ItemContextType): Item[] => {
    return allItems
      .filter(item => item.contextType === contextType)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [allItems]);

  const getRootItems = useCallback((contextType?: ItemContextType): Item[] => {
    return allItems
      .filter(item => item.parentId === null && (!contextType || item.contextType === contextType))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [allItems]);

  // ============= Ordering =============
  
  const reorderItems = useCallback((ids: string[], startIndex: number, endIndex: number): void => {
    const reorderedIds = [...ids];
    const [removed] = reorderedIds.splice(startIndex, 1);
    reorderedIds.splice(endIndex, 0, removed);
    
    const updates = reorderedIds.map((id, index) => ({
      id,
      updates: { orderIndex: index }
    }));
    
    handleUpdateItems(updates);
  }, [handleUpdateItems]);

  // ============= Completion =============
  
  const toggleComplete = useCallback((id: string): boolean => {
    const item = allItems.find(i => i.id === id);
    if (!item) return false;
    
    return handleUpdateItem(id, {
      isCompleted: !item.isCompleted,
      metadata: {
        ...item.metadata,
        completedAt: !item.isCompleted ? new Date() : undefined
      }
    });
  }, [allItems, handleUpdateItem]);

  // ============= Refresh =============
  
  const reload = useCallback(() => {
    setLoading(true);
    const loaded = loadItemsFromStorage();
    setAllItems(loaded);
    setLoading(false);
  }, []);

  return {
    items,
    loading,
    error,
    createItem: handleCreateItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    updateItems: handleUpdateItems,
    deleteItems: handleDeleteItems,
    transformContext: handleTransformContext,
    getItem,
    getChildren,
    getByContext,
    getRootItems,
    reorderItems,
    toggleComplete,
    reload
  };
}

// ============= Specialized Hooks =============
// These wrap useItems with specific context filters for convenience

export function useTaskItems(userId: string) {
  return useItems({
    userId,
    contextTypes: ['task', 'subtask', 'project_task']
  });
}

export function useProjectItems(userId: string) {
  return useItems({
    userId,
    contextTypes: ['project']
  });
}

export function useHabitItems(userId: string) {
  return useItems({
    userId,
    contextTypes: ['habit']
  });
}

export function useDeckItems(userId: string) {
  return useItems({
    userId,
    contextTypes: ['deck']
  });
}
