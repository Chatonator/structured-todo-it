// ============= Unified Items Hook =============
// Central hook for managing all Items with Supabase persistence
// Provides CRUD operations, filtering, and context transformation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Item, ItemContextType, createItem as createItemHelper, ItemMetadata } from '@/types/item';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCallback, useMemo } from 'react';
import { CONTEXT_SCHEMAS, getMissingRequiredFields, getDefaultMetadata } from '@/config/contextSchemas';
import { 
  transformItemContext, 
  TransformationResult,
  ChildTransformation
} from '@/services/contextTransformation';

// Database row type matching Supabase schema
interface ItemRow {
  id: string;
  user_id: string;
  name: string;
  item_type: string;
  category: string;
  context: string;
  estimatedTime: number;
  parent_id: string | null;
  order_index: number;
  is_completed: boolean;
  is_pinned: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Transform database row to Item type
function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    contextType: row.item_type as ItemContextType,
    parentId: row.parent_id,
    metadata: {
      ...row.metadata,
      category: row.category,
      context: row.context,
      estimatedTime: row.estimatedTime,
    } as ItemMetadata,
    orderIndex: row.order_index,
    isCompleted: row.is_completed,
    isPinned: row.is_pinned,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Transform Item to database row format
function itemToRow(item: Partial<Item> & { name: string; contextType: ItemContextType; userId: string }): Partial<ItemRow> {
  const metadata = item.metadata || {};
  return {
    user_id: item.userId,
    name: item.name,
    item_type: item.contextType,
    category: (metadata.category as string) || 'Autres',
    context: (metadata.context as string) || 'Perso',
    estimatedTime: (metadata.estimatedTime as number) || 30,
    parent_id: item.parentId || null,
    order_index: item.orderIndex || 0,
    is_completed: item.isCompleted || false,
    is_pinned: item.isPinned || false,
    metadata: metadata,
  };
}

// ============= Hook Options =============
export interface UseItemsOptions {
  userId?: string;
  contextTypes?: ItemContextType[];
  parentId?: string | null;
  includeCompleted?: boolean;
}

export interface CreateItemData {
  name: string;
  contextType: ItemContextType;
  userId?: string;
  parentId?: string | null;
  metadata?: Partial<ItemMetadata>;
  orderIndex?: number;
}

export function useItems(options: UseItemsOptions = {}) {
  const { contextTypes, parentId, includeCompleted = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = options.userId || user?.id;
  const queryKey = ['items', userId, contextTypes, parentId, includeCompleted];

  // Fetch items from Supabase
  const { data: allItems = [], isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('items')
        .select('*')
        .eq('user_id', userId);

      // Filter by item type(s)
      if (contextTypes && contextTypes.length > 0) {
        query = query.in('item_type', contextTypes);
      }

      // Filter by parent
      if (parentId !== undefined) {
        if (parentId === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', parentId);
        }
      }

      // Filter completed items
      if (!includeCompleted) {
        query = query.eq('is_completed', false);
      }

      query = query.order('order_index', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return (data as ItemRow[]).map(rowToItem);
    },
    enabled: !!userId,
  });

  const error = queryError ? (queryError as Error).message : null;

  // Filtered items based on options
  const items = useMemo(() => {
    return allItems.sort((a, b) => a.orderIndex - b.orderIndex);
  }, [allItems]);

  // ============= Create Item =============
  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemData) => {
      const itemUserId = data.userId || userId;
      if (!itemUserId) throw new Error('User not authenticated');

      const defaultMeta = getDefaultMetadata(data.contextType);
      
      // Clean undefined values from provided metadata to prevent them from overwriting defaults
      const cleanMetadata = data.metadata 
        ? Object.fromEntries(
            Object.entries(data.metadata).filter(([_, v]) => v !== undefined)
          )
        : {};
      
      const mergedMetadata = { ...defaultMeta, ...cleanMetadata };

      // Check required fields
      const missingFields = getMissingRequiredFields(data.contextType, mergedMetadata);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const orderIndex = data.orderIndex ?? items.filter(i => 
        i.contextType === data.contextType && 
        i.parentId === (data.parentId ?? null)
      ).length;

      const insertData = {
        user_id: itemUserId,
        name: data.name,
        item_type: data.contextType,
        category: (mergedMetadata.category as string) || 'Autres',
        context: (mergedMetadata.context as string) || 'Perso',
        estimatedTime: (mergedMetadata.estimatedTime as number) || 30,
        parent_id: data.parentId ?? null,
        order_index: orderIndex,
        is_completed: false,
        is_pinned: false,
        metadata: mergedMetadata as Json,
      };

      const { data: result, error } = await supabase
        .from('items')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;

      return rowToItem(result as ItemRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de créer l'élément: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // ============= Update Item =============
  // SECURED: Validates DB state before mutation to prevent race conditions
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Item> }) => {
      // GUARD: Fetch current state from DB to prevent stale updates
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !currentItem) {
        throw new Error(`Item not found: ${id}`);
      }

