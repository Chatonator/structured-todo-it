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
  applyChildTransformations
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
      const mergedMetadata = { ...defaultMeta, ...data.metadata };

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
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Item> }) => {
      const dbUpdates: Record<string, unknown> = {};

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.contextType !== undefined) dbUpdates.item_type = updates.contextType;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.metadata !== undefined) {
        dbUpdates.metadata = updates.metadata;
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

      // Apply children transformations
      if (result.childrenUpdates && result.childrenUpdates.length > 0) {
        const childResults = applyChildTransformations(children, result.childrenUpdates);
        
        for (const childResult of childResults) {
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

  const updateItems = useCallback(async (updates: { id: string; updates: Partial<Item> }[]): Promise<boolean> => {
    try {
      await Promise.all(updates.map(u => handleUpdateItem(u.id, u.updates)));
      return true;
    } catch {
      return false;
    }
  }, [handleUpdateItem]);

  const deleteItems = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      await Promise.all(ids.map(id => handleDeleteItem(id)));
      return true;
    } catch {
      return false;
    }
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
  
  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    const item = items.find(i => i.id === id);
    if (!item) return false;
    
    try {
      await handleUpdateItem(id, {
        isCompleted: !item.isCompleted,
        metadata: {
          ...item.metadata,
          completedAt: !item.isCompleted ? new Date() : undefined
        }
      });
      return true;
    } catch {
      return false;
    }
  }, [items, handleUpdateItem]);

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
    
    // Ordering
    reorderItems,
    
    // Completion
    toggleComplete,
    
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