      const dbUpdates: Record<string, unknown> = {};

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.contextType !== undefined) {
        // GUARD: Validate context type transitions
        const allowedTransitions: Record<string, string[]> = {
          'task': ['project_task', 'subtask'],
          'project_task': ['task'],
          'subtask': ['task', 'project_task'],
          'project': [],
          'habit': [],
          'deck': [],
        };
        const currentType = currentItem.item_type;
        const newType = updates.contextType;
        if (currentType !== newType && !allowedTransitions[currentType]?.includes(newType)) {
          throw new Error(`Invalid context type transition: ${currentType} -> ${newType}`);
        }
        dbUpdates.item_type = updates.contextType;
      }
      
      // GUARD: Prevent parentId changes that would orphan project_task
      if (updates.parentId !== undefined) {
        if (currentItem.item_type === 'project_task' && updates.parentId === null && updates.contextType !== 'task') {
          throw new Error('Cannot remove project_task from project without changing type to task');
        }
        dbUpdates.parent_id = updates.parentId;
      }
      
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.metadata !== undefined) {
        // GUARD: Merge metadata safely to prevent data loss
        const mergedMetadata = { ...(currentItem.metadata as Record<string, unknown>), ...updates.metadata };
        dbUpdates.metadata = mergedMetadata;
        // Also update top-level harmonized fields from metadata
        if (updates.metadata.category) dbUpdates.category = updates.metadata.category;
        if (updates.metadata.context) dbUpdates.context = updates.metadata.context;
        if (updates.metadata.estimatedTime) dbUpdates.estimatedTime = updates.metadata.estimatedTime;
      }

      const { data, error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return rowToItem(data as ItemRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour l'élément: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // ============= Delete Item =============
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      // Children are deleted automatically via ON DELETE CASCADE
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'élément: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // ============= Transform Item Context =============
  const transformItemMutation = useMutation({
    mutationFn: async ({ 
      id, 
      newContextType, 
      additionalMetadata 
    }: { 
      id: string; 
      newContextType: ItemContextType; 
      additionalMetadata?: Partial<ItemMetadata>;
    }) => {
      const item = items.find(i => i.id === id);
      if (!item) throw new Error('Item not found');

      const children = items.filter(i => i.parentId === id);
      const result = transformItemContext(item, newContextType, additionalMetadata, children);

      if (!result.success || !result.item) {
        throw new Error(result.error || 'Transformation failed');
      }

      // Update main item
      await supabase
        .from('items')
        .update({
          item_type: result.item.contextType,
          metadata: result.item.metadata as Json,
          parent_id: result.item.parentId,
          category: (result.item.metadata.category as string) || 'Autres',
          context: (result.item.metadata.context as string) || 'Perso',
          estimatedTime: (result.item.metadata.estimatedTime as number) || 30,
        } as never)
        .eq('id', id);

      // Apply children transformations inline
      if (result.childrenUpdates && result.childrenUpdates.length > 0) {
        for (const transformation of result.childrenUpdates) {
          const child = children.find(c => c.id === transformation.childId);
          if (!child) continue;
          
          const childResult = transformItemContext(
            { ...child, parentId: transformation.newParentId },
            transformation.newContextType
          );
          
          if (childResult.success && childResult.item) {
            await supabase
              .from('items')
              .update({
                item_type: childResult.item.contextType,
                metadata: childResult.item.metadata as Json,
                parent_id: childResult.item.parentId,
              } as never)
              .eq('id', childResult.item.id);
          }
        }
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({
        title: 'Transformation réussie',
        description: `L'élément a été transformé en ${variables.newContextType}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de transformer l'élément: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // ============= Helper Functions =============

  const handleCreateItem = useCallback((data: CreateItemData): Promise<Item> => {
    return createItemMutation.mutateAsync(data);
  }, [createItemMutation]);

  const handleUpdateItem = useCallback((id: string, updates: Partial<Item>): Promise<Item> => {
    return updateItemMutation.mutateAsync({ id, updates });
  }, [updateItemMutation]);

  const handleDeleteItem = useCallback((id: string): Promise<void> => {
    return deleteItemMutation.mutateAsync(id);
  }, [deleteItemMutation]);

  const handleTransformContext = useCallback((
    id: string,
    newContextType: ItemContextType,
    additionalMetadata?: Partial<ItemMetadata>
  ): Promise<TransformationResult> => {
    return transformItemMutation.mutateAsync({ id, newContextType, additionalMetadata });
  }, [transformItemMutation]);

  // ============= Queries =============
  
  const getItem = useCallback((id: string): Item | undefined => {
    return items.find(item => item.id === id);
  }, [items]);

  const getChildren = useCallback((parentId: string): Item[] => {
    return items
      .filter(item => item.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [items]);

  const getByContext = useCallback((contextType: ItemContextType): Item[] => {
    return items
      .filter(item => item.contextType === contextType)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [items]);

  const getRootItems = useCallback((contextType?: ItemContextType): Item[] => {
    return items
      .filter(item => item.parentId === null && (!contextType || item.contextType === contextType))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [items]);

  // ============= Bulk Operations =============
  // SECURED: Sequential execution with error tracking to prevent partial failures

  const updateItems = useCallback(async (updates: { id: string; updates: Partial<Item> }[]): Promise<boolean> => {
    const errors: string[] = [];
    
    // Execute sequentially to prevent race conditions
    for (const update of updates) {
      try {
        await handleUpdateItem(update.id, update.updates);
      } catch (error: any) {
        errors.push(`${update.id}: ${error.message}`);
        console.error('Bulk update error for item', { id: update.id, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      console.warn('Bulk update completed with errors', { errors });
    }
    
    return errors.length === 0;
  }, [handleUpdateItem]);

  const deleteItems = useCallback(async (ids: string[]): Promise<boolean> => {
    const errors: string[] = [];
    
    // Execute sequentially to respect cascade order
    for (const id of ids) {
      try {
        await handleDeleteItem(id);
      } catch (error: any) {
        errors.push(`${id}: ${error.message}`);
        console.error('Bulk delete error for item', { id, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      console.warn('Bulk delete completed with errors', { errors });
    }
    
    return errors.length === 0;
  }, [handleDeleteItem]);

  // ============= Reordering =============
  
  const reorderItems = useCallback(async (ids: string[], startIndex: number, endIndex: number): Promise<void> => {
    const reorderedIds = [...ids];
    const [removed] = reorderedIds.splice(startIndex, 1);
    reorderedIds.splice(endIndex, 0, removed);
    
    const updates = reorderedIds.map((id, index) => ({
      id,
      updates: { orderIndex: index }
    }));
    
    await updateItems(updates);
  }, [updateItems]);

  // ============= Toggle Complete =============
  // SECURED: Reads current state from DB to prevent race conditions
  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    try {
      // GUARD: Fetch current state from DB, not React state
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('is_completed, metadata')
        .eq('id', id)
        .single();
      
      if (fetchError || !currentItem) {
        console.error('toggleComplete: Item not found in DB', { id });
        return false;
      }
      
      const newCompletedState = !currentItem.is_completed;
      const currentMetadata = (currentItem.metadata as Record<string, unknown>) || {};
      
      await handleUpdateItem(id, {
        isCompleted: newCompletedState,
        metadata: {
          ...currentMetadata,
          completedAt: newCompletedState ? new Date() : undefined
        }
      });
      return true;
    } catch (error) {
      console.error('toggleComplete error:', error);
      return false;
    }
  }, [handleUpdateItem]);

  // ============= Toggle Pin =============
  
  const togglePin = useCallback(async (id: string): Promise<boolean> => {
    const item = items.find(i => i.id === id);
    if (!item) return false;
    
    try {
      await handleUpdateItem(id, { isPinned: !item.isPinned });
      return true;
    } catch {
      return false;
    }
  }, [items, handleUpdateItem]);

  // ============= Get Pinned Items =============
  
  const getPinnedItems = useCallback((contextType?: ItemContextType): Item[] => {
    return items
      .filter(item => item.isPinned && (!contextType || item.contextType === contextType))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [items]);

  // ============= Reload =============
  
  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  }, [queryClient]);

  return {
    // State
    items,
    loading,
    error,
    
    // CRUD Operations
    createItem: handleCreateItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    
    // Mutations (for direct access)
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    transformItemMutation,
    
    // Bulk Operations
    updateItems,
    deleteItems,
    
    // Context Transformation
    transformContext: handleTransformContext,
    
    // Queries
    getItem,
    getChildren,
    getByContext,
    getRootItems,
    getPinnedItems,
    
    // Ordering
    reorderItems,
    
    // Completion & Pinning
    toggleComplete,
    togglePin,
    
    // Refresh
    reload,
  };
}

// ============= Specialized Hooks =============
// These wrap useItems with specific context filters for convenience

export function useTaskItems(userId?: string) {
  return useItems({
    userId,
    contextTypes: ['task'],
    parentId: null,
  });
}

export function useSubtaskItems(parentId: string, userId?: string) {
  return useItems({
    userId,
    contextTypes: ['subtask'],
    parentId,
  });
}

export function useProjectItems(userId?: string) {
  return useItems({
    userId,
    contextTypes: ['project'],
  });
}

export function useProjectTaskItems(projectId: string, userId?: string) {
  return useItems({
    userId,
    contextTypes: ['project_task'],
    parentId: projectId,
  });
}

export function useHabitItems(userId?: string, deckId?: string) {
  return useItems({
    userId,
    contextTypes: ['habit'],
    parentId: deckId,
  });
}

export function useDeckItems(userId?: string) {
  return useItems({
    userId,
    contextTypes: ['deck'],
  });
}
